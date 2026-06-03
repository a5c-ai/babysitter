'use client';

import { useState, useCallback } from 'react';

// ── Install command templates ────────────────────────────────────────
export function installCommand(registryType, org, feed, name, version) {
  const base = 'https://krate.example.com/api/v1/registry';
  switch (registryType) {
    case 'npm':
      return `npm install @${org}/${name}@${version} --registry ${base}/npm/${feed}`;
    case 'pip':
      return `pip install ${name}==${version} --index-url ${base}/pip/${feed}/simple`;
    case 'docker':
      return `docker pull krate.example.com/${feed}/${name}:${version}`;
    case 'generic':
    default:
      return `curl -O ${base}/generic/${feed}/${name}/${version}`;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────
export function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

// ── Shared styles ────────────────────────────────────────────────────
export const cardStyle = {
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  padding: '1rem',
  background: 'var(--surface)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

export const btnPrimary = {
  padding: '0.5rem 1rem',
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
};

export const btnSecondary = {
  padding: '0.375rem 0.75rem',
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '0.375rem',
  fontSize: '0.8125rem',
  color: 'var(--text)',
  cursor: 'pointer',
};

export const btnDanger = {
  ...btnSecondary,
  color: 'var(--danger)',
  borderColor: '#fca5a5',
};

export const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--border)',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  background: 'var(--surface)',
  boxSizing: 'border-box',
};

export const labelStyle = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--text)',
  marginBottom: '0.25rem',
};

export const metaStyle = { fontSize: '0.8125rem', color: 'var(--text-muted)' };

export const pillStyle = (t) => ({
  display: 'inline-block',
  padding: '0.125rem 0.5rem',
  borderRadius: '9999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  background: t === 'good' ? '#dcfce7' : t === 'warn' ? '#fef9c3' : t === 'danger' ? '#fee2e2' : '#f3f4f6',
  color: t === 'good' ? '#166534' : t === 'warn' ? '#713f12' : t === 'danger' ? '#991b1b' : '#374151',
});

export const codeBlockStyle = {
  background: '#1e293b',
  color: '#e2e8f0',
  borderRadius: '0.375rem',
  padding: '0.75rem 1rem',
  fontSize: '0.8125rem',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  overflowX: 'auto',
  position: 'relative',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
};

export const REGISTRY_TYPES = ['npm', 'pip', 'docker', 'generic'];
export const STORAGE_BACKENDS = ['internal', 's3', 'azure-blob', 'external'];

export const REGISTRY_ICONS = {
  npm: 'NPM',
  pip: 'PIP',
  docker: 'DKR',
  generic: 'GEN',
};

// ── Copyable code block ──────────────────────────────────────────────
export function CopyableCode({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <div style={{ position: 'relative' }}>
      <pre style={codeBlockStyle}><code>{text}</code></pre>
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
        style={{
          position: 'absolute',
          top: '0.375rem',
          right: '0.375rem',
          background: copied ? '#22c55e' : '#334155',
          color: '#f8fafc',
          border: 'none',
          borderRadius: '0.25rem',
          padding: '0.25rem 0.5rem',
          fontSize: '0.6875rem',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

// ── Error banner ─────────────────────────────────────────────────────
export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.375rem', padding: '0.75rem', color: 'var(--danger)', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{message}</span>
      {onDismiss && <button onClick={onDismiss} aria-label="Dismiss error" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 700 }}>Dismiss</button>}
    </div>
  );
}
