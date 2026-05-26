'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Layer / facet definitions (kept client-side so we don't import Node modules)
// ---------------------------------------------------------------------------

const STACK_LAYERS = [
  { key: 'layer:1-model', label: 'Model', position: 1, atlasKinds: ['ModelFamily', 'ModelVersion', 'SessionModel'], description: 'LLM model family and version' },
  { key: 'layer:2-provider', label: 'Provider', position: 2, atlasKinds: ['Provider', 'ModelProviderProduct', 'ModelProviderVersion'], description: 'Model API provider (Anthropic, OpenAI, Azure, etc.)' },
  { key: 'layer:3-transport', label: 'Transport', position: 3, atlasKinds: ['TransportProtocol', 'ModelTransportProtocol'], description: 'Communication protocol (stdio, HTTP, WebSocket)' },
  { key: 'layer:4-platform', label: 'Platform', position: 4, atlasKinds: ['AgentProduct', 'AgentRuntimeImpl', 'AgentPlatformImpl', 'AgentCoreImpl', 'Platform'], description: 'Agent platform target (agent-mux supported)' },
  { key: 'layer:5-tools', label: 'Tools', position: 5, atlasKinds: ['Tool', 'ToolDescriptor', 'ToolServer', 'MCPPrompt', 'MCPResource'], description: 'Tools, MCP servers, and tool descriptors', subcategories: { internal: { kinds: ['Tool', 'ToolDescriptor'], label: 'Internal Platform Tools' }, external: { kinds: ['ToolServer', 'MCPPrompt', 'MCPResource'], label: 'External Tools' } } },
  { key: 'layer:6-plugins', label: 'Plugins', position: 6, atlasKinds: ['PluginArtifact', 'Plugin', 'PluginCommand', 'PluginSkill', 'PluginHook'], description: 'Plugins, commands, skills, and hooks' },
];

const COMPOSITION_FACETS = [
  { key: 'facet:agent-role', label: 'Agent Role', atlasKinds: ['Role', 'Responsibility', 'AgentTeam', 'OrgUnit'], description: 'Role-based identity for policies and permissions' },
  { key: 'facet:skills-and-capabilities', label: 'Skills and Capabilities', atlasKinds: ['Skill', 'LibrarySkill', 'SkillArea', 'Capability'], description: 'Reusable skills and capability bundles' },
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

const subSectionHeaderStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  cursor: 'pointer', padding: '0.5rem 0.625rem',
  borderRadius: '0.25rem', background: '#f1f5f9',
  border: '1px solid #e2e8f0', userSelect: 'none',
  fontSize: '0.8125rem', marginBottom: '0.375rem',
};

const memoryToggleStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
  border: '1px solid #e2e8f0', fontSize: '0.8125rem',
  transition: 'border-color 0.15s, background 0.15s',
};

const memoryToggleSelectedStyle = {
  ...memoryToggleStyle, borderColor: '#7c3aed', background: '#f5f3ff',
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
// Tools Layer Section with internal/external sub-sections
// ---------------------------------------------------------------------------

function ToolsLayerSection({ layer, atlasProxyUrl, selected, onToggle }) {
  const [open, setOpen] = useState(false);
  const subcats = layer.subcategories || {};
  const internalKinds = new Set(subcats.internal?.kinds || []);
  const externalKinds = new Set(subcats.external?.kinds || []);
  const internalLabel = subcats.internal?.label || 'Internal Tools';
  const externalLabel = subcats.external?.label || 'External Tools';

  const internalSelected = (selected || []).filter((s) => internalKinds.has(s.nodeKind));
  const externalSelected = (selected || []).filter((s) => externalKinds.has(s.nodeKind));
  const selectionCount = (selected || []).length;

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={sectionHeaderStyle} onClick={() => setOpen((o) => !o)}>
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
        <div style={{ ...sectionBodyStyle, gap: '0.75rem' }}>
          {/* Internal Platform Tools sub-section */}
          <ToolSubSection
            label={internalLabel}
            kinds={subcats.internal?.kinds || []}
            layerKey={layer.key}
            atlasProxyUrl={atlasProxyUrl}
            selected={internalSelected}
            onToggle={onToggle}
          />
          {/* External Tools sub-section */}
          <ToolSubSection
            label={externalLabel}
            kinds={subcats.external?.kinds || []}
            layerKey={layer.key}
            atlasProxyUrl={atlasProxyUrl}
            selected={externalSelected}
            onToggle={onToggle}
          />
        </div>
      )}
    </div>
  );
}

function ToolSubSection({ label, kinds, layerKey, atlasProxyUrl, selected, onToggle }) {
  const [subOpen, setSubOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const debounceRef = useRef(null);

  const kindsParam = kinds.join(',');
  const selectionCount = selected?.length || 0;
  const selectedIds = new Set((selected || []).map((s) => s.id));

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
    } catch { /* network error */ }
    setLoading(false);
    setInitialLoaded(true);
  }, [atlasProxyUrl, kindsParam, initialLoaded]);

  useEffect(() => {
    if (!subOpen) return;
    if (!query.trim()) { loadInitial(); return; }
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
      } catch { /* keep previous */ }
      setLoading(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, subOpen, atlasProxyUrl, kindsParam, loadInitial]);

  function handleToggleOpen() {
    const next = !subOpen;
    setSubOpen(next);
    if (next && !initialLoaded && !query.trim()) loadInitial();
  }

  return (
    <div>
      <div style={subSectionHeaderStyle} onClick={handleToggleOpen}>
        <span>
          {label}
          {selectionCount > 0 && (
            <span style={{ ...badgeStyle, background: '#dbeafe', color: '#1e40af', fontSize: '0.625rem' }}>{selectionCount}</span>
          )}
        </span>
        <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
          {kinds.join(', ')} {subOpen ? '▲' : '▼'}
        </span>
      </div>

      {subOpen && (
        <div style={{ padding: '0 0.375rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <input
            type="text"
            placeholder={`Search ${label.toLowerCase()}...`}
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
                    onClick={() => onToggle(layerKey, hit)}
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
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No records found.</span>
          )}

          {selectionCount > 0 && (
            <div style={{ marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Selected:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                {selected.map((s) => (
                  <span
                    key={s.id}
                    onClick={() => onToggle(layerKey, s)}
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
// Memory Repository Section
// ---------------------------------------------------------------------------

function MemoryRepositorySection({ org, selectedRepos, onToggleRepo }) {
  const [open, setOpen] = useState(false);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    setLoading(true);
    fetch(`/api/orgs/${encodeURIComponent(org)}/resources?kind=AgentMemoryRepository`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setRepos(Array.isArray(data) ? data : data.items || []);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setLoaded(true); });
  }, [open, org, loaded]);

  const selectionCount = selectedRepos?.length || 0;
  const selectedNames = new Set((selectedRepos || []).map((r) => r.name));

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={sectionHeaderStyle} onClick={() => setOpen((o) => !o)}>
        <span>
          <strong>Memory</strong>
          {selectionCount > 0 && (
            <span style={{ ...badgeStyle, background: '#ede9fe', color: '#5b21b6' }}>{selectionCount} selected</span>
          )}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          AgentMemoryRepository {open ? '▲' : '▼'}
        </span>
      </div>

      {open && (
        <div style={sectionBodyStyle}>
          {loading && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Loading memory repositories...</span>}

          {!loading && repos.length === 0 && loaded && (
            <div style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
              No memory repositories available.{' '}
              <a href={`/orgs/${org}/agents/memory`} style={{ color: '#7c3aed', textDecoration: 'underline' }}>
                Create one
              </a>
            </div>
          )}

          {repos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {repos.map((repo) => {
                const repoName = repo.metadata?.name || repo.name || repo.id;
                const repoUrl = repo.spec?.repoUrl || repo.spec?.url || '';
                const isSelected = selectedNames.has(repoName);
                return (
                  <div
                    key={repoName}
                    style={isSelected ? memoryToggleSelectedStyle : memoryToggleStyle}
                    onClick={() => onToggleRepo({ name: repoName, url: repoUrl })}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <strong>{repoName}</strong>
                      {repoUrl && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{repoUrl}</span>
                      )}
                    </div>
                    <div
                      style={{
                        width: 36, height: 20, borderRadius: 10,
                        background: isSelected ? '#7c3aed' : '#d1d5db',
                        position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 16, height: 16, borderRadius: '50%',
                          background: '#fff', position: 'absolute', top: 2,
                          left: isSelected ? 18 : 2,
                          transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Model Inference Section (KServe)
// ---------------------------------------------------------------------------

function ModelInferenceSection({ org, selectedInference, onSelectInference }) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedName, setSelectedName] = useState(selectedInference?.name || '');

  useEffect(() => {
    if (!open || services.length > 0) return;
    setLoading(true);
    fetch(`/api/orgs/${encodeURIComponent(org)}/inference/services`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setServices(data.items || (Array.isArray(data) ? data : []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, org, services.length]);

  function handleSelect(name) {
    setSelectedName(name);
    if (!name) {
      if (onSelectInference) onSelectInference(null);
      return;
    }
    const svc = services.find(s => (s.metadata?.name || s.name) === name);
    if (svc && onSelectInference) {
      onSelectInference({
        name,
        endpoint: svc.status?.url || svc.status?.address?.url || '',
        modelFormat: svc.spec?.predictor?.model?.modelFormat?.name || 'custom',
        status: svc.status?.ready ? 'Ready' : 'Pending',
      });
    }
  }

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={sectionHeaderStyle} onClick={() => setOpen(o => !o)}>
        <span>
          <strong>Model Inference</strong>
          {selectedInference && (
            <span style={{ ...badgeStyle, background: '#d1fae5', color: '#065f46', marginLeft: 8 }}>{selectedInference.name}</span>
          )}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          KServe inference services {open ? '▲' : '▼'}
        </span>
      </div>

      {open && (
        <div style={sectionBodyStyle}>
          {loading && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Loading inference services...</span>}

          {!loading && services.length === 0 && (
            <div style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
              No inference services available.{' '}
              <a href={`/orgs/${org}/inference`} style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Create one
              </a>
            </div>
          )}

          {services.length > 0 && (
            <div>
              <label style={labelStyle}>KServe Inference Service</label>
              <select
                style={inputStyle}
                value={selectedName}
                onChange={e => handleSelect(e.target.value)}
              >
                <option value="">-- None --</option>
                {services.map(svc => {
                  const n = svc.metadata?.name || svc.name;
                  const fmt = svc.spec?.predictor?.model?.modelFormat?.name || 'custom';
                  const ready = svc.status?.ready ? 'Ready' : 'Pending';
                  return <option key={n} value={n}>{n} ({fmt}) [{ready}]</option>;
                })}
              </select>

              {selectedInference && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>
                    <strong>Endpoint:</strong>{' '}
                    <code style={{ fontSize: '0.75rem', background: '#f3f4f6', padding: '1px 6px', borderRadius: 3 }}>
                      {selectedInference.endpoint || 'Not ready'}
                    </code>
                  </div>
                  <div>
                    <strong>Format:</strong>{' '}
                    <span style={badgeStyle}>{selectedInference.modelFormat}</span>
                  </div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span style={{ color: selectedInference.status === 'Ready' ? '#16a34a' : '#d97706' }}>
                      {selectedInference.status}
                    </span>
                  </div>
                </div>
              )}
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

    // Derive fields from layer selections
    const modelSelections = selections['layer:1-model'] || [];
    const providerSelections = selections['layer:2-provider'] || [];
    const platformSelections = selections['layer:4-platform'] || [];
    const toolSelections = selections['layer:5-tools'] || [];
    const pluginSelections = selections['layer:6-plugins'] || [];
    const roleSelections = selections['facet:agent-role'] || [];
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
        // Platform: agent-mux supported target (claude-code, codex, gemini-cli, etc.)
        baseAgent: platformSelections.find((r) => r.nodeKind === 'AgentProduct')?.id || 'claude-code',
        adapter: platformSelections.find((r) => r.nodeKind === 'AgentPlatformImpl')?.id || 'default',
        runtimeIdentity: {
          serviceAccountRef: serviceAccount || 'default',
          roleRef: role || 'edit',
          namespace: rbacNamespace || `krate-org-${org}`,
        },
        // Model from model layer
        ...(modelSelections.length ? { model: modelSelections[0].id } : {}),
        // Provider from provider layer
        ...(providerSelections.length ? { provider: providerSelections[0].id } : {}),
        ...(displayName ? { displayName } : {}),
        ...(systemPrompt ? { systemPrompt } : {}),
        ...(developerPrompt ? { developerPrompt } : {}),
        ...(taskPrompt ? { taskPrompt } : {}),
        approvalMode: 'prompt',
        // Agent role for policies and permissions
        ...(roleSelections.length ? { agentRole: { refs: roleSelections.map((r) => ({ id: r.id, nodeKind: r.nodeKind, displayName: r.displayName })) } } : {}),
        // Internal tools (Tool, ToolDescriptor) — structured filter
        ...(toolSelections.filter((r) => r.nodeKind === 'Tool' || r.nodeKind === 'ToolDescriptor').length
          ? { internalTools: { enabled: true, filter: toolSelections.filter((r) => r.nodeKind === 'Tool' || r.nodeKind === 'ToolDescriptor').map((r) => r.id) } }
          : {}),
        // External tools (ToolServer, MCPPrompt, MCPResource) — structured refs
        ...(toolSelections.filter((r) => r.nodeKind === 'ToolServer' || r.nodeKind === 'MCPPrompt' || r.nodeKind === 'MCPResource').length
          ? {
            externalTools: {
              mcpServerRefs: toolSelections.filter((r) => r.nodeKind === 'ToolServer' || r.nodeKind === 'MCPPrompt').map((r) => r.id),
              cliToolRefs: [],
              openApiRefs: toolSelections.filter((r) => r.nodeKind === 'MCPResource').map((r) => r.id),
            },
          }
          : {}),
        // Backward-compat flat mcpServerRefs
        ...(toolSelections.filter((r) => r.nodeKind === 'ToolServer' || r.nodeKind === 'MCPPrompt').length
          ? { mcpServerRefs: toolSelections.filter((r) => r.nodeKind === 'ToolServer' || r.nodeKind === 'MCPPrompt').map((r) => r.id) }
          : {}),
        // Memory repository associations
        ...(selectedMemoryRepos.length
          ? { memoryRepositoryRefs: selectedMemoryRepos.map((r) => r.name) }
          : {}),
        // Plugin refs from plugins layer
        ...(pluginSelections.length
          ? { pluginRefs: pluginSelections.map((r) => r.id) }
          : {}),
        // Skill refs from skills facet
        ...(skillSelections.length
          ? { skillRefs: skillSelections.map((r) => r.id) }
          : {}),
        // Atlas layer bindings for graph-aware consumers
        atlasLayerBindings: layerBindings,
        // KServe inference service binding
        ...(selectedInference ? {
          inference: {
            provider: 'kserve',
            service: selectedInference.name,
            endpoint: selectedInference.endpoint,
            modelFormat: selectedInference.modelFormat,
          },
        } : {}),
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
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>ServiceAccount</label>
                  <input
                    type="text"
                    value={serviceAccount}
                    onChange={(e) => setServiceAccount(e.target.value)}
                    placeholder="default"
                    style={inputStyle}
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>K8s ServiceAccount the agent runs as</small>
                </div>
                <div>
                  <label style={labelStyle}>Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ ...inputStyle, background: '#fff' }}
                  >
                    <option value="cluster-admin">cluster-admin</option>
                    <option value="edit">edit</option>
                    <option value="view">view</option>
                    <option value="custom">custom</option>
                  </select>
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>ClusterRole or Role binding</small>
                </div>
                <div>
                  <label style={labelStyle}>Namespace</label>
                  <input
                    type="text"
                    value={rbacNamespace}
                    onChange={(e) => setRbacNamespace(e.target.value)}
                    placeholder={`krate-org-${org}`}
                    style={inputStyle}
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>Scope for the role binding</small>
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
