/**
 * OpenCode harness adapter.
 *
 * Derives all behavior from BaseHarnessAdapter + agent-mux metadata.
 */

import { HarnessCapability as Cap } from "../types";
import { BaseHarnessAdapter, type AdapterConfig } from "../BaseAdapter";
import { getAmuxAdapterMetadata } from "../amuxMetadata";
import { deriveAdapterConfig } from "../derivePromptContext";

function buildConfig(): AdapterConfig {
  const metadata = getAmuxAdapterMetadata("opencode");
  const config = deriveAdapterConfig(metadata, {
    name: "opencode",
    displayName: "OpenCode",
    extraActivationEnvVars: ["OPENCODE_CONFIG", "ACCOMPLISH_TASK_ID"],
    pluginRootEnvVars: ["OPENCODE_PLUGIN_ROOT"],
    sessionIdEnvVars: ["AGENT_SESSION_ID"],
    fallbackSessionIdEnvVars: ["OPENCODE_SESSION_ID"],
    pluginRootVar: "",
    interactiveToolName: "",
    sessionEnvVars: "AGENT_SESSION_ID and OPENCODE_SESSION_ID",
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    capabilities: [Cap.HeadlessPrompt],
    promptCapabilities: ["task-tool", "breakpoint-routing"],
    loopControlTerm: "in-turn",
    hookDriven: false,
    supportedHookTypes: ["session-start", "pre-tool-use", "post-tool-use"],
    missingSessionIdHint:
      "OpenCode does not auto-inject session IDs. Use --session-id explicitly, " +
      "or ensure the babysitter plugin's shell.env hook is configured to set " +
      "AGENT_SESSION_ID.",
    unsupportedHookMessages: {
      stop:
        "OpenCode does not support a blocking stop hook. " +
        "The session.idle event is fire-and-forget. " +
        "Use in-turn orchestration or the SDK loop driver instead.",
    },
  });
  config.autoResolvesSession = false;
  return config;
}

class OpenCodeAdapter extends BaseHarnessAdapter {
  constructor() {
    super(buildConfig());
  }
}

export function createOpenCodeAdapter(): OpenCodeAdapter {
  return new OpenCodeAdapter();
}
