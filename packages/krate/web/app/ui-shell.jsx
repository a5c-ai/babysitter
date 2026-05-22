// ui-shell.jsx — thin barrel re-exporting everything for backward compatibility.
export * from './lib/krate-ui.jsx';
export * from './lib/page-frame.jsx';
export * from './pages/agent-pages.jsx';
export * from './pages/repo-pages.jsx';
export * from './pages/manage-pages.jsx';
export * from './pages/settings-pages.jsx';
export * from './pages/external-pages.jsx';
export * from './pages/assistant-pages.jsx';
export * from './pages/artifact-pages.jsx';
export * from './pages/inference-pages.jsx';

// Issue workspace components — explicitly re-exported for discovery.
// IssueWorkspace renders the repo/project scoped issue list with <IssueCreateForm inline at top.
// IssueDetailView renders the selected issue detail panel with <IssueEditor for full editing.
export { IssueWorkspace, IssueDetailView, IssueCreateForm, IssueEditor, IssueDetailPage, IssueScopePage, issuesForScope } from './pages/agent-pages.jsx';
