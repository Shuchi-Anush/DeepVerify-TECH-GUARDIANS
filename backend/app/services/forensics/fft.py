"""
Fast Fourier Transform (FFT) analysis module.

Computes the 2-D frequency spectrum of the image and measures
high-frequency energy.  Copy-paste, content-aware fill, and resizing
artifacts introduced during tampering leave elevated high-frequency
residuals that are suppressed in unmanipulated photographs.

Algorithm validated against DeepVerify forensic notebook.
"""

from pathlib import Path

import cv2
import numpy as np

# Values of log1p-scaled FFT magnitude means observed empirically:
#   Real, uncompressed photos  →  ~3 – 6
#   Tampered / synthetic imgs  →  ~7 – 12+
# We cap at this value when normalising hf_energy to [0, 1].
_HF_ENERGY_NORM_CAP = 12.0


def run_fft(file_path: str, output_dir: str) -> dict:
    """
    Run FFT high-frequency energy analysis on an image.

    Uses a fixed 60×60 centre mask (identical to the forensic notebook)
    to isolate low-frequency DC components.  The mean log-magnitude of
    the remaining high-frequency components is the raw forensic signal;
    it is normalised to [0, 1] for the scoring layer.

    Args:
        file_path:  Path to the input image.
        output_dir: Directory where the spectrum artifact is saved.

    Returns:
        dict with keys: score, hf_energy, spectrum_path, error (if any).
    """
    try:
        img = cv2.imread(file_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return {
                "score": 0.0,
                "error": "Could not decode image",
                "spectrum_path": None,
                "hf_energy": None,
            }

        # ── Step 1: 2-D FFT → shift DC to centre ──
        f_transform = np.fft.fft2(img.astype(np.float32))
        f_shift = np.fft.fftshift(f_transform)

        # ── Step 2: log1p magnitude (safe log — avoids log(0)) ──
        magnitude = np.log1p(np.abs(f_shift))   # shape: (H, W), float64

        # ── Step 3: Fixed centre mask — suppress DC / low-freq block ──
        rows, cols = img.shape
        crow, ccol = rows // 2, cols // 2
        mask = np.ones((rows, cols), dtype=np.float32)
        # Block the centre 60×60 pixels (±30 from centre)
        r = 30
        mask[
            max(0, crow - r): min(rows, crow + r),
            max(0, ccol - r): min(cols, ccol + r),
        ] = 0

        # ── Step 4: High-frequency energy = mean of masked magnitude ──
        hf_energy = float(np.mean(magnitude * mask))

        # ── Step 5: Normalise to [0, 1] for risk-scoring layer ──
        score = round(min(1.0, hf_energy / _HF_ENERGY_NORM_CAP), 4)

        # ── Step 6: Save grayscale spectrum artefact ──
        mag_vis = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX)
        mag_vis = mag_vis.astype(np.uint8)
        spectrum_path = str(Path(output_dir) / "fft_spectrum.png")
        cv2.imwrite(spectrum_path, mag_vis)

        return {
            "score": score,
            "hf_energy": round(hf_energy, 4),
            "spectrum_path": spectrum_path,
        }

    except Exception as exc:
        return {
            "score": 0.0,
            "error": str(exc),
            "spectrum_path": None,
            "hf_energy": None,
        }
