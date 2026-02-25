from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import shutil
import os
from pathlib import Path

from app.services.forensics.ela import perform_ela
from app.services.forensics.fft import perform_fft
from app.services.forensics.metadata import extract_metadata
from app.services.forensics.hashing import compute_sha256
from app.services.forensics.fusion import compute_risk_score

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="DeepVerify API - TECH GUARDIANS")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "DeepVerify Backend"}

@app.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return JSONResponse({
        "filename": file.filename,
        "message": "File uploaded successfully"
    })

@app.post("/analyze")
async def analyze_file(filename: str):
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        return JSONResponse({"error": "file not found"}, status_code=404)

    # Run forensic modules
    ela_output = perform_ela(str(file_path))
    fft_output = perform_fft(str(file_path))
    metadata = extract_metadata(str(file_path))
    sha256_hash = compute_sha256(str(file_path))

    score, label = compute_risk_score(metadata)

    return JSONResponse({
        "filename": filename,
        "sha256": sha256_hash,
        "metadata_found": bool(metadata),
        "risk_score": score,
        "classification": label,
        "ela_output": ela_output,
        "fft_output": fft_output
    })