'use client';
import { useState } from 'react';

const NODE_KIND_COLORS = [
  { label: 'Blue', value: '#3b82f6', bg: '#dbeafe', text: '#1d4ed8' },
  { label: 'Green', value: '#22c55e', bg: '#dcfce7', text: '#15803d' },
  { label: 'Purple', value: '#a855f7', bg: '#f3e8ff', text: '#7e22ce' },
  { label: 'Orange', value: '#f97316', bg: '#ffedd5', text: '#c2410c' },
  { label: 'Rose', value: '#f43f5e', bg: '#ffe4e6', text: '#be123c' },
  { label: 'Teal', value: '#14b8a6', bg: '#ccfbf1', text: '#0f766e' },
  { label: 'Amber', value: '#f59e0b', bg: '#fef3c7', text: '#b45309' },
  { label: 'Slate', value: '#64748b', bg: '#f1f5f9', text: '#334155' },
];

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
      {NODE_KIND_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          title={c.label}
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: c.value,
            border: value === c.value ? '3px solid #111' : '2px solid transparent',
            cursor: 'pointer',
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}

function colorForKind(color) {
  const found = NODE_KIND_COLORS.find((c) => c.value === color);
  return found || NODE_KIND_COLORS[0];
}

function NodeKindBadge({ kind }) {
  const palette = colorForKind(kind.color);
  return (
    <span style={{
      background: palette.bg,
      color: palette.text,
      fontSize: '0.75rem',
      fontWeight: 600,
      padding: '0.125rem 0.5rem',
      borderRadius: '9999px',
      display: 'inline-block',
    }}>
      {kind.name}
    </span>
  );
}

export function MemoryOntologyEditor({ org, initialOntology = null, memoryRepository = '' }) {
  const existing = initialOntology;
  const existingName = existing?.metadata?.name || '';
  const [ontologyName, setOntologyName] = useState(existingName || 'default');
  const [memRepo, setMemRepo] = useState(existing?.spec?.memoryRepository || memoryRepository || '');
  const [ontologyPath, setOntologyPath] = useState(existing?.spec?.ontologyPath || '.krate/ontology.yaml');
  const [nodeKinds, setNodeKinds] = useState(
    (existing?.spec?.nodeKinds || []).map((k) =>
      typeof k === 'string' ? { name: k, description: '', color: '#3b82f6' } : k
    )
  );
  const [edgeKinds, setEdgeKinds] = useState(
    (existing?.spec?.edgeKinds || []).map((k) =>
      typeof k === 'string' ? { name: k, sourceKinds: [], targetKinds: [] } : k
    )
  );

  // New node kind form state
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const [newNodeColor, setNewNodeColor] = useState('#3b82f6');
  const [showNodeForm, setShowNodeForm] = useState(false);

  // New edge kind form state
  const [newEdgeName, setNewEdgeName] = useState('');
  const [newEdgeSource, setNewEdgeSource] = useState('');
  const [newEdgeTarget, setNewEdgeTarget] = useState('');
  const [showEdgeForm, setShowEdgeForm] = useState(false);

  // Save state
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [saveError, setSaveError] = useState('');

  function addNodeKind() {
    const name = newNodeName.trim();
    if (!name) return;
    if (nodeKinds.some((k) => k.name === name)) return;
    setNodeKinds([...nodeKinds, { name, description: newNodeDesc.trim(), color: newNodeColor }]);
    setNewNodeName('');
    setNewNodeDesc('');
    setNewNodeColor('#3b82f6');
    setShowNodeForm(false);
  }

  function removeNodeKind(name) {
    setNodeKinds(nodeKinds.filter((k) => k.name !== name));
  }

  function addEdgeKind() {
    const name = newEdgeName.trim();
    if (!name) return;
    if (edgeKinds.some((k) => k.name === name)) return;
    const sourceKinds = newEdgeSource.split(',').map((s) => s.trim()).filter(Boolean);
    const targetKinds = newEdgeTarget.split(',').map((s) => s.trim()).filter(Boolean);
    setEdgeKinds([...edgeKinds, { name, sourceKinds, targetKinds }]);
    setNewEdgeName('');
    setNewEdgeSource('');
    setNewEdgeTarget('');
    setShowEdgeForm(false);
  }

  function removeEdgeKind(name) {
    setEdgeKinds(edgeKinds.filter((k) => k.name !== name));
  }

  async function handleSave() {
    setSaveStatus('saving');
    setSaveError('');
    const resource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'AgentMemoryOntology',
      metadata: { name: ontologyName },
      spec: {
        memoryRepository: memRepo || 'default',
        ontologyPath: ontologyPath || '.krate/ontology.yaml',
        nodeKinds: nodeKinds.map((k) => ({ name: k.name, description: k.description, color: k.color })),
        edgeKinds: edgeKinds.map((k) => ({ name: k.name, sourceKinds: k.sourceKinds, targetKinds: k.targetKinds })),
      },
    };
    try {
      const res = await fetch(`/api/orgs/${org}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resource),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.message || data.error || `Save failed (${res.status})`);
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveError(err.message);
      setSaveStatus('error');
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.375rem 0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    fontSize: '0.8125rem',
    boxSizing: 'border-box',
  };
  const btnPrimary = {
    padding: '0.375rem 0.875rem',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
  };
  const btnSecondary = {
    padding: '0.375rem 0.875rem',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
  };
  const btnDanger = {
    padding: '0.25rem 0.5rem',
    background: 'transparent',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Ontology identity */}
      <div className="card">
        <div className="cardTitle"><h3>Ontology identity</h3></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Name</label>
            <input type="text" value={ontologyName} onChange={(e) => setOntologyName(e.target.value)} placeholder="default" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Memory repository</label>
            <input type="text" value={memRepo} onChange={(e) => setMemRepo(e.target.value)} placeholder="org-memory" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Ontology path</label>
            <input type="text" value={ontologyPath} onChange={(e) => setOntologyPath(e.target.value)} placeholder=".krate/ontology.yaml" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Node kinds */}
      <div className="card">
        <div className="cardTitle">
          <h3>Node kinds</h3>
          <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{nodeKinds.length}</span>
        </div>
        {nodeKinds.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {nodeKinds.map((kind) => (
              <div key={kind.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                <NodeKindBadge kind={kind} />
                <span style={{ flex: 1, fontSize: '0.8125rem', color: '#6b7280' }}>{kind.description || <em>No description</em>}</span>
                <button style={btnDanger} onClick={() => removeNodeKind(kind.name)}>Remove</button>
              </div>
            ))}
          </div>
        )}
        {showNodeForm ? (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input type="text" value={newNodeName} onChange={(e) => setNewNodeName(e.target.value)} placeholder="e.g. Service" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Description</label>
              <input type="text" value={newNodeDesc} onChange={(e) => setNewNodeDesc(e.target.value)} placeholder="Optional description" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.375rem' }}>Color</label>
              <ColorPicker value={newNodeColor} onChange={setNewNodeColor} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={btnPrimary} onClick={addNodeKind} disabled={!newNodeName.trim()}>Add node kind</button>
              <button style={btnSecondary} onClick={() => setShowNodeForm(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button style={btnSecondary} onClick={() => setShowNodeForm(true)}>+ Add node kind</button>
        )}
      </div>

      {/* Edge kinds */}
      <div className="card">
        <div className="cardTitle">
          <h3>Edge kinds</h3>
          <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{edgeKinds.length}</span>
        </div>
        {edgeKinds.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {edgeKinds.map((kind) => (
              <div key={kind.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem', minWidth: 120 }}>{kind.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', flex: 1 }}>
                  {kind.sourceKinds?.length ? <><strong>from:</strong> {kind.sourceKinds.join(', ')}</> : 'any source'}
                  {' '}
                  {kind.targetKinds?.length ? <> → <strong>to:</strong> {kind.targetKinds.join(', ')}</> : '→ any target'}
                </span>
                <button style={btnDanger} onClick={() => removeEdgeKind(kind.name)}>Remove</button>
              </div>
            ))}
          </div>
        )}
        {showEdgeForm ? (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input type="text" value={newEdgeName} onChange={(e) => setNewEdgeName(e.target.value)} placeholder="e.g. depends_on" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Source kinds</label>
              <input type="text" value={newEdgeSource} onChange={(e) => setNewEdgeSource(e.target.value)} placeholder="Service, Team (comma-separated, or leave empty for any)" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Target kinds</label>
              <input type="text" value={newEdgeTarget} onChange={(e) => setNewEdgeTarget(e.target.value)} placeholder="Service, API (comma-separated, or leave empty for any)" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={btnPrimary} onClick={addEdgeKind} disabled={!newEdgeName.trim()}>Add edge kind</button>
              <button style={btnSecondary} onClick={() => setShowEdgeForm(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button style={btnSecondary} onClick={() => setShowEdgeForm(true)}>+ Add edge kind</button>
        )}
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          style={{ ...btnPrimary, padding: '0.5rem 1.5rem', fontSize: '0.875rem', opacity: saveStatus === 'saving' ? 0.7 : 1, cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer' }}
          onClick={handleSave}
          disabled={saveStatus === 'saving' || !ontologyName.trim()}
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save ontology'}
        </button>
        {saveStatus === 'saved' && (
          <span style={{ color: '#15803d', fontSize: '0.875rem', fontWeight: 500 }}>Saved successfully</span>
        )}
        {saveStatus === 'error' && (
          <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>{saveError}</span>
        )}
      </div>
    </div>
  );
}
