import type { AgentFlowLane, AgentFlowSegment, NativeSessionMessage, SessionTranscriptNode } from './types.js';
import { collectPaths, computeSegmentWeight, previewText, renderPayload } from './utils.js';

function readMessageTimestamp(message: NativeSessionMessage, index: number): number {
  const value = message.timestamp;
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return index;
}

function normalizeMessageContent(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    const parts = value.flatMap((entry) => {
      if (typeof entry === 'string') {
        return [entry];
      }
      if (!entry || typeof entry !== 'object') {
        return [];
      }
      const block = entry as Record<string, unknown>;
      const blockType = typeof block.type === 'string' ? block.type : '';
      if (blockType === 'tool_use') {
        return [];
      }
      if (blockType === 'text' && typeof block.text === 'string') {
        return [block.text];
      }
      if (blockType === 'tool_result') {
        return [normalizeMessageContent(block.content ?? block.output ?? block.tool_use_result)];
      }
      if (typeof block.text === 'string') {
        return [block.text];
      }
      if ('content' in block) {
        return [normalizeMessageContent(block.content)];
      }
      return [];
    }).filter((part) => part.length > 0);
    if (parts.length > 0) {
      return parts.join('\n\n');
    }
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.text === 'string') {
      return record.text;
    }
    if ('content' in record) {
      const nested = normalizeMessageContent(record.content);
      if (nested.length > 0) {
        return nested;
      }
    }
  }
  return value == null ? '' : renderPayload(value);
}

export function buildNativeTranscript(sessionId: string, messages: NativeSessionMessage[]): SessionTranscriptNode[] {
  const nodes: SessionTranscriptNode[] = [];
  for (const [index, message] of messages.entries()) {
    const runId = `${sessionId}:native:${index}`;
    const baseTimestamp = readMessageTimestamp(message, index);
    const normalizedContent = normalizeMessageContent(message.content as unknown);
    if (message.role === 'user' && normalizedContent.length > 0) {
      nodes.push({
        id: `${runId}:user`,
        kind: 'user',
        label: 'user',
        text: normalizedContent,
        runId,
        timestamp: baseTimestamp,
        filePaths: [],
      });
      continue;
    }
    if (typeof message.thinking === 'string' && message.thinking.length > 0) {
      nodes.push({
        id: `${runId}:thinking`,
        kind: 'thinking',
        label: 'thinking',
        text: message.thinking,
        runId,
        timestamp: baseTimestamp + 0.1,
        filePaths: [],
      });
    }
    if (Array.isArray(message.toolCalls)) {
      for (const [toolIndex, toolCall] of message.toolCalls.entries()) {
        const filePaths = [...collectPaths(toolCall.input), ...collectPaths(toolCall.output)];
        nodes.push({
          id: `${runId}:tool:${toolIndex}`,
          kind: 'tool',
          label: String(toolCall.toolName ?? 'tool'),
          text: renderPayload({
            input: toolCall.input,
            output: toolCall.output,
            durationMs: toolCall.durationMs,
          }),
          runId,
          timestamp: baseTimestamp + 0.2 + toolIndex / 10,
          filePaths,
        });
      }
    }
    if (message.role === 'tool' && message.toolResult) {
      const toolText = normalizedContent.length > 0
        ? normalizedContent
        : renderPayload(message.toolResult.output);
      nodes.push({
        id: `${runId}:tool-result`,
        kind: 'tool',
        label: String(message.toolResult.toolName ?? 'tool'),
        text: toolText,
        runId,
        timestamp: baseTimestamp + 0.25,
        filePaths: [...collectPaths(message.toolResult.output)],
      });
      continue;
    }
    if (message.role === 'assistant' && normalizedContent.length > 0) {
      nodes.push({
        id: `${runId}:assistant`,
        kind: 'assistant',
        label: 'assistant',
        text: normalizedContent,
        runId,
        timestamp: baseTimestamp + 0.3,
        filePaths: [],
      });
      continue;
    }
    if (message.role === 'system' && normalizedContent.length > 0) {
      nodes.push({
        id: `${runId}:system`,
        kind: 'system',
        label: 'system',
        text: normalizedContent,
        runId,
        timestamp: baseTimestamp + 0.4,
        filePaths: [],
      });
    }
  }
  return nodes;
}

export function buildNativeAgentFlowLane(
  sessionId: string,
  messages: NativeSessionMessage[],
  agent: string,
  status: string,
): AgentFlowLane | null {
  if (messages.length === 0) {
    return null;
  }

  const transcript = buildNativeTranscript(sessionId, messages);
  const segments: AgentFlowSegment[] = transcript.map((node, index) => ({
    id: `${sessionId}:native:segment:${index}`,
    kind: node.kind,
    title: node.label,
    detail: previewText(node.text, 220),
    weight: computeSegmentWeight(node.text, null, null),
    startedAt: typeof node.timestamp === 'number' ? node.timestamp : null,
    endedAt: typeof node.timestamp === 'number' ? node.timestamp : null,
    status: node.kind === 'error' ? 'error' : 'complete',
    filePaths: node.filePaths,
  }));
  const toolCount = segments.filter((segment) => segment.kind === 'tool').length;

  return {
    runId: `${sessionId}:native`,
    laneKey: `${sessionId}:native`,
    agent,
    status,
    startedAt: 0,
    lastEventAt: messages.length,
    segmentCount: segments.length,
    toolCount,
    totalUsd: null,
    segments,
  };
}
