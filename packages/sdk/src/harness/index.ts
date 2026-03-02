export type {
  HarnessAdapter,
  SessionBindOptions,
  SessionBindResult,
  HookHandlerArgs,
} from "./types";

export { createClaudeCodeAdapter } from "./claudeCode";
export { createNullAdapter } from "./nullAdapter";
export {
  detectAdapter,
  getAdapterByName,
  listSupportedHarnesses,
  getAdapter,
  setAdapter,
  resetAdapter,
} from "./registry";
