import type { UnifiedHookEvent, UnifiedExecutionContext } from '@a5c-ai/hooks-mux-core';
import { getOpenClawPhaseMapping, classifyHookOrigin } from './mappings';
import type { OpenClawHookOrigin } from './mappings';

/** The default adapter name. */
export const ADAPTER_NAME = 'openclaw';

/** Mutable adapter name, defaulting to the openclaw adapter identity. */
let _adapterName: string = 'openclaw';

/** Override the adapter name used in normalized events. */
export function setAdapterName(name: string): void {
  _adapterName = name;
}

/**
 * OpenClaw in-process hook payload shapes.
 *
 * OpenClaw passes hook data as in-process objects (not stdin JSON),
 * with fields varying by origin (gateway vs plugin) and event type.
 */

/** Common fields present across OpenClaw hook events. */
export interface OpenClawEventBase {
  /** Correlation ID from the gateway or plugin session. */
  correlationId?: string;
  /** Plugin-level session identifier. */
  sessionId?: string;
  /** Working directory or workspace path. */
  workspace?: string;
  /** Model identifier, if available. */
  model?: string;
  /** Timestamp of the event. */
  timestamp?: string;
  [key: string]: unknown;
}

/** Plugin session start payload. */
export interface OpenClawPluginSessionStartPayload extends OpenClawEventBase {
  source?: string;
  initialPrompt?: string;
  pluginId?: string;
}

/** Plugin tool before/after payload. */
export interface OpenClawPluginToolPayload extends OpenClawEventBase {
  toolName?: string;
  toolCallId?: string;
  toolInput?: unknown;
  toolResponse?: unknown;
  pluginId?: string;
}

/** Plugin turn stop payload. */
export interface OpenClawPluginTurnStopPayload extends OpenClawEventBase {
  reason?: string;
  lastMessage?: string;
  pluginId?: string;
}

/** Gateway request payload. */
export interface OpenClawGatewayPayload extends OpenClawEventBase {
  requestId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  authResult?: string;
}

/**
 * Parse raw event input into a structured object.
 * OpenClaw is in-process so payloads are typically already objects,
 * but we handle string input for robustness.
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
 * Build a UnifiedExecutionContext from an OpenClaw event payload.
 */
export function buildExecutionContext(
  eventData: Record<string, unknown>,
  nativeEventName: string,
  origin: OpenClawHookOrigin,
  env: Record<string, string>,
): UnifiedExecutionContext {
  const persistedEnv: Record<string, string> = {};
  const contextVars: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('HOOKS_PROXY_PERSIST_')) {
      persistedEnv[key] = value;
    }
  }

  // Session ID: prefer plugin sessionId, fall back to gateway correlationId
  const sessionId =
    (eventData.sessionId as string | undefined) ??
    env['AGENT_SESSION_ID'] ??
    (eventData.correlationId as string | undefined) ??
    null;

  return {
    sessionId,
    turnId: env['HOOKS_PROXY_TURN_ID'] ?? null,
    conversationId: env['HOOKS_PROXY_CONVERSATION_ID'] ?? null,
    adapter: _adapterName,
    cwd: (eventData.workspace as string | undefined) ?? env['PWD'] ?? null,
    worktree: env['HOOKS_PROXY_WORKTREE'] ?? null,
    transcriptPath: null,
    source: (eventData.source as string | undefined) ?? null,
    model: (eventData.model as string | undefined) ?? env['HOOKS_PROXY_MODEL'] ?? null,
    agentType: null,
    permissionMode: null,
    toolName: (eventData.toolName as string | undefined) ?? null,
    toolCallId: (eventData.toolCallId as string | undefined) ?? null,
    nativeEventName,
    rawEventScope: origin,
    persistedEnv,
    contextVars,
    metadata: {
      origin,
      ...(eventData.pluginId != null ? { pluginId: eventData.pluginId } : {}),
      ...(eventData.correlationId != null ? { correlationId: eventData.correlationId } : {}),
      ...(eventData.requestId != null ? { requestId: eventData.requestId } : {}),
    },
  };
}

/**
 * Build the payload portion of the unified event from OpenClaw event data.
 * Extracts event-specific fields into the normalized payload.
 */
export function buildPayload(
  nativeEventName: string,
  eventData: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  switch (nativeEventName) {
    // --- Plugin hooks ---
    case 'plugin.session.start':
      if (eventData.source != null) payload.source = eventData.source;
      if (eventData.initialPrompt != null) payload.initialPrompt = eventData.initialPrompt;
      if (eventData.pluginId != null) payload.pluginId = eventData.pluginId;
      break;

    case 'plugin.session.end':
      if (eventData.pluginId != null) payload.pluginId = eventData.pluginId;
      break;

    case 'plugin.tool.before':
      if (eventData.toolName != null) payload.toolName = eventData.toolName;
      if (eventData.toolCallId != null) payload.toolCallId = eventData.toolCallId;
      if (eventData.toolInput != null) payload.toolInput = eventData.toolInput;
      if (eventData.pluginId != null) payload.pluginId = eventData.pluginId;
      break;

    case 'plugin.tool.after':
      if (eventData.toolName != null) payload.toolName = eventData.toolName;
      if (eventData.toolCallId != null) payload.toolCallId = eventData.toolCallId;
      if (eventData.toolInput != null) payload.toolInput = eventData.toolInput;
      if (eventData.toolResponse != null) payload.toolResponse = eventData.toolResponse;
      if (eventData.pluginId != null) payload.pluginId = eventData.pluginId;
      break;

    case 'plugin.turn.stop':
      if (eventData.reason != null) payload.reason = eventData.reason;
      if (eventData.lastMessage != null) payload.lastMessage = eventData.lastMessage;
      if (eventData.pluginId != null) payload.pluginId = eventData.pluginId;
      break;

    case 'plugin.prompt.submitted':
      if (eventData.prompt != null) payload.prompt = eventData.prompt;
      if (eventData.pluginId != null) payload.pluginId = eventData.pluginId;
      break;

    // --- Gateway hooks ---
    case 'gateway.request.received':
      if (eventData.requestId != null) payload.requestId = eventData.requestId;
      if (eventData.route != null) payload.route = eventData.route;
      if (eventData.method != null) payload.method = eventData.method;
      break;

    case 'gateway.request.routed':
      if (eventData.requestId != null) payload.requestId = eventData.requestId;
      if (eventData.route != null) payload.route = eventData.route;
      break;

    case 'gateway.request.completed':
      if (eventData.requestId != null) payload.requestId = eventData.requestId;
      if (eventData.statusCode != null) payload.statusCode = eventData.statusCode;
      break;

    case 'gateway.auth.check':
      if (eventData.requestId != null) payload.requestId = eventData.requestId;
      if (eventData.authResult != null) payload.authResult = eventData.authResult;
      break;

    default:
      // Unknown event: pass through all non-common fields
      for (const [key, value] of Object.entries(eventData)) {
        if (!['correlationId', 'sessionId', 'workspace', 'model', 'timestamp'].includes(key)) {
          payload[key] = value;
        }
      }
      break;
  }

  return payload;
}

/**
 * Normalize an OpenClaw hook invocation into a UnifiedHookEvent.
 *
 * Tags each event with its origin (gateway vs plugin) in execution metadata
 * so downstream consumers can distinguish infrastructure-level hooks from
 * agent-lifecycle hooks.
 *
 * @param nativeEventName - The OpenClaw event name (e.g. 'plugin.tool.before', 'gateway.request.received').
 * @param rawData - Raw event data (object or string).
 * @param env - Environment variables at invocation time.
 */
export function normalizeOpenClaw(
  nativeEventName: string,
  rawData: unknown,
  env: Record<string, string> = {},
): UnifiedHookEvent {
  const eventData = parseEventData(rawData);
  const origin = classifyHookOrigin(nativeEventName);
  const mapping = getOpenClawPhaseMapping(nativeEventName);

  const phase = mapping?.canonicalPhase ?? 'unknown';
  const supportLevel = mapping?.supportLevel ?? 'unsupported';

  const execution = buildExecutionContext(eventData, nativeEventName, origin, env);
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
    raw: rawData,
  };
}
