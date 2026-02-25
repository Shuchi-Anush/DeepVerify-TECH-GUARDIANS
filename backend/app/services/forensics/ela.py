"""
Error Level Analysis (ELA) module.

Re-compresses the image at a known JPEG quality level and measures
pixel-wise differences using PIL's ImageChops.difference().
Manipulated regions typically show higher error levels than untouched
areas because they were saved at a different compression history.

Algorithm validated against DeepVerify forensic notebook.
"""

import os
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageChops

from app.core.config import settings


def run_ela(
    file_path: str,
    output_dir: str,
    quality: int | None = None,
    amplification: int | None = None,
) -> dict:
    """
    Run Error Level Analysis on an image.

    Uses PIL.ImageChops.difference() for the diff (standard ELA approach),
    normalises by the per-image maximum difference, then amplifies the
    forensic signal.  Score is the mean intensity of the resulting
    grayscale map — already in [0, 1] after normalisation.

    Args:
        file_path:     Path to the input image.
        output_dir:    Directory where the ELA heatmap artifact is saved.
        quality:       JPEG re-compression quality (default from settings).
        amplification: Signal amplification factor (default from settings).

    Returns:
        dict with keys: score, heatmap_path, quality_used, error (if any).
    """
    quality = quality or settings.ELA_QUALITY
    amplification = amplification or settings.ELA_SCALE

    try:
        original = Image.open(file_path).convert("RGB")
    except Exception as exc:
        return {"score": 0.0, "error": f"Could not open image: {exc}", "heatmap_path": None}

    try:
        # ── Step 1: Re-save at the target JPEG quality ──
        tmp_fd, tmp_path = tempfile.mkstemp(suffix=".jpg")
        os.close(tmp_fd)
        try:
            original.save(tmp_path, "JPEG", quality=quality)
            # Call .copy() to force PIL to fully decode pixels into memory
            # before the temp file is removed (important on Windows).
            resaved = Image.open(tmp_path).convert("RGB").copy()
        finally:
            os.unlink(tmp_path)

        # ── Step 2: Pixel-wise difference via PIL (standard ELA) ──
        ela_diff = ImageChops.difference(original, resaved)

        # ── Step 3: Normalise by per-image maximum difference ──
        ela_array = np.array(ela_diff).astype(np.float32)
        max_diff = np.max(ela_array)
        if max_diff == 0:
            max_diff = 1.0
        ela_norm = ela_array / max_diff

        # ── Step 4: Amplify forensic signal ──
        ela_norm = np.clip(ela_norm * amplification, 0.0, 1.0)

        # ── Step 5: Collapse to grayscale (intensity-based) ──
        ela_gray = np.mean(ela_norm, axis=2)   # shape: (H, W), values in [0, 1]

        # ── Step 6: Score = mean intensity of normalised map ──
        score = round(float(np.mean(ela_gray)), 4)

        # ── Step 7: Save heatmap artifact (false-colour for review) ──
        gray_uint8 = (ela_gray * 255).astype(np.uint8)
        heatmap = cv2.applyColorMap(gray_uint8, cv2.COLORMAP_JET)
        heatmap_path = str(Path(output_dir) / "ela_heatmap.png")
        cv2.imwrite(heatmap_path, heatmap)

        return {
            "score": score,
            "heatmap_path": heatmap_path,
            "quality_used": quality,
            "amplification_used": amplification,
        }

    except Exception as exc:
        return {"score": 0.0, "error": str(exc), "heatmap_path": None}
