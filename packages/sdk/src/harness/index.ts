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
} from "./types";

export { HarnessCapability } from "./types";

export { createClaudeCodeAdapter } from "./claudeCode";
export { createCodexAdapter } from "./codex";
export { createGeminiCliAdapter } from "./geminiCli";
export { createPiAdapter } from "./pi";
export { createOhMyPiAdapter } from "./ohMyPi";
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

export { invokeHarness, buildHarnessArgs, HARNESS_CLI_MAP } from "./invoker";
