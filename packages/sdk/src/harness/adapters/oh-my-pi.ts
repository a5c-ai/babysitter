/**
 * oh-my-pi harness adapter.
 *
 * Derives all behavior from BaseHarnessAdapter + agent-mux metadata.
 */

import { HarnessCapability as Cap } from "../types";
import { BaseHarnessAdapter, type AdapterConfig } from "../BaseAdapter";
import { getAmuxAdapterMetadata } from "../amuxMetadata";
import { deriveAdapterConfig } from "../derivePromptContext";

function buildConfig(): AdapterConfig {
  const metadata = getAmuxAdapterMetadata("oh-my-pi");
  return deriveAdapterConfig(metadata, {
    name: "oh-my-pi",
    displayName: "oh-my-pi",
    extraActivationEnvVars: ["OMP_SESSION_ID", "OMP_PLUGIN_ROOT"],
    pluginRootEnvVars: ["OMP_PLUGIN_ROOT"],
    sessionIdEnvVars: ["OMP_SESSION_ID", "AGENT_SESSION_ID"],
    pluginRootVar: "${OMP_PLUGIN_ROOT}",
    interactiveToolName: "AskUserQuestion",
    sessionEnvVars: "OMP_SESSION_ID and AGENT_SESSION_ID",
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    capabilities: [Cap.Programmatic, Cap.SessionBinding, Cap.HeadlessPrompt, Cap.Mcp],
    promptCapabilities: ["skills", "slash-commands", "task-tool", "harness-routing", "programmatic-session", "mcp"],
    loopControlTerm: "skill-driven",
    hookDriven: false,
    noHookSupport: true,
    missingSessionIdHint: "oh-my-pi should provide OMP_SESSION_ID when the Babysitter package is active.",
  });
}

class OhMyPiAdapter extends BaseHarnessAdapter {
  constructor() {
    super(buildConfig());
  }
}

export function createOhMyPiAdapter(): OhMyPiAdapter {
  return new OhMyPiAdapter();
}
