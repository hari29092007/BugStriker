import { useState, useCallback, useEffect } from 'react';
import type { RunStateResponse } from '../types';
import {
  apiCreateRun,
  apiGetRun,
  apiSubmitCode,
  apiExplain,
  apiRevise,
} from '../lib/api';

export function useTestSession(problemId: string, initialRunId?: string) {
  const [runState, setRunState] = useState<RunStateResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or fetch run
  useEffect(() => {
    if (initialRunId) {
      setLoading(true);
      apiGetRun(initialRunId)
        .then((state) => {
          setRunState(state);
          setError(null);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [initialRunId]);

  const startNewRun = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { run_id } = await apiCreateRun(problemId);
      const state = await apiGetRun(run_id);
      setRunState(state);
      return state;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  const submitInitialCode = useCallback(
    async (code: string) => {
      let currentRunId = runState?.run_id;
      if (!currentRunId) {
        const created = await startNewRun();
        if (!created) return;
        currentRunId = created.run_id;
      }

      setLoading(true);
      setError(null);
      try {
        const updated = await apiSubmitCode(currentRunId, code);
        setRunState(updated);
        return updated;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [runState, startNewRun]
  );

  const submitExplanation = useCallback(
    async (explanation: string) => {
      if (!runState?.run_id) {
        setError('No active run session found.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const updated = await apiExplain(runState.run_id, explanation);
        setRunState(updated);
        return updated;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [runState]
  );

  const submitRevision = useCallback(
    async (code: string) => {
      if (!runState?.run_id) {
        setError('No active run session found.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const updated = await apiRevise(runState.run_id, code);
        setRunState(updated);
        return updated;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [runState]
  );

  const refreshState = useCallback(async () => {
    if (!runState?.run_id) return;
    try {
      const fresh = await apiGetRun(runState.run_id);
      setRunState(fresh);
    } catch (err: any) {
      console.error('Failed to refresh run state:', err);
    }
  }, [runState?.run_id]);

  return {
    runState,
    loading,
    error,
    startNewRun,
    submitInitialCode,
    submitExplanation,
    submitRevision,
    refreshState,
    setRunState,
  };
}
