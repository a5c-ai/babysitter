'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const NOTIFICATION_HREFS = {
  'run-complete': '/agents/runs',
  'approval-needed': '/agents/approvals',
  'conflict-detected': '/external/conflicts',
  'workspace-ready': '/agents/workspaces',
  'system': '/',
};

const NOTIFICATION_ICONS = {
  'run-complete': '✓',
  'approval-needed': '⚠',
  'conflict-detected': '⚠',
  'workspace-ready': '🔑',
  'system': '●',
};

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function mapEventToNotification(event) {
  let type = 'system';
  let title = 'System event';

  const evType = event?.type || event?.kind || '';

  if (evType.includes('AgentDispatchRun')) {
    type = 'run-complete';
    title = (event?.status === 'failed' ? 'Run failed: ' : 'Run completed: ') + (event?.name || evType);
  } else if (evType.includes('AgentApproval')) {
    type = 'approval-needed';
    title = 'Approval needed: ' + (event?.spec?.action || event?.action || 'action');
  } else if (evType.includes('ExternalSyncConflict') || evType.includes('Conflict')) {
    type = 'conflict-detected';
    title = 'Sync conflict detected';
  } else if (evType.includes('KrateWorkspace') || evType.includes('Workspace')) {
    type = 'workspace-ready';
    title = 'Workspace update: ' + (event?.name || event?.metadata?.name || 'workspace');
  }

  return {
    id: `${Date.now()}-${Math.random()}`,
    type,
    title,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

export function NotificationBell({ org }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const dropdownRef = useRef(null);
  const esRef = useRef(null);
  const retryDelayRef = useRef(1000);
  const retryTimerRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // SSE connection
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
          const data = JSON.parse(event.data);
          if (data.type === 'connected') {
            setConnected(true);
            return;
          }
          // Only add if it's a meaningful event type
          const evType = data?.type || data?.kind || '';
          if (evType && evType !== 'connected' && evType !== 'heartbeat') {
            const notif = mapEventToNotification(data);
            setNotifications((prev) => {
              const next = [notif, ...prev];
              return next.slice(0, 50); // max 50
            });
          }
        } catch {
          // ignore malformed
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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  const visibleNotifications = notifications.slice(0, 10);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.375rem',
          fontSize: '1.125rem',
          color: 'var(--ink-pigment, #24292f)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            background: '#ef4444',
            color: '#fff',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          minWidth: '320px',
          maxWidth: '380px',
          background: 'var(--surface, #fff)',
          border: '1px solid var(--line, #d0d7de)',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--line, #d0d7de)',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink-pigment, #24292f)' }}>
              Notifications
              {connected && (
                <span style={{ marginLeft: '0.5rem', display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', verticalAlign: 'middle' }} title="Live" />
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--accent, #0969da)', padding: 0 }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {visibleNotifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--ink-ghost, #8c959f)', fontSize: '0.875rem' }}>
                No notifications
              </div>
            ) : (
              visibleNotifications.map((notif) => (
                <a
                  key={notif.id}
                  href={NOTIFICATION_HREFS[notif.type] || '/'}
                  onClick={() => { markRead(notif.id); setOpen(false); }}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--line, #d0d7de)',
                    textDecoration: 'none',
                    background: notif.read ? 'transparent' : 'var(--surface-raised, #f6f8fa)',
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>
                    {NOTIFICATION_ICONS[notif.type] || '●'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.8125rem',
                      color: 'var(--ink-pigment, #24292f)',
                      fontWeight: notif.read ? 400 : 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-ghost, #8c959f)', marginTop: '2px' }}>
                      {timeAgo(notif.createdAt)}
                    </div>
                  </div>
                  {!notif.read && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0969da', flexShrink: 0, marginTop: '6px' }} />
                  )}
                </a>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--line, #d0d7de)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-ghost, #8c959f)' }}>
                Showing 10 of {notifications.length} notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
