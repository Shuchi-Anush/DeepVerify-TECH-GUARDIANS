# backend/main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import shutil
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="DeepVerify API - TECH GUARDIANS")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "DeepVerify Backend"}

@app.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    # save file
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # placeholder response - actual analysis triggered by /analyze or background task
    return JSONResponse({
        "filename": file.filename,
        "message": "File uploaded. Use /analyze to run forensic checks.",
        "path": str(file_path)
    })

@app.post("/analyze")
async def analyze_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        return JSONResponse({"error": "file not found"}, status_code=404)

    # TODO: call forensic services here
    # from app.services.forensics import analyze
    # result = analyze(str(file_path))
    result = {"verdict": "INCONCLUSIVE", "score": 0.33, "signals": {}}

    return JSONResponse({"filename": filename, "analysis": result})
