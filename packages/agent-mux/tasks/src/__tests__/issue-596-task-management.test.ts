import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { GitNativeBackend } from "../backends/git-native.js";
import type { BreakpointContext, BreakpointRouting } from "../types.js";
import {
  BreakpointSchema,
  BreakpointStatusSchema,
  TaskPrioritySchema,
  validateBreakpointTransition,
} from "../types.js";

const NOW = "2026-05-30T12:00:00.000Z";

function makeContext(overrides: Partial<BreakpointContext> = {}): BreakpointContext {
  return {
    description: "A task-management breakpoint",
    codeSnippets: [],
    fileReferences: [],
    tags: [],
    ...overrides,
  };
}

function makeRouting(overrides: Partial<BreakpointRouting> = {}): BreakpointRouting {
  return {
    strategy: "single",
    targetResponders: [],
    timeoutMs: 1_800_000,
    presentToUser: true,
    ...overrides,
  };
}

let tmpDir: string;
let breakpointsDir: string;

describe("issue #596 task-management primitives", () => {
  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tasks-mux-596-"));
    breakpointsDir = path.join(tmpDir, ".breakpoints");
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("extends schemas additively while accepting legacy breakpoint JSON", () => {
    expect(TaskPrioritySchema.options).toEqual(["low", "medium", "high", "critical"]);
    expect(BreakpointStatusSchema.options).toEqual([
      "pending",
      "routed",
      "claimed",
      "answered",
      "completed",
      "expired",
      "cancelled",
      "assigned",
      "in-progress",
      "blocked",
      "escalated",
    ]);

    const legacy = BreakpointSchema.parse({
      id: "bp-legacy",
      text: "Legacy breakpoint",
      context: makeContext(),
      status: "pending",
      routing: makeRouting(),
      answers: [],
      createdAt: NOW,
      updatedAt: NOW,
      expiresAt: "2026-05-30T12:30:00.000Z",
    });

    expect(legacy.priority).toBeUndefined();
    expect(legacy.dependsOn).toEqual([]);
    expect(legacy.comments).toEqual([]);
    expect(legacy.history).toEqual([]);
    expect(legacy.auditLog).toEqual([]);
  });

  it("validates lifecycle transitions and rejects invalid terminal-state changes", () => {
    expect(validateBreakpointTransition("pending", "assigned").valid).toBe(true);
    expect(validateBreakpointTransition("assigned", "in-progress").valid).toBe(true);
    expect(validateBreakpointTransition("in-progress", "blocked").valid).toBe(true);
    expect(validateBreakpointTransition("blocked", "in-progress").valid).toBe(true);
    expect(validateBreakpointTransition("in-progress", "completed").valid).toBe(true);

    const invalid = validateBreakpointTransition("completed", "in-progress");
    expect(invalid.valid).toBe(false);
    expect(invalid.reason).toMatch(/terminal/i);
  });

  it("persists priority, dependencies, assignment, comments, history, audit, metrics, and export data in git-native", async () => {
    const backend = new GitNativeBackend({ breakpointsDir });
    const parent = await backend.submitBreakpoint({
      text: "Prepare release checklist",
      context: makeContext({ tags: ["release"], domain: "ops" }),
      routing: makeRouting({ targetResponders: ["maintainer"] }),
    });
    const child = await backend.submitBreakpoint({
      text: "Run release verification",
      context: makeContext({ tags: ["release", "qa"], domain: "qa" }),
      routing: makeRouting({ targetResponders: ["codex"] }),
      priority: "critical",
      dependsOn: [{ id: parent.id, requiredStatus: "completed" }],
    });

    await backend.assignBreakpoint(child.id, {
      assigneeId: "codex",
      assigneeName: "Codex",
      actorId: "maintainer",
    });
    await backend.addBreakpointComment(child.id, {
      authorId: "maintainer",
      authorName: "Maintainer",
      text: "Blocked until release checklist is complete.",
    });
    await backend.transitionBreakpoint(child.id, {
      status: "blocked",
      actorId: "codex",
      message: "Waiting for dependency",
    });

    const stored = await backend.getBreakpoint(child.id);
    expect(stored.priority).toBe("critical");
    expect(stored.dependsOn).toEqual([{ id: parent.id, requiredStatus: "completed", blocking: true }]);
    expect(stored.assigneeId).toBe("codex");
    expect(stored.comments).toHaveLength(1);
    expect(stored.history).toEqual(expect.arrayContaining([
      expect.objectContaining({ fromStatus: "pending", toStatus: "assigned" }),
      expect.objectContaining({ fromStatus: "assigned", toStatus: "blocked" }),
    ]));
    expect(stored.history.map((entry) => entry.toStatus)).toContain("blocked");
    expect(stored.auditLog.map((entry) => entry.action)).toEqual(
      expect.arrayContaining(["breakpoint.created", "breakpoint.assigned", "comment.added", "status.changed"]),
    );

    const search = await backend.searchBreakpoints({
      query: "verification",
      status: ["blocked"],
      priority: ["critical"],
      assigneeId: "codex",
      tags: ["release"],
      sortBy: "priority",
      sortDirection: "desc",
      limit: 10,
    });
    expect(search.total).toBe(1);
    expect(search.items[0]?.id).toBe(child.id);

    const metrics = await backend.getBreakpointMetrics();
    expect(metrics.total).toBe(2);
    expect(metrics.byPriority.critical).toBe(1);
    expect(metrics.byStatus.blocked).toBe(1);

    const storedPath = path.join(breakpointsDir, `${child.id}.json`);
    const storedJson = JSON.parse(await fs.readFile(storedPath, "utf-8")) as Record<string, unknown>;
    await fs.writeFile(storedPath, JSON.stringify({
      ...storedJson,
      context: {
        ...(storedJson.context as Record<string, unknown>),
        metadata: { slackToken: "SLACK_TOKEN_SHOULD_NOT_EXPORT" },
      },
      notifications: [{
        provider: "slack",
        enabled: false,
        target: "https://hooks.example.test/SECRET",
        secretEnv: "SLACK_WEBHOOK_SECRET",
      }],
      auditLog: [
        ...((storedJson.auditLog as unknown[]) ?? []),
        {
          id: "audit-secret",
          action: "provider.configured",
          at: NOW,
          redacted: false,
          metadata: { apiToken: "TOKEN_SHOULD_NOT_EXPORT" },
        },
      ],
    }, null, 2) + "\n", "utf-8");

    const exported = await backend.exportBreakpoints({ status: ["blocked"] });
    expect(exported.schemaVersion).toBe(1);
    expect(exported.items).toHaveLength(1);
    expect(JSON.stringify(exported)).not.toContain("SLACK_TOKEN_SHOULD_NOT_EXPORT");
    expect(JSON.stringify(exported)).not.toContain("SLACK_WEBHOOK_SECRET");
    expect(JSON.stringify(exported)).not.toContain("TOKEN_SHOULD_NOT_EXPORT");
  });

  it("reports per-item bulk operation success and typed failures", async () => {
    const backend = new GitNativeBackend({ breakpointsDir });
    const first = await backend.submitBreakpoint({
      text: "First task",
      context: makeContext(),
      routing: makeRouting(),
    });
    const second = await backend.submitBreakpoint({
      text: "Second task",
      context: makeContext(),
      routing: makeRouting(),
    });

    const result = await backend.bulkUpdateBreakpoints({
      ids: [first.id, second.id, "missing"],
      action: "reassign",
      assigneeId: "maintainer",
      actorId: "system",
    });

    expect(result.total).toBe(3);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.items).toEqual([
      expect.objectContaining({ id: first.id, ok: true }),
      expect.objectContaining({ id: second.id, ok: true }),
      expect.objectContaining({ id: "missing", ok: false, errorCode: "not_found" }),
    ]);
  });

  it("blocks answering a dependent breakpoint until blocking prerequisites are satisfied", async () => {
    const backend = new GitNativeBackend({ breakpointsDir });
    const prerequisite = await backend.submitBreakpoint({
      text: "Complete prerequisite",
      context: makeContext(),
      routing: makeRouting(),
    });
    const dependent = await backend.submitBreakpoint({
      text: "Approve dependent work",
      context: makeContext(),
      routing: makeRouting(),
      dependsOn: [{ id: prerequisite.id, requiredStatus: "completed" }],
    });

    await expect(backend.answerBreakpoint(dependent.id, {
      responderId: "codex",
      responderName: "Codex",
      text: "Approved too early",
      approved: true,
    })).rejects.toThrow(/blocking dependencies/i);

    await backend.transitionBreakpoint(prerequisite.id, {
      status: "completed",
      actorId: "codex",
    });

    await expect(backend.answerBreakpoint(dependent.id, {
      responderId: "codex",
      responderName: "Codex",
      text: "Approved after prerequisite",
      approved: true,
    })).resolves.toMatchObject({
      breakpointId: dependent.id,
      approved: true,
    });
  });

  it("reports dependency-blocked bulk close failures and succeeds after prerequisites complete", async () => {
    const backend = new GitNativeBackend({ breakpointsDir });
    const prerequisite = await backend.submitBreakpoint({
      text: "Complete parent task",
      context: makeContext(),
      routing: makeRouting(),
    });
    const independent = await backend.submitBreakpoint({
      text: "Close independent task",
      context: makeContext(),
      routing: makeRouting(),
    });
    const dependent = await backend.submitBreakpoint({
      text: "Close dependent task",
      context: makeContext(),
      routing: makeRouting(),
      dependsOn: [{ id: prerequisite.id, requiredStatus: "completed" }],
    });

    const blockedResult = await backend.bulkUpdateBreakpoints({
      ids: [independent.id, dependent.id],
      action: "close",
      actorId: "codex",
    });

    expect(blockedResult).toMatchObject({
      total: 2,
      succeeded: 1,
      failed: 1,
    });
    expect(blockedResult.items).toEqual([
      expect.objectContaining({ id: independent.id, ok: true }),
      expect.objectContaining({ id: dependent.id, ok: false, errorCode: "invalid_transition" }),
    ]);

    await backend.transitionBreakpoint(prerequisite.id, {
      status: "completed",
      actorId: "codex",
    });

    const unblockedResult = await backend.bulkUpdateBreakpoints({
      ids: [dependent.id],
      action: "close",
      actorId: "codex",
    });

    expect(unblockedResult).toMatchObject({
      total: 1,
      succeeded: 1,
      failed: 0,
    });
    await expect(backend.getBreakpoint(dependent.id)).resolves.toMatchObject({
      status: "completed",
    });
  });

  it("applies lifecycle validation to claim, answer, and cancel mutations", async () => {
    const backend = new GitNativeBackend({ breakpointsDir });
    const breakpoint = await backend.submitBreakpoint({
      text: "Validated task",
      context: makeContext(),
      routing: makeRouting(),
    });

    const claimed = await backend.claimBreakpoint(breakpoint.id, "codex");
    expect(claimed.history.at(-1)).toEqual(expect.objectContaining({
      fromStatus: "pending",
      toStatus: "claimed",
    }));

    await backend.answerBreakpoint(breakpoint.id, {
      responderId: "codex",
      responderName: "Codex",
      text: "Done",
    });

    const answered = await backend.getBreakpoint(breakpoint.id);
    expect(answered.history.at(-1)).toEqual(expect.objectContaining({
      fromStatus: "claimed",
      toStatus: "answered",
    }));

    await expect(backend.cancelBreakpoint(breakpoint.id)).rejects.toThrow(/terminal status/i);
  });
});
