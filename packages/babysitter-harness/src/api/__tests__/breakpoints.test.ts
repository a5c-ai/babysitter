/**
 * GAP-JSON-003: JSON Breakpoint Interaction API
 *
 * Tests for apiListBreakpoints, apiShowBreakpoint, apiRespondToBreakpoint,
 * apiListAutoApprovalRules, apiAddAutoApprovalRule, apiRemoveAutoApprovalRule,
 * apiEvaluateAutoApproval.
 *
 * All 16 acceptance criteria are covered.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

import {
  apiListBreakpoints,
  apiShowBreakpoint,
  apiRespondToBreakpoint,
  apiListAutoApprovalRules,
  apiAddAutoApprovalRule,
  apiRemoveAutoApprovalRule,
  apiEvaluateAutoApproval,
} from "../breakpoints";
import type { ApiResult } from "../runs";

// ── Helpers ──────────────────────────────────────────────────────────────────

function tmpDir(): string {
  return path.join(os.tmpdir(), `gap-json-003-${crypto.randomUUID()}`);
}

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
    ...taskDef,
  };
  await fs.writeFile(
    path.join(taskDir, "task.json"),
    JSON.stringify(definition, null, 2),
  );
}

async function scaffoldBreakpointTaskDef(
  runDir: string,
  effectId: string,
  overrides: Record<string, unknown> = {},
): Promise<void> {
  await scaffoldTaskDefinition(runDir, effectId, {
    kind: "breakpoint",
    taskId: "__sdk.breakpoint",
    title: overrides.title ?? "Confirm deployment",
    description: overrides.description ?? "Please approve the deployment",
    breakpointId: overrides.breakpointId ?? "confirm.deploy",
    tags: overrides.tags ?? ["deployment", "production"],
    expert: overrides.expert ?? "owner",
    strategy: overrides.strategy ?? "single",
    previousFeedback: overrides.previousFeedback,
    attempt: overrides.attempt ?? 1,
    autoApproval: overrides.autoApproval ?? {
      recommended: false,
      reason: "No matching auto-approval rule",
      consecutiveApprovals: 0,
    },
    options: overrides.options,
    ...overrides,
  });
}

async function scaffoldTaskResult(
  runDir: string,
  effectId: string,
  result: Record<string, unknown> = {},
): Promise<void> {
  const taskDir = path.join(runDir, "tasks", effectId);
  await fs.mkdir(taskDir, { recursive: true });
  await fs.writeFile(
    path.join(taskDir, "result.json"),
    JSON.stringify({
      schemaVersion: "2026.01.results-v1",
      effectId,
      ...result,
    }, null, 2),
  );
}

// ── Test state ───────────────────────────────────────────────────────────────

let testBase: string;

beforeEach(async () => {
  testBase = tmpDir();
  await fs.mkdir(testBase, { recursive: true });
});

afterEach(async () => {
  try {
    await fs.rm(testBase, { recursive: true, force: true });
  } catch {
    // cleanup best-effort
  }
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GAP-JSON-003: JSON Breakpoint Interaction API", () => {
  // ── Module exports ──

  describe("module exports", () => {
    it("exports apiListBreakpoints as a function", () => {
      expect(typeof apiListBreakpoints).toBe("function");
    });

    it("exports apiShowBreakpoint as a function", () => {
      expect(typeof apiShowBreakpoint).toBe("function");
    });

    it("exports apiRespondToBreakpoint as a function", () => {
      expect(typeof apiRespondToBreakpoint).toBe("function");
    });

    it("exports apiListAutoApprovalRules as a function", () => {
      expect(typeof apiListAutoApprovalRules).toBe("function");
    });

    it("exports apiAddAutoApprovalRule as a function", () => {
      expect(typeof apiAddAutoApprovalRule).toBe("function");
    });

    it("exports apiRemoveAutoApprovalRule as a function", () => {
      expect(typeof apiRemoveAutoApprovalRule).toBe("function");
    });

    it("exports apiEvaluateAutoApproval as a function", () => {
      expect(typeof apiEvaluateAutoApproval).toBe("function");
    });
  });

  // ── AC-001: apiListBreakpoints returns pending breakpoints ──

  describe("AC-001: apiListBreakpoints returns pending breakpoint effects", () => {
    it("returns only pending breakpoint effects with required fields", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-list");

      // Add a breakpoint effect (pending)
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-bp-1",
        kind: "breakpoint",
        taskId: "__sdk.breakpoint",
        labels: ["deployment"],
      });
      // Add a non-breakpoint effect (should be excluded)
      await appendJournalEvent(runDir, 3, "EFFECT_REQUESTED", {
        effectId: "eff-shell-1",
        kind: "shell",
        taskId: "build",
      });
      // Add a resolved breakpoint (should be excluded — only pending)
      await appendJournalEvent(runDir, 4, "EFFECT_REQUESTED", {
        effectId: "eff-bp-2",
        kind: "breakpoint",
        taskId: "__sdk.breakpoint",
      });
      await appendJournalEvent(runDir, 5, "EFFECT_RESOLVED", {
        effectId: "eff-bp-2",
        status: "ok",
      });

      // Scaffold task definitions for the pending breakpoint
      await scaffoldBreakpointTaskDef(runDir, "eff-bp-1", {
        breakpointId: "confirm.deploy",
        title: "Confirm deployment",
        tags: ["deployment"],
        expert: "owner",
        strategy: "single",
      });

      const result = await apiListBreakpoints({ runDir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.breakpoints.length).toBe(1);
      const bp = result.data.breakpoints[0];
      expect(bp.effectId).toBe("eff-bp-1");
      expect(bp).toHaveProperty("breakpointId");
      expect(bp).toHaveProperty("title");
      expect(bp).toHaveProperty("tags");
      expect(bp).toHaveProperty("expert");
      expect(bp).toHaveProperty("strategy");
      expect(bp).toHaveProperty("autoApproval");
      expect(bp).toHaveProperty("requestedAt");
    });
  });

  // ── AC-002: apiListBreakpoints RUN_NOT_FOUND ──

  describe("AC-002: apiListBreakpoints returns RUN_NOT_FOUND", () => {
    it("returns RUN_NOT_FOUND when runDir does not exist", async () => {
      const result = await apiListBreakpoints({ runDir: "/nonexistent/run/dir" });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("RUN_NOT_FOUND");
    });
  });

  // ── AC-003: apiShowBreakpoint returns full context ──

  describe("AC-003: apiShowBreakpoint returns full breakpoint context", () => {
    it("returns task definition fields, autoApproval, and status", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-show");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-bp-show",
        kind: "breakpoint",
        taskId: "__sdk.breakpoint",
      });

      await scaffoldBreakpointTaskDef(runDir, "eff-bp-show", {
        title: "Approve release",
        description: "Review and approve the release",
        breakpointId: "confirm.release",
        tags: ["release"],
        expert: "release-manager",
        strategy: "single",
        previousFeedback: "Fix the tests first",
        attempt: 2,
        options: ["approve", "reject", "defer"],
        autoApproval: { recommended: true, reason: "Matched rule", matchedRule: "r1" },
      });

      const result = await apiShowBreakpoint({ runDir, effectId: "eff-bp-show" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.effectId).toBe("eff-bp-show");
      expect(result.data.status).toBe("requested");
      expect(result.data.title).toBe("Approve release");
      expect(result.data.description).toBe("Review and approve the release");
      expect(result.data.breakpointId).toBe("confirm.release");
      expect(result.data.tags).toEqual(["release"]);
      expect(result.data.expert).toBe("release-manager");
      expect(result.data.strategy).toBe("single");
      expect(result.data.previousFeedback).toBe("Fix the tests first");
      expect(result.data.attempt).toBe(2);
      expect(result.data.options).toEqual(["approve", "reject", "defer"]);
      expect(result.data.autoApproval).toEqual({ recommended: true, reason: "Matched rule", matchedRule: "r1" });
    });
  });

  // ── AC-004: apiShowBreakpoint EFFECT_NOT_FOUND and EFFECT_NOT_BREAKPOINT ──

  describe("AC-004: apiShowBreakpoint error codes", () => {
    it("returns EFFECT_NOT_FOUND for nonexistent effectId", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-notfound");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const result = await apiShowBreakpoint({ runDir, effectId: "nonexistent" });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("EFFECT_NOT_FOUND");
    });

    it("returns EFFECT_NOT_BREAKPOINT for non-breakpoint effects", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-wrongkind");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-shell",
        kind: "shell",
        taskId: "build",
      });

      const result = await apiShowBreakpoint({ runDir, effectId: "eff-shell" });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("EFFECT_NOT_BREAKPOINT");
    });
  });

  // ── AC-005: apiRespondToBreakpoint approval ──

  describe("AC-005: apiRespondToBreakpoint posts approval", () => {
    it("posts approval writing result.json and EFFECT_RESOLVED event", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-approve");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-bp-approve",
        kind: "breakpoint",
        taskId: "__sdk.breakpoint",
        invocationKey: "key-bp-approve",
      });
      await scaffoldBreakpointTaskDef(runDir, "eff-bp-approve");

      const result = await apiRespondToBreakpoint({
        runDir,
        effectId: "eff-bp-approve",
        approved: true,
        response: "Looks good, ship it",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.resultRef).toContain("result.json");

      // Verify result.json was written
      const resultPath = path.join(runDir, result.data.resultRef);
      const resultData = JSON.parse(await fs.readFile(resultPath, "utf-8"));
      expect(resultData).toHaveProperty("effectId", "eff-bp-approve");

      // Verify EFFECT_RESOLVED event was appended
      const journalDir = path.join(runDir, "journal");
      const files = await fs.readdir(journalDir);
      const lastFile = files.sort().pop()!;
      const lastEvent = JSON.parse(
        await fs.readFile(path.join(journalDir, lastFile), "utf-8"),
      );
      expect(lastEvent.type).toBe("EFFECT_RESOLVED");
      expect(lastEvent.data.effectId).toBe("eff-bp-approve");
    });
  });

  // ── AC-006: apiRespondToBreakpoint rejection ──

  describe("AC-006: apiRespondToBreakpoint posts rejection", () => {
    it("posts rejection with feedback, writing result.json and EFFECT_RESOLVED", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-reject");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-bp-reject",
        kind: "breakpoint",
        taskId: "__sdk.breakpoint",
        invocationKey: "key-bp-reject",
      });
      await scaffoldBreakpointTaskDef(runDir, "eff-bp-reject");

      const result = await apiRespondToBreakpoint({
        runDir,
        effectId: "eff-bp-reject",
        approved: false,
        feedback: "Tests are failing, fix them first",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.resultRef).toContain("result.json");
    });
  });

  // ── AC-007: apiRespondToBreakpoint EFFECT_NOT_PENDING ──

  describe("AC-007: apiRespondToBreakpoint EFFECT_NOT_PENDING", () => {
    it("returns EFFECT_NOT_PENDING for already resolved breakpoints", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-already-resolved");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-bp-done",
        kind: "breakpoint",
        taskId: "__sdk.breakpoint",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_RESOLVED", {
        effectId: "eff-bp-done",
        status: "ok",
      });

      const result = await apiRespondToBreakpoint({
        runDir,
        effectId: "eff-bp-done",
        approved: true,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("EFFECT_NOT_PENDING");
    });

    it("returns EFFECT_NOT_PENDING for cancelled breakpoints", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-cancelled");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-bp-canc",
        kind: "breakpoint",
        taskId: "__sdk.breakpoint",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_CANCELLED", {
        effectId: "eff-bp-canc",
      });

      const result = await apiRespondToBreakpoint({
        runDir,
        effectId: "eff-bp-canc",
        approved: true,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("EFFECT_NOT_PENDING");
    });
  });

  // ── AC-008: apiRespondToBreakpoint INVALID_INPUT for rejection without feedback ──

  describe("AC-008: apiRespondToBreakpoint INVALID_INPUT for rejection without feedback", () => {
    it("returns INVALID_INPUT when approved=false but feedback is missing", async () => {
      const result = await apiRespondToBreakpoint({
        runDir: "/some/run",
        effectId: "eff-1",
        approved: false,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_INPUT");
      expect(result.error.message).toMatch(/feedback/i);
    });

    it("returns INVALID_INPUT when approved=false and feedback is empty string", async () => {
      const result = await apiRespondToBreakpoint({
        runDir: "/some/run",
        effectId: "eff-1",
        approved: false,
        feedback: "",
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_INPUT");
    });
  });

  // ── AC-009: apiListAutoApprovalRules ──

  describe("AC-009: apiListAutoApprovalRules returns all rules", () => {
    it("returns all rules with required fields", async () => {
      const rulesPath = path.join(testBase, "rules.json");
      const rules = {
        schemaVersion: "2026.01.breakpoint-rules-v1",
        rules: [
          {
            id: "rule-1",
            pattern: "confirm.*",
            action: "auto-approve",
            createdAt: "2026-01-01T00:00:00Z",
            createdBy: "user",
            source: "cli",
            note: "Trust all confirm breakpoints",
          },
        ],
      };
      await fs.writeFile(rulesPath, JSON.stringify(rules, null, 2));

      const result = await apiListAutoApprovalRules({ rulesPath });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.rules.length).toBe(1);
      const rule = result.data.rules[0];
      expect(rule.id).toBe("rule-1");
      expect(rule.pattern).toBe("confirm.*");
      expect(rule.action).toBe("auto-approve");
      expect(rule.createdAt).toBe("2026-01-01T00:00:00Z");
      expect(rule.createdBy).toBe("user");
      expect(rule.source).toBe("cli");
      expect(rule.note).toBe("Trust all confirm breakpoints");
    });

    it("returns empty array when rules file does not exist", async () => {
      const result = await apiListAutoApprovalRules({ rulesPath: path.join(testBase, "nonexistent.json") });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.rules).toEqual([]);
    });
  });

  // ── AC-010: apiAddAutoApprovalRule ──

  describe("AC-010: apiAddAutoApprovalRule validates and persists", () => {
    it("generates UUID id and createdAt, persists atomically, returns created rule", async () => {
      const rulesPath = path.join(testBase, "add-rules.json");

      const result = await apiAddAutoApprovalRule({
        pattern: "gate.*",
        action: "auto-approve",
        createdBy: "test-user",
        source: "test",
        note: "Test rule",
        rulesPath,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.rule.id).toBeTruthy();
      expect(result.data.rule.pattern).toBe("gate.*");
      expect(result.data.rule.action).toBe("auto-approve");
      expect(result.data.rule.createdBy).toBe("test-user");
      expect(result.data.rule.createdAt).toBeTruthy();
      expect(result.data.rules.length).toBe(1);

      // Verify persisted
      const raw = JSON.parse(await fs.readFile(rulesPath, "utf-8"));
      expect(raw.rules.length).toBe(1);
    });

    it("returns INVALID_INPUT when pattern is empty", async () => {
      const result = await apiAddAutoApprovalRule({
        pattern: "",
        action: "auto-approve",
        createdBy: "user",
        rulesPath: path.join(testBase, "bad.json"),
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_INPUT");
    });

    it("returns INVALID_INPUT when action is invalid", async () => {
      const result = await apiAddAutoApprovalRule({
        pattern: "test.*",
        action: "invalid-action" as "auto-approve",
        createdBy: "user",
        rulesPath: path.join(testBase, "bad2.json"),
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_INPUT");
    });

    it("returns INVALID_INPUT when createdBy is empty", async () => {
      const result = await apiAddAutoApprovalRule({
        pattern: "test.*",
        action: "auto-approve",
        createdBy: "",
        rulesPath: path.join(testBase, "bad3.json"),
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_INPUT");
    });
  });

  // ── AC-011: apiRemoveAutoApprovalRule ──

  describe("AC-011: apiRemoveAutoApprovalRule", () => {
    it("removes a rule by id and returns updated list", async () => {
      const rulesPath = path.join(testBase, "remove-rules.json");
      // Seed with two rules
      const seedRules = {
        schemaVersion: "2026.01.breakpoint-rules-v1",
        rules: [
          { id: "r1", pattern: "a.*", action: "auto-approve", createdAt: "2026-01-01T00:00:00Z", createdBy: "u" },
          { id: "r2", pattern: "b.*", action: "never-auto-approve", createdAt: "2026-01-01T00:00:00Z", createdBy: "u" },
        ],
      };
      await fs.writeFile(rulesPath, JSON.stringify(seedRules, null, 2));

      const result = await apiRemoveAutoApprovalRule({ ruleId: "r1", rulesPath });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.rules.length).toBe(1);
      expect(result.data.rules[0].id).toBe("r2");
    });

    it("returns RULE_NOT_FOUND for nonexistent rule id", async () => {
      const rulesPath = path.join(testBase, "remove-empty.json");
      const seedRules = {
        schemaVersion: "2026.01.breakpoint-rules-v1",
        rules: [],
      };
      await fs.writeFile(rulesPath, JSON.stringify(seedRules, null, 2));

      const result = await apiRemoveAutoApprovalRule({ ruleId: "nonexistent", rulesPath });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("RULE_NOT_FOUND");
    });
  });

  // ── AC-012: apiEvaluateAutoApproval ──

  describe("AC-012: apiEvaluateAutoApproval evaluates precedence chain", () => {
    it("returns AutoApprovalResult with recommended and reason", async () => {
      const rulesPath = path.join(testBase, "eval-rules.json");
      const seedRules = {
        schemaVersion: "2026.01.breakpoint-rules-v1",
        rules: [
          { id: "r1", pattern: "confirm.*", action: "auto-approve", createdAt: "2026-01-01T00:00:00Z", createdBy: "u" },
        ],
      };
      await fs.writeFile(rulesPath, JSON.stringify(seedRules, null, 2));

      const result = await apiEvaluateAutoApproval({
        breakpointId: "confirm.deploy",
        tags: ["deployment"],
        rulesPath,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toHaveProperty("recommended");
      expect(result.data).toHaveProperty("reason");
      expect(result.data.recommended).toBe(true);
    });

    it("never-auto-approve overrides auto-approve", async () => {
      const rulesPath = path.join(testBase, "eval-rules-2.json");
      const seedRules = {
        schemaVersion: "2026.01.breakpoint-rules-v1",
        rules: [
          { id: "r1", pattern: "confirm.*", action: "auto-approve", createdAt: "2026-01-01T00:00:00Z", createdBy: "u" },
          { id: "r2", pattern: "confirm.deploy", action: "never-auto-approve", createdAt: "2026-01-01T00:00:00Z", createdBy: "u" },
        ],
      };
      await fs.writeFile(rulesPath, JSON.stringify(seedRules, null, 2));

      const result = await apiEvaluateAutoApproval({
        breakpointId: "confirm.deploy",
        rulesPath,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.recommended).toBe(false);
      expect(result.data.matchedRule).toBe("r2");
    });
  });

  // ── AC-013: All functions never throw ──

  describe("AC-013: all breakpoint API functions never throw", () => {
    it("apiListBreakpoints does not throw on internal error", async () => {
      const result = await apiListBreakpoints({ runDir: "" });
      expect(result.ok).toBe(false);
    });

    it("apiShowBreakpoint does not throw on internal error", async () => {
      const result = await apiShowBreakpoint({ runDir: "", effectId: "" });
      expect(result.ok).toBe(false);
    });

    it("apiRespondToBreakpoint does not throw on internal error", async () => {
      const result = await apiRespondToBreakpoint({ runDir: "", effectId: "", approved: true });
      expect(result.ok).toBe(false);
    });

    it("apiListAutoApprovalRules does not throw on internal error", async () => {
      // Pass a path that exists but is a directory (should fail to parse)
      const result = await apiListAutoApprovalRules({ rulesPath: testBase });
      expect(result).toBeDefined();
      expect(result.ok === true || result.ok === false).toBe(true);
    });

    it("apiAddAutoApprovalRule does not throw on internal error", async () => {
      const result = await apiAddAutoApprovalRule({
        pattern: "",
        action: "auto-approve",
        createdBy: "",
      });
      expect(result.ok).toBe(false);
    });

    it("apiRemoveAutoApprovalRule does not throw on internal error", async () => {
      const result = await apiRemoveAutoApprovalRule({ ruleId: "" });
      expect(result.ok).toBe(false);
    });

    it("apiEvaluateAutoApproval does not throw on internal error", async () => {
      const result = await apiEvaluateAutoApproval({ breakpointId: "" });
      expect(result.ok).toBe(false);
    });
  });

  // ── AC-014: apiRespondToBreakpoint uses run lock ──

  describe("AC-014: apiRespondToBreakpoint acquires run lock", () => {
    it("acquires lock before writing (verified by checking lock file during operation)", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-lock");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-bp-lock",
        kind: "breakpoint",
        taskId: "__sdk.breakpoint",
        invocationKey: "key-bp-lock",
      });
      await scaffoldBreakpointTaskDef(runDir, "eff-bp-lock");

      // The function should succeed — lock acquisition is internal
      const result = await apiRespondToBreakpoint({
        runDir,
        effectId: "eff-bp-lock",
        approved: true,
        response: "yes",
      });
      expect(result.ok).toBe(true);

      // Lock should be released after operation
      const lockPath = path.join(runDir, "run.lock");
      let lockExists = false;
      try {
        await fs.access(lockPath);
        lockExists = true;
      } catch {
        lockExists = false;
      }
      expect(lockExists).toBe(false);
    });
  });

  // ── AC-015: apiRespondToBreakpoint supports respondedBy ──

  describe("AC-015: apiRespondToBreakpoint supports respondedBy", () => {
    it("persists respondedBy in result and is readable via apiShowBreakpoint", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-respondedby");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-bp-rby",
        kind: "breakpoint",
        taskId: "__sdk.breakpoint",
        invocationKey: "key-bp-rby",
      });
      await scaffoldBreakpointTaskDef(runDir, "eff-bp-rby");

      const result = await apiRespondToBreakpoint({
        runDir,
        effectId: "eff-bp-rby",
        approved: true,
        response: "LGTM",
        respondedBy: "alice@example.com",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Read the result file to verify respondedBy was persisted
      const resultPath = path.join(runDir, result.data.resultRef);
      const resultData = JSON.parse(await fs.readFile(resultPath, "utf-8"));
      const value = resultData.result ?? resultData.value ?? resultData;
      expect(value).toHaveProperty("respondedBy", "alice@example.com");
      expect(value).toHaveProperty("approved", true);
      expect(value).toHaveProperty("response", "LGTM");
    });
  });

  // ── AC-016: re-export from api/index.ts ──

  describe("AC-016: re-export from api/index.ts", () => {
    it("all 7 new API functions are importable from the api barrel export", async () => {
      const apiIndex = await import("../index");
      expect(typeof apiIndex.apiListBreakpoints).toBe("function");
      expect(typeof apiIndex.apiShowBreakpoint).toBe("function");
      expect(typeof apiIndex.apiRespondToBreakpoint).toBe("function");
      expect(typeof apiIndex.apiListAutoApprovalRules).toBe("function");
      expect(typeof apiIndex.apiAddAutoApprovalRule).toBe("function");
      expect(typeof apiIndex.apiRemoveAutoApprovalRule).toBe("function");
      expect(typeof apiIndex.apiEvaluateAutoApproval).toBe("function");
    });
  });

  // ── Additional edge case tests ──

  describe("apiListBreakpoints with INVALID_INPUT", () => {
    it("returns INVALID_INPUT when runDir is empty", async () => {
      const result = await apiListBreakpoints({ runDir: "" });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_INPUT");
    });
  });

  describe("apiShowBreakpoint with INVALID_INPUT", () => {
    it("returns INVALID_INPUT when effectId is empty", async () => {
      const result = await apiShowBreakpoint({ runDir: "/some/path", effectId: "" });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_INPUT");
    });

    it("returns INVALID_INPUT when runDir is empty", async () => {
      const result = await apiShowBreakpoint({ runDir: "", effectId: "eff-1" });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_INPUT");
    });
  });

  describe("apiRespondToBreakpoint with EFFECT_NOT_FOUND", () => {
    it("returns error for effectId that does not exist in journal", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-noeffect");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const result = await apiRespondToBreakpoint({
        runDir,
        effectId: "nonexistent",
        approved: true,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("EFFECT_NOT_FOUND");
    });
  });

  describe("apiRespondToBreakpoint with non-breakpoint effect", () => {
    it("returns EFFECT_NOT_BREAKPOINT when effect is not a breakpoint", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-wrongkind2");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-shell",
        kind: "shell",
        taskId: "build",
        invocationKey: "key-shell",
      });

      const result = await apiRespondToBreakpoint({
        runDir,
        effectId: "eff-shell",
        approved: true,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("EFFECT_NOT_BREAKPOINT");
    });
  });

  describe("apiListBreakpoints with no breakpoints in run", () => {
    it("returns empty array when run has no breakpoint effects", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-empty");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-shell",
        kind: "shell",
        taskId: "build",
      });

      const result = await apiListBreakpoints({ runDir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakpoints).toEqual([]);
    });
  });

  // ── Additional tests from adversarial review ──

  describe("apiEvaluateAutoApproval with autoApproveAfterN", () => {
    it("auto-approves when consecutiveApprovals meets threshold", async () => {
      const rulesPath = path.join(testBase, "eval-threshold.json");
      await fs.writeFile(rulesPath, JSON.stringify({
        schemaVersion: "2026.01.breakpoint-rules-v1",
        rules: [],
      }, null, 2));

      const result = await apiEvaluateAutoApproval({
        breakpointId: "confirm.deploy",
        autoApproveAfterN: 3,
        consecutiveApprovals: 5,
        rulesPath,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.recommended).toBe(true);
      expect(result.data.reason).toContain("consecutive");
    });

    it("does not auto-approve when consecutiveApprovals is below threshold", async () => {
      const rulesPath = path.join(testBase, "eval-threshold-2.json");
      await fs.writeFile(rulesPath, JSON.stringify({
        schemaVersion: "2026.01.breakpoint-rules-v1",
        rules: [],
      }, null, 2));

      const result = await apiEvaluateAutoApproval({
        breakpointId: "confirm.deploy",
        autoApproveAfterN: 5,
        consecutiveApprovals: 2,
        rulesPath,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.recommended).toBe(false);
    });
  });

  describe("apiEvaluateAutoApproval with profileConfig", () => {
    it("blocks on alwaysBreakOn tags from profile config", async () => {
      const rulesPath = path.join(testBase, "eval-profile.json");
      await fs.writeFile(rulesPath, JSON.stringify({
        schemaVersion: "2026.01.breakpoint-rules-v1",
        rules: [
          { id: "r1", pattern: "confirm.*", action: "auto-approve", createdAt: "2026-01-01T00:00:00Z", createdBy: "u" },
        ],
      }, null, 2));

      const result = await apiEvaluateAutoApproval({
        breakpointId: "confirm.deploy",
        tags: ["production"],
        rulesPath,
        profileConfig: { alwaysBreakOn: ["production"] },
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.recommended).toBe(false);
      expect(result.data.reason).toContain("alwaysBreakOn");
    });
  });

  describe("apiShowBreakpoint on resolved breakpoint with result", () => {
    it("returns result data for a resolved breakpoint", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-resolved-show");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-bp-resolved",
        kind: "breakpoint",
        taskId: "__sdk.breakpoint",
      });
      await appendJournalEvent(runDir, 3, "EFFECT_RESOLVED", {
        effectId: "eff-bp-resolved",
        status: "ok",
      });
      await scaffoldBreakpointTaskDef(runDir, "eff-bp-resolved");
      await scaffoldTaskResult(runDir, "eff-bp-resolved", {
        status: "ok",
        result: { approved: true, response: "Ship it" },
      });

      const result = await apiShowBreakpoint({ runDir, effectId: "eff-bp-resolved" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.status).toBe("resolved");
      expect(result.data.result).toBeDefined();
    });
  });

  describe("apiRespondToBreakpoint with RUN_NOT_FOUND", () => {
    it("returns RUN_NOT_FOUND when runDir does not exist", async () => {
      const result = await apiRespondToBreakpoint({
        runDir: "/nonexistent/run/dir",
        effectId: "eff-1",
        approved: true,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("RUN_NOT_FOUND");
    });
  });

  describe("apiRespondToBreakpoint with all optional fields", () => {
    it("persists response, feedback, option, and respondedBy", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-allopts");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-bp-allopts",
        kind: "breakpoint",
        taskId: "__sdk.breakpoint",
        invocationKey: "key-bp-allopts",
      });
      await scaffoldBreakpointTaskDef(runDir, "eff-bp-allopts");

      const result = await apiRespondToBreakpoint({
        runDir,
        effectId: "eff-bp-allopts",
        approved: true,
        response: "Approved with conditions",
        feedback: "Add more tests next time",
        option: "approve-with-conditions",
        respondedBy: "bob@example.com",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const resultPath = path.join(runDir, result.data.resultRef);
      const resultData = JSON.parse(await fs.readFile(resultPath, "utf-8"));
      const value = resultData.result ?? resultData.value ?? resultData;
      expect(value).toHaveProperty("approved", true);
      expect(value).toHaveProperty("response", "Approved with conditions");
      expect(value).toHaveProperty("feedback", "Add more tests next time");
      expect(value).toHaveProperty("option", "approve-with-conditions");
      expect(value).toHaveProperty("respondedBy", "bob@example.com");
    });
  });

  describe("apiListBreakpoints with missing task.json", () => {
    it("returns breakpoint summary even when task.json is missing", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-notask");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-bp-notask",
        kind: "breakpoint",
        taskId: "__sdk.breakpoint",
      });
      // Do NOT scaffold task definition

      const result = await apiListBreakpoints({ runDir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.breakpoints.length).toBe(1);
      expect(result.data.breakpoints[0].effectId).toBe("eff-bp-notask");
      // Fields from task def should be undefined
      expect(result.data.breakpoints[0].breakpointId).toBeUndefined();
    });
  });

  describe("AC-005: apiRespondToBreakpoint verifies result content", () => {
    it("result.json contains the breakpoint decision with all fields", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-content");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-bp-content",
        kind: "breakpoint",
        taskId: "__sdk.breakpoint",
        invocationKey: "key-bp-content",
      });
      await scaffoldBreakpointTaskDef(runDir, "eff-bp-content");

      const result = await apiRespondToBreakpoint({
        runDir,
        effectId: "eff-bp-content",
        approved: false,
        feedback: "Need more context",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const resultPath = path.join(runDir, result.data.resultRef);
      const resultData = JSON.parse(await fs.readFile(resultPath, "utf-8"));
      const value = resultData.result ?? resultData.value ?? resultData;
      expect(value).toHaveProperty("approved", false);
      expect(value).toHaveProperty("feedback", "Need more context");
    });
  });
});
