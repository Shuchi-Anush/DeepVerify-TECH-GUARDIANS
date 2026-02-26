"""
DeepVerify Backend — application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.logging_config import setup_logging
from app.core.config import settings
from app.api.routes import router


def create_app() -> FastAPI:
    """Application factory."""
    setup_logging()
    application = FastAPI(
        title=settings.APP_TITLE,
        version=settings.APP_VERSION,
    )

    # CORS — permissive for development; restrict origins in production
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Serve forensic artifacts (heatmaps, spectrums) as static files
    application.mount(
        "/artifacts",
        StaticFiles(directory=str(settings.ARTIFACTS_DIR)),
        name="artifacts",
    )

    # Register API routes
    application.include_router(router)

    return application


app = create_app()
