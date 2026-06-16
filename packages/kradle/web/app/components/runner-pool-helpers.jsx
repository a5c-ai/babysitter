'use client';

// ---------------------------------------------------------------------------
// runner-pool-helpers.jsx — presentational sub-components for runner pool
// management: PoolCard, RunnerRow, CapacityBar, RunnerStatusBadge.
// ---------------------------------------------------------------------------

import { useState } from 'react';

// ── Constants ──────────────────────────────────────────────────────────────

export const STATUS_COLORS = {
  Idle: { color: 'var(--success)', bg: 'var(--surface-raised)', border: 'var(--success)' },
  Running: { color: 'var(--accent)', bg: 'var(--surface-raised)', border: 'var(--accent)' },
  Terminating: { color: 'var(--warning)', bg: 'var(--surface-raised)', border: 'var(--warning)' }
};

// ── Normalization utilities ────────────────────────────────────────────────

export function normalizePools(pools) {
  return Array.isArray(pools) ? pools.filter(Boolean) : [];
}

export function normalizeRunners(runners) {
  return Array.isArray(runners) ? runners.filter((runner) => runner && typeof runner === 'object') : [];
}

// ── RunnerStatusBadge ──────────────────────────────────────────────────────

export function RunnerStatusBadge({ status = 'Idle' }) {
  const s = STATUS_COLORS[status] || { color: 'var(--text-muted)', bg: 'var(--surface-raised)', border: 'var(--border)' };
  return (
    <span
      aria-label={`Runner status: ${status}`}
      style={{
        display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px',
        fontSize: '0.75rem', fontWeight: 600, color: s.color, background: s.bg
      }}
    >
      {status}
    </span>
  );
}

// ── CapacityBar ────────────────────────────────────────────────────────────

export function CapacityBar({ used, total, label }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const barColor = pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--success)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>{label || 'Capacity'}</span>
        <span>{used}/{total} ({pct}%)</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label || 'Capacity'}: ${pct}%`}
        style={{ height: '0.5rem', borderRadius: '9999px', background: 'var(--surface-raised)', overflow: 'hidden' }}
      >
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '9999px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

// ── RunnerRow ──────────────────────────────────────────────────────────────

export function RunnerRow({ runner }) {
  const safeRunner = runner && typeof runner === 'object' ? runner : {};
  const runnerId = safeRunner.id || safeRunner.name || 'runner';
  const runnerStatus = safeRunner.status || 'Idle';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0',
      borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap'
    }}>
      <code style={{ fontFamily: 'monospace', fontSize: '0.8125rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {runnerId}
      </code>
      <RunnerStatusBadge status={runnerStatus} />
      {safeRunner.runRef && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          job: <code style={{ fontFamily: 'monospace' }}>{safeRunner.runRef}</code>
        </span>
      )}
      {safeRunner.image && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{safeRunner.image}</span>
      )}
    </div>
  );
}

// ── PoolCard ───────────────────────────────────────────────────────────────

export function PoolCard({ pool, org, onScale, onToggleAutoScale }) {
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
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {spec.image || 'ubuntu:24.04'} · {spec.trustTier || 'trusted'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RunnerStatusBadge status={activeReplicas > 0 ? 'Running' : 'Idle'} />
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? `Collapse runners for pool ${name}` : `Show runners for pool ${name}`}
            style={{ padding: '0.25rem 0.625rem', fontSize: '0.8125rem', border: '1px solid var(--border)', borderRadius: '0.375rem', background: 'var(--bg-subtle)', cursor: 'pointer' }}>
            {expanded ? 'Collapse' : 'Show runners'}
          </button>
        </div>
      </div>

      {/* Capacity bar */}
      <CapacityBar used={usedSlots || activeReplicas} total={maxReplicas} label="Used capacity" />

      {/* Scale controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 600 }}>Warm replicas:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <button
            onClick={() => handleScale('down')}
            disabled={scaleTo <= 0}
            aria-label={`Decrease warm replicas for pool ${name}`}
            style={{ width: '1.75rem', height: '1.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', background: 'var(--bg-subtle)', cursor: scaleTo <= 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>
            −
          </button>
          <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>{scaleTo}</span>
          <button
            onClick={() => handleScale('up')}
            disabled={scaleTo >= maxReplicas}
            aria-label={`Increase warm replicas for pool ${name}`}
            style={{ width: '1.75rem', height: '1.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', background: 'var(--bg-subtle)', cursor: scaleTo >= maxReplicas ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>
            +
          </button>
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>max: {maxReplicas}</span>
      </div>

      {/* Auto-scale toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
        <div
          role="switch"
          aria-checked={autoScale}
          aria-label={`Toggle auto-scale for pool ${name}`}
          onClick={() => onToggleAutoScale?.(name, !autoScale)}
          style={{
            width: '2.25rem', height: '1.25rem', borderRadius: '9999px',
            background: autoScale ? 'var(--accent)' : 'var(--surface-overlay)', transition: 'background 0.2s',
            position: 'relative', cursor: 'pointer', flexShrink: 0
          }}>
          <div style={{
            position: 'absolute', top: '0.1875rem', left: autoScale ? '1.125rem' : '0.1875rem',
            width: '0.875rem', height: '0.875rem', borderRadius: '50%',
            background: 'var(--surface)', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }} />
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>Auto-scale</span>
        {autoScale && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>scales to queue depth</span>}
      </label>

      {/* Runner list (expanded) */}
      {expanded && (
        <div>
          <h5 style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>
            Runners ({runners.length})
          </h5>
          {runners.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No runners allocated.</p>
          ) : (
            runners.map((runner, index) => <RunnerRow key={runner.id || runner.name || index} runner={runner} />)
          )}
        </div>
      )}
    </div>
  );
}
