import type {
  AgentdocReadEvent,
  ErrorEvent,
  FileCreateEvent,
  FileDeleteEvent,
  FilePatchEvent,
  FileReadEvent,
  FileWriteEvent,
  McpToolCallStartEvent,
  McpToolErrorEvent,
  McpToolResultEvent,
  MessageStopEvent,
  PluginErrorEvent,
  PluginInvokedEvent,
  PluginLoadedEvent,
  SessionEndEvent,
  SessionForkEvent,
  SessionStartEvent,
  SessionResumeEvent,
  ShellExitEvent,
  ShellStartEvent,
  SkillInvokedEvent,
  SkillLoadedEvent,
  StepEndEvent,
  StepStartEvent,
  SubagentErrorEvent,
  SubagentResultEvent,
  SubagentSpawnEvent,
  TextDeltaEvent,
  ThinkingDeltaEvent,
  ThinkingStopEvent,
  ToolCallReadyEvent,
  ToolCallStartEvent,
  ToolErrorEvent,
  ToolInputDeltaEvent,
  ToolResultEvent,
  TurnEndEvent,
  TurnStartEvent,
  ImageOutputEvent,
} from '@a5c-ai/agent-mux-core';

import type { SessionCost, SessionFlowEventBuffer, SessionFlowRun, SessionFlowRunInput } from './types.js';
import { toTimestamp } from './utils.js';

type EventTimestamp = { timestamp?: number | string };

export type UserMessageEvent = EventTimestamp & {
  type: 'user_message';
  text: string;
  sessionId?: string;
};

export type SessionFlowEvent =
  | UserMessageEvent
  | (Pick<ThinkingDeltaEvent, 'type' | 'delta'> & EventTimestamp)
  | (Pick<ThinkingStopEvent, 'type' | 'thinking'> & EventTimestamp)
  | (Pick<TextDeltaEvent, 'type' | 'delta'> & EventTimestamp)
  | (Pick<MessageStopEvent, 'type' | 'text'> & EventTimestamp)
  | (Pick<ToolCallStartEvent, 'type' | 'toolCallId' | 'toolName' | 'inputAccumulated'> & EventTimestamp)
  | (Pick<ToolCallReadyEvent, 'type' | 'toolCallId' | 'toolName' | 'input'> & EventTimestamp)
  | (Pick<ToolInputDeltaEvent, 'type' | 'toolCallId' | 'inputAccumulated'> & EventTimestamp)
  | (Pick<ToolResultEvent, 'type' | 'toolCallId' | 'toolName' | 'output'> & EventTimestamp)
  | (Pick<ToolErrorEvent, 'type' | 'toolCallId' | 'toolName' | 'error'> & EventTimestamp)
  | (Pick<McpToolCallStartEvent, 'type' | 'toolCallId' | 'server' | 'toolName' | 'input'> & EventTimestamp)
  | (Pick<McpToolResultEvent, 'type' | 'toolCallId' | 'server' | 'toolName' | 'output'> & EventTimestamp)
  | (Pick<McpToolErrorEvent, 'type' | 'toolCallId' | 'server' | 'toolName' | 'error'> & EventTimestamp)
  | (Pick<SubagentSpawnEvent, 'type' | 'agentName' | 'prompt'> & EventTimestamp)
  | (Pick<SubagentResultEvent, 'type' | 'agentName' | 'summary'> & EventTimestamp)
  | (Pick<SubagentErrorEvent, 'type' | 'agentName' | 'error'> & EventTimestamp)
  | (Pick<SessionStartEvent, 'type'> & EventTimestamp)
  | (Pick<SessionResumeEvent, 'type'> & EventTimestamp)
  | (Pick<SessionEndEvent, 'type'> & EventTimestamp)
  | (Pick<SessionForkEvent, 'type'> & EventTimestamp)
  | (Pick<TurnStartEvent, 'type' | 'turnIndex'> & EventTimestamp)
  | (Pick<TurnEndEvent, 'type' | 'turnIndex'> & EventTimestamp)
  | (Pick<StepStartEvent, 'type' | 'stepType' | 'stepIndex'> & EventTimestamp)
  | (Pick<StepEndEvent, 'type' | 'stepIndex'> & EventTimestamp)
  | (Pick<FileReadEvent, 'type' | 'path'> & EventTimestamp)
  | (Pick<FileWriteEvent, 'type' | 'path'> & EventTimestamp)
  | (Pick<FileCreateEvent, 'type' | 'path'> & EventTimestamp)
  | (Pick<FileDeleteEvent, 'type' | 'path'> & EventTimestamp)
  | (Pick<FilePatchEvent, 'type' | 'path' | 'diff'> & EventTimestamp)
  | (Pick<ShellStartEvent, 'type' | 'command'> & EventTimestamp)
  | (Pick<ShellExitEvent, 'type' | 'exitCode'> & EventTimestamp)
  | (Pick<PluginLoadedEvent, 'type' | 'pluginId' | 'pluginName'> & EventTimestamp)
  | (Pick<PluginInvokedEvent, 'type' | 'pluginId' | 'pluginName'> & EventTimestamp)
  | (Pick<PluginErrorEvent, 'type' | 'pluginId' | 'pluginName' | 'error'> & EventTimestamp)
  | (Pick<SkillLoadedEvent, 'type' | 'skillName'> & EventTimestamp)
  | (Pick<SkillInvokedEvent, 'type' | 'skillName'> & EventTimestamp)
  | (Pick<AgentdocReadEvent, 'type' | 'path'> & EventTimestamp)
  | (Pick<ImageOutputEvent, 'type' | 'filePath'> & EventTimestamp)
  | ({ type: 'cost'; cost: SessionCost } & EventTimestamp)
  | (Pick<ErrorEvent, 'type' | 'message'> & EventTimestamp);

type RawEvent = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readTimestamp(event: RawEvent): number | string | undefined {
  const value = event.timestamp;
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function readCostRecord(value: unknown): SessionCost | null {
  if (!isRecord(value)) {
    return null;
  }
  const cost: SessionCost = {
    totalUsd: readNumber(value.totalUsd) ?? undefined,
    inputTokens: readNumber(value.inputTokens) ?? undefined,
    outputTokens: readNumber(value.outputTokens) ?? undefined,
    thinkingTokens: readNumber(value.thinkingTokens) ?? undefined,
    cachedTokens: readNumber(value.cachedTokens) ?? undefined,
    cacheCreationTokens: readNumber(value.cacheCreationTokens) ?? undefined,
    cacheReadTokens: readNumber(value.cacheReadTokens) ?? undefined,
  };
  if (!Object.values(cost).some((entry) => entry != null)) {
    return null;
  }
  return cost;
}

function parseToolEvent(event: RawEvent): SessionFlowEvent | null {
  const toolCallId = readString(event.toolCallId);
  if (!toolCallId) {
    return null;
  }
  const timestamp = readTimestamp(event);
  switch (event.type) {
    case 'tool_call_start': {
      const toolName = readString(event.toolName);
      const inputAccumulated = readString(event.inputAccumulated);
      return toolName && inputAccumulated != null ? { type: 'tool_call_start', toolCallId, toolName, inputAccumulated, timestamp } : null;
    }
    case 'tool_call_ready': {
      const toolName = readString(event.toolName);
      return toolName ? { type: 'tool_call_ready', toolCallId, toolName, input: event.input, timestamp } : null;
    }
    case 'tool_input_delta': {
      const inputAccumulated = readString(event.inputAccumulated);
      return inputAccumulated != null ? { type: 'tool_input_delta', toolCallId, inputAccumulated, timestamp } : null;
    }
    case 'tool_result': {
      const toolName = readString(event.toolName);
      return toolName ? { type: 'tool_result', toolCallId, toolName, output: event.output, timestamp } : null;
    }
    case 'tool_error': {
      const toolName = readString(event.toolName);
      const error = readString(event.error);
      return toolName && error != null ? { type: 'tool_error', toolCallId, toolName, error, timestamp } : null;
    }
    default:
      return null;
  }
}

function parseMcpEvent(event: RawEvent): SessionFlowEvent | null {
  const toolCallId = readString(event.toolCallId);
  const server = readString(event.server);
  const toolName = readString(event.toolName);
  if (!toolCallId || !server || !toolName) {
    return null;
  }
  const timestamp = readTimestamp(event);
  switch (event.type) {
    case 'mcp_tool_call_start':
      return { type: 'mcp_tool_call_start', toolCallId, server, toolName, input: event.input, timestamp };
    case 'mcp_tool_result':
      return { type: 'mcp_tool_result', toolCallId, server, toolName, output: event.output, timestamp };
    case 'mcp_tool_error': {
      const error = readString(event.error);
      return error != null ? { type: 'mcp_tool_error', toolCallId, server, toolName, error, timestamp } : null;
    }
    default:
      return null;
  }
}

function parseSubagentEvent(event: RawEvent): SessionFlowEvent | null {
  const agentName = readString(event.agentName);
  if (!agentName) {
    return null;
  }
  const timestamp = readTimestamp(event);
  switch (event.type) {
    case 'subagent_spawn': {
      const prompt = readString(event.prompt);
      return prompt != null ? { type: 'subagent_spawn', agentName, prompt, timestamp } : null;
    }
    case 'subagent_result': {
      const summary = readString(event.summary);
      return summary != null ? { type: 'subagent_result', agentName, summary, timestamp } : null;
    }
    case 'subagent_error': {
      const error = readString(event.error);
      return error != null ? { type: 'subagent_error', agentName, error, timestamp } : null;
    }
    default:
      return null;
  }
}

function parseLifecycleEvent(event: RawEvent): SessionFlowEvent | null {
  const timestamp = readTimestamp(event);
  switch (event.type) {
    case 'session_start':
    case 'session_resume':
    case 'session_end':
    case 'session_fork':
      return { type: event.type, timestamp };
    case 'turn_start':
    case 'turn_end': {
      const turnIndex = readNumber(event.turnIndex);
      return turnIndex != null ? { type: event.type, turnIndex, timestamp } : null;
    }
    case 'step_start': {
      const stepType = readString(event.stepType);
      const stepIndex = readNumber(event.stepIndex);
      return stepType != null && stepIndex != null ? { type: 'step_start', stepType, stepIndex, timestamp } : null;
    }
    case 'step_end': {
      const stepIndex = readNumber(event.stepIndex);
      return stepIndex != null ? { type: 'step_end', stepIndex, timestamp } : null;
    }
    default:
      return null;
  }
}

function parseFileEvent(event: RawEvent): SessionFlowEvent | null {
  const path = readString(event.path);
  if (!path) {
    return null;
  }
  const timestamp = readTimestamp(event);
  switch (event.type) {
    case 'file_read':
    case 'file_write':
    case 'file_create':
    case 'file_delete':
      return { type: event.type, path, timestamp };
    case 'file_patch':
      return { type: 'file_patch', path, diff: readString(event.diff) ?? '', timestamp };
    default:
      return null;
  }
}

function parseSystemEvent(event: RawEvent): SessionFlowEvent | null {
  const timestamp = readTimestamp(event);
  switch (event.type) {
    case 'shell_start': {
      const command = readString(event.command);
      return command != null ? { type: 'shell_start', command, timestamp } : null;
    }
    case 'shell_exit': {
      const exitCode = readNumber(event.exitCode);
      return exitCode != null ? { type: 'shell_exit', exitCode, timestamp } : null;
    }
    case 'plugin_loaded':
    case 'plugin_invoked': {
      const pluginName = readString(event.pluginName);
      const pluginId = readString(event.pluginId);
      return pluginName && pluginId ? { type: event.type, pluginName, pluginId, timestamp } : null;
    }
    case 'plugin_error': {
      const pluginName = readString(event.pluginName);
      const pluginId = readString(event.pluginId);
      const error = readString(event.error);
      return pluginName && pluginId && error != null ? { type: 'plugin_error', pluginName, pluginId, error, timestamp } : null;
    }
    case 'skill_loaded':
    case 'skill_invoked': {
      const skillName = readString(event.skillName);
      return skillName ? { type: event.type, skillName, timestamp } : null;
    }
    case 'agentdoc_read': {
      const path = readString(event.path);
      return path ? { type: 'agentdoc_read', path, timestamp } : null;
    }
    case 'image_output':
      return { type: 'image_output', filePath: readString(event.filePath) ?? undefined, timestamp };
    default:
      return null;
  }
}

export function adaptSessionFlowEvent(value: unknown): SessionFlowEvent | null {
  if (!isRecord(value)) {
    return null;
  }
  const type = readString(value.type);
  if (!type) {
    return null;
  }
  const event = value as RawEvent;

  switch (type) {
    case 'user_message': {
      const text = readString(event.text);
      return text != null ? { type, text, sessionId: readString(event.sessionId) ?? undefined, timestamp: readTimestamp(event) } : null;
    }
    case 'thinking_delta': {
      const delta = readString(event.delta);
      return delta != null ? { type, delta, timestamp: readTimestamp(event) } : null;
    }
    case 'thinking_stop': {
      const thinking = readString(event.thinking);
      return thinking != null ? { type, thinking, timestamp: readTimestamp(event) } : null;
    }
    case 'text_delta': {
      const delta = readString(event.delta);
      return delta != null ? { type, delta, timestamp: readTimestamp(event) } : null;
    }
    case 'message_stop': {
      const text = readString(event.text);
      return text != null ? { type, text, timestamp: readTimestamp(event) } : null;
    }
    case 'tool_call_start':
    case 'tool_call_ready':
    case 'tool_input_delta':
    case 'tool_result':
    case 'tool_error':
      return parseToolEvent(event);
    case 'mcp_tool_call_start':
    case 'mcp_tool_result':
    case 'mcp_tool_error':
      return parseMcpEvent(event);
    case 'subagent_spawn':
    case 'subagent_result':
    case 'subagent_error':
      return parseSubagentEvent(event);
    case 'session_start':
    case 'session_resume':
    case 'session_end':
    case 'session_fork':
    case 'turn_start':
    case 'turn_end':
    case 'step_start':
    case 'step_end':
      return parseLifecycleEvent(event);
    case 'file_read':
    case 'file_write':
    case 'file_create':
    case 'file_delete':
    case 'file_patch':
      return parseFileEvent(event);
    case 'shell_start':
    case 'shell_exit':
    case 'plugin_loaded':
    case 'plugin_invoked':
    case 'plugin_error':
    case 'skill_loaded':
    case 'skill_invoked':
    case 'agentdoc_read':
    case 'image_output':
      return parseSystemEvent(event);
    case 'cost': {
      const cost = readCostRecord(event.cost);
      return cost ? { type: 'cost', cost, timestamp: readTimestamp(event) } : null;
    }
    case 'error': {
      const message = readString(event.message) ?? readString(event.error);
      return message != null ? { type: 'error', message, timestamp: readTimestamp(event) } : null;
    }
    default:
      return null;
  }
}

export function adaptSessionFlowEvents(buffer: SessionFlowEventBuffer): SessionFlowEvent[] {
  if (!buffer) {
    return [];
  }
  const events: SessionFlowEvent[] = [];
  for (const rawEvent of buffer.events) {
    const event = adaptSessionFlowEvent(rawEvent);
    if (event) {
      events.push(event);
    }
  }
  return events;
}

export function adaptSessionFlowRun(run: SessionFlowRunInput): SessionFlowRun | null {
  const runId = typeof run.runId === 'string' ? run.runId : '';
  if (runId.length === 0) {
    return null;
  }
  return {
    runId,
    agent: typeof run.agent === 'string' && run.agent.length > 0 ? run.agent : 'unknown',
    status: typeof run.status === 'string' && run.status.length > 0 ? run.status : 'unknown',
    startedAt: toTimestamp(run.startedAt) ?? 0,
  };
}
