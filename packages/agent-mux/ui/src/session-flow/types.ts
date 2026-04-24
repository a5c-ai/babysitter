import type { CostRecord, SessionMessage, SessionToolCall } from '@a5c-ai/agent-mux-core';

import type { EventBuffer, RunRecord } from '../store/index.js';

export type NativeSessionToolCall = Partial<Pick<SessionToolCall, 'toolCallId' | 'toolName' | 'input' | 'output' | 'durationMs'>>;

export type NativeSessionMessage = Partial<Pick<SessionMessage, 'role' | 'content' | 'thinking'>> & {
  toolCalls?: NativeSessionToolCall[];
  toolResult?: Partial<NonNullable<SessionMessage['toolResult']>>;
};

export type SessionCost = Partial<
  Pick<
    CostRecord,
    'totalUsd' | 'inputTokens' | 'outputTokens' | 'thinkingTokens' | 'cachedTokens' | 'cacheCreationTokens' | 'cacheReadTokens'
  >
>;

export type SessionTranscriptNodeKind =
  | 'user'
  | 'assistant'
  | 'thinking'
  | 'tool'
  | 'system'
  | 'branch'
  | 'error';

export type AgentFlowSegmentKind =
  | 'user'
  | 'assistant'
  | 'thinking'
  | 'tool'
  | 'system'
  | 'lifecycle'
  | 'branch'
  | 'error';

export type AgentFlowSegmentStatus = 'running' | 'complete' | 'error';

export type SessionTranscriptNode = {
  id: string;
  kind: SessionTranscriptNodeKind;
  label: string;
  text: string;
  runId: string;
  timestamp: number | null;
  status?: AgentFlowSegmentStatus;
  filePaths: string[];
};

export type AgentFlowSegment = {
  id: string;
  kind: AgentFlowSegmentKind;
  title: string;
  detail: string;
  weight: number;
  startedAt: number | null;
  endedAt: number | null;
  status: AgentFlowSegmentStatus;
  secondaryLabel?: string;
  filePaths: string[];
};

export type AgentFlowLane = {
  runId: string;
  laneKey: string;
  agent: string;
  status: string;
  startedAt: number;
  lastEventAt: number;
  segmentCount: number;
  toolCount: number;
  totalUsd: number | null;
  segments: AgentFlowSegment[];
};

export type SessionFlowTimelineItem = {
  id: string;
  runId: string;
  laneKey: string;
  kind: AgentFlowSegmentKind;
  title: string;
  detail: string;
  timestamp: number | null;
  status: AgentFlowSegmentStatus;
  filePaths: string[];
};

export type SessionFlowFileRecord = {
  path: string;
  reads: number;
  writes: number;
  touches: number;
  lastEventAt: number | null;
  runIds: string[];
  tools: string[];
};

export type SessionFlowModel = {
  lanes: AgentFlowLane[];
  transcript: SessionTranscriptNode[];
  timeline: SessionFlowTimelineItem[];
  files: SessionFlowFileRecord[];
  summary: {
    totalRuns: number;
    totalSegments: number;
    totalTools: number;
    pendingTools: number;
    fileCount: number;
    totalUsd: number | null;
  };
};

export type SessionFlowRun = {
  runId: string;
  agent: string;
  status: string;
  startedAt: number;
};

export type SessionFlowEventBuffer = Pick<EventBuffer, 'events'> | undefined;

export type SessionFlowRunInput = Partial<RunRecord> | SessionFlowRun;
