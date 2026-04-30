import React from 'react';
import { NavLink } from 'react-router-dom-v6';
const NAV_ITEMS = [
  { to: '/projects', label: 'Projects' },
  { to: '/runs', label: 'Runs' },
  { to: '/agents', label: 'Agents' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/sessions/new', label: 'New session' },
  { to: '/workspaces', label: 'Workspaces' },
  { to: '/inbox', label: 'Hook inbox' },
  { to: '/automations', label: 'Automations' },
  { to: '/pair-device', label: 'Pair device' },
  { to: '/settings', label: 'Settings' },
];

export function Sidebar(): JSX.Element {
  return (
    <aside className="app-sidebar">
      <p className="app-sidebar__label">agent-mux</p>
      <nav className="app-sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              ['app-sidebar__link', isActive ? 'app-sidebar__link--active' : null]
                .filter(Boolean)
                .join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
