'use client';

import { useState } from 'react';

export function ApprovalDecisionButtons({ org, approvalName }) {
  const [status, setStatus] = useState('idle'); // idle | loading | approved | denied | error
  const [message, setMessage] = useState('');

  async function handleDecision(decision) {
    setStatus('loading');
    setMessage('');
    try {
      const response = await fetch(`/api/orgs/${encodeURIComponent(org)}/agents/approvals/${encodeURIComponent(approvalName)}/decide`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision, decidedBy: 'owner' })
      });
      const body = await response.json();
      if (response.ok && !body.error) {
        setStatus(decision === 'approve' ? 'approved' : 'denied');
      } else {
        setStatus('error');
        setMessage(body.message || body.reason || 'Decision failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  if (status === 'approved') {
    return <div className="heroActions" style={{ justifyContent: 'flex-start', gap: '0.5rem', marginTop: '0.75rem' }}>
      <span style={{ color: 'var(--color-good, #22863a)', fontWeight: 600 }}>Approved</span>
    </div>;
  }

  if (status === 'denied') {
    return <div className="heroActions" style={{ justifyContent: 'flex-start', gap: '0.5rem', marginTop: '0.75rem' }}>
      <span style={{ color: 'var(--color-danger, #cb2431)', fontWeight: 600 }}>Denied</span>
    </div>;
  }

  return <div className="heroActions" style={{ justifyContent: 'flex-start', gap: '0.5rem', marginTop: '0.75rem' }}>
    <button type="button" onClick={() => handleDecision('approve')} disabled={status === 'loading'} style={{ background: 'var(--color-good, #22863a)', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', cursor: status === 'loading' ? 'wait' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, fontWeight: 600 }}>
      {status === 'loading' ? 'Deciding...' : 'Approve'}
    </button>
    <button type="button" onClick={() => handleDecision('deny')} disabled={status === 'loading'} style={{ background: 'var(--color-danger, #cb2431)', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', cursor: status === 'loading' ? 'wait' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, fontWeight: 600 }}>
      {status === 'loading' ? 'Deciding...' : 'Deny'}
    </button>
    {status === 'error' && message ? <span style={{ color: 'var(--color-danger, #cb2431)', fontSize: '0.85rem' }}>{message}</span> : null}
  </div>;
}
