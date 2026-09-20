import React, { useState } from 'react';

interface StudentExplanationProps {
  onSubmit: (explanation: string) => Promise<void>;
  disabled?: boolean;
  existingAnswer?: string | null;
}

export const StudentExplanation: React.FC<StudentExplanationProps> = ({
  onSubmit,
  disabled = false,
  existingAnswer = null,
}) => {
  const [explanation, setExplanation] = useState(existingAnswer || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explanation.trim() || disabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(explanation.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingAnswer) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}
      >
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
          ✓ Your Recorded Bug Diagnosis
        </div>
        <div
          style={{
            background: 'var(--surface-card)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            lineHeight: 1.5,
          }}
        >
          {existingAnswer}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
          Step 5: Explain the Bug
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          To demonstrate understanding, diagnose why the bug occurred based on the agent probe.
          (1 explanation limit).
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          disabled={disabled || isSubmitting}
          rows={4}
          placeholder="e.g. My loop didn't account for negative numbers because I checked nums[i] > target..."
          style={{
            width: '100%',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.88rem',
            padding: '12px',
            lineHeight: '1.5',
            resize: 'vertical',
            outline: 'none',
            marginBottom: '12px',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
            {explanation.length} characters (aim for 20+ chars)
          </span>

          <button
            type="submit"
            disabled={!explanation.trim() || disabled || isSubmitting}
            className="btn-primary"
            style={{ fontSize: '0.85rem', padding: '8px 16px' }}
          >
            {isSubmitting ? 'Recording Diagnosis...' : 'Submit Diagnosis & Unlock Revision →'}
          </button>
        </div>
      </form>
    </div>
  );
};
