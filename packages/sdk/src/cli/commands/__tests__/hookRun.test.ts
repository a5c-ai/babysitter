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
import { handleHookRun } from "../hookRun";
import type { HookRunCommandArgs } from "../hookRun";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  writeSessionFile,
  getSessionFilePath,
  getCurrentTimestamp,
} from "../../../session";
import type { SessionState } from "../../../session";

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

  it("allows exit when max iterations reached", async () => {
    const sessionId = "max-iter-session";
    const filePath = getSessionFilePath(stateDir, sessionId);
    const now = getCurrentTimestamp();
    const state: SessionState = {
      active: true,
      iteration: 10,
      maxIterations: 10,
      runId: "test-run-1",
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
  });

  it("allows exit when no run is associated", async () => {
    const sessionId = "no-run-session";
    const filePath = getSessionFilePath(stateDir, sessionId);
    const now = getCurrentTimestamp();
    const state: SessionState = {
      active: true,
      iteration: 1,
      maxIterations: 100,
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
});

describe("handleHookRun session-start", () => {
  it("writes session ID to CLAUDE_ENV_FILE", async () => {
    const envFile = path.join(tmpDir, "env.sh");
    await fs.writeFile(envFile, "");
    const origEnvFile = process.env.CLAUDE_ENV_FILE;
    process.env.CLAUDE_ENV_FILE = envFile;

    try {
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
      const content = await fs.readFile(envFile, "utf8");
      expect(content).toContain('export CLAUDE_SESSION_ID="my-session-42"');
    } finally {
      if (origEnvFile !== undefined) {
        process.env.CLAUDE_ENV_FILE = origEnvFile;
      } else {
        delete process.env.CLAUDE_ENV_FILE;
      }
    }
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
