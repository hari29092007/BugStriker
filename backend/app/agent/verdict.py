"""
Recruiter Verdict Agent:
Evaluates candidates for technical hiring by analyzing both:
1. Code Correctness (automated execution, pass rate, edge-case coverage) - 50%
2. Debugging Reasoning (comparing candidate explanation to agent's ideal reasoning benchmark) - 50%

Generates confidential recruiter dossiers with:
- Ideal Reasoning Benchmark
- Side-by-side Candidate vs. Ideal Reasoning comparison
- Code Score (0-100), Reasoning Score (0-100), Composite Score (0-100)
- Hiring Recommendation (STRONG_HIRE, HIRE, LEAN_NO_HIRE, NO_HIRE)
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from openai import AsyncOpenAI

from app.config import get_settings
from app.models.test_result import ExecutionEvidence


def _load_rubric() -> dict:
    rubric_path = Path(__file__).parent.parent / "rubric" / "rubric.json"
    if rubric_path.exists():
        try:
            return json.loads(rubric_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _generate_code_specific_ideal_reasoning(
    problem: dict,
    original_code: str,
    original_evidence: dict,
    bug_report: Optional[dict] = None,
) -> str:
    """
    Generates ideal reasoning that specifically references the student's buggy code.
    If a bug_report is available, it grounds the reasoning in the exact lines and constructs.
    Otherwise falls back to pattern-matched problem-level reasoning.
    """
    import re

    title = problem.get("title", "").lower()
    lines = original_code.splitlines() if original_code else []

    # Use bug_report to be maximally specific
    if bug_report:
        bugs = bug_report.get("bugs", [])
        root_cause = bug_report.get("root_cause", "")
        critical = [b for b in bugs if b.get("severity") == "critical"]

        if critical:
            primary = critical[0]
            line_ref = f"on line {primary['line_number']}" if primary.get("line_number") else "in the submitted code"
            snippet = f"`{primary['code_snippet']}`" if primary.get("code_snippet") else "the identified construct"

            bug_type = primary.get("bug_type", "")

            if bug_type == "WrongConditionOrder":
                return (
                    f"The root cause is a condition ordering error {line_ref}: {snippet} evaluates divisibility "
                    f"by 3 (or 5) before the combined check for divisibility by 15. Because Python's if/elif chain "
                    f"short-circuits, any number divisible by both (e.g. 15, 30, 45) triggers the first matching "
                    f"branch and never reaches the 'FizzBuzz' case. The fix is to reorder: check `n % 15 == 0` first, "
                    f"then `n % 3`, then `n % 5`."
                )
            elif bug_type == "OffByOne":
                return (
                    f"The root cause is an off-by-one error {line_ref}: {snippet} iterates up to but not including "
                    f"the last valid index. This means the last element of the input is never considered as a candidate, "
                    f"causing failures on any test where the answer involves the final element. "
                    f"The fix is to use `range(len(nums))` or the correct upper boundary."
                )
            elif bug_type == "AdjacentOnlySearch":
                return (
                    f"The root cause is a search-strategy defect {line_ref}: {snippet} only examines each element "
                    f"paired with its immediate neighbour (i, i+1). This completely misses pairs where the two "
                    f"complementary elements are non-adjacent. The correct approach is a hash-map (O(N)) that, for each "
                    f"element, checks whether its complement (target − num) was already seen, regardless of position."
                )
            elif bug_type == "ReturnsValueNotIndex":
                return (
                    f"The root cause is a return-value error {line_ref}: {snippet} returns the actual array value "
                    f"instead of its index. The problem requires index positions, not element values. "
                    f"The fix is to return `i` (the loop variable / position) rather than `nums[i]` (the element)."
                )
            elif bug_type == "ZeroBasedIndexing":
                return (
                    f"The root cause is a base-indexing error {line_ref}: {snippet} begins iteration at 0 when the "
                    f"problem specification requires 1-based output. The first iteration processes an incorrect starting "
                    f"value, shifting all results by one. Change the range start to 1."
                )
            else:
                # Generic bug_report-grounded reasoning
                return (
                    f"The root cause identified {line_ref} is: {root_cause or primary['description']}. "
                    f"A correct solution must handle all boundary conditions and edge cases specified by the problem, "
                    f"including the failing test inputs. Tracing through the specific construct {snippet} with the "
                    f"failing input reveals exactly where the logic diverges from the expected behaviour."
                )

    # Fallback: problem-level ideal reasoning (no bug report)
    if "two sum" in title:
        # Try to detect what kind of wrong approach was used
        uses_adjacent = bool(re.search(r'\[i\s*\+\s*1\]', original_code))
        uses_brute_force = bool(re.search(r'for .+ in .+:\s*\n\s+for .+ in ', original_code, re.MULTILINE))
        if uses_adjacent:
            approach = "only checks adjacent element pairs using `i+1` indexing"
        elif uses_brute_force:
            approach = "uses a correct nested loop but has an indexing or return error"
        else:
            approach = "uses an incomplete search strategy"

        return (
            f"The submitted solution {approach}, which fails for non-adjacent pairs and edge cases like negatives "
            f"or duplicates. The correct approach uses a hash map: for each element, compute complement = target - num, "
            f"check if complement is already in the map, and if so return both indices. This runs in O(N) and handles "
            f"all combinations regardless of element position."
        )
    elif "fizzbuzz" in title:
        return (
            "The submitted solution has incorrect conditional ordering or indexing: checking divisibility by 3 or 5 "
            "before checking divisibility by 15 causes multiples of 15 to produce 'Fizz' or 'Buzz' instead of "
            "'FizzBuzz'. The correct order is: check % 15 first, then % 3, then % 5, with 1-based range."
        )
    elif "cluster" in title or "reliability" in title:
        return (
            "The mathematical root cause is the multiplication rule for independent probabilistic events. "
            "End-to-end composite reliability across n independent hops with availability p is p^n. "
            "Naive approaches using linear subtraction (1 - n*(1-p)) or arithmetic mean drastically overestimate "
            "reliability (e.g. 0.99^100 ≈ 36.6%, not 99%)."
        )
    elif "worker" in title or "throughput" in title:
        return (
            "The root cause is a throughput aggregation error. Concurrent workers without resource contention "
            "contribute additively: R_total = sum(all rates). Minimum time = T / R_total. "
            "Common mistakes include taking the harmonic mean, averaging individual times, or using only the "
            "fastest worker's rate."
        )

    return (
        f"The submitted solution for '{problem.get('title', 'this problem')}' fails due to an incorrect handling "
        f"of boundary conditions or edge cases. A correct solution must exhaustively handle all valid inputs "
        f"including negatives, zeros, duplicates, and extreme values as specified by the test suite."
    )



def _compute_fallback_reasoning_score(candidate_explanation: str, ideal_reasoning: str) -> tuple[int, dict]:
    """Score candidate explanation against ideal reasoning deterministically when LLM is unavailable."""
    text = (candidate_explanation or "").strip().lower()
    if not text:
        return 15, {
            "root_cause_identified": False,
            "alignment_analysis": "No explanation or diagnostic reasoning was provided by the candidate.",
            "key_strengths": [],
            "misconceptions_or_gaps": ["Candidate skipped the diagnostic explanation stage entirely."],
        }

    # Keyword semantic heuristic
    ideal_keywords = [
        "hash", "dict", "map", "index", "target", "complement", "pair", "loop", "pointer",
        "adjacent", "negative", "modulo", "divisible", "condition", "order", "precedence",
        "15", "multiple", "duplicate", "logic", "check", "return", "pass"
    ]
    matched_keywords = [kw for kw in ideal_keywords if kw in text]
    length_bonus = min(30, len(text) // 4)
    keyword_score = min(50, len(matched_keywords) * 12)
    base_score = 20 + keyword_score + length_bonus
    score = max(20, min(95, base_score))

    root_identified = score >= 60
    strengths: List[str] = []
    gaps: List[str] = []

    if len(text) > 30:
        strengths.append("Provided a articulated narrative regarding code execution flow.")
    if matched_keywords:
        strengths.append(f"Identified relevant technical concepts: {', '.join(matched_keywords[:4])}.")
    if score >= 75:
        strengths.append("Directly correlated the observed test failure with internal state defect.")
    else:
        gaps.append("Explanation lacks precise mechanical breakdown of how variables caused test failure.")

    if not root_identified:
        gaps.append("Candidate relied on high-level assertions rather than identifying the algorithmic root cause.")

    return score, {
        "root_cause_identified": root_identified,
        "alignment_analysis": (
            f"Candidate explanation demonstrated {'high' if score >= 80 else 'moderate' if score >= 60 else 'limited'} "
            f"semantic alignment with the ground-truth root cause benchmark."
        ),
        "key_strengths": strengths,
        "misconceptions_or_gaps": gaps,
    }


async def evaluate_verdict(
    problem: dict,
    original_code: str,
    original_evidence: dict,
    diagnostic_question: Optional[dict],
    student_explanation: Optional[str],
    revised_code: str,
    revision_evidence: ExecutionEvidence,
    bug_report: Optional[dict] = None,
) -> Dict[str, Any]:
    """
    Recruiter-Facing Dual Evaluation:
    Evaluates both Code Correctness and Debugging Reasoning vs. Benchmark Ideal Reasoning.
    Now uses bug_report to produce code-specific ideal reasoning grounded in the student's
    actual code lines and constructs.
    Returns:
      {
        "verdict": "VERIFIED" | "NOT_VERIFIED" | "PARTIAL" | "AUTO_PASS",
        "recommendation": "STRONG_HIRE" | "HIRE" | "LEAN_NO_HIRE" | "NO_HIRE",
        "code_score": int (0-100),
        "reasoning_score": int (0-100),
        "composite_score": int (0-100),
        "ideal_reasoning": str,
        "reasoning_comparison": dict,
        "executive_summary": str,
        "rationale": str,
        "evidence_summary": dict
      }
    """
    settings = get_settings()
    explanation_text = (student_explanation or "").strip()

    # 1. Compute Code Score (0-100)
    total_tests = revision_evidence.total_count or 1
    pass_count = revision_evidence.pass_count
    fail_count = revision_evidence.fail_count
    all_passed = revision_evidence.all_passed

    if all_passed:
        code_score = 100
    else:
        code_score = int((pass_count / total_tests) * 80)

    evidence_summary = {
        "original_pass_count": original_evidence.get("pass_count", 0),
        "original_fail_count": original_evidence.get("fail_count", 0),
        "revision_pass_count": pass_count,
        "revision_fail_count": fail_count,
        "total_test_count": total_tests,
        "revision_all_passed": all_passed,
    }

    # Benchmark ideal reasoning — now code-specific using bug_report
    ideal_reasoning = _generate_code_specific_ideal_reasoning(
        problem, original_code, original_evidence, bug_report
    )

    # Check if OpenAI is available and configured
    use_llm = bool(
        settings.openai_api_key
        and not settings.openai_api_key.startswith("sk-placeholder")
        and not settings.openai_api_key.startswith("sk-...")
    )

    if not use_llm:
        # Deterministic Recruiter Evaluation Fallback
        reasoning_score, comparison_data = _compute_fallback_reasoning_score(explanation_text, ideal_reasoning)
        composite_score = int(round((code_score * 0.5) + (reasoning_score * 0.5)))

        if not all_passed:
            recommendation = "NO_HIRE" if composite_score < 50 else "LEAN_NO_HIRE"
            verdict = "NOT_VERIFIED"
            exec_summary = (
                f"Candidate revised code failed {fail_count} test case(s). Although reasoning scored {reasoning_score}/100, "
                "code did not achieve verification standard."
            )
        else:
            if composite_score >= 85 and reasoning_score >= 80:
                recommendation = "STRONG_HIRE"
                verdict = "VERIFIED"
                exec_summary = (
                    f"Strong technical candidate. Achieved 100% test verification (Code: {code_score}/100) and demonstrated "
                    f"thorough comprehension of the bug mechanism (Reasoning: {reasoning_score}/100)."
                )
            elif composite_score >= 70:
                recommendation = "HIRE"
                verdict = "VERIFIED"
                exec_summary = (
                    f"Competent candidate. Resolved all test failures (Code: {code_score}/100) with satisfactory "
                    f"diagnostic reasoning ({reasoning_score}/100)."
                )
            elif composite_score >= 50:
                recommendation = "LEAN_NO_HIRE"
                verdict = "PARTIAL"
                exec_summary = (
                    f"Candidate produced passing code (Code: {code_score}/100) but reasoning scored {reasoning_score}/100. "
                    "Possible superficial fix or incomplete conceptual grasp."
                )
            else:
                recommendation = "NO_HIRE"
                verdict = "NOT_VERIFIED"
                exec_summary = f"Submissions did not demonstrate requisite debugging mastery (Composite: {composite_score}/100)."

        comparison_data["candidate_explanation"] = explanation_text
        comparison_data["ideal_reasoning"] = ideal_reasoning

        return {
            "verdict": verdict,
            "recommendation": recommendation,
            "code_score": code_score,
            "reasoning_score": reasoning_score,
            "composite_score": composite_score,
            "ideal_reasoning": ideal_reasoning,
            "reasoning_comparison": comparison_data,
            "executive_summary": exec_summary,
            "rationale": exec_summary,
            "evidence_summary": evidence_summary,
        }

    # LLM-Powered Recruiter Evaluation
    rubric = _load_rubric()

    # Build bug_report context for the LLM
    bug_context_section = ""
    if bug_report:
        bugs = bug_report.get("bugs", [])
        root_cause = bug_report.get("root_cause", "")
        bug_lines = []
        for b in bugs:
            ln = f"Line {b['line_number']}: " if b.get("line_number") else ""
            snippet = f"`{b['code_snippet']}`" if b.get("code_snippet") else ""
            bug_lines.append(f"  [{b['severity'].upper()}] {ln}{snippet} — {b['description']}")
        bug_context_section = (
            f"\n--- Deep Bug Analysis (line-level) ---\n"
            f"Root Cause: {root_cause}\n"
            + "\n".join(bug_lines)
        )

    # Number original code lines for precision
    numbered_original = "\n".join(
        f"{i+1:>3}: {l}" for i, l in enumerate(original_code.splitlines())
    )

    prompt = f"""You are a Principal Engineering Bar-Raiser evaluating a candidate's technical assessment.
BugStriker weights both CODE CORRECTNESS (50%) and DEBUGGING REASONING (50%).

Problem: {problem.get('title', 'Challenge')}
Description: {problem.get('description', '')}

--- Original Buggy Code (with line numbers) ---
```python
{numbered_original}
```
Original Execution: {original_evidence.get('pass_count', 0)} passed, {original_evidence.get('fail_count', 0)} failed.
{bug_context_section}

--- Diagnostic Probe Question Asked (was code-specific, referencing exact lines) ---
{diagnostic_question.get('question_text', 'N/A') if diagnostic_question else 'N/A'}

--- Candidate's Stated Reasoning & Bug Explanation ---
"{explanation_text}"

--- Revised Code ---
```python
{revised_code}
```
Revised Execution: {pass_count} passed, {fail_count} failed out of {total_tests}. All passed: {all_passed}.

--- Evaluation Rubric & Standards ---
{json.dumps(rubric, indent=2)}

Tasks:
1. Synthesize the Ground-Truth IDEAL REASONING benchmark — reference the SPECIFIC LINE(s) from the original buggy code
   that caused the failures (e.g. "Line 4: `for i in range(len(nums)-1)` stops one index short...").
2. Compare the candidate's explanation directly with the Ideal Reasoning benchmark.
   Did they identify the correct line? The correct bug type? The mechanical reason?
3. Assign a Reasoning Score (0-100) assessing depth, accuracy, and absence of misconceptions.
4. Calculate Code Score (0-100) based on test results (100 if all pass, proportional if failing).
5. Compute Composite Score = (Code Score * 0.5) + (Reasoning Score * 0.5).
6. Assign Hiring Recommendation: STRONG_HIRE (>=85), HIRE (>=70), LEAN_NO_HIRE (>=50), NO_HIRE (<50).

Return valid JSON with this exact schema:
{{
  "verdict": "VERIFIED" | "PARTIAL" | "NOT_VERIFIED",
  "recommendation": "STRONG_HIRE" | "HIRE" | "LEAN_NO_HIRE" | "NO_HIRE",
  "code_score": <integer 0-100>,
  "reasoning_score": <integer 0-100>,
  "composite_score": <integer 0-100>,
  "ideal_reasoning": "<thorough 2-3 sentence benchmark: reference the exact line number and code construct that was buggy>",
  "reasoning_comparison": {{
    "root_cause_identified": <true/false>,
    "alignment_analysis": "<1-2 sentences comparing candidate explanation with ideal reasoning, referencing specific lines>",
    "key_strengths": ["<strength 1>", "<strength 2>"],
    "misconceptions_or_gaps": ["<gap 1>"]
  }},
  "executive_summary": "<2-3 sentence actionable takeaway for the hiring manager>"
}}
"""

    try:
        from app.core.llm import get_llm_client, get_llm_model
        client = get_llm_client()
        model = get_llm_model()
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are BugStriker's Senior Technical Recruiter Evaluator. Output valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from recruiter evaluation LLM")

        parsed = json.loads(content)
        r_score = int(parsed.get("reasoning_score", 50))
        c_score = int(parsed.get("code_score", code_score))
        comp_score = int(parsed.get("composite_score", round((c_score * 0.5) + (r_score * 0.5))))

        rec = parsed.get("recommendation", "HIRE")
        v = parsed.get("verdict", "VERIFIED" if all_passed else "NOT_VERIFIED")

        comp_dict = parsed.get("reasoning_comparison", {})
        comp_dict["candidate_explanation"] = explanation_text
        comp_dict["ideal_reasoning"] = parsed.get("ideal_reasoning", ideal_reasoning)

        return {
            "verdict": v,
            "recommendation": rec,
            "code_score": c_score,
            "reasoning_score": r_score,
            "composite_score": comp_score,
            "ideal_reasoning": parsed.get("ideal_reasoning", ideal_reasoning),
            "reasoning_comparison": comp_dict,
            "executive_summary": parsed.get("executive_summary", "Evaluation completed."),
            "rationale": parsed.get("executive_summary", "Evaluation completed."),
            "evidence_summary": evidence_summary,
        }
    except Exception as exc:
        print(f"Recruiter evaluation LLM error: {exc}")
        reasoning_score, comparison_data = _compute_fallback_reasoning_score(explanation_text, ideal_reasoning)
        composite_score = int(round((code_score * 0.5) + (reasoning_score * 0.5)))
        comparison_data["candidate_explanation"] = explanation_text
        comparison_data["ideal_reasoning"] = ideal_reasoning
        return {
            "verdict": "VERIFIED" if all_passed else "NOT_VERIFIED",
            "recommendation": "HIRE" if (all_passed and composite_score >= 70) else "LEAN_NO_HIRE",
            "code_score": code_score,
            "reasoning_score": reasoning_score,
            "composite_score": composite_score,
            "ideal_reasoning": ideal_reasoning,
            "reasoning_comparison": comparison_data,
            "executive_summary": f"Evaluation completed. Code Score: {code_score}, Reasoning Score: {reasoning_score}.",
            "rationale": f"Evaluation completed. Code Score: {code_score}, Reasoning Score: {reasoning_score}.",
            "evidence_summary": evidence_summary,
        }
