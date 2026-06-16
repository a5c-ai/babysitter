'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { statusTone } from '../../lib/status-tones.js';

const TYPED_PROVIDER_KINDS = ['GitProvider', 'CiProvider', 'IssueTrackerProvider', 'AppHostingProvider', 'ArtifactRegistryProvider'];

const SCOPE_LABELS = {
  GitProvider: 'Git',
  CiProvider: 'CI/CD',
  IssueTrackerProvider: 'Issues',
  AppHostingProvider: 'Hosting',
  ArtifactRegistryProvider: 'Artifacts',
};

const PLATFORM_ICONS = {
  github: 'GH',
  gitlab: 'GL',
  bitbucket: 'BB',
  gitea: 'GT',
  azure_devops: 'AZ',
  vercel: 'VR',
  cloudflare: 'CF',
  firebase: 'FB',
  netlify: 'NL',
};

function scopeBadgeColor(kind) {
  const colors = {
    GitProvider: { bg: 'var(--card)', color: 'var(--accent)' },
    CiProvider: { bg: 'var(--card)', color: 'var(--warning)' },
    IssueTrackerProvider: { bg: 'var(--card)', color: 'var(--success)' },
    AppHostingProvider: { bg: 'var(--card)', color: '#7c3aed' },
    ArtifactRegistryProvider: { bg: 'var(--card)', color: 'var(--info)' },
  };
  return colors[kind] || { bg: 'var(--surface-raised)', color: 'var(--text)' };
}

function PlatformGroupCard({ platform, providers, onDelete, removing, confirmTarget, onCancelConfirm }) {
  const icon = PLATFORM_ICONS[platform] || platform.slice(0, 2).toUpperCase();
  const endpoint = providers[0]?.spec?.endpoint || '';
  const secretRef = providers[0]?.spec?.secretRef || '';

  const cardStyle = {
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    padding: '1rem',
    background: 'var(--surface)',
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
    background: 'var(--surface-raised)',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.75rem',
    flexShrink: 0,
  };

  const metaStyle = { fontSize: '0.8125rem', color: 'var(--text-muted)' };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={iconStyle}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{platform}</div>
          <div style={metaStyle}>{endpoint}</div>
        </div>
      </div>

      {/* Scope badges */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {providers.map((p) => {
          const badge = scopeBadgeColor(p.kind);
          const phase = p.status?.phase || 'Pending';
          const tone = statusTone(phase);
          return (
            <span key={p.kind} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: badge.bg,
              color: badge.color,
            }}>
              {SCOPE_LABELS[p.kind] || p.kind}
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: tone === 'good' ? 'var(--success)' : tone === 'warn' ? 'var(--warning)' : tone === 'danger' ? 'var(--danger)' : 'var(--text-muted)',
              }} />
            </span>
          );
        })}
      </div>

      {/* Metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        {secretRef && (
          <span>Secret: <code style={{ background: 'var(--bg-subtle)', padding: '0.0625rem 0.25rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>{secretRef}</code></span>
        )}
      </div>

      {/* Individual provider delete buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {providers.map((p) => {
          const targetKey = `${p.kind}/${p.metadata?.name}`;
          const isConfirming = confirmTarget === targetKey;
          return isConfirming ? (
            <span key={`${p.kind}-${p.metadata?.name}`} style={{ display: 'inline-flex', gap: '0.25rem' }}>
              <button
                onClick={() => onDelete(p.kind, p.metadata?.name)}
                aria-label={`Confirm remove ${SCOPE_LABELS[p.kind] || p.kind} provider ${p.metadata?.name || ''}`}
                style={{
                  background: 'var(--danger)',
                  border: '1px solid var(--danger)',
                  borderRadius: '0.375rem',
                  padding: '0.25rem 0.625rem',
                  fontSize: '0.75rem',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Confirm
              </button>
              <button
                onClick={onCancelConfirm}
                aria-label="Cancel remove"
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  padding: '0.25rem 0.625rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              key={`${p.kind}-${p.metadata?.name}`}
              onClick={() => onDelete(p.kind, p.metadata?.name)}
              disabled={!!removing}
              aria-label={`Remove ${SCOPE_LABELS[p.kind] || p.kind} provider ${p.metadata?.name || ''} from ${platform}`}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.625rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                cursor: removing ? 'not-allowed' : 'pointer',
                opacity: removing ? 0.5 : 1,
              }}
            >
              Remove {SCOPE_LABELS[p.kind] || p.kind}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ExternalProviderList({ org, providers = [], onAdd, addHref }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  async function handleDelete(kind, name) {
    const targetKey = `${kind}/${name}`;
    if (confirmTarget !== targetKey) { setConfirmTarget(targetKey); return; }
    setConfirmTarget(null);
    setRemoving(name);
    setError('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/${encodeURIComponent(kind)}/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (err) {
      setError(err.message);
      setRemoving(null);
    }
  }

  // Group providers by platform
  const byPlatform = {};
  for (const provider of providers) {
    const platform = provider.spec?.platform || provider.spec?.providerType || 'unknown';
    if (!byPlatform[platform]) byPlatform[platform] = [];
    byPlatform[platform].push(provider);
  }
  const platformGroups = Object.entries(byPlatform).sort(([a], [b]) => a.localeCompare(b));

  const containerStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };
  const headerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
  const addBtnStyle = {
    padding: '0.5rem 1rem',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
  };
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1rem',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>External providers</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {providers.length} configured across {platformGroups.length} platform{platformGroups.length !== 1 ? 's' : ''}
          </p>
        </div>
        {addHref && !onAdd ? (
          <a href={addHref} style={{ ...addBtnStyle, textDecoration: 'none', display: 'inline-block' }}>Add provider</a>
        ) : (
          <button style={addBtnStyle} onClick={onAdd}>Add provider</button>
        )}
      </div>

      {error && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--danger)', borderRadius: '0.375rem', padding: '0.75rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {providers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No external providers configured. Click &quot;Add provider&quot; to connect a platform.
        </div>
      ) : (
        <div style={gridStyle}>
          {platformGroups.map(([platform, group]) => (
            <PlatformGroupCard
              key={platform}
              platform={platform}
              providers={group}
              onDelete={handleDelete}
              removing={removing}
              confirmTarget={confirmTarget}
              onCancelConfirm={() => setConfirmTarget(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Fetch all typed provider kinds for an org, returning a merged array with kind attached.
 */
export async function fetchAllTypedProviders(org) {
  const results = await Promise.all(
    TYPED_PROVIDER_KINDS.map(async (kind) => {
      try {
        const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources?kind=${encodeURIComponent(kind)}`);
        if (!res.ok) return [];
        const data = await res.json();
        const items = data.items || data || [];
        return (Array.isArray(items) ? items : []).map((item) => ({ ...item, kind }));
      } catch {
        return [];
      }
    })
  );
  return results.flat();
}
