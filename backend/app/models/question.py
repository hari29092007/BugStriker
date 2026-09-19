from pydantic import BaseModel
from typing import Optional, Any


class DiagnosticQuestion(BaseModel):
    run_id: str
    question_text: str
    failure_summary: str
    most_useful_failure: Optional[dict] = None
