import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useRealtimeRun(runId: string | undefined, onUpdate: () => void) {
  useEffect(() => {
    if (!runId || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`run-status-${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_runs',
          filter: `id=eq.${runId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [runId, onUpdate]);
}
