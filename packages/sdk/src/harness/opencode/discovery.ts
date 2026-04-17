import { HarnessCapability as Cap, type HarnessSpec } from "../types";

export const OPENCODE_DISCOVERY_SPEC: HarnessSpec = {
  name: "opencode",
  cli: "opencode",
  callerEnvVars: ["BABYSITTER_SESSION_ID", "OPENCODE_SESSION_ID"],
  capabilities: [Cap.SessionBinding, Cap.StopHook, Cap.HeadlessPrompt],
  configPaths: [".opencode"],
};
