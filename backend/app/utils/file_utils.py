"""
File-handling utilities: SHA-256 hashing, safe-save, path helpers.
"""

import hashlib
import uuid
from pathlib import Path

from app.core.config import settings


def compute_sha256(data: bytes) -> str:
    """Return the hex-encoded SHA-256 digest of *data*."""
    return hashlib.sha256(data).hexdigest()


def save_upload(content: bytes, original_filename: str) -> Path:
    """
    Persist uploaded bytes to disk with a UUID-based safe filename.

    Returns:
        Absolute Path to the saved file.
    """
    ext = Path(original_filename).suffix.lower() if original_filename else ".bin"
    safe_name = f"{uuid.uuid4().hex}{ext}"
    dest = settings.UPLOAD_DIR / safe_name
    dest.write_bytes(content)
    return dest
