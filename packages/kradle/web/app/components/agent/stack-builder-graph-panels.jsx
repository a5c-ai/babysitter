'use client';

import { useState, useEffect } from 'react';
import {
  labelStyle, inputStyle, sectionHeaderStyle, sectionBodyStyle,
  badgeStyle, memoryToggleStyle, memoryToggleSelectedStyle,
} from './stack-builder-graph-styles.jsx';

// ---------------------------------------------------------------------------
// Memory Repository Section
// ---------------------------------------------------------------------------

export function MemoryRepositorySection({ org, selectedRepos, onToggleRepo }) {
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
      .catch((err) => console.warn('[kradle]', err.message || err))
      .finally(() => { setLoading(false); setLoaded(true); });
  }, [open, org, loaded]);

  const selectionCount = selectedRepos?.length || 0;
  const selectedNames = new Set((selectedRepos || []).map((r) => r.name));

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={sectionHeaderStyle} onClick={() => setOpen((o) => !o)} role="button" tabIndex={0} aria-label="Toggle memory repository section" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); } }}>
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
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
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
                    role="button"
                    tabIndex={0}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} memory repository ${repoName}`}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleRepo({ name: repoName, url: repoUrl }); } }}
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
                      aria-hidden="true"
                    >
                      <div
                        style={{
                          width: 16, height: 16, borderRadius: '50%',
                          background: 'var(--surface)', position: 'absolute', top: 2,
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

export function ModelInferenceSection({ org, selectedInference, onSelectInference }) {
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
      .catch((err) => console.warn('[kradle]', err.message || err))
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
      <div style={sectionHeaderStyle} onClick={() => setOpen(o => !o)} role="button" tabIndex={0} aria-label="Toggle model inference section" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } }}>
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
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              No inference services available.{' '}
              <a href={`/orgs/${org}/inference`} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
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
                aria-label="Select KServe inference service"
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
                <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>
                    <strong>Endpoint:</strong>{' '}
                    <code style={{ fontSize: '0.75rem', background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: 3 }}>
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
