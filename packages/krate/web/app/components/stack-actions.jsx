'use client';
import { useState } from 'react';

export function StackActions({ org, stackName }) {
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState(null);

  const encodedName = encodeURIComponent(stackName);
  const editHref = `/orgs/${org}/agents/stacks/${encodedName}`;

  async function handleDispatch() {
    setStatus('dispatching');
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/agents/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stackRef: stackName }),
      });
      setStatus(res.ok ? 'dispatched' : 'error');
      if (!res.ok) {
        const text = await res.text();
        setErrorMsg(`Dispatch failed: ${res.status} ${text}`);
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(`Dispatch error: ${err.message}`);
    }
    setTimeout(() => setStatus('idle'), 2000);
  }

  async function handleDelete() {
    if (!confirm(`Delete stack "${stackName}"?`)) return;
    setStatus('deleting');
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/orgs/${encodeURIComponent(org)}/resources/AgentStack/${encodedName}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const text = await res.text();
        setErrorMsg(`Delete failed: ${res.status} ${text}`);
        setStatus('idle');
        return;
      }
      window.location.reload();
    } catch (err) {
      setErrorMsg(`Delete error: ${err.message}`);
      setStatus('idle');
    }
  }

  return (
    <span style={{ display: 'flex', gap: 8, flexDirection: 'column', alignItems: 'flex-start' }}>
      <span style={{ display: 'flex', gap: 8 }}>
        <a href={editHref} aria-label={`Edit stack ${stackName}`} style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, textDecoration: 'none', fontSize: 'inherit' }}>
          Edit
        </a>
        <button
          onClick={handleDispatch}
          disabled={status !== 'idle'}
          aria-label={`Dispatch stack ${stackName}`}
          onKeyDown={e => e.key === 'Enter' && status === 'idle' && handleDispatch()}
        >
          {status === 'dispatching' ? 'Dispatching...' : status === 'dispatched' ? 'Dispatched!' : status === 'error' && errorMsg?.startsWith('Dispatch') ? 'Error' : 'Dispatch'}
        </button>
        <button
          onClick={handleDelete}
          style={{ color: '#ef4444' }}
          disabled={status === 'deleting'}
          aria-label={`Delete stack ${stackName}`}
          onKeyDown={e => e.key === 'Enter' && status !== 'deleting' && handleDelete()}
        >
          {status === 'deleting' ? 'Deleting...' : 'Delete'}
        </button>
      </span>
      {errorMsg && (
        <span style={{ color: '#ef4444', fontSize: '0.85em' }}>{errorMsg}</span>
      )}
    </span>
  );
}
