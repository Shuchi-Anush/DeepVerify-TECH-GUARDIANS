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
    ai_score: float = Field(ge=0.0, le=1.0, description="Raw AI model confidence (0=REAL, 1=AI/TAMPERED)")
    ai_label: str = Field(description="AI detector verdict: REAL | AI_GENERATED | UNAVAILABLE")
    blockchain: dict[str, Any]
    analyzed_at: Optional[str] = None


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


# ── History ──────────────────────────────────────────────────

class HistoryItem(BaseModel):
    """Lightweight summary row used in GET /history."""
    sha256: str
    filename: str
    risk_score: float
    risk_label: str
    ai_score: float
    ai_label: str
    analyzed_at: str


class HistoryResponse(BaseModel):
    total: int
    items: list[HistoryItem]


# ── Stats ────────────────────────────────────────────────────

class StatsResponse(BaseModel):
    total_analyzed: int
    by_risk_label: dict[str, int]
    by_ai_label: dict[str, int]
    average_risk_score: float
