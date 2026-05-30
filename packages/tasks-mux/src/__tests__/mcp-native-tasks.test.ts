import { describe, expect, it, vi } from "vitest";
import type { BreakpointBackend } from "../backend.js";
import type { Breakpoint, BreakpointPublicAnswer, BreakpointWaitResult } from "../types.js";
import {
  handleAddComment,
  handleAddCommentToBreakpoint,
  handleAssignTask,
  handleBulkUpdateTasks,
  handleCancelBreakpoint,
  handleCreateTask,
  handleCreateTodo,
  handleEscalate,
  handleEscalateBreakpoint,
  handleExportTasks,
  handleSearchTasks,
  handleTaskStats,
} from "../mcp/tools/native-tasks.js";

const NOW = "2026-05-30T00:00:00.000Z";

function makeBreakpoint(overrides: Partial<Breakpoint> = {}): Breakpoint {
  return {
    id: overrides.id ?? "bp-001",
    text: overrides.text ?? "Default task",
    context: {
      description: "Default task",
      codeSnippets: [],
      fileReferences: [],
      tags: ["task"],
      ...overrides.context,
    },
    status: overrides.status ?? "pending",
    routing: {
      strategy: "single",
      targetResponders: [],
      timeoutMs: 30_000,
      presentToUser: true,
      ...overrides.routing,
    },
    answers: overrides.answers ?? [],
    selectedAnswer: overrides.selectedAnswer,
    projectId: overrides.projectId,
    repoId: overrides.repoId,
    createdAt: overrides.createdAt ?? NOW,
    updatedAt: overrides.updatedAt ?? NOW,
    expiresAt: overrides.expiresAt ?? NOW,
    assigneeId: overrides.assigneeId,
    assigneeName: overrides.assigneeName,
    claimedByResponderId: overrides.claimedByResponderId,
    claimedByResponderName: overrides.claimedByResponderName,
    createdBy: overrides.createdBy,
  };
}

function createMockBackend(existing: Breakpoint[] = []): BreakpointBackend {
  const byId = new Map(existing.map((breakpoint) => [breakpoint.id, breakpoint]));
  return {
    name: "mock",
    submitBreakpoint: vi.fn(async (params) => {
      const breakpoint = makeBreakpoint({
        id: `bp-${byId.size + 1}`,
        text: params.text,
        context: params.context,
        routing: params.routing,
        projectId: params.projectId,
        repoId: params.repoId,
      });
      byId.set(breakpoint.id, breakpoint);
      return breakpoint;
    }),
    getBreakpoint: vi.fn(async (id) => {
      const breakpoint = byId.get(id);
      if (!breakpoint) throw new Error("not found");
      return breakpoint;
    }),
    waitForAnswer: vi.fn(async (id) => ({
      answered: false,
      breakpoint: byId.get(id) ?? makeBreakpoint({ id }),
      allAnswers: [],
      elapsedMs: 0,
    } satisfies BreakpointWaitResult)),
    listPendingBreakpoints: vi.fn(async () => [...byId.values()]),
    answerBreakpoint: vi.fn(async (_id, answer) => ({
      id: "answer-1",
      breakpointId: "bp-001",
      responderId: answer.responderId,
      responderName: answer.responderName,
      text: answer.text,
      confidence: answer.confidence ?? 100,
      references: answer.references ?? [],
      followUpQuestions: answer.followUpQuestions ?? [],
      answeredAt: NOW,
    } satisfies BreakpointPublicAnswer)),
    cancelBreakpoint: vi.fn(async () => {}),
    searchBreakpoints: vi.fn(async () => ({
      items: [...byId.values()],
      total: byId.size,
      offset: 0,
      limit: byId.size,
    })),
    assignBreakpoint: vi.fn(async (id, params) => {
      const breakpoint = byId.get(id);
      if (!breakpoint) throw new Error("not found");
      const updated = makeBreakpoint({
        ...breakpoint,
        status: "assigned",
        assigneeId: params.assigneeId,
        assigneeName: params.assigneeName,
      });
      byId.set(id, updated);
      return updated;
    }),
    addBreakpointComment: vi.fn(async (_id, params) => ({
      id: "comment-1",
      authorId: params.authorId,
      authorName: params.authorName,
      text: params.text,
      createdAt: NOW,
    })),
    bulkUpdateBreakpoints: vi.fn(async (params) => ({
      total: params.ids.length,
      succeeded: params.ids.length,
      failed: 0,
      items: params.ids.map((id) => ({ id, ok: true })),
    })),
    getBreakpointMetrics: vi.fn(async () => ({
      total: byId.size,
      byStatus: { pending: byId.size },
      byPriority: { medium: byId.size },
    })),
    exportBreakpoints: vi.fn(async () => ({
      schemaVersion: 1,
      exportedAt: NOW,
      total: byId.size,
      items: [...byId.values()],
    })),
  };
}

describe("native task MCP handlers", () => {
  it("create_todo submits a notification breakpoint with native metadata", async () => {
    const backend = createMockBackend();

    const result = await handleCreateTodo({
      title: "Write release notes",
      description: "Summarize merged tasks-mux work",
      tags: ["release"],
      domain: "docs",
      responderType: "human",
      responderId: "maintainer",
    }, backend);

    expect(result.tool).toBe("create_todo");
    expect(result.taskId).toBe("bp-1");
    expect(backend.submitBreakpoint).toHaveBeenCalledWith(expect.objectContaining({
      text: "Write release notes",
      context: expect.objectContaining({
        interactionKind: "notification",
        domain: "docs",
        tags: ["todo", "release"],
        metadata: expect.objectContaining({
          nativeTool: "create_todo",
          nativeKind: "todo",
        }),
      }),
      routing: expect.objectContaining({
        targetResponders: ["maintainer"],
        responderType: "human",
      }),
    }));
  });

  it("assign_task submits a handoff routed to the assignee", async () => {
    const backend = createMockBackend();

    await handleAssignTask({
      title: "Run adapter QA",
      instructions: "Check unavailable adapter behavior",
      assignee: "codex",
      responderType: "agent",
      adapter: "codex",
      model: "gpt-5.4",
    }, backend);

    expect(backend.submitBreakpoint).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({
        interactionKind: "handoff",
        metadata: expect.objectContaining({
          nativeTool: "assign_task",
          nativeKind: "task",
          assignee: "codex",
        }),
      }),
      routing: expect.objectContaining({
        targetResponders: ["codex"],
        responderType: "agent",
        adapter: "codex",
        model: "gpt-5.4",
        presentToUser: false,
      }),
    }));
  });

  it("create_task records the public alias in native metadata", async () => {
    const backend = createMockBackend();

    const result = await handleCreateTask({
      title: "Implement CLI parity",
      instructions: "Add breakpoint lifecycle aliases",
      responderId: "codex",
      responderType: "agent",
    }, backend);

    expect(result.tool).toBe("create_task");
    expect(backend.submitBreakpoint).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({
        interactionKind: "handoff",
        metadata: expect.objectContaining({
          nativeTool: "create_task",
          nativeKind: "task",
        }),
      }),
      routing: expect.objectContaining({
        targetResponders: ["codex"],
        responderType: "agent",
      }),
    }));
  });

  it("search_tasks filters pending backend tasks by query, tags, responder, and limit", async () => {
    const backend = createMockBackend([
      makeBreakpoint({
        id: "bp-alpha",
        text: "Alpha docs task",
        context: { description: "write docs", codeSnippets: [], fileReferences: [], tags: ["docs"], domain: "docs" },
        routing: { strategy: "single", targetResponders: ["maintainer"], timeoutMs: 1, presentToUser: true },
      }),
      makeBreakpoint({
        id: "bp-beta",
        text: "Beta test task",
        context: { description: "write tests", codeSnippets: [], fileReferences: [], tags: ["tests"], domain: "qa" },
        routing: { strategy: "single", targetResponders: ["codex"], timeoutMs: 1, presentToUser: false },
      }),
    ]);

    const result = await handleSearchTasks({
      query: "docs",
      tags: ["docs"],
      responderId: "maintainer",
      limit: 1,
    }, backend);

    expect(result).toMatchObject({
      tool: "search_tasks",
      count: 2,
      tasks: [{ id: "bp-alpha" }, { id: "bp-beta" }],
    });
    expect(backend.searchBreakpoints).toHaveBeenCalledWith(expect.objectContaining({
      query: "docs",
      tags: ["docs"],
      responderId: "maintainer",
      limit: 1,
    }));
  });

  it("assign_task reassigns an existing backend task when taskId is provided", async () => {
    const backend = createMockBackend([makeBreakpoint({ id: "bp-existing" })]);

    const result = await handleAssignTask({
      taskId: "bp-existing",
      title: "Reassign existing",
      assignee: "maintainer",
    }, backend);

    expect(result.taskId).toBe("bp-existing");
    expect(result.breakpoint.assigneeId).toBe("maintainer");
    expect(backend.assignBreakpoint).toHaveBeenCalledWith("bp-existing", {
      assigneeId: "maintainer",
      actorId: undefined,
    });
  });

  it("delegates comments, bulk updates, stats, and export to backend task-management methods", async () => {
    const backend = createMockBackend([makeBreakpoint({ id: "bp-existing" })]);

    await expect(handleAddComment({
      taskId: "bp-existing",
      authorId: "maintainer",
      text: "Ready for review",
    }, backend)).resolves.toMatchObject({ tool: "add_comment", comment: { id: "comment-1" } });
    await expect(handleAddCommentToBreakpoint({
      breakpointId: "bp-existing",
      authorId: "maintainer",
      text: "Ready for review",
    }, backend)).resolves.toMatchObject({ tool: "add_comment_to_breakpoint", breakpointId: "bp-existing" });
    await expect(handleCancelBreakpoint({
      breakpointId: "bp-existing",
    }, backend)).resolves.toMatchObject({ tool: "cancel_breakpoint", breakpointId: "bp-existing", cancelled: true });

    await expect(handleBulkUpdateTasks({
      ids: ["bp-existing"],
      action: "reassign",
      assigneeId: "codex",
    }, backend)).resolves.toMatchObject({ tool: "bulk_update_tasks", total: 1, succeeded: 1 });

    await expect(handleTaskStats({}, backend)).resolves.toMatchObject({ tool: "task_stats", total: 1 });
    await expect(handleExportTasks({}, backend)).resolves.toMatchObject({ tool: "export_tasks", schemaVersion: 1, total: 1 });
  });

  it("escalate creates a high urgency intervention referencing an existing task", async () => {
    const backend = createMockBackend([
      makeBreakpoint({ id: "bp-source", text: "Blocked routed task" }),
    ]);

    await handleEscalate({
      taskId: "bp-source",
      reason: "Adapter timed out twice",
      targetResponderId: "maintainer",
    }, backend);

    expect(backend.submitBreakpoint).toHaveBeenCalledWith(expect.objectContaining({
      text: "Escalate: Blocked routed task",
      context: expect.objectContaining({
        interactionKind: "intervention",
        urgency: "high",
        metadata: expect.objectContaining({
          nativeTool: "escalate",
          nativeKind: "escalation",
          escalatedTaskId: "bp-source",
        }),
      }),
      routing: expect.objectContaining({
        responderType: "human",
        targetResponders: ["maintainer"],
      }),
    }));
  });

  it("escalate_breakpoint records the public alias in result metadata", async () => {
    const backend = createMockBackend([
      makeBreakpoint({ id: "bp-source", text: "Blocked routed task" }),
    ]);

    const result = await handleEscalateBreakpoint({
      breakpointId: "bp-source",
      reason: "Adapter timed out twice",
    }, backend);

    expect(result).toMatchObject({
      tool: "escalate_breakpoint",
      metadata: {
        nativeTool: "escalate_breakpoint",
      },
    });
  });
});
