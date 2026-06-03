import { Routes, Route, NavLink } from 'react-router-dom';
import { ConnectionBanner, RunStatusBadge } from '@a5c-ai/tula-ui';
import { HomePage } from './pages/HomePage.js';
import { SessionsPage } from './pages/SessionsPage.js';
import { AgentsPage } from './pages/AgentsPage.js';
import { KanbanPage } from './pages/KanbanPage.js';
import { WorkspacesPage } from './pages/WorkspacesPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/sessions', label: 'Sessions' },
  { to: '/agents', label: 'Agents' },
  { to: '/kanban', label: 'Kanban' },
  { to: '/workspaces', label: 'Workspaces' },
  { to: '/settings', label: 'Settings' },
];

export function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      <nav
        style={{
          width: 220,
          flexShrink: 0,
          background: '#1a1a2e',
          color: '#eee',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem 0',
        }}
      >
        <div style={{ padding: '0 1rem 1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>
          Tula
        </div>
        {navItems.map(({ to, label, end }) => (
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
            })}
          >
            {label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', padding: '0.5rem 1rem' }}>
          <RunStatusBadge status="idle" />
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ConnectionBanner status="connecting" />
        <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/workspaces" element={<WorkspacesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
