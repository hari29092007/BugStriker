import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiListRecruiterRuns } from '../lib/api';
import type { RecruiterRunSummary } from '../types';

export const RecruiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<RecruiterRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiListRecruiterRuns()
      .then((data) => setRuns(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const getRecommendationBadge = (rec?: string) => {
    switch (rec) {
      case 'STRONG_HIRE':
        return <span className="badge badge-verified" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>★ STRONG HIRE</span>;
      case 'HIRE':
        return <span className="badge badge-verified">HIRE</span>;
      case 'LEAN_NO_HIRE':
        return <span className="badge badge-partial" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>LEAN NO HIRE</span>;
      case 'NO_HIRE':
        return <span className="badge badge-not-verified">NO HIRE</span>;
      default:
        return <span className="badge badge-state">UNDER REVIEW</span>;
    }
  };

  const recruiterUser = localStorage.getItem('bugstriker_dev_user') || 'recruiter@techcorp.com';

  const handleSignOut = () => {
    localStorage.removeItem('bugstriker_dev_user');
    localStorage.removeItem('bugstriker_role');
    window.location.href = '/login';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
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
          <span style={{ fontSize: '1.4rem' }}>👔</span>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '0.05em' }}>
              BUGSTRIKER <span style={{ color: '#60a5fa', fontSize: '0.85rem' }}>RECRUITER PORTAL</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              Dual Technical Assessment: Code Correctness (50%) + Debugging Reasoning (50%)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hiring Manager: <strong style={{ color: 'var(--text-main)' }}>{recruiterUser}</strong>
          </div>
          <button onClick={handleSignOut} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '32px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              Candidate Evaluation Pipeline
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Review candidates evaluated on both algorithmic code correctness and diagnostic reasoning depth.
            </p>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading candidate dossiers...
          </div>
        )}

        {error && (
          <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', color: 'var(--error)' }}>
            Failed to load candidates: {error}
          </div>
        )}

        {!loading && !error && runs.length === 0 && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '60px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>No Candidate Submissions Yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Run a candidate debugging session first to see full candidate scorecards and ideal reasoning comparisons here.
            </p>
            <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '10px 20px' }}>
              Start a Candidate Session →
            </button>
          </div>
        )}

        {!loading && !error && runs.length > 0 && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-card)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Candidate / Run ID</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Problem</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Status</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Code Score (50%)</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Reasoning (50%)</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Overall Score</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Recommendation</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-subtle)', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr
                      key={r.run_id}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => navigate(`/recruiter/candidate/${r.run_id}`)}
                    >
                      <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        <div>{r.run_id.slice(0, 8)}...</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {r.problem_title}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className="badge badge-state">{r.state}</span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {r.code_score !== undefined && r.code_score !== null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: r.code_score >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                              {r.code_score}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>/ 100</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {r.reasoning_score !== undefined && r.reasoning_score !== null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: r.reasoning_score >= 70 ? 'var(--accent)' : 'var(--warning)' }}>
                              {r.reasoning_score}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>/ 100</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {r.composite_score !== undefined && r.composite_score !== null ? (
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {r.composite_score}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 400 }}> / 100</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {getRecommendationBadge(r.recommendation)}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/recruiter/candidate/${r.run_id}`);
                          }}
                          className="btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          View Dossier →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RecruiterDashboard;
