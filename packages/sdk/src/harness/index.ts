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
  PiSessionOptions,
  PiPromptResult,
  PiSessionEvent,
  StreamingOutputCallback,
  StreamingLineCallback,
  StreamingOutputOptions,
} from "./types";

export { HarnessCapability } from "./types";

export { createClaudeCodeAdapter } from "./claudeCode";
export { createCodexAdapter } from "./codex";
export { createGeminiCliAdapter } from "./geminiCli";
export { createCursorAdapter } from "./cursor";
export { createGithubCopilotAdapter } from "./githubCopilot";
export { createPiAdapter } from "./pi";
export { createOhMyPiAdapter } from "./ohMyPi";
export { createOpenClawAdapter } from "./openclaw";
export { createOpenCodeAdapter } from "./opencode";
export { createInternalAdapter } from "./internal";
export { createPiSession, PiSessionHandle, type PiEventListener } from "./piWrapper";
export { createNullAdapter } from "./nullAdapter";
export { createCustomAdapter } from "./customAdapter";
export {
  detectAdapter,
  getAdapterByName,
  listSupportedHarnesses,
  getAdapter,
  setAdapter,
  resetAdapter,
} from "./registry";

export { discoverHarnesses, detectCallerHarness, checkCliAvailable, KNOWN_HARNESSES } from "./discovery";

export { invokeHarness, buildHarnessArgs, buildLaunchSpec, HARNESS_CLI_MAP } from "./invoker";

export { OutputStreamCollector, invokeHarnessStreaming } from "./streamingCapture";

export {
  createAgenticToolDefinitions,
  type AgenticToolOptions,
  type CustomToolDefinition,
  AGENTIC_TOOL_NAMES,
  stripHtmlTags,
  extractTextFromHtml,
  filterByRelevance,
  parseSearchResults,
} from "./agenticTools";

export {
  BackgroundProcessRegistry,
  type BackgroundTaskRecord,
  type BackgroundCompletionEvent,
} from "./backgroundProcessRegistry";

export {
  DeferredToolRegistry,
  type DeferredToolEntry,
  type ResolvedToolEntry,
  type ToolSchema,
  type SchemaLoader,
  type ToolSource,
} from "./deferredToolRegistry";

export {
  OPERATOR_COMMANDS,
  renderOperatorCommand,
  getCommandsByCategory,
  getGroupedCommands,
  formatCommandsForPrompt,
  type OperatorCommand,
  type OperatorCommandCategory,
} from "./operatorCommands";

export {
  createPlan,
  updateStepStatus,
  insertStep,
  removeStep,
  getNextStep,
  getPlanProgress,
  formatPlanForDisplay,
  type ExecutionPlan,
  type PlanStep,
  type PlanStepStatus,
  type PlanStatus,
} from "./planMode";

export {
  searchCommands,
  getCommandsByCommandCategory,
  getContextualSuggestions,
  getAllCommands,
  getCommandCategories,
  type CommandInfo,
  type CommandCategory,
} from "./commandDiscovery";

export {
  getActiveMode,
  getActiveModeConfig,
  switchMode,
  getModeConfig,
  getAvailableModes,
  resetMode,
  shouldAutoApprove,
  shouldShowPlan,
  isParallelEnabled,
  formatModeInfo,
  type OrchestrationMode,
  type ModeConfig,
} from "./modeSelector";
