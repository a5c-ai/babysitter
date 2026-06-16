'use client';

import { useState } from 'react';

export function AssociationsSection({ associations = [], onAdd, onRemove }) {
  const [newKind, setNewKind] = useState('User');
  const [newName, setNewName] = useState('');

  const kinds = ['User', 'AgentDispatchRun', 'AgentSession'];

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd?.({ kind: newKind, name: newName.trim() });
    setNewName('');
  };

  const btnBase = {
    padding: '0.25rem 0.5rem',
    fontSize: '0.6875rem',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
  };

  const kindColors = {
    User: { bg: 'var(--surface-raised)', fg: 'var(--accent)' },
    AgentDispatchRun: { bg: 'var(--surface-raised)', fg: 'var(--danger)' },
    AgentSession: { bg: 'var(--surface-overlay)', fg: 'var(--accent)' },
  };

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        padding: '0.75rem',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--text)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
        }}
      >
        Associated
      </div>

      {associations.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
          {associations.map((a, i) => {
            const colors = kindColors[a.kind] || { bg: 'var(--surface-raised)', fg: 'var(--text-secondary)' };
            return (
              <div
                key={`${a.kind}-${a.name}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.25rem 0.5rem',
                  background: 'var(--surface-raised)',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span
                    style={{
                      background: colors.bg,
                      color: colors.fg,
                      borderRadius: '0.25rem',
                      padding: '0.0625rem 0.25rem',
                      fontWeight: 600,
                      fontSize: '0.625rem',
                    }}
                  >
                    {a.kind}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text)' }}>{a.name}</span>
                </div>
                <button
                  onClick={() => onRemove?.(a)}
                  style={{ ...btnBase, background: 'var(--surface-raised)', color: 'var(--danger)' }}
                  aria-label={`Remove association ${a.kind} ${a.name}`}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          No associations
        </div>
      )}

      {/* Add association form */}
      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={newKind}
          onChange={(e) => setNewKind(e.target.value)}
          aria-label="Association kind"
          style={{
            padding: '0.25rem 0.375rem',
            fontSize: '0.75rem',
            borderRadius: '0.25rem',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          {kinds.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Name"
          aria-label="Association name"
          style={{
            padding: '0.25rem 0.375rem',
            fontSize: '0.75rem',
            borderRadius: '0.25rem',
            border: '1px solid var(--border)',
            flex: 1,
            minWidth: '8rem',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          style={{
            ...btnBase,
            background: newName.trim() ? 'var(--accent)' : 'var(--border)',
            color: 'var(--surface)',
          }}
          aria-label="Add association"
        >
          Add
        </button>
      </div>
    </div>
  );
}
