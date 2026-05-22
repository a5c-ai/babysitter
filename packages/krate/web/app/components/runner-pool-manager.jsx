'use client';

import { useEffect, useState } from 'react';

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', color: '#374151' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box', background: '#fff' };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };

const STATUS_COLORS = {
  Idle: { color: '#15803d', bg: '#dcfce7', border: '#22c55e' },
  Running: { color: '#1d4ed8', bg: '#dbeafe', border: '#3b82f6' },
  Terminating: { color: '#9a3412', bg: '#ffedd5', border: '#f97316' }
};

function normalizePools(pools) {
  return Array.isArray(pools) ? pools.filter(Boolean) : [];
}

function normalizeRunners(runners) {
  return Array.isArray(runners) ? runners.filter((runner) => runner && typeof runner === 'object') : [];
}

function RunnerStatusBadge({ status = 'Idle' }) {
  const s = STATUS_COLORS[status] || { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' };
  return (
    <span style={{
      display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px',
      fontSize: '0.75rem', fontWeight: 600, color: s.color, background: s.bg
    }}>
      {status}
    </span>
  );
}

function CapacityBar({ used, total, label }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280' }}>
        <span>{label || 'Capacity'}</span>
        <span>{used}/{total} ({pct}%)</span>
      </div>
      <div style={{ height: '0.5rem', borderRadius: '9999px', background: '#e5e7eb', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '9999px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function RunnerRow({ runner }) {
  const safeRunner = runner && typeof runner === 'object' ? runner : {};
  const runnerId = safeRunner.id || safeRunner.name || 'runner';
  const runnerStatus = safeRunner.status || 'Idle';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0',
      borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap'
    }}>
      <code style={{ fontFamily: 'monospace', fontSize: '0.8125rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {runnerId}
      </code>
      <RunnerStatusBadge status={runnerStatus} />
      {safeRunner.runRef && (
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          job: <code style={{ fontFamily: 'monospace' }}>{safeRunner.runRef}</code>
        </span>
      )}
      {safeRunner.image && (
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{safeRunner.image}</span>
      )}
    </div>
  );
}

function PoolCard({ pool, org, onScale, onToggleAutoScale }) {
  const spec = pool?.spec || {};
  const status = pool?.status || {};
  const name = pool?.metadata?.name || 'unknown';
  const warmReplicas = Number(spec.warmReplicas ?? 0);
  const maxReplicas = Number(spec.maxReplicas ?? 0);
  const readyReplicas = Number(status.readyReplicas ?? warmReplicas);
  const activeReplicas = Number(status.activeReplicas ?? 0);
  const autoScale = spec.autoScale ?? false;

  const [expanded, setExpanded] = useState(false);
  const [scaleTo, setScaleTo] = useState(warmReplicas);

  function handleScale(dir) {
    const next = dir === 'up' ? Math.min(maxReplicas, scaleTo + 1) : Math.max(0, scaleTo - 1);
    setScaleTo(next);
    onScale?.(name, next);
  }

  const runners = normalizeRunners(pool?._runners);
  const usedSlots = runners.filter((runner) => runner.status === 'Running').length;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Pool header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{name}</h4>
          <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
            {spec.image || 'ubuntu:24.04'} · {spec.trustTier || 'trusted'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RunnerStatusBadge status={activeReplicas > 0 ? 'Running' : 'Idle'} />
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{ padding: '0.25rem 0.625rem', fontSize: '0.8125rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: '#f9fafb', cursor: 'pointer' }}>
            {expanded ? 'Collapse' : 'Show runners'}
          </button>
        </div>
      </div>

      {/* Capacity bar */}
      <CapacityBar used={usedSlots || activeReplicas} total={maxReplicas} label="Used capacity" />

      {/* Scale controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 600 }}>Warm replicas:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <button
            onClick={() => handleScale('down')}
            disabled={scaleTo <= 0}
            style={{ width: '1.75rem', height: '1.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: '#f9fafb', cursor: scaleTo <= 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>
            −
          </button>
          <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>{scaleTo}</span>
          <button
            onClick={() => handleScale('up')}
            disabled={scaleTo >= maxReplicas}
            style={{ width: '1.75rem', height: '1.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: '#f9fafb', cursor: scaleTo >= maxReplicas ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>
            +
          </button>
        </div>
        <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>max: {maxReplicas}</span>
      </div>

      {/* Auto-scale toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
        <div
          role="switch"
          aria-checked={autoScale}
          onClick={() => onToggleAutoScale?.(name, !autoScale)}
          style={{
            width: '2.25rem', height: '1.25rem', borderRadius: '9999px',
            background: autoScale ? '#2563eb' : '#d1d5db', transition: 'background 0.2s',
            position: 'relative', cursor: 'pointer', flexShrink: 0
          }}>
          <div style={{
            position: 'absolute', top: '0.1875rem', left: autoScale ? '1.125rem' : '0.1875rem',
            width: '0.875rem', height: '0.875rem', borderRadius: '50%',
            background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }} />
        </div>
        <span style={{ fontSize: '0.875rem', color: '#374151' }}>Auto-scale</span>
        {autoScale && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>scales to queue depth</span>}
      </label>

      {/* Runner list (expanded) */}
      {expanded && (
        <div>
          <h5 style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>
            Runners ({runners.length})
          </h5>
          {runners.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#9ca3af' }}>No runners allocated.</p>
          ) : (
            runners.map((runner, index) => <RunnerRow key={runner.id || runner.name || index} runner={runner} />)
          )}
        </div>
      )}
    </div>
  );
}

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
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'RunnerPool',
      metadata: {
        name: form.name,
        namespace: `krate-org-${org}`,
        labels: { 'krate.a5c.ai/trust-tier': form.trustTier }
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
    } catch {
      // Offline: add locally
      const newPool = { ...resource, status: { readyReplicas: form.warmReplicas, activeReplicas: 0 }, _runners: [] };
      setLocalPools((prev) => [...prev, newPool]);
      onPoolChange?.(newPool, 'created');
      setMessage(`Pool "${form.name}" added (offline simulation).`);
      setShowForm(false);
      setForm(DEFAULT_FORM);
    } finally {
      setSaving(false);
    }
  }

  function handleScale(poolName, newWarm) {
    setLocalPools((prev) => prev.map((p) =>
      p.metadata?.name === poolName
        ? { ...p, spec: { ...p.spec, warmReplicas: newWarm } }
        : p
    ));
    onPoolChange?.({ name: poolName, warmReplicas: newWarm }, 'scaled');
  }

  function handleToggleAutoScale(poolName, enabled) {
    setLocalPools((prev) => prev.map((p) =>
      p.metadata?.name === poolName
        ? { ...p, spec: { ...p.spec, autoScale: enabled } }
        : p
    ));
    onPoolChange?.({ name: poolName, autoScale: enabled }, 'auto-scale-toggled');
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
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
            Manage runner capacity, images, and auto-scale settings for CI and agent dispatch.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600,
            background: '#2563eb', color: '#fff', border: 'none',
            borderRadius: '0.375rem', cursor: 'pointer', flexShrink: 0
          }}>
          {showForm ? 'Cancel' : 'New pool'}
        </button>
      </div>

      {/* Create pool form */}
      {showForm && (
        <form onSubmit={handleCreatePool} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

          <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.75rem', margin: 0 }}>
            <legend style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', padding: '0 0.25rem' }}>Resource limits</legend>
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
            <input type="checkbox" checked={form.autoScale} onChange={(e) => setField('autoScale', e.target.checked)} />
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>Enable auto-scale (queue depth)</span>
          </label>

          {message && <p style={{ margin: 0, fontSize: '0.875rem', color: saving ? '#6b7280' : '#15803d' }}>{message}</p>}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" disabled={saving} style={{
              padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600,
              background: saving ? '#9ca3af' : '#2563eb', color: '#fff', border: 'none',
              borderRadius: '0.375rem', cursor: saving ? 'not-allowed' : 'pointer'
            }}>
              {saving ? 'Creating…' : 'Create pool'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); setMessage(''); }} style={{
              padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600,
              background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db',
              borderRadius: '0.375rem', cursor: 'pointer'
            }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Pool list */}
      {localPools.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#6b7280' }}>No runner pools configured</p>
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
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#15803d' }}>{message}</p>
      )}
    </div>
  );
}
