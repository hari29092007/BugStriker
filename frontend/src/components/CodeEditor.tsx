import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  disabled?: boolean;
  height?: string | number;
  language?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  height = '420px',
  language = 'python',
}) => {
  const isReadOnly = readOnly || disabled;
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: '#0B0E14',
      }}
    >
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange && onChange(val || '')}
        theme="vs-dark"
        options={{
          readOnly: isReadOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'IBM Plex Mono', monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          lineHeight: 22,
          tabSize: 4,
          cursorBlinking: 'smooth',
          renderLineHighlight: 'all',
        }}
      />
    </div>
  );
};
