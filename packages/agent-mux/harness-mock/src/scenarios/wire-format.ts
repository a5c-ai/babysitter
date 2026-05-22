/**
 * Deterministic wire-format helpers.
 *
 * Produce raw stdout/stderr strings matching the formats the real adapter
 * parseEvent implementations consume. Each helper returns a string ending
 * with a newline where appropriate so chunks can be concatenated cleanly.
 */

import type { OutputChunk } from '../types.js';

export interface ToolCall {
  id: string;
  name: string;
  input?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Claude Code JSONL
// ---------------------------------------------------------------------------

export function claudeSystemInit(sessionId: string, tools: string[] = []): string {
  return JSON.stringify({ type: 'system', subtype: 'init', session_id: sessionId, tools }) + '\n';
}

export function claudeAssistantText(text: string): string {
  return JSON.stringify({ type: 'assistant', content: text }) + '\n';
}

export function claudeToolUse(call: ToolCall): string {
  return JSON.stringify({ type: 'tool_use', id: call.id, name: call.name, input: call.input ?? {} }) + '\n';
}

export function claudeToolResult(toolUseId: string, output: string): string {
  return JSON.stringify({ type: 'tool_result', tool_use_id: toolUseId, content: output }) + '\n';
}

export function claudeThinking(text: string): string {
  return JSON.stringify({ type: 'thinking', content: text }) + '\n';
}

export function claudeStreamEventText(text: string): string {
  return JSON.stringify({
    type: 'stream_event',
    event: {
      type: 'content_block_delta',
      delta: {
        type: 'text_delta',
        text,
      },
    },
  }) + '\n';
}

export function claudeStreamEventThinking(text: string): string {
  return JSON.stringify({
    type: 'stream_event',
    event: {
      type: 'content_block_delta',
      delta: {
        type: 'thinking_delta',
        thinking: text,
      },
    },
  }) + '\n';
}

export function claudeStreamEventToolUse(call: ToolCall, index = 0): string {
  return JSON.stringify({
    type: 'stream_event',
    event: {
      type: 'content_block_start',
      index,
      content_block: {
        type: 'tool_use',
        id: call.id,
        name: call.name,
        input: call.input ?? {},
      },
    },
  }) + '\n';
}

export function claudeStreamEventToolInput(partialJson: string, index = 0): string {
  return JSON.stringify({
    type: 'stream_event',
    event: {
      type: 'content_block_delta',
      index,
      delta: {
        type: 'input_json_delta',
        partial_json: partialJson,
      },
    },
  }) + '\n';
}

export function claudeStreamEventToolStop(index = 0): string {
  return JSON.stringify({
    type: 'stream_event',
    event: {
      type: 'content_block_stop',
      index,
    },
  }) + '\n';
}

export function claudeUserToolResult(toolUseId: string, output: unknown): string {
  return JSON.stringify({
    type: 'user',
    parent_tool_use_id: toolUseId,
    tool_use_result: output,
    message: {
      role: 'user',
      content: 'tool result',
    },
  }) + '\n';
}

export function claudeMessageStop(): string {
  return JSON.stringify({
    type: 'stream_event',
    event: {
      type: 'message_stop',
    },
  }) + '\n';
}

export function claudeResult(sessionId: string, text?: string, cost?: Record<string, unknown>): string {
  const obj: Record<string, unknown> = { type: 'result', subtype: 'success', session_id: sessionId };
  if (text !== undefined) obj['result'] = text;
  if (cost !== undefined) obj['cost'] = cost;
  return JSON.stringify(obj) + '\n';
}

export function claudeError(message: string): string {
  return JSON.stringify({ type: 'error', message }) + '\n';
}

// ---------------------------------------------------------------------------
// Codex JSONL
// ---------------------------------------------------------------------------

export function codexMessage(text: string): string {
  return JSON.stringify({ type: 'message', content: text }) + '\n';
}

export function codexFunctionCall(call: ToolCall): string {
  return JSON.stringify({
    type: 'function_call',
    id: call.id,
    call_id: call.id,
    name: call.name,
    arguments: JSON.stringify(call.input ?? {}),
  }) + '\n';
}

export function codexFunctionCallOutput(callId: string, output: string): string {
  return JSON.stringify({ type: 'function_call_output', call_id: callId, output }) + '\n';
}

export function codexError(message: string): string {
  return JSON.stringify({ type: 'error', message }) + '\n';
}

export function codexThreadStarted(threadId: string): string {
  return JSON.stringify({ type: 'thread.started', thread_id: threadId }) + '\n';
}

export function codexTurnStarted(id = 'turn_1'): string {
  return JSON.stringify({ type: 'turn.started', turn_id: id }) + '\n';
}

export function codexItemStarted(item: Record<string, unknown>): string {
  return JSON.stringify({ type: 'item.started', item }) + '\n';
}

export function codexItemCompleted(item: Record<string, unknown>): string {
  return JSON.stringify({ type: 'item.completed', item }) + '\n';
}

export function codexTurnCompleted(text?: string, usage?: Record<string, unknown>): string {
  const payload: Record<string, unknown> = { type: 'turn.completed' };
  if (text !== undefined) payload['text'] = text;
  if (usage !== undefined) payload['usage'] = usage;
  return JSON.stringify(payload) + '\n';
}

export function codexTurnFailed(message: string): string {
  return JSON.stringify({ type: 'turn.failed', message }) + '\n';
}

// ---------------------------------------------------------------------------
// Gemini / generic JSONL
// ---------------------------------------------------------------------------

export function geminiText(text: string): string {
  return JSON.stringify({ type: 'text', content: text }) + '\n';
}

export function geminiToolCall(call: ToolCall): string {
  return JSON.stringify({ type: 'tool_call', id: call.id, name: call.name, args: call.input ?? {} }) + '\n';
}

export function geminiToolResult(id: string, output: string): string {
  return JSON.stringify({ type: 'tool_result', id, output }) + '\n';
}

export function geminiError(message: string): string {
  return JSON.stringify({ type: 'error', message }) + '\n';
}

// ---------------------------------------------------------------------------
// Generic "type+content" (used by copilot/cursor/opencode/pi/omp/openclaw/hermes)
// ---------------------------------------------------------------------------

export function genericText(text: string): string {
  return JSON.stringify({ type: 'text', content: text }) + '\n';
}

export function genericToolCall(call: ToolCall): string {
  return JSON.stringify({ type: 'tool_call', id: call.id, name: call.name, input: call.input ?? {} }) + '\n';
}

export function genericError(message: string): string {
  return JSON.stringify({ type: 'error', message }) + '\n';
}

export function genericSessionStart(sessionId: string, resumed = false): string {
  return JSON.stringify({ type: 'session_start', session_id: sessionId, resumed }) + '\n';
}

export function genericSessionEnd(finalMessage?: string, usage?: Record<string, unknown>): string {
  const payload: Record<string, unknown> = { type: 'session_end' };
  if (finalMessage !== undefined) payload['final_message'] = finalMessage;
  if (usage !== undefined) payload['usage'] = usage;
  return JSON.stringify(payload) + '\n';
}

export function agentTextDelta(text: string, accumulated?: string): string {
  return JSON.stringify({
    type: 'text_delta',
    content: text,
    accumulated: accumulated ?? text,
  }) + '\n';
}

export function agentToolCallStart(id: string, name: string, input?: Record<string, unknown>): string {
  return JSON.stringify({
    type: 'tool_call_start',
    id,
    tool: name,
    name,
    input,
    arguments: input,
    args: input,
  }) + '\n';
}

export function agentToolCallReady(id: string, name: string, input?: Record<string, unknown>): string {
  const serialized = JSON.stringify(input ?? {});
  return JSON.stringify({
    type: 'tool_call_ready',
    id,
    tool: name,
    name,
    input: serialized,
  }) + '\n';
}

export function agentToolResult(id: string, name: string, output: string, durationMs = 0): string {
  return JSON.stringify({
    type: 'tool_result',
    id,
    tool: name,
    name,
    result: output,
    output,
    duration: durationMs,
    durationMs,
  }) + '\n';
}

export function agentCost(totalUsd: number, inputTokens: number, outputTokens: number): string {
  return JSON.stringify({
    type: 'cost',
    totalUsd,
    inputTokens,
    outputTokens,
  }) + '\n';
}

export function agentMessageStop(text: string): string {
  return JSON.stringify({ type: 'message_stop', text }) + '\n';
}

// ---------------------------------------------------------------------------
// OutputChunk helpers
// ---------------------------------------------------------------------------

/** Build a stdout chunk with optional delay. */
export function stdoutChunk(data: string, delayMs = 10): OutputChunk {
  return { stream: 'stdout', data, delayMs };
}

/** Build a stderr chunk with optional delay. */
export function stderrChunk(data: string, delayMs = 10): OutputChunk {
  return { stream: 'stderr', data, delayMs };
}
