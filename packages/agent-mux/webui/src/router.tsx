import React, { useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom-v6';
import { useGateway } from '@a5c-ai/agent-mux-ui';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { AgentsPage } from './pages/AgentsPage.js';
import { SessionsPage } from './pages/SessionsPage.js';
import { SessionDetailPage } from './pages/SessionDetailPage.js';
import { DispatchDetailPage, SessionPendingPage } from './pages/RunPage.js';
import { NewRunPage } from './pages/NewRunPage.js';
import { HookInboxPage } from './pages/HookInboxPage.js';
import { KanbanLayout } from './pages/KanbanLayout.js';
import {
  AutomationsPage,
  HostWorkspaceCreatePage,
  IssueDetailPage,
  IssueWorkspaceCreatePage,
  KanbanInboxPage,
  KanbanRunsPage,
  KanbanSettingsPage,
  KanbanWorkspacesPage,
  ProjectBoardPage,
  ProjectIssueCreatePage,
  ProjectIssuePage,
  ProjectListPage,
  ProjectWorkspaceCreatePage,
  ProjectsPage,
} from './pages/KanbanPages.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { PairDevicePage } from './pages/PairDevicePage.js';
import { WorkspacesPage } from './pages/WorkspacesPage.js';
import { useGatewayAuth } from './providers/GatewayProvider.js';
import { useThemeMode } from './providers/ThemeProvider.js';
import { CommandPalette } from './shell/CommandPalette.js';
import { buildRecentSessionActions } from './shell/navigation.js';
import { Sidebar } from './shell/Sidebar.js';
import { TopBar } from './shell/TopBar.js';
import { bindGlobalHotkeys } from './web-only/keyboard.js';

function LegacySessionRouteRedirect(): JSX.Element {
  const location = useLocation();
  const match = location.pathname.match(/^\/sessions\/[^/]+\/([^/?#]+)/);
  const sessionId = match?.[1];
  return <Navigate to={sessionId ? `/sessions/${sessionId}${location.search}` : '/sessions'} replace />;
}

function LegacyDispatchRouteRedirect(): JSX.Element {
  const location = useLocation();
  const match = location.pathname.match(/^\/runs(?:\/([^/?#]+))?/);
  const runId = match?.[1];
  return <Navigate to={runId ? `/dispatches/${runId}${location.search}` : `/dispatches${location.search}`} replace />;
}

function AuthPendingScreen(): JSX.Element {
  return (
    <main className="login-page">
      <section className="login-card auth-card">
        <p className="eyebrow">agent-mux webui</p>
        <h1>Checking gateway access</h1>
        <p className="lede auth-note">
          Reconnecting to the saved gateway before loading live sessions, workspaces, and dispatch activity.
        </p>
      </section>
    </main>
  );
}

function RequireAuth(props: { children: React.ReactNode }): JSX.Element {
  const { auth, isAuthenticated, isReady } = useGatewayAuth();
  const location = useLocation();
  if (auth && !isReady) {
    return <AuthPendingScreen />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{props.children}</>;
}

function WorkspacesRouteEntry(): JSX.Element {
  const { auth, isAuthenticated, isReady } = useGatewayAuth();

  if (auth && !isReady) {
    return <AuthPendingScreen />;
  }

  if (isAuthenticated) {
    return (
      <AppShellFrame>
        <KanbanWorkspacesPage />
      </AppShellFrame>
    );
  }

  return <KanbanWorkspacesPage />;
}

function AppShellFrame(props: { children: React.ReactNode }): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { store } = useGateway();
  const { logout } = useGatewayAuth();
  const { mode, toggle } = useThemeMode();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const sessions = useStore(store, useShallow((state) => Object.values(state.sessions.byId)));

  const recentSessionActions = useMemo(
    () =>
      buildRecentSessionActions(sessions).map((action) => ({
        id: action.id,
        label: action.label,
        run: () => navigate(action.to),
      })),
    [navigate, sessions],
  );

  const actions = useMemo(
    () => [
      { id: 'projects', label: 'Open projects', run: () => navigate('/projects') },
      { id: 'runs', label: 'Open dispatches', run: () => navigate('/dispatches') },
      { id: 'new-session', label: 'Start session', run: () => navigate('/sessions/new') },
      { id: 'sessions', label: 'Browse sessions', run: () => navigate('/sessions') },
      { id: 'workspaces', label: 'Open workspaces', run: () => navigate('/workspaces') },
      { id: 'inbox', label: 'Open hook inbox', run: () => navigate('/inbox') },
      { id: 'pair', label: 'Pair device', run: () => navigate('/pair-device') },
      { id: 'theme', label: `Switch to ${mode === 'light' ? 'dark' : 'light'} theme`, run: () => toggle() },
      { id: 'logout', label: 'Forget token', run: () => logout() },
      ...recentSessionActions,
    ],
    [logout, mode, navigate, recentSessionActions, toggle],
  );

  React.useEffect(() => bindGlobalHotkeys({ openPalette: () => setPaletteOpen(true) }), []);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <TopBar pathname={location.pathname} onOpenPalette={() => setPaletteOpen(true)} />
        <main className="app-content">{props.children}</main>
      </div>
      <CommandPalette actions={actions} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

function AppShell(): JSX.Element {
  return (
    <AppShellFrame>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/sessions/new" element={<NewRunPage />} />
        <Route path="/sessions/pending/:runId" element={<SessionPendingPage />} />
        <Route path="/dispatches/:runId" element={<DispatchDetailPage />} />
        <Route path="/runs/:runId" element={<LegacyDispatchRouteRedirect />} />
        <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
        <Route path="/sessions/:agent/:sessionId" element={<LegacySessionRouteRedirect />} />
        <Route path="/pair-device" element={<PairDevicePage />} />
        <Route element={<KanbanLayout />}>
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId/board" element={<ProjectBoardPage />} />
          <Route path="/projects/:projectId/list" element={<ProjectListPage />} />
          <Route path="/projects/:projectId/issues/new" element={<ProjectIssueCreatePage />} />
          <Route path="/projects/:projectId/issues/:issueId" element={<ProjectIssuePage />} />
          <Route path="/projects/:projectId/workspaces/new" element={<ProjectWorkspaceCreatePage />} />
          <Route path="/projects/:projectId/issues/:issueId/workspace/new" element={<IssueWorkspaceCreatePage />} />
          <Route path="/issues/:issueId" element={<IssueDetailPage />} />
          <Route path="/dispatches" element={<KanbanRunsPage />} />
          <Route path="/runs" element={<LegacyDispatchRouteRedirect />} />
          <Route path="/workspaces" element={<KanbanWorkspacesPage />} />
          <Route path="/workspaces/new" element={<HostWorkspaceCreatePage />} />
          <Route path="/inbox" element={<KanbanInboxPage />} />
          <Route path="/automations" element={<AutomationsPage />} />
          <Route path="/settings" element={<KanbanSettingsPage />} />
        </Route>
        <Route path="/legacy-home" element={<HomePage />} />
        <Route path="/legacy-workspaces" element={<WorkspacesPage />} />
        <Route path="/legacy-inbox" element={<HookInboxPage />} />
        <Route path="/legacy-settings" element={<SettingsPage />} />
      </Routes>
    </AppShellFrame>
  );
}

export function AppRouter(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/workspaces" element={<WorkspacesRouteEntry />} />
      <Route
        path="*"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
