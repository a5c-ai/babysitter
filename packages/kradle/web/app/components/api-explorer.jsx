'use client';
import { useState } from 'react';
import { ENDPOINT_GROUPS, EndpointCard } from './api-explorer-helpers.jsx';

export function ApiExplorer({ org = 'default' }) {
  const [activeGroup, setActiveGroup] = useState(null);

  const totalEndpoints = ENDPOINT_GROUPS.reduce((sum, g) => sum + g.endpoints.length, 0);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '10px 16px', background: 'var(--bg-subtle)', borderRadius: 8, fontSize: 13 }}>
        <span style={{ color: 'var(--text)' }}><strong>{totalEndpoints}</strong> endpoints</span>
        <span style={{ color: '#d1d5db' }}>|</span>
        <span style={{ color: 'var(--text)' }}><strong>{ENDPOINT_GROUPS.length}</strong> groups</span>
        <span style={{ color: '#d1d5db' }}>|</span>
        <span style={{ color: 'var(--text-muted)' }}>Organization: <code style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{org}</code></span>
        <a
          href={`/api/orgs/${org}/resources`}
          aria-label="View OpenAPI specification"
          style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}
          target="_blank"
          rel="noreferrer"
        >
          OpenAPI spec (openapi.yaml) &rarr;
        </a>
      </div>

      {/* Group filter pills */}
      <div role="tablist" aria-label="Endpoint group filter" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          role="tab"
          aria-selected={activeGroup === null}
          aria-label="Show all endpoint groups"
          onClick={() => setActiveGroup(null)}
          style={{
            padding: '4px 14px', borderRadius: 20, border: '1px solid var(--border)',
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
            role="tab"
            aria-selected={activeGroup === g.title}
            aria-label={`Filter to ${g.title} endpoints`}
            onClick={() => setActiveGroup(g.title === activeGroup ? null : g.title)}
            style={{
              padding: '4px 14px', borderRadius: 20, border: '1px solid var(--border)',
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
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{group.title}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0' }}>{group.description}</p>
          </div>
          {group.endpoints.map((endpoint, i) => (
            <EndpointCard key={`${endpoint.method}-${endpoint.path}-${i}`} endpoint={endpoint} org={org} />
          ))}
        </div>
      ))}
    </div>
  );
}
