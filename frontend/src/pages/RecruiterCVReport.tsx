import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGetCVReport } from '../lib/api';
import type { CVReport, CVDimensionScore } from '../types';

const ACCENT_CV = '#10b981';

const ScoreBar: React.FC<{ score: number; color?: string }> = ({ score, color = ACCENT_CV }) => (
  <div style={{ background: 'var(--border)', borderRadius: '99px', height: '8px', overflow: 'hidden', flex: 1 }}>
    <div
      style={{
        width: `${score}%`,
        height: '100%',
        background: score >= 70 ? color : score >= 45 ? '#f59e0b' : '#ef4444',
        borderRadius: '99px',
        transition: 'width 0.6s ease',
      }}
    />
  </div>
);

const RecommendationBadge: React.FC<{ score: number }> = ({ score }) => {
  if (score >= 80) return <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '4px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem' }}>★ STRONG CANDIDATE</span>;
  if (score >= 65) return <span style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '4px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem' }}>GOOD FIT</span>;
  if (score >= 45) return <span style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', padding: '4px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem' }}>NEEDS REVIEW</span>;
  return <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '4px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem' }}>WEAK CANDIDATE</span>;
};

export const RecruiterCVReport: React.FC = () => {
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<CVReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recruiterUser = localStorage.getItem('bugstriker_dev_user') || 'recruiter@techcorp.com';

  useEffect(() => {
    if (!cvId) return;
    apiGetCVReport(cvId)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cvId]);

  const handleSignOut = () => {
    localStorage.removeItem('bugstriker_dev_user');
    localStorage.removeItem('bugstriker_role');
    window.location.href = '/login';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem' }}>👔</span>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '0.05em' }}>
              BUGSTRIKER <span style={{ color: '#60a5fa', fontSize: '0.85rem' }}>RECRUITER PORTAL</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>CV / Resume Analysis Report</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hiring Manager: <strong style={{ color: 'var(--text-main)' }}>{recruiterUser}</strong>
          </span>
          <button onClick={() => navigate('/recruiter')} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>← Pipeline</button>
          <button onClick={handleSignOut} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>Sign Out</button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '960px', width: '100%', margin: '0 auto', padding: '40px 24px' }}>
        {loading && <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading CV analysis...</div>}
        {error && <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', padding: '16px', borderRadius: 'var(--radius-md)', color: 'var(--error)' }}>Error: {error}</div>}

        {report && (
          <>
            {/* Header Card */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.5rem' }}>📄</span>
                  <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{report.filename}</h1>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                  Candidate: <code style={{ color: 'var(--text-muted)' }}>{report.candidate_id}</code>
                  &nbsp;·&nbsp;Submitted: {new Date(report.created_at).toLocaleString()}
                </div>
                {report.years_of_experience && (
                  <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    🕐 Experience: <strong>{report.years_of_experience}</strong>
                    {report.education_summary && <>&nbsp;·&nbsp;🎓 {report.education_summary}</>}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* CV Score */}
                <div style={{ background: `${ACCENT_CV}10`, border: `1px solid ${ACCENT_CV}44`, borderRadius: 'var(--radius-md)', padding: '14px 20px', textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: ACCENT_CV }}>{report.cv_score}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CV Score</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Top {100 - (report.percentile ?? 50)}%</div>
                </div>
                {/* Test Score */}
                {report.test_composite_score != null && (
                  <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 'var(--radius-md)', padding: '14px 20px', textAlign: 'center', minWidth: '100px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{report.test_composite_score}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Test Score</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Code + Reasoning</div>
                  </div>
                )}
                {/* Cumulative */}
                {report.cumulative_score != null && (
                  <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 'var(--radius-md)', padding: '14px 20px', textAlign: 'center', minWidth: '100px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#a78bfa' }}>{report.cumulative_score}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cumulative</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Test×60% + CV×40%</div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendation */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '22px 28px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>🎯 Recruiter Assessment</h2>
                <RecommendationBadge score={report.cv_score} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.7', margin: 0 }}>
                {report.recruiter_notes}
              </p>
            </div>

            {/* Dimension Score Bars */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px 28px', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>📊 Dimension Breakdown</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {report.dimensions.map((dim: CVDimensionScore) => (
                  <div key={dim.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>{dim.name}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', background: 'var(--border)', padding: '1px 6px', borderRadius: '4px' }}>{Math.round(dim.weight * 100)}%</span>
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: dim.score >= 70 ? ACCENT_CV : dim.score >= 45 ? '#f59e0b' : '#ef4444' }}>{dim.score}<span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 400 }}>/100</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <ScoreBar score={dim.score} />
                    </div>
                    {dim.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>{dim.notes}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              {/* Strengths */}
              <div style={{ background: 'var(--surface)', border: `1px solid ${ACCENT_CV}33`, borderRadius: 'var(--radius-xl)', padding: '22px 24px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: ACCENT_CV }}>✅ Strengths</h2>
                {report.strengths.length === 0
                  ? <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>None identified.</p>
                  : report.strengths.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      <span style={{ color: ACCENT_CV, flexShrink: 0 }}>→</span> {s}
                    </div>
                  ))}
              </div>

              {/* Gaps */}
              <div style={{ background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-xl)', padding: '22px 24px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: '#f87171' }}>⚠️ Gaps / Improvements</h2>
                {report.gaps.length === 0
                  ? <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No significant gaps found.</p>
                  : report.gaps.map((g, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      <span style={{ color: '#f87171', flexShrink: 0 }}>→</span> {g}
                    </div>
                  ))}
              </div>
            </div>

            {/* Skills */}
            {report.extracted_skills.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '22px 28px', marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>🛠️ Detected Skills</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {report.extracted_skills.map((skill) => (
                    <span key={skill} style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cumulative Breakdown */}
            {report.cumulative_score != null && (
              <div style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.06),rgba(16,185,129,0.06))', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '22px 28px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>📈 Cumulative Score Breakdown</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '4px' }}>Test Score × 60%</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{Math.round((report.test_composite_score ?? 0) * 0.6)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--text-subtle)' }}>+</div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '4px' }}>CV Score × 40%</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: ACCENT_CV }}>{Math.round(report.cv_score * 0.4)}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '4px' }}>Cumulative Score</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#a78bfa' }}>{report.cumulative_score}<span style={{ fontSize: '1rem', color: 'var(--text-subtle)'}}>/100</span></div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default RecruiterCVReport;
