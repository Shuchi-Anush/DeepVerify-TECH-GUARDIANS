# DeepVerify – Architecture Context

Version: 1.1.0  
Status: Authoritative  
Last Updated: 2026-02-26

---

## 1. System Overview

DeepVerify is an AI + classical-forensics digital evidence authenticity framework.

Core objective:

- Detect manipulation signals in images
- Aggregate signals into a normalized risk score
- Provide explainable structured output
- Anchor evidence hash to blockchain
- Preserve analysis history
- Maintain strict modular boundaries

This system is evolving from prototype to scalable forensic platform.

---

## 2. High-Level Architecture

Client Layer  
↓  
FastAPI Backend (Single Entry Point)  
↓  
Forensic Signal Layer  
↓  
Scoring Engine  
↓  
Blockchain Anchoring  
↓  
Persistence Layer  

No component may bypass the backend API.

---

## 3. Architectural Layer Responsibilities

### 3.1 Routes Layer (app/api/routes.py)

- Handles HTTP concerns only
- Performs validation
- Delegates business logic to services
- Returns Pydantic response models
- Must not contain scoring logic
- Must not contain signal logic
- Must not contain blockchain logic

---

### 3.2 Forensic Signal Layer (app/services/forensics)

Current signals:

- ELA
- FFT
- Metadata
- AI Detector

Rules:

- Each signal must return:
  - score ∈ [0,1]
  - structured metadata
- Signals must not:
  - Call blockchain
  - Modify scoring weights
  - Access result_store directly
- AI detector must degrade gracefully if model missing

---

### 3.3 Scoring Engine (app/services/scoring.py)

Purpose:  
Aggregate signal scores into a single normalized risk score.

Rules:

- Weighted aggregation
- Must normalize if signals missing
- Must return:
  - (risk_score: float in [0,1], risk_label: str)
- Labels allowed:
  - REAL
  - SUSPICIOUS
  - TAMPERED
  - INCONCLUSIVE
- No hardcoded logic inside routes
- No external side effects

Current weights:

- ela: 0.20
- fft: 0.15
- metadata: 0.20
- ai_detector: 0.45

Total must equal 1.0.

Any weight change requires:

- Version bump
- Documentation update

---

### 3.4 Blockchain Layer (app/services/blockchain.py)

Responsibilities:

- Anchor SHA-256 hash
- Return immutable record
- Verify hash existence

Rules:

- Must not compute risk score
- Must not modify signals
- Must not store analysis results
- Must not change scoring semantics

Failure handling:

- Blockchain failure must not corrupt analysis logic
- Must raise structured API error

---

### 3.5 Persistence Layer (app/services/result_store.py)

Current state:

- In-memory store
- Lost on restart
- Development-stage only

Responsibilities:

- Store full analysis result keyed by sha256
- Add analyzed_at timestamp (UTC ISO 8601)
- Provide:
  - get()
  - all()
  - stats()

Future:

- Will migrate to SQLite / PostgreSQL
- No direct DB logic inside routes

---

## 4. API Contract Governance

Current API Version: 1.1.0

AnalysisResponse must include:

- filename
- sha256
- signals
- risk_score
- risk_label
- ai_score
- ai_label
- blockchain
- analyzed_at

Rules:

- No field removal without major version bump
- No silent field addition
- No enum expansion without version bump
- API changes require updating:
  - APP_VERSION
  - API_CONTRACT file

---

## 5. AI Detector Rules

File: app/services/ai_detector.py

Requirements:

- Must return score in [0,1]
- Must return ai_label
- Must not crash if model missing
- Must not modify scoring weights
- Must not alter API schema

AI score is treated as forensic signal.

---

## 6. Logging Policy

Centralized logging via:

app/core/logging_config.py

Rules:

- Log operational events only
- Do not log full image contents
- Do not log sensitive EXIF data
- Log blockchain failures
- Log verification failures

---

## 7. Error Handling Policy

All API errors must:

- Use HTTPException
- Be handled by global exception handler
- Return structured error schema

No raw stack traces returned to client.

---

## 8. Versioning Policy

Semantic Versioning:

- MAJOR → Breaking API changes
- MINOR → Backward-compatible additions
- PATCH → Internal fixes

Examples:

- 1.0.0 → Initial stable backend
- 1.1.0 → AI integration + history endpoints
- 1.2.0 → SQLite persistence
- 2.0.0 → API contract redesign

---

## 9. Strict Engineering Constraints

The following are non-negotiable:

- No cross-layer coupling
- No scoring logic in routes
- No blockchain logic in scoring
- No signal directly modifying database
- No duplication of weight definitions
- No business logic inside Pydantic schemas
- No silent changes to scoring thresholds

---

## 10. When Using AI Coding Assistants

Before generating code:

- Provide this full architecture context
- Provide current file content
- Provide explicit constraints
- Provide API contract version
- Provide allowed modification scope

Never allow AI to:

- Redesign system without instruction
- Change API contract implicitly
- Change scoring semantics silently

---

## 11. Current System Status

- Phase 1: Complete
- Phase 2: In progress
- AI signal integrated
- In-memory persistence added
- Blockchain stub active
- Logging layer active

Next planned step:

- Replace in-memory persistence with durable storage
- Add unit tests for scoring and AI signal integration

---

## 12. CODEOWNERS Policy

DeepVerify follows controlled architectural ownership.

Primary architecture authority:

- Blockchain layer
- Scoring engine
- API contract
- Version governance

Recommended CODEOWNERS file structure:
/backend/app/services/scoring.py @architecture-owner
/backend/app/services/blockchain.py @architecture-owner
/backend/app/models/schemas.py @architecture-owner
/backend/app/core/config.py @architecture-owner
/backend/app/services/ai_detector.py @ml-owner
/backend/app/services/forensics/ @forensics-owner
/backend/app/api/ @backend-owner

Rules:

- Changes to scoring weights require architecture-owner review
- Changes to API schema require architecture-owner review
- ML model file changes require ml-owner review
- No direct pushes to protected branches
- All architectural modifications must go through PR review

---

## 13. Dependency Management Policy

DeepVerify backend dependencies must be:

- Explicitly version-pinned in `requirements.txt`
- Compatible with Python 3.10+
- Evaluated for security risk before upgrade

Rules:

- No unpinned `>=` version ranges
- No unused dependencies allowed
- ML dependencies must be lazily loaded
- Heavy dependencies must not load at import time
- Model files must not be committed to Git if large (use .gitignore if needed)

When upgrading dependencies:

- Test `/health`
- Test `/analyze`
- Validate scoring output remains stable
- Confirm no API contract drift

---

## 14. ML Model Governance

The AI detector is a supporting forensic signal, not a standalone verdict.

Rules:

- Model score must be normalized to [0,1]
- Model threshold must be explicitly documented
- Changing model threshold requires version bump
- Changing feature vector structure requires version bump
- ML model must degrade gracefully if files missing
- AI model must not silently alter scoring weights

Model artifacts:

- Keras model (.keras)
- StandardScaler (.pkl)

Location:
`backend/models/`

Never:

- Hardcode model paths outside config
- Embed training logic inside runtime backend
- Change inference behavior without documentation update

AI signal must always be treated as:

One component in weighted aggregation.

---

## 15. Security Model

DeepVerify enforces the following security layers:

### 15.1 Upload Validation

- Extension validation
- Magic-byte validation
- File size limits
- No raw file execution
- No dynamic evaluation of file content

### 15.2 Artifact Serving Isolation

Artifacts directory:
`/artifacts`

Rules:

- Only generated forensic artifacts stored here
- No user-uploaded file served directly
- StaticFiles must not expose arbitrary filesystem paths
- Upload directory must not be mounted publicly

### 15.3 Blockchain Anchoring Safety

- Only SHA-256 hash is anchored
- No full file content stored on chain
- Metadata stored must be minimal
- No sensitive user information included

### 15.4 Logging Safety

- No logging of raw image bytes
- No logging of full EXIF dumps
- No sensitive metadata logging
- Errors must not leak stack traces in production

### 15.5 Future Security Enhancements

Planned:

- Rate limiting
- Request size limiting
- Authentication layer
- Role-based access
- Audit trail persistence

---

## 16. Governance Philosophy

DeepVerify is transitioning from prototype to platform.

Engineering priorities:

1. Deterministic scoring integrity
2. Explainability
3. API stability
4. Controlled evolution
5. Security-first design
6. Observability
7. Scalability readiness

No feature addition should compromise:

- Scoring consistency
- API contract stability
- Architectural boundaries
- Signal independence

All architectural changes must be intentional, documented, and versioned.

---

End of Architecture Context.
