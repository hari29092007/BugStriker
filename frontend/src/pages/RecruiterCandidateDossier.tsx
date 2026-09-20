import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetRecruiterDossier } from '../lib/api';
import type { RecruiterDossier, CVDimensionScore } from '../types';

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

export const RecruiterCandidateDossier: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState<RecruiterDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codeTab, setCodeTab] = useState<'revision' | 'original'>('revision');

  useEffect(() => {
    if (!runId) return;

    apiGetRecruiterDossier(runId)
      .then((data) => setDossier(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [runId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading candidate technical &amp; CV dossier...</div>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--error)', marginBottom: '12px' }}>Dossier Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{error || 'Could not retrieve candidate data'}</p>
        <button onClick={() => navigate('/recruiter')} className="btn-secondary">
          Return to Recruiter Dashboard
        </button>
      </div>
    );
  }

  const { run_state, problem, cv_report, candidate_id } = dossier;
  const verdict = run_state.verdict;
  const originalSub = run_state.original_submission;
  const revisionSub = run_state.revision_submission;
  const studentAns = run_state.student_answer;
  const diagQ = run_state.diagnostic_question;
  const comp = verdict?.reasoning_comparison;

  const testScore = verdict?.composite_score ?? 80;
  const cvScore = cv_report?.cv_score;
  const cumulativeScore = dossier.cumulative_score != null
    ? dossier.cumulative_score
    : cvScore != null
      ? Math.round(testScore * 0.75 + cvScore * 0.25)
      : testScore;

  const rec = verdict?.recommendation || 'HIRE';
  const isStrong = rec === 'STRONG_HIRE';
  const isLean = rec === 'LEAN_NO_HIRE';
  const isNoHire = rec === 'NO_HIRE';

  let recBorder = '#22c55e';
  let recGlow = 'rgba(34, 197, 94, 0.15)';
  let recBadge = 'badge-verified';
  let recIcon = '★';

  if (isStrong) {
    recBorder = '#22c55e';
    recGlow = 'rgba(34, 197, 94, 0.25)';
    recBadge = 'badge-verified';
    recIcon = '★';
  } else if (isLean) {
    recBorder = 'var(--warning)';
    recGlow = 'rgba(245, 158, 11, 0.2)';
    recBadge = 'badge-partial';
    recIcon = '⚠️';
  } else if (isNoHire) {
    recBorder = 'var(--error)';
    recGlow = 'rgba(239, 68, 68, 0.2)';
    recBadge = 'badge-not-verified';
    recIcon = '❌';
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={() => navigate('/recruiter')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            ← All Candidates
          </button>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.05rem' }}>
              Candidate Evaluation Verdict: <span style={{ color: 'var(--accent)' }}>{candidate_id}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
              Problem: {problem?.title} • Run #{run_state.run_id.slice(0, 12)} • {new Date(run_state.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate(`/problem/${run_state.problem_id}`)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            Inspect Problem
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('bugstriker_dev_user');
              localStorage.removeItem('bugstriker_role');
              navigate('/login');
            }}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Dossier Content */}
      <main style={{ flex: 1, maxWidth: '1140px', width: '100%', margin: '28px auto', padding: '0 24px 60px' }}>
        {/* Top Executive Assessment Banner with Cumulative, Test, and CV Scores */}
        <div
          style={{
            background: 'var(--surface)',
            border: `2px solid ${recBorder}`,
            borderRadius: 'var(--radius-xl)',
            padding: '28px 32px',
            marginBottom: '28px',
            boxShadow: `0 8px 30px ${recGlow}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div style={{ flex: '1 1 450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.6rem' }}>{recIcon}</span>
              <span className={`badge ${recBadge}`} style={{ fontSize: '0.9rem', padding: '6px 16px', fontWeight: 800 }}>
                RECOMMENDATION: {rec.replace('_', ' ')}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                (CONFIDENTIAL RECRUITER VERDICT)
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              {verdict?.verdict === 'VERIFIED' ? 'Debugging & Problem-Solving Verified' : 'Assessment Result: ' + (verdict?.verdict || 'EVALUATED')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
              {verdict?.executive_summary || verdict?.rationale || 'Candidate completed full technical debugging test and resume verification.'}
            </p>
          </div>

          {/* Score Trio: Cumulative (75/25), Test Score (75%), and CV Score (25%) */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            {/* Cumulative Score */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(16,185,129,0.12))',
                border: '1px solid rgba(139,92,246,0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 22px',
                textAlign: 'center',
                minWidth: '130px',
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#c084fc', marginBottom: '2px' }}>
                Cumulative Score
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#a78bfa', lineHeight: '1.1' }}>
                {cumulativeScore}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontWeight: 400 }}> / 100</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                75% Test + 25% CV
              </div>
            </div>

            {/* Test Score (75% Weight) */}
            <div
              style={{
                background: 'var(--surface-card)',
                border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                textAlign: 'center',
                minWidth: '120px',
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '2px' }}>
                Test Score (75%)
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: '1.1' }}>
                {testScore}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 400 }}> / 100</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                Code: {verdict?.code_score ?? 100} • Reasoning: {verdict?.reasoning_score ?? 80}
              </div>
            </div>

            {/* CV Score (25% Weight) */}
            <div
              style={{
                background: 'var(--surface-card)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                textAlign: 'center',
                minWidth: '120px',
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: ACCENT_CV, marginBottom: '2px' }}>
                CV Score (25%)
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: cvScore != null ? ACCENT_CV : 'var(--text-subtle)', lineHeight: '1.1' }}>
                {cvScore != null ? cvScore : '—'}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 400 }}> / 100</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                {cvScore != null ? `Percentile: Top ${100 - (cv_report?.percentile ?? 50)}%` : 'Awaiting Upload'}
              </div>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: 🧪 TECHNICAL TEST PERFORMANCE (In Same Section)           */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '1.3rem' }}>🧪</span>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Technical Test Details (75% Weight)
          </h3>
        </div>

        {/* Dual-Axis Scorecard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          {/* Axis 1: Code Correctness Score */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>
                  Evaluation Axis 1 (50% of Test)
                </div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0' }}>
                  Code Correctness &amp; Verification
                </h4>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (verdict?.code_score ?? 100) >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                {verdict?.code_score ?? 100}<span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>/100</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '16px' }}>
              Measures automated test pass rate, syntax correctness, edge-case handling, and algorithmic stability.
            </p>

            <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-subtle)' }}>Initial Attempt:</span>
                <span style={{ fontWeight: 600, color: originalSub?.all_passed ? 'var(--success)' : 'var(--error)' }}>
                  {originalSub?.pass_count ?? 0} passed / {originalSub?.fail_count ?? 0} failed
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-subtle)' }}>Revised Submission:</span>
                <span style={{ fontWeight: 600, color: revisionSub?.all_passed ? 'var(--success)' : 'var(--warning)' }}>
                  {revisionSub?.pass_count ?? 0} passed / {revisionSub?.fail_count ?? 0} failed
                </span>
              </div>
            </div>
          </div>

          {/* Axis 2: Debugging Reasoning Score */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>
                  Evaluation Axis 2 (50% of Test)
                </div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0' }}>
                  Debugging Reasoning &amp; Diagnosis
                </h4>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (verdict?.reasoning_score ?? 80) >= 70 ? 'var(--accent)' : 'var(--warning)' }}>
                {verdict?.reasoning_score ?? 80}<span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>/100</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '16px' }}>
              Assesses whether the candidate diagnosed the true algorithmic root cause vs. trial-and-error guessing.
            </p>

            <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-subtle)' }}>Root Cause Identified:</span>
                <span style={{ fontWeight: 700, color: comp?.root_cause_identified !== false ? 'var(--success)' : 'var(--error)' }}>
                  {comp?.root_cause_identified !== false ? '✅ Confirmed' : '❌ Missed Root Cause'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-subtle)' }}>Reasoning Benchmark Match:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {(verdict?.reasoning_score ?? 80) >= 80 ? 'High Alignment' : 'Moderate Alignment'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reasoning Comparison Matrix (Side-by-side) */}
        <section style={{ marginBottom: '28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Candidate Stated Reasoning */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>🗣️</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                    Candidate's Stated Explanation
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                    Diagnosis submitted for diagnostic question
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  lineHeight: '1.6',
                  fontStyle: 'italic',
                  flex: 1,
                  whiteSpace: 'pre-wrap',
                }}
              >
                "{studentAns?.answer_text || 'No explanation submitted by candidate.'}"
              </div>
            </div>

            {/* Ideal Correct Reasoning Benchmark */}
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>🎯</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.92rem' }}>
                    Ideal Reasoning Benchmark Model
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                    Ground-truth root-cause mechanism &amp; optimal fix model
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  lineHeight: '1.6',
                  flex: 1,
                }}
              >
                {verdict?.ideal_reasoning || comp?.ideal_reasoning || 'Ideal reasoning benchmark synthesized for problem.'}
              </div>
            </div>
          </div>

          {/* Diagnostic Question Asked */}
          {diagQ && (
            <div
              style={{
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#c084fc', marginBottom: '4px' }}>
                Diagnostic Probe Presented to Candidate
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                {diagQ.question_text}
              </div>
              {diagQ.failure_summary && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong>Failure Target:</strong> {diagQ.failure_summary}
                </div>
              )}
            </div>
          )}

          {/* Code Evolution: Original vs Revision */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Code Evolution &amp; Diff
              </h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setCodeTab('revision')}
                  className={codeTab === 'revision' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                >
                  Revised Code (Final)
                </button>
                <button
                  onClick={() => setCodeTab('original')}
                  className={codeTab === 'original' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                >
                  Original Code (Buggy)
                </button>
              </div>
            </div>

            <pre
              style={{
                margin: 0,
                padding: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.84rem',
                color: '#e6edf3',
                background: '#0d1117',
                borderRadius: 'var(--radius-md)',
                overflowX: 'auto',
                lineHeight: '1.5',
              }}
            >
              {codeTab === 'revision' ? (revisionSub?.code || 'No revision submitted') : (originalSub?.code || 'No original code')}
            </pre>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: 📄 CV & RESUME DETAILS (In Same Candidate Dossier!)       */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', marginTop: '36px' }}>
          <span style={{ fontSize: '1.3rem' }}>📄</span>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            CV / Resume Verification Details (25% Weight)
          </h3>
        </div>

        {cv_report ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
            {/* CV Header Info Card */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.2rem' }}>📎</span>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                    {cv_report.filename}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Submitted: {new Date(cv_report.created_at).toLocaleString()}
                  {cv_report.years_of_experience && <> • Experience: <strong>{cv_report.years_of_experience}</strong></>}
                  {cv_report.education_summary && <> • 🎓 {cv_report.education_summary}</>}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>CV Score</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: ACCENT_CV }}>
                    {cv_report.cv_score} <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>/ 100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recruiter Notes from CV Analysis */}
            {cv_report.recruiter_notes && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 24px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '6px' }}>
                  AI Recruiter Resume Analysis
                </div>
                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                  {cv_report.recruiter_notes}
                </p>
              </div>
            )}

            {/* 6 Dimension Score Progress Bars */}
            {cv_report.dimensions && cv_report.dimensions.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px 24px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px' }}>
                  📊 6-Dimension Resume Breakdown
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cv_report.dimensions.map((dim: CVDimensionScore) => (
                    <div key={dim.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{dim.name}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', background: 'var(--border)', padding: '1px 5px', borderRadius: '4px' }}>
                            {Math.round(dim.weight * 100)}%
                          </span>
                        </div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: dim.score >= 70 ? ACCENT_CV : dim.score >= 45 ? '#f59e0b' : '#ef4444' }}>
                          {dim.score} <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', fontWeight: 400 }}>/100</span>
                        </span>
                      </div>
                      <ScoreBar score={dim.score} />
                      {dim.notes && <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '3px' }}>{dim.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Gaps Side-by-Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Strengths */}
              <div style={{ background: 'var(--surface)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: ACCENT_CV, marginBottom: '10px' }}>
                  ✅ Key Resume Strengths
                </div>
                {cv_report.strengths && cv_report.strengths.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: '1.5' }}>
                    {cv_report.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                ) : (
                  <div style={{ color: 'var(--text-subtle)', fontSize: '0.82rem' }}>Solid foundation detected across core areas.</div>
                )}
              </div>

              {/* Gaps */}
              <div style={{ background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f87171', marginBottom: '10px' }}>
                  ⚠️ Potential Gaps / Blindspots
                </div>
                {cv_report.gaps && cv_report.gaps.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: '1.5' }}>
                    {cv_report.gaps.map((g, idx) => <li key={idx}>{g}</li>)}
                  </ul>
                ) : (
                  <div style={{ color: 'var(--text-subtle)', fontSize: '0.82rem' }}>No significant gaps identified.</div>
                )}
              </div>
            </div>

            {/* Detected Skills */}
            {cv_report.extracted_skills && cv_report.extracted_skills.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 22px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '10px' }}>
                  Detected Technical Skills
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {cv_report.extracted_skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        background: 'rgba(249,115,22,0.08)',
                        border: '1px solid rgba(249,115,22,0.25)',
                        color: 'var(--primary)',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              marginBottom: '28px',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>CV / Resume Not Yet Uploaded</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
              Candidate has completed the technical test. Resume verification score will automatically calculate when candidate uploads their CV.
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: 📊 CUMULATIVE SCORE BREAKDOWN FOR THIS STUDENT            */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(16,185,129,0.08))',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px 32px',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#c084fc', marginBottom: '14px' }}>
            Cumulative Verdict Calculation Breakdown
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Test Score × 75%
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
                {Math.round(testScore * 0.75)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>({testScore} / 100)</div>
            </div>

            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-subtle)' }}>+</div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '4px' }}>
                CV Score × 25%
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: ACCENT_CV }}>
                {cvScore != null ? Math.round(cvScore * 0.25) : 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                ({cvScore != null ? cvScore : 'Pending'} / 100)
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Final Cumulative Recruiter Verdict Score
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#a78bfa' }}>
              {cumulativeScore} <span style={{ fontSize: '1rem', color: 'var(--text-subtle)', fontWeight: 400 }}>/ 100</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RecruiterCandidateDossier;
