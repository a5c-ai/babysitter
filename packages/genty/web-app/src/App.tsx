import { Routes, Route } from 'react-router-dom-v6';
import { AppShell } from './layout/AppShell.js';
import { HomePage } from './pages/HomePage.js';
import { SessionsPage } from './pages/SessionsPage.js';
import { AgentsPage } from './pages/AgentsPage.js';
import { KanbanPage } from './pages/KanbanPage.js';
import { WorkspacesPage } from './pages/WorkspacesPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/kanban" element={<KanbanPage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
