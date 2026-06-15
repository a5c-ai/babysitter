'use client';

import { useState } from 'react';

export const PROVIDER_TYPES = ['anthropic', 'openai', 'azure-openai', 'google-vertex', 'foundry', 'custom'];
export const AUTH_TYPES = ['token', 'oauth', 'none'];

// Provider-specific field definitions
export const PROVIDER_FIELDS = {
  anthropic: [
    { name: 'apiKey', label: 'API Key', sensitive: true, fromSecret: true },
    { name: 'baseUrl', label: 'Base URL', default: 'https://api.anthropic.com' },
    { name: 'defaultModel', label: 'Default Model', default: 'claude-sonnet-4-20250514' },
  ],
  openai: [
    { name: 'apiKey', label: 'API Key', sensitive: true, fromSecret: true },
    { name: 'baseUrl', label: 'Base URL', default: 'https://api.openai.com' },
    { name: 'defaultModel', label: 'Default Model', default: 'gpt-4o' },
    { name: 'organization', label: 'Organization ID' },
  ],
  'azure-openai': [
    { name: 'apiKey', label: 'API Key', sensitive: true, fromSecret: true },
    { name: 'endpoint', label: 'Azure Endpoint', required: true },
    { name: 'deploymentId', label: 'Deployment ID', required: true },
    { name: 'apiVersion', label: 'API Version', default: '2024-02-01' },
  ],
  'google-vertex': [
    { name: 'serviceAccountKey', label: 'Service Account Key', sensitive: true, fromSecret: true },
    { name: 'project', label: 'GCP Project', required: true },
    { name: 'location', label: 'Location', default: 'us-central1' },
    { name: 'defaultModel', label: 'Default Model', default: 'gemini-2.0-flash' },
  ],
  foundry: [
    { name: 'apiKey', label: 'API Key', sensitive: true, fromSecret: true },
    { name: 'baseUrl', label: 'Foundry Endpoint', required: true },
    { name: 'defaultModel', label: 'Default Model' },
  ],
  custom: [
    { name: 'apiKey', label: 'API Key', sensitive: true, fromSecret: true },
    { name: 'baseUrl', label: 'Base URL', required: true },
    { name: 'defaultModel', label: 'Default Model' },
  ],
};

export const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' };
export const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)', fontSize: '0.875rem', boxSizing: 'border-box' };
export const selectStyle = { ...inputStyle, background: 'var(--surface)' };
export const fieldGroupStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };
export const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };
export const buttonStyle = { padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 };
export const primaryStyle = { ...buttonStyle, backgroundColor: '#2563eb', color: '#fff' };
export const secondaryStyle = { ...buttonStyle, backgroundColor: '#f3f4f6', color: 'var(--text)', border: '1px solid var(--border)' };
export const disabledStyle = { ...primaryStyle, opacity: 0.5, cursor: 'not-allowed' };

export function StatusMsg({ status, message }) {
  if (!message) return null;
  const color = status === 'success' ? '#16a34a' : '#dc2626';
  return <span style={{ fontSize: 13, color, fontWeight: 600 }}>{message}</span>;
}

export function SecretRefField({ label, value, onChange, secrets, required }) {
  const secretName = value?.secretName || '';
  const secretKey = value?.key || '';

  const selectedSecret = secrets.find((s) => s.name === secretName);
  const availableKeys = selectedSecret?.keys || [];

  return (
    <div>
      <label style={labelStyle}>{label} <small style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(from Secret)</small></label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <select
          value={secretName}
          onChange={(e) => onChange({ secretName: e.target.value, key: '' })}
          style={{ ...selectStyle, flex: '1 1 60%' }}
          required={required}
          aria-label={`Select secret for ${label}`}
        >
          <option value="">-- Select secret --</option>
          {secrets.map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
        {secretName && (
          availableKeys.length > 0 ? (
            <select
              value={secretKey}
              onChange={(e) => onChange({ secretName, key: e.target.value })}
              style={{ ...selectStyle, flex: '1 1 40%' }}
              aria-label={`Select key for ${label}`}
            >
              <option value="">-- Key --</option>
              {availableKeys.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={secretKey}
              onChange={(e) => onChange({ secretName, key: e.target.value })}
              placeholder="key name"
              style={{ ...inputStyle, flex: '1 1 40%' }}
              aria-label={`Key name for ${label}`}
            />
          )
        )}
      </div>
    </div>
  );
}

export function ProviderRow({ org, provider, onDeleted }) {
  const name = provider.metadata?.name;
  const [delStatus, setDelStatus] = useState('idle');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [delError, setDelError] = useState('');

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setConfirmDelete(false);
    setDelStatus('deleting');
    setDelError('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/AgentProviderConfig/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDeleted(name);
      } else {
        const data = await res.json().catch(() => ({}));
        setDelError(data.message || 'Failed to delete provider');
        setDelStatus('idle');
      }
    } catch (err) {
      setDelError(err.message || 'Network error');
      setDelStatus('idle');
    }
  }

  const phaseTone = (phase) => {
    if (!phase || phase === 'Pending') return '#9ca3af';
    if (phase === 'Active' || phase === 'Ready' || phase === 'Configured') return '#22c55e';
    if (phase === 'Failed') return '#ef4444';
    return '#9ca3af';
  };

  return (
    <div className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <strong style={{ flex: '1 1 auto' }}>{name}</strong>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{provider.spec?.provider || 'unknown'}</span>
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem' }}>
        {provider.spec?.authType || 'token'}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: phaseTone(provider.status?.phase) }} />
        {provider.status?.phase || 'Pending'}
      </span>
      {confirmDelete ? (
        <>
          <button
            type="button"
            onClick={handleDelete}
            style={{ ...secondaryStyle, padding: '4px 12px', fontSize: 12, color: '#fff', backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
            aria-label={`Confirm delete provider ${name}`}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            style={{ ...secondaryStyle, padding: '4px 12px', fontSize: 12 }}
            aria-label="Cancel delete"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleDelete}
          disabled={delStatus === 'deleting'}
          style={{ ...secondaryStyle, padding: '4px 12px', fontSize: 12, color: 'var(--danger)', borderColor: '#fca5a5' }}
          aria-label={`Delete provider ${name}`}
        >
          {delStatus === 'deleting' ? 'Deleting...' : 'Delete'}
        </button>
      )}
      {delError && <span role="alert" style={{ fontSize: 12, color: 'var(--danger)' }}>{delError}</span>}
    </div>
  );
}
