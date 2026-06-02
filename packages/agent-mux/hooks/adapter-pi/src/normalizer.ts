import type { UnifiedHookEvent, UnifiedExecutionContext } from '@a5c-ai/agent-mux-hooks-core';
import { getPiPhaseMapping } from './mappings';

/** The default adapter name. */
export const ADAPTER_NAME = 'pi';

/** Mutable adapter name, defaulting to the pi adapter identity. */
let _adapterName: string = 'pi';

/** Override the adapter name used in normalized events. */
export function setAdapterName(name: string): void {
  _adapterName = name;
}

/**
 * Pi programmatic event payload shapes.
 *
 * Pi passes hook input as in-process objects (not stdin),
 * so no stdin parsing is needed.
 */

/** Common fields present across Pi hook events. */
export interface PiEventBase {
  sessionId?: string;
  cwd?: string;
  model?: string;
  [key: string]: unknown;
}

/** session_start-specific fields. */
export interface PiSessionStartPayload extends PiEventBase {
  /** Initial prompt or message that started the session. */
  initialPrompt?: string;
}

/** tool_call-specific fields. */
export interface PiToolCallPayload extends PiEventBase {
  toolName?: string;
  toolCallId?: string;
  /** Mutable tool input — later handlers see earlier mutations. */
  toolInput?: unknown;
}

/** context-specific fields. */
export interface PiContextPayload extends PiEventBase {
  /** Context content to inject into the turn. */
  contextContent?: string;
}

/** before_provider_request-specific fields. */
export interface PiBeforeProviderRequestPayload extends PiEventBase {
  /** The messages about to be sent to the provider. */
  messages?: unknown[];
  /** Provider configuration. */
  providerConfig?: Record<string, unknown>;
}

/**
 * Coerce raw input to a record. Pi input is always programmatic objects,
 * but we handle edge cases defensively.
 */
export function coerceInput(raw: unknown): Record<string, unknown> {
  if (raw == null) {
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return { raw };
}

/**
 * Build a UnifiedExecutionContext from a Pi event payload.
 */
export function buildExecutionContext(
  data: Record<string, unknown>,
  nativeEventName: string,
  extensionState: Record<string, string> = {},
): UnifiedExecutionContext {
  const persistedEnv: Record<string, string> = {};
  const contextVars: Record<string, string> = {};

  // Collect persisted state from extension-state
  for (const [key, value] of Object.entries(extensionState)) {
    if (key.startsWith('HOOKS_PROXY_PERSIST_')) {
      persistedEnv[key] = value;
    }
  }

  const sessionId = (data.sessionId as string | undefined)
    ?? extensionState['AGENT_SESSION_ID']
    ?? null;

  return {
    sessionId,
    turnId: extensionState['HOOKS_PROXY_TURN_ID'] ?? null,
    conversationId: extensionState['HOOKS_PROXY_CONVERSATION_ID'] ?? null,
    adapter: _adapterName,
    cwd: (data.cwd as string | undefined) ?? null,
    worktree: extensionState['HOOKS_PROXY_WORKTREE'] ?? null,
    transcriptPath: null,
    source: null,
    model: (data.model as string | undefined) ?? extensionState['HOOKS_PROXY_MODEL'] ?? null,
    agentType: null,
    permissionMode: null,
    toolName: (data.toolName as string | undefined) ?? null,
    toolCallId: (data.toolCallId as string | undefined) ?? null,
    nativeEventName,
    rawEventScope: null,
    persistedEnv,
    contextVars,
    metadata: {},
  };
}

/**
 * Build the payload portion of the unified event from Pi event data.
 * Extracts event-specific fields into the normalized payload.
 */
export function buildPayload(
  nativeEventName: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  switch (nativeEventName) {
    case 'session_start':
      if (data.initialPrompt != null) payload.initialPrompt = data.initialPrompt;
      break;

    case 'tool_call':
      if (data.toolName != null) payload.toolName = data.toolName;
      if (data.toolCallId != null) payload.toolCallId = data.toolCallId;
      if (data.toolInput != null) payload.toolInput = data.toolInput;
      break;

    case 'context':
      if (data.contextContent != null) payload.contextContent = data.contextContent;
      break;

    case 'before_provider_request':
      if (data.messages != null) payload.messages = data.messages;
      if (data.providerConfig != null) payload.providerConfig = data.providerConfig;
      break;

    default:
      // Unknown event: pass through all non-common fields
      for (const [key, value] of Object.entries(data)) {
        if (!['sessionId', 'cwd', 'model'].includes(key)) {
          payload[key] = value;
        }
      }
      break;
  }

  return payload;
}

/**
 * Normalize a Pi hook invocation into a UnifiedHookEvent.
 *
 * Unlike shell-hook adapters, Pi events arrive as in-process objects.
 * No stdin parsing is required.
 *
 * @param nativeEventName - The Pi event name (e.g. 'session_start', 'tool_call').
 * @param rawInput - The programmatic event object from Pi.
 * @param extensionState - Extension-state key-value pairs for session persistence.
 */
export function normalizePi(
  nativeEventName: string,
  rawInput: unknown,
  extensionState: Record<string, string> = {},
): UnifiedHookEvent {
  const data = coerceInput(rawInput);
  const mapping = getPiPhaseMapping(nativeEventName);

  const phase = mapping?.canonicalPhase ?? 'unknown';
  const supportLevel = mapping?.supportLevel ?? 'unsupported';

  const execution = buildExecutionContext(data, nativeEventName, extensionState);
  const payload = buildPayload(nativeEventName, data);

  // Split extension-state into input and persisted buckets
  const inputEnv: Record<string, string> = {};
  const persistedEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(extensionState)) {
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
    raw: rawInput,
  };
}
