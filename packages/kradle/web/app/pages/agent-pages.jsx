// agent-pages.jsx — barrel file re-exporting all agent page modules and shared helpers.

// Shared helpers, components, and constants used across agent pages and by repo-pages.
export {
  phaseTone,
  relativeTime,
  TOOL_RENDERERS,
  truncateText,
  resolveToolRenderer,
  tryParseJson,
  ToolCallCard,
  TranscriptMessage,
  SEGMENT_KINDS,
  classifyMessageKind,
  deriveSegments,
  FlowLane,
  FlowVisualization,
  issuesForScope,
  issueDetailHref,
  issueColumn,
  issueLabels,
  issueComments,
  IssueViewSwitcher,
  IssueKanbanView,
  IssueListView,
  IssueCard,
  IssueComments,
  IssueSyncSummary,
  IssueWorkspace,
  IssueDetailView,
  WORKFLOW_COLUMNS,
  KanbanBoard,
  ResolvedApprovalsSection,
} from './agent-helpers.jsx';

// Agent overview pages (dashboard, stacks, stack detail, stack builder).
export { AgentsDashboardPage, AgentStacksPage, AgentStackDetailPage, AgentStackBuilderPage } from './agent-overview-pages.jsx';

// Agent identity directory, profile, and creation pages.
export { AgentDirectoryPage, AgentProfileRoutePage, AgentCreateRoutePage } from './agent-identity-pages.jsx';

// Dispatch run pages.
export { AgentRunsPage, AgentRunDetailPage } from './agent-run-pages.jsx';

// Session pages.
export { AgentSessionsPage, AgentSessionDetailPage } from './agent-session-pages.jsx';

// Trigger rule pages.
export { AgentRulesPage, AgentRuleDetailPage, AgentRuleBuilderPage } from './agent-rule-pages.jsx';

// Workspace pages.
export { AgentWorkspacesPage, AgentWorkspaceDetailPage } from './agent-workspace-pages.jsx';

// Project and issue pages.
export { AgentProjectsPage, AgentProjectBoardPage, IssueScopePage, IssueDetailPage } from './agent-project-pages.jsx';

// Memory pages.
export { AgentMemoryPage, AgentMemorySearchPage, AgentMemoryImportsPage, AgentMemoryImportDetailPage, AgentMemoryOntologyPage } from './agent-memory-pages.jsx';

// Approval pages.
export { AgentApprovalsPage } from './agent-approval-pages.jsx';

// Settings page.
export { AgentSettingsPage } from './agent-settings-page.jsx';
