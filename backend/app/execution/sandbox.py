from app.config import get_settings
from app.execution.runner import run_all_tests
from app.models.test_result import ExecutionEvidence
from typing import List


def execute_code(
    code: str,
    function_name: str,
    test_cases: List[dict],
    submission_id: str = "unknown",
) -> ExecutionEvidence:
    """
    Execute student code against test cases.
    Routes to Docker runner when USE_DOCKER=true, otherwise uses subprocess runner.
    """
    settings = get_settings()
    if settings.use_docker:
        from app.execution.docker_runner import run_all_tests_docker
        return run_all_tests_docker(
            code, function_name, test_cases, submission_id=submission_id
        )
    return run_all_tests(
        code=code,
        function_name=function_name,
        test_cases=test_cases,
        timeout=settings.execution_timeout,
        submission_id=submission_id,
    )
