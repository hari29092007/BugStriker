"""
BugStriker Orchestrator:
Coordinates the state machine, test execution, LLM agents, and database persistence.
Enforces all constraints:
- Maximum 1 diagnostic question
- Maximum 1 student explanation
- Maximum 1 code revision
- Maximum 2 code executions
- Maximum 5 LLM calls per run
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

from app.agent.bug_analyzer import analyze_code_bugs
from app.agent.evaluator import evaluate_failures
from app.agent.question_generator import generate_diagnostic_question
from app.agent.state_machine import RunState, StateMachine, InvalidTransitionError
from app.agent.verdict import evaluate_verdict
from app.database.repositories import (
    AnswerRepository,
    ProblemRepository,
    QuestionRepository,
    RunRepository,
    SubmissionRepository,
    VerdictRepository,
)
from app.execution.sandbox import execute_code
from app.models.test_result import ExecutionEvidence
from app.config import get_settings
from app.core.network import ensure_network_connected, NetworkDisconnectedError


class RunOrchestrator:
    def __init__(
        self,
        run_repo: RunRepository,
        sub_repo: SubmissionRepository,
        q_repo: QuestionRepository,
        a_repo: AnswerRepository,
        v_repo: VerdictRepository,
        problem_repo: ProblemRepository,
    ):
        self.run_repo = run_repo
        self.sub_repo = sub_repo
        self.q_repo = q_repo
        self.a_repo = a_repo
        self.v_repo = v_repo
        self.problem_repo = problem_repo

    def _check_llm_limit(self, run: dict) -> None:
        used = run.get("llm_calls_used", 0)
        max_calls = run.get("max_llm_calls", 5)
        if used >= max_calls:
            raise RuntimeError(
                f"LLM call limit reached ({used}/{max_calls}). Run cannot make more AI requests."
            )

    async def handle_initial_submission(
        self,
        run_id: str,
        code: str,
        student_id: str,
    ) -> dict:
        """
        Flow:
        SUBMITTED -> RUNNING_TESTS -> ANALYZING -> (QUESTIONING / FINISHED)
        """
        if get_settings().require_network:
            ensure_network_connected()

        run = self.run_repo.get_run(run_id)
        if not run:
            raise ValueError(f"Run {run_id} not found")

        current_state = RunState(run["state"])
        sm = StateMachine(current_state)

        # Ensure we are in SUBMITTED state
        if current_state != RunState.SUBMITTED:
            raise InvalidTransitionError(
                f"Cannot submit initial code when run is in state {current_state}"
            )

        problem_id = run["problem_id"]
        problem = self.problem_repo.get_problem(problem_id)
        if not problem:
            raise ValueError(f"Problem {problem_id} not found")

        test_cases = self.problem_repo.get_test_cases(problem_id)
        function_name = problem.get("function_signature") or problem.get("slug") or "solution"

        # Transition to RUNNING_TESTS
        sm.transition(RunState.RUNNING_TESTS)
        self.run_repo.update_run_state(run_id, RunState.RUNNING_TESTS.value)

        # Create original submission record
        sub = self.sub_repo.create_submission(
            run_id=run_id,
            code=code,
            submission_type="ORIGINAL",
        )

        # Execute tests
        evidence: ExecutionEvidence = execute_code(
            code=code,
            function_name=function_name,
            test_cases=test_cases,
            submission_id=sub["id"],
        )

        # Persist test evidence
        self.sub_repo.update_submission_evidence(
            submission_id=sub["id"],
            execution_evidence=evidence.model_dump(),
            all_passed=evidence.all_passed,
            pass_count=evidence.pass_count,
            fail_count=evidence.fail_count,
            execution_time_ms=evidence.execution_time_ms,
        )

        # Transition to ANALYZING
        sm.transition(RunState.ANALYZING)
        self.run_repo.update_run_state(run_id, RunState.ANALYZING.value)

        # Check if code passed all tests on initial submission
        if evidence.all_passed:
            # AUTO_PASS directly to FINISHED
            sm.transition(RunState.FINISHED)
            self.run_repo.update_run_state(run_id, RunState.FINISHED.value)
            self.v_repo.create_verdict(
                run_id=run_id,
                verdict="AUTO_PASS",
                rationale="All test cases passed on the initial submission. No debugging required!",
                evidence_summary=evidence.model_dump(),
            )
            return self.run_repo.get_full_run_state(run_id)

        # ── Deep Bug Analysis (line-by-line) ────────────────────────────────
        # Runs before any LLM call so every downstream agent gets bug context.
        bug_report_obj = await analyze_code_bugs(problem, code, evidence)
        bug_report_dict = bug_report_obj.to_dict()

        # Code failed one or more tests -> run Evaluator agent (LLM call 1)
        self._check_llm_limit(run)
        eval_result = await evaluate_failures(problem, code, evidence, bug_report=bug_report_dict)
        self.run_repo.increment_llm_calls(run_id)

        # Transition to QUESTIONING
        sm.transition(RunState.QUESTIONING)
        self.run_repo.update_run_state(run_id, RunState.QUESTIONING.value)

        # Generate diagnostic question — pinned to specific buggy lines (LLM call 2)
        run = self.run_repo.get_run(run_id)
        self._check_llm_limit(run)

        most_useful_failure = eval_result.get("most_useful_failure") or {}
        failure_summary = eval_result.get("failure_summary", "")

        question_text = await generate_diagnostic_question(
            problem=problem,
            code=code,
            most_useful_failure=most_useful_failure,
            failure_summary=failure_summary,
            bug_report=bug_report_dict,
        )
        self.run_repo.increment_llm_calls(run_id)

        # Persist question
        self.q_repo.create_question(
            run_id=run_id,
            question_text=question_text,
            failure_summary=failure_summary,
            most_useful_failure=most_useful_failure,
        )

        # Automatically step into WAITING_FOR_STUDENT
        sm.transition(RunState.WAITING_FOR_STUDENT)
        self.run_repo.update_run_state(run_id, RunState.WAITING_FOR_STUDENT.value)

        return self.run_repo.get_full_run_state(run_id)

    async def handle_explanation(
        self,
        run_id: str,
        explanation: str,
        student_id: str,
    ) -> dict:
        """
        Student submits explanation while in WAITING_FOR_STUDENT state.
        Transition: WAITING_FOR_STUDENT -> REVISION
        """
        if get_settings().require_network:
            ensure_network_connected()

        run = self.run_repo.get_run(run_id)
        if not run:
            raise ValueError(f"Run {run_id} not found")

        current_state = RunState(run["state"])
        sm = StateMachine(current_state)

        if current_state != RunState.WAITING_FOR_STUDENT:
            raise InvalidTransitionError(
                f"Cannot submit explanation in state {current_state}. Expected WAITING_FOR_STUDENT."
            )

        # Check if already submitted explanation
        existing_answer = self.a_repo.get_answer_for_run(run_id)
        if existing_answer:
            raise ValueError("Student has already submitted an explanation for this run.")

        # Persist answer
        self.a_repo.create_answer(run_id=run_id, answer_text=explanation)

        # Transition to REVISION state
        sm.transition(RunState.REVISION)
        self.run_repo.update_run_state(run_id, RunState.REVISION.value)

        return self.run_repo.get_full_run_state(run_id)

    async def handle_revision(
        self,
        run_id: str,
        code: str,
        student_id: str,
    ) -> dict:
        """
        Student submits revised code.
        Transition: REVISION -> RUNNING_TESTS -> ANALYZING -> FINISHED
        """
        if get_settings().require_network:
            ensure_network_connected()

        run = self.run_repo.get_run(run_id)
        if not run:
            raise ValueError(f"Run {run_id} not found")

        current_state = RunState(run["state"])
        sm = StateMachine(current_state)

        if current_state != RunState.REVISION:
            raise InvalidTransitionError(
                f"Cannot submit revision in state {current_state}. Expected REVISION."
            )

        problem_id = run["problem_id"]
        problem = self.problem_repo.get_problem(problem_id)
        if not problem:
            raise ValueError(f"Problem {problem_id} not found")

        test_cases = self.problem_repo.get_test_cases(problem_id)
        function_name = problem.get("function_signature") or problem.get("slug") or "solution"

        # Transition to RUNNING_TESTS
        sm.transition(RunState.RUNNING_TESTS)
        self.run_repo.update_run_state(run_id, RunState.RUNNING_TESTS.value)

        # Create revision submission record
        sub = self.sub_repo.create_submission(
            run_id=run_id,
            code=code,
            submission_type="REVISION",
        )

        # Execute tests a second time
        evidence: ExecutionEvidence = execute_code(
            code=code,
            function_name=function_name,
            test_cases=test_cases,
            submission_id=sub["id"],
        )

        # Persist revision evidence
        self.sub_repo.update_submission_evidence(
            submission_id=sub["id"],
            execution_evidence=evidence.model_dump(),
            all_passed=evidence.all_passed,
            pass_count=evidence.pass_count,
            fail_count=evidence.fail_count,
            execution_time_ms=evidence.execution_time_ms,
        )

        # Transition to ANALYZING
        sm.transition(RunState.ANALYZING)
        self.run_repo.update_run_state(run_id, RunState.ANALYZING.value)

        # Gather all evidence for final verdict
        all_submissions = self.sub_repo.get_submissions_for_run(run_id)
        original_sub = next(
            (s for s in all_submissions if s.get("submission_type") == "ORIGINAL"),
            {},
        )
        orig_evidence = original_sub.get("execution_evidence") or {}
        diagnostic_q = self.q_repo.get_question_for_run(run_id)
        student_ans = self.a_repo.get_answer_for_run(run_id)
        explanation_text = student_ans.get("answer_text") if student_ans else ""

        # Re-run bug analysis on the original code for verdict grounding
        # (gives verdict.py the same bug context the question was based on)
        original_code_str = original_sub.get("code", "")
        from app.models.test_result import ExecutionEvidence as _EvidModel
        try:
            orig_ev_model = _EvidModel(**orig_evidence) if orig_evidence else None
        except Exception:
            orig_ev_model = None

        bug_report_for_verdict: dict = {}
        if original_code_str and orig_ev_model:
            try:
                orig_bug_obj = await analyze_code_bugs(problem, original_code_str, orig_ev_model)
                bug_report_for_verdict = orig_bug_obj.to_dict()
            except Exception as _e:
                print(f"Bug re-analysis for verdict failed: {_e}")

        # Produce verdict (LLM call 3)
        self._check_llm_limit(run)
        verdict_data = await evaluate_verdict(
            problem=problem,
            original_code=original_code_str,
            original_evidence=orig_evidence,
            diagnostic_question=diagnostic_q,
            student_explanation=explanation_text,
            revised_code=code,
            revision_evidence=evidence,
            bug_report=bug_report_for_verdict or None,
        )
        self.run_repo.increment_llm_calls(run_id)


        # Persist verdict with recruiter evaluation fields
        self.v_repo.create_verdict(
            run_id=run_id,
            verdict=verdict_data["verdict"],
            rationale=verdict_data["rationale"],
            evidence_summary=verdict_data.get("evidence_summary"),
            recommendation=verdict_data.get("recommendation", "HIRE"),
            code_score=verdict_data.get("code_score", 100),
            reasoning_score=verdict_data.get("reasoning_score", 100),
            composite_score=verdict_data.get("composite_score", 100),
            ideal_reasoning=verdict_data.get("ideal_reasoning"),
            reasoning_comparison=verdict_data.get("reasoning_comparison"),
            executive_summary=verdict_data.get("executive_summary"),
        )

        # Transition to FINISHED
        sm.transition(RunState.FINISHED)
        self.run_repo.update_run_state(run_id, RunState.FINISHED.value)

        return self.run_repo.get_full_run_state(run_id)
