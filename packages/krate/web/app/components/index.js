// ---------------------------------------------------------------------------
// Barrel index — organized re-exports from component subdirectories.
// ---------------------------------------------------------------------------

// ── Agents ──────────────────────────────────────────────────────────────────
export { SessionShell } from './agent/session-shell.jsx';
export { SessionCost } from './agent/session-cost.jsx';
export { SessionDetailTabs } from './agent/session-tabs.jsx';
export { DispatchButton } from './agent/dispatch-button.jsx';
export { ManualDispatchButton, RunActions } from './agent/run-actions.jsx';
export { StackBuilder } from './agent/stack-builder.jsx';
export { GraphStackBuilder } from './agent/stack-builder-graph.jsx';
export { StackActions } from './agent/stack-actions.jsx';
export { StackEditForm } from './agent/stack-edit-form.jsx';
export { TriggerRuleForm } from './agent/trigger-rule-form.jsx';
export { TriggerRuleEditForm } from './agent/trigger-rule-edit-form.jsx';
export { ProjectEditForm } from './agent/project-edit-form.jsx';
export { EnableDisableToggle, DeleteRuleButton } from './agent/rule-actions.jsx';
export { ApprovalDecisionButtons } from './agent/approval-actions.jsx';
export { ApprovalModeToggle } from './agent/approval-mode-toggle.jsx';
export { LiveUpdates } from './agent/live-updates.jsx';
export { AgentSettingsForm } from './agent/agent-settings-form.jsx';
export { AgentDirectory } from './agent/agent-directory.jsx';
export { AgentProfileCard } from './agent/agent-profile-card.jsx';
export { AgentProfilePage } from './agent/agent-profile-page.jsx';
export { AgentPersonaEditor } from './agent/agent-persona-editor.jsx';
export { AgentSoulEditor } from './agent/agent-soul-editor.jsx';
export { AgentAppearanceEditor } from './agent/agent-appearance-editor.jsx';
export { AgentVoiceEditor } from './agent/agent-voice-editor.jsx';
export { AgentDefinitionForm } from './agent/agent-definition-form.jsx';
export { AgentCreateWizard } from './agent/agent-create-wizard.jsx';
export { AgentPersonalityTraits } from './agent/agent-personality-traits.jsx';

// ── Workspaces ──────────────────────────────────────────────────────────────
export { WorkspacePanel } from './workspace/workspace-panel.jsx';
export { WorkspaceEditForm } from './workspace/workspace-edit-form.jsx';
export { AssociationsSection } from './workspace/workspace-associations.jsx';
export { CodespaceSection } from './workspace/workspace-codespace.jsx';
export { RunHistorySection } from './workspace/workspace-run-history.jsx';

// ── Memory ──────────────────────────────────────────────────────────────────
export { MemorySearchForm } from './workspace/memory-search-form.jsx';
export { MemoryOntologyEditor } from './workspace/memory-ontology-editor.jsx';
export { MemoryImportReview } from './workspace/memory-import-review.jsx';
export { MemoryRepoEditForm } from './workspace/memory-repo-edit-form.jsx';

// ── Issues & Kanban ─────────────────────────────────────────────────────────
export { IssueCreateForm, IssueEditor } from './repo/issue-editor.jsx';
export { IssueList } from './repo/issue-list.jsx';
export { EnhancedKanbanBoard } from './kanban/kanban-enhanced.jsx';
export { InteractiveKanbanBoard } from './kanban/kanban-interactive.jsx';
export { KanbanCard } from './kanban/kanban-card.jsx';
export { KanbanColumn } from './kanban/kanban-column.jsx';
export { KanbanFilters } from './kanban/kanban-filters.jsx';

// ── Repositories ────────────────────────────────────────────────────────────
export { RepoCodeBrowser } from './repo/repo-code-browser.jsx';
export { RepoRuns } from './repo/repo-runs.jsx';
export { PullRequestList } from './repo/pull-request-list.jsx';
export { CodeEditor, LiveWatchPanel } from './repo/code-editor.jsx';

// ── Inference / ML ──────────────────────────────────────────────────────────
export { InferenceServiceManager } from './inference/inference-service-manager.jsx';
export { ServiceCard, CreateServiceForm, ServiceDetailPanel } from './inference/inference-service-list.jsx';
export { RuntimeCard, CreateRuntimeForm } from './inference/inference-runtime-list.jsx';
export { InferencePlayground } from './inference/inference-playground.jsx';
export { UnifiedModelCatalogSection, CuratedModelCatalog } from './inference/curated-model-catalog.jsx';
export { RouteTypeBadge, ProviderBadge, CatalogStatusPill, ModelRouteCard, CreateModelRouteForm } from './inference/model-route-manager.jsx';
export { VirtualModelCard, CollapsibleSection, CreateVirtualModelForm } from './inference/virtual-model-manager.jsx';
export {
  relativeTime, FORMAT_COLORS, DEFAULT_PAYLOADS, getDefaultPayload, getServiceStatus, statusColor,
  cardStyle, btnStyle, btnOutlineStyle, inputStyle, labelStyle, badgeStyle, overlayStyle, panelStyle,
  FrameworkBadge, StatusBadge, CopyButton,
  ROUTE_TYPE_COLORS, PROVIDER_COLORS, CATEGORY_COLORS, FALLBACK_PROVIDERS,
} from './inference/inference-helpers.jsx';

// ── Resources & CRUD ────────────────────────────────────────────────────────
export { RepositoryManager, DeploymentManager, ResourceApplyPanel, UserManagementPanel } from './resource-actions.jsx';
export { ResourceActions, InlineCreateForm } from './resource-crud-actions.jsx';
export { Pagination } from './shell/pagination.jsx';

// ── External Providers ──────────────────────────────────────────────────────
export { ExternalProviderList } from './external/external-provider-list.jsx';
export { ExternalProviderWizard } from './external/external-provider-wizard.jsx';
export { ExternalSyncDashboard } from './external/external-sync-dashboard.jsx';
export { ExternalConflictResolver } from './external/external-conflict-resolver.jsx';

// ── Jitsi Meetings ──────────────────────────────────────────────────────────
export { JitsiMeetingManager } from './jitsi/jitsi-meeting-manager.jsx';
export { JitsiMeetingCard } from './jitsi/jitsi-meeting-card.jsx';
export { JitsiCreateMeetingForm } from './jitsi/jitsi-create-meeting-form.jsx';
export { JitsiTemplateForm } from './jitsi/jitsi-template-form.jsx';
export { JitsiParticipantList } from './jitsi/jitsi-participant-list.jsx';
export { JitsiRecordingList } from './jitsi/jitsi-recording-list.jsx';
export { JitsiEmbeddedMeeting } from './jitsi/jitsi-embedded-meeting.jsx';
export { JitsiMeetingExperience } from './jitsi/jitsi-meeting-experience.jsx';
export { JitsiMeetingControls } from './jitsi/jitsi-meeting-controls.jsx';
export { JitsiProviderConfig } from './jitsi/jitsi-provider-config.jsx';

// ── Deployments & CI ────────────────────────────────────────────────────────
export { DeploymentPipeline } from './deployment-pipeline.jsx';
export { RunnerPoolManager } from './runner-pool-manager.jsx';
export { WebhookManager } from './webhook-manager.jsx';

// ── Settings ────────────────────────────────────────────────────────────────
export { GatewaySection } from './settings/settings-gateway.jsx';
export { ProvidersSection } from './settings/settings-providers.jsx';
export { AdaptersSection } from './settings/settings-adapters.jsx';
export { RbacSection } from './settings/settings-rbac.jsx';
export { SecretManager } from './settings/secret-manager.jsx';
export { AppSettingsForm } from './settings/app-settings.jsx';
export { UserProfileForm } from './settings/user-profile.jsx';

// ── Observability ───────────────────────────────────────────────────────────
export { ActivityFeed } from './observability/activity-feed.jsx';
export { HealthMonitor } from './observability/health-monitor.jsx';
export { ToolCallInspector, ToolCallList } from './observability/tool-inspector.jsx';
export { ApiExplorer } from './api-explorer.jsx';

// ── Assistant ───────────────────────────────────────────────────────────────
export { AssistantChat } from './assistant/assistant-chat.jsx';
export { AssistantGenerate } from './assistant/assistant-generate.jsx';
export { AssistantTabs } from './assistant/assistant-tabs.jsx';

// ── Artifacts ───────────────────────────────────────────────────────────────
export { ArtifactRegistryManager } from './artifact-registry.jsx';

// ── Shell / Chrome ──────────────────────────────────────────────────────────
export { KrateLoadingView, KrateControllerRecovery, KRATE_LOADING_MESSAGES } from './shell/krate-loading.jsx';
export { ThemeRuntime, readStoredTheme, resolveKrateTheme, applyTheme, storeTheme, THEME_STORAGE_KEY, THEME_CHANGED_EVENT } from './shell/theme-runtime.jsx';
export { MobileNavToggle } from './shell/mobile-nav-toggle.jsx';
export { NotificationBell } from './shell/notification-bell.jsx';
export { KeyboardShortcuts } from './shell/keyboard-shortcuts.jsx';
export { CommandPalette, CommandPaletteWrapper } from './shell/command-palette.jsx';
export { GlobalSearch } from './shell/global-search.jsx';
export { ConfirmDialog } from './shell/confirm-dialog.jsx';
