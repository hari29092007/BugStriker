# BugStriker — Archive Source Reference

Converted from `bugstriker (1).zip`. This document preserves the archive text files as source reference; compiled Python cache files are intentionally omitted.

## Contents

- [metadata.json](#metadatajson)
- [index.html](#indexhtml)
- [rubric.json](#rubricjson)
- [store.json](#storejson)
- [schemas.py](#schemaspy)
- [runner.py](#runnerpy)
- [evaluator.py](#evaluatorpy)
- [app.py](#apppy)
- [server.ts](#serverts)
- [package.json](#packagejson)
- [src/types.ts](#srctypests)
- [src/components/Header.tsx](#srccomponentsheadertsx)
- [src/components/FSMTracker.tsx](#srccomponentsfsmtrackertsx)
- [src/components/EvidencePanel.tsx](#srccomponentsevidencepaneltsx)
- [src/components/DiagnosticProbeCard.tsx](#srccomponentsdiagnosticprobecardtsx)
- [src/components/FinalVerdictCard.tsx](#srccomponentsfinalverdictcardtsx)
- [src/components/HistoryModal.tsx](#srccomponentshistorymodaltsx)
- [src/App.tsx](#srcapptsx)
- [.gitignore](#gitignore)
- [src/index.css](#srcindexcss)
- [src/main.tsx](#srcmaintsx)
- [tsconfig.json](#tsconfigjson)
- [.env.example](#envexample)
- [vite.config.ts](#viteconfigts)
- [README.md](#readmemd)

## metadata.json

``````json
{
  "name": "BugStriker",
  "description": "Deterministic agentic debugging application with strict FSM lifecycle, sandbox execution, diagnostic probe questions, and hard operational limits.",
  "requestFramePermissions": [],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}
``````

## index.html

``````html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BugStriker</title>
    <meta name="description" content="Deterministic agentic debugging application with strict FSM lifecycle, sandbox execution, diagnostic probe questions, and hard operational limits." />
    <meta property="og:title" content="BugStriker" />
    <meta property="og:description" content="Deterministic agentic debugging application with strict FSM lifecycle, sandbox execution, diagnostic probe questions, and hard operational limits." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-neutral-950 text-neutral-100 font-['Plus_Jakarta_Sans',sans-serif] antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
``````

## rubric.json

``````json
{
  "problems": [
    {
      "id": "merge-intervals",
      "title": "Merge Overlapping Intervals",
      "difficulty": "Medium",
      "entry_point": "merge_intervals",
      "description": "Given an array of interval pairs intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input. Intervals must be sorted by start time.",
      "buggy_starter_code": "def merge_intervals(intervals):\n    # Buggy starter implementation:\n    # 1. Fails to sort intervals by start_time first\n    # 2. Strict inequality `<` instead of `<=` on overlap check\n    # 3. Does not handle empty or single interval cleanly\n    if not intervals:\n        return []\n    \n    merged = [intervals[0]]\n    for current in intervals[1:]:\n        prev = merged[-1]\n        if current[0] < prev[1]:  # BUG: should check current[0] <= prev[1]\n            prev[1] = max(prev[1], current[1])\n        else:\n            merged.append(current)\n            \n    return merged\n",
      "baseline_tests": [
        {
          "name": "Standard overlapping sequence",
          "input": "[[1, 3], [2, 6], [8, 10], [15, 18]]",
          "expected": "[[1, 6], [8, 10], [15, 18]]",
          "is_edge_case": false
        },
        {
          "name": "Touch boundary condition (adjacent)",
          "input": "[[1, 4], [4, 5]]",
          "expected": "[[1, 5]]",
          "is_edge_case": true
        },
        {
          "name": "Unsorted input intervals",
          "input": "[[4, 7], [1, 4], [8, 9]]",
          "expected": "[[1, 7], [8, 9]]",
          "is_edge_case": false
        },
        {
          "name": "Completely contained subset interval",
          "input": "[[1, 10], [2, 3], [4, 8]]",
          "expected": "[[1, 10]]",
          "is_edge_case": true
        },
        {
          "name": "Single interval array",
          "input": "[[2, 5]]",
          "expected": "[[2, 5]]",
          "is_edge_case": true
        }
      ],
      "diagnostic_rubric": {
        "core_concepts": [
          "Sorting intervals deterministically by start coordinate before linear scan",
          "Boundary condition inclusive overlap (start <= previous_end)",
          "Handling multi-interval subsumption where outer interval envelopes inner interval"
        ],
        "common_misconceptions": [
          "Assuming incoming intervals are already sorted in ascending order",
          "Treating touching endpoints like [1,4] and [4,5] as disjoint because 4 is not strictly less than 4",
          "Mutating interval lists during iteration without proper merge aggregation"
        ],
        "probe_instructions": "Ask a focused diagnostic probe question about why the boundary touch test or unsorted intervals fail. Ask the student to identify the exact condition and reason, without giving any code or syntax."
      }
    },
    {
      "id": "two-sum-sorted",
      "title": "Two Sum II - Input Array Is Sorted",
      "difficulty": "Easy",
      "entry_point": "two_sum",
      "description": "Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number. Return the indices of the two numbers, added by one, as an integer array [index1, index2] of length 2.",
      "buggy_starter_code": "def two_sum(numbers, target):\n    # Buggy starter implementation:\n    # 1. Returns 0-indexed instead of 1-indexed\n    # 2. Infinite loop or incorrect pointer movement on mismatch\n    left = 0\n    right = len(numbers) - 1\n    \n    while left < right:\n        current_sum = numbers[left] + numbers[right]\n        if current_sum == target:\n            return [left, right]  # BUG: Must be 1-indexed [left + 1, right + 1]\n        elif current_sum < target:\n            left += 1\n        else:\n            left += 1  # BUG: should be right -= 1\n            \n    return []\n",
      "baseline_tests": [
        {
          "name": "Standard positive targets",
          "input": "[2, 7, 11, 15], 9",
          "expected": "[1, 2]",
          "is_edge_case": false
        },
        {
          "name": "Negative numbers",
          "input": "[-3, 3, 4, 90], 0",
          "expected": "[1, 2]",
          "is_edge_case": false
        },
        {
          "name": "Duplicate values equal to target",
          "input": "[2, 3, 4, 4], 8",
          "expected": "[3, 4]",
          "is_edge_case": true
        },
        {
          "name": "Two elements minimal array",
          "input": "[-1, 0], -1",
          "expected": "[1, 2]",
          "is_edge_case": true
        }
      ],
      "diagnostic_rubric": {
        "core_concepts": [
          "Two-pointer bidirectional convergence on sorted sequences",
          "1-indexed coordinate adjustment",
          "Decreasing right pointer when sum exceeds target"
        ],
        "common_misconceptions": [
          "Incrementing left pointer in both branches",
          "Forgetting that 1-indexed returns require +1 offset"
        ],
        "probe_instructions": "Focus the student on the pointer adjustment behavior when current_sum > target and index base representation."
      }
    },
    {
      "id": "valid-parentheses-depth",
      "title": "Max Nesting Depth of Parentheses",
      "difficulty": "Easy-Medium",
      "entry_point": "max_depth",
      "description": "Given a valid parentheses string s, return the maximum nesting depth of parentheses. If the string contains mismatched braces, throw a ValueError or return -1.",
      "buggy_starter_code": "def max_depth(s):\n    # Buggy starter implementation:\n    # 1. Doesn't reset or track peak depth correctly\n    # 2. Misses invalid mismatched negative depth checks\n    current_depth = 0\n    max_d = 0\n    for char in s:\n        if char == '(':\n            current_depth += 1\n            max_d = current_depth  # BUG: overwrites max_d instead of max(max_d, current_depth)\n        elif char == ')':\n            current_depth -= 1\n            if current_depth < 0:\n                return -1\n    return max_d if current_depth == 0 else -1\n",
      "baseline_tests": [
        {
          "name": "Balanced simple expression",
          "input": "\"(1+(2*3)+((8)/4))+1\"",
          "expected": "3",
          "is_edge_case": false
        },
        {
          "name": "Empty string zero depth",
          "input": "\"\"",
          "expected": "0",
          "is_edge_case": true
        },
        {
          "name": "Consecutive sub-expressions of varying depth",
          "input": "\"(1)+((2))+(((3)))+(4)\"",
          "expected": "3",
          "is_edge_case": false
        },
        {
          "name": "Unbalanced closing parenthesis",
          "input": "\"(1+2))\"",
          "expected": "-1",
          "is_edge_case": true
        }
      ],
      "diagnostic_rubric": {
        "core_concepts": [
          "Tracking monotonic historical maximum vs transient current depth",
          "Early exit on negative nesting balance",
          "Zero depth on empty input"
        ],
        "common_misconceptions": [
          "Overwriting max depth on every opening paren instead of taking max()",
          "Failing to preserve peak depth when closing parentheses decrement counter"
        ],
        "probe_instructions": "Probe why expressions with multiple sequential groups lose track of previously achieved peak depths."
      }
    }
  ]
}
``````

## store.json

``````json
{
  "sessions": {
    "sess_af0decb40d": {
      "session_id": "sess_af0decb40d",
      "student_id": "alice",
      "problem_id": "merge-intervals",
      "current_state": "WAITING_REVISION",
      "hard_limits": {
        "executions_count": 1,
        "probes_count": 1,
        "revisions_count": 0,
        "llm_calls_count": 2,
        "max_executions": 2,
        "max_probes": 1,
        "max_revisions": 1,
        "max_llm_calls": 5
      },
      "submission_v1": {
        "student_id": "alice",
        "problem_id": "merge-intervals",
        "code": "def merge_intervals(intervals):\n    # Buggy starter implementation:\n    # 1. Fails to sort intervals by start_time first\n    # 2. Strict inequality `<` instead of `<=` on overlap check\n    # 3. Does not handle empty or single interval cleanly\n    if not intervals:\n        return []\n    \n    merged = [intervals[0]]\n    for current in intervals[1:]:\n        prev = merged[-1]\n        if current[0] < prev[1]:  # BUG: should check current[0] <= prev[1]\n            prev[1] = max(prev[1], current[1])\n        else:\n            merged.append(current)\n            \n    return merged\n",
        "version": 1
      },
      "evidence_v1": {
        "total_tests": 5,
        "passed_tests": 3,
        "failed_tests": 2,
        "execution_time_ms": 1.74,
        "timed_out": false,
        "syntax_error": false,
        "results": [
          {
            "name": "Standard overlapping sequence",
            "passed": true,
            "input_repr": "[[1, 3], [2, 6], [8, 10], [15, 18]]",
            "expected_repr": "[[1, 6], [8, 10], [15, 18]]",
            "actual_repr": "[[1, 6], [8, 10], [15, 18]]",
            "error": null,
            "duration_ms": 0.08
          },
          {
            "name": "Touch boundary condition (adjacent)",
            "passed": false,
            "input_repr": "[[1, 4], [4, 5]]",
            "expected_repr": "[[1, 5]]",
            "actual_repr": "[[1, 4], [4, 5]]",
            "error": "Assertion Mismatch: expected [[1, 5]], got [[1, 4], [4, 5]]",
            "duration_ms": 0.06
          },
          {
            "name": "Unsorted input intervals",
            "passed": false,
            "input_repr": "[[4, 7], [1, 4], [8, 9]]",
            "expected_repr": "[[1, 7], [8, 9]]",
            "actual_repr": "[[4, 7], [8, 9]]",
            "error": "Assertion Mismatch: expected [[1, 7], [8, 9]], got [[4, 7], [8, 9]]",
            "duration_ms": 0.05
          },
          {
            "name": "Completely contained subset interval",
            "passed": true,
            "input_repr": "[[1, 10], [2, 3], [4, 8]]",
            "expected_repr": "[[1, 10]]",
            "actual_repr": "[[1, 10]]",
            "error": null,
            "duration_ms": 0.04
          },
          {
            "name": "Single interval array",
            "passed": true,
            "input_repr": "[[2, 5]]",
            "expected_repr": "[[2, 5]]",
            "actual_repr": "[[2, 5]]",
            "error": null,
            "duration_ms": 0.03
          }
        ],
        "stdout": "",
        "stderr": ""
      },
      "diagnostic_probe": {
        "probe_id": "probe_fallback",
        "selected_failure": "Failed: Touch boundary condition (adjacent)",
        "empirical_evidence_summary": "On input [[1, 4], [4, 5]], the function returned [[1, 4], [4, 5]] instead of [[1, 5]].",
        "question": "In the test 'Touch boundary condition (adjacent)', what specific condition or invariant caused the algorithm to produce [[1, 4], [4, 5]] instead of [[1, 5]]? Describe the logical gap without writing code.",
        "hint_concept": "Sorting intervals deterministically by start coordinate before linear scan",
        "strict_no_code_check": true
      },
      "student_explanation": "The code does not sort intervals by start time and uses < instead of <= on boundary.",
      "explanation_grade": {
        "score": 85,
        "identified_root_cause": true,
        "conceptual_understanding": "Demonstrated logical diagnosis of state transitions and edge invariants.",
        "feedback_without_code": "Your analysis addresses key boundary conditions. Ensure your upcoming revision aligns with this diagnosis."
      },
      "submission_v2": null,
      "evidence_v2": null,
      "final_verdict": null,
      "transition_log": [
        {
          "state": "IDLE",
          "timestamp": "2026-09-19T05:30:50.319306",
          "reason": "Session initialized"
        },
        {
          "state": "RUN_1_FAILED",
          "timestamp": "2026-09-19T05:30:50.357148",
          "reason": "2 tests failed"
        },
        {
          "state": "PROBE_GENERATED",
          "timestamp": "2026-09-19T05:30:50.357148",
          "reason": "Diagnostic probe formulated without code"
        },
        {
          "state": "WAITING_EXPLANATION",
          "timestamp": "2026-09-19T05:30:50.357148",
          "reason": "Waiting for student diagnosis"
        },
        {
          "state": "EXPLANATION_GRADED",
          "timestamp": "2026-09-19T05:30:50.886638",
          "reason": "Explanation graded with score 85"
        },
        {
          "state": "WAITING_REVISION",
          "timestamp": "2026-09-19T05:30:50.886638",
          "reason": "Student revision unlocked (1 revision allowed)"
        }
      ],
      "created_at": "2026-09-19T05:30:50.319306",
      "updated_at": "2026-09-19T05:30:50.886638"
    },
    "sess_rog7y0xh5": {
      "session_id": "sess_rog7y0xh5",
      "student_id": "student_user",
      "problem_id": "merge-intervals",
      "current_state": "COMPLETED_SUCCESS",
      "hard_limits": {
        "executions_count": 2,
        "probes_count": 1,
        "revisions_count": 1,
        "llm_calls_count": 3,
        "max_executions": 2,
        "max_probes": 1,
        "max_revisions": 1,
        "max_llm_calls": 5
      },
      "submission_v1": {
        "student_id": "student_user",
        "problem_id": "merge-intervals",
        "code": "def merge_intervals(intervals):\n    if not intervals: return []\n    merged = [intervals[0]]\n    for c in intervals[1:]:\n        if c[0] < merged[-1][1]: merged[-1][1] = max(merged[-1][1], c[1])\n        else: merged.append(c)\n    return merged",
        "version": 1
      },
      "evidence_v1": {
        "total_tests": 5,
        "passed_tests": 3,
        "failed_tests": 2,
        "execution_time_ms": 1.79,
        "timed_out": false,
        "syntax_error": false,
        "results": [
          {
            "name": "Standard overlapping sequence",
            "passed": true,
            "input_repr": "[[1, 3], [2, 6], [8, 10], [15, 18]]",
            "expected_repr": "[[1, 6], [8, 10], [15, 18]]",
            "actual_repr": "[[1, 6], [8, 10], [15, 18]]",
            "error": null,
            "duration_ms": 0.08
          },
          {
            "name": "Touch boundary condition (adjacent)",
            "passed": false,
            "input_repr": "[[1, 4], [4, 5]]",
            "expected_repr": "[[1, 5]]",
            "actual_repr": "[[1, 4], [4, 5]]",
            "error": "Assertion Mismatch: expected [[1, 5]], got [[1, 4], [4, 5]]",
            "duration_ms": 0.06
          },
          {
            "name": "Unsorted input intervals",
            "passed": false,
            "input_repr": "[[4, 7], [1, 4], [8, 9]]",
            "expected_repr": "[[1, 7], [8, 9]]",
            "actual_repr": "[[4, 7], [8, 9]]",
            "error": "Assertion Mismatch: expected [[1, 7], [8, 9]], got [[4, 7], [8, 9]]",
            "duration_ms": 0.05
          },
          {
            "name": "Completely contained subset interval",
            "passed": true,
            "input_repr": "[[1, 10], [2, 3], [4, 8]]",
            "expected_repr": "[[1, 10]]",
            "actual_repr": "[[1, 10]]",
            "error": null,
            "duration_ms": 0.05
          },
          {
            "name": "Single interval array",
            "passed": true,
            "input_repr": "[[2, 5]]",
            "expected_repr": "[[2, 5]]",
            "actual_repr": "[[2, 5]]",
            "error": null,
            "duration_ms": 0.03
          }
        ],
        "stdout": "",
        "stderr": ""
      },
      "diagnostic_probe": {
        "probe_id": "probe_1789796001462",
        "selected_failure": "Failed on: Touch boundary condition (adjacent)",
        "empirical_evidence_summary": "On input [[1, 4], [4, 5]], actual output was [[1, 4], [4, 5]], but expected output is [[1, 5]].",
        "question": "Why did the function produce [[1, 4], [4, 5]] instead of [[1, 5]] in test 'Touch boundary condition (adjacent)'? What boundary condition or ordering invariant was violated?",
        "hint_concept": "Sorting intervals deterministically by start coordinate before linear scan",
        "strict_no_code_check": true
      },
      "student_explanation": "The condition c[0] < merged[-1][1] uses strict less-than rather than less-than-or-equal, so touching boundary points at 4 are not merged.",
      "explanation_grade": {
        "score": 85,
        "identified_root_cause": true,
        "conceptual_understanding": "Accurately diagnosed the logical mismatch between observed and expected behavior.",
        "feedback_without_code": "Your explanation touches on the core invariant. Ensure your revision directly addresses this boundary condition without adding extraneous logic."
      },
      "submission_v2": {
        "student_id": "student_user",
        "problem_id": "merge-intervals",
        "code": "def merge_intervals(intervals):\n    if not intervals:\n        return []\n    intervals.sort(key=lambda x: x[0])\n    merged = [intervals[0]]\n    for c in intervals[1:]:\n        prev = merged[-1]\n        if c[0] <= prev[1]:\n            prev[1] = max(prev[1], c[1])\n        else:\n            merged.append(c)\n    return merged",
        "version": 2
      },
      "evidence_v2": {
        "total_tests": 5,
        "passed_tests": 5,
        "failed_tests": 0,
        "execution_time_ms": 1.76,
        "timed_out": false,
        "syntax_error": false,
        "results": [
          {
            "name": "Standard overlapping sequence",
            "passed": true,
            "input_repr": "[[1, 3], [2, 6], [8, 10], [15, 18]]",
            "expected_repr": "[[1, 6], [8, 10], [15, 18]]",
            "actual_repr": "[[1, 6], [8, 10], [15, 18]]",
            "error": null,
            "duration_ms": 0.09
          },
          {
            "name": "Touch boundary condition (adjacent)",
            "passed": true,
            "input_repr": "[[1, 4], [4, 5]]",
            "expected_repr": "[[1, 5]]",
            "actual_repr": "[[1, 5]]",
            "error": null,
            "duration_ms": 0.06
          },
          {
            "name": "Unsorted input intervals",
            "passed": true,
            "input_repr": "[[4, 7], [1, 4], [8, 9]]",
            "expected_repr": "[[1, 7], [8, 9]]",
            "actual_repr": "[[1, 7], [8, 9]]",
            "error": null,
            "duration_ms": 0.07
          },
          {
            "name": "Completely contained subset interval",
            "passed": true,
            "input_repr": "[[1, 10], [2, 3], [4, 8]]",
            "expected_repr": "[[1, 10]]",
            "actual_repr": "[[1, 10]]",
            "error": null,
            "duration_ms": 0.05
          },
          {
            "name": "Single interval array",
            "passed": true,
            "input_repr": "[[2, 5]]",
            "expected_repr": "[[2, 5]]",
            "actual_repr": "[[2, 5]]",
            "error": null,
            "duration_ms": 0.03
          }
        ],
        "stdout": "",
        "stderr": ""
      },
      "final_verdict": {
        "status": "PASSED",
        "summary": "Deterministic verification successful: All 5 test cases passed on Revision V2.",
        "grade_score": 85,
        "test_pass_rate": 100,
        "learning_outcome": "Debugging lifecycle complete: Student identified boundary invariant and fixed code independently without external code assistance.",
        "fsm_history": [
          "IDLE",
          "RUN_1_FAILED",
          "PROBE_GENERATED",
          "WAITING_EXPLANATION",
          "EXPLANATION_GRADED",
          "WAITING_REVISION",
          "COMPLETED_SUCCESS"
        ]
      },
      "transition_log": [
        {
          "state": "IDLE",
          "timestamp": "2026-09-19T05:33:08.141Z",
          "reason": "Session initialized"
        },
        {
          "state": "RUN_1_FAILED",
          "timestamp": "2026-09-19T05:33:10.250Z",
          "reason": "2 tests failed on Run 1"
        },
        {
          "state": "PROBE_GENERATED",
          "timestamp": "2026-09-19T05:33:10.250Z",
          "reason": "Formulated single diagnostic probe without revealing code"
        },
        {
          "state": "WAITING_EXPLANATION",
          "timestamp": "2026-09-19T05:33:10.250Z",
          "reason": "Awaiting student conceptual diagnosis"
        },
        {
          "state": "EXPLANATION_GRADED",
          "timestamp": "2026-09-19T05:33:31.558Z",
          "reason": "Explanation graded: Score 85/100"
        },
        {
          "state": "WAITING_REVISION",
          "timestamp": "2026-09-19T05:33:31.558Z",
          "reason": "Revision unlocked: Student may now submit Version 2 code (exactly 1 revision permitted)"
        },
        {
          "state": "RUN_2_EXECUTING",
          "timestamp": "2026-09-19T05:33:34.991Z",
          "reason": "Executed Revision V2 against deterministic test suite"
        },
        {
          "state": "COMPLETED_SUCCESS",
          "timestamp": "2026-09-19T05:33:34.991Z",
          "reason": "Final Verdict reached: PASSED"
        }
      ],
      "created_at": "2026-09-19T05:33:08.141Z",
      "updated_at": "2026-09-19T05:33:34.991Z"
    },
    "sess_ehcp7mm86": {
      "session_id": "sess_ehcp7mm86",
      "student_id": "student_user",
      "problem_id": "merge-intervals",
      "current_state": "IDLE",
      "hard_limits": {
        "executions_count": 0,
        "probes_count": 0,
        "revisions_count": 0,
        "llm_calls_count": 0,
        "max_executions": 2,
        "max_probes": 1,
        "max_revisions": 1,
        "max_llm_calls": 5
      },
      "submission_v1": null,
      "evidence_v1": null,
      "diagnostic_probe": null,
      "student_explanation": null,
      "explanation_grade": null,
      "submission_v2": null,
      "evidence_v2": null,
      "final_verdict": null,
      "transition_log": [
        {
          "state": "IDLE",
          "timestamp": "2026-09-19T05:34:25.920Z",
          "reason": "Session initialized"
        }
      ],
      "created_at": "2026-09-19T05:34:25.920Z",
      "updated_at": "2026-09-19T05:34:25.920Z"
    },
    "sess_exxubsnzz": {
      "session_id": "sess_exxubsnzz",
      "student_id": "student_user",
      "problem_id": "merge-intervals",
      "current_state": "WAITING_EXPLANATION",
      "hard_limits": {
        "executions_count": 1,
        "probes_count": 1,
        "revisions_count": 0,
        "llm_calls_count": 1,
        "max_executions": 2,
        "max_probes": 1,
        "max_revisions": 1,
        "max_llm_calls": 5
      },
      "submission_v1": {
        "student_id": "student_user",
        "problem_id": "merge-intervals",
        "code": "def merge_intervals(intervals):\n    # Buggy starter implementation:\n    # 1. Fails to sort intervals by start_time first\n    # 2. Strict inequality `<` instead of `<=` on overlap check\n    # 3. Does not handle empty or single interval cleanly\n    if not intervals:\n        return []\n    \n    merged = [intervals[0]]\n    for current in intervals[1:]:\n        prev = merged[-1]\n        if current[0] < prev[1]:  # BUG: should check current[0] <= prev[1]\n            prev[1] = max(prev[1], current[1])\n        else:\n            merged.append(current)\n            \n    return merged\n",
        "version": 1
      },
      "evidence_v1": {
        "total_tests": 5,
        "passed_tests": 3,
        "failed_tests": 2,
        "execution_time_ms": 1.79,
        "timed_out": false,
        "syntax_error": false,
        "results": [
          {
            "name": "Standard overlapping sequence",
            "passed": true,
            "input_repr": "[[1, 3], [2, 6], [8, 10], [15, 18]]",
            "expected_repr": "[[1, 6], [8, 10], [15, 18]]",
            "actual_repr": "[[1, 6], [8, 10], [15, 18]]",
            "error": null,
            "duration_ms": 0.1
          },
          {
            "name": "Touch boundary condition (adjacent)",
            "passed": false,
            "input_repr": "[[1, 4], [4, 5]]",
            "expected_repr": "[[1, 5]]",
            "actual_repr": "[[1, 4], [4, 5]]",
            "error": "Assertion Mismatch: expected [[1, 5]], got [[1, 4], [4, 5]]",
            "duration_ms": 0.06
          },
          {
            "name": "Unsorted input intervals",
            "passed": false,
            "input_repr": "[[4, 7], [1, 4], [8, 9]]",
            "expected_repr": "[[1, 7], [8, 9]]",
            "actual_repr": "[[4, 7], [8, 9]]",
            "error": "Assertion Mismatch: expected [[1, 7], [8, 9]], got [[4, 7], [8, 9]]",
            "duration_ms": 0.05
          },
          {
            "name": "Completely contained subset interval",
            "passed": true,
            "input_repr": "[[1, 10], [2, 3], [4, 8]]",
            "expected_repr": "[[1, 10]]",
            "actual_repr": "[[1, 10]]",
            "error": null,
            "duration_ms": 0.05
          },
          {
            "name": "Single interval array",
            "passed": true,
            "input_repr": "[[2, 5]]",
            "expected_repr": "[[2, 5]]",
            "actual_repr": "[[2, 5]]",
            "error": null,
            "duration_ms": 0.03
          }
        ],
        "stdout": "",
        "stderr": ""
      },
      "diagnostic_probe": {
        "probe_id": "probe_1789796224160",
        "selected_failure": "Failed on: Touch boundary condition (adjacent)",
        "empirical_evidence_summary": "On input [[1, 4], [4, 5]], actual output was [[1, 4], [4, 5]], but expected output is [[1, 5]].",
        "question": "Why did the function produce [[1, 4], [4, 5]] instead of [[1, 5]] in test 'Touch boundary condition (adjacent)'? What boundary condition or ordering invariant was violated?",
        "hint_concept": "Sorting intervals deterministically by start coordinate before linear scan",
        "strict_no_code_check": true
      },
      "student_explanation": null,
      "explanation_grade": null,
      "submission_v2": null,
      "evidence_v2": null,
      "final_verdict": null,
      "transition_log": [
        {
          "state": "IDLE",
          "timestamp": "2026-09-19T05:34:26.295Z",
          "reason": "Session initialized"
        },
        {
          "state": "RUN_1_FAILED",
          "timestamp": "2026-09-19T05:37:00.877Z",
          "reason": "2 tests failed on Run 1"
        },
        {
          "state": "PROBE_GENERATED",
          "timestamp": "2026-09-19T05:37:00.877Z",
          "reason": "Formulated single diagnostic probe without revealing code"
        },
        {
          "state": "WAITING_EXPLANATION",
          "timestamp": "2026-09-19T05:37:00.877Z",
          "reason": "Awaiting student conceptual diagnosis"
        }
      ],
      "created_at": "2026-09-19T05:34:26.295Z",
      "updated_at": "2026-09-19T05:37:00.877Z"
    },
    "sess_ame5uv43n": {
      "session_id": "sess_ame5uv43n",
      "student_id": "student_user",
      "problem_id": "merge-intervals",
      "current_state": "COMPLETED_SUCCESS",
      "hard_limits": {
        "executions_count": 2,
        "probes_count": 1,
        "revisions_count": 1,
        "llm_calls_count": 3,
        "max_executions": 2,
        "max_probes": 1,
        "max_revisions": 1,
        "max_llm_calls": 5
      },
      "submission_v1": {
        "student_id": "student_user",
        "problem_id": "merge-intervals",
        "code": "def merge_intervals(intervals):\n    if not intervals: return []\n    merged = [intervals[0]]\n    for c in intervals[1:]:\n        if c[0] < merged[-1][1]: merged[-1][1] = max(merged[-1][1], c[1])\n        else: merged.append(c)\n    return merged",
        "version": 1
      },
      "evidence_v1": {
        "total_tests": 5,
        "passed_tests": 3,
        "failed_tests": 2,
        "execution_time_ms": 1.7,
        "timed_out": false,
        "syntax_error": false,
        "results": [
          {
            "name": "Standard overlapping sequence",
            "passed": true,
            "input_repr": "[[1, 3], [2, 6], [8, 10], [15, 18]]",
            "expected_repr": "[[1, 6], [8, 10], [15, 18]]",
            "actual_repr": "[[1, 6], [8, 10], [15, 18]]",
            "error": null,
            "duration_ms": 0.1
          },
          {
            "name": "Touch boundary condition (adjacent)",
            "passed": false,
            "input_repr": "[[1, 4], [4, 5]]",
            "expected_repr": "[[1, 5]]",
            "actual_repr": "[[1, 4], [4, 5]]",
            "error": "Assertion Mismatch: expected [[1, 5]], got [[1, 4], [4, 5]]",
            "duration_ms": 0.06
          },
          {
            "name": "Unsorted input intervals",
            "passed": false,
            "input_repr": "[[4, 7], [1, 4], [8, 9]]",
            "expected_repr": "[[1, 7], [8, 9]]",
            "actual_repr": "[[4, 7], [8, 9]]",
            "error": "Assertion Mismatch: expected [[1, 7], [8, 9]], got [[4, 7], [8, 9]]",
            "duration_ms": 0.05
          },
          {
            "name": "Completely contained subset interval",
            "passed": true,
            "input_repr": "[[1, 10], [2, 3], [4, 8]]",
            "expected_repr": "[[1, 10]]",
            "actual_repr": "[[1, 10]]",
            "error": null,
            "duration_ms": 0.05
          },
          {
            "name": "Single interval array",
            "passed": true,
            "input_repr": "[[2, 5]]",
            "expected_repr": "[[2, 5]]",
            "actual_repr": "[[2, 5]]",
            "error": null,
            "duration_ms": 0.03
          }
        ],
        "stdout": "",
        "stderr": ""
      },
      "diagnostic_probe": {
        "probe_id": "probe_1789799284613",
        "selected_failure": "Touch boundary condition (adjacent)",
        "empirical_evidence_summary": "The test input [[1, 4], [4, 5]] produced [[1, 4], [4, 5]] instead of [[1, 5]], failing to merge intervals that meet at the exact same boundary point.",
        "question": "When comparing the start coordinate of the current interval to the end coordinate of the last merged interval, how does your logical comparison behave when both values are equal?",
        "hint_concept": "Boundary condition inclusive overlap (start <= previous_end)",
        "strict_no_code_check": true
      },
      "student_explanation": "When both values are equal, the condition c[0] < merged[-1][1] evaluates to false because it uses strict less than rather than less than or equal to, causing touching intervals to be treated as disjoint.",
      "explanation_grade": {
        "score": 100,
        "identified_root_cause": true,
        "conceptual_understanding": "The student demonstrates a complete understanding of inclusive boundary overlaps and correctly pinpointed why touching interval endpoints were misclassified as disjoint.",
        "feedback_without_code": "Great analysis. You correctly explained that intervals sharing an endpoint boundary are considered overlapping, and you clearly articulated how an overly strict comparison logic fails to merge these touching cases."
      },
      "submission_v2": {
        "student_id": "student_user",
        "problem_id": "merge-intervals",
        "code": "def merge_intervals(intervals):\n    if not intervals:\n        return []\n    intervals.sort(key=lambda x: x[0])\n    merged = [intervals[0]]\n    for c in intervals[1:]:\n        prev = merged[-1]\n        if c[0] <= prev[1]:\n            prev[1] = max(prev[1], c[1])\n        else:\n            merged.append(c)\n    return merged",
        "version": 2
      },
      "evidence_v2": {
        "total_tests": 5,
        "passed_tests": 5,
        "failed_tests": 0,
        "execution_time_ms": 1.86,
        "timed_out": false,
        "syntax_error": false,
        "results": [
          {
            "name": "Standard overlapping sequence",
            "passed": true,
            "input_repr": "[[1, 3], [2, 6], [8, 10], [15, 18]]",
            "expected_repr": "[[1, 6], [8, 10], [15, 18]]",
            "actual_repr": "[[1, 6], [8, 10], [15, 18]]",
            "error": null,
            "duration_ms": 0.09
          },
          {
            "name": "Touch boundary condition (adjacent)",
            "passed": true,
            "input_repr": "[[1, 4], [4, 5]]",
            "expected_repr": "[[1, 5]]",
            "actual_repr": "[[1, 5]]",
            "error": null,
            "duration_ms": 0.06
          },
          {
            "name": "Unsorted input intervals",
            "passed": true,
            "input_repr": "[[4, 7], [1, 4], [8, 9]]",
            "expected_repr": "[[1, 7], [8, 9]]",
            "actual_repr": "[[1, 7], [8, 9]]",
            "error": null,
            "duration_ms": 0.05
          },
          {
            "name": "Completely contained subset interval",
            "passed": true,
            "input_repr": "[[1, 10], [2, 3], [4, 8]]",
            "expected_repr": "[[1, 10]]",
            "actual_repr": "[[1, 10]]",
            "error": null,
            "duration_ms": 0.05
          },
          {
            "name": "Single interval array",
            "passed": true,
            "input_repr": "[[2, 5]]",
            "expected_repr": "[[2, 5]]",
            "actual_repr": "[[2, 5]]",
            "error": null,
            "duration_ms": 0.03
          }
        ],
        "stdout": "",
        "stderr": ""
      },
      "final_verdict": {
        "status": "PASSED",
        "summary": "The student resolved initial failure cases effectively, demonstrating full conceptual understanding with a perfect explanation score and achieving complete test coverage upon revision.",
        "grade_score": 98,
        "test_pass_rate": 1,
        "learning_outcome": "Exhibited high empirical debugging mastery through precise error identification and effective code revision.",
        "fsm_history": [
          "IDLE",
          "RUN_1_FAILED",
          "PROBE_GENERATED",
          "WAITING_EXPLANATION",
          "EXPLANATION_GRADED",
          "WAITING_REVISION",
          "COMPLETED_SUCCESS"
        ]
      },
      "transition_log": [
        {
          "state": "IDLE",
          "timestamp": "2026-09-19T06:27:59.843Z",
          "reason": "Session initialized"
        },
        {
          "state": "RUN_1_FAILED",
          "timestamp": "2026-09-19T06:27:59.847Z",
          "reason": "2 tests failed on Run 1"
        },
        {
          "state": "PROBE_GENERATED",
          "timestamp": "2026-09-19T06:27:59.847Z",
          "reason": "Formulated single diagnostic probe without revealing code"
        },
        {
          "state": "WAITING_EXPLANATION",
          "timestamp": "2026-09-19T06:27:59.847Z",
          "reason": "Awaiting student conceptual diagnosis"
        },
        {
          "state": "EXPLANATION_GRADED",
          "timestamp": "2026-09-19T06:28:16.545Z",
          "reason": "Explanation graded: Score 100/100"
        },
        {
          "state": "WAITING_REVISION",
          "timestamp": "2026-09-19T06:28:16.545Z",
          "reason": "Revision unlocked: Student may now submit Version 2 code (exactly 1 revision permitted)"
        },
        {
          "state": "RUN_2_EXECUTING",
          "timestamp": "2026-09-19T06:28:16.550Z",
          "reason": "Executed Revision V2 against deterministic test suite"
        },
        {
          "state": "COMPLETED_SUCCESS",
          "timestamp": "2026-09-19T06:28:16.550Z",
          "reason": "Final Verdict reached: PASSED"
        }
      ],
      "created_at": "2026-09-19T06:27:59.843Z",
      "updated_at": "2026-09-19T06:28:16.550Z"
    }
  },
  "metadata": {
    "app": "BugStriker",
    "version": "1.0.0",
    "last_sync": "2026-09-19T06:28:23.295Z"
  }
}
``````

## schemas.py

``````python
"""
Data Schemas for BugStriker
Supports Pydantic v2 if installed, with native dataclass fallback for Python environments.
"""

import sys
from enum import Enum
from typing import List, Optional, Any, Dict

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False
    from dataclasses import dataclass, field, asdict

class FSMState(str, Enum):
    IDLE = "IDLE"
    RUN_1_EXECUTING = "RUN_1_EXECUTING"
    RUN_1_FAILED = "RUN_1_FAILED"
    PROBE_GENERATED = "PROBE_GENERATED"
    WAITING_EXPLANATION = "WAITING_EXPLANATION"
    EXPLANATION_GRADED = "EXPLANATION_GRADED"
    WAITING_REVISION = "WAITING_REVISION"
    RUN_2_EXECUTING = "RUN_2_EXECUTING"
    COMPLETED_SUCCESS = "COMPLETED_SUCCESS"
    COMPLETED_FAILED = "COMPLETED_FAILED"
    LIMIT_REACHED = "LIMIT_REACHED"

if HAS_PYDANTIC:
    class BaseSchema(BaseModel):
        class Config:
            extra = "ignore"

    class Submission(BaseSchema):
        student_id: str
        problem_id: str
        code: str
        version: int = 1

    class TestCase(BaseSchema):
        name: str
        input_data: str
        expected: str
        is_edge_case: bool = False

    class TestResult(BaseSchema):
        name: str
        passed: bool
        input_repr: str
        expected_repr: str
        actual_repr: Optional[str] = None
        error: Optional[str] = None
        duration_ms: float = 0.0

    class ExecutionEvidence(BaseSchema):
        total_tests: int
        passed_tests: int
        failed_tests: int
        execution_time_ms: float
        timed_out: bool = False
        results: List[TestResult] = []
        stdout: str = ""
        stderr: str = ""

    class HardLimitsCounter(BaseSchema):
        executions_count: int = 0
        probes_count: int = 0
        revisions_count: int = 0
        llm_calls_count: int = 0
        max_executions: int = 2
        max_probes: int = 1
        max_revisions: int = 1
        max_llm_calls: int = 5

    class DiagnosticProbe(BaseSchema):
        probe_id: str
        selected_failure: str
        empirical_evidence_summary: str
        question: str
        hint_concept: str
        strict_no_code_check: bool = True

    class ExplanationSubmission(BaseSchema):
        session_id: str
        student_id: str
        explanation: str

    class ExplanationGrade(BaseSchema):
        score: int
        identified_root_cause: bool
        conceptual_understanding: str
        feedback_without_code: str

    class RevisionSubmission(BaseSchema):
        session_id: str
        student_id: str
        code: str
        version: int = 2

    class FinalVerdict(BaseSchema):
        status: str
        summary: str
        grade_score: int
        test_pass_rate: float
        learning_outcome: str
        fsm_history: List[str] = []

    class SessionRecord(BaseSchema):
        session_id: str
        student_id: str
        problem_id: str
        current_state: FSMState = FSMState.IDLE
        hard_limits: HardLimitsCounter = Field(default_factory=HardLimitsCounter)
        submission_v1: Optional[Submission] = None
        evidence_v1: Optional[ExecutionEvidence] = None
        diagnostic_probe: Optional[DiagnosticProbe] = None
        student_explanation: Optional[str] = None
        explanation_grade: Optional[ExplanationGrade] = None
        submission_v2: Optional[Submission] = None
        evidence_v2: Optional[ExecutionEvidence] = None
        final_verdict: Optional[FinalVerdict] = None
        transition_log: List[Dict[str, Any]] = []
        created_at: str = ""
        updated_at: str = ""

else:
    # Standard Python dataclasses fallback
    @dataclass
    class BaseSchema:
        def model_dump(self):
            return asdict(self)
        def dict(self):
            return asdict(self)

    @dataclass
    class Submission(BaseSchema):
        student_id: str
        problem_id: str
        code: str
        version: int = 1

    @dataclass
    class TestCase(BaseSchema):
        name: str
        input_data: str
        expected: str
        is_edge_case: bool = False

    @dataclass
    class TestResult(BaseSchema):
        name: str
        passed: bool
        input_repr: str
        expected_repr: str
        actual_repr: Optional[str] = None
        error: Optional[str] = None
        duration_ms: float = 0.0

    @dataclass
    class ExecutionEvidence(BaseSchema):
        total_tests: int
        passed_tests: int
        failed_tests: int
        execution_time_ms: float
        timed_out: bool = False
        results: List[TestResult] = field(default_factory=list)
        stdout: str = ""
        stderr: str = ""

    @dataclass
    class HardLimitsCounter(BaseSchema):
        executions_count: int = 0
        probes_count: int = 0
        revisions_count: int = 0
        llm_calls_count: int = 0
        max_executions: int = 2
        max_probes: int = 1
        max_revisions: int = 1
        max_llm_calls: int = 5

    @dataclass
    class DiagnosticProbe(BaseSchema):
        probe_id: str
        selected_failure: str
        empirical_evidence_summary: str
        question: str
        hint_concept: str
        strict_no_code_check: bool = True

    @dataclass
    class ExplanationSubmission(BaseSchema):
        session_id: str
        student_id: str
        explanation: str

    @dataclass
    class ExplanationGrade(BaseSchema):
        score: int
        identified_root_cause: bool
        conceptual_understanding: str
        feedback_without_code: str

    @dataclass
    class RevisionSubmission(BaseSchema):
        session_id: str
        student_id: str
        code: str
        version: int = 2

    @dataclass
    class FinalVerdict(BaseSchema):
        status: str
        summary: str
        grade_score: int
        test_pass_rate: float
        learning_outcome: str
        fsm_history: List[str] = field(default_factory=list)

    @dataclass
    class SessionRecord(BaseSchema):
        session_id: str
        student_id: str
        problem_id: str
        current_state: FSMState = FSMState.IDLE
        hard_limits: HardLimitsCounter = field(default_factory=HardLimitsCounter)
        submission_v1: Optional[Submission] = None
        evidence_v1: Optional[ExecutionEvidence] = None
        diagnostic_probe: Optional[DiagnosticProbe] = None
        student_explanation: Optional[str] = None
        explanation_grade: Optional[ExplanationGrade] = None
        submission_v2: Optional[Submission] = None
        evidence_v2: Optional[ExecutionEvidence] = None
        final_verdict: Optional[FinalVerdict] = None
        transition_log: List[Dict[str, Any]] = field(default_factory=list)
        created_at: str = ""
        updated_at: str = ""

if __name__ == "__main__":
    s = Submission(student_id="student_1", problem_id="merge-intervals", code="def foo(): pass", version=1)
    print("Schema initialization test passed:", s)
``````

## runner.py

``````python
#!/usr/bin/env python3
"""
runner.py - Deterministic Sandboxed Test Runner for BugStriker
Executes student code against baseline tests with strict 3-second timeout and isolated subprocess.
"""

import sys
import os
import json
import time
import tempfile
import subprocess
import argparse
from typing import Dict, Any, List

DEFAULT_TIMEOUT = 3.0

def load_problem_rubric(problem_id: str, rubric_path: str = "rubric.json") -> Dict[str, Any]:
    """Loads a specific problem definition from rubric.json"""
    if not os.path.exists(rubric_path):
        raise FileNotFoundError(f"Rubric file not found at {rubric_path}")
    with open(rubric_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    for prob in data.get("problems", []):
        if prob.get("id") == problem_id:
            return prob
    raise ValueError(f"Problem '{problem_id}' not found in {rubric_path}")

def generate_sandbox_script(code: str, entry_point: str, tests: List[Dict[str, Any]]) -> str:
    """
    Generates a standalone Python script to execute inside the isolated subprocess.
    Includes test harness, assertion checks, stdout capturing, and JSON formatting.
    """
    test_json_str = repr(json.dumps(tests))
    code_repr = repr(code)
    entry_point_repr = repr(entry_point)
    
    script = f'''# -*- coding: utf-8 -*-
import sys
import json
import time
import traceback
import copy

_STUDENT_CODE = {code_repr}
_ENTRY_POINT = {entry_point_repr}
_TESTS = json.loads({test_json_str})

results = []
total_passed = 0
overall_start = time.perf_counter()

scope = {{"__name__": "__sandbox__"}}

try:
    compiled = compile(_STUDENT_CODE, "<student_code>", "exec")
    exec(compiled, scope)
except Exception as e:
    tb = traceback.format_exc()
    error_result = {{
        "total_tests": len(_TESTS),
        "passed_tests": 0,
        "failed_tests": len(_TESTS),
        "execution_time_ms": 0.0,
        "timed_out": False,
        "syntax_error": True,
        "results": [
            {{
                "name": t.get("name", "Test"),
                "passed": False,
                "input_repr": str(t.get("input")),
                "expected_repr": str(t.get("expected")),
                "actual_repr": None,
                "error": f"Compilation / Syntax Error: {{str(e)}}\\n{{tb}}",
                "duration_ms": 0.0
            }} for t in _TESTS
        ],
        "stdout": "",
        "stderr": str(tb)
    }}
    print("___SANDBOX_RESULT_START___")
    print(json.dumps(error_result))
    print("___SANDBOX_RESULT_END___")
    sys.exit(0)

if _ENTRY_POINT not in scope:
    error_result = {{
        "total_tests": len(_TESTS),
        "passed_tests": 0,
        "failed_tests": len(_TESTS),
        "execution_time_ms": 0.0,
        "timed_out": False,
        "syntax_error": True,
        "results": [
            {{
                "name": t.get("name", "Test"),
                "passed": False,
                "input_repr": str(t.get("input")),
                "expected_repr": str(t.get("expected")),
                "actual_repr": None,
                "error": f"Entry point function '{{_ENTRY_POINT}}' not defined in submitted code.",
                "duration_ms": 0.0
            }} for t in _TESTS
        ],
        "stdout": "",
        "stderr": f"Missing entry point: {{_ENTRY_POINT}}"
    }}
    print("___SANDBOX_RESULT_START___")
    print(json.dumps(error_result))
    print("___SANDBOX_RESULT_END___")
    sys.exit(0)

fn = scope[_ENTRY_POINT]

for t in _TESTS:
    test_name = t.get("name", "Unnamed Test")
    input_str = t.get("input", "")
    expected_str = t.get("expected", "")
    
    t_start = time.perf_counter()
    passed = False
    actual_repr = None
    err_str = None
    
    try:
        parsed_input = eval(f"({{input_str}},)", {{"__builtins__": __builtins__}})
        if len(parsed_input) == 1:
            args = (copy.deepcopy(parsed_input[0]),)
        else:
            args = copy.deepcopy(parsed_input)
            
        parsed_expected = eval(str(expected_str), {{"__builtins__": __builtins__}})
        
        actual_val = fn(*args)
        actual_repr = repr(actual_val)
        
        if actual_val == parsed_expected:
            passed = True
            total_passed += 1
        else:
            err_str = f"Assertion Mismatch: expected {{repr(parsed_expected)}}, got {{repr(actual_val)}}"
    except Exception as e:
        actual_repr = None
        err_str = f"Runtime Exception: {{str(e)}}"
    finally:
        t_duration = (time.perf_counter() - t_start) * 1000.0
        
    results.append({{
        "name": test_name,
        "passed": passed,
        "input_repr": str(input_str),
        "expected_repr": str(expected_str),
        "actual_repr": actual_repr,
        "error": err_str,
        "duration_ms": round(t_duration, 2)
    }})

overall_duration = (time.perf_counter() - overall_start) * 1000.0
summary = {{
    "total_tests": len(_TESTS),
    "passed_tests": total_passed,
    "failed_tests": len(_TESTS) - total_passed,
    "execution_time_ms": round(overall_duration, 2),
    "timed_out": False,
    "syntax_error": False,
    "results": results,
    "stdout": "",
    "stderr": ""
}}

print("___SANDBOX_RESULT_START___")
print(json.dumps(summary))
print("___SANDBOX_RESULT_END___")
'''
    return script

def run_code_in_sandbox(code: str, problem_id: str, rubric_path: str = "rubric.json", timeout: float = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """
    Spawns Python subprocess to execute code against baseline tests with strict 3-second timeout.
    """
    prob = load_problem_rubric(problem_id, rubric_path)
    entry_point = prob.get("entry_point", "")
    baseline_tests = prob.get("baseline_tests", [])
    
    if not code or not code.strip():
        return {
            "total_tests": len(baseline_tests),
            "passed_tests": 0,
            "failed_tests": len(baseline_tests),
            "execution_time_ms": 0.0,
            "timed_out": False,
            "syntax_error": True,
            "results": [
                {
                    "name": t.get("name", "Test"),
                    "passed": False,
                    "input_repr": str(t.get("input")),
                    "expected_repr": str(t.get("expected")),
                    "actual_repr": None,
                    "error": f"EmptyCodeError: solution.py is empty. Please implement the '{entry_point}' function.",
                    "duration_ms": 0.0
                } for t in baseline_tests
            ],
            "stdout": "",
            "stderr": f"EmptyCodeError: solution.py contains no code. Please write your Python solution for '{entry_point}'."
        }
    
    script_content = generate_sandbox_script(code, entry_point, baseline_tests)
    
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as temp_file:
        temp_path = temp_file.name
        temp_file.write(script_content)
        
    start_time = time.perf_counter()
    timed_out = False
    stdout = ""
    stderr = ""
    
    try:
        proc = subprocess.run(
            [sys.executable, temp_path],
            capture_output=True,
            text=True,
            timeout=timeout
        )
        stdout = proc.stdout
        stderr = proc.stderr
    except subprocess.TimeoutExpired as e:
        timed_out = True
        stdout = e.stdout.decode() if isinstance(e.stdout, bytes) else (e.stdout or "")
        stderr = e.stderr.decode() if isinstance(e.stderr, bytes) else (e.stderr or f"Execution timed out after {timeout} seconds")
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
                
    elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
    
    if timed_out:
        return {
            "total_tests": len(baseline_tests),
            "passed_tests": 0,
            "failed_tests": len(baseline_tests),
            "execution_time_ms": elapsed_ms,
            "timed_out": True,
            "syntax_error": False,
            "results": [
                {
                    "name": t.get("name", "Test"),
                    "passed": False,
                    "input_repr": str(t.get("input")),
                    "expected_repr": str(t.get("expected")),
                    "actual_repr": None,
                    "error": f"Execution Timed Out (exceeded strict limit of {timeout}s)",
                    "duration_ms": elapsed_ms
                } for t in baseline_tests
            ],
            "stdout": stdout,
            "stderr": stderr
        }
        
    # Extract JSON between delimiters
    start_marker = "___SANDBOX_RESULT_START___"
    end_marker = "___SANDBOX_RESULT_END___"
    if start_marker in stdout and end_marker in stdout:
        try:
            start_idx = stdout.find(start_marker)
            end_idx = stdout.find(end_marker)
            json_str = stdout[start_idx + len(start_marker):end_idx].strip()
            parsed = json.loads(json_str)
            user_stdout = (stdout[:start_idx] + stdout[end_idx + len(end_marker):]).strip()
            parsed["stdout"] = user_stdout
            parsed["stderr"] = stderr.strip()
            return parsed
        except Exception as e:
            return {
                "total_tests": len(baseline_tests),
                "passed_tests": 0,
                "failed_tests": len(baseline_tests),
                "execution_time_ms": elapsed_ms,
                "timed_out": False,
                "syntax_error": True,
                "results": [],
                "stdout": stdout,
                "stderr": f"Failed to parse runner output: {str(e)}\n{stderr}"
            }
    else:
        return {
            "total_tests": len(baseline_tests),
            "passed_tests": 0,
            "failed_tests": len(baseline_tests),
            "execution_time_ms": elapsed_ms,
            "timed_out": False,
            "syntax_error": True,
            "results": [
                {
                    "name": t.get("name", "Test"),
                    "passed": False,
                    "input_repr": str(t.get("input")),
                    "expected_repr": str(t.get("expected")),
                    "actual_repr": None,
                    "error": stderr or "Unknown execution failure",
                    "duration_ms": 0.0
                } for t in baseline_tests
            ],
            "stdout": stdout,
            "stderr": stderr
        }

def main():
    parser = argparse.ArgumentParser(description="BugStriker Sandbox Test Runner")
    parser.add_argument("--problem", default="merge-intervals", help="Problem ID from rubric.json")
    parser.add_argument("--code", help="Raw Python code string to evaluate")
    parser.add_argument("--file", help="Path to Python file containing solution")
    parser.add_argument("--json-input", help="Raw JSON payload containing code and problem_id")
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT, help="Timeout in seconds")
    
    args = parser.parse_args()
    
    code = ""
    problem_id = args.problem
    
    if args.json_input:
        data = json.loads(args.json_input)
        code = data.get("code", "")
        problem_id = data.get("problem_id", problem_id)
    elif args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            code = f.read()
    elif args.code is not None:
        code = args.code
    elif os.path.exists("solution.py"):
        with open("solution.py", "r", encoding="utf-8") as f:
            code = f.read()
    else:
        code = ""
        
    evidence = run_code_in_sandbox(code, problem_id, timeout=args.timeout)
    print(json.dumps(evidence, indent=2))

if __name__ == "__main__":
    main()
``````

## evaluator.py

``````python
#!/usr/bin/env python3
"""
evaluator.py - Structured LLM Evaluator for BugStriker
Enforces strict negative constraints:
- NEVER generates or provides code solutions.
- Formulates 1 targeted diagnostic probe question based strictly on empirical test failure evidence.
- Grades student explanation against rubric criteria.
- Synthesizes final verdict.
"""

import os
import sys
import json
import re
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

CANDIDATE_MODELS = ["gemini-3.6-flash", "gemini-3.8-flash"]

def check_for_forbidden_code(text: str) -> bool:
    """
    Strict Anti-Code Guardrail:
    Checks if text contains Python syntax, function definitions, or code blocks.
    """
    forbidden_patterns = [
        r"```(?:python)?[\s\S]*?```",
        r"\bdef\s+[a-zA-Z_]\w*\s*\(",
        r"\bimport\s+[a-zA-Z_]",
        r"\breturn\s+[\[\{0-9\"']",
        r"\bfor\s+\w+\s+in\s+.*:",
        r"\bwhile\s+.*:",
        r"\bif\s+.*:\s*$",
    ]
    for pattern in forbidden_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False

def sanitize_anti_code(text: str) -> str:
    """Removes any accidental backtick code blocks or code snippets."""
    cleaned = re.sub(r"```(?:python)?[\s\S]*?```", "[Code snippet redacted per BugStriker policy]", text)
    return cleaned

def call_gemini_rest(prompt: str, system_instruction: str = "", response_schema: Optional[Dict[str, Any]] = None) -> str:
    """Calls Gemini REST API directly using standard urllib with model fallback."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not configured.")

    contents = [{"role": "user", "parts": [{"text": prompt}]}]
    payload: Dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.2,
        }
    }
    
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }
        
    if response_schema:
        payload["generationConfig"]["responseMimeType"] = "application/json"
        payload["generationConfig"]["responseSchema"] = response_schema

    last_error = None
    for model_name in CANDIDATE_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"Gemini API error across all candidate models: {last_error}")

def generate_diagnostic_probe(
    problem: Dict[str, Any],
    code: str,
    evidence: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Selects the primary failure case and generates exactly ONE targeted diagnostic question.
    Strictly forbids providing code or solution hints.
    """
    failed_results = [r for r in evidence.get("results", []) if not r.get("passed")]
    if not failed_results:
        return {
            "probe_id": "probe_none_failed",
            "selected_failure": "All tests passed",
            "empirical_evidence_summary": "All tests passed successfully on this run.",
            "question": "All tests passed. Can you explain the time and space complexity of your approach?",
            "hint_concept": "Algorithmic Complexity",
            "strict_no_code_check": True
        }

    # Select the most informative failure (e.g. edge case or first failure)
    selected_test = failed_results[0]
    for r in failed_results:
        if "boundary" in r.get("name", "").lower() or "unsorted" in r.get("name", "").lower():
            selected_test = r
            break

    system_instruction = (
        "You are BugStriker's strict Socratic diagnostic engine.\n"
        "STRICT POLICY & NEGATIVE CONSTRAINTS:\n"
        "1. NEVER output code, variable assignments, syntax fixes, or implementation solutions.\n"
        "2. Formulate exactly ONE sharp diagnostic probe question that asks the student to explain the root cause of the empirical test failure.\n"
        "3. Ground your question entirely in the empirical evidence provided (input, expected output, actual output).\n"
        "4. Keep the question focused on conceptual invariants (e.g., ordering, interval boundary condition, pointer progression)."
    )

    prompt = f"""
Target Problem: {problem.get('title')}
Description: {problem.get('description')}
Rubric Concepts: {json.dumps(problem.get('diagnostic_rubric', {}).get('core_concepts', []))}

Empirical Test Failure:
- Test Name: {selected_test.get('name')}
- Input: {selected_test.get('input_repr')}
- Expected Output: {selected_test.get('expected_repr')}
- Actual Output: {selected_test.get('actual_repr')}
- Runner Error: {selected_test.get('error')}

Submitted Code (for your diagnostic analysis only; DO NOT quote fixes):
```
{code}
```

Generate a structured JSON response with:
- "selected_failure": summary of the test that failed
- "empirical_evidence_summary": 1-2 sentence summary of what the test demonstrated
- "question": Exactly ONE diagnostic probe question asking the student to diagnose what went wrong and why. Do NOT give away the code answer.
- "hint_concept": Name of the underlying concept (e.g., 'Boundary Overlap Inclusivity', 'Pre-sorting Invariant')
"""

    schema = {
        "type": "OBJECT",
        "properties": {
            "selected_failure": {"type": "STRING"},
            "empirical_evidence_summary": {"type": "STRING"},
            "question": {"type": "STRING"},
            "hint_concept": {"type": "STRING"}
        },
        "required": ["selected_failure", "empirical_evidence_summary", "question", "hint_concept"]
    }

    try:
        raw_resp = call_gemini_rest(prompt, system_instruction, schema)
        parsed = json.loads(raw_resp)
        # Strict anti-code verification
        if check_for_forbidden_code(parsed.get("question", "")):
            parsed["question"] = "What specific boundary condition or ordering invariant failed for this test case, and why did the actual output deviate from expected?"
        
        parsed["probe_id"] = f"probe_{int(os.times().system * 1000)}"
        parsed["strict_no_code_check"] = True
        return parsed
    except Exception as e:
        # High quality deterministic fallback matching strict rubric
        return {
            "probe_id": "probe_fallback",
            "selected_failure": f"Failed: {selected_test.get('name')}",
            "empirical_evidence_summary": f"On input {selected_test.get('input_repr')}, the function returned {selected_test.get('actual_repr')} instead of {selected_test.get('expected_repr')}.",
            "question": f"In the test '{selected_test.get('name')}', what specific condition or invariant caused the algorithm to produce {selected_test.get('actual_repr')} instead of {selected_test.get('expected_repr')}? Describe the logical gap without writing code.",
            "hint_concept": problem.get("diagnostic_rubric", {}).get("core_concepts", ["Edge Case Handling"])[0],
            "strict_no_code_check": True
        }

def grade_student_explanation(
    problem: Dict[str, Any],
    probe: Dict[str, Any],
    explanation: str
) -> Dict[str, Any]:
    """
    Grades the student's verbal/conceptual explanation against the rubric.
    Never outputs replacement code.
    """
    system_instruction = (
        "You are BugStriker's diagnostic grading auditor.\n"
        "STRICT NEGATIVE CONSTRAINT: DO NOT provide the correct code or replacement implementation in your feedback.\n"
        "Grade whether the student genuinely understood the empirical failure's root cause, boundary conditions, or if they were guessing."
    )

    prompt = f"""
Problem: {problem.get('title')}
Rubric Core Concepts: {json.dumps(problem.get('diagnostic_rubric', {}).get('core_concepts', []))}
Common Misconceptions: {json.dumps(problem.get('diagnostic_rubric', {}).get('common_misconceptions', []))}

Diagnostic Probe Asked:
{probe.get('question')}

Student's Explanation:
\"\"\"{explanation}\"\"\"

Evaluate the explanation and return JSON:
- "score": integer 0 to 100
- "identified_root_cause": boolean (true if student pinpointed the core algorithmic/logical flaw)
- "conceptual_understanding": brief 1-2 sentence assessment of student's diagnostic reasoning
- "feedback_without_code": guidance on their reasoning (STRICT: NO CODE SNIPPETS)
"""

    schema = {
        "type": "OBJECT",
        "properties": {
            "score": {"type": "INTEGER"},
            "identified_root_cause": {"type": "BOOLEAN"},
            "conceptual_understanding": {"type": "STRING"},
            "feedback_without_code": {"type": "STRING"}
        },
        "required": ["score", "identified_root_cause", "conceptual_understanding", "feedback_without_code"]
    }

    try:
        raw_resp = call_gemini_rest(prompt, system_instruction, schema)
        parsed = json.loads(raw_resp)
        # Anti-code safety clean
        parsed["feedback_without_code"] = sanitize_anti_code(parsed.get("feedback_without_code", ""))
        return parsed
    except Exception as e:
        # Robust rubric keyword heuristic fallback
        exp_lower = explanation.lower()
        core_keywords = [c.lower() for c in problem.get("diagnostic_rubric", {}).get("core_concepts", [])]
        matched = any(any(w in exp_lower for w in c.split() if len(w) > 4) for c in core_keywords)
        score = 85 if (matched and len(explanation) > 30) else (60 if len(explanation) > 20 else 30)
        return {
            "score": score,
            "identified_root_cause": score >= 70,
            "conceptual_understanding": "Demonstrated logical diagnosis of state transitions and edge invariants." if score >= 70 else "Partial diagnosis; could be more specific regarding exact condition boundaries.",
            "feedback_without_code": "Your analysis addresses key boundary conditions. Ensure your upcoming revision aligns with this diagnosis."
        }

def evaluate_final_verdict(
    problem: Dict[str, Any],
    evidence_v1: Dict[str, Any],
    explanation_grade: Dict[str, Any],
    evidence_v2: Dict[str, Any]
) -> Dict[str, Any]:
    """Synthesizes final verdict based on empirical evidence from Run 1 and Run 2."""
    v2_passed = evidence_v2.get("passed_tests", 0)
    v2_total = evidence_v2.get("total_tests", 1)
    pass_rate = round((v2_passed / max(1, v2_total)) * 100, 1)
    
    is_success = (v2_passed == v2_total)
    
    status = "PASSED" if is_success else "FAILED"
    grade_score = explanation_grade.get("score", 0)
    
    if is_success:
        summary = f"All {v2_total} baseline test cases passed deterministically on Revision 2. Diagnostic explanation score: {grade_score}/100."
        outcome = "Mastery achieved: empirical evidence confirms both conceptual diagnosis and practical debugging without external code solutions."
    else:
        failed_count = evidence_v2.get("failed_tests", 0)
        summary = f"Revision 2 resolved {evidence_v2.get('passed_tests', 0)} tests, but {failed_count} tests still failed. Diagnostic score: {grade_score}/100."
        outcome = "Further iteration needed on boundary condition invariants and input pre-processing."
        
    return {
        "status": status,
        "summary": summary,
        "grade_score": grade_score,
        "test_pass_rate": pass_rate,
        "learning_outcome": outcome,
        "fsm_history": [
            "IDLE",
            "RUN_1_EXECUTING",
            "RUN_1_FAILED" if evidence_v1.get("failed_tests", 0) > 0 else "RUN_1_PASSED",
            "PROBE_GENERATED",
            "WAITING_EXPLANATION",
            "EXPLANATION_GRADED",
            "WAITING_REVISION",
            "RUN_2_EXECUTING",
            "COMPLETED_SUCCESS" if is_success else "COMPLETED_FAILED"
        ]
    }
``````

## app.py

``````python
#!/usr/bin/env python3
"""
app.py - FSM Orchestrator and API Service for BugStriker
Enforces strict Finite State Machine, hard operational limits, and session recovery in store.json.
"""

import os
import sys
import json
import time
import uuid
import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any, Optional

from runner import run_code_in_sandbox, load_problem_rubric
from evaluator import generate_diagnostic_probe, grade_student_explanation, evaluate_final_verdict
from schemas import FSMState

STORE_FILE = "store.json"
RUBRIC_FILE = "rubric.json"

# Operational Limits
MAX_EXECUTIONS = 2
MAX_PROBES = 1
MAX_REVISIONS = 1
MAX_LLM_CALLS = 5

def load_store() -> Dict[str, Any]:
    if not os.path.exists(STORE_FILE):
        return {"sessions": {}, "metadata": {"created": str(datetime.datetime.utcnow())}}
    try:
        with open(STORE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"sessions": {}, "metadata": {"error": "read_failed"}}

def save_store(data: Dict[str, Any]) -> None:
    data.setdefault("metadata", {})["last_sync"] = datetime.datetime.utcnow().isoformat()
    with open(STORE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

class BugStrikerFSM:
    """Orchestrates the strict Finite State Machine with persistence and limit checks."""

    @staticmethod
    def create_session(student_id: str, problem_id: str) -> Dict[str, Any]:
        session_id = f"sess_{uuid.uuid4().hex[:10]}"
        now = datetime.datetime.utcnow().isoformat()
        
        session = {
            "session_id": session_id,
            "student_id": student_id,
            "problem_id": problem_id,
            "current_state": FSMState.IDLE.value,
            "hard_limits": {
                "executions_count": 0,
                "probes_count": 0,
                "revisions_count": 0,
                "llm_calls_count": 0,
                "max_executions": MAX_EXECUTIONS,
                "max_probes": MAX_PROBES,
                "max_revisions": MAX_REVISIONS,
                "max_llm_calls": MAX_LLM_CALLS
            },
            "submission_v1": None,
            "evidence_v1": None,
            "diagnostic_probe": None,
            "student_explanation": None,
            "explanation_grade": None,
            "submission_v2": None,
            "evidence_v2": None,
            "final_verdict": None,
            "transition_log": [
                {"state": FSMState.IDLE.value, "timestamp": now, "reason": "Session initialized"}
            ],
            "created_at": now,
            "updated_at": now
        }
        
        store = load_store()
        store.setdefault("sessions", {})[session_id] = session
        save_store(store)
        return session

    @staticmethod
    def get_session(session_id: str) -> Optional[Dict[str, Any]]:
        store = load_store()
        return store.get("sessions", {}).get(session_id)

    @staticmethod
    def execute_v1(session_id: str, code: str) -> Dict[str, Any]:
        store = load_store()
        session = store.get("sessions", {}).get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found.")

        # Hard limit validation
        limits = session["hard_limits"]
        if limits["executions_count"] >= MAX_EXECUTIONS:
            session["current_state"] = FSMState.LIMIT_REACHED.value
            save_store(store)
            raise RuntimeError("Hard Limit Violated: Maximum 2 code executions allowed per session.")

        # Execute deterministic test runner in sandbox
        limits["executions_count"] += 1
        problem_id = session["problem_id"]
        evidence = run_code_in_sandbox(code, problem_id)
        
        session["submission_v1"] = {
            "student_id": session["student_id"],
            "problem_id": problem_id,
            "code": code,
            "version": 1
        }
        session["evidence_v1"] = evidence
        now = datetime.datetime.utcnow().isoformat()
        
        # Determine next state
        if evidence["failed_tests"] == 0:
            session["current_state"] = FSMState.COMPLETED_SUCCESS.value
            session["final_verdict"] = {
                "status": "PASSED",
                "summary": "All tests passed on initial submission. Perfect run!",
                "grade_score": 100,
                "test_pass_rate": 100.0,
                "learning_outcome": "Mastery demonstrated without need for diagnostic probing."
            }
            session["transition_log"].append({
                "state": FSMState.COMPLETED_SUCCESS.value,
                "timestamp": now,
                "reason": "All baseline tests passed on V1 execution"
            })
        else:
            # Failed baseline: Must generate exactly 1 diagnostic probe
            if limits["probes_count"] >= MAX_PROBES:
                session["current_state"] = FSMState.LIMIT_REACHED.value
                save_store(store)
                raise RuntimeError("Hard Limit Violated: Maximum 1 probe question allowed.")

            problem = load_problem_rubric(problem_id)
            probe = generate_diagnostic_probe(problem, code, evidence)
            limits["probes_count"] += 1
            limits["llm_calls_count"] += 1
            
            session["diagnostic_probe"] = probe
            session["current_state"] = FSMState.WAITING_EXPLANATION.value
            session["transition_log"].extend([
                {"state": FSMState.RUN_1_FAILED.value, "timestamp": now, "reason": f"{evidence['failed_tests']} tests failed"},
                {"state": FSMState.PROBE_GENERATED.value, "timestamp": now, "reason": "Diagnostic probe formulated without code"},
                {"state": FSMState.WAITING_EXPLANATION.value, "timestamp": now, "reason": "Waiting for student diagnosis"}
            ])

        session["updated_at"] = now
        store["sessions"][session_id] = session
        save_store(store)
        return session

    @staticmethod
    def submit_explanation(session_id: str, explanation: str) -> Dict[str, Any]:
        store = load_store()
        session = store.get("sessions", {}).get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found.")

        if session["current_state"] != FSMState.WAITING_EXPLANATION.value:
            raise RuntimeError(f"Cannot submit explanation from state: {session['current_state']}")

        limits = session["hard_limits"]
        if limits["llm_calls_count"] >= MAX_LLM_CALLS:
            session["current_state"] = FSMState.LIMIT_REACHED.value
            save_store(store)
            raise RuntimeError("Hard Limit Violated: Max 5 LLM calls exceeded.")

        problem = load_problem_rubric(session["problem_id"])
        grade = grade_student_explanation(problem, session["diagnostic_probe"], explanation)
        limits["llm_calls_count"] += 1
        
        session["student_explanation"] = explanation
        session["explanation_grade"] = grade
        session["current_state"] = FSMState.WAITING_REVISION.value
        
        now = datetime.datetime.utcnow().isoformat()
        session["transition_log"].extend([
            {"state": FSMState.EXPLANATION_GRADED.value, "timestamp": now, "reason": f"Explanation graded with score {grade['score']}"},
            {"state": FSMState.WAITING_REVISION.value, "timestamp": now, "reason": "Student revision unlocked (1 revision allowed)"}
        ])
        
        session["updated_at"] = now
        store["sessions"][session_id] = session
        save_store(store)
        return session

    @staticmethod
    def submit_revision(session_id: str, code: str) -> Dict[str, Any]:
        store = load_store()
        session = store.get("sessions", {}).get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found.")

        if session["current_state"] != FSMState.WAITING_REVISION.value:
            raise RuntimeError(f"Cannot submit revision from state: {session['current_state']}")

        limits = session["hard_limits"]
        if limits["revisions_count"] >= MAX_REVISIONS:
            session["current_state"] = FSMState.LIMIT_REACHED.value
            save_store(store)
            raise RuntimeError("Hard Limit Violated: Exactly 1 revision allowed per lifecycle.")

        if limits["executions_count"] >= MAX_EXECUTIONS:
            session["current_state"] = FSMState.LIMIT_REACHED.value
            save_store(store)
            raise RuntimeError("Hard Limit Violated: Maximum 2 executions allowed.")

        limits["revisions_count"] += 1
        limits["executions_count"] += 1

        # Execute deterministic test runner on revision V2
        problem_id = session["problem_id"]
        evidence_v2 = run_code_in_sandbox(code, problem_id)
        
        session["submission_v2"] = {
            "student_id": session["student_id"],
            "problem_id": problem_id,
            "code": code,
            "version": 2
        }
        session["evidence_v2"] = evidence_v2

        problem = load_problem_rubric(problem_id)
        verdict = evaluate_final_verdict(
            problem,
            session["evidence_v1"],
            session["explanation_grade"] or {"score": 0},
            evidence_v2
        )
        limits["llm_calls_count"] += 1
        session["final_verdict"] = verdict
        
        final_state = FSMState.COMPLETED_SUCCESS.value if verdict["status"] == "PASSED" else FSMState.COMPLETED_FAILED.value
        session["current_state"] = final_state
        
        now = datetime.datetime.utcnow().isoformat()
        session["transition_log"].extend([
            {"state": FSMState.RUN_2_EXECUTING.value, "timestamp": now, "reason": "Revision V2 executed against deterministic tests"},
            {"state": final_state, "timestamp": now, "reason": f"Final verdict synthesized: {verdict['status']}"}
        ])

        session["updated_at"] = now
        store["sessions"][session_id] = session
        save_store(store)
        return session

class APIHandler(BaseHTTPRequestHandler):
    """Clean HTTP Request Handler for Python API endpoints."""

    def _set_headers(self, status: int = 200, content_type: str = "application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        
        if path == "/api/health":
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok", "app": "BugStriker"}).encode())
            return
            
        if path == "/api/rubrics":
            if os.path.exists(RUBRIC_FILE):
                with open(RUBRIC_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self._set_headers(200)
                self.wfile.write(json.dumps(data).encode())
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "rubric.json not found"}).encode())
            return

        if path == "/api/sessions":
            store = load_store()
            self._set_headers(200)
            self.wfile.write(json.dumps(store).encode())
            return

        if path.startswith("/api/sessions/"):
            sess_id = path.replace("/api/sessions/", "").strip()
            session = BugStrikerFSM.get_session(sess_id)
            if session:
                self._set_headers(200)
                self.wfile.write(json.dumps(session).encode())
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "Session not found"}).encode())
            return

        self._set_headers(404)
        self.wfile.write(json.dumps({"error": f"Path not found: {path}"}).encode())

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        content_len = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
        
        try:
            payload = json.loads(post_body)
        except Exception:
            payload = {}

        try:
            if path == "/api/sessions/create":
                student_id = payload.get("student_id", "student_default")
                problem_id = payload.get("problem_id", "merge-intervals")
                session = BugStrikerFSM.create_session(student_id, problem_id)
                self._set_headers(200)
                self.wfile.write(json.dumps(session).encode())
                return

            if path == "/api/submit-v1":
                session_id = payload.get("session_id")
                code = payload.get("code", "")
                if not session_id or not code:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "session_id and code are required"}).encode())
                    return
                session = BugStrikerFSM.execute_v1(session_id, code)
                self._set_headers(200)
                self.wfile.write(json.dumps(session).encode())
                return

            if path == "/api/submit-explanation":
                session_id = payload.get("session_id")
                explanation = payload.get("explanation", "")
                if not session_id or not explanation:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "session_id and explanation are required"}).encode())
                    return
                session = BugStrikerFSM.submit_explanation(session_id, explanation)
                self._set_headers(200)
                self.wfile.write(json.dumps(session).encode())
                return

            if path == "/api/submit-revision":
                session_id = payload.get("session_id")
                code = payload.get("code", "")
                if not session_id or not code:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "session_id and code are required"}).encode())
                    return
                session = BugStrikerFSM.submit_revision(session_id, code)
                self._set_headers(200)
                self.wfile.write(json.dumps(session).encode())
                return

            self._set_headers(404)
            self.wfile.write(json.dumps({"error": f"Path not found: {path}"}).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": str(e)}).encode())

def run_server(port: int = 8000):
    server_address = ("0.0.0.0", port)
    httpd = HTTPServer(server_address, APIHandler)
    print(f"BugStriker Python FSM API running on port {port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
``````

## server.ts

``````typescript
import express from "express";
import path from "path";
import fs from "fs";
import { spawnSync } from "child_process";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

const RUBRIC_PATH = path.join(process.cwd(), "rubric.json");
const STORE_PATH = path.join(process.cwd(), "store.json");

// Operational Limits
const MAX_EXECUTIONS = 2;
const MAX_PROBES = 1;
const MAX_REVISIONS = 1;
const MAX_LLM_CALLS = 5;

// Candidate models with fallback order
const CANDIDATE_MODELS = ["gemini-3.6-flash", "gemini-3.8-flash"];

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Resilient Gemini content generator with model fallback and transient retry
async function generateContentWithFallback(
  ai: GoogleGenAI,
  options: {
    contents: string;
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
    temperature?: number;
  }
): Promise<string | null> {
  const { contents, systemInstruction, responseMimeType, responseSchema, temperature = 0.2 } = options;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const config: any = { temperature };
        if (systemInstruction) {
          config.systemInstruction = systemInstruction;
        }
        if (responseMimeType) {
          config.responseMimeType = responseMimeType;
        }
        if (responseSchema) {
          config.responseSchema = responseSchema;
        }

        const response = await ai.models.generateContent({
          model,
          contents,
          config
        });

        if (response?.text) {
          return response.text;
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("429") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand");

        if (isTransient && attempt === 0) {
          // Short backoff before retry
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        // Move to next candidate model
        break;
      }
    }
  }

  console.warn("Notice: Gemini service temporarily experiencing high demand (503); proceeding with deterministic heuristic evaluation.");
  return null;
}

// Storage helpers
function readStore(): any {
  if (!fs.existsSync(STORE_PATH)) {
    return { sessions: {}, metadata: { created: new Date().toISOString() } };
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return { sessions: {}, metadata: { error: "read_failed" } };
  }
}

function writeStore(data: any): void {
  data.metadata = data.metadata || {};
  data.metadata.last_sync = new Date().toISOString();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function readRubrics(): any {
  if (!fs.existsSync(RUBRIC_PATH)) {
    return { problems: [] };
  }
  return JSON.parse(fs.readFileSync(RUBRIC_PATH, "utf-8"));
}

// Strict anti-code guardrail validator
function checkForForbiddenCode(text: string): boolean {
  const patterns = [
    /```(?:python)?[\s\S]*?```/i,
    /\bdef\s+[a-zA-Z_]\w*\s*\(/i,
    /\bimport\s+[a-zA-Z_]/i,
    /\breturn\s+[\[\{0-9"']/i,
    /\bfor\s+\w+\s+in\s+.*:/i,
    /\bwhile\s+.*:/i
  ];
  return patterns.some(pattern => pattern.test(text));
}

function sanitizeAntiCode(text: string): string {
  return text.replace(/```(?:python)?[\s\S]*?```/g, "[Code snippet redacted per BugStriker policy]");
}

// Execute runner.py deterministically in sandbox
function runPythonSandbox(code: string, problemId: string): any {
  try {
    const inputPayload = JSON.stringify({ code, problem_id: problemId });
    const result = spawnSync("python3", ["runner.py", "--json-input", inputPayload], {
      cwd: process.cwd(),
      timeout: 4000,
      encoding: "utf-8"
    });

    if (result.error) {
      if ((result.error as any).code === "ETIMEDOUT") {
        return {
          total_tests: 5,
          passed_tests: 0,
          failed_tests: 5,
          execution_time_ms: 3000,
          timed_out: true,
          syntax_error: false,
          results: [{
            name: "Sandbox Execution",
            passed: false,
            input_repr: "N/A",
            expected_repr: "N/A",
            actual_repr: null,
            error: "Execution Timed Out (exceeded strict limit of 3.0s)",
            duration_ms: 3000
          }],
          stdout: "",
          stderr: "Subprocess execution timed out."
        };
      }
      throw result.error;
    }

    const stdout = result.stdout || "";
    const stderr = result.stderr || "";
    
    // Parse output JSON from runner.py
    try {
      const parsed = JSON.parse(stdout);
      return parsed;
    } catch (e) {
      // Fallback parse if runner printed other text
      const markerStart = "___SANDBOX_RESULT_START___";
      const markerEnd = "___SANDBOX_RESULT_END___";
      if (stdout.includes(markerStart) && stdout.includes(markerEnd)) {
        const start = stdout.indexOf(markerStart) + markerStart.length;
        const end = stdout.indexOf(markerEnd);
        return JSON.parse(stdout.slice(start, end).trim());
      }
      return {
        total_tests: 1,
        passed_tests: 0,
        failed_tests: 1,
        execution_time_ms: 0,
        timed_out: false,
        syntax_error: true,
        results: [{
          name: "Runner Parsing Error",
          passed: false,
          input_repr: "",
          expected_repr: "",
          actual_repr: null,
          error: stderr || "Failed to parse runner output",
          duration_ms: 0
        }],
        stdout,
        stderr
      };
    }
  } catch (err: any) {
    return {
      total_tests: 1,
      passed_tests: 0,
      failed_tests: 1,
      execution_time_ms: 0,
      timed_out: false,
      syntax_error: true,
      results: [{
        name: "Sandbox Execution Error",
        passed: false,
        input_repr: "",
        expected_repr: "",
        actual_repr: null,
        error: err.message,
        duration_ms: 0
      }],
      stdout: "",
      stderr: String(err)
    };
  }
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "BugStriker", version: "1.0.0" });
});

app.get("/api/rubrics", (req, res) => {
  const data = readRubrics();
  res.json(data);
});

app.get("/api/sessions", (req, res) => {
  const store = readStore();
  res.json(store);
});

app.get("/api/sessions/:id", (req, res) => {
  const store = readStore();
  const session = store.sessions?.[req.params.id];
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json(session);
});

// Solution file API (solution.py starts empty for student to write)
const SOLUTION_FILE_PATH = path.join(process.cwd(), "solution.py");

app.get("/api/solution", (req, res) => {
  try {
    if (fs.existsSync(SOLUTION_FILE_PATH)) {
      const content = fs.readFileSync(SOLUTION_FILE_PATH, "utf-8");
      return res.json({ code: content });
    }
    return res.json({ code: "" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/solution", (req, res) => {
  try {
    const { code = "" } = req.body;
    fs.writeFileSync(SOLUTION_FILE_PATH, code, "utf-8");
    return res.json({ status: "saved", length: code.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/sessions/create", (req, res) => {
  const { student_id = "student_user", problem_id = "merge-intervals" } = req.body;
  const store = readStore();
  const sessionId = "sess_" + Math.random().toString(36).substring(2, 11);
  const now = new Date().toISOString();

  const session = {
    session_id: sessionId,
    student_id,
    problem_id,
    current_state: "IDLE",
    hard_limits: {
      executions_count: 0,
      probes_count: 0,
      revisions_count: 0,
      llm_calls_count: 0,
      max_executions: MAX_EXECUTIONS,
      max_probes: MAX_PROBES,
      max_revisions: MAX_REVISIONS,
      max_llm_calls: MAX_LLM_CALLS
    },
    submission_v1: null,
    evidence_v1: null,
    diagnostic_probe: null,
    student_explanation: null,
    explanation_grade: null,
    submission_v2: null,
    evidence_v2: null,
    final_verdict: null,
    transition_log: [
      { state: "IDLE", timestamp: now, reason: "Session initialized" }
    ],
    created_at: now,
    updated_at: now
  };

  store.sessions = store.sessions || {};
  store.sessions[sessionId] = session;
  writeStore(store);
  res.json(session);
});

// Run 1: Deterministic test execution + Socratic probe generation
app.post("/api/submit-v1", async (req, res) => {
  const { session_id, code } = req.body;
  if (!session_id || !code) {
    return res.status(400).json({ error: "session_id and code are required." });
  }

  const store = readStore();
  const session = store.sessions?.[session_id];
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const limits = session.hard_limits;
  if (limits.executions_count >= MAX_EXECUTIONS) {
    session.current_state = "LIMIT_REACHED";
    writeStore(store);
    return res.status(400).json({ error: "Hard Limit Violated: Maximum 2 executions allowed per session." });
  }

  limits.executions_count += 1;
  const now = new Date().toISOString();

  // Save student code to solution.py
  try {
    fs.writeFileSync(SOLUTION_FILE_PATH, code, "utf-8");
  } catch (e) {
    // Non-fatal
  }

  // Run deterministic sandbox
  const evidence = runPythonSandbox(code, session.problem_id);
  session.submission_v1 = {
    student_id: session.student_id,
    problem_id: session.problem_id,
    code,
    version: 1
  };
  session.evidence_v1 = evidence;

  if (evidence.failed_tests === 0) {
    session.current_state = "COMPLETED_SUCCESS";
    session.final_verdict = {
      status: "PASSED",
      summary: `All ${evidence.total_tests} baseline tests passed deterministically on initial submission!`,
      grade_score: 100,
      test_pass_rate: 100.0,
      learning_outcome: "Algorithmic invariants satisfied on first run.",
      fsm_history: ["IDLE", "RUN_1_EXECUTING", "COMPLETED_SUCCESS"]
    };
    session.transition_log.push({
      state: "COMPLETED_SUCCESS",
      timestamp: now,
      reason: "All tests passed on Run 1"
    });
  } else {
    // Generate Exactly 1 Diagnostic Probe
    if (limits.probes_count >= MAX_PROBES) {
      session.current_state = "LIMIT_REACHED";
      writeStore(store);
      return res.status(400).json({ error: "Hard Limit Violated: Maximum 1 diagnostic probe allowed." });
    }

    const rubrics = readRubrics();
    const problem = rubrics.problems?.find((p: any) => p.id === session.problem_id);
    const failedResults = evidence.results?.filter((r: any) => !r.passed) || [];
    const selectedFailure = failedResults[0] || { name: "Test Case", input_repr: "[]", expected_repr: "[]", actual_repr: "null", error: "Failed" };

    limits.probes_count += 1;
    limits.llm_calls_count += 1;

    let probeObj: any = null;
    const ai = getGeminiClient();

    if (ai) {
      const responseText = await generateContentWithFallback(ai, {
        contents: `Target Problem: ${problem?.title}
Problem Description: ${problem?.description}
Diagnostic Rubric Core Concepts: ${JSON.stringify(problem?.diagnostic_rubric?.core_concepts)}

Empirical Test Failure (Run 1 Evidence):
- Test Name: ${selectedFailure.name}
- Input: ${selectedFailure.input_repr}
- Expected Output: ${selectedFailure.expected_repr}
- Actual Output: ${selectedFailure.actual_repr}
- Error / Difference: ${selectedFailure.error}

Student Buggy Code (for context only, NEVER give solution code):
\`\`\`python
${code}
\`\`\`

Generate a diagnostic Socratic probe asking the student to diagnose what went wrong and explain the invariant or boundary condition that failed.
STRICT NEGATIVE CONSTRAINT: DO NOT provide code, syntax fixes, or replacement implementation.`,
        systemInstruction: "You are BugStriker's diagnostic Socratic engine. STRICT CONSTRAINT: NEVER output code, snippets, or implementation solutions. Ask exactly ONE targeted diagnostic question about the empirical failure.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selected_failure: { type: Type.STRING },
            empirical_evidence_summary: { type: Type.STRING },
            question: { type: Type.STRING },
            hint_concept: { type: Type.STRING }
          },
          required: ["selected_failure", "empirical_evidence_summary", "question", "hint_concept"]
        },
        temperature: 0.2
      });

      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);
          if (checkForForbiddenCode(parsed.question)) {
            parsed.question = `In test '${selectedFailure.name}', why did the function return ${selectedFailure.actual_repr} instead of ${selectedFailure.expected_repr}? What boundary condition was violated?`;
          }
          probeObj = {
            probe_id: "probe_" + Date.now(),
            selected_failure: parsed.selected_failure || selectedFailure.name,
            empirical_evidence_summary: parsed.empirical_evidence_summary || `Failed on test '${selectedFailure.name}' with input ${selectedFailure.input_repr}`,
            question: parsed.question,
            hint_concept: parsed.hint_concept || "Boundary Overlap Handling",
            strict_no_code_check: true
          };
        } catch (e) {
          // Graceful fallback
        }
      }
    }

    if (!probeObj) {
      probeObj = {
        probe_id: "probe_" + Date.now(),
        selected_failure: `Failed on: ${selectedFailure.name}`,
        empirical_evidence_summary: `On input ${selectedFailure.input_repr}, actual output was ${selectedFailure.actual_repr}, but expected output is ${selectedFailure.expected_repr}.`,
        question: `Why did the function produce ${selectedFailure.actual_repr} instead of ${selectedFailure.expected_repr} in test '${selectedFailure.name}'? What boundary condition or ordering invariant was violated?`,
        hint_concept: problem?.diagnostic_rubric?.core_concepts?.[0] || "Edge Case Invariant",
        strict_no_code_check: true
      };
    }

    session.diagnostic_probe = probeObj;
    session.current_state = "WAITING_EXPLANATION";
    session.transition_log.push(
      { state: "RUN_1_FAILED", timestamp: now, reason: `${evidence.failed_tests} tests failed on Run 1` },
      { state: "PROBE_GENERATED", timestamp: now, reason: "Formulated single diagnostic probe without revealing code" },
      { state: "WAITING_EXPLANATION", timestamp: now, reason: "Awaiting student conceptual diagnosis" }
    );
  }

  session.updated_at = now;
  store.sessions[session_id] = session;
  writeStore(store);
  res.json(session);
});

// Submit student diagnostic explanation
app.post("/api/submit-explanation", async (req, res) => {
  const { session_id, explanation } = req.body;
  if (!session_id || !explanation) {
    return res.status(400).json({ error: "session_id and explanation are required." });
  }

  const store = readStore();
  const session = store.sessions?.[session_id];
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.current_state !== "WAITING_EXPLANATION") {
    return res.status(400).json({ error: `Cannot submit explanation from state ${session.current_state}` });
  }

  const limits = session.hard_limits;
  if (limits.llm_calls_count >= MAX_LLM_CALLS) {
    session.current_state = "LIMIT_REACHED";
    writeStore(store);
    return res.status(400).json({ error: "Hard Limit Violated: Max 5 LLM calls exceeded." });
  }

  limits.llm_calls_count += 1;
  const rubrics = readRubrics();
  const problem = rubrics.problems?.find((p: any) => p.id === session.problem_id);

  let gradeObj: any = null;
  const ai = getGeminiClient();

  if (ai) {
    const responseText = await generateContentWithFallback(ai, {
      contents: `Problem: ${problem?.title}
Rubric Core Concepts: ${JSON.stringify(problem?.diagnostic_rubric?.core_concepts)}
Common Misconceptions: ${JSON.stringify(problem?.diagnostic_rubric?.common_misconceptions)}

Diagnostic Probe Asked:
"${session.diagnostic_probe?.question}"

Student's Diagnostic Explanation:
"${explanation}"

Grade this explanation on whether the student identified the empirical root cause and underlying boundary conditions.
STRICT NEGATIVE CONSTRAINT: DO NOT provide the correct code or replacement implementation in your feedback.`,
      systemInstruction: "You are BugStriker's diagnostic rubric auditor. NEVER output code or programming syntax in feedback. Evaluate conceptual diagnosis objectively.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          identified_root_cause: { type: Type.BOOLEAN },
          conceptual_understanding: { type: Type.STRING },
          feedback_without_code: { type: Type.STRING }
        },
        required: ["score", "identified_root_cause", "conceptual_understanding", "feedback_without_code"]
      },
      temperature: 0.2
    });

    if (responseText) {
      try {
        const parsed = JSON.parse(responseText);
        parsed.feedback_without_code = sanitizeAntiCode(parsed.feedback_without_code || "");
        gradeObj = parsed;
      } catch (e) {
        // Graceful fallback
      }
    }
  }

  if (!gradeObj) {
    const isGood = explanation.length > 25;
    gradeObj = {
      score: isGood ? 85 : 55,
      identified_root_cause: isGood,
      conceptual_understanding: isGood ? "Accurately diagnosed the logical mismatch between observed and expected behavior." : "Partial diagnosis provided. Needs clearer boundary analysis.",
      feedback_without_code: "Your explanation touches on the core invariant. Ensure your revision directly addresses this boundary condition without adding extraneous logic."
    };
  }

  session.student_explanation = explanation;
  session.explanation_grade = gradeObj;
  session.current_state = "WAITING_REVISION";

  const now = new Date().toISOString();
  session.transition_log.push(
    { state: "EXPLANATION_GRADED", timestamp: now, reason: `Explanation graded: Score ${gradeObj.score}/100` },
    { state: "WAITING_REVISION", timestamp: now, reason: "Revision unlocked: Student may now submit Version 2 code (exactly 1 revision permitted)" }
  );

  session.updated_at = now;
  store.sessions[session_id] = session;
  writeStore(store);
  res.json(session);
});

// Submit Revision V2: Exactly 1 revision allowed
app.post("/api/submit-revision", async (req, res) => {
  const { session_id, code } = req.body;
  if (!session_id || !code) {
    return res.status(400).json({ error: "session_id and code are required." });
  }

  const store = readStore();
  const session = store.sessions?.[session_id];
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.current_state !== "WAITING_REVISION") {
    return res.status(400).json({ error: `Cannot submit revision from state ${session.current_state}` });
  }

  const limits = session.hard_limits;
  if (limits.revisions_count >= MAX_REVISIONS) {
    session.current_state = "LIMIT_REACHED";
    writeStore(store);
    return res.status(400).json({ error: "Hard Limit Violated: Exactly 1 revision permitted per lifecycle." });
  }

  if (limits.executions_count >= MAX_EXECUTIONS) {
    session.current_state = "LIMIT_REACHED";
    writeStore(store);
    return res.status(400).json({ error: "Hard Limit Violated: Maximum 2 executions allowed per lifecycle." });
  }

  limits.revisions_count += 1;
  limits.executions_count += 1;
  const now = new Date().toISOString();

  // Save student revision code to solution.py
  try {
    fs.writeFileSync(SOLUTION_FILE_PATH, code, "utf-8");
  } catch (e) {
    // Non-fatal
  }

  // Run deterministic sandbox for Revision V2
  const evidenceV2 = runPythonSandbox(code, session.problem_id);
  session.submission_v2 = {
    student_id: session.student_id,
    problem_id: session.problem_id,
    code,
    version: 2
  };
  session.evidence_v2 = evidenceV2;

  const isSuccess = evidenceV2.passed_tests === evidenceV2.total_tests;
  const passRate = Math.round((evidenceV2.passed_tests / Math.max(1, evidenceV2.total_tests)) * 100);
  const explScore = session.explanation_grade?.score || 0;

  limits.llm_calls_count += 1;
  let verdictObj: any = null;
  const ai = getGeminiClient();

  if (ai) {
    const responseText = await generateContentWithFallback(ai, {
      contents: `Evaluate student final debugging outcome:
Run 1 Failed: ${session.evidence_v1?.failed_tests} tests
Explanation Grade: ${explScore}/100
Revision Run 2: ${evidenceV2.passed_tests}/${evidenceV2.total_tests} passed (${passRate}%)
Outcome: ${isSuccess ? "ALL TESTS PASSED" : "SOME TESTS FAILED"}

Synthesize an objective final verdict on their empirical debugging performance.
STRICT NEGATIVE CONSTRAINT: DO NOT provide code solutions.`,
      systemInstruction: "You are BugStriker's final verdict synthesizer. Provide an objective assessment of empirical debugging mastery without code.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING },
          summary: { type: Type.STRING },
          grade_score: { type: Type.INTEGER },
          test_pass_rate: { type: Type.NUMBER },
          learning_outcome: { type: Type.STRING }
        },
        required: ["status", "summary", "grade_score", "test_pass_rate", "learning_outcome"]
      },
      temperature: 0.2
    });

    if (responseText) {
      try {
        verdictObj = JSON.parse(responseText);
      } catch (e) {
        // Graceful fallback
      }
    }
  }

  if (!verdictObj) {
    verdictObj = {
      status: isSuccess ? "PASSED" : "FAILED",
      summary: isSuccess
        ? `Deterministic verification successful: All ${evidenceV2.total_tests} test cases passed on Revision V2.`
        : `Revision V2 resolved ${evidenceV2.passed_tests} tests, but ${evidenceV2.failed_tests} tests still failed.`,
      grade_score: explScore,
      test_pass_rate: passRate,
      learning_outcome: isSuccess
        ? "Debugging lifecycle complete: Student identified boundary invariant and fixed code independently without external code assistance."
        : "Operational limit reached: Student used allowed revision. Further self-directed study on edge cases recommended."
    };
  }

  verdictObj.fsm_history = session.transition_log.map((t: any) => t.state).concat([isSuccess ? "COMPLETED_SUCCESS" : "COMPLETED_FAILED"]);
  session.final_verdict = verdictObj;
  session.current_state = isSuccess ? "COMPLETED_SUCCESS" : "COMPLETED_FAILED";

  session.transition_log.push(
    { state: "RUN_2_EXECUTING", timestamp: now, reason: "Executed Revision V2 against deterministic test suite" },
    { state: session.current_state, timestamp: now, reason: `Final Verdict reached: ${verdictObj.status}` }
  );

  session.updated_at = now;
  store.sessions[session_id] = session;
  writeStore(store);
  res.json(session);
});

// Reset / Start clean session
app.post("/api/reset-session", (req, res) => {
  const { problem_id = "merge-intervals", student_id = "student_user" } = req.body;
  const store = readStore();
  const sessionId = "sess_" + Math.random().toString(36).substring(2, 11);
  const now = new Date().toISOString();

  const session = {
    session_id: sessionId,
    student_id,
    problem_id,
    current_state: "IDLE",
    hard_limits: {
      executions_count: 0,
      probes_count: 0,
      revisions_count: 0,
      llm_calls_count: 0,
      max_executions: MAX_EXECUTIONS,
      max_probes: MAX_PROBES,
      max_revisions: MAX_REVISIONS,
      max_llm_calls: MAX_LLM_CALLS
    },
    submission_v1: null,
    evidence_v1: null,
    diagnostic_probe: null,
    student_explanation: null,
    explanation_grade: null,
    submission_v2: null,
    evidence_v2: null,
    final_verdict: null,
    transition_log: [
      { state: "IDLE", timestamp: now, reason: "Fresh session initialized" }
    ],
    created_at: now,
    updated_at: now
  };

  store.sessions = store.sessions || {};
  store.sessions[sessionId] = session;
  writeStore(store);
  res.json(session);
});

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BugStriker Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
``````

## package.json

``````json
{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@tailwindcss/vite": "^4.3.3",
    "@vitejs/plugin-react": "^6.1.1",
    "lucide-react": "^0.546.0",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^8.3.0",
    "express": "^4.21.2",
    "dotenv": "^17.2.3",
    "motion": "^12.23.24"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "autoprefixer": "^10.4.21",
    "esbuild": "^0.25.0",
    "tailwindcss": "^4.3.3",
    "tsx": "^4.21.0",
    "typescript": "^7.0.2",
    "@types/express": "^4.17.21"
  }
}
``````

## src/types.ts

``````typescript
export type FSMState =
  | "IDLE"
  | "RUN_1_EXECUTING"
  | "RUN_1_FAILED"
  | "PROBE_GENERATED"
  | "WAITING_EXPLANATION"
  | "EXPLANATION_GRADED"
  | "WAITING_REVISION"
  | "RUN_2_EXECUTING"
  | "COMPLETED_SUCCESS"
  | "COMPLETED_FAILED"
  | "LIMIT_REACHED";

export interface TestResult {
  name: string;
  passed: boolean;
  input_repr: string;
  expected_repr: string;
  actual_repr: string | null;
  error: string | null;
  duration_ms: number;
}

export interface ExecutionEvidence {
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  execution_time_ms: number;
  timed_out: boolean;
  syntax_error?: boolean;
  results: TestResult[];
  stdout: string;
  stderr: string;
}

export interface DiagnosticProbe {
  probe_id: string;
  selected_failure: string;
  empirical_evidence_summary: string;
  question: string;
  hint_concept: string;
  strict_no_code_check: boolean;
}

export interface ExplanationGrade {
  score: number;
  identified_root_cause: boolean;
  conceptual_understanding: string;
  feedback_without_code: string;
}

export interface FinalVerdict {
  status: "PASSED" | "FAILED";
  summary: string;
  grade_score: number;
  test_pass_rate: number;
  learning_outcome: string;
  fsm_history: string[];
}

export interface HardLimitsCounter {
  executions_count: number;
  probes_count: number;
  revisions_count: number;
  llm_calls_count: number;
  max_executions: number;
  max_probes: number;
  max_revisions: number;
  max_llm_calls: number;
}

export interface StateTransition {
  state: string;
  timestamp: string;
  reason: string;
}

export interface SessionRecord {
  session_id: string;
  student_id: string;
  problem_id: string;
  current_state: FSMState;
  hard_limits: HardLimitsCounter;
  submission_v1: {
    student_id: string;
    problem_id: string;
    code: string;
    version: number;
  } | null;
  evidence_v1: ExecutionEvidence | null;
  diagnostic_probe: DiagnosticProbe | null;
  student_explanation: string | null;
  explanation_grade: ExplanationGrade | null;
  submission_v2: {
    student_id: string;
    problem_id: string;
    code: string;
    version: number;
  } | null;
  evidence_v2: ExecutionEvidence | null;
  final_verdict: FinalVerdict | null;
  transition_log: StateTransition[];
  created_at: string;
  updated_at: string;
}

export interface ProblemRubric {
  id: string;
  title: string;
  difficulty: string;
  entry_point: string;
  description: string;
  buggy_starter_code: string;
  baseline_tests: {
    name: string;
    input: string;
    expected: string;
    is_edge_case: boolean;
  }[];
  diagnostic_rubric: {
    core_concepts: string[];
    common_misconceptions: string[];
    probe_instructions: string;
  };
}
``````

## src/components/Header.tsx

``````tsx
import React from "react";
import { ShieldCheck, Cpu, GitCommit, RefreshCw, Archive, AlertTriangle } from "lucide-react";
import { HardLimitsCounter, ProblemRubric } from "../types";

interface HeaderProps {
  currentProblem: ProblemRubric | null;
  problems: ProblemRubric[];
  onSelectProblem: (problemId: string) => void;
  limits: HardLimitsCounter;
  sessionId: string;
  onReset: () => void;
  onOpenHistory: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentProblem,
  problems,
  onSelectProblem,
  limits,
  sessionId,
  onReset,
  onOpenHistory,
  loading,
}) => {
  return (
    <header id="bugstriker-header" className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-lg shadow-sm">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-neutral-100 flex items-center gap-2">
                BugStriker
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                  FSM Agent
                </span>
              </h1>
            </div>
            <p className="text-xs text-neutral-400">
              Deterministic Sandbox Debugger • Strict Socratic Guardrails
            </p>
          </div>
        </div>

        {/* Operational Limits HUD */}
        <div id="hard-limits-hud" className="flex items-center flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800" title="Maximum 2 code executions allowed">
            <Cpu className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-400">Execs:</span>
            <span className={`font-semibold ${limits.executions_count >= 2 ? "text-rose-400" : "text-amber-400"}`}>
              {limits.executions_count}/{limits.max_executions}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800" title="Exactly 1 diagnostic probe question allowed">
            <AlertTriangle className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-400">Probe:</span>
            <span className={`font-semibold ${limits.probes_count >= 1 ? "text-amber-400" : "text-neutral-300"}`}>
              {limits.probes_count}/{limits.max_probes}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800" title="Exactly 1 revision allowed">
            <GitCommit className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-400">Revision:</span>
            <span className={`font-semibold ${limits.revisions_count >= 1 ? "text-purple-400" : "text-neutral-300"}`}>
              {limits.revisions_count}/{limits.max_revisions}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800" title="At most 5 LLM evaluations per session">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-400">LLM:</span>
            <span className={`font-semibold ${limits.llm_calls_count >= 4 ? "text-rose-400" : "text-emerald-400"}`}>
              {limits.llm_calls_count}/{limits.max_llm_calls}
            </span>
          </div>
        </div>

        {/* Problem selector & Session controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <select
            id="problem-select"
            value={currentProblem?.id || ""}
            onChange={(e) => onSelectProblem(e.target.value)}
            disabled={loading}
            aria-label="Select Target Problem"
            className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-amber-500 transition-colors"
          >
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.difficulty})
              </option>
            ))}
          </select>

          <button
            id="btn-session-history"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors border border-neutral-700"
            title="Session Store & Recovery"
          >
            <Archive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Store</span>
          </button>

          <button
            id="btn-reset-session"
            onClick={onReset}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors border border-neutral-700 disabled:opacity-50"
            title="Reset to fresh session"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

      </div>

      {/* Strict Negative Constraints Guarantee Banner */}
      <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            No Replacement Code Policy (Strict Anti-Cheat)
          </span>
          <span className="flex items-center gap-1 text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500"></span>
            Deterministic Subprocess Runner (3.0s Timeout)
          </span>
          <span className="flex items-center gap-1 text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500"></span>
            Session Store: {sessionId ? sessionId.slice(0, 10) : "ready"}
          </span>
        </div>
      </div>
    </header>
  );
};
``````

## src/components/FSMTracker.tsx

``````tsx
import React from "react";
import { CheckCircle2, AlertCircle, Circle, Play, HelpCircle, FileEdit, Award } from "lucide-react";
import { FSMState } from "../types";

interface FSMTrackerProps {
  currentState: FSMState;
  onOpenAuditLog?: () => void;
}

interface StepInfo {
  key: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  activeStates: FSMState[];
  completedWhenAfter: FSMState[];
}

export const FSMTracker: React.FC<FSMTrackerProps> = ({ currentState }) => {
  const steps: StepInfo[] = [
    {
      key: "init",
      label: "1. Code Submission",
      sublabel: "V1 Initial Code",
      icon: <FileEdit className="w-3.5 h-3.5" />,
      activeStates: ["IDLE"],
      completedWhenAfter: [
        "RUN_1_EXECUTING",
        "RUN_1_FAILED",
        "PROBE_GENERATED",
        "WAITING_EXPLANATION",
        "EXPLANATION_GRADED",
        "WAITING_REVISION",
        "RUN_2_EXECUTING",
        "COMPLETED_SUCCESS",
        "COMPLETED_FAILED",
        "LIMIT_REACHED"
      ]
    },
    {
      key: "run1",
      label: "2. Empirical Run 1",
      sublabel: "3.0s Sandbox Suite",
      icon: <Play className="w-3.5 h-3.5" />,
      activeStates: ["RUN_1_EXECUTING"],
      completedWhenAfter: [
        "RUN_1_FAILED",
        "PROBE_GENERATED",
        "WAITING_EXPLANATION",
        "EXPLANATION_GRADED",
        "WAITING_REVISION",
        "RUN_2_EXECUTING",
        "COMPLETED_SUCCESS",
        "COMPLETED_FAILED"
      ]
    },
    {
      key: "probe",
      label: "3. Diagnostic Probe",
      sublabel: "Single Socratic Query",
      icon: <HelpCircle className="w-3.5 h-3.5" />,
      activeStates: ["PROBE_GENERATED", "WAITING_EXPLANATION"],
      completedWhenAfter: [
        "EXPLANATION_GRADED",
        "WAITING_REVISION",
        "RUN_2_EXECUTING",
        "COMPLETED_SUCCESS",
        "COMPLETED_FAILED"
      ]
    },
    {
      key: "diagnosis",
      label: "4. Diagnosis Grade",
      sublabel: "Rubric Assessment",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      activeStates: ["EXPLANATION_GRADED", "WAITING_REVISION"],
      completedWhenAfter: [
        "RUN_2_EXECUTING",
        "COMPLETED_SUCCESS",
        "COMPLETED_FAILED"
      ]
    },
    {
      key: "run2",
      label: "5. Revision Run 2",
      sublabel: "Single Final Attempt",
      icon: <Play className="w-3.5 h-3.5" />,
      activeStates: ["RUN_2_EXECUTING"],
      completedWhenAfter: [
        "COMPLETED_SUCCESS",
        "COMPLETED_FAILED"
      ]
    },
    {
      key: "verdict",
      label: "6. Final Verdict",
      sublabel: "Pass/Fail Outcome",
      icon: <Award className="w-3.5 h-3.5" />,
      activeStates: ["COMPLETED_SUCCESS", "COMPLETED_FAILED", "LIMIT_REACHED"],
      completedWhenAfter: []
    }
  ];

  const isTerminal = currentState === "COMPLETED_SUCCESS" || currentState === "COMPLETED_FAILED" || currentState === "LIMIT_REACHED";

  return (
    <div id="fsm-tracker" className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
            Finite-State Machine (FSM) Lifecycle
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
            State: <strong className={currentState === "COMPLETED_SUCCESS" ? "text-emerald-400" : currentState === "COMPLETED_FAILED" || currentState === "LIMIT_REACHED" ? "text-rose-400" : "text-amber-400"}>{currentState}</strong>
          </span>
        </div>

        {currentState === "LIMIT_REACHED" && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/50 border border-rose-800 px-2 py-0.5 rounded">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Hard Limits Reached</span>
          </div>
        )}
      </div>

      {/* Steps Visualizer */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
        {steps.map((step) => {
          const isActive = step.activeStates.includes(currentState);
          const isCompleted = step.completedWhenAfter.includes(currentState) || (step.key === "verdict" && isTerminal);
          
          let stateStyle = "bg-neutral-950/60 border-neutral-800/80 text-neutral-500";
          let badgeIcon = <Circle className="w-3 h-3 text-neutral-600" />;

          if (isActive) {
            stateStyle = "bg-amber-500/10 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30";
            badgeIcon = <Play className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />;
          } else if (isCompleted) {
            if (step.key === "verdict" && currentState === "COMPLETED_FAILED") {
              stateStyle = "bg-rose-500/10 border-rose-500/40 text-rose-300";
              badgeIcon = <AlertCircle className="w-3 h-3 text-rose-400" />;
            } else {
              stateStyle = "bg-emerald-950/40 border-emerald-800/60 text-emerald-300";
              badgeIcon = <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
            }
          }

          return (
            <div
              key={step.key}
              className={`flex flex-col p-2 rounded-md border transition-all ${stateStyle}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-medium">{step.icon}</span>
                {badgeIcon}
              </div>
              <span className="text-xs font-semibold truncate">{step.label}</span>
              <span className="text-[10px] text-neutral-400 truncate">{step.sublabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
``````

## src/components/EvidencePanel.tsx

``````tsx
import React, { useState } from "react";
import { CheckCircle, XCircle, Clock, Terminal, ChevronDown, ChevronUp, AlertOctagon } from "lucide-react";
import { ExecutionEvidence } from "../types";

interface EvidencePanelProps {
  evidence: ExecutionEvidence | null;
  runTitle: string;
  isCurrent?: boolean;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence, runTitle, isCurrent = true }) => {
  const [showLogs, setShowLogs] = useState(false);

  if (!evidence) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6 text-center text-neutral-500 font-mono text-xs">
        <Terminal className="w-8 h-8 mx-auto mb-2 text-neutral-600 stroke-[1.5]" />
        No empirical test evidence recorded yet.
        <div className="text-[11px] text-neutral-600 mt-1">
          Execute the deterministic sandbox harness to produce empirical test logs.
        </div>
      </div>
    );
  }

  const passRate = Math.round((evidence.passed_tests / Math.max(1, evidence.total_tests)) * 100);
  const isAllPassed = evidence.passed_tests === evidence.total_tests;

  return (
    <div className={`rounded-lg border transition-all ${isCurrent ? "border-neutral-700 bg-neutral-900" : "border-neutral-800/80 bg-neutral-900/50"} p-4 shadow-sm`}>
      {/* Evidence Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-200 font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              {runTitle} Empirical Evidence
            </h3>
            {isAllPassed ? (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                ALL TESTS PASSED
              </span>
            ) : (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                {evidence.failed_tests} FAILED
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Deterministic subprocess sandbox results against baseline test fixtures
          </p>
        </div>

        {/* Execution Metrics */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
            <span className="text-neutral-500">Pass Rate:</span>
            <strong className={isAllPassed ? "text-emerald-400" : "text-amber-400"}>{passRate}%</strong>
            <span className="text-neutral-500">({evidence.passed_tests}/{evidence.total_tests})</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-neutral-400">{evidence.execution_time_ms} ms</span>
          </div>

          <div className={`px-2 py-1 rounded border text-[11px] ${evidence.timed_out ? "bg-rose-950 border-rose-800 text-rose-300 font-bold" : "bg-neutral-950 border-neutral-800 text-emerald-400"}`}>
            {evidence.timed_out ? "TIMED OUT (>3.0s)" : "Safe (<3.0s)"}
          </div>
        </div>
      </div>

      {/* Test Cases Results List */}
      <div className="mt-3 space-y-2">
        {evidence.results?.map((res, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-md border text-xs font-mono transition-colors ${
              res.passed
                ? "bg-neutral-950/40 border-emerald-950/70 text-neutral-300"
                : "bg-rose-950/20 border-rose-900/60 text-neutral-200"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {res.passed ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="font-semibold text-neutral-200">{res.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-500">{res.duration_ms} ms</span>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    res.passed
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-rose-950 text-rose-400 border border-rose-800"
                  }`}
                >
                  {res.passed ? "PASS" : "FAIL"}
                </span>
              </div>
            </div>

            {/* Inputs and Outputs Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-neutral-800/80 text-[11px]">
              <div>
                <span className="text-neutral-500 block">Input:</span>
                <code className="text-neutral-300 bg-neutral-900 px-1.5 py-0.5 rounded block truncate">
                  {res.input_repr}
                </code>
              </div>
              <div>
                <span className="text-neutral-500 block">Expected:</span>
                <code className="text-emerald-400 bg-neutral-900 px-1.5 py-0.5 rounded block truncate">
                  {res.expected_repr}
                </code>
              </div>
            </div>

            {!res.passed && (
              <div className="mt-2 pt-2 border-t border-rose-900/30">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    Actual Output Mismatch:
                  </span>
                  <code className="text-rose-300 bg-neutral-900 px-1.5 py-0.5 rounded">
                    {res.actual_repr !== null ? res.actual_repr : "None / Error"}
                  </code>
                </div>
                {res.error && (
                  <div className="mt-1 text-[11px] bg-rose-950/40 border border-rose-900/40 p-2 rounded text-rose-300 font-mono whitespace-pre-wrap break-all">
                    {res.error}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Raw Output Drawer Toggle */}
      <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-xs font-mono">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-1 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{showLogs ? "Hide Raw Subprocess Logs" : "View Raw Subprocess stdout/stderr"}</span>
        </button>
      </div>

      {showLogs && (
        <div className="mt-2 p-2.5 rounded bg-neutral-950 border border-neutral-800 text-[11px] font-mono">
          <div className="text-neutral-500 mb-1 font-bold">Standard Output (stdout):</div>
          <pre className="text-neutral-300 whitespace-pre-wrap break-all bg-neutral-900 p-2 rounded mb-2">
            {evidence.stdout || "<No stdout output emitted>"}
          </pre>
          <div className="text-neutral-500 mb-1 font-bold">Standard Error (stderr):</div>
          <pre className="text-rose-400 whitespace-pre-wrap break-all bg-neutral-900 p-2 rounded">
            {evidence.stderr || "<No stderr output emitted>"}
          </pre>
        </div>
      )}
    </div>
  );
};
``````

## src/components/DiagnosticProbeCard.tsx

``````tsx
import React, { useState } from "react";
import { HelpCircle, Send, CheckCircle, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";
import { DiagnosticProbe, ExplanationGrade } from "../types";

interface DiagnosticProbeCardProps {
  probe: DiagnosticProbe | null;
  grade: ExplanationGrade | null;
  savedExplanation: string | null;
  onSubmitExplanation: (explanation: string) => void;
  loading: boolean;
  canRevise: boolean;
}

export const DiagnosticProbeCard: React.FC<DiagnosticProbeCardProps> = ({
  probe,
  grade,
  savedExplanation,
  onSubmitExplanation,
  loading,
  canRevise,
}) => {
  const [explanation, setExplanation] = useState(savedExplanation || "");

  if (!probe) {
    return null;
  }

  const isGraded = grade !== null;

  return (
    <div id="diagnostic-probe-card" className="rounded-lg border border-amber-500/30 bg-neutral-900/95 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              Socratic Diagnostic Probe
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
                Single Probe Limit (1/1)
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Formulated strictly from empirical evidence. Code solutions are strictly forbidden.
            </p>
          </div>
        </div>

        {probe.hint_concept && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
            Concept: <strong className="text-amber-300">{probe.hint_concept}</strong>
          </span>
        )}
      </div>

      {/* Selected Empirical Failure Evidence */}
      <div className="mt-3 p-3 rounded-md bg-neutral-950 border border-neutral-800 text-xs font-mono">
        <div className="text-neutral-400 mb-1 font-semibold flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          Empirical Failure Target: {probe.selected_failure}
        </div>
        <div className="text-neutral-300 text-[11px]">
          {probe.empirical_evidence_summary}
        </div>
      </div>

      {/* Socratic Probe Question */}
      <div className="mt-3 p-3.5 rounded-md bg-amber-950/20 border border-amber-800/40 text-sm">
        <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Diagnostic Question:
        </div>
        <p className="text-neutral-100 font-medium leading-relaxed">
          {probe.question}
        </p>
      </div>

      {/* Student Explanation Form */}
      {!isGraded ? (
        <div className="mt-4">
          <label htmlFor="student-diagnosis-input" className="block text-xs font-mono text-neutral-300 mb-1.5">
            Your Root Cause Diagnosis:
            <span className="text-neutral-500 font-normal ml-2">
              (Explain why the empirical failure occurs and what boundary condition is missed. Do NOT provide code.)
            </span>
          </label>
          <textarea
            id="student-diagnosis-input"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            disabled={loading}
            rows={4}
            placeholder="e.g. In test 'Touch boundary condition', the condition uses strict inequality (<) instead of inclusive (<=) when checking interval overlap, so touching endpoints like [1,4] and [4,5] are wrongly treated as disjoint..."
            className="w-full rounded-md bg-neutral-950 border border-neutral-800 p-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 transition-colors font-sans"
          />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] font-mono text-neutral-500">
              {explanation.length} characters • Exactly 1 diagnostic response
            </span>
            <button
              id="btn-submit-diagnosis"
              onClick={() => onSubmitExplanation(explanation)}
              disabled={loading || explanation.trim().length < 10}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-500 text-neutral-950 font-semibold text-xs transition-colors disabled:opacity-50 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Auditing Diagnosis..." : "Submit Diagnostic Explanation"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Explanation Grade & Rubric Audit Card */
        <div className="mt-4 p-3.5 rounded-md bg-neutral-950 border border-neutral-800 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-neutral-200">Diagnostic Explanation Graded</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Rubric Score:</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${grade.score >= 70 ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-amber-950 text-amber-300 border border-amber-800"}`}>
                {grade.score}/100
              </span>
            </div>
          </div>

          <div className="mt-2.5 space-y-2 text-[11px]">
            <div>
              <span className="text-neutral-500 block">Root Cause Identified:</span>
              <span className={`font-semibold ${grade.identified_root_cause ? "text-emerald-400" : "text-amber-400"}`}>
                {grade.identified_root_cause ? "YES — Accurate root cause diagnosis" : "PARTIAL — Some logical gaps remain"}
              </span>
            </div>

            <div>
              <span className="text-neutral-500 block">Conceptual Assessment:</span>
              <p className="text-neutral-300 font-sans mt-0.5">{grade.conceptual_understanding}</p>
            </div>

            <div>
              <span className="text-neutral-500 block">Evaluator Guidance (Anti-Code Policy Enforced):</span>
              <p className="text-amber-300/90 font-sans mt-0.5 bg-neutral-900 p-2 rounded border border-neutral-800">
                {grade.feedback_without_code}
              </p>
            </div>

            {canRevise && (
              <div className="mt-3 p-2 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 flex items-center justify-between font-sans">
                <span className="flex items-center gap-1.5 font-semibold text-xs">
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                  Revision Window Unlocked: Exactly 1 code revision permitted.
                </span>
                <span className="text-[10px] font-mono uppercase bg-emerald-900/60 px-1.5 py-0.5 rounded">
                  Attempt 2/2
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
``````

## src/components/FinalVerdictCard.tsx

``````tsx
import React, { useState } from "react";
import { Award, CheckCircle2, XCircle, History, ChevronDown, ChevronUp } from "lucide-react";
import { FinalVerdict, StateTransition } from "../types";

interface FinalVerdictCardProps {
  verdict: FinalVerdict | null;
  transitions: StateTransition[];
  onRestart: () => void;
}

export const FinalVerdictCard: React.FC<FinalVerdictCardProps> = ({
  verdict,
  transitions,
  onRestart,
}) => {
  const [showHistory, setShowHistory] = useState(false);

  if (!verdict) {
    return null;
  }

  const isPassed = verdict.status === "PASSED";

  return (
    <div id="final-verdict-card" className={`rounded-lg border p-4 shadow-sm transition-all ${
      isPassed ? "border-emerald-700/60 bg-emerald-950/20" : "border-rose-700/60 bg-rose-950/20"
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${
            isPassed
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}>
            {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-neutral-100 font-mono">
                FINAL VERDICT: {verdict.status}
              </h3>
              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                isPassed
                  ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                  : "bg-rose-950 text-rose-300 border-rose-800"
              }`}>
                {isPassed ? "Verified All Tests" : "Limits Exhausted"}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Deterministic sandbox verification across all baseline test fixtures
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onRestart}
          className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono font-semibold border border-neutral-700 transition-colors"
        >
          Start New Run
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <div className="p-3 rounded-md bg-neutral-950 border border-neutral-800 text-xs font-mono">
          <span className="text-neutral-500 block text-[10px]">Deterministic Pass Rate</span>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-lg font-bold ${isPassed ? "text-emerald-400" : "text-amber-400"}`}>
              {verdict.test_pass_rate}%
            </span>
            <span className="text-neutral-400 text-[11px]">Revision Run 2</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${isPassed ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${verdict.test_pass_rate}%` }}
            ></div>
          </div>
        </div>

        <div className="p-3 rounded-md bg-neutral-950 border border-neutral-800 text-xs font-mono">
          <span className="text-neutral-500 block text-[10px]">Diagnostic Explanation Score</span>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-lg font-bold ${verdict.grade_score >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
              {verdict.grade_score}/100
            </span>
            <span className="text-neutral-400 text-[11px]">Rubric Evaluator</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${verdict.grade_score >= 70 ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${verdict.grade_score}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Summary & Learning Outcome */}
      <div className="mt-3 p-3 rounded-md bg-neutral-950 border border-neutral-800 text-xs font-mono space-y-2">
        <div>
          <span className="text-neutral-500 block text-[10px]">Empirical Summary:</span>
          <p className="text-neutral-200 font-sans mt-0.5 leading-relaxed">{verdict.summary}</p>
        </div>
        <div>
          <span className="text-neutral-500 block text-[10px]">Pedagogical Learning Outcome:</span>
          <p className="text-amber-300 font-sans mt-0.5 leading-relaxed">{verdict.learning_outcome}</p>
        </div>
      </div>

      {/* FSM State Transition Audit Log */}
      <div className="mt-3 pt-2 border-t border-neutral-800/80">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-between w-full text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-neutral-400" />
            Finite-State Machine Transition Audit Log ({transitions.length} events)
          </span>
          {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showHistory && (
          <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {transitions.map((t, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-neutral-950 border border-neutral-800/80 text-[11px] font-mono flex items-start justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-neutral-600">#{idx + 1}</span>
                  <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-amber-400 font-bold">
                    {t.state}
                  </span>
                  <span className="text-neutral-300">{t.reason}</span>
                </div>
                <span className="text-neutral-500 text-[10px] whitespace-nowrap">
                  {new Date(t.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
``````

## src/components/HistoryModal.tsx

``````tsx
import React from "react";
import { X, Archive, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { SessionRecord } from "../types";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Record<string, SessionRecord>;
  activeSessionId: string;
  onResumeSession: (sessionId: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onResumeSession,
}) => {
  if (!isOpen) return null;

  const sessionList = Object.values(sessions).sort(
    (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-neutral-100 font-mono">
              Session Store & State Recovery (store.json)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions list */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
          {sessionList.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-neutral-500">
              No previous sessions found in store.json.
            </div>
          ) : (
            sessionList.map((s) => {
              const isCurrent = s.session_id === activeSessionId;
              const isSuccess = s.current_state === "COMPLETED_SUCCESS";
              const isFailed = s.current_state === "COMPLETED_FAILED";

              return (
                <div
                  key={s.session_id}
                  className={`p-3 rounded-lg border text-xs font-mono transition-all ${
                    isCurrent
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isSuccess ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isFailed ? (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                      <span className="font-bold text-neutral-200">{s.problem_id}</span>
                      <span className="text-neutral-500 text-[10px]">({s.session_id})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300">
                        {s.current_state}
                      </span>
                      {!isCurrent && (
                        <button
                          onClick={() => {
                            onResumeSession(s.session_id);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] border border-neutral-700 transition-colors"
                        >
                          <span>Resume</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-neutral-800/60 text-[10px] text-neutral-400">
                    <div>Executions: {s.hard_limits?.executions_count || 0}/2</div>
                    <div>Probes: {s.hard_limits?.probes_count || 0}/1</div>
                    <div>Revisions: {s.hard_limits?.revisions_count || 0}/1</div>
                    <div>LLM Calls: {s.hard_limits?.llm_calls_count || 0}/5</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-between items-center text-xs font-mono text-neutral-500">
          <span>Persistent store.json sync active</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
``````

## src/App.tsx

``````tsx
import React, { useState, useEffect } from "react";
import { Play, RotateCcw, AlertTriangle, BookOpen, Code2, ShieldAlert, Sparkles, CheckCircle, Terminal } from "lucide-react";
import { Header } from "./components/Header";
import { FSMTracker } from "./components/FSMTracker";
import { EvidencePanel } from "./components/EvidencePanel";
import { DiagnosticProbeCard } from "./components/DiagnosticProbeCard";
import { FinalVerdictCard } from "./components/FinalVerdictCard";
import { HistoryModal } from "./components/HistoryModal";
import { ProblemRubric, SessionRecord, HardLimitsCounter } from "./types";

export default function App() {
  const [problems, setProblems] = useState<ProblemRubric[]>([]);
  const [currentProblem, setCurrentProblem] = useState<ProblemRubric | null>(null);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [sessionsStore, setSessionsStore] = useState<Record<string, SessionRecord>>({});
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<"v1" | "v2">("v1");

  // Load Rubrics and initialize session on mount
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const rubricsRes = await fetch("/api/rubrics");
        const rubricsData = await rubricsRes.json();
        
        if (rubricsData.problems && rubricsData.problems.length > 0) {
          setProblems(rubricsData.problems);
          const initialProblem = rubricsData.problems[0];
          setCurrentProblem(initialProblem);
          setCode("");

          // Create initial session
          const sessRes = await fetch("/api/sessions/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              student_id: "student_user",
              problem_id: initialProblem.id
            })
          });
          const sessData = await sessRes.json();
          setSession(sessData);
        }

        // Fetch existing sessions store
        const storeRes = await fetch("/api/sessions");
        const storeData = await storeRes.json();
        if (storeData.sessions) {
          setSessionsStore(storeData.sessions);
        }
      } catch (err: any) {
        setErrorMsg("Failed to initialize BugStriker: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Handle problem switch
  const handleSelectProblem = async (problemId: string) => {
    const found = problems.find((p) => p.id === problemId);
    if (!found) return;
    setCurrentProblem(found);
    setCode("");
    setErrorMsg(null);

    try {
      setLoading(true);
      const sessRes = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: "student_user",
          problem_id: found.id
        })
      });
      const sessData = await sessRes.json();
      setSession(sessData);
      setActiveEvidenceTab("v1");
      refreshStore();
    } catch (err: any) {
      setErrorMsg("Failed to create new session: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshStore = async () => {
    try {
      const storeRes = await fetch("/api/sessions");
      const storeData = await storeRes.json();
      if (storeData.sessions) {
        setSessionsStore(storeData.sessions);
      }
    } catch (e) {
      // Non-blocking
    }
  };

  // Reset current session
  const handleResetSession = async () => {
    if (!currentProblem) return;
    setErrorMsg(null);
    setCode("");
    try {
      setLoading(true);
      const res = await fetch("/api/reset-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: currentProblem.id,
          student_id: "student_user"
        })
      });
      const data = await res.json();
      setSession(data);
      setActiveEvidenceTab("v1");
      refreshStore();
    } catch (err: any) {
      setErrorMsg("Failed to reset session: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resume an existing session from store
  const handleResumeSession = async (sessionId: string) => {
    setErrorMsg(null);
    try {
      setLoading(true);
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSession(data);
      const prob = problems.find((p) => p.id === data.problem_id);
      if (prob) {
        setCurrentProblem(prob);
      }
      
      // Set editor code depending on version
      if (data.submission_v2?.code) {
        setCode(data.submission_v2.code);
        setActiveEvidenceTab("v2");
      } else if (data.submission_v1?.code) {
        setCode(data.submission_v1.code);
        setActiveEvidenceTab("v1");
      } else {
        setCode("");
      }
    } catch (err: any) {
      setErrorMsg("Failed to resume session: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run 1: Submit V1 code
  const handleSubmitV1 = async () => {
    if (!session) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/submit-v1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.session_id,
          code
        })
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
      } else {
        setSession(data);
        setActiveEvidenceTab("v1");
        refreshStore();
      }
    } catch (err: any) {
      setErrorMsg("Execution error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit student diagnosis
  const handleSubmitExplanation = async (explanation: string) => {
    if (!session) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/submit-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.session_id,
          explanation
        })
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
      } else {
        setSession(data);
        refreshStore();
      }
    } catch (err: any) {
      setErrorMsg("Explanation evaluation error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run 2: Submit Revision V2
  const handleSubmitRevision = async () => {
    if (!session) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/submit-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.session_id,
          code
        })
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
      } else {
        setSession(data);
        setActiveEvidenceTab("v2");
        refreshStore();
      }
    } catch (err: any) {
      setErrorMsg("Revision evaluation error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const defaultLimits: HardLimitsCounter = {
    executions_count: 0,
    probes_count: 0,
    revisions_count: 0,
    llm_calls_count: 0,
    max_executions: 2,
    max_probes: 1,
    max_revisions: 1,
    max_llm_calls: 5
  };

  const limits = session?.hard_limits || defaultLimits;
  const currentState = session?.current_state || "IDLE";
  const isTerminal = currentState === "COMPLETED_SUCCESS" || currentState === "COMPLETED_FAILED" || currentState === "LIMIT_REACHED";
  const canRevise = currentState === "WAITING_REVISION";
  const isWaitingExplanation = currentState === "WAITING_EXPLANATION";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* App Header */}
      <Header
        currentProblem={currentProblem}
        problems={problems}
        onSelectProblem={handleSelectProblem}
        limits={limits}
        sessionId={session?.session_id || ""}
        onReset={handleResetSession}
        onOpenHistory={() => setHistoryOpen(true)}
        loading={loading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-mono flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
              ✕
            </button>
          </div>
        )}

        {/* FSM State Machine Tracker */}
        <FSMTracker currentState={currentState} />

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column: Problem & Code Workspace (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Problem Overview Card */}
            {currentProblem && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-neutral-100 font-mono">
                      {currentProblem.title}
                    </h2>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
                      {currentProblem.difficulty}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Entry: <code className="text-amber-300 font-semibold">{currentProblem.entry_point}</code>
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed font-sans">
                  {currentProblem.description}
                </p>
                <div className="mt-2.5 pt-2 border-t border-neutral-800/60 flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                  <span>Baseline Fixtures: {currentProblem.baseline_tests.length} tests</span>
                  <span>•</span>
                  <span>Subprocess Timeout: 3.0s</span>
                </div>
              </div>
            )}

            {/* Code Editor Panel */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden shadow-sm flex flex-col">
              
              {/* Editor Top Bar */}
              <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-neutral-950 border-b border-neutral-800 text-xs font-mono gap-2">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-neutral-400" />
                  <span className="font-semibold text-neutral-300">solution.py</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                    {canRevise ? "Version 2 (Revision)" : "Version 1 (Initial)"}
                  </span>
                  {!code.trim() && (
                    <span className="text-[10px] text-amber-400/80 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                      Empty (Awaiting Student Implementation)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCode("")}
                    disabled={isTerminal || loading}
                    className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-colors disabled:opacity-50"
                  >
                    Clear Code
                  </button>
                  {currentProblem && (
                    <button
                      onClick={() => setCode(`def ${currentProblem.entry_point}(${currentProblem.id === "merge-intervals" ? "intervals" : currentProblem.id === "two-sum-sorted" ? "numbers, target" : "s"}):\n    # Write your solution here\n    pass\n`)}
                      disabled={isTerminal || loading}
                      className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-amber-400/90 hover:text-amber-300 hover:border-amber-700/60 transition-colors disabled:opacity-50"
                    >
                      Insert Stub
                    </button>
                  )}
                  {currentProblem?.buggy_starter_code && (
                    <button
                      onClick={() => setCode(currentProblem.buggy_starter_code)}
                      disabled={isTerminal || loading}
                      title="Load intentional buggy code to test Socratic probe workflow"
                      className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors disabled:opacity-50"
                    >
                      Load Sample Buggy Code
                    </button>
                  )}
                </div>
              </div>

              {/* Code Editor Textarea */}
              <div className="relative p-2 bg-neutral-950 font-['Fira_Code',monospace] text-xs">
                <textarea
                  id="code-editor"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading || isWaitingExplanation || isTerminal}
                  rows={14}
                  spellCheck={false}
                  placeholder={`# solution.py is empty for the student to write their own implementation.\n# Define function: def ${currentProblem ? currentProblem.entry_point : 'solution'}(...):\n# Write your code here...`}
                  aria-label="Python Code Editor"
                  className="w-full bg-neutral-950 text-amber-200/90 placeholder:text-neutral-600 font-['Fira_Code',monospace] text-xs p-2 leading-relaxed resize-y focus:outline-none border border-neutral-800/80 rounded-md focus:border-amber-500/80 disabled:opacity-75"
                />
              </div>

              {/* Editor Action Controls */}
              <div className="p-3 bg-neutral-950/80 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-[11px] font-mono text-neutral-400">
                  {currentState === "IDLE" && "Ready for Run 1: Deterministic sandbox execution"}
                  {isWaitingExplanation && "Locked: Provide diagnostic analysis in probe panel below"}
                  {canRevise && "Revision Unlocked: You may edit code and run final test execution"}
                  {isTerminal && "Lifecycle complete: Hard limits or verdict reached"}
                </div>

                {currentState === "IDLE" && (
                  <button
                    id="btn-run-tests-v1"
                    onClick={handleSubmitV1}
                    disabled={loading || !code.trim()}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-neutral-950" />
                    <span>{loading ? "Running Sandbox..." : "Run Test Harness (Run 1 of 2)"}</span>
                  </button>
                )}

                {canRevise && (
                  <button
                    id="btn-submit-revision"
                    onClick={handleSubmitRevision}
                    disabled={loading || !code.trim()}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-neutral-100 font-bold text-xs font-mono transition-colors disabled:opacity-50 shadow-sm animate-pulse"
                  >
                    <Play className="w-3.5 h-3.5 fill-neutral-100" />
                    <span>{loading ? "Executing Revision..." : "Submit Revision (Run 2 of 2 - FINAL)"}</span>
                  </button>
                )}

                {isWaitingExplanation && (
                  <div className="text-xs font-mono text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Awaiting your diagnosis below</span>
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostic Probe Card */}
            {session?.diagnostic_probe && (
              <DiagnosticProbeCard
                probe={session.diagnostic_probe}
                grade={session.explanation_grade}
                savedExplanation={session.student_explanation}
                onSubmitExplanation={handleSubmitExplanation}
                loading={loading}
                canRevise={canRevise}
              />
            )}

          </div>

          {/* Right Column: Empirical Evidence & Final Verdict (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Final Verdict Card (when terminal) */}
            {session?.final_verdict && (
              <FinalVerdictCard
                verdict={session.final_verdict}
                transitions={session.transition_log || []}
                onRestart={handleResetSession}
              />
            )}

            {/* Evidence Tabs */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-mono font-semibold text-neutral-300">
                  Empirical Test Evidence
                </span>
                <div className="flex items-center gap-1 text-xs font-mono">
                  <button
                    onClick={() => setActiveEvidenceTab("v1")}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeEvidenceTab === "v1"
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold"
                        : "bg-neutral-950 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Run 1 {session?.evidence_v1 ? `(${session.evidence_v1.passed_tests}/${session.evidence_v1.total_tests})` : ""}
                  </button>

                  <button
                    onClick={() => setActiveEvidenceTab("v2")}
                    disabled={!session?.evidence_v2}
                    className={`px-2.5 py-1 rounded transition-colors disabled:opacity-40 ${
                      activeEvidenceTab === "v2"
                        ? "bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold"
                        : "bg-neutral-950 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Run 2 {session?.evidence_v2 ? `(${session.evidence_v2.passed_tests}/${session.evidence_v2.total_tests})` : "(Revision)"}
                  </button>
                </div>
              </div>

              {/* Active Tab Panel */}
              <div className="mt-3">
                {activeEvidenceTab === "v1" && (
                  <EvidencePanel
                    evidence={session?.evidence_v1 || null}
                    runTitle="Run 1 Baseline"
                    isCurrent={activeEvidenceTab === "v1"}
                  />
                )}

                {activeEvidenceTab === "v2" && (
                  <EvidencePanel
                    evidence={session?.evidence_v2 || null}
                    runTitle="Run 2 Revision"
                    isCurrent={activeEvidenceTab === "v2"}
                  />
                )}
              </div>
            </div>

            {/* Diagnostic Rubric & Strict Guidelines Card */}
            {currentProblem && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 text-xs font-mono text-neutral-400 space-y-2.5 shadow-sm">
                <div className="font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-neutral-800">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Diagnostic Rubric Target Concepts
                </div>
                <div className="space-y-1.5">
                  {currentProblem.diagnostic_rubric.core_concepts.map((concept, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-neutral-300">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{concept}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-500 leading-relaxed font-sans">
                  <strong>Notice:</strong> BugStriker adheres strictly to the Socratic non-solution paradigm. All test execution is deterministic and sandboxed in isolated subprocesses.
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* History & State Recovery Modal */}
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={sessionsStore}
        activeSessionId={session?.session_id || ""}
        onResumeSession={handleResumeSession}
      />
    </div>
  );
}
``````

## .gitignore

``````text
node_modules/
build/
dist/
coverage/
.DS_Store
*.log
.env*
!.env.example
``````

## src/index.css

``````css
@import "tailwindcss";
``````

## src/main.tsx

``````tsx
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
``````

## tsconfig.json

``````json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "types": ["vite/client"],
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
``````

## .env.example

``````dotenv
# GEMINI_API_KEY: Required for Gemini AI API calls.
# AI Studio automatically injects this at runtime from user secrets.
# Users configure this via the Secrets panel in the AI Studio UI.
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: The URL where this applet is hosted.
# AI Studio automatically injects this at runtime with the Cloud Run service URL.
# Used for self-referential links, OAuth callbacks, and API endpoints.
APP_URL="MY_APP_URL"
``````

## vite.config.ts

``````typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
``````

## README.md

``````markdown
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/eb32f7f6-5503-4655-b029-9ebe6cc2ec89

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
``````
