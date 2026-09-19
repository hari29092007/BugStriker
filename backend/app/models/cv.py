"""
CV / Resume Pydantic models.
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class CVDimensionScore(BaseModel):
    name: str
    score: int          # 0-100
    weight: float       # fraction, e.g. 0.25
    notes: str


class CVSubmission(BaseModel):
    cv_id: str
    candidate_id: str
    filename: str
    file_size_bytes: int
    status: str         # "PENDING" | "ANALYZED" | "ERROR"
    cv_score: Optional[int] = None
    created_at: str


class CVReport(BaseModel):
    cv_id: str
    candidate_id: str
    filename: str
    cv_score: int                          # 0-100 overall
    percentile: int                        # vs other candidates in this session
    dimensions: List[CVDimensionScore]
    strengths: List[str]
    gaps: List[str]
    recruiter_notes: str                   # actionable AI summary for hiring manager
    extracted_skills: List[str]
    years_of_experience: Optional[str]
    education_summary: Optional[str]
    cumulative_score: Optional[int] = None # test_score*0.6 + cv_score*0.4
    test_composite_score: Optional[int] = None
    created_at: str
