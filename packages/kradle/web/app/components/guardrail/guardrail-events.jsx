'use client';

import { useState } from 'react';

const pillStyle = (tone) => ({ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600, background: tone === 'good' ? 'color-mix(in srgb, var(--success) 12%, transparent)' : tone === 'warn' ? 'color-mix(in srgb, var(--warning) 12%, transparent)' : tone === 'danger' ? 'color-mix(in srgb, var(--danger) 12%, transparent)' : 'color-mix(in srgb, var(--text-muted) 12%, transparent)', color: tone === 'good' ? 'var(--success)' : tone === 'warn' ? 'var(--warning)' : tone === 'danger' ? 'var(--danger)' : 'var(--text-muted)' });
const btnSecondary = { border: '1px solid var(--border)', background: 'transparent', padding: '0.375rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)' };

const ACTION_TONES = { block: 'danger', warn: 'warn', log: 'neutral' };

export function GuardrailEvents({ org, events = [], guardrailName = null }) {
  const [page, setPage] = useState(0);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const pageSize = 20;

  const filteredEvents = guardrailName
    ? events.filter((e) => e.spec?.guardrailRef === guardrailName)
    : events;

  const sortedEvents = [...filteredEvents].sort((a, b) =>
    (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || '')
  );

  const totalPages = Math.ceil(sortedEvents.length / pageSize);
  const pageEvents = sortedEvents.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Guardrail events ({filteredEvents.length})</h3>
      </div>

      {pageEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No guardrail events recorded. Events appear when guardrails are triggered.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {pageEvents.map((event, i) => {
            const isExpanded = expandedEvent === i;
            return (
              <div
                key={event.metadata?.name || i}
                style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: isExpanded ? 'var(--bg-subtle)' : 'transparent', cursor: 'pointer' }}
                onClick={() => setExpandedEvent(isExpanded ? null : i)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={pillStyle(ACTION_TONES[event.spec?.action] || 'neutral')}>{event.spec?.action || 'unknown'}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{event.spec?.eventType || 'activation'}</span>
                    {!guardrailName && (
                      <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{event.spec?.guardrailRef || '-'}</code>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {event.metadata?.creationTimestamp ? new Date(event.metadata.creationTimestamp).toLocaleString() : '-'}
                  </span>
                </div>

                {event.spec?.triggerContext?.message && (
                  <p style={{ margin: '0.375rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{event.spec.triggerContext.message}</p>
                )}

                {event.spec?.affectedSession && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Session: <code>{event.spec.affectedSession}</code>
                    {event.spec?.affectedAgent && <> | Agent: <code>{event.spec.affectedAgent}</code></>}
                  </p>
                )}

                {isExpanded && event.spec?.triggerContext && (
                  <pre style={{ margin: '0.5rem 0 0', fontSize: '0.6875rem', whiteSpace: 'pre-wrap', color: 'var(--text-muted)', padding: '0.5rem', background: 'var(--bg-subtle)', borderRadius: '0.375rem', overflow: 'auto', maxHeight: '200px' }}>
                    {JSON.stringify(event.spec.triggerContext, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <button style={btnSecondary} disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Page {page + 1} of {totalPages}</span>
          <button style={btnSecondary} disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
