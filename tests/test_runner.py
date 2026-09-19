"""
Unit tests for the subprocess execution runner.
"""
import pytest
from app.execution.runner import run_test_case, run_all_tests


def test_runner_passing_test_case():
    code = """
def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
"""
    result = run_test_case(
        code=code,
        function_name="two_sum",
        input_data={"nums": [2, 7, 11, 15], "target": 9},
        expected_output=[0, 1],
        test_id="t1",
        description="Basic two sum test",
        timeout=3,
    )
    assert result.passed is True
    assert result.error is None
    assert result.actual_output == [0, 1]


def test_runner_failing_test_case():
    # Buggy code returning wrong result
    code = """
def two_sum(nums, target):
    return [0, 0]
"""
    result = run_test_case(
        code=code,
        function_name="two_sum",
        input_data={"nums": [2, 7, 11, 15], "target": 9},
        expected_output=[0, 1],
        test_id="t2",
        description="Failing test",
        timeout=3,
    )
    assert result.passed is False
    assert result.actual_output == [0, 0]


def test_runner_runtime_error_capture():
    code = """
def two_sum(nums, target):
    raise ValueError("Something broke inside student code")
"""
    result = run_test_case(
        code=code,
        function_name="two_sum",
        input_data={"nums": [2, 7, 11, 15], "target": 9},
        expected_output=[0, 1],
        test_id="t3",
        description="Runtime exception",
        timeout=3,
    )
    assert result.passed is False
    assert result.error is not None
    assert "Something broke" in result.error


def test_runner_timeout_enforcement():
    code = """
def two_sum(nums, target):
    while True:
        pass
"""
    result = run_test_case(
        code=code,
        function_name="two_sum",
        input_data={"nums": [2, 7, 11, 15], "target": 9},
        expected_output=[0, 1],
        test_id="t4",
        description="Timeout test",
        timeout=1,
    )
    assert result.passed is False
    assert "Time limit exceeded" in (result.error or "")


def test_runner_run_all_tests():
    code = """
def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
"""
    test_cases = [
        {"id": "tc1", "input_data": {"nums": [2, 7, 11, 15], "target": 9}, "expected_output": [0, 1], "description": "Case 1"},
        {"id": "tc2", "input_data": {"nums": [3, 2, 4], "target": 6}, "expected_output": [1, 2], "description": "Case 2"},
    ]
    evidence = run_all_tests(
        code=code,
        function_name="two_sum",
        test_cases=test_cases,
        timeout=3,
    )
    assert evidence.all_passed is True
    assert evidence.pass_count == 2
    assert evidence.fail_count == 0
