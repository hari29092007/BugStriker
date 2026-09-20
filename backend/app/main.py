"""
BugStriker FastAPI Application Entry Point.
"""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import auth, cv, problems, recruiter, runs, submissions, test_sessions
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="BugStriker API",
    description="Adaptive Code Debugging Agent backend",
    version="1.0.0",
)

# CORS configuration
allowed_origins = [
    settings.frontend_url,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(problems.router)
app.include_router(runs.router)
app.include_router(submissions.router)
app.include_router(test_sessions.router)
app.include_router(recruiter.router)
app.include_router(cv.router)
app.include_router(cv.recruiter_router)


@app.get("/")
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "bugstriker-api",
        "environment": settings.environment,
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )
