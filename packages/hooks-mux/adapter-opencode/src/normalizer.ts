import type { UnifiedHookEvent, UnifiedExecutionContext } from '@a5c-ai/hooks-mux-core';
import { getOpenCodePhaseMapping, SHELL_ENV_NATIVE_HOOK } from './mappings';
import { resolveSessionId } from './session-resolver';

/** The default adapter name. */
export const ADAPTER_NAME = 'opencode';

/** Mutable adapter name, defaulting to the opencode adapter identity. */
let _adapterName: string = 'opencode';

/** Override the adapter name used in normalized events. */
export function setAdapterName(name: string): void {
  _adapterName = name;
}

/**
 * OpenCode event payload shapes.
 *
 * OpenCode passes events programmatically as objects (in-process adapter).
 */

/** Common fields present across OpenCode hook events. */
export interface OpenCodeEventBase {
  /** Session identifier provided by OpenCode runtime. */
  sessionId?: string;
  /** Workspace or project directory. */
  cwd?: string;
  /** Model identifier. */
  model?: string;
  [key: string]: unknown;
}

/** session.created event payload. */
export interface OpenCodeSessionCreatedPayload extends OpenCodeEventBase {
  /** Initial user prompt if available. */
  prompt?: string;
}

/** tool.execute.before event payload. */
export interface OpenCodeToolExecuteBeforePayload extends OpenCodeEventBase {
  /** Name of the tool being executed. */
  toolName?: string;
  /** Input arguments for the tool. */
  toolInput?: unknown;
  /** Tool call identifier. */
  toolCallId?: string;
}

/** tool.execute.after event payload. */
export interface OpenCodeToolExecuteAfterPayload extends OpenCodeEventBase {
  /** Name of the tool that was executed. */
  toolName?: string;
  /** Input arguments for the tool. */
  toolInput?: unknown;
  /** Tool execution result. */
  toolResult?: unknown;
  /** Tool call identifier. */
  toolCallId?: string;
}

/** shell.env event payload -- used for runtime env injection. */
export interface OpenCodeShellEnvPayload extends OpenCodeEventBase {
  /** Environment variables to inject into the runtime. */
  env?: Record<string, string>;
}

/**
 * Parse raw event input (string or object) into a structured object.
 */
export function parseEventData(raw: unknown): Record<string, unknown> {
  if (raw == null) {
    return {};
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return { raw: parsed };
    } catch {
      return { raw };
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return { raw };
}

/**
 * Build a UnifiedExecutionContext from an OpenCode event payload and environment.
 */
export function buildExecutionContext(
  eventData: Record<string, unknown>,
  nativeEventName: string,
  env: Record<string, string>,
): UnifiedExecutionContext {
  const persistedEnv: Record<string, string> = {};
  const contextVars: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('HOOKS_PROXY_PERSIST_')) {
      persistedEnv[key] = value;
    }
  }

  const sessionId = resolveSessionId(eventData, env);

  return {
    sessionId,
    turnId: env['HOOKS_PROXY_TURN_ID'] ?? null,
    conversationId: env['HOOKS_PROXY_CONVERSATION_ID'] ?? null,
    adapter: _adapterName,
    cwd: (eventData['cwd'] as string | undefined) ?? env['PWD'] ?? null,
    worktree: env['HOOKS_PROXY_WORKTREE'] ?? null,
    transcriptPath: null,
    source: null,
    model: (eventData['model'] as string | undefined) ?? env['HOOKS_PROXY_MODEL'] ?? null,
    agentType: null,
    permissionMode: null,
    toolName: (eventData['toolName'] as string | undefined) ?? null,
    toolCallId: (eventData['toolCallId'] as string | undefined) ?? null,
    nativeEventName,
    rawEventScope: null,
    persistedEnv,
    contextVars,
    metadata: {},
  };
}

/**
 * Build the payload portion of the unified event from OpenCode event data.
 * Extracts event-specific fields into the normalized payload.
 */
export function buildPayload(
  nativeEventName: string,
  eventData: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  switch (nativeEventName) {
    case 'session.created':
      if (eventData['prompt'] != null) payload.initialPrompt = eventData['prompt'];
      break;

    case 'tool.execute.before':
      if (eventData['toolName'] != null) payload.toolName = eventData['toolName'];
      if (eventData['toolInput'] != null) payload.toolInput = eventData['toolInput'];
      if (eventData['toolCallId'] != null) payload.toolCallId = eventData['toolCallId'];
      break;

    case 'tool.execute.after':
      if (eventData['toolName'] != null) payload.toolName = eventData['toolName'];
      if (eventData['toolInput'] != null) payload.toolInput = eventData['toolInput'];
      if (eventData['toolResult'] != null) payload.toolResponse = eventData['toolResult'];
      if (eventData['toolCallId'] != null) payload.toolCallId = eventData['toolCallId'];
      break;

    case SHELL_ENV_NATIVE_HOOK:
      if (eventData['env'] != null) payload.env = eventData['env'];
      break;

    default:
      // Unknown event: pass through all non-common fields
      for (const [key, value] of Object.entries(eventData)) {
        if (!['sessionId', 'cwd', 'model'].includes(key)) {
          payload[key] = value;
        }
      }
      break;
  }

  return payload;
}

/**
 * Normalize an OpenCode event into a UnifiedHookEvent.
 *
 * @param nativeEventName - The OpenCode event name (e.g. 'session.created', 'tool.execute.before').
 * @param rawEvent - Raw event content (string or object).
 * @param env - Environment variables at invocation time.
 */
export function normalizeOpenCode(
  nativeEventName: string,
  rawEvent: unknown,
  env: Record<string, string> = {},
): UnifiedHookEvent {
  const eventData = parseEventData(rawEvent);
  const mapping = getOpenCodePhaseMapping(nativeEventName);

  // shell.env is a special env-injection event; map to session.start (lossy)
  const isShellEnv = nativeEventName === SHELL_ENV_NATIVE_HOOK;
  const phase = isShellEnv ? 'session.start' : (mapping?.canonicalPhase ?? 'unknown');
  const supportLevel = isShellEnv ? 'lossy' : (mapping?.supportLevel ?? 'unsupported');

  const execution = buildExecutionContext(eventData, nativeEventName, env);
  const payload = buildPayload(nativeEventName, eventData);

  // Split env into input and persisted buckets
  const inputEnv: Record<string, string> = {};
  const persistedEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('HOOKS_PROXY_PERSIST_')) {
      persistedEnv[key] = value;
    } else if (key.startsWith('HOOKS_PROXY_')) {
      inputEnv[key] = value;
    }
  }

  return {
    version: 'a5c.hooks.v1',
    adapter: _adapterName,
    phase,
    rawEventName: nativeEventName,
    supportLevel,
    execution,
    payload,
    env: {
      input: inputEnv,
      persisted: persistedEnv,
    },
    raw: rawEvent,
  };
}
