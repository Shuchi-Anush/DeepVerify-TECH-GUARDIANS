"""
Pydantic request / response schemas for the DeepVerify API.
"""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Health ──────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


# ── Analysis ────────────────────────────────────────────────

class AnalysisResponse(BaseModel):
    """Full forensic-analysis result returned by POST /analyze."""

    filename: str
    sha256: str
    signals: dict[str, Any]
    risk_score: float = Field(ge=0.0, le=1.0)
    risk_label: str
    blockchain: dict[str, Any]


# ── Verify ──────────────────────────────────────────────────

class VerifyRequest(BaseModel):
    sha256: str = Field(
        ...,
        min_length=64,
        max_length=64,
        description="SHA-256 hex digest to look up on the ledger",
    )


class VerifyResponse(BaseModel):
    found: bool
    sha256: str
    record: Optional[dict[str, Any]] = None
