'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '../../hooks/use-debounce.js';

const KIND_COLORS = {
  AgentStack: '#3b82f6',
  KradleProject: '#7c3aed',
  Repository: '#059669',
  AgentDispatchRun: '#d97706',
  AgentChatSession: '#0891b2',
  TriggerRule: '#dc2626',
  AgentApproval: '#ca8a04',
};

const KIND_LABELS = {
  AgentStack: 'Stack',
  KradleProject: 'Project',
  Repository: 'Repo',
  AgentDispatchRun: 'Run',
  AgentChatSession: 'Session',
  TriggerRule: 'Rule',
  AgentApproval: 'Approval',
};

function orgPrefixedHref(org, href) {
  return '/orgs/' + org + (href === '/' ? '' : href);
}

const RECENT_KEY = 'kradle:recentSearches';
const MAX_RECENT = 5;

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function addRecentSearch(query) {
  if (!query || query.length < 2) return;
  try {
    const existing = getRecentSearches().filter((q) => q !== query);
    localStorage.setItem(RECENT_KEY, JSON.stringify([query, ...existing].slice(0, MAX_RECENT)));
  } catch {
    // ignore
  }
}

export function GlobalSearch({ org }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches on focus
  const handleFocus = useCallback(() => {
    setRecentSearches(getRecentSearches());
    setOpen(true);
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleMouseDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // Set loading state immediately when query changes
  useEffect(() => {
    if (query.length >= 2) {
      setLoading(true);
    } else {
      setResults([]);
      setNoResults(false);
      setSearchError(false);
      setLoading(false);
    }
  }, [query]);

  // Fetch search results when debounced query updates
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/orgs/${org}/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setNoResults((data.results || []).length === 0);
          setSearchError(false);
        } else {
          setResults([]);
          setNoResults(false);
          setSearchError(true);
        }
      } catch {
        if (cancelled) return;
        setResults([]);
        setNoResults(false);
        setSearchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedQuery, org]);

  const flatResults = results;

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && flatResults[selectedIndex]) {
        selectResult(flatResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  }

  function selectResult(result) {
    addRecentSearch(query || result.name);
    setOpen(false);
    setQuery('');
    setResults([]);
    router.push(orgPrefixedHref(org, result.href));
  }

  function handleRecentSelect(q) {
    setQuery(q);
    setOpen(true);
    inputRef.current?.focus();
  }

  const showRecent = query.length === 0 && recentSearches.length > 0;
  const showResults = query.length >= 2 && (results.length > 0 || noResults || searchError || loading);

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative', flex: '1 1 auto', maxWidth: 480, minWidth: 200 }}
    >
      <label className="globalSearch" style={{ display: 'block' }}>
        <span>Search or jump to...</span>
        <input
          ref={inputRef}
          aria-label="Search or jump to"
          placeholder="Search code, reviews, people, deployments..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          style={searchError ? { borderColor: '#f59e0b' } : undefined}
        />
      </label>

      {open && (showRecent || showResults) && (
        <div
          role="listbox"
          className="globalSearchDropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--surface, #fff)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 6,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            zIndex: 1000,
            maxHeight: 400,
            overflowY: 'auto',
            marginTop: 4,
          }}
        >
          {showRecent && (
            <div style={{ padding: '8px 12px 4px', fontSize: '0.75rem', color: 'var(--ink-muted, #6b7280)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent searches
            </div>
          )}
          {showRecent && recentSearches.map((q) => (
            <button
              key={q}
              role="option"
              onClick={() => handleRecentSelect(q)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                color: 'var(--text)',
              }}
            >
              <span style={{ color: 'var(--ink-muted, #9ca3af)', fontSize: '0.75rem' }}>↩</span>
              {q}
            </button>
          ))}

          {loading && (
            <div style={{ padding: '12px', fontSize: '0.875rem', color: 'var(--ink-muted, #6b7280)', textAlign: 'center' }}>
              Searching...
            </div>
          )}

          {!loading && searchError && query.length >= 2 && (
            <div style={{ padding: '12px', fontSize: '0.875rem', color: '#f59e0b', textAlign: 'center' }}>
              <div>Search unavailable &mdash; check connection</div>
              <button
                onClick={() => { setSearchError(false); setQuery((q) => q + ' '); setTimeout(() => setQuery((q) => q.trimEnd()), 10); }}
                style={{ marginTop: 6, padding: '4px 12px', fontSize: '0.8rem', background: 'none', border: '1px solid #f59e0b', borderRadius: 4, color: '#f59e0b', cursor: 'pointer' }}
              >Retry</button>
            </div>
          )}

          {!loading && !searchError && noResults && query.length >= 2 && (
            <div style={{ padding: '12px', fontSize: '0.875rem', color: 'var(--ink-muted, #6b7280)', textAlign: 'center' }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div style={{ padding: '8px 12px 4px', fontSize: '0.75rem', color: 'var(--ink-muted, #6b7280)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Results
              </div>
              {results.map((result, idx) => (
                <button
                  key={`${result.kind}-${result.name}`}
                  role="option"
                  aria-selected={idx === selectedIndex}
                  onClick={() => selectResult(result)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 12px',
                    background: idx === selectedIndex ? 'var(--bg-hover, #f3f4f6)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    color: 'var(--text)',
                  }}
                >
                  <span
                    style={{
                      background: KIND_COLORS[result.kind] || '#6b7280',
                      color: '#fff',
                      borderRadius: 3,
                      padding: '1px 6px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {KIND_LABELS[result.kind] || result.kind}
                  </span>
                  <span style={{ fontWeight: 500 }}>{result.displayName || result.name}</span>
                  {result.displayName && result.displayName !== result.name && (
                    <span style={{ color: 'var(--ink-muted, #9ca3af)', fontSize: '0.8rem' }}>{result.name}</span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
