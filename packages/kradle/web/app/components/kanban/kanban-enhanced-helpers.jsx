'use client';

// ---------------------------------------------------------------------------
// kanban-enhanced-helpers.jsx — shared styles, constants, drag-and-drop
// utilities, and presentational sub-components for the enhanced kanban board.
// ---------------------------------------------------------------------------

import { useState } from 'react';

// ── Workflow column definitions ────────────────────────────────────────────

export const WORKFLOW_COLUMNS = [
  { id: 'todo', label: 'Todo', color: 'var(--text-muted)', wipLimit: null },
  { id: 'in-progress', label: 'In Progress', color: '#eab308', wipLimit: 5 },
  { id: 'review', label: 'Review', color: '#3b82f6', wipLimit: 3 },
  { id: 'done', label: 'Done', color: '#22c55e', wipLimit: null },
];

// ── Priority helpers ───────────────────────────────────────────────────────

export function priorityColor(priority) {
  switch ((priority || '').toLowerCase()) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
    default: return '#9ca3af';
  }
}

// ── Drag-and-drop utilities ────────────────────────────────────────────────

export function createDragHandlers({ dragItemRef, setDraggingId, setDragOverCol }) {
  function handleDragStart(e, item) {
    const id = item.metadata?.name || item.spec?.title;
    dragItemRef.current = item;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverCol(null);
    dragItemRef.current = null;
  }

  function handleDragOver(e, colId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCol(null);
    }
  }

  return { handleDragStart, handleDragEnd, handleDragOver, handleDragLeave };
}

// ── Keyframe style block ───────────────────────────────────────────────────

export const KANBAN_PULSE_STYLE = `
  @keyframes kanbanPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.85); }
  }
`;

// ── CardDetailModal ────────────────────────────────────────────────────────

export function CardDetailModal({ item, onClose, columnColor, org = 'default' }) {
  const name = item.metadata?.name || item.spec?.title || 'Untitled';
  const title = item.spec?.title || name;
  const description = item.spec?.description || item.spec?.body || null;
  const assignee = item.spec?.assignee || null;
  const priority = item.spec?.priority || null;
  const labels = item.spec?.labels || [];
  const storyPoints = item.spec?.storyPoints || item.spec?.points || null;
  const createdAt = item.metadata?.creationTimestamp || item.spec?.createdAt || null;
  const updatedAt = item.status?.updatedAt || item.spec?.updatedAt || null;
  const workspaceRef = item.workspaceRef || item.spec?.workspaceRef || null;
  const workspacePvcStatus = item.workspacePvcStatus || item.spec?.workspacePvcStatus || null;
  const sessionRef = item.sessionRef || item.spec?.sessionRef || null;
  const sessionStatus = item.sessionStatus || item.spec?.sessionStatus || null;
  const dispatchRunRef = item.dispatchRunRef || item.spec?.dispatchRunRef || null;
  const agentName = item.agentName || item.spec?.agentName || (item.status?.agentActive ? 'Agent active' : null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Card detail: ${title}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '0.75rem',
          width: '100%',
          maxWidth: '36rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            borderTop: `4px solid ${columnColor}`,
            padding: '1.25rem 1.5rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, lineHeight: 1.4 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close card detail"
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: 'var(--text-muted)',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              flexShrink: 0,
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {description ? (
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>{description}</p>
          ) : (
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No description provided.</p>
          )}
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.375rem 1rem', fontSize: '0.8125rem' }}>
            {assignee ? (
              <>
                <dt style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Assignee</dt>
                <dd style={{ margin: 0 }}>{assignee}</dd>
              </>
            ) : null}
            {priority ? (
              <>
                <dt style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Priority</dt>
                <dd style={{ margin: 0 }}>
                  <span style={{ color: priorityColor(priority), fontWeight: 600 }}>{priority}</span>
                </dd>
              </>
            ) : null}
            {storyPoints != null ? (
              <>
                <dt style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Story points</dt>
                <dd style={{ margin: 0 }}>{storyPoints}</dd>
              </>
            ) : null}
            {workspaceRef ? (
              <>
                <dt style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Workspace</dt>
                <dd style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <code style={{ fontSize: '0.75rem' }}>{workspaceRef}</code>
                  {workspacePvcStatus ? (
                    <span style={{
                      fontSize: '0.625rem',
                      padding: '0.0625rem 0.375rem',
                      borderRadius: '9999px',
                      background: workspacePvcStatus === 'Bound' ? '#dcfce7' : '#fef3c7',
                      color: workspacePvcStatus === 'Bound' ? '#16a34a' : '#92400e',
                      fontWeight: 600,
                    }}>
                      {workspacePvcStatus}
                    </span>
                  ) : null}
                </dd>
              </>
            ) : null}
            {sessionRef ? (
              <>
                <dt style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Session</dt>
                <dd style={{ margin: 0 }}>
                  <a href={`/orgs/${encodeURIComponent(org)}/agents/sessions/${sessionRef}`} aria-label={`View session ${sessionRef.slice(0, 16)}`} style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>
                    {sessionRef.slice(0, 16)}…
                  </a>
                  {sessionStatus ? <span style={{ marginLeft: '0.375rem', color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{sessionStatus}</span> : null}
                </dd>
              </>
            ) : null}
            {dispatchRunRef ? (
              <>
                <dt style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Run</dt>
                <dd style={{ margin: 0 }}>
                  <a href={`/orgs/${encodeURIComponent(org)}/agents/runs/${dispatchRunRef}`} aria-label={`View run ${dispatchRunRef.slice(0, 16)}`} style={{ color: '#7c3aed', fontSize: '0.75rem' }}>
                    {dispatchRunRef.slice(0, 16)}…
                  </a>
                </dd>
              </>
            ) : null}
            {agentName ? (
              <>
                <dt style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Agent</dt>
                <dd style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#059669' }}>
                  <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', background: '#10b981', flexShrink: 0, animation: 'kanbanPulse 2s infinite' }} />
                  {agentName}
                </dd>
              </>
            ) : null}
            {createdAt ? (
              <>
                <dt style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Created</dt>
                <dd style={{ margin: 0 }}>{createdAt}</dd>
              </>
            ) : null}
            {updatedAt ? (
              <>
                <dt style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Updated</dt>
                <dd style={{ margin: 0 }}>{updatedAt}</dd>
              </>
            ) : null}
          </dl>
          {labels.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {labels.map((label) => (
                <span
                  key={label}
                  className="pill neutral"
                  style={{ fontSize: '0.6875rem' }}
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
          {(item.status?.linkedSessions || item.status?.linkedWorkspaces) ? (
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {item.status?.linkedSessions ? <span>{item.status.linkedSessions} sessions</span> : null}
              {item.status?.linkedWorkspaces ? <span>{item.status.linkedWorkspaces} workspaces</span> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── StartWorkDialog ────────────────────────────────────────────────────────

export function StartWorkDialog({ item, onConfirm, onCancel, org }) {
  const [loading, setLoading] = useState(false);
  const name = item.spec?.title || item.metadata?.name || 'this item';
  const repoRef = item.spec?.repoRef || item.spec?.repository || null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(item);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Start work on ${name}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          maxWidth: '28rem',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700 }}>
          Start work on &quot;{name}&quot;?
        </h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          This will create or claim a KrateWorkspace for{' '}
          {repoRef ? `repository ${repoRef}` : 'this item'} and link it to the board card.
        </p>
        {repoRef ? (
          <div style={{ margin: '0 0 1rem', padding: '0.5rem 0.75rem', background: '#f0fdf4', borderRadius: '0.375rem', fontSize: '0.8125rem' }}>
            <strong>Repository:</strong> <code>{repoRef}</code>
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleConfirm}
            disabled={loading}
            aria-label="Create workspace for this item"
            style={{
              flex: 1,
              padding: '0.5rem',
              background: loading ? '#93c5fd' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {loading ? 'Creating…' : 'Create workspace'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            aria-label="Skip workspace creation"
            style={{
              flex: 1,
              padding: '0.5rem',
              background: 'var(--bg-subtle)',
              color: 'var(--text)',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
