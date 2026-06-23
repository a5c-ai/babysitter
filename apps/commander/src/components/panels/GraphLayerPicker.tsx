import React, { useEffect, useState } from 'react';

/**
 * Per-layer concrete graph-object selector, mirroring the kradle web stack
 * builder. Commander runs same-origin inside kradle/web, so it queries the same
 * /api/atlas/search proxy (browse by kind, or full-text search). Selecting an
 * object calls onSelect with its id + displayName so the caller can populate a
 * stack-layer field (e.g. model, provider).
 */
export interface GraphHit {
  id: string;
  nodeKind: string;
  displayName: string;
}

interface Props {
  label: string;
  kinds: string[];
  selectedId?: string;
  onSelect: (hit: GraphHit) => void;
}

export function GraphLayerPicker({ label, kinds, selectedId, onSelect }: Props): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GraphHit[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    const kindsParam = encodeURIComponent(kinds.join(','));
    const url = query.trim()
      ? `/api/atlas/search?q=${encodeURIComponent(query.trim())}&kinds=${kindsParam}&limit=25`
      : `/api/atlas/search?mode=browse&kinds=${kindsParam}&limit=50`;
    setState('loading');
    const handle = setTimeout(() => {
      fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((data: { hits?: GraphHit[] }) => {
          if (cancelled) return;
          setHits(Array.isArray(data.hits) ? data.hits : []);
          setState('idle');
        })
        .catch(() => {
          if (cancelled) return;
          setHits([]);
          setState('error');
        });
    }, query.trim() ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, kinds.join(',')]);

  return (
    <div className="wr-graph-picker" data-testid={`graph-picker-${label.toLowerCase()}`}>
      <span className="wr-foundry-label">{label}</span>
      <input
        className="wr-foundry-input"
        type="text"
        value={query}
        placeholder={`search ${label.toLowerCase()} in the graph…`}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul
        className="wr-graph-picker-results"
        role="listbox"
        aria-label={`${label} graph objects`}
        style={{ maxHeight: '9rem', overflowY: 'auto', margin: '0.25rem 0 0', padding: 0, listStyle: 'none', border: '1px solid var(--border, #3a3a3a)', borderRadius: 4 }}
      >
        {state === 'loading' && <li className="wr-graph-picker-note">loading…</li>}
        {state === 'error' && <li className="wr-graph-picker-note">graph unavailable</li>}
        {state === 'idle' && hits.length === 0 && <li className="wr-graph-picker-note">no graph objects found</li>}
        {hits.map((h) => (
          <li key={`${h.nodeKind}:${h.id}`}>
            <button
              type="button"
              className={`wr-graph-picker-item${selectedId === h.id ? ' is-selected' : ''}`}
              onClick={() => onSelect(h)}
              role="option"
              aria-selected={selectedId === h.id}
              style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', width: '100%', padding: '0.3rem 0.5rem', background: selectedId === h.id ? 'var(--accent, #c98a3e)' : 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.8125rem', textAlign: 'left' }}
            >
              <span className="wr-graph-picker-name">{h.displayName}</span>
              <span className="wr-graph-picker-kind">{h.nodeKind}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
