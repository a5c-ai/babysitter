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
} from "@a5c-ai/tula-core";
export { invokeHarness, buildHarnessArgs, HARNESS_CLI_MAP } from "./invoker";
export { buildLaunchSpec } from "./invoker/launch";
export { createAgentCoreSession, type AgentCoreEventListener } from "@a5c-ai/tula-core";
export type { AgentCoreSessionHandle } from "@a5c-ai/tula-core";
export * as amux from "./amux";
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
  type AmuxBridgeOptions,
  type AmuxBridgeResult,
  type AmuxEventCallback,
  type AmuxClient,
  type AmuxRunHandle,
  type AmuxAgentEvent,
  type AmuxInteractionChannel,
} from "./amux";

export {
  HARNESS_TO_AMUX_ADAPTER,
  mapHarnessToAmuxAdapter,
  hasAmuxAdapter,
} from "./amux";
