'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  inputStyle, sectionHeaderStyle, sectionBodyStyle,
  cardStyle, cardSelectedStyle, badgeStyle, resultGridStyle,
  subSectionHeaderStyle,
} from './stack-builder-graph-styles.jsx';

// ---------------------------------------------------------------------------
// Per-layer search section
// ---------------------------------------------------------------------------

export function LayerSection({ layer, atlasProxyUrl, selected, onToggle }) {
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
    } catch (err) { console.warn('[kradle] atlas layer browse failed:', err.message ?? err); }
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
      } catch (err) { console.warn('[kradle] atlas layer search failed:', err.message ?? err); }
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
      <div style={sectionHeaderStyle} onClick={handleToggleOpen} role="button" tabIndex={0} aria-label={`Toggle ${layer.label} layer section`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleOpen(); } }}>
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
            aria-label={`Search ${layer.label} records`}
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
                    role="button"
                    tabIndex={0}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${hit.displayName || hit.id}`}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(layer.key, hit); } }}
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
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${s.displayName || s.id} from selection`}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(layer.key, s); } }}
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

export function ToolsLayerSection({ layer, atlasProxyUrl, selected, onToggle }) {
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
      <div style={sectionHeaderStyle} onClick={() => setOpen((o) => !o)} role="button" tabIndex={0} aria-label={`Toggle ${layer.label} layer section`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); } }}>
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
    } catch (err) { console.warn('[kradle] atlas tool browse failed:', err.message ?? err); }
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
      } catch (err) { console.warn('[kradle] atlas tool search failed:', err.message ?? err); }
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
      <div style={subSectionHeaderStyle} onClick={handleToggleOpen} role="button" tabIndex={0} aria-label={`Toggle ${label} sub-section`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleOpen(); } }}>
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
            aria-label={`Search ${label.toLowerCase()}`}
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
                    role="button"
                    tabIndex={0}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${hit.displayName || hit.id}`}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(layerKey, hit); } }}
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
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${s.displayName || s.id} from selection`}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(layerKey, s); } }}
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
