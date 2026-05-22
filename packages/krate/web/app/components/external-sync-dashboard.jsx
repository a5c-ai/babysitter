'use client';

import { useState, useCallback } from 'react';

const STATUS_TONE = {
  Ready: 'good',
  Synced: 'good',
  Backfilling: 'warn',
  RateLimited: 'warn',
  Failed: 'danger',
  Pending: 'neutral',
  Idle: 'neutral',
};

function tone(status) {
  return STATUS_TONE[status] || 'neutral';
}

const pillStyle = (t) => ({
  display: 'inline-block',
  padding: '0.125rem 0.5rem',
  borderRadius: '9999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  background: t === 'good' ? '#dcfce7' : t === 'warn' ? '#fef9c3' : t === 'danger' ? '#fee2e2' : '#f3f4f6',
  color: t === 'good' ? '#166534' : t === 'warn' ? '#713f12' : t === 'danger' ? '#991b1b' : '#374151',
});

function BindingRow({ binding, org, onSync }) {
  const status = binding.status || {};
  const spec = binding.spec || {};
  const name = binding.metadata?.name || 'unknown';
  const syncStatus = status.syncStatus || status.phase || 'Pending';
  const t = tone(syncStatus);
  const lastSync = status.lastSyncTime || null;
  const pendingWrites = status.pendingWriteIntents || 0;
  const conflicts = status.openConflicts || 0;

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto auto auto',
    gap: '1rem',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    background: '#fff',
    fontSize: '0.875rem',
  };

  return (
    <div style={rowStyle}>
      <div>
        <div style={{ fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          {spec.providerRef || 'no provider'}{spec.repository ? ` / ${spec.repository}` : ''}
        </div>
        {lastSync && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>Last sync: {lastSync}</div>}
      </div>
      <span style={pillStyle(t)}>{syncStatus}</span>
      <span style={{ fontSize: '0.8125rem', color: pendingWrites > 0 ? '#d97706' : '#9ca3af' }}>
        {pendingWrites} pending write{pendingWrites !== 1 ? 's' : ''}
      </span>
      <span style={{ fontSize: '0.8125rem', color: conflicts > 0 ? '#dc2626' : '#9ca3af' }}>
        {conflicts} conflict{conflicts !== 1 ? 's' : ''}
      </span>
      <button
        onClick={() => onSync(name)}
        style={{ padding: '0.25rem 0.625rem', background: '#fff', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer', color: '#374151' }}
      >
        Sync now
      </button>
    </div>
  );
}

export function ExternalSyncDashboard({ org, bindings = [] }) {
  const [syncing, setSyncing] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSync = useCallback(async (bindingName) => {
    setSyncing(bindingName);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/external/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ binding: bindingName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setSuccessMsg(`Sync triggered for ${bindingName}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(null);
    }
  }, [org]);

  const totalPendingWrites = bindings.reduce((sum, b) => sum + (b.status?.pendingWriteIntents || 0), 0);
  const totalConflicts = bindings.reduce((sum, b) => sum + (b.status?.openConflicts || 0), 0);
  const readyCount = bindings.filter((b) => (b.status?.syncStatus || b.status?.phase) === 'Ready' || (b.status?.syncStatus || b.status?.phase) === 'Synced').length;

  const containerStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };

  const summaryStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.75rem',
  };

  const statCardStyle = {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    textAlign: 'center',
  };

  return (
    <div style={containerStyle}>
      <div style={summaryStyle}>
        <div style={statCardStyle}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>{bindings.length}</div>
          <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Bindings</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#166534' }}>{readyCount}</div>
          <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Ready</div>
        </div>
        <div style={{ ...statCardStyle, borderColor: totalPendingWrites > 0 ? '#fde68a' : '#e5e7eb' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: totalPendingWrites > 0 ? '#d97706' : '#9ca3af' }}>{totalPendingWrites}</div>
          <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Pending writes</div>
        </div>
        <div style={{ ...statCardStyle, borderColor: totalConflicts > 0 ? '#fca5a5' : '#e5e7eb' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: totalConflicts > 0 ? '#dc2626' : '#9ca3af' }}>{totalConflicts}</div>
          <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Conflicts</div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.375rem', padding: '0.75rem', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.375rem', padding: '0.75rem', color: '#166534', fontSize: '0.875rem' }}>
          {successMsg}
        </div>
      )}

      {bindings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: '#f9fafb', borderRadius: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
          No external backend bindings found. Configure an ExternalBackendProvider to enable sync.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {bindings.map((binding) => (
            <BindingRow
              key={binding.metadata?.name}
              binding={{ ...binding, status: { ...binding.status, ...(syncing === binding.metadata?.name ? { syncStatus: 'Syncing' } : {}) } }}
              org={org}
              onSync={syncing ? () => {} : handleSync}
            />
          ))}
        </div>
      )}
    </div>
  );
}
