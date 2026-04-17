import { HarnessCapability as Cap, type HarnessSpec } from "../types";

export const PI_DISCOVERY_SPEC: HarnessSpec = {
  name: "pi",
  cli: "pi",
  callerEnvVars: ["PI_SESSION_ID"],
  capabilities: [Cap.Programmatic, Cap.SessionBinding, Cap.HeadlessPrompt],
  configPaths: [".pi"],
};
