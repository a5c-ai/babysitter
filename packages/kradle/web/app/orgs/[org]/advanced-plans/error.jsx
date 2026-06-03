'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }) {
  const isChunkError = error?.message?.includes('Loading chunk') || error?.name === 'ChunkLoadError';

  useEffect(() => {
    if (isChunkError) {
      const key = 'krate-chunk-reload';
      if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); window.location.reload(); }
    }
    return () => sessionStorage.removeItem('krate-chunk-reload');
  }, [isChunkError]);

  if (isChunkError) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}><h2>Update available</h2><p style={{ color: 'var(--text-muted)' }}>Reloading to get the latest version.</p><button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Reload</button></div>;
  }

  return <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}><h2>Something went wrong</h2><p style={{ color: 'var(--text-muted)' }}>{error?.message || 'An unexpected error occurred.'}</p><div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}><button onClick={reset} style={{ padding: '0.5rem 1rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Try again</button><a href="javascript:history.back()" style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '6px', textDecoration: 'none', color: 'var(--text)' }}>Go back</a></div></div>;
}
