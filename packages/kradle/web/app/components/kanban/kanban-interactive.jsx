'use client';

import { useState, useRef, useCallback } from 'react';

const WORKFLOW_COLUMNS = [
  { id: 'todo', label: 'Todo', color: 'var(--text-muted)' },
  { id: 'in-progress', label: 'In Progress', color: 'var(--accent)' },
  { id: 'review', label: 'Review', color: 'var(--warning)' },
  { id: 'done', label: 'Done', color: 'var(--success)' },
];

function getColumnColor(columnId) {
  return WORKFLOW_COLUMNS.find((c) => c.id === columnId)?.color || 'var(--text-muted)';
}

function KanbanCard({ item, columnColor, onDragStart, onDragEnd, isDragging }) {
  const name = item.metadata?.name || item.spec?.title || 'Untitled';
  const title = item.spec?.title || name;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragEnd={onDragEnd}
      className="kanbanCard"
      role="button"
      aria-label={`Card: ${title}. Drag to move between columns`}
      aria-grabbed={isDragging}
      tabIndex={0}
      style={{
        background: 'var(--card)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.625rem 0.75rem',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${columnColor}`,
        boxShadow: 'var(--shadow-sm)',
        cursor: 'grab',
        userSelect: 'none',
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity 0.15s ease',
      }}
    >
      <strong style={{ fontSize: '0.8125rem', display: 'block', marginBottom: '0.25rem', color: 'var(--text)' }}>{title}</strong>
      {item.spec?.priority ? (
        <span className="pill neutral" style={{ fontSize: '0.6875rem', marginRight: '0.25rem' }}>
          {item.spec?.priority}
        </span>
      ) : null}
      {item.spec?.assignee ? (
        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.spec?.assignee}</small>
      ) : null}
      <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
        {item.status?.linkedSessions ? (
          <small style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{item.status.linkedSessions} sessions</small>
        ) : null}
        {item.status?.linkedWorkspaces ? (
          <small style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{item.status.linkedWorkspaces} workspaces</small>
        ) : null}
      </div>
    </div>
  );
}

function KanbanColumn({ col, items, draggingId, dragOverCol, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop }) {
  const isOver = dragOverCol === col.id;

  return (
    <section
      className="kanbanColumn"
      aria-label={`${col.label} column, ${items.length} items`}
      onDragOver={(e) => onDragOver(e, col.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, col.id)}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        border: isOver ? '2px solid var(--border-focus)' : '2px solid var(--border)',
        boxShadow: isOver ? 'var(--shadow-glow-amber)' : 'none',
        transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
        minHeight: '12rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{col.label}</h3>
        <span
          style={{
            background: col.color,
            color: 'var(--bg)',
            fontFamily: 'var(--font-mono)',
            borderRadius: '9999px',
            padding: '0.125rem 0.5rem',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {items.length}
        </span>
      </div>
      {items.length ? (
        items.map((item) => (
          <KanbanCard
            key={item.metadata?.name || item.spec?.title}
            item={item}
            columnColor={col.color}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragging={draggingId === (item.metadata?.name || item.spec?.title)}
          />
        ))
      ) : (
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.8125rem',
            textAlign: 'center',
            margin: 'auto 0',
            padding: '1rem 0',
          }}
        >
          No items
        </p>
      )}
    </section>
  );
}

export function InteractiveKanbanBoard({ initialIssues = [], org = 'default', project }) {
  const [issues, setIssues] = useState(() =>
    initialIssues.map((item) => ({
      ...item,
      _column: item.status?.column || 'todo',
    }))
  );
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const dragItemRef = useRef(null);

  const projectName = project?.metadata?.name;

  const columns = WORKFLOW_COLUMNS.map((col) => ({
    ...col,
    items: issues.filter((item) => item._column === col.id),
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
    // Only clear if leaving the column entirely (not entering a child)
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

      // Optimistic update
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

      // Async POST to API
      if (projectName) {
        fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiVersion: 'kradle.a5c.ai/v1alpha1',
            kind: 'AgentBoardItem',
            metadata: { name: id },
            status: { column: targetColId },
            _patch: true,
            _projectRef: projectName,
          }),
        }).catch(() => {
          // Rollback on failure
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

  const hasItems = issues.length > 0;

  return (
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
        />
      ))}
      {!hasItems ? (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '0.875rem' }}>Link issues to this project to populate the board</p>
        </div>
      ) : null}
    </div>
  );
}
