'use client';

import { useState } from 'react';

const ADAPTER_TYPES = ['subprocess', 'remote', 'programmatic'];
const TRANSPORT_TYPES = ['stdio', 'websocket', 'http', 'unix'];
const ADAPTER_CAPABILITIES = ['chat', 'tools', 'streaming', 'files', 'code-execution'];

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

function AdapterRow({ org, adapter, onDeleted }) {
  const name = adapter.metadata?.name;
  const [delStatus, setDelStatus] = useState('idle');

  async function handleDelete() {
    if (!confirm(`Delete adapter "${name}"?`)) return;
    setDelStatus('deleting');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/AgentAdapter/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDeleted(name);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to delete adapter');
        setDelStatus('idle');
      }
    } catch (err) {
      alert(err.message || 'Network error');
      setDelStatus('idle');
    }
  }

  const phaseTone = (phase) => {
    if (!phase || phase === 'Pending') return '#9ca3af';
    if (phase === 'Active' || phase === 'Ready') return '#22c55e';
    if (phase === 'Failed') return '#ef4444';
    return '#9ca3af';
  };

  return (
    <div className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <strong style={{ flex: '1 1 auto' }}>{name}</strong>
      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{adapter.spec?.adapterType || 'subprocess'}</span>
      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{adapter.spec?.transport || 'default'}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: phaseTone(adapter.status?.phase) }} />
        {adapter.status?.phase || 'Pending'}
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

function AddAdapterForm({ org, onCreated }) {
  const [name, setName] = useState('');
  const [adapterType, setAdapterType] = useState('subprocess');
  const [transport, setTransport] = useState('stdio');
  const [capabilities, setCapabilities] = useState(['chat']);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  function toggleCapability(c) {
    setCapabilities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus('saving');
    setMessage('');

    const resource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'AgentAdapter',
      metadata: { name: name.trim() },
      spec: {
        organizationRef: org,
        adapterType,
        transport,
        ...(capabilities.length ? { capabilities } : {}),
      },
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
        setMessage(data.message || data.reason || 'Failed to create adapter');
      } else {
        setStatus('success');
        setMessage(`Adapter "${name.trim()}" created.`);
        setTimeout(() => { setStatus('idle'); setMessage(''); }, 3000);
        onCreated(data);
        setName('');
        setAdapterType('subprocess');
        setTransport('stdio');
        setCapabilities(['chat']);
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
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700 }}>New adapter</h4>
        <div style={fieldGroupStyle}>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="my-adapter" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Adapter type</label>
              <select value={adapterType} onChange={e => setAdapterType(e.target.value)} style={selectStyle}>
                {ADAPTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Transport</label>
            <select value={transport} onChange={e => setTransport(e.target.value)} style={selectStyle}>
              {TRANSPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Capabilities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {ADAPTER_CAPABILITIES.map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={capabilities.includes(c)} onChange={() => toggleCapability(c)} />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button type="submit" disabled={!canSubmit} style={!canSubmit ? disabledStyle : primaryStyle}>
              {status === 'saving' ? 'Saving...' : 'Create adapter'}
            </button>
            <StatusMsg status={status} message={message} />
          </div>
        </div>
      </div>
    </form>
  );
}

export function AdaptersSection({ org, initialAdapters }) {
  const [adapters, setAdapters] = useState(initialAdapters);
  const [showForm, setShowForm] = useState(false);

  function handleDeleted(name) {
    setAdapters(prev => prev.filter(a => a.metadata?.name !== name));
  }

  function handleCreated(newAdapter) {
    setAdapters(prev => [...prev, newAdapter]);
    setShowForm(false);
  }

  return (
    <div className="card">
      <div className="cardTitle">
        <h2>Adapters</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`pill ${adapters.length ? 'good' : 'neutral'}`}>{adapters.length} adapters</span>
          <button type="button" onClick={() => setShowForm(v => !v)} style={{ ...secondaryStyle, padding: '4px 14px', fontSize: 13 }}>
            {showForm ? 'Cancel' : '+ Add adapter'}
          </button>
        </div>
      </div>
      {adapters.length > 0 ? (
        <div className="resourceTable">
          {adapters.map(adapter => (
            <AdapterRow key={adapter.metadata?.name} org={org} adapter={adapter} onDeleted={handleDeleted} />
          ))}
        </div>
      ) : !showForm ? (
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          <p>No adapters configured. Click <strong>+ Add adapter</strong> to define how the workspace connects to agent runtimes.</p>
        </div>
      ) : null}
      {showForm && <AddAdapterForm org={org} onCreated={handleCreated} />}
    </div>
  );
}
