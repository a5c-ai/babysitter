'use client';

import { useState } from 'react';
import {
  STACK_LAYERS, COMPOSITION_FACETS,
  labelStyle, inputStyle, textareaStyle,
  buildStackResource,
} from './stack-builder-graph-styles.jsx';
import { LayerSection, ToolsLayerSection } from './stack-builder-graph-nodes.jsx';
import { MemoryRepositorySection, ModelInferenceSection } from './stack-builder-graph-panels.jsx';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GraphStackBuilder({ org, atlasBaseUrl, existingStack = null }) {
  const isEditing = !!existingStack;
  const spec = existingStack?.spec || {};
  const meta = existingStack?.metadata || {};

  // Basic fields (same as original StackBuilder)
  const [name, setName] = useState(meta.name || '');
  const [displayName, setDisplayName] = useState(meta.labels?.['krate.a5c.ai/display-name'] || spec.displayName || '');
  const [systemPrompt, setSystemPrompt] = useState(spec.systemPrompt || '');
  const [developerPrompt, setDeveloperPrompt] = useState(spec.developerPrompt || '');
  const [taskPrompt, setTaskPrompt] = useState(spec.taskPrompt || '');

  // RBAC fields
  const [serviceAccount, setServiceAccount] = useState(spec.runtimeIdentity?.serviceAccountRef || 'default');
  const [role, setRole] = useState(spec.runtimeIdentity?.roleRef || 'edit');
  const [rbacNamespace, setRbacNamespace] = useState(spec.runtimeIdentity?.namespace || `krate-org-${org}`);

  // Per-layer selections: { 'layer:1-model': [{ id, nodeKind, displayName, ... }], ... }
  const [selections, setSelections] = useState(() => {
    const init = {};
    for (const layer of [...STACK_LAYERS, ...COMPOSITION_FACETS]) {
      init[layer.key] = [];
    }
    return init;
  });

  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  // Memory repository selections: [{ name, url }, ...]
  const [selectedMemoryRepos, setSelectedMemoryRepos] = useState(() => {
    const existing = spec.memoryRepositoryRefs || [];
    return existing.map((ref) => ({ name: ref, url: '' }));
  });

  // KServe inference service selection
  const [selectedInference, setSelectedInference] = useState(null);

  // Use the proxy route to avoid CORS
  const atlasProxyUrl = '/api/atlas/search';

  // Toggle a record selection in a layer
  function handleToggle(layerKey, record) {
    setSelections((prev) => {
      const current = prev[layerKey] || [];
      const exists = current.some((r) => r.id === record.id);
      return {
        ...prev,
        [layerKey]: exists
          ? current.filter((r) => r.id !== record.id)
          : [...current, { id: record.id, nodeKind: record.nodeKind, displayName: record.displayName || record.id }],
      };
    });
  }

  function handleToggleMemoryRepo(repo) {
    setSelectedMemoryRepos((prev) => {
      const exists = prev.some((r) => r.name === repo.name);
      return exists ? prev.filter((r) => r.name !== repo.name) : [...prev, repo];
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name) {
      setStatus('error');
      setMessage('Stack name is required.');
      return;
    }
    setStatus('saving');
    setMessage('');

    const resource = buildStackResource({
      name, displayName, systemPrompt, developerPrompt, taskPrompt,
      serviceAccount, role, rbacNamespace, org,
      selections, selectedMemoryRepos, selectedInference,
    });

    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resource),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setStatus('error');
        setMessage(data.message || data.reason || 'Failed to save stack');
      } else {
        setStatus('success');
        setMessage(isEditing ? 'Stack updated successfully.' : `Stack "${name}" created successfully.`);
        // Auto-dismiss success after 3s
        setTimeout(() => { setStatus('idle'); setMessage(''); }, 3000);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Network error');
    }
  }

  const totalSelections = Object.values(selections).reduce((sum, arr) => sum + arr.length, 0);

  const buttonStyle = { padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 };
  const primaryStyle = { ...buttonStyle, backgroundColor: '#2563eb', color: '#fff' };
  const disabledPrimaryStyle = { ...primaryStyle, opacity: 0.5, cursor: 'not-allowed' };

  return (
    <form onSubmit={handleSubmit} aria-label="Agent stack builder form">
      <div className="card" style={{ borderLeft: '3px solid var(--color-info, #3b82f6)' }}>
        <div className="cardTitle">
          <h3>{isEditing ? 'Edit stack' : 'New agent stack'}</h3>
          <span className="pill neutral">{isEditing ? 'editing' : 'graph builder'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Basic fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Stack Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isEditing}
                placeholder="my-agent-stack"
                required
                aria-label="Stack name"
                style={{ ...inputStyle, ...(isEditing ? { background: 'var(--bg-subtle)', color: 'var(--text-muted)' } : {}) }}
              />
            </div>
            <div>
              <label style={labelStyle}>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="My Agent Stack"
                aria-label="Display name"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Stack Layers */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
              Stack Layers ({STACK_LAYERS.length})
              {totalSelections > 0 && (
                <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#64748b', marginLeft: 8 }}>
                  {totalSelections} total selections
                </span>
              )}
            </h4>
            {STACK_LAYERS.map((layer) =>
              layer.subcategories ? (
                <ToolsLayerSection
                  key={layer.key}
                  layer={layer}
                  atlasProxyUrl={atlasProxyUrl}
                  selected={selections[layer.key]}
                  onToggle={handleToggle}
                />
              ) : (
                <LayerSection
                  key={layer.key}
                  layer={layer}
                  atlasProxyUrl={atlasProxyUrl}
                  selected={selections[layer.key]}
                  onToggle={handleToggle}
                />
              )
            )}
          </div>

          {/* Composition Facets */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
              Composition Facets ({COMPOSITION_FACETS.length})
            </h4>
            {COMPOSITION_FACETS.map((facet) => (
              <LayerSection
                key={facet.key}
                layer={facet}
                atlasProxyUrl={atlasProxyUrl}
                selected={selections[facet.key]}
                onToggle={handleToggle}
              />
            ))}
          </div>

          {/* Model Inference (KServe) */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
              Model Inference
            </h4>
            <ModelInferenceSection
              org={org}
              selectedInference={selectedInference}
              onSelectInference={setSelectedInference}
            />
          </div>

          {/* Memory Repositories */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
              Memory
              {selectedMemoryRepos.length > 0 && (
                <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#64748b', marginLeft: 8 }}>
                  {selectedMemoryRepos.length} repo{selectedMemoryRepos.length !== 1 ? 's' : ''} attached
                </span>
              )}
            </h4>
            <MemoryRepositorySection
              org={org}
              selectedRepos={selectedMemoryRepos}
              onToggleRepo={handleToggleMemoryRepo}
            />
          </div>

          {/* RBAC / Runtime Identity */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
              Runtime Identity (RBAC)
            </h4>
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>ServiceAccount</label>
                  <input
                    type="text"
                    value={serviceAccount}
                    onChange={(e) => setServiceAccount(e.target.value)}
                    placeholder="default"
                    aria-label="ServiceAccount name"
                    style={inputStyle}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>K8s ServiceAccount the agent runs as</small>
                </div>
                <div>
                  <label style={labelStyle}>Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    aria-label="RBAC role"
                    style={{ ...inputStyle, background: 'var(--surface)' }}
                  >
                    <option value="cluster-admin">cluster-admin</option>
                    <option value="edit">edit</option>
                    <option value="view">view</option>
                    <option value="custom">custom</option>
                  </select>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ClusterRole or Role binding</small>
                </div>
                <div>
                  <label style={labelStyle}>Namespace</label>
                  <input
                    type="text"
                    value={rbacNamespace}
                    onChange={(e) => setRbacNamespace(e.target.value)}
                    placeholder={`krate-org-${org}`}
                    aria-label="RBAC namespace"
                    style={inputStyle}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Scope for the role binding</small>
                </div>
              </div>
            </div>
          </div>

          {/* Prompts */}
          <div>
            <label style={labelStyle}>System Prompt</label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Optional system prompt for the agent..."
              aria-label="System prompt"
              style={textareaStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Developer Prompt</label>
            <textarea
              rows={3}
              value={developerPrompt}
              onChange={(e) => setDeveloperPrompt(e.target.value)}
              placeholder="Optional developer prompt..."
              aria-label="Developer prompt"
              style={textareaStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Task Prompt</label>
            <textarea
              rows={3}
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              placeholder="Optional task prompt template..."
              aria-label="Task prompt"
              style={textareaStyle}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={status === 'saving' || !name}
              aria-label={status === 'saving' ? 'Saving stack' : isEditing ? 'Update stack' : 'Create stack'}
              style={status === 'saving' || !name ? disabledPrimaryStyle : primaryStyle}
            >
              {status === 'saving' ? 'Saving...' : isEditing ? 'Update Stack' : 'Create Stack'}
            </button>
            {totalSelections > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {totalSelections} Atlas record{totalSelections !== 1 ? 's' : ''} bound across {Object.values(selections).filter((a) => a.length > 0).length} layers
              </span>
            )}
            {status === 'success' && (
              <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>{message}</span>
            )}
            {status === 'error' && (
              <span role="alert" style={{ fontSize: 13, color: 'var(--danger)' }}>{message}</span>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
