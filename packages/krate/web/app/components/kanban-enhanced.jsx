'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { KanbanCard } from './kanban-card.jsx';
import { KanbanColumn } from './kanban-column.jsx';
import { KanbanFilters } from './kanban-filters.jsx';

const WORKFLOW_COLUMNS = [
  { id: 'todo', label: 'Todo', color: 'var(--text-muted)', wipLimit: null },
  { id: 'in-progress', label: 'In Progress', color: '#eab308', wipLimit: 5 },
  { id: 'review', label: 'Review', color: '#3b82f6', wipLimit: 3 },
  { id: 'done', label: 'Done', color: '#22c55e', wipLimit: null },
];

function priorityColor(priority) {
  switch ((priority || '').toLowerCase()) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
    default: return '#9ca3af';
  }
}

function CardDetailModal({ item, onClose, columnColor }) {
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
                  <a href={`/agents/sessions/${sessionRef}`} style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>
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
                  <a href={`/agents/runs/${dispatchRunRef}`} style={{ color: '#7c3aed', fontSize: '0.75rem' }}>
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

function StartWorkDialog({ item, onConfirm, onCancel, org }) {
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

// ---- Board orchestrator ----

export function EnhancedKanbanBoard({
  initialIssues = [],
  org = 'default',
  project,
  wipLimits = {},
  workspaces = [],
  sessions = [],
}) {
  const [issues, setIssues] = useState(() =>
    initialIssues.map((item) => ({
      ...item,
      _column: item.status?.column || 'todo',
    }))
  );
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [searchText, setSearchText] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [pendingWorkspaceItem, setPendingWorkspaceItem] = useState(null);
  const dragItemRef = useRef(null);

  const projectName = project?.metadata?.name;

  const allAssignees = useMemo(() => {
    const set = new Set();
    issues.forEach((item) => { if (item.spec?.assignee) set.add(item.spec?.assignee); });
    return Array.from(set).sort();
  }, [issues]);

  const allLabels = useMemo(() => {
    const set = new Set();
    issues.forEach((item) => { (item.spec?.labels || []).forEach((l) => set.add(l)); });
    return Array.from(set).sort();
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((item) => {
      if (filterAssignee && item.spec?.assignee !== filterAssignee) return false;
      if (filterLabel && !(item.spec?.labels || []).includes(filterLabel)) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        const title = (item.spec?.title || item.metadata?.name || '').toLowerCase();
        const desc = (item.spec?.description || '').toLowerCase();
        if (!title.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [issues, filterAssignee, filterLabel, searchText]);

  const columns = WORKFLOW_COLUMNS.map((col) => ({
    ...col,
    wipLimit: wipLimits[col.id] ?? col.wipLimit,
    items: filteredIssues.filter((item) => item._column === col.id),
  }));

  const handleDragStart = useCallback((e, item) => {
    const id = item.metadata?.name || item.spec?.title;
    dragItemRef.current = item;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverCol(null);
    dragItemRef.current = null;
  }, []);

  const handleDragOver = useCallback((e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCol(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e, targetColId) => {
      e.preventDefault();
      const item = dragItemRef.current;
      if (!item) return;

      const id = item.metadata?.name || item.spec?.title;
      const prevColumn = item._column;
      if (prevColumn === targetColId) {
        setDraggingId(null);
        setDragOverCol(null);
        dragItemRef.current = null;
        return;
      }

      setIssues((prev) =>
        prev.map((i) => {
          const iId = i.metadata?.name || i.spec?.title;
          if (iId === id) {
            return { ...i, _column: targetColId, status: { ...(i.status || {}), column: targetColId } };
          }
          return i;
        })
      );
      setDraggingId(null);
      setDragOverCol(null);
      dragItemRef.current = null;

      // Persist column change to backend
      const issueName = item.metadata?.name;
      if (issueName && org) {
        fetch(`/api/orgs/${encodeURIComponent(org)}/resources/Issue/${encodeURIComponent(issueName)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: { column: targetColId } }),
        }).catch(() => {});
      }

      if (targetColId === 'in-progress' && !item.workspaceRef && !item.spec?.workspaceRef) {
        setPendingWorkspaceItem({ ...item, _column: targetColId });
      }

      if (projectName) {
        fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiVersion: 'krate.a5c.ai/v1alpha1',
            kind: 'AgentBoardItem',
            metadata: { name: id },
            status: { column: targetColId },
            _patch: true,
            _projectRef: projectName,
          }),
        }).catch(() => {
          setIssues((prev) =>
            prev.map((i) => {
              const iId = i.metadata?.name || i.spec?.title;
              if (iId === id) {
                return { ...i, _column: prevColumn, status: { ...(i.status || {}), column: prevColumn } };
              }
              return i;
            })
          );
        });
      }
    },
    [org, projectName]
  );

  const handleAddCard = useCallback((columnId, title) => {
    const newItem = {
      metadata: { name: `card-${Date.now()}` },
      spec: { title },
      status: { column: columnId },
      _column: columnId,
      _local: true,
    };
    setIssues((prev) => [...prev, newItem]);
  }, []);

  const handleCardClick = useCallback((item) => {
    setSelectedCard(item);
  }, []);

  const handleStartWork = useCallback(
    async (item) => {
      const itemId = item.metadata?.name || item.spec?.title || `item-${Date.now()}`;
      const workspaceName = `ws-${itemId.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)}`;
      const repoRef = item.spec?.repoRef || item.spec?.repository || null;

      try {
        await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiVersion: 'krate.a5c.ai/v1alpha1',
            kind: 'KrateWorkspace',
            metadata: {
              name: workspaceName,
              labels: { 'krate.a5c.ai/board-item': itemId },
            },
            spec: {
              boardItemRef: itemId,
              ...(repoRef ? { repositoryRef: repoRef } : {}),
              ...(projectName ? { projectRef: projectName } : {}),
            },
          }),
        });

        setIssues((prev) =>
          prev.map((i) => {
            const iId = i.metadata?.name || i.spec?.title;
            if (iId === itemId) {
              return {
                ...i,
                workspaceRef: workspaceName,
                workspacePvcStatus: 'Pending',
              };
            }
            return i;
          })
        );
      } catch {
        // Silently ignore — workspace creation is best-effort
      } finally {
        setPendingWorkspaceItem(null);
      }
    },
    [org, projectName]
  );

  const handleStartWorkFromButton = useCallback((item) => {
    setPendingWorkspaceItem(item);
  }, []);

  const getColumnColor = (colId) => WORKFLOW_COLUMNS.find((c) => c.id === colId)?.color || '#6b7280';

  return (
    <div>
      {/* Keyframe animation for agent pulse indicator */}
      <style>{`
        @keyframes kanbanPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>

      <KanbanFilters
        searchText={searchText}
        onSearchChange={setSearchText}
        filterAssignee={filterAssignee}
        onAssigneeChange={setFilterAssignee}
        filterLabel={filterLabel}
        onLabelChange={setFilterLabel}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        allAssignees={allAssignees}
        allLabels={allLabels}
        filteredCount={filteredIssues.length}
        totalCount={issues.length}
        onClearFilters={() => { setFilterAssignee(''); setFilterLabel(''); setSearchText(''); }}
      />

      {/* Board */}
      <div
        className="kanbanBoard"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', minHeight: '20rem' }}
      >
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            col={col}
            items={col.items}
            draggingId={draggingId}
            dragOverCol={dragOverCol}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onCardClick={handleCardClick}
            onAddCard={handleAddCard}
            onStartWork={handleStartWorkFromButton}
            groupBy={groupBy}
          />
        ))}
        {issues.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.875rem' }}>Link issues to this project to populate the board</p>
          </div>
        ) : null}
      </div>

      {/* Card detail modal */}
      {selectedCard ? (
        <CardDetailModal
          item={selectedCard}
          columnColor={getColumnColor(selectedCard._column)}
          onClose={() => setSelectedCard(null)}
        />
      ) : null}

      {/* Start Work dialog */}
      {pendingWorkspaceItem ? (
        <StartWorkDialog
          item={pendingWorkspaceItem}
          org={org}
          onConfirm={handleStartWork}
          onCancel={() => setPendingWorkspaceItem(null)}
        />
      ) : null}
    </div>
  );
}
