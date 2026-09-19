import React, { useState } from 'react';
import type { ExecutionEvidence, TestCaseResult } from '../types';

interface TestPanelProps {
  evidence: ExecutionEvidence | null;
  loading?: boolean;
}

export const TestPanel: React.FC<TestPanelProps> = ({ evidence, loading = false }) => {
  const [selectedTest, setSelectedTest] = useState<TestCaseResult | null>(null);

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ marginBottom: '12px', fontSize: '1.2rem' }}>⚡ Running tests...</div>
        <p style={{ fontSize: '0.85rem' }}>Executing code in isolated execution sandbox.</p>
      </div>
    );
  }

  if (!evidence) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-subtle)',
          fontSize: '0.9rem',
        }}
      >
        No test results yet. Submit your code to see runtime evidence.
      </div>
    );
  }

  const { pass_count, fail_count, total_count, execution_time_ms, test_results } = evidence;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header Summary */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--surface-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Runtime Evidence</h3>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: fail_count === 0 ? 'var(--success-bg)' : 'var(--error-bg)',
              color: fail_count === 0 ? 'var(--success)' : 'var(--error)',
              border: `1px solid ${fail_count === 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            {pass_count}/{total_count} Passed
          </span>
        </div>

        {execution_time_ms !== undefined && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
            {execution_time_ms} ms
          </span>
        )}
      </div>

      {/* Test Case List */}
      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {test_results.map((test, idx) => {
          const isSelected = selectedTest?.test_id === test.test_id;
          return (
            <div
              key={test.test_id || idx}
              onClick={() => setSelectedTest(isSelected ? null : test)}
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: isSelected ? 'var(--surface-hover)' : 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: test.passed ? 'var(--success)' : 'var(--error)',
                  }}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Case {idx + 1}: {test.description || 'Test scenario'}
                  </div>
                  {test.error && (
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--error)',
                        fontFamily: 'var(--font-mono)',
                        marginTop: '2px',
                      }}
                    >
                      {test.error.slice(0, 70)}...
                    </div>
                  )}
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: test.passed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: test.passed ? 'var(--success)' : 'var(--error)',
                }}
              >
                {test.passed ? 'PASS' : 'FAIL'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detailed Inspection Drawer */}
      {selectedTest && (
        <div
          style={{
            padding: '16px 20px',
            background: '#0B0E14',
            borderTop: '1px solid var(--border)',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>
            Inspection: {selectedTest.description}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>INPUT</div>
              <pre
                style={{
                  background: 'var(--surface)',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  color: 'var(--text-main)',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(selectedTest.input_data, null, 2)}
              </pre>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>EXPECTED</div>
              <pre
                style={{
                  background: 'var(--surface)',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  color: 'var(--success)',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(selectedTest.expected_output, null, 2)}
              </pre>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>ACTUAL OUTPUT</div>
            <pre
              style={{
                background: 'var(--surface)',
                padding: '6px 10px',
                borderRadius: '4px',
                color: selectedTest.passed ? 'var(--success)' : 'var(--error)',
                overflowX: 'auto',
              }}
            >
              {selectedTest.actual_output !== undefined
                ? JSON.stringify(selectedTest.actual_output, null, 2)
                : selectedTest.error || 'None'}
            </pre>
          </div>

          {selectedTest.stderr && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--error)' }}>STDERR / TRACEBACK</div>
              <pre
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  color: 'var(--error)',
                  overflowX: 'auto',
                  fontSize: '0.72rem',
                }}
              >
                {selectedTest.stderr}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
