'use client';

import { useState, useEffect } from 'react';

const PROVIDER_TYPES = ['anthropic', 'openai', 'azure-openai', 'google-vertex', 'foundry', 'custom'];
const AUTH_TYPES = ['token', 'oauth', 'none'];

// Provider-specific field definitions
const PROVIDER_FIELDS = {
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

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box' };
const selectStyle = { ...inputStyle, background: '#fff' };
const fieldGroupStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };
const buttonStyle = { padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const primaryStyle = { ...buttonStyle, backgroundColor: '#2563eb', color: '#fff' };
const secondaryStyle = { ...buttonStyle, backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
const disabledStyle = { ...primaryStyle, opacity: 0.5, cursor: 'not-allowed' };

function StatusMsg({ status, message }) {
  if (!message) return null;
  const color = status === 'success' ? '#16a34a' : '#dc2626';
  return <span style={{ fontSize: 13, color, fontWeight: 600 }}>{message}</span>;
}

function SecretRefField({ label, value, onChange, secrets, required }) {
  const secretName = value?.secretName || '';
  const secretKey = value?.key || '';

  const selectedSecret = secrets.find((s) => s.name === secretName);
  const availableKeys = selectedSecret?.keys || [];

  return (
    <div>
      <label style={labelStyle}>{label} <small style={{ fontWeight: 400, color: '#6b7280' }}>(from Secret)</small></label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <select
          value={secretName}
          onChange={(e) => onChange({ secretName: e.target.value, key: '' })}
          style={{ ...selectStyle, flex: '1 1 60%' }}
          required={required}
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
            />
          )
        )}
      </div>
    </div>
  );
}

function ProviderRow({ org, provider, onDeleted }) {
  const name = provider.metadata?.name;
  const [delStatus, setDelStatus] = useState('idle');

  async function handleDelete() {
    if (!confirm(`Delete provider "${name}"?`)) return;
    setDelStatus('deleting');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/AgentProviderConfig/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDeleted(name);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to delete provider');
        setDelStatus('idle');
      }
    } catch (err) {
      alert(err.message || 'Network error');
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
      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{provider.spec?.provider || 'unknown'}</span>
      <span style={{ color: '#6b7280', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem' }}>
        {provider.spec?.authType || 'token'}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: phaseTone(provider.status?.phase) }} />
        {provider.status?.phase || 'Pending'}
      </span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={delStatus === 'deleting'}
        style={{ ...secondaryStyle, padding: '4px 12px', fontSize: 12, color: '#dc2626', borderColor: '#fca5a5' }}
      >
        {delStatus === 'deleting' ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}

function AddProviderForm({ org, onCreated, secrets }) {
  const [name, setName] = useState('');
  const [providerType, setProviderType] = useState('anthropic');
  const [authType, setAuthType] = useState('token');
  const [fieldValues, setFieldValues] = useState({});
  const [secretRefs, setSecretRefs] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const fields = PROVIDER_FIELDS[providerType] || PROVIDER_FIELDS.custom;

  function updateFieldValue(fieldName, value) {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  }

  function updateSecretRef(fieldName, ref) {
    setSecretRefs((prev) => ({ ...prev, [fieldName]: ref }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus('saving');
    setMessage('');

    const spec = {
      organizationRef: org,
      provider: providerType,
      authType,
    };

    const credentialRefs = {};

    for (const field of fields) {
      if (field.fromSecret && secretRefs[field.name]?.secretName) {
        credentialRefs[field.name] = {
          secretName: secretRefs[field.name].secretName,
          key: secretRefs[field.name].key || field.name,
        };
      } else {
        const val = fieldValues[field.name];
        if (val && val.trim()) {
          spec[field.name] = val.trim();
        } else if (field.default) {
          spec[field.name] = field.default;
        }
      }
    }

    const primarySensitiveField = fields.find((f) => f.fromSecret);
    if (primarySensitiveField && credentialRefs[primarySensitiveField.name]) {
      spec.credentialRef = credentialRefs[primarySensitiveField.name];
    }

    if (Object.keys(credentialRefs).length > 0) {
      spec.credentialRefs = credentialRefs;
    }

    const resource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'AgentProviderConfig',
      metadata: { name: name.trim() },
      spec,
    };

    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resource),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setStatus('error');
        setMessage(data.message || data.reason || 'Failed to create provider');
      } else {
        setStatus('success');
        setMessage(`Provider "${name.trim()}" created.`);
        setTimeout(() => { setStatus('idle'); setMessage(''); }, 3000);
        onCreated(data);
        setName('');
        setProviderType('anthropic');
        setAuthType('token');
        setFieldValues({});
        setSecretRefs({});
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Network error');
    }
  }

  const canSubmit = name.trim() && status !== 'saving';

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', marginTop: '0.75rem' }}>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700 }}>New provider</h4>
        <div style={fieldGroupStyle}>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="my-provider" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Provider</label>
              <select value={providerType} onChange={e => { setProviderType(e.target.value); setFieldValues({}); setSecretRefs({}); }} style={selectStyle}>
                {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Auth type</label>
            <select value={authType} onChange={e => setAuthType(e.target.value)} style={selectStyle}>
              {AUTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Provider-specific fields */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
            <h5 style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>
              {providerType} configuration
            </h5>
            <div style={fieldGroupStyle}>
              {fields.map((field) => {
                if (field.fromSecret) {
                  return (
                    <SecretRefField
                      key={field.name}
                      label={field.label}
                      value={secretRefs[field.name] || {}}
                      onChange={(ref) => updateSecretRef(field.name, ref)}
                      secrets={secrets}
                      required={field.required}
                    />
                  );
                }

                return (
                  <div key={field.name}>
                    <label style={labelStyle}>
                      {field.label}
                      {!field.required && <small style={{ fontWeight: 400, color: '#6b7280' }}> (optional)</small>}
                    </label>
                    <input
                      type={field.name.toLowerCase().includes('url') || field.name.toLowerCase().includes('endpoint') ? 'url' : 'text'}
                      value={fieldValues[field.name] || ''}
                      onChange={e => updateFieldValue(field.name, e.target.value)}
                      placeholder={field.default || ''}
                      required={field.required}
                      style={inputStyle}
                    />
                    {field.default && !fieldValues[field.name] && (
                      <small style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Default: {field.default}</small>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button type="submit" disabled={!canSubmit} style={!canSubmit ? disabledStyle : primaryStyle}>
              {status === 'saving' ? 'Saving...' : 'Create provider'}
            </button>
            <StatusMsg status={status} message={message} />
          </div>
        </div>
      </div>
    </form>
  );
}

export function ProvidersSection({ org, initialProviders, secrets: initialSecrets }) {
  const [providers, setProviders] = useState(initialProviders);
  const [showForm, setShowForm] = useState(false);
  const [secrets, setSecrets] = useState(initialSecrets || []);

  useEffect(() => {
    if (initialSecrets && initialSecrets.length > 0) return;
    let cancelled = false;
    async function fetchSecrets() {
      try {
        const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/secrets?type=k8s-secrets`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            const items = (data.items || []).map((s) => ({
              name: s.metadata?.name,
              keys: Object.keys(s.data || {}),
              type: s.type || 'Opaque',
            }));
            setSecrets(items);
          }
        }
      } catch {
        // Non-critical — secrets dropdown will be empty
      }
    }
    fetchSecrets();
    return () => { cancelled = true; };
  }, [org, initialSecrets]);

  function handleDeleted(name) {
    setProviders(prev => prev.filter(p => p.metadata?.name !== name));
  }

  function handleCreated(newProvider) {
    setProviders(prev => [...prev, newProvider]);
    setShowForm(false);
  }

  return (
    <div className="card">
      <div className="cardTitle">
        <h2>Providers</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`pill ${providers.length ? 'good' : 'neutral'}`}>{providers.length} providers</span>
          <button type="button" onClick={() => setShowForm(v => !v)} style={{ ...secondaryStyle, padding: '4px 14px', fontSize: 13 }}>
            {showForm ? 'Cancel' : '+ Add provider'}
          </button>
        </div>
      </div>
      {providers.length > 0 ? (
        <div className="resourceTable">
          {providers.map(provider => (
            <ProviderRow key={provider.metadata?.name} org={org} provider={provider} onDeleted={handleDeleted} />
          ))}
        </div>
      ) : !showForm ? (
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          <p>No providers configured. Click <strong>+ Add provider</strong> to define LLM access credentials and default models.</p>
        </div>
      ) : null}
      {showForm && <AddProviderForm org={org} onCreated={handleCreated} secrets={secrets} />}
    </div>
  );
}
