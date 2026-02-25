"""
In-memory result store.

Persists full analysis results keyed by SHA-256 so that
/report/{sha256} and /history can retrieve them after the
fact without re-running forensics.

This is an in-process store (lost on restart).
Replace with a database backend (SQLite / Postgres / Redis)
for production persistence.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


class ResultStore:
    """Thread-safe (GIL-protected) in-memory dict keyed by SHA-256."""

    def __init__(self) -> None:
        self._store: dict[str, dict[str, Any]] = {}

    def save(self, sha256: str, record: dict[str, Any]) -> None:
        """Persist a full analysis record. Overwrites if hash already exists."""
        self._store[sha256] = {
            **record,
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
        }

    def get(self, sha256: str) -> dict[str, Any] | None:
        """Return the full record for a given hash, or None if not found."""
        return self._store.get(sha256)

    def all(self) -> list[dict[str, Any]]:
        """Return all records ordered by analysis time (most recent first)."""
        return sorted(
            self._store.values(),
            key=lambda r: r.get("analyzed_at", ""),
            reverse=True,
        )

    def stats(self) -> dict[str, Any]:
        """Return aggregate counts across all stored results."""
        total = len(self._store)
        label_counts: dict[str, int] = {}
        ai_label_counts: dict[str, int] = {}
        score_sum = 0.0

        for record in self._store.values():
            rl = record.get("risk_label", "UNKNOWN")
            label_counts[rl] = label_counts.get(rl, 0) + 1

            al = record.get("ai_label", "UNKNOWN")
            ai_label_counts[al] = ai_label_counts.get(al, 0) + 1

            score_sum += record.get("risk_score", 0.0)

        return {
            "total_analyzed": total,
            "by_risk_label": label_counts,
            "by_ai_label": ai_label_counts,
            "average_risk_score": round(score_sum / total, 4) if total > 0 else 0.0,
        }


# ── Singleton ────────────────────────────────────────────────
result_store = ResultStore()
