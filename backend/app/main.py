"""
BugStriker FastAPI Application Entry Point.
"""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from contextlib import asynccontextmanager
from app.api import auth, cv, problems, recruiter, runs, submissions, test_sessions
from app.config import get_settings
from app.core.network import NetworkDisconnectedError, is_network_connected

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.require_network:
        connected = is_network_connected()
        if connected:
            print("[BugStriker Network Guard] Active internet connection verified: ONLINE.")
        else:
            print("[BugStriker Network Guard] CRITICAL: Network disconnected! Agent execution will be blocked.")
    yield


app = FastAPI(
    title="BugStriker API",
    description="Adaptive Code Debugging Agent backend",
    version="1.0.0",
    lifespan=lifespan,
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


from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.network import NetworkDisconnectedError, is_network_connected

frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

@app.get("/health")

def health():
    connected = is_network_connected()
    return {
        "status": "ok",
        "service": "bugstriker-api",
        "environment": settings.environment,
        "network_connected": connected,
        "require_network": settings.require_network,
    }


@app.exception_handler(NetworkDisconnectedError)
async def network_disconnected_handler(request: Request, exc: NetworkDisconnectedError):
    return JSONResponse(
        status_code=503,
        content={"detail": str(exc)},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )



if frontend_dist.exists():
    if (frontend_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = frontend_dist / full_path
        if full_path and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(frontend_dist / "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "status": "ok",
            "service": "bugstriker-api",
            "environment": settings.environment,
        }

