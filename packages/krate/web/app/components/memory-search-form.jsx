'use client';
import { useState } from 'react';

const MODES = [
  { value: 'graph-only', label: 'Graph only', description: 'Structured records by node kind' },
  { value: 'grep-only', label: 'Grep only', description: 'Full-text across documents' },
  { value: 'graph-and-grep', label: 'Graph + Grep', description: 'Graph narrows candidates, grep searches' },
];

const NODE_KIND_COLORS = {
  Service: { bg: '#dbeafe', text: '#1d4ed8' },
  Team: { bg: '#dcfce7', text: '#15803d' },
  Repository: { bg: '#f3e8ff', text: '#7e22ce' },
  Decision: { bg: '#ffedd5', text: '#c2410c' },
  Incident: { bg: '#fee2e2', text: '#dc2626' },
  Runbook: { bg: '#fef3c7', text: '#b45309' },
  AgentPractice: { bg: '#ccfbf1', text: '#0f766e' },
  Workflow: { bg: '#e0e7ff', text: '#3730a3' },
  API: { bg: '#fce7f3', text: '#9d174d' },
  Documentation: { bg: '#f1f5f9', text: '#334155' },
};

function kindPalette(kind) {
  return NODE_KIND_COLORS[kind] || { bg: '#f1f5f9', text: '#374151' };
}

function NodeCard({ match, edgesFrom = [], org }) {
  const kind = match.nodeKind || match.kind || 'node';
  const id = match.id || match.name || 'unknown';
  const { bg, text } = kindPalette(kind);
  const viewInGraphHref = org ? `/orgs/${org}/agents/memory/search?query=${encodeURIComponent(id)}&mode=graph-only` : null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', background: '#f9fafb', borderBottom: edgesFrom.length ? '1px solid #e5e7eb' : 'none' }}>
        <span style={{ background: bg, color: text, fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{kind}</span>
        <span style={{ fontWeight: 600, fontSize: '0.875rem', flex: 1 }}>{id}</span>
        {match.score !== undefined && (
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>score {typeof match.score === 'number' ? match.score.toFixed(3) : match.score}</span>
        )}
        {viewInGraphHref && (
          <a href={viewInGraphHref} style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', whiteSpace: 'nowrap' }}>View in graph →</a>
        )}
      </div>
      {(match.properties || match.labels) && (
        <div style={{ padding: '0.5rem 0.875rem', fontSize: '0.75rem', color: '#6b7280' }}>
          {match.properties && Object.entries(match.properties).slice(0, 4).map(([k, v]) => (
            <span key={k} style={{ marginRight: '0.75rem' }}><strong>{k}:</strong> {String(v)}</span>
          ))}
        </div>
      )}
      {edgesFrom.length > 0 && (
        <div style={{ padding: '0.375rem 0.875rem', borderTop: '1px solid #f3f4f6', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {edgesFrom.map((edge, i) => (
            <span key={i} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ color: '#9ca3af' }}>──</span>
              <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.0625rem 0.375rem', borderRadius: '0.25rem' }}>{edge.label || edge.kind || edge.type || 'relates_to'}</span>
              <span style={{ color: '#9ca3af' }}>──▶</span>
              <span style={{ background: kindPalette(edge.targetKind).bg, color: kindPalette(edge.targetKind).text, padding: '0.0625rem 0.375rem', borderRadius: '0.25rem', fontWeight: 600 }}>{edge.targetId || edge.target || '?'}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function GrepExcerpt({ excerpt, org }) {
  const path = excerpt.path || excerpt.file || 'unknown';
  const lineNumber = excerpt.lineNumber;
  const text = excerpt.line || excerpt.text || excerpt.content || '';
  const highlight = excerpt.highlight || excerpt.match || null;
  const viewInGraphHref = org ? `/orgs/${org}/agents/memory/search?query=${encodeURIComponent(path)}&mode=graph-only` : null;

  // Naive syntax highlight: bold the matched portion
  function renderHighlighted(raw, hl) {
    if (!hl || !raw.includes(hl)) return raw;
    const idx = raw.indexOf(hl);
    return <>{raw.slice(0, idx)}<mark style={{ background: '#fef08a', color: '#713f12' }}>{hl}</mark>{raw.slice(idx + hl.length)}</>;
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#374151', flex: 1 }}>{path}</span>
        {lineNumber !== undefined && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>line {lineNumber}</span>}
        {viewInGraphHref && (
          <a href={viewInGraphHref} style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', whiteSpace: 'nowrap' }}>View in graph →</a>
        )}
      </div>
      <pre style={{ margin: 0, fontSize: '0.8125rem', fontFamily: 'monospace', background: '#1e1e2e', color: '#cdd6f4', padding: '0.625rem 0.875rem', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6 }}>
        {renderHighlighted(text, highlight)}
      </pre>
    </div>
  );
}

export function MemorySearchForm({ org, showGraphLinks = true }) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('graph-and-grep');
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | searching | done | error
  const [error, setError] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus('searching');
    setError('');
    setResults(null);
    try {
      const res = await fetch('/api/orgs/' + org + '/agents/memory/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), mode }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data);
        setStatus('done');
      } else {
        setError(data.message || data.error || 'Search failed');
        setStatus('error');
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  const graphMatches = results?.graphMatches || results?.graph?.matches || [];
  const grepExcerpts = results?.grepExcerpts || results?.grep?.excerpts || [];
  const totalCount = graphMatches.length + grepExcerpts.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Query</label>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search agent memory..."
            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Search mode</label>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {MODES.map(m => (
              <label key={m.value} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="searchMode"
                  value={m.value}
                  checked={mode === m.value}
                  onChange={() => setMode(m.value)}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={status === 'searching' || !query.trim()}
          style={{ alignSelf: 'flex-start', padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600, cursor: status === 'searching' ? 'not-allowed' : 'pointer', opacity: status === 'searching' ? 0.7 : 1 }}
        >
          {status === 'searching' ? 'Searching...' : 'Search'}
        </button>
      </form>

      {status === 'error' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.375rem', padding: '0.75rem', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {status === 'done' && totalCount === 0 && (
        <div style={{ color: '#6b7280', fontSize: '0.875rem', padding: '1rem', textAlign: 'center', background: '#f9fafb', borderRadius: '0.375rem' }}>
          No matches found for &quot;{query}&quot;
        </div>
      )}

      {status === 'done' && totalCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
            Found {totalCount} result{totalCount !== 1 ? 's' : ''} — {graphMatches.length} graph record{graphMatches.length !== 1 ? 's' : ''}, {grepExcerpts.length} excerpt{grepExcerpts.length !== 1 ? 's' : ''}
          </div>

          {graphMatches.length > 0 && (
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem', color: '#374151' }}>Graph matches</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {graphMatches.map((match, i) => {
                  const nodeId = match.id || match.name;
                  const edges = (results?.edges || results?.graph?.edges || []).filter(
                    (e) => e.sourceId === nodeId || e.source === nodeId
                  );
                  return <NodeCard key={i} match={match} edgesFrom={edges} org={showGraphLinks ? org : null} />;
                })}
              </div>
            </div>
          )}

          {grepExcerpts.length > 0 && (
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem', color: '#374151' }}>Text excerpts</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {grepExcerpts.map((excerpt, i) => (
                  <GrepExcerpt key={i} excerpt={excerpt} org={showGraphLinks ? org : null} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
