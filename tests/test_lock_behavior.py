"""
Tests ensuring lock behavior, state constraints, and anti-cheating limits:
- Max 1 diagnostic question
- Max 1 student explanation
- Max 1 revision
- No double revision attempts
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_lock_prevents_out_of_order_explanation():
    create_res = client.post(
        "/api/runs/",
        json={"problem_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"},
        headers={"Authorization": "Bearer dev-student-lock"},
    )
    run_id = create_res.json()["run_id"]

    # Trying to explain BEFORE submitting code must be rejected (state is SUBMITTED)
    res = client.post(
        f"/api/runs/{run_id}/explain",
        json={"explanation": "Attempting to explain too early"},
        headers={"Authorization": "Bearer dev-student-lock"},
    )
    assert res.status_code == 409


def test_lock_prevents_multiple_revisions():
    # 1. Create run
    create_res = client.post(
        "/api/runs/",
        json={"problem_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"},
        headers={"Authorization": "Bearer dev-student-multi"},
    )
    run_id = create_res.json()["run_id"]

    # 2. Submit initial buggy code
    buggy_code = """
def two_sum(nums: list[int], target: int) -> list[int]:
    return [0, 0]
"""
    client.post(
        f"/api/runs/{run_id}/submit",
        json={"code": buggy_code},
        headers={"Authorization": "Bearer dev-student-multi"},
    )

    # 3. Submit explanation
    client.post(
        f"/api/runs/{run_id}/explain",
        json={"explanation": "I hardcoded [0,0] instead of calculating the target."},
        headers={"Authorization": "Bearer dev-student-multi"},
    )

    # 4. Submit first revision
    revised_code = """
def two_sum(nums: list[int], target: int) -> list[int]:
    lookup = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in lookup:
            return [lookup[diff], i]
        lookup[n] = i
    return []
"""
    rev1 = client.post(
        f"/api/runs/{run_id}/revise",
        json={"code": revised_code},
        headers={"Authorization": "Bearer dev-student-multi"},
    )
    assert rev1.status_code == 200
    assert rev1.json()["state"] == "FINISHED"

    # 5. ATTEMPT A SECOND REVISION — must be REJECTED!
    rev2 = client.post(
        f"/api/runs/{run_id}/revise",
        json={"code": revised_code},
        headers={"Authorization": "Bearer dev-student-multi"},
    )
    assert rev2.status_code == 409  # Invalid transition, run is already FINISHED


def test_lock_status_endpoint():
    create_res = client.post(
        "/api/runs/",
        json={"problem_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"},
        headers={"Authorization": "Bearer dev-student-status"},
    )
    run_id = create_res.json()["run_id"]

    lock_res = client.get(
        f"/api/runs/{run_id}/lock",
        headers={"Authorization": "Bearer dev-student-status"},
    )
    assert lock_res.status_code == 200
    lock_data = lock_res.json()
    assert "is_locked" in lock_data
    assert "state" in lock_data
    assert lock_data["state"] == "SUBMITTED"
