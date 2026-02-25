"""
Application configuration.

Loads settings from environment variables (via .env) with sensible defaults.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Central configuration for the DeepVerify backend."""

    def __init__(self) -> None:
        self.APP_TITLE = "DeepVerify API - TECH GUARDIANS"
        self.APP_VERSION = "1.0.0"

        self.BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
        self.UPLOAD_DIR: Path = self.BASE_DIR / "uploads"
        self.ARTIFACTS_DIR: Path = self.BASE_DIR / "artifacts"

        # File-validation limits
        self.ALLOWED_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".tiff", ".tif"}
        self.MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", 50 * 1024 * 1024))

        # ELA tunables
        self.ELA_QUALITY: int = int(os.getenv("ELA_QUALITY", 90))
        self.ELA_SCALE: int = int(os.getenv("ELA_SCALE", 15))

        # Create required directories
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
