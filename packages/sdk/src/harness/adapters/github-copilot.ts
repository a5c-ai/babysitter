/**
 * GitHub Copilot harness adapter.
 *
 * Derives all behavior from BaseHarnessAdapter + agent-mux metadata.
 */

import { appendFileSync } from "node:fs";
import { HarnessCapability as Cap } from "../types";
import { BaseHarnessAdapter, type AdapterConfig } from "../BaseAdapter";
import { getAmuxAdapterMetadata } from "../amuxMetadata";
import { deriveAdapterConfig } from "../derivePromptContext";

// ---------------------------------------------------------------------------
// Backward-compatible exported utility
// ---------------------------------------------------------------------------

export function setBabysitterSessionIdInCopilotEnvFile(
  envFile: string,
  sessionId: string,
): void {
  appendFileSync(envFile, `export AGENT_SESSION_ID="${sessionId}"\n`);
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

function buildConfig(): AdapterConfig {
  const metadata = getAmuxAdapterMetadata("github-copilot");
  const config = deriveAdapterConfig(metadata, {
    name: "github-copilot",
    displayName: "GitHub Copilot CLI",
    extraActivationEnvVars: ["COPILOT_HOME", "COPILOT_GITHUB_TOKEN"],
    pluginRootEnvVars: ["CLAUDE_PLUGIN_DATA", "COPILOT_PLUGIN_ROOT"],
    sessionIdEnvVars: ["AGENT_SESSION_ID", "COPILOT_SESSION_ID"],
    pluginRootVar: "${COPILOT_PLUGIN_ROOT}",
    interactiveToolName: "AskUserQuestion tool",
    sessionEnvVars: "AGENT_SESSION_ID and COPILOT_SESSION_ID",
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    capabilities: [Cap.HeadlessPrompt, Cap.SessionBinding, Cap.Mcp],
    promptCapabilities: ["hooks", "mcp", "task-tool", "breakpoint-routing"],
    loopControlTerm: "in-turn",
    hookDriven: false,
    supportedHookTypes: [
      "session-start", "session-end", "user-prompt-submit",
      "pre-tool-use", "post-tool-use",
    ],
    missingSessionIdHint:
      "GitHub Copilot CLI provides session IDs via hook stdin JSON. " +
      "Use --session-id explicitly, or ensure Copilot CLI hooks are configured " +
      "to pass session_id in the stdin payload.",
  });
  config.autoResolvesSession = false;
  return config;
}

class GithubCopilotAdapter extends BaseHarnessAdapter {
  constructor() {
    super(buildConfig());
  }
}

export function createGithubCopilotAdapter(): GithubCopilotAdapter {
  return new GithubCopilotAdapter();
}
