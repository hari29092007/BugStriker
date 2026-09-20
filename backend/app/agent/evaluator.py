"""
Evaluator Agent:
Analyzes test failure evidence from student code execution and identifies
the MOST USEFUL failing test case to guide pedagogical debugging.

Now enhanced with BugReport from bug_analyzer for code-specific context.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from app.config import get_settings
from app.models.test_result import ExecutionEvidence, TestCaseResult


async def evaluate_failures(
    problem: dict,
    code: str,
    evidence: ExecutionEvidence,
    bug_report: Optional[dict] = None,
) -> Dict[str, Any]:
    """
    Takes problem details, submitted code, test failure evidence, and a BugReport.
    Returns:
      {
        "most_useful_failure": {
          "test_id": "...",
          "description": "...",
          "input_data": {...},
          "expected_output": ...,
          "actual_output": ...,
          "why_useful": "...",
          "failure_pattern": "..."
        },
        "failure_summary": "..."
      }
    """
    settings = get_settings()

    failing_tests = [t for t in evidence.test_results if not t.passed]
    if not failing_tests:
        return {
            "most_useful_failure": None,
            "failure_summary": "All test cases passed.",
        }

    # Format failing tests for LLM prompt
    failing_info = [
        {
            "test_id": t.test_id,
            "description": t.description,
            "input_data": t.input_data,
            "expected_output": t.expected_output,
            "actual_output": t.actual_output,
            "error": t.error,
            "stdout": t.stdout,
            "stderr": t.stderr,
        }
        for t in failing_tests
    ]

    # Fallback using BugReport root cause if available
    first_fail = failing_tests[0]
    root_cause_hint = ""
    if bug_report:
        root_cause_hint = bug_report.get("root_cause", "")

    fallback_result = {
        "most_useful_failure": {
            "test_id": first_fail.test_id,
            "description": first_fail.description,
            "input_data": first_fail.input_data,
            "expected_output": first_fail.expected_output,
            "actual_output": first_fail.actual_output,
            "why_useful": root_cause_hint or (
                f"Test case '{first_fail.description}' failed with actual output: {first_fail.actual_output}"
            ),
            "failure_pattern": (first_fail.error or "IncorrectOutput"),
        },
        "failure_summary": (
            bug_report.get("analysis_summary", "")
            if bug_report
            else f"The code produced incorrect output for {len(failing_tests)} of {evidence.total_count} test cases."
        ),
    }

    if not settings.openai_api_key or settings.openai_api_key.startswith("sk-..."):
        return fallback_result

    # Include bug_report context in the LLM prompt for precise selection
    bug_context = ""
    if bug_report:
        bugs = bug_report.get("bugs", [])
        if bugs:
            bug_lines = []
            for b in bugs:
                ln = f"Line {b['line_number']}: " if b.get("line_number") else ""
                bug_lines.append(f"  [{b['severity'].upper()}] {ln}{b['description']}")
            bug_context = "Deep Bug Analysis Results:\n" + "\n".join(bug_lines)
            bug_context += f"\n\nRoot Cause: {bug_report.get('root_cause', '')}"

    # Number the code lines for the LLM
    numbered_code = "\n".join(
        f"{i+1:>3}: {l}" for i, l in enumerate(code.splitlines())
    )

    prompt = f"""You are a debugging education assistant analyzing Python code execution results.

Problem: {problem.get('title', 'Coding Challenge')}
Description: {problem.get('description', '')}

Student's Submitted Code (with line numbers):
```python
{numbered_code}
```

{bug_context}

Failing Test Cases:
{json.dumps(failing_info, indent=2)}

Your task: Identify the single MOST USEFUL failing test case for a student to debug —
the one whose failure most directly exposes the root bug identified in the bug analysis above.
Reference the specific line numbers and code constructs from the bug analysis.

Return ONLY a JSON object with this exact schema:
{{
  "most_useful_failure": {{
    "test_id": "<must match one of the test_id values above>",
    "why_useful": "<1-2 sentences referencing the SPECIFIC line and code construct that causes this test to fail>",
    "failure_pattern": "<short label e.g., 'Adjacent-only search at line 4', 'Wrong condition order at line 3'>"
  }},
  "failure_summary": "<One concise paragraph explaining what the code logic does wrong, referencing specific lines, without revealing the exact solution>"
}}
"""

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are BugStriker's failure analysis module. Output valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        content = response.choices[0].message.content
        if not content:
            return fallback_result

        parsed = json.loads(content)
        muf = parsed.get("most_useful_failure", {})
        chosen_id = muf.get("test_id")
        matched_test = next(
            (t for t in failing_tests if t.test_id == chosen_id), first_fail
        )

        return {
            "most_useful_failure": {
                "test_id": matched_test.test_id,
                "description": matched_test.description,
                "input_data": matched_test.input_data,
                "expected_output": matched_test.expected_output,
                "actual_output": matched_test.actual_output,
                "why_useful": muf.get("why_useful", root_cause_hint or "Reveals core logic bug."),
                "failure_pattern": muf.get("failure_pattern", "Logic discrepancy"),
            },
            "failure_summary": parsed.get(
                "failure_summary", fallback_result["failure_summary"]
            ),
        }
    except Exception as exc:
        print(f"Evaluator LLM error: {exc}")
        return fallback_result
