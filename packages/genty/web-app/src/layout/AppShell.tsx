import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom-v6';
import { NotificationBell, CommandPaletteWrapper } from '@a5c-ai/genty-ui/primitives';
import { ConnectionBanner, RunStatusBadge } from '@a5c-ai/genty-ui';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/sessions', label: 'Sessions' },
  { to: '/agents', label: 'Agents' },
  { to: '/kanban', label: 'Kanban' },
  { to: '/workspaces', label: 'Workspaces' },
  { to: '/settings', label: 'Settings' },
];

export function AppShell() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <nav
        style={{
          width: sidebarOpen ? 220 : 0,
          overflow: 'hidden',
          flexShrink: 0,
          background: '#1a1a2e',
          color: '#eee',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s',
        }}
      >
        <div style={{ padding: '1rem 1rem 1.5rem', fontSize: '1.2rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
          genty
        </div>
        {NAV_ITEMS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.6rem 1rem',
              color: isActive ? '#7c6ff7' : '#ccc',
              textDecoration: 'none',
              fontWeight: isActive ? 600 : 400,
              background: isActive ? 'rgba(124,111,247,0.12)' : 'transparent',
              whiteSpace: 'nowrap',
            })}
          >
            {label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', padding: '0.5rem 1rem' }}>
          <RunStatusBadge status="idle" />
        </div>
      </nav>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 1rem',
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b' }}
          >
            ☰
          </button>
          <div style={{ flex: 1 }} />
          <CommandPaletteWrapper org="default" onNavigate={(path) => navigate(path)} />
          <NotificationBell org="default" />
        </header>

        <ConnectionBanner status="connecting" />

        <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
