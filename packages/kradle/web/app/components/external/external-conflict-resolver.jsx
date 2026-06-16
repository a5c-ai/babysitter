'use client';

import { useState } from 'react';

const RESOLUTION_LABELS = {
  'keep-external': 'Keep external',
  'keep-local': 'Keep local',
  'ignore': 'Ignore',
};

function resolvedConflictKey(entry) {
  return [entry.id, entry.resolution, entry.resolvedAt].filter(Boolean).join(':');
}

function ConflictCard({ conflict, onResolve, resolving }) {
  const id = conflict.metadata?.name || conflict.id || 'unknown';
  const spec = conflict.spec || conflict;
  const fieldName = spec.fieldName || spec.field || 'unknown field';
  const localValue = spec.localValue ?? spec.local ?? null;
  const externalValue = spec.externalValue ?? spec.external ?? null;
  const resource = spec.resourceRef || spec.resource || '';
  const detectedAt = spec.detectedAt || conflict.metadata?.creationTimestamp || null;

  const cardStyle = {
    border: '1px solid var(--warning)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: 'var(--surface)',
  };

  const headerStyle = {
    padding: '0.75rem 1rem',
    background: 'var(--card)',
    borderBottom: '1px solid var(--warning)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  };

  const bodyStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
  };

  const valueColStyle = (side) => ({
    padding: '0.75rem 1rem',
    borderRight: side === 'local' ? '1px solid var(--border)' : 'none',
  });

  const valueStyle = {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.8125rem',
    background: 'var(--bg-subtle)',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    marginTop: '0.375rem',
    wordBreak: 'break-all',
    minHeight: '2rem',
    color: 'var(--text)',
  };

  const actionsStyle = {
    padding: '0.75rem 1rem',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  };

  const btnStyle = (variant) => ({
    padding: '0.375rem 0.875rem',
    border: '1px solid',
    borderRadius: '0.375rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: resolving ? 'not-allowed' : 'pointer',
    opacity: resolving ? 0.6 : 1,
    background: variant === 'external' ? 'var(--card)' : variant === 'local' ? 'var(--card)' : 'var(--surface)',
    borderColor: variant === 'external' ? 'var(--accent)' : variant === 'local' ? 'var(--success)' : 'var(--border)',
    color: variant === 'external' ? 'var(--accent)' : variant === 'local' ? 'var(--success)' : 'var(--text-muted)',
  });

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{fieldName}</span>
          {resource && <span style={{ marginLeft: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{resource}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {detectedAt && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detected {detectedAt}</span>}
          <span style={{ padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--card)', color: 'var(--warning)' }}>Conflict</span>
        </div>
      </div>

      <div style={bodyStyle}>
        <div style={valueColStyle('local')}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Local</div>
          <div style={valueStyle}>{localValue === null ? <em style={{ color: 'var(--text-muted)' }}>null</em> : String(localValue)}</div>
        </div>
        <div style={valueColStyle('external')}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>External</div>
          <div style={valueStyle}>{externalValue === null ? <em style={{ color: 'var(--text-muted)' }}>null</em> : String(externalValue)}</div>
        </div>
      </div>

      <div style={actionsStyle} role="group" aria-label={`Resolution actions for conflict on ${fieldName}`}>
        <button style={btnStyle('ignore')} aria-label={`Ignore conflict on ${fieldName} for ${resource || 'resource'}`} onClick={() => !resolving && onResolve(id, 'ignore')}>Ignore</button>
        <button style={btnStyle('local')} aria-label={`Keep local value for ${fieldName} on ${resource || 'resource'}`} onClick={() => !resolving && onResolve(id, 'keep-local')}>Keep local</button>
        <button style={btnStyle('external')} aria-label={`Keep external value for ${fieldName} on ${resource || 'resource'}`} onClick={() => !resolving && onResolve(id, 'keep-external')}>Keep external</button>
      </div>
    </div>
  );
}

function ConflictHistory({ resolved }) {
  if (!resolved.length) return null;
  return (
    <div style={{ marginTop: '1rem' }}>
      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>Resolved this session</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {resolved.map((entry) => (
          <div key={resolvedConflictKey(entry)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '0.375rem 0.625rem', background: 'var(--bg-subtle)', borderRadius: '0.375rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--text)' }}>{entry.id}</span>
            <span style={{ padding: '0.0625rem 0.375rem', borderRadius: '9999px', fontSize: '0.75rem', background: 'var(--card)', color: 'var(--accent)', fontWeight: 600 }}>{RESOLUTION_LABELS[entry.resolution] || entry.resolution}</span>
            <span style={{ marginLeft: 'auto' }}>{entry.resolvedAt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExternalConflictResolver({ org, conflicts = [] }) {
  const [localConflicts, setLocalConflicts] = useState(conflicts);
  const [resolved, setResolved] = useState([]);
  const [resolving, setResolving] = useState(null);
  const [error, setError] = useState('');

  async function handleResolve(id, resolution) {
    setResolving(id);
    setError('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/external/conflicts/${encodeURIComponent(id)}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      const now = new Date().toLocaleTimeString();
      setResolved((prev) => [{ id, resolution, resolvedAt: now }, ...prev]);
      setLocalConflicts((prev) => prev.filter((c) => (c.metadata?.name || c.id) !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setResolving(null);
    }
  }

  const containerStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Conflict resolution</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {localConflicts.length} open conflict{localConflicts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ background: 'var(--card)', border: '1px solid var(--danger)', borderRadius: '0.375rem', padding: '0.75rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {localConflicts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--card)', borderRadius: 'var(--radius-lg)', color: 'var(--success)', fontSize: '0.875rem', border: '1px solid var(--success)' }}>
          No open conflicts. All fields are in sync.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {localConflicts.map((conflict) => (
            <ConflictCard
              key={conflict.metadata?.name || conflict.id}
              conflict={conflict}
              onResolve={handleResolve}
              resolving={resolving === (conflict.metadata?.name || conflict.id)}
            />
          ))}
        </div>
      )}

      <ConflictHistory resolved={resolved} />
    </div>
  );
}
