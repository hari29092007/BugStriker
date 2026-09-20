"""
Recruiter API Router:
Provides endpoints for technical recruiters to:
1. List all candidate debugging runs and their overall scores and hiring recommendations.
2. Inspect the confidential candidate dossier including:
   - Code Correctness Score (50%)
   - Debugging Reasoning Score (50%)
   - Side-by-side Candidate Explanation vs. Ideal Reasoning Benchmark
   - Hiring recommendation (STRONG_HIRE, HIRE, LEAN_NO_HIRE, NO_HIRE)
   - Code diff and execution evidence
"""
from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.auth import get_current_user
from app.database.repositories import CVRepository, ProblemRepository, RunRepository
from app.models.submission import RecruiterRunSummary

router = APIRouter(prefix="/api/recruiter", tags=["recruiter"])


@router.get("/runs", response_model=List[RecruiterRunSummary])
async def list_candidate_runs(user=Depends(get_current_user)):
    """
    List all candidate runs with test score, CV score, cumulative score, and recommendation.
    """
    run_repo = RunRepository()
    prob_repo = ProblemRepository()
    cv_repo = CVRepository()

    raw_runs = run_repo.list_all_runs()
    summaries: List[RecruiterRunSummary] = []

    for r in raw_runs:
        run_id = r["id"]
        candidate_id = r.get("student_id", "Unknown")
        full_state = run_repo.get_full_run_state(run_id)
        problem = prob_repo.get_problem(r.get("problem_id"))
        problem_title = problem.get("title", "Coding Problem") if problem else "Coding Problem"
        verdict = full_state.get("verdict") or {}

        # Look up CV for this run or candidate
        cv = cv_repo.get_cv_by_run_id(run_id) or cv_repo.get_cv_by_candidate(candidate_id)
        cv_score = cv.get("cv_score") if cv else None
        test_score = verdict.get("composite_score")
        cumulative_score = None
        if test_score is not None and cv_score is not None:
            cumulative_score = int(round(test_score * 0.75 + cv_score * 0.25))
        elif test_score is not None:
            cumulative_score = test_score

        summaries.append(
            RecruiterRunSummary(
                run_id=run_id,
                student_id=candidate_id,
                problem_id=r.get("problem_id", ""),
                problem_title=problem_title,
                state=r.get("state", "SUBMITTED"),
                code_score=verdict.get("code_score"),
                reasoning_score=verdict.get("reasoning_score"),
                composite_score=test_score,
                cv_score=cv_score,
                cumulative_score=cumulative_score,
                recommendation=verdict.get("recommendation"),
                created_at=r.get("created_at", ""),
                finished_at=r.get("finished_at"),
            )
        )

    # Sort latest first
    summaries.sort(key=lambda s: s.created_at, reverse=True)
    return summaries


@router.get("/runs/{run_id}")
async def get_candidate_dossier(run_id: str, user=Depends(get_current_user)):
    """
    Get the complete recruiter evaluation dossier for a specific candidate run,
    including both Technical Test details and CV / Resume details.
    """
    run_repo = RunRepository()
    prob_repo = ProblemRepository()
    cv_repo = CVRepository()

    run = run_repo.get_run(run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate run {run_id} not found",
        )

    candidate_id = run.get("student_id", "Unknown")
    full_state = run_repo.get_full_run_state(run_id)
    problem = prob_repo.get_problem(run.get("problem_id"))

    # Fetch candidate's CV
    cv = cv_repo.get_cv_by_run_id(run_id) or cv_repo.get_cv_by_candidate(candidate_id)
    test_score = full_state.get("verdict", {}).get("composite_score")
    cv_score = cv.get("cv_score") if cv else None
    cumulative_score = None
    if test_score is not None and cv_score is not None:
        cumulative_score = int(round(test_score * 0.75 + cv_score * 0.25))
    elif test_score is not None:
        cumulative_score = test_score

    # Return full unified dossier containing both test and CV details
    return {
        "candidate_id": candidate_id,
        "problem": problem,
        "run_state": full_state,
        "cv_report": cv,
        "cumulative_score": cumulative_score,
    }
