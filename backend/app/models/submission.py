from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID


class CreateRunRequest(BaseModel):
    problem_id: UUID


class SubmitCodeRequest(BaseModel):
    code: str


class ExplainRequest(BaseModel):
    explanation: str


class ReviseRequest(BaseModel):
    code: str


class RunStateResponse(BaseModel):
    run_id: str
    state: str
    problem_id: str
    llm_calls_used: int
    created_at: str
    updated_at: str
    # Populated as the run progresses
    original_submission: Optional[dict] = None
    diagnostic_question: Optional[dict] = None
    student_answer: Optional[dict] = None
    revision_submission: Optional[dict] = None
    verdict: Optional[dict] = None
    violation_reason: Optional[str] = None


class RecruiterRunSummary(BaseModel):
    run_id: str
    student_id: str
    problem_id: str
    problem_title: str
    state: str
    code_score: Optional[int] = None
    reasoning_score: Optional[int] = None
    composite_score: Optional[int] = None
    recommendation: Optional[str] = None
    created_at: str
    finished_at: Optional[str] = None
