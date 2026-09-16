/**
 * Codex harness adapter.
 *
 * Derives all behavior from BaseHarnessAdapter + adapters metadata.
 */

import { BaseHarnessAdapter, type AdapterConfig } from "../BaseAdapter";
import { getAmuxAdapterMetadata } from "../adapterMetadata";
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
    // Codex has no agent-callable question tool. Its only structured-input
    // mechanism is MCP elicitation, which is invoked by an MCP server rather
    // than by the model, so interactive asks are plain-text turn endings.
    // Naming a tool the harness lacks made agents classify themselves
    // non-interactive and auto-approve breakpoints. See issue #1758.
    interactiveToolName: "",
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
