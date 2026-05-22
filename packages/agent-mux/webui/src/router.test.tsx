/** @vitest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom-v6';
import { createStore } from 'zustand/vanilla';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRouter } from './router.js';

const mockUseGatewayAuth = vi.fn();
const mockToggleTheme = vi.fn();
const mockLogout = vi.fn();
const gatewayStore = createStore(() => ({
  sessions: { byId: {} },
  runs: { byId: {} },
  hooks: { byRunId: {} },
  actions: {},
}));

vi.mock('@a5c-ai/agent-mux-ui', () => ({
  useGateway: () => ({ store: gatewayStore }),
}));

vi.mock('./providers/GatewayProvider.js', () => ({
  useGatewayAuth: () => mockUseGatewayAuth(),
}));

vi.mock('./providers/ThemeProvider.js', () => ({
  useThemeMode: () => ({ mode: 'light', toggle: mockToggleTheme }),
}));

vi.mock('./pages/HomePage.js', () => ({
  HomePage: () => <div data-testid="home-page">Home</div>,
}));

vi.mock('./pages/LoginPage.js', () => ({
  LoginPage: () => <div data-testid="login-page">Login</div>,
}));

vi.mock('./pages/AgentsPage.js', () => ({
  AgentsPage: () => <div data-testid="agents-page">Agents</div>,
}));

vi.mock('./pages/SessionsPage.js', () => ({
  SessionsPage: () => <div data-testid="sessions-page">Sessions</div>,
}));

vi.mock('./pages/SessionDetailPage.js', () => ({
  SessionDetailPage: () => <div data-testid="session-detail-page">Session detail</div>,
}));

vi.mock('./pages/RunPage.js', () => ({
  SessionPendingPage: () => <div data-testid="session-pending-page">Pending</div>,
}));

vi.mock('./pages/NewRunPage.js', () => ({
  NewRunPage: () => <div data-testid="new-run-page">New run</div>,
}));

vi.mock('./pages/HookInboxPage.js', () => ({
  HookInboxPage: () => <div data-testid="hook-inbox-page">Inbox</div>,
}));

vi.mock('./pages/KanbanLayout.js', () => ({
  KanbanLayout: () => <div data-testid="kanban-layout" />,
}));

vi.mock('./pages/KanbanPages.js', () => ({
  AutomationsPage: () => <div data-testid="automations-page">Automations</div>,
  HostWorkspaceCreatePage: () => <div data-testid="workspace-create-page">Workspace create</div>,
  IssueDetailPage: () => <div data-testid="issue-detail-page">Issue detail</div>,
  IssueWorkspaceCreatePage: () => <div data-testid="issue-workspace-create-page">Issue workspace create</div>,
  KanbanInboxPage: () => <div data-testid="kanban-inbox-page">Kanban inbox</div>,
  KanbanRunsPage: () => <div data-testid="kanban-runs-page">Kanban runs</div>,
  KanbanSettingsPage: () => <div data-testid="kanban-settings-page">Kanban settings</div>,
  KanbanWorkspacesPage: () => <div data-testid="kanban-workspaces-page">Kanban workspaces</div>,
  ProjectBoardPage: () => <div data-testid="project-board-page">Project board</div>,
  ProjectIssueCreatePage: () => <div data-testid="project-issue-create-page">Project issue create</div>,
  ProjectIssuePage: () => <div data-testid="project-issue-page">Project issue</div>,
  ProjectListPage: () => <div data-testid="project-list-page">Project list</div>,
  ProjectWorkspaceCreatePage: () => <div data-testid="project-workspace-create-page">Project workspace create</div>,
  ProjectsPage: () => <div data-testid="projects-page">Projects</div>,
}));

vi.mock('./pages/SettingsPage.js', () => ({
  SettingsPage: () => <div data-testid="settings-page">Settings</div>,
}));

vi.mock('./pages/PairDevicePage.js', () => ({
  PairDevicePage: () => <div data-testid="pair-device-page">Pair device</div>,
}));

vi.mock('./pages/WorkspacesPage.js', () => ({
  WorkspacesPage: () => <div data-testid="legacy-workspaces-page">Legacy workspaces</div>,
}));

vi.mock('./shell/CommandPalette.js', () => ({
  CommandPalette: () => null,
}));

vi.mock('./shell/navigation.js', () => ({
  buildRecentSessionActions: () => [],
}));

vi.mock('./shell/Sidebar.js', () => ({
  Sidebar: () => <div data-testid="shell-sidebar">Sidebar</div>,
}));

vi.mock('./shell/TopBar.js', () => ({
  TopBar: (props: { pathname: string }) => <div data-testid="shell-topbar">{props.pathname}</div>,
}));

vi.mock('./web-only/keyboard.js', () => ({
  bindGlobalHotkeys: () => () => {},
}));

function LocationProbe(): JSX.Element {
  const location = useLocation();
  return <div data-testid="router-location">{`${location.pathname}${location.search}`}</div>;
}

describe('AppRouter workspace entry', () => {
  beforeEach(() => {
    mockToggleTheme.mockReset();
    mockLogout.mockReset();
    mockUseGatewayAuth.mockReturnValue({
      auth: { gatewayUrl: 'http://localhost:57751', token: 'token' },
      isAuthenticated: true,
      isReady: true,
      logout: mockLogout,
    });
  });

  it('keeps the authenticated workspaces route on /workspaces instead of redirecting to /projects', async () => {
    render(
      <MemoryRouter initialEntries={['/workspaces?workspace=C%3A%5CUsers%5Ctmusk%5C.a5c%5Cworkspaces%5Ckanban-gap-001']}>
        <AppRouter />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('kanban-workspaces-page')).toBeInTheDocument();
    expect(screen.getByTestId('shell-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('shell-topbar')).toHaveTextContent('/workspaces');
    expect(screen.getByTestId('router-location')).toHaveTextContent(
      '/workspaces?workspace=C%3A%5CUsers%5Ctmusk%5C.a5c%5Cworkspaces%5Ckanban-gap-001',
    );
    expect(screen.queryByTestId('projects-page')).not.toBeInTheDocument();
  });
});
