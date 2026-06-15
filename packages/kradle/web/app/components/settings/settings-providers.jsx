'use client';

import { useState, useEffect } from 'react';
import {
  PROVIDER_TYPES,
  AUTH_TYPES,
  PROVIDER_FIELDS,
  labelStyle,
  inputStyle,
  selectStyle,
  fieldGroupStyle,
  rowStyle,
  primaryStyle,
  secondaryStyle,
  disabledStyle,
  StatusMsg,
  SecretRefField,
  ProviderRow,
} from './settings-provider-helpers.jsx';

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
      apiVersion: 'kradle.a5c.ai/v1alpha1',
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
    <form onSubmit={handleSubmit} aria-label="Add provider form">
      <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem', marginTop: '0.75rem' }}>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700 }}>New provider</h4>
        <div style={fieldGroupStyle}>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="my-provider" required style={inputStyle} aria-label="Provider name" />
            </div>
            <div>
              <label style={labelStyle}>Provider</label>
              <select value={providerType} onChange={e => { setProviderType(e.target.value); setFieldValues({}); setSecretRefs({}); }} style={selectStyle} aria-label="Provider type">
                {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Auth type</label>
            <select value={authType} onChange={e => setAuthType(e.target.value)} style={selectStyle} aria-label="Authentication type">
              {AUTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Provider-specific fields */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
            <h5 style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>
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
                      {!field.required && <small style={{ fontWeight: 400, color: 'var(--text-muted)' }}> (optional)</small>}
                    </label>
                    <input
                      type={field.name.toLowerCase().includes('url') || field.name.toLowerCase().includes('endpoint') ? 'url' : 'text'}
                      value={fieldValues[field.name] || ''}
                      onChange={e => updateFieldValue(field.name, e.target.value)}
                      placeholder={field.default || ''}
                      required={field.required}
                      style={inputStyle}
                      aria-label={field.label}
                    />
                    {field.default && !fieldValues[field.name] && (
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Default: {field.default}</small>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button type="submit" disabled={!canSubmit} style={!canSubmit ? disabledStyle : primaryStyle} aria-label="Create provider">
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
          <button type="button" onClick={() => setShowForm(v => !v)} style={{ ...secondaryStyle, padding: '4px 14px', fontSize: 13 }} aria-label={showForm ? 'Cancel adding provider' : 'Add new provider'}>
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
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <p>No providers configured. Click <strong>+ Add provider</strong> to define LLM access credentials and default models.</p>
        </div>
      ) : null}
      {showForm && <AddProviderForm org={org} onCreated={handleCreated} secrets={secrets} />}
    </div>
  );
}
