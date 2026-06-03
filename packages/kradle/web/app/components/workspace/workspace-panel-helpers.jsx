'use client';

// ---- Shared constants ----

export const MOCK_FILE_TREE = [
  {
    name: 'src',
    type: 'dir',
    children: [
      {
        name: 'components',
        type: 'dir',
        children: [
          { name: 'App.tsx', type: 'file' },
          { name: 'Header.tsx', type: 'file' },
        ],
      },
      { name: 'index.ts', type: 'file' },
      { name: 'utils.ts', type: 'file' },
    ],
  },
  {
    name: 'tests',
    type: 'dir',
    children: [
      { name: 'app.test.ts', type: 'file' },
    ],
  },
  { name: 'package.json', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
  { name: 'README.md', type: 'file' },
];

// ---- Phase color mapping ----

export function phaseColor(phase) {
  return phase === 'Ready' ? '#22c55e' : phase === 'InUse' ? '#3b82f6' : phase === 'Pending' ? '#f59e0b' : phase === 'Terminating' ? '#ef4444' : phase === 'Archived' ? '#6b7280' : '#9ca3af';
}

// ---- Shared presentational components ----

export function FileIcon({ type, expanded }) {
  if (type === 'dir') {
    return (
      <span
        aria-hidden="true"
        style={{ fontSize: '0.75rem', marginRight: '0.25rem', color: 'var(--text-muted)' }}
      >
        {expanded ? '▾' : '▸'}
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ fontSize: '0.75rem', marginRight: '0.25rem', color: 'var(--text-muted)', display: 'inline-block', width: '0.75rem' }}
    >
      &mdash;
    </span>
  );
}

export function ResourceUsageBar({ label, value, max, unit = '%', color = '#3b82f6' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : value;
  const barColor = pct > 85 ? '#ef4444' : pct > 60 ? '#f97316' : color;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text)',
          marginBottom: '0.25rem',
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>
          {value}{unit}{max ? ` / ${max}${unit}` : ''}
        </span>
      </div>
      <div
        style={{
          height: '0.375rem',
          background: '#e5e7eb',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
      >
        <div
          role="meter"
          aria-label={`${label} usage`}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            height: '100%',
            width: `${pct}%`,
            background: barColor,
            borderRadius: '9999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

export function ResourceStats({ cpu, memory, disk }) {
  const cpuVal = cpu ?? 12;
  const memUsed = memory?.used ?? 1.2;
  const memTotal = memory?.total ?? 4;
  const diskUsed = disk?.used ?? 8;
  const diskTotal = disk?.total ?? 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <ResourceUsageBar label="CPU" value={cpuVal} unit="%" color="#3b82f6" />
      <ResourceUsageBar label="Memory" value={memUsed} max={memTotal} unit=" GB" color="#8b5cf6" />
      <ResourceUsageBar label="Disk" value={diskUsed} max={diskTotal} unit=" GB" color="#06b6d4" />
    </div>
  );
}

export function PvcStatusBadge({ status }) {
  const display = status || 'Unknown';
  const bg = display === 'Bound' ? '#d1fae5' : display === 'Pending' ? '#fef3c7' : display === 'Released' ? '#e5e7eb' : '#f3f4f6';
  const fg = display === 'Bound' ? '#065f46' : display === 'Pending' ? '#92400e' : display === 'Released' ? '#374151' : '#6b7280';

  return (
    <span
      style={{
        background: bg,
        color: fg,
        borderRadius: '0.25rem',
        padding: '0.0625rem 0.375rem',
        fontWeight: 700,
        fontSize: '0.6875rem',
      }}
    >
      PVC: {display}
    </span>
  );
}
