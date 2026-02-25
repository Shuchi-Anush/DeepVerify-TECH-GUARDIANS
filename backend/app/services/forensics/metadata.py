"""
Metadata / EXIF analysis module.

Extracts EXIF data and flags indicators of prior editing:
  - Known editing-software tags
  - Stripped metadata (suggests intentional cleanup)
  - Date / time inconsistencies between original and modified stamps
"""

from PIL import Image
from PIL.ExifTags import TAGS

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
]


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
    except Exception as exc:
        return {"score": 0.0, "error": str(exc), "flags": [], "exif": {}}

    exif_dict: dict[str, str] = {}
    raw_exif = None

    try:
        raw_exif = img._getexif()  # type: ignore[attr-defined]
        if raw_exif:
            for tag_id, value in raw_exif.items():
                tag_name = TAGS.get(tag_id, str(tag_id))
                # Convert non-string values for JSON serialisation
                exif_dict[tag_name] = str(value)
    except Exception:
        raw_exif = None

    suspicion = 0.0
    flags: list[str] = []

    # ── Check 1: Editing software ──
    software = exif_dict.get("Software", "")
    for keyword in _SUSPICIOUS_SOFTWARE:
        if keyword in software.lower():
            suspicion += 0.4
            flags.append(f"Editing software detected: {software}")
            break

    # ── Check 2: Missing EXIF (common after metadata stripping) ──
    if raw_exif is None or len(exif_dict) == 0:
        suspicion += 0.2
        flags.append("No EXIF data found — metadata may have been stripped")

    # ── Check 3: Date / time mismatch ──
    date_original = exif_dict.get("DateTimeOriginal")
    date_modified = exif_dict.get("DateTime")
    if date_original and date_modified and date_original != date_modified:
        suspicion += 0.3
        flags.append(
            f"Date mismatch: original={date_original}, modified={date_modified}"
        )

    # ── Check 4: Thumbnail present alongside other flags ──
    if ("JPEGThumbnail" in exif_dict or "ThumbnailImage" in exif_dict) and flags:
        suspicion += 0.1
        flags.append(
            "Embedded thumbnail present alongside other suspicious indicators"
        )

    score = round(min(1.0, suspicion), 4)

    return {
        "score": score,
        "flags": flags,
        "exif": exif_dict,
    }
