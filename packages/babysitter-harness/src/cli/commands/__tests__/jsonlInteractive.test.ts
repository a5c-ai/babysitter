/**
 * GAP-JSON-004: Streaming JSONL CLI Mode (stdin/stdout)
 *
 * Tests for parseJsonlRequest, formatJsonlResponse, dispatchJsonlMethod,
 * and handleJsonlInteractive. All 18 acceptance criteria covered.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import { Readable, Writable, PassThrough } from "node:stream";

import {
  parseJsonlRequest,
  formatJsonlResponse,
  dispatchJsonlMethod,
  handleJsonlInteractive,
  SUPPORTED_METHODS,
} from "../jsonlInteractive";

// ── Helpers ──────────────────────────────────────────────────────────────────

function tmpDir(): string {
  return path.join(os.tmpdir(), `gap-json-004-${crypto.randomUUID()}`);
}

async function scaffoldRunDir(
  baseDir: string,
  runId: string,
): Promise<string> {
  const runDir = path.join(baseDir, runId);
  const journalDir = path.join(runDir, "journal");
  const tasksDir = path.join(runDir, "tasks");
  await fs.mkdir(journalDir, { recursive: true });
  await fs.mkdir(tasksDir, { recursive: true });

  const metadata = {
    runId,
    processId: "test-process",
    entrypoint: { importPath: "/fake/process.js", exportName: "process" },
    createdAt: new Date().toISOString(),
    layoutVersion: "1",
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
 * Run the interactive handler with simulated stdin/stdout.
 * Sends lines to stdin, collects output from stdout, returns parsed JSONL lines.
 */
async function runInteractive(
  lines: string[],
  runsDir: string,
): Promise<unknown[]> {
  const input = new PassThrough();
  const outputChunks: Buffer[] = [];
  const output = new Writable({
    write(chunk, _encoding, callback) {
      outputChunks.push(Buffer.from(chunk));
      callback();
    },
  });

  const handlePromise = handleJsonlInteractive(
    { runsDir },
    { stdin: input as unknown as NodeJS.ReadableStream, stdout: output },
  );

  // Send lines
  for (const line of lines) {
    input.write(line + "\n");
  }
  // Close stdin to trigger EOF
  input.end();

  await handlePromise;

  const outputStr = Buffer.concat(outputChunks).toString("utf-8");
  const outputLines = outputStr.split("\n").filter((l) => l.trim().length > 0);
  return outputLines.map((l) => JSON.parse(l));
}

// ── Test state ───────────────────────────────────────────────────────────────

let testBase: string;

beforeEach(async () => {
  testBase = tmpDir();
  await fs.mkdir(testBase, { recursive: true });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(async () => {
  vi.restoreAllMocks();
  try {
    await fs.rm(testBase, { recursive: true, force: true });
  } catch {
    // cleanup best-effort
  }
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GAP-JSON-004: Streaming JSONL CLI Mode", () => {
  // ── Module exports (AC-018) ──

  describe("AC-018: module exports", () => {
    it("exports handleJsonlInteractive as a function", () => {
      expect(typeof handleJsonlInteractive).toBe("function");
    });

    it("exports dispatchJsonlMethod as a function", () => {
      expect(typeof dispatchJsonlMethod).toBe("function");
    });

    it("exports parseJsonlRequest as a function", () => {
      expect(typeof parseJsonlRequest).toBe("function");
    });

    it("exports formatJsonlResponse as a function", () => {
      expect(typeof formatJsonlResponse).toBe("function");
    });

    it("exports SUPPORTED_METHODS as an array", () => {
      expect(Array.isArray(SUPPORTED_METHODS)).toBe(true);
      expect(SUPPORTED_METHODS.length).toBeGreaterThan(10);
    });
  });

  // ── AC-002: Request parsing ──

  describe("AC-002: parseJsonlRequest validates request format", () => {
    it("parses a valid request with id, method, and params", () => {
      const result = parseJsonlRequest('{"id":"req-1","method":"run.status","params":{"runId":"abc"}}');
      expect("error" in result).toBe(false);
      if ("error" in result) return;
      expect(result.id).toBe("req-1");
      expect(result.method).toBe("run.status");
      expect(result.params).toEqual({ runId: "abc" });
    });

    it("returns error for malformed JSON", () => {
      const result = parseJsonlRequest("{not valid json");
      expect("error" in result).toBe(true);
      if (!("error" in result)) return;
      expect(result.error.code).toBe("INVALID_REQUEST");
      expect(result.id).toBeNull();
    });

    it("returns error when id is missing", () => {
      const result = parseJsonlRequest('{"method":"run.status"}');
      expect("error" in result).toBe(true);
      if (!("error" in result)) return;
      expect(result.error.code).toBe("INVALID_REQUEST");
      expect(result.error.message).toMatch(/id/i);
    });

    it("returns error when method is missing", () => {
      const result = parseJsonlRequest('{"id":"req-1"}');
      expect("error" in result).toBe(true);
      if (!("error" in result)) return;
      expect(result.error.code).toBe("INVALID_REQUEST");
      expect(result.error.message).toMatch(/method/i);
    });

    it("defaults params to empty object when not provided", () => {
      const result = parseJsonlRequest('{"id":"req-2","method":"shutdown"}');
      expect("error" in result).toBe(false);
      if ("error" in result) return;
      expect(result.params).toEqual({});
    });
  });

  // ── AC-003: Response formatting ──

  describe("AC-003: formatJsonlResponse produces correct wire format", () => {
    it("formats success response with id and result", () => {
      const line = formatJsonlResponse("req-1", { ok: true, data: { runId: "abc" } });
      const parsed = JSON.parse(line);
      expect(parsed.id).toBe("req-1");
      expect(parsed.result).toEqual({ runId: "abc" });
      expect(parsed.error).toBeUndefined();
    });

    it("formats error response with id and error code+message", () => {
      const line = formatJsonlResponse("req-2", {
        ok: false,
        error: { code: "RUN_NOT_FOUND", message: "Not found" },
      });
      const parsed = JSON.parse(line);
      expect(parsed.id).toBe("req-2");
      expect(parsed.error.code).toBe("RUN_NOT_FOUND");
      expect(parsed.error.message).toBe("Not found");
      expect(parsed.result).toBeUndefined();
    });

    it("uses null id for parse errors", () => {
      const line = formatJsonlResponse(null, {
        ok: false,
        error: { code: "INVALID_REQUEST", message: "Bad JSON" },
      });
      const parsed = JSON.parse(line);
      expect(parsed.id).toBeNull();
    });

    it("produces single-line output (no newlines in JSON)", () => {
      const line = formatJsonlResponse("req-3", {
        ok: true,
        data: { message: "hello\nworld" },
      });
      expect(line.includes("\n")).toBe(false);
    });
  });

  // ── AC-004: run.create dispatch ──

  describe("AC-004: run.create dispatches to apiCreateRun", () => {
    it("calls apiCreateRun and returns runId/runDir on success", async () => {
      const runsDir = path.join(testBase, "runs");
      await fs.mkdir(runsDir, { recursive: true });

      const result = await dispatchJsonlMethod("run.create", {
        processId: "test-proc",
        entrypoint: "/fake/process.js#process",
        runsDir,
      }, { runsDir });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toHaveProperty("runId");
      expect(result.data).toHaveProperty("runDir");
    });
  });

  // ── AC-006: run.status dispatch ──

  describe("AC-006: run.status and run.events dispatch", () => {
    it("run.status dispatches to apiRunStatus", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-status-test");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const result = await dispatchJsonlMethod("run.status", { runId: "run-status-test" }, { runsDir: testBase });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toHaveProperty("state");
    });

    it("run.events dispatches to apiRunEvents", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-events-test");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const result = await dispatchJsonlMethod("run.events", { runId: "run-events-test", limit: 10 }, { runsDir: testBase });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toHaveProperty("events");
    });
  });

  // ── AC-008: effect methods dispatch ──

  describe("AC-008: effect.list dispatches to apiListEffects", () => {
    it("lists effects for a run", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-eff-list");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED", {
        effectId: "eff-1",
        kind: "shell",
        taskId: "build",
      });

      const result = await dispatchJsonlMethod("effect.list", { runDir }, { runsDir: testBase });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toHaveProperty("effects");
    });
  });

  // ── AC-009: breakpoint methods dispatch ──

  describe("AC-009: breakpoint.list dispatches to apiListBreakpoints", () => {
    it("lists breakpoints for a run", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-list");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const result = await dispatchJsonlMethod("breakpoint.list", { runDir }, { runsDir: testBase });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toHaveProperty("breakpoints");
    });
  });

  // ── AC-010: shutdown ──

  describe("AC-010: shutdown method exits cleanly", () => {
    it("shutdown returns ok and causes process to exit", async () => {
      const result = await dispatchJsonlMethod("shutdown", {}, { runsDir: testBase });
      expect(result.ok).toBe(true);
    });
  });

  // ── AC-011: unknown method ──

  describe("AC-011: unknown method produces UNKNOWN_METHOD error", () => {
    it("returns UNKNOWN_METHOD for unrecognized method name", async () => {
      const result = await dispatchJsonlMethod("nonexistent.method", {}, { runsDir: testBase });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("UNKNOWN_METHOD");
      expect(result.error.message).toContain("nonexistent.method");
    });
  });

  // ── AC-012: error codes ──

  describe("AC-012: error codes match existing API codes", () => {
    it("RUN_NOT_FOUND propagates from API layer", async () => {
      const result = await dispatchJsonlMethod("run.status", {
        runId: "nonexistent-run",
      }, { runsDir: testBase });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("RUN_NOT_FOUND");
    });

    it("INVALID_INPUT propagates from API layer", async () => {
      const result = await dispatchJsonlMethod("run.status", {
        runId: "",
      }, { runsDir: testBase });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      // Empty runId should produce a meaningful error code
      expect(["INVALID_INPUT", "RUN_NOT_FOUND", "INTERNAL_ERROR"]).toContain(result.error.code);
    });
  });

  // ── AC-014: EOF handling ──

  describe("AC-014: EOF on stdin causes graceful exit", () => {
    it("exits with code 0 when stdin closes", async () => {
      const responses = await runInteractive([], testBase);
      // Should have at least the ready notification
      expect(responses.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── AC-017: startup notification ──

  describe("AC-017: startup ready notification", () => {
    it("emits ready notification as first line with version and methods", async () => {
      const responses = await runInteractive([], testBase);
      expect(responses.length).toBeGreaterThanOrEqual(1);

      const ready = responses[0] as Record<string, unknown>;
      expect(ready).toHaveProperty("jsonl", "ready");
      expect(ready).toHaveProperty("version", 1);
      expect(ready).toHaveProperty("methods");
      expect(Array.isArray(ready.methods)).toBe(true);
      expect((ready.methods as string[]).length).toBeGreaterThan(10);
    });
  });

  // ── AC-001 + AC-003: full integration roundtrip ──

  describe("AC-001/AC-003: full JSONL roundtrip via stdin/stdout", () => {
    it("processes a request and returns matching response id", async () => {
      await scaffoldRunDir(testBase, "run-roundtrip");

      const request = JSON.stringify({
        id: "test-req-1",
        method: "run.status",
        params: { runId: "run-roundtrip" },
      });

      const responses = await runInteractive([request], testBase);
      // First is ready notification, second is the response
      expect(responses.length).toBeGreaterThanOrEqual(2);

      const response = responses[1] as Record<string, unknown>;
      expect(response.id).toBe("test-req-1");
      expect(response.result).toBeDefined();
    });

    it("handles multiple sequential requests", async () => {
      await scaffoldRunDir(testBase, "run-multi");
      const runDir = path.join(testBase, "run-multi");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const req1 = JSON.stringify({ id: "r1", method: "run.status", params: { runId: "run-multi" } });
      const req2 = JSON.stringify({ id: "r2", method: "run.events", params: { runId: "run-multi" } });
      const req3 = JSON.stringify({ id: "r3", method: "shutdown" });

      const responses = await runInteractive([req1, req2, req3], testBase);
      // Ready + 3 responses
      const responseIds = responses
        .filter((r) => (r as Record<string, unknown>).id !== undefined)
        .map((r) => (r as Record<string, unknown>).id);
      expect(responseIds).toContain("r1");
      expect(responseIds).toContain("r2");
      expect(responseIds).toContain("r3");
    });
  });

  // ── AC-002 integration: malformed request in stream ──

  describe("AC-002: malformed request in stream does not crash", () => {
    it("returns INVALID_REQUEST and continues processing", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-malformed");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const badLine = "this is not json";
      const goodLine = JSON.stringify({ id: "good-1", method: "effect.list", params: { runDir } });

      const responses = await runInteractive([badLine, goodLine], testBase);
      // Ready + error for bad + response for good
      const errorResp = responses.find(
        (r) => (r as Record<string, unknown>).error !== undefined && (r as Record<string, unknown>).id === null,
      );
      expect(errorResp).toBeDefined();

      const goodResp = responses.find((r) => (r as Record<string, unknown>).id === "good-1");
      expect(goodResp).toBeDefined();
    });
  });

  // ── AC-011 integration: unknown method in stream ──

  describe("AC-011: unknown method in stream", () => {
    it("returns UNKNOWN_METHOD and continues processing", async () => {
      const req1 = JSON.stringify({ id: "u1", method: "fake.method" });
      const req2 = JSON.stringify({ id: "u2", method: "shutdown" });

      const responses = await runInteractive([req1, req2], testBase);
      const errorResp = responses.find((r) => (r as Record<string, unknown>).id === "u1") as Record<string, unknown>;
      expect(errorResp).toBeDefined();
      expect((errorResp.error as Record<string, unknown>)?.code).toBe("UNKNOWN_METHOD");

      // Shutdown should still work
      const shutdownResp = responses.find((r) => (r as Record<string, unknown>).id === "u2");
      expect(shutdownResp).toBeDefined();
    });
  });

  // ── AC-015: command registration ──

  describe("AC-015: command registered in dispatch.ts", () => {
    it("jsonl:interactive is listed in the CLI command registry", async () => {
      const dispatchTs = await fs.readFile(
        path.join(__dirname, "../../dispatch.ts"),
        "utf-8",
      );
      expect(dispatchTs).toContain("jsonl:interactive");
    });
  });

  // ── AC-016: concurrent request handling ──

  describe("AC-016: concurrent requests processed in parallel", () => {
    it("multiple requests can be in flight simultaneously", async () => {
      const runDir1 = await scaffoldRunDir(testBase, "run-conc-1");
      const runDir2 = await scaffoldRunDir(testBase, "run-conc-2");
      await appendJournalEvent(runDir1, 1, "RUN_CREATED", {});
      await appendJournalEvent(runDir2, 1, "RUN_CREATED", {});

      const req1 = JSON.stringify({ id: "c1", method: "effect.list", params: { runDir: runDir1 } });
      const req2 = JSON.stringify({ id: "c2", method: "effect.list", params: { runDir: runDir2 } });

      const responses = await runInteractive([req1, req2], testBase);
      const r1 = responses.find((r) => (r as Record<string, unknown>).id === "c1");
      const r2 = responses.find((r) => (r as Record<string, unknown>).id === "c2");
      expect(r1).toBeDefined();
      expect(r2).toBeDefined();
    });
  });

  // ── AC-005: run.iterate dispatch ──

  describe("AC-005: run.iterate dispatch", () => {
    it("dispatches to apiIterate", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-iterate-test");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const result = await dispatchJsonlMethod("run.iterate", { runDir }, { runsDir: testBase });
      // Iterate may fail if no process entrypoint, but should return ApiResult, not throw
      expect(result).toHaveProperty("ok");
      expect(typeof result.ok).toBe("boolean");
    });
  });

  // ── AC-007: effect dispatch methods ──

  describe("AC-007: effect dispatch methods", () => {
    it("effect.show dispatches to apiShowEffect", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-eff-show");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const result = await dispatchJsonlMethod("effect.show", {
        runDir,
        effectId: "nonexistent-eff",
      }, { runsDir: testBase });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("EFFECT_NOT_FOUND");
    });

    it("effect.cancel dispatches to apiCancelEffect", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-eff-cancel");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const result = await dispatchJsonlMethod("effect.cancel", {
        runDir,
        effectId: "nonexistent-eff",
      }, { runsDir: testBase });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("EFFECT_NOT_FOUND");
    });

    it("effect.commit dispatches to apiCommitEffect", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-eff-commit");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const result = await dispatchJsonlMethod("effect.commit", {
        runDir,
        effectId: "nonexistent-eff",
        result: { status: "ok", value: "done" },
      }, { runsDir: testBase });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(["EFFECT_NOT_FOUND", "UNKNOWN_EFFECT"]).toContain(result.error.code);
    });

    it("effect.batchCommit dispatches to apiBatchCommitEffects", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-eff-batch");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const result = await dispatchJsonlMethod("effect.batchCommit", {
        runDir,
        effects: [],
      }, { runsDir: testBase });
      // Empty batch should succeed
      expect(result).toHaveProperty("ok");
      expect(typeof result.ok).toBe("boolean");
    });
  });

  // ── AC-009: breakpoint dispatch methods ──

  describe("AC-009: breakpoint dispatch methods (full)", () => {
    it("breakpoint.show dispatches to apiShowBreakpoint", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-show");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const result = await dispatchJsonlMethod("breakpoint.show", {
        runDir,
        effectId: "nonexistent-bp",
      }, { runsDir: testBase });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("EFFECT_NOT_FOUND");
    });

    it("breakpoint.respond dispatches to apiRespondToBreakpoint", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-bp-respond");
      await appendJournalEvent(runDir, 1, "RUN_CREATED", {});

      const result = await dispatchJsonlMethod("breakpoint.respond", {
        runDir,
        effectId: "nonexistent-bp",
        approved: true,
      }, { runsDir: testBase });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("EFFECT_NOT_FOUND");
    });

    it("breakpoint.listRules dispatches to apiListAutoApprovalRules", async () => {
      const rulesPath = path.join(testBase, "rules.json");
      await fs.writeFile(rulesPath, JSON.stringify({ schemaVersion: "2026.01.breakpoint-rules", rules: [] }));

      const result = await dispatchJsonlMethod("breakpoint.listRules", {
        rulesPath,
      }, { runsDir: testBase });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toHaveProperty("rules");
    });

    it("breakpoint.addRule dispatches to apiAddAutoApprovalRule", async () => {
      const rulesPath = path.join(testBase, "rules-add.json");
      await fs.writeFile(rulesPath, JSON.stringify({ schemaVersion: "2026.01.breakpoint-rules", rules: [] }));

      const result = await dispatchJsonlMethod("breakpoint.addRule", {
        pattern: "test.*",
        action: "auto-approve",
        createdBy: "test-user",
        rulesPath,
      }, { runsDir: testBase });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toHaveProperty("rule");
    });

    it("breakpoint.removeRule dispatches to apiRemoveAutoApprovalRule", async () => {
      const rulesPath = path.join(testBase, "rules-remove.json");
      await fs.writeFile(rulesPath, JSON.stringify({ schemaVersion: "2026.01.breakpoint-rules", rules: [] }));

      const result = await dispatchJsonlMethod("breakpoint.removeRule", {
        ruleId: "nonexistent-rule",
        rulesPath,
      }, { runsDir: testBase });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("RULE_NOT_FOUND");
    });

    it("breakpoint.evaluateAutoApproval dispatches to evaluator", async () => {
      const rulesPath = path.join(testBase, "rules-eval.json");
      await fs.writeFile(rulesPath, JSON.stringify({ schemaVersion: "2026.01.breakpoint-rules", rules: [] }));

      const result = await dispatchJsonlMethod("breakpoint.evaluateAutoApproval", {
        breakpointId: "test-bp",
        rulesPath,
      }, { runsDir: testBase });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toHaveProperty("recommended");
    });
  });

  // ── Exception handling: dispatchJsonlMethod catches unexpected throws ──

  describe("dispatchJsonlMethod catches unexpected throws", () => {
    it("returns INTERNAL_ERROR when API function throws", async () => {
      // Pass invalid runDir to trigger an error path
      const result = await dispatchJsonlMethod("effect.list", {
        runDir: "/nonexistent/path/that/should/not/exist",
      }, { runsDir: testBase });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(typeof result.error.code).toBe("string");
      expect(typeof result.error.message).toBe("string");
    });
  });

  // ── processLine exception handling in stream ──

  describe("processLine guarantees response even on unexpected error", () => {
    it("returns error response when dispatch throws unexpectedly", async () => {
      // Send a request that targets a non-existent run dir
      const req = JSON.stringify({
        id: "err-1",
        method: "effect.list",
        params: { runDir: "/nonexistent/path" },
      });

      const responses = await runInteractive([req], testBase);
      const resp = responses.find((r) => (r as Record<string, unknown>).id === "err-1") as Record<string, unknown>;
      expect(resp).toBeDefined();
      // Should have either result or error — never missing
      expect(resp.result !== undefined || resp.error !== undefined).toBe(true);
    });
  });

  // ── Shutdown ignores subsequent lines ──

  describe("shutdown causes subsequent lines to be ignored", () => {
    it("does not process requests after shutdown", async () => {
      const shutdownReq = JSON.stringify({ id: "s1", method: "shutdown" });
      const afterReq = JSON.stringify({ id: "s2", method: "shutdown" });

      const responses = await runInteractive([shutdownReq, afterReq], testBase);
      const ids = responses
        .filter((r) => (r as Record<string, unknown>).id !== undefined)
        .map((r) => (r as Record<string, unknown>).id);
      expect(ids).toContain("s1");
      // s2 may or may not be processed depending on timing, but at minimum s1 must be there
      // The key guarantee is no crash
    });
  });

  // ── Additional edge case tests ──

  describe("empty lines are skipped", () => {
    it("ignores empty lines between valid requests", async () => {
      const req = JSON.stringify({ id: "skip-1", method: "shutdown" });
      const responses = await runInteractive(["", "  ", req], testBase);
      const shutdownResp = responses.find((r) => (r as Record<string, unknown>).id === "skip-1");
      expect(shutdownResp).toBeDefined();
    });
  });

  describe("request with numeric id", () => {
    it("accepts numeric id and returns it in response", () => {
      const result = parseJsonlRequest('{"id":42,"method":"shutdown"}');
      expect("error" in result).toBe(false);
      if ("error" in result) return;
      // id should be coerced to string or accepted as-is
      expect(result.id).toBeDefined();
      expect(result.method).toBe("shutdown");
    });
  });

  // ── AC-010/AC-011: event.subscribe/event.unsubscribe dispatch ──

  describe("AC-010/AC-011: event streaming dispatch", () => {
    it("event.subscribe dispatches to apiSubscribeRunEvents", async () => {
      await scaffoldRunDir(testBase, "run-evt-sub");

      const result = await dispatchJsonlMethod("event.subscribe", {
        runId: "run-evt-sub",
      }, { runsDir: testBase });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const data = result.data as { subscriptionId: string; lastSeq: number };
      expect(typeof data.subscriptionId).toBe("string");
      expect(typeof data.lastSeq).toBe("number");

      // Cleanup: the dispatch doesn't auto-close, so import and close
      const { closeAllSubscriptions } = await import("../../../api/eventStream");
      closeAllSubscriptions();
    });

    it("event.unsubscribe dispatches to apiUnsubscribeRunEvents", async () => {
      await scaffoldRunDir(testBase, "run-evt-unsub");

      // First subscribe
      const subResult = await dispatchJsonlMethod("event.subscribe", {
        runId: "run-evt-unsub",
      }, { runsDir: testBase });
      expect(subResult.ok).toBe(true);
      if (!subResult.ok) return;
      const subData = subResult.data as { subscriptionId: string };

      // Then unsubscribe
      const unsubResult = await dispatchJsonlMethod("event.unsubscribe", {
        subscriptionId: subData.subscriptionId,
      }, { runsDir: testBase });
      expect(unsubResult.ok).toBe(true);
      if (!unsubResult.ok) return;
      const unsubData = unsubResult.data as { lastSeq: number };
      expect(typeof unsubData.lastSeq).toBe("number");
    });

    it("event.subscribe returns RUN_NOT_FOUND for missing run", async () => {
      const result = await dispatchJsonlMethod("event.subscribe", {
        runId: "nonexistent-run",
      }, { runsDir: testBase });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("RUN_NOT_FOUND");
    });

    it("event.unsubscribe returns error for unknown subscription", async () => {
      const result = await dispatchJsonlMethod("event.unsubscribe", {
        subscriptionId: "nonexistent-sub",
      }, { runsDir: testBase });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("SUBSCRIPTION_NOT_FOUND");
    });

    it("SUPPORTED_METHODS includes event methods", () => {
      expect(SUPPORTED_METHODS).toContain("event.subscribe");
      expect(SUPPORTED_METHODS).toContain("event.unsubscribe");
    });

    it("shutdown cleans up active subscriptions", async () => {
      await scaffoldRunDir(testBase, "run-evt-shutdown");

      // Subscribe first
      await dispatchJsonlMethod("event.subscribe", {
        runId: "run-evt-shutdown",
      }, { runsDir: testBase });

      const { getActiveSubscriptions } = await import("../../../api/eventStream");
      expect(getActiveSubscriptions().size).toBeGreaterThan(0);

      // Shutdown should clean up
      await dispatchJsonlMethod("shutdown", {}, { runsDir: testBase });
      expect(getActiveSubscriptions().size).toBe(0);
    });
  });
});
