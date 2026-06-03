'use client';
// ─── Shared helpers, styles, and constants for inference components ──────────

export function relativeTime(timestamp) {
  if (!timestamp) return '';
  try {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    if (diffMs < 0) return 'just now';
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch { return String(timestamp); }
}

export const FORMAT_COLORS = {
  sklearn: '#2563eb',
  pytorch: '#ea580c',
  tensorflow: '#16a34a',
  onnx: '#7c3aed',
  huggingface: '#d97706',
  triton: '#6b7280',
  custom: '#6b7280',
};

export const DEFAULT_PAYLOADS = {
  sklearn: JSON.stringify({ inputs: [{ name: 'input-0', shape: [1, 4], datatype: 'FP32', data: [[1.0, 2.0, 3.0, 4.0]] }] }, null, 2),
  pytorch: JSON.stringify({ inputs: [{ name: 'input-0', shape: [1, 3, 224, 224], datatype: 'FP32', data: [] }] }, null, 2),
  huggingface: JSON.stringify({ inputs: [{ name: 'input_ids', shape: [1, 10], datatype: 'INT64', data: [101, 2054, 2003, 1996, 3007, 1997, 2605, 102, 0, 0] }] }, null, 2),
};

export function getDefaultPayload(modelFormat) {
  return DEFAULT_PAYLOADS[modelFormat] || JSON.stringify({ inputs: [{ name: 'input-0', shape: [1], datatype: 'FP32', data: [1.0] }] }, null, 2);
}

export function getServiceStatus(service) {
  if (!service) return 'Unknown';
  if (service.status?.ready === true) return 'Ready';
  if (service.status?.ready === false) return 'Failed';
  const readyCondition = (service.status?.conditions || []).find(c => c.type === 'Ready');
  if (readyCondition?.status === 'True') return 'Ready';
  if (readyCondition?.status === 'False') return 'Failed';
  return 'Pending';
}

export function statusColor(status) {
  if (status === 'Ready') return '#16a34a';
  if (status === 'Failed') return '#dc2626';
  return '#d97706';
}

// ─── Styles ──────────────────────────────────────────────────────────────────

export const cardStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: '0.5rem',
  padding: '1rem',
  background: 'var(--surface)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

export const btnStyle = (color = '#2563eb') => ({
  padding: '0.375rem 0.75rem',
  borderRadius: '0.375rem',
  border: 'none',
  background: color,
  color: '#fff',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontWeight: 500,
});

export const btnOutlineStyle = {
  padding: '0.375rem 0.75rem',
  borderRadius: '0.375rem',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontWeight: 500,
};

export const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: '0.375rem',
  border: '1px solid var(--border)',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};

export const labelStyle = {
  display: 'block',
  fontWeight: 600,
  fontSize: '0.8125rem',
  marginBottom: '0.25rem',
  color: 'var(--text)',
};

export const badgeStyle = (color = '#2563eb') => ({
  display: 'inline-block',
  fontSize: '0.6875rem',
  padding: '2px 8px',
  borderRadius: '9999px',
  background: color + '20',
  color: color,
  fontWeight: 600,
  border: `1px solid ${color}40`,
});

export const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
  overflowY: 'auto',
};

export const panelStyle = {
  width: '520px',
  maxWidth: '95vw',
  minHeight: '100vh',
  background: 'var(--surface)',
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  overflowY: 'auto',
};

// ─── Shared sub-components ──────────────────────────────────────────────────

import { useState, memo } from 'react';

export const FrameworkBadge = memo(function FrameworkBadge({ format }) {
  const color = FORMAT_COLORS[format] || '#6b7280';
  return <span style={badgeStyle(color)}>{format || 'custom'}</span>;
});

export const StatusBadge = memo(function StatusBadge({ status }) {
  const color = statusColor(status);
  return (
    <span style={{ ...badgeStyle(color), fontSize: '0.6875rem' }}>
      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, marginRight: 4, verticalAlign: 'middle' }} />
      {status}
    </span>
  );
});

export function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const displayLabel = label || 'Copy';
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }).catch(() => {});
    }
  };
  return (
    <button onClick={handleCopy} aria-label={`Copy ${text.length > 40 ? text.substring(0, 40) + '...' : text} to clipboard`} style={{ ...btnOutlineStyle, padding: '2px 8px', fontSize: '0.75rem' }}>
      {copied ? 'Copied!' : displayLabel}
    </button>
  );
}

// ─── Color constants ────────────────────────────────────────────────────────

export const ROUTE_TYPE_COLORS = { internal: '#2563eb', external: '#7c3aed' };
export const PROVIDER_COLORS = { kserve: '#2563eb', anthropic: '#d97706', openai: '#16a34a', 'azure-openai': '#0284c7', 'google-vertex': '#dc2626', custom: '#6b7280' };

export const CATEGORY_COLORS = {
  LLM: '#2563eb',
  Code: '#7c3aed',
  Embedding: '#0891b2',
  Vision: '#d946ef',
  Speech: '#ea580c',
  'Classical ML': '#16a34a',
};

export const FALLBACK_PROVIDERS = ['anthropic', 'openai', 'azure-openai', 'google-vertex', 'custom'];
