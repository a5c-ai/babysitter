'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Layer / facet definitions (kept client-side so we don't import Node modules)
// ---------------------------------------------------------------------------

const STACK_LAYERS = [
  { key: 'layer:1-model', label: 'Model', position: 1, atlasKinds: ['ModelFamily', 'ModelVersion', 'SessionModel'] },
  { key: 'layer:2-provider', label: 'Provider', position: 2, atlasKinds: ['Provider', 'ModelProviderProduct', 'ModelProviderVersion'] },
  { key: 'layer:3-transport', label: 'Transport', position: 3, atlasKinds: ['TransportProtocol', 'ModelTransportProtocol'] },
  { key: 'layer:4-agent-core', label: 'Agent Core', position: 4, atlasKinds: ['AgentCoreImpl', 'Capability', 'CapabilitySupport'] },
  { key: 'layer:5-agent-runtime', label: 'Agent Runtime', position: 5, atlasKinds: ['AgentProduct', 'AgentRuntimeImpl', 'AgentVersion', 'Subagent'] },
  { key: 'layer:6-agent-platform', label: 'Agent Platform', position: 6, atlasKinds: ['AgentPlatformImpl', 'Platform', 'PlatformService'] },
  { key: 'layer:7-workspace', label: 'Workspace', position: 7, atlasKinds: ['Workspace', 'Project', 'SharedContextSpec'] },
  { key: 'layer:8-execution', label: 'Execution', position: 8, atlasKinds: ['Workflow', 'LibraryProcess', 'Phase', 'HookSurface'] },
  { key: 'layer:9-sandbox', label: 'Sandbox', position: 9, atlasKinds: ['PermissionMode', 'DeploymentTarget'] },
  { key: 'layer:10-interaction', label: 'Interaction', position: 10, atlasKinds: ['Tool', 'ToolDescriptor', 'ToolServer', 'PluginArtifact', 'MCPPrompt'] },
  { key: 'layer:11-presentation', label: 'Presentation', position: 11, atlasKinds: ['AgentUIImpl', 'Page', 'APIEndpoint', 'Presentation'] },
];

const COMPOSITION_FACETS = [
  { key: 'facet:roles-and-teams', label: 'Roles and Teams', atlasKinds: ['Role', 'Responsibility', 'OrgUnit', 'AgentTeam'] },
  { key: 'facet:skills-and-capabilities', label: 'Skills and Capabilities', atlasKinds: ['Skill', 'LibrarySkill', 'SkillArea', 'Capability'] },
  { key: 'facet:evaluation-and-governance', label: 'Evaluation and Governance', atlasKinds: ['Benchmark', 'TestSet', 'EvalRun'] },
  { key: 'facet:environment-and-data', label: 'Environment and Data', atlasKinds: ['StackPart', 'VectorStore', 'MemoryStore'] },
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box' };
const textareaStyle = { ...inputStyle, resize: 'vertical', fontFamily: 'inherit' };

const sectionHeaderStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  cursor: 'pointer', padding: '0.625rem 0.75rem',
  borderRadius: '0.375rem', background: '#f8fafc',
  border: '1px solid #e2e8f0', userSelect: 'none',
};

const sectionBodyStyle = { padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' };

const cardStyle = {
  display: 'flex', flexDirection: 'column', gap: '0.25rem',
  padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
  border: '1px solid #e2e8f0', cursor: 'pointer',
  fontSize: '0.8125rem', transition: 'border-color 0.15s, background 0.15s',
};
const cardSelectedStyle = { ...cardStyle, borderColor: '#2563eb', background: '#eff6ff' };

const badgeStyle = {
  display: 'inline-block', fontSize: '0.6875rem', padding: '1px 6px',
  borderRadius: '9999px', background: '#e0e7ff', color: '#3730a3',
  fontWeight: 600, marginLeft: '0.375rem', verticalAlign: 'middle',
};

const resultGridStyle = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem',
};

// ---------------------------------------------------------------------------
// Per-layer search section
// ---------------------------------------------------------------------------

function LayerSection({ layer, atlasProxyUrl, selected, onToggle }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const debounceRef = useRef(null);

  const kindsParam = layer.atlasKinds.join(',');

  // Load initial records when section is first opened
  const loadInitial = useCallback(async () => {
    if (initialLoaded) return;
    setLoading(true);
    try {
      const url = `${atlasProxyUrl}?kinds=${encodeURIComponent(kindsParam)}&mode=browse`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setResults(data.hits || data.instances || []);
      }
    } catch { /* network error, keep empty */ }
    setLoading(false);
    setInitialLoaded(true);
  }, [atlasProxyUrl, kindsParam, initialLoaded]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      loadInitial();
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `${atlasProxyUrl}?q=${encodeURIComponent(query)}&kinds=${encodeURIComponent(kindsParam)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setResults(data.hits || []);
        }
      } catch { /* keep previous results */ }
      setLoading(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, atlasProxyUrl, kindsParam, loadInitial]);

  function handleToggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && !initialLoaded && !query.trim()) {
      loadInitial();
    }
  }

  const selectedIds = new Set((selected || []).map((s) => s.id));
  const selectionCount = selected?.length || 0;

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={sectionHeaderStyle} onClick={handleToggleOpen}>
        <span>
          <strong>{layer.label}</strong>
          {layer.position != null && (
            <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: 6 }}>Layer {layer.position}</span>
          )}
          {selectionCount > 0 && (
            <span style={{ ...badgeStyle, background: '#dbeafe', color: '#1e40af' }}>{selectionCount} selected</span>
          )}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          {layer.atlasKinds.join(', ')} {open ? '▲' : '▼'}
        </span>
      </div>

      {open && (
        <div style={sectionBodyStyle}>
          <input
            type="text"
            placeholder={`Search ${layer.label} records...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={inputStyle}
          />

          {loading && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Loading...</span>}

          {results.length > 0 && (
            <div style={resultGridStyle}>
              {results.map((hit) => {
                const isSelected = selectedIds.has(hit.id);
                return (
                  <div
                    key={hit.id}
                    style={isSelected ? cardSelectedStyle : cardStyle}
                    onClick={() => onToggle(layer.key, hit)}
                  >
                    <div>
                      <strong style={{ fontSize: '0.8125rem' }}>{hit.displayName || hit.id}</strong>
                      <span style={badgeStyle}>{hit.nodeKind}</span>
                    </div>
                    {hit.snippet && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.3, marginTop: 2 }}>
                        {hit.snippet.slice(0, 120)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loading && results.length === 0 && initialLoaded && (
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No records found for this layer.</span>
          )}

          {/* Selected items summary */}
          {selectionCount > 0 && (
            <div style={{ marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Selected:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                {selected.map((s) => (
                  <span
                    key={s.id}
                    onClick={() => onToggle(layer.key, s)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: '0.75rem', padding: '2px 8px', borderRadius: '9999px',
                      background: '#dbeafe', color: '#1e40af', cursor: 'pointer',
                    }}
                  >
                    {s.displayName || s.id} &times;
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name) return;
    setStatus('saving');
    setMessage('');

    // Build layer bindings from selections
    const layerBindings = [];
    for (const [layerKey, records] of Object.entries(selections)) {
      for (const record of records) {
        layerBindings.push({
          primaryLayerId: layerKey,
          atlasRecordId: record.id,
          nodeKind: record.nodeKind,
          displayName: record.displayName,
          selectionRole: 'primary',
          importance: 'primary',
        });
      }
    }

    // Derive conventional fields from selections
    const modelSelections = selections['layer:1-model'] || [];
    const providerSelections = selections['layer:2-provider'] || [];
    const runtimeSelections = selections['layer:5-agent-runtime'] || [];
    const interactionSelections = selections['layer:10-interaction'] || [];
    const skillSelections = selections['facet:skills-and-capabilities'] || [];

    const resource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'AgentStack',
      metadata: {
        name,
        labels: {
          ...(displayName ? { 'krate.a5c.ai/display-name': displayName } : {}),
        },
      },
      spec: {
        // Derive baseAgent from runtime layer (first AgentProduct selection, or default)
        baseAgent: runtimeSelections.find((r) => r.nodeKind === 'AgentProduct')?.id || 'claude-code',
        // Derive model from model layer
        ...(modelSelections.length ? { model: modelSelections[0].id } : {}),
        // Derive provider from provider layer
        ...(providerSelections.length ? { provider: providerSelections[0].id } : {}),
        ...(displayName ? { displayName } : {}),
        ...(systemPrompt ? { systemPrompt } : {}),
        ...(developerPrompt ? { developerPrompt } : {}),
        ...(taskPrompt ? { taskPrompt } : {}),
        approvalMode: 'prompt',
        // MCP server refs from interaction layer
        ...(interactionSelections.filter((r) => r.nodeKind === 'ToolServer').length
          ? { mcpServerRefs: interactionSelections.filter((r) => r.nodeKind === 'ToolServer').map((r) => r.id) }
          : {}),
        // Skill refs from skills facet
        ...(skillSelections.length
          ? { skillRefs: skillSelections.map((r) => r.id) }
          : {}),
        // Full Atlas layer bindings for graph-aware consumers
        atlasLayerBindings: layerBindings,
      },
    };

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
    <form onSubmit={handleSubmit}>
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
                style={{ ...inputStyle, ...(isEditing ? { background: '#f9fafb', color: '#9ca3af' } : {}) }}
              />
            </div>
            <div>
              <label style={labelStyle}>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="My Agent Stack"
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
            {STACK_LAYERS.map((layer) => (
              <LayerSection
                key={layer.key}
                layer={layer}
                atlasProxyUrl={atlasProxyUrl}
                selected={selections[layer.key]}
                onToggle={handleToggle}
              />
            ))}
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

          {/* Prompts */}
          <div>
            <label style={labelStyle}>System Prompt</label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Optional system prompt for the agent..."
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
              style={textareaStyle}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={status === 'saving' || !name}
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
              <span style={{ fontSize: 13, color: '#dc2626' }}>{message}</span>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
