"""
DeepVerify REST API routes.

All business logic is delegated to the service layer —
routes handle only HTTP concerns (validation, serialisation, status codes).
"""

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import settings
from app.core.security import validate_upload
from app.models.schemas import (
    AnalysisResponse,
    HealthResponse,
    VerifyRequest,
    VerifyResponse,
)
from app.services.blockchain import blockchain_service
from app.services.forensics import run_analysis
from app.services.scoring import compute_risk_score
from app.utils.file_utils import compute_sha256, save_upload

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health():
    """Liveness / readiness probe."""
    return {
        "status": "ok",
        "service": settings.APP_TITLE,
        "version": settings.APP_VERSION,
    }


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(file: UploadFile = File(...)):
    """
    Accept an image upload, run full forensic analysis, compute
    risk score, anchor to the blockchain ledger, and return
    structured results.
    """
    # 1. Validate file (extension, magic bytes, size)
    content = await validate_upload(file)

    # 2. Compute SHA-256 hash of raw bytes
    sha256 = compute_sha256(content)

    # 3. Persist to disk
    saved_path = save_upload(content, file.filename or "upload.bin")

    # 4. Run forensic modules (ELA, FFT, Metadata)
    signals = run_analysis(str(saved_path), sha256)

    # 5. Aggregate risk score
    risk_score, risk_label = compute_risk_score(signals)

    # 6. Anchor hash + metadata on the blockchain ledger
    blockchain_record = await blockchain_service.anchor(
        sha256,
        {
            "filename": file.filename,
            "risk_score": risk_score,
            "risk_label": risk_label,
        },
    )

    # 7. Return structured response
    return AnalysisResponse(
        filename=file.filename or "unknown",
        sha256=sha256,
        signals=signals,
        risk_score=risk_score,
        risk_label=risk_label,
        blockchain=blockchain_record,
    )


@router.post("/verify", response_model=VerifyResponse)
async def verify(body: VerifyRequest):
    """
    Verify whether a SHA-256 hash has been previously anchored
    on the blockchain ledger.
    """
    result = await blockchain_service.verify(body.sha256)
    if not result["found"]:
        raise HTTPException(status_code=404, detail="Hash not found on ledger.")
    return VerifyResponse(**result)
