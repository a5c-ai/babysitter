import { HarnessCapability as Cap, type HarnessSpec } from "../types";

export const GITHUB_COPILOT_DISCOVERY_SPEC: HarnessSpec = {
  name: "github-copilot",
  cli: "gh",
  callerEnvVars: ["COPILOT_SESSION_ID"],
  capabilities: [Cap.SessionBinding, Cap.StopHook, Cap.HeadlessPrompt],
  configPaths: [".github", ".copilot"],
};
