import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiListProblems } from '../lib/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Problem } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('student@bugstriker.dev');

  useEffect(() => {
    // If an assessment is in progress, lock candidate out of the catalog
    const activeProblem = localStorage.getItem('bugstriker_active_problem');
    if (activeProblem) {
      navigate(`/problem/${activeProblem}`, { replace: true });
      return;
    }

    if (isSupabaseConfigured()) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) setUserEmail(data.user.email);
      });
    } else {
      const dev = localStorage.getItem('bugstriker_dev_user');
      if (dev) setUserEmail(dev);
    }

    apiListProblems()
      .then((data) => setProblems(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('bugstriker_dev_user');
    localStorage.removeItem('bugstriker_role');
    localStorage.removeItem('bugstriker_active_problem');
    localStorage.removeItem('bugstriker_active_run_id');
    window.location.href = '/login';
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':   return <span className="badge badge-easy">Easy</span>;
      case 'medium': return <span className="badge badge-medium">Medium</span>;
      case 'hard':   return <span className="badge badge-hard">Hard</span>;
      default:       return <span className="badge badge-easy">{difficulty}</span>;
    }
  };

  // Split by category (backend returns "coding" | "aptitude")
  const codingProblems   = problems.filter((p) => p.category !== 'aptitude');
  const aptitudeProblems = problems.filter((p) => p.category === 'aptitude');

  const renderCard = (prob: Problem) => {
    const isFeatured = prob.slug === 'two-sum';
    return (
      <div
        key={prob.id}
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          border: isFeatured ? '1px solid rgba(249,115,22,0.4)' : '1px solid var(--border)',
          boxShadow: isFeatured ? '0 8px 24px rgba(249,115,22,0.08)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            {getDifficultyBadge(prob.difficulty)}
            {isFeatured && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(249,115,22,0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                ★ Featured
              </span>
            )}
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
            {prob.title}
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {prob.description.replace(/[*_`]/g, '')}
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
            {prob.function_signature}()
          </span>
          <button
            onClick={() => {
              localStorage.setItem('bugstriker_active_problem', prob.id);
              navigate(`/problem/${prob.id}`);
            }}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Start Session →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⚡</div>
          <div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800 }}>
              Bug<span style={{ color: 'var(--primary)' }}>Striker</span>
            </span>
            <span style={{ marginLeft: '10px', fontSize: '0.72rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Candidate Portal
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Candidate: <strong style={{ color: 'var(--text-main)' }}>{userEmail}</strong>
          </div>
          <button onClick={handleSignOut} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '40px 24px' }}>
        {/* Hero banner */}
        <div style={{ background: 'linear-gradient(135deg,rgba(249,115,22,0.08) 0%,rgba(139,92,246,0.08) 100%)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Select a Problem to Debug</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '640px' }}>
              Submit Python code → receive 1 targeted probe → explain the bug → submit 1 revision → get an evidence-based assessment.
            </p>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 18px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>1 Probe · 1 Fix</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Strict Evaluation Cycle</div>
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading problem catalog...</div>}
        {error && <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', padding: '16px', borderRadius: 'var(--radius-md)', color: 'var(--error)' }}>Error loading problems: {error}</div>}

        {!loading && !error && (
          <>
            {/* ── CODING CHALLENGES ── */}
            <section style={{ marginBottom: '56px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>💻</div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Coding Challenges</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Write &amp; debug Python code — scored equally on correctness and bug-finding reasoning</p>
                </div>
              </div>
              <div style={{ height: '2px', background: 'linear-gradient(to right,rgba(249,115,22,0.5),transparent)', borderRadius: '2px', marginTop: '10px', marginBottom: '24px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '24px' }}>
                {codingProblems.length === 0
                  ? <p style={{ color: 'var(--text-subtle)' }}>No coding problems available.</p>
                  : codingProblems.map(renderCard)}
              </div>
            </section>

            {/* ── APTITUDE & LOGIC ── */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🧩</div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Aptitude &amp; Logic</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Algorithmic reasoning &amp; quantitative problems — equal weight on code and analytical explanation</p>
                </div>
              </div>
              <div style={{ height: '2px', background: 'linear-gradient(to right,rgba(139,92,246,0.5),transparent)', borderRadius: '2px', marginTop: '10px', marginBottom: '24px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '24px' }}>
                {aptitudeProblems.length === 0
                  ? <p style={{ color: 'var(--text-subtle)' }}>No aptitude problems available.</p>
                  : aptitudeProblems.map(renderCard)}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
