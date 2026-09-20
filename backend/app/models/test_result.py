from pydantic import BaseModel
from typing import Optional, List, Any


class TestCaseResult(BaseModel):
    test_id: str
    description: str
    input_data: dict
    expected_output: Any
    actual_output: Optional[Any] = None
    stdout: str = ""
    stderr: str = ""
    passed: bool = False
    error: Optional[str] = None
    execution_time_ms: Optional[int] = None


class ExecutionEvidence(BaseModel):
    submission_id: str
    test_results: List[TestCaseResult]
    all_passed: bool
    pass_count: int
    fail_count: int
    total_count: int
    execution_time_ms: int
