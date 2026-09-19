"""
Repository layer for BugStriker database operations.
Connects to Supabase PostgreSQL when credentials are configured.
Includes an automatic in-memory fallback when Supabase is offline/unconfigured,
allowing full local testing and immediate execution.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from supabase import Client
from app.config import get_settings
from app.database.supabase import get_supabase_service_client

# In-memory mock store for local development / testing
_MEM_DB = {
    "student_runs": {},
    "code_submissions": {},
    "diagnostic_questions": {},
    "student_answers": {},
    "verdicts": {},
    "problems": {},
    "test_cases": {},
    "cv_submissions": {},
}

def _is_mock_env() -> bool:
    settings = get_settings()
    url = settings.supabase_url or ""
    return "your-project" in url or "example" in url or not url.startswith("http")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _single(response) -> Optional[dict]:
    data = response.data
    if not data:
        return None
    return data[0] if isinstance(data, list) else data


def _require(response, entity: str) -> dict:
    row = _single(response)
    if row is None:
        raise ValueError(f"{entity} not found")
    return row


class RunRepository:
    def __init__(self, client: Optional[Client] = None):
        self.use_mock = _is_mock_env()
        if not self.use_mock:
            try:
                self.client = client or get_supabase_service_client()
            except Exception:
                self.use_mock = True

    def create_run(self, student_id: str, problem_id: str) -> dict:
        run_id = str(uuid4())
        now = _now_iso()
        payload = {
            "id": run_id,
            "student_id": student_id,
            "problem_id": str(problem_id),
            "state": "SUBMITTED",
            "llm_calls_used": 0,
            "max_llm_calls": 5,
            "violation_reason": None,
            "created_at": now,
            "updated_at": now,
            "finished_at": None,
        }
        if self.use_mock:
            _MEM_DB["student_runs"][run_id] = payload
            return payload

        try:
            response = self.client.table("student_runs").insert(payload).execute()
            return _require(response, "StudentRun")
        except Exception:
            _MEM_DB["student_runs"][run_id] = payload
            return payload

    def get_run(self, run_id: str) -> Optional[dict]:
        if self.use_mock or run_id in _MEM_DB["student_runs"]:
            return _MEM_DB["student_runs"].get(run_id)

        try:
            response = (
                self.client.table("student_runs").select("*").eq("id", run_id).execute()
            )
            return _single(response)
        except Exception:
            return _MEM_DB["student_runs"].get(run_id)

    def list_all_runs(self) -> List[dict]:
        if self.use_mock or _MEM_DB["student_runs"]:
            return list(_MEM_DB["student_runs"].values())

        try:
            response = (
                self.client.table("student_runs")
                .select("*")
                .order("created_at", desc=True)
                .execute()
            )
            return response.data or []
        except Exception:
            return list(_MEM_DB["student_runs"].values())

    def update_run_state(self, run_id: str, new_state: str, violation_reason: Optional[str] = None) -> dict:
        now = _now_iso()
        if self.use_mock or run_id in _MEM_DB["student_runs"]:
            run = _MEM_DB["student_runs"].get(run_id)
            if not run:
                raise ValueError(f"Run {run_id} not found")
            run["state"] = new_state
            run["updated_at"] = now
            if violation_reason is not None:
                run["violation_reason"] = violation_reason
            if new_state == "FINISHED":
                run["finished_at"] = now
            return run

        payload: Dict[str, Any] = {"state": new_state, "updated_at": now}
        if violation_reason is not None:
            payload["violation_reason"] = violation_reason
        if new_state == "FINISHED":
            payload["finished_at"] = now

        try:
            response = (
                self.client.table("student_runs")
                .update(payload)
                .eq("id", run_id)
                .execute()
            )
            return _require(response, "StudentRun")
        except Exception:
            run = _MEM_DB["student_runs"].get(run_id, {})
            run.update(payload)
            return run

    def increment_llm_calls(self, run_id: str) -> dict:
        run = self.get_run(run_id)
        if run is None:
            raise ValueError(f"Run {run_id} not found")
        new_count = (run.get("llm_calls_used") or 0) + 1

        if self.use_mock or run_id in _MEM_DB["student_runs"]:
            run["llm_calls_used"] = new_count
            run["updated_at"] = _now_iso()
            return run

        try:
            response = (
                self.client.table("student_runs")
                .update({"llm_calls_used": new_count, "updated_at": _now_iso()})
                .eq("id", run_id)
                .execute()
            )
            return _require(response, "StudentRun")
        except Exception:
            run["llm_calls_used"] = new_count
            return run

    def get_full_run_state(self, run_id: str) -> dict:
        run = self.get_run(run_id)
        if run is None:
            raise ValueError(f"Run {run_id} not found")

        sub_repo = SubmissionRepository(getattr(self, "client", None))
        q_repo = QuestionRepository(getattr(self, "client", None))
        a_repo = AnswerRepository(getattr(self, "client", None))
        v_repo = VerdictRepository(getattr(self, "client", None))

        submissions = sub_repo.get_submissions_for_run(run_id)
        question = q_repo.get_question_for_run(run_id)
        answer = a_repo.get_answer_for_run(run_id)
        verdict = v_repo.get_verdict_for_run(run_id)

        original = next(
            (s for s in submissions if s.get("submission_type") == "ORIGINAL"), None
        )
        revision = next(
            (s for s in submissions if s.get("submission_type") == "REVISION"), None
        )

        return {
            "run_id": run["id"],
            "state": run["state"],
            "problem_id": run["problem_id"],
            "llm_calls_used": run.get("llm_calls_used", 0),
            "created_at": run["created_at"],
            "updated_at": run["updated_at"],
            "original_submission": original,
            "diagnostic_question": question,
            "student_answer": answer,
            "revision_submission": revision,
            "verdict": verdict,
            "violation_reason": run.get("violation_reason"),
        }


class SubmissionRepository:
    def __init__(self, client: Optional[Client] = None):
        self.use_mock = _is_mock_env()
        if not self.use_mock:
            try:
                self.client = client or get_supabase_service_client()
            except Exception:
                self.use_mock = True

    def create_submission(
        self,
        run_id: str,
        code: str,
        submission_type: str,
        execution_evidence: Optional[dict] = None,
        all_passed: Optional[bool] = None,
        pass_count: int = 0,
        fail_count: int = 0,
        execution_time_ms: int = 0,
    ) -> dict:
        submission_id = str(uuid4())
        now = _now_iso()
        payload = {
            "id": submission_id,
            "run_id": run_id,
            "submission_type": submission_type,
            "code": code,
            "execution_evidence": execution_evidence,
            "all_passed": all_passed,
            "pass_count": pass_count,
            "fail_count": fail_count,
            "execution_time_ms": execution_time_ms,
            "created_at": now,
        }
        if self.use_mock:
            _MEM_DB["code_submissions"][submission_id] = payload
            return payload

        try:
            response = self.client.table("code_submissions").insert(payload).execute()
            return _require(response, "CodeSubmission")
        except Exception:
            _MEM_DB["code_submissions"][submission_id] = payload
            return payload

    def update_submission_evidence(
        self,
        submission_id: str,
        execution_evidence: dict,
        all_passed: bool,
        pass_count: int,
        fail_count: int,
        execution_time_ms: int = 0,
    ) -> dict:
        update_data = {
            "execution_evidence": execution_evidence,
            "all_passed": all_passed,
            "pass_count": pass_count,
            "fail_count": fail_count,
            "execution_time_ms": execution_time_ms,
        }
        if self.use_mock or submission_id in _MEM_DB["code_submissions"]:
            sub = _MEM_DB["code_submissions"].get(submission_id)
            if sub:
                sub.update(update_data)
                return sub

        try:
            response = (
                self.client.table("code_submissions")
                .update(update_data)
                .eq("id", submission_id)
                .execute()
            )
            return _require(response, "CodeSubmission")
        except Exception:
            sub = _MEM_DB["code_submissions"].get(submission_id, {})
            sub.update(update_data)
            return sub

    def get_submissions_for_run(self, run_id: str) -> List[dict]:
        mem_subs = [
            s for s in _MEM_DB["code_submissions"].values() if s.get("run_id") == run_id
        ]
        if self.use_mock or mem_subs:
            return sorted(mem_subs, key=lambda s: s.get("created_at", ""))

        try:
            response = (
                self.client.table("code_submissions")
                .select("*")
                .eq("run_id", run_id)
                .order("created_at")
                .execute()
            )
            return response.data or []
        except Exception:
            return mem_subs


class QuestionRepository:
    def __init__(self, client: Optional[Client] = None):
        self.use_mock = _is_mock_env()
        if not self.use_mock:
            try:
                self.client = client or get_supabase_service_client()
            except Exception:
                self.use_mock = True

    def create_question(
        self,
        run_id: str,
        question_text: str,
        failure_summary: str,
        most_useful_failure: Optional[dict] = None,
    ) -> dict:
        question_id = str(uuid4())
        now = _now_iso()
        payload = {
            "id": question_id,
            "run_id": run_id,
            "question_text": question_text,
            "failure_summary": failure_summary,
            "most_useful_failure": most_useful_failure,
            "created_at": now,
        }
        if self.use_mock:
            _MEM_DB["diagnostic_questions"][run_id] = payload
            return payload

        try:
            response = self.client.table("diagnostic_questions").insert(payload).execute()
            return _require(response, "DiagnosticQuestion")
        except Exception:
            _MEM_DB["diagnostic_questions"][run_id] = payload
            return payload

    def get_question_for_run(self, run_id: str) -> Optional[dict]:
        if self.use_mock or run_id in _MEM_DB["diagnostic_questions"]:
            return _MEM_DB["diagnostic_questions"].get(run_id)

        try:
            response = (
                self.client.table("diagnostic_questions")
                .select("*")
                .eq("run_id", run_id)
                .limit(1)
                .execute()
            )
            return _single(response)
        except Exception:
            return _MEM_DB["diagnostic_questions"].get(run_id)


class AnswerRepository:
    def __init__(self, client: Optional[Client] = None):
        self.use_mock = _is_mock_env()
        if not self.use_mock:
            try:
                self.client = client or get_supabase_service_client()
            except Exception:
                self.use_mock = True

    def create_answer(self, run_id: str, answer_text: str) -> dict:
        answer_id = str(uuid4())
        now = _now_iso()
        payload = {
            "id": answer_id,
            "run_id": run_id,
            "answer_text": answer_text,
            "submitted_at": now,
        }
        if self.use_mock:
            _MEM_DB["student_answers"][run_id] = payload
            return payload

        try:
            response = self.client.table("student_answers").insert(payload).execute()
            return _require(response, "StudentAnswer")
        except Exception:
            _MEM_DB["student_answers"][run_id] = payload
            return payload

    def get_answer_for_run(self, run_id: str) -> Optional[dict]:
        if self.use_mock or run_id in _MEM_DB["student_answers"]:
            return _MEM_DB["student_answers"].get(run_id)

        try:
            response = (
                self.client.table("student_answers")
                .select("*")
                .eq("run_id", run_id)
                .limit(1)
                .execute()
            )
            return _single(response)
        except Exception:
            return _MEM_DB["student_answers"].get(run_id)


class VerdictRepository:
    def __init__(self, client: Optional[Client] = None):
        self.use_mock = _is_mock_env()
        if not self.use_mock:
            try:
                self.client = client or get_supabase_service_client()
            except Exception:
                self.use_mock = True

    def create_verdict(
        self,
        run_id: str,
        verdict: str,
        rationale: str,
        evidence_summary: Optional[dict] = None,
        recommendation: Optional[str] = "HIRE",
        code_score: Optional[int] = 100,
        reasoning_score: Optional[int] = 100,
        composite_score: Optional[int] = 100,
        ideal_reasoning: Optional[str] = None,
        reasoning_comparison: Optional[dict] = None,
        executive_summary: Optional[str] = None,
    ) -> dict:
        verdict_id = str(uuid4())
        now = _now_iso()
        payload = {
            "id": verdict_id,
            "run_id": run_id,
            "verdict": verdict,
            "rationale": rationale,
            "evidence_summary": evidence_summary,
            "recommendation": recommendation,
            "code_score": code_score,
            "reasoning_score": reasoning_score,
            "composite_score": composite_score,
            "ideal_reasoning": ideal_reasoning,
            "reasoning_comparison": reasoning_comparison,
            "executive_summary": executive_summary,
            "created_at": now,
        }
        if self.use_mock:
            _MEM_DB["verdicts"][run_id] = payload
            return payload

        try:
            response = self.client.table("verdicts").insert(payload).execute()
            return _require(response, "Verdict")
        except Exception:
            _MEM_DB["verdicts"][run_id] = payload
            return payload

    def get_verdict_for_run(self, run_id: str) -> Optional[dict]:
        if self.use_mock or run_id in _MEM_DB["verdicts"]:
            return _MEM_DB["verdicts"].get(run_id)

        try:
            response = (
                self.client.table("verdicts")
                .select("*")
                .eq("run_id", run_id)
                .limit(1)
                .execute()
            )
            return _single(response)
        except Exception:
            return _MEM_DB["verdicts"].get(run_id)


class ProblemRepository:
    def __init__(self, client: Optional[Client] = None):
        self.use_mock = _is_mock_env()
        if not self.use_mock:
            try:
                self.client = client or get_supabase_service_client()
            except Exception:
                self.use_mock = True

    def get_problem(self, problem_id: str) -> Optional[dict]:
        from app.api.problems import BUILTIN_PROBLEMS
        for p in BUILTIN_PROBLEMS:
            if p["id"] == str(problem_id) or p["slug"] == str(problem_id):
                return p

        if self.use_mock:
            return None

        try:
            response = (
                self.client.table("problems")
                .select("*")
                .eq("id", str(problem_id))
                .eq("is_active", True)
                .execute()
            )
            return _single(response)
        except Exception:
            return None

    def list_problems(self) -> List[dict]:
        if not self.use_mock:
            try:
                response = (
                    self.client.table("problems")
                    .select("id, title, slug, description, difficulty, constraints, examples, starter_code, function_signature")
                    .eq("is_active", True)
                    .order("created_at")
                    .execute()
                )
                if response.data:
                    return response.data
            except Exception:
                pass
        from app.api.problems import BUILTIN_PROBLEMS
        return BUILTIN_PROBLEMS

    def get_test_cases(self, problem_id: str) -> List[dict]:
        from app.api.problems import BUILTIN_PROBLEMS
        for p in BUILTIN_PROBLEMS:
            if p["id"] == str(problem_id) or p["slug"] == str(problem_id):
                return p.get("test_cases", [])

        if not self.use_mock:
            try:
                response = (
                    self.client.table("test_cases")
                    .select("*")
                    .eq("problem_id", str(problem_id))
                    .order("order_index")
                    .execute()
                )
                return response.data or []
            except Exception:
                pass
        return []

    def get_visible_test_cases(self, problem_id: str) -> List[dict]:
        all_cases = self.get_test_cases(problem_id)
        return [tc for tc in all_cases if not tc.get("is_hidden")]


# ── CV Repository ────────────────────────────────────────────────────────────

class CVRepository:
    """Stores and retrieves CV analysis reports."""

    def __init__(self):
        self.use_mock = _is_mock_env()

    def _compute_percentile(self, cv_score: int) -> int:
        """Compute percentile rank of this cv_score vs all stored CVs."""
        all_scores = [
            v.get("cv_score", 0)
            for v in _MEM_DB["cv_submissions"].values()
            if v.get("cv_score") is not None
        ]
        if not all_scores:
            return 50
        below = sum(1 for s in all_scores if s < cv_score)
        return int((below / len(all_scores)) * 100)

    def _attach_cumulative(self, record: dict) -> dict:
        """
        Joins with the latest verdict for the candidate and computes:
        cumulative = (test_composite * 0.6) + (cv_score * 0.4)
        """
        candidate_id = record.get("candidate_id", "")
        cv_score = record.get("cv_score") or 0

        # Find latest finished run for this candidate
        test_composite = None
        runs = sorted(
            [r for r in _MEM_DB["student_runs"].values() if r.get("student_id") == candidate_id],
            key=lambda r: r.get("created_at", ""),
            reverse=True,
        )
        for run in runs:
            run_id = run.get("id", "")
            verdict = _MEM_DB["verdicts"].get(run_id)
            if verdict and verdict.get("composite_score") is not None:
                test_composite = verdict["composite_score"]
                break

        record["test_composite_score"] = test_composite
        if test_composite is not None:
            record["cumulative_score"] = int(round(test_composite * 0.75 + cv_score * 0.25))
        else:
            record["cumulative_score"] = None
        return record

    def save_cv(self, report: dict) -> dict:
        """Save a CV analysis report. Updates percentile for all stored CVs."""
        cv_id = report["cv_id"]
        _MEM_DB["cv_submissions"][cv_id] = report

        # Recompute percentiles for all stored CVs now that we have a new data point
        all_scores = [v.get("cv_score", 0) for v in _MEM_DB["cv_submissions"].values()]
        for vid, rec in _MEM_DB["cv_submissions"].items():
            score = rec.get("cv_score", 0)
            below = sum(1 for s in all_scores if s < score)
            rec["percentile"] = int((below / len(all_scores)) * 100) if all_scores else 50

        return self._attach_cumulative(_MEM_DB["cv_submissions"][cv_id])

    def get_cv(self, cv_id: str) -> Optional[dict]:
        rec = _MEM_DB["cv_submissions"].get(cv_id)
        if rec:
            return self._attach_cumulative(dict(rec))
        return None

    def get_cv_by_candidate(self, candidate_id: str) -> Optional[dict]:
        """Return the most recent CV for a candidate."""
        records = [
            v for v in _MEM_DB["cv_submissions"].values()
            if v.get("candidate_id") == candidate_id
        ]
        if not records:
            return None
        latest = max(records, key=lambda r: r.get("created_at", ""))
        return self._attach_cumulative(dict(latest))

    def list_all_cvs(self) -> List[dict]:
        return [
            self._attach_cumulative(dict(v))
            for v in sorted(
                _MEM_DB["cv_submissions"].values(),
                key=lambda r: r.get("created_at", ""),
                reverse=True,
            )
        ]

    def update_cv_status(self, cv_id: str, status: str) -> None:
        if cv_id in _MEM_DB["cv_submissions"]:
            _MEM_DB["cv_submissions"][cv_id]["status"] = status

    def cv_repo_raw_save(self, cv_id: str, record: dict) -> None:
        """Save a raw record (e.g. pending state) without analysis."""
        _MEM_DB["cv_submissions"][cv_id] = record

