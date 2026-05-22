import { normalizeEvent, type UnifiedHookEvent, type NormalizeOptions } from '@a5c-ai/hooks-mux-core';
import { CURSOR_PHASE_MAPPINGS } from './mappings';
import { getEventDiagnostics } from './capability-profile';

/** The default adapter identifier used in all normalized events. */
export const ADAPTER_NAME = 'cursor';

/** Mutable adapter name, defaulting to the cursor adapter identity. */
let _adapterName: string = 'cursor';

/** Override the adapter name used in normalized events. */
export function setAdapterName(name: string): void {
  _adapterName = name;
}

/**
 * Common fields that may be present on Cursor hook stdin payloads.
 * Cursor's stdin format is not fully documented; fields may be
 * absent or undefined. The normalizer handles all cases gracefully.
 */
export interface CursorStdinBase {
  cwd?: string;
  workspace?: string;
  model?: string;
  [key: string]: unknown;
}

/** SessionStart-specific fields. */
export interface CursorSessionStartPayload extends CursorStdinBase {
  source?: string;
}

/** Stop-specific fields. */
export interface CursorStopPayload extends CursorStdinBase {
  reason?: string;
  stop_hook_active?: boolean;
}

/** PreToolUse-specific fields (when available). */
export interface CursorPreToolUsePayload extends CursorStdinBase {
  tool_name?: string;
  tool_call_id?: string;
  tool_input?: unknown;
}

/** PostToolUse-specific fields (when available). */
export interface CursorPostToolUsePayload extends CursorStdinBase {
  tool_name?: string;
  tool_call_id?: string;
  tool_input?: unknown;
  tool_response?: unknown;
}

/**
 * Parse raw stdin input into a typed object.
 * Cursor hooks receive JSON on stdin. If parsing fails, return empty
 * object (fail-open: Cursor's payload format is not fully documented).
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
      // fail open -- Cursor payload format is uncertain
    }
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

/**
 * Extract tool metadata from a preToolUse/postToolUse payload.
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
 * Normalize a raw Cursor hook invocation into a UnifiedHookEvent.
 *
 * Cursor's hook surface is experimental. The normalizer:
 * - Parses stdin gracefully (fail-open on missing/malformed fields)
 * - Annotates events with capability profile diagnostics
 * - Enriches env from stdin payload fields
 *
 * @param rawEventName - The native Cursor event name (e.g. 'sessionStart', 'stop')
 * @param stdinPayload - Raw stdin content (string or parsed object)
 * @param env - Environment variables at invocation time
 */
export function normalizeCursorEvent(
  rawEventName: string,
  stdinPayload: unknown,
  env: Record<string, string> = {},
): UnifiedHookEvent {
  const parsed = parseStdin(stdinPayload);

  // Enrich env with Cursor-specific fields extracted from stdin
  const enrichedEnv = { ...env };

  // Cursor does not provide a native session_id -- derive from workspace/cwd
  if (typeof parsed['cwd'] === 'string' && !enrichedEnv['HOOKS_PROXY_CWD']) {
    enrichedEnv['HOOKS_PROXY_CWD'] = parsed['cwd'];
  }

  if (typeof parsed['workspace'] === 'string' && !enrichedEnv['HOOKS_PROXY_WORKTREE']) {
    enrichedEnv['HOOKS_PROXY_WORKTREE'] = parsed['workspace'];
  }

  if (typeof parsed['model'] === 'string' && !enrichedEnv['HOOKS_PROXY_MODEL']) {
    enrichedEnv['HOOKS_PROXY_MODEL'] = parsed['model'];
  }

  if (typeof parsed['source'] === 'string' && !enrichedEnv['HOOKS_PROXY_SOURCE']) {
    enrichedEnv['HOOKS_PROXY_SOURCE'] = parsed['source'];
  }

  // Tool-specific env enrichment
  if (rawEventName === 'preToolUse' || rawEventName === 'postToolUse') {
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
    adapterMappings: CURSOR_PHASE_MAPPINGS,
  };

  const event = normalizeEvent(options);

  // Annotate with capability profile diagnostics
  const diagnostics = getEventDiagnostics(rawEventName);
  event.execution.metadata = {
    ...event.execution.metadata,
    cursorDiagnostics: diagnostics,
    experimental: true,
  };

  return event;
}
