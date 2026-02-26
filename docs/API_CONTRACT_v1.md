# DeepVerify API Contract v1.0

Version: 1.0.0  
Status: Frozen  
Last Updated: 2026-02-26  

⚠️ This schema is frozen. Any change requires version bump.

---

## 1. POST /analyze

### Description

Accept image upload, perform forensic analysis, compute risk score,
anchor hash on blockchain, and return structured result.

### Response Schema

{
  "filename": "string",
  "sha256": "string (64 hex characters)",
  "signals": {
    "ela": {
      "score": "float [0,1]",
      "heatmap_path": "string",
      "quality_used": "int",
      "amplification_used": "int"
    },
    "fft": {
      "score": "float [0,1]",
      "hf_energy": "float",
      "spectrum_path": "string"
    },
    "metadata": {
      "score": "float [0,1]",
      "flags": ["string"],
      "exif": {}
    }
  },
  "risk_score": "float [0,1]",
  "risk_label": "REAL | SUSPICIOUS | TAMPERED",
  "blockchain": {
    "tx_id": "string",
    "sha256": "string",
    "metadata": {
      "filename": "string",
      "risk_score": "float",
      "risk_label": "string"
    },
    "anchored_at": "ISO8601 timestamp"
  }
}

---

## 2. POST /verify

### Request

{
  "sha256": "string (64 hex characters)"
}

### Response

{
  "found": true,
  "sha256": "string",
  "record": {}
}
