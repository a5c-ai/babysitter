import type { UnifiedHookEvent } from '@a5c-ai/hooks-mux-core';
import { normalizeEvent } from '@a5c-ai/hooks-mux-core';
import { COPILOT_PHASE_MAPPINGS } from './mappings';
import { resolveSyntheticSessionId } from './session-resolver';

/** The default adapter name. */
export const ADAPTER_NAME = 'copilot';

/** Mutable adapter name, defaulting to the Copilot adapter identity. */
let _copilotAdapterName: string = 'copilot';

/** Override the adapter name used in normalized events. */
export function setAdapterName(name: string): void {
  _copilotAdapterName = name;
}

/**
 * Shape of raw Copilot stdin JSON for hook events.
 *
 * Copilot delivers JSON on stdin with at least these fields.
 * Additional fields vary by event type.
 */
export interface CopilotRawInput {
  /** The native hook event name (e.g. 'sessionStart', 'preToolUse'). */
  event?: string;
  /** Working directory at time of invocation. */
  cwd?: string;
  /** Workspace or project root path. */
  workspace?: string;
  /** User prompt text (on userPromptSubmitted). */
  prompt?: string;
  /** Tool name (on preToolUse / postToolUse). */
  toolName?: string;
  /** Tool call ID (on preToolUse / postToolUse). */
  toolCallId?: string;
  /** Tool input data (on preToolUse). */
  toolInput?: unknown;
  /** Tool response data (on postToolUse). */
  toolResponse?: unknown;
  /** Error message (on error events). */
  error?: string;
  /** Arbitrary additional fields. */
  [key: string]: unknown;
}

/**
 * Parse raw stdin string into a CopilotRawInput.
 *
 * Returns null if the input is empty or unparseable.
 */
export function parseStdin(raw: string): CopilotRawInput | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as CopilotRawInput;
  } catch {
    return null;
  }
}

/**
 * Normalize a raw Copilot hook input into a UnifiedHookEvent.
 *
 * @param rawInput - Parsed JSON from stdin
 * @param nativeEventName - The native event name (from stdin or CLI flag)
 * @param env - Environment variables at invocation
 */
export function normalizeCopilotEvent(
  rawInput: CopilotRawInput,
  nativeEventName: string,
  env: Record<string, string> = {},
): UnifiedHookEvent {
  // Derive session ID: check env overrides, then synthesize from cwd/workspace
  const sessionId =
    env['AGENT_SESSION_ID'] ??
    env['HOOKS_PROXY_SESSION_ID'] ??
    resolveSyntheticSessionId(rawInput.cwd, rawInput.workspace);

  // Build enriched env with session context
  const enrichedEnv: Record<string, string> = {
    ...env,
    HOOKS_PROXY_SESSION_ID: sessionId,
  };

  if (rawInput.cwd) {
    enrichedEnv['HOOKS_PROXY_CWD'] = rawInput.cwd;
  }
  if (rawInput.toolName) {
    enrichedEnv['HOOKS_PROXY_TOOL_NAME'] = rawInput.toolName;
  }
  if (rawInput.toolCallId) {
    enrichedEnv['HOOKS_PROXY_TOOL_CALL_ID'] = rawInput.toolCallId;
  }

  // Build payload from raw input, preserving native detail
  const payload: Record<string, unknown> = { ...rawInput };
  // Remove the event field from payload since it's the event name
  delete payload['event'];

  return normalizeEvent({
    adapter: _copilotAdapterName,
    rawEventName: nativeEventName,
    stdinPayload: payload,
    env: enrichedEnv,
    adapterMappings: COPILOT_PHASE_MAPPINGS,
  });
}
