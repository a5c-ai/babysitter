'use client';

import { useState } from 'react';

const BASE_AGENTS = ['claude-code', 'codex', 'gemini', 'opencode', 'babysitter', 'agent-mux-remote'];
const APPROVAL_MODES = ['prompt', 'deny', 'yolo', 'policy-derived'];

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box' };
const textareaStyle = { ...inputStyle, resize: 'vertical', fontFamily: 'inherit' };
const selectStyle = { ...inputStyle, background: '#fff' };
const fieldGroupStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };

function splitCsv(value) {
  return value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
}

function joinCsv(arr) {
  return (arr || []).join(', ');
}

export function StackBuilder({ org, existingStack = null }) {
  const isEditing = !!existingStack;
  const spec = existingStack?.spec || {};
  const meta = existingStack?.metadata || {};

  const [name, setName] = useState(meta.name || '');
  const [displayName, setDisplayName] = useState(meta.labels?.['krate.a5c.ai/display-name'] || spec.displayName || '');
  const [baseAgent, setBaseAgent] = useState(spec.baseAgent || spec.agent || 'claude-code');
  const [adapter, setAdapter] = useState(spec.adapter || '');
  const [model, setModel] = useState(spec.model || '');
  const [provider, setProvider] = useState(spec.provider || '');
  const [systemPrompt, setSystemPrompt] = useState(spec.systemPrompt || '');
  const [developerPrompt, setDeveloperPrompt] = useState(spec.developerPrompt || '');
  const [taskPrompt, setTaskPrompt] = useState(spec.taskPrompt || '');
  const [approvalMode, setApprovalMode] = useState(spec.approvalMode || 'prompt');
  const [mcpServerRefs, setMcpServerRefs] = useState(joinCsv(spec.mcpServerRefs));
  const [skillRefs, setSkillRefs] = useState(joinCsv(spec.skillRefs));
  const [subagentRefs, setSubagentRefs] = useState(joinCsv(spec.subagentRefs));

  const [status, setStatus] = useState('idle'); // idle | saving | success | error
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name) return;
    setStatus('saving');
    setMessage('');

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
        baseAgent,
        ...(adapter ? { adapter } : {}),
        ...(model ? { model } : {}),
        ...(provider ? { provider } : {}),
        ...(displayName ? { displayName } : {}),
        ...(systemPrompt ? { systemPrompt } : {}),
        ...(developerPrompt ? { developerPrompt } : {}),
        ...(taskPrompt ? { taskPrompt } : {}),
        approvalMode,
        ...(mcpServerRefs.trim() ? { mcpServerRefs: splitCsv(mcpServerRefs) } : {}),
        ...(skillRefs.trim() ? { skillRefs: splitCsv(skillRefs) } : {}),
        ...(subagentRefs.trim() ? { subagentRefs: splitCsv(subagentRefs) } : {}),
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
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Network error');
    }
  }

  const buttonStyle = { padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 };
  const primaryStyle = { ...buttonStyle, backgroundColor: '#2563eb', color: '#fff' };
  const disabledPrimaryStyle = { ...primaryStyle, opacity: 0.5, cursor: 'not-allowed' };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card" style={{ borderLeft: '3px solid var(--color-info, #3b82f6)' }}>
        <div className="cardTitle">
          <h3>{isEditing ? 'Edit stack' : 'New stack'}</h3>
          <span className="pill neutral">{isEditing ? 'editing' : 'create'}</span>
        </div>
        <div style={fieldGroupStyle}>
          {/* Row 1: Name + Display Name */}
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
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
                onChange={e => setDisplayName(e.target.value)}
                placeholder="My Agent Stack"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Row 2: Base Agent + Approval Mode */}
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Base Agent</label>
              <select value={baseAgent} onChange={e => setBaseAgent(e.target.value)} style={selectStyle}>
                {BASE_AGENTS.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Approval Mode</label>
              <select value={approvalMode} onChange={e => setApprovalMode(e.target.value)} style={selectStyle}>
                {APPROVAL_MODES.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Adapter + Model + Provider */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Adapter</label>
              <input
                type="text"
                value={adapter}
                onChange={e => setAdapter(e.target.value)}
                placeholder="default"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Model</label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="claude-sonnet-4-20250514"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Provider</label>
              <input
                type="text"
                value={provider}
                onChange={e => setProvider(e.target.value)}
                placeholder="anthropic"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Prompts */}
          <div>
            <label style={labelStyle}>System Prompt</label>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="Optional system prompt for the agent..."
              style={textareaStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Developer Prompt</label>
            <textarea
              rows={4}
              value={developerPrompt}
              onChange={e => setDeveloperPrompt(e.target.value)}
              placeholder="Optional developer prompt..."
              style={textareaStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Task Prompt</label>
            <textarea
              rows={4}
              value={taskPrompt}
              onChange={e => setTaskPrompt(e.target.value)}
              placeholder="Optional task prompt template..."
              style={textareaStyle}
            />
          </div>

          {/* Refs */}
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>MCP Server Refs <small style={{ fontWeight: 400, color: '#6b7280' }}>(comma-separated)</small></label>
              <input
                type="text"
                value={mcpServerRefs}
                onChange={e => setMcpServerRefs(e.target.value)}
                placeholder="server-a, server-b"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Skill Refs <small style={{ fontWeight: 400, color: '#6b7280' }}>(comma-separated)</small></label>
              <input
                type="text"
                value={skillRefs}
                onChange={e => setSkillRefs(e.target.value)}
                placeholder="skill-x, skill-y"
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Subagent Refs <small style={{ fontWeight: 400, color: '#6b7280' }}>(comma-separated)</small></label>
            <input
              type="text"
              value={subagentRefs}
              onChange={e => setSubagentRefs(e.target.value)}
              placeholder="subagent-1, subagent-2"
              style={inputStyle}
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
