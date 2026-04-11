/**
 * types.phase1.test.ts
 *
 * Phase 1 "Foundation Enhancement" type contract tests.
 *
 * Tests for NEW types that don't exist yet in types.ts:
 *   - EffectKind
 *   - EffectSummary
 *   - TaskSummary
 *   - BreakpointState
 *   - OrchestrationPhase
 *   - OrchestrationStatus
 *   - TokenUsage
 *
 * These imports will fail at compile time until the types are implemented,
 * which is the correct TDD Red phase behaviour.
 */

import { describe, it, expect } from "vitest";
import type {
  EffectKind,
  EffectSummary,
  TaskSummary,
  BreakpointState,
  OrchestrationPhase,
  OrchestrationStatus,
  TokenUsage,
} from "../types.js";

// ---------------------------------------------------------------------------
// EffectKind
// ---------------------------------------------------------------------------

describe("EffectKind values", () => {
  it("includes the four known effect kinds", () => {
    const kinds: EffectKind[] = [
      "node",
      "breakpoint",
      "orchestrator_task",
      "sleep",
    ];
    expect(kinds).toHaveLength(4);
    expect(new Set(kinds).size).toBe(4);
  });

  it("accepts arbitrary string values (extensible union)", () => {
    const custom: EffectKind = "custom_effect";
    expect(custom).toBe("custom_effect");
  });
});

// ---------------------------------------------------------------------------
// TokenUsage
// ---------------------------------------------------------------------------

describe("TokenUsage shape", () => {
  it("requires input, output, and total fields", () => {
    const usage: TokenUsage = {
      input: 1000,
      output: 500,
      total: 1500,
    };
    expect(usage.input).toBe(1000);
    expect(usage.output).toBe(500);
    expect(usage.total).toBe(1500);
  });

  it("accepts optional cacheRead and cacheWrite fields", () => {
    const usage: TokenUsage = {
      input: 2000,
      output: 800,
      total: 2800,
      cacheRead: 500,
      cacheWrite: 300,
    };
    expect(usage.cacheRead).toBe(500);
    expect(usage.cacheWrite).toBe(300);
  });

  it("has undefined cache fields when not provided", () => {
    const usage: TokenUsage = {
      input: 100,
      output: 50,
      total: 150,
    };
    expect(usage.cacheRead).toBeUndefined();
    expect(usage.cacheWrite).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// EffectSummary
// ---------------------------------------------------------------------------

describe("EffectSummary shape", () => {
  it("requires effectId, kind, and status fields", () => {
    const summary: EffectSummary = {
      effectId: "eff-001",
      kind: "node",
      status: "pending",
    };
    expect(summary.effectId).toBe("eff-001");
    expect(summary.kind).toBe("node");
    expect(summary.status).toBe("pending");
  });

  it("accepts all three status values", () => {
    const statuses: EffectSummary["status"][] = [
      "pending",
      "resolved",
      "failed",
    ];
    expect(statuses).toHaveLength(3);
    expect(new Set(statuses).size).toBe(3);
  });

  it("accepts optional title, elapsedMs, and error fields", () => {
    const summary: EffectSummary = {
      effectId: "eff-002",
      kind: "breakpoint",
      status: "failed",
      title: "Confirm deployment",
      elapsedMs: 12345,
      error: "Timed out waiting for approval",
    };
    expect(summary.title).toBe("Confirm deployment");
    expect(summary.elapsedMs).toBe(12345);
    expect(summary.error).toBe("Timed out waiting for approval");
  });

  it("has undefined optional fields when not provided", () => {
    const summary: EffectSummary = {
      effectId: "eff-003",
      kind: "sleep",
      status: "resolved",
    };
    expect(summary.title).toBeUndefined();
    expect(summary.elapsedMs).toBeUndefined();
    expect(summary.error).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// TaskSummary
// ---------------------------------------------------------------------------

describe("TaskSummary shape", () => {
  it("requires taskId, effectId, kind, title, and status fields", () => {
    const task: TaskSummary = {
      taskId: "task-001",
      effectId: "eff-001",
      kind: "node",
      title: "Run linter",
      status: "pending",
    };
    expect(task.taskId).toBe("task-001");
    expect(task.effectId).toBe("eff-001");
    expect(task.kind).toBe("node");
    expect(task.title).toBe("Run linter");
    expect(task.status).toBe("pending");
  });

  it("accepts optional timing fields", () => {
    const task: TaskSummary = {
      taskId: "task-002",
      effectId: "eff-002",
      kind: "orchestrator_task",
      title: "Plan phase",
      status: "resolved",
      startedAt: "2026-04-09T10:00:00Z",
      completedAt: "2026-04-09T10:01:30Z",
      elapsedMs: 90000,
    };
    expect(task.startedAt).toBe("2026-04-09T10:00:00Z");
    expect(task.completedAt).toBe("2026-04-09T10:01:30Z");
    expect(task.elapsedMs).toBe(90000);
  });

  it("has undefined timing fields when not provided", () => {
    const task: TaskSummary = {
      taskId: "task-003",
      effectId: "eff-003",
      kind: "sleep",
      title: "Wait 5 minutes",
      status: "pending",
    };
    expect(task.startedAt).toBeUndefined();
    expect(task.completedAt).toBeUndefined();
    expect(task.elapsedMs).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// BreakpointState
// ---------------------------------------------------------------------------

describe("BreakpointState shape", () => {
  it("requires breakpointId, title, and approved fields", () => {
    const bp: BreakpointState = {
      breakpointId: "confirm.deploy",
      title: "Confirm deployment to production",
      approved: null,
    };
    expect(bp.breakpointId).toBe("confirm.deploy");
    expect(bp.title).toBe("Confirm deployment to production");
    expect(bp.approved).toBeNull();
  });

  it("approved can be true, false, or null", () => {
    const pending: BreakpointState = {
      breakpointId: "bp-1",
      title: "Approve",
      approved: null,
    };
    const approved: BreakpointState = {
      breakpointId: "bp-2",
      title: "Approve",
      approved: true,
    };
    const rejected: BreakpointState = {
      breakpointId: "bp-3",
      title: "Approve",
      approved: false,
    };
    expect(pending.approved).toBeNull();
    expect(approved.approved).toBe(true);
    expect(rejected.approved).toBe(false);
  });

  it("accepts optional response, feedback, expert, tags, autoApproval", () => {
    const bp: BreakpointState = {
      breakpointId: "confirm.star-repo",
      title: "Star the repository?",
      approved: true,
      response: "Yes, go ahead",
      feedback: "Looks good",
      expert: "reviewer",
      tags: ["deploy", "prod"],
      autoApproval: { recommended: true, reason: "Rule match" },
    };
    expect(bp.response).toBe("Yes, go ahead");
    expect(bp.feedback).toBe("Looks good");
    expect(bp.expert).toBe("reviewer");
    expect(bp.tags).toEqual(["deploy", "prod"]);
    expect(bp.autoApproval).toEqual({
      recommended: true,
      reason: "Rule match",
    });
  });

  it("has undefined optional fields when not provided", () => {
    const bp: BreakpointState = {
      breakpointId: "bp-minimal",
      title: "Minimal breakpoint",
      approved: null,
    };
    expect(bp.response).toBeUndefined();
    expect(bp.feedback).toBeUndefined();
    expect(bp.expert).toBeUndefined();
    expect(bp.tags).toBeUndefined();
    expect(bp.autoApproval).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// OrchestrationPhase
// ---------------------------------------------------------------------------

describe("OrchestrationPhase values", () => {
  it("includes all six phase literals", () => {
    const phases: OrchestrationPhase[] = [
      "planning",
      "executing",
      "verifying",
      "waiting",
      "complete",
      "failed",
    ];
    expect(phases).toHaveLength(6);
    expect(new Set(phases).size).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// OrchestrationStatus
// ---------------------------------------------------------------------------

describe("OrchestrationStatus shape", () => {
  it("requires all mandatory fields", () => {
    const status: OrchestrationStatus = {
      runId: "run-abc-123",
      iteration: 3,
      phase: "executing",
      totalEffects: 10,
      pendingEffects: 4,
      resolvedEffects: 6,
      elapsedMs: 45000,
    };
    expect(status.runId).toBe("run-abc-123");
    expect(status.iteration).toBe(3);
    expect(status.phase).toBe("executing");
    expect(status.totalEffects).toBe(10);
    expect(status.pendingEffects).toBe(4);
    expect(status.resolvedEffects).toBe(6);
    expect(status.elapsedMs).toBe(45000);
  });

  it("accepts optional tokenUsage field", () => {
    const status: OrchestrationStatus = {
      runId: "run-def-456",
      iteration: 1,
      phase: "planning",
      totalEffects: 0,
      pendingEffects: 0,
      resolvedEffects: 0,
      elapsedMs: 1000,
      tokenUsage: {
        input: 5000,
        output: 2000,
        total: 7000,
      },
    };
    expect(status.tokenUsage).toBeDefined();
    expect(status.tokenUsage!.total).toBe(7000);
  });

  it("accepts optional cost field", () => {
    const status: OrchestrationStatus = {
      runId: "run-ghi-789",
      iteration: 5,
      phase: "complete",
      totalEffects: 20,
      pendingEffects: 0,
      resolvedEffects: 20,
      elapsedMs: 120000,
      cost: 0.0523,
    };
    expect(status.cost).toBe(0.0523);
  });

  it("has undefined optional fields when not provided", () => {
    const status: OrchestrationStatus = {
      runId: "run-minimal",
      iteration: 0,
      phase: "waiting",
      totalEffects: 0,
      pendingEffects: 0,
      resolvedEffects: 0,
      elapsedMs: 0,
    };
    expect(status.tokenUsage).toBeUndefined();
    expect(status.cost).toBeUndefined();
  });

  it("effect counts are internally consistent", () => {
    const status: OrchestrationStatus = {
      runId: "run-consistent",
      iteration: 7,
      phase: "executing",
      totalEffects: 15,
      pendingEffects: 5,
      resolvedEffects: 10,
      elapsedMs: 60000,
    };
    expect(status.pendingEffects + status.resolvedEffects).toBe(
      status.totalEffects
    );
  });
});
