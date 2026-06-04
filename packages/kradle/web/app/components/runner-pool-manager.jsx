'use client';

import { useEffect, useState } from 'react';
import { normalizePools, PoolCard } from './runner-pool-helpers.jsx';

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', color: 'var(--text)' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)', fontSize: '0.875rem', boxSizing: 'border-box', background: 'var(--surface)' };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };

const DEFAULT_FORM = {
  name: '',
  image: 'ubuntu:24.04',
  warmReplicas: 1,
  maxReplicas: 10,
  trustTier: 'trusted',
  cpuLimit: '2',
  memoryLimit: '4Gi',
  cpuRequest: '500m',
  memoryRequest: '1Gi',
  autoScale: false
};

export function RunnerPoolManager({ org = 'default', pools = [], onPoolChange = null }) {
  const [localPools, setLocalPools] = useState(() => normalizePools(pools));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLocalPools(normalizePools(pools));
  }, [pools]);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreatePool(e) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    setMessage('');

    const resource = {
      apiVersion: 'kradle.a5c.ai/v1alpha1',
      kind: 'RunnerPool',
      metadata: {
        name: form.name,
        namespace: `kradle-org-${org}`,
        labels: { 'kradle.a5c.ai/trust-tier': form.trustTier }
      },
      spec: {
        organizationRef: org,
        image: form.image,
        warmReplicas: Number(form.warmReplicas),
        maxReplicas: Number(form.maxReplicas),
        trustTier: form.trustTier,
        autoScale: form.autoScale,
        scalingMetric: 'queueDepth',
        resourceLimits: { cpu: form.cpuLimit, memory: form.memoryLimit },
        resourceRequests: { cpu: form.cpuRequest, memory: form.memoryRequest },
        cache: { type: 'object-storage' }
      }
    };

    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resource)
      });
      if (res.ok) {
        const created = await res.json();
        const newPool = { ...resource, ...created, _runners: [] };
        setLocalPools((prev) => [...prev, newPool]);
        onPoolChange?.(newPool, 'created');
        setMessage(`Pool "${form.name}" created.`);
        setShowForm(false);
        setForm(DEFAULT_FORM);
      } else {
        setMessage('Failed to create pool — check API connectivity.');
      }
    } catch (err) {
      setMessage(`Failed to create pool: ${err.message || 'network error'}`);
      setShowForm(false);
      setForm(DEFAULT_FORM);
    } finally {
      setSaving(false);
    }
  }

  async function handleScale(poolName, newWarm) {
    const prevPools = localPools;
    setLocalPools((prev) => prev.map((p) =>
      p.metadata?.name === poolName
        ? { ...p, spec: { ...p.spec, warmReplicas: newWarm } }
        : p
    ));
    onPoolChange?.({ name: poolName, warmReplicas: newWarm }, 'scaled');
    fetch(`/api/orgs/${encodeURIComponent(org)}/resources/RunnerPool/${encodeURIComponent(poolName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spec: { warmReplicas: newWarm } }),
    }).catch((err) => {
      setMessage(`Failed to scale pool "${poolName}": ${err.message || err}`);
      setLocalPools(prevPools);
    });
  }

  async function handleToggleAutoScale(poolName, enabled) {
    const prevPools = localPools;
    setLocalPools((prev) => prev.map((p) =>
      p.metadata?.name === poolName
        ? { ...p, spec: { ...p.spec, autoScale: enabled } }
        : p
    ));
    onPoolChange?.({ name: poolName, autoScale: enabled }, 'auto-scale-toggled');
    fetch(`/api/orgs/${encodeURIComponent(org)}/resources/RunnerPool/${encodeURIComponent(poolName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spec: { autoScale: enabled } }),
    }).catch((err) => {
      setMessage(`Failed to toggle auto-scale for pool "${poolName}": ${err.message || err}`);
      setLocalPools(prevPools);
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Runner pools</h3>
            <span style={{
              display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px',
              fontSize: '0.75rem', fontWeight: 600, color: localPools.length ? '#15803d' : '#6b7280',
              background: localPools.length ? '#dcfce7' : '#f3f4f6'
            }}>
              {localPools.length} pool{localPools.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Manage runner capacity, images, and auto-scale settings for CI and agent dispatch.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          aria-label={showForm ? 'Cancel creating new pool' : 'Create new runner pool'}
          style={{
            padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600,
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: '0.375rem', cursor: 'pointer', flexShrink: 0
          }}>
          {showForm ? 'Cancel' : 'New pool'}
        </button>
      </div>

      {/* Create pool form */}
      {showForm && (
        <form onSubmit={handleCreatePool} className="card" aria-label="Create runner pool form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Create runner pool</h4>

          <div>
            <label style={labelStyle} htmlFor="pool-name">Pool name *</label>
            <input id="pool-name" style={inputStyle} value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. default-trusted" required />
          </div>

          <div>
            <label style={labelStyle} htmlFor="pool-image">Runner image</label>
            <input id="pool-image" style={inputStyle} value={form.image} onChange={(e) => setField('image', e.target.value)} placeholder="ubuntu:24.04" />
          </div>

          <div style={rowStyle}>
            <div>
              <label style={labelStyle} htmlFor="pool-warm">Warm replicas</label>
              <input id="pool-warm" type="number" min="0" max={form.maxReplicas} style={inputStyle}
                value={form.warmReplicas} onChange={(e) => setField('warmReplicas', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="pool-max">Max replicas</label>
              <input id="pool-max" type="number" min="1" style={inputStyle}
                value={form.maxReplicas} onChange={(e) => setField('maxReplicas', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle} htmlFor="pool-trust">Trust tier</label>
            <select id="pool-trust" style={inputStyle} value={form.trustTier} onChange={(e) => setField('trustTier', e.target.value)}>
              <option value="trusted">trusted</option>
              <option value="untrusted">untrusted</option>
            </select>
          </div>

          <fieldset style={{ border: '1px solid var(--border)', borderRadius: '0.375rem', padding: '0.75rem', margin: 0 }}>
            <legend style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)', padding: '0 0.25rem' }}>Resource limits</legend>
            <div style={rowStyle}>
              <div>
                <label style={labelStyle} htmlFor="pool-cpu-limit">CPU limit</label>
                <input id="pool-cpu-limit" style={inputStyle} value={form.cpuLimit} onChange={(e) => setField('cpuLimit', e.target.value)} placeholder="2" />
              </div>
              <div>
                <label style={labelStyle} htmlFor="pool-mem-limit">Memory limit</label>
                <input id="pool-mem-limit" style={inputStyle} value={form.memoryLimit} onChange={(e) => setField('memoryLimit', e.target.value)} placeholder="4Gi" />
              </div>
              <div>
                <label style={labelStyle} htmlFor="pool-cpu-req">CPU request</label>
                <input id="pool-cpu-req" style={inputStyle} value={form.cpuRequest} onChange={(e) => setField('cpuRequest', e.target.value)} placeholder="500m" />
              </div>
              <div>
                <label style={labelStyle} htmlFor="pool-mem-req">Memory request</label>
                <input id="pool-mem-req" style={inputStyle} value={form.memoryRequest} onChange={(e) => setField('memoryRequest', e.target.value)} placeholder="1Gi" />
              </div>
            </div>
          </fieldset>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={form.autoScale} onChange={(e) => setField('autoScale', e.target.checked)} aria-label="Enable auto-scale" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>Enable auto-scale (queue depth)</span>
          </label>

          {message && <p style={{ margin: 0, fontSize: '0.875rem', color: saving ? '#6b7280' : '#15803d' }}>{message}</p>}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" disabled={saving} aria-label={saving ? 'Creating pool' : 'Submit new pool'} style={{
              padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600,
              background: saving ? '#9ca3af' : '#2563eb', color: '#fff', border: 'none',
              borderRadius: '0.375rem', cursor: saving ? 'not-allowed' : 'pointer'
            }}>
              {saving ? 'Creating…' : 'Create pool'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); setMessage(''); }} aria-label="Cancel pool creation" style={{
              padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600,
              background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)',
              borderRadius: '0.375rem', cursor: 'pointer'
            }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Pool list */}
      {localPools.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-muted)' }}>No runner pools configured</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem' }}>Create a pool to start scheduling CI jobs and agent dispatch runs.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {localPools.map((pool) => (
            <PoolCard
              key={pool?.metadata?.name || pool?.metadata?.uid || pool?.id}
              pool={pool}
              org={org}
              onScale={handleScale}
              onToggleAutoScale={handleToggleAutoScale}
            />
          ))}
        </div>
      )}

      {message && !showForm && (
        <p role={message.startsWith('Failed') ? 'alert' : undefined} style={{ margin: 0, fontSize: '0.875rem', color: message.startsWith('Failed') ? 'var(--danger, #dc2626)' : '#15803d' }}>{message}</p>
      )}
    </div>
  );
}
