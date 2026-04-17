import { HarnessCapability as Cap, type HarnessSpec } from "../types";

export const OPENCLAW_DISCOVERY_SPEC: HarnessSpec = {
  name: "openclaw",
  cli: "openclaw",
  callerEnvVars: [],
  capabilities: [Cap.Programmatic, Cap.HeadlessPrompt],
  configPaths: [".openclaw"],
};
