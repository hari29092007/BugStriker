import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUploadCV } from '../lib/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type UploadState = 'idle' | 'uploading' | 'submitted' | 'error';

const ACCENT = '#10b981'; // emerald green for CV section

export const CVUpload: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [userEmail] = useState(
    () => localStorage.getItem('bugstriker_dev_user') || 'candidate@bugstriker.dev'
  );

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) await supabase.auth.signOut();
    localStorage.removeItem('bugstriker_dev_user');
    localStorage.removeItem('bugstriker_role');
    window.location.href = '/login';
  };

  const acceptFile = (f: File) => {
    const name = f.name.toLowerCase();
    const ok = name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.txt');
    if (!ok) { setErrorMsg('Only PDF, DOCX, or TXT files are accepted.'); return; }
    if (f.size > 5 * 1024 * 1024) { setErrorMsg('File must be under 5 MB.'); return; }
    setErrorMsg('');
    setFile(f);
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

  const handleSubmit = async () => {
    if (!file) return;
    setUploadState('uploading');
    setErrorMsg('');
    try {
      await apiUploadCV(file);
      setUploadState('submitted');
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed. Please try again.');
      setUploadState('error');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📄</div>
          <div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800 }}>
              Bug<span style={{ color: 'var(--primary)' }}>Striker</span>
            </span>
            <span style={{ marginLeft: '10px', fontSize: '0.72rem', color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              CV Upload
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Candidate: <strong style={{ color: 'var(--text-main)' }}>{userEmail}</strong>
          </span>
          <button onClick={() => navigate('/')} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>← Dashboard</button>
          <button onClick={handleSignOut} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>Sign Out</button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '680px', width: '100%', margin: '0 auto', padding: '60px 24px' }}>

        {/* Submitted State */}
        {uploadState === 'submitted' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '24px' }}>✅</div>
            <div style={{ background: 'var(--surface)', border: `1px solid ${ACCENT}55`, borderRadius: 'var(--radius-xl)', padding: '40px 48px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: ACCENT, marginBottom: '12px' }}>
                Your CV has been submitted.
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '32px' }}>
                Our team will review your resume as part of the evaluation process.
                You will be contacted with next steps.
              </p>
              <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '12px 32px', fontSize: '1rem' }}>
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>📄</div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Upload Your CV / Resume</h1>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '52px' }}>
                Submit your resume for review. Accepted formats: <strong>PDF, DOCX, TXT</strong> (max 5 MB).
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? ACCENT : file ? ACCENT + '88' : 'var(--border)'}`,
                borderRadius: 'var(--radius-xl)',
                padding: '52px 32px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? `${ACCENT}08` : file ? `${ACCENT}06` : 'var(--surface)',
                transition: 'all 0.2s ease',
                marginBottom: '24px',
              }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={onFileChange} />

              {file ? (
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📎</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '4px' }}>{file.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatSize(file.size)} · Click to change file</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>☁️</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                    Drag & drop your CV here
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>or click to browse — PDF, DOCX, TXT · Max 5 MB</div>
                </div>
              )}
            </div>

            {/* Error */}
            {errorMsg && (
              <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', padding: '12px 16px', borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: '0.87rem', marginBottom: '20px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* What happens next info */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: '28px', fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
              <strong style={{ color: 'var(--text-main)' }}>What happens next?</strong><br />
              Your CV will be reviewed as part of your complete assessment. The evaluation team will receive your full application including your coding performance and CV analysis. You'll be notified of the outcome separately.
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!file || uploadState === 'uploading'}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700, opacity: (!file || uploadState === 'uploading') ? 0.5 : 1, cursor: (!file || uploadState === 'uploading') ? 'not-allowed' : 'pointer' }}
            >
              {uploadState === 'uploading' ? '⏳ Submitting CV...' : '📤 Submit CV'}
            </button>
          </>
        )}
      </main>
    </div>
  );
};

export default CVUpload;
