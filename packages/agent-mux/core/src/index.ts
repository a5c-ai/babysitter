/**
 * @a5c-ai/agent-mux-comm
 *
 * Core runtime, types, and utilities for agent-mux.
 * Runtime deps: @a5c-ai/atlas/catalog and @a5c-ai/agent-mux-observability.
 */

// Types
export type {
  BuiltInAgentName,
  AgentName,
  ErrorCode,
  ValidationFieldError,
  BaseEvent,
  GlobalConfig,
  AuthHintsFile,
  AuthHintEntry,
  RunIndexEntry,
  CostRecord,
  ProfileData,
  PluginFormat,
  RetryPolicy,
  McpServerConfig,
  Attachment,
} from './types.js';

// Errors
export {
  AgentMuxError,
  CapabilityError,
  ValidationError,
  AuthError,
} from './errors.js';

// Retry
export type { ResolvedRetryPolicy } from './retry.js';
export { DEFAULT_RETRY_POLICY } from './retry.js';

// Storage
export type { StoragePaths, StoragePathOptions } from './storage.js';
export { resolveStoragePaths } from './storage.js';
export type {
  WorkspaceMaterializationMode,
  WorkspaceSessionStatus,
  WorkspaceStatus,
  WorkspaceRepoInput,
  WorkspaceCreateInput,
  WorkspaceSessionBinding,
  WorkspaceSessionContext,
  WorkspaceSessionRepoContext,
  WorkspaceRepoRecord,
  WorkspaceRecord,
  WorkspaceRepoSummary,
  WorkspaceActionAvailability,
  WorkspaceSummary,
  WorkspaceListResult,
  WorkspaceServiceDeps,
} from './workspaces.js';
export { WorkspaceService, resolveWorkspaceDefaultCwd } from './workspaces.js';

// Events
export type {
  AgentEvent,
  AgentEventType,
  AgentEventHandler,
  EventOfType,
  SessionStartEvent,
  SessionResumeEvent,
  SessionForkEvent,
  SessionCheckpointEvent,
  SessionEndEvent,
  TurnStartEvent,
  TurnEndEvent,
  StepStartEvent,
  StepEndEvent,
  MessageStartEvent,
  TextDeltaEvent,
  MessageStopEvent,
  ThinkingStartEvent,
  ThinkingDeltaEvent,
  ThinkingStopEvent,
  ToolCallStartEvent,
  ToolInputDeltaEvent,
  ToolCallReadyEvent,
  ToolResultEvent,
  ToolErrorEvent,
  FileReadEvent,
  FileWriteEvent,
  FileCreateEvent,
  FileDeleteEvent,
  FilePatchEvent,
  ShellStartEvent,
  ShellStdoutDeltaEvent,
  ShellStderrDeltaEvent,
  ShellExitEvent,
  McpToolCallStartEvent,
  McpToolResultEvent,
  McpToolErrorEvent,
  SubagentSpawnEvent,
  SubagentResultEvent,
  SubagentErrorEvent,
  PluginLoadedEvent,
  PluginInvokedEvent,
  PluginErrorEvent,
  SkillLoadedEvent,
  SkillInvokedEvent,
  AgentdocReadEvent,
  ImageOutputEvent,
  ImageInputAckEvent,
  CostEvent,
  TokenUsageEvent,
  InputRequiredEvent,
  ApprovalRequestEvent,
  ApprovalGrantedEvent,
  ApprovalDeniedEvent,
  RateLimitedEvent,
  ContextLimitWarningEvent,
  ContextCompactedEvent,
  RetryEvent,
  InterruptedEvent,
  AbortedEvent,
  PausedEvent,
  ResumedEvent,
  TimeoutEvent,
  TurnLimitEvent,
  StreamFallbackEvent,
  AuthErrorEvent,
  RateLimitErrorEvent,
  ContextExceededEvent,
  CrashEvent,
  ErrorEvent,
  DebugEvent,
  LogEvent,
} from './events.js';

// Cost / event aggregation helpers
export type { EventCostSummary } from './cost-utils.js';
export {
  sumCost,
  sumCostAsync,
  filterEvents,
  filterEventsAsync,
} from './cost-utils.js';

// State Machine
export type { RunState } from './state-machine.js';
export {
  TERMINAL_STATES,
  VALID_TRANSITIONS,
  isTerminal,
  assertTransition,
} from './state-machine.js';

// Interaction types
export type {
  InteractionChannel,
  PendingInteraction,
  InteractionDetail,
  ApprovalDetail,
  InputDetail,
  InteractionResponse,
  ApproveResponse,
  DenyResponse,
  TextInputResponse,
} from './interaction.js';

// Interaction channel implementation
export { InteractionChannelImpl } from './interaction-channel-impl.js';

// RunHandle types
export type {
  DeferredPromptTarget,
  DeferredPromptOptions,
  RunHandle,
  RunResult,
  TokenUsageSummary,
  RunError,
} from './run-handle.js';

// RunHandle implementation
export { RunHandleImpl } from './run-handle-impl.js';
export type { RunHandleImplOptions } from './run-handle-impl.js';

// Process tracking (zombie prevention)
export type { ProcessTracker } from './process-tracker.js';
export { processTracker } from './process-tracker.js';

// Invocation modes
export type {
  InvocationMode,
  InvocationModeType,
  LocalInvocation,
  DockerInvocation,
  SshInvocation,
  K8sInvocation,
  HarnessImageEntry,
} from './invocation.js';
export { HARNESS_IMAGE_CATALOG, lookupHarnessImage } from './invocation.js';
export { buildInvocationCommand } from './spawn-runner.js';
export type { InvocationCommand } from './spawn-runner.js';

// Run Options
export type { RunOptions } from './run-options.js';
export {
  validateRunOptions,
  PROHIBITED_PROFILE_FIELDS,
  validateProfileData,
} from './run-options.js';

// Runtime hooks
export type {
  RuntimeHookKind,
  RuntimeHookMode,
  RuntimeHookCapabilities,
  HookContext,
  HookDecision,
  PreToolUseHook,
  UserPromptSubmitHook,
  NotificationHook,
  RuntimeHooks,
  RuntimeHookSetup,
} from './runtime-hooks.js';
export { RuntimeHookDispatcher, RuntimeHookDispatcher as PerRunRuntimeHookDispatcher } from './runtime-hook-dispatcher.js';

// Tool classification
export type { ToolClassification } from './tools/index.js';
export { classifyTool } from './tools/index.js';

// Merge
export { deepMerge, stripUndefined, resolveRunOptions } from './merge.js';

// Profiles
export type {
  ProfileListOptions,
  ProfileEntry,
  ResolvedProfile,
  ProfileSetOptions,
  ProfileDeleteOptions,
  ProfileManager,
} from './profiles.js';
export { ProfileManagerImpl } from './profiles.js';

// Capabilities
export type {
  ThinkingEffortLevel,
  ModelProtocol,
  ModelDeployment,
  SessionControlPlane,
  PluginRegistry,
  InstallMethod,
  AgentCapabilities,
  ModelCapabilities,
  ModelValidationResult,
} from './capabilities.js';

// StreamAssembler
export type { BlockTerminator } from './stream-assembler.js';
export { StreamAssembler } from './stream-assembler.js';

// Session types (canonical from dedicated module)
export type {
  Session,
  SessionMessage,
  SessionToolCall,
  SessionSummary,
  FullSession,
  WorkspaceRuntimeDeviceProfile,
  WorkspaceRuntimeLogLine,
  WorkspaceTerminalCommand,
  WorkspacePreviewSurface,
  WorkspaceTerminalSurface,
  WorkspaceDevServerSurface,
  WorkspaceRebaseStatus,
  WorkspaceRebaseLastAction,
  WorkspaceRebaseSurface,
  WorkspaceRuntimeSurface,
  SessionListOptions,
  SessionQuery,
  CostAggregationOptions,
  CostSummary,
  CostBreakdown,
  SessionDiff,
  DiffOperation,
} from './session-types.js';

// Kanban/project backlog types
export type {
  KanbanPriority,
  KanbanIssueStatus,
  KanbanWorkflowState,
  KanbanSwimlaneId,
  KanbanDispatchReadiness,
  KanbanDependencyType,
  KanbanDecompositionStatus,
  KanbanDecompositionKind,
  KanbanRepositoryProvider,
  KanbanPullRequestStatus,
  KanbanReviewStatus,
  KanbanMergeStatus,
  KanbanCiGateStatus,
  KanbanPublishStatus,
  KanbanReviewTargetType,
  KanbanReviewDecision,
  KanbanReviewQueueState,
  KanbanDiffLineKind,
  KanbanReviewCommentStatus,
  KanbanReviewCommentSide,
  KanbanLabel,
  KanbanAssignee,
  KanbanAcceptanceCriterion,
  KanbanIssueDependency,
  KanbanDecompositionItem,
  KanbanIssueDispatchState,
  KanbanIssueSource,
  KanbanPullRequestReviewLink,
  KanbanCiGate,
  KanbanRepositorySettings,
  KanbanRepositoryContext,
  KanbanPullRequest,
  KanbanIssueRepositoryLifecycle,
  KanbanReviewFeedbackSource,
  KanbanDiffLine,
  KanbanDiffHunk,
  KanbanDiffFile,
  KanbanReviewCommentAnchor,
  KanbanReviewComment,
  KanbanReviewSummary,
  KanbanReviewArtifact,
  KanbanReviewQueueItem,
  KanbanReviewSnapshot,
  KanbanIssue,
  KanbanStatusDefinition,
  KanbanProjectMetrics,
  LinkedRunSummary,
  KanbanProject,
  KanbanBacklogSnapshot,
  KanbanBoardPolicyHook,
  KanbanBoardPolicySignal,
  KanbanBoardMoveTarget,
  KanbanBoardCard,
  KanbanBoardColumn,
  KanbanBoardSwimlane,
  KanbanProjectBoard,
  KanbanBoardSnapshot,
  KanbanIssueMoveEvaluation,
  KanbanBacklogSummary,
  KanbanBacklogOverview,
  KanbanIssueCreateInput,
  KanbanIssueCreateResult,
  KanbanIssueMoveInput,
  KanbanIssueUpdateInput,
  KanbanIssueWorkspaceRef,
  KanbanIssueWorkspaceCreateResult,
  KanbanIssueWorkspaceLinkInput,
  KanbanWorkspaceStatus,
  KanbanWorkspaceAction,
  KanbanWorkspaceSessionSummary,
  KanbanWorkspaceIssueSummary,
  KanbanWorkspaceOwnershipProjectSummary,
  KanbanWorkspaceOwnershipIssueSummary,
  KanbanWorkspaceOwnershipHostSummary,
  KanbanWorkspaceOwnershipSummary,
  KanbanWorkspaceRunSummary,
  KanbanWorkspaceGitSummary,
  KanbanWorkspaceNotesSummary,
  KanbanWorkspaceLinks,
  KanbanWorkspaceSessionCollection,
  KanbanWorkspaceRunCollection,
  KanbanWorkspaceActionAvailability,
  KanbanWorkspaceSummary,
  KanbanWorkspaceInventory,
  KanbanWorkspaceActionResult,
  KanbanWorkspaceActionResponse,
  KanbanWorkspaceInventoryQuery,
  KanbanWorkspaceActionInput,
} from './kanban.js';
export {
  normalizeKanbanIssue,
  resolveKanbanWorkflowState,
  resolveKanbanSwimlane,
  resolveKanbanStatusForWorkflowState,
  summarizeKanbanReviewArtifact,
  evaluateKanbanIssueMove,
  computeKanbanProjectMetrics,
  buildKanbanBacklogSnapshot,
  buildKanbanProjectBoard,
  buildKanbanBoardSnapshot,
  upsertKanbanProjectRepository,
  updateKanbanProjectRepositorySettings,
  linkKanbanIssueRepository,
  createKanbanIssuePullRequest,
} from './kanban.js';

export type {
  AutomationRuleLifecycleState,
  AutomationRuleSourceMetadata,
  AutomationRuleAuditMetadata,
  AutomationTaskTemplate,
  AutomationTarget,
  AutomationIssueCreateRoute,
  AutomationDerivedBoardRoute,
  AutomationRouting,
  TimerAutomationTrigger,
  WebhookAutomationTrigger,
  TimerAutomationRule,
  WebhookAutomationRule,
  AutomationRule,
  AutomationExecutionStatus,
  AutomationExecutionRecord,
} from './automation.js';

// Auth types (canonical from dedicated module)
export type {
  AuthMethod,
  AuthMethodDescriptor,
  AuthState,
  AuthSetupGuidance,
  AuthSetupStep,
  AuthEnvVar,
} from './auth-types.js';

// Config types (canonical from dedicated module)
export type {
  AgentConfig,
  AgentConfigSchema,
  ConfigField,
  ValidationResult,
  ConfigValidationError,
  ConfigValidationWarning,
  ModelSelection,
} from './config-types.js';

// Adapter
export type {
  SpawnArgs,
  ParseContext,
  InstalledAgentInfo,
  AgentAdapterInfo,
  AgentAdapter as LegacyAgentAdapter,
  DetectInstallationResult,
  InstallResult,
  AdapterInstallOptions,
  AdapterUpdateOptions,
  Spawner,
  // Multi-adapter architecture types
  SubprocessAdapter,
  RemoteAdapter,
  ProgrammaticAdapter,
  RemoteConnection,
  HttpConnection,
  WebSocketConnection,
  WebSocketMessage,
  ServerOptions,
  ServerInfo,
  ServerHealth,
  ServerManager,
  MultiAgentAdapter,
  AgentAdapter,
  isSubprocessAdapter,
  isRemoteAdapter,
  isProgrammaticAdapter,
  isHttpConnection,
  isWebSocketConnection,
} from './adapter.js';

// Adapter Registry
export type { AdapterRegistry } from './adapter-registry.js';
export { AdapterRegistryImpl } from './adapter-registry.js';

// Model Registry
export type { ModelRegistry, ModelCatalogEntry } from './model-registry.js';
export { ModelRegistryImpl } from './model-registry.js';

// Session Manager
export type { SessionManager } from './session-manager.js';
export { SessionManagerImpl } from './session-manager.js';

// Config Manager
export type { ConfigManager } from './config-manager.js';
export { ConfigManagerImpl } from './config-manager.js';

// Auth Manager
export type { AuthManager } from './auth-manager.js';
export type {
  AuthMethodType,
  FullAuthState,
  FullAuthSetupGuidance,
} from './auth-manager.js';
export { AuthManagerImpl } from './auth-manager.js';

// Plugin types (spec §9 — full types from plugin-types.ts)
export type {
  InstalledPlugin,
  InstalledPlugin as PluginInfo,
  PluginInstallOptions,
  PluginSearchOptions,
  PluginListing,
  PluginDetail,
  PluginBrowseOptions,
} from './plugin-types.js';

// Plugin Manager
export type { PluginManager } from './plugin-manager.js';
export { PluginManagerImpl } from './plugin-manager-impl.js';

// Host harness detection
export type {
  HostHarnessInfo,
  HostSignalMap,
  HostMetadataReader,
  HostMetadataMap,
  DetectHostHarnessOptions,
} from './host-detection.js';
export { detectHostHarness, DEFAULT_HOST_SIGNALS, DEFAULT_HOST_METADATA } from './host-detection.js';

// Client
export type {
  ClientOptions,
} from './client.js';
export { AgentMuxClient, createClient } from './client.js';

// Unified hooks system
export type {
  UnifiedHookPayload,
  UnifiedHookResult,
  HookRegistration,
  HookScope,
} from './hooks.js';
export { HookConfigManager } from './hooks.js';
export type { BuiltInHookFn, BuiltInHookEntry } from './builtin-hooks.js';
export { BuiltInHooksRegistry, builtInHooks } from './builtin-hooks.js';
export type { DispatchOptions } from './hook-dispatcher.js';
export { HookDispatcher } from './hook-dispatcher.js';
export type { HookTypeEntry } from './hook-catalog.js';
export { HOOK_CATALOG, getHookCatalog, isKnownHookType } from './hook-catalog.js';
export { parseHookPayload, formatHookResult } from './hook-payload.js';

// Atomic filesystem helpers (unified config/session writes).
export type { AtomicWriteOptions } from './atomic-fs.js';
export { writeFileAtomic, writeJsonAtomic } from './atomic-fs.js';

// Multi-adapter architecture (direct from adapter-types to avoid conflicts)
export type { BaseAgentAdapterInterface, ProgrammaticRun } from './adapter-types.js';

// Provider config types and defaults
export type { ProviderConfig, ProviderId, TransportId, ProviderAuth, ProviderDefaults } from './provider-config.js';
export { PROVIDER_DEFAULTS, translateModelId, MODEL_TRANSLATION_TABLE } from './provider-config.js';

// Provider resolver
export type { ResolveProviderInput } from './provider-resolver.js';
export { resolveProvider } from './provider-resolver.js';

// Provider profiles
export type { ProviderProfilesScope, ProviderProfilesFileOptions, ProvidersFile, ProviderProfileEntry } from './provider-profiles.js';
export { resolveProvidersFilePath, loadProvidersFile, writeProvidersFile, upsertProviderProfile, updateProviderDefaults, loadProfile, loadProviderDefaults } from './provider-profiles.js';

// Provider support matrix
export { isNativelySupported, getNativeMechanism, getRequiredProxyTransport, getHarnessDefaultTransport, isTransportCompatible } from './provider-support-matrix.js';
export type { NativeSupportEntry } from './provider-support-matrix.js';

// Event schemas (TypeBox JSON Schema definitions for all 67 event types)
export * as schema from './schema/index.js';
