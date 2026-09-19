import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetProblem, apiUploadCV } from '../lib/api';
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

const ACCENT_CV = '#10b981';
type CVStatus = 'pending' | 'uploading' | 'done';

export const TestPage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState<string>('');
  const [problemLoading, setProblemLoading] = useState(true);

  // CV Upload state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvStatus, setCvStatus] = useState<CVStatus>('pending');
  const [cvError, setCvError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (f: File) => {
    const name = f.name.toLowerCase();
    const ok = name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.txt');
    if (!ok) { setCvError('Only PDF, DOCX, or TXT files are accepted.'); return; }
    if (f.size > 5 * 1024 * 1024) { setCvError('File must be under 5 MB.'); return; }
    setCvError('');
    setCvFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  };

  const handleCVSubmit = async () => {
    if (!cvFile) return;
    setCvStatus('uploading');
    setCvError('');
    try {
      await apiUploadCV(cvFile);
      setCvStatus('done');
    } catch (err: any) {
      setCvError(err.message || 'Upload failed. Please try again.');
      setCvStatus('pending');
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

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
        cvUploaded={cvStatus === 'done'}
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

      {/* Finished State View: Step 7 CV Upload -> Step 8 Final Submitted */}
      {currentState === 'FINISHED' ? (
        <main style={{ flex: 1, padding: '48px 24px', maxWidth: '680px', width: '100%', margin: '0 auto' }}>
          {cvStatus !== 'done' ? (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: '40px 36px',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    margin: '0 auto 16px',
                  }}
                >
                  📄
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: ACCENT_CV,
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '4px 14px',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                    }}
                  >
                    Step 7 of 8 · Mandatory
                  </span>
                </div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
                  Upload Your CV / Resume
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '520px', margin: '0 auto' }}>
                  Your code revision has been processed. To finalize and submit your test for recruiter evaluation, please upload your resume.
                </p>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? ACCENT_CV : cvFile ? ACCENT_CV + 'aa' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '36px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? 'rgba(16, 185, 129, 0.08)' : cvFile ? 'rgba(16, 185, 129, 0.04)' : 'var(--surface-card)',
                  transition: 'all 0.2s ease',
                  marginBottom: '18px',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  style={{ display: 'none' }}
                  onChange={onFileChange}
                />
                {cvFile ? (
                  <div>
                    <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>📎</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                      {cvFile.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                      {formatSize(cvFile.size)} · Click to change file
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>☁️</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                      Drag &amp; drop your CV here, or click to browse
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                      Accepted formats: PDF, DOCX, TXT (Max 5 MB)
                    </div>
                  </div>
                )}
              </div>

              {cvError && (
                <div
                  style={{
                    background: 'var(--error-bg)',
                    border: '1px solid var(--error)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--error)',
                    fontSize: '0.83rem',
                    marginBottom: '16px',
                  }}
                >
                  ⚠️ {cvError}
                </div>
              )}

              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  marginBottom: '22px',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.5',
                }}
              >
                ℹ️ <strong style={{ color: 'var(--text-main)' }}>Cumulative Scoring:</strong> Your technical test score (75%) and CV analysis (25%) will be combined to produce the final recruiter dossier.
              </div>

              <button
                onClick={handleCVSubmit}
                disabled={!cvFile || cvStatus === 'uploading'}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  background: ACCENT_CV,
                  borderColor: ACCENT_CV,
                  opacity: !cvFile || cvStatus === 'uploading' ? 0.5 : 1,
                  cursor: !cvFile || cvStatus === 'uploading' ? 'not-allowed' : 'pointer',
                }}
              >
                {cvStatus === 'uploading' ? '⏳ Analyzing & Submitting CV...' : 'Submit CV & Complete Test →'}
              </button>
            </div>
          ) : (
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
                  Step 8 of 8 · Completed
                </span>
              </div>

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
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  textAlign: 'left',
                  marginBottom: '28px',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '12px' }}>
                  Submission Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Session ID</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '2px' }}>
                      {runState?.run_id ? runState.run_id.slice(0, 12) : '—'}...
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Code Revision</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '2px' }}>
                      {runState?.revision_submission ? 'Submitted' : 'Submitted'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Diagnostic Explanation</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '2px' }}>
                      {runState?.student_answer ? 'Submitted' : 'None'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>CV / Resume</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '2px' }}>
                      {cvFile ? cvFile.name : 'Submitted'}
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
          )}
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
