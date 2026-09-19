import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiListRecruiterRuns, apiListCVReports } from '../lib/api';
import type { RecruiterRunSummary, CVSummary } from '../types';

export const RecruiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<RecruiterRunSummary[]>([]);
  const [cvReports, setCvReports] = useState<CVSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiListRecruiterRuns().catch(() => [] as RecruiterRunSummary[]),
      apiListCVReports().catch(() => [] as CVSummary[]),
    ])
      .then(([r, c]) => { setRuns(r); setCvReports(c); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Map candidateId → CV summary for quick lookup
  const cvByCandidateId = Object.fromEntries(
    cvReports.map((c) => [c.candidate_id, c])
  );

  const getRecommendationBadge = (rec?: string) => {
    switch (rec) {
      case 'STRONG_HIRE': return <span className="badge badge-verified" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>★ STRONG HIRE</span>;
      case 'HIRE':        return <span className="badge badge-verified">HIRE</span>;
      case 'LEAN_NO_HIRE':return <span className="badge badge-partial" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>LEAN NO HIRE</span>;
      case 'NO_HIRE':     return <span className="badge badge-not-verified">NO HIRE</span>;
      default:            return <span className="badge badge-state">UNDER REVIEW</span>;
    }
  };

  const recruiterUser = localStorage.getItem('bugstriker_dev_user') || 'recruiter@techcorp.com';

  const handleSignOut = () => {
    localStorage.removeItem('bugstriker_dev_user');
    localStorage.removeItem('bugstriker_role');
    window.location.href = '/login';
  };

  const ScorePill: React.FC<{ value?: number; color?: string }> = ({ value, color = 'var(--text-main)' }) =>
    value != null
      ? <span style={{ fontWeight: 800, fontSize: '1rem', color }}>{value}<span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 400 }}>/100</span></span>
      : <span style={{ color: 'var(--text-subtle)' }}>—</span>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem' }}>👔</span>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '0.05em' }}>
              BUGSTRIKER <span style={{ color: '#60a5fa', fontSize: '0.85rem' }}>RECRUITER PORTAL</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              Test Score (75%) + CV Score (25%) = Cumulative
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hiring Manager: <strong style={{ color: 'var(--text-main)' }}>{recruiterUser}</strong>
          </div>
          <button onClick={handleSignOut} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>Sign Out</button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '32px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              Candidate Evaluation Pipeline
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Complete scoring: Code Correctness (50%) + Debugging Reasoning (50%) = Test Score · CV Analysis (25%) contributes to Cumulative
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{runs.length}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Test Runs</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{cvReports.length}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>CVs Submitted</div>
            </div>
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading candidate pipeline...</div>}
        {error && <div style={{ padding: '20px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', color: 'var(--error)' }}>Failed to load: {error}</div>}

        {!loading && !error && runs.length === 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>No Candidate Submissions Yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Run a candidate debugging session first to see scorecards here.
            </p>
          </div>
        )}

        {/* ── Test Run Pipeline Table ── */}
        {!loading && !error && runs.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', marginBottom: '36px' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1rem' }}>⚡</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Coding & Aptitude Results</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-card)', borderBottom: '1px solid var(--border)' }}>
                    {['Run ID / Date', 'Problem', 'Status', 'Code (50%)', 'Reasoning (50%)', 'Test Score', 'CV Score', 'Cumulative', 'Verdict', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => {
                    const cv = cvByCandidateId[r.student_id];
                    const cvScore = cv?.cv_score;
                    const cumulative = (r.composite_score != null && cvScore != null)
                      ? Math.round(r.composite_score * 0.75 + cvScore * 0.25)
                      : undefined;
                    return (
                      <tr key={r.run_id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onClick={() => navigate(`/recruiter/candidate/${r.run_id}`)}>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                          <div>{r.run_id.slice(0, 8)}...</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>{r.problem_title}</td>
                        <td style={{ padding: '14px 16px' }}><span className="badge badge-state">{r.state}</span></td>
                        <td style={{ padding: '14px 16px' }}><ScorePill value={r.code_score} color={r.code_score != null && r.code_score >= 80 ? 'var(--success)' : 'var(--warning)'} /></td>
                        <td style={{ padding: '14px 16px' }}><ScorePill value={r.reasoning_score} color={r.reasoning_score != null && r.reasoning_score >= 70 ? 'var(--accent)' : 'var(--warning)'} /></td>
                        <td style={{ padding: '14px 16px' }}><ScorePill value={r.composite_score} color="var(--primary)" /></td>
                        <td style={{ padding: '14px 16px' }}>
                          {cvScore != null ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <ScorePill value={cvScore} color="#10b981" />
                              {cv && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/recruiter/cv/${cv.cv_id}`); }}
                                  style={{ fontSize: '0.68rem', color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}
                                >
                                  View CV →
                                </button>
                              )}
                            </div>
                          ) : <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Not submitted</span>}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {cumulative != null
                            ? <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#a78bfa' }}>{cumulative}<span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 400 }}>/100</span></span>
                            : <span style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>Partial</span>}
                        </td>
                        <td style={{ padding: '14px 16px' }}>{getRecommendationBadge(r.recommendation)}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/recruiter/candidate/${r.run_id}`); }}
                            className="btn-secondary"
                            style={{ padding: '5px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                          >
                            Dossier →
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

        {/* ── CV Submissions Table ── */}
        {!loading && !error && cvReports.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(16,185,129,0.06)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1rem' }}>📄</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>CV / Resume Submissions</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-card)', borderBottom: '1px solid var(--border)' }}>
                    {['Candidate ID', 'File', 'CV Score', 'Percentile', 'Test Score', 'Cumulative', 'Submitted', 'Action'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cvReports.map((cv) => (
                    <tr key={cv.cv_id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cv.candidate_id.slice(0, 20)}...</td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>📎 {cv.filename}</td>
                      <td style={{ padding: '14px 16px' }}><ScorePill value={cv.cv_score} color="#10b981" /></td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {cv.percentile != null ? `Top ${100 - cv.percentile}%` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}><ScorePill value={cv.test_composite_score} color="var(--primary)" /></td>
                      <td style={{ padding: '14px 16px' }}>
                        {cv.cumulative_score != null
                          ? <span style={{ fontWeight: 900, color: '#a78bfa' }}>{cv.cumulative_score}<span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 400 }}>/100</span></span>
                          : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>{new Date(cv.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => navigate(`/recruiter/cv/${cv.cv_id}`)}
                          className="btn-secondary"
                          style={{ padding: '5px 12px', fontSize: '0.78rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.4)' }}
                        >
                          CV Report →
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
