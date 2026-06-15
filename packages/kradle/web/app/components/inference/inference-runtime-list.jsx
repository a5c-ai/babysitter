'use client';

import { useState, memo } from 'react';
import {
  cardStyle, btnStyle, btnOutlineStyle, inputStyle, labelStyle,
  FrameworkBadge,
} from './inference-helpers.jsx';

// ─── Runtime Card ───────────────────────────────────────────────────────────

export const RuntimeCard = memo(function RuntimeCard({ runtime }) {
  const name = runtime.metadata?.name || runtime.name || 'unknown';
  const image = runtime.spec?.containers?.[0]?.image || '';
  const formats = runtime.spec?.supportedModelFormats || [];

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{name}</div>
      {image && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{image}</div>}
      {formats.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {formats.map((f, i) => (
            <FrameworkBadge key={i} format={f.name || String(f)} />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Create Runtime Form ────────────────────────────────────────────────────

export function CreateRuntimeForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ name: '', image: '', formats: '', cpuLimit: '', memLimit: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const supportedModelFormats = form.formats
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(name => ({ name }));
    onSubmit({
      name: form.name,
      image: form.image,
      supportedModelFormats,
      ...(form.cpuLimit || form.memLimit ? {
        resources: { limits: { ...(form.cpuLimit ? { cpu: form.cpuLimit } : {}), ...(form.memLimit ? { memory: form.memLimit } : {}) } }
      } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <label style={labelStyle}>Name *</label>
        <input style={inputStyle} value={form.name} onChange={set('name')} required placeholder="my-serving-runtime" />
      </div>
      <div>
        <label style={labelStyle}>Container Image</label>
        <input style={inputStyle} value={form.image} onChange={set('image')} placeholder="kserve/sklearnserver:latest" />
      </div>
      <div>
        <label style={labelStyle}>Supported Formats (comma-separated)</label>
        <input style={inputStyle} value={form.formats} onChange={set('formats')} placeholder="sklearn, onnx" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <label style={labelStyle}>CPU Limit</label>
          <input style={inputStyle} value={form.cpuLimit} onChange={set('cpuLimit')} placeholder="2" />
        </div>
        <div>
          <label style={labelStyle}>Memory Limit</label>
          <input style={inputStyle} value={form.memLimit} onChange={set('memLimit')} placeholder="4Gi" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" style={btnStyle()} disabled={loading} aria-label={form.name ? `Add runtime ${form.name}` : 'Add new inference runtime'}>{loading ? 'Adding...' : 'Add Runtime'}</button>
        <button type="button" style={btnOutlineStyle} onClick={onCancel} aria-label="Cancel adding runtime">Cancel</button>
      </div>
    </form>
  );
}
