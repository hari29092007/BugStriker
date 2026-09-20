import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetRun, apiUploadCV } from '../lib/api';
import type { RunStateResponse } from '../types';

type CVStatus = 'pending' | 'uploading' | 'done';

const ACCENT_CV = '#10b981';

export const ResultPage: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [runState, setRunState] = useState<RunStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CV upload state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvStatus, setCvStatus] = useState<CVStatus>('pending');
  const [cvError, setCvError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <button onClick={() => navigate('/')} className="btn-secondary">Return to Problem Catalog</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '0.05em' }}>
            BUGSTRIKER <span style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>STUDENT PORTAL</span>
          </span>
        </div>
        <button onClick={handleSignOut} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>Sign Out</button>
      </header>

      <main style={{ flex: 1, maxWidth: '680px', width: '100%', margin: '40px auto', padding: '0 24px' }}>

        {/* ── STEP 1: Test submitted ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#60a5fa' }}>1</div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Coding / Aptitude Test</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600 }}>✓ Submitted</span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '36px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 16px' }}>📝</div>
          <span style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600 }}>Session Recorded</span>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, margin: '14px 0 8px', color: 'var(--text-main)' }}>Your response is submitted</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '460px', margin: '0 auto 20px' }}>
            Your coding and reasoning response has been recorded for confidential recruiter evaluation.
          </p>
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', textAlign: 'left' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '12px' }}>Submission Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <div><div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Session ID</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '2px' }}>{runState.run_id.slice(0, 12)}...</div></div>
              <div><div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Diagnostic Explanation</div><div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '2px' }}>{runState.student_answer ? 'Submitted' : 'None'}</div></div>
              <div><div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Code Revision</div><div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '2px' }}>{runState.revision_submission ? 'Submitted' : 'None'}</div></div>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '-8px 0', gap: '2px' }}>
          <div style={{ width: '2px', height: '16px', background: 'var(--border)' }} />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {cvStatus === 'done' ? '✓ Complete' : 'Next Step Required'}
          </div>
          <div style={{ width: '2px', height: '16px', background: 'var(--border)' }} />
        </div>

        {/* ── STEP 2: CV Upload ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: cvStatus === 'done' ? `${ACCENT_CV}22` : 'rgba(16,185,129,0.12)',
            border: `1px solid ${cvStatus === 'done' ? ACCENT_CV : 'rgba(16,185,129,0.4)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 800, color: ACCENT_CV,
          }}>2</div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>CV / Resume Upload</span>
          {cvStatus !== 'done' && (
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600, background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
              ⚠ Required
            </span>
          )}
          {cvStatus === 'done' && (
            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: ACCENT_CV, fontWeight: 600 }}>✓ Submitted</span>
          )}
        </div>

        {cvStatus === 'done' ? (
          /* ── CV Done → Final confirmation ── */
          <div style={{ background: `${ACCENT_CV}08`, border: `1px solid ${ACCENT_CV}44`, borderRadius: 'var(--radius-xl)', padding: '36px', textAlign: 'center', boxShadow: `0 8px 32px ${ACCENT_CV}10` }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: ACCENT_CV, marginBottom: '10px' }}>
              Assessment Complete
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '28px', maxWidth: '420px', margin: '0 auto 24px' }}>
              Your CV has been submitted. Your full assessment — coding, reasoning, and resume — has been recorded and will be reviewed by the evaluation team.
            </p>
            <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '12px 32px' }}>
              ← Return to Dashboard
            </button>
          </div>
        ) : (
          /* ── CV Upload form ── */
          <div style={{ background: 'var(--surface)', border: `1px solid ${ACCENT_CV}44`, borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: `0 8px 32px ${ACCENT_CV}08` }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px', marginTop: 0 }}>
              Upload your CV / Resume to complete your assessment. This is <strong style={{ color: 'var(--text-main)' }}>mandatory</strong> — your application will not be complete without it. Accepted: <strong>PDF, DOCX, TXT</strong> · Max 5 MB.
            </p>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? ACCENT_CV : cvFile ? ACCENT_CV + '88' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)', padding: '36px 20px', textAlign: 'center',
                cursor: 'pointer', background: dragOver ? `${ACCENT_CV}08` : cvFile ? `${ACCENT_CV}05` : 'var(--surface-card)',
                transition: 'all 0.2s ease', marginBottom: '16px',
              }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={onFileChange} />
              {cvFile ? (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📎</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '2px' }}>{cvFile.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>{formatSize(cvFile.size)} · Click to change</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>☁️</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>Drag & drop your CV here</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>or click to browse</div>
                </div>
              )}
            </div>

            {cvError && (
              <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: '0.83rem', marginBottom: '14px' }}>
                ⚠️ {cvError}
              </div>
            )}

            <button
              onClick={handleCVSubmit}
              disabled={!cvFile || cvStatus === 'uploading'}
              className="btn-primary"
              style={{
                width: '100%', padding: '13px', fontSize: '0.95rem', fontWeight: 700,
                background: ACCENT_CV, borderColor: ACCENT_CV,
                opacity: (!cvFile || cvStatus === 'uploading') ? 0.5 : 1,
                cursor: (!cvFile || cvStatus === 'uploading') ? 'not-allowed' : 'pointer',
              }}
            >
              {cvStatus === 'uploading' ? '⏳ Submitting CV...' : '📤 Submit CV to Complete Assessment'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResultPage;
