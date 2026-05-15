'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const STATUS_COLORS = {
  ok: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  unknown: '#9ca3af',
  notConfigured: '#9ca3af',
};

function StatusDot({ status }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.unknown;
  return (
    <span style={{
      display: 'inline-block',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
    }} />
  );
}

function StatusRow({ label, status, text }) {
  const statusText = text || (status === 'ok' ? 'Connected' : status === 'notConfigured' ? 'Not configured' : status === 'error' ? 'Error' : 'Unknown');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0', borderBottom: '1px solid var(--line, #d0d7de)' }}>
      <StatusDot status={status} />
      <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--ink-pigment, #24292f)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.8125rem', color: 'var(--ink-ghost, #8c959f)' }}>{statusText}</span>
    </div>
  );
}

function timeAgoSeconds(date) {
  if (!date) return 'never';
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

export function HealthMonitor({ org }) {
  const [health, setHealth] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(30);

  const esRef = useRef(null);
  const retryDelayRef = useRef(1000);
  const retryTimerRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const fetchHealth = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    setError(null);
    const start = Date.now();
    try {
      const res = await fetch(`/api/orgs/${org}/snapshot`);
      const elapsed = Date.now() - start;
      setLatencyMs(elapsed);
      if (res.ok) {
        const data = await res.json();
        setHealth(data.health || data);
        setLastFetched(new Date().toISOString());
        setCountdown(30);
      } else {
        setError(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  }, [org]);

  // Initial fetch + 30s interval
  useEffect(() => {
    fetchHealth();

    refreshIntervalRef.current = setInterval(() => {
      fetchHealth();
    }, 30000);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 30;
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(refreshIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, [fetchHealth]);

  // SSE connection for live status
  useEffect(() => {
    if (!org) return;

    function connect() {
      const es = new EventSource(`/api/orgs/${org}/agents/events/stream`);
      esRef.current = es;

      es.onopen = () => {
        setSseConnected(true);
        retryDelayRef.current = 1000;
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') setSseConnected(true);
          // Trigger refresh on health-related events
          if (data.type && (data.type.includes('Health') || data.type.includes('Connectivity'))) {
            fetchHealth();
          }
        } catch {
          // ignore
        }
      };

      es.onerror = () => {
        setSseConnected(false);
        es.close();
        esRef.current = null;
        const delay = Math.min(retryDelayRef.current, 30000);
        retryDelayRef.current = Math.min(delay * 2, 30000);
        retryTimerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [org, fetchHealth]);

  function getStatus(value) {
    if (value === true || value === 'ok' || value === 'connected') return 'ok';
    if (value === false || value === 'error' || value === 'failed') return 'error';
    if (value === null || value === undefined || value === false) return 'notConfigured';
    if (typeof value === 'object' && value !== null) return value.status || 'ok';
    return 'unknown';
  }

  const k8sStatus = health ? getStatus(health.kubernetes) : 'unknown';
  const giteaStatus = health ? (health.gitea === false || health.gitea === null ? 'notConfigured' : getStatus(health.gitea)) : 'unknown';
  const muxStatus = health ? (health.agentMux === false || health.agentGateway === false || (health.agentMux === undefined && health.agentGateway === undefined) ? 'notConfigured' : getStatus(health.agentMux || health.agentGateway)) : 'unknown';

  const externalProviders = health?.externalProviders || [];

  return (
    <div style={{
      background: 'var(--surface, #fff)',
      border: '1px solid var(--line, #d0d7de)',
      borderRadius: '8px',
      overflow: 'hidden',
      maxWidth: '480px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        borderBottom: '1px solid var(--line, #d0d7de)',
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--ink-pigment, #24292f)' }}>
          System Health
        </h3>
        <button
          type="button"
          onClick={fetchHealth}
          disabled={loading}
          style={{
            padding: '0.25rem 0.625rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--line, #d0d7de)',
            background: 'var(--surface, #fff)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.75rem',
            color: 'var(--ink-pigment, #24292f)',
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Status rows */}
      <div style={{ padding: '0 1rem' }}>
        {error ? (
          <div style={{ padding: '1rem 0', color: '#ef4444', fontSize: '0.875rem' }}>
            Unable to fetch health data: {error}
            <button
              type="button"
              onClick={fetchHealth}
              style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #ef4444', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', color: '#ef4444' }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <StatusRow label="Kubernetes" status={k8sStatus} />
            <StatusRow label="Gitea" status={giteaStatus} />
            <StatusRow label="Agent Mux Gateway" status={muxStatus} />
            {externalProviders.map((provider, i) => (
              <StatusRow
                key={provider.name || i}
                label={`Provider: ${provider.name || provider.type || 'unknown'}`}
                status={getStatus(provider.status || provider.connected)}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0.625rem 1rem',
        borderTop: '1px solid var(--line, #d0d7de)',
        background: 'var(--surface-raised, #f6f8fa)',
        fontSize: '0.75rem',
        color: 'var(--ink-ghost, #8c959f)',
      }}>
        <span>Last updated: {timeAgoSeconds(lastFetched)}</span>
        {latencyMs !== null && <span>Latency: {latencyMs}ms</span>}
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: sseConnected ? '#22c55e' : '#ef4444',
            display: 'inline-block',
          }} />
          {sseConnected ? 'Live' : 'Disconnected'}
        </span>
        <span>Refreshing in {countdown}s</span>
      </div>
    </div>
  );
}
