'use client';
export default function Error({ error, reset }) {
  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h2>Something went wrong</h2>
      <p style={{ color: '#6b7280' }}>{error?.message || 'An unexpected error occurred.'}</p>
      <button onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        Try again
      </button>
    </div>
  );
}
