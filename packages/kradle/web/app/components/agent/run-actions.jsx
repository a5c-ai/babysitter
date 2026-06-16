'use client';
import { useState } from 'react';
import { agentIdentityOptions } from '../../lib/agent-identity.js';

const btnBase = { padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const primaryBtn = { ...btnBase, backgroundColor: 'var(--accent)', color: 'var(--surface)' };
const dangerBtn = { ...btnBase, backgroundColor: 'var(--danger)', color: 'var(--surface)' };
const secondaryBtn = { ...btnBase, backgroundColor: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' };
const disabledStyle = { opacity: 0.55, cursor: 'not-allowed' };

/**
 * ManualDispatchButton — dropdown stack selector + "Dispatch" button.
 * POSTs to /api/orgs/{org}/agents/dispatch with { stackRef }.
 */
export function ManualDispatchButton({ org, stacks = [], agents = [] }) {
  const [open, setOpen] = useState(false);
  const [selectedStack, setSelectedStack] = useState('');
  const [repository, setRepository] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const identityOptions = agentIdentityOptions(agents, stacks);
  const selectedIdentity = identityOptions.find((option) => option.value === selectedStack);

  async function handleDispatch() {
    if (!selectedStack) return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/agents/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(selectedIdentity?.type === 'agentDefinition' ? { agentDefinition: selectedStack } : { stackRef: selectedStack }), repository: repository || 'default' }),
      });
      const data = await res.json();
      if (data.error) {
        setStatus('error');
        setMessage(data.message || 'Dispatch failed');
      } else {
        setStatus('success');
        setMessage(`Dispatched: ${data.run?.metadata?.name || 'queued'}`);
        setOpen(false);
        setSelectedStack('');
        setRepository('');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Network error');
    }
  }

  function reset() {
    setStatus('idle');
    setMessage('');
    setOpen(false);
    setSelectedStack('');
    setRepository('');
  }

  if (status === 'success') {
    return (
      <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>{message}</span>
        <button onClick={reset} style={secondaryBtn} aria-label="Dispatch another run">Dispatch another</button>
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--danger)' }}>{message}</span>
        <button onClick={reset} style={secondaryBtn} aria-label="Try dispatch again">Try again</button>
      </span>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={primaryBtn}>
        Manual Dispatch
      </button>
    );
  }

  return (
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <select
        value={selectedStack}
        onChange={e => setSelectedStack(e.target.value)}
        style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13 }}
        aria-label="Select agent persona or stack"
      >
        <option value="">Select agent…</option>
        {identityOptions.map(option => <option key={`${option.type}-${option.value}`} value={option.value}>{option.label}{option.hint ? ` - ${option.hint}` : ''}</option>)}
      </select>
      <input
        placeholder="Repository (optional)"
        value={repository}
        onChange={e => setRepository(e.target.value)}
        style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, width: 170 }}
        aria-label="Repository"
      />
      <button
        onClick={handleDispatch}
        disabled={!selectedStack || status === 'loading'}
        style={{ ...primaryBtn, ...((!selectedStack || status === 'loading') ? disabledStyle : {}) }}
      >
        {status === 'loading' ? 'Dispatching…' : 'Dispatch'}
      </button>
      <button onClick={reset} style={secondaryBtn} aria-label="Cancel dispatch form">Cancel</button>
    </span>
  );
}

/**
 * RunActions — cancel and retry buttons for a run row or detail page.
 * Cancel: POSTs to /api/orgs/{org}/agents/runs/{name}/cancel
 * Retry:  POSTs to /api/orgs/{org}/agents/dispatch with the run's stackRef
 */
export function RunActions({ org, runName, stackRef, phase }) {
  const [cancelStatus, setCancelStatus] = useState('idle'); // idle | loading | done | error
  const [retryStatus, setRetryStatus] = useState('idle');   // idle | loading | done | error
  const [deleteStatus, setDeleteStatus] = useState('idle'); // idle | confirm | loading | done | error
  const [cancelMsg, setCancelMsg] = useState('');
  const [retryMsg, setRetryMsg] = useState('');
  const [deleteMsg, setDeleteMsg] = useState('');

  const isTerminal = phase === 'Completed' || phase === 'Succeeded' || phase === 'Cancelled' || phase === 'Failed';
  const canCancel = !isTerminal && cancelStatus === 'idle';
  const canRetry = (isTerminal || phase === 'Failed') && retryStatus === 'idle';
  const canDelete = isTerminal && deleteStatus === 'idle';

  async function handleCancel() {
    setCancelStatus('loading');
    setCancelMsg('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/agents/runs/${encodeURIComponent(runName)}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.error) {
        setCancelStatus('error');
        setCancelMsg(data.message || 'Cancel failed');
      } else {
        setCancelStatus('done');
        setCancelMsg('Cancelled');
      }
    } catch (err) {
      setCancelStatus('error');
      setCancelMsg(err.message || 'Network error');
    }
  }

  async function handleDelete() {
    if (deleteStatus === 'idle') { setDeleteStatus('confirm'); return; }
    setDeleteStatus('loading');
    setDeleteMsg('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/AgentDispatchRun/${encodeURIComponent(runName)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDeleteStatus('done');
        setDeleteMsg('Deleted');
      } else {
        setDeleteStatus('error');
        setDeleteMsg(data.message || data.error || 'Delete failed');
      }
    } catch (err) {
      setDeleteStatus('error');
      setDeleteMsg(err.message || 'Network error');
    }
  }

  async function handleRetry() {
    if (!stackRef) {
      setRetryStatus('error');
      setRetryMsg('No stack ref available');
      return;
    }
    setRetryStatus('loading');
    setRetryMsg('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/agents/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stackRef }),
      });
      const data = await res.json();
      if (data.error) {
        setRetryStatus('error');
        setRetryMsg(data.message || 'Retry failed');
      } else {
        setRetryStatus('done');
        setRetryMsg(`Retried: ${data.run?.metadata?.name || 'queued'}`);
      }
    } catch (err) {
      setRetryStatus('error');
      setRetryMsg(err.message || 'Network error');
    }
  }

  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      {canCancel && (
        <button onClick={handleCancel} style={dangerBtn} title="Cancel this run" aria-label={`Cancel run ${runName}`}>
          Cancel
        </button>
      )}
      {cancelStatus === 'loading' && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cancelling…</span>}
      {cancelStatus === 'done' && <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>Cancelled</span>}
      {cancelStatus === 'error' && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{cancelMsg}</span>}

      {canRetry && stackRef && (
        <button onClick={handleRetry} style={secondaryBtn} title="Retry this run with the same stack" aria-label={`Retry run ${runName}`}>
          Retry
        </button>
      )}
      {retryStatus === 'loading' && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Retrying…</span>}
      {retryStatus === 'done' && <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>{retryMsg}</span>}
      {retryStatus === 'error' && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{retryMsg}</span>}

      {canDelete && deleteStatus === 'idle' && (
        <button onClick={handleDelete} style={dangerBtn} title="Delete this run" aria-label={`Delete run ${runName}`}>
          Delete
        </button>
      )}
      {deleteStatus === 'confirm' && (
        <>
          <button onClick={handleDelete} style={{ ...dangerBtn, fontSize: 11 }} aria-label={`Confirm delete run ${runName}`}>
            Confirm delete
          </button>
          <button onClick={() => setDeleteStatus('idle')} style={secondaryBtn} aria-label="Cancel delete">
            Cancel
          </button>
        </>
      )}
      {deleteStatus === 'loading' && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Deleting…</span>}
      {deleteStatus === 'done' && <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>{deleteMsg}</span>}
      {deleteStatus === 'error' && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{deleteMsg}</span>}
    </span>
  );
}
