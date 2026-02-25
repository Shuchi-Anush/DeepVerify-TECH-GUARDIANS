"""
Blockchain service abstraction.

Provides an interface for anchoring and verifying SHA-256 hashes
on a ledger.  The default ``InMemoryLedger`` is a development stub;
swap it for a real client (Ethereum, Hyperledger Fabric, etc.) by
implementing the ``BlockchainService`` base class.
"""

import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any


class BlockchainService(ABC):
    """Interface that any ledger backend must implement."""

    @abstractmethod
    async def anchor(self, sha256: str, metadata: dict[str, Any]) -> dict[str, Any]:
        """Anchor a file hash and associated metadata on the ledger."""
        ...

    @abstractmethod
    async def verify(self, sha256: str) -> dict[str, Any]:
        """Check whether a hash has been previously anchored."""
        ...


class InMemoryLedger(BlockchainService):
    """
    In-memory development stub.

    Records are lost when the process restarts.
    Replace with a real ledger client for production use.
    """

    def __init__(self) -> None:
        self._ledger: dict[str, dict[str, Any]] = {}

    async def anchor(self, sha256: str, metadata: dict[str, Any]) -> dict[str, Any]:
        tx_id = f"tx_{uuid.uuid4().hex[:16]}"
        record: dict[str, Any] = {
            "tx_id": tx_id,
            "sha256": sha256,
            "metadata": metadata,
            "anchored_at": datetime.now(timezone.utc).isoformat(),
        }
        self._ledger[sha256] = record
        return record

    async def verify(self, sha256: str) -> dict[str, Any]:
        record = self._ledger.get(sha256)
        if record:
            return {"found": True, "sha256": sha256, "record": record}
        return {"found": False, "sha256": sha256, "record": None}


# ── Singleton ────────────────────────────────────────────────
# Swap this assignment to use a real blockchain backend.
blockchain_service: BlockchainService = InMemoryLedger()
