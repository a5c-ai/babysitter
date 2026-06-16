'use client';

export function KanbanFilters({
  searchText,
  onSearchChange,
  filterAssignee,
  onAssigneeChange,
  filterLabel,
  onLabelChange,
  groupBy,
  onGroupByChange,
  allAssignees,
  allLabels,
  filteredCount,
  totalCount,
  onClearFilters,
}) {
  const hasActiveFilter = filterAssignee || filterLabel || searchText;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '1rem',
        alignItems: 'center',
      }}
    >
      <input
        type="search"
        placeholder="Search cards..."
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search kanban cards by title or content"
        style={{
          padding: '0.375rem 0.625rem',
          fontSize: '0.8125rem',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          outline: 'none',
          minWidth: '10rem',
          background: 'var(--surface)',
          color: 'var(--text)',
        }}
      />
      {allAssignees.length > 0 ? (
        <select
          value={filterAssignee}
          onChange={(e) => onAssigneeChange(e.target.value)}
          aria-label="Filter cards by assignee"
          style={{
            padding: '0.375rem 0.625rem',
            fontSize: '0.8125rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
        >
          <option value="">All assignees</option>
          {allAssignees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      ) : null}
      {allLabels.length > 0 ? (
        <select
          value={filterLabel}
          onChange={(e) => onLabelChange(e.target.value)}
          aria-label="Filter cards by label"
          style={{
            padding: '0.375rem 0.625rem',
            fontSize: '0.8125rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
        >
          <option value="">All labels</option>
          {allLabels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      ) : null}
      <select
        value={groupBy}
        onChange={(e) => onGroupByChange(e.target.value)}
        aria-label="Group cards by attribute"
        style={{
          padding: '0.375rem 0.625rem',
          fontSize: '0.8125rem',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface)',
          color: 'var(--text)',
        }}
      >
        <option value="none">No grouping</option>
        <option value="assignee">Group by assignee</option>
        <option value="priority">Group by priority</option>
      </select>
      {hasActiveFilter ? (
        <button
          onClick={onClearFilters}
          aria-label="Clear all active kanban filters"
          style={{
            padding: '0.375rem 0.75rem',
            fontSize: '0.75rem',
            background: 'var(--surface-raised)',
            color: 'var(--danger)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          Clear filters
        </button>
      ) : null}
      {hasActiveFilter ? (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Showing {filteredCount} of {totalCount} cards
        </span>
      ) : null}
    </div>
  );
}
