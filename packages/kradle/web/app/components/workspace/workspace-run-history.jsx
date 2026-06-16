'use client';

import { useState } from 'react';

function RunPhaseBadge({ phase }) {
  const display = phase || 'Unknown';
  const colorMap = {
    Running: { bg: 'var(--surface-raised)', fg: 'var(--accent)' },
    Queued: { bg: 'var(--surface-raised)', fg: 'var(--warning)' },
    Pending: { bg: 'var(--surface-raised)', fg: 'var(--warning)' },
    Dispatched: { bg: 'var(--surface-overlay)', fg: 'var(--accent)' },
    Succeeded: { bg: 'var(--surface-raised)', fg: 'var(--success)' },
    Failed: { bg: 'var(--surface-raised)', fg: 'var(--danger)' },
    Cancelled: { bg: 'var(--border)', fg: 'var(--text)' },
  };
  const colors = colorMap[display] || { bg: 'var(--surface-raised)', fg: 'var(--text-secondary)' };

  return (
    <span
      style={{
        background: colors.bg,
        color: colors.fg,
        borderRadius: '0.25rem',
        padding: '0.0625rem 0.375rem',
        fontWeight: 700,
        fontSize: '0.625rem',
      }}
    >
      {display}
    </span>
  );
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function RunHistorySection({ active = [], history = [], org }) {
  const [tab, setTab] = useState('active');

  const tabStyle = (selected) => ({
    padding: '0.25rem 0.625rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: 'none',
    borderBottom: selected ? '2px solid var(--accent)' : '2px solid transparent',
    background: 'none',
    color: selected ? 'var(--accent)' : 'var(--text-secondary)',
    cursor: 'pointer',
  });

  const runs = tab === 'active' ? active : history;

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        padding: '0.75rem',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--text)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
        }}
      >
        Runs
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }} role="tablist" aria-label="Run history tabs">
        <button onClick={() => setTab('active')} style={tabStyle(tab === 'active')} role="tab" aria-selected={tab === 'active'} aria-controls="run-history-panel">
          Active ({active.length})
        </button>
        <button onClick={() => setTab('history')} style={tabStyle(tab === 'history')} role="tab" aria-selected={tab === 'history'} aria-controls="run-history-panel">
          History ({history.length})
        </button>
      </div>

      {runs.length > 0 ? (
        <div id="run-history-panel" role="list" aria-label={tab === 'active' ? 'Active runs' : 'Run history'} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {runs.map((run) => {
            const name = run.metadata?.name || 'unknown';
            const stack = run.spec?.agentStack || '--';
            const phase = run.status?.phase || 'Unknown';
            const started = run.status?.createdAt || run.metadata?.creationTimestamp;
            const duration = run.status?.duration || null;
            const href = org ? `/orgs/${org}/agents/runs/${name}` : null;

            return (
              <div
                key={name}
                role="listitem"
                aria-label={`Run ${name}, status ${phase}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.375rem 0.5rem',
                  background: 'var(--bg-subtle)',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0 }}>
                  <RunPhaseBadge phase={phase} />
                  {href ? (
                    <a
                      href={href}
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </a>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>{name}</span>
                  )}
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>{stack}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                  <span>{formatRelativeTime(started)}</span>
                  {duration ? <span>{duration}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {tab === 'active' ? 'No active runs' : 'No run history'}
        </div>
      )}
    </div>
  );
}
