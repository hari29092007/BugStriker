"""
Tests for BugStriker Diagnostic Question Generator and OpenRouter integration.
Verifies that the agent crafts targeted logic and type questions based on human errors.
"""
import pytest
from app.agent.question_generator import _build_fallback_question, generate_diagnostic_question
from app.core.llm import get_llm_client, get_llm_model
from app.config import get_settings


def test_openrouter_client_configuration():
    """Verify that OpenRouter base URL and headers are automatically set for sk-or- keys."""
    client = get_llm_client()
    assert "openrouter.ai" in str(client.base_url)
    assert client.default_headers.get("HTTP-Referer") == "http://localhost:8000"
    assert client.default_headers.get("X-Title") == "BugStriker"


def test_openrouter_model_resolution():
    """Verify that OpenRouter models resolve with provider prefix."""
    model = get_llm_model()
    assert "openai/" in model or "/" in model


def test_data_type_mismatch_fallback_question():
    """Verify that a data type mismatch between actual and expected produces a type-specific logic question."""
    most_useful_failure = {
        "input_data": {"n": 3},
        "expected_output": ["1", "2", "Fizz"],
        "actual_output": [1, 2, "Fizz"],
        "description": "Up to 3",
        "failure_pattern": "data type mismatch",
    }
    q = _build_fallback_question(
        code="def fizz_buzz(n): return [1, 2, 'Fizz']",
        most_useful_failure=most_useful_failure,
        bug_report=None,
    )
    assert "data type" in q.lower() or "type" in q.lower()
    assert "str" in q.lower() or "int" in q.lower()


def test_outer_return_type_mismatch_question():
    """Verify that an outer return type discrepancy (e.g. float vs int or str vs list) triggers a type logic question."""
    most_useful_failure = {
        "input_data": {"nums": [2, 7, 11, 15], "target": 9},
        "expected_output": [0, 1],
        "actual_output": 9,
        "description": "Two Sum target",
        "failure_pattern": "return type mismatch",
    }
    q = _build_fallback_question(
        code="def two_sum(nums, target): return 9",
        most_useful_failure=most_useful_failure,
        bug_report=None,
    )
    assert "return type" in q.lower() or "list" in q.lower()


@pytest.mark.anyio
async def test_live_ai_diagnostic_probe_on_data_type_error():
    """Verify that the AI diagnostic probe with OpenRouter analyzes human code and asks a logic question."""
    problem = {
        "title": "FizzBuzz",
        "description": "Return a list of strings: 'Fizz', 'Buzz', 'FizzBuzz', or number as string.",
    }
    # Human made an error: returned integers instead of string representations of numbers
    human_buggy_code = (
        "def fizz_buzz(n: int) -> list[str]:\n"
        "    res = []\n"
        "    for i in range(1, n + 1):\n"
        "        if i % 15 == 0:\n"
        "            res.append('FizzBuzz')\n"
        "        elif i % 3 == 0:\n"
        "            res.append('Fizz')\n"
        "        elif i % 5 == 0:\n"
        "            res.append('Buzz')\n"
        "        else:\n"
        "            res.append(i)  # Human error: appended int instead of str(i)\n"
        "    return res\n"
    )
    most_useful_failure = {
        "input_data": {"n": 3},
        "expected_output": ["1", "2", "Fizz"],
        "actual_output": [1, 2, "Fizz"],
        "description": "Up to 3",
        "failure_pattern": "Type mismatch in element output",
    }

    question = await generate_diagnostic_question(
        problem=problem,
        code=human_buggy_code,
        most_useful_failure=most_useful_failure,
        failure_summary="The function appends integers instead of strings to the result list.",
    )

    assert isinstance(question, str)
    assert len(question) > 15
    # The question should challenge the human on the data type or line 11
    assert any(term in question.lower() for term in ["type", "str", "string", "int", "line 11", "append", "1", "2"])
