"""
Submissions API Router:
Executes the BugStriker agentic loop:
- Submit initial code (triggers test run + analysis + diagnostic question)
- Submit explanation (student diagnosis)
- Submit revised code (triggers second test run + final verdict)
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from app.agent.orchestrator import RunOrchestrator
from app.agent.state_machine import InvalidTransitionError
from app.api.auth import get_current_user
from app.database.repositories import (
    AnswerRepository,
    ProblemRepository,
    QuestionRepository,
    RunRepository,
    SubmissionRepository,
    VerdictRepository,
)
from app.models.submission import ExplainRequest, ReviseRequest, RunStateResponse, SubmitCodeRequest

router = APIRouter(prefix="/api/runs", tags=["submissions"])


def _get_orchestrator() -> RunOrchestrator:
    return RunOrchestrator(
        run_repo=RunRepository(),
        sub_repo=SubmissionRepository(),
        q_repo=QuestionRepository(),
        a_repo=AnswerRepository(),
        v_repo=VerdictRepository(),
        problem_repo=ProblemRepository(),
    )


@router.post("/{run_id}/submit", response_model=RunStateResponse)
async def submit_initial_code(
    run_id: str,
    req: SubmitCodeRequest,
    user=Depends(get_current_user),
):
    """
    Submit initial code for the run.
    Triggers: SUBMITTED -> RUNNING_TESTS -> ANALYZING -> QUESTIONING (or FINISHED if all pass).
    """
    if not req.code or not req.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code cannot be empty",
        )

    orchestrator = _get_orchestrator()
    try:
        updated_state = await orchestrator.handle_initial_submission(
            run_id=run_id,
            code=req.code,
            student_id=user["id"],
        )
        return updated_state
    except InvalidTransitionError as ite:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(ite))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Execution error: {str(exc)}",
        )


@router.post("/{run_id}/explain", response_model=RunStateResponse)
async def submit_student_explanation(
    run_id: str,
    req: ExplainRequest,
    user=Depends(get_current_user),
):
    """
    Submit student's explanation answering the diagnostic question.
    Triggers: WAITING_FOR_STUDENT -> REVISION.
    """
    if not req.explanation or not req.explanation.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explanation cannot be empty",
        )

    orchestrator = _get_orchestrator()
    try:
        updated_state = await orchestrator.handle_explanation(
            run_id=run_id,
            explanation=req.explanation.strip(),
            student_id=user["id"],
        )
        return updated_state
    except InvalidTransitionError as ite:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(ite))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting explanation: {str(exc)}",
        )


@router.post("/{run_id}/revise", response_model=RunStateResponse)
async def submit_revised_code(
    run_id: str,
    req: ReviseRequest,
    user=Depends(get_current_user),
):
    """
    Submit revised code (only 1 revision allowed).
    Triggers: REVISION -> RUNNING_TESTS -> ANALYZING -> FINISHED.
    """
    if not req.code or not req.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code cannot be empty",
        )

    orchestrator = _get_orchestrator()
    try:
        updated_state = await orchestrator.handle_revision(
            run_id=run_id,
            code=req.code,
            student_id=user["id"],
        )
        return updated_state
    except InvalidTransitionError as ite:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(ite))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting revision: {str(exc)}",
        )
