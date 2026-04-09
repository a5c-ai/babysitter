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
} from "./agenticTools";

export {
  BackgroundProcessRegistry,
  type BackgroundTaskRecord,
  type BackgroundCompletionEvent,
} from "./backgroundProcessRegistry";
