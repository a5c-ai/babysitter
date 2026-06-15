import React from 'react';

export interface KanbanFiltersProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  filterAssignee: string;
  onAssigneeChange: (value: string) => void;
  filterLabel: string;
  onLabelChange: (value: string) => void;
  groupBy: string;
  onGroupByChange: (value: string) => void;
  allAssignees: string[];
  allLabels: string[];
  filteredCount: number;
  totalCount: number;
  onClearFilters: () => void;
}

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
}: KanbanFiltersProps): JSX.Element {
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
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          outline: 'none',
          minWidth: '10rem',
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
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            background: '#fff',
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
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            background: '#fff',
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
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          background: '#fff',
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
            background: '#fee2e2',
            color: '#991b1b',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
          }}
        >
          Clear filters
        </button>
      ) : null}
      {hasActiveFilter ? (
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          Showing {filteredCount} of {totalCount} cards
        </span>
      ) : null}
    </div>
  );
}
