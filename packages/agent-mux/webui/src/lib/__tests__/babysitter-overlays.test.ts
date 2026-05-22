import { describe, expect, it } from "vitest";

import type { KanbanBacklogSnapshot, KanbanBoardSnapshot, KanbanReviewArtifact } from "@a5c-ai/agent-mux-core/kanban";

import { createMockRun, createMockTaskEffect } from "@/test/fixtures";

import {
  buildBoardExecutionOverlays,
  buildRunHealthRecords,
  buildRunArtifactShortcuts,
  buildSessionTimeline,
} from "../babysitter-overlays";

function makeSnapshot(): KanbanBacklogSnapshot {
  return {
    generatedAt: "2026-04-24T12:00:00.000Z",
    projects: [
      {
        id: "kanban",
        key: "KANBAN",
        name: "Kanban",
        issueIds: ["issue-1", "issue-2"],
        labels: [],
        assignees: [],
        statuses: [],
        repositories: [],
        metrics: {
          totalIssues: 2,
          readyIssues: 0,
          blockedIssues: 0,
          dispatchedIssues: 0,
          completedIssues: 0,
          needsDecompositionIssues: 0,
          inProgressIssues: 0,
        },
      },
    ],
    issues: [
      {
        id: "issue-1",
        key: "KANBAN-GAP-008",
        projectId: "kanban",
        title: "Babysitter overlay",
        status: "review",
        priority: "high",
        labels: [],
        assignees: [],
        dependencies: [],
        acceptanceCriteria: [],
        decomposition: [],
        childIssueIds: [],
        createdAt: "2026-04-24T12:00:00.000Z",
        updatedAt: "2026-04-24T12:10:00.000Z",
        dispatch: {
          readiness: "dispatched",
          blockedReasons: [],
          runIds: ["run-1", "run-2"],
          sessionIds: ["session-1"],
        },
      },
      {
        id: "issue-2",
        key: "KANBAN-GAP-009",
        projectId: "kanban",
        title: "Follow-on",
        status: "todo",
        priority: "medium",
        labels: [],
        assignees: [],
        dependencies: [],
        acceptanceCriteria: [],
        decomposition: [],
        childIssueIds: [],
        createdAt: "2026-04-24T12:00:00.000Z",
        updatedAt: "2026-04-24T12:01:00.000Z",
        dispatch: {
          readiness: "ready",
          blockedReasons: [],
          runIds: [],
          sessionIds: [],
        },
      },
    ],
  } as KanbanBacklogSnapshot;
}

function makeBoard(): KanbanBoardSnapshot {
  return {
    generatedAt: "2026-04-24T12:00:00.000Z",
    projects: [
      {
        projectId: "kanban",
        projectKey: "KANBAN",
        projectName: "Kanban",
        generatedAt: "2026-04-24T12:00:00.000Z",
        columns: [
          { id: "todo", name: "Todo", issueIds: ["issue-2"], issueCount: 1, isOverLimit: false },
          { id: "in-progress", name: "In Progress", issueIds: [], issueCount: 0, isOverLimit: false },
          { id: "review", name: "Review", issueIds: ["issue-1"], issueCount: 1, isOverLimit: false },
          { id: "done", name: "Done", issueIds: [], issueCount: 0, isOverLimit: false },
        ],
        swimlanes: [{ id: "standard", name: "Standard", issueIds: ["issue-1", "issue-2"] }],
        policyHooks: [],
        cards: [
          {
            issueId: "issue-1",
            issueKey: "KANBAN-GAP-008",
            projectId: "kanban",
            title: "Babysitter overlay",
            workflowState: "review",
            swimlaneId: "standard",
            priority: "high",
            readiness: "dispatched",
            blocked: false,
            blockedReasons: [],
            labelNames: [],
            assigneeNames: [],
            dependencyCount: 0,
            childCount: 0,
            acceptanceProgress: { satisfied: 0, total: 0 },
            moveTargets: [],
            policySignals: [],
          },
          {
            issueId: "issue-2",
            issueKey: "KANBAN-GAP-009",
            projectId: "kanban",
            title: "Follow-on",
            workflowState: "todo",
            swimlaneId: "standard",
            priority: "medium",
            readiness: "ready",
            blocked: false,
            blockedReasons: [],
            labelNames: [],
            assigneeNames: [],
            dependencyCount: 0,
            childCount: 0,
            acceptanceProgress: { satisfied: 0, total: 0 },
            moveTargets: [],
            policySignals: [],
          },
        ],
      },
    ],
  } as KanbanBoardSnapshot;
}

describe("babysitter overlays", () => {
  it("maps linked runs into review and dispatch overlay stages", () => {
    const runs = [
      createMockRun({
        runId: "run-1",
        sessionId: "session-1",
        status: "waiting",
        updatedAt: "2026-04-24T12:09:00.000Z",
        waitingKind: "breakpoint",
        tasks: [
          createMockTaskEffect({
            effectId: "eff-breakpoint",
            kind: "breakpoint",
            status: "requested",
            breakpointQuestion: "Approve deploy?",
          }),
        ],
      }),
      createMockRun({
        runId: "run-2",
        sessionId: "session-1",
        status: "failed",
        updatedAt: "2026-04-24T12:08:00.000Z",
      }),
    ];
    const reviews: KanbanReviewArtifact[] = [
      {
        id: "artifact-1",
        targetType: "issue",
        targetId: "issue-1",
        targetLabel: "KANBAN-GAP-008",
        title: "Overlay review",
        decision: "pending",
        queueState: "queued",
        updatedAt: "2026-04-24T12:09:30.000Z",
        diff: [],
        comments: [],
      },
    ];

    const overlays = buildBoardExecutionOverlays({
      snapshot: makeSnapshot(),
      board: makeBoard(),
      runs,
      reviewArtifacts: reviews,
      nowMs: Date.parse("2026-04-24T12:10:00.000Z"),
    });

    expect(overlays[0]?.issueKey).toBe("KANBAN-GAP-008");
    expect(overlays[0]?.stage).toBe("recovery");
    expect(overlays[0]?.pendingBreakpoints).toBe(1);
    expect(overlays[0]?.retryCount).toBe(1);
    expect(overlays[1]?.stage).toBe("dispatch");
  });

  it("surfaces run health severity and deep review links", () => {
    const runs = [
      createMockRun({
        runId: "run-critical",
        sessionId: "session-health",
        status: "waiting",
        updatedAt: "2026-04-24T11:00:00.000Z",
        tasks: [
          createMockTaskEffect({
            effectId: "eff-health",
            kind: "breakpoint",
            status: "requested",
            breakpointQuestion: "Approve fix?",
          }),
        ],
      }),
      createMockRun({
        runId: "run-retry",
        sessionId: "session-health",
        status: "failed",
        updatedAt: "2026-04-24T10:00:00.000Z",
      }),
    ];

    const health = buildRunHealthRecords(runs, Date.parse("2026-04-24T12:10:00.000Z"));

    expect(health[0]?.runId).toBe("run-critical");
    expect(health[0]?.severity).toBe("critical");
    expect(health[0]?.retryCount).toBe(1);
    expect(health[0]?.reviewHref).toBe("/dispatches/run-critical?effectId=eff-health");
  });

  it("builds artifact shortcuts and merged session timeline entries", () => {
    const runs = [
      {
        runId: "run-session",
        processId: "kanban/process",
        status: "completed",
        startedAt: 1,
        completedTasks: 1,
        totalTasks: 1,
        tasks: [
          {
            effectId: "eff-session",
            kind: "shell",
            status: "resolved",
            stdout: "ok",
            result: { ok: true },
          },
        ],
      },
    ];
    const shortcuts = buildRunArtifactShortcuts(runs);
    const timeline = buildSessionTimeline(runs, {
      "run-session": {
        events: [
          { type: "user_message", text: "Run it" },
          { type: "text_delta", delta: "Done" },
          { type: "message_stop", text: "Done" },
        ],
      },
    });

    expect(shortcuts[0]?.logTaskCount).toBe(1);
    expect(shortcuts[0]?.resultTaskCount).toBe(1);
    expect(timeline.some((item) => item.kind === "user" && item.text === "Run it")).toBe(true);
    expect(timeline.some((item) => item.kind === "complete")).toBe(true);
  });
});
