from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class VerdictResult(BaseModel):
    verdict: str  # VERIFIED, NOT_VERIFIED, PARTIAL, AUTO_PASS
    rationale: str
    evidence_summary: Optional[Dict[str, Any]] = None
    # Recruiter Evaluation Fields
    recommendation: Optional[str] = "HIRE"  # STRONG_HIRE, HIRE, LEAN_NO_HIRE, NO_HIRE
    code_score: Optional[int] = 100
    reasoning_score: Optional[int] = 100
    composite_score: Optional[int] = 100
    ideal_reasoning: Optional[str] = None
    reasoning_comparison: Optional[Dict[str, Any]] = None
    executive_summary: Optional[str] = None
