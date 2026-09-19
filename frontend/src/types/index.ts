export type RunState =
  | 'SUBMITTED'
  | 'RUNNING_TESTS'
  | 'ANALYZING'
  | 'QUESTIONING'
  | 'WAITING_FOR_STUDENT'
  | 'REVISION'
  | 'FINISHED';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type VerdictType = 'VERIFIED' | 'NOT_VERIFIED' | 'PARTIAL' | 'AUTO_PASS' | 'SUBMITTED_FOR_REVIEW';
export type RecommendationType = 'STRONG_HIRE' | 'HIRE' | 'LEAN_NO_HIRE' | 'NO_HIRE';

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  category?: 'coding' | 'aptitude';
  constraints?: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  starter_code: string;
  function_signature: string;
  test_cases?: TestCase[];
}

export interface TestCase {
  id: string;
  input_data: Record<string, any>;
  expected_output: any;
  description: string;
  is_hidden: boolean;
  order_index: number;
}

export interface TestCaseResult {
  test_id: string;
  description: string;
  input_data: Record<string, any>;
  expected_output: any;
  actual_output?: any;
  stdout: string;
  stderr: string;
  passed: boolean;
  error?: string;
  execution_time_ms?: number;
}

export interface ExecutionEvidence {
  submission_id: string;
  test_results: TestCaseResult[];
  all_passed: boolean;
  pass_count: number;
  fail_count: number;
  total_count: number;
  execution_time_ms?: number;
}

export interface CodeSubmission {
  id: string;
  submission_type: 'ORIGINAL' | 'REVISION';
  code: string;
  execution_evidence: ExecutionEvidence | null;
  all_passed: boolean;
  pass_count: number;
  fail_count: number;
  execution_time_ms?: number;
  created_at?: string;
}

export interface DiagnosticQuestion {
  question_text: string;
  failure_summary?: string;
  most_useful_failure?: {
    test_id?: string;
    description?: string;
    input_data?: any;
    expected_output?: any;
    actual_output?: any;
    why_useful?: string;
    failure_pattern?: string;
  };
}

export interface StudentAnswer {
  answer_text: string;
  submitted_at?: string;
}

export interface ReasoningComparison {
  candidate_explanation?: string;
  ideal_reasoning?: string;
  root_cause_identified?: boolean;
  alignment_analysis?: string;
  key_strengths?: string[];
  misconceptions_or_gaps?: string[];
}

export interface Verdict {
  verdict: VerdictType;
  rationale: string;
  evidence_summary?: Record<string, any>;
  // Recruiter fields
  recommendation?: RecommendationType;
  code_score?: number;
  reasoning_score?: number;
  composite_score?: number;
  ideal_reasoning?: string;
  reasoning_comparison?: ReasoningComparison;
  executive_summary?: string;
}

export interface RunStateResponse {
  run_id: string;
  state: RunState;
  problem_id: string;
  llm_calls_used: number;
  created_at: string;
  updated_at: string;
  original_submission?: CodeSubmission | null;
  diagnostic_question?: DiagnosticQuestion | null;
  student_answer?: StudentAnswer | null;
  revision_submission?: CodeSubmission | null;
  verdict?: Verdict | null;
  violation_reason?: string | null;
}

export interface RecruiterRunSummary {
  run_id: string;
  student_id: string;
  problem_id: string;
  problem_title: string;
  state: RunState;
  code_score?: number;
  reasoning_score?: number;
  composite_score?: number;
  cv_score?: number;
  cumulative_score?: number;
  recommendation?: RecommendationType;
  created_at: string;
  finished_at?: string;
}

export interface RecruiterDossier {
  candidate_id: string;
  problem: Problem;
  run_state: RunStateResponse;
  cv_report?: CVReport | null;
  cumulative_score?: number | null;
}

// ── CV / Resume Types ──────────────────────────────────────────────────────

export interface CVDimensionScore {
  name: string;
  score: number;      // 0-100
  weight: number;     // e.g. 0.25
  notes: string;
}

export interface CVSubmission {
  cv_id: string;
  candidate_id: string;
  filename: string;
  file_size_bytes: number;
  status: 'PENDING' | 'ANALYZED' | 'ERROR';
  cv_score?: number;
  created_at: string;
}

export interface CVReport {
  cv_id: string;
  candidate_id: string;
  filename: string;
  cv_score: number;
  percentile: number;
  dimensions: CVDimensionScore[];
  strengths: string[];
  gaps: string[];
  recruiter_notes: string;
  extracted_skills: string[];
  years_of_experience?: string;
  education_summary?: string;
  cumulative_score?: number;
  test_composite_score?: number;
  created_at: string;
}

export interface CVSummary {
  cv_id: string;
  candidate_id: string;
  filename: string;
  cv_score?: number;
  percentile?: number;
  test_composite_score?: number;
  cumulative_score?: number;
  status: string;
  created_at: string;
}
