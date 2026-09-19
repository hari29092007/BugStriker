import { supabase, isSupabaseConfigured } from './supabase';
import type { Problem, RunStateResponse } from '../types';

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isSupabaseConfigured()) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }
  }

  // Local storage dev user token fallback for seamless testing
  const localUser = localStorage.getItem('bugstriker_dev_user');
  if (localUser) {
    headers['Authorization'] = `Bearer dev-${localUser}`;
  } else {
    headers['Authorization'] = 'Bearer dev-guest-student';
  }

  return headers;
}

export async function apiListProblems(): Promise<Problem[]> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/problems/', { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to list problems: ${text}`);
  }
  return res.json();
}

export async function apiGetProblem(problemId: string): Promise<Problem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/problems/${problemId}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get problem: ${text}`);
  }
  return res.json();
}

export async function apiCreateRun(problemId: string): Promise<{ run_id: string; state: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/runs/', {
    method: 'POST',
    headers,
    body: JSON.stringify({ problem_id: problemId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create run: ${text}`);
  }
  return res.json();
}

export async function apiGetRun(runId: string): Promise<RunStateResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/runs/${runId}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get run state: ${text}`);
  }
  return res.json();
}

export async function apiSubmitCode(runId: string, code: string): Promise<RunStateResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/runs/${runId}/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to submit code: ${text}`);
  }
  return res.json();
}

export async function apiExplain(runId: string, explanation: string): Promise<RunStateResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/runs/${runId}/explain`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ explanation }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to submit explanation: ${text}`);
  }
  return res.json();
}

export async function apiRevise(runId: string, code: string): Promise<RunStateResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/runs/${runId}/revise`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to submit revision: ${text}`);
  }
  return res.json();
}

export async function apiGetRunLock(runId: string): Promise<{
  run_id: string;
  state: string;
  is_locked: boolean;
  is_finished: boolean;
  is_waiting_for_student: boolean;
  llm_calls_used: number;
  max_llm_calls: number;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/runs/${runId}/lock`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to check lock: ${text}`);
  }
  return res.json();
}

export async function apiListRecruiterRuns(): Promise<import('../types').RecruiterRunSummary[]> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/recruiter/runs', { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to list recruiter runs: ${text}`);
  }
  return res.json();
}

export async function apiGetRecruiterDossier(runId: string): Promise<import('../types').RecruiterDossier> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/recruiter/runs/${runId}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get candidate dossier: ${text}`);
  }
  return res.json();
}
