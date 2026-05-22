export default function Loading() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-6 w-48 rounded" style={{ background: 'var(--bg-2)' }} />
      <div className="h-4 w-72 rounded" style={{ background: 'var(--bg-2)' }} />
      <div className="grid grid-cols-4 gap-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded" style={{ background: 'var(--bg-2)' }} />
        ))}
      </div>
    </div>
  );
}
