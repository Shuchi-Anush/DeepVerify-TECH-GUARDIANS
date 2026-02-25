"""
Forensic analysis orchestrator.

Calls each independent forensic module, collects their signals,
and converts artifact paths to URL-relative paths for the API response.
"""

from pathlib import Path

from app.core.config import settings
from app.services.forensics.ela import run_ela
from app.services.forensics.fft import run_fft
from app.services.forensics.metadata import run_metadata


def _to_artifact_url(abs_path: str | None, artifact_root: Path) -> str | None:
    """Convert an absolute filesystem path to a URL-relative path."""
    if abs_path is None:
        return None
    try:
        rel = Path(abs_path).relative_to(artifact_root)
        return f"/artifacts/{rel.as_posix()}"
    except ValueError:
        return abs_path  # fallback


def run_analysis(file_path: str, file_hash: str) -> dict:
    """
    Orchestrate all forensic modules for a given file.

    Args:
        file_path: Absolute path to the saved image on disk.
        file_hash: SHA-256 hex digest (used to namespace artifact output).

    Returns:
        dict mapping signal name → signal result dict.
    """
    # Each file hash gets its own artifact sub-directory
    output_dir = settings.ARTIFACTS_DIR / file_hash
    output_dir.mkdir(parents=True, exist_ok=True)
    output_str = str(output_dir)

    signals: dict = {}

    # ── Error Level Analysis ──
    ela_result = run_ela(file_path, output_str)
    ela_result["heatmap_path"] = _to_artifact_url(
        ela_result.get("heatmap_path"), settings.ARTIFACTS_DIR
    )
    signals["ela"] = ela_result

    # ── FFT Spectrum Analysis ──
    fft_result = run_fft(file_path, output_str)
    fft_result["spectrum_path"] = _to_artifact_url(
        fft_result.get("spectrum_path"), settings.ARTIFACTS_DIR
    )
    signals["fft"] = fft_result

    # ── Metadata / EXIF Analysis ──
    signals["metadata"] = run_metadata(file_path)

    return signals
