import { normalizeEvent, type UnifiedHookEvent, type NormalizeOptions } from '@a5c-ai/hooks-adapter-core';
import { GENTY_PHASE_MAPPINGS } from './mappings';

/** The default adapter identifier used in all normalized events. */
export const ADAPTER_NAME = 'genty';

/** The mutable adapter name, defaulting to the genty adapter identity. */
let _adapterName: string = ADAPTER_NAME;

/** Override the adapter name used in normalized events. */
export function setAdapterName(name: string): void {
  _adapterName = name;
}

/**
 * Shape of a genty event stdin payload.
 * Genty delivers event data as `{ event, cwd, session_id }` JSON on stdin.
 */
export interface GentyEventPayload {
  event?: string;
  cwd?: string;
  session_id?: string;
  [key: string]: unknown;
}

/**
 * Parse raw stdin input into a typed object.
 * If parsing fails, return empty object (fail-open).
 */
export function parseStdin(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // fail open
    }
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

/**
 * Extract session ID from environment variables.
 * Genty uses the AGENT_SESSION_ID env var for session identity.
 */
export function extractSessionId(env: Record<string, string>): string | null {
  const sessionId = env['AGENT_SESSION_ID'];
  if (typeof sessionId === 'string' && sessionId.length > 0) {
    return sessionId;
  }
  return null;
}

/**
 * Normalize a raw genty hook invocation into a UnifiedHookEvent.
 *
 * Genty has no native hook system. This normalizer handles the
 * emulated lifecycle events (SessionStart, Stop) that the babysitter
 * bridge triggers through proxied hook scripts.
 *
 * @param rawEventName - The native event name (e.g. 'SessionStart')
 * @param stdinPayload - Raw stdin content (string or parsed object)
 * @param env - Environment variables at invocation time
 */
export function normalizeGentyEvent(
  rawEventName: string,
  stdinPayload: unknown,
  env: Record<string, string> = {},
): UnifiedHookEvent {
  const parsed = parseStdin(stdinPayload);

  // Enrich env with genty-specific fields
  const enrichedEnv = { ...env };

  // Session ID comes from env
  const sessionId = extractSessionId(enrichedEnv);
  if (sessionId && !enrichedEnv['HOOKS_PROXY_SESSION_ID']) {
    enrichedEnv['HOOKS_PROXY_SESSION_ID'] = sessionId;
  }

  // Extract cwd from payload
  if (typeof parsed['cwd'] === 'string' && !enrichedEnv['HOOKS_PROXY_CWD']) {
    enrichedEnv['HOOKS_PROXY_CWD'] = parsed['cwd'];
  }

  const options: NormalizeOptions = {
    adapter: _adapterName,
    rawEventName,
    stdinPayload: parsed,
    env: enrichedEnv,
    adapterMappings: GENTY_PHASE_MAPPINGS,
  };

  return normalizeEvent(options);
}
