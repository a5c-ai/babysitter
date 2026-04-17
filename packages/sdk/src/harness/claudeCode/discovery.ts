import { HarnessCapability as Cap, type HarnessSpec } from "../types";

export const CLAUDE_CODE_DISCOVERY_SPEC: HarnessSpec = {
  name: "claude-code",
  cli: "claude",
  callerEnvVars: ["CLAUDE_ENV_FILE"],
  capabilities: [Cap.SessionBinding, Cap.StopHook, Cap.Mcp, Cap.HeadlessPrompt],
  configPaths: [".claude"],
};
