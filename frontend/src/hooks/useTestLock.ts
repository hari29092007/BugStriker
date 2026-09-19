import type { RunState } from '../types';

const LOCKED_STATES: RunState[] = ['RUNNING_TESTS', 'ANALYZING', 'REVISION'];

export function useTestLock(state?: RunState | null): {
  isLocked: boolean;
  lockReason: string | null;
} {
  if (!state) {
    return { isLocked: false, lockReason: null };
  }

  if (state === 'RUNNING_TESTS') {
    return {
      isLocked: true,
      lockReason: 'Executing your code against fixed test cases...',
    };
  }

  if (state === 'ANALYZING') {
    return {
      isLocked: true,
      lockReason: 'BugStriker agent is analyzing runtime evidence...',
    };
  }

  if (state === 'FINISHED') {
    return {
      isLocked: true,
      lockReason: 'Session completed. Review your final verdict.',
    };
  }

  return {
    isLocked: LOCKED_STATES.includes(state),
    lockReason: null,
  };
}
