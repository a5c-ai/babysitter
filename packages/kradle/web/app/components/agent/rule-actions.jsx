'use client';

import { useState } from 'react';

export function EnableDisableToggle({ org, ruleName, enabled = true }) {
  const [currentEnabled, setCurrentEnabled] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleToggle() {
    setBusy(true);
    setError('');
    const nextEnabled = !currentEnabled;
    try {
      const response = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/AgentTriggerRule/${encodeURIComponent(ruleName)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ spec: { enabled: nextEnabled } })
      });
      const body = await response.json();
      if (response.ok && !body.error) {
        setCurrentEnabled(nextEnabled);
      } else {
        setError(body.message || body.error || 'Update failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
      <button
        type="button"
        role="switch"
        aria-checked={currentEnabled}
        aria-label={currentEnabled ? 'Disable rule' : 'Enable rule'}
        disabled={busy}
        onClick={handleToggle}
        style={{
          position: 'relative', display: 'inline-block', width: '2.25rem', height: '1.25rem',
          borderRadius: '9999px', border: 'none', cursor: busy ? 'wait' : 'pointer',
          background: currentEnabled ? 'var(--color-good, #22c55e)' : 'var(--color-muted, #d1d5db)',
          opacity: busy ? 0.6 : 1, transition: 'background 0.2s', flexShrink: 0, padding: 0
        }}
      >
        <span style={{
          position: 'absolute', top: '0.125rem', left: currentEnabled ? '1.125rem' : '0.125rem',
          width: '1rem', height: '1rem', borderRadius: '9999px', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }} />
      </button>
      <small style={{ color: currentEnabled ? 'var(--color-good, #22c55e)' : '#9ca3af', fontSize: '0.75rem' }}>
        {currentEnabled ? 'Enabled' : 'Disabled'}
      </small>
      {error ? <small style={{ color: 'var(--color-danger, #cb2431)', fontSize: '0.75rem' }}>{error}</small> : null}
    </span>
  );
}

export function DeleteRuleButton({ org, ruleName, onDeleted }) {
  const [status, setStatus] = useState('idle'); // idle | confirm | deleting | deleted | error
  const [error, setError] = useState('');

  async function handleDelete() {
    if (status === 'idle') { setStatus('confirm'); return; }
    setStatus('deleting');
    setError('');
    try {
      const response = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/AgentTriggerRule/${encodeURIComponent(ruleName)}`, {
        method: 'DELETE'
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        setStatus('deleted');
        if (onDeleted) onDeleted(ruleName);
      } else {
        setStatus('error');
        setError(body.message || body.error || 'Delete failed');
      }
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  if (status === 'deleted') {
    return <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Deleted</span>;
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
      {status === 'confirm' ? (
        <>
          <button
            type="button"
            onClick={handleDelete}
            style={{ background: 'var(--color-danger, #cb2431)', color: '#fff', border: 'none', padding: '0.25rem 0.625rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
          >
            Confirm delete
          </button>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            style={{ background: 'transparent', border: '1px solid #d1d5db', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleDelete}
          disabled={status === 'deleting'}
          style={{ background: 'transparent', border: '1px solid var(--color-danger, #cb2431)', color: 'var(--color-danger, #cb2431)', padding: '0.25rem 0.625rem', borderRadius: '4px', cursor: status === 'deleting' ? 'wait' : 'pointer', fontSize: '0.75rem', opacity: status === 'deleting' ? 0.6 : 1 }}
        >
          {status === 'deleting' ? 'Deleting...' : 'Delete'}
        </button>
      )}
      {status === 'error' && error ? <small style={{ color: 'var(--color-danger, #cb2431)', fontSize: '0.75rem' }}>{error}</small> : null}
    </span>
  );
}
