"""
Integration tests for BugStriker API endpoints and agentic loop.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "bugstriker-api"


def test_list_problems():
    response = client.get("/api/problems/")
    assert response.status_code == 200
    problems = response.json()
    assert len(problems) >= 1
    assert any(p["slug"] == "two-sum" for p in problems)


def test_get_single_problem():
    response = client.get("/api/problems/two-sum")
    assert response.status_code == 200
    prob = response.json()
    assert prob["title"] == "Two Sum"
    assert "starter_code" in prob
    assert len(prob["test_cases"]) > 0


def test_full_agentic_debugging_flow():
    # 1. Create a run for Two Sum
    create_res = client.post(
        "/api/runs/",
        json={"problem_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"},
        headers={"Authorization": "Bearer dev-student-1"},
    )
    assert create_res.status_code == 201
    run_id = create_res.json()["run_id"]
    assert run_id is not None

    # 2. Submit a BUGGY solution that fails tests
    buggy_code = """
def two_sum(nums: list[int], target: int) -> list[int]:
    # Definitively buggy implementation
    return [-99, -99]
"""
    submit_res = client.post(
        f"/api/runs/{run_id}/submit",
        json={"code": buggy_code},
        headers={"Authorization": "Bearer dev-student-1"},
    )
    assert submit_res.status_code == 200
    state_data = submit_res.json()

    # Must transition through RUNNING_TESTS -> ANALYZING -> QUESTIONING -> WAITING_FOR_STUDENT
    assert state_data["state"] == "WAITING_FOR_STUDENT"
    assert state_data["diagnostic_question"] is not None
    assert len(state_data["diagnostic_question"]["question_text"]) > 0
    assert state_data["llm_calls_used"] >= 1

    # 3. Student submits explanation for the bug
    explain_res = client.post(
        f"/api/runs/{run_id}/explain",
        json={
            "explanation": "My loop only checked adjacent pairs i and i+1 instead of checking all possible pairs i and j."
        },
        headers={"Authorization": "Bearer dev-student-1"},
    )
    assert explain_res.status_code == 200
    explain_data = explain_res.json()
    assert explain_data["state"] == "REVISION"
    assert explain_data["student_answer"] is not None

    # 4. Student submits REVISED code
    fixed_code = """
def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
"""
    revise_res = client.post(
        f"/api/runs/{run_id}/revise",
        json={"code": fixed_code},
        headers={"Authorization": "Bearer dev-student-1"},
    )
    assert revise_res.status_code == 200
    verdict_data = revise_res.json()

    # Must reach FINISHED and produce verdict
    assert verdict_data["state"] == "FINISHED"
    assert verdict_data["verdict"] is not None
    assert verdict_data["verdict"]["verdict"] in ("VERIFIED", "PARTIAL")
    assert len(verdict_data["verdict"]["rationale"]) > 0


def test_auto_pass_flow():
    # If student submits perfect code on first attempt, it auto-passes directly to FINISHED
    create_res = client.post(
        "/api/runs/",
        json={"problem_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"},
        headers={"Authorization": "Bearer dev-student-2"},
    )
    run_id = create_res.json()["run_id"]

    correct_code = """
def two_sum(nums: list[int], target: int) -> list[int]:
    lookup = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in lookup:
            return [lookup[diff], i]
        lookup[n] = i
    return []
"""
    submit_res = client.post(
        f"/api/runs/{run_id}/submit",
        json={"code": correct_code},
        headers={"Authorization": "Bearer dev-student-2"},
    )
    assert submit_res.status_code == 200
    state_data = submit_res.json()
    assert state_data["state"] == "FINISHED"
    assert state_data["verdict"]["verdict"] == "AUTO_PASS"


def test_recruiter_endpoints_and_reasoning_benchmark():
    # 1. Create and complete a full debugging run
    create_res = client.post(
        "/api/runs/",
        json={"problem_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"},
        headers={"Authorization": "Bearer dev-student-recruiter-test"},
    )
    run_id = create_res.json()["run_id"]

    # Submit buggy code
    client.post(
        f"/api/runs/{run_id}/submit",
        json={"code": "def two_sum(nums, target):\n    return [-99, -99]\n"},
        headers={"Authorization": "Bearer dev-student-recruiter-test"},
    )

    # Submit reasoning explanation
    explanation = "The algorithm failed because it returned hardcoded -99 indices instead of mapping values to their indices in a hash map to find the complement target - num."
    client.post(
        f"/api/runs/{run_id}/explain",
        json={"explanation": explanation},
        headers={"Authorization": "Bearer dev-student-recruiter-test"},
    )

    # Submit revised code
    fixed_code = """
def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
"""
    client.post(
        f"/api/runs/{run_id}/revise",
        json={"code": fixed_code},
        headers={"Authorization": "Bearer dev-student-recruiter-test"},
    )

    # 2. Verify Candidate View MASKS recruiter scores and recommendation
    candidate_res = client.get(
        f"/api/runs/{run_id}",
        headers={"Authorization": "Bearer dev-student-recruiter-test"},
    )
    assert candidate_res.status_code == 200
    candidate_data = candidate_res.json()
    assert candidate_data["verdict"]["verdict"] == "SUBMITTED_FOR_REVIEW"
    assert "code_score" not in candidate_data["verdict"] or candidate_data["verdict"]["code_score"] is None
    assert "recommendation" not in candidate_data["verdict"] or candidate_data["verdict"]["recommendation"] is None

    # 3. Verify Recruiter Runs List contains the candidate and scores
    recruiter_list_res = client.get(
        "/api/recruiter/runs",
        headers={"Authorization": "Bearer dev-recruiter"},
    )
    assert recruiter_list_res.status_code == 200
    runs_list = recruiter_list_res.json()
    assert len(runs_list) > 0

    candidate_summary = next((r for r in runs_list if r["run_id"] == run_id), None)
    assert candidate_summary is not None
    assert candidate_summary["problem_title"] == "Two Sum"
    assert candidate_summary["code_score"] == 100
    assert candidate_summary["reasoning_score"] is not None
    assert candidate_summary["composite_score"] is not None
    assert candidate_summary["recommendation"] in ("STRONG_HIRE", "HIRE", "LEAN_NO_HIRE", "NO_HIRE")

    # 4. Verify Recruiter Detailed Dossier contains ideal reasoning comparison
    dossier_res = client.get(
        f"/api/recruiter/runs/{run_id}",
        headers={"Authorization": "Bearer dev-recruiter"},
    )
    assert dossier_res.status_code == 200
    dossier = dossier_res.json()
    verdict = dossier["run_state"]["verdict"]

    # Verify dual evaluation: both code and reasoning scores present
    assert verdict["code_score"] == 100
    assert verdict["reasoning_score"] >= 50
    assert verdict["composite_score"] >= 70

    # Verify ideal reasoning benchmark & side-by-side comparison
    assert verdict["ideal_reasoning"] is not None
    assert len(verdict["ideal_reasoning"]) > 20
    assert verdict["reasoning_comparison"] is not None
    assert verdict["reasoning_comparison"]["candidate_explanation"] == explanation
    assert len(verdict["reasoning_comparison"]["key_strengths"]) > 0


def test_cv_upload_and_unified_dossier_cumulative():
    # 1. Create and complete a run
    student_auth = "Bearer dev-student-cv-test"
    create_res = client.post(
        "/api/runs/",
        json={"problem_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"},
        headers={"Authorization": student_auth},
    )
    run_id = create_res.json()["run_id"]

    # Submit code and auto-pass
    correct_code = """
def two_sum(nums: list[int], target: int) -> list[int]:
    lookup = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in lookup:
            return [lookup[diff], i]
        lookup[n] = i
    return []
"""
    client.post(
        f"/api/runs/{run_id}/submit",
        json={"code": correct_code},
        headers={"Authorization": student_auth},
    )

    # 2. Upload CV for this run
    cv_content = b"""
    Jane Developer
    Full Stack Engineer with 4 years of experience.
    Technical Skills: Python, FastAPI, React, PostgreSQL, Docker, AWS, Git.
    Education: B.Tech in Computer Science from National Institute of Technology.
    Projects: Built microservices platform and distributed cache using Redis.
    """
    upload_res = client.post(
        "/api/cv/upload",
        files={"file": ("resume.txt", cv_content, "text/plain")},
        data={"run_id": run_id},
        headers={"Authorization": student_auth},
    )
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert upload_data["status"] == "SUBMITTED"
    assert "Your CV has been submitted" in upload_data["message"]

    # 3. Verify Recruiter Runs List has CV score and 75/25 cumulative score
    recruiter_list_res = client.get(
        "/api/recruiter/runs",
        headers={"Authorization": "Bearer dev-recruiter"},
    )
    assert recruiter_list_res.status_code == 200
    runs = recruiter_list_res.json()
    candidate_summary = next((r for r in runs if r["run_id"] == run_id), None)
    assert candidate_summary is not None
    assert candidate_summary["composite_score"] is not None
    assert candidate_summary["cv_score"] is not None
    expected_cumulative = int(round(candidate_summary["composite_score"] * 0.75 + candidate_summary["cv_score"] * 0.25))
    assert candidate_summary["cumulative_score"] == expected_cumulative

    # 4. Verify Unified Recruiter Dossier contains both Test details and CV details
    dossier_res = client.get(
        f"/api/recruiter/runs/{run_id}",
        headers={"Authorization": "Bearer dev-recruiter"},
    )
    assert dossier_res.status_code == 200
    dossier = dossier_res.json()
    assert dossier["cumulative_score"] == expected_cumulative
    assert dossier["cv_report"] is not None
    assert dossier["cv_report"]["cv_score"] == candidate_summary["cv_score"]
    assert len(dossier["cv_report"]["dimensions"]) > 0
    assert len(dossier["cv_report"]["extracted_skills"]) > 0

