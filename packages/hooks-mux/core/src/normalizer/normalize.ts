import type { CanonicalPhase, PhaseMapping } from '../types/lifecycle';
import type { UnifiedHookEvent, UnifiedExecutionContext } from '../types/event';
import { NormalizationError } from './errors';

/**
 * Options for normalizing a raw adapter event into a UnifiedHookEvent.
 */
export interface NormalizeOptions {
  /** The adapter name (e.g. 'claude', 'codex'). */
  adapter: string;
  /** The raw/native event name from the adapter. */
  rawEventName: string;
  /** Payload received on stdin (parsed JSON or raw). */
  stdinPayload?: unknown;
  /** Environment variables at invocation time. */
  env?: Record<string, string>;
  /** Phase mappings for this adapter. */
  adapterMappings: PhaseMapping[];
}

/** Env var prefixes that are considered hook-proxy input vars. */
const INPUT_ENV_PREFIX = 'HOOKS_PROXY_';
/** Env var prefixes for persisted state. */
const PERSISTED_ENV_PREFIX = 'HOOKS_PROXY_PERSIST_';

/**
 * Look up the canonical phase for a raw event name using adapter mappings.
 * Returns the mapping if found, or undefined.
 */
export function resolvePhaseMapping(
  rawEventName: string,
  adapterMappings: PhaseMapping[],
): PhaseMapping | undefined {
  return adapterMappings.find((m) => m.nativeHook === rawEventName);
}

/**
 * Build execution context from environment variables and adapter info.
 */
function buildExecutionContext(
  adapter: string,
  rawEventName: string,
  env: Record<string, string>,
): UnifiedExecutionContext {
  const persistedEnv: Record<string, string> = {};
  const contextVars: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith(PERSISTED_ENV_PREFIX)) {
      persistedEnv[key] = value;
    }
  }

  return {
    sessionId: env['HOOKS_PROXY_SESSION_ID'] ?? env['SESSION_ID'] ?? null,
    turnId: env['HOOKS_PROXY_TURN_ID'] ?? env['TURN_ID'] ?? null,
    conversationId: env['HOOKS_PROXY_CONVERSATION_ID'] ?? null,
    adapter,
    cwd: env['HOOKS_PROXY_CWD'] ?? env['PWD'] ?? null,
    worktree: env['HOOKS_PROXY_WORKTREE'] ?? null,
    transcriptPath: env['HOOKS_PROXY_TRANSCRIPT_PATH'] ?? null,
    source: env['HOOKS_PROXY_SOURCE'] ?? null,
    model: env['HOOKS_PROXY_MODEL'] ?? env['MODEL'] ?? null,
    agentType: env['HOOKS_PROXY_AGENT_TYPE'] ?? null,
    permissionMode: env['HOOKS_PROXY_PERMISSION_MODE'] ?? null,
    toolName: env['HOOKS_PROXY_TOOL_NAME'] ?? null,
    toolCallId: env['HOOKS_PROXY_TOOL_CALL_ID'] ?? null,
    nativeEventName: rawEventName,
    rawEventScope: env['HOOKS_PROXY_EVENT_SCOPE'] ?? null,
    persistedEnv,
    contextVars,
    metadata: {},
  };
}

/**
 * Split env into input and persisted buckets.
 */
export function splitEnv(env: Record<string, string>): {
  input: Record<string, string>;
  persisted: Record<string, string>;
} {
  const input: Record<string, string> = {};
  const persisted: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith(PERSISTED_ENV_PREFIX)) {
      persisted[key] = value;
    } else if (key.startsWith(INPUT_ENV_PREFIX)) {
      input[key] = value;
    }
  }

  return { input, persisted };
}

/**
 * Normalize a raw adapter event into a UnifiedHookEvent.
 *
 * Looks up the canonical phase from adapter mappings, builds execution context
 * from env, and extracts payload from stdin.
 */
export function normalizeEvent(options: NormalizeOptions): UnifiedHookEvent {
  const { adapter, rawEventName, stdinPayload, env = {}, adapterMappings } = options;

  if (!adapter) {
    throw new NormalizationError('adapter is required', 'MISSING_ADAPTER');
  }
  if (!rawEventName) {
    throw new NormalizationError('rawEventName is required', 'MISSING_EVENT_NAME');
  }

  const mapping = resolvePhaseMapping(rawEventName, adapterMappings);

  const phase: string = mapping?.canonicalPhase ?? ('unknown' as CanonicalPhase);
  const supportLevel: 'native' | 'emulated' | 'lossy' | 'unsupported' =
    mapping?.supportLevel ?? 'unsupported';

  const execution = buildExecutionContext(adapter, rawEventName, env);

  // Extract payload: if stdinPayload is an object, use it; otherwise wrap it
  let payload: Record<string, unknown>;
  if (stdinPayload != null && typeof stdinPayload === 'object' && !Array.isArray(stdinPayload)) {
    payload = stdinPayload as Record<string, unknown>;
  } else if (stdinPayload !== undefined) {
    payload = { raw: stdinPayload };
  } else {
    payload = {};
  }

  // Split env for the env field
  const { input: inputEnv, persisted: persistedEnv } = splitEnv(env);

  const event: UnifiedHookEvent = {
    version: 'a5c.hooks.v1',
    adapter,
    phase,
    rawEventName,
    supportLevel,
    execution,
    payload,
    env: {
      input: inputEnv,
      persisted: persistedEnv,
    },
    raw: stdinPayload,
  };

  return event;
}
