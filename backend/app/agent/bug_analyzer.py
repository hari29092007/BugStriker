"""
BugAnalyzer Agent:
Performs a deep, line-by-line analysis of student-submitted Python code
combined with runtime test failure evidence to produce a structured BugReport.

The BugReport is consumed by:
  - question_generator.py  → to ask questions pinned to specific buggy lines
  - evaluator.py           → to pick the most pedagogically useful failing test
  - verdict.py             → to ground ideal reasoning in the student's actual code

Runs in two modes:
  - LLM mode (OpenAI configured): Full GPT-powered static + dynamic analysis
  - Fallback mode (no key): Rich heuristic analysis using AST + regex pattern matching
"""
from __future__ import annotations

import ast
import json
import re
import textwrap
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional

from app.config import get_settings
from app.models.test_result import ExecutionEvidence


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class BugEntry:
    line_number: Optional[int]     # 1-indexed line in the student's code
    bug_type: str                  # e.g. "OffByOne", "WrongConditionOrder", "MissingEdgeCase"
    description: str               # Plain-English description referencing the actual code
    severity: str                  # "critical" | "major" | "minor"
    code_snippet: Optional[str]    # The exact line(s) from the student's code


@dataclass
class BugReport:
    bugs: List[BugEntry] = field(default_factory=list)
    root_cause: str = ""           # The single most important bug driving test failures
    all_failure_patterns: List[str] = field(default_factory=list)
    code_smell_notes: List[str] = field(default_factory=list)
    analysis_summary: str = ""     # One-paragraph narrative of what the code does wrong

    def to_dict(self) -> dict:
        return {
            "bugs": [asdict(b) for b in self.bugs],
            "root_cause": self.root_cause,
            "all_failure_patterns": self.all_failure_patterns,
            "code_smell_notes": self.code_smell_notes,
            "analysis_summary": self.analysis_summary,
        }


# ---------------------------------------------------------------------------
# Heuristic (fallback) analyser — no OpenAI required
# ---------------------------------------------------------------------------

def _extract_lines(code: str) -> List[str]:
    return code.splitlines()


def _try_parse_ast(code: str) -> Optional[ast.Module]:
    try:
        return ast.parse(code)
    except SyntaxError:
        return None


def _find_condition_order_bugs(code: str, lines: List[str]) -> List[BugEntry]:
    """Detect wrong condition ordering (e.g. checking % 3 before % 15)."""
    bugs: List[BugEntry] = []
    for i, line in enumerate(lines, start=1):
        # FizzBuzz: if % 3 appears before % 15 in the same function
        if re.search(r'%\s*3', line) and not re.search(r'%\s*15', line):
            # Check if % 15 appears later in the file *after* % 3 without an elif/else chain restart
            rest = "\n".join(lines[i:])
            if re.search(r'%\s*15', rest) or re.search(r'%\s*5', rest):
                bugs.append(BugEntry(
                    line_number=i,
                    bug_type="WrongConditionOrder",
                    description=(
                        f"Line {i}: `{line.strip()}` checks divisibility by 3 before checking "
                        f"divisibility by 15. When a number is divisible by both 3 and 15 "
                        f"(e.g., 15, 30), this branch fires first and returns 'Fizz' instead of 'FizzBuzz'."
                    ),
                    severity="critical",
                    code_snippet=line.strip(),
                ))
                break
    return bugs


def _find_range_bugs(code: str, lines: List[str]) -> List[BugEntry]:
    """Detect off-by-one in range calls."""
    bugs: List[BugEntry] = []
    for i, line in enumerate(lines, start=1):
        # range(len(x) - 1) is often off-by-one
        m = re.search(r'range\s*\(\s*len\s*\((\w+)\)\s*-\s*1\s*\)', line)
        if m:
            var = m.group(1)
            bugs.append(BugEntry(
                line_number=i,
                bug_type="OffByOne",
                description=(
                    f"Line {i}: `{line.strip()}` uses `range(len({var}) - 1)`, which stops "
                    f"one index short of the last element. If the answer involves the last element, "
                    f"it will never be checked."
                ),
                severity="critical",
                code_snippet=line.strip(),
            ))
    return bugs


def _find_adjacent_only_search(code: str, lines: List[str]) -> List[BugEntry]:
    """Detect two-pointer / adjacent-only search when full O(N²) or hash search is needed."""
    bugs: List[BugEntry] = []
    has_nested_loop = bool(re.search(r'for .+ in .+:\s*\n\s+for .+ in ', code, re.MULTILINE))
    has_hash = bool(re.search(r'(dict|{|}|\[\]|\.get\()', code))
    has_index_arithmetic = bool(re.search(r'\[i\s*[\+\-]\s*1\]|\[j\s*[\+\-]\s*1\]', code))

    if not has_nested_loop and not has_hash and has_index_arithmetic:
        # Find the line doing [i+1]
        for i, line in enumerate(lines, start=1):
            if re.search(r'\[i\s*\+\s*1\]|\[j\s*\+\s*1\]', line):
                bugs.append(BugEntry(
                    line_number=i,
                    bug_type="AdjacentOnlySearch",
                    description=(
                        f"Line {i}: `{line.strip()}` only checks the element immediately next to index i "
                        f"(`i+1`). This misses pairs where the two matching numbers are separated by other "
                        f"elements (e.g., nums=[3,1,4,1,5], target=5 needs indices 0 and 4, not adjacent)."
                    ),
                    severity="critical",
                    code_snippet=line.strip(),
                ))
                break
    return bugs


def _find_wrong_index_return(code: str, lines: List[str]) -> List[BugEntry]:
    """Detect returning values instead of indices."""
    bugs: List[BugEntry] = []
    for i, line in enumerate(lines, start=1):
        if re.search(r'return\s+nums\[', line) and 'index' not in line.lower():
            bugs.append(BugEntry(
                line_number=i,
                bug_type="ReturnsValueNotIndex",
                description=(
                    f"Line {i}: `{line.strip()}` returns the actual number from the array (`nums[i]`) "
                    f"instead of the index (`i`). The problem asks for the index positions, not the values."
                ),
                severity="critical",
                code_snippet=line.strip(),
            ))
    return bugs


def _find_missing_zero_or_negative_handling(code: str, lines: List[str], evidence: ExecutionEvidence) -> List[BugEntry]:
    """Detect if failures involve negative numbers or zeros but code has no special handling."""
    bugs: List[BugEntry] = []
    failing = [t for t in evidence.test_results if not t.passed]
    for t in failing:
        inp = t.input_data or {}
        values = list(inp.values())
        # Flatten nested lists
        flat = []
        for v in values:
            if isinstance(v, list):
                flat.extend(v)
            else:
                flat.append(v)
        has_negatives = any(isinstance(x, (int, float)) and x < 0 for x in flat)
        has_zeros = any(x == 0 for x in flat if isinstance(x, (int, float)))
        if has_negatives and 'abs(' not in code and '< 0' not in code and '> 0' not in code:
            bugs.append(BugEntry(
                line_number=None,
                bug_type="MissingNegativeHandling",
                description=(
                    f"Test '{t.description}' fails with input containing negative numbers {flat}. "
                    f"Your code has no explicit handling for negatives — trace through your logic with "
                    f"a negative value to find where it breaks."
                ),
                severity="major",
                code_snippet=None,
            ))
            break
        if has_zeros:
            bugs.append(BugEntry(
                line_number=None,
                bug_type="ZeroEdgeCase",
                description=(
                    f"Test '{t.description}' fails with input containing zero. "
                    f"Check if your code handles the zero case in its conditions or loops."
                ),
                severity="minor",
                code_snippet=None,
            ))
            break
    return bugs


def _find_base_indexing_bug(code: str, lines: List[str]) -> List[BugEntry]:
    """Detect 0-based vs 1-based indexing errors (e.g. FizzBuzz range starting at 0)."""
    bugs: List[BugEntry] = []
    for i, line in enumerate(lines, start=1):
        m = re.search(r'range\s*\(\s*0\s*,', line)
        if m:
            bugs.append(BugEntry(
                line_number=i,
                bug_type="ZeroBasedIndexing",
                description=(
                    f"Line {i}: `{line.strip()}` starts the range at 0. "
                    f"If the problem requires 1-based output (e.g. FizzBuzz from 1 to n), "
                    f"starting at 0 will include an incorrect first iteration."
                ),
                severity="major",
                code_snippet=line.strip(),
            ))
            break
    return bugs


def _heuristic_analyze(problem: dict, code: str, evidence: ExecutionEvidence) -> BugReport:
    """
    Pattern-based static analysis without LLM.
    Returns a BugReport grounded in the actual code lines.
    """
    lines = _extract_lines(code)
    failing = [t for t in evidence.test_results if not t.passed]
    title = problem.get("title", "").lower()

    all_bugs: List[BugEntry] = []

    # Run all pattern detectors
    all_bugs.extend(_find_condition_order_bugs(code, lines))
    all_bugs.extend(_find_range_bugs(code, lines))
    all_bugs.extend(_find_adjacent_only_search(code, lines))
    all_bugs.extend(_find_wrong_index_return(code, lines))
    all_bugs.extend(_find_missing_zero_or_negative_handling(code, lines, evidence))
    all_bugs.extend(_find_base_indexing_bug(code, lines))

    # Deduplicate by bug_type
    seen_types = set()
    unique_bugs: List[BugEntry] = []
    for b in all_bugs:
        if b.bug_type not in seen_types:
            seen_types.add(b.bug_type)
            unique_bugs.append(b)

    # Build failure patterns from failing tests
    patterns = list({t.error or "IncorrectOutput" for t in failing if not t.passed})

    # Root cause: first critical bug, or first bug, or generic
    root_cause = ""
    critical = [b for b in unique_bugs if b.severity == "critical"]
    if critical:
        root_cause = critical[0].description
    elif unique_bugs:
        root_cause = unique_bugs[0].description
    else:
        root_cause = (
            f"The code produces incorrect output for {len(failing)} of "
            f"{evidence.total_count} test cases. Trace through your logic "
            f"step by step using one of the failing inputs."
        )

    # Summary
    if failing:
        first_fail = failing[0]
        inp_str = json.dumps(first_fail.input_data)
        analysis_summary = (
            f"The submitted code fails {len(failing)} of {evidence.total_count} test cases. "
            f"The first failure occurs for input {inp_str}: expected "
            f"{json.dumps(first_fail.expected_output)}, got {json.dumps(first_fail.actual_output)}. "
            f"{root_cause}"
        )
    else:
        analysis_summary = "All test cases passed."

    smells: List[str] = []
    tree = _try_parse_ast(code)
    if tree:
        # Count return statements
        returns = [n for n in ast.walk(tree) if isinstance(n, ast.Return)]
        if len(returns) > 3:
            smells.append("Multiple return statements — consider simplifying control flow.")
        # Check for print statements (debug leftovers)
        calls = [n for n in ast.walk(tree) if isinstance(n, ast.Call)]
        for c in calls:
            if isinstance(c.func, ast.Name) and c.func.id == "print":
                smells.append("Contains print() statements — remove debug output before submission.")
                break

    return BugReport(
        bugs=unique_bugs,
        root_cause=root_cause,
        all_failure_patterns=patterns,
        code_smell_notes=smells,
        analysis_summary=analysis_summary,
    )


# ---------------------------------------------------------------------------
# LLM-powered analyser
# ---------------------------------------------------------------------------

async def _llm_analyze(problem: dict, code: str, evidence: ExecutionEvidence, settings) -> Optional[BugReport]:
    """Full GPT-powered deep analysis. Returns None if the LLM call fails."""
    from app.core.llm import get_llm_client, get_llm_model

    failing_tests = [t for t in evidence.test_results if not t.passed]
    failing_info = [
        {
            "test_id": t.test_id,
            "description": t.description,
            "input_data": t.input_data,
            "expected_output": t.expected_output,
            "actual_output": t.actual_output,
            "error": t.error,
        }
        for t in failing_tests
    ]

    # Number each line for the LLM
    numbered_code = "\n".join(f"{i+1:>3}: {l}" for i, l in enumerate(code.splitlines()))

    prompt = f"""You are BugStriker's deep code analysis engine. Perform an exhaustive, line-by-line review of the student's Python code and produce a structured bug report.

Problem: {problem.get('title', 'Coding Challenge')}
Description: {problem.get('description', '')}

Student Code (with line numbers):
```
{numbered_code}
```

Failing Test Cases ({len(failing_tests)} of {evidence.total_count}):
{json.dumps(failing_info, indent=2)}

Instructions:
1. Examine EVERY line of the code for bugs, not just the lines connected to failing tests.
2. For each bug found, note the exact line number and quote the specific code construct.
3. Distinguish: critical bugs (cause test failures) vs major bugs (edge cases) vs minor bugs (style/robustness).
4. Identify the single root cause driving most failures.
5. Be specific — say "line 4: `for i in range(len(nums)-1)` stops one index short" not "range error".

Return ONLY valid JSON with this exact schema:
{{
  "bugs": [
    {{
      "line_number": <integer or null>,
      "bug_type": "<OffByOne | WrongConditionOrder | AdjacentOnlySearch | MissingEdgeCase | ReturnsValueNotIndex | TypeMismatch | LogicError | MissingReturn | InfiniteLoop | Other>",
      "description": "<Specific description quoting the actual code snippet and explaining what it does wrong>",
      "severity": "<critical | major | minor>",
      "code_snippet": "<exact line text from the code>"
    }}
  ],
  "root_cause": "<One concise sentence identifying the primary bug driving most failures, referencing the exact line>",
  "all_failure_patterns": ["<pattern 1>", "<pattern 2>"],
  "code_smell_notes": ["<optional code quality notes>"],
  "analysis_summary": "<One paragraph: what the code does, where it goes wrong, what it misses>"
}}"""

    try:
        client = get_llm_client()
        model = get_llm_model()
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are BugStriker's code analysis engine. "
                        "Perform exhaustive line-by-line bug detection. Output valid JSON only."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        content = response.choices[0].message.content
        if not content:
            return None

        parsed = json.loads(content)
        bugs = [
            BugEntry(
                line_number=b.get("line_number"),
                bug_type=b.get("bug_type", "LogicError"),
                description=b.get("description", ""),
                severity=b.get("severity", "major"),
                code_snippet=b.get("code_snippet"),
            )
            for b in parsed.get("bugs", [])
        ]
        return BugReport(
            bugs=bugs,
            root_cause=parsed.get("root_cause", ""),
            all_failure_patterns=parsed.get("all_failure_patterns", []),
            code_smell_notes=parsed.get("code_smell_notes", []),
            analysis_summary=parsed.get("analysis_summary", ""),
        )
    except Exception as exc:
        print(f"BugAnalyzer LLM error: {exc}")
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def analyze_code_bugs(
    problem: dict,
    code: str,
    evidence: ExecutionEvidence,
) -> BugReport:
    """
    Main entry point. Runs LLM analysis if OpenAI is configured,
    otherwise falls back to rich heuristic analysis.
    Always returns a fully-populated BugReport.
    """
    settings = get_settings()
    failing = [t for t in evidence.test_results if not t.passed]

    # If all passed, no bugs to report
    if not failing:
        return BugReport(
            bugs=[],
            root_cause="All test cases passed — no bugs detected.",
            all_failure_patterns=[],
            code_smell_notes=[],
            analysis_summary="The submitted code passes all test cases.",
        )

    use_llm = bool(
        settings.openai_api_key
        and not settings.openai_api_key.startswith("sk-...")
        and not settings.openai_api_key.startswith("sk-placeholder")
    )

    if use_llm:
        llm_report = await _llm_analyze(problem, code, evidence, settings)
        if llm_report and llm_report.bugs:
            return llm_report
        # LLM failed or returned empty — fall through to heuristic

    return _heuristic_analyze(problem, code, evidence)
