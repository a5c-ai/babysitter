import React, { useState, useMemo } from 'react';
import { KanbanCard } from './KanbanCard.js';
import type { KanbanIssue } from './kanbanHelpers.js';

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, undefined: 4 };

interface AddCardRowProps {
  onAdd: (title: string) => void;
}

function AddCardRow({ onAdd }: AddCardRowProps): JSX.Element {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  function submit() {
    const t = title.trim();
    if (t) { onAdd(t); }
    setTitle('');
    setAdding(false);
  }

  if (adding) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') { setAdding(false); setTitle(''); }
          }}
          placeholder="Card title..."
          style={{
            width: '100%',
            padding: '0.375rem 0.5rem',
            fontSize: '0.8125rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button
            onClick={submit}
            style={{
              flex: 1,
              padding: '0.25rem',
              fontSize: '0.75rem',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            Add
          </button>
          <button
            onClick={() => { setAdding(false); setTitle(''); }}
            style={{
              flex: 1,
              padding: '0.25rem',
              fontSize: '0.75rem',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setAdding(true)}
      aria-label="Add a new card"
      style={{
        width: '100%',
        padding: '0.375rem',
        fontSize: '0.75rem',
        background: 'transparent',
        color: '#9ca3af',
        border: '1px dashed #d1d5db',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#374151'; (e.currentTarget as HTMLElement).style.borderColor = '#9ca3af'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db'; }}
    >
      + Add card
    </button>
  );
}

interface SwimlaneProps {
  label: string;
  items: KanbanIssue[];
  columnColor: string;
  draggingId: string | null;
  onDragStart: (e: React.DragEvent, item: KanbanIssue) => void;
  onDragEnd: () => void;
  onCardClick: (item: KanbanIssue) => void;
  onStartWork?: (item: KanbanIssue) => void;
  org?: string;
}

function Swimlane({ label, items, columnColor, draggingId, onDragStart, onDragEnd, onCardClick, onStartWork, org }: SwimlaneProps): JSX.Element {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '0.125rem 0',
          marginBottom: '0.25rem',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        {label} ({items.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {items.map((item) => (
          <div role="listitem" key={item.metadata?.name || item.spec?.title}>
            <KanbanCard
              item={item}
              columnColor={columnColor}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggingId === (item.metadata?.name || item.spec?.title)}
              onCardClick={onCardClick}
              onStartWork={onStartWork}
              org={org}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export interface KanbanColumnDef {
  id: string;
  label: string;
  color: string;
  wipLimit?: number | null;
}

export interface KanbanColumnProps {
  col: KanbanColumnDef;
  items: KanbanIssue[];
  draggingId: string | null;
  dragOverCol: string | null;
  onDragStart: (e: React.DragEvent, item: KanbanIssue) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, colId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, colId: string) => void;
  onCardClick: (item: KanbanIssue) => void;
  onAddCard: (colId: string, title: string) => void;
  onStartWork?: (item: KanbanIssue) => void;
  groupBy?: string;
  org?: string;
}

export function KanbanColumn({
  col,
  items,
  draggingId,
  dragOverCol,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardClick,
  onAddCard,
  onStartWork,
  groupBy,
  org = 'default',
}: KanbanColumnProps): JSX.Element {
  const isOver = dragOverCol === col.id;
  const wipExceeded = col.wipLimit != null && items.length > col.wipLimit;
  const totalPoints = items.reduce((sum, item) => {
    const pts = item.spec?.storyPoints || item.spec?.points;
    return sum + (pts != null ? Number(pts) : 0);
  }, 0);

  const grouped = useMemo(() => {
    if (groupBy === 'none' || !groupBy) return null;
    const groups: Record<string, KanbanIssue[]> = {};
    items.forEach((item) => {
      const key = (groupBy === 'assignee' ? item.spec?.assignee : item.spec?.priority) || 'Unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    if (groupBy === 'priority') {
      return Object.entries(groups).sort(([a], [b]) => {
        return (PRIORITY_ORDER[a.toLowerCase()] ?? 4) - (PRIORITY_ORDER[b.toLowerCase()] ?? 4);
      });
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [items, groupBy]);

  return (
    <section
      className="kanbanColumn"
      role="list"
      aria-label={`${col.label} column, ${items.length} cards`}
      onDragOver={(e) => onDragOver(e, col.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, col.id)}
      style={{
        background: isOver ? 'var(--surface-hover, #f0f4ff)' : 'var(--surface-muted, #f9fafb)',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
        border: wipExceeded
          ? '2px solid #f97316'
          : isOver
          ? `2px solid ${col.color}`
          : '2px solid transparent',
        transition: 'border-color 0.15s ease, background 0.15s ease',
        minHeight: '12rem',
      }}
    >
      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{col.label}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          {wipExceeded ? (
            <span
              title={`WIP limit exceeded (limit: ${col.wipLimit})`}
              style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: 700 }}
            >
              WIP!
            </span>
          ) : null}
          <span
            style={{
              background: wipExceeded ? '#f97316' : col.color,
              color: '#fff',
              borderRadius: '9999px',
              padding: '0.125rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {items.length}
            {col.wipLimit != null ? `/${col.wipLimit}` : ''}
          </span>
        </div>
      </div>

      {/* Column stats */}
      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.6875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
        <span>{items.length} card{items.length !== 1 ? 's' : ''}</span>
        {totalPoints > 0 ? <span>{totalPoints} pts</span> : null}
        {col.wipLimit != null ? (
          <span style={{ color: wipExceeded ? '#f97316' : '#9ca3af' }}>
            limit {col.wipLimit}
          </span>
        ) : null}
      </div>

      {/* Cards */}
      {items.length === 0 ? (
        <p
          style={{
            color: '#9ca3af',
            fontSize: '0.8125rem',
            textAlign: 'center',
            margin: 'auto 0',
            padding: '1rem 0',
          }}
        >
          No items
        </p>
      ) : grouped ? (
        grouped.map(([groupLabel, groupItems]) => (
          <Swimlane
            key={groupLabel}
            label={groupLabel}
            items={groupItems}
            columnColor={col.color}
            draggingId={draggingId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onCardClick={onCardClick}
            onStartWork={onStartWork}
            org={org}
          />
        ))
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {items.map((item) => (
            <div role="listitem" key={item.metadata?.name || item.spec?.title}>
              <KanbanCard
                item={item}
                columnColor={col.color}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isDragging={draggingId === (item.metadata?.name || item.spec?.title)}
                onCardClick={onCardClick}
                onStartWork={onStartWork}
                org={org}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add card */}
      <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
        <AddCardRow onAdd={(t) => onAddCard(col.id, t)} />
      </div>
    </section>
  );
}
