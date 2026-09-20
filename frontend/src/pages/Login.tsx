import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  // Student Section State
  const [studentTab, setStudentTab] = useState<'login' | 'signup'>('login');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentName, setStudentName] = useState('');

  // Recruiter Section State
  const [recruiterTab, setRecruiterTab] = useState<'login' | 'signup'>('login');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPassword, setRecruiterPassword] = useState('');
  const [recruiterCompany, setRecruiterCompany] = useState('');

  // Handle Student Auth - Any email/password connects directly to student section
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = studentEmail.trim() || 'student@bugstriker.dev';
    localStorage.setItem('bugstriker_role', 'student');
    localStorage.setItem('bugstriker_dev_user', emailToUse);

    if (isSupabaseConfigured()) {
      try {
        if (studentTab === 'signup') {
          await supabase.auth.signUp({
            email: emailToUse,
            password: studentPassword || 'password123',
            options: { data: { full_name: studentName || 'Student Candidate', role: 'student' } },
          });
        }
        await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: studentPassword || 'password123',
        });
      } catch {
        // Fallback to local auth
      }
    }

    // Connect immediately to student main dashboard
    window.location.href = '/';
  };

  // Handle Recruiter Auth - Any email/password connects directly to recruiter verdict section
  const handleRecruiterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = recruiterEmail.trim() || 'recruiter@techcorp.com';
    localStorage.setItem('bugstriker_role', 'recruiter');
    localStorage.setItem('bugstriker_dev_user', emailToUse);

    if (isSupabaseConfigured()) {
      try {
        if (recruiterTab === 'signup') {
          await supabase.auth.signUp({
            email: emailToUse,
            password: recruiterPassword || 'password123',
            options: { data: { company: recruiterCompany || 'Tech Corp', role: 'recruiter' } },
          });
        }
        await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: recruiterPassword || 'password123',
        });
      } catch {
        // Fallback to local auth
      }
    }

    // Connect immediately to recruiter verdict section
    window.location.href = '/recruiter';
  };

  const handleQuickStudentDemo = () => {
    localStorage.setItem('bugstriker_role', 'student');
    localStorage.setItem('bugstriker_dev_user', 'student@bugstriker.dev');
    window.location.href = '/';
  };

  const handleQuickRecruiterDemo = () => {
    localStorage.setItem('bugstriker_role', 'recruiter');
    localStorage.setItem('bugstriker_dev_user', 'recruiter@techcorp.com');
    window.location.href = '/recruiter';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px', zIndex: 1 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'rgba(249, 115, 22, 0.12)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            fontSize: '2rem',
            marginBottom: '14px',
          }}
        >
          ⚡
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px' }}>
          Bug<span style={{ color: 'var(--primary)' }}>Striker</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
          Adaptive Code Debugging & Technical Assessment Platform
        </p>
        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
          Enter any email & password below to immediately access your portal
        </div>
      </div>

      {/* Two-Section Portals Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '28px',
          width: '100%',
          maxWidth: '920px',
          zIndex: 1,
        }}
      >
        {/* SECTION 1: STUDENT / CANDIDATE PORTAL */}
        <div
          className="card"
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(249, 115, 22, 0.35)',
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <span
                style={{
                  background: 'rgba(249, 115, 22, 0.15)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Candidate Experience
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>
                🎓 Student Portal
              </h2>
            </div>
            <div style={{ fontSize: '1.8rem' }}>💻</div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '20px' }}>
            Take technical debugging assessments, submit code fixes, and answer Socratic diagnostic questions.
            Final results remain strictly confidential.
          </p>

          {/* Student Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px',
              background: 'var(--surface-card)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
            }}
          >
            <button
              type="button"
              onClick={() => setStudentTab('login')}
              style={{
                padding: '7px',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: studentTab === 'login' ? 'var(--surface)' : 'transparent',
                color: studentTab === 'login' ? 'var(--text-main)' : 'var(--text-subtle)',
                border: studentTab === 'login' ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              Candidate Log In
            </button>
            <button
              type="button"
              onClick={() => setStudentTab('signup')}
              style={{
                padding: '7px',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: studentTab === 'signup' ? 'var(--surface)' : 'transparent',
                color: studentTab === 'signup' ? 'var(--text-main)' : 'var(--text-subtle)',
                border: studentTab === 'signup' ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              Self Sign-Up
            </button>
          </div>

          <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {studentTab === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Alex Rivera"
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', padding: '9px 12px', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Student / Candidate Email
              </label>
              <input
                type="email"
                required
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="student@university.edu"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', padding: '9px 12px', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', padding: '9px 12px', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '11px', marginTop: '6px', fontSize: '0.9rem' }}
            >
              {studentTab === 'signup' ? 'Create Account & Open Student Dashboard →' : 'Enter Student Dashboard →'}
            </button>
          </form>

          {/* Quick Demo Access for Student */}
          <div style={{ marginTop: '18px', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            <button
              type="button"
              onClick={handleQuickStudentDemo}
              style={{ background: 'transparent', color: 'var(--accent)', fontSize: '0.8rem', textDecoration: 'underline', border: 'none', cursor: 'pointer' }}
            >
              ⚡ Instant Demo: Enter as Candidate
            </button>
          </div>
        </div>

        {/* SECTION 2: RECRUITER / HIRING PORTAL */}
        <div
          className="card"
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <span
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Hiring Committee Access
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>
                👔 Recruiter Portal
              </h2>
            </div>
            <div style={{ fontSize: '1.8rem' }}>📊</div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '20px' }}>
            Inspect candidate dossiers, dual code (50%) & reasoning (50%) scorecards, benchmark comparisons, and hiring recommendations.
          </p>

          {/* Recruiter Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px',
              background: 'var(--surface-card)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
            }}
          >
            <button
              type="button"
              onClick={() => setRecruiterTab('login')}
              style={{
                padding: '7px',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: recruiterTab === 'login' ? 'var(--surface)' : 'transparent',
                color: recruiterTab === 'login' ? 'var(--text-main)' : 'var(--text-subtle)',
                border: recruiterTab === 'login' ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              Recruiter Log In
            </button>
            <button
              type="button"
              onClick={() => setRecruiterTab('signup')}
              style={{
                padding: '7px',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: recruiterTab === 'signup' ? 'var(--surface)' : 'transparent',
                color: recruiterTab === 'signup' ? 'var(--text-main)' : 'var(--text-subtle)',
                border: recruiterTab === 'signup' ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              Recruiter Sign-Up
            </button>
          </div>

          <form onSubmit={handleRecruiterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {recruiterTab === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={recruiterCompany}
                  onChange={(e) => setRecruiterCompany(e.target.value)}
                  placeholder="Tech Corp / Hiring Dept"
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', padding: '9px 12px', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Recruiter Work Email
              </label>
              <input
                type="email"
                required
                value={recruiterEmail}
                onChange={(e) => setRecruiterEmail(e.target.value)}
                placeholder="recruiter@company.com"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', padding: '9px 12px', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={recruiterPassword}
                onChange={(e) => setRecruiterPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', padding: '9px 12px', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '11px',
                marginTop: '6px',
                fontSize: '0.9rem',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {recruiterTab === 'signup' ? 'Create Account & Open Verdict Section →' : 'Enter Verdict Section →'}
            </button>
          </form>

          {/* Quick Demo Access for Recruiter */}
          <div style={{ marginTop: '18px', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            <button
              type="button"
              onClick={handleQuickRecruiterDemo}
              style={{ background: 'transparent', color: '#60a5fa', fontSize: '0.8rem', textDecoration: 'underline', border: 'none', cursor: 'pointer' }}
            >
              👔 Instant Demo: Enter as Recruiter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
