'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function LiveUpdates({ org }) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [flash, setFlash] = useState(false);
  const esRef = useRef(null);
  const retryDelayRef = useRef(1000);
  const retryTimerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const flashTimerRef = useRef(null);

  useEffect(() => {
    if (!org) return;

    function debouncedRefresh() {
      if (refreshTimerRef.current) return;
      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null;
        router.refresh();
        setFlash(true);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setFlash(false), 1200);
      }, 2000);
    }

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
          } else if (data.type === 'resource-change') {
            debouncedRefresh();
          }
        } catch {
          // ignore malformed messages
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
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [org, router]);

  const dotStyle = {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: connected ? 'var(--success)' : 'var(--danger)',
    marginLeft: 8,
    verticalAlign: 'middle',
    flexShrink: 0,
  };

  const flashStyle = {
    marginLeft: 6,
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--success)',
    opacity: flash ? 1 : 0,
    transition: 'opacity 0.3s',
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span
        title={connected ? 'Live updates connected' : 'Live updates disconnected'}
        aria-label={connected ? 'Live updates connected' : 'Live updates disconnected'}
        style={dotStyle}
      />
      <span style={flashStyle} aria-live="polite">{flash ? 'Updated' : ''}</span>
    </span>
  );
}
