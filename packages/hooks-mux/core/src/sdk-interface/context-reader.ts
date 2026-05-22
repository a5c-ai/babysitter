import type { AdapterCapabilities } from '../types/adapter';

/**
 * Execution context variables that hooks-mux injects into subprocess
 * environments. Used by hook handler scripts and SDK adapters to access
 * the current session context without parsing stdin.
 */
export interface ExecutionContextFromEnv {
  sessionId: string | null;
  turnId: string | null;
  adapter: string | null;
  workspaceRoot: string | null;
  transcriptPath: string | null;
  contextFile: string | null;
  /** Parsed adapter capabilities from AGENT_CAPABILITIES_JSON. */
  capabilities: AdapterCapabilities | null;
}

// ---------------------------------------------------------------------------
// Env var name constants
// ---------------------------------------------------------------------------

const ENV_SESSION_ID = 'AGENT_SESSION_ID';
const ENV_TURN_ID = 'AGENT_TURN_ID';
const ENV_ADAPTER = 'AGENT_ADAPTER';
const ENV_WORKSPACE_ROOT = 'AGENT_WORKSPACE_ROOT';
const ENV_TRANSCRIPT_PATH = 'AGENT_TRANSCRIPT_PATH';
const ENV_CONTEXT_FILE = 'AGENT_CONTEXT_FILE';
const ENV_CAPABILITIES_JSON = 'AGENT_CAPABILITIES_JSON';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read execution context from process.env (or a provided env object).
 * Looks for AGENT_SESSION_ID, AGENT_TURN_ID, AGENT_ADAPTER, etc.
 */
export function readExecutionContext(
  env: Record<string, string | undefined> = process.env,
): ExecutionContextFromEnv {
  const capJson = env[ENV_CAPABILITIES_JSON];
  let capabilities: AdapterCapabilities | null = null;
  if (capJson) {
    try {
      capabilities = JSON.parse(capJson) as AdapterCapabilities;
    } catch {
      // Malformed JSON — treat as absent
      capabilities = null;
    }
  }

  return {
    sessionId: env[ENV_SESSION_ID] ?? null,
    turnId: env[ENV_TURN_ID] ?? null,
    adapter: env[ENV_ADAPTER] ?? null,
    workspaceRoot: env[ENV_WORKSPACE_ROOT] ?? null,
    transcriptPath: env[ENV_TRANSCRIPT_PATH] ?? null,
    contextFile: env[ENV_CONTEXT_FILE] ?? null,
    capabilities,
  };
}

/**
 * Check if the current process was invoked by hooks-mux
 * (i.e., has the AGENT_SESSION_ID env var set).
 */
export function isInHooksProxyContext(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env[ENV_SESSION_ID] !== undefined && env[ENV_SESSION_ID] !== '';
}
