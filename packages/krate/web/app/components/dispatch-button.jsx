'use client';
import { useState } from 'react';

export function DispatchButton({ org, stacks = [] }) {
  const [status, setStatus] = useState('idle');
  const [selectedStack, setSelectedStack] = useState('');
  const [repository, setRepository] = useState('');
  const [message, setMessage] = useState('');

  async function handleDispatch() {
    if (!selectedStack) return;
    setStatus('dispatching');
    try {
      const res = await fetch(`/api/orgs/${org}/agents/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentStack: selectedStack,
          repository: repository || 'default',
          ref: 'main',
          taskKind: 'diagnostic',
          actor: 'owner',
        }),
      });
      const data = await res.json();
      if (data.error) {
        setStatus('error');
        setMessage(data.message || 'Dispatch failed');
      } else {
        setStatus('success');
        setMessage(`Dispatch created: ${data.run?.metadata?.name || 'success'}`);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Network error');
    }
  }

  const buttonStyle = { padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 };
  const primaryStyle = { ...buttonStyle, backgroundColor: '#2563eb', color: '#fff' };
  const secondaryStyle = { ...buttonStyle, backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db' };

  if (status === 'idle') {
    return <button onClick={() => setStatus('selecting')} style={primaryStyle}>Dispatch Agent</button>;
  }

  if (status === 'selecting') {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', flexWrap: 'wrap' }}>
        <label htmlFor="dispatch-stack-select" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Agent stack</label>
        <select id="dispatch-stack-select" value={selectedStack} onChange={e => setSelectedStack(e.target.value)} style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13 }} aria-label="Select agent stack">
          <option value="">Select stack...</option>
          {stacks.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label htmlFor="dispatch-repo-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Repository</label>
        <input id="dispatch-repo-input" placeholder="Repository (optional)" value={repository} onChange={e => setRepository(e.target.value)} style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13, width: 180 }} aria-label="Repository (optional)" />
        <button onClick={handleDispatch} disabled={!selectedStack} aria-label="Launch dispatch" style={{ ...primaryStyle, opacity: selectedStack ? 1 : 0.5 }}>Launch</button>
        <button onClick={() => { setStatus('idle'); setSelectedStack(''); setRepository(''); }} aria-label="Cancel dispatch" style={secondaryStyle}>Cancel</button>
      </div>
    );
  }

  if (status === 'dispatching') {
    return <span style={{ fontSize: 13, color: '#6b7280' }}>Dispatching...</span>;
  }

  if (status === 'success') {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#16a34a' }}>{message}</span>
        <button onClick={() => { setStatus('idle'); setMessage(''); }} style={secondaryStyle}>Dispatch Another</button>
      </div>
    );
  }

  // error
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: '#dc2626' }}>{message}</span>
      <button onClick={() => { setStatus('idle'); setMessage(''); }} style={secondaryStyle}>Try Again</button>
    </div>
  );
}
