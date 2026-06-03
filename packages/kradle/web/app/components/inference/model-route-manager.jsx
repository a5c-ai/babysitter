'use client';

import { useState, useEffect, memo } from 'react';
import {
  relativeTime,
  cardStyle, btnStyle, btnOutlineStyle, inputStyle, labelStyle, badgeStyle,
  ROUTE_TYPE_COLORS, PROVIDER_COLORS, FALLBACK_PROVIDERS,
} from './inference-helpers.jsx';

// ─── Route Type Badge ───────────────────────────────────────────────────────

export const RouteTypeBadge = memo(function RouteTypeBadge({ type }) {
  const color = ROUTE_TYPE_COLORS[type] || '#6b7280';
  return <span style={badgeStyle(color)}>{type || 'unknown'}</span>;
});

// ─── Provider Badge ─────────────────────────────────────────────────────────

export const ProviderBadge = memo(function ProviderBadge({ provider }) {
  const color = PROVIDER_COLORS[provider] || '#6b7280';
  return <span style={badgeStyle(color)}>{provider || 'unknown'}</span>;
});

// ─── Catalog Status Pill ────────────────────────────────────────────────────

export const CatalogStatusPill = memo(function CatalogStatusPill({ status }) {
  const color = status === 'available' ? '#16a34a' : '#d97706';
  return (
    <span style={{ ...badgeStyle(color), fontSize: '0.6875rem' }}>
      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, marginRight: 4, verticalAlign: 'middle' }} />
      {status}
    </span>
  );
});

// ─── Model Route Card ───────────────────────────────────────────────────────

export const ModelRouteCard = memo(function ModelRouteCard({ route, onDelete }) {
  const name = route.metadata?.name || route.name || 'unknown';
  const spec = route.spec || {};
  const routeType = spec.routeType || 'unknown';
  const modelName = spec.modelName || name;
  const provider = routeType === 'external' ? (spec.external?.provider || 'unknown') : 'kserve';
  const enabled = spec.enabled !== false;
  const createdAt = route.metadata?.creationTimestamp;

  return (
    <div style={{ ...cardStyle, opacity: enabled ? 1 : 0.6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{name}</span>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <RouteTypeBadge type={routeType} />
          <ProviderBadge provider={provider} />
          {!enabled && <span style={badgeStyle('#9ca3af')}>disabled</span>}
        </div>
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text)' }}>
        Model: <strong>{modelName}</strong>
      </div>
      {routeType === 'internal' && spec.inferenceServiceRef && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Service: {spec.inferenceServiceRef}</div>
      )}
      {routeType === 'external' && spec.external?.endpoint && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Endpoint: {spec.external.endpoint}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{createdAt ? relativeTime(createdAt) : ''}</span>
        <button style={btnStyle('#dc2626')} onClick={() => onDelete(route)} aria-label={`Delete model route ${name}`}>Delete</button>
      </div>
    </div>
  );
});

// ─── Create Model Route Form ────────────────────────────────────────────────

export function CreateModelRouteForm({ org, services, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    modelName: '',
    routeType: 'internal',
    inferenceServiceRef: '',
    protocol: 'v2',
    provider: 'openai',
    endpoint: '',
    modelId: '',
    authSecretRef: '',
    priority: '',
    rpmLimit: '',
    tpmLimit: '',
  });
  const [providerOptions, setProviderOptions] = useState(FALLBACK_PROVIDERS);

  useEffect(() => {
    let cancelled = false;
    async function loadProviders() {
      const seen = new Set(FALLBACK_PROVIDERS);
      const merged = [...FALLBACK_PROVIDERS];
      // Fetch from AgentProviderConfig resources
      try {
        const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources?kind=AgentProviderConfig`);
        if (res.ok) {
          const data = await res.json();
          for (const item of (data?.items || data || [])) {
            const p = item?.spec?.provider;
            if (p && !seen.has(p)) { seen.add(p); merged.push(p); }
          }
        }
      } catch (err) { console.warn('Failed to load AgentProviderConfig resources:', err.message || err); }
      // Fetch from Atlas graph (Provider kind)
      try {
        const res = await fetch(`/api/atlas/search?q=&kinds=Provider,ModelProviderProduct&limit=50`);
        if (res.ok) {
          const data = await res.json();
          for (const hit of (data?.hits || [])) {
            const name = (hit?.displayName || hit?.id || '').toLowerCase().replace(/\s+/g, '-');
            if (name && !seen.has(name)) { seen.add(name); merged.push(name); }
          }
        }
      } catch (err) { console.warn('Failed to load Atlas provider data:', err.message || err); }
      if (!cancelled) setProviderOptions(merged);
    }
    if (org) loadProviders();
    return () => { cancelled = true; };
  }, [org]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = {
      modelName: form.modelName,
      routeType: form.routeType,
    };
    if (form.routeType === 'internal') {
      body.inferenceServiceRef = form.inferenceServiceRef;
      body.protocol = form.protocol;
    } else {
      body.provider = form.provider;
      body.endpoint = form.endpoint;
      body.modelId = form.modelId || form.modelName;
      body.protocol = form.provider === 'anthropic' ? 'anthropic' : 'openai';
      if (form.authSecretRef) body.authSecretRef = form.authSecretRef;
    }
    if (form.priority) body.priority = Number(form.priority);
    if (form.rpmLimit || form.tpmLimit) {
      body.rateLimits = {};
      if (form.rpmLimit) body.rateLimits.requestsPerMinute = Number(form.rpmLimit);
      if (form.tpmLimit) body.rateLimits.tokensPerMinute = Number(form.tpmLimit);
    }
    onSubmit(body);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <label style={labelStyle}>Model Name *</label>
        <input style={inputStyle} value={form.modelName} onChange={set('modelName')} required placeholder="claude-3-5-sonnet" />
      </div>
      <div>
        <label style={labelStyle}>Route Type</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['internal', 'external'].map(t => (
            <button
              key={t}
              type="button"
              style={{
                ...btnOutlineStyle,
                background: form.routeType === t ? (t === 'internal' ? '#2563eb' : '#7c3aed') : '#fff',
                color: form.routeType === t ? '#fff' : '#374151',
                borderColor: form.routeType === t ? 'transparent' : '#d1d5db',
              }}
              onClick={() => setForm(f => ({ ...f, routeType: t }))}
              aria-label={`Set route type to ${t}`}
              aria-pressed={form.routeType === t}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {form.routeType === 'internal' && (
        <>
          <div>
            <label style={labelStyle}>Inference Service *</label>
            <select style={inputStyle} value={form.inferenceServiceRef} onChange={set('inferenceServiceRef')} required>
              <option value="">Select a service...</option>
              {(services || []).map(svc => {
                const n = svc.metadata?.name || svc.name;
                return <option key={n} value={n}>{n}</option>;
              })}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Protocol</label>
            <select style={inputStyle} value={form.protocol} onChange={set('protocol')}>
              <option value="v2">V2 (gRPC/HTTP)</option>
              <option value="v1">V1 (REST)</option>
            </select>
          </div>
        </>
      )}

      {form.routeType === 'external' && (
        <>
          <div>
            <label style={labelStyle}>Provider *</label>
            <select style={inputStyle} value={form.provider} onChange={set('provider')}>
              {providerOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Endpoint URL *</label>
            <input style={inputStyle} value={form.endpoint} onChange={set('endpoint')} required placeholder="https://api.openai.com/v1" />
          </div>
          <div>
            <label style={labelStyle}>Model ID</label>
            <input style={inputStyle} value={form.modelId} onChange={set('modelId')} placeholder="gpt-4o (defaults to model name)" />
          </div>
          <div>
            <label style={labelStyle}>Auth Secret Ref</label>
            <input style={inputStyle} value={form.authSecretRef} onChange={set('authSecretRef')} placeholder="secret-name (AgentSecretGrant)" />
          </div>
        </>
      )}

      <div>
        <label style={labelStyle}>Priority (optional)</label>
        <input style={inputStyle} type="number" value={form.priority} onChange={set('priority')} placeholder="0" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <label style={labelStyle}>RPM Limit</label>
          <input style={inputStyle} type="number" value={form.rpmLimit} onChange={set('rpmLimit')} placeholder="Optional" />
        </div>
        <div>
          <label style={labelStyle}>TPM Limit</label>
          <input style={inputStyle} type="number" value={form.tpmLimit} onChange={set('tpmLimit')} placeholder="Optional" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button type="submit" style={btnStyle()} disabled={loading}>{loading ? 'Creating...' : 'Create Route'}</button>
        <button type="button" style={btnOutlineStyle} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
