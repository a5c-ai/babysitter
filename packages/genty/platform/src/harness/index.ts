export type {
  HarnessAdapter,
  SessionBindOptions,
  SessionBindResult,
  HookHandlerArgs,
  HarnessDiscoveryResult,
  CallerHarnessResult,
  HarnessInvokeOptions,
  HarnessInvokeResult,
  HarnessInstallOptions,
  HarnessInstallResult,
  AgentCoreSessionOptions,
  AgentCorePromptResult,
  AgentCoreSessionEvent,
  StreamingOutputCallback,
  StreamingLineCallback,
  StreamingOutputOptions,
} from "./types";

export { HarnessCapability } from "./types";
export {
  discoverHarnesses,
  detectCallerHarness,
  checkCliAvailable,
  KNOWN_HARNESSES,
  detectAdapter,
  getAdapterByName,
  listSupportedHarnesses,
  getAdapter,
  setAdapter,
  resetAdapter,
} from "@a5c-ai/babysitter-sdk";
// NOTE: Harness registry functions (discoverHarnesses, detectCallerHarness,
// etc.) remain as SDK imports. These are harness-infrastructure concerns
// shared between genty and the SDK runtime.
export {
  createAgentCoreToolDefinitions,
  disposeAgentCoreToolDefinitions,
  type AgenticToolOptions,
  type CustomToolDefinition,
  AGENTIC_TOOL_NAMES,
  stripHtmlTags,
  extractTextFromHtml,
  filterByRelevance,
  parseSearchResults,
} from "@a5c-ai/genty-core";
export { invokeHarness, buildHarnessArgs, HARNESS_CLI_MAP } from "./invoker";
export { buildLaunchSpec } from "./invoker/launch";
export { createAgentCoreSession, type AgentCoreEventListener } from "@a5c-ai/genty-core";
export type { AgentCoreSessionHandle } from "@a5c-ai/genty-core";
export * as adapters from "./adapters";
export {
  handleHarnessCreateRun,
  handleSessionCreate,
  runOrchestrationPhase,
  selectHarness,
} from "./internal/createRun";
export type {
  HarnessCreateRunArgs,
  SessionCreateArgs,
} from "./internal/createRun";
export type {
  OutputMode,
  ToolResultShape,
} from "./internal/createRun/utils";
export {
  BOLD,
  DIM,
  MAGENTA,
  RED,
  RESET,
  formatToolResult,
  writeVerboseBlock,
  writeVerboseLine,
} from "./internal/createRun/utils";
export { assessRun, discoverRuns } from "./internal/createRun/resumeState";
export { normalizeBuiltInHarnessName } from "./builtInHarness";
export {
  invokeViaAgentMux,
  type AdapterBridgeOptions,
  type AgentMuxBridgeResult,
  type AdapterEventCallback,
  type AgentMuxClient,
  type AgentMuxRunHandle,
  type AdapterAgentEvent,
  type AdapterInteractionChannel,
} from "./adapters";

export {
  HARNESS_TO_AGENT_MUX_ADAPTER,
  mapHarnessToAmuxAdapter,
  hasAmuxAdapter,
} from "./adapters";

// Circuit breaker (HADAPT-005)
export {
  CircuitBreaker,
  type CircuitState,
  type CircuitBreakerOptions,
  type CircuitBreakerSnapshot,
} from "./circuitBreaker";

// Profile orchestration (GAP-PROF-001)
export {
  deriveOrchestrationConfig,
  applyProfileToProcessOptions,
  type OrchestrationConfig,
  type BreakpointDensity,
  type ProcessOptions,
  type ProfileLike,
} from "./profileOrchestration";

// Effect routing (GAP-AGENT-003)
export {
  EffectRouter,
  evaluateCondition,
  type RoutingRule,
  type RoutingResult,
  type RoutingContext,
} from "./effectRouting";

// WebSocket session (GAP-REMOTE-003)
export {
  WebSocketSession,
  type WebSocketSessionConfig,
  type WsMessage,
  type WsMessageType,
  type WsMessageCallback,
  type WebSocketLike,
  type WebSocketFactory,
} from "./websocketSession";

// Parallel file operations (GAP-PAR-005)
export {
  readFilesParallel,
  writeFilesParallel,
  globParallel,
  type FileReadResult,
  type FileReadError,
  type FileReadOutcome,
  type FileWriteEntry,
  type FileWriteResult,
} from "./parallelFileOps";

// Worktree isolation (GAP-TOOLS-017)
export {
  createWorktree,
  removeWorktree,
  listWorktrees,
  isInsideWorktree,
  parsePorcelainOutput,
  type WorktreeConfig,
  type WorktreeInfo,
  type ExecSyncFn,
} from "./worktreeIsolation";

// Streaming parallelism (GAP-PAR-006)
export {
  StreamMerger,
  StreamFanout,
  type FanoutCallback,
} from "./streamingParallelism";
