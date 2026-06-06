import { BaseHarnessAdapter, type AdapterConfig } from "../BaseAdapter";
import { getAmuxAdapterMetadata } from "../adapterMetadata";
import { deriveAdapterConfig } from "../derivePromptContext";

function buildConfig(): AdapterConfig {
  const metadata = getAmuxAdapterMetadata("hermes");
  return deriveAdapterConfig(metadata, {
    name: "hermes",
    displayName: "Hermes",
    extraActivationEnvVars: ["HERMES_SESSION", "HERMES_PLUGIN_ROOT"],
    pluginRootEnvVars: ["HERMES_PLUGIN_ROOT", "AGENT_PLUGIN_ROOT"],
    sessionIdEnvVars: ["HERMES_SESSION", "AGENT_SESSION_ID"],
    pluginRootVar: "${HERMES_PLUGIN_ROOT}",
    interactiveToolName: undefined,
    sessionEnvVars: "HERMES_SESSION and AGENT_SESSION_ID",
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    autoReleaseStale: false,
    missingSessionIdHint:
      "Use --session-id explicitly, or launch through a Hermes hook callback " +
      "that provides a stable session ID via HERMES_SESSION.",
  });
}

class HermesAdapter extends BaseHarnessAdapter {
  constructor() {
    super(buildConfig());
  }
}

export function createHermesAdapter(): HermesAdapter {
  return new HermesAdapter();
}
