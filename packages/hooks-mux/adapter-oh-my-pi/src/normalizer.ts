import { normalizeEvent, type UnifiedHookEvent, type NormalizeOptions } from '@a5c-ai/hooks-mux-core';
import { OH_MY_PI_PHASE_MAPPINGS } from './mappings';

/** The default adapter identifier used in all normalized events. */
export const ADAPTER_NAME = 'oh-my-pi';

/** Mutable adapter name, defaulting to the oh-my-pi adapter identity. */
let _adapterName: string = 'oh-my-pi';

/** Override the adapter name used in normalized events. */
export function setAdapterName(name: string): void {
  _adapterName = name;
}

/**
 * Common fields that may be present on Oh-My-Pi extension event contexts.
 * Oh-My-Pi events are delivered in-process as typed objects, not stdin.
 */
export interface OhMyPiEventContext {
  sessionId?: string;
  cwd?: string;
  workspace?: string;
  model?: string;
  [key: string]: unknown;
}

/** session_start-specific fields. */
export interface OhMyPiSessionStartPayload extends OhMyPiEventContext {
  source?: string;
}

/** session_end-specific fields. */
export interface OhMyPiSessionEndPayload extends OhMyPiEventContext {
  reason?: string;
}

/** prompt-specific fields. */
export interface OhMyPiPromptPayload extends OhMyPiEventContext {
  text?: string;
}

/** tool_call-specific fields. */
export interface OhMyPiToolCallPayload extends OhMyPiEventContext {
  tool_name?: string;
  tool_call_id?: string;
  tool_input?: unknown;
}

/** tool_result-specific fields. */
export interface OhMyPiToolResultPayload extends OhMyPiEventContext {
  tool_name?: string;
  tool_call_id?: string;
  tool_input?: unknown;
  tool_result?: unknown;
}

/** error-specific fields. */
export interface OhMyPiErrorPayload extends OhMyPiEventContext {
  error?: string;
  code?: string;
}

/**
 * Parse raw event context into a typed object.
 * Oh-My-Pi events are delivered in-process as objects, but we
 * handle string/null/undefined gracefully for robustness.
 */
export function parseEventContext(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // fail open for robustness
    }
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

/**
 * Extract tool metadata from a tool_call/tool_result event context.
 */
function extractToolFields(ctx: Record<string, unknown>): Record<string, string> {
  const fields: Record<string, string> = {};
  if (typeof ctx['tool_name'] === 'string') {
    fields['HOOKS_PROXY_TOOL_NAME'] = ctx['tool_name'];
  }
  if (typeof ctx['tool_call_id'] === 'string') {
    fields['HOOKS_PROXY_TOOL_CALL_ID'] = ctx['tool_call_id'];
  }
  return fields;
}

/**
 * Normalize a raw Oh-My-Pi extension event into a UnifiedHookEvent.
 *
 * Oh-My-Pi is a library-only adapter. Events arrive as in-process
 * objects from the Pi extension API, not via stdin. The normalizer:
 * - Parses event context gracefully
 * - Enriches env from context fields
 * - Extracts native session ID when available
 * - Annotates events with mutability limitation metadata
 *
 * @param rawEventName - The native Oh-My-Pi event name (e.g. 'session_start', 'tool_call')
 * @param eventContext - In-process event context object
 * @param env - Environment variables at invocation time
 */
export function normalizeOhMyPiEvent(
  rawEventName: string,
  eventContext: unknown,
  env: Record<string, string> = {},
): UnifiedHookEvent {
  const parsed = parseEventContext(eventContext);

  // Enrich env with Oh-My-Pi-specific fields extracted from context
  const enrichedEnv = { ...env };

  // Oh-My-Pi provides native session IDs via the Pi runtime
  if (typeof parsed['sessionId'] === 'string' && !enrichedEnv['HOOKS_PROXY_SESSION_ID']) {
    enrichedEnv['HOOKS_PROXY_SESSION_ID'] = parsed['sessionId'];
  }

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
  if (rawEventName === 'tool_call' || rawEventName === 'tool_result') {
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
    adapterMappings: OH_MY_PI_PHASE_MAPPINGS,
  };

  const event = normalizeEvent(options);

  // Annotate with Oh-My-Pi-specific metadata
  event.execution.metadata = {
    ...event.execution.metadata,
    adapterFamily: 'in-process',
    supportsToolInputMutation: false,
    chainedContext: true,
    sessionBeforeShortCircuit: true,
  };

  return event;
}
