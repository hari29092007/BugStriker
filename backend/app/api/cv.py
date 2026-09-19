"""
CV Upload & Analysis API:
  POST /api/cv/upload            — Student uploads CV (multipart file)
  GET  /api/recruiter/cv-reports — Recruiter lists all CV reports
  GET  /api/recruiter/cv-reports/{cv_id} — Full CV report
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, Header
from fastapi.responses import JSONResponse

from app.agent.cv_analyzer import analyze_cv
from app.database.repositories import CVRepository

router = APIRouter(prefix="/api/cv", tags=["cv"])
recruiter_router = APIRouter(prefix="/api/recruiter", tags=["recruiter-cv"])

cv_repo = CVRepository()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/octet-stream",  # generic fallback
}
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_candidate_id(authorization: str = "") -> str:
    """Extract candidate ID from dev auth header or return dev default."""
    if authorization.startswith("Bearer dev-"):
        token = authorization.replace("Bearer dev-", "")
        return token if token else "student@bugstriker.dev"
    elif authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        return token if token else "student@bugstriker.dev"
    return "student@bugstriker.dev"


@router.post("/upload")
async def upload_cv(
    file: UploadFile = File(...),
    run_id: Optional[str] = Form(None),
    authorization: str = Header(default=""),
):
    """
    Student uploads CV/Resume. Returns submission ID immediately.
    AI analysis runs synchronously or fallback to heuristic.
    Student sees only: { "status": "SUBMITTED", "cv_id": "..." }
    """
    # Validate filename extension
    filename = file.filename or "resume.pdf"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Please upload PDF, DOCX, or TXT.",
        )

    # Read bytes
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum size is 5 MB.",
        )
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    candidate_id = _get_candidate_id(authorization)
    cv_id = str(uuid4())
    created_at = _now()

    # Save a pending record immediately
    pending = {
        "cv_id": cv_id,
        "candidate_id": candidate_id,
        "run_id": run_id,
        "filename": filename,
        "file_size_bytes": len(file_bytes),
        "status": "PENDING",
        "cv_score": None,
        "created_at": created_at,
    }
    cv_repo.cv_repo_raw_save(cv_id, pending)

    # Run AI analysis
    try:
        report = await analyze_cv(
            file_bytes=file_bytes,
            filename=filename,
            candidate_id=candidate_id,
            cv_id=cv_id,
            created_at=created_at,
        )
        report["status"] = "ANALYZED"
        report["file_size_bytes"] = len(file_bytes)
        report["run_id"] = run_id
        cv_repo.save_cv(report)
    except Exception as e:
        print(f"CV analysis error: {e}")
        pending["status"] = "ERROR"
        cv_repo.cv_repo_raw_save(cv_id, pending)
        raise HTTPException(status_code=500, detail="CV analysis failed. Please try again.")

    # Return ONLY submission confirmation to student — no scores
    return JSONResponse({
        "status": "SUBMITTED",
        "cv_id": cv_id,
        "message": "Your CV has been submitted.",
    })


@recruiter_router.get("/cv-reports")
async def list_cv_reports():
    """Recruiter: list all CV submissions with scores and cumulative."""
    reports = cv_repo.list_all_cvs()
    # Return summary (no full dimension breakdown in list view)
    summaries = []
    for r in reports:
        summaries.append({
            "cv_id": r.get("cv_id"),
            "candidate_id": r.get("candidate_id"),
            "filename": r.get("filename"),
            "cv_score": r.get("cv_score"),
            "percentile": r.get("percentile"),
            "test_composite_score": r.get("test_composite_score"),
            "cumulative_score": r.get("cumulative_score"),
            "status": r.get("status", "ANALYZED"),
            "created_at": r.get("created_at"),
        })
    return summaries


@recruiter_router.get("/cv-reports/{cv_id}")
async def get_cv_report(cv_id: str):
    """Recruiter: full CV analysis report for a single submission."""
    report = cv_repo.get_cv(cv_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"CV report {cv_id} not found.")
    return report
