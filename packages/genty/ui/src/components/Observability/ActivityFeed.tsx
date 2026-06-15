import React, { useEffect, useRef, useState } from 'react';

const EVENT_TYPE_MAP: Record<string, { type: string; icon: string; label: string }> = {
  AgentDispatchRun: { type: 'dispatch', icon: '⚡', label: 'Agent dispatch' },
  AgentApproval: { type: 'approval', icon: '✋', label: 'Approval request' },
  ExternalSyncConflict: { type: 'conflict', icon: '⚠', label: 'Sync conflict' },
  KradleWorkspace: { type: 'workspace', icon: '🔑', label: 'Workspace event' },
};

const FILTER_LABELS = [
  { key: 'all', label: 'All' },
  { key: 'dispatch', label: 'Dispatch' },
  { key: 'approval', label: 'Approvals' },
  { key: 'conflict', label: 'Conflicts' },
  { key: 'workspace', label: 'Workspaces' },
];

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

interface EventData {
  type?: string;
  kind?: string;
  message?: string;
  name?: string;
  metadata?: { name?: string };
  user?: string;
  actor?: string;
  requestedBy?: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  icon: string;
  label: string;
  description: string;
  timestamp: number;
  user: string;
}

function mapEventToActivity(data: EventData): ActivityItem {
  const evType = data?.type || data?.kind || 'unknown';
  let mapped = { type: 'resource', icon: '📦', label: 'Resource update' };
  for (const [key, val] of Object.entries(EVENT_TYPE_MAP)) {
    if (evType.includes(key)) {
      mapped = val;
      break;
    }
  }
  return {
    id: `${Date.now()}-${Math.random()}`,
    type: mapped.type,
    icon: mapped.icon,
    label: mapped.label,
    description: data?.message || data?.name || data?.metadata?.name || evType,
    timestamp: Date.now(),
    user: data?.user || data?.actor || data?.requestedBy || 'system',
  };
}

export interface ActivityFeedProps {
  org: string;
}

export function ActivityFeed({ org }: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState('all');
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const retryDelayRef = useRef(1000);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!org) return;

    function connect() {
      const es = new EventSource(`/api/orgs/${org}/agents/events/stream`);
      esRef.current = es;

      es.onopen = () => {
        setConnected(true);
        retryDelayRef.current = 1000;
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as EventData & { type?: string };
          if (data.type === 'connected' || data.type === 'heartbeat') return;
          const activity = mapEventToActivity(data);
          setItems((prev) => {
            const next = [activity, ...prev];
            return next.slice(0, 50);
          });
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        esRef.current = null;
        const delay = Math.min(retryDelayRef.current, 30000);
        retryDelayRef.current = Math.min(delay * 2, 30000);
        retryTimerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [org]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [items.length]);

  const filtered = filter === 'all' ? items : items.filter((item) => item.type === filter);

  return (
    <div
      style={{
        background: 'var(--surface-raised, #f8f9fa)',
        border: '1px solid var(--line, #d0d7de)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--line, #d0d7de)',
          background: 'var(--surface, #fff)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>Activity</span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: connected ? '#22c55e' : '#ef4444',
              display: 'inline-block',
            }}
            title={connected ? 'Live' : 'Disconnected'}
          />
          <span style={{ fontSize: '0.6875rem', color: connected ? '#22c55e' : '#ef4444' }}>
            {connected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          padding: '0.5rem 1rem',
          borderBottom: '1px solid var(--line, #d0d7de)',
          background: 'var(--surface, #fff)',
          overflowX: 'auto',
        }}
      >
        {FILTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            aria-label={`Filter activity feed: ${label}`}
            aria-pressed={filter === key}
            style={{
              padding: '0.25rem 0.625rem',
              borderRadius: '1rem',
              border: '1px solid var(--line, #d0d7de)',
              background: filter === key ? 'var(--accent, #0969da)' : 'transparent',
              color: filter === key ? '#fff' : 'var(--text)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: filter === key ? 600 : 400,
              whiteSpace: 'nowrap',
              transition: 'background 0.1s, color 0.1s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Activity list */}
      <div role="feed" aria-label="Organization activity feed" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
            }}
          >
            No activity yet. Events will appear here as they occur.
          </div>
        ) : (
          filtered.map((item) => (
            <article
              key={item.id}
              aria-label={`${item.label}: ${item.description}`}
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.625rem 1rem',
                borderBottom: '1px solid var(--line, #d0d7de)',
                fontSize: '0.8125rem',
              }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>{item.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{item.label}</span>
                {' — '}
                <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.description}
                </span>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {timeAgo(item.timestamp)} &middot; by <strong>{item.user}</strong>
                </div>
              </div>
            </article>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
