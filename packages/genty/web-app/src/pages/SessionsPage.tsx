import { useState } from 'react';
import { SessionShell, SessionCost } from '@a5c-ai/genty-ui/session';
import type { SessionRecord } from '@a5c-ai/genty-ui/session';

const PLACEHOLDER_SESSIONS: SessionRecord[] = [
  {
    metadata: { name: 'session-001', creationTimestamp: new Date().toISOString() },
    spec: { workspace: 'default', model: 'claude-sonnet-4', agentStack: 'default' },
    status: { phase: 'Running', cost: 0.12, startedAt: new Date().toISOString() },
  },
  {
    metadata: { name: 'session-002', creationTimestamp: new Date(Date.now() - 3600000).toISOString() },
    spec: { workspace: 'research', model: 'claude-opus-4', agentStack: 'research' },
    status: { phase: 'Succeeded', cost: 1.45, startedAt: new Date(Date.now() - 3600000).toISOString() },
  },
];

export function SessionsPage() {
  const [selected, setSelected] = useState<SessionRecord | null>(null);

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '100%' }}>
      <aside style={{ width: 260, flexShrink: 0 }}>
        <h2 style={{ margin: '0 0 1rem' }}>Sessions</h2>
        {PLACEHOLDER_SESSIONS.map((s) => (
          <div
            key={s.metadata?.name}
            onClick={() => setSelected(s)}
            style={{
              padding: '0.75rem',
              marginBottom: '0.5rem',
              background: selected?.metadata?.name === s.metadata?.name ? '#1e293b' : '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              cursor: 'pointer',
              color: selected?.metadata?.name === s.metadata?.name ? '#fff' : 'inherit',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13 }}>{s.metadata?.name}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{s.status?.phase} · {s.spec?.model}</div>
            <SessionCost turns={[]} totalCost={Number(s.status?.cost ?? 0)} compact />
          </div>
        ))}
      </aside>
      <main style={{ flex: 1, overflow: 'auto' }}>
        {selected ? (
          <SessionShell session={selected} />
        ) : (
          <div style={{ color: '#64748b', marginTop: '2rem' }}>Select a session to view details.</div>
        )}
      </main>
    </div>
  );
}
