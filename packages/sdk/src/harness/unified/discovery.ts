/**
 * Discovery specification for the unified harness adapter.
 *
 * Registered in KNOWN_HARNESSES with the LOWEST priority so that it is
 * tried last during both installed-discovery and caller-detection.
 * The CLI dependency (`a5c-hooks-mux`) is optional — the adapter
 * degrades gracefully when it is not installed.
 */

import { HarnessCapability as Cap, type HarnessSpec } from "../types";

export const UNIFIED_DISCOVERY_SPEC: HarnessSpec = {
  name: "unified",
  cli: "a5c-hooks-mux",
  callerEnvVars: ["AGENT_UNIFIED_ADAPTER"],
  capabilities: [
    Cap.Programmatic,
    Cap.SessionBinding,
    Cap.HeadlessPrompt,
  ],
  configPaths: [],
};
