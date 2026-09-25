"""
Diagnostic Question Generator:
Generates exactly ONE targeted logic question based on the error made by the human
(e.g., data type mismatch, off-by-one, condition precedence, return format discrepancy).
Uses AI (via OpenRouter/OpenAI) to craft a Socratic diagnostic probe so the human
can understand their exact mistake and rectify it in their single code revision.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, Optional

from app.config import get_settings
from app.core.llm import get_llm_client, get_llm_model


def _build_fallback_question(
    code: str,
    most_useful_failure: dict,
    bug_report: Optional[dict],
) -> str:
    """
    Rich heuristic fallback question that references the student's actual code,
    inspects data types and logic errors, and guides the human to rectify the bug.
    """
    input_data = most_useful_failure.get("input_data", {})
    expected = most_useful_failure.get("expected_output")
    actual = most_useful_failure.get("actual_output")
    description = most_useful_failure.get("description", "test case")

    # 1. Check Data Type Mismatch (Outer Container)
    if expected is not None and actual is not None:
        expected_type = type(expected).__name__
        actual_type = type(actual).__name__
        if expected_type != actual_type:
            return (
                f"Check the return type of your function: for input `{json.dumps(input_data)}`, "
                f"your code returned a `{actual_type}` (`{json.dumps(actual)}`), "
                f"but the problem specification expects a `{expected_type}` (`{json.dumps(expected)}`). "
                f"Where does your function return this value, and how can you convert it to `{expected_type}` in your revision?"
            )

        # 2. Check Data Type Mismatch (List Elements, e.g. int vs str in FizzBuzz)
        if isinstance(expected, list) and isinstance(actual, list) and len(expected) > 0 and len(actual) > 0:
            exp_elem_type = type(expected[0]).__name__
            act_elem_type = type(actual[0]).__name__
            if exp_elem_type != act_elem_type:
                return (
                    f"Notice the data type of the elements in your returned list: for input `{json.dumps(input_data)}`, "
                    f"your list contains `{act_elem_type}` items (e.g. `{json.dumps(actual[0])}`), "
                    f"whereas the problem requires `{exp_elem_type}` items (e.g. `{json.dumps(expected[0])}`). "
                    f"Where in your code are these items added, and how can you convert them to `{exp_elem_type}` in your revision?"
                )

    # 3. If we have a specific bug with a line number from AST/analysis, reference it directly
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
                    f"For `{json.dumps(input_data)}`, your return statement produces `{json.dumps(actual)}`, "
                    f"which are the array values, while the problem expects indices `{json.dumps(expected)}`. "
                    f"How can you modify your return statement to output the indices instead of the values?"
                )
            elif bug_type == "ZeroBasedIndexing" and snippet:
                return (
                    f"Look at `{snippet}` ({line_ref}). "
                    f"Your loop begins at index 0. For test `{description}`, "
                    f"what value does your code process first, and does the problem require starting from 1 or 0?"
                )
            elif snippet and line_no:
                return (
                    f"Look at line {line_no}: `{snippet}`. "
                    f"For input `{json.dumps(input_data)}`, your code returned `{json.dumps(actual)}` "
                    f"but the expected answer is `{json.dumps(expected)}`. "
                    f"Trace through that specific line with the given input — what value does it produce, and why is it incorrect?"
                )

    # 4. General grounded logic question
    return (
        f"For input `{json.dumps(input_data)}`, your code returned `{json.dumps(actual)}` "
        f"but the expected output is `{json.dumps(expected)}`. "
        f"Walk through your logic step by step with this exact input — "
        f"at which specific line does your logic first produce an unexpected value or type?"
    )


async def generate_diagnostic_question(
    problem: dict,
    code: str,
    most_useful_failure: dict,
    failure_summary: str,
    bug_report: Optional[dict] = None,
) -> str:
    """
    Generates a single diagnostic logic question PINNED to the human's specific code error.
    Leverages AI (OpenRouter / OpenAI) to analyze:
    - Data type differences (e.g. returning int instead of str, list vs int, value vs index)
    - Condition ordering and boolean precedence
    - Off-by-one or loop boundaries
    - Logical calculation errors
    Directs the human to reflect on the logic error so they can rectify it in their single revision.
    """
    settings = get_settings()

    fallback_question = _build_fallback_question(code, most_useful_failure, bug_report)

    # Check if API key is configured and not a placeholder
    api_key = settings.openai_api_key or ""
    if not api_key or api_key.startswith("sk-placeholder") or api_key == "sk-...":
        return fallback_question

    input_data = most_useful_failure.get("input_data", {})
    expected = most_useful_failure.get("expected_output")
    actual = most_useful_failure.get("actual_output")
    description = most_useful_failure.get("description", "test case")
    pattern = most_useful_failure.get("failure_pattern", "output mismatch")

    # Inspect data types for prompt enrichment
    exp_type = type(expected).__name__ if expected is not None else "None"
    act_type = type(actual).__name__ if actual is not None else "None"
    type_info = f"Expected Type: {exp_type} | Actual Produced Type: {act_type}"
    if isinstance(expected, list) and isinstance(actual, list) and expected and actual:
        type_info += f" | (Element Types — Expected: {type(expected[0]).__name__}, Actual: {type(actual[0]).__name__})"

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

    prompt = f"""You are BugStriker's diagnostic AI probe. Your mission is to identify the EXACT LOGICAL OR TYPE ERROR
made by the human programmer and ask ONE targeted, Socratic question that makes them realize their mistake
so they can rectify it in their single code revision.

Problem: {problem.get('title', 'Coding Challenge')}
Description: {problem.get('description', '')}

Human's Code (with line numbers):
```python
{numbered_code}
```

Static & Dynamic Bug Analysis:
{bug_context}

Most Useful Failing Test Evidence:
- Description: {description}
- Input: {json.dumps(input_data)}
- Expected Output: {json.dumps(expected)}
- Actual Produced Output: {json.dumps(actual)}
- Type Comparison: {type_info}
- Failure Pattern: {pattern}

CRITICAL RULES FOR CRAFTING THE DIAGNOSTIC QUESTION:
1. Ask exactly ONE targeted question.
2. The question MUST identify and be based on the human's SPECIFIC ERROR:
   - If there is a DATA TYPE DIFFERENCE (e.g. integers returned instead of strings, values instead of indices, list vs float, etc.), ask a logic question specifically highlighting that type difference and asking where the type conversion/creation happens in their code so they can fix it.
   - If there is an OFF-BY-ONE or BOUNDARY error, ask about the loop range or index bounds.
   - If there is a CONDITION PRECEDENCE error (e.g. FizzBuzz ordering), ask which branch fires first and why.
   - If there is an ALGORITHM or CALCULATION error, ask about the formula or state tracking at that specific line.
3. Quote the specific line number (e.g. "On line 4...") or exact code expression (e.g. "`range(1, n)`").
4. DO NOT reveal the answer, fix, or write the replacement code.
5. Tone: Analytical, Socratic, encouraging, and razor-sharp.
6. The human must be able to read your question and immediately understand WHAT logical flaw or type discrepancy they need to rectify in revision.

Output valid JSON only:
{{
  "question": "<your single, code-specific diagnostic logic question>"
}}
"""

    try:
        client = get_llm_client()
        model = get_llm_model()

        response = await client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are BugStriker's expert diagnostic question generator. "
                        "You analyze the human's code, detect the exact logic or data type error made, "
                        "and ask exactly ONE code-grounded diagnostic question. "
                        "Output valid JSON only."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
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
