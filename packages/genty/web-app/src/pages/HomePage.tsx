import { Link } from 'react-router-dom-v6';
import { NotificationBell } from '@a5c-ai/genty-ui/primitives';

const NAV_LINKS = [
  { to: '/sessions', label: 'Sessions', desc: 'View active and historical agent sessions.' },
  { to: '/agents', label: 'Agents', desc: 'Browse and manage registered agent personas.' },
  { to: '/kanban', label: 'Kanban', desc: 'Track work items across agent runs.' },
  { to: '/workspaces', label: 'Workspaces', desc: 'Manage project workspaces and codespaces.' },
  { to: '/settings', label: 'Settings', desc: 'Configure connection and preferences.' },
];

export function HomePage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>genty Dashboard</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>
            Browser-based agent control and monitoring interface.
          </p>
        </div>
        <NotificationBell org="default" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {NAV_LINKS.map(({ to, label, desc }) => (
          <Link
            key={to}
            to={to}
            style={{
              display: 'block',
              padding: '1rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{desc}</div>
          </Link>
        ))}
      </div>

      <section>
        <h2 style={{ margin: '0 0 0.75rem' }}>Status</h2>
        <div
          style={{
            padding: '1rem',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 6,
            color: '#166534',
            fontSize: 14,
          }}
        >
          Gateway connection will be established once the backend is configured. Visit{' '}
          <Link to="/settings" style={{ color: '#166534' }}>Settings</Link> to configure the connection URL.
        </div>
      </section>
    </div>
  );
}
