/**
 * Delegating adapter for Paperclip harness detection.
 *
 * Detects which underlying AI harness a Paperclip agent uses and delegates
 * babysitter adapter operations to the appropriate harness adapter.
 *
 * Detection tiers (in priority order):
 *   1. Agent metadata — read adapterType from agent config (e.g., claude_local -> claude-code)
 *   2. Environment probing — check env vars for known harness signatures
 *   3. Explicit config — fall back to plugin settings
 */

import { ADAPTER_TYPE_MAP, type HarnessDetectionResult } from "./types";

/**
 * Detect the underlying harness from a Paperclip agent's adapter type.
 *
 * @param adapterType - The agent's adapterType field (e.g., "claude_local")
 * @param pluginConfig - Plugin settings for fallback detection
 * @returns Detection result with harness name and confidence
 */
export function detectHarness(
  adapterType?: string,
  pluginConfig?: { defaultHarness?: string }
): HarnessDetectionResult {
  // Tier 1: Agent metadata inspection (highest confidence)
  if (adapterType && adapterType in ADAPTER_TYPE_MAP) {
    return {
      harnessName: ADAPTER_TYPE_MAP[adapterType],
      detectionTier: "agent-metadata",
      confidence: "high",
    };
  }

  // Tier 2: Environment variable probing
  const envHarness = detectFromEnvironment();
  if (envHarness) {
    return {
      harnessName: envHarness,
      detectionTier: "env-probe",
      confidence: "medium",
    };
  }

  // Tier 3: Explicit plugin configuration
  if (pluginConfig?.defaultHarness) {
    return {
      harnessName: pluginConfig.defaultHarness,
      detectionTier: "config",
      confidence: "medium",
    };
  }

  // Fallback: default to claude-code
  return {
    harnessName: "claude-code",
    detectionTier: "fallback",
    confidence: "low",
  };
}

/**
 * Probe environment variables for known harness signatures.
 */
function detectFromEnvironment(): string | undefined {
  const env = process.env;

  // Claude Code sets CLAUDE_CODE_* env vars
  if (env.CLAUDE_CODE_SESSION || env.CLAUDE_CODE_ENTRYPOINT) {
    return "claude-code";
  }

  // Codex uses CODEX_* vars
  if (env.CODEX_SESSION || env.CODEX_HOME) {
    return "codex";
  }

  // Gemini CLI
  if (env.GEMINI_CLI_SESSION || env.GOOGLE_GENAI_API_KEY) {
    return "gemini-cli";
  }

  // Cursor
  if (env.CURSOR_SESSION) {
    return "cursor";
  }

  return undefined;
}

/**
 * Map a Paperclip adapter type string to a babysitter harness name.
 * Returns undefined if no mapping exists.
 */
export function mapAdapterType(adapterType: string): string | undefined {
  return ADAPTER_TYPE_MAP[adapterType];
}
