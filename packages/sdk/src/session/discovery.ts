import { CLAUDE_CODE_DISCOVERY_SPEC } from "../harness/claudeCode/discovery";
import { CODEX_DISCOVERY_SPEC } from "../harness/codex/discovery";
import { CURSOR_DISCOVERY_SPEC } from "../harness/cursor/discovery";
import { GEMINI_CLI_DISCOVERY_SPEC } from "../harness/geminiCli/discovery";
import { GITHUB_COPILOT_DISCOVERY_SPEC } from "../harness/githubCopilot/discovery";
import { OH_MY_PI_DISCOVERY_SPEC } from "../harness/ohMyPi/discovery";
import { OPENCODE_DISCOVERY_SPEC } from "../harness/opencode/discovery";
import { PI_DISCOVERY_SPEC } from "../harness/pi/discovery";
import { resolveSessionIdWithMarker } from "../utils/sessionMarker";

/**
 * Mapping of harness identifiers to their native session environment variables.
 * These are used as the primary ambient discovery sources for harnesses that
 * inject their own per-session env vars. PID-scoped markers are only used as
 * the final fallback when direct/env-based resolution is unavailable.
 */
export const HARNESS_ENV_VARS: Record<string, string[]> = {
  [CLAUDE_CODE_DISCOVERY_SPEC.name]: [...CLAUDE_CODE_DISCOVERY_SPEC.callerEnvVars],
  [CODEX_DISCOVERY_SPEC.name]: [...CODEX_DISCOVERY_SPEC.callerEnvVars],
  [CURSOR_DISCOVERY_SPEC.name]: [...CURSOR_DISCOVERY_SPEC.callerEnvVars],
  [GEMINI_CLI_DISCOVERY_SPEC.name]: [...GEMINI_CLI_DISCOVERY_SPEC.callerEnvVars],
  [GITHUB_COPILOT_DISCOVERY_SPEC.name]: [...GITHUB_COPILOT_DISCOVERY_SPEC.callerEnvVars],
  [OH_MY_PI_DISCOVERY_SPEC.name]: [...OH_MY_PI_DISCOVERY_SPEC.callerEnvVars],
  [OPENCODE_DISCOVERY_SPEC.name]: [...OPENCODE_DISCOVERY_SPEC.callerEnvVars],
  [PI_DISCOVERY_SPEC.name]: [...PI_DISCOVERY_SPEC.callerEnvVars],
};

/**
 * Resolve the current session ID from the ambient environment (markers + env vars).
 *
 * This is used for "autodiscovery" in contexts where no explicit session ID
 * was provided (e.g. journaling low-level events).
 *
 * Precedence matches the standard adapter resolution:
 *   1. Harness-native env vars (e.g. GEMINI_SESSION_ID)
 *   2. BABYSITTER_SESSION_ID
 *   3. PID-scoped marker for the given harness (fallback only)
 *
 * If BABYSITTER_TRUST_ENV_SESSION=1 is set, env vars are preferred over markers.
 */
export function resolveAmbientSessionId(harness?: string): string | undefined {
  if (!harness) {
    return process.env.BABYSITTER_SESSION_ID;
  }

  const envVars = HARNESS_ENV_VARS[harness] || [];
  return resolveSessionIdWithMarker(harness, {}, envVars);
}
