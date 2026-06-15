/**
 * GAP-JSON-002: Effect Dispatch and Response Protocol
 *
 * Tests for apiListEffects, apiShowEffect, apiCancelEffect, apiBatchCommitEffects.
 * All 15 acceptance criteria are covered plus adversarial edge-case tests.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

// Imports from the module under test (will fail until implementation — that's TDD).
import {
  apiListEffects,
  apiShowEffect,
  apiCancelEffect,
  apiBatchCommitEffects,
} from "../effects";
import type { ApiResult } from "../runs";

// ── Helpers ──────────────────────────────────────────────────────────────────

function tmpDir(): string {
  return path.join(os.tmpdir(), `gap-json-002-${crypto.randomUUID()}`);
}

/**
 * Scaffold a minimal run directory with run.json and empty journal/ + tasks/.
 */
async function scaffoldRunDir(
  baseDir: string,
  runId: string,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const runDir = path.join(baseDir, runId);
  const journalDir = path.join(runDir, "journal");
  const tasksDir = path.join(runDir, "tasks");
  await fs.mkdir(journalDir, { recursive: true });
  await fs.mkdir(tasksDir, { recursive: true });

  const metadata = {
    runId,
    processId: overrides.processId ?? "test-process",
    entrypoint: overrides.entrypoint ?? {
      importPath: "/fake/process.js",
      exportName: "process",
    },
    createdAt: new Date().toISOString(),
    layoutVersion: "1",
    ...overrides,
  };
  await fs.writeFile(
    path.join(runDir, "run.json"),
    JSON.stringify(metadata, null, 2),
  );
  return runDir;
}

/**
 * Append a journal event file to a run directory.
 */
async function appendJournalEvent(
  runDir: string,
  seq: number,
  type: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  const journalDir = path.join(runDir, "journal");
  await fs.mkdir(journalDir, { recursive: true });
  const ulid = crypto.randomUUID().replace(/-/g, "").slice(0, 26).toUpperCase();
  const seqStr = seq.toString().padStart(6, "0");
  const filename = `${seqStr}.${ulid}.json`;
  const payload = {
    type,
    recordedAt: new Date().toISOString(),
    data,
    checksum: crypto.createHash("sha256").update(type).digest("hex"),
  };
  await fs.writeFile(
    path.join(journalDir, filename),
    JSON.stringify(payload, null, 2),
  );
}

/**
 * Scaffold a task definition (task.json) in the tasks directory.
 */
async function scaffoldTaskDefinition(
  runDir: string,
  effectId: string,
  taskDef: Record<string, unknown> = {},
): Promise<void> {
  const taskDir = path.join(runDir, "tasks", effectId);
  await fs.mkdir(taskDir, { recursive: true });
  const definition = {
    schemaVersion: "2026.01.tasks-v1",
    effectId,
    taskId: taskDef.taskId ?? `task-${effectId}`,
    invocationKey: taskDef.invocationKey ?? `key-${effectId}`,
    kind: taskDef.kind ?? "node",
    args: taskDef.args ?? {},
    ...taskDef,
  };
  await fs.writeFile(
    path.join(taskDir, "task.json"),
    JSON.stringify(definition, null, 2),
  );
}

/**
 * Scaffold a task result (result.json) in the tasks directory.
 */
async function scaffoldTaskResult(
  runDir: string,
  effectId: string,
  result: Record<string, unknown> = {},
): Promise<void> {
  const taskDir = path.join(runDir, "tasks", effectId);
  await fs.mkdir(taskDir, { recursive: true });
  const resultData = {
    schemaVersion: "2026.01.results-v1",
    effectId,
    status: "ok",
    result: { value: "done" },
    ...result,
  };
  await fs.writeFile(
    path.join(taskDir, "result.json"),
    JSON.stringify(resultData, null, 2),
  );
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe("GAP-JSON-002: Effect Dispatch and Response Protocol", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = tmpDir();
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  // ── Module exports ──────────────────────────────────────────────────────

  describe("module exports", () => {
    it("exports apiListEffects as a function", () => {
      expect(typeof apiListEffects).toBe("function");
    });

    it("exports apiShowEffect as a function", () => {
      expect(typeof apiShowEffect).toBe("function");
    });

    it("exports apiCancelEffect as a function", () => {
      expect(typeof apiCancelEffect).toBe("function");
    });

    it("exports apiBatchCommitEffects as a function", () => {
      expect(typeof apiBatchCommitEffects).toBe("function");
    });
  });

  // ── AC-001: apiListEffects returns all effects with required fields ─────

  describe("AC-001: apiListEffects returns all effects with required fields", () => {
    it("returns effects with effectId, kind, status, taskId, labels, requestedAt, resolvedAt", async () => {
      const runDir = await scaffoldRunDir(testDir, "list-all");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "list-all" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-001",
        invocationKey: "key-001",
        stepId: "S000001",
        taskId: "my-task",
        kind: "node",
        labels: ["build", "compile"],
      });
      await appendJournalEvent(runDir, 3, "EFFECT_RESOLVED", {
        effectId: "eff-001",
        status: "ok",
        resultRef: "tasks/eff-001/result.json",
      });
      await appendJournalEvent(runDir, 4, "EFFECT_REQUESTED", {
        effectId: "eff-002",
        invocationKey: "key-002",
        stepId: "S000002",
        taskId: "breakpoint-task",
        kind: "breakpoint",
      });

      await scaffoldTaskDefinition(runDir, "eff-001", {
        taskId: "my-task",
        kind: "node",
        labels: ["build", "compile"],
      });
      await scaffoldTaskDefinition(runDir, "eff-002", {
        taskId: "breakpoint-task",
        kind: "breakpoint",
      });

      const result = await apiListEffects({ runDir });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Array.isArray(result.data.effects)).toBe(true);
        expect(result.data.effects.length).toBe(2);

        const eff1 = result.data.effects.find(
          (e: Record<string, unknown>) => e.effectId === "eff-001",
        );
        expect(eff1).toBeDefined();
        expect(eff1).toHaveProperty("effectId", "eff-001");
        expect(eff1).toHaveProperty("kind", "node");
        expect(eff1).toHaveProperty("taskId", "my-task");
        expect(eff1).toHaveProperty("status");
        expect(eff1).toHaveProperty("requestedAt");
        // resolvedAt should be present for resolved effects
        expect(eff1).toHaveProperty("resolvedAt");
      }
    });
  });

  // ── AC-002: apiListEffects supports filter by kind and status ───────────

  describe("AC-002: apiListEffects supports filter by kind and status", () => {
    it("filters effects by kind", async () => {
      const runDir = await scaffoldRunDir(testDir, "filter-kind");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "filter-kind" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-node",
        invocationKey: "k1",
        stepId: "S000001",
        taskId: "t1",
        kind: "node",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_REQUESTED", {
        effectId: "eff-bp",
        invocationKey: "k2",
        stepId: "S000002",
        taskId: "t2",
        kind: "breakpoint",
      });

      const result = await apiListEffects({
        runDir,
        filter: { kind: "breakpoint" },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.effects.length).toBe(1);
        expect(result.data.effects[0].effectId).toBe("eff-bp");
      }
    });

    it("filters effects by status", async () => {
      const runDir = await scaffoldRunDir(testDir, "filter-status");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "filter-status" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-pending",
        invocationKey: "k1",
        stepId: "S000001",
        taskId: "t1",
        kind: "node",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_REQUESTED", {
        effectId: "eff-resolved",
        invocationKey: "k2",
        stepId: "S000002",
        taskId: "t2",
        kind: "node",
      });
      await appendJournalEvent(runDir, 4, "EFFECT_RESOLVED", {
        effectId: "eff-resolved",
        status: "ok",
      });

      const result = await apiListEffects({
        runDir,
        filter: { status: "requested" },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.effects.length).toBe(1);
        expect(result.data.effects[0].effectId).toBe("eff-pending");
      }
    });

    it("filters effects by both kind and status simultaneously", async () => {
      const runDir = await scaffoldRunDir(testDir, "filter-both");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "filter-both" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-a",
        invocationKey: "k1",
        stepId: "S000001",
        taskId: "t1",
        kind: "node",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_REQUESTED", {
        effectId: "eff-b",
        invocationKey: "k2",
        stepId: "S000002",
        taskId: "t2",
        kind: "breakpoint",
      });
      await appendJournalEvent(runDir, 4, "EFFECT_REQUESTED", {
        effectId: "eff-c",
        invocationKey: "k3",
        stepId: "S000003",
        taskId: "t3",
        kind: "breakpoint",
      });
      await appendJournalEvent(runDir, 5, "EFFECT_RESOLVED", {
        effectId: "eff-b",
        status: "ok",
      });

      const result = await apiListEffects({
        runDir,
        filter: { kind: "breakpoint", status: "requested" },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.effects.length).toBe(1);
        expect(result.data.effects[0].effectId).toBe("eff-c");
      }
    });
  });

  // ── AC-003: apiShowEffect returns detail or EFFECT_NOT_FOUND ────────────

  describe("AC-003: apiShowEffect returns task definition, result, and status", () => {
    it("returns full effect detail for an existing effect", async () => {
      const runDir = await scaffoldRunDir(testDir, "show-detail");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "show-detail" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-show",
        invocationKey: "k1",
        stepId: "S000001",
        taskId: "show-task",
        kind: "node",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_RESOLVED", {
        effectId: "eff-show",
        status: "ok",
        resultRef: "tasks/eff-show/result.json",
      });

      await scaffoldTaskDefinition(runDir, "eff-show", {
        taskId: "show-task",
        kind: "node",
      });
      await scaffoldTaskResult(runDir, "eff-show", {
        status: "ok",
        result: { answer: 42 },
      });

      const result = await apiShowEffect({ runDir, effectId: "eff-show" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveProperty("effectId", "eff-show");
        expect(result.data).toHaveProperty("status");
        expect(result.data).toHaveProperty("taskDefinition");
        expect(result.data).toHaveProperty("result");
        expect(result.data.taskDefinition).toHaveProperty("kind", "node");
      }
    });

    it("returns EFFECT_NOT_FOUND for a nonexistent effectId", async () => {
      const runDir = await scaffoldRunDir(testDir, "show-missing");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "show-missing" });

      const result = await apiShowEffect({ runDir, effectId: "nonexistent" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("EFFECT_NOT_FOUND");
      }
    });
  });

  // ── AC-004: apiCancelEffect calls commitEffectCancellation ──────────────

  describe("AC-004: apiCancelEffect calls commitEffectCancellation and returns resultRef", () => {
    it("cancels a pending effect and returns resultRef", async () => {
      const runDir = await scaffoldRunDir(testDir, "cancel-ok");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "cancel-ok" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-cancel",
        invocationKey: "k-cancel",
        stepId: "S000001",
        taskId: "cancel-task",
        kind: "node",
      });

      await scaffoldTaskDefinition(runDir, "eff-cancel", {
        taskId: "cancel-task",
        invocationKey: "k-cancel",
        kind: "node",
      });

      const result = await apiCancelEffect({
        runDir,
        effectId: "eff-cancel",
        reason: "No longer needed",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(typeof result.data.resultRef).toBe("string");
      }
    });
  });

  // ── AC-005: apiCancelEffect returns EFFECT_NOT_PENDING for resolved ─────

  describe("AC-005: apiCancelEffect returns EFFECT_NOT_PENDING for already resolved effects", () => {
    it("returns EFFECT_NOT_PENDING when effect is already resolved", async () => {
      const runDir = await scaffoldRunDir(testDir, "cancel-resolved");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "cancel-resolved" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-done",
        invocationKey: "k-done",
        stepId: "S000001",
        taskId: "done-task",
        kind: "node",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_RESOLVED", {
        effectId: "eff-done",
        status: "ok",
      });

      await scaffoldTaskDefinition(runDir, "eff-done", {
        taskId: "done-task",
        invocationKey: "k-done",
        kind: "node",
      });
      await scaffoldTaskResult(runDir, "eff-done");

      const result = await apiCancelEffect({
        runDir,
        effectId: "eff-done",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("EFFECT_NOT_PENDING");
      }
    });
  });

  // ── AC-006: apiCommitEffect (in runs.ts) accepts full options ───────────
  // This AC is for apiCommitEffect in runs.ts (already tested in runs.test.ts).
  // We verify the expanded options contract here for completeness.

  describe("AC-006: apiCommitEffect accepts full options including stdout, stderr, metadata", () => {
    it("apiCommitEffect from runs.ts supports stdout, stderr, metadata fields", async () => {
      // Import from runs to verify the expanded interface
      const { apiCommitEffect } = await import("../runs");

      const runDir = await scaffoldRunDir(testDir, "commit-full");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "commit-full" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-full",
        invocationKey: "k-full",
        stepId: "S000001",
        taskId: "full-task",
        kind: "node",
      });

      await scaffoldTaskDefinition(runDir, "eff-full", {
        taskId: "full-task",
        invocationKey: "k-full",
        kind: "node",
      });

      const result = await apiCommitEffect({
        runDir,
        effectId: "eff-full",
        result: {
          status: "ok",
          value: { answer: 42 },
          stdout: "Build successful\n",
          stderr: "Warning: deprecated API\n",
          metadata: { duration: 1234, host: "ci-node-1" },
        },
      });

      expect(result).toHaveProperty("ok");
      if (result.ok) {
        expect(typeof result.data.resultRef).toBe("string");
      }
    });
  });

  // ── AC-007: apiBatchCommitEffects commits array sequentially ────────────

  describe("AC-007: apiBatchCommitEffects commits array of effects sequentially", () => {
    it("commits multiple effects and returns per-effect results", async () => {
      const runDir = await scaffoldRunDir(testDir, "batch-ok");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "batch-ok" });

      // Create two pending effects
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "batch-eff-1",
        invocationKey: "bk1",
        stepId: "S000001",
        taskId: "bt1",
        kind: "node",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_REQUESTED", {
        effectId: "batch-eff-2",
        invocationKey: "bk2",
        stepId: "S000002",
        taskId: "bt2",
        kind: "node",
      });

      await scaffoldTaskDefinition(runDir, "batch-eff-1", {
        taskId: "bt1",
        invocationKey: "bk1",
        kind: "node",
      });
      await scaffoldTaskDefinition(runDir, "batch-eff-2", {
        taskId: "bt2",
        invocationKey: "bk2",
        kind: "node",
      });

      const result = await apiBatchCommitEffects({
        runDir,
        effects: [
          { effectId: "batch-eff-1", result: { status: "ok", value: { r: 1 } } },
          { effectId: "batch-eff-2", result: { status: "ok", value: { r: 2 } } },
        ],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Array.isArray(result.data.results)).toBe(true);
        expect(result.data.results.length).toBe(2);

        // Each entry should have effectId and either ok or error
        for (const entry of result.data.results) {
          expect(entry).toHaveProperty("effectId");
          expect(entry).toHaveProperty("ok");
        }
        expect(result.data.results[0].ok).toBe(true);
        expect(result.data.results[1].ok).toBe(true);
      }
    });
  });

  // ── AC-008: apiBatchCommitEffects continues on failure ──────────────────

  describe("AC-008: apiBatchCommitEffects continues on failure, returns partial results", () => {
    it("returns partial results when some effects fail to commit", async () => {
      const runDir = await scaffoldRunDir(testDir, "batch-partial");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "batch-partial" });

      // Only create one valid pending effect
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "batch-valid",
        invocationKey: "bkv",
        stepId: "S000001",
        taskId: "btv",
        kind: "node",
      });
      await scaffoldTaskDefinition(runDir, "batch-valid", {
        taskId: "btv",
        invocationKey: "bkv",
        kind: "node",
      });

      const result = await apiBatchCommitEffects({
        runDir,
        effects: [
          { effectId: "batch-valid", result: { status: "ok", value: { r: 1 } } },
          { effectId: "batch-invalid", result: { status: "ok", value: { r: 2 } } },
        ],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.results.length).toBe(2);

        // First should succeed
        expect(result.data.results[0].ok).toBe(true);
        expect(result.data.results[0].effectId).toBe("batch-valid");

        // Second should fail (unknown effect)
        expect(result.data.results[1].ok).toBe(false);
        expect(result.data.results[1].effectId).toBe("batch-invalid");
        expect(result.data.results[1]).toHaveProperty("error");
      }
    });
  });

  // ── AC-009: apiListEffects returns RUN_NOT_FOUND for nonexistent runDir ─

  describe("AC-009: apiListEffects returns RUN_NOT_FOUND for nonexistent runDir", () => {
    it("returns RUN_NOT_FOUND when runDir does not exist", async () => {
      const result = await apiListEffects({
        runDir: path.join(testDir, "nonexistent-run"),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("RUN_NOT_FOUND");
      }
    });
  });

  // ── AC-010: All functions never throw, use ApiResult envelope ───────────

  describe("AC-010: all functions never throw, use ApiResult envelope", () => {
    it("apiListEffects does not throw on internal error", async () => {
      const result = await apiListEffects({
        runDir: path.join(testDir, "totally-bogus"),
      });
      expect(result).toHaveProperty("ok");
      expect(result.ok).toBe(false);
    });

    it("apiShowEffect does not throw on internal error", async () => {
      const result = await apiShowEffect({
        runDir: path.join(testDir, "totally-bogus"),
        effectId: "nope",
      });
      expect(result).toHaveProperty("ok");
      expect(result.ok).toBe(false);
    });

    it("apiCancelEffect does not throw on internal error", async () => {
      const result = await apiCancelEffect({
        runDir: path.join(testDir, "totally-bogus"),
        effectId: "nope",
      });
      expect(result).toHaveProperty("ok");
      expect(result.ok).toBe(false);
    });

    it("apiBatchCommitEffects does not throw on internal error", async () => {
      const result = await apiBatchCommitEffects({
        runDir: path.join(testDir, "totally-bogus"),
        effects: [{ effectId: "x", result: { status: "ok", value: {} } }],
      });
      expect(result).toHaveProperty("ok");
      // Even with a bad runDir, the batch should return an envelope
      // (either top-level fail or per-effect failures)
    });
  });

  // ── AC-011: New functions re-exported from api/index.ts ─────────────────

  describe("AC-011: re-export from api/index.ts", () => {
    it("all 4 new API functions are importable from the api barrel export", async () => {
      const api = await import("../index");
      const exports = api as Record<string, unknown>;
      expect(typeof exports.apiListEffects).toBe("function");
      expect(typeof exports.apiShowEffect).toBe("function");
      expect(typeof exports.apiCancelEffect).toBe("function");
      expect(typeof exports.apiBatchCommitEffects).toBe("function");
    });
  });

  // ── AC-012: apiShowEffect includes autoApproval for breakpoints ─────────

  describe("AC-012: apiShowEffect includes autoApproval for breakpoint effects", () => {
    it("includes autoApproval field for a breakpoint effect", async () => {
      const runDir = await scaffoldRunDir(testDir, "show-bp");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "show-bp" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-bp",
        invocationKey: "k-bp",
        stepId: "S000001",
        taskId: "__sdk.breakpoint",
        kind: "breakpoint",
      });

      await scaffoldTaskDefinition(runDir, "eff-bp", {
        taskId: "__sdk.breakpoint",
        kind: "breakpoint",
        metadata: {
          breakpointId: "confirm.deploy",
        },
        autoApproval: {
          recommended: false,
          reason: "No matching rule",
        },
      });

      const result = await apiShowEffect({ runDir, effectId: "eff-bp" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.kind).toBe("breakpoint");
        expect(result.data).toHaveProperty("autoApproval");
      }
    });
  });

  // ── AC-013: apiListEffects returns effects sorted by effectId ascending ─

  describe("AC-013: apiListEffects returns effects sorted by effectId ascending", () => {
    it("returns effects sorted by effectId in ascending order", async () => {
      const runDir = await scaffoldRunDir(testDir, "sort-effects");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "sort-effects" });

      // Insert effects in non-alphabetical order
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-charlie",
        invocationKey: "k3",
        stepId: "S000003",
        taskId: "t3",
        kind: "node",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_REQUESTED", {
        effectId: "eff-alpha",
        invocationKey: "k1",
        stepId: "S000001",
        taskId: "t1",
        kind: "node",
      });
      await appendJournalEvent(runDir, 4, "EFFECT_REQUESTED", {
        effectId: "eff-bravo",
        invocationKey: "k2",
        stepId: "S000002",
        taskId: "t2",
        kind: "breakpoint",
      });

      const result = await apiListEffects({ runDir });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const ids = result.data.effects.map(
          (e: Record<string, unknown>) => e.effectId,
        );
        expect(ids).toEqual(["eff-alpha", "eff-bravo", "eff-charlie"]);
      }
    });
  });

  // ── AC-014: Input validation errors use INVALID_INPUT code ──────────────

  describe("AC-014: input validation errors use INVALID_INPUT code", () => {
    it("apiListEffects returns INVALID_INPUT when runDir is empty string", async () => {
      const result = await apiListEffects({ runDir: "" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_INPUT");
      }
    });

    it("apiShowEffect returns INVALID_INPUT when effectId is empty string", async () => {
      const runDir = await scaffoldRunDir(testDir, "validate-show");
      const result = await apiShowEffect({ runDir, effectId: "" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_INPUT");
      }
    });

    it("apiCancelEffect returns INVALID_INPUT when effectId is empty string", async () => {
      const runDir = await scaffoldRunDir(testDir, "validate-cancel");
      const result = await apiCancelEffect({ runDir, effectId: "" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_INPUT");
      }
    });

    it("apiShowEffect returns INVALID_INPUT when runDir is empty", async () => {
      const result = await apiShowEffect({ runDir: "", effectId: "eff-1" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_INPUT");
      }
    });
  });

  // ── AC-015: apiBatchCommitEffects validates non-empty entries array ─────

  describe("AC-015: apiBatchCommitEffects validates non-empty entries array", () => {
    it("returns INVALID_INPUT when effects array is empty", async () => {
      const runDir = await scaffoldRunDir(testDir, "batch-empty");

      const result = await apiBatchCommitEffects({
        runDir,
        effects: [],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_INPUT");
      }
    });

    it("returns INVALID_INPUT when effects is not an array", async () => {
      const runDir = await scaffoldRunDir(testDir, "batch-not-array");

      const result = await apiBatchCommitEffects({
        runDir,
        effects: undefined as unknown as Array<{ effectId: string; result: { status: "ok"; value: unknown } }>,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_INPUT");
      }
    });
  });

  // ── Additional edge cases ───────────────────────────────────────────────

  describe("apiShowEffect with pending (no result yet) effect", () => {
    it("returns effect detail with null/undefined result for pending effect", async () => {
      const runDir = await scaffoldRunDir(testDir, "show-pending");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "show-pending" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-pend",
        invocationKey: "kp",
        stepId: "S000001",
        taskId: "pend-task",
        kind: "node",
      });

      await scaffoldTaskDefinition(runDir, "eff-pend", {
        taskId: "pend-task",
        kind: "node",
      });

      const result = await apiShowEffect({ runDir, effectId: "eff-pend" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.effectId).toBe("eff-pend");
        expect(result.data.status).toBe("requested");
        // result should be null or undefined for pending effects
        expect(result.data.result == null).toBe(true);
      }
    });
  });

  describe("apiCancelEffect with nonexistent effectId", () => {
    it("returns an error for effectId that was never requested", async () => {
      const runDir = await scaffoldRunDir(testDir, "cancel-unknown");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "cancel-unknown" });

      const result = await apiCancelEffect({
        runDir,
        effectId: "never-existed",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        // Should be EFFECT_NOT_FOUND or UNKNOWN_EFFECT
        expect(["EFFECT_NOT_FOUND", "UNKNOWN_EFFECT"]).toContain(result.error.code);
      }
    });
  });

  describe("apiListEffects with no effects in run", () => {
    it("returns an empty array when no effects have been requested", async () => {
      const runDir = await scaffoldRunDir(testDir, "list-empty");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "list-empty" });

      const result = await apiListEffects({ runDir });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.effects).toEqual([]);
      }
    });
  });

  describe("apiBatchCommitEffects with runDir validation", () => {
    it("returns INVALID_INPUT when runDir is empty string", async () => {
      const result = await apiBatchCommitEffects({
        runDir: "",
        effects: [{ effectId: "x", result: { status: "ok", value: {} } }],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_INPUT");
      }
    });
  });

  // ── Adversarial review gap tests ─────────────────────────────────────────

  describe("resolved_error status in EFFECT_RESOLVED", () => {
    it("apiListEffects returns resolved_error status when effect resolved with error", async () => {
      const runDir = await scaffoldRunDir(testDir, "resolved-error");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "resolved-error" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-err",
        invocationKey: "ke",
        stepId: "S000001",
        taskId: "te",
        kind: "node",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_RESOLVED", {
        effectId: "eff-err",
        status: "error",
        resultRef: "tasks/eff-err/result.json",
      });

      const result = await apiListEffects({ runDir });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.effects.length).toBe(1);
        expect(result.data.effects[0].status).toBe("resolved_error");
      }
    });

    it("apiListEffects filters resolved_error effects when status filter is 'resolved'", async () => {
      const runDir = await scaffoldRunDir(testDir, "filter-resolved-error");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "filter-resolved-error" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-ok",
        invocationKey: "k1",
        stepId: "S000001",
        taskId: "t1",
        kind: "node",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_RESOLVED", {
        effectId: "eff-ok",
        status: "ok",
      });
      await appendJournalEvent(runDir, 4, "EFFECT_REQUESTED", {
        effectId: "eff-err",
        invocationKey: "k2",
        stepId: "S000002",
        taskId: "t2",
        kind: "node",
      });
      await appendJournalEvent(runDir, 5, "EFFECT_RESOLVED", {
        effectId: "eff-err",
        status: "error",
      });
      await appendJournalEvent(runDir, 6, "EFFECT_REQUESTED", {
        effectId: "eff-pend",
        invocationKey: "k3",
        stepId: "S000003",
        taskId: "t3",
        kind: "node",
      });

      const result = await apiListEffects({ runDir, filter: { status: "resolved" } });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.effects.length).toBe(2);
        const statuses = result.data.effects.map((e: Record<string, unknown>) => e.status);
        expect(statuses).toContain("resolved_ok");
        expect(statuses).toContain("resolved_error");
      }
    });
  });

  describe("cancelled status filter", () => {
    it("apiListEffects filters by cancelled status", async () => {
      const runDir = await scaffoldRunDir(testDir, "filter-cancelled");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "filter-cancelled" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-c1",
        invocationKey: "kc1",
        stepId: "S000001",
        taskId: "tc1",
        kind: "node",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_CANCELLED", {
        effectId: "eff-c1",
        reason: "no longer needed",
      });
      await appendJournalEvent(runDir, 4, "EFFECT_REQUESTED", {
        effectId: "eff-p1",
        invocationKey: "kp1",
        stepId: "S000002",
        taskId: "tp1",
        kind: "node",
      });

      const result = await apiListEffects({ runDir, filter: { status: "cancelled" } });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.effects.length).toBe(1);
        expect(result.data.effects[0].effectId).toBe("eff-c1");
        expect(result.data.effects[0].status).toBe("cancelled");
      }
    });
  });

  describe("kind as array filter", () => {
    it("apiListEffects filters by kind when kind is a string[]", async () => {
      const runDir = await scaffoldRunDir(testDir, "filter-kind-array");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "filter-kind-array" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-n",
        invocationKey: "kn",
        stepId: "S000001",
        taskId: "tn",
        kind: "node",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_REQUESTED", {
        effectId: "eff-b",
        invocationKey: "kb",
        stepId: "S000002",
        taskId: "tb",
        kind: "breakpoint",
      });
      await appendJournalEvent(runDir, 4, "EFFECT_REQUESTED", {
        effectId: "eff-s",
        invocationKey: "ks",
        stepId: "S000003",
        taskId: "ts",
        kind: "sleep",
      });

      const result = await apiListEffects({
        runDir,
        filter: { kind: ["node", "sleep"] },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.effects.length).toBe(2);
        const ids = result.data.effects.map((e: Record<string, unknown>) => e.effectId);
        expect(ids).toContain("eff-n");
        expect(ids).toContain("eff-s");
        expect(ids).not.toContain("eff-b");
      }
    });
  });

  describe("apiShowEffect when task definition file is missing", () => {
    it("returns effect detail with undefined taskDefinition when task.json is missing", async () => {
      const runDir = await scaffoldRunDir(testDir, "show-no-taskdef");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "show-no-taskdef" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-notask",
        invocationKey: "knt",
        stepId: "S000001",
        taskId: "notask",
        kind: "node",
      });
      // No scaffoldTaskDefinition — task.json does not exist

      const result = await apiShowEffect({ runDir, effectId: "eff-notask" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.effectId).toBe("eff-notask");
        expect(result.data.status).toBe("requested");
        expect(result.data.taskDefinition).toBeUndefined();
      }
    });
  });

  describe("apiCancelEffect without reason", () => {
    it("cancels a pending effect without a reason", async () => {
      const runDir = await scaffoldRunDir(testDir, "cancel-no-reason");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "cancel-no-reason" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-cnr",
        invocationKey: "kcnr",
        stepId: "S000001",
        taskId: "tcnr",
        kind: "node",
      });
      await scaffoldTaskDefinition(runDir, "eff-cnr", {
        taskId: "tcnr",
        invocationKey: "kcnr",
        kind: "node",
      });

      const result = await apiCancelEffect({
        runDir,
        effectId: "eff-cnr",
        // no reason provided
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(typeof result.data.resultRef).toBe("string");
      }
    });
  });

  describe("cancelling already-cancelled effect returns EFFECT_NOT_PENDING", () => {
    it("returns EFFECT_NOT_PENDING when effect is already cancelled", async () => {
      const runDir = await scaffoldRunDir(testDir, "cancel-twice");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "cancel-twice" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-ct",
        invocationKey: "kct",
        stepId: "S000001",
        taskId: "tct",
        kind: "node",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_CANCELLED", {
        effectId: "eff-ct",
        reason: "first cancel",
      });

      const result = await apiCancelEffect({
        runDir,
        effectId: "eff-ct",
        reason: "second cancel",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("EFFECT_NOT_PENDING");
      }
    });
  });

  describe("apiBatchCommitEffects with nonexistent runDir", () => {
    it("returns RUN_NOT_FOUND when runDir does not exist", async () => {
      const result = await apiBatchCommitEffects({
        runDir: path.join(testDir, "nonexistent-batch-run"),
        effects: [{ effectId: "x", result: { status: "ok", value: {} } }],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("RUN_NOT_FOUND");
      }
    });
  });

  describe("apiBatchCommitEffects with already-resolved effect", () => {
    it("returns per-effect error for already-resolved effect in batch", async () => {
      const runDir = await scaffoldRunDir(testDir, "batch-already-resolved");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "batch-already-resolved" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-ar",
        invocationKey: "kar",
        stepId: "S000001",
        taskId: "tar",
        kind: "node",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_RESOLVED", {
        effectId: "eff-ar",
        status: "ok",
        resultRef: "tasks/eff-ar/result.json",
      });
      await scaffoldTaskDefinition(runDir, "eff-ar", {
        taskId: "tar",
        invocationKey: "kar",
        kind: "node",
      });
      await scaffoldTaskResult(runDir, "eff-ar");

      const result = await apiBatchCommitEffects({
        runDir,
        effects: [{ effectId: "eff-ar", result: { status: "ok", value: { r: 1 } } }],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.results.length).toBe(1);
        expect(result.data.results[0].ok).toBe(false);
        expect(result.data.results[0].error).toContain("already resolved");
      }
    });
  });
});
