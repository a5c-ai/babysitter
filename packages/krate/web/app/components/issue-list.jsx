'use client';
import { useState } from 'react';

const LABEL_BG_COLORS = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe', '#fee2e2', '#f0fdf4', '#fef9c3'];
const LABEL_TEXT_COLORS = ['#1d4ed8', '#166534', '#92400e', '#9d174d', '#5b21b6', '#991b1b', '#14532d', '#713f12'];

function labelBadgeStyle(label) {
  const idx = label.charCodeAt(0) % LABEL_BG_COLORS.length;
  return {
    display: 'inline-block',
    padding: '0.125rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.6875rem',
    fontWeight: 600,
    background: LABEL_BG_COLORS[idx],
    color: LABEL_TEXT_COLORS[idx],
    marginRight: '0.25rem',
  };
}

export function IssueList({ org, repo, issues = [] }) {
  const [items, setItems] = useState(issues?.items || []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', title: '', description: '', labels: '', assignee: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmClose, setConfirmClose] = useState(null);

  function issueStatus(issue) {
    return issue.status?.phase || issue.spec?.status || 'Open';
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name || !form.title) return;
    setBusy(true);
    setMessage('');
    try {
      const labelArr = form.labels.split(',').map(l => l.trim()).filter(Boolean);
      const resource = {
        apiVersion: 'krate.a5c.ai/v1alpha1',
        kind: 'Issue',
        metadata: { name: form.name },
        spec: {
          title: form.title,
          description: form.description,
          labels: labelArr,
          assignee: form.assignee || undefined,
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
        setForm({ name: '', title: '', description: '', labels: '', assignee: '' });
      } else {
        setMessage(body.message || body.error || 'Failed to create issue');
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleStatus(issueName, currentStatus) {
    const targetStatus = currentStatus === 'Open' ? 'Closed' : 'Open';
    if (targetStatus === 'Closed' && confirmClose !== issueName) {
      setConfirmClose(issueName);
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/${encodeURIComponent(issueName)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: { phase: targetStatus } }),
      });
      if (res.ok) {
        setItems(prev => prev.map(issue =>
          (issue.metadata?.name === issueName) ? { ...issue, status: { ...issue.status, phase: targetStatus } } : issue
        ));
        setConfirmClose(null);
      } else {
        const body = await res.json().catch(() => ({}));
        setMessage(body.message || body.error || 'Status update failed');
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
    if (variant === 'close') return { ...base, background: 'transparent', border: '1px solid #d1d5db', color: '#374151' };
    if (variant === 'danger') return { ...base, background: 'var(--color-danger, #cb2431)', color: '#fff' };
    if (variant === 'reopen') return { ...base, background: 'var(--color-good, #16a34a)', color: '#fff' };
    return { ...base, background: '#f3f4f6', color: '#374151' };
  };
  const pillStyle = (tone) => {
    const colors = { good: { bg: '#dcfce7', color: '#166534' }, neutral: { bg: '#f3f4f6', color: '#374151' }, warn: { bg: '#fef3c7', color: '#92400e' }, danger: { bg: '#fee2e2', color: '#991b1b' } };
    const c = colors[tone] || colors.neutral;
    return { display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600, background: c.bg, color: c.color };
  };

  const openCount = items.filter(issue => issueStatus(issue) === 'Open').length;

  return (
    <div className="card">
      <div className="cardTitle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3>Issues</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={pillStyle(openCount ? 'good' : 'neutral')}>{openCount} open</span>
          <button type="button" style={btnStyle('primary')} onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Create Issue'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ margin: '1rem 0', padding: '1rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Name (slug) *</span>
              <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="issue-my-bug" required />
            </label>
            <label style={{ fontSize: '0.8125rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Title *</span>
              <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Describe the issue" required />
            </label>
          </div>
          <label style={{ fontSize: '0.8125rem' }}>
            <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Description</span>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Steps to reproduce, expected vs actual behavior..." />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Labels (comma-separated)</span>
              <input style={inputStyle} value={form.labels} onChange={e => setForm(f => ({ ...f, labels: e.target.value }))} placeholder="bug, ui, backend" />
            </label>
            <label style={{ fontSize: '0.8125rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Assignee</span>
              <input style={inputStyle} value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} placeholder="username" />
            </label>
          </div>
          {message && <p style={{ color: '#dc2626', fontSize: '0.8125rem', margin: 0 }}>{message}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={btnStyle('primary')} disabled={busy}>{busy ? 'Creating...' : 'Create issue'}</button>
            <button type="button" style={btnStyle('close')} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          <p>No issues yet.</p>
          <p style={{ fontSize: '0.875rem' }}>Create an issue to track bugs, features, or tasks.</p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map(issue => {
            const name = issue.metadata?.name;
            const title = issue.spec?.title || name;
            const assignee = issue.spec?.assignee;
            const labels = issue.spec?.labels || [];
            const status = issueStatus(issue);
            const isOpen = status === 'Open';
            const isConfirmingClose = confirmClose === name;
            return (
              <li key={name} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.9375rem' }}>{title}</strong>
                    <span style={pillStyle(isOpen ? 'good' : 'neutral')}>{status}</span>
                  </div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <span>#{name}</span>
                    {assignee && <><span>·</span><span>assigned to {assignee}</span></>}
                    {labels.length > 0 && (
                      <span style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                        {labels.map(label => <span key={label} style={labelBadgeStyle(label)}>{label}</span>)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0, alignItems: 'center' }}>
                  {isOpen ? (
                    isConfirmingClose ? (
                      <>
                        <button type="button" style={btnStyle('danger')} disabled={busy} onClick={() => handleToggleStatus(name, status)}>{busy ? '...' : 'Confirm close'}</button>
                        <button type="button" style={btnStyle('close')} onClick={() => setConfirmClose(null)}>Cancel</button>
                      </>
                    ) : (
                      <button type="button" style={btnStyle('close')} onClick={() => handleToggleStatus(name, status)}>Close</button>
                    )
                  ) : (
                    <button type="button" style={btnStyle('reopen')} disabled={busy} onClick={() => handleToggleStatus(name, status)}>{busy ? '...' : 'Reopen'}</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {message && !showForm && <p style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.5rem' }}>{message}</p>}
    </div>
  );
}
