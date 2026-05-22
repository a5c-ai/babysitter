'use client';
import { useState } from 'react';
import { statusTone } from '../lib/status-tones.js';

function formatDuration(startedAt, finishedAt) {
  if (!startedAt) return '--';
  const start = new Date(startedAt);
  const end = finishedAt ? new Date(finishedAt) : new Date();
  const seconds = Math.floor((end - start) / 1000);
  if (seconds < 0) return '--';
  if (seconds < 60) return seconds + 's';
  const mins = Math.floor(seconds / 60);
  return mins + 'm ' + (seconds % 60) + 's';
}

export function RepoRuns({ org, repo, runs = [] }) {
  const [items, setItems] = useState(runs?.items || []);
  const [showForm, setShowForm] = useState(false);
  const [branchFilter, setBranchFilter] = useState('');
  const [form, setForm] = useState({ branch: 'main', message: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function handleTrigger(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const runName = `${repo || 'run'}-${Date.now().toString(36)}`;
    try {
      const resource = {
        apiVersion: 'krate.a5c.ai/v1alpha1',
        kind: 'Pipeline',
        metadata: { name: runName },
        spec: {
          repository: repo,
          ref: form.branch || 'main',
          trigger: form.message || 'manual',
        }
      };
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(resource),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        const newRun = body.resource || { ...resource, status: { phase: 'Queued', startedAt: new Date().toISOString() } };
        setItems(prev => [newRun, ...prev]);
        setShowForm(false);
        setForm({ branch: 'main', message: '' });
      } else {
        setMessage(body.message || body.error || 'Failed to trigger run');
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
    return { ...base, background: '#f3f4f6', color: '#374151' };
  };
  const pillStyle = (tone) => {
    const colors = { good: { bg: '#dcfce7', color: '#166534' }, neutral: { bg: '#f3f4f6', color: '#374151' }, warn: { bg: '#fef3c7', color: '#92400e' }, danger: { bg: '#fee2e2', color: '#991b1b' } };
    const c = colors[tone] || colors.neutral;
    return { display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600, background: c.bg, color: c.color };
  };

  const filteredItems = branchFilter
    ? items.filter(run => (run.spec?.ref || '').toLowerCase().includes(branchFilter.toLowerCase()))
    : items;

  const runningCount = items.filter(run => {
    const phase = run.status?.phase;
    return phase === 'Running' || phase === 'Queued' || phase === 'Pending';
  }).length;

  return (
    <div className="card">
      <div className="cardTitle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3>Pipeline runs</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={pillStyle(runningCount ? 'warn' : 'neutral')}>{runningCount} running</span>
          <button type="button" style={btnStyle('primary')} onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : 'Trigger run'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleTrigger} style={{ margin: '1rem 0', padding: '1rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Branch *</span>
              <input style={inputStyle} value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} placeholder="main" required />
            </label>
            <label style={{ fontSize: '0.8125rem' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Trigger message</span>
              <input style={inputStyle} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="manual trigger" />
            </label>
          </div>
          {message && <p style={{ color: '#dc2626', fontSize: '0.8125rem', margin: 0 }}>{message}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={btnStyle('primary')} disabled={busy}>{busy ? 'Triggering...' : 'Trigger run'}</button>
            <button type="button" style={btnStyle('close')} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ margin: '0.75rem 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          style={{ ...inputStyle, maxWidth: '200px' }}
          value={branchFilter}
          onChange={e => setBranchFilter(e.target.value)}
          placeholder="Filter by branch..."
        />
        {branchFilter && (
          <button type="button" style={btnStyle('close')} onClick={() => setBranchFilter('')}>Clear</button>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          <p>{branchFilter ? 'No runs match the branch filter.' : 'No runs yet.'}</p>
          <p style={{ fontSize: '0.875rem' }}>Trigger a run to kick off a pipeline for this repository.</p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {filteredItems.map(run => {
            const name = run.metadata?.name;
            const phase = run.status?.phase || 'Queued';
            const branch = run.spec?.ref || '?';
            const startedAt = run.status?.startedAt;
            const finishedAt = run.status?.finishedAt;
            const isActive = phase === 'Running' || phase === 'Queued' || phase === 'Pending';
            const duration = formatDuration(startedAt, isActive ? null : finishedAt);
            const tone = statusTone(phase);
            const logsHref = `/api/orgs/${encodeURIComponent(org)}/pipelines/${encodeURIComponent(name)}/logs`;
            return (
              <li key={name} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.9375rem' }}>{name}</strong>
                    <span style={pillStyle(tone)}>{phase}</span>
                  </div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <span>branch: {branch}</span>
                    <span>·</span>
                    <span>{isActive ? `running... (${duration})` : `duration: ${duration}`}</span>
                    {startedAt && <><span>·</span><span>started {new Date(startedAt).toLocaleString()}</span></>}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <a
                    href={logsHref}
                    style={{ fontSize: '0.8125rem', color: 'var(--color-accent, #2563eb)', textDecoration: 'none', padding: '0.25rem 0.5rem', border: '1px solid currentColor', borderRadius: '4px' }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Logs
                  </a>
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
