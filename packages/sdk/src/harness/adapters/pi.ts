/**
 * Pi harness adapter.
 *
 * Derives all behavior from BaseHarnessAdapter + agent-mux metadata.
 */

import { HarnessCapability as Cap } from "../types";
import { BaseHarnessAdapter, type AdapterConfig } from "../BaseAdapter";
import { getAmuxAdapterMetadata } from "../amuxMetadata";
import { deriveAdapterConfig } from "../derivePromptContext";

function buildConfig(): AdapterConfig {
  const metadata = getAmuxAdapterMetadata("pi");
  return deriveAdapterConfig(metadata, {
    name: "pi",
    displayName: "Pi Coding Agent",
    extraActivationEnvVars: ["PI_SESSION_ID", "PI_PLUGIN_ROOT"],
    pluginRootEnvVars: ["PI_PLUGIN_ROOT"],
    sessionIdEnvVars: ["PI_SESSION_ID", "AGENT_SESSION_ID"],
    pluginRootVar: "${PI_PLUGIN_ROOT}",
    interactiveToolName: "AskUserQuestion",
    sessionEnvVars: "PI_SESSION_ID and AGENT_SESSION_ID",
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    capabilities: [Cap.Programmatic, Cap.SessionBinding, Cap.HeadlessPrompt],
    promptCapabilities: ["skills", "slash-commands", "task-tool", "harness-routing", "programmatic-session"],
    loopControlTerm: "skill-driven",
    hookDriven: false,
    noHookSupport: true,
    missingSessionIdHint: "Pi should provide PI_SESSION_ID when the Babysitter package is active.",
  });
}

class PiAdapter extends BaseHarnessAdapter {
  constructor() {
    super(buildConfig());
  }
}

export function createPiAdapter(): PiAdapter {
  return new PiAdapter();
}
