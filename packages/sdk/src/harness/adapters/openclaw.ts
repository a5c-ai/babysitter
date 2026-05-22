/**
 * OpenClaw harness adapter.
 *
 * Derives all behavior from BaseHarnessAdapter + agent-mux metadata.
 */

import { HarnessCapability as Cap } from "../types";
import { BaseHarnessAdapter, type AdapterConfig } from "../BaseAdapter";
import { getAmuxAdapterMetadata } from "../amuxMetadata";
import { deriveAdapterConfig } from "../derivePromptContext";

function buildConfig(): AdapterConfig {
  const metadata = getAmuxAdapterMetadata("openclaw");
  return deriveAdapterConfig(metadata, {
    name: "openclaw",
    displayName: "OpenClaw",
    extraActivationEnvVars: ["OPENCLAW_SHELL", "OPENCLAW_HOME"],
    pluginRootEnvVars: [],
    noPluginRoot: true,
    sessionIdEnvVars: ["AGENT_SESSION_ID"],
    fallbackSessionIdEnvVars: ["OPENCLAW_SHELL"],
    pluginRootVar: "",
    interactiveToolName: "AskUserQuestion tool",
    sessionEnvVars: "OPENCLAW_SHELL and AGENT_SESSION_ID",
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    capabilities: [Cap.SessionBinding, Cap.Mcp, Cap.HeadlessPrompt],
    promptCapabilities: ["session-binding", "mcp", "headless-prompt", "task-tool", "breakpoint-routing"],
    loopControlTerm: "agent_end",
    hookDriven: false,
    supportedHookTypes: ["session-start"],
    missingSessionIdHint:
      "Session ID is provided by the OpenClaw gateway. " +
      "Ensure you're running inside an OpenClaw agent session.",
    unsupportedHookMessages: {
      stop:
        "OpenClaw does not support a blocking stop hook. " +
        "The daemon manages agent lifecycle via agent_end signals. " +
        "Use the OpenClaw gateway API instead.",
    },
  });
}

class OpenClawAdapter extends BaseHarnessAdapter {
  constructor() {
    super(buildConfig());
  }
}

export function createOpenClawAdapter(): OpenClawAdapter {
  return new OpenClawAdapter();
}
