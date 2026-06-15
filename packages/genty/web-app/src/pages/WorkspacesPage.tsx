import { useState } from 'react';
import { WorkspacePanel } from '@a5c-ai/genty-ui/workspace';
import type { WorkspaceResource } from '@a5c-ai/genty-ui/workspace';

const PLACEHOLDER_WORKSPACES: WorkspaceResource[] = [
  {
    metadata: { name: 'default' },
    spec: { repository: 'github.com/a5c-ai/babysitter', branch: 'main' },
    status: { phase: 'Ready' },
  },
  {
    metadata: { name: 'research' },
    spec: { repository: 'github.com/a5c-ai/research', branch: 'staging' },
    status: { phase: 'Pending' },
  },
];

export function WorkspacesPage() {
  const [selected, setSelected] = useState<WorkspaceResource | null>(null);

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '100%' }}>
      <aside style={{ width: 240, flexShrink: 0 }}>
        <h2 style={{ margin: '0 0 1rem' }}>Workspaces</h2>
        {PLACEHOLDER_WORKSPACES.map((ws) => (
          <div
            key={ws.metadata?.name}
            onClick={() => setSelected(ws)}
            style={{
              padding: '0.75rem',
              marginBottom: '0.5rem',
              background: selected?.metadata?.name === ws.metadata?.name ? '#1e293b' : '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              cursor: 'pointer',
              color: selected?.metadata?.name === ws.metadata?.name ? '#fff' : 'inherit',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13 }}>{ws.metadata?.name}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{ws.status?.phase}</div>
          </div>
        ))}
      </aside>
      <main style={{ flex: 1, overflow: 'auto' }}>
        {selected ? (
          <WorkspacePanel workspace={selected} org="default" />
        ) : (
          <div style={{ color: '#64748b', marginTop: '2rem' }}>Select a workspace to view details.</div>
        )}
      </main>
    </div>
  );
}
