'use client';

import { useState } from 'react';

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box' };
const fieldGroupStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const buttonStyle = { padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const primaryStyle = { ...buttonStyle, backgroundColor: '#2563eb', color: '#fff' };
const secondaryStyle = { ...buttonStyle, backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
const disabledStyle = { ...primaryStyle, opacity: 0.5, cursor: 'not-allowed' };

function StatusMsg({ status, message }) {
  if (!message) return null;
  const color = status === 'success' ? '#16a34a' : '#dc2626';
  return <span style={{ fontSize: 13, color, fontWeight: 600 }}>{message}</span>;
}

export function GatewaySection({ org, gateway }) {
  const existing = gateway;
  const existingName = existing?.metadata?.name || 'default';
  const [url, setUrl] = useState(existing?.spec?.gatewayUrl || existing?.spec?.url || '');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setStatus('saving');
    setMessage('');

    const resource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'AgentGatewayConfig',
      metadata: { name: existingName },
      spec: { organizationRef: org, gatewayUrl: url.trim() },
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
        setMessage(data.message || data.reason || 'Failed to save gateway config');
      } else {
        setStatus('success');
        setMessage('Gateway configuration saved.');
        setTimeout(() => { setStatus('idle'); setMessage(''); }, 3000);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Network error');
    }
  }

  async function handleTestConnection() {
    if (!url.trim()) return;
    setStatus('testing');
    setMessage('Testing connection...');
    try {
      const res = await fetch(url.trim().replace(/\/$/, '') + '/healthz', { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        setStatus('success');
        setMessage('Connection successful — gateway is reachable.');
      } else {
        setStatus('error');
        setMessage(`Gateway returned HTTP ${res.status}.`);
      }
    } catch {
      setStatus('error');
      setMessage('Could not reach gateway URL. Check the URL and network access.');
    }
  }

  const canSave = url.trim() && status !== 'saving';
  const gatewayStatusTone = existing
    ? (existing.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True' ? 'good' : 'neutral')
    : 'neutral';
  const gatewayStatusLabel = existing
    ? (existing.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True' ? 'Ready' : 'Not Ready')
    : 'Not configured';
  const statusDotColor = gatewayStatusTone === 'good' ? '#22c55e' : '#9ca3af';

  return (
    <form onSubmit={handleSave}>
      <div className="card" style={{ borderLeft: `3px solid ${statusDotColor}` }}>
        <div className="cardTitle">
          <h2>Gateway connection</h2>
          <span className={`pill ${gatewayStatusTone === 'good' ? 'good' : 'neutral'}`}>{gatewayStatusLabel}</span>
        </div>
        <div style={fieldGroupStyle}>
          <div>
            <label style={labelStyle}>Gateway URL <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span></label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://agent-mux.example.com"
              required
              aria-required="true"
              style={inputStyle}
            />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              The base URL of your Agent Mux gateway. Must be reachable from the Krate server.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.25rem' }}>
            <button type="submit" disabled={!canSave} style={!canSave ? disabledStyle : primaryStyle}>
              {status === 'saving' ? 'Saving...' : 'Save gateway config'}
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={!url.trim() || status === 'testing'}
              style={!url.trim() ? { ...secondaryStyle, opacity: 0.5, cursor: 'not-allowed' } : secondaryStyle}
            >
              {status === 'testing' ? 'Testing...' : 'Test connection'}
            </button>
            <StatusMsg status={status} message={message} />
          </div>
        </div>
      </div>
    </form>
  );
}
