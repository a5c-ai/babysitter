'use client';
import { useEffect, useRef, useState } from 'react';

export function LiveUpdates({ org }) {
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);
  const retryDelayRef = useRef(1000);
  const retryTimerRef = useRef(null);

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
          if (data.type === 'connected') setConnected(true);
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
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [org]);

  const dotStyle = {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: connected ? '#16a34a' : '#dc2626',
    marginLeft: 8,
    verticalAlign: 'middle',
    flexShrink: 0,
  };

  return (
    <span
      title={connected ? 'Live updates connected' : 'Live updates disconnected'}
      aria-label={connected ? 'Live updates connected' : 'Live updates disconnected'}
      style={dotStyle}
    />
  );
}
