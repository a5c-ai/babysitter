'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUnsavedChanges } from '../../hooks/use-unsaved-changes.js';

/**
 * Size preset → K8s resources for the dispatched agent Job (parity with the
 * Commander stack builder). Agents are I/O-bound, so requests are small
 * scheduling floors that burst to the limit; '' emits no resources so the
 * deployment's env-configured floor (KRADLE_AGENT_CPU_REQUEST) applies.
 */
const SIZE_PRESETS = {
  small: { requests: { cpu: '25m', memory: '512Mi' }, limits: { cpu: '1500m', memory: '2Gi' } },
  medium: { requests: { cpu: '250m', memory: '1Gi' }, limits: { cpu: '2', memory: '4Gi' } },
  large: { requests: { cpu: '1000m', memory: '2Gi' }, limits: { cpu: '4', memory: '8Gi' } },
};

function sizeFromResources(resources) {
  const cpu = resources?.requests?.cpu;
  if (cpu === undefined) return '';
  return Object.keys(SIZE_PRESETS).find((s) => SIZE_PRESETS[s].requests.cpu === cpu) || '';
}

export function StackEditForm({ org, stack }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const initialFields = useMemo(() => ({
    baseAgent: stack?.spec?.baseAgent || stack?.spec?.agent || '',
    adapter: stack?.spec?.adapter || '',
    displayName: stack?.spec?.displayName || '',
    description: stack?.spec?.description || '',
    providerRef: stack?.spec?.providerRef || '',
    model: stack?.spec?.model || '',
    maxTokens: stack?.spec?.maxTokens || '',
    budgetLimitUsd: stack?.spec?.budgetLimitUsd || '',
    memoryRepositoryRefs: (stack?.spec?.memoryRepositoryRefs || []).join(', '),
    size: sizeFromResources(stack?.spec?.resources),
  }), [stack]);

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
    if (fields.baseAgent) spec.baseAgent = fields.baseAgent;
    if (fields.adapter) spec.adapter = fields.adapter;
    if (fields.displayName) spec.displayName = fields.displayName;
    if (fields.description) spec.description = fields.description;
    if (fields.providerRef) spec.providerRef = fields.providerRef;
    if (fields.model) spec.model = fields.model;
    if (fields.maxTokens) spec.maxTokens = Number(fields.maxTokens) || undefined;
    if (fields.budgetLimitUsd) spec.budgetLimitUsd = Number(fields.budgetLimitUsd) || undefined;
    const memRefs = fields.memoryRepositoryRefs ? fields.memoryRepositoryRefs.split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (memRefs.length) spec.memoryRepositoryRefs = memRefs;
    // Size preset → spec.resources for the dispatched agent Job (createAgentJob
    // reads stack.spec.resources). '' leaves it to the deployment floor.
    if (fields.size && SIZE_PRESETS[fields.size]) spec.resources = SIZE_PRESETS[fields.size];
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/AgentStack/${encodeURIComponent(stack.metadata.name)}`, {
        method: 'POST',
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
        <button type="button" onClick={() => setEditing(true)} aria-label={`Edit configuration for stack ${stack?.metadata?.name || 'unknown'}`} style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text, inherit)' }}>
          Edit configuration
        </button>
        {message && <small style={{ marginLeft: '0.5rem', color: message === 'Saved' ? 'var(--success)' : 'var(--danger)', fontSize: '0.75rem' }}>{message}</small>}
      </div>
    );
  }

  const inputStyle = { width: '100%', padding: '0.375rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8125rem', background: 'var(--surface)', color: 'var(--text, inherit)' };
  const labelStyle = { fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.125rem', color: 'var(--text-muted)' };

  return (
    <form onSubmit={handleSave} style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface-overlay, rgba(0,0,0,0.02))' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <label><span style={labelStyle}>Display name</span><input style={inputStyle} value={fields.displayName} onChange={(e) => handleChange('displayName', e.target.value)} placeholder="My Stack" /></label>
        <label><span style={labelStyle}>Base agent</span><input style={inputStyle} value={fields.baseAgent} onChange={(e) => handleChange('baseAgent', e.target.value)} placeholder="claude-code" /></label>
        <label><span style={labelStyle}>Adapter</span><input style={inputStyle} value={fields.adapter} onChange={(e) => handleChange('adapter', e.target.value)} placeholder="default" /></label>
        <label><span style={labelStyle}>Provider</span><input style={inputStyle} value={fields.providerRef} onChange={(e) => handleChange('providerRef', e.target.value)} placeholder="anthropic" /></label>
        <label><span style={labelStyle}>Model</span><input style={inputStyle} value={fields.model} onChange={(e) => handleChange('model', e.target.value)} placeholder="claude-sonnet-4-20250514" /></label>
        <label><span style={labelStyle}>Max tokens</span><input style={inputStyle} type="number" value={fields.maxTokens} onChange={(e) => handleChange('maxTokens', e.target.value)} placeholder="4096" /></label>
        <label style={{ gridColumn: '1 / -1' }}><span style={labelStyle}>Description</span><input style={inputStyle} value={fields.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="What this stack does" /></label>
        <label><span style={labelStyle}>Budget limit (USD)</span><input style={inputStyle} type="number" step="0.01" value={fields.budgetLimitUsd} onChange={(e) => handleChange('budgetLimitUsd', e.target.value)} placeholder="10.00" /></label>
        <label><span style={labelStyle}>Size (agent Job resources)</span><select style={inputStyle} value={fields.size} onChange={(e) => handleChange('size', e.target.value)}><option value="">default (deployment floor)</option><option value="small">small — 25m / 512Mi</option><option value="medium">medium — 250m / 1Gi</option><option value="large">large — 1000m / 2Gi</option></select></label>
        <label style={{ gridColumn: '1 / -1' }}><span style={labelStyle}>Memory repository refs (comma-separated)</span><input style={inputStyle} value={fields.memoryRepositoryRefs} onChange={(e) => handleChange('memoryRepositoryRefs', e.target.value)} placeholder="org-memory, shared-knowledge" /></label>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button type="submit" disabled={saving} aria-label={`Save changes to stack ${stack?.metadata?.name || 'unknown'}`} style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', borderRadius: '4px', border: 'none', background: 'var(--accent)', color: 'var(--surface)', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        <button type="button" onClick={() => setEditing(false)} aria-label="Cancel editing stack configuration" style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text, inherit)' }}>
          Cancel
        </button>
        {message && <small style={{ color: message === 'Saved' ? 'var(--success)' : 'var(--danger)', fontSize: '0.75rem' }}>{message}</small>}
      </div>
    </form>
  );
}
