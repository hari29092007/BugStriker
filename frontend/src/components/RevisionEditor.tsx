import React, { useState } from 'react';
import { CodeEditor } from './CodeEditor';

interface RevisionEditorProps {
  initialCode: string;
  onSubmitRevision: (code: string) => Promise<void>;
  disabled?: boolean;
}

export const RevisionEditor: React.FC<RevisionEditorProps> = ({
  initialCode,
  onSubmitRevision,
  disabled = false,
}) => {
  const [code, setCode] = useState(initialCode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim() || disabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitRevision(code);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>⚡</span>
            Step 6: Submit Revised Code
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            This is your <strong>ONLY</strong> allowed revision. Review carefully before submitting.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={disabled || isSubmitting || !code.trim()}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.88rem' }}
        >
          {isSubmitting ? 'Evaluating Revision...' : 'Run Final Evaluation →'}
        </button>
      </div>

      <CodeEditor
        value={code}
        onChange={setCode}
        readOnly={disabled || isSubmitting}
        height="380px"
      />
    </div>
  );
};
