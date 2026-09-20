"""
Test Sessions API Router:
Returns lock status and constraints for a run.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from app.api.auth import get_current_user
from app.database.repositories import RunRepository

router = APIRouter(prefix="/api/runs", tags=["test_sessions"])

LOCKED_STATES = {"SUBMITTED", "RUNNING_TESTS", "ANALYZING", "REVISION"}


@router.get("/{run_id}/lock")
async def get_run_lock_status(run_id: str, user=Depends(get_current_user)):
    """
    Check if a test session run is currently locked.
    Locked while running tests or analyzing.
    """
    repo = RunRepository()
    run = repo.get_run(run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found",
        )

    state = run.get("state", "SUBMITTED")
    is_locked = state in LOCKED_STATES
    return {
        "run_id": run_id,
        "state": state,
        "is_locked": is_locked,
        "is_finished": state == "FINISHED",
        "is_waiting_for_student": state == "WAITING_FOR_STUDENT",
        "llm_calls_used": run.get("llm_calls_used", 0),
        "max_llm_calls": run.get("max_llm_calls", 5),
    }
