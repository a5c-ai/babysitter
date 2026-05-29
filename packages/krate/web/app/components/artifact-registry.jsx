'use client';

import { useState, useCallback } from 'react';
import { statusTone } from '../lib/status-tones.js';

// ── Install command templates ────────────────────────────────────────
function installCommand(registryType, org, feed, name, version) {
  const base = 'https://krate.example.com/api/v1/registry';
  switch (registryType) {
    case 'npm':
      return `npm install @${org}/${name}@${version} --registry ${base}/npm/${feed}`;
    case 'pip':
      return `pip install ${name}==${version} --index-url ${base}/pip/${feed}/simple`;
    case 'docker':
      return `docker pull krate.example.com/${feed}/${name}:${version}`;
    case 'generic':
    default:
      return `curl -O ${base}/generic/${feed}/${name}/${version}`;
  }
}

// ── Shared styles ────────────────────────────────────────────────────
const cardStyle = {
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  padding: '1rem',
  background: 'var(--surface)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const btnPrimary = {
  padding: '0.5rem 1rem',
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnSecondary = {
  padding: '0.375rem 0.75rem',
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '0.375rem',
  fontSize: '0.8125rem',
  color: 'var(--text)',
  cursor: 'pointer',
};

const btnDanger = {
  ...btnSecondary,
  color: 'var(--danger)',
  borderColor: '#fca5a5',
};

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--border)',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  background: 'var(--surface)',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--text)',
  marginBottom: '0.25rem',
};

const metaStyle = { fontSize: '0.8125rem', color: 'var(--text-muted)' };

const pillStyle = (t) => ({
  display: 'inline-block',
  padding: '0.125rem 0.5rem',
  borderRadius: '9999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  background: t === 'good' ? '#dcfce7' : t === 'warn' ? '#fef9c3' : t === 'danger' ? '#fee2e2' : '#f3f4f6',
  color: t === 'good' ? '#166534' : t === 'warn' ? '#713f12' : t === 'danger' ? '#991b1b' : '#374151',
});

const codeBlockStyle = {
  background: '#1e293b',
  color: '#e2e8f0',
  borderRadius: '0.375rem',
  padding: '0.75rem 1rem',
  fontSize: '0.8125rem',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  overflowX: 'auto',
  position: 'relative',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
};

const REGISTRY_TYPES = ['npm', 'pip', 'docker', 'generic'];
const STORAGE_BACKENDS = ['internal', 's3', 'azure-blob', 'external'];

const REGISTRY_ICONS = {
  npm: 'NPM',
  pip: 'PIP',
  docker: 'DKR',
  generic: 'GEN',
};

// ── Copyable code block ──────────────────────────────────────────────
function CopyableCode({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <div style={{ position: 'relative' }}>
      <pre style={codeBlockStyle}><code>{text}</code></pre>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: '0.375rem',
          right: '0.375rem',
          background: copied ? '#22c55e' : '#334155',
          color: '#f8fafc',
          border: 'none',
          borderRadius: '0.25rem',
          padding: '0.25rem 0.5rem',
          fontSize: '0.6875rem',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

// ── Error banner ─────────────────────────────────────────────────────
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.375rem', padding: '0.75rem', color: 'var(--danger)', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{message}</span>
      {onDismiss && <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 700 }}>Dismiss</button>}
    </div>
  );
}

// ── Registry card ────────────────────────────────────────────────────
function RegistryCard({ registry, feeds, onSelect }) {
  const spec = registry.spec || {};
  const status = registry.status || {};
  const name = registry.metadata?.name || 'unnamed';
  const regType = spec.registryType || 'generic';
  const icon = REGISTRY_ICONS[regType] || regType.slice(0, 3).toUpperCase();
  const phase = status.phase || 'Pending';
  const tone = statusTone(phase);
  const feedCount = feeds.filter((f) => f.spec?.registryRef === name).length;
  const endpoint = spec.endpoint || status.endpoint || `https://krate.example.com/api/v1/registry/${regType}/${name}`;

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
        <button style={btnSecondary} onClick={() => onSelect(registry)}>View feeds</button>
      </div>
    </div>
  );
}

// ── Create registry form ─────────────────────────────────────────────
function CreateRegistryForm({ org, onCreated, externalProviders }) {
  const [form, setForm] = useState({ name: '', registryType: 'npm', storageBackend: 'internal', externalProviderRef: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const autoEndpoint = form.storageBackend !== 'external'
    ? `https://krate.example.com/api/v1/registry/${form.registryType}/${form.name || '<name>'}`
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
    <form onSubmit={handleSubmit} style={{ ...cardStyle, gap: '0.875rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Create registry</h3>

      <div>
        <label style={labelStyle}>Registry type</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {REGISTRY_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, registryType: t }))}
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
        <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="my-npm-registry" required />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <input style={inputStyle} value={form.description} onChange={set('description')} placeholder="Internal package registry for team builds" />
      </div>

      <div>
        <label style={labelStyle}>Storage backend</label>
        <select style={inputStyle} value={form.storageBackend} onChange={set('storageBackend')}>
          {STORAGE_BACKENDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {form.storageBackend === 'external' && (
        <div>
          <label style={labelStyle}>External backend provider</label>
          <select style={inputStyle} value={form.externalProviderRef} onChange={set('externalProviderRef')}>
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
        <button type="submit" style={btnPrimary} disabled={saving || !form.name}>
          {saving ? 'Creating...' : 'Create registry'}
        </button>
      </div>
    </form>
  );
}

// ── Feed browser (tree view) ─────────────────────────────────────────
function FeedBrowser({ org, feeds, registries, onSelectFeed }) {
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

// ── Version list table ───────────────────────────────────────────────
function VersionList({ org, feed, registryType, onBack }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const feedName = feed.metadata?.name || 'unnamed';

  useState(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/artifacts/feeds/${encodeURIComponent(feedName)}/versions`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setVersions(data.items || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  });

  async function handleDelete(versionName) {
    if (!confirm(`Delete version "${versionName}"?`)) return;
    setDeleting(versionName);
    setError('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/ArtifactVersion/${encodeURIComponent(versionName)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setVersions((prev) => prev.filter((v) => v.metadata?.name !== versionName));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  }

  const headerRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 0.75fr 1fr 0.5fr 0.75fr 0.75fr 0.5fr',
    gap: '0.5rem',
    fontWeight: 600,
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '0.5rem 0.75rem',
    borderBottom: '1px solid #e5e7eb',
  };

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 0.75fr 1fr 0.5fr 0.75fr 0.75fr 0.5fr',
    gap: '0.5rem',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    fontSize: '0.8125rem',
    borderBottom: '1px solid #f3f4f6',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button style={btnSecondary} onClick={onBack}>Back</button>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Versions: {feedName}</h3>
        <span style={pillStyle('neutral')}>{registryType || 'generic'}</span>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading versions...</div>
      ) : versions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No versions published to this feed yet.
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={headerRowStyle}>
            <span>Name</span><span>Version</span><span>Digest</span><span>Size</span><span>Published</span><span>By</span><span></span>
          </div>
          {versions.map((v) => {
            const spec = v.spec || {};
            const name = spec.name || v.metadata?.name || '--';
            const version = spec.version || '--';
            const digest = spec.digest || '--';
            const truncDigest = digest.length > 16 ? `${digest.substring(0, 16)}...` : digest;
            const size = spec.size ? formatSize(spec.size) : '--';
            const published = spec.publishedAt || v.metadata?.creationTimestamp || '--';
            const publishedBy = spec.publishedBy || '--';
            const cmd = installCommand(registryType || 'generic', org, feedName, spec.name || feedName, version);
            return (
              <div key={v.metadata?.name}>
                <div style={rowStyle}>
                  <strong>{name}</strong>
                  <span>{version}</span>
                  <span title={digest} style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{truncDigest}</span>
                  <span>{size}</span>
                  <span style={metaStyle}>{typeof published === 'string' ? published.split('T')[0] : published}</span>
                  <span style={metaStyle}>{publishedBy}</span>
                  <button
                    style={btnDanger}
                    onClick={() => handleDelete(v.metadata?.name)}
                    disabled={deleting === v.metadata?.name}
                  >
                    {deleting === v.metadata?.name ? '...' : 'Delete'}
                  </button>
                </div>
                <div style={{ padding: '0 0.75rem 0.5rem' }}>
                  <CopyableCode text={cmd} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Access policy manager ────────────────────────────────────────────
function AccessPolicyManager({ org, feed }) {
  const feedName = feed.metadata?.name || 'unnamed';
  const policies = feed.spec?.accessPolicy?.subjects || [];
  const [subjects, setSubjects] = useState(policies);
  const [newSubject, setNewSubject] = useState('');
  const [newPermission, setNewPermission] = useState('read');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    if (!newSubject.trim()) return;
    setSaving(true);
    setError('');
    try {
      const updated = [...subjects, { subject: newSubject.trim(), permission: newPermission }];
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/artifacts/feeds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...feed,
          spec: {
            ...(feed.spec || {}),
            accessPolicy: { ...(feed.spec?.accessPolicy || {}), subjects: updated },
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setSubjects(updated);
      setNewSubject('');
      setNewPermission('read');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(index) {
    setSaving(true);
    setError('');
    try {
      const updated = subjects.filter((_, i) => i !== index);
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/artifacts/feeds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...feed,
          spec: {
            ...(feed.spec || {}),
            accessPolicy: { ...(feed.spec?.accessPolicy || {}), subjects: updated },
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setSubjects(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={cardStyle}>
      <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Access policy: {feedName}</h4>
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {subjects.length === 0 ? (
        <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '0.375rem', color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center' }}>
          No access subjects configured. Default access policy applies.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {subjects.map((entry, idx) => (
            <div key={`${entry.subject}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', background: 'var(--bg-subtle)', borderRadius: '0.25rem' }}>
              <strong style={{ flex: 1, fontSize: '0.8125rem' }}>{entry.subject}</strong>
              <span style={pillStyle(entry.permission === 'admin' ? 'warn' : entry.permission === 'write' ? 'good' : 'neutral')}>{entry.permission}</span>
              <button style={btnDanger} onClick={() => handleRemove(idx)} disabled={saving}>Remove</button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={labelStyle}>Subject</label>
          <input style={inputStyle} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="user or team name" required />
        </div>
        <div style={{ minWidth: '100px' }}>
          <label style={labelStyle}>Permission</label>
          <select style={inputStyle} value={newPermission} onChange={(e) => setNewPermission(e.target.value)}>
            <option value="read">read</option>
            <option value="write">write</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <button type="submit" style={btnPrimary} disabled={saving || !newSubject.trim()}>
          {saving ? 'Adding...' : 'Add'}
        </button>
      </form>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

// ── Main export: ArtifactRegistryManager ─────────────────────────────
export function ArtifactRegistryManager({ org, registries: initialRegistries = [], feeds: initialFeeds = [], externalProviders = [] }) {
  const [registries, setRegistries] = useState(initialRegistries);
  const [feeds] = useState(initialFeeds);
  const [selectedRegistry, setSelectedRegistry] = useState(null);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [view, setView] = useState('list'); // list | detail | versions

  function handleRegistryCreated(result) {
    const item = result?.items?.[0] || result;
    if (item?.metadata?.name) setRegistries((prev) => [...prev, item]);
    else window.location.reload();
  }

  function handleSelectRegistry(registry) {
    setSelectedRegistry(registry);
    setSelectedFeed(null);
    setView('detail');
  }

  function handleSelectFeed(feed) {
    setSelectedFeed(feed);
    setView('versions');
  }

  function handleBack() {
    if (view === 'versions') {
      setSelectedFeed(null);
      setView('detail');
    } else {
      setSelectedRegistry(null);
      setView('list');
    }
  }

  // ── Versions view ──────────────────────────────────────────────────
  if (view === 'versions' && selectedFeed) {
    const regType = selectedRegistry?.spec?.registryType || 'generic';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <VersionList org={org} feed={selectedFeed} registryType={regType} onBack={handleBack} />
        <AccessPolicyManager org={org} feed={selectedFeed} />
      </div>
    );
  }

  // ── Registry detail view (feed browser) ────────────────────────────
  if (view === 'detail' && selectedRegistry) {
    const regName = selectedRegistry.metadata?.name || 'unnamed';
    const regFeeds = feeds.filter((f) => f.spec?.registryRef === regName);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button style={btnSecondary} onClick={handleBack}>Back to registries</button>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{regName}</h3>
          <span style={pillStyle('neutral')}>{selectedRegistry.spec?.registryType || 'generic'}</span>
        </div>
        <FeedBrowser org={org} feeds={regFeeds} registries={registries} onSelectFeed={handleSelectFeed} />
      </div>
    );
  }

  // ── Registry list view ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <section className="routeGrid two" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Artifact registries</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{registries.length} configured</p>
            </div>
          </div>

          {registries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No artifact registries configured. Create one to start managing packages and build artifacts.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {registries.map((registry) => (
                <RegistryCard key={registry.metadata?.name} registry={registry} feeds={feeds} onSelect={handleSelectRegistry} />
              ))}
            </div>
          )}

          {feeds.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600 }}>All feeds</h3>
              <FeedBrowser org={org} feeds={feeds} registries={registries} onSelectFeed={(f) => {
                const reg = registries.find((r) => r.metadata?.name === f.spec?.registryRef);
                if (reg) setSelectedRegistry(reg);
                handleSelectFeed(f);
              }} />
            </div>
          )}
        </div>

        <CreateRegistryForm org={org} onCreated={handleRegistryCreated} externalProviders={externalProviders} />
      </section>
    </div>
  );
}
