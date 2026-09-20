import React from 'react';

interface ViolationWarningProps {
  reason?: string | null;
}

export const ViolationWarning: React.FC<ViolationWarningProps> = ({ reason }) => {
  if (!reason) return null;

  return (
    <div
      style={{
        background: 'var(--error-bg)',
        border: '1px solid var(--error)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: 'var(--error)',
        fontSize: '0.88rem',
        margin: '16px 0',
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>⚠️</span>
      <div>
        <strong>Session Constraint Violation:</strong> {reason}
      </div>
    </div>
  );
};
