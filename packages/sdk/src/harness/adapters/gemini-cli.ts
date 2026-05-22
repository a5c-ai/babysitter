/**
 * Gemini CLI harness adapter.
 *
 * Derives all behavior from BaseHarnessAdapter + agent-mux metadata.
 */

import { BaseHarnessAdapter, type AdapterConfig } from "../BaseAdapter";
import { getAmuxAdapterMetadata } from "../amuxMetadata";
import { deriveAdapterConfig } from "../derivePromptContext";

function buildConfig(): AdapterConfig {
  const metadata = getAmuxAdapterMetadata("gemini-cli");
  return deriveAdapterConfig(metadata, {
    name: "gemini-cli",
    displayName: "Gemini CLI",
    extraActivationEnvVars: ["GEMINI_PROJECT_DIR", "GEMINI_CWD"],
    pluginRootEnvVars: ["GEMINI_EXTENSION_PATH", "BABYSITTER_EXTENSION_PATH"],
    sessionIdEnvVars: ["GEMINI_SESSION_ID", "AGENT_SESSION_ID"],
    pluginRootVar: "${GEMINI_EXTENSION_PATH}",
    interactiveToolName: "AskUserQuestion tool",
    sessionEnvVars: "GEMINI_SESSION_ID and AGENT_SESSION_ID",
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
  });
}

class GeminiCliAdapter extends BaseHarnessAdapter {
  constructor() {
    super(buildConfig());
  }
}

export function createGeminiCliAdapter(): GeminiCliAdapter {
  return new GeminiCliAdapter();
}
