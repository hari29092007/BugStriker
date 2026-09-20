-- ============================================================
-- BugStriker — Seed Data
-- Includes: Two Sum, FizzBuzz problems with test cases
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Problem: Two Sum
-- ────────────────────────────────────────────────────────────
insert into public.problems (id, title, slug, description, difficulty, constraints, examples, starter_code, function_signature)
values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Two Sum',
  'two-sum',
  E'Given an array of integers `nums` and an integer `target`, return **indices** of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nReturn the answer in any order.',
  'Easy',
  E'2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
  '[{"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."}, {"input": "nums = [3,2,4], target = 6", "output": "[1,2]"}, {"input": "nums = [3,3], target = 6", "output": "[0,1]"}]'::jsonb,
  E'def two_sum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass',
  'two_sum'
);

-- Test cases for Two Sum
insert into public.test_cases (problem_id, input_data, expected_output, description, is_hidden, order_index)
values
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '{"nums": [2, 7, 11, 15], "target": 9}'::jsonb,
    '[0, 1]'::jsonb,
    'Basic case',
    false,
    0
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '{"nums": [3, 2, 4], "target": 6}'::jsonb,
    '[1, 2]'::jsonb,
    'Target not at index 0',
    false,
    1
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '{"nums": [3, 3], "target": 6}'::jsonb,
    '[0, 1]'::jsonb,
    'Duplicate values',
    false,
    2
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '{"nums": [1, 2, 3, 4, 5], "target": 9}'::jsonb,
    '[3, 4]'::jsonb,
    'Last two elements',
    false,
    3
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '{"nums": [-1, -2, -3, -4, -5], "target": -8}'::jsonb,
    '[2, 4]'::jsonb,
    'Negative numbers',
    true,
    4
  );

-- ────────────────────────────────────────────────────────────
-- Problem: FizzBuzz
-- ────────────────────────────────────────────────────────────
insert into public.problems (id, title, slug, description, difficulty, constraints, examples, starter_code, function_signature)
values (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'FizzBuzz',
  'fizzbuzz',
  E'Write a function that returns an array of strings for each number from 1 to n:\n\n- Return `"FizzBuzz"` for multiples of both 3 and 5.\n- Return `"Fizz"` for multiples of 3.\n- Return `"Buzz"` for multiples of 5.\n- Return the number as a string for all other cases.',
  'Easy',
  E'1 <= n <= 10^4',
  '[{"input": "n = 3", "output": "[\"1\", \"2\", \"Fizz\"]"}, {"input": "n = 5", "output": "[\"1\", \"2\", \"Fizz\", \"4\", \"Buzz\"]"}]'::jsonb,
  E'def fizz_buzz(n: int) -> list[str]:\n    # Write your solution here\n    pass',
  'fizz_buzz'
);

-- Test cases for FizzBuzz
insert into public.test_cases (problem_id, input_data, expected_output, description, is_hidden, order_index)
values
  (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    '{"n": 3}'::jsonb,
    '["1", "2", "Fizz"]'::jsonb,
    'Up to 3',
    false,
    0
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    '{"n": 5}'::jsonb,
    '["1", "2", "Fizz", "4", "Buzz"]'::jsonb,
    'Up to 5',
    false,
    1
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    '{"n": 15}'::jsonb,
    '["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]'::jsonb,
    'Up to 15',
    false,
    2
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    '{"n": 1}'::jsonb,
    '["1"]'::jsonb,
    'Single element',
    false,
    3
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    '{"n": 10}'::jsonb,
    '["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz"]'::jsonb,
    'Up to 10',
    true,
    4
  );
