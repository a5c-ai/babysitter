'use client';
import { useState } from 'react';

const METHOD_COLORS = {
  GET: { bg: '#2563eb', text: '#fff' },
  POST: { bg: '#16a34a', text: '#fff' },
  DELETE: { bg: '#dc2626', text: '#fff' },
  PUT: { bg: '#d97706', text: '#fff' },
  PATCH: { bg: '#7c3aed', text: '#fff' },
};

const ENDPOINT_GROUPS = [
  {
    title: 'Health',
    description: 'Health and readiness checks',
    endpoints: [
      {
        method: 'GET',
        path: '/healthz',
        description: 'Returns 200 OK when the server is healthy.',
        parameters: [],
        requestBody: null,
        responseSchema: '{ ok: boolean, project: string }',
        sseOnly: false,
      },
    ],
  },
  {
    title: 'Resources',
    description: 'Kubernetes resource CRUD scoped to an organization',
    endpoints: [
      {
        method: 'GET',
        path: '/api/orgs/{org}/resources',
        description: 'List resources by kind within the organization namespace.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
          { name: 'kind', in: 'query', required: false, description: 'Resource kind (e.g. Repository, AgentStack)', example: 'Repository' },
        ],
        requestBody: null,
        responseSchema: '{ items: KrateResource[], total: number, kind: string }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/resources',
        description: 'Apply (create or update) a resource in the organization namespace.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: '{\n  "apiVersion": "krate.a5c.ai/v1alpha1",\n  "kind": "AgentStack",\n  "metadata": { "name": "my-stack" },\n  "spec": { "organizationRef": "default", "description": "My agent stack" }\n}',
        responseSchema: '{ resource: KrateResource, created: boolean, name: string }',
      },
      {
        method: 'DELETE',
        path: '/api/orgs/{org}/resources/{kind}/{name}',
        description: 'Delete a resource by kind and name from the organization namespace.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
          { name: 'kind', in: 'path', required: true, description: 'Resource kind', example: 'Repository' },
          { name: 'name', in: 'path', required: true, description: 'Resource name', example: 'my-repo' },
        ],
        requestBody: null,
        responseSchema: '{ deleted: boolean, name: string, kind: string }',
      },
    ],
  },
  {
    title: 'Secrets',
    description: 'Secret management via AgentSecretGrant resources',
    endpoints: [
      {
        method: 'GET',
        path: '/api/orgs/{org}/secrets',
        description: 'List all secrets (AgentSecretGrant resources) for the organization.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: null,
        responseSchema: '{ secrets: SecretItem[] }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/secrets',
        description: 'Create a secret (AgentSecretGrant) for the organization.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: '{\n  "name": "github-token",\n  "grantedTo": "agent-stack-builder",\n  "permissions": ["read"],\n  "data": {}\n}',
        responseSchema: '{ resource: KrateResource, created: boolean }',
      },
      {
        method: 'DELETE',
        path: '/api/orgs/{org}/secrets/{name}',
        description: 'Delete a secret by name from the organization.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
          { name: 'name', in: 'path', required: true, description: 'Secret name', example: 'github-token' },
        ],
        requestBody: null,
        responseSchema: '{ deleted: boolean, name: string }',
      },
      {
        method: 'GET',
        path: '/api/orgs/{org}/secret-grants',
        description: 'List all AgentSecretGrant resources (full resource view).',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: null,
        responseSchema: '{ items: KrateResource[], total: number }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/secret-grants',
        description: 'Create a fine-grained secret grant for an agent or system.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: '{\n  "name": "grant-github-token",\n  "secretName": "github-token",\n  "grantedTo": "agent-stack-builder",\n  "permissions": ["read"]\n}',
        responseSchema: '{ resource: KrateResource, created: boolean }',
      },
    ],
  },
  {
    title: 'Agents',
    description: 'Agent dispatch, memory queries, and real-time event streaming',
    endpoints: [
      {
        method: 'POST',
        path: '/api/orgs/{org}/agents/dispatch',
        description: 'Dispatch a new AgentDispatchRun against the named stack.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: '{\n  "stackRef": "claude-code-stack",\n  "repository": "my-repo",\n  "branch": "main",\n  "prompt": "Fix the failing tests in the auth module"\n}',
        responseSchema: '{ run: KrateResource, runName: string, status: string }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/agents/memory/query',
        description: 'Query the agent memory graph using graph, grep, or semantic strategy.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: '{\n  "query": "deployment failures in the auth module",\n  "strategy": "graph",\n  "topK": 10,\n  "context": { "organizationRef": "default" }\n}',
        responseSchema: '{ results: MemoryResult[], total: number, strategy: string }',
      },
      {
        method: 'GET',
        path: '/api/orgs/{org}/agents/events/stream',
        description: 'Server-Sent Events stream for real-time agent events. Use EventSource API in the browser. Not try-able from this explorer.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: null,
        responseSchema: 'text/event-stream — data: {"type":"<event>","payload":{...}}',
        sseOnly: true,
      },
    ],
  },
  {
    title: 'External',
    description: 'External backend sync, conflict resolution, and write intent management',
    endpoints: [
      {
        method: 'POST',
        path: '/api/orgs/{org}/external/sync',
        description: 'Trigger synchronization of an external binding against the provider.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: '{\n  "bindingName": "github-binding",\n  "kind": "Repository",\n  "localName": "my-repo",\n  "spec": {},\n  "externalEnvelope": {\n    "nativeId": "123456",\n    "url": "https://github.com/org/repo",\n    "etag": "abc123",\n    "providerRef": "github"\n  }\n}',
        responseSchema: '{ synced: boolean, resource: KrateResource, conflicts: any[] }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/external/conflicts/{name}/resolve',
        description: 'Resolve a named external sync conflict using local-wins, remote-wins, or manual strategy.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
          { name: 'name', in: 'path', required: true, description: 'Conflict resource name', example: 'repo-conflict-abc' },
        ],
        requestBody: '{\n  "strategy": "local-wins",\n  "resolvedValue": {},\n  "resources": {}\n}',
        responseSchema: '{ resolved: boolean, conflictName: string, strategy: string }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/external/write-intents/{name}/approve',
        description: 'Approve a pending external write intent, allowing the agent to write to the external provider.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
          { name: 'name', in: 'path', required: true, description: 'Write intent resource name', example: 'write-intent-push-abc' },
        ],
        requestBody: '{\n  "approvedBy": "alice",\n  "resources": {}\n}',
        responseSchema: '{ approved: boolean, intentName: string }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/external/write-intents/{name}/cancel',
        description: 'Cancel a pending external write intent.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
          { name: 'name', in: 'path', required: true, description: 'Write intent resource name', example: 'write-intent-push-abc' },
        ],
        requestBody: '{\n  "cancelledBy": "alice",\n  "resources": {}\n}',
        responseSchema: '{ cancelled: boolean, intentName: string }',
      },
    ],
  },
];

function MethodBadge({ method }) {
  const colors = METHOD_COLORS[method] || { bg: '#6b7280', text: '#fff' };
  return (
    <span style={{
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
    }}>
      {method}
    </span>
  );
}

function EndpointCard({ endpoint, org }) {
  const [expanded, setExpanded] = useState(false);
  const [tryOpen, setTryOpen] = useState(false);
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

  const statusColor = response
    ? response.ok ? '#16a34a' : '#dc2626'
    : '#6b7280';

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
      {/* Header row */}
      <button
        onClick={() => setExpanded((x) => !x)}
        aria-expanded={expanded}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '10px 16px',
          background: expanded ? '#f9fafb' : '#fff',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <MethodBadge method={endpoint.method} />
        <code style={{ fontSize: 13, fontFamily: 'monospace', color: '#111827', flex: 1 }}>{endpoint.path}</code>
        <span style={{ fontSize: 12, color: '#6b7280', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {endpoint.description}
        </span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px', backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: 13, color: '#374151', marginBottom: 16 }}>{endpoint.description}</p>

          {/* Parameters */}
          {endpoint.parameters.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parameters</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e7eb' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: '#374151' }}>Name</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: '#374151' }}>In</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: '#374151' }}>Required</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: '#374151' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.parameters.map((p) => (
                    <tr key={p.name} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
                      <td style={{ padding: '6px 10px' }}><code style={{ fontFamily: 'monospace', color: '#2563eb' }}>{p.name}</code></td>
                      <td style={{ padding: '6px 10px', color: '#6b7280' }}>{p.in}</td>
                      <td style={{ padding: '6px 10px' }}>{p.required ? <span style={{ color: '#dc2626' }}>required</span> : <span style={{ color: '#9ca3af' }}>optional</span>}</td>
                      <td style={{ padding: '6px 10px', color: '#374151' }}>{p.description}{p.example ? <> (e.g. <code style={{ fontFamily: 'monospace' }}>{p.example}</code>)</> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Request body schema */}
          {endpoint.requestBody && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Request Body (JSON)</h4>
              <pre style={{ background: '#1f2937', color: '#e5e7eb', borderRadius: 6, padding: 12, fontSize: 12, overflow: 'auto', margin: 0 }}>{endpoint.requestBody}</pre>
            </div>
          )}

          {/* Response schema */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Response</h4>
            <code style={{ display: 'block', background: '#f3f4f6', padding: '8px 12px', borderRadius: 6, fontSize: 12, color: '#374151', fontFamily: 'monospace' }}>{endpoint.responseSchema}</code>
          </div>

          {/* Try it */}
          {endpoint.sseOnly ? (
            <div style={{ padding: '8px 12px', background: '#fef3c7', borderRadius: 6, fontSize: 12, color: '#92400e' }}>
              This is a Server-Sent Events stream. Use <code>new EventSource('{endpoint.path.replace('{org}', org)}')</code> in JavaScript to connect.
            </div>
          ) : (
            <div>
              {!tryOpen ? (
                <button
                  onClick={() => setTryOpen(true)}
                  style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #2563eb', color: '#2563eb', background: '#eff6ff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  Try it
                </button>
              ) : (
                <div style={{ marginTop: 8, border: '1px solid #dbeafe', borderRadius: 8, padding: 12, background: '#fff' }}>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: '#1d4ed8', marginBottom: 12 }}>Try it — {endpoint.method} {endpoint.path}</h4>

                  {/* Path params input */}
                  {pathParamNames.filter((k) => k !== 'org').map((key) => (
                    <div key={key} style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                        {key} <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        value={pathParams[key] || ''}
                        onChange={(e) => setPathParams((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={`Enter ${key}`}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}

                  {/* Query params */}
                  {endpoint.parameters.filter((p) => p.in === 'query').map((p) => (
                    <div key={p.name} style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                        {p.name} {p.required && <span style={{ color: '#dc2626' }}>*</span>}
                        <span style={{ fontWeight: 400, color: '#6b7280' }}> (query)</span>
                      </label>
                      <input
                        value={queryParams[p.name] || ''}
                        onChange={(e) => setQueryParams((q) => ({ ...q, [p.name]: e.target.value }))}
                        placeholder={p.example || `Enter ${p.name}`}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}

                  {/* Body textarea */}
                  {endpoint.method !== 'GET' && endpoint.method !== 'DELETE' && (
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Request Body (JSON)</label>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={8}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12, fontFamily: 'monospace', boxSizing: 'border-box', resize: 'vertical' }}
                      />
                    </div>
                  )}

                  {/* URL preview */}
                  <div style={{ marginBottom: 12, padding: '6px 10px', background: '#f3f4f6', borderRadius: 4, fontSize: 12, fontFamily: 'monospace', color: '#374151' }}>
                    {endpoint.method} {buildUrl()}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: response ? 12 : 0 }}>
                    <button
                      onClick={handleTry}
                      disabled={loading}
                      style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: loading ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600, opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? 'Running...' : 'Run'}
                    </button>
                    <button
                      onClick={() => { setTryOpen(false); setResponse(null); }}
                      style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 13 }}
                    >
                      Close
                    </button>
                  </div>

                  {/* Response viewer */}
                  {response && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>
                          HTTP {response.status}
                        </span>
                        <span style={{ fontSize: 12, color: statusColor }}>
                          {response.ok ? 'OK' : 'Error'}
                        </span>
                        <button
                          onClick={handleCopy}
                          style={{ marginLeft: 'auto', padding: '2px 10px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 11 }}
                        >
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre style={{ background: '#1f2937', color: '#e5e7eb', borderRadius: 6, padding: 12, fontSize: 12, overflow: 'auto', margin: 0, maxHeight: 320 }}>
                        {typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ApiExplorer({ org = 'default' }) {
  const [activeGroup, setActiveGroup] = useState(null);

  const totalEndpoints = ENDPOINT_GROUPS.reduce((sum, g) => sum + g.endpoints.length, 0);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '10px 16px', background: '#f3f4f6', borderRadius: 8, fontSize: 13 }}>
        <span style={{ color: '#374151' }}><strong>{totalEndpoints}</strong> endpoints</span>
        <span style={{ color: '#d1d5db' }}>|</span>
        <span style={{ color: '#374151' }}><strong>{ENDPOINT_GROUPS.length}</strong> groups</span>
        <span style={{ color: '#d1d5db' }}>|</span>
        <span style={{ color: '#6b7280' }}>Organization: <code style={{ fontFamily: 'monospace', color: '#2563eb' }}>{org}</code></span>
        <a
          href={`/api/orgs/${org}/resources`}
          style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}
          target="_blank"
          rel="noreferrer"
        >
          OpenAPI spec (openapi.yaml) &rarr;
        </a>
      </div>

      {/* Group filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveGroup(null)}
          style={{
            padding: '4px 14px', borderRadius: 20, border: '1px solid #d1d5db',
            background: activeGroup === null ? '#2563eb' : '#fff',
            color: activeGroup === null ? '#fff' : '#374151',
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}
        >
          All
        </button>
        {ENDPOINT_GROUPS.map((g) => (
          <button
            key={g.title}
            onClick={() => setActiveGroup(g.title === activeGroup ? null : g.title)}
            style={{
              padding: '4px 14px', borderRadius: 20, border: '1px solid #d1d5db',
              background: activeGroup === g.title ? '#2563eb' : '#fff',
              color: activeGroup === g.title ? '#fff' : '#374151',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            {g.title}
          </button>
        ))}
      </div>

      {/* Endpoint groups */}
      {ENDPOINT_GROUPS.filter((g) => !activeGroup || g.title === activeGroup).map((group) => (
        <div key={group.title} style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{group.title}</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>{group.description}</p>
          </div>
          {group.endpoints.map((endpoint, i) => (
            <EndpointCard key={`${endpoint.method}-${endpoint.path}-${i}`} endpoint={endpoint} org={org} />
          ))}
        </div>
      ))}
    </div>
  );
}
