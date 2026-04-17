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

export { createClaudeCodeAdapter } from "./claudeCode";
export { createCodexAdapter } from "./codex";
export { createGeminiCliAdapter } from "./geminiCli";
export { createCursorAdapter } from "./cursor";
export { createGithubCopilotAdapter } from "./githubCopilot";
export { createPiAdapter } from "./pi";
export { createOhMyPiAdapter } from "./ohMyPi";
export { createOpenClawAdapter } from "./openclaw";
export { createOpenCodeAdapter } from "./opencode";
export { createNullAdapter } from "./nullAdapter";
export { createCustomAdapter } from "./customAdapter";
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
