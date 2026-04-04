/**
 * Regression tests for GitHub issue #107.
 *
 * The session-start hook handler in claudeCode.ts (handleSessionStartHookImpl)
 * silently fails when:
 *   1. CLAUDE_ENV_FILE is empty → session ID not persisted
 *   2. Both catch blocks only log in verbose mode → failures invisible
 *
 * These tests exercise the public interface via handleHookRun().
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleHookRun } from "../../cli/commands/hookRun";
import type { HookRunCommandArgs } from "../../cli/commands/hookRun";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  getSessionFilePath,
} from "../../session";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function makeTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "claude-session-start-test-"));
}

/**
 * Calls handleHookRun with a fake stdin providing the given JSON payload.
 * Mirrors the pattern used in geminiCli.test.ts.
 */
function callWithStdin(
  payload: string,
  args: HookRunCommandArgs,
): Promise<number> {
  const { Readable } = require("node:stream") as typeof import("node:stream");
  const fakeStdin = new Readable({
    read() {
      this.push(Buffer.from(payload, "utf8"));
      this.push(null);
    },
  });
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
let savedEnv: NodeJS.ProcessEnv;

beforeEach(async () => {
  tmpDir = await makeTmpDir();
  stateDir = path.join(tmpDir, "state");
  await fs.mkdir(stateDir, { recursive: true });

  stdoutChunks = [];
  stderrChunks = [];

  originalStdoutWrite = process.stdout.write;
  originalStderrWrite = process.stderr.write;

  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdoutChunks.push(
      typeof chunk === "string" ? chunk : Buffer.from(chunk).toString(),
    );
    return true;
  }) as typeof process.stdout.write;

  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderrChunks.push(
      typeof chunk === "string" ? chunk : Buffer.from(chunk).toString(),
    );
    return true;
  }) as typeof process.stderr.write;

  // Save env
  savedEnv = { ...process.env };
});

afterEach(async () => {
  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;
  vi.restoreAllMocks();

  // Restore env
  process.env = savedEnv;

  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup failures
  }
});

function getStdout(): string {
  return stdoutChunks.join("");
}

function getStderr(): string {
  return stderrChunks.join("");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Claude Code session-start hook (issue #107 regressions)", () => {
  it("args.pluginRoot propagates to process.env.CLAUDE_PLUGIN_ROOT", async () => {
    // Ensure CLAUDE_PLUGIN_ROOT is NOT set before the call
    delete process.env.CLAUDE_PLUGIN_ROOT;

    const sessionId = "propagation-test-session";
    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId }),
      {
        hookType: "session-start",
        harness: "claude-code",
        pluginRoot: tmpDir,
        stateDir,
        json: true,
      },
    );

    expect(code).toBe(0);
    // Bug #107: pluginRoot from args should be propagated to process.env
    // so downstream code that checks process.env.CLAUDE_PLUGIN_ROOT works.
    // If this fails, the bug is present.
    expect(process.env.CLAUDE_PLUGIN_ROOT).toBe(tmpDir);
  });

  // ---------------------------------------------------------------------------
  // Test: Warning logged when CLAUDE_ENV_FILE is unset
  // ---------------------------------------------------------------------------

  it("warns when CLAUDE_ENV_FILE is unset (not just in verbose mode)", async () => {
    delete process.env.CLAUDE_ENV_FILE;

    const sessionId = "env-file-warning-test";
    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId }),
      {
        hookType: "session-start",
        harness: "claude-code",
        stateDir,
        json: true,
        // Note: verbose is NOT set — the warning should still appear
      },
    );

    expect(code).toBe(0);
    // Bug #107: When CLAUDE_ENV_FILE is not set, the session ID cannot be
    // persisted to the env file. The handler should warn about this so
    // failures are visible, not just silently swallowed.
    const stderr = getStderr();
    expect(stderr).toMatch(/CLAUDE_ENV_FILE/i);
  });

  // ---------------------------------------------------------------------------
  // Test: stateDir defaults to ~/.a5c/state/ when no explicit args
  // ---------------------------------------------------------------------------

  it("stateDir defaults to ~/.a5c/state/ when no explicit stateDir or pluginRoot", async () => {
    delete process.env.CLAUDE_PLUGIN_ROOT;
    delete process.env.BABYSITTER_STATE_DIR;
    delete process.env.BABYSITTER_GLOBAL_STATE_DIR;

    const sessionId = "global-statedir-test";

    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId }),
      {
        hookType: "session-start",
        harness: "claude-code",
        // No stateDir, no pluginRoot — should resolve to ~/.a5c/state/
        json: true,
      },
    );

    expect(code).toBe(0);

    // The handler should create the session state file in ~/.a5c/state/
    const expectedStateDir = path.join(os.homedir(), ".a5c", "state");
    const filePath = getSessionFilePath(expectedStateDir, sessionId);
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);

    // Clean up
    await fs.rm(filePath, { force: true }).catch(() => {});
  });

  // ---------------------------------------------------------------------------
  // Test: Exit non-zero when all persistence fails
  // ---------------------------------------------------------------------------

  it("exits non-zero when both env-file and state-file persistence fail", async () => {
    // Set CLAUDE_ENV_FILE to a path that will fail (non-existent directory)
    process.env.CLAUDE_ENV_FILE = path.join(
      tmpDir,
      "nonexistent",
      "deeply",
      "nested",
      "env-file",
    );

    const sessionId = "all-fail-test";

    // Use a stateDir that does not exist and cannot be created
    // (point to a file path so mkdir would fail)
    const badStateFile = path.join(tmpDir, "blocker-file");
    await fs.writeFile(badStateFile, "not a directory");
    const impossibleStateDir = path.join(badStateFile, "state");

    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId }),
      {
        hookType: "session-start",
        harness: "claude-code",
        stateDir: impossibleStateDir,
        json: true,
      },
    );

    // Bug #107: When ALL persistence mechanisms fail, the handler should
    // return a non-zero exit code instead of silently succeeding.
    expect(code).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Test: Happy path — everything works
  // ---------------------------------------------------------------------------

  it("happy path: creates session state and returns 0 when CLAUDE_ENV_FILE is set", async () => {
    const envFilePath = path.join(tmpDir, "claude-env");
    await fs.writeFile(envFilePath, "");
    process.env.CLAUDE_ENV_FILE = envFilePath;

    const sessionId = "happy-path-test";

    const code = await callWithStdin(
      JSON.stringify({ session_id: sessionId }),
      {
        hookType: "session-start",
        harness: "claude-code",
        pluginRoot: tmpDir,
        stateDir,
        json: true,
      },
    );

    expect(code).toBe(0);
    expect(getStdout().trim()).toBe("{}");

    // Verify session ID was appended to env file
    const envContent = await fs.readFile(envFilePath, "utf8");
    expect(envContent).toContain(`BABYSITTER_SESSION_ID="${sessionId}"`);

    // Verify session state file was created
    const filePath = getSessionFilePath(stateDir, sessionId);
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);

    // Verify baseline state structure
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("active: true");
    expect(content).toContain("iteration: 1");
    expect(content).toContain('run_id: ""');
  });

  // ---------------------------------------------------------------------------
  // Test: No session_id → still returns 0 with empty output
  // ---------------------------------------------------------------------------

  it("returns 0 and outputs empty JSON when no session_id in input", async () => {
    const code = await callWithStdin(JSON.stringify({}), {
      hookType: "session-start",
      harness: "claude-code",
      stateDir,
      json: true,
    });

    expect(code).toBe(0);
    expect(getStdout().trim()).toBe("{}");
  });
});
