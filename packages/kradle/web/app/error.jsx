'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }) {
  const isChunkError = error?.message?.includes('Loading chunk') || error?.message?.includes('ChunkLoadError') || error?.name === 'ChunkLoadError';

  useEffect(() => {
    if (isChunkError) {
      const reloaded = sessionStorage.getItem('kradle-chunk-reload');
      if (!reloaded) {
        sessionStorage.setItem('kradle-chunk-reload', '1');
        window.location.reload();
      }
    }
    return () => sessionStorage.removeItem('kradle-chunk-reload');
  }, [isChunkError]);

  if (isChunkError) {
    return (
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <h2>Update available</h2>
        <p style={{ color: 'var(--text-muted, #6b7280)' }}>A new version was deployed. Reloading to get the latest.</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--accent, #2563eb)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Reload now
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h2>Something went wrong</h2>
      <p style={{ color: 'var(--text-muted, #6b7280)' }}>{error?.message || 'An unexpected error occurred.'}</p>
      <button onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--accent, #2563eb)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        Try again
      </button>
    </div>
  );
}
