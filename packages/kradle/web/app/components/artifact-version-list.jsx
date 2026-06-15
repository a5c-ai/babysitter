'use client';

import { useState } from 'react';
import {
  cardStyle,
  btnPrimary,
  btnSecondary,
  btnDanger,
  inputStyle,
  labelStyle,
  metaStyle,
  pillStyle,
  CopyableCode,
  ErrorBanner,
  installCommand,
  formatSize,
} from './artifact-registry-helpers.jsx';

// ── Version list table ───────────────────────────────────────────────
export function VersionList({ org, feed, registryType, onBack }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [confirmDeleteVersion, setConfirmDeleteVersion] = useState(null);

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
    if (confirmDeleteVersion !== versionName) { setConfirmDeleteVersion(versionName); return; }
    setConfirmDeleteVersion(null);
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
        <button style={btnSecondary} onClick={onBack} aria-label="Back to feeds">Back</button>
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
                  {confirmDeleteVersion === v.metadata?.name ? (
                    <>
                      <button
                        style={{ ...btnDanger, color: '#fff', backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                        onClick={() => handleDelete(v.metadata?.name)}
                        aria-label={`Confirm delete version ${name}`}
                      >
                        Confirm
                      </button>
                      <button
                        style={btnSecondary}
                        onClick={() => setConfirmDeleteVersion(null)}
                        aria-label="Cancel delete"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      style={btnDanger}
                      onClick={() => handleDelete(v.metadata?.name)}
                      disabled={deleting === v.metadata?.name}
                      aria-label={`Delete version ${name}`}
                    >
                      {deleting === v.metadata?.name ? '...' : 'Delete'}
                    </button>
                  )}
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
export function AccessPolicyManager({ org, feed }) {
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
              <button style={btnDanger} onClick={() => handleRemove(idx)} disabled={saving} aria-label={`Remove access for ${entry.subject}`}>Remove</button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} aria-label="Add access policy subject" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={labelStyle}>Subject</label>
          <input style={inputStyle} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="user or team name" required aria-label="Subject name" />
        </div>
        <div style={{ minWidth: '100px' }}>
          <label style={labelStyle}>Permission</label>
          <select style={inputStyle} value={newPermission} onChange={(e) => setNewPermission(e.target.value)} aria-label="Permission level">
            <option value="read">read</option>
            <option value="write">write</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <button type="submit" style={btnPrimary} disabled={saving || !newSubject.trim()} aria-label={saving ? 'Adding subject' : 'Add access subject'}>
          {saving ? 'Adding...' : 'Add'}
        </button>
      </form>
    </div>
  );
}
