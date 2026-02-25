"""
AI-based image authenticity detector.

Loads the trained Keras neural network (ela_fft_detector_extra_features.keras)
and its paired StandardScaler (scaler_extra_features.pkl) to classify an image
as REAL or AI-GENERATED/TAMPERED.

The 12-feature vector matches the training code exactly:
  [ela_mean, ela_std, ela_skew, ela_kurt, ela_median, ela_entropy,
   fft_mean, fft_std, fft_skew, fft_kurt, fft_energy, fft_max]

Model files must be placed at:
  backend/models/ela_fft_detector_extra_features.keras
  backend/models/scaler_extra_features.pkl
"""

from __future__ import annotations

import os
import tempfile
import logging
from pathlib import Path
from typing import Any

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── Lazy singletons ─────────────────────────────────────────────────────────
_model: Any = None
_scaler: Any = None

# Threshold from training
_THRESHOLD: float = 0.48


def _load_artifacts() -> tuple[Any, Any]:
    """Load model and scaler on first call; return cached pair thereafter."""
    global _model, _scaler

    if _model is not None and _scaler is not None:
        return _model, _scaler

    from app.core.config import settings

    model_path = settings.MODELS_DIR / "ela_fft_detector_extra_features.keras"
    scaler_path = settings.MODELS_DIR / "scaler_extra_features.pkl"

    if not model_path.exists() or not scaler_path.exists():
        raise FileNotFoundError(
            f"Model files not found. Expected:\n"
            f"  {model_path}\n"
            f"  {scaler_path}\n"
            "Place both files in the 'models/' directory of the backend."
        )

    # Import heavy deps only when files are present
    import joblib
    from tensorflow.keras.models import load_model  # type: ignore

    logger.info("Loading AI detector model from %s", model_path)
    _model = load_model(str(model_path))
    _scaler = joblib.load(str(scaler_path))
    logger.info("AI detector model loaded successfully.")
    return _model, _scaler


# ── ELA feature extractor (matches training code exactly) ───────────────────

def _extract_ela(image_path: str, quality: int = 90) -> np.ndarray:
    """
    Extract ELA array using PIL ImageChops + ImageEnhance.Brightness.
    Matches the training `extract_ela()` function exactly.
    """
    from PIL import Image, ImageChops, ImageEnhance

    tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    tmp_path = tmp.name
    tmp.close()

    try:
        image = Image.open(image_path).convert("RGB")
        image.save(tmp_path, "JPEG", quality=quality)
        compressed = Image.open(tmp_path).copy()  # .copy() forces full decode on Windows
    finally:
        os.remove(tmp_path)

    ela_image = ImageChops.difference(image, compressed)

    extrema = ela_image.getextrema()
    max_diff = max(ex[1] for ex in extrema)
    scale = 255.0 / max_diff if max_diff != 0 else 1.0

    ela_image = ImageEnhance.Brightness(ela_image).enhance(scale)
    return np.array(ela_image)   # RGB uint8, shape (H, W, 3)


# ── Full 12-feature extractor (matches training code exactly) ────────────────

def extract_features(image_path: str) -> list[float] | None:
    """
    Extract the 12-dimensional feature vector used during training.

    Returns None on any error so the caller can gracefully degrade.
    """
    from scipy.stats import skew, kurtosis, entropy  # type: ignore

    try:
        # ── ELA features ────────────────────────────────────────────
        ela = _extract_ela(image_path, quality=90)

        ela_gray = cv2.cvtColor(ela, cv2.COLOR_RGB2GRAY)
        ela_gray = cv2.GaussianBlur(ela_gray, (3, 3), 0)

        flat_ela = ela_gray.flatten()
        hist, _ = np.histogram(flat_ela, bins=256, range=(0, 255))

        ela_mean    = float(np.mean(ela_gray))
        ela_std     = float(np.std(ela_gray))
        ela_skew    = float(skew(flat_ela))
        ela_kurt    = float(kurtosis(flat_ela))
        ela_median  = float(np.median(ela_gray))
        ela_entropy = float(entropy(hist.astype(float) + 1e-10))

        # ── FFT features ─────────────────────────────────────────────
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return None

        img = cv2.resize(img, (128, 128))

        fft_shift = np.fft.fftshift(np.fft.fft2(img))
        magnitude = np.log(np.abs(fft_shift) + 1)   # log(x+1) == log1p(x)

        flat_fft = magnitude.flatten()

        fft_mean   = float(np.mean(magnitude))
        fft_std    = float(np.std(magnitude))
        fft_skew   = float(skew(flat_fft))
        fft_kurt   = float(kurtosis(flat_fft))
        fft_energy = float(np.sum(magnitude ** 2) / magnitude.size)
        fft_max    = float(np.max(magnitude))

        return [
            ela_mean, ela_std, ela_skew, ela_kurt, ela_median, ela_entropy,
            fft_mean, fft_std, fft_skew, fft_kurt, fft_energy, fft_max,
        ]

    except Exception:
        logger.exception("Feature extraction failed for %s", image_path)
        return None


# ── Public inference entry point ─────────────────────────────────────────────

def run_ai_detector(image_path: str) -> dict:
    """
    Run the trained AI detector on an image.

    Returns:
        dict with keys:
            score      – float [0, 1], higher = more likely AI/tampered
            confidence – raw sigmoid output from the model
            ai_label   – "AI_GENERATED" | "REAL"
            error      – present only if something failed
    """
    try:
        model, scaler = _load_artifacts()
    except FileNotFoundError as exc:
        logger.warning("AI detector skipped: %s", exc)
        return {
            "score": 0.0,
            "confidence": None,
            "ai_label": "UNAVAILABLE",
            "error": str(exc),
        }
    except Exception as exc:
        logger.exception("Failed to load AI detector artifacts")
        return {
            "score": 0.0,
            "confidence": None,
            "ai_label": "UNAVAILABLE",
            "error": str(exc),
        }

    features = extract_features(image_path)
    if features is None:
        return {
            "score": 0.0,
            "confidence": None,
            "ai_label": "UNAVAILABLE",
            "error": "Feature extraction failed",
        }

    features_scaled = scaler.transform([features])
    confidence = float(model.predict(features_scaled, verbose=0)[0][0])

    # Align with training threshold: > 0.48 → AI/FAKE
    ai_label = "AI_GENERATED" if confidence > _THRESHOLD else "REAL"

    # confidence IS already in [0,1]; use it directly as signal score
    return {
        "score": round(confidence, 4),
        "confidence": round(confidence, 4),
        "ai_label": ai_label,
        "threshold_used": _THRESHOLD,
    }
