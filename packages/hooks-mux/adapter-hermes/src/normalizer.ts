import { normalizeEvent, type UnifiedHookEvent, type NormalizeOptions } from '@a5c-ai/hooks-mux-core';
import { HERMES_PHASE_MAPPINGS } from './mappings';

/** The default adapter identifier used in all normalized events. */
export const ADAPTER_NAME = 'hermes';

/** The mutable adapter name, defaulting to the Hermes adapter identity. */
let _adapterName: string = ADAPTER_NAME;

/** Override the adapter name used in normalized events. */
export function setAdapterName(name: string): void {
  _adapterName = name;
}

/**
 * Shape of a Hermes onEvent stdin payload.
 * Hermes delivers a single `{ event, payload }` JSON object on stdin.
 * Fields may be absent or null -- fail open per spec 17.2.
 */
export interface HermesEventPayload {
  event?: string;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Parse raw stdin input into a typed object.
 * Hermes hooks receive JSON on stdin in the shape `{ event: string, payload: object }`.
 * If parsing fails, return empty object (fail-open per spec 17.2).
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
 * Extract the inner payload from the Hermes `{ event, payload }` envelope.
 * Returns the payload object, or the raw parsed object if no envelope found.
 */
export function extractInnerPayload(parsed: Record<string, unknown>): Record<string, unknown> {
  if (typeof parsed['payload'] === 'object' && parsed['payload'] !== null && !Array.isArray(parsed['payload'])) {
    return parsed['payload'] as Record<string, unknown>;
  }
  return parsed;
}

/**
 * Extract session ID from environment variables.
 * Hermes does not provide a session_id in stdin; instead it uses the
 * HERMES_SESSION env var.
 */
export function extractSessionId(env: Record<string, string>): string | null {
  const hermesSession = env['HERMES_SESSION'];
  if (typeof hermesSession === 'string' && hermesSession.length > 0) {
    return hermesSession;
  }
  return null;
}

/**
 * Normalize a raw Hermes hook invocation into a UnifiedHookEvent.
 *
 * Hermes has a single `onEvent` native hook. The stdin payload is a
 * JSON object with `{ event: string, payload: object }`. The `event`
 * field describes the kind of event, and `payload` contains the event
 * data. Session identity comes from the HERMES_SESSION env var.
 *
 * @param rawEventName - The native Hermes event name (always 'onEvent')
 * @param stdinPayload - Raw stdin content (string or parsed object)
 * @param env - Environment variables at invocation time
 */
export function normalizeHermesEvent(
  rawEventName: string,
  stdinPayload: unknown,
  env: Record<string, string> = {},
): UnifiedHookEvent {
  const parsed = parseStdin(stdinPayload);
  const innerPayload = extractInnerPayload(parsed);

  // Enrich env with Hermes-specific fields
  const enrichedEnv = { ...env };

  // Session ID comes from env, not stdin
  const sessionId = extractSessionId(enrichedEnv);
  if (sessionId && !enrichedEnv['HOOKS_PROXY_SESSION_ID']) {
    enrichedEnv['HOOKS_PROXY_SESSION_ID'] = sessionId;
  }

  // Extract common fields from inner payload
  if (typeof innerPayload['cwd'] === 'string' && !enrichedEnv['HOOKS_PROXY_CWD']) {
    enrichedEnv['HOOKS_PROXY_CWD'] = innerPayload['cwd'];
  }

  if (typeof innerPayload['model'] === 'string' && !enrichedEnv['HOOKS_PROXY_MODEL']) {
    enrichedEnv['HOOKS_PROXY_MODEL'] = innerPayload['model'];
  }

  // Extract tool metadata if present in inner payload
  if (typeof innerPayload['tool_name'] === 'string') {
    if (!enrichedEnv['HOOKS_PROXY_TOOL_NAME']) {
      enrichedEnv['HOOKS_PROXY_TOOL_NAME'] = innerPayload['tool_name'];
    }
  }
  if (typeof innerPayload['tool_call_id'] === 'string') {
    if (!enrichedEnv['HOOKS_PROXY_TOOL_CALL_ID']) {
      enrichedEnv['HOOKS_PROXY_TOOL_CALL_ID'] = innerPayload['tool_call_id'];
    }
  }

  const options: NormalizeOptions = {
    adapter: _adapterName,
    rawEventName,
    stdinPayload: parsed,
    env: enrichedEnv,
    adapterMappings: HERMES_PHASE_MAPPINGS,
  };

  return normalizeEvent(options);
}
