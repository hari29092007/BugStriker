import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetRun } from '../lib/api';
import type { RunStateResponse } from '../types';

export const ResultPage: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [runState, setRunState] = useState<RunStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    apiGetRun(runId)
      .then((data) => setRunState(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [runId]);

  const handleSignOut = () => {
    localStorage.removeItem('bugstriker_dev_user');
    localStorage.removeItem('bugstriker_role');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Submitting response...</div>
      </div>
    );
  }

  if (error || !runState) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--error)', marginBottom: '12px' }}>Could not load submission</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{error || 'Run not found'}</p>
        <button onClick={() => navigate('/')} className="btn-secondary">
          Return to Problem Catalog
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Student Portal Header */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '0.05em' }}>
            BUGSTRIKER <span style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>STUDENT PORTAL</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleSignOut}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '680px', width: '100%', margin: '50px auto', padding: '0 24px' }}>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '48px 36px',
            textAlign: 'center',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Neutral Submission Icon - No Green Ticks */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 20px',
            }}
          >
            📝
          </div>

          <div style={{ marginBottom: '14px' }}>
            <span
              style={{
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '5px 16px',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              Session Recorded
            </span>
          </div>

          {/* Explicit User Requirement: Say ONLY "Your response is submitted" */}
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
            Your response is submitted
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', maxWidth: '520px', margin: '0 auto 28px' }}>
            Your response is submitted and recorded for recruiter evaluation. All technical analysis is handled confidentially by the recruiting team.
          </p>

          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              textAlign: 'left',
              marginBottom: '28px',
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '14px' }}>
              Submission Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Session ID</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '2px' }}>
                  {runState.run_id.slice(0, 12)}...
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Status</div>
                <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', marginTop: '2px' }}>
                  Submitted
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Diagnostic Explanation</div>
                <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginTop: '2px' }}>
                  {runState.student_answer ? 'Submitted' : 'None'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Code Revision</div>
                <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginTop: '2px' }}>
                  {runState.revision_submission ? 'Submitted' : 'None'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '12px 28px' }}>
              ← Return to Problem Catalog
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultPage;
