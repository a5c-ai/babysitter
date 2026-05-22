'use client';

import { useState } from 'react';

function RunPhaseBadge({ phase }) {
  const display = phase || 'Unknown';
  const colorMap = {
    Running: { bg: '#dbeafe', fg: '#1e40af' },
    Queued: { bg: '#fef3c7', fg: '#92400e' },
    Pending: { bg: '#fef3c7', fg: '#92400e' },
    Dispatched: { bg: '#e0e7ff', fg: '#3730a3' },
    Succeeded: { bg: '#d1fae5', fg: '#065f46' },
    Failed: { bg: '#fee2e2', fg: '#991b1b' },
    Cancelled: { bg: '#e5e7eb', fg: '#374151' },
  };
  const colors = colorMap[display] || { bg: '#f3f4f6', fg: '#6b7280' };

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
    borderBottom: selected ? '2px solid #2563eb' : '2px solid transparent',
    background: 'none',
    color: selected ? '#2563eb' : '#6b7280',
    cursor: 'pointer',
  });

  const runs = tab === 'active' ? active : history;

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '0.75rem',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#374151',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
        }}
      >
        Runs
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #e5e7eb', marginBottom: '0.5rem' }}>
        <button onClick={() => setTab('active')} style={tabStyle(tab === 'active')}>
          Active ({active.length})
        </button>
        <button onClick={() => setTab('history')} style={tabStyle(tab === 'history')}>
          History ({history.length})
        </button>
      </div>

      {runs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.375rem 0.5rem',
                  background: '#f9fafb',
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
                        color: '#2563eb',
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
                  <span style={{ color: '#6b7280', fontFamily: 'var(--font-mono, monospace)' }}>{stack}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', color: '#9ca3af', fontSize: '0.6875rem' }}>
                  <span>{formatRelativeTime(started)}</span>
                  {duration ? <span>{duration}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          {tab === 'active' ? 'No active runs' : 'No run history'}
        </div>
      )}
    </div>
  );
}
