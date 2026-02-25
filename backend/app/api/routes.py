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
    HistoryItem,
    HistoryResponse,
    StatsResponse,
    VerifyRequest,
    VerifyResponse,
)
from app.services.blockchain import blockchain_service
from app.services.forensics import run_analysis
from app.services.result_store import result_store
from app.services.scoring import compute_risk_score
from app.utils.file_utils import compute_sha256, save_upload

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health():
    """Liveness / readiness probe."""
    return {
        "status": "ok",
        "service": settings.APP_TITLE,
        "version": settings.APP_VERSION,
    }


# ─────────────────────────────────────────────────────────────────────────
# Forensic Analysis
# ─────────────────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=AnalysisResponse, tags=["Forensics"])
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

    # 4. Run forensic modules (ELA, FFT, Metadata, AI Detector)
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

    # 7. Surface AI detector verdict at the top level for easy front-end access
    ai_signal = signals.get("ai_detector", {})
    ai_score = float(ai_signal.get("score", 0.0))
    ai_label = ai_signal.get("ai_label", "UNAVAILABLE")

    # 8. Build final result dict and persist in the result store
    result = dict(
        filename=file.filename or "unknown",
        sha256=sha256,
        signals=signals,
        risk_score=risk_score,
        risk_label=risk_label,
        ai_score=ai_score,
        ai_label=ai_label,
        blockchain=blockchain_record,
    )
    result_store.save(sha256, result)

    # 9. Return structured response
    return AnalysisResponse(**result)


# ─────────────────────────────────────────────────────────────────────────
# Blockchain Verify
# ─────────────────────────────────────────────────────────────────────────

@router.post("/verify", response_model=VerifyResponse, tags=["Blockchain"])
async def verify(body: VerifyRequest):
    """
    Verify whether a SHA-256 hash has been previously anchored
    on the blockchain ledger.
    """
    result = await blockchain_service.verify(body.sha256)
    if not result["found"]:
        raise HTTPException(status_code=404, detail="Hash not found on ledger.")
    return VerifyResponse(**result)


# ─────────────────────────────────────────────────────────────────────────
# History
# ─────────────────────────────────────────────────────────────────────────

@router.get("/history", response_model=HistoryResponse, tags=["History"])
async def history():
    """
    Return a summary list of all previously analysed files,
    ordered most-recent first.
    """
    all_records = result_store.all()
    items = [
        HistoryItem(
            sha256=r["sha256"],
            filename=r["filename"],
            risk_score=r["risk_score"],
            risk_label=r["risk_label"],
            ai_score=r["ai_score"],
            ai_label=r["ai_label"],
            analyzed_at=r["analyzed_at"],
        )
        for r in all_records
    ]
    return HistoryResponse(total=len(items), items=items)


@router.get("/report/{sha256}", response_model=AnalysisResponse, tags=["History"])
async def report(sha256: str):
    """
    Retrieve the full forensic report for a previously analysed file
    by its SHA-256 hash.  Includes all signal scores, artifact paths,
    and blockchain record.
    """
    record = result_store.get(sha256)
    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"No analysis found for hash '{sha256}'. Run /analyze first.",
        )
    return AnalysisResponse(**record)


# ─────────────────────────────────────────────────────────────────────────
# Stats
# ─────────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsResponse, tags=["System"])
async def stats():
    """
    Return aggregate statistics across all analysed files in the
    current session: total count, breakdown by risk label and AI
    label, and average risk score.
    """
    return StatsResponse(**result_store.stats())

@router.get("/", tags=["System"])
async def root():
    return {"message": "DeepVerify API is running!"}