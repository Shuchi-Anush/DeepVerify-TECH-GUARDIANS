"""
Metadata / EXIF analysis module.

Extracts EXIF data and flags indicators of prior editing:
  - Known editing-software tags
  - Stripped metadata (suggests intentional cleanup)
  - Date / time inconsistencies between original and modified stamps
  - GPS data present in unusual contexts
  - PNG text-chunk metadata

Fixes vs original:
  - Uses public img.getexif() API (replaces deprecated _getexif())
  - Reads ExifIFD sub-IFD so DateTimeOriginal is actually found
  - Handles TIFF tag_v2 metadata
  - Reads PNG img.info text chunks
  - Sanitises all values to JSON-safe strings
"""

from PIL import Image
from PIL.ExifTags import TAGS, IFD

# Editing software commonly seen in tampered images
_SUSPICIOUS_SOFTWARE = [
    "adobe photoshop",
    "gimp",
    "affinity photo",
    "paint.net",
    "pixelmator",
    "corel",
    "photopea",
    "fotor",
    "snapseed",
    "lightroom",
    "luminar",
]


def _safe_str(value) -> str:
    """Convert any EXIF value to a clean JSON-safe string."""
    if isinstance(value, bytes):
        try:
            return value.decode("utf-8", errors="replace").strip("\x00")
        except Exception:
            return value.hex()
    if isinstance(value, tuple):
        return ", ".join(_safe_str(v) for v in value)
    return str(value)


def _read_exif(img: Image.Image) -> dict[str, str]:
    """
    Extract a flat tag-name → string-value dict from any PIL image.

    Strategy (in order):
      1. img.getexif()         – public API, works for JPEG / TIFF / WebP
      2. ExifIFD sub-IFD       – where DateTimeOriginal / SubSecTime live
      3. img.tag_v2            – TIFF-specific tag store
      4. img.info text chunks  – PNG / GIF text metadata
    """
    result: dict[str, str] = {}

    # ── 1. Primary EXIF (IFD0) ──────────────────────────────────────────────
    try:
        exif = img.getexif()
        for tag_id, value in exif.items():
            name = TAGS.get(tag_id, str(tag_id))
            result[name] = _safe_str(value)
    except Exception:
        pass

    # ── 2. ExifIFD sub-IFD (DateTimeOriginal, ShutterSpeed, etc.) ────────────
    try:
        exif = img.getexif()
        exif_ifd = exif.get_ifd(IFD.Exif)
        for tag_id, value in exif_ifd.items():
            name = TAGS.get(tag_id, str(tag_id))
            if name not in result:
                result[name] = _safe_str(value)
    except Exception:
        pass

    # ── 3. TIFF tag_v2 (fallback for bare TIFF files) ───────────────────────
    if not result:
        try:
            for tag_id, value in img.tag_v2.items():  # type: ignore[attr-defined]
                name = TAGS.get(tag_id, str(tag_id))
                result[name] = _safe_str(value)
        except AttributeError:
            pass

    # ── 4. PNG / GIF info text chunks ─────────────────────────────────────────
    if hasattr(img, "info") and isinstance(img.info, dict):
        for key, value in img.info.items():
            str_key = str(key)
            if str_key not in result:
                result[str_key] = _safe_str(value)

    return result


def run_metadata(file_path: str) -> dict:
    """
    Analyse image metadata for signs of manipulation.

    Args:
        file_path: Path to the image file.

    Returns:
        dict with keys: score, flags, exif, error (if any).
    """
    try:
        img = Image.open(file_path)
        img_format = img.format or "UNKNOWN"
    except Exception as exc:
        return {"score": 0.0, "error": str(exc), "flags": [], "exif": {}}

    exif_dict = _read_exif(img)
    suspicion = 0.0
    flags: list[str] = []

    # ── Check 1: Editing software ────────────────────────────────────────────
    software = exif_dict.get("Software", "")
    for keyword in _SUSPICIOUS_SOFTWARE:
        if keyword in software.lower():
            suspicion += 0.4
            flags.append(f"Editing software detected: {software}")
            break

    # ── Check 2: Missing metadata ────────────────────────────────────────────
    # Only meaningful for JPEG/TIFF; PNG images legitimately lack EXIF.
    meaningful_keys = {k for k in exif_dict if k not in ("icc_profile", "dpi", "aspect")}
    if img_format in ("JPEG", "TIFF") and not meaningful_keys:
        suspicion += 0.2
        flags.append("No EXIF data found — metadata may have been stripped")

    # ── Check 3: Date / time mismatch ───────────────────────────────────────
    # DateTimeOriginal lives in the ExifIFD sub-IFD, now correctly extracted.
    date_original = exif_dict.get("DateTimeOriginal")
    date_modified = exif_dict.get("DateTime")
    if date_original and date_modified and date_original != date_modified:
        suspicion += 0.3
        flags.append(
            f"Date mismatch: original={date_original}, modified={date_modified}"
        )

    # ── Check 4: Embedded thumbnail alongside other flags ───────────────────
    has_thumb = any(k in exif_dict for k in ("JPEGThumbnail", "ThumbnailImage", "ThumbnailOffset"))
    if has_thumb and flags:
        suspicion += 0.1
        flags.append("Embedded thumbnail present alongside other suspicious indicators")

    # ── Check 5: GPS data present (unusual for screenshots / AI images) ──────
    gps_info = exif_dict.get("GPSInfo")
    if gps_info and gps_info not in ("None", "{}"):
        flags.append("GPS location data embedded in image")
        # Not scored as suspicious on its own — just informational

    # ── Check 6: XMP / processing software markers in PNG info ──────────────
    xmp_keys = {"xml:com.adobe.xmp", "XML:com.adobe.xmp", "xmp"}
    if xmp_keys & set(exif_dict.keys()):
        suspicion += 0.2
        flags.append("XMP metadata block detected (Adobe post-processing marker)")

    score = round(min(1.0, suspicion), 4)

    return {
        "score": score,
        "flags": flags,
        "exif": exif_dict,
        "format": img_format,
    }

