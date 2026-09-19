import subprocess
import sys
import json
import time
import textwrap
from typing import List, Any

from app.models.test_result import TestCaseResult, ExecutionEvidence


def run_test_case(
    code: str,
    function_name: str,
    input_data: dict,
    expected_output: Any,
    test_id: str,
    description: str,
    timeout: int = 5,
) -> TestCaseResult:
    """Run a single test case via subprocess."""

    # Build the test harness script.
    # We use json.dumps to safely embed the input so it can be deserialized.
    harness = textwrap.dedent(
        f"""
import sys
import json
import traceback

# ---- Student code ----
{code}
# ---- End student code ----

try:
    input_data = {json.dumps(input_data)}
    result = {function_name}(**input_data)
    print(json.dumps({{"result": result, "error": None}}))
except Exception as e:
    print(json.dumps({{"result": None, "error": str(e), "traceback": traceback.format_exc()}}))
"""
    )

    start = time.time()
    try:
        proc = subprocess.run(
            [sys.executable, "-c", harness],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        elapsed_ms = int((time.time() - start) * 1000)

        stdout = proc.stdout.strip()
        stderr = proc.stderr.strip()

        # Non-zero exit with no parseable stdout means a top-level crash
        if proc.returncode != 0 and not stdout:
            return TestCaseResult(
                test_id=test_id,
                description=description,
                input_data=input_data,
                expected_output=expected_output,
                stdout=stdout,
                stderr=stderr,
                passed=False,
                error=f"Process exited with code {proc.returncode}: {stderr[:500]}",
                execution_time_ms=elapsed_ms,
            )

        try:
            output = json.loads(stdout)
        except json.JSONDecodeError:
            return TestCaseResult(
                test_id=test_id,
                description=description,
                input_data=input_data,
                expected_output=expected_output,
                stdout=stdout,
                stderr=stderr,
                passed=False,
                error="Could not parse output as JSON",
                execution_time_ms=elapsed_ms,
            )

        if output.get("error"):
            return TestCaseResult(
                test_id=test_id,
                description=description,
                input_data=input_data,
                expected_output=expected_output,
                actual_output=None,
                stdout=stdout,
                stderr=stderr,
                passed=False,
                error=output["error"],
                execution_time_ms=elapsed_ms,
            )

        actual = output["result"]
        passed = _check_answer(actual, expected_output)

        return TestCaseResult(
            test_id=test_id,
            description=description,
            input_data=input_data,
            expected_output=expected_output,
            actual_output=actual,
            stdout=stdout,
            stderr=stderr,
            passed=passed,
            execution_time_ms=elapsed_ms,
        )

    except subprocess.TimeoutExpired:
        return TestCaseResult(
            test_id=test_id,
            description=description,
            input_data=input_data,
            expected_output=expected_output,
            passed=False,
            error=f"Time limit exceeded ({timeout}s)",
            execution_time_ms=timeout * 1000,
        )
    except Exception as e:
        return TestCaseResult(
            test_id=test_id,
            description=description,
            input_data=input_data,
            expected_output=expected_output,
            passed=False,
            error=str(e),
        )


def _check_answer(actual: Any, expected: Any) -> bool:
    """Flexible answer checking — handles sorted list comparison."""
    if actual == expected:
        return True
    # Try sorted comparison for lists (order-independent)
    if isinstance(actual, list) and isinstance(expected, list):
        try:
            return sorted(actual) == sorted(expected)
        except TypeError:
            pass
    return False


def run_all_tests(
    code: str,
    function_name: str,
    test_cases: List[dict],
    timeout: int = 5,
    submission_id: str = "unknown",
) -> ExecutionEvidence:
    """Run all test cases and return full execution evidence."""
    start = time.time()
    results: List[TestCaseResult] = []

    for tc in test_cases:
        result = run_test_case(
            code=code,
            function_name=function_name,
            input_data=tc["input_data"],
            expected_output=tc["expected_output"],
            test_id=tc["id"],
            description=tc.get("description", ""),
            timeout=timeout,
        )
        results.append(result)

    total_ms = int((time.time() - start) * 1000)
    passed = [r for r in results if r.passed]
    failed = [r for r in results if not r.passed]

    return ExecutionEvidence(
        submission_id=submission_id,
        test_results=results,
        all_passed=len(failed) == 0,
        pass_count=len(passed),
        fail_count=len(failed),
        total_count=len(results),
        execution_time_ms=total_ms,
    )
