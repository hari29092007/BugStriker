import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TestPage from './pages/Test';
import ResultPage from './pages/Result';
import RecruiterDashboard from './pages/RecruiterDashboard';
import RecruiterCandidateDossier from './pages/RecruiterCandidateDossier';
import CVUpload from './pages/CVUpload';
import RecruiterCVReport from './pages/RecruiterCVReport';

export const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDevAuth, setIsDevAuth] = useState(false);

  useEffect(() => {
    // Check if Supabase is active
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });

      return () => subscription.unsubscribe();
    } else {
      // Local dev session
      const devUser = localStorage.getItem('bugstriker_dev_user');
      setIsDevAuth(Boolean(devUser));
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg)',
          color: 'var(--primary)',
          fontFamily: 'var(--font-heading)',
          fontSize: '1.2rem',
        }}
      >
        Initializing BugStriker...
      </div>
    );
  }

  const isAuthenticated = Boolean(session) || isDevAuth;
  const currentRole = localStorage.getItem('bugstriker_role') || 'student';

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Page */}
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <Login />
            ) : currentRole === 'recruiter' ? (
              <Navigate to="/recruiter" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Student / Candidate Portal Routes */}
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : currentRole === 'recruiter' ? (
              <Navigate to="/recruiter" replace />
            ) : localStorage.getItem('bugstriker_active_problem') ? (
              <Navigate to={`/problem/${localStorage.getItem('bugstriker_active_problem')}`} replace />
            ) : (
              <Dashboard />
            )
          }
        />
        <Route
          path="/problem/:problemId"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : currentRole === 'recruiter' ? (
              <Navigate to="/recruiter" replace />
            ) : (
              <TestPage />
            )
          }
        />
        <Route
          path="/run/:runId/result"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : currentRole === 'recruiter' ? (
              <Navigate to="/recruiter" replace />
            ) : (
              <ResultPage />
            )
          }
        />

        {/* Recruiter Portal Routes (Strictly Guarded - Students Blocked) */}
        <Route
          path="/recruiter"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : currentRole !== 'recruiter' ? (
              <Navigate to="/" replace />
            ) : (
              <RecruiterDashboard />
            )
          }
        />
        <Route
          path="/recruiter/candidate/:runId"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : currentRole !== 'recruiter' ? (
              <Navigate to="/" replace />
            ) : (
              <RecruiterCandidateDossier />
            )
          }
        />

        {/* CV Upload — students only */}
        <Route
          path="/cv-upload"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : currentRole === 'recruiter' ? (
              <Navigate to="/recruiter" replace />
            ) : (
              <CVUpload />
            )
          }
        />

        {/* CV Report — recruiters only */}
        <Route
          path="/recruiter/cv/:cvId"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : currentRole !== 'recruiter' ? (
              <Navigate to="/" replace />
            ) : (
              <RecruiterCVReport />
            )
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
export default App;
