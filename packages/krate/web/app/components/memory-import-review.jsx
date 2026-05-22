'use client';
import { useState } from 'react';

function phaseTone(phase) {
  if (!phase || phase === 'Pending') return { bg: '#f1f5f9', color: '#334155' };
  if (['Collecting', 'Redacting', 'Normalizing', 'Validating'].includes(phase)) return { bg: '#fef3c7', color: '#b45309' };
  if (phase === 'AwaitingReview') return { bg: '#dbeafe', color: '#1d4ed8' };
  if (phase === 'Merged') return { bg: '#dcfce7', color: '#15803d' };
  if (phase === 'Rejected' || phase === 'Failed') return { bg: '#fee2e2', color: '#dc2626' };
  return { bg: '#f1f5f9', color: '#334151' };
}

function PhaseBadge({ phase }) {
  const { bg, color } = phaseTone(phase);
  return (
    <span style={{ background: bg, color, fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>
      {phase || 'Pending'}
    </span>
  );
}

function ImportCard({ imp, org, onDecision }) {
  const name = imp.metadata?.name || 'unknown';
  const phase = imp.status?.phase || 'Pending';
  const source = imp.spec?.source || {};
  const runId = source.runId || null;
  const summary = imp.status?.summary || imp.spec?.summary || null;
  const eventCount = imp.status?.eventCount ?? imp.status?.stats?.events ?? null;
  const nodeCount = imp.status?.nodeCount ?? imp.status?.stats?.nodes ?? null;
  const findings = imp.status?.keyFindings || imp.status?.findings || [];
  const created = imp.metadata?.creationTimestamp || '';
  const canReview = phase === 'AwaitingReview';

  const [localStatus, setLocalStatus] = useState('idle'); // idle | approving | rejecting | done | error
  const [localError, setLocalError] = useState('');
  const [decision, setDecision] = useState(null);

  async function handleDecision(action) {
    setLocalStatus(action === 'approve' ? 'approving' : 'rejecting');
    setLocalError('');
    try {
      const res = await fetch(`/api/orgs/${org}/agents/memory/imports/${name}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setDecision(action);
        setLocalStatus('done');
        if (onDecision) onDecision(name, action);
      } else {
        const data = await res.json().catch(() => ({}));
        setLocalError(data.message || data.error || `${action} failed (${res.status})`);
        setLocalStatus('error');
      }
    } catch (err) {
      setLocalError(err.message);
      setLocalStatus('error');
    }
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <strong style={{ fontSize: '0.875rem', flex: 1 }}>{name}</strong>
        <PhaseBadge phase={decision ? (decision === 'approve' ? 'Merged' : 'Rejected') : phase} />
        {created && <small style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{new Date(created).toLocaleString()}</small>}
      </div>

      {/* Body */}
      <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Source info */}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: '#6b7280' }}>
          {source.kind && <span><strong>Source:</strong> {source.kind}</span>}
          {runId && <span><strong>Run:</strong> {runId}</span>}
          {imp.spec?.repositoryRef && <span><strong>Repo:</strong> {imp.spec.repositoryRef}</span>}
        </div>

        {/* Preview stats */}
        {(eventCount !== null || nodeCount !== null) && (
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem' }}>
            {eventCount !== null && (
              <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>
                {eventCount} events
              </span>
            )}
            {nodeCount !== null && (
              <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>
                {nodeCount} nodes
              </span>
            )}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <p style={{ fontSize: '0.8125rem', color: '#374151', margin: 0 }}>{summary}</p>
        )}

        {/* Key findings */}
        {findings.length > 0 && (
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', margin: '0 0 0.25rem' }}>Key findings:</p>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#374151' }}>
              {findings.slice(0, 3).map((f, i) => <li key={i}>{typeof f === 'string' ? f : f.text || f.summary || JSON.stringify(f)}</li>)}
              {findings.length > 3 && <li style={{ color: '#9ca3af' }}>+{findings.length - 3} more</li>}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      {localStatus === 'done' ? (
        <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.8125rem', color: decision === 'approve' ? '#15803d' : '#dc2626', fontWeight: 500 }}>
          {decision === 'approve' ? 'Approved — merging into memory repository' : 'Rejected — import will not be merged'}
        </div>
      ) : canReview ? (
        <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => handleDecision('approve')}
            disabled={localStatus === 'approving' || localStatus === 'rejecting'}
            style={{
              padding: '0.375rem 0.875rem',
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: localStatus !== 'idle' && localStatus !== 'error' ? 'not-allowed' : 'pointer',
              opacity: localStatus === 'approving' ? 0.7 : 1,
            }}
          >
            {localStatus === 'approving' ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={() => handleDecision('reject')}
            disabled={localStatus === 'approving' || localStatus === 'rejecting'}
            style={{
              padding: '0.375rem 0.875rem',
              background: '#fff',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: localStatus !== 'idle' && localStatus !== 'error' ? 'not-allowed' : 'pointer',
              opacity: localStatus === 'rejecting' ? 0.7 : 1,
            }}
          >
            {localStatus === 'rejecting' ? 'Rejecting...' : 'Reject'}
          </button>
          {localStatus === 'error' && (
            <span style={{ fontSize: '0.8125rem', color: '#dc2626' }}>{localError}</span>
          )}
        </div>
      ) : (
        <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.75rem', color: '#9ca3af' }}>
          {phase === 'Merged' ? 'Already merged' : phase === 'Rejected' ? 'Already rejected' : `Review available when phase is AwaitingReview (currently: ${phase})`}
        </div>
      )}
    </div>
  );
}

export function MemoryImportReview({ org, imports = [] }) {
  const [decisions, setDecisions] = useState({});

  function handleDecision(name, action) {
    setDecisions((prev) => ({ ...prev, [name]: action }));
  }

  const pending = imports.filter((imp) => {
    const phase = decisions[imp.metadata?.name]
      ? (decisions[imp.metadata?.name] === 'approve' ? 'Merged' : 'Rejected')
      : (imp.status?.phase || 'Pending');
    return phase === 'AwaitingReview';
  });

  const reviewed = imports.filter((imp) => {
    const name = imp.metadata?.name;
    const phase = decisions[name]
      ? (decisions[name] === 'approve' ? 'Merged' : 'Rejected')
      : (imp.status?.phase || 'Pending');
    return phase !== 'AwaitingReview';
  });

  if (imports.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.875rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
        No memory imports found. Imports appear when agent runs produce knowledge artifacts.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {pending.length > 0 && (
        <div>
          <h4 style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#374151', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Awaiting review
            <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{pending.length}</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pending.map((imp) => (
              <ImportCard key={imp.metadata?.name} imp={imp} org={org} onDecision={handleDecision} />
            ))}
          </div>
        </div>
      )}
      {reviewed.length > 0 && (
        <div>
          <h4 style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.75rem' }}>Other imports</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reviewed.map((imp) => (
              <ImportCard key={imp.metadata?.name} imp={imp} org={org} onDecision={handleDecision} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
