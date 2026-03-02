/**
 * Tests for hook:log CLI command (handleHookLog).
 *
 * Covers:
 *   - Field extraction for each known hook type
 *   - Log line formatting
 *   - File append behaviour
 *   - Validation (missing hook type, missing log file, malformed JSON)
 *   - Graceful handling of missing payload fields
 *   - Unknown hook type fallback
 *   - JSON output mode
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleHookLog } from "../hookLog";
import type { HookLogCommandArgs } from "../hookLog";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a temp directory for log file tests and return its path. */
async function makeTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "hooklog-test-"));
}

/**
 * Simulate stdin feeding a string payload, then call handleHookLog.
 * We mock process.stdin as a readable that emits the given data then ends.
 */
function callWithStdin(payload: string, args: HookLogCommandArgs): Promise<number> {
  const { Readable } = require("node:stream") as typeof import("node:stream");
  const fakeStdin = new Readable({
    read() {
      this.push(Buffer.from(payload, "utf8"));
      this.push(null);
    },
  });

  // Replace process.stdin temporarily
  const originalStdin = process.stdin;
  Object.defineProperty(process, "stdin", { value: fakeStdin, writable: true, configurable: true });

  return handleHookLog(args).finally(() => {
    Object.defineProperty(process, "stdin", {
      value: originalStdin,
      writable: true,
      configurable: true,
    });
  });
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let tmpDir: string;
let consoleSpy: { log: ReturnType<typeof vi.spyOn>; error: ReturnType<typeof vi.spyOn> };

beforeEach(async () => {
  tmpDir = await makeTmpDir();
  consoleSpy = {
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
  };
});

afterEach(async () => {
  consoleSpy.log.mockRestore();
  consoleSpy.error.mockRestore();
  // Clean up temp directory
  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
});

// =========================================================================
// 1. Field extraction for each hook type
// =========================================================================

describe("field extraction per hook type", () => {
  it("on-run-start: extracts runId, processId, entry", async () => {
    const logFile = path.join(tmpDir, "run-start.log");
    const payload = JSON.stringify({
      runId: "run-001",
      processId: "proc-abc",
      entry: "main.js",
    });

    const code = await callWithStdin(payload, { hookType: "on-run-start", logFile, json: false });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[RUN_START]");
    expect(content).toContain("hook=on-run-start");
    expect(content).toContain("runId=run-001");
    expect(content).toContain("processId=proc-abc");
    expect(content).toContain("entry=main.js");
  });

  it("on-task-complete: extracts runId, effectId, taskId, status, duration", async () => {
    const logFile = path.join(tmpDir, "task-complete.log");
    const payload = JSON.stringify({
      runId: "run-002",
      effectId: "eff-123",
      taskId: "task-xyz",
      status: "ok",
      duration: 1234,
    });

    const code = await callWithStdin(payload, {
      hookType: "on-task-complete",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[TASK_COMPLETE]");
    expect(content).toContain("runId=run-002");
    expect(content).toContain("effectId=eff-123");
    expect(content).toContain("taskId=task-xyz");
    expect(content).toContain("status=ok");
    expect(content).toContain("duration=1234");
  });

  it("on-breakpoint: extracts runId with fallback to context.runId, question, reason", async () => {
    const logFile = path.join(tmpDir, "breakpoint.log");
    // Test the fallback: runId at top level missing, present in context
    const payload = JSON.stringify({
      context: { runId: "run-ctx-003" },
      question: "Approve deployment?",
      reason: "staging passed",
    });

    const code = await callWithStdin(payload, {
      hookType: "on-breakpoint",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[BREAKPOINT]");
    expect(content).toContain("runId=run-ctx-003");
    expect(content).toContain("question=Approve deployment?");
    expect(content).toContain("reason=staging passed");
  });

  it("on-breakpoint: prefers top-level runId over context.runId", async () => {
    const logFile = path.join(tmpDir, "breakpoint2.log");
    const payload = JSON.stringify({
      runId: "run-top-level",
      context: { runId: "run-ctx-nested" },
      question: "Q?",
      reason: "R",
    });

    const code = await callWithStdin(payload, {
      hookType: "on-breakpoint",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("runId=run-top-level");
  });

  it("on-score: extracts runId, target, score", async () => {
    const logFile = path.join(tmpDir, "score.log");
    const payload = JSON.stringify({
      runId: "run-004",
      target: "quality",
      score: 92,
    });

    const code = await callWithStdin(payload, { hookType: "on-score", logFile, json: false });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[SCORE]");
    expect(content).toContain("runId=run-004");
    expect(content).toContain("target=quality");
    expect(content).toContain("score=92");
  });

  it("on-iteration-end: extracts runId, iteration, status", async () => {
    const logFile = path.join(tmpDir, "iteration-end.log");
    const payload = JSON.stringify({
      runId: "run-005",
      iteration: 3,
      status: "completed",
    });

    const code = await callWithStdin(payload, {
      hookType: "on-iteration-end",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[ITERATION_END]");
    expect(content).toContain("runId=run-005");
    expect(content).toContain("iteration=3");
    expect(content).toContain("status=completed");
  });

  it("on-run-fail: extracts runId, error, duration", async () => {
    const logFile = path.join(tmpDir, "run-fail.log");
    const payload = JSON.stringify({
      runId: "run-006",
      error: "timeout exceeded",
      duration: 5000,
    });

    const code = await callWithStdin(payload, { hookType: "on-run-fail", logFile, json: false });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[RUN_FAIL]");
    expect(content).toContain("runId=run-006");
    expect(content).toContain("error=timeout exceeded");
    expect(content).toContain("duration=5000");
  });

  it("on-run-complete: extracts runId, status, duration", async () => {
    const logFile = path.join(tmpDir, "run-complete.log");
    const payload = JSON.stringify({
      runId: "run-007",
      status: "completed",
      duration: 12345,
    });

    const code = await callWithStdin(payload, {
      hookType: "on-run-complete",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[RUN_COMPLETE]");
    expect(content).toContain("runId=run-007");
    expect(content).toContain("status=completed");
    expect(content).toContain("duration=12345");
  });

  it("on-task-start: extracts runId, effectId, taskId, kind", async () => {
    const logFile = path.join(tmpDir, "task-start.log");
    const payload = JSON.stringify({
      runId: "run-008",
      effectId: "eff-456",
      taskId: "task-build",
      kind: "node",
    });

    const code = await callWithStdin(payload, {
      hookType: "on-task-start",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[TASK_START]");
    expect(content).toContain("runId=run-008");
    expect(content).toContain("effectId=eff-456");
    expect(content).toContain("taskId=task-build");
    expect(content).toContain("kind=node");
  });

  it("on-step-dispatch: extracts runId, stepId, action", async () => {
    const logFile = path.join(tmpDir, "step-dispatch.log");
    const payload = JSON.stringify({
      runId: "run-009",
      stepId: "S000001",
      action: "execute",
    });

    const code = await callWithStdin(payload, {
      hookType: "on-step-dispatch",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[STEP_DISPATCH]");
    expect(content).toContain("runId=run-009");
    expect(content).toContain("stepId=S000001");
    expect(content).toContain("action=execute");
  });

  it("on-iteration-start: extracts runId, iteration", async () => {
    const logFile = path.join(tmpDir, "iteration-start.log");
    const payload = JSON.stringify({
      runId: "run-010",
      iteration: 1,
    });

    const code = await callWithStdin(payload, {
      hookType: "on-iteration-start",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[ITERATION_START]");
    expect(content).toContain("runId=run-010");
    expect(content).toContain("iteration=1");
  });

  it("pre-commit: extracts runId, files count, message", async () => {
    const logFile = path.join(tmpDir, "pre-commit.log");
    const payload = JSON.stringify({
      runId: "run-011",
      files: ["a.ts", "b.ts", "c.ts"],
      message: "fix: resolve race condition",
    });

    const code = await callWithStdin(payload, {
      hookType: "pre-commit",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[PRE_COMMIT]");
    expect(content).toContain("runId=run-011");
    expect(content).toContain("files=3");
    expect(content).toContain("message=fix: resolve race condition");
  });

  it("pre-branch: extracts runId, branch, base", async () => {
    const logFile = path.join(tmpDir, "pre-branch.log");
    const payload = JSON.stringify({
      runId: "run-012",
      branch: "feature/xyz",
      base: "main",
    });

    const code = await callWithStdin(payload, {
      hookType: "pre-branch",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[PRE_BRANCH]");
    expect(content).toContain("runId=run-012");
    expect(content).toContain("branch=feature/xyz");
    expect(content).toContain("base=main");
  });

  it("post-planning: extracts runId, planFile", async () => {
    const logFile = path.join(tmpDir, "post-planning.log");
    const payload = JSON.stringify({
      runId: "run-013",
      planFile: "/tmp/plan.md",
    });

    const code = await callWithStdin(payload, {
      hookType: "post-planning",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[POST_PLANNING]");
    expect(content).toContain("runId=run-013");
    expect(content).toContain("planFile=/tmp/plan.md");
  });
});

// =========================================================================
// 2. Log line format
// =========================================================================

describe("log line format", () => {
  it("follows the format [ISO_TIMESTAMP] [EVENT_LABEL] hook=type field=value ...", async () => {
    const logFile = path.join(tmpDir, "format.log");
    const payload = JSON.stringify({ runId: "run-fmt", processId: "p", entry: "e" });

    const code = await callWithStdin(payload, {
      hookType: "on-run-start",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = (await fs.readFile(logFile, "utf8")).trim();
    // Pattern: [2026-02-20T...Z] [RUN_START] hook=on-run-start runId=run-fmt ...
    const lineRegex =
      /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[RUN_START\] hook=on-run-start runId=run-fmt processId=p entry=e$/;
    expect(content).toMatch(lineRegex);
  });

  it("prints the log line to stdout in non-json mode", async () => {
    const logFile = path.join(tmpDir, "stdout.log");
    const payload = JSON.stringify({ runId: "run-stdout" });

    await callWithStdin(payload, { hookType: "on-score", logFile, json: false });

    expect(consoleSpy.log).toHaveBeenCalled();
    const printed = consoleSpy.log.mock.calls[0]?.[0] as string;
    expect(printed).toContain("[SCORE]");
    expect(printed).toContain("hook=on-score");
  });
});

// =========================================================================
// 3. File append behaviour
// =========================================================================

describe("file append behaviour", () => {
  it("appends multiple log lines to the same file", async () => {
    const logFile = path.join(tmpDir, "multi.log");

    await callWithStdin(JSON.stringify({ runId: "run-a" }), {
      hookType: "on-run-start",
      logFile,
      json: false,
    });
    await callWithStdin(JSON.stringify({ runId: "run-b" }), {
      hookType: "on-run-complete",
      logFile,
      json: false,
    });

    const content = await fs.readFile(logFile, "utf8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("[RUN_START]");
    expect(lines[1]).toContain("[RUN_COMPLETE]");
  });

  it("creates parent directories if they do not exist", async () => {
    const logFile = path.join(tmpDir, "nested", "deep", "hook.log");

    const code = await callWithStdin(JSON.stringify({ runId: "run-nested" }), {
      hookType: "on-run-start",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("runId=run-nested");
  });
});

// =========================================================================
// 4. Missing/invalid hook type
// =========================================================================

describe("missing/invalid hook type", () => {
  it("returns error code 1 when --hook-type is empty", async () => {
    const logFile = path.join(tmpDir, "no-hook.log");
    const code = await callWithStdin("{}", { hookType: "", logFile, json: false });
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalled();
    const errorMsg = consoleSpy.error.mock.calls[0]?.[0] as string;
    expect(errorMsg).toContain("--hook-type is required");
  });

  it("returns JSON error when --hook-type is empty and --json is set", async () => {
    const logFile = path.join(tmpDir, "no-hook-json.log");
    const code = await callWithStdin("{}", { hookType: "", logFile, json: true });
    expect(code).toBe(1);
    const errorMsg = consoleSpy.error.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(errorMsg) as { error: string; message: string };
    expect(parsed.error).toBe("MISSING_HOOK_TYPE");
  });

  it("handles unknown hook types gracefully with uppercased label fallback", async () => {
    const logFile = path.join(tmpDir, "custom.log");
    const payload = JSON.stringify({ runId: "run-custom", extra: "data" });

    const code = await callWithStdin(payload, {
      hookType: "my-custom-hook",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[MY_CUSTOM_HOOK]");
    expect(content).toContain("hook=my-custom-hook");
    expect(content).toContain("runId=run-custom");
  });
});

// =========================================================================
// 5. Missing log file path
// =========================================================================

describe("missing log file path", () => {
  it("returns error code 1 when --log-file is empty", async () => {
    const code = await callWithStdin("{}", { hookType: "on-run-start", logFile: "", json: false });
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalled();
    const errorMsg = consoleSpy.error.mock.calls[0]?.[0] as string;
    expect(errorMsg).toContain("--log-file is required");
  });

  it("returns JSON error when --log-file is empty and --json is set", async () => {
    const code = await callWithStdin("{}", { hookType: "on-run-start", logFile: "", json: true });
    expect(code).toBe(1);
    const errorMsg = consoleSpy.error.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(errorMsg) as { error: string; message: string };
    expect(parsed.error).toBe("MISSING_LOG_FILE");
  });
});

// =========================================================================
// 6. Malformed JSON input
// =========================================================================

describe("malformed JSON input", () => {
  it("returns error code 1 for invalid JSON", async () => {
    const logFile = path.join(tmpDir, "bad-json.log");
    const code = await callWithStdin("not valid json {{{", {
      hookType: "on-run-start",
      logFile,
      json: false,
    });
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalled();
    const errorMsg = consoleSpy.error.mock.calls[0]?.[0] as string;
    expect(errorMsg).toContain("Failed to parse JSON payload");
  });

  it("returns JSON error for invalid JSON when --json is set", async () => {
    const logFile = path.join(tmpDir, "bad-json2.log");
    const code = await callWithStdin("[1,2,3]", {
      hookType: "on-run-start",
      logFile,
      json: true,
    });
    expect(code).toBe(1);
    const errorMsg = consoleSpy.error.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(errorMsg) as { error: string; message: string };
    expect(parsed.error).toBe("INVALID_PAYLOAD");
    expect(parsed.message).toContain("JSON object");
  });

  it("handles empty stdin as empty JSON object", async () => {
    const logFile = path.join(tmpDir, "empty-stdin.log");
    const code = await callWithStdin("", { hookType: "on-run-start", logFile, json: false });
    // Empty string becomes "{}" via trim() || "{}", so it should succeed
    expect(code).toBe(0);
    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("[RUN_START]");
    // All fields should fallback to "unknown"
    expect(content).toContain("runId=unknown");
  });
});

// =========================================================================
// 7. Missing fields in payload (fallback handling)
// =========================================================================

describe("missing fields in payload", () => {
  it("uses 'unknown' fallback for missing string fields", async () => {
    const logFile = path.join(tmpDir, "missing-fields.log");
    // on-run-start expects runId, processId, entry — provide none
    const code = await callWithStdin("{}", { hookType: "on-run-start", logFile, json: false });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("runId=unknown");
    expect(content).toContain("processId=unknown");
    expect(content).toContain("entry=unknown");
  });

  it("uses 'N/A' fallback for on-breakpoint question and reason", async () => {
    const logFile = path.join(tmpDir, "bp-missing.log");
    const code = await callWithStdin("{}", { hookType: "on-breakpoint", logFile, json: false });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("question=N/A");
    expect(content).toContain("reason=N/A");
    // runId should be "unknown" since neither top-level nor context.runId present
    expect(content).toContain("runId=unknown");
  });

  it("uses 'unknown' for pre-commit files array when not an array", async () => {
    const logFile = path.join(tmpDir, "pre-commit-no-array.log");
    const payload = JSON.stringify({
      runId: "run-no-files",
      files: "not-an-array",
      message: "msg",
    });
    const code = await callWithStdin(payload, { hookType: "pre-commit", logFile, json: false });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("files=unknown");
  });

  it("converts numeric and boolean fields to strings", async () => {
    const logFile = path.join(tmpDir, "type-coerce.log");
    const payload = JSON.stringify({
      runId: 42,
      iteration: true,
      status: "ok",
    });
    const code = await callWithStdin(payload, {
      hookType: "on-iteration-end",
      logFile,
      json: false,
    });
    expect(code).toBe(0);

    const content = await fs.readFile(logFile, "utf8");
    expect(content).toContain("runId=42");
    expect(content).toContain("iteration=true");
  });
});

// =========================================================================
// 8. JSON output mode
// =========================================================================

describe("JSON output mode", () => {
  it("outputs structured JSON with hookType, eventLabel, logFile, logLine", async () => {
    const logFile = path.join(tmpDir, "json-out.log");
    const payload = JSON.stringify({ runId: "run-json", processId: "p", entry: "e" });

    const code = await callWithStdin(payload, {
      hookType: "on-run-start",
      logFile,
      json: true,
    });
    expect(code).toBe(0);

    expect(consoleSpy.log).toHaveBeenCalled();
    const output = JSON.parse(consoleSpy.log.mock.calls[0]?.[0] as string) as {
      hookType: string;
      eventLabel: string;
      logFile: string;
      logLine: string;
    };
    expect(output.hookType).toBe("on-run-start");
    expect(output.eventLabel).toBe("RUN_START");
    expect(output.logFile).toBe(path.resolve(logFile));
    expect(output.logLine).toContain("[RUN_START]");
    expect(output.logLine).toContain("runId=run-json");
  });
});
