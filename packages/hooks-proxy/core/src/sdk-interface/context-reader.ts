/**
 * Execution context variables that hooks-proxy injects into subprocess
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
  return {
    sessionId: env[ENV_SESSION_ID] ?? null,
    turnId: env[ENV_TURN_ID] ?? null,
    adapter: env[ENV_ADAPTER] ?? null,
    workspaceRoot: env[ENV_WORKSPACE_ROOT] ?? null,
    transcriptPath: env[ENV_TRANSCRIPT_PATH] ?? null,
    contextFile: env[ENV_CONTEXT_FILE] ?? null,
  };
}

/**
 * Check if the current process was invoked by hooks-proxy
 * (i.e., has the AGENT_SESSION_ID env var set).
 */
export function isInHooksProxyContext(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env[ENV_SESSION_ID] !== undefined && env[ENV_SESSION_ID] !== '';
}
