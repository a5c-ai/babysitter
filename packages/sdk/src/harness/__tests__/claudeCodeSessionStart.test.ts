/**
 * Tests for the Claude Code session-start hook handler (unified behavior).
 *
 * After unification, the session-start hook uses the shared BaseAdapter
 * handler which:
 *   1. Reads session_id from stdin JSON
 *   2. Creates a session state file
 *   3. Returns 0 on success, 0 on graceful no-op (no session ID)
 *
 * CLAUDE_ENV_FILE writing and hookSpecificOutput are now handled by
 * hooks-mux, not the SDK session-start handler.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleHookRun } from "../../cli/commands/hooks/run";
import type { HookRunCommandArgs } from "../../cli/commands/hooks/run";
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Claude Code session-start hook (unified handler)", () => {
  it("creates session state file and returns 0", async () => {
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

  it("returns 0 even when state dir is invalid (graceful degradation)", async () => {
    const sessionId = "bad-statedir-test";

    // Use a stateDir that cannot be created (file blocking mkdir)
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

    // The unified handler returns 0 (graceful degradation)
    expect(code).toBe(0);
  });
});
