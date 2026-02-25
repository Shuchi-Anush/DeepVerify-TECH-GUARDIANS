"""
Upload validation: magic-byte check, extension check, and size check.
"""

from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import settings

# Magic-byte signatures for supported image formats
MAGIC_SIGNATURES: dict[bytes, str] = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"II*\x00": "image/tiff",
    b"MM\x00*": "image/tiff",
}


async def validate_upload(file: UploadFile) -> bytes:
    """
    Validate an uploaded file for extension, magic bytes, and size.

    Returns:
        The raw file-content bytes on success.

    Raises:
        HTTPException on any validation failure.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    # 1. Extension check
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file extension '{ext}'. "
                f"Allowed: {sorted(settings.ALLOWED_EXTENSIONS)}"
            ),
        )

    # 2. Read content
    content = await file.read()

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # 3. Size check
    if len(content) > settings.MAX_FILE_SIZE:
        max_mb = settings.MAX_FILE_SIZE // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {max_mb} MB.",
        )

    # 4. Magic-byte check
    detected_mime = None
    for signature, mime in MAGIC_SIGNATURES.items():
        if content[: len(signature)] == signature:
            detected_mime = mime
            break

    if detected_mime is None:
        raise HTTPException(
            status_code=400,
            detail="File content does not match any supported image format (magic-byte check failed).",
        )

    return content
