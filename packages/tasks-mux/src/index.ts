// ── Types and Schemas ────────────────────────────────────────────────────
export {
  // Zod schemas
  BreakpointStatusSchema,
  BreakpointStrategySchema,
  ResponderTypeSchema,
  UrgencySchema,
  TaskPrioritySchema,
  InteractionKindSchema,
  CodeSnippetSchema,
  BreakpointContextLinkSchema,
  BreakpointContextSectionSchema,
  BreakpointContextArtifactSchema,
  BreakpointContextSchema,
  BreakpointRoutingSchema,
  ResponderProfileSchema,
  BreakpointAnswerRatingSchema,
  DecisionMemorySchema,
  BreakpointAnswerSchema,
  BreakpointSubmitterSchema,
  BreakpointDependencySchema,
  BreakpointCommentSchema,
  BreakpointHistoryEntrySchema,
  BreakpointAuditEntrySchema,
  BreakpointFormFieldSchema,
  BreakpointFormDefinitionSchema,
  BreakpointFormSubmissionSchema,
  BreakpointSlaSchema,
  BreakpointMetricsSchema,
  NotificationProviderSchema,
  NotificationConfigSchema,
  EscalationStepSchema,
  EscalationChainSchema,
  BreakpointSchema,
  BreakpointWaitResultSchema,
  ProvenBreakpointAnswerSchema,
  ProvenVerificationResultSchema,
  ExpertiseAreaSchema,
  BreakpointBrowserSessionSchema,
  BreakpointSessionViewSchema,
  GitNativeBackendConfigSchema,
  ServerBackendConfigSchema,
  GitHubIssuesBackendConfigSchema,
  ExternalTrackerProviderSchema,
  ExternalTrackerStatusSchema,
  ExternalTrackerSyncDirectionSchema,
  ExternalTrackerConflictStrategySchema,
  ExternalTrackerAuthConfigSchema,
  ExternalTrackerFieldMappingSchema,
  ExternalTrackerWebhookConfigSchema,
  ExternalTrackerBackendConfigSchema,
  AgentMuxBackendConfigSchema,
  BackendConfigSchema,
  RoutingRuleSchema,
  RoutingConfigSchema,
  // Constants
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
  BREAKPOINTS_DIR,
  BREAKPOINTS_KEYS_DIR,
  BREAKPOINTS_TRUSTED_KEYS_DIR,
  BREAKPOINTS_PRIVATE_KEYS_DIR,
  // Utility
  generateBreakpointId,
  validateBreakpointTransition,
} from "./types.js";

export type {
  BreakpointStatus,
  BreakpointStrategy,
  ResponderType,
  Urgency,
  TaskPriority,
  InteractionKind,
  CodeSnippet,
  BreakpointContextLink,
  BreakpointContextSection,
  BreakpointContextArtifact,
  BreakpointContext,
  BreakpointRouting,
  ResponderProfile,
  BreakpointAnswerRating,
  DecisionMemory,
  BreakpointAnswer,
  BreakpointSubmitter,
  BreakpointDependency,
  BreakpointComment,
  BreakpointHistoryEntry,
  BreakpointAuditEntry,
  BreakpointFormField,
  BreakpointFormDefinition,
  BreakpointFormSubmission,
  BreakpointSla,
  BreakpointMetrics,
  NotificationProvider,
  NotificationConfig,
  EscalationStep,
  EscalationChain,
  BreakpointTransitionValidation,
  Breakpoint,
  BreakpointWaitResult,
  ProvenBreakpointAnswer,
  ProvenVerificationResult,
  ExpertiseArea,
  BreakpointBrowserSession,
  BreakpointSessionView,
  ServerBackendConfig,
  GitHubIssuesBackendConfig,
  ExternalTrackerProvider,
  ExternalTrackerStatus,
  ExternalTrackerSyncDirection,
  ExternalTrackerConflictStrategy,
  ExternalTrackerAuthConfig,
  ExternalTrackerFieldMapping,
  ExternalTrackerWebhookConfig,
  ExternalTrackerBackendConfig,
  AgentMuxBackendConfig,
  GitHubRepo,
  ProjectMember,
  TeamMember,
  TeamInvitation,
  Team,
  KnownUser,
  Project,
  ProjectSummary,
  BackendConfig,
  RoutingRule,
  RoutingConfig,
} from "./types.js";

export {
  TaskRouter,
  routeTask,
  routingHints,
  isHostDelegableRoute,
} from "./router.js";

export type {
  RoutableTaskDef,
  TaskRouteContext,
  TaskRouteDecision,
} from "./router.js";

export type {
  Responder,
  BaseResponder,
  HumanResponder,
  AgentResponder,
  TrackerResponder,
  InternalResponder,
  TaskRoutingHints,
  RoutedResponder,
} from "./responders/types.js";

// ── Backend Interface ────────────────────────────────────────────────────
export type {
  AddBreakpointCommentParams,
  AssignBreakpointParams,
  BreakpointBackend,
  BreakpointBackendCapabilities,
  BreakpointExport,
  BreakpointMetricsSummary,
  BreakpointSearchQuery,
  BulkBreakpointOperationResult,
  BulkUpdateBreakpointItemResult,
  BulkUpdateBreakpointsParams,
  SubmitBreakpointParams,
  SearchBreakpointsResult,
  TransitionBreakpointParams,
  WaitForAnswerOptions,
  SubmitAnswerParams,
  ListRespondersParams,
} from "./backend.js";

export {
  UnsupportedBreakpointFeatureError,
  unsupportedBreakpointBackendCapabilities,
  unsupportedBreakpointFeature,
} from "./backend.js";

// ── Backend Factory ──────────────────────────────────────────────────────
export {
  createBackend,
  createDefaultBackend,
  resolveBackend,
  matchRoute,
  registerBackendFactory,
  listRegisteredBackends,
} from "./backends/index.js";

export type { BackendFactory } from "./backends/index.js";

// ── Git-Native Backend ──────────────────────────────────────────────
export { GitNativeBackend } from "./backends/git-native.js";
export type { GitNativeBackendOptions } from "./backends/git-native.js";

// ── GitHub Issues Backend ──────────────────────────────────────────
export { GitHubIssuesBackend, getGitHubToken, parseAnswerFromComment } from "./backends/github-issues.js";

// ── External Tracker Backend ───────────────────────────────────────
export {
  ExternalTrackerBackend,
  GenericRestTrackerAdapter,
  JiraTrackerAdapter,
  LinearTrackerAdapter,
  createExternalTrackerAdapter,
  redactExternalTrackerSecrets,
} from "./backends/external-tracker.js";

export type {
  ExternalTrackerAdapter,
  ExternalTrackerComment,
  ExternalTrackerCreateIssueInput,
  ExternalTrackerIssue,
  ExternalTrackerReference,
  ExternalTrackerWebhookEvent,
  ExternalTrackerWebhookResult,
} from "./backends/external-tracker.js";

// ── Server Backend ─────────────────────────────────────────────────
export { ServerBreakpointBackend, ServerBackendError } from "./backends/server.js";
export type { ServerBreakpointBackendConfig } from "./backends/server.js";

// ── Agent Mux Backend ──────────────────────────────────────────────
export {
  AgentMuxResponderBackend,
  AgentMuxResponderBackendError,
} from "./backends/agent-mux.js";
export type {
  AgentMuxClientLike,
  AgentMuxResponderBackendConfig,
  AgentMuxRunHandleLike,
  AgentMuxRunOptions,
  AgentMuxRunResult,
} from "./backends/agent-mux.js";

// ── Proven Breakpoints ──────────────────────────────────────────────
export {
  generateKeyPair,
  saveTrustedPublicKey,
  savePrivateKey,
  loadTrustedPublicKeys,
  loadPrivateKey,
  rotateKey,
  signAnswer,
  signAnswerWithKeyRecord,
  verifyAnswer,
} from "./proven/index.js";

export type {
  KeyPairMetadata,
  PublicKeyRecord,
  PrivateKeyRecord,
} from "./proven/index.js";

// ── MCP Server ──────────────────────────────────────────────────────
export {
  createBreakpointMcpServer,
  startBreakpointMcpServer,
} from "./mcp/index.js";

export {
  handleCreateTodo,
  createTodoDescription,
  createTodoParams,
  handleAssignTask,
  assignTaskDescription,
  assignTaskParams,
  handleSearchTasks,
  searchTasksDescription,
  searchTasksParams,
  handleAddComment,
  addCommentDescription,
  addCommentParams,
  handleBulkUpdateTasks,
  bulkUpdateTasksDescription,
  bulkUpdateTasksParams,
  handleTaskStats,
  taskStatsDescription,
  taskStatsParams,
  handleExportTasks,
  exportTasksDescription,
  exportTasksParams,
  handleEscalate,
  escalateDescription,
  escalateParams,
} from "./mcp/index.js";

export type {
  NativeTaskResult,
  SearchTasksResult,
} from "./mcp/index.js";

// ── Harness Integration ─────────────────────────────────────────────
export {
  BreakpointMuxInteractionProvider,
  loadRoutingConfig,
} from "./harness/index.js";

export type { BreakpointMuxProviderOptions } from "./harness/index.js";

// ── Config Utilities ────────────────────────────────────────────────
export {
  resolveRepositoryRoot,
  resolveConfigRoot,
  resolveResponderDirectory,
  resolveRoutingConfigPath,
  loadRoutingConfigSync,
} from "./config.js";

export type { RepoConfigResolutionOptions } from "./config.js";

// ── Client Classes ─────────────────────────────────────────────────
export * from "./client/index.js";
