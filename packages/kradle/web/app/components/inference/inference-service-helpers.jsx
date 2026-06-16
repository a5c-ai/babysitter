'use client';

import { cardStyle, btnStyle } from './inference-helpers.jsx';
import { Pagination } from '../shell/pagination.jsx';

export const tabStyle = (active) => ({
  padding: '0.5rem 1rem',
  border: 'none',
  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
  background: 'none',
  cursor: 'pointer',
  fontWeight: active ? 700 : 500,
  color: active ? 'var(--accent)' : 'var(--text-muted)',
  fontSize: '0.875rem',
});

const errorBanner = {
  background: 'color-mix(in srgb, var(--danger) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)', borderRadius: 'var(--radius-md)',
  padding: '0.5rem', fontSize: '0.8125rem', color: 'var(--danger)', marginBottom: '0.5rem',
};

export async function createResource(org, endpoint, body) {
  const res = await fetch(`/api/orgs/${org}/inference/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed with status ${res.status}`);
  }
}

export function ResourceTabContent({
  items, total, limit, offset, onPageChange, onLimitChange,
  showForm, formTitle, createError, createLoading, FormComponent, formProps,
  onShowForm, onHideForm, onClearError,
  emptyTitle, emptyText, gridMinWidth = '340px',
  renderCard,
}) {
  return (
    <>
      {showForm && (
        <div style={{ ...cardStyle, marginBottom: '1rem', background: 'var(--surface-raised)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>{formTitle}</div>
          {createError && <div style={errorBanner}>{createError}</div>}
          <FormComponent
            {...formProps}
            onCancel={() => { onHideForm(); onClearError(); }}
            loading={createLoading}
          />
        </div>
      )}
      {items.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{emptyTitle}</div>
          <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{emptyText}</div>
          <button style={btnStyle()} onClick={onShowForm} aria-label={`Create new ${emptyTitle.replace('No ', '').toLowerCase()}`}>
            {formTitle}
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${gridMinWidth}, 1fr))`, gap: '0.75rem' }}>
            {items.map((item, i) => renderCard(item, i))}
          </div>
          <Pagination
            total={total}
            limit={limit}
            offset={offset}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        </>
      )}
    </>
  );
}
