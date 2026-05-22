'use client';
import { useState } from 'react';
import { statusTone } from '../lib/status-tones.js';

const REVIEW_TONES = { approved: 'good', 'changes-requested': 'danger', pending: 'neutral' };

export function PullRequestList({ org, repo, pullRequests = [] }) {
  const [items, setItems] = useState(pullRequests?.items || []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', title: '', sourceBranch: '', targetBranch: 'main', description: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  function prReviewStatus(pr) {
    return pr.status?.reviewDecision || pr.spec?.reviewDecision || 'pending';
  }

  function prStatus(pr) {
    return pr.status?.phase || pr.spec?.status || 'Open';
  }

  function reviewTone(decision) { return REVIEW_TONES[decision] || 'neutral'; }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name || !form.title || !form.sourceBranch) return;
    setBusy(true);
    setMessage('');
    try {
      const resource = {
        apiVersion: 'krate.a5c.ai/v1alpha1',
        kind: 'PullRequest',
        metadata: { name: form.name },
        spec: {
          title: form.title,
          sourceBranch: form.sourceBranch,
          targetBranch: form.targetBranch || 'main',
          description: form.description,
          repository: repo,
        }
      };
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(resource),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems(prev => [...prev, body.resource || resource]);
        setShowForm(false);
        setForm({ name: '', title: '', sourceBranch: '', targetBranch: 'main', description: '' });
      } else {
        setMessage(body.message || body.error || 'Failed to create pull request');
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAction(prName, action) {
    if (!confirmAction || confirmAction.prName !== prName || confirmAction.action !== action) {
      setConfirmAction({ prName, action });
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const newPhase = action === 'merge' ? 'Merged' : 'Closed';
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/${encodeURIComponent(prName)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: { phase: newPhase } }),
      });
      if (res.ok) {
        setItems(prev => prev.map(pr =>
          (pr.metadata?.name === prName) ? { ...pr, status: { ...pr.status, phase: newPhase } } : pr
        ));
        setConfirmAction(null);
      } else {
        const body = await res.json().catch(() => ({}));
        setMessage(body.message || body.error || `${action} failed`);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = { padding: '0.375rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' };
  const btnStyle = (variant) => {
    const base = { border: 'none', padding: '0.375rem 0.75rem', borderRadius: '4px', cursor: busy ? 'wait' : 'pointer', fontSize: '0.8125rem', fontWeight: 600, opacity: busy ? 0.6 : 1 };
    if (variant === 'primary') return { ...base, background: 'var(--color-accent, #2563eb)', color: '#fff' };
    if (variant === 'merge') return { ...base, background: 'var(--color-good, #16a34a)', color: '#fff' };
    if (variant === 'close') return { ...base, background: 'transparent', border: '1px solid #d1d5db', color: '#374151' };
    if (variant === 'danger') return { ...base, background: 'var(--color-danger, #cb2431)', color: '#fff' };
    return { ...base, background: '#f3f4f6', color: '#374151' };
  };
  const pillStyle = (tone) => {
    const colors = { good: { bg: '#dcfce7', color: '#166534' }, neutral: { bg: '#f3f4f6', color: '#374151' }, warn: { bg: '#fef3c7', color: '#92400e' }, danger: { bg: '#fee2e2', color: '#991b1b' } };
    const c = colors[tone] || colors.neutral;
    return { display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600, background: c.bg, color: c.color };
  };

  const openCount = items.filter(pr => prStatus(pr) === 'Open').length;

  return (
    <div className="card">
      <div className="cardTitle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3>Pull requests</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={pillStyle(openCount ? 'good' : 'neutral')}>{openCount} open</span>
          <button type="button" style={btnStyle('primary')} onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Create PR'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ margin: '1rem 0', padding: '1rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Name (slug) *</span>
              <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="pr-my-feature" required />
            </label>
            <label style={{ fontSize: '0.8125rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Title *</span>
              <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Add new feature" required />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Source branch *</span>
              <input style={inputStyle} value={form.sourceBranch} onChange={e => setForm(f => ({ ...f, sourceBranch: e.target.value }))} placeholder="feature/my-branch" required />
            </label>
            <label style={{ fontSize: '0.8125rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Target branch</span>
              <input style={inputStyle} value={form.targetBranch} onChange={e => setForm(f => ({ ...f, targetBranch: e.target.value }))} placeholder="main" />
            </label>
          </div>
          <label style={{ fontSize: '0.8125rem' }}>
            <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Description</span>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the changes in this pull request" />
          </label>
          {message && <p style={{ color: '#dc2626', fontSize: '0.8125rem', margin: 0 }}>{message}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={btnStyle('primary')} disabled={busy}>{busy ? 'Creating...' : 'Create pull request'}</button>
            <button type="button" style={btnStyle('close')} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          <p>No pull requests yet.</p>
          <p style={{ fontSize: '0.875rem' }}>Create a pull request to start the review process.</p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map(pr => {
            const name = pr.metadata?.name;
            const title = pr.spec?.title || name;
            const author = pr.spec?.author || pr.metadata?.labels?.author || 'unknown';
            const srcBranch = pr.spec?.sourceBranch || '?';
            const tgtBranch = pr.spec?.targetBranch || 'main';
            const status = prStatus(pr);
            const reviewDecision = prReviewStatus(pr);
            const isConfirming = confirmAction?.prName === name;
            return (
              <li key={name} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.9375rem' }}>{title}</strong>
                    <span style={pillStyle(statusTone(status))}>{status}</span>
                    <span style={pillStyle(reviewTone(reviewDecision))}>{reviewDecision}</span>
                  </div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                    <span>#{name}</span>
                    <span style={{ margin: '0 0.375rem' }}>·</span>
                    <span>{srcBranch} → {tgtBranch}</span>
                    <span style={{ margin: '0 0.375rem' }}>·</span>
                    <span>by {author}</span>
                  </div>
                </div>
                {status === 'Open' && (
                  <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0, alignItems: 'center' }}>
                    {isConfirming && confirmAction.action === 'merge' ? (
                      <>
                        <button type="button" style={btnStyle('merge')} disabled={busy} onClick={() => handleAction(name, 'merge')}>{busy ? '...' : 'Confirm merge'}</button>
                        <button type="button" style={btnStyle('close')} onClick={() => setConfirmAction(null)}>Cancel</button>
                      </>
                    ) : isConfirming && confirmAction.action === 'close' ? (
                      <>
                        <button type="button" style={btnStyle('danger')} disabled={busy} onClick={() => handleAction(name, 'close')}>{busy ? '...' : 'Confirm close'}</button>
                        <button type="button" style={btnStyle('close')} onClick={() => setConfirmAction(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" style={btnStyle('merge')} onClick={() => handleAction(name, 'merge')}>Merge</button>
                        <button type="button" style={btnStyle('close')} onClick={() => handleAction(name, 'close')}>Close</button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {message && !showForm && <p style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.5rem' }}>{message}</p>}
    </div>
  );
}
