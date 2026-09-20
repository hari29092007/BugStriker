import React from 'react';
import type { RunState } from '../types';

interface StateTrackerProps {
  currentState: RunState;
  llmCallsUsed?: number;
  maxLlmCalls?: number;
  cvUploaded?: boolean;
}

const STEPS: { key: string; label: string; desc: string }[] = [
  { key: 'SUBMITTED', label: '1. Submitted', desc: 'Code received' },
  { key: 'RUNNING_TESTS', label: '2. Running Tests', desc: 'Executing cases' },
  { key: 'ANALYZING', label: '3. Analyzing', desc: 'Isolating failure' },
  { key: 'QUESTIONING', label: '4. Questioning', desc: 'Generating probe' },
  { key: 'WAITING_FOR_STUDENT', label: '5. Student Diagnosis', desc: 'Awaiting your answer' },
  { key: 'REVISION', label: '6. Revision', desc: 'Single fix attempt' },
  { key: 'CV_UPLOAD', label: '7. CV Upload', desc: 'Upload resume' },
  { key: 'FINISHED', label: '8. Submitted', desc: 'Response recorded' },
];

export const StateTracker: React.FC<StateTrackerProps> = ({
  currentState,
  llmCallsUsed = 0,
  maxLlmCalls = 5,
  cvUploaded = false,
}) => {
  let currentIdx = STEPS.findIndex((s) => s.key === currentState);
  if (currentState === 'FINISHED') {
    currentIdx = cvUploaded ? 7 : 6;
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: currentState === 'FINISHED' && cvUploaded ? 'var(--success)' : 'var(--primary)',
              boxShadow: currentState === 'FINISHED' && cvUploaded ? '0 0 8px var(--success)' : '0 0 8px var(--primary)',
            }}
          />
          <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Active State Machine
          </span>
        </div>

        {/* LLM Call Counter Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--surface-card)',
            padding: '4px 12px',
            borderRadius: '9999px',
            border: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>AI Budget:</span>
          <span
            style={{
              fontWeight: 700,
              color: llmCallsUsed >= maxLlmCalls ? 'var(--error)' : 'var(--primary)',
            }}
          >
            {llmCallsUsed} / {maxLlmCalls} calls
          </span>
        </div>
      </div>

      {/* Horizontal Steps */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
          gap: '8px',
          position: 'relative',
        }}
      >
        {STEPS.map((step, idx) => {
          const isDone = currentIdx > idx;
          const isCurrent = currentIdx === idx;
          const isPending = currentIdx < idx;

          let borderColor = 'var(--border)';
          let bgColor = 'var(--surface-card)';
          let textColor = 'var(--text-muted)';
          let dotColor = 'var(--border)';

          if (isCurrent) {
            borderColor = 'var(--primary)';
            bgColor = 'rgba(249, 115, 22, 0.08)';
            textColor = 'var(--primary)';
            dotColor = 'var(--primary)';
          } else if (isDone) {
            borderColor = 'var(--success)';
            bgColor = 'rgba(34, 197, 94, 0.04)';
            textColor = 'var(--success)';
            dotColor = 'var(--success)';
          }

          return (
            <div
              key={step.key}
              style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 'var(--radius-md)',
                padding: '8px 10px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: dotColor,
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isCurrent ? 700 : 600,
                    color: textColor,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {step.label}
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: isCurrent ? 'var(--text-main)' : 'var(--text-subtle)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {step.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
