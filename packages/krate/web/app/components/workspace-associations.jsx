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
    User: { bg: '#dbeafe', fg: '#1e40af' },
    AgentDispatchRun: { bg: '#fce7f3', fg: '#9d174d' },
    AgentSession: { bg: '#e0e7ff', fg: '#3730a3' },
  };

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '0.75rem',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#374151',
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
            const colors = kindColors[a.kind] || { bg: '#f3f4f6', fg: '#6b7280' };
            return (
              <div
                key={`${a.kind}-${a.name}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.25rem 0.5rem',
                  background: '#f9fafb',
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
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', color: '#111827' }}>{a.name}</span>
                </div>
                <button
                  onClick={() => onRemove?.(a)}
                  style={{ ...btnBase, background: '#fee2e2', color: '#991b1b' }}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
          No associations
        </div>
      )}

      {/* Add association form */}
      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={newKind}
          onChange={(e) => setNewKind(e.target.value)}
          style={{
            padding: '0.25rem 0.375rem',
            fontSize: '0.75rem',
            borderRadius: '0.25rem',
            border: '1px solid #d1d5db',
            background: '#fff',
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
          style={{
            padding: '0.25rem 0.375rem',
            fontSize: '0.75rem',
            borderRadius: '0.25rem',
            border: '1px solid #d1d5db',
            flex: 1,
            minWidth: '8rem',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          style={{
            ...btnBase,
            background: newName.trim() ? '#2563eb' : '#d1d5db',
            color: '#fff',
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
