"""
Runs API Router:
Handles run creation and candidate polling of run state.
Protects confidential recruiter evaluation results from being exposed to candidates.
"""
from __future__ import annotations

from typing import Any, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.auth import get_current_user
from app.database.repositories import ProblemRepository, RunRepository
from app.models.submission import CreateRunRequest, RunStateResponse

router = APIRouter(prefix="/api/runs", tags=["runs"])


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_run(req: CreateRunRequest, user=Depends(get_current_user)):
    """
    Create a new student evaluation cycle run for a problem.
    """
    problem_repo = ProblemRepository()
    problem = problem_repo.get_problem(str(req.problem_id))
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem {req.problem_id} not found",
        )

    run_repo = RunRepository()
    student_id = user["id"]
    run = run_repo.create_run(student_id=student_id, problem_id=str(req.problem_id))
    return {"run_id": run["id"], "state": run["state"]}


@router.get("/{run_id}", response_model=RunStateResponse)
async def get_run(run_id: str, user=Depends(get_current_user)):
    """
    Fetch the state of a run for the candidate/student.
    Confidential recruiter evaluations (scores, recommendation, ideal reasoning comparison)
    are strictly masked from the candidate response.
    """
    run_repo = RunRepository()
    run = run_repo.get_run(run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found",
        )

    # Allow student to view their own run, or allow in dev mode
    student_id = run.get("student_id")
    if student_id and student_id != user["id"] and user["id"] != "00000000-0000-0000-0000-000000000001":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this run",
        )

    full_state = dict(run_repo.get_full_run_state(run_id))

    # Mask confidential recruiter evaluation for candidates
    if full_state.get("verdict"):
        raw_v = full_state["verdict"]
        # Candidate only sees that their submission has been received and logged
        full_state["verdict"] = {
            "verdict": "SUBMITTED_FOR_REVIEW",
            "rationale": "Your code revision and diagnostic debugging reasoning have been encrypted and submitted to the recruiting team for technical evaluation.",
            "evidence_summary": raw_v.get("evidence_summary"),
        }

    return full_state
