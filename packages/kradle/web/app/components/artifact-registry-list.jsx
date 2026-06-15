'use client';

import { useState } from 'react';
import { statusTone } from '../lib/status-tones.js';
import {
  cardStyle,
  btnPrimary,
  btnSecondary,
  inputStyle,
  labelStyle,
  metaStyle,
  pillStyle,
  ErrorBanner,
  REGISTRY_TYPES,
  STORAGE_BACKENDS,
  REGISTRY_ICONS,
} from './artifact-registry-helpers.jsx';

// ── Registry card ────────────────────────────────────────────────────
export function RegistryCard({ registry, feeds, onSelect }) {
  const spec = registry.spec || {};
  const status = registry.status || {};
  const name = registry.metadata?.name || 'unnamed';
  const regType = spec.registryType || 'generic';
  const icon = REGISTRY_ICONS[regType] || regType.slice(0, 3).toUpperCase();
  const phase = status.phase || 'Pending';
  const tone = statusTone(phase);
  const feedCount = feeds.filter((f) => f.spec?.registryRef === name).length;
  const endpoint = spec.endpoint || status.endpoint || `https://kradle.example.com/api/v1/registry/${regType}/${name}`;

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '0.375rem', background: '#1e293b', color: '#f8fafc',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{name}</div>
          <div style={metaStyle}>{regType} registry · {spec.storageBackend || 'internal'} backend</div>
        </div>
        <span style={pillStyle(tone)}>{phase}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        <span>{feedCount} feed{feedCount !== 1 ? 's' : ''}</span>
        {spec.description && <span>· {spec.description}</span>}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>Endpoint: </span>
        <code style={{ background: 'var(--bg-subtle)', padding: '0.0625rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.75rem', wordBreak: 'break-all' }}>
          {endpoint}
        </code>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button style={btnSecondary} onClick={() => onSelect(registry)} aria-label={`View feeds for ${name}`}>View feeds</button>
      </div>
    </div>
  );
}

// ── Create registry form ─────────────────────────────────────────────
export function CreateRegistryForm({ org, onCreated, externalProviders }) {
  const [form, setForm] = useState({ name: '', registryType: 'npm', storageBackend: 'internal', externalProviderRef: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const autoEndpoint = form.storageBackend !== 'external'
    ? `https://kradle.example.com/api/v1/registry/${form.registryType}/${form.name || '<name>'}`
    : '';

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/artifacts/registries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      const result = await res.json();
      setForm({ name: '', registryType: 'npm', storageBackend: 'internal', externalProviderRef: '', description: '' });
      if (onCreated) onCreated(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Create registry" style={{ ...cardStyle, gap: '0.875rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Create registry</h3>

      <div>
        <label style={labelStyle}>Registry type</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {REGISTRY_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, registryType: t }))}
              aria-label={`Select ${t} registry type`}
              aria-pressed={form.registryType === t}
              style={{
                ...btnSecondary,
                background: form.registryType === t ? '#2563eb' : undefined,
                color: form.registryType === t ? '#fff' : '#374151',
                borderColor: form.registryType === t ? '#2563eb' : '#e5e7eb',
                fontWeight: form.registryType === t ? 600 : 400,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Name</label>
        <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="my-npm-registry" required aria-label="Registry name" />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <input style={inputStyle} value={form.description} onChange={set('description')} placeholder="Internal package registry for team builds" aria-label="Registry description" />
      </div>

      <div>
        <label style={labelStyle}>Storage backend</label>
        <select style={inputStyle} value={form.storageBackend} onChange={set('storageBackend')} aria-label="Storage backend">
          {STORAGE_BACKENDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {form.storageBackend === 'external' && (
        <div>
          <label style={labelStyle}>External backend provider</label>
          <select style={inputStyle} value={form.externalProviderRef} onChange={set('externalProviderRef')} aria-label="External backend provider">
            <option value="">Select provider...</option>
            {(externalProviders || []).map((p) => (
              <option key={p.metadata?.name} value={p.metadata?.name}>
                {p.metadata?.name} ({p.spec?.providerType || 'unknown'})
              </option>
            ))}
          </select>
        </div>
      )}

      {autoEndpoint && (
        <div>
          <label style={labelStyle}>Endpoint (auto-generated)</label>
          <code style={{ display: 'block', background: 'var(--bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.8125rem', color: 'var(--text)', wordBreak: 'break-all' }}>
            {autoEndpoint}
          </code>
        </div>
      )}

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" style={btnPrimary} disabled={saving || !form.name} aria-label={saving ? 'Creating registry' : 'Create registry'}>
          {saving ? 'Creating...' : 'Create registry'}
        </button>
      </div>
    </form>
  );
}

// ── Feed browser (tree view) ─────────────────────────────────────────
export function FeedBrowser({ org, feeds, registries, onSelectFeed }) {
  const grouped = {};
  for (const feed of feeds) {
    const regRef = feed.spec?.registryRef || 'unassigned';
    if (!grouped[regRef]) grouped[regRef] = [];
    grouped[regRef].push(feed);
  }

  const registryNames = Object.keys(grouped).sort();

  if (feeds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        No feeds found. Create a feed from a registry detail view.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {registryNames.map((regName) => {
        const regFeeds = grouped[regName];
        const registry = registries.find((r) => r.metadata?.name === regName);
        const regType = registry?.spec?.registryType || 'generic';
        return (
          <details key={regName} open style={cardStyle}>
            <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9375rem' }}>
              <span style={pillStyle('neutral')}>{regType}</span>
              {regName}
              <span style={metaStyle}>({regFeeds.length} feed{regFeeds.length !== 1 ? 's' : ''})</span>
            </summary>
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {regFeeds.map((feed) => {
                const feedName = feed.metadata?.name || 'unnamed';
                const versionCount = feed.status?.versionCount || feed.status?.versions || 0;
                const lastPublished = feed.status?.lastPublishedAt || feed.status?.lastPublished || '--';
                const size = feed.status?.totalSize || feed.status?.size || '--';
                return (
                  <div
                    key={feedName}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                      padding: '0.5rem 0.75rem', background: 'var(--bg-subtle)', borderRadius: '0.375rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => onSelectFeed(feed)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select feed ${feedName}`}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSelectFeed(feed); }}
                  >
                    <strong style={{ fontSize: '0.875rem' }}>{feedName}</strong>
                    <span style={metaStyle}>{versionCount} version{versionCount !== 1 ? 's' : ''}</span>
                    <span style={metaStyle}>Last: {lastPublished}</span>
                    <span style={metaStyle}>Size: {size}</span>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
