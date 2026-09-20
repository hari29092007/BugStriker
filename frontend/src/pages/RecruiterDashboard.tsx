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
      .then((r) => setRuns(r))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const getRecommendationBadge = (rec?: string) => {
    switch (rec) {
      case 'STRONG_HIRE':
        return <span className="badge badge-verified" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', fontWeight: 800 }}>★ STRONG HIRE</span>;
      case 'HIRE':
        return <span className="badge badge-verified" style={{ fontWeight: 800 }}>HIRE</span>;
      case 'LEAN_NO_HIRE':
        return <span className="badge badge-partial" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', fontWeight: 700 }}>LEAN NO HIRE</span>;
      case 'NO_HIRE':
        return <span className="badge badge-not-verified" style={{ fontWeight: 800 }}>NO HIRE</span>;
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

  const ScorePill: React.FC<{ value?: number | null; color?: string; suffix?: string }> = ({
    value,
    color = 'var(--text-main)',
    suffix = '/ 100',
  }) =>
    value != null ? (
      <span style={{ fontWeight: 800, fontSize: '0.95rem', color }}>
        {value}
        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 400 }}> {suffix}</span>
      </span>
    ) : (
      <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>Pending</span>
    );

  // Compute stats
  const completedCandidates = runs.filter((r) => r.composite_score != null);
  const verifiedCVs = runs.filter((r) => r.cv_score != null);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
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
              Candidate Verdicts &amp; Cumulative Evaluation (75% Test Score + 25% CV Score)
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

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: '1240px', width: '100%', margin: '32px auto', padding: '0 24px' }}>
        {/* Header Title & Metrics */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              Candidate Evaluation Pipeline
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Unified assessment: Each student's profile integrates their Technical Test Score (75%) and CV Score (25%) into a single verdict dossier.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{runs.length}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Candidates</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{completedCandidates.length}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Tests Scored</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{verifiedCVs.length}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>CVs Verified</div>
            </div>
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading candidate evaluations...</div>}
        {error && <div style={{ padding: '20px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', color: 'var(--error)' }}>Failed to load: {error}</div>}

        {!loading && !error && runs.length === 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>No Candidate Submissions Yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              When candidates complete the test and submit their CV, their full evaluation will appear here.
            </p>
          </div>
        )}

        {/* ── Single Unified Candidate Verdict Pipeline Table ── */}
        {!loading && !error && runs.length > 0 && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              marginBottom: '36px',
            }}
          >
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.1rem' }}>⚖️</span>
                <span style={{ fontWeight: 800, fontSize: '0.98rem' }}>Candidate Evaluation Verdicts</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                Formula: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Test Score × 75%</span> + <span style={{ color: '#10b981', fontWeight: 700 }}>CV Score × 25%</span> = <span style={{ color: '#a78bfa', fontWeight: 800 }}>Cumulative Verdict</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-card)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '14px 18px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Candidate / Student</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Problem</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Status</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Test Score (75%)</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>CV Score (25%)</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Cumulative Verdict</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Recommendation</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)', textAlign: 'right' }}>Dossier</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => {
                    const testScore = r.composite_score;
                    const cvScore = r.cv_score;
                    const cumulative = r.cumulative_score != null
                      ? r.cumulative_score
                      : (testScore != null && cvScore != null)
                        ? Math.round(testScore * 0.75 + cvScore * 0.25)
                        : testScore;

                    return (
                      <tr
                        key={r.run_id}
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onClick={() => navigate(`/recruiter/candidate/${r.run_id}`)}
                      >
                        {/* Student / Candidate Info */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            {r.student_id}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                            Run #{r.run_id.slice(0, 8)} • {new Date(r.created_at).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Problem */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                            {r.problem_title}
                          </div>
                        </td>

                        {/* State */}
                        <td style={{ padding: '16px 18px' }}>
                          <span className="badge badge-state">{r.state}</span>
                        </td>

                        {/* Test Score (75%) with Code & Reasoning Subtext */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <ScorePill value={testScore} color="var(--primary)" />
                            {r.code_score != null && r.reasoning_score != null && (
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                                Code: {r.code_score} | Reasoning: {r.reasoning_score}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* CV Score (25%) */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <ScorePill value={cvScore} color="#10b981" />
                            <div style={{ fontSize: '0.68rem', color: cvScore != null ? '#10b981' : 'var(--text-subtle)' }}>
                              {cvScore != null ? 'Resume Verified' : 'Awaiting Upload'}
                            </div>
                          </div>
                        </td>

                        {/* Cumulative Verdict Score */}
                        <td style={{ padding: '16px 18px' }}>
                          {cumulative != null ? (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#a78bfa' }}>
                                {cumulative}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>/ 100</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>

                        {/* Recommendation */}
                        <td style={{ padding: '16px 18px' }}>
                          {getRecommendationBadge(r.recommendation)}
                        </td>

                        {/* Action: Single unified Dossier */}
                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/recruiter/candidate/${r.run_id}`);
                            }}
                            className="btn-primary"
                            style={{ padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                          >
                            View Verdict Dossier →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
