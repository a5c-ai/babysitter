import { normalizeEvent, type UnifiedHookEvent, type NormalizeOptions } from '@a5c-ai/agent-mux-hooks-core';
import { CODEX_PHASE_MAPPINGS } from './mappings';

/** The default adapter identifier used in all normalized events. */
export const ADAPTER_NAME = 'codex';

/** The mutable adapter name, defaulting to the Codex adapter identity. */
let _adapterName: string = ADAPTER_NAME;

/** Override the adapter name used in normalized events. */
export function setAdapterName(name: string): void {
  _adapterName = name;
}

/**
 * Shape of a Codex SessionStart stdin payload.
 * Fields may be absent or null -- fail open per spec 17.2.
 */
export interface CodexSessionStartPayload {
  session_id?: string;
  cwd?: string;
  model?: string;
  source?: string;
  [key: string]: unknown;
}

/**
 * Shape of a Codex UserPromptSubmit stdin payload.
 */
export interface CodexUserPromptPayload {
  session_id?: string;
  prompt?: string;
  cwd?: string;
  [key: string]: unknown;
}

/**
 * Shape of a Codex Stop stdin payload.
 */
export interface CodexStopPayload {
  session_id?: string;
  reason?: string;
  stop_hook_active?: boolean;
  [key: string]: unknown;
}

/**
 * Shape of a Codex PreToolUse / PostToolUse stdin payload.
 */
export interface CodexToolPayload {
  session_id?: string;
  tool_name?: string;
  tool_call_id?: string;
  tool_input?: unknown;
  tool_output?: unknown;
  [key: string]: unknown;
}

/**
 * Parse raw stdin input into a typed object.
 * Codex hooks receive JSON on stdin. If parsing fails, return empty object
 * (fail-open per spec 17.2).
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
 * Extract session_id from stdin payload.
 * Codex provides a native session_id in most events.
 */
export function extractSessionId(payload: Record<string, unknown>): string | null {
  if (typeof payload['session_id'] === 'string' && payload['session_id'].length > 0) {
    return payload['session_id'];
  }
  return null;
}

/**
 * Extract tool metadata from a PreToolUse/PostToolUse payload.
 */
function extractToolFields(payload: Record<string, unknown>): Record<string, string> {
  const fields: Record<string, string> = {};
  if (typeof payload['tool_name'] === 'string') {
    fields['HOOKS_PROXY_TOOL_NAME'] = payload['tool_name'];
  }
  if (typeof payload['tool_call_id'] === 'string') {
    fields['HOOKS_PROXY_TOOL_CALL_ID'] = payload['tool_call_id'];
  }
  return fields;
}

/**
 * Normalize a raw Codex hook invocation into a UnifiedHookEvent.
 *
 * @param rawEventName - The native Codex event name (e.g. 'SessionStart', 'Stop')
 * @param stdinPayload - Raw stdin content (string or parsed object)
 * @param env - Environment variables at invocation time
 */
export function normalizeCodexEvent(
  rawEventName: string,
  stdinPayload: unknown,
  env: Record<string, string> = {},
): UnifiedHookEvent {
  const parsed = parseStdin(stdinPayload);

  // Enrich env with Codex-specific fields extracted from stdin
  const enrichedEnv = { ...env };

  const sessionId = extractSessionId(parsed);
  if (sessionId && !enrichedEnv['HOOKS_PROXY_SESSION_ID']) {
    enrichedEnv['HOOKS_PROXY_SESSION_ID'] = sessionId;
  }

  if (typeof parsed['cwd'] === 'string' && !enrichedEnv['HOOKS_PROXY_CWD']) {
    enrichedEnv['HOOKS_PROXY_CWD'] = parsed['cwd'];
  }

  if (typeof parsed['model'] === 'string' && !enrichedEnv['HOOKS_PROXY_MODEL']) {
    enrichedEnv['HOOKS_PROXY_MODEL'] = parsed['model'];
  }

  if (typeof parsed['source'] === 'string' && !enrichedEnv['HOOKS_PROXY_SOURCE']) {
    enrichedEnv['HOOKS_PROXY_SOURCE'] = parsed['source'];
  }

  // Tool-specific env enrichment
  if (rawEventName === 'PreToolUse' || rawEventName === 'PostToolUse') {
    const toolFields = extractToolFields(parsed);
    for (const [k, v] of Object.entries(toolFields)) {
      if (!enrichedEnv[k]) {
        enrichedEnv[k] = v;
      }
    }
  }

  const options: NormalizeOptions = {
    adapter: _adapterName,
    rawEventName,
    stdinPayload: parsed,
    env: enrichedEnv,
    adapterMappings: CODEX_PHASE_MAPPINGS,
  };

  return normalizeEvent(options);
}
