import type { UnifiedHookEvent, UnifiedExecutionContext } from '@a5c-ai/hooks-mux-core';
import { GEMINI_PHASE_MAPPINGS, getGeminiPhaseMapping } from './mappings';
import { resolveSessionId } from './session-resolver';

/** The default adapter name. */
export const ADAPTER_NAME = 'gemini';

/** Mutable adapter name, defaulting to the Gemini adapter identity. */
let _adapterName: string = 'gemini';

/** Override the adapter name used in normalized events. */
export function setAdapterName(name: string): void {
  _adapterName = name;
}

/**
 * Gemini CLI stdin JSON payload shapes.
 *
 * Gemini CLI passes hook input as JSON on stdin with fields varying by event type.
 */

/** Common fields present across most Gemini hook events. */
export interface GeminiStdinBase {
  /** Workspace or project directory. */
  cwd?: string;
  /** Model identifier. */
  model?: string;
  /** Extension path for the calling extension. */
  extensionPath?: string;
  [key: string]: unknown;
}

/** SessionStart-specific fields. */
export interface GeminiSessionStartPayload extends GeminiStdinBase {
  /** Initial user prompt if available. */
  prompt?: string;
}

/** BeforeToolSelection-specific fields. */
export interface GeminiBeforeToolSelectionPayload extends GeminiStdinBase {
  /** List of available tool names. */
  availableTools?: string[];
  /** The user prompt or current context driving tool selection. */
  prompt?: string;
}

/** BeforeModel-specific fields. */
export interface GeminiBeforeModelPayload extends GeminiStdinBase {
  /** The request about to be sent to the model. */
  request?: unknown;
  /** Messages in the conversation so far. */
  messages?: unknown[];
}

/** AfterModel-specific fields. */
export interface GeminiAfterModelPayload extends GeminiStdinBase {
  /** The model's response. */
  response?: unknown;
  /** Token usage information. */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/** BeforeAgent-specific fields. */
export interface GeminiBeforeAgentPayload extends GeminiStdinBase {
  /** The prompt that will drive the agent turn. */
  prompt?: string;
}

/** AfterAgent-specific fields. */
export interface GeminiAfterAgentPayload extends GeminiStdinBase {
  /** The agent's last output message. */
  lastMessage?: string;
  /** Reason the agent turn ended. */
  reason?: string;
}

/** BeforeTool-specific fields. */
export interface GeminiBeforeToolPayload extends GeminiStdinBase {
  /** Name of the tool being executed. */
  toolName?: string;
  /** Input arguments for the tool. */
  toolInput?: unknown;
  /** Tool call identifier. */
  toolCallId?: string;
}

/** AfterTool-specific fields. */
export interface GeminiAfterToolPayload extends GeminiStdinBase {
  /** Name of the tool that was executed. */
  toolName?: string;
  /** Input arguments for the tool. */
  toolInput?: unknown;
  /** Tool execution result. */
  toolResult?: unknown;
  /** Tool call identifier. */
  toolCallId?: string;
}

/**
 * Parse raw stdin input (string or object) into a structured object.
 */
export function parseStdin(raw: unknown): Record<string, unknown> {
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
 * Build a UnifiedExecutionContext from a Gemini stdin payload and environment.
 */
export function buildExecutionContext(
  stdinData: Record<string, unknown>,
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

  const sessionId = resolveSessionId(stdinData, env);

  return {
    sessionId,
    turnId: env['HOOKS_PROXY_TURN_ID'] ?? null,
    conversationId: env['HOOKS_PROXY_CONVERSATION_ID'] ?? null,
    adapter: _adapterName,
    cwd: (stdinData.cwd as string | undefined) ?? env['PWD'] ?? null,
    worktree: env['HOOKS_PROXY_WORKTREE'] ?? null,
    transcriptPath: null,
    source: null,
    model: (stdinData.model as string | undefined) ?? env['HOOKS_PROXY_MODEL'] ?? null,
    agentType: null,
    permissionMode: null,
    toolName: (stdinData.toolName as string | undefined) ?? null,
    toolCallId: (stdinData.toolCallId as string | undefined) ?? null,
    nativeEventName,
    rawEventScope: null,
    persistedEnv,
    contextVars,
    metadata: {
      ...(stdinData.extensionPath != null ? { extensionPath: stdinData.extensionPath } : {}),
    },
  };
}

/**
 * Build the payload portion of the unified event from Gemini stdin data.
 * Extracts event-specific fields into the normalized payload.
 */
export function buildPayload(
  nativeEventName: string,
  stdinData: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  switch (nativeEventName) {
    case 'SessionStart':
      if (stdinData.prompt != null) payload.initialPrompt = stdinData.prompt;
      break;

    case 'SessionEnd':
      // No event-specific fields beyond common ones
      break;

    case 'BeforeToolSelection':
      if (stdinData.availableTools != null) payload.availableTools = stdinData.availableTools;
      if (stdinData.prompt != null) payload.prompt = stdinData.prompt;
      break;

    case 'BeforeModel':
      if (stdinData.request != null) payload.llmRequest = stdinData.request;
      if (stdinData.messages != null) payload.messages = stdinData.messages;
      break;

    case 'AfterModel':
      if (stdinData.response != null) payload.llmResponse = stdinData.response;
      if (stdinData.usage != null) payload.usage = stdinData.usage;
      break;

    case 'BeforeAgent':
      if (stdinData.prompt != null) payload.prompt = stdinData.prompt;
      break;

    case 'AfterAgent':
      if (stdinData.lastMessage != null) payload.lastAssistantMessage = stdinData.lastMessage;
      if (stdinData.reason != null) payload.reason = stdinData.reason;
      break;

    case 'BeforeTool':
      if (stdinData.toolName != null) payload.toolName = stdinData.toolName;
      if (stdinData.toolInput != null) payload.toolInput = stdinData.toolInput;
      if (stdinData.toolCallId != null) payload.toolCallId = stdinData.toolCallId;
      break;

    case 'AfterTool':
      if (stdinData.toolName != null) payload.toolName = stdinData.toolName;
      if (stdinData.toolInput != null) payload.toolInput = stdinData.toolInput;
      if (stdinData.toolResult != null) payload.toolResponse = stdinData.toolResult;
      if (stdinData.toolCallId != null) payload.toolCallId = stdinData.toolCallId;
      break;

    default:
      // Unknown event: pass through all non-common fields
      for (const [key, value] of Object.entries(stdinData)) {
        if (!['cwd', 'model', 'extensionPath'].includes(key)) {
          payload[key] = value;
        }
      }
      break;
  }

  return payload;
}

/**
 * Normalize a Gemini CLI hook invocation into a UnifiedHookEvent.
 *
 * @param nativeEventName - The Gemini event name (e.g. 'BeforeToolSelection', 'AfterAgent').
 * @param rawStdin - Raw stdin content (string or parsed object).
 * @param env - Environment variables at invocation time.
 */
export function normalizeGemini(
  nativeEventName: string,
  rawStdin: unknown,
  env: Record<string, string> = {},
): UnifiedHookEvent {
  const stdinData = parseStdin(rawStdin);
  const mapping = getGeminiPhaseMapping(nativeEventName);

  const phase = mapping?.canonicalPhase ?? 'unknown';
  const supportLevel = mapping?.supportLevel ?? 'unsupported';

  const execution = buildExecutionContext(stdinData, nativeEventName, env);
  const payload = buildPayload(nativeEventName, stdinData);

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
    raw: rawStdin,
  };
}
