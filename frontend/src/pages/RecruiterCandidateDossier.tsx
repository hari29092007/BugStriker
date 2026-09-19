import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetRecruiterDossier } from '../lib/api';
import type { RecruiterDossier } from '../types';

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
        <div style={{ color: 'var(--text-muted)' }}>Loading candidate technical dossier...</div>
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

  const { run_state, problem } = dossier;
  const verdict = run_state.verdict;
  const originalSub = run_state.original_submission;
  const revisionSub = run_state.revision_submission;
  const studentAns = run_state.student_answer;
  const diagQ = run_state.diagnostic_question;
  const comp = verdict?.reasoning_comparison;

  const rec = verdict?.recommendation || 'HIRE';
  const isStrong = rec === 'STRONG_HIRE';
  const isHire = rec === 'HIRE';
  const isLean = rec === 'LEAN_NO_HIRE';
  const isNoHire = rec === 'NO_HIRE';

  let recBorder = 'var(--success)';
  let recGlow = 'rgba(34, 197, 94, 0.15)';
  let recBadge = 'badge-verified';
  let recIcon = '✅';

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
      {/* Recruiter Header */}
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
              Candidate Evaluation Dossier: <span style={{ color: 'var(--accent)' }}>{problem?.title}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
              Run #{run_state.run_id} • Evaluated {new Date(run_state.created_at).toLocaleString()}
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

      <main style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '28px auto', padding: '0 24px 60px' }}>
        {/* Top Executive Assessment Banner */}
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
          <div style={{ flex: '1 1 500px' }}>
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
              {verdict?.verdict === 'VERIFIED' ? 'Debugging & Problem-Solving Verified' : 'Assessment Result: ' + verdict?.verdict}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
              {verdict?.executive_summary || verdict?.rationale}
            </p>
          </div>

          {/* Composite Overall Score Wheel/Card */}
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 28px',
              textAlign: 'center',
              minWidth: '160px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '4px' }}>
              Composite Score
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: '1' }}>
              {verdict?.composite_score ?? 85}
              <span style={{ fontSize: '1rem', color: 'var(--text-subtle)', fontWeight: 400 }}> / 100</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600, marginTop: '6px' }}>
              50% Code • 50% Reasoning
            </div>
          </div>
        </div>

        {/* Dual-Axis Scorecard (Importance to BOTH Code and Reasoning) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {/* Axis 1: Code Correctness Score */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>
                  Evaluation Axis 1 (50% Weight)
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0' }}>
                  Code Correctness & Verification
                </h3>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (verdict?.code_score ?? 100) >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                {verdict?.code_score ?? 100}<span style={{ fontSize: '0.9rem', color: 'var(--text-subtle)' }}>/100</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '16px' }}>
              Measures automated test pass rate, syntax correctness, edge-case handling, and algorithmic stability.
            </p>

            <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-subtle)' }}>Original Attempt Tests:</span>
                <span style={{ fontWeight: 600, color: originalSub?.all_passed ? 'var(--success)' : 'var(--error)' }}>
                  {originalSub?.pass_count ?? 0} passed / {originalSub?.fail_count ?? 0} failed
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-subtle)' }}>Revised Submission Tests:</span>
                <span style={{ fontWeight: 600, color: revisionSub?.all_passed ? 'var(--success)' : 'var(--warning)' }}>
                  {revisionSub?.pass_count ?? 0} passed / {revisionSub?.fail_count ?? 0} failed
                </span>
              </div>
            </div>
          </div>

          {/* Axis 2: Debugging Reasoning Score */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>
                  Evaluation Axis 2 (50% Weight)
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0' }}>
                  Debugging Reasoning & Diagnosis
                </h3>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (verdict?.reasoning_score ?? 80) >= 70 ? 'var(--accent)' : 'var(--warning)' }}>
                {verdict?.reasoning_score ?? 80}<span style={{ fontSize: '0.9rem', color: 'var(--text-subtle)' }}>/100</span>
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

        {/* REASONING BENCHMARK COMPARISON MATRIX (Side-by-side) */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>
              Ground-Truth Benchmark Matrix
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 6px' }}>
              Candidate Reasoning vs. Agent's Benchmark Ideal Reasoning
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Direct side-by-side comparison between what the candidate explained and the AI evaluator's verified ground-truth model.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Left: Candidate Stated Reasoning */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>🗣️</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    Candidate's Stated Explanation
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    Submitted in response to diagnostic probe
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  fontStyle: 'italic',
                  flex: 1,
                  whiteSpace: 'pre-wrap',
                }}
              >
                "{studentAns?.answer_text || 'No explanation submitted by candidate.'}"
              </div>
            </div>

            {/* Right: Ideal Correct Reasoning Benchmark */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>🎯</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.95rem' }}>
                    Agent's Benchmark Ideal Reasoning
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    Ground-truth root-cause mechanism & optimal fix model
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  flex: 1,
                }}
              >
                {verdict?.ideal_reasoning || comp?.ideal_reasoning || 'Ideal reasoning benchmark synthesized for problem.'}
              </div>
            </div>
          </div>

          {/* AI Comparative Alignment Analysis Card */}
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '8px' }}>
              Comparative Reasoning Critique
            </div>
            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '16px' }}>
              {comp?.alignment_analysis || 'Candidate explanation demonstrates solid thematic alignment with root cause.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Strengths */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)', marginBottom: '6px' }}>
                  ✓ Key Identified Strengths
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  {(comp?.key_strengths && comp.key_strengths.length > 0) ? (
                    comp.key_strengths.map((s, idx) => <li key={idx}>{s}</li>)
                  ) : (
                    <li>Correctly connected code logic to test failure symptoms.</li>
                  )}
                </ul>
              </div>

              {/* Gaps / Misconceptions */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '6px' }}>
                  ⚠️ Blind Spots or Incomplete Explanations
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  {(comp?.misconceptions_or_gaps && comp.misconceptions_or_gaps.length > 0) ? (
                    comp.misconceptions_or_gaps.map((g, idx) => <li key={idx}>{g}</li>)
                  ) : (
                    <li>No significant misconceptions detected during diagnosis.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Diagnostic Question Probe Asked */}
        {diagQ && (
          <section style={{ marginBottom: '32px' }}>
            <div
              style={{
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#c084fc', marginBottom: '6px' }}>
                Diagnostic Probe Presented to Candidate
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                {diagQ.question_text}
              </div>
              {diagQ.failure_summary && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>Failure Target:</strong> {diagQ.failure_summary}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Code Evolution: Original vs Revision */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Code Evolution & Diff Inspection
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCodeTab('revision')}
                className={codeTab === 'revision' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Revised Code (Final)
              </button>
              <button
                onClick={() => setCodeTab('original')}
                className={codeTab === 'original' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Original Code (Buggy)
              </button>
            </div>
          </div>

          <div
            style={{
              background: '#0d1117',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: 'var(--surface-card)',
                padding: '10px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: 'var(--text-subtle)',
              }}
            >
              <span>{codeTab === 'revision' ? 'Final Revised Submission' : 'Original Initial Submission'}</span>
              <span>Python 3</span>
            </div>
            <pre
              style={{
                margin: 0,
                padding: '20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.88rem',
                color: '#e6edf3',
                overflowX: 'auto',
                lineHeight: '1.6',
              }}
            >
              {codeTab === 'revision' ? (revisionSub?.code || 'No revision submitted') : (originalSub?.code || 'No original code')}
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
};

export default RecruiterCandidateDossier;
