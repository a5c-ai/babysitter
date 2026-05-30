/**
 * Tests for hook:run CLI command (handleHookRun).
 *
 * Covers:
 *   - Stop hook: approve when no session file, approve on completed run,
 *     block when run is active, max iteration guard
 *   - Session-start hook: writes session ID to CLAUDE_ENV_FILE
 *   - Dispatcher validation: missing hook type, unsupported harness
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleHookRun } from "../hooks/run";
import type { HookRunCommandArgs } from "../hooks/run";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  writeSessionFile,
  getSessionFilePath,
  getCurrentTimestamp,
  readSessionFile,
} from "../../../session";
import type { SessionState } from "../../../session";
import { appendEvent, loadJournal } from "../../../storage/journal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function makeTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "hookrun-test-"));
}

/**
 * Simulate stdin feeding a string payload, then call handleHookRun.
 * Replaces process.stdin with a readable that emits the given data then ends.
 */
function callWithStdin(payload: string, args: HookRunCommandArgs): Promise<number> {
  const { Readable } = require("node:stream") as typeof import("node:stream");
  const fakeStdin = new Readable({
    read() {
      this.push(Buffer.from(payload, "utf8"));
      this.push(null);
    },
  });
  // Add unref() stub — the session-start handler calls process.stdin.unref()
  // to avoid keeping the event loop alive, but Readable doesn't have it.
  (fakeStdin as unknown as Record<string, unknown>).unref = () => {};

  const originalStdin = process.stdin;
  Object.defineProperty(process, "stdin", {
    value: fakeStdin,
    writable: true,
    configurable: true,
  });

  return handleHookRun(args).finally(() => {
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
let stateDir: string;
let stdoutChunks: string[];
let stderrChunks: string[];
let originalStdoutWrite: typeof process.stdout.write;
let originalStderrWrite: typeof process.stderr.write;

beforeEach(async () => {
  tmpDir = await makeTmpDir();
  stateDir = path.join(tmpDir, "state");
  await fs.mkdir(stateDir, { recursive: true });

  stdoutChunks = [];
  stderrChunks = [];

  originalStdoutWrite = process.stdout.write;
  originalStderrWrite = process.stderr.write;

  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdoutChunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString());
    return true;
  }) as typeof process.stdout.write;

  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderrChunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString());
    return true;
  }) as typeof process.stderr.write;
});

afterEach(async () => {
  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;
  delete process.env.BABYSITTER_HOOK_BACKOFF_BASE;
  delete process.env.BABYSITTER_HOOK_BACKOFF_CAP;
  vi.useRealTimers();
  vi.restoreAllMocks();
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

function getStdout(): string {
  return stdoutChunks.join("");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("handleHookRun user-prompt-submit", () => {
  it("passes through payload below token threshold", async () => {
    const payload = JSON.stringify({ prompt: "Short prompt." });
    const code = await callWithStdin(payload, {
      hookType: "user-prompt-submit",
      harness: "claude-code",
      json: false,
    });
    expect(code).toBe(0);
    const out = JSON.parse(getStdout());
    expect(out.prompt).toBe("Short prompt.");
  });

  it("compresses payload above token threshold", async () => {
    // Build a long prompt: 80 varied sentences, well above default threshold of 500 tokens
    const sentences = Array.from({ length: 80 }, (_, i) =>
      `Sentence ${i} covers topic ${i % 10} with details about subject matter and relevant context.`
    );
    const prompt = sentences.join(" ");
    const payload = JSON.stringify({ prompt });
    const code = await callWithStdin(payload, {
      hookType: "user-prompt-submit",
      harness: "claude-code",
      json: false,
    });
    expect(code).toBe(0);
    const out = JSON.parse(getStdout());
    expect(typeof out.prompt).toBe("string");
    expect(out.prompt.length).toBeLessThan(prompt.length);
  });

  it("preserves non-prompt fields in payload", async () => {
    const sentences = Array.from({ length: 80 }, (_, i) =>
      `Sentence ${i} covers topic ${i % 10} with details about subject matter and relevant context.`
    );
    const payload = JSON.stringify({ prompt: sentences.join(" "), session_id: "abc123", extra: 42 });
    await callWithStdin(payload, {
      hookType: "user-prompt-submit",
      harness: "claude-code",
      json: false,
    });
    const out = JSON.parse(getStdout());
    expect(out.session_id).toBe("abc123");
    expect(out.extra).toBe(42);
  });

  it("passes through invalid JSON unchanged", async () => {
    const raw = "not-json";
    const code = await callWithStdin(raw, {
      hookType: "user-prompt-submit",
      harness: "claude-code",
      json: false,
    });
    expect(code).toBe(0);
    expect(getStdout()).toBe("not-json");
  });

  it("passes through when compression disabled via env var", async () => {
    const sentences = Array.from({ length: 80 }, (_, i) =>
      `Sentence ${i} covers topic ${i % 10} with details about subject matter and relevant context.`
    );
    const prompt = sentences.join(" ");
    const payload = JSON.stringify({ prompt });

    const prev = process.env["BABYSITTER_COMPRESSION_ENABLED"];
    process.env["BABYSITTER_COMPRESSION_ENABLED"] = "false";
    try {
      const code = await callWithStdin(payload, {
        hookType: "user-prompt-submit",
        harness: "claude-code",
        json: false,
      });
      expect(code).toBe(0);
      const out = JSON.parse(getStdout());
      expect(out.prompt).toBe(prompt);
    } finally {
      if (prev !== undefined) process.env["BABYSITTER_COMPRESSION_ENABLED"] = prev;
      else delete process.env["BABYSITTER_COMPRESSION_ENABLED"];
    }
  });

  it("passes through when user prompt layer disabled via env var", async () => {
    const sentences = Array.from({ length: 80 }, (_, i) =>
      `Sentence ${i} covers topic ${i % 10} with details about subject matter and relevant context.`
    );
    const prompt = sentences.join(" ");
    const payload = JSON.stringify({ prompt });

    const prev = process.env["BABYSITTER_COMPRESSION_USER_PROMPT"];
    process.env["BABYSITTER_COMPRESSION_USER_PROMPT"] = "0";
    try {
      const code = await callWithStdin(payload, {
        hookType: "user-prompt-submit",
        harness: "claude-code",
        json: false,
      });
      expect(code).toBe(0);
      const out = JSON.parse(getStdout());
      expect(out.prompt).toBe(prompt);
    } finally {
      if (prev !== undefined) process.env["BABYSITTER_COMPRESSION_USER_PROMPT"] = prev;
      else delete process.env["BABYSITTER_COMPRESSION_USER_PROMPT"];
    }
  });
});

describe("handleHookRun dispatcher", () => {
  it("rejects missing hook type", async () => {
    const code = await callWithStdin("{}", {
      hookType: "",
      harness: "claude-code",
      json: true,
    });
    expect(code).toBe(1);
    const stderr = stderrChunks.join("");
    expect(stderr).toContain("MISSING_HOOK_TYPE");
  });

  it("rejects unsupported harness", async () => {
    const code = await callWithStdin("{}", {
      hookType: "stop",
      harness: "unknown-harness",
      json: true,
    });
    expect(code).toBe(1);
    const stderr = stderrChunks.join("");
    expect(stderr).toContain("UNSUPPORTED_HARNESS");
  });

  it("handles codex stop hooks on every platform", async () => {
    const code = await callWithStdin("{}", {
      hookType: "stop",
      harness: "codex",
      json: true,
    });
    expect(code).toBe(0);
    const output = JSON.parse(getStdout().trim());
    expect(output.decision).toBeUndefined();
  });

  it("treats session-end as a stop-hook alias", async () => {
    const code = await callWithStdin("{}", {
      hookType: "session-end",
      harness: "codex",
      json: true,
    });
    expect(code).toBe(0);
    const output = JSON.parse(getStdout().trim());
    expect(output.decision).toBeUndefined();
  });
});

describe("handleHookRun stop", () => {
  const baseArgs: HookRunCommandArgs = {
    hookType: "stop",
    harness: "claude-code",
    stateDir: "", // set in each test
    runsDir: "", // set in each test
    json: true,
  };

  it("allows exit when no session ID in input", async () => {
    const code = await callWithStdin(JSON.stringify({}), {
      ...baseArgs,
      stateDir,
    });
    expect(code).toBe(0);
    const output = JSON.parse(getStdout().trim());
    // Adapter outputs empty object for approve (no decision field)
    expect(output.decision).toBeUndefined();
  });

  it("allows exit when no session state file exists", async () => {
    const code = await callWithStdin(
      JSON.stringify({ session_id: "nonexistent-session" }),
      { ...baseArgs, stateDir },
    );
    expect(code).toBe(0);
    const output = JSON.parse(getStdout().trim());
    expect(output.decision).toBeUndefined();
  });

  it("recovers a missing session state file for a hook-bound non-terminal run", async () => {
    const sessionId = "recoverable-missing-session";
    const runId = "recoverable-active-run";
    const runsDir = path.join(tmpDir, "runs");
    const runDir = path.join(runsDir, runId);
    const journalDir = path.join(runDir, "journal");
    await fs.mkdir(journalDir, { recursive: true });

    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify({
      schemaVersion: "2026.01.run-metadata",
      runId,
      processId: "test-process",
      harness: "claude-code",
      entrypoint: { importPath: "/tmp/test.js", exportName: "process" },
      layoutVersion: "2026.01-storage-preview",
      createdAt: new Date().toISOString(),
    }));
    await fs.writeFile(
      path.join(journalDir, "000001.01ARZ3NDEKTSV4RRFFQ69G5FAV.json"),
      JSON.stringify({
        type: "RUN_CREATED",
        recordedAt: new Date().toISOString(),
        data: { runId, processId: "test-process", harness: "claude-code", sessionId },
        checksum: "abc123",
      }),
    );

    const transcriptPath = path.join(tmpDir, "transcript-recoverable.jsonl");
    await fs.writeFile(transcriptPath, JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "text", text: "Still working." }] },
    }) + "\n");

    const filePath = getSessionFilePath(stateDir, sessionId);
    await expect(fs.access(filePath)).rejects.toThrow();

    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId, transcript_path: transcriptPath }),
      { ...baseArgs, stateDir, runsDir },
    );

    expect(code).toBe(0);
    const output = JSON.parse(getStdout().trim());
    expect(output.decision).toBe("block");
    const recovered = await readSessionFile(filePath);
    expect(recovered.state.active).toBe(true);
    expect(recovered.state.runId).toBe(runId);
    expect(recovered.state.runDir).toBe(runDir);
    expect(recovered.state.metadata?.recoveredFromMissingSessionFile).toBe("true");
  });

  it("fails loudly when missing-session recovery finds multiple active runs", async () => {
    const sessionId = "ambiguous-missing-session";
    const runsDir = path.join(tmpDir, "runs");

    for (const runId of ["ambiguous-run-a", "ambiguous-run-b"]) {
      const runDir = path.join(runsDir, runId);
      const journalDir = path.join(runDir, "journal");
      await fs.mkdir(journalDir, { recursive: true });
      await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify({
        schemaVersion: "2026.01.run-metadata",
        runId,
        processId: "test-process",
        harness: "claude-code",
        entrypoint: { importPath: "/tmp/test.js", exportName: "process" },
        layoutVersion: "2026.01-storage-preview",
        createdAt: new Date().toISOString(),
      }));
      await fs.writeFile(
        path.join(journalDir, `000001.${runId}.json`),
        JSON.stringify({
          type: "RUN_CREATED",
          recordedAt: new Date().toISOString(),
          data: { runId, processId: "test-process", harness: "claude-code", sessionId },
          checksum: "abc123",
        }),
      );
    }

    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId }),
      { ...baseArgs, stateDir, runsDir },
    );

    expect(code).toBe(1);
    expect(getStdout().trim()).toBe("{}");
    expect(stderrChunks.join("")).toContain("Multiple active runs");
  });

  it("allows exit when max iterations reached", async () => {
    const sessionId = "max-iter-session";
    const filePath = getSessionFilePath(stateDir, sessionId);
    const now = getCurrentTimestamp();
    const state: SessionState = {
      active: true,
      iteration: 10,
      maxIterations: 10,
      runId: "test-run-1",
      runIds: [],
      startedAt: now,
      lastIterationAt: now,
      iterationTimes: [],
    };
    await writeSessionFile(filePath, state, "Test prompt");

    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId }),
      { ...baseArgs, stateDir },
    );
    expect(code).toBe(0);
    const output = JSON.parse(getStdout().trim());
    expect(output.decision).toBeUndefined();
    const retained = await readSessionFile(filePath);
    expect(retained.state.active).toBe(false);
    expect(retained.state.metadata?.hookExitReason).toBe("max_iterations_reached");
  });

  it("allows exit when no run is associated", async () => {
    const sessionId = "no-run-session";
    const filePath = getSessionFilePath(stateDir, sessionId);
    const now = getCurrentTimestamp();
    const state: SessionState = {
      active: true,
      iteration: 1,
      maxIterations: 100,
      runIds: [],
      startedAt: now,
      lastIterationAt: now,
      iterationTimes: [],
    };
    await writeSessionFile(filePath, state, "Test prompt");

    // Create a minimal transcript file so it can be parsed
    const transcriptPath = path.join(tmpDir, "transcript.jsonl");
    await fs.writeFile(transcriptPath, JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "text", text: "Working on it..." }] },
    }) + "\n");

    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId, transcript_path: transcriptPath }),
      { ...baseArgs, stateDir },
    );
    expect(code).toBe(0);
    const output = JSON.parse(getStdout().trim());
    expect(output.decision).toBeUndefined();
    const retained = await readSessionFile(filePath);
    expect(retained.state.active).toBe(false);
    expect(retained.state.metadata?.hookExitReason).toBe("no_run_id");
  });

  it("allows exit for inactive retained sessions even when run remains associated", async () => {
    const sessionId = "inactive-associated-session";
    const filePath = getSessionFilePath(stateDir, sessionId);
    const now = getCurrentTimestamp();
    const state: SessionState = {
      active: false,
      iteration: 10,
      maxIterations: 10,
      runId: "still-associated-run",
      runIds: [],
      startedAt: now,
      lastIterationAt: now,
      iterationTimes: [],
      metadata: { hookExitReason: "completion_proof_matched" },
    };
    await writeSessionFile(filePath, state, "Test prompt");

    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId }),
      { ...baseArgs, stateDir },
    );

    expect(code).toBe(0);
    const output = JSON.parse(getStdout().trim());
    expect(output.decision).toBeUndefined();
  });

  it("blocks when session is active with run and transcript", async () => {
    // Create a run directory with journal showing an active run
    const runId = "test-run-active";
    const runsDir = path.join(tmpDir, "runs");
    const runDir = path.join(runsDir, runId);
    const journalDir = path.join(runDir, "journal");
    await fs.mkdir(journalDir, { recursive: true });

    // Write run.json
    const runMetadata = {
      schemaVersion: "2026.01.run-metadata",
      runId,
      processId: "test-process",
      entrypoint: { importPath: "/tmp/test.js", exportName: "process" },
      layoutVersion: 1,
      createdAt: new Date().toISOString(),
    };
    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify(runMetadata));

    // Write a RUN_CREATED journal entry
    const event = {
      type: "RUN_CREATED",
      recordedAt: new Date().toISOString(),
      data: { runId, processId: "test-process" },
      checksum: "abc123",
    };
    await fs.writeFile(
      path.join(journalDir, "000001.01ARZ3NDEKTSV4RRFFQ69G5FAV.json"),
      JSON.stringify(event),
    );

    // Create session state file associated with this run
    const sessionId = "active-run-session";
    const filePath = getSessionFilePath(stateDir, sessionId);
    const now = getCurrentTimestamp();
    const state: SessionState = {
      active: true,
      iteration: 2,
      maxIterations: 100,
      runId,
      runDir,
      runIds: [],
      startedAt: now,
      lastIterationAt: now,
      iterationTimes: [],
    };
    await writeSessionFile(filePath, state, "Continue orchestrating the run");

    // Create a transcript file with assistant text (no promise tag)
    const transcriptPath = path.join(tmpDir, "transcript.jsonl");
    await fs.writeFile(transcriptPath, JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "text", text: "I ran the iteration." }] },
    }) + "\n");

    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId, transcript_path: transcriptPath }),
      { ...baseArgs, stateDir, runsDir },
    );
    expect(code).toBe(0);
    const output = JSON.parse(getStdout().trim());
    expect(output.decision).toBe("block");
    expect(output.systemMessage).toContain("iteration 3");
    expect(output.reason).toBeTruthy();
  });

  it("uses the session's stored absolute runDir when the hook runs from a different cwd", async () => {
    const runId = "test-run-cross-cwd";
    const actualRunsDir = path.join(tmpDir, "project-b", ".a5c", "runs");
    const wrongRunsDir = path.join(tmpDir, "project-a", ".a5c", "runs");
    const runDir = path.join(actualRunsDir, runId);
    const journalDir = path.join(runDir, "journal");
    await fs.mkdir(journalDir, { recursive: true });
    await fs.mkdir(wrongRunsDir, { recursive: true });

    const runMetadata = {
      schemaVersion: "2026.01.run-metadata",
      runId,
      processId: "test-process",
      entrypoint: { importPath: "/tmp/test.js", exportName: "process" },
      layoutVersion: 1,
      createdAt: new Date().toISOString(),
    };
    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify(runMetadata));

    const event = {
      type: "RUN_CREATED",
      recordedAt: new Date().toISOString(),
      data: { runId, processId: "test-process" },
      checksum: "abc123",
    };
    await fs.writeFile(
      path.join(journalDir, "000001.01ARZ3NDEKTSV4RRFFQ69G5FAV.json"),
      JSON.stringify(event),
    );

    const sessionId = "cross-cwd-session";
    const filePath = getSessionFilePath(stateDir, sessionId);
    const now = getCurrentTimestamp();
    const state: SessionState = {
      active: true,
      iteration: 2,
      maxIterations: 100,
      runId,
      runDir,
      runIds: [],
      startedAt: now,
      lastIterationAt: now,
      iterationTimes: [],
    };
    await writeSessionFile(filePath, state, "Continue orchestrating the run");

    const transcriptPath = path.join(tmpDir, "transcript-cross-cwd.jsonl");
    await fs.writeFile(transcriptPath, JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "text", text: "I ran the iteration." }] },
    }) + "\n");

    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId, transcript_path: transcriptPath }),
      { ...baseArgs, stateDir, runsDir: wrongRunsDir },
    );
    expect(code).toBe(0);
    const output = JSON.parse(getStdout().trim());
    expect(output.decision).toBe("block");
    expect(output.systemMessage).toContain("iteration 3");
  });

  it("fails loudly when the stop hook cannot resolve the run directory", async () => {
    const sessionId = "missing-run-session";
    const runId = "missing-run";
    const filePath = getSessionFilePath(stateDir, sessionId);
    const now = getCurrentTimestamp();
    const state: SessionState = {
      active: true,
      iteration: 2,
      maxIterations: 100,
      runId,
      runIds: [],
      startedAt: now,
      lastIterationAt: now,
      iterationTimes: [],
    };
    await writeSessionFile(filePath, state, "Continue orchestrating the run");

    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId }),
      { ...baseArgs, stateDir, runsDir: path.join(tmpDir, "wrong-runs") },
    );
    expect(code).toBe(1);
    expect(stderrChunks.join("")).toContain(`Run ${runId} not found`);
    expect(getStdout().trim()).toBe("{}");
  });

  async function createRunMetadata(runDir: string, runId: string) {
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify({
      schemaVersion: "2026.01.run-metadata",
      runId,
      processId: "test-process",
      entrypoint: { importPath: "/tmp/test.js", exportName: "process" },
      layoutVersion: 1,
      createdAt: new Date().toISOString(),
      prompt: "test",
    }));
    await appendEvent({
      runDir,
      eventType: "RUN_CREATED",
      event: { runId, processId: "test-process" },
    });
  }

  async function requestAgentEffect(
    runDir: string,
    effectId: string,
    requestedAt?: string,
    taskDef: Record<string, unknown> = { kind: "agent", title: `Agent ${effectId}` },
  ) {
    const taskPath = path.join(runDir, "tasks", effectId, "task.json");
    await fs.mkdir(path.dirname(taskPath), { recursive: true });
    await fs.writeFile(taskPath, JSON.stringify(taskDef));
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId,
        invocationKey: `test:${effectId}`,
        stepId: `step-${effectId}`,
        taskId: `task-${effectId}`,
        taskDefRef: `tasks/${effectId}/task.json`,
        kind: "agent",
        label: "agent",
        ...(requestedAt ? { requestedAt } : {}),
      },
    });
  }

  async function resolveEffect(runDir: string, effectId: string) {
    await appendEvent({
      runDir,
      eventType: "EFFECT_RESOLVED",
      event: {
        effectId,
        status: "ok",
        resultRef: `tasks/${effectId}/result.json`,
      },
    });
  }

  async function cancelEffect(runDir: string, effectId: string) {
    await appendEvent({
      runDir,
      eventType: "EFFECT_CANCELLED",
      event: {
        effectId,
        reason: "test",
      },
    });
  }

  async function finishRun(runDir: string, eventType: "RUN_COMPLETED" | "RUN_FAILED") {
    await appendEvent({
      runDir,
      eventType,
      event: eventType === "RUN_COMPLETED"
        ? { result: { ok: true }, completionProof: "proof" }
        : { error: "failed" },
    });
  }

  async function createActiveSession(sessionId: string, runId: string, runDir: string) {
    const filePath = getSessionFilePath(stateDir, sessionId);
    const now = getCurrentTimestamp();
    const state: SessionState = {
      active: true,
      iteration: 2,
      maxIterations: 100,
      runId,
      runDir,
      runIds: [runId],
      startedAt: now,
      lastIterationAt: now,
      iterationTimes: [],
    };
    await writeSessionFile(filePath, state, "Continue orchestrating the run");
  }

  it("backs off repeated stop-hook blocks for the same pending effect and records metadata", async () => {
    process.env.BABYSITTER_HOOK_BACKOFF_BASE = "0.001";
    process.env.BABYSITTER_HOOK_BACKOFF_CAP = "0.09";
    const runId = "backoff-growth-run";
    const effectId = "effect-growth";
    const sessionId = "backoff-growth-session";
    const runsDir = path.join(tmpDir, "runs");
    const runDir = path.join(runsDir, runId);
    await createRunMetadata(runDir, runId);
    await requestAgentEffect(runDir, effectId);
    await createActiveSession(sessionId, runId, runDir);

    for (let index = 0; index < 3; index += 1) {
      stdoutChunks = [];
      const code = await callWithStdin(
        JSON.stringify({ session_id: sessionId }),
        { ...baseArgs, stateDir, runsDir },
      );
      expect(code).toBe(0);
      expect(JSON.parse(getStdout().trim()).decision).toBe("block");
    }

    const stopEvents = (await loadJournal(runDir)).filter((event) => event.type === "STOP_HOOK_INVOKED");
    expect(stopEvents.map((event) => event.data.effectId)).toEqual([effectId, effectId, effectId]);
    expect(stopEvents.map((event) => Number(event.data.hookBackoffDelaySeconds).toFixed(3))).toEqual([
      "0.001",
      "0.003",
      "0.009",
    ]);
    expect(stopEvents.map((event) => event.data.hookBackoffFireCount)).toEqual([0, 1, 2]);
  });

  it("honors stop-hook backoff env overrides and caps repeated delays", async () => {
    process.env.BABYSITTER_HOOK_BACKOFF_BASE = "0.001";
    process.env.BABYSITTER_HOOK_BACKOFF_CAP = "0.002";
    const runId = "backoff-env-run";
    const effectId = "effect-env";
    const sessionId = "backoff-env-session";
    const runsDir = path.join(tmpDir, "runs");
    const runDir = path.join(runsDir, runId);
    await createRunMetadata(runDir, runId);
    await requestAgentEffect(runDir, effectId);
    await createActiveSession(sessionId, runId, runDir);

    for (let index = 0; index < 3; index += 1) {
      stdoutChunks = [];
      await callWithStdin(
        JSON.stringify({ session_id: sessionId }),
        { ...baseArgs, stateDir, runsDir },
      );
    }

    const stopEvents = (await loadJournal(runDir)).filter((event) => event.type === "STOP_HOOK_INVOKED");
    expect(stopEvents.map((event) => event.data.hookBackoffDelaySeconds)).toEqual([0.001, 0.002, 0.002]);
  });

  it("starts fresh after pending effects resolve or cancel", async () => {
    process.env.BABYSITTER_HOOK_BACKOFF_BASE = "0.001";
    process.env.BABYSITTER_HOOK_BACKOFF_CAP = "0.06";
    const runId = "backoff-reset-run";
    const sessionId = "backoff-reset-session";
    const runsDir = path.join(tmpDir, "runs");
    const runDir = path.join(runsDir, runId);
    await createRunMetadata(runDir, runId);
    await requestAgentEffect(runDir, "effect-a");
    await createActiveSession(sessionId, runId, runDir);

    await callWithStdin(JSON.stringify({ session_id: sessionId }), { ...baseArgs, stateDir, runsDir });
    stdoutChunks = [];
    await resolveEffect(runDir, "effect-a");
    await requestAgentEffect(runDir, "effect-b");
    await callWithStdin(JSON.stringify({ session_id: sessionId }), { ...baseArgs, stateDir, runsDir });
    stdoutChunks = [];
    await cancelEffect(runDir, "effect-b");
    await requestAgentEffect(runDir, "effect-c");
    await callWithStdin(JSON.stringify({ session_id: sessionId }), { ...baseArgs, stateDir, runsDir });

    const stopEvents = (await loadJournal(runDir)).filter((event) => event.type === "STOP_HOOK_INVOKED");
    expect(stopEvents.map((event) => [event.data.effectId, event.data.hookBackoffDelaySeconds])).toEqual([
      ["effect-a", 0.001],
      ["effect-b", 0.001],
      ["effect-c", 0.001],
    ]);
  });

  it("continues for tasks-mux routed agent effects but exits for externally waiting routes", async () => {
    process.env.BABYSITTER_HOOK_BACKOFF_BASE = "0.001";
    process.env.BABYSITTER_HOOK_BACKOFF_CAP = "0.001";
    const runsDir = path.join(tmpDir, "runs");

    const agentRunId = "routed-agent-run";
    const agentRunDir = path.join(runsDir, agentRunId);
    await createRunMetadata(agentRunDir, agentRunId);
    await requestAgentEffect(agentRunDir, "routed-agent", undefined, {
      kind: "agent",
      agent: {
        responderType: "agent",
        adapter: "codex",
        prompt: { task: "review" },
      },
    });
    await createActiveSession("routed-agent-session", agentRunId, agentRunDir);

    let code = await callWithStdin(
      JSON.stringify({ session_id: "routed-agent-session" }),
      { ...baseArgs, stateDir, runsDir },
    );
    expect(code).toBe(0);
    expect(JSON.parse(getStdout().trim()).decision).toBe("block");

    stdoutChunks = [];

    const trackerRunId = "routed-tracker-run";
    const trackerRunDir = path.join(runsDir, trackerRunId);
    await createRunMetadata(trackerRunDir, trackerRunId);
    await requestAgentEffect(trackerRunDir, "routed-tracker", undefined, {
      kind: "agent",
      metadata: {
        responderType: "tracker",
        trackerBackend: "linear",
      },
    });
    await createActiveSession("routed-tracker-session", trackerRunId, trackerRunDir);

    code = await callWithStdin(
      JSON.stringify({ session_id: "routed-tracker-session" }),
      { ...baseArgs, stateDir, runsDir },
    );
    expect(code).toBe(0);
    expect(JSON.parse(getStdout().trim()).decision).toBeUndefined();
  });

  it("does not apply stale backoff metadata after a pending effect resolves", async () => {
    process.env.BABYSITTER_HOOK_BACKOFF_BASE = "0.001";
    process.env.BABYSITTER_HOOK_BACKOFF_CAP = "0.06";
    const runId = "backoff-post-resolve-run";
    const sessionId = "backoff-post-resolve-session";
    const runsDir = path.join(tmpDir, "runs");
    const runDir = path.join(runsDir, runId);
    await createRunMetadata(runDir, runId);
    await requestAgentEffect(runDir, "effect-resolved");
    await createActiveSession(sessionId, runId, runDir);

    await callWithStdin(JSON.stringify({ session_id: sessionId }), { ...baseArgs, stateDir, runsDir });
    stdoutChunks = [];
    await resolveEffect(runDir, "effect-resolved");
    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId }),
      { ...baseArgs, stateDir, runsDir },
    );

    expect(code).toBe(0);
    expect(JSON.parse(getStdout().trim()).decision).toBe("block");
    const stopEvents = (await loadJournal(runDir)).filter((event) => event.type === "STOP_HOOK_INVOKED");
    expect(stopEvents.at(-1)?.data.effectId).toBeUndefined();
    expect(stopEvents.at(-1)?.data.hookBackoffDelaySeconds).toBeUndefined();
  });

  it.each(["RUN_COMPLETED", "RUN_FAILED"] as const)(
    "does not apply stale backoff metadata after %s",
    async (eventType) => {
      process.env.BABYSITTER_HOOK_BACKOFF_BASE = "0.001";
      process.env.BABYSITTER_HOOK_BACKOFF_CAP = "0.06";
      const runId = `backoff-terminal-${eventType.toLowerCase()}`;
      const sessionId = `backoff-terminal-session-${eventType.toLowerCase()}`;
      const runsDir = path.join(tmpDir, "runs");
      const runDir = path.join(runsDir, runId);
      await createRunMetadata(runDir, runId);
      await requestAgentEffect(runDir, "effect-terminal");
      await createActiveSession(sessionId, runId, runDir);

      await callWithStdin(JSON.stringify({ session_id: sessionId }), { ...baseArgs, stateDir, runsDir });
      stdoutChunks = [];
      await finishRun(runDir, eventType);
      const code = await callWithStdin(
        JSON.stringify({ session_id: sessionId }),
        { ...baseArgs, stateDir, runsDir },
      );

      expect(code).toBe(0);
      const events = await loadJournal(runDir);
      const terminalIndex = events.findIndex((event) => event.type === eventType);
      expect(terminalIndex).toBeGreaterThanOrEqual(0);
      const terminalStopEvents = events
        .slice(terminalIndex + 1)
        .filter((event) => event.type === "STOP_HOOK_INVOKED");
      expect(terminalStopEvents.every((event) => event.data.effectId === undefined)).toBe(true);
      expect(terminalStopEvents.every((event) => event.data.hookBackoffDelaySeconds === undefined)).toBe(true);
    },
  );

  it("interrupts backoff promptly when the effect resolves during the wait", async () => {
    process.env.BABYSITTER_HOOK_BACKOFF_BASE = "0.05";
    process.env.BABYSITTER_HOOK_BACKOFF_CAP = "0.06";
    const runId = "backoff-interrupt-run";
    const effectId = "effect-interrupt";
    const sessionId = "backoff-interrupt-session";
    const runsDir = path.join(tmpDir, "runs");
    const runDir = path.join(runsDir, runId);
    await createRunMetadata(runDir, runId);
    await requestAgentEffect(runDir, effectId);
    await createActiveSession(sessionId, runId, runDir);

    const promise = callWithStdin(JSON.stringify({ session_id: sessionId }), {
      ...baseArgs,
      stateDir,
      runsDir,
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await resolveEffect(runDir, effectId);
    const code = await promise;

    expect(code).toBe(0);
    const stopEvents = (await loadJournal(runDir)).filter((event) => event.type === "STOP_HOOK_INVOKED");
    expect(stopEvents.at(-1)?.data.effectId).toBe(effectId);
    expect(stopEvents.at(-1)?.data.hookBackoffDelaySeconds).toBeLessThan(0.05);
    expect(stopEvents.at(-1)?.data.hookBackoffInterrupted).toBe(true);
  });
});

describe("handleHookRun session-start", () => {
  it("initializes session state from stdin session_id (env file writing moved to hooks-mux)", async () => {
    const code = await callWithStdin(
      JSON.stringify({ session_id: "my-session-42" }),
      {
        hookType: "session-start",
        harness: "claude-code",
        stateDir,
        json: true,
      },
    );
    expect(code).toBe(0);
    // Session state file should be created (env file writing is now handled by hooks-mux)
    const sessionPath = getSessionFilePath(stateDir, "my-session-42");
    const stat = await fs.stat(sessionPath).catch(() => null);
    expect(stat).not.toBeNull();
  });

  it("creates baseline session state file when stateDir is provided", async () => {
    const sessionId = "init-state-session";
    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId }),
      {
        hookType: "session-start",
        harness: "claude-code",
        stateDir,
        json: true,
      },
    );
    expect(code).toBe(0);

    // Verify state file was created
    const filePath = getSessionFilePath(stateDir, sessionId);
    const exists = await fs.access(filePath).then(() => true, () => false);
    expect(exists).toBe(true);

    // Verify it has the expected baseline content (no run association)
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("active: true");
    expect(content).toContain("iteration: 1");
    expect(content).toContain('run_id: ""');
  });

  it("does not overwrite existing session state file", async () => {
    const sessionId = "existing-state-session";
    const filePath = getSessionFilePath(stateDir, sessionId);
    const now = getCurrentTimestamp();
    const existingState: SessionState = {
      active: true,
      iteration: 5,
      maxIterations: 100,
      runId: "existing-run",
      runIds: [],
      startedAt: now,
      lastIterationAt: now,
      iterationTimes: [],
    };
    await writeSessionFile(filePath, existingState, "Existing prompt");

    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId }),
      {
        hookType: "session-start",
        harness: "claude-code",
        stateDir,
        json: true,
      },
    );
    expect(code).toBe(0);

    // Verify existing state was preserved (not overwritten)
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("iteration: 5");
    expect(content).toContain('run_id: "existing-run"');
  });

  it("outputs empty object when no session ID", async () => {
    const code = await callWithStdin(
      JSON.stringify({}),
      {
        hookType: "session-start",
        harness: "claude-code",
        json: true,
      },
    );
    expect(code).toBe(0);
    expect(getStdout().trim()).toBe("{}");
  });
});


