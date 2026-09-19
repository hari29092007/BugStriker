"""
Diagnostic Question Generator:
Generates exactly ONE targeted question about the SPECIFIC BUG in the student's
actual code — pinned to exact line numbers and code constructs from the BugReport.

The student must explain what went wrong in THEIR specific code,
not answer a generic algorithm question.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, Optional

from app.config import get_settings


def _build_fallback_question(
    code: str,
    most_useful_failure: dict,
    bug_report: Optional[dict],
) -> str:
    """
    Rich fallback question that references the student's actual code.
    Uses bug_report line numbers and snippets when available.
    """
    input_data = most_useful_failure.get("input_data", {})
    expected = most_useful_failure.get("expected_output")
    actual = most_useful_failure.get("actual_output")
    description = most_useful_failure.get("description", "test case")

    # If we have a specific bug with a line number, reference it directly
    if bug_report:
        bugs = bug_report.get("bugs", [])
        critical = [b for b in bugs if b.get("severity") == "critical"]
        target_bug = critical[0] if critical else (bugs[0] if bugs else None)

        if target_bug:
            snippet = target_bug.get("code_snippet", "")
            line_no = target_bug.get("line_number")
            bug_type = target_bug.get("bug_type", "")
            line_ref = f"on line {line_no}" if line_no else "in your code"

            if bug_type == "WrongConditionOrder" and snippet:
                return (
                    f"Look at `{snippet}` ({line_ref}). "
                    f"When the input is `{json.dumps(input_data)}`, trace through each `if/elif` branch in order — "
                    f"which branch fires first for a value that should produce a different result, "
                    f"and why does the order of your conditions matter here?"
                )
            elif bug_type == "OffByOne" and snippet:
                return (
                    f"Look at `{snippet}` ({line_ref}). "
                    f"For input `{json.dumps(input_data)}`, write out every index your loop visits. "
                    f"Is the last element of the collection ever reached? "
                    f"What value does your code return, and why is it `{json.dumps(actual)}` instead of `{json.dumps(expected)}`?"
                )
            elif bug_type == "AdjacentOnlySearch" and snippet:
                return (
                    f"Look at `{snippet}` ({line_ref}). "
                    f"For `{json.dumps(input_data)}`, your code only compares each element with the one immediately next to it. "
                    f"Trace through: which pair of indices actually sum to the target, and does your loop ever check that combination?"
                )
            elif bug_type == "ReturnsValueNotIndex" and snippet:
                return (
                    f"Look at `{snippet}` ({line_ref}). "
                    f"For `{json.dumps(input_data)}`, what exact value does that expression return? "
                    f"The expected answer is `{json.dumps(expected)}` — is your code returning the number itself or its position in the array?"
                )
            elif bug_type == "ZeroBasedIndexing" and snippet:
                return (
                    f"Look at `{snippet}` ({line_ref}). "
                    f"Your loop begins at index 0. For the test `{description}`, "
                    f"what value does your code process first, and does the problem require starting from 1 or 0?"
                )
            elif snippet and line_no:
                return (
                    f"Look at line {line_no}: `{snippet}`. "
                    f"For input `{json.dumps(input_data)}`, your code returned `{json.dumps(actual)}` "
                    f"but the expected answer is `{json.dumps(expected)}`. "
                    f"Trace through that specific line with the given input — what value does it produce, and why is it incorrect?"
                )

    # Generic but still grounded in the failing test
    return (
        f"For input `{json.dumps(input_data)}`, your code returned `{json.dumps(actual)}` "
        f"but the expected answer is `{json.dumps(expected)}`. "
        f"Walk through your code step by step with this exact input — "
        f"at which specific line does your logic first produce an incorrect value?"
    )


async def generate_diagnostic_question(
    problem: dict,
    code: str,
    most_useful_failure: dict,
    failure_summary: str,
    bug_report: Optional[dict] = None,
) -> str:
    """
    Generates a single diagnostic question PINNED to the student's specific buggy code.
    The question must reference actual line numbers, variable names, and expressions
    from the submitted code — never asks a generic algorithm question.
    """
    settings = get_settings()

    fallback_question = _build_fallback_question(code, most_useful_failure, bug_report)

    if not settings.openai_api_key or settings.openai_api_key.startswith("sk-..."):
        return fallback_question

    input_data = most_useful_failure.get("input_data", {})
    expected = most_useful_failure.get("expected_output")
    actual = most_useful_failure.get("actual_output")
    description = most_useful_failure.get("description", "test case")
    pattern = most_useful_failure.get("failure_pattern", "output mismatch")

    # Build detailed bug context for the LLM
    bug_context_lines = []
    if bug_report:
        bugs = bug_report.get("bugs", [])
        root_cause = bug_report.get("root_cause", "")
        if root_cause:
            bug_context_lines.append(f"Root Cause Identified: {root_cause}")
        for b in bugs:
            ln = f"Line {b['line_number']}: " if b.get("line_number") else ""
            snippet = f"`{b['code_snippet']}`" if b.get("code_snippet") else ""
            bug_context_lines.append(
                f"  [{b['severity'].upper()}] {ln}{snippet} — {b['description']}"
            )

    bug_context = "\n".join(bug_context_lines) if bug_context_lines else "No structured bug report available."

    # Number each line for the LLM so it can reference line numbers precisely
    numbered_code = "\n".join(
        f"{i+1:>3}: {l}" for i, l in enumerate(code.splitlines())
    )

    prompt = f"""You are BugStriker, a Socratic debugging tutor. Your job is to ask ONE question
that forces the student to look at the SPECIFIC LINE in THEIR OWN CODE that contains the bug.

Problem: {problem.get('title', 'Coding Challenge')}
Description: {problem.get('description', '')}

Student's Code (with line numbers):
```python
{numbered_code}
```

Deep Bug Analysis of the student's code:
{bug_context}

Most Revealing Failing Test:
- Description: {description}
- Input: {json.dumps(input_data)}
- Expected Output: {json.dumps(expected)}
- Actual Output: {json.dumps(actual)}
- Failure Pattern: {pattern}

RULES — follow all of these:
1. Ask exactly ONE question.
2. The question MUST reference a specific line number (e.g. "On line 4...") OR quote the exact code construct from the student's code (e.g. "your expression `range(len(nums)-1)`...").
3. Ask the student to TRACE what that specific construct does with the given input — not to explain the algorithm generally.
4. DO NOT reveal the correct solution, fix, or the correct algorithm.
5. DO NOT ask "what is the correct approach" — ask "what does YOUR code do here".
6. Keep it to 1-2 sentences. Tone: analytical, Socratic, direct.

Example of a GOOD question:
  "On line 3, your loop condition is `if a % 3 == 0` — trace what happens when `a = 15`: which branch fires, and what does your function return?"

Example of a BAD question (too generic):
  "How does divisibility work in Python?"

Return ONLY a JSON object:
{{
  "question": "<your single, code-specific diagnostic question>"
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
                    "content": (
                        "You are BugStriker's diagnostic question generator. "
                        "Always reference specific line numbers and code from the student's submission. "
                        "Output valid JSON only."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        content = response.choices[0].message.content
        if not content:
            return fallback_question

        parsed = json.loads(content)
        question = parsed.get("question", "").strip()
        return question if question else fallback_question
    except Exception as exc:
        print(f"Question generator LLM error: {exc}")
        return fallback_question
