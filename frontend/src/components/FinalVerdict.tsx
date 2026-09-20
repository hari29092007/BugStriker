import React from 'react';
import type { Verdict } from '../types';

interface FinalVerdictProps {
  verdict: Verdict | null;
  onRestart?: () => void;
  onGoToProblems?: () => void;
}

export const FinalVerdict: React.FC<FinalVerdictProps> = ({
  verdict,
  onRestart,
  onGoToProblems,
}) => {
  if (!verdict) return null;

  const isVerified = verdict.verdict === 'VERIFIED' || verdict.verdict === 'AUTO_PASS';
  const isPartial = verdict.verdict === 'PARTIAL';
  const isFailed = verdict.verdict === 'NOT_VERIFIED';

  let borderColor = 'var(--error)';
  let glowColor = 'rgba(239, 68, 68, 0.2)';
  let badgeClass = 'badge-not-verified';
  let icon = '❌';
  let title = 'Revision Not Verified';

  if (isVerified) {
    borderColor = 'var(--success)';
    glowColor = 'rgba(34, 197, 94, 0.2)';
    badgeClass = 'badge-verified';
    icon = '✅';
    title = verdict.verdict === 'AUTO_PASS' ? 'Passed on First Try' : 'Bug Diagnosis & Fix Verified!';
  } else if (isPartial) {
    borderColor = 'var(--warning)';
    glowColor = 'rgba(245, 158, 11, 0.2)';
    badgeClass = 'badge-partial';
    icon = '⚠️';
    title = 'Partially Verified';
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `2px solid ${borderColor}`,
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        boxShadow: `0 8px 32px ${glowColor}`,
        textAlign: 'center',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{icon}</div>

      <div style={{ marginBottom: '8px' }}>
        <span className={`badge ${badgeClass}`} style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
          {verdict.verdict}
        </span>
      </div>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>
        {title}
      </h2>

      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          color: 'var(--text-main)',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          marginBottom: '28px',
          textAlign: 'left',
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '4px' }}>
          Evaluator Verdict Rationale
        </div>
        {verdict.rationale}
      </div>

      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
        {onGoToProblems && (
          <button onClick={onGoToProblems} className="btn-secondary" style={{ padding: '12px 24px' }}>
            ← Back to Problem Catalog
          </button>
        )}
        {onRestart && (
          <button onClick={onRestart} className="btn-primary" style={{ padding: '12px 24px' }}>
            Start New Attempt ↺
          </button>
        )}
      </div>
    </div>
  );
};
