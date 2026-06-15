'use client';
import { useState } from 'react';
export { METHOD_COLORS, ENDPOINT_GROUPS } from './api-explorer-endpoints.js';
import { METHOD_COLORS } from './api-explorer-endpoints.js';

// ── Small shared components ────────────────────────────────────────────────

export function MethodBadge({ method }) {
  const colors = METHOD_COLORS[method] || { bg: '#6b7280', text: '#fff' };
  return (
    <span
      aria-label={`HTTP method ${method}`}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.05em',
        fontFamily: 'monospace',
        minWidth: 52,
        textAlign: 'center',
      }}
    >
      {method}
    </span>
  );
}

// ── ResponseViewer ─────────────────────────────────────────────────────────

export function ResponseViewer({ response, onCopy, copied }) {
  const statusColor = response.ok ? 'var(--success)' : 'var(--danger)';
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>
          HTTP {response.status}
        </span>
        <span style={{ fontSize: 12, color: statusColor }}>
          {response.ok ? 'OK' : 'Error'}
        </span>
        <button
          onClick={onCopy}
          aria-label="Copy response body"
          style={{ marginLeft: 'auto', padding: '2px 10px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 11 }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre style={{ background: '#1f2937', color: '#e5e7eb', borderRadius: 6, padding: 12, fontSize: 12, overflow: 'auto', margin: 0, maxHeight: 320 }}>
        {typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
      </pre>
    </div>
  );
}

// ── RequestBuilder ─────────────────────────────────────────────────────────

export function RequestBuilder({ endpoint, org, onClose }) {
  const [pathParams, setPathParams] = useState({});
  const [queryParams, setQueryParams] = useState({});
  const [body, setBody] = useState(endpoint.requestBody || '');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const pathParamNames = (endpoint.path.match(/\{([^}]+)\}/g) || []).map((p) => p.slice(1, -1));

  function buildUrl() {
    let url = endpoint.path;
    for (const key of pathParamNames) {
      const val = key === 'org' ? org : (pathParams[key] || `{${key}}`);
      url = url.replace(`{${key}}`, encodeURIComponent(val));
    }
    const queryParts = endpoint.parameters
      .filter((p) => p.in === 'query' && queryParams[p.name])
      .map((p) => `${p.name}=${encodeURIComponent(queryParams[p.name])}`);
    if (queryParts.length) url += '?' + queryParts.join('&');
    return url;
  }

  async function handleTry() {
    setLoading(true);
    setResponse(null);
    try {
      const url = buildUrl();
      const opts = { method: endpoint.method, headers: {} };
      if (endpoint.method !== 'GET' && body) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = body;
      }
      const res = await fetch(url, opts);
      let data;
      try { data = await res.json(); } catch { data = await res.text(); }
      setResponse({ status: res.status, ok: res.ok, data });
    } catch (err) {
      setResponse({ status: 0, ok: false, data: { error: err.message } });
    }
    setLoading(false);
  }

  function handleCopy() {
    if (response?.data) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--surface)' }}>
      <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>Try it — {endpoint.method} {endpoint.path}</h4>

      {/* Path params input */}
      {pathParamNames.filter((k) => k !== 'org').map((key) => (
        <div key={key} style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            {key} <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            value={pathParams[key] || ''}
            onChange={(e) => setPathParams((p) => ({ ...p, [key]: e.target.value }))}
            placeholder={`Enter ${key}`}
            aria-label={`Path parameter: ${key}`}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }}
          />
        </div>
      ))}

      {/* Query params */}
      {endpoint.parameters.filter((p) => p.in === 'query').map((p) => (
        <div key={p.name} style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            {p.name} {p.required && <span style={{ color: 'var(--danger)' }}>*</span>}
            <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> (query)</span>
          </label>
          <input
            value={queryParams[p.name] || ''}
            onChange={(e) => setQueryParams((q) => ({ ...q, [p.name]: e.target.value }))}
            placeholder={p.example || `Enter ${p.name}`}
            aria-label={`Query parameter: ${p.name}`}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }}
          />
        </div>
      ))}

      {/* Body textarea */}
      {endpoint.method !== 'GET' && endpoint.method !== 'DELETE' && (
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Request Body (JSON)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            aria-label="Request body JSON"
            style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12, fontFamily: 'monospace', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>
      )}

      {/* URL preview */}
      <div style={{ marginBottom: 12, padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: 4, fontSize: 12, fontFamily: 'monospace', color: 'var(--text)' }}>
        {endpoint.method} {buildUrl()}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: response ? 12 : 0 }}>
        <button
          onClick={handleTry}
          disabled={loading}
          aria-label="Run API request"
          style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: loading ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Running...' : 'Run'}
        </button>
        <button
          onClick={() => { onClose(); }}
          aria-label="Close request builder"
          style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}
        >
          Close
        </button>
      </div>

      {/* Response viewer */}
      {response && (
        <ResponseViewer response={response} onCopy={handleCopy} copied={copied} />
      )}
    </div>
  );
}

// ── EndpointCard ───────────────────────────────────────────────────────────

export function EndpointCard({ endpoint, org }) {
  const [expanded, setExpanded] = useState(false);
  const [tryOpen, setTryOpen] = useState(false);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
      {/* Header row */}
      <button
        onClick={() => setExpanded((x) => !x)}
        aria-expanded={expanded}
        aria-label={`${endpoint.method} ${endpoint.path} - ${endpoint.description}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '10px 16px',
          background: expanded ? 'var(--bg-subtle)' : 'var(--surface)',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <MethodBadge method={endpoint.method} />
        <code style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text)', flex: 1 }}>{endpoint.path}</code>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {endpoint.description}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px', backgroundColor: 'var(--bg-subtle)' }}>
          <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 16 }}>{endpoint.description}</p>

          {/* Parameters */}
          {endpoint.parameters.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parameters</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--border)' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text)' }}>Name</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text)' }}>In</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text)' }}>Required</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text)' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.parameters.map((p) => (
                    <tr key={p.name} style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                      <td style={{ padding: '6px 10px' }}><code style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{p.name}</code></td>
                      <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{p.in}</td>
                      <td style={{ padding: '6px 10px' }}>{p.required ? <span style={{ color: 'var(--danger)' }}>required</span> : <span style={{ color: 'var(--text-secondary)' }}>optional</span>}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--text)' }}>{p.description}{p.example ? <> (e.g. <code style={{ fontFamily: 'monospace' }}>{p.example}</code>)</> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Request body schema */}
          {endpoint.requestBody && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Request Body (JSON)</h4>
              <pre style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)', borderRadius: 6, padding: 12, fontSize: 12, overflow: 'auto', margin: 0 }}>{endpoint.requestBody}</pre>
            </div>
          )}

          {/* Response schema */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Response</h4>
            <code style={{ display: 'block', background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: 6, fontSize: 12, color: 'var(--text)', fontFamily: 'monospace' }}>{endpoint.responseSchema}</code>
          </div>

          {/* Try it */}
          {endpoint.sseOnly ? (
            <div style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 6, fontSize: 12, color: 'var(--warning)' }}>
              This is a Server-Sent Events stream. Use <code>new EventSource('{endpoint.path.replace('{org}', org)}')</code> in JavaScript to connect.
            </div>
          ) : (
            <div>
              {!tryOpen ? (
                <button
                  onClick={() => setTryOpen(true)}
                  aria-label={`Try ${endpoint.method} ${endpoint.path}`}
                  style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid var(--accent)', color: 'var(--accent)', background: 'var(--bg-subtle)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  Try it
                </button>
              ) : (
                <RequestBuilder
                  endpoint={endpoint}
                  org={org}
                  onClose={() => { setTryOpen(false); }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
