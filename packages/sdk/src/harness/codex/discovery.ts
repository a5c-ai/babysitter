import { HarnessCapability as Cap, type HarnessSpec } from "../types";

export const CODEX_DISCOVERY_SPEC: HarnessSpec = {
  name: "codex",
  cli: "codex",
  callerEnvVars: ["CODEX_THREAD_ID", "CODEX_SESSION_ID", "CODEX_PLUGIN_ROOT"],
  capabilities: [Cap.SessionBinding, Cap.StopHook, Cap.HeadlessPrompt],
  configPaths: [".codex"],
};
