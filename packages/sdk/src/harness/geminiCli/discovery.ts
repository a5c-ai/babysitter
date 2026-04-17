import { HarnessCapability as Cap, type HarnessSpec } from "../types";

export const GEMINI_CLI_DISCOVERY_SPEC: HarnessSpec = {
  name: "gemini-cli",
  cli: "gemini",
  callerEnvVars: ["GEMINI_SESSION_ID", "GEMINI_CWD", "GEMINI_PROJECT_DIR"],
  capabilities: [Cap.SessionBinding, Cap.StopHook, Cap.HeadlessPrompt],
  configPaths: [".gemini"],
};
