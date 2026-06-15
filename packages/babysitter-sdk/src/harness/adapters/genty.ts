/**
 * Genty harness adapter.
 *
 * Derives all behavior from BaseHarnessAdapter + adapters metadata.
 */

import { HarnessCapability as Cap } from "../types";
import { BaseHarnessAdapter, type AdapterConfig } from "../BaseAdapter";
import { getAmuxAdapterMetadata } from "../adapterMetadata";
import { deriveAdapterConfig } from "../derivePromptContext";

function buildConfig(): AdapterConfig {
  const metadata = getAmuxAdapterMetadata("genty");
  return deriveAdapterConfig(metadata, {
    name: "genty",
    displayName: "Genty",
    extraActivationEnvVars: ["AGENT_SESSION_ID"],
    pluginRootEnvVars: ["GENTY_PLUGIN_ROOT"],
    sessionIdEnvVars: ["AGENT_SESSION_ID"],
    pluginRootVar: "${GENTY_PLUGIN_ROOT}",
    interactiveToolName: undefined,
    sessionEnvVars: "AGENT_SESSION_ID",
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    capabilities: [Cap.SessionBinding, Cap.HeadlessPrompt],
    promptCapabilities: ["hooks", "task-tool", "breakpoint-routing"],
    loopControlTerm: "internal",
    hookDriven: false,
    noHookSupport: true,
    missingSessionIdHint:
      "Genty should provide AGENT_SESSION_ID when running inside an active session.",
  });
}

class GentyAdapter extends BaseHarnessAdapter {
  constructor() {
    super(buildConfig());
  }
}

export function createGentyAdapter(): GentyAdapter {
  return new GentyAdapter();
}
