export type {
  HarnessAdapter,
  SessionBindOptions,
  SessionBindResult,
  HookHandlerArgs,
  HarnessDiscoveryResult,
  CallerHarnessResult,
  HarnessInstallOptions,
  HarnessInstallResult,
} from "./types";

export { HarnessCapability } from "./types";

export { createClaudeCodeAdapter } from "./adapters/claude-code";
export { createCodexAdapter } from "./adapters/codex";
export { createGeminiCliAdapter } from "./adapters/gemini-cli";
export { createCursorAdapter } from "./adapters/cursor";
export { createGithubCopilotAdapter } from "./adapters/github-copilot";
export { createPiAdapter } from "./adapters/pi";
export { createOhMyPiAdapter } from "./adapters/oh-my-pi";
export { createOpenClawAdapter } from "./adapters/openclaw";
export { createOpenCodeAdapter } from "./adapters/opencode";
export { createNullAdapter } from "./nullAdapter";
export { createCustomAdapter } from "./customAdapter";
export { createUnifiedAdapter } from "./unified";
export { BaseHarnessAdapter } from "./BaseAdapter";
export type { AdapterConfig } from "./BaseAdapter";
export {
  createPromptContextForHarness,
  detectAdapter,
  getAdapterByName,
  getHarnessCallerEnvVars,
  getHarnessDiscoverySpec,
  listSupportedHarnesses,
  getSessionResolutionDetails,
  getAdapter,
  setAdapter,
  resetAdapter,
} from "./registry";

export { discoverHarnesses, detectCallerHarness, checkCliAvailable, KNOWN_HARNESSES } from "./discovery";
export { installHarnessViaAmux, installHarnessPlugin, discoverHarnessesViaAmux } from "./install";
