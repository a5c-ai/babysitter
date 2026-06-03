'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUnsavedChanges } from '../../hooks/use-unsaved-changes.js';

export function WorkspaceEditForm({ org, workspace }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const initialFields = useMemo(() => ({
    description: workspace?.spec?.description || '',
    repository: workspace?.spec?.repository || '',
    branch: workspace?.spec?.branch || '',
    capacity: workspace?.spec?.volumeSpec?.capacity || '10Gi',
  }), [workspace]);

  const [fields, setFields] = useState(initialFields);

  const isDirty = editing && Object.keys(fields).some((k) => fields[k] !== initialFields[k]);
  useUnsavedChanges(isDirty);

  function handleChange(field, value) {
    setFields((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const spec = {};
    if (fields.description) spec.description = fields.description;
    if (fields.repository) spec.repository = fields.repository;
    if (fields.branch) spec.branch = fields.branch;
    if (fields.capacity) spec.volumeSpec = { capacity: fields.capacity };
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/KrateWorkspace/${encodeURIComponent(workspace.metadata.name)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec }),
      });
      if (res.ok) {
        setMessage('Saved');
        setEditing(false);
        setTimeout(() => router.refresh(), 800);
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.message || 'Save failed');
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div style={{ marginTop: '0.75rem' }}>
        <button type="button" onClick={() => setEditing(true)} aria-label={`Edit workspace ${workspace?.metadata?.name || 'unknown'}`} style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border, #d1d5db)', background: 'transparent', cursor: 'pointer', color: 'var(--text, inherit)' }}>
          Edit workspace
        </button>
        {message && <small style={{ marginLeft: '0.5rem', color: message === 'Saved' ? 'var(--success, #22c55e)' : 'var(--danger, #dc2626)', fontSize: '0.75rem' }}>{message}</small>}
      </div>
    );
  }

  const inputStyle = { width: '100%', padding: '0.375rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border, #d1d5db)', fontSize: '0.8125rem', background: 'var(--surface, #fff)', color: 'var(--text, inherit)', boxSizing: 'border-box' };
  const labelStyle = { fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.125rem', color: 'var(--text-muted, #6b7280)' };

  return (
    <form onSubmit={handleSave} style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--border, #d1d5db)', borderRadius: '6px', background: 'var(--surface-overlay, rgba(0,0,0,0.02))' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <label>
          <span style={labelStyle}>Repository</span>
          <input style={inputStyle} value={fields.repository} onChange={(e) => handleChange('repository', e.target.value)} placeholder="https://github.com/org/repo" aria-label="Repository" />
        </label>
        <label>
          <span style={labelStyle}>Branch</span>
          <input style={inputStyle} value={fields.branch} onChange={(e) => handleChange('branch', e.target.value)} placeholder="main" aria-label="Branch" />
        </label>
        <label>
          <span style={labelStyle}>Volume capacity</span>
          <input style={inputStyle} value={fields.capacity} onChange={(e) => handleChange('capacity', e.target.value)} placeholder="10Gi" aria-label="Volume capacity" />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          <span style={labelStyle}>Description</span>
          <input style={inputStyle} value={fields.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="What this workspace is for" aria-label="Description" />
        </label>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button type="submit" disabled={saving} aria-label={`Save changes to workspace ${workspace?.metadata?.name || 'unknown'}`} style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', borderRadius: '4px', border: 'none', background: 'var(--accent, #2563eb)', color: '#fff', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        <button type="button" onClick={() => { setEditing(false); setFields(initialFields); }} aria-label="Cancel editing workspace" style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border, #d1d5db)', background: 'transparent', cursor: 'pointer', color: 'var(--text, inherit)' }}>
          Cancel
        </button>
        {message && <small style={{ color: message === 'Saved' ? 'var(--success, #22c55e)' : 'var(--danger, #dc2626)', fontSize: '0.75rem' }}>{message}</small>}
      </div>
    </form>
  );
}
