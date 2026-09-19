# Docker-based sandbox (scaffolded for production use)
# Set USE_DOCKER=true in .env to enable
import subprocess
import json
import time
from typing import List

from app.models.test_result import TestCaseResult, ExecutionEvidence


def run_all_tests_docker(
    code: str,
    function_name: str,
    test_cases: List[dict],
    submission_id: str = "unknown",
) -> ExecutionEvidence:
    """
    Run tests inside a Docker sandbox container.
    This is scaffolded for production use — full implementation
    would mount code into a restricted container and execute via Docker SDK.

    To use: Set USE_DOCKER=false in .env (default). Docker runner requires
    a running Docker daemon and appropriate images.
    """
    raise NotImplementedError(
        "Docker runner not yet fully implemented. Set USE_DOCKER=false in your .env file."
    )
