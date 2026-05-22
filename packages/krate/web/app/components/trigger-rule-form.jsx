'use client';

import { useState } from 'react';

const EVENT_TYPES = ['push', 'pull_request', 'issue', 'comment', 'schedule', 'webhook', 'manual'];
const TASK_KINDS = ['diagnostic', 'repair', 'review', 'custom'];

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box' };
const selectStyle = { ...inputStyle, background: '#fff' };
const fieldGroupStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };

export function TriggerRuleForm({ org, stacks = [] }) {
  const [name, setName] = useState('');
  const [selectedSources, setSelectedSources] = useState([]);
  const [stackRef, setStackRef] = useState('');
  const [taskKind, setTaskKind] = useState('diagnostic');
  const [repository, setRepository] = useState('');
  const [condition, setCondition] = useState('');

  const [status, setStatus] = useState('idle'); // idle | saving | success | error
  const [message, setMessage] = useState('');

  function toggleSource(eventType) {
    setSelectedSources(prev =>
      prev.includes(eventType)
        ? prev.filter(s => s !== eventType)
        : [...prev, eventType]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !stackRef) return;
    setStatus('saving');
    setMessage('');

    const resource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'AgentTriggerRule',
      metadata: { name },
      spec: {
        sources: selectedSources,
        agentStack: stackRef,
        taskKind,
        ...(repository.trim() ? { repository: repository.trim() } : {}),
        ...(condition.trim() ? { condition: condition.trim() } : {}),
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
        setMessage(data.message || data.reason || 'Failed to create trigger rule');
      } else {
        setStatus('success');
        setMessage(`Trigger rule "${name}" created successfully.`);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Network error');
    }
  }

  const buttonStyle = { padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 };
  const primaryStyle = { ...buttonStyle, backgroundColor: '#2563eb', color: '#fff' };
  const disabledPrimaryStyle = { ...primaryStyle, opacity: 0.5, cursor: 'not-allowed' };
  const canSubmit = name && stackRef && status !== 'saving';

  return (
    <form onSubmit={handleSubmit}>
      <div className="card" style={{ borderLeft: '3px solid var(--color-info, #3b82f6)' }}>
        <div className="cardTitle">
          <h3>New trigger rule</h3>
          <span className="pill neutral">create</span>
        </div>
        <div style={fieldGroupStyle}>
          <div>
            <label htmlFor="trigger-name" style={labelStyle}>Name <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span></label>
            <input
              id="trigger-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="my-trigger-rule"
              required
              aria-required="true"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Event types (sources)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {EVENT_TYPES.map(eventType => (
                <label
                  key={eventType}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(eventType)}
                    onChange={() => toggleSource(eventType)}
                  />
                  {eventType}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="trigger-stack" style={labelStyle}>Target stack <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span></label>
            <select
              id="trigger-stack"
              value={stackRef}
              onChange={e => setStackRef(e.target.value)}
              required
              aria-required="true"
              style={selectStyle}
            >
              <option value="">Select a stack...</option>
              {stacks.map(stack => (
                <option key={stack} value={stack}>{stack}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="trigger-task-kind" style={labelStyle}>Task kind</label>
            <select
              id="trigger-task-kind"
              value={taskKind}
              onChange={e => setTaskKind(e.target.value)}
              style={selectStyle}
            >
              {TASK_KINDS.map(kind => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="trigger-repository" style={labelStyle}>Repository filter <small style={{ fontWeight: 400, color: '#6b7280' }}>(optional — leave empty for all repos)</small></label>
            <input
              id="trigger-repository"
              type="text"
              value={repository}
              onChange={e => setRepository(e.target.value)}
              placeholder="owner/repo or owner/*"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="trigger-condition" style={labelStyle}>Condition expression <small style={{ fontWeight: 400, color: '#6b7280' }}>(optional)</small></label>
            <input
              id="trigger-condition"
              type="text"
              value={condition}
              onChange={e => setCondition(e.target.value)}
              placeholder="e.g. event.branch == 'main'"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={!canSubmit}
              style={!canSubmit ? disabledPrimaryStyle : primaryStyle}
            >
              {status === 'saving' ? 'Creating...' : 'Create Rule'}
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
