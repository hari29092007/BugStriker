"""
Problems API Router:
Lists coding and aptitude assessment questions with category tagging and visible test cases.
"""
from __future__ import annotations

from typing import Any, Dict, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.auth import get_current_user
from app.database.repositories import ProblemRepository

router = APIRouter(prefix="/api/problems", tags=["problems"])

# Built-in problems: 2 Coding Challenges + 2 Aptitude & Logic Problems
BUILTIN_PROBLEMS = [
    # CODING QUESTION 1
    {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "title": "Two Sum",
        "slug": "two-sum",
        "category": "coding",
        "description": (
            "Given an array of integers `nums` and an integer `target`, return indices of the "
            "two numbers such that they add up to `target`.\n\n"
            "You may assume that each input would have **exactly one solution**, and you may not "
            "use the same element twice.\n\nReturn the answer in any order."
        ),
        "difficulty": "Easy",
        "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
        "examples": [
            {
                "input": "nums = [2,7,11,15], target = 9",
                "output": "[0,1]",
                "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1].",
            },
            {"input": "nums = [3,2,4], target = 6", "output": "[1,2]"},
            {"input": "nums = [3,3], target = 6", "output": "[0,1]"},
        ],
        "starter_code": "def two_sum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass\n",
        "function_signature": "two_sum",
        "test_cases": [
            {
                "id": "tc-1",
                "input_data": {"nums": [2, 7, 11, 15], "target": 9},
                "expected_output": [0, 1],
                "description": "Basic case",
                "is_hidden": False,
                "order_index": 0,
            },
            {
                "id": "tc-2",
                "input_data": {"nums": [3, 2, 4], "target": 6},
                "expected_output": [1, 2],
                "description": "Target not at index 0",
                "is_hidden": False,
                "order_index": 1,
            },
            {
                "id": "tc-3",
                "input_data": {"nums": [3, 3], "target": 6},
                "expected_output": [0, 1],
                "description": "Duplicate values",
                "is_hidden": False,
                "order_index": 2,
            },
            {
                "id": "tc-4",
                "input_data": {"nums": [1, 2, 3, 4, 5], "target": 9},
                "expected_output": [3, 4],
                "description": "Last two elements",
                "is_hidden": False,
                "order_index": 3,
            },
            {
                "id": "tc-5",
                "input_data": {"nums": [-1, -2, -3, -4, -5], "target": -8},
                "expected_output": [2, 4],
                "description": "Negative numbers",
                "is_hidden": True,
                "order_index": 4,
            },
        ],
    },
    # CODING QUESTION 2
    {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "title": "FizzBuzz",
        "slug": "fizzbuzz",
        "category": "coding",
        "description": (
            "Given an integer `n`, return a string array `answer` (1-indexed) where:\n"
            "- answer[i] == 'FizzBuzz' if i is divisible by 3 and 5.\n"
            "- answer[i] == 'Fizz' if i is divisible by 3.\n"
            "- answer[i] == 'Buzz' if i is divisible by 5.\n"
            "- answer[i] == i (as a string) if none of the above conditions are true."
        ),
        "difficulty": "Easy",
        "constraints": "1 <= n <= 10^4",
        "examples": [
            {"input": "n = 3", "output": '["1","2","Fizz"]'},
            {"input": "n = 5", "output": '["1","2","Fizz","4","Buzz"]'},
        ],
        "starter_code": "def fizz_buzz(n: int) -> list[str]:\n    # Write your solution here\n    pass\n",
        "function_signature": "fizz_buzz",
        "test_cases": [
            {
                "id": "tc-fb-1",
                "input_data": {"n": 3},
                "expected_output": ["1", "2", "Fizz"],
                "description": "Up to 3",
                "is_hidden": False,
                "order_index": 0,
            },
            {
                "id": "tc-fb-2",
                "input_data": {"n": 5},
                "expected_output": ["1", "2", "Fizz", "4", "Buzz"],
                "description": "Up to 5",
                "is_hidden": False,
                "order_index": 1,
            },
            {
                "id": "tc-fb-3",
                "input_data": {"n": 15},
                "expected_output": [
                    "1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz",
                    "Buzz", "11", "Fizz", "13", "14", "FizzBuzz",
                ],
                "description": "Up to 15",
                "is_hidden": False,
                "order_index": 2,
            },
            {
                "id": "tc-fb-4",
                "input_data": {"n": 1},
                "expected_output": ["1"],
                "description": "Single element",
                "is_hidden": False,
                "order_index": 3,
            },
        ],
    },
    # APTITUDE QUESTION 1: CLUSTER RELIABILITY
    {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "title": "Distributed Cluster Reliability",
        "slug": "cluster-reliability",
        "category": "aptitude",
        "description": (
            "A distributed microservices architecture consists of `n` independent sequential service hops. "
            "Each service operates with an individual availability probability `p` (where `0.0 <= p <= 1.0`).\n\n"
            "An end-to-end request only succeeds if **every single hop** in the pipeline succeeds.\n\n"
            "Write a function `cluster_reliability(n: int, p: float) -> float` that returns the composite system reliability, "
            "rounded to 4 decimal places.\n\n"
            "**Evaluation**: Your main answer (code output) and your conceptual reasoning receive equal 50/50 weighting."
        ),
        "difficulty": "Medium",
        "constraints": "1 <= n <= 500\n0.0 <= p <= 1.0",
        "examples": [
            {"input": "n = 10, p = 0.99", "output": "0.9044", "explanation": "0.99^10 = 0.904382... rounded to 4 decimals."},
            {"input": "n = 100, p = 0.99", "output": "0.3660", "explanation": "0.99^100 = 0.366032..."},
        ],
        "starter_code": "def cluster_reliability(n: int, p: float) -> float:\n    # Calculate end-to-end system availability\n    pass\n",
        "function_signature": "cluster_reliability",
        "test_cases": [
            {
                "id": "tc-cr-1",
                "input_data": {"n": 10, "p": 0.99},
                "expected_output": 0.9044,
                "description": "10 hops at 99%",
                "is_hidden": False,
                "order_index": 0,
            },
            {
                "id": "tc-cr-2",
                "input_data": {"n": 100, "p": 0.99},
                "expected_output": 0.366,
                "description": "100 hops at 99%",
                "is_hidden": False,
                "order_index": 1,
            },
            {
                "id": "tc-cr-3",
                "input_data": {"n": 1, "p": 0.95},
                "expected_output": 0.95,
                "description": "Single service",
                "is_hidden": False,
                "order_index": 2,
            },
            {
                "id": "tc-cr-4",
                "input_data": {"n": 5, "p": 0.9},
                "expected_output": 0.5905,
                "description": "5 hops at 90%",
                "is_hidden": True,
                "order_index": 3,
            },
        ],
    },
    # APTITUDE QUESTION 2: WORKER RATE CONCURRENCY
    {
        "id": "d4e5f6a7-b8c9-0123-def1-234567890123",
        "title": "Worker Rate Optimization & Throughput",
        "slug": "worker-throughput",
        "category": "aptitude",
        "description": (
            "A cloud task queue must process `tasks` total jobs using a pool of concurrent workers. "
            "Each worker in `rates` can process a fixed number of tasks per minute independently and concurrently.\n\n"
            "Determine the minimum total time (in minutes) required for the worker pool to process all `tasks`, "
            "rounded to 2 decimal places.\n\n"
            "Write `min_processing_time(tasks: int, rates: list[float]) -> float`.\n\n"
            "**Evaluation**: Your main numerical answer and step-by-step mathematical reasoning receive equal 50/50 weighting."
        ),
        "difficulty": "Medium",
        "constraints": "1 <= tasks <= 10^6\n1 <= len(rates) <= 100\nrates[i] > 0",
        "examples": [
            {"input": "tasks = 120, rates = [1, 2, 3]", "output": "20.0", "explanation": "Total rate is 1+2+3 = 6 tasks/min. Time = 120 / 6 = 20.0 minutes."},
            {"input": "tasks = 60, rates = [5, 5]", "output": "6.0", "explanation": "Total rate is 10 tasks/min. Time = 60 / 10 = 6.0 minutes."},
        ],
        "starter_code": "def min_processing_time(tasks: int, rates: list[float]) -> float:\n    # Return minimum time in minutes\n    pass\n",
        "function_signature": "min_processing_time",
        "test_cases": [
            {
                "id": "tc-wp-1",
                "input_data": {"tasks": 120, "rates": [1, 2, 3]},
                "expected_output": 20.0,
                "description": "Three workers with distinct rates",
                "is_hidden": False,
                "order_index": 0,
            },
            {
                "id": "tc-wp-2",
                "input_data": {"tasks": 60, "rates": [5, 5]},
                "expected_output": 6.0,
                "description": "Two identical workers",
                "is_hidden": False,
                "order_index": 1,
            },
            {
                "id": "tc-wp-3",
                "input_data": {"tasks": 100, "rates": [10]},
                "expected_output": 10.0,
                "description": "Single high-speed worker",
                "is_hidden": False,
                "order_index": 2,
            },
            {
                "id": "tc-wp-4",
                "input_data": {"tasks": 300, "rates": [2, 3, 5]},
                "expected_output": 30.0,
                "description": "Sum of rates 10",
                "is_hidden": True,
                "order_index": 3,
            },
        ],
    },
]


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
async def list_problems(user=Depends(get_current_user)):
    try:
        repo = ProblemRepository()
        problems = repo.list_problems()
        if problems and len(problems) >= 4:
            return problems
    except Exception:
        pass
    # Return built-in catalog with category tags
    return [
        {
            "id": p["id"],
            "title": p["title"],
            "slug": p["slug"],
            "category": p.get("category", "coding"),
            "description": p["description"],
            "difficulty": p["difficulty"],
            "constraints": p["constraints"],
            "examples": p["examples"],
            "starter_code": p["starter_code"],
            "function_signature": p["function_signature"],
        }
        for p in BUILTIN_PROBLEMS
    ]


@router.get("/{problem_id}")
async def get_problem(problem_id: str, user=Depends(get_current_user)):
    try:
        repo = ProblemRepository()
        problem = repo.get_problem(problem_id)
        if problem:
            visible_tests = repo.get_visible_test_cases(problem_id)
            problem["test_cases"] = visible_tests
            return problem
    except Exception:
        pass

    # Built-in lookup
    for p in BUILTIN_PROBLEMS:
        if p["id"] == problem_id or p["slug"] == problem_id:
            visible_tests = [tc for tc in p["test_cases"] if not tc.get("is_hidden")]
            result = dict(p)
            result["test_cases"] = visible_tests
            return result

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")
