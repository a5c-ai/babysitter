/**
 * Codex harness adapter.
 *
 * Derives all behavior from BaseHarnessAdapter + agent-mux metadata.
 */

import { BaseHarnessAdapter, type AdapterConfig } from "../BaseAdapter";
import { getAmuxAdapterMetadata } from "../amuxMetadata";
import { deriveAdapterConfig } from "../derivePromptContext";

function buildConfig(): AdapterConfig {
  const metadata = getAmuxAdapterMetadata("codex");
  return deriveAdapterConfig(metadata, {
    name: "codex",
    displayName: "Codex",
    extraActivationEnvVars: ["CODEX_THREAD_ID", "CODEX_PLUGIN_ROOT"],
    pluginRootEnvVars: ["CODEX_PLUGIN_ROOT", "AGENT_PLUGIN_ROOT"],
    sessionIdEnvVars: ["CODEX_THREAD_ID", "CODEX_SESSION_ID", "AGENT_SESSION_ID"],
    pluginRootVar: "${CODEX_PLUGIN_ROOT}",
    interactiveToolName: "AskUserQuestion tool",
    sessionEnvVars: "CODEX_THREAD_ID/CODEX_SESSION_ID and AGENT_SESSION_ID",
    hasIntentFidelityChecks: true,
    hasNonNegotiables: true,
    autoReleaseStale: true,
    missingSessionIdHint:
      "Use --session-id explicitly, or launch through a Codex hook callback " +
      "that provides a stable session/thread ID.",
  });
}

class CodexAdapter extends BaseHarnessAdapter {
  constructor() {
    super(buildConfig());
  }
}

export function createCodexAdapter(): CodexAdapter {
  return new CodexAdapter();
}
