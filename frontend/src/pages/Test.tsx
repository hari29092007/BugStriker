import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetProblem } from '../lib/api';
import { useTestSession } from '../hooks/useTestSession';
import { useTestLock } from '../hooks/useTestLock';
import { useRealtimeRun } from '../hooks/useRealtimeRun';

import { StateTracker } from '../components/StateTracker';
import { CodeEditor } from '../components/CodeEditor';
import { TestPanel } from '../components/TestPanel';
import { DiagnosticQuestion } from '../components/DiagnosticQuestion';
import { StudentExplanation } from '../components/StudentExplanation';
import { RevisionEditor } from '../components/RevisionEditor';
import { TestLockOverlay } from '../components/TestLockOverlay';
import { ViolationWarning } from '../components/ViolationWarning';
import { FinalVerdict } from '../components/FinalVerdict';
import { EvidenceChain } from '../components/EvidenceChain';

import type { Problem } from '../types';

export const TestPage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState<string>('');
  const [problemLoading, setProblemLoading] = useState(true);

  const {
    runState,
    loading: sessionLoading,
    error: sessionError,
    startNewRun,
    submitInitialCode,
    submitExplanation,
    submitRevision,
    refreshState,
  } = useTestSession(problemId || '');

  const { isLocked, lockReason } = useTestLock(runState?.state);

  // Subscribe to Supabase Realtime updates
  useRealtimeRun(runState?.run_id, refreshState);

  // Load problem details
  useEffect(() => {
    if (!problemId) return;

    setProblemLoading(true);
    apiGetProblem(problemId)
      .then((data) => {
        setProblem(data);
        setCode(data.starter_code);
      })
      .catch((err) => console.error('Failed to load problem:', err))
      .finally(() => setProblemLoading(false));

    // Initialize run session
    startNewRun();
  }, [problemId]);

  if (problemLoading || !problem) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Loading debugging workspace...</div>
      </div>
    );
  }

  const currentState = runState?.state || 'SUBMITTED';
  const originalEvidence = runState?.original_submission?.execution_evidence || null;
  const revisionEvidence = runState?.revision_submission?.execution_evidence || null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Test Lock Overlay */}
      <TestLockOverlay isLocked={isLocked && sessionLoading} message={lockReason} />

      {/* Top Navigation */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            ← Catalog
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{problem.title}</h2>
            <span
              className={`badge badge-${problem.difficulty.toLowerCase()}`}
              style={{ fontSize: '0.7rem' }}
            >
              {problem.difficulty}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Session ID:</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-subtle)',
              background: 'var(--surface-card)',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {runState?.run_id ? runState.run_id.slice(0, 8) : 'Initializing...'}
          </span>
        </div>
      </header>

      {/* State Tracker Bar */}
      <StateTracker
        currentState={currentState}
        llmCallsUsed={runState?.llm_calls_used || 0}
        maxLlmCalls={5}
      />

      {/* Constraint Violation Banner */}
      <div style={{ padding: '0 24px' }}>
        <ViolationWarning reason={runState?.violation_reason} />
        {sessionError && (
          <div
            style={{
              background: 'var(--error-bg)',
              border: '1px solid var(--error)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              color: 'var(--error)',
              fontSize: '0.85rem',
              marginTop: '12px',
            }}
          >
            {sessionError}
          </div>
        )}
      </div>

      {/* Finished State View - Do NOT reveal result, correct, or green ticks to student */}
      {currentState === 'FINISHED' ? (
        <main style={{ flex: 1, padding: '48px 24px', maxWidth: '680px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '48px 36px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)',
            }}
          >
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

            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
              Your response is submitted
            </h1>

            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', maxWidth: '520px', margin: '0 auto 28px' }}>
              Your response is submitted and recorded for recruiter evaluation. All technical analysis is handled confidentially by the recruiting team.
            </p>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
              <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '12px 28px' }}>
                ← Return to Problem Catalog
              </button>
            </div>
          </div>
        </main>
      ) : (
        /* Active Debugging Workbench Split Layout */
        <main
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            padding: '20px 24px',
            maxWidth: '1800px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {/* Left Column: Interactive Code & Input Workspace */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Initial Submission Editor */}
            {currentState === 'SUBMITTED' && (
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Initial Solution Submission
                  </h3>
                  <button
                    onClick={() => submitInitialCode(code)}
                    disabled={sessionLoading || !code.trim()}
                    className="btn-primary"
                    style={{ padding: '8px 20px', fontSize: '0.88rem' }}
                  >
                    {sessionLoading ? 'Executing Tests...' : 'Submit to BugStriker ⚡'}
                  </button>
                </div>
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  disabled={sessionLoading}
                  height="460px"
                />
              </div>
            )}

            {/* In WAITING_FOR_STUDENT state: show diagnosis input */}
            {currentState === 'WAITING_FOR_STUDENT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <StudentExplanation
                  onSubmit={async (explanation) => {
                    await submitExplanation(explanation);
                  }}
                  disabled={sessionLoading}
                  existingAnswer={runState?.student_answer?.answer_text}
                />

                {/* Readonly original code for student reference while diagnosing */}
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Reference: Your Original Submission
                  </div>
                  <CodeEditor
                    value={runState?.original_submission?.code || code}
                    readOnly={true}
                    height="280px"
                  />
                </div>
              </div>
            )}

            {/* In REVISION state: show single revision editor */}
            {currentState === 'REVISION' && (
              <RevisionEditor
                initialCode={runState?.original_submission?.code || code}
                onSubmitRevision={async (revisedCode) => {
                  await submitRevision(revisedCode);
                }}
                disabled={sessionLoading}
              />
            )}
          </div>

          {/* Right Column: Problem Spec, Test Panel, and Agent Probe */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Agent Diagnostic Question Probe */}
            {runState?.diagnostic_question && (
              <DiagnosticQuestion question={runState.diagnostic_question} />
            )}

            {/* Test Results / Execution Evidence */}
            <TestPanel
              evidence={revisionEvidence || originalEvidence}
              loading={sessionLoading && (currentState === 'RUNNING_TESTS' || currentState === 'ANALYZING')}
            />

            {/* Problem Spec Card */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
                Problem Specification
              </h3>
              <div
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-main)',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-line',
                  marginBottom: '16px',
                }}
              >
                {problem.description}
              </div>

              {problem.constraints && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '4px' }}>
                    CONSTRAINTS
                  </div>
                  <pre
                    style={{
                      background: 'var(--surface-card)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      lineHeight: '1.5',
                    }}
                  >
                    {problem.constraints}
                  </pre>
                </div>
              )}

              {problem.examples && problem.examples.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '6px' }}>
                    EXAMPLES
                  </div>
                  {problem.examples.map((ex, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'var(--surface-card)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        marginBottom: '6px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <div><strong>Input:</strong> {ex.input}</div>
                      <div><strong>Output:</strong> {ex.output}</div>
                      {ex.explanation && <div style={{ color: 'var(--text-subtle)' }}>{ex.explanation}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
};
export default TestPage;
