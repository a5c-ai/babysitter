'use client';

import { useState } from 'react';

const RESOLUTION_LABELS = {
  'keep-external': 'Keep external',
  'keep-local': 'Keep local',
  'ignore': 'Ignore',
};

function ConflictCard({ conflict, onResolve, resolving }) {
  const id = conflict.metadata?.name || conflict.id || 'unknown';
  const spec = conflict.spec || conflict;
  const fieldName = spec.fieldName || spec.field || 'unknown field';
  const localValue = spec.localValue ?? spec.local ?? null;
  const externalValue = spec.externalValue ?? spec.external ?? null;
  const resource = spec.resourceRef || spec.resource || '';
  const detectedAt = spec.detectedAt || conflict.metadata?.creationTimestamp || null;

  const cardStyle = {
    border: '1px solid #fde68a',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    background: '#fff',
  };

  const headerStyle = {
    padding: '0.75rem 1rem',
    background: '#fffbeb',
    borderBottom: '1px solid #fde68a',
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
    borderRight: side === 'local' ? '1px solid #e5e7eb' : 'none',
  });

  const valueStyle = {
    fontFamily: 'monospace',
    fontSize: '0.8125rem',
    background: '#f9fafb',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    marginTop: '0.375rem',
    wordBreak: 'break-all',
    minHeight: '2rem',
    color: '#1f2937',
  };

  const actionsStyle = {
    padding: '0.75rem 1rem',
    borderTop: '1px solid #e5e7eb',
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
    background: variant === 'external' ? '#dbeafe' : variant === 'local' ? '#dcfce7' : '#fff',
    borderColor: variant === 'external' ? '#93c5fd' : variant === 'local' ? '#86efac' : '#d1d5db',
    color: variant === 'external' ? '#1d4ed8' : variant === 'local' ? '#166534' : '#6b7280',
  });

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{fieldName}</span>
          {resource && <span style={{ marginLeft: '0.5rem', fontSize: '0.8125rem', color: '#6b7280' }}>{resource}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {detectedAt && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Detected {detectedAt}</span>}
          <span style={{ padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: '#fef9c3', color: '#713f12' }}>Conflict</span>
        </div>
      </div>

      <div style={bodyStyle}>
        <div style={valueColStyle('local')}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Local</div>
          <div style={valueStyle}>{localValue === null ? <em style={{ color: '#9ca3af' }}>null</em> : String(localValue)}</div>
        </div>
        <div style={valueColStyle('external')}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>External</div>
          <div style={valueStyle}>{externalValue === null ? <em style={{ color: '#9ca3af' }}>null</em> : String(externalValue)}</div>
        </div>
      </div>

      <div style={actionsStyle}>
        <button style={btnStyle('ignore')} onClick={() => !resolving && onResolve(id, 'ignore')}>Ignore</button>
        <button style={btnStyle('local')} onClick={() => !resolving && onResolve(id, 'keep-local')}>Keep local</button>
        <button style={btnStyle('external')} onClick={() => !resolving && onResolve(id, 'keep-external')}>Keep external</button>
      </div>
    </div>
  );
}

function ConflictHistory({ resolved }) {
  if (!resolved.length) return null;
  return (
    <div style={{ marginTop: '1rem' }}>
      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Resolved this session</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {resolved.map((entry, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', color: '#6b7280', padding: '0.375rem 0.625rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
            <span style={{ fontWeight: 500, color: '#374151' }}>{entry.id}</span>
            <span style={{ padding: '0.0625rem 0.375rem', borderRadius: '9999px', fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>{RESOLUTION_LABELS[entry.resolution] || entry.resolution}</span>
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
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
            {localConflicts.length} open conflict{localConflicts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.375rem', padding: '0.75rem', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {localConflicts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: '#f0fdf4', borderRadius: '0.5rem', color: '#166534', fontSize: '0.875rem', border: '1px solid #86efac' }}>
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
