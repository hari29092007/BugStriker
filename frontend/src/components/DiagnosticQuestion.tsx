import React from 'react';
import type { DiagnosticQuestion as DQType } from '../types';

interface DiagnosticQuestionProps {
  question: DQType | null;
}

export const DiagnosticQuestion: React.FC<DiagnosticQuestionProps> = ({ question }) => {
  if (!question) return null;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--agent-purple)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, var(--agent-purple), var(--primary))',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div
          style={{
            background: 'var(--agent-purple-bg)',
            color: 'var(--agent-purple)',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}
        >
          🤖
        </div>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Agent Diagnostic Probe
          </h4>
          <span style={{ fontSize: '0.72rem', color: 'var(--agent-purple)', fontWeight: 600 }}>
            Targeted failure inquiry (1 question limit)
          </span>
        </div>
      </div>

      <div
        style={{
          background: 'var(--agent-purple-bg)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          color: '#E2E8F0',
          fontSize: '0.92rem',
          lineHeight: '1.6',
          fontStyle: 'italic',
        }}
      >
        "{question.question_text}"
      </div>

      {question.failure_summary && (
        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-subtle)' }}>Analysis Context: </span>
          {question.failure_summary}
        </div>
      )}
    </div>
  );
};
