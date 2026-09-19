import React, { useState } from 'react';
import type { CodeSubmission, DiagnosticQuestion, StudentAnswer, Verdict } from '../types';

interface EvidenceChainProps {
  originalSubmission?: CodeSubmission | null;
  diagnosticQuestion?: DiagnosticQuestion | null;
  studentAnswer?: StudentAnswer | null;
  revisionSubmission?: CodeSubmission | null;
  verdict?: Verdict | null;
}

export const EvidenceChain: React.FC<EvidenceChainProps> = ({
  originalSubmission,
  diagnosticQuestion,
  studentAnswer,
  revisionSubmission,
  verdict,
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    orig: false,
    diag: true,
    ans: true,
    rev: false,
    verd: true,
  });

  const toggle = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
          🔍 Full Evidence Chain
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
          Pedagogical loop audit trail
        </span>
      </div>

      {/* 1. Original Submission */}
      {originalSubmission && (
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            onClick={() => toggle('orig')}
            style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.01)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem' }}>📄</span>
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>1. Original Submission</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: originalSubmission.all_passed ? 'var(--success-bg)' : 'var(--error-bg)',
                  color: originalSubmission.all_passed ? 'var(--success)' : 'var(--error)',
                }}
              >
                {originalSubmission.pass_count} Passed / {originalSubmission.fail_count} Failed
              </span>
            </div>
            <span>{openSections['orig'] ? '▲' : '▼'}</span>
          </div>

          {openSections['orig'] && (
            <div style={{ padding: '0 20px 16px', background: '#0B0E14' }}>
              <pre
                style={{
                  padding: '12px',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  overflowX: 'auto',
                }}
              >
                {originalSubmission.code}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 2. Diagnostic Question */}
      {diagnosticQuestion && (
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            onClick={() => toggle('diag')}
            style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              background: 'rgba(139, 92, 246, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem' }}>🤖</span>
              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--agent-purple)' }}>
                2. Agent Diagnostic Probe
              </span>
            </div>
            <span>{openSections['diag'] ? '▲' : '▼'}</span>
          </div>

          {openSections['diag'] && (
            <div style={{ padding: '0 20px 16px' }}>
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--agent-purple-bg)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                  fontStyle: 'italic',
                }}
              >
                "{diagnosticQuestion.question_text}"
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Student Answer */}
      {studentAnswer && (
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            onClick={() => toggle('ans')}
            style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem' }}>💡</span>
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>3. Student Bug Diagnosis</span>
            </div>
            <span>{openSections['ans'] ? '▲' : '▼'}</span>
          </div>

          {openSections['ans'] && (
            <div style={{ padding: '0 20px 16px' }}>
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--surface-card)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                }}
              >
                {studentAnswer.answer_text}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Revision Submission */}
      {revisionSubmission && (
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            onClick={() => toggle('rev')}
            style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem' }}>🛠️</span>
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>4. Revised Code Submission</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: revisionSubmission.all_passed ? 'var(--success-bg)' : 'var(--error-bg)',
                  color: revisionSubmission.all_passed ? 'var(--success)' : 'var(--error)',
                }}
              >
                {revisionSubmission.pass_count} Passed / {revisionSubmission.fail_count} Failed
              </span>
            </div>
            <span>{openSections['rev'] ? '▲' : '▼'}</span>
          </div>

          {openSections['rev'] && (
            <div style={{ padding: '0 20px 16px', background: '#0B0E14' }}>
              <pre
                style={{
                  padding: '12px',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  overflowX: 'auto',
                }}
              >
                {revisionSubmission.code}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 5. Verdict */}
      {verdict && (
        <div>
          <div
            onClick={() => toggle('verd')}
            style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem' }}>⚖️</span>
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>5. Final Evaluator Verdict</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background:
                    verdict.verdict === 'VERIFIED'
                      ? 'var(--success-bg)'
                      : verdict.verdict === 'PARTIAL'
                      ? 'var(--warning-bg)'
                      : 'var(--error-bg)',
                  color:
                    verdict.verdict === 'VERIFIED'
                      ? 'var(--success)'
                      : verdict.verdict === 'PARTIAL'
                      ? 'var(--warning)'
                      : 'var(--error)',
                }}
              >
                {verdict.verdict}
              </span>
            </div>
            <span>{openSections['verd'] ? '▲' : '▼'}</span>
          </div>

          {openSections['verd'] && (
            <div style={{ padding: '0 20px 16px' }}>
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--surface-card)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                }}
              >
                {verdict.rationale}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
