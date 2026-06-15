/**
 * Claude Code harness adapter.
 *
 * Derives all behavior from BaseHarnessAdapter + adapters metadata.
 */

import { appendFileSync } from "node:fs";
import { BaseHarnessAdapter, type AdapterConfig } from "../BaseAdapter";
import { getAmuxAdapterMetadata } from "../adapterMetadata";
import { deriveAdapterConfig } from "../derivePromptContext";
import {
  resolveSessionIdWithMarkerDetailed,
  type SessionResolutionDetails as SharedSessionResolutionDetails,
} from "../../utils/sessionMarker";

// ---------------------------------------------------------------------------
// Backward-compatible exported utilities
// ---------------------------------------------------------------------------

export function resolveCurrentSessionIdFromEnv(): string | undefined {
  return process.env.AGENT_SESSION_ID;
}

export type SessionResolutionDetails = SharedSessionResolutionDetails;

export function resolveSessionIdDetailed(explicit?: string): SessionResolutionDetails {
  return resolveSessionIdWithMarkerDetailed(
    "claude-code",
    explicit ? { sessionId: explicit } : {},
  );
}

export const __resolveCurrentSessionIdFromEnvForTests = resolveCurrentSessionIdFromEnv;

export function setBabysitterSessionIdInEnvFile(envFile: string, sessionId: string): void {
  appendFileSync(envFile, `export AGENT_SESSION_ID="${sessionId}"\n`);
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

function buildConfig(): AdapterConfig {
  const metadata = getAmuxAdapterMetadata("claude-code");
  return deriveAdapterConfig(metadata, {
    name: "claude-code",
    displayName: "Claude Code",
    extraActivationEnvVars: ["CLAUDE_ENV_FILE"],
    pluginRootEnvVars: ["CLAUDE_PLUGIN_ROOT"],
    sessionIdEnvVars: ["AGENT_SESSION_ID"],
    pluginRootVar: "${CLAUDE_PLUGIN_ROOT}",
    interactiveToolName: "AskUserQuestion tool",
    sessionEnvVars: "AGENT_SESSION_ID",
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    hookDriven: true,
    autoReleaseStale: true,
  });
}

class ClaudeCodeAdapter extends BaseHarnessAdapter {
  constructor() {
    super(buildConfig());
  }
}

export function createClaudeCodeAdapter(): ClaudeCodeAdapter {
  return new ClaudeCodeAdapter();
}
