import { adaptSessionFlowEvents, adaptSessionFlowRun } from './adapters.js';
import { mergeFileRecords } from './file-attention.js';
import { projectRunFlow } from './projector.js';
import type {
  AgentFlowLane,
  SessionFlowEventBuffer,
  SessionFlowFileRecord,
  SessionFlowModel,
  SessionFlowRunInput,
  SessionFlowTimelineItem,
  SessionTranscriptNode,
} from './types.js';
import { sortByTimestamp } from './utils.js';

export function buildSessionTranscript(
  runs: SessionFlowRunInput[],
  eventBuffers: Record<string, SessionFlowEventBuffer>,
): SessionTranscriptNode[] {
  return buildSessionFlowModel(runs, eventBuffers).transcript;
}

export function buildAgentFlowLanes(
  runs: SessionFlowRunInput[],
  eventBuffers: Record<string, SessionFlowEventBuffer>,
): AgentFlowLane[] {
  return buildSessionFlowModel(runs, eventBuffers).lanes;
}

export function buildSessionTimelineFromTranscript(
  transcript: SessionTranscriptNode[],
): SessionFlowTimelineItem[] {
  return transcript.map((node) => ({
    id: `${node.id}:timeline`,
    runId: node.runId,
    laneKey: node.runId,
    kind: node.kind,
    title: node.label,
    detail: node.text,
    timestamp: node.timestamp,
    status: node.status ?? 'complete',
    filePaths: node.filePaths,
  }));
}

export function buildSessionFilesFromTranscript(
  transcript: SessionTranscriptNode[],
): SessionFlowFileRecord[] {
  const files = new Map<string, SessionFlowFileRecord>();
  for (const node of transcript) {
    for (const path of node.filePaths) {
      const existing = files.get(path) ?? {
        path,
        reads: 0,
        writes: 0,
        touches: 0,
        lastEventAt: null,
        runIds: [],
        tools: [],
      };
      existing.touches += 1;
      if (!existing.runIds.includes(node.runId)) {
        existing.runIds.push(node.runId);
      }
      if (node.kind === 'tool' && !existing.tools.includes(node.label)) {
        existing.tools.push(node.label);
      }
      if (typeof node.timestamp === 'number') {
        existing.lastEventAt = Math.max(existing.lastEventAt ?? 0, node.timestamp) || null;
      }
      files.set(path, existing);
    }
  }

  return Array.from(files.values()).sort((left, right) => {
    if (left.touches !== right.touches) {
      return right.touches - left.touches;
    }
    return (right.lastEventAt ?? 0) - (left.lastEventAt ?? 0);
  });
}

export function buildSessionFlowModel(
  runs: SessionFlowRunInput[],
  eventBuffers: Record<string, SessionFlowEventBuffer>,
): SessionFlowModel {
  const orderedRuns = runs
    .map((run) => adaptSessionFlowRun(run))
    .filter((run): run is NonNullable<typeof run> => run != null)
    .sort((left, right) => left.startedAt - right.startedAt);

  const lanes: AgentFlowLane[] = [];
  const transcript: SessionTranscriptNode[] = [];
  const timeline: SessionFlowTimelineItem[] = [];
  const files = new Map<string, SessionFlowModel['files'][number]>();

  for (const run of orderedRuns) {
    const projected = projectRunFlow(run, adaptSessionFlowEvents(eventBuffers[run.runId]));
    lanes.push(projected.lane);
    transcript.push(...projected.transcript);
    timeline.push(...projected.timeline);
    mergeFileRecords(files, projected.files);
  }

  const orderedTimeline = [...timeline].sort(sortByTimestamp);
  const orderedTranscript = [...transcript].sort(sortByTimestamp);
  const orderedFiles = Array.from(files.values()).sort((left, right) => {
    if (left.touches !== right.touches) {
      return right.touches - left.touches;
    }
    return (right.lastEventAt ?? 0) - (left.lastEventAt ?? 0);
  });

  let totalUsd: number | null = 0;
  let sawCost = false;
  let totalTools = 0;
  let pendingTools = 0;
  let totalSegments = 0;
  for (const lane of lanes) {
    totalTools += lane.toolCount;
    totalSegments += lane.segmentCount;
    pendingTools += lane.segments.filter((segment) => segment.kind === 'tool' && segment.status === 'running').length;
    if (lane.totalUsd != null) {
      totalUsd += lane.totalUsd;
      sawCost = true;
    }
  }

  return {
    lanes,
    transcript: orderedTranscript,
    timeline: orderedTimeline,
    files: orderedFiles,
    summary: {
      totalRuns: lanes.length,
      totalSegments,
      totalTools,
      pendingTools,
      fileCount: orderedFiles.length,
      totalUsd: sawCost ? totalUsd : null,
    },
  };
}
