import type { SessionFlowEvent } from './adapters.js';
import type {
  AgentFlowLane,
  AgentFlowSegment,
  AgentFlowSegmentKind,
  AgentFlowSegmentStatus,
  SessionFlowFileRecord,
  SessionFlowRun,
  SessionFlowTimelineItem,
  SessionTranscriptNode,
  SessionTranscriptNodeKind,
} from './types.js';
import { recordFileTouch } from './file-attention.js';
import { collectPaths, computeSegmentWeight, previewText, renderPayload, toTimestamp } from './utils.js';

type PendingTool = {
  toolName: string;
  secondaryLabel?: string;
  startedAt: number | null;
  detail: string;
  filePaths: string[];
};

function getLifecycleLabel(event: SessionFlowEvent): string {
  if (event.type === 'turn_start' || event.type === 'turn_end') {
    return `turn ${String(event.turnIndex ?? '?')}`;
  }
  if (event.type === 'step_start' || event.type === 'step_end') {
    return `step ${String(('stepType' in event ? event.stepType : undefined) ?? event.stepIndex ?? '?')}`;
  }
  if (event.type === 'session_start' || event.type === 'session_resume' || event.type === 'session_end' || event.type === 'session_fork') {
    return `session ${event.type.replace('session_', '')}`;
  }
  return event.type.replace(/_/g, ' ');
}

function getSystemLabel(event: SessionFlowEvent): string {
  switch (event.type) {
    case 'approval_request':
      return `approval requested`;
    case 'approval_granted':
      return 'approval granted';
    case 'approval_denied':
      return 'approval denied';
    case 'hook_requested':
      return `runtime hook ${event.hookKind}`;
    case 'hook_decision':
      return `hook ${event.decision}`;
    case 'shell_start':
      return `shell ${previewText(event.command, 48)}`;
    case 'shell_exit':
      return `shell exit ${String(event.exitCode ?? '?')}`;
    case 'file_read':
    case 'file_write':
    case 'file_create':
    case 'file_delete':
    case 'file_patch':
      return `${event.type.replace('file_', '')} ${previewText(event.path, 36)}`;
    case 'mcp_tool_call_start':
    case 'mcp_tool_result':
    case 'mcp_tool_error':
      return `${event.toolName} · ${event.server}`;
    case 'plugin_loaded':
    case 'plugin_invoked':
    case 'plugin_error':
      return `${event.type.replace('plugin_', '')} ${event.pluginName ?? event.pluginId ?? 'plugin'}`;
    case 'skill_loaded':
    case 'skill_invoked':
      return `${event.type.replace('skill_', '')} ${event.skillName}`;
    case 'agentdoc_read':
      return `agent doc ${previewText(event.path, 36)}`;
    default:
      return event.type.replace(/_/g, ' ');
  }
}

function buildToolLabel(toolName: string, secondaryLabel?: string): string {
  return secondaryLabel ? `${toolName} · ${secondaryLabel}` : toolName;
}

function buildHookRequestDetail(event: Extract<SessionFlowEvent, { type: 'hook_requested' }>): string {
  const payload = renderPayload(event.payload);
  const deadline = event.deadlineTs ? `deadline ${new Date(event.deadlineTs).toLocaleTimeString()}` : 'pending';
  return payload.length > 0
    ? `Runtime hook ${event.hookKind} opened (${deadline}).\n${payload}`
    : `Runtime hook ${event.hookKind} opened (${deadline}).`;
}

function buildHookDecisionDetail(event: Extract<SessionFlowEvent, { type: 'hook_decision' }>): string {
  const parts = [
    `Runtime hook ${event.hookKind ?? event.hookRequestId} resolved: ${event.decision}.`,
  ];
  if (event.reason) {
    parts.push(`Reason: ${event.reason}`);
  }
  if (event.resolvedBy) {
    parts.push(`Resolved by: ${event.resolvedBy}`);
  }
  return parts.join('\n');
}

function buildApprovalDetail(
  event: Extract<SessionFlowEvent, { type: 'approval_request' | 'approval_granted' | 'approval_denied' }>,
): string {
  if (event.type === 'approval_request') {
    const parts = [
      `Approval requested: ${event.action}.`,
      event.detail,
    ];
    if (event.toolName) {
      parts.push(`Tool: ${event.toolName}`);
    }
    parts.push(`Risk: ${event.riskLevel}`);
    return parts.join('\n');
  }
  if (event.type === 'approval_denied' && event.reason) {
    return `Approval denied.\nReason: ${event.reason}`;
  }
  return event.type === 'approval_granted' ? 'Approval granted.' : 'Approval denied.';
}

export function projectRunFlow(
  run: SessionFlowRun,
  events: SessionFlowEvent[],
): {
  lane: AgentFlowLane;
  transcript: SessionTranscriptNode[];
  timeline: SessionFlowTimelineItem[];
  files: SessionFlowFileRecord[];
} {
  const segments: AgentFlowSegment[] = [];
  const transcript: SessionTranscriptNode[] = [];
  const timeline: SessionFlowTimelineItem[] = [];
  const files = new Map<string, SessionFlowFileRecord>();
  const pendingTools = new Map<string, PendingTool>();
  let currentAssistantText = '';
  let currentAssistantStart: number | null = null;
  let currentThinkingText = '';
  let currentThinkingStart: number | null = null;
  let toolCount = 0;
  let totalUsd = 0;
  let hasCost = false;
  let lastEventAt = run.startedAt;

  const pushSegment = (
    kind: AgentFlowSegmentKind,
    title: string,
    detail: string,
    start: number | null,
    end: number | null,
    status: AgentFlowSegmentStatus,
    options?: { secondaryLabel?: string; includeTranscript?: boolean; filePaths?: string[] },
  ): void => {
    const cleaned = previewText(detail.length > 0 ? detail : title, 220);
    const filePaths = [...(options?.filePaths ?? [])];
    const segment: AgentFlowSegment = {
      id: `${run.runId}-${segments.length}-${kind}`,
      kind,
      title,
      detail: cleaned,
      weight: computeSegmentWeight(cleaned, start, end),
      startedAt: start,
      endedAt: end,
      status,
      secondaryLabel: options?.secondaryLabel,
      filePaths,
    };
    segments.push(segment);
    timeline.push({
      id: `timeline-${segment.id}`,
      runId: run.runId,
      laneKey: run.runId,
      kind,
      title: options?.secondaryLabel ? buildToolLabel(title, options.secondaryLabel) : title,
      detail: cleaned,
      timestamp: start ?? end,
      status,
      filePaths,
    });
    if (options?.includeTranscript && kind !== 'lifecycle') {
      const transcriptKind: SessionTranscriptNodeKind =
        kind === 'user' || kind === 'assistant' || kind === 'thinking' || kind === 'tool' || kind === 'system' || kind === 'branch'
          ? kind
          : 'error';
      transcript.push({
        id: `transcript-${segment.id}`,
        kind: transcriptKind,
        label: options?.secondaryLabel ? buildToolLabel(title, options.secondaryLabel) : title,
        text: detail,
        runId: run.runId,
        timestamp: start ?? end,
        status,
        filePaths,
      });
    }
  };

  const flushAssistant = (timestamp: number | null): void => {
    if (!currentAssistantText) {
      return;
    }
    pushSegment('assistant', 'assistant', currentAssistantText, currentAssistantStart, timestamp ?? currentAssistantStart, 'complete', {
      includeTranscript: true,
    });
    currentAssistantText = '';
    currentAssistantStart = null;
  };

  const flushThinking = (timestamp: number | null): void => {
    if (!currentThinkingText) {
      return;
    }
    pushSegment('thinking', 'thinking', currentThinkingText, currentThinkingStart, timestamp ?? currentThinkingStart, 'complete', {
      includeTranscript: true,
    });
    currentThinkingText = '';
    currentThinkingStart = null;
  };

  for (const event of events) {
    const timestamp = toTimestamp(event.timestamp) ?? run.startedAt;
    lastEventAt = Math.max(lastEventAt, timestamp);

    if (event.type === 'cost') {
      totalUsd += Number(event.cost.totalUsd ?? 0);
      hasCost = true;
      continue;
    }

    if (event.type === 'user_message') {
      flushThinking(timestamp);
      flushAssistant(timestamp);
      if (event.text.length > 0) {
        pushSegment('user', 'user', event.text, timestamp, timestamp, 'complete', {
          includeTranscript: true,
        });
      }
      continue;
    }

    if (event.type === 'thinking_delta') {
      if (currentThinkingStart == null) {
        currentThinkingStart = timestamp;
      }
      currentThinkingText += event.delta;
      continue;
    }

    if (event.type === 'thinking_stop') {
      if (event.thinking.length > 0) {
        currentThinkingText = event.thinking;
      }
      flushThinking(timestamp);
      continue;
    }

    if (event.type === 'text_delta') {
      flushThinking(timestamp);
      if (currentAssistantStart == null) {
        currentAssistantStart = timestamp;
      }
      currentAssistantText += event.delta;
      continue;
    }

    if (event.type === 'message_stop') {
      flushThinking(timestamp);
      if (event.text.length > 0) {
        currentAssistantText = event.text;
      }
      flushAssistant(timestamp);
      continue;
    }

    flushThinking(timestamp);
    flushAssistant(timestamp);

    if (event.type === 'hook_requested') {
      const filePaths = [...collectPaths(event.payload)];
      pushSegment('system', getSystemLabel(event), buildHookRequestDetail(event), timestamp, timestamp, 'complete', {
        includeTranscript: true,
        filePaths,
      });
      continue;
    }

    if (event.type === 'hook_decision') {
      pushSegment('system', getSystemLabel(event), buildHookDecisionDetail(event), timestamp, timestamp, 'complete', {
        includeTranscript: true,
      });
      continue;
    }

    if (event.type === 'approval_request' || event.type === 'approval_granted' || event.type === 'approval_denied') {
      pushSegment(event.type === 'approval_denied' ? 'error' : 'system', getSystemLabel(event), buildApprovalDetail(event), timestamp, timestamp, event.type === 'approval_denied' ? 'error' : 'complete', {
        includeTranscript: true,
      });
      continue;
    }

    if (event.type === 'tool_call_start' || event.type === 'tool_call_ready' || event.type === 'tool_input_delta') {
      const toolCallId = event.toolCallId;
      const existing = pendingTools.get(toolCallId);
      const toolName = 'toolName' in event ? event.toolName : existing?.toolName ?? 'tool';
      const detail =
        event.type === 'tool_call_ready'
          ? renderPayload(event.input)
          : event.type === 'tool_call_start'
            ? event.inputAccumulated
            : event.inputAccumulated || existing?.detail || '';
      const filePaths = [...collectPaths(event.type === 'tool_call_ready' ? event.input : detail)];
      for (const path of filePaths) {
        recordFileTouch(files, path, 'read', run.runId, timestamp, toolName);
      }
      pendingTools.set(toolCallId, {
        toolName,
        startedAt: existing?.startedAt ?? timestamp,
        detail,
        filePaths,
      });
      continue;
    }

    if (event.type === 'tool_result' || event.type === 'tool_error') {
      const pending = pendingTools.get(event.toolCallId);
      const toolName = pending?.toolName ?? event.toolName;
      const detail = event.type === 'tool_error' ? event.error : renderPayload(event.output);
      const pendingFilePaths = pending?.filePaths ?? [];
      const outputFilePaths =
        event.type === 'tool_result'
          ? [...collectPaths(event.output), ...collectPaths(detail)].filter((path) => !pendingFilePaths.includes(path))
          : [];
      const filePaths = [...new Set([...pendingFilePaths, ...outputFilePaths])];
      const writeLike = /write|edit|patch/i.test(toolName);
      const touchedPaths = writeLike ? filePaths : outputFilePaths;
      for (const path of touchedPaths) {
        recordFileTouch(files, path, writeLike ? 'write' : 'read', run.runId, timestamp, toolName);
      }
      pushSegment(event.type === 'tool_error' ? 'error' : 'tool', toolName, detail, pending?.startedAt ?? timestamp, timestamp, event.type === 'tool_error' ? 'error' : 'complete', {
        includeTranscript: true,
        filePaths,
      });
      pendingTools.delete(event.toolCallId);
      toolCount += 1;
      continue;
    }

    if (event.type === 'mcp_tool_call_start') {
      const detail = renderPayload(event.input);
      const filePaths = [...collectPaths(event.input)];
      for (const path of filePaths) {
        recordFileTouch(files, path, 'read', run.runId, timestamp, event.toolName);
      }
      pendingTools.set(event.toolCallId, {
        toolName: event.toolName,
        secondaryLabel: event.server,
        startedAt: timestamp,
        detail,
        filePaths,
      });
      continue;
    }

    if (event.type === 'mcp_tool_result' || event.type === 'mcp_tool_error') {
      const pending = pendingTools.get(event.toolCallId);
      const detail = event.type === 'mcp_tool_error' ? event.error : renderPayload(event.output);
      pushSegment(event.type === 'mcp_tool_error' ? 'error' : 'tool', pending?.toolName ?? event.toolName, detail, pending?.startedAt ?? timestamp, timestamp, event.type === 'mcp_tool_error' ? 'error' : 'complete', {
        secondaryLabel: pending?.secondaryLabel ?? event.server,
        includeTranscript: true,
        filePaths: pending?.filePaths ?? [],
      });
      pendingTools.delete(event.toolCallId);
      toolCount += 1;
      continue;
    }

    if (event.type === 'subagent_spawn' || event.type === 'subagent_result' || event.type === 'subagent_error') {
      const detail = event.type === 'subagent_spawn' ? event.prompt : event.type === 'subagent_result' ? event.summary : event.error;
      pushSegment(event.type === 'subagent_error' ? 'error' : 'branch', event.agentName, detail, timestamp, timestamp, event.type === 'subagent_error' ? 'error' : 'complete', {
        includeTranscript: true,
      });
      continue;
    }

    if (
      event.type === 'session_start' ||
      event.type === 'session_resume' ||
      event.type === 'session_end' ||
      event.type === 'session_fork' ||
      event.type === 'turn_start' ||
      event.type === 'turn_end' ||
      event.type === 'step_start' ||
      event.type === 'step_end'
    ) {
      const label = getLifecycleLabel(event);
      pushSegment('lifecycle', label, label, timestamp, timestamp, 'complete');
      continue;
    }

    if (event.type === 'file_read' || event.type === 'file_write' || event.type === 'file_create' || event.type === 'file_delete' || event.type === 'file_patch') {
      if (event.path.length > 0) {
        recordFileTouch(files, event.path, event.type === 'file_read' ? 'read' : 'write', run.runId, timestamp);
      }
      const label = getSystemLabel(event);
      pushSegment('system', label, label, timestamp, timestamp, 'complete', {
        includeTranscript: true,
        filePaths: event.path.length > 0 ? [event.path] : [],
      });
      continue;
    }

    if (
      event.type === 'shell_start' ||
      event.type === 'shell_exit' ||
      event.type === 'plugin_loaded' ||
      event.type === 'plugin_invoked' ||
      event.type === 'plugin_error' ||
      event.type === 'skill_loaded' ||
      event.type === 'skill_invoked' ||
      event.type === 'agentdoc_read' ||
      event.type === 'image_output'
    ) {
      const label = getSystemLabel(event);
      pushSegment(event.type.endsWith('error') ? 'error' : 'system', label, label, timestamp, timestamp, event.type.endsWith('error') ? 'error' : 'complete', {
        includeTranscript: true,
        filePaths: [...collectPaths(event)],
      });
      continue;
    }

    if (event.type === 'error') {
      pushSegment('error', 'error', event.message, timestamp, timestamp, 'error', {
        includeTranscript: true,
      });
    }
  }

  flushThinking(lastEventAt || null);
  flushAssistant(lastEventAt || null);

  for (const [toolCallId, pending] of pendingTools.entries()) {
    pushSegment('tool', pending.toolName, pending.detail.length > 0 ? pending.detail : pending.toolName, pending.startedAt, pending.startedAt, 'running', {
      secondaryLabel: pending.secondaryLabel,
      includeTranscript: true,
      filePaths: pending.filePaths,
    });
    timeline[timeline.length - 1]!.id = `timeline-${run.runId}-${toolCallId}-pending`;
    transcript[transcript.length - 1]!.id = `transcript-${run.runId}-${toolCallId}-pending`;
    toolCount += 1;
  }

  return {
    lane: {
      runId: run.runId,
      laneKey: run.runId,
      agent: run.agent,
      status: run.status,
      startedAt: run.startedAt,
      lastEventAt,
      segmentCount: segments.length,
      toolCount,
      totalUsd: hasCost ? totalUsd : null,
      segments,
    },
    transcript,
    timeline,
    files: Array.from(files.values()),
  };
}
