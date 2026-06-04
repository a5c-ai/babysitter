/**
 * GAP-JSON-001: Programmatic API — TDD Red Phase
 *
 * Tests for apiCreateRun, apiIterate, apiCommitEffect, apiRunStatus, apiRunEvents.
 * All 16 acceptance criteria are covered with 24 test cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

// Imports from the module under test (will fail until implementation — that's TDD).
import {
  apiCreateRun,
  apiIterate,
  apiCommitEffect,
  apiRunStatus,
  apiRunEvents,
} from "../runs";
import type { ApiResult } from "../runs";

// ── Helpers ──────────────────────────────────────────────────────────────────

function tmpDir(): string {
  return path.join(os.tmpdir(), `gap-json-001-${crypto.randomUUID()}`);
}

/**
 * Scaffold a minimal run directory with run.json and an empty journal/,
 * so that apiRunStatus / apiRunEvents can read it without needing the
 * full createRun machinery.
 */
async function scaffoldRunDir(
  runsDir: string,
  runId: string,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const runDir = path.join(runsDir, runId);
  const journalDir = path.join(runDir, "journal");
  await fs.mkdir(journalDir, { recursive: true });

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

// ── Test Suite ────────────────────────────────────────────────────────────────

describe("GAP-JSON-001: Programmatic API (runs)", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = tmpDir();
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  // ── AC-1: Module exports ───────────────────────────────────────────────

  describe("AC-1: module exports", () => {
    it("exports apiCreateRun as a function", () => {
      expect(typeof apiCreateRun).toBe("function");
    });

    it("exports apiIterate as a function", () => {
      expect(typeof apiIterate).toBe("function");
    });

    it("exports apiCommitEffect as a function", () => {
      expect(typeof apiCommitEffect).toBe("function");
    });

    it("exports apiRunStatus as a function", () => {
      expect(typeof apiRunStatus).toBe("function");
    });

    it("exports apiRunEvents as a function", () => {
      expect(typeof apiRunEvents).toBe("function");
    });
  });

  // ── AC-15: ApiResult<T> type ──────────────────────────────────────────

  describe("AC-15: ApiResult<T> type structure", () => {
    it("success envelope has ok:true and data property", async () => {
      // Use apiRunStatus on a scaffolded run to get a success result
      const runsDir = path.join(testDir, "runs");
      await scaffoldRunDir(runsDir, "run-type-check");

      const result = await apiRunStatus({ runId: "run-type-check", runsDir });
      if (result.ok) {
        // TypeScript should narrow to { ok: true, data: T }
        expect(result.data).toBeDefined();
        expect(result).not.toHaveProperty("error");
      } else {
        // Even if this path runs, verify error shape
        expect(result.error).toHaveProperty("code");
        expect(result.error).toHaveProperty("message");
      }
    });

    it("error envelope has ok:false and error with code+message", async () => {
      const result = await apiRunStatus({
        runId: "nonexistent",
        runsDir: path.join(testDir, "empty-runs"),
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(typeof result.error.code).toBe("string");
        expect(typeof result.error.message).toBe("string");
      }
    });
  });

  // ── AC-2: apiCreateRun accepts typed input and returns result ──────────

  describe("AC-2: apiCreateRun input/output contract", () => {
    it("accepts processId, entrypoint, runsDir and returns {runId, runDir}", async () => {
      const runsDir = path.join(testDir, "runs");
      await fs.mkdir(runsDir, { recursive: true });

      // Write a trivial process file for the entrypoint
      const processFile = path.join(testDir, "proc.js");
      await fs.writeFile(
        processFile,
        "module.exports.process = async (inputs, ctx) => inputs;",
      );

      const result = await apiCreateRun({
        processId: "test-proc",
        entrypoint: `${processFile}#process`,
        runsDir,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(typeof result.data.runId).toBe("string");
        expect(result.data.runId.length).toBeGreaterThan(0);
        expect(typeof result.data.runDir).toBe("string");
        // runDir should be under runsDir
        expect(result.data.runDir.replace(/\\/g, "/")).toContain(
          runsDir.replace(/\\/g, "/"),
        );
      }
    });
  });

  // ── AC-3: apiCreateRun validation — processId missing ─────────────────

  describe("AC-3: apiCreateRun rejects missing processId", () => {
    it("returns INVALID_INPUT when processId is missing", async () => {
      const runsDir = path.join(testDir, "runs");
      await fs.mkdir(runsDir, { recursive: true });

      // Cast to bypass TypeScript for the test
      const result = await apiCreateRun({
        processId: "" as string,
        entrypoint: "/some/path.js#process",
        runsDir,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_INPUT");
      }
    });

    it("returns INVALID_INPUT when processId is undefined", async () => {
      const runsDir = path.join(testDir, "runs");
      await fs.mkdir(runsDir, { recursive: true });

      const result = await apiCreateRun({
        processId: undefined as unknown as string,
        entrypoint: "/some/path.js#process",
        runsDir,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_INPUT");
      }
    });
  });

  // ── AC-4: apiCreateRun validation — entrypoint missing ────────────────

  describe("AC-4: apiCreateRun rejects missing entrypoint", () => {
    it("returns INVALID_INPUT when entrypoint is missing", async () => {
      const runsDir = path.join(testDir, "runs");
      await fs.mkdir(runsDir, { recursive: true });

      const result = await apiCreateRun({
        processId: "test-proc",
        entrypoint: "" as string,
        runsDir,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_INPUT");
      }
    });
  });

  // ── AC-16: apiCreateRun parses entrypoint with # separator ────────────

  describe("AC-16: apiCreateRun parses entrypoint with # separator", () => {
    it("correctly splits path#exportName from entrypoint string", async () => {
      const runsDir = path.join(testDir, "runs");
      await fs.mkdir(runsDir, { recursive: true });

      const processFile = path.join(testDir, "myProcess.js");
      await fs.writeFile(
        processFile,
        "module.exports.myExport = async (inputs, ctx) => inputs;",
      );

      const result = await apiCreateRun({
        processId: "test-proc",
        entrypoint: `${processFile}#myExport`,
        runsDir,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Verify the run was created — the entrypoint parsing worked
        const runJsonPath = path.join(result.data.runDir, "run.json");
        const runJson = JSON.parse(await fs.readFile(runJsonPath, "utf8"));
        expect(runJson.entrypoint.exportName).toBe("myExport");
      }
    });

    it("handles entrypoint without # separator (no export name)", async () => {
      const runsDir = path.join(testDir, "runs");
      await fs.mkdir(runsDir, { recursive: true });

      const processFile = path.join(testDir, "defaultProc.js");
      await fs.writeFile(
        processFile,
        "module.exports.process = async (inputs, ctx) => inputs;",
      );

      const result = await apiCreateRun({
        processId: "test-proc",
        entrypoint: processFile,
        runsDir,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const runJsonPath = path.join(result.data.runDir, "run.json");
        const runJson = JSON.parse(await fs.readFile(runJsonPath, "utf8"));
        // exportName should be undefined or not set when no # is present
        expect(runJson.entrypoint.exportName).toBeUndefined();
      }
    });
  });

  // ── AC-5: apiIterate accepts {runDir} and returns ApiIterateOutput ────

  describe("AC-5: apiIterate input/output contract", () => {
    it("accepts {runDir} and returns a result with status", async () => {
      const runsDir = path.join(testDir, "runs");
      const runDir = await scaffoldRunDir(runsDir, "iter-test");
      // Add a RUN_CREATED event so the run has minimal journal
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {
        runId: "iter-test",
        processId: "test-process",
      });

      // apiIterate wraps orchestrateIteration which needs a real process.
      // We expect it to either succeed or return an ok:false envelope —
      // never throw.
      const result = await apiIterate({ runDir });

      // Must return an ApiResult envelope, not throw
      expect(result).toHaveProperty("ok");
      if (result.ok) {
        expect(result.data).toHaveProperty("status");
      }
    });
  });

  // ── AC-6: apiIterate returns RUN_NOT_FOUND for bad runDir ─────────────

  describe("AC-6: apiIterate returns RUN_NOT_FOUND for invalid runDir", () => {
    it("returns {ok:false, error:{code:'RUN_NOT_FOUND'}} when runDir does not exist", async () => {
      const result = await apiIterate({
        runDir: path.join(testDir, "nonexistent-run"),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("RUN_NOT_FOUND");
      }
    });
  });

  // ── AC-7: apiCommitEffect input/output contract ───────────────────────

  describe("AC-7: apiCommitEffect input/output contract", () => {
    it("accepts {runDir, effectId, result} and returns {resultRef} on success", async () => {
      const runsDir = path.join(testDir, "runs");
      const runDir = await scaffoldRunDir(runsDir, "commit-test");

      // Scaffold a requested effect in the journal so commitEffect can find it
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {
        runId: "commit-test",
        processId: "test-process",
      });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-001",
        invocationKey: "test-key",
        stepId: "S000001",
        taskId: "test-task",
        kind: "node",
      });

      // Also scaffold the task directory with a task.json
      const taskDir = path.join(runDir, "tasks", "eff-001");
      await fs.mkdir(taskDir, { recursive: true });
      await fs.writeFile(
        path.join(taskDir, "task.json"),
        JSON.stringify({
          schemaVersion: "2026.01.tasks-v1",
          effectId: "eff-001",
          taskId: "test-task",
          invocationKey: "test-key",
          kind: "node",
          args: {},
        }),
      );

      const result = await apiCommitEffect({
        runDir,
        effectId: "eff-001",
        result: { status: "ok", value: { answer: 42 } },
      });

      expect(result).toHaveProperty("ok");
      if (result.ok) {
        expect(typeof result.data.resultRef).toBe("string");
      }
    });
  });

  // ── AC-8: apiCommitEffect returns UNKNOWN_EFFECT for bad effectId ─────

  describe("AC-8: apiCommitEffect returns UNKNOWN_EFFECT for nonexistent effectId", () => {
    it("returns {ok:false, error:{code:'UNKNOWN_EFFECT'}} for nonexistent effectId", async () => {
      const runsDir = path.join(testDir, "runs");
      const runDir = await scaffoldRunDir(runsDir, "commit-unknown");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {
        runId: "commit-unknown",
        processId: "test-process",
      });

      const result = await apiCommitEffect({
        runDir,
        effectId: "nonexistent-effect",
        result: { status: "ok", value: {} },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UNKNOWN_EFFECT");
      }
    });
  });

  // ── AC-9: apiRunStatus accepts {runId, runsDir} and returns status ────

  describe("AC-9: apiRunStatus input/output contract", () => {
    it("returns run status object with state and processId", async () => {
      const runsDir = path.join(testDir, "runs");
      await scaffoldRunDir(runsDir, "status-test", {
        processId: "my-process",
      });
      await appendJournalEvent(
        path.join(runsDir, "status-test"),
        1,
        "RUN_CREATED",
        { runId: "status-test", processId: "my-process" },
      );

      const result = await apiRunStatus({ runId: "status-test", runsDir });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveProperty("state");
        expect(result.data).toHaveProperty("processId");
        expect(result.data.processId).toBe("my-process");
      }
    });

    it("includes pendingEffects in the status when effects are pending", async () => {
      const runsDir = path.join(testDir, "runs");
      const runDir = await scaffoldRunDir(runsDir, "status-pending");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {
        runId: "status-pending",
        processId: "p",
      });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-pend-1",
        kind: "breakpoint",
      });

      const result = await apiRunStatus({ runId: "status-pending", runsDir });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.state).toBe("waiting");
        expect(result.data.pendingEffects).toBeDefined();
        expect(result.data.pendingEffects.length).toBe(1);
      }
    });
  });

  // ── AC-10: apiRunStatus returns RUN_NOT_FOUND when run does not exist ─

  describe("AC-10: apiRunStatus returns RUN_NOT_FOUND for missing run", () => {
    it("returns {ok:false, error:{code:'RUN_NOT_FOUND'}}", async () => {
      const runsDir = path.join(testDir, "empty-runs");
      await fs.mkdir(runsDir, { recursive: true });

      const result = await apiRunStatus({ runId: "does-not-exist", runsDir });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("RUN_NOT_FOUND");
      }
    });
  });

  // ── AC-11: apiRunEvents returns events array with limit/filter ────────

  describe("AC-11: apiRunEvents returns events array", () => {
    it("returns all events when no filter is applied", async () => {
      const runsDir = path.join(testDir, "runs");
      const runDir = await scaffoldRunDir(runsDir, "events-test");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "events-test" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", { effectId: "e1" });
      await appendJournalEvent(runDir, 3, "EFFECT_RESOLVED", { effectId: "e1" });

      const result = await apiRunEvents({ runId: "events-test", runsDir });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Array.isArray(result.data.events)).toBe(true);
        expect(result.data.events.length).toBe(3);
      }
    });

    it("respects limit parameter", async () => {
      const runsDir = path.join(testDir, "runs");
      const runDir = await scaffoldRunDir(runsDir, "events-limit");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", { effectId: "e1" });
      await appendJournalEvent(runDir, 3, "EFFECT_RESOLVED", { effectId: "e1" });

      const result = await apiRunEvents({
        runId: "events-limit",
        runsDir,
        limit: 2,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.events.length).toBeLessThanOrEqual(2);
      }
    });

    it("respects filterType parameter", async () => {
      const runsDir = path.join(testDir, "runs");
      const runDir = await scaffoldRunDir(runsDir, "events-filter");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", { effectId: "e1" });
      await appendJournalEvent(runDir, 3, "EFFECT_RESOLVED", { effectId: "e1" });

      const result = await apiRunEvents({
        runId: "events-filter",
        runsDir,
        filterType: "EFFECT_REQUESTED",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.events.length).toBe(1);
        expect(result.data.events[0].type).toBe("EFFECT_REQUESTED");
      }
    });
  });

  // ── AC-12: All API functions catch exceptions, never throw ────────────

  describe("AC-12: exception safety — all functions return envelopes", () => {
    it("apiCreateRun does not throw on internal error", async () => {
      // Pass a runsDir that is a file, not a directory — should cause an internal error
      const fakeFile = path.join(testDir, "not-a-dir");
      await fs.writeFile(fakeFile, "x");

      const result = await apiCreateRun({
        processId: "p",
        entrypoint: "/fake.js#process",
        runsDir: fakeFile,
      });

      // Must not throw — returns an envelope
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toHaveProperty("code");
        expect(result.error).toHaveProperty("message");
      }
    });

    it("apiIterate does not throw on internal error", async () => {
      const result = await apiIterate({
        runDir: path.join(testDir, "totally-bogus"),
      });
      expect(result.ok).toBe(false);
    });

    it("apiCommitEffect does not throw on internal error", async () => {
      const result = await apiCommitEffect({
        runDir: path.join(testDir, "totally-bogus"),
        effectId: "eff-nope",
        result: { status: "ok" },
      });
      expect(result.ok).toBe(false);
    });

    it("apiRunStatus does not throw on internal error", async () => {
      // runsDir that doesn't exist at all
      const result = await apiRunStatus({
        runId: "x",
        runsDir: path.join(testDir, "nope"),
      });
      expect(result.ok).toBe(false);
    });

    it("apiRunEvents does not throw on internal error", async () => {
      const result = await apiRunEvents({
        runId: "x",
        runsDir: path.join(testDir, "nope"),
      });
      expect(result.ok).toBe(false);
    });
  });

  // ── Adversarial review: limit=0 edge case ─────────────────────────────

  describe("apiRunEvents limit=0 edge case", () => {
    it("returns zero events when limit is 0", async () => {
      const runsDir = path.join(testDir, "runs");
      const runDir = await scaffoldRunDir(runsDir, "events-limit-zero");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", { runId: "events-limit-zero" });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", { effectId: "e1" });

      const result = await apiRunEvents({
        runId: "events-limit-zero",
        runsDir,
        limit: 0,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.events.length).toBe(0);
      }
    });
  });

  // ── Adversarial review: entrypoint with multiple # characters ────────

  describe("parseEntrypoint with multiple # characters", () => {
    it("correctly parses entrypoint when directory path contains #", async () => {
      const runsDir = path.join(testDir, "runs");
      await fs.mkdir(runsDir, { recursive: true });

      // Create a directory with # in the name
      const dirWithHash = path.join(testDir, "my#project");
      await fs.mkdir(dirWithHash, { recursive: true });
      const processFile = path.join(dirWithHash, "proc.js");
      await fs.writeFile(
        processFile,
        "module.exports.process = async (inputs, ctx) => inputs;",
      );

      const result = await apiCreateRun({
        processId: "test-proc",
        entrypoint: `${processFile}#process`,
        runsDir,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const runJsonPath = path.join(result.data.runDir, "run.json");
        const runJson = JSON.parse(await fs.readFile(runJsonPath, "utf8"));
        expect(runJson.entrypoint.exportName).toBe("process");
        // The importPath should contain the # from the directory name (not split on it)
        expect(runJson.entrypoint.importPath).toContain("my#project");
      }
    });
  });

  // ── Adversarial review: apiCommitEffect with status:'error' path ─────

  describe("apiCommitEffect with status:'error'", () => {
    it("accepts status:'error' with an error message", async () => {
      const runsDir = path.join(testDir, "runs");
      const runDir = await scaffoldRunDir(runsDir, "commit-error-test");

      await appendJournalEvent(runDir, 1, "RUN_CREATED", {
        runId: "commit-error-test",
        processId: "test-process",
      });
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-err-001",
        invocationKey: "test-key",
        stepId: "S000001",
        taskId: "test-task",
        kind: "node",
      });

      const taskDir = path.join(runDir, "tasks", "eff-err-001");
      await fs.mkdir(taskDir, { recursive: true });
      await fs.writeFile(
        path.join(taskDir, "task.json"),
        JSON.stringify({
          schemaVersion: "2026.01.tasks-v1",
          effectId: "eff-err-001",
          taskId: "test-task",
          invocationKey: "test-key",
          kind: "node",
          args: {},
        }),
      );

      const result = await apiCommitEffect({
        runDir,
        effectId: "eff-err-001",
        result: { status: "error", error: "Something went wrong" },
      });

      expect(result).toHaveProperty("ok");
      if (result.ok) {
        expect(typeof result.data.resultRef).toBe("string");
      }
    });
  });

  // ── Adversarial review: apiCommitEffect validation ───────────────────

  describe("apiCommitEffect input validation", () => {
    it("returns INVALID_INPUT when status is 'ok' but value is missing", async () => {
      const runsDir = path.join(testDir, "runs");
      const runDir = await scaffoldRunDir(runsDir, "commit-no-value");

      const result = await apiCommitEffect({
        runDir,
        effectId: "eff-001",
        result: { status: "ok" },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_INPUT");
        expect(result.error.message).toContain("value");
      }
    });

    it("returns INVALID_INPUT when status is 'error' but error message is missing", async () => {
      const runsDir = path.join(testDir, "runs");
      const runDir = await scaffoldRunDir(runsDir, "commit-no-error");

      const result = await apiCommitEffect({
        runDir,
        effectId: "eff-001",
        result: { status: "error" },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_INPUT");
        expect(result.error.message).toContain("error");
      }
    });
  });

  // ── Adversarial review: negative limit validation ─────────────────────

  describe("apiRunEvents negative limit validation", () => {
    it("returns INVALID_INPUT when limit is negative", async () => {
      const runsDir = path.join(testDir, "runs");
      await scaffoldRunDir(runsDir, "events-neg-limit");
      await appendJournalEvent(
        path.join(runsDir, "events-neg-limit"),
        1,
        "RUN_CREATED",
        { runId: "events-neg-limit" },
      );

      const result = await apiRunEvents({
        runId: "events-neg-limit",
        runsDir,
        limit: -5,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_INPUT");
        expect(result.error.message).toContain("limit");
      }
    });
  });

  // ── Adversarial review: apiRunStatus completed state ─────────────────

  describe("apiRunStatus completed state", () => {
    it("returns 'completed' state when run has RUN_COMPLETED event", async () => {
      const runsDir = path.join(testDir, "runs");
      const runDir = await scaffoldRunDir(runsDir, "status-completed", {
        processId: "completed-proc",
      });
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {
        runId: "status-completed",
        processId: "completed-proc",
      });
      await appendJournalEvent(runDir, 2, "RUN_COMPLETED", {
        output: { result: "done" },
      });

      const result = await apiRunStatus({ runId: "status-completed", runsDir });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.state).toBe("completed");
      }
    });
  });

  // ── Adversarial review: apiRunStatus failed state ────────────────────

  describe("apiRunStatus failed state", () => {
    it("returns 'failed' state when run has RUN_FAILED event", async () => {
      const runsDir = path.join(testDir, "runs");
      const runDir = await scaffoldRunDir(runsDir, "status-failed", {
        processId: "failed-proc",
      });
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {
        runId: "status-failed",
        processId: "failed-proc",
      });
      await appendJournalEvent(runDir, 2, "RUN_FAILED", {
        error: "Something went terribly wrong",
      });

      const result = await apiRunStatus({ runId: "status-failed", runsDir });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.state).toBe("failed");
      }
    });
  });

  // ── Adversarial review: apiCommitEffect with nonexistent runDir ──────

  describe("apiCommitEffect with nonexistent runDir", () => {
    it("returns an error envelope (does not throw) for nonexistent runDir", async () => {
      const result = await apiCommitEffect({
        runDir: path.join(testDir, "totally-nonexistent-run"),
        effectId: "eff-nope",
        result: { status: "ok", value: { x: 1 } },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toHaveProperty("code");
        expect(result.error).toHaveProperty("message");
      }
    });
  });

  // ── AC-13: Module re-exported from index.ts ───────────────────────────

  describe("AC-13: re-export from harness API barrel", () => {
    it("all 5 API functions are importable from the harness API barrel export", async () => {
      const api = await import("../../api");
      const exports = api as Record<string, unknown>;
      expect(typeof exports.apiCreateRun).toBe("function");
      expect(typeof exports.apiIterate).toBe("function");
      expect(typeof exports.apiCommitEffect).toBe("function");
      expect(typeof exports.apiRunStatus).toBe("function");
      expect(typeof exports.apiRunEvents).toBe("function");
    });
  });

  // ── AC-14: Backward compatibility — existing runtime functions unchanged

  describe("AC-14: backward compatibility", () => {
    it("createRun from runtime module is still importable and unchanged", async () => {
      const runtime = await import("../../runtime");
      expect(typeof runtime.createRun).toBe("function");
    });

    it("commitEffectResult from runtime module is still importable", async () => {
      const runtime = await import("../../runtime");
      expect(typeof runtime.commitEffectResult).toBe("function");
    });

    it("orchestrateIteration from runtime module is still importable", async () => {
      const runtime = await import("../../runtime");
      expect(typeof runtime.orchestrateIteration).toBe("function");
    });
  });
});
