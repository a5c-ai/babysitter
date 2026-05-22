'use client';

function priorityColor(priority) {
  switch ((priority || '').toLowerCase()) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
    default: return '#9ca3af';
  }
}

export function KanbanCard({ item, columnColor, onDragStart, onDragEnd, isDragging, onCardClick, onStartWork }) {
  const name = item.metadata?.name || item.spec?.title;
  const title = item.spec?.title || name || 'Untitled';
  const priority = item.spec?.priority;
  const assignee = item.spec?.assignee;
  const labels = item.spec?.labels || [];
  const storyPoints = item.spec?.storyPoints || item.spec?.points;

  // Workspace/session/run/agent refs
  const workspaceRef = item.workspaceRef || item.spec?.workspaceRef || null;
  const workspacePvcStatus = item.workspacePvcStatus || item.spec?.workspacePvcStatus || null;
  const sessionRef = item.sessionRef || item.spec?.sessionRef || null;
  const sessionStatus = item.sessionStatus || item.spec?.sessionStatus || null;
  const dispatchRunRef = item.dispatchRunRef || item.spec?.dispatchRunRef || null;
  const agentName = item.agentName || item.spec?.agentName || (item.status?.agentActive ? 'Agent active' : null);
  const hasWorkspace = !!workspaceRef;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragEnd={onDragEnd}
      onClick={() => onCardClick(item)}
      className="kanbanCard"
      tabIndex={0}
      role="button"
      aria-label={`Card: ${title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCardClick(item); } }}
      style={{
        background: '#fff',
        borderRadius: '0.375rem',
        padding: '0.625rem 0.75rem',
        borderLeft: `4px solid ${columnColor}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        cursor: 'pointer',
        userSelect: 'none',
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.12)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)'; }}
    >
      <strong style={{ fontSize: '0.8125rem', display: 'block', marginBottom: '0.25rem', lineHeight: 1.4 }}>{title}</strong>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: labels.length ? '0.25rem' : 0 }}>
        {priority ? (
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: priorityColor(priority) }}>
            {priority}
          </span>
        ) : null}
        {labels.slice(0, 3).map((label) => (
          <span key={label} className="pill neutral" style={{ fontSize: '0.6875rem' }}>{label}</span>
        ))}
      </div>

      {/* Workspace badge */}
      {workspaceRef ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.6875rem' }}>
          <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '0.0625rem 0.375rem', borderRadius: '9999px', fontWeight: 600, flexShrink: 0 }}>
            WS
          </span>
          <span style={{ color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {workspaceRef}
          </span>
          <span style={{
            fontSize: '0.5625rem',
            padding: '0.0625rem 0.25rem',
            borderRadius: '9999px',
            background: workspacePvcStatus === 'Bound' ? '#dcfce7' : '#fef3c7',
            color: workspacePvcStatus === 'Bound' ? '#16a34a' : '#92400e',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {workspacePvcStatus || 'Pending'}
          </span>
        </div>
      ) : null}

      {/* Session link */}
      {sessionRef ? (
        <a
          href={`/agents/sessions/${sessionRef}`}
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.6875rem', color: '#2563eb', textDecoration: 'none' }}
        >
          <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.0625rem 0.375rem', borderRadius: '9999px', fontWeight: 600, flexShrink: 0 }}>Session</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {sessionRef.slice(0, 12)}…
          </span>
          {sessionStatus ? (
            <span style={{ fontSize: '0.5625rem', color: '#6b7280', flexShrink: 0 }}>{sessionStatus}</span>
          ) : null}
        </a>
      ) : null}

      {/* Run link */}
      {dispatchRunRef ? (
        <a
          href={`/agents/runs/${dispatchRunRef}`}
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem', fontSize: '0.6875rem', color: '#7c3aed', textDecoration: 'none' }}
        >
          <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '0.0625rem 0.375rem', borderRadius: '9999px', fontWeight: 600, flexShrink: 0 }}>Run</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {dispatchRunRef.slice(0, 14)}
          </span>
        </a>
      ) : null}

      {/* Agent indicator */}
      {agentName ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.6875rem', color: '#059669' }}>
          <span style={{
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '9999px',
            background: '#10b981',
            flexShrink: 0,
            animation: 'kanbanPulse 2s ease-in-out infinite',
          }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agentName}</span>
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
        {assignee ? (
          <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>{assignee}</small>
        ) : <span />}
        {storyPoints != null ? (
          <span
            style={{
              background: '#f3f4f6',
              borderRadius: '9999px',
              padding: '0.0625rem 0.375rem',
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: '#374151',
            }}
          >
            {storyPoints}
          </span>
        ) : null}
      </div>

      {/* Start Work button — shown when no workspace and column is not done */}
      {onStartWork && !hasWorkspace && item._column !== 'done' ? (
        <button
          onClick={(e) => { e.stopPropagation(); onStartWork(item); }}
          style={{
            marginTop: '0.375rem',
            padding: '0.1875rem 0.5rem',
            fontSize: '0.6875rem',
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center',
          }}
        >
          Start Work
        </button>
      ) : null}
    </div>
  );
}
