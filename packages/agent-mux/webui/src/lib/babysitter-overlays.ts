import type {
  KanbanBacklogSnapshot,
  KanbanBoardSnapshot,
  KanbanReviewDecision,
  KanbanReviewArtifact,
  KanbanWorkflowState,
} from "@a5c-ai/agent-mux-comm/kanban";

import type { Run } from "@/types";

export type BabysitterOverlayStage = "dispatch" | "executing" | "review" | "recovery" | "done";

export interface BoardExecutionOverlay {
  issueId: string;
  issueKey: string;
  issueTitle: string;
  workflowState: KanbanWorkflowState;
  stage: BabysitterOverlayStage;
  stageLabel: string;
  reviewDecision?: KanbanReviewDecision;
  runIds: string[];
  sessionIds: string[];
  runCount: number;
  activeRuns: number;
  failedRuns: number;
  completedRuns: number;
  staleRuns: number;
  retryCount: number;
  pendingBreakpoints: number;
  stuck: boolean;
  primaryRunId?: string;
  primarySessionId?: string;
  updatedAt?: string;
}

export interface RunHealthRecord {
  runId: string;
  processId: string;
  projectName?: string;
  sessionId?: string;
  status: Run["status"];
  retryCount: number;
  stuck: boolean;
  pendingBreakpoints: number;
  severity: "healthy" | "attention" | "critical";
  recoveryHref: string;
  reviewHref?: string;
  summary: string;
  updatedAt: string;
}

export interface RunArtifactShortcut {
  runId: string;
  processId: string;
  status: Run["status"];
  sessionId?: string;
  breakpointEffectId?: string;
  errorEffectId?: string;
  logTaskCount: number;
  resultTaskCount: number;
  pendingBreakpointCount: number;
  failedTaskCount: number;
}

export interface SessionTimelineItem {
  id: string;
  runId: string;
  kind: "run" | "user" | "assistant" | "thinking" | "tool" | "approval" | "error" | "complete";
  label: string;
  text: string;
  href?: string;
}

interface SessionEventBuffer {
  events: Array<Record<string, unknown>>;
}

function formatStageLabel(stage: BabysitterOverlayStage): string {
  switch (stage) {
    case "dispatch":
      return "Ready for dispatch";
    case "executing":
      return "Executing on the board";
    case "review":
      return "Approval and review";
    case "recovery":
      return "Recovery required";
    case "done":
      return "Execution landed";
  }
}

function toTimestamp(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function findPendingBreakpoint(run: Run) {
  return run.tasks.find((task) => task.kind === "breakpoint" && task.status === "requested") ?? null;
}

export function buildBoardExecutionOverlays(input: {
  snapshot?: KanbanBacklogSnapshot;
  board?: KanbanBoardSnapshot;
  runs: Run[];
  reviewArtifacts?: readonly KanbanReviewArtifact[];
  nowMs?: number;
}): BoardExecutionOverlay[] {
  if (!input.snapshot || !input.board) {
    return [];
  }

  const nowMs = input.nowMs ?? Date.now();
  const runsById = new Map(input.runs.map((run) => [run.runId, run]));
  const cardsByIssueId = new Map(
    input.board.projects.flatMap((project) => project.cards.map((card) => [card.issueId, card] as const)),
  );
  const reviewsByTargetId = new Map(
    (input.reviewArtifacts ?? []).map((artifact) => [artifact.targetId, artifact] as const),
  );

  const overlays: BoardExecutionOverlay[] = [];

  for (const issue of input.snapshot.issues) {
      const card = cardsByIssueId.get(issue.id);
      if (!card) {
        continue;
      }

      const linkedRuns = (issue.dispatch?.runIds ?? [])
        .map((runId) => runsById.get(runId))
        .filter((run): run is Run => Boolean(run))
        .sort((left, right) => toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt));
      const review = reviewsByTargetId.get(issue.id);
      const pendingBreakpoints = linkedRuns.filter((run) => findPendingBreakpoint(run)).length;
      const activeRuns = linkedRuns.filter((run) => run.status === "pending" || run.status === "waiting").length;
      const failedRuns = linkedRuns.filter((run) => run.status === "failed").length;
      const completedRuns = linkedRuns.filter((run) => run.status === "completed").length;
      const staleRuns = linkedRuns.filter((run) => run.isStale).length;
      const latestRun = linkedRuns[0];
      const retryCount = Math.max(0, linkedRuns.length - 1);
      const stuck =
        staleRuns > 0 ||
        linkedRuns.some((run) => {
          if (run.status !== "pending" && run.status !== "waiting") {
            return false;
          }
          return nowMs - toTimestamp(run.updatedAt) > 15 * 60 * 1000;
        });

      let stage: BabysitterOverlayStage = "dispatch";
      if (failedRuns > 0 || staleRuns > 0 || stuck) {
        stage = "recovery";
      } else if (
        pendingBreakpoints > 0 ||
        card.workflowState === "review" ||
        review?.decision === "changes-requested" ||
        review?.decision === "pending"
      ) {
        stage = "review";
      } else if (activeRuns > 0 || card.workflowState === "in-progress") {
        stage = "executing";
      } else if (card.workflowState === "done" || (linkedRuns.length > 0 && completedRuns === linkedRuns.length)) {
        stage = "done";
      }

      overlays.push({
        issueId: issue.id,
        issueKey: issue.key,
        issueTitle: issue.title,
        workflowState: card.workflowState,
        stage,
        stageLabel: formatStageLabel(stage),
        reviewDecision: review?.decision,
        runIds: linkedRuns.map((run) => run.runId),
        sessionIds: Array.from(new Set(issue.dispatch?.sessionIds ?? linkedRuns.map((run) => run.sessionId ?? "").filter(Boolean))),
        runCount: linkedRuns.length,
        activeRuns,
        failedRuns,
        completedRuns,
        staleRuns,
        retryCount,
        pendingBreakpoints,
        stuck,
        primaryRunId: latestRun?.runId,
        primarySessionId: latestRun?.sessionId ?? issue.dispatch?.sessionIds?.[0],
        updatedAt: latestRun?.updatedAt ?? issue.updatedAt,
      });
    }

  return overlays.sort((left, right) => {
    const stageRank = ["recovery", "review", "executing", "dispatch", "done"];
    const rankDiff = stageRank.indexOf(left.stage) - stageRank.indexOf(right.stage);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt);
  });
}

export function buildRunHealthRecords(runs: Run[], nowMs = Date.now()): RunHealthRecord[] {
  const groups = new Map<string, Run[]>();

  for (const run of runs) {
    const key = run.sessionId && run.sessionId.length > 0
      ? `session:${run.sessionId}`
      : `process:${run.projectName ?? "unknown"}:${run.processId}`;
    const group = groups.get(key);
    if (group) {
      group.push(run);
    } else {
      groups.set(key, [run]);
    }
  }

  return Array.from(groups.values())
    .map((group) => group.sort((left, right) => toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt))[0]!)
    .map((run) => {
      const groupKey = run.sessionId && run.sessionId.length > 0
        ? `session:${run.sessionId}`
        : `process:${run.projectName ?? "unknown"}:${run.processId}`;
      const retryCount = Math.max(0, (groups.get(groupKey)?.length ?? 1) - 1);
      const pendingBreakpoints = run.tasks.filter((task) => task.kind === "breakpoint" && task.status === "requested").length;
      const stuck =
        run.isStale === true ||
        ((run.status === "pending" || run.status === "waiting") && nowMs - toTimestamp(run.updatedAt) > 15 * 60 * 1000);
      const failedTaskCount = run.tasks.filter((task) => task.status === "error").length;
      const breakpoint = findPendingBreakpoint(run);

      let severity: RunHealthRecord["severity"] = "healthy";
      if (run.status === "failed" || stuck) {
        severity = "critical";
      } else if (pendingBreakpoints > 0 || failedTaskCount > 0 || retryCount > 0) {
        severity = "attention";
      }

      const summaryParts = [];
      if (pendingBreakpoints > 0) {
        summaryParts.push(`${pendingBreakpoints} breakpoint${pendingBreakpoints === 1 ? "" : "s"}`);
      }
      if (retryCount > 0) {
        summaryParts.push(`${retryCount} retr${retryCount === 1 ? "y" : "ies"}`);
      }
      if (stuck) {
        summaryParts.push("stuck-task signal");
      }
      if (summaryParts.length === 0) {
        summaryParts.push(`${run.completedTasks}/${run.totalTasks} tasks complete`);
      }

      return {
        runId: run.runId,
        processId: run.processId,
        projectName: run.projectName,
        sessionId: run.sessionId,
        status: run.status,
        retryCount,
        stuck,
        pendingBreakpoints,
        severity,
        recoveryHref: run.sessionId ? `/sessions/${run.sessionId}` : `/dispatches/${run.runId}`,
        reviewHref: breakpoint ? `/dispatches/${run.runId}?effectId=${encodeURIComponent(breakpoint.effectId)}` : undefined,
        summary: summaryParts.join(" · "),
        updatedAt: run.updatedAt,
      };
    })
    .sort((left, right) => {
      const severityRank = { critical: 0, attention: 1, healthy: 2 };
      const severityDiff = severityRank[left.severity] - severityRank[right.severity];
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt);
    });
}

export function buildRunArtifactShortcuts(runs: Array<Record<string, unknown>>): RunArtifactShortcut[] {
  return runs.map((run) => {
    const tasks = Array.isArray(run.tasks) ? run.tasks : [];
    const breakpointTask = tasks.find(
      (task) => {
        const record = asRecord(task);
        return (
          record?.kind === "breakpoint" &&
          record.status === "requested" &&
          typeof record.effectId === "string"
        );
      },
    ) as { effectId: string } | undefined;
    const errorTask = tasks.find(
      (task) => {
        const record = asRecord(task);
        return record?.status === "error" && typeof record.effectId === "string";
      },
    ) as { effectId: string } | undefined;

    return {
      runId: String(run.runId ?? ""),
      processId: String(run.processId ?? "unknown"),
      status: (run.status as Run["status"]) ?? "pending",
      sessionId: typeof run.sessionId === "string" ? run.sessionId : undefined,
      breakpointEffectId: breakpointTask?.effectId,
      errorEffectId: errorTask?.effectId,
      logTaskCount: tasks.filter((task) => {
        const record = asRecord(task);
        return Boolean(record?.stdout || record?.stderr);
      }).length,
      resultTaskCount: tasks.filter((task) => Boolean(asRecord(task)?.result)).length,
      pendingBreakpointCount: tasks.filter((task) => {
        const record = asRecord(task);
        return record?.kind === "breakpoint" && record.status === "requested";
      }).length,
      failedTaskCount: tasks.filter((task) => asRecord(task)?.status === "error").length,
    };
  });
}

export function buildSessionTimeline(
  runs: Array<Record<string, unknown>>,
  eventBuffers: Record<string, SessionEventBuffer | undefined>,
): SessionTimelineItem[] {
  const orderedRuns = [...runs].sort((left, right) => Number(left.startedAt ?? 0) - Number(right.startedAt ?? 0));
  const timeline: SessionTimelineItem[] = [];

  for (const run of orderedRuns) {
    const runId = String(run.runId ?? "");
    const processId = String(run.processId ?? "run");
    const status = String(run.status ?? "unknown");
    const tasks = Array.isArray(run.tasks) ? run.tasks : [];
    timeline.push({
      id: `${runId}:start`,
      runId,
      kind: "run",
      label: "Run started",
      text: `${processId} entered the session overlay.`,
      href: `/dispatches/${runId}`,
    });

    let currentAssistantText = "";
    let currentThinkingText = "";
    const flush = (kind: "assistant" | "thinking") => {
      const text = kind === "assistant" ? currentAssistantText : currentThinkingText;
      if (!text) {
        return;
      }
      timeline.push({
        id: `${runId}:${kind}:${timeline.length}`,
        runId,
        kind,
        label: kind === "assistant" ? "Assistant" : "Reasoning",
        text,
        href: `/dispatches/${runId}`,
      });
      if (kind === "assistant") {
        currentAssistantText = "";
      } else {
        currentThinkingText = "";
      }
    };

    for (const event of eventBuffers[runId]?.events ?? []) {
      const type = String(event.type ?? "");
      if (type === "user_message") {
        flush("thinking");
        flush("assistant");
        timeline.push({
          id: `${runId}:user:${timeline.length}`,
          runId,
          kind: "user",
          label: "User turn",
          text: String(event.text ?? ""),
          href: `/dispatches/${runId}`,
        });
        continue;
      }

      if (type === "thinking_delta") {
        currentThinkingText += String(event.delta ?? "");
        continue;
      }

      if (type === "thinking_stop") {
        const finalThinking = String(event.thinking ?? "");
        if (finalThinking) {
          currentThinkingText = finalThinking;
        }
        flush("thinking");
        continue;
      }

      if (type === "text_delta") {
        flush("thinking");
        currentAssistantText += String(event.delta ?? "");
        continue;
      }

      if (type === "message_stop") {
        flush("thinking");
        const finalText = String(event.text ?? "");
        if (finalText) {
          currentAssistantText = finalText;
        }
        flush("assistant");
        continue;
      }

      if (type === "tool_call_start" || type === "tool_call_ready" || type === "tool_result" || type === "tool_error") {
        flush("thinking");
        flush("assistant");
        const toolName = String(event.toolName ?? "tool");
        timeline.push({
          id: `${runId}:tool:${timeline.length}`,
          runId,
          kind: "tool",
          label: type === "tool_result" || type === "tool_error" ? toolName : `Start ${toolName}`,
          text:
            type === "tool_result" || type === "tool_error"
              ? JSON.stringify(event, null, 2)
              : type === "tool_call_ready"
                ? JSON.stringify(event.input ?? {}, null, 2)
                : String(event.inputAccumulated ?? ""),
          href: `/dispatches/${runId}`,
        });
      }
    }

    flush("thinking");
    flush("assistant");

    const pendingBreakpoint = tasks.find(
      (task) => {
        const record = asRecord(task);
        return (
          record?.kind === "breakpoint" &&
          record.status === "requested" &&
          typeof record.effectId === "string"
        );
      },
    ) as { effectId: string; breakpointQuestion?: string } | undefined;
    if (pendingBreakpoint) {
      timeline.push({
        id: `${runId}:breakpoint`,
        runId,
        kind: "approval",
        label: "Breakpoint review",
        text: pendingBreakpoint.breakpointQuestion ?? "Run is waiting on an approval breakpoint.",
        href: `/dispatches/${runId}?effectId=${encodeURIComponent(pendingBreakpoint.effectId)}`,
      });
    }

    if (status === "failed") {
      timeline.push({
        id: `${runId}:failed`,
        runId,
        kind: "error",
        label: "Run failed",
        text: String(run.failureMessage ?? run.failedStep ?? "Execution failed and needs recovery."),
        href: `/dispatches/${runId}`,
      });
    } else {
      timeline.push({
        id: `${runId}:final`,
        runId,
        kind: status === "completed" ? "complete" : "run",
        label: status === "completed" ? "Run completed" : "Latest run state",
        text: `${status} · ${Number(run.completedTasks ?? 0)}/${Number(run.totalTasks ?? 0)} tasks complete`,
        href: `/dispatches/${runId}`,
      });
    }
  }

  return timeline;
}
