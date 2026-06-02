import type { UnifiedHookEvent, UnifiedExecutionContext } from '@a5c-ai/agent-mux-hooks-core';
import { getClaudePhaseMapping } from './mappings';

let _adapterName: string;

export function setAdapterName(name: string): void {
  _adapterName = name;
}

/**
 * Claude Code stdin JSON payload shapes.
 *
 * Claude passes hook input as JSON on stdin with fields varying by event type.
 */

/** Common fields present across most Claude hook events. */
export interface ClaudeStdinBase {
  session_id?: string;
  session_type?: string;
  cwd?: string;
  transcript_path?: string;
  model?: string;
  permission_mode?: string;
  /** Present on Stop events to indicate recursion guard. */
  stop_hook_active?: boolean;
  [key: string]: unknown;
}

/** SessionStart-specific fields. */
export interface ClaudeSessionStartPayload extends ClaudeStdinBase {
  /** Source of session start: startup, resume, clear, compact. */
  source?: string;
  initial_prompt?: string;
}

/** PreToolUse-specific fields. */
export interface ClaudePreToolUsePayload extends ClaudeStdinBase {
  tool_name?: string;
  tool_call_id?: string;
  tool_input?: unknown;
}

/** PostToolUse-specific fields. */
export interface ClaudePostToolUsePayload extends ClaudeStdinBase {
  tool_name?: string;
  tool_call_id?: string;
  tool_input?: unknown;
  tool_response?: unknown;
}

/** PostToolUseFailure-specific fields. */
export interface ClaudePostToolUseFailurePayload extends ClaudeStdinBase {
  tool_name?: string;
  tool_call_id?: string;
  tool_input?: unknown;
  error?: unknown;
  exit_code?: number;
}

/** PostToolBatch-specific fields. */
export interface ClaudePostToolBatchPayload extends ClaudeStdinBase {
  batch_results?: unknown[];
}

/** Stop-specific fields. */
export interface ClaudeStopPayload extends ClaudeStdinBase {
  reason?: string;
  last_assistant_message?: string;
  stop_hook_active?: boolean;
}

/** StopFailure-specific fields. */
export interface ClaudeStopFailurePayload extends ClaudeStdinBase {
  error_type?: string;
  error_message?: string;
  retry_after?: number;
}

/** UserPromptSubmit-specific fields. */
export interface ClaudeUserPromptSubmitPayload extends ClaudeStdinBase {
  prompt?: string;
}

/** UserPromptExpansion-specific fields. */
export interface ClaudeUserPromptExpansionPayload extends ClaudeStdinBase {
  expansion_type?: string;
  command_name?: string;
  command_args?: unknown;
  command_source?: string;
  prompt?: string;
}

/** SubagentStop-specific fields. */
export interface ClaudeSubagentStopPayload extends ClaudeStdinBase {
  agent_type?: string;
  reason?: string;
  last_assistant_message?: string;
}

/** TaskCreated-specific fields. */
export interface ClaudeTaskCreatedPayload extends ClaudeStdinBase {
  task_id?: string;
  task_kind?: string;
  task_title?: string;
  task_labels?: string[];
}

/** TaskCompleted-specific fields. */
export interface ClaudeTaskCompletedPayload extends ClaudeStdinBase {
  task_id?: string;
  task_kind?: string;
  task_status?: string;
  task_result?: unknown;
}

/** TeammateIdle-specific fields. */
export interface ClaudeTeammateIdlePayload extends ClaudeStdinBase {
  agent_id?: string;
  agent_type?: string;
  idle_reason?: string;
}

/** Setup-specific fields. */
export interface ClaudeSetupPayload extends ClaudeStdinBase {
  trigger?: string;
}

/** InstructionsLoaded-specific fields. */
export interface ClaudeInstructionsLoadedPayload extends ClaudeStdinBase {
  file_path?: string;
  memory_type?: string;
  load_reason?: string;
  globs?: string[];
  trigger_file_path?: string;
  parent_file_path?: string;
}

/** ConfigChange-specific fields. */
export interface ClaudeConfigChangePayload extends ClaudeStdinBase {
  config_path?: string;
  change_type?: string;
  setting_key?: string;
}

/** MessageDisplay-specific fields. */
export interface ClaudeMessageDisplayPayload extends ClaudeStdinBase {
  turn_id?: string;
  message_id?: string;
  index?: number;
  final?: boolean;
  delta?: string;
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
 * Build a UnifiedExecutionContext from a Claude stdin payload and environment.
 */
export function buildExecutionContext(
  stdinData: Record<string, unknown>,
  nativeEventName: string,
  env: Record<string, string>,
  adapterName?: string,
): UnifiedExecutionContext {
  const effectiveName = adapterName ?? _adapterName;
  const persistedEnv: Record<string, string> = {};
  const contextVars: Record<string, string> = {};

  // Collect persisted env from environment
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('HOOKS_PROXY_PERSIST_')) {
      persistedEnv[key] = value;
    }
  }

  // Claude provides session_id natively
  const sessionId = (stdinData.session_id as string | undefined)
    ?? env['AGENT_SESSION_ID']
    ?? null;

  return {
    sessionId,
    turnId: env['HOOKS_PROXY_TURN_ID'] ?? null,
    conversationId: env['HOOKS_PROXY_CONVERSATION_ID'] ?? null,
    adapter: effectiveName,
    cwd: (stdinData.cwd as string | undefined) ?? env['PWD'] ?? null,
    worktree: env['HOOKS_PROXY_WORKTREE'] ?? null,
    transcriptPath: (stdinData.transcript_path as string | undefined) ?? null,
    source: (stdinData.source as string | undefined) ?? null,
    model: (stdinData.model as string | undefined) ?? env['HOOKS_PROXY_MODEL'] ?? null,
    agentType: (stdinData.agent_type as string | undefined) ?? null,
    permissionMode: (stdinData.permission_mode as string | undefined) ?? null,
    toolName: (stdinData.tool_name as string | undefined) ?? null,
    toolCallId: (stdinData.tool_call_id as string | undefined) ?? null,
    nativeEventName,
    rawEventScope: (stdinData.session_type as string | undefined) ?? null,
    persistedEnv,
    contextVars,
    metadata: {
      ...(stdinData.stop_hook_active != null ? { stop_hook_active: stdinData.stop_hook_active } : {}),
    },
  };
}

/**
 * Build the payload portion of the unified event from Claude stdin data.
 * Extracts event-specific fields into the normalized payload.
 */
export function buildPayload(
  nativeEventName: string,
  stdinData: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  switch (nativeEventName) {
    case 'SessionStart':
      if (stdinData.source != null) payload.source = stdinData.source;
      if (stdinData.initial_prompt != null) payload.initialPrompt = stdinData.initial_prompt;
      break;

    case 'PreToolUse':
      if (stdinData.tool_name != null) payload.toolName = stdinData.tool_name;
      if (stdinData.tool_call_id != null) payload.toolCallId = stdinData.tool_call_id;
      if (stdinData.tool_input != null) payload.toolInput = stdinData.tool_input;
      break;

    case 'PostToolUse':
      if (stdinData.tool_name != null) payload.toolName = stdinData.tool_name;
      if (stdinData.tool_call_id != null) payload.toolCallId = stdinData.tool_call_id;
      if (stdinData.tool_input != null) payload.toolInput = stdinData.tool_input;
      if (stdinData.tool_response != null) payload.toolResponse = stdinData.tool_response;
      break;

    case 'PostToolUseFailure':
      if (stdinData.tool_name != null) payload.toolName = stdinData.tool_name;
      if (stdinData.tool_call_id != null) payload.toolCallId = stdinData.tool_call_id;
      if (stdinData.tool_input != null) payload.toolInput = stdinData.tool_input;
      if (stdinData.error != null) payload.error = stdinData.error;
      if (stdinData.exit_code != null) payload.exitCode = stdinData.exit_code;
      break;

    case 'PostToolBatch':
      if (stdinData.batch_results != null) payload.batchResults = stdinData.batch_results;
      break;

    case 'Stop':
      if (stdinData.reason != null) payload.reason = stdinData.reason;
      if (stdinData.last_assistant_message != null) payload.lastAssistantMessage = stdinData.last_assistant_message;
      if (stdinData.stop_hook_active != null) payload.stopHookActive = stdinData.stop_hook_active;
      break;

    case 'StopFailure':
      if (stdinData.error_type != null) payload.errorType = stdinData.error_type;
      if (stdinData.error_message != null) payload.errorMessage = stdinData.error_message;
      if (stdinData.retry_after != null) payload.retryAfter = stdinData.retry_after;
      break;

    case 'UserPromptSubmit':
      if (stdinData.prompt != null) payload.prompt = stdinData.prompt;
      break;

    case 'UserPromptExpansion':
      if (stdinData.expansion_type != null) payload.expansionType = stdinData.expansion_type;
      if (stdinData.command_name != null) payload.commandName = stdinData.command_name;
      if (stdinData.command_args != null) payload.commandArgs = stdinData.command_args;
      if (stdinData.command_source != null) payload.commandSource = stdinData.command_source;
      if (stdinData.prompt != null) payload.prompt = stdinData.prompt;
      break;

    case 'SubagentStop':
      if (stdinData.agent_type != null) payload.agentType = stdinData.agent_type;
      if (stdinData.reason != null) payload.reason = stdinData.reason;
      if (stdinData.last_assistant_message != null) payload.lastAssistantMessage = stdinData.last_assistant_message;
      break;

    case 'TaskCreated':
      if (stdinData.task_id != null) payload.taskId = stdinData.task_id;
      if (stdinData.task_kind != null) payload.taskKind = stdinData.task_kind;
      if (stdinData.task_title != null) payload.taskTitle = stdinData.task_title;
      if (stdinData.task_labels != null) payload.taskLabels = stdinData.task_labels;
      break;

    case 'TaskCompleted':
      if (stdinData.task_id != null) payload.taskId = stdinData.task_id;
      if (stdinData.task_kind != null) payload.taskKind = stdinData.task_kind;
      if (stdinData.task_status != null) payload.taskStatus = stdinData.task_status;
      if (stdinData.task_result != null) payload.taskResult = stdinData.task_result;
      break;

    case 'TeammateIdle':
      if (stdinData.agent_id != null) payload.agentId = stdinData.agent_id;
      if (stdinData.agent_type != null) payload.agentType = stdinData.agent_type;
      if (stdinData.idle_reason != null) payload.idleReason = stdinData.idle_reason;
      break;

    case 'Setup':
      if (stdinData.trigger != null) payload.trigger = stdinData.trigger;
      break;

    case 'InstructionsLoaded':
      if (stdinData.file_path != null) payload.filePath = stdinData.file_path;
      if (stdinData.memory_type != null) payload.memoryType = stdinData.memory_type;
      if (stdinData.load_reason != null) payload.loadReason = stdinData.load_reason;
      if (stdinData.globs != null) payload.globs = stdinData.globs;
      if (stdinData.trigger_file_path != null) payload.triggerFilePath = stdinData.trigger_file_path;
      if (stdinData.parent_file_path != null) payload.parentFilePath = stdinData.parent_file_path;
      break;

    case 'ConfigChange':
      if (stdinData.config_path != null) payload.configPath = stdinData.config_path;
      if (stdinData.change_type != null) payload.changeType = stdinData.change_type;
      if (stdinData.setting_key != null) payload.settingKey = stdinData.setting_key;
      break;

    case 'PreCompact':
      // No event-specific fields beyond common ones
      break;

    case 'SessionEnd':
      // No event-specific fields beyond common ones
      break;

    case 'Notification':
      if (stdinData.message != null) payload.message = stdinData.message;
      if (stdinData.title != null) payload.title = stdinData.title;
      break;

    case 'MessageDisplay':
      if (stdinData.turn_id != null) payload.turnId = stdinData.turn_id;
      if (stdinData.message_id != null) payload.messageId = stdinData.message_id;
      if (stdinData.index != null) payload.index = stdinData.index;
      if (stdinData.final != null) payload.final = stdinData.final;
      if (stdinData.delta != null) payload.delta = stdinData.delta;
      break;

    default:
      // Unknown event: pass through all non-common fields
      for (const [key, value] of Object.entries(stdinData)) {
        if (!['session_id', 'session_type', 'cwd', 'transcript_path', 'model', 'permission_mode'].includes(key)) {
          payload[key] = value;
        }
      }
      break;
  }

  return payload;
}

/**
 * Check whether a normalized event represents a stop-hook recursion scenario.
 *
 * Claude Code sets `stop_hook_active: true` on Stop events that fire *inside*
 * a stop hook's continued session.  Responding with `continueSession: true`
 * in this situation would trigger infinite recursion, so callers must detect
 * this and emit a safe no-op instead.
 *
 * @param event - A normalized UnifiedHookEvent (or any object with an
 *   `execution.metadata` bag).
 * @returns `true` when the event indicates stop-hook recursion.
 */
export function isStopHookRecursion(
  event: Pick<UnifiedHookEvent, 'execution'>,
): boolean {
  return event.execution.metadata?.stop_hook_active === true;
}

/**
 * Normalize a Claude Code hook invocation into a UnifiedHookEvent.
 *
 * @param nativeEventName - The Claude event name (e.g. 'SessionStart', 'PreToolUse').
 * @param rawStdin - Raw stdin content (string or parsed object).
 * @param env - Environment variables at invocation time.
 */
export function normalizeClaude(
  nativeEventName: string,
  rawStdin: unknown,
  env: Record<string, string> = {},
  adapterName?: string,
): UnifiedHookEvent {
  const effectiveName = adapterName ?? _adapterName;
  const stdinData = parseStdin(rawStdin);
  const mapping = getClaudePhaseMapping(nativeEventName);

  const phase = mapping?.canonicalPhase ?? 'unknown';
  const supportLevel = mapping?.supportLevel ?? 'unsupported';

  const execution = buildExecutionContext(stdinData, nativeEventName, env, effectiveName);
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
    adapter: effectiveName,
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
