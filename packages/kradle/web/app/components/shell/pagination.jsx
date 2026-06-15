'use client';

import { memo } from 'react';

const PAGE_SIZES = [10, 25, 50, 100];

export const Pagination = memo(function Pagination({ total, limit, offset, onPageChange, onLimitChange }) {
  if (!total || total === 0) return null;

  const start = Math.min(offset + 1, total);
  const end = Math.min(offset + limit, total);
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    fontSize: '0.8125rem',
    color: 'var(--text)',
    gap: '1rem',
    flexWrap: 'wrap',
  };

  const navButtonStyle = (disabled) => ({
    padding: '0.375rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--border)',
    background: disabled ? 'transparent' : 'var(--surface, #fff)',
    color: disabled ? 'var(--border)' : 'var(--accent, #2563eb)',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    opacity: disabled ? 0.5 : 1,
  });

  const selectStyle = {
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--border)',
    background: 'var(--surface, #fff)',
    color: 'var(--text)',
    fontSize: '0.8125rem',
    cursor: 'pointer',
  };

  return (
    <nav aria-label="Pagination" style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          style={navButtonStyle(!hasPrev)}
          disabled={!hasPrev}
          onClick={() => hasPrev && onPageChange(Math.max(0, offset - limit))}
          aria-label="Go to previous page"
        >
          Prev
        </button>
        <span aria-current="page" aria-label={`Showing items ${start} through ${end} of ${total}`}>
          Showing {start}&ndash;{end} of {total}
        </span>
        <button
          style={navButtonStyle(!hasNext)}
          disabled={!hasNext}
          onClick={() => hasNext && onPageChange(offset + limit)}
          aria-label="Go to next page"
        >
          Next
        </button>
      </div>
      {onLimitChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span>Page size:</span>
          <select
            style={selectStyle}
            value={limit}
            aria-label="Select number of items per page"
            onChange={(e) => {
              const newLimit = parseInt(e.target.value, 10);
              onLimitChange(newLimit);
            }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      )}
    </nav>
  );
});
