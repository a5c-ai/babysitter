import { HarnessCapability as Cap, type HarnessSpec } from "../types";

export const CURSOR_DISCOVERY_SPEC: HarnessSpec = {
  name: "cursor",
  cli: "cursor",
  callerEnvVars: ["CURSOR_PROJECT_DIR", "CURSOR_VERSION"],
  capabilities: [Cap.SessionBinding, Cap.StopHook, Cap.HeadlessPrompt],
  configPaths: [".cursor"],
};
