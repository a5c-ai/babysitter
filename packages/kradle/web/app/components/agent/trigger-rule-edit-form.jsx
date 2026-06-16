'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUnsavedChanges } from '../../hooks/use-unsaved-changes.js';

const EVENT_TYPES = ['push', 'pull_request', 'schedule', 'manual', 'webhook'];

export function TriggerRuleEditForm({ org, rule }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const sources = rule?.spec?.sources || [];
  const initialFields = useMemo(() => ({
    eventType: sources.length === 1 ? sources[0] : sources.length > 1 ? sources[0] : '',
    targetStack: rule?.spec?.agentStack || rule?.spec?.stackRef || rule?.spec?.targetStack || '',
    branch: rule?.spec?.repository || '',
    enabled: rule?.spec?.enabled !== false && rule?.status?.phase !== 'Disabled',
    conditions: rule?.spec?.condition ? (typeof rule.spec.condition === 'string' ? rule.spec.condition : JSON.stringify(rule.spec.condition, null, 2)) : '',
  }), [rule, sources]);

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
    if (fields.eventType) spec.sources = [fields.eventType];
    if (fields.targetStack) spec.agentStack = fields.targetStack;
    if (fields.branch.trim()) spec.repository = fields.branch.trim();
    spec.enabled = fields.enabled;
    if (fields.conditions.trim()) spec.condition = fields.conditions.trim();
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/AgentTriggerRule/${encodeURIComponent(rule.metadata.name)}`, {
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
        <button type="button" onClick={() => setEditing(true)} aria-label={`Edit trigger rule ${rule?.metadata?.name || 'unknown'}`} style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text, inherit)' }}>
          Edit rule
        </button>
        {message && <small style={{ marginLeft: '0.5rem', color: message === 'Saved' ? 'var(--success)' : 'var(--danger)', fontSize: '0.75rem' }}>{message}</small>}
      </div>
    );
  }

  const inputStyle = { width: '100%', padding: '0.375rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8125rem', background: 'var(--surface)', color: 'var(--text, inherit)', boxSizing: 'border-box' };
  const selectStyle = { ...inputStyle, background: 'var(--surface)' };
  const labelStyle = { fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.125rem', color: 'var(--text-muted)' };

  return (
    <form onSubmit={handleSave} style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface-overlay, rgba(0,0,0,0.02))' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <label>
          <span style={labelStyle}>Event type</span>
          <select style={selectStyle} value={fields.eventType} onChange={(e) => handleChange('eventType', e.target.value)} aria-label="Event type">
            <option value="">All events</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          <span style={labelStyle}>Target stack</span>
          <input style={inputStyle} value={fields.targetStack} onChange={(e) => handleChange('targetStack', e.target.value)} placeholder="my-diagnostic-stack" aria-label="Target stack" />
        </label>
        <label>
          <span style={labelStyle}>Branch filter</span>
          <input style={inputStyle} value={fields.branch} onChange={(e) => handleChange('branch', e.target.value)} placeholder="owner/repo or owner/*" aria-label="Branch filter" />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.25rem' }}>
          <input type="checkbox" checked={fields.enabled} onChange={(e) => handleChange('enabled', e.target.checked)} aria-label="Enabled" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Enabled</span>
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          <span style={labelStyle}>Conditions (JSON)</span>
          <textarea style={{ ...inputStyle, minHeight: '4rem', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.75rem' }} value={fields.conditions} onChange={(e) => handleChange('conditions', e.target.value)} placeholder='e.g. {"branch": "main", "actor": "bot"}' aria-label="Conditions JSON" />
        </label>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button type="submit" disabled={saving} aria-label={`Save changes to rule ${rule?.metadata?.name || 'unknown'}`} style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', borderRadius: '4px', border: 'none', background: 'var(--accent)', color: 'var(--surface)', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        <button type="button" onClick={() => { setEditing(false); setFields(initialFields); }} aria-label="Cancel editing rule" style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text, inherit)' }}>
          Cancel
        </button>
        {message && <small style={{ color: message === 'Saved' ? 'var(--success)' : 'var(--danger)', fontSize: '0.75rem' }}>{message}</small>}
      </div>
    </form>
  );
}
