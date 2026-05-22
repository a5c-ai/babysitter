'use client';

import { useState } from 'react';
import { statusTone } from '../lib/status-tones.js';

const PROVIDER_ICONS = {
  github: 'GH',
  gitlab: 'GL',
  bitbucket: 'BB',
  gitea: 'GT',
  azure_devops: 'AZ',
};

function ProviderCard({ provider, onDelete }) {
  const spec = provider.spec || {};
  const status = provider.status || {};
  const name = provider.metadata?.name || 'unnamed';
  const providerType = spec.providerType || spec.type || 'github';
  const icon = PROVIDER_ICONS[providerType] || providerType.slice(0, 2).toUpperCase();
  const phase = status.phase || 'Pending';
  const tone = statusTone(phase);
  const lastSync = status.lastSyncTime || status.lastSync || null;
  const rateLimitRemaining = status.rateLimitRemaining;
  const rateLimitReset = status.rateLimitReset;
  const interfaces = spec.interfaces || [];

  const cardStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    padding: '1rem',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  };

  const iconStyle = {
    width: 36,
    height: 36,
    borderRadius: '0.375rem',
    background: '#1e293b',
    color: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.75rem',
    flexShrink: 0,
  };

  const pillStyle = (t) => ({
    display: 'inline-block',
    padding: '0.125rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    background: t === 'good' ? '#dcfce7' : t === 'warn' ? '#fef9c3' : t === 'danger' ? '#fee2e2' : '#f3f4f6',
    color: t === 'good' ? '#166534' : t === 'warn' ? '#713f12' : t === 'danger' ? '#991b1b' : '#374151',
  });

  const metaStyle = { fontSize: '0.8125rem', color: '#6b7280' };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={iconStyle}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{name}</div>
          <div style={metaStyle}>{providerType}{spec.baseUrl ? ` · ${spec.baseUrl}` : ''}</div>
        </div>
        <span style={pillStyle(tone)}>{phase}</span>
      </div>

      {interfaces.length > 0 && (
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {interfaces.map((iface) => (
            <span key={iface} style={{ ...pillStyle('neutral'), fontWeight: 400 }}>{iface}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem', color: '#6b7280' }}>
        {lastSync && (
          <span>Last sync: <strong style={{ color: '#374151' }}>{lastSync}</strong></span>
        )}
        {rateLimitRemaining !== undefined && (
          <span>
            Rate limit: <strong style={{ color: rateLimitRemaining < 100 ? '#dc2626' : '#374151' }}>
              {rateLimitRemaining} remaining
            </strong>
            {rateLimitReset && <> · resets {rateLimitReset}</>}
          </span>
        )}
        {spec.secretRef && (
          <span>Secret: <code style={{ background: '#f3f4f6', padding: '0.0625rem 0.25rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>{spec.secretRef}</code></span>
        )}
      </div>

      {onDelete && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onDelete(name)}
            style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.25rem 0.625rem', fontSize: '0.8125rem', color: '#6b7280', cursor: 'pointer' }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export function ExternalProviderList({ org, providers = [], onAdd, addHref }) {
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');

  async function handleDelete(name) {
    if (!confirm(`Remove external provider "${name}"?`)) return;
    setRemoving(name);
    setError('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setRemoving(null);
    }
  }

  const containerStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };
  const headerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
  const addBtnStyle = {
    padding: '0.5rem 1rem',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
  };
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>External providers</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
            {providers.length} configured
          </p>
        </div>
        {addHref && !onAdd ? (
          <a href={addHref} style={{ ...addBtnStyle, textDecoration: 'none', display: 'inline-block' }}>Add provider</a>
        ) : (
          <button style={addBtnStyle} onClick={onAdd}>Add provider</button>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.375rem', padding: '0.75rem', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {providers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: '#f9fafb', borderRadius: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
          No external providers configured. Click &quot;Add provider&quot; to connect a forge or issue tracker.
        </div>
      ) : (
        <div style={gridStyle}>
          {providers.map((provider) => (
            <ProviderCard
              key={provider.metadata?.name}
              provider={provider}
              onDelete={removing ? null : handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
