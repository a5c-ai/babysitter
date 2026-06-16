'use client';

import { useState, useEffect, useMemo } from 'react';
import { CURATED_MODELS, MODEL_CATEGORIES } from '../../lib/model-catalog-data.js';
import {
  cardStyle, btnStyle, btnOutlineStyle, badgeStyle,
  overlayStyle, panelStyle,
  CATEGORY_COLORS,
  FrameworkBadge,
} from './inference-helpers.jsx';
import { ProviderBadge, RouteTypeBadge, CatalogStatusPill } from './model-route-manager.jsx';

// ─── Unified Model Catalog Section (API-fetched) ───────────────────────────

export function UnifiedModelCatalogSection({ org }) {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orgs/${org}/inference/catalog`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!cancelled) setCatalog(data); })
      .catch((e) => { console.warn('[kradle] unified catalog fetch failed:', e.message ?? e); if (!cancelled) setCatalog(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [org]);

  const { internalCount, externalCount } = useMemo(() => {
    if (!catalog?.models?.length) return { internalCount: 0, externalCount: 0 };
    return {
      internalCount: catalog.models.filter(m => m.type === 'internal').length,
      externalCount: catalog.models.filter(m => m.type === 'external').length,
    };
  }, [catalog]);

  if (loading) return <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>Loading catalog...</div>;
  if (!catalog || !catalog.models?.length) return null;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>Unified Model Catalog</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{internalCount} internal + {externalCount} external models</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.625rem' }}>
        {catalog.models.map((m) => (
          <div key={[m.provider, m.type, m.name].filter(Boolean).join(':')} style={{ ...cardStyle, padding: '0.75rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.name}</div>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <ProviderBadge provider={m.provider} />
              <RouteTypeBadge type={m.type} />
              <CatalogStatusPill status={m.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Curated Model Catalog ─────────────────────────────────────────────────

export function CuratedModelCatalog({ org, services, onDeploy }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [deployTarget, setDeployTarget] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);
  const [hideDeployed, setHideDeployed] = useState(false);

  // Build a set of deployed model IDs by matching on service name
  const deployedNames = useMemo(() => new Set(
    (services || []).map(s => (s.metadata?.name || s.name || '').toLowerCase())
  ), [services]);

  const isDeployed = (model) => deployedNames.has(model.id.toLowerCase());

  const filtered = useMemo(() => CURATED_MODELS.filter(m => {
    if (activeCategory !== 'All' && m.category !== activeCategory) return false;
    if (hideDeployed && deployedNames.has(m.id.toLowerCase())) return false;
    return true;
  }), [activeCategory, hideDeployed, deployedNames]);

  const handleDeploy = async (model) => {
    setDeploying(true);
    setDeployResult(null);
    try {
      const body = {
        name: model.id,
        modelFormat: model.modelFormat,
        storageUri: model.storageUri,
        runtime: model.runtime || undefined,
        protocolVersion: 'v2',
        resources: {
          limits: {
            cpu: model.gpu ? '4' : '1',
            memory: model.minMemory || '2Gi',
            ...(model.gpu && model.minGpu ? { 'nvidia.com/gpu': String(model.minGpu) } : {}),
          },
        },
      };
      const res = await fetch(`/api/orgs/${org}/inference/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed with status ${res.status}`);
      }
      // Auto-create a model route so it's immediately available through the gateway
      let routeWarning = null;
      const routeRes = await fetch(`/api/orgs/${org}/inference/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `route-${model.id}`,
          modelName: model.name,
          routeType: 'internal',
          inferenceServiceRef: model.id,
          protocol: 'v2',
        }),
      });
      if (!routeRes.ok) {
        const err = await routeRes.json().catch(() => ({}));
        routeWarning = err.message || `Model route creation failed with status ${routeRes.status}`;
      }
      setDeployResult({ success: true, model, routeWarning });
      if (onDeploy) onDeploy();
    } catch (err) {
      setDeployResult({ success: false, error: err.message });
    } finally {
      setDeploying(false);
    }
  };

  const categoryPillStyle = (cat, active) => {
    const color = cat === 'All' ? 'var(--text-secondary)' : (CATEGORY_COLORS[cat] || 'var(--text-muted)');
    return {
      padding: '0.375rem 0.875rem',
      borderRadius: '9999px',
      border: `1px solid ${active ? color : 'var(--border)'}`,
      background: active ? `color-mix(in srgb, ${color} 12%, transparent)` : 'var(--surface)',
      color: active ? color : 'var(--text-muted)',
      fontSize: '0.8125rem',
      fontWeight: active ? 700 : 500,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    };
  };

  const gpuBadge = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '0.6875rem',
    padding: '2px 8px',
    borderRadius: '9999px',
    background: 'color-mix(in srgb, var(--warning) 13%, transparent)',
    color: 'var(--warning)',
    fontWeight: 600,
    border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)',
  };

  const cpuBadge = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '0.6875rem',
    padding: '2px 8px',
    borderRadius: '9999px',
    background: 'color-mix(in srgb, var(--success) 13%, transparent)',
    color: 'var(--success)',
    fontWeight: 600,
    border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)',
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', letterSpacing: '-0.01em' }}>Model Catalog</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Browse {CURATED_MODELS.length} curated open models and deploy to your cluster with one click.
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={hideDeployed}
            onChange={e => setHideDeployed(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          Hide deployed
        </label>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          style={categoryPillStyle('All', activeCategory === 'All')}
          onClick={() => setActiveCategory('All')}
          aria-label="Filter models: show all categories"
          aria-pressed={activeCategory === 'All'}
        >
          All
        </button>
        {MODEL_CATEGORIES.map(cat => (
          <button
            key={cat}
            style={categoryPillStyle(cat, activeCategory === cat)}
            onClick={() => setActiveCategory(cat)}
            aria-label={`Filter models by category: ${cat}`}
            aria-pressed={activeCategory === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Model grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {filtered.map(model => {
          const deployed = isDeployed(model);
          const catColor = CATEGORY_COLORS[model.category] || 'var(--text-muted)';
          return (
            <div
              key={model.id}
              style={{
                ...cardStyle,
                padding: '1rem',
                position: 'relative',
                borderColor: deployed ? 'color-mix(in srgb, var(--success) 25%, transparent)' : 'var(--border)',
                background: deployed ? 'color-mix(in srgb, var(--success) 8%, var(--surface))' : 'var(--surface)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={e => { if (!deployed) e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = deployed ? 'color-mix(in srgb, var(--success) 25%, transparent)' : 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Top row: name + provider */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>{model.name}</div>
                <span style={badgeStyle(catColor)}>{model.category}</span>
              </div>

              {/* Provider */}
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{model.provider}</div>

              {/* Description */}
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.75rem', minHeight: '2.5em' }}>
                {model.description}
              </div>

              {/* Resource badges */}
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {model.gpu ? (
                  <span style={gpuBadge}>
                    GPU x{model.minGpu}
                  </span>
                ) : (
                  <span style={cpuBadge}>
                    CPU only
                  </span>
                )}
                <span style={{ ...badgeStyle('var(--text-muted)'), fontSize: '0.6875rem' }}>{model.minMemory}</span>
                <FrameworkBadge format={model.modelFormat} />
              </div>

              {/* Action button */}
              {deployed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--success)' }}>Deployed</span>
                </div>
              ) : (
                <button
                  style={{ ...btnStyle('var(--accent)'), width: '100%', padding: '0.5rem' }}
                  onClick={() => { setDeployTarget(model); setDeployResult(null); }}
                  aria-label={`Deploy model ${model.name}`}
                >
                  Deploy
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No models match the current filter.
        </div>
      )}

      {/* Deploy confirmation panel */}
      {deployTarget && (
        <div style={overlayStyle} role="dialog" aria-label={`Deploy confirmation for ${deployTarget.name}`} onClick={e => { if (e.target === e.currentTarget) { setDeployTarget(null); setDeployResult(null); } }}>
          <div style={{ ...panelStyle, maxWidth: '480px', minHeight: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Deploy {deployTarget.name}</h2>
              <button style={btnOutlineStyle} onClick={() => { setDeployTarget(null); setDeployResult(null); }}>Cancel</button>
            </div>

            {deployResult?.success ? (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '0.375rem' }}>Service created successfully</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text)' }}>
                    <strong>{deployResult.model.name}</strong> is being deployed. It may take a few minutes to become ready.
                  </div>
                </div>
                {deployResult.routeWarning && (
                  <div style={{ background: 'color-mix(in srgb, var(--warning) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 35%, transparent)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.8125rem', color: 'var(--warning)', marginBottom: '1rem' }}>
                    Service deployment started, but the model route was not created: {deployResult.routeWarning}
                  </div>
                )}
                <a
                  href={`/orgs/${org}/inference?service=${encodeURIComponent(deployResult.model.id)}`}
                  style={{ ...btnStyle('var(--accent)'), display: 'inline-block', textDecoration: 'none' }}
                >
                  View Service
                </a>
              </div>
            ) : (
              <>
                <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Model</span>
                    <span style={{ color: 'var(--text)' }}>{deployTarget.name}</span>

                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Provider</span>
                    <span style={{ color: 'var(--text)' }}>{deployTarget.provider}</span>

                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Category</span>
                    <span style={badgeStyle(CATEGORY_COLORS[deployTarget.category] || 'var(--text-muted)')}>{deployTarget.category}</span>

                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Format</span>
                    <span><FrameworkBadge format={deployTarget.modelFormat} /></span>

                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Runtime</span>
                    <code style={{ fontSize: '0.8125rem' }}>{deployTarget.runtime}</code>

                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Storage URI</span>
                    <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{deployTarget.storageUri}</code>

                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>GPU</span>
                    <span>{deployTarget.gpu ? `${deployTarget.minGpu} GPU(s) required` : 'Not required (CPU only)'}</span>

                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Memory</span>
                    <span>{deployTarget.minMemory}</span>
                  </div>
                </div>

                {deployResult?.error && (
                  <div style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.8125rem', color: 'var(--danger)', marginTop: '0.75rem' }}>
                    {deployResult.error}
                  </div>
                )}

                <button
                  style={{ ...btnStyle('var(--accent)'), width: '100%', padding: '0.625rem', marginTop: '1rem', fontSize: '0.875rem' }}
                  onClick={() => handleDeploy(deployTarget)}
                  disabled={deploying}
                  aria-label={`Confirm deploy ${deployTarget.name} to cluster`}
                >
                  {deploying ? 'Deploying...' : 'Deploy to Cluster'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
