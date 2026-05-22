import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom-v6';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Bot, FolderKanban, Inbox, Layers3, PlaySquare, Settings2, Sparkles, Workflow } from 'lucide-react';
import { useGateway } from '@a5c-ai/agent-mux-ui';

type NavItem = {
  to: string;
  label: string;
  section: 'Plan' | 'Operate' | 'System';
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
};

function countPendingHooks(value: Record<string, ReadonlyArray<unknown> | undefined>): number {
  return Object.values(value).reduce((sum, entries) => sum + (entries?.length ?? 0), 0);
}

export function Sidebar(): JSX.Element {
  const { store } = useGateway();
  const sessions = useStore(store, useShallow((state) => Object.values(state.sessions.byId)));
  const runs = useStore(store, useShallow((state) => Object.values(state.runs.byId)));
  const pendingHooks = useStore(store, (state) => countPendingHooks(state.hooks.byRunId));

  const activeSessions = useMemo(
    () => sessions.filter((session) => session.status === 'active').length,
    [sessions],
  );
  const runningRuns = useMemo(
    () => runs.filter((run) => run.status === 'running').length,
    [runs],
  );

  const navItems = useMemo<NavItem[]>(
    () => [
      { to: '/projects', label: 'Projects', section: 'Plan', icon: FolderKanban },
      { to: '/sessions', label: 'Sessions', section: 'Plan', icon: Layers3, badge: activeSessions > 0 ? activeSessions : null },
      { to: '/workspaces', label: 'Workspaces', section: 'Plan', icon: Workflow },
      { to: '/dispatches', label: 'Dispatches', section: 'Operate', icon: PlaySquare, badge: runningRuns > 0 ? runningRuns : null },
      { to: '/inbox', label: 'Inbox', section: 'Operate', icon: Inbox, badge: pendingHooks > 0 ? pendingHooks : null },
      { to: '/automations', label: 'Automations', section: 'Operate', icon: Sparkles },
      { to: '/agents', label: 'Agents', section: 'System', icon: Bot },
      { to: '/settings', label: 'Settings', section: 'System', icon: Settings2 },
    ],
    [activeSessions, pendingHooks, runningRuns],
  );

  const sections = ['Plan', 'Operate', 'System'] as const;

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <p className="app-sidebar__label">agent-mux</p>
        <h1 className="app-sidebar__title">Operate</h1>
        <div className="app-sidebar__mini-status">
          <span className="connection-pill">{activeSessions} live</span>
          <span className="connection-pill">{runningRuns} dispatches</span>
        </div>
      </div>

      <nav className="app-sidebar__nav" aria-label="Main navigation">
        {sections.map((section) => (
          <div key={section} className="app-sidebar__section">
            <p className="app-sidebar__section-label">{section}</p>
            <div className="app-sidebar__section-items">
              {navItems
                .filter((item) => item.section === section)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        ['app-sidebar__link', isActive ? 'app-sidebar__link--active' : null]
                          .filter(Boolean)
                          .join(' ')
                      }
                    >
                      <span className="app-sidebar__link-icon">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="app-sidebar__link-label">{item.label}</span>
                      {item.badge ? <span className="app-sidebar__link-badge">{item.badge}</span> : null}
                    </NavLink>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
