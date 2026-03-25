/**
 * Tests for the harness adapter module.
 *
 * Covers:
 *   - ClaudeCodeAdapter: isActive, resolveSessionId, resolveStateDir,
 *     resolvePluginRoot, findHookDispatcherPath
 *   - NullAdapter: all methods return safe defaults
 *   - Registry: detectAdapter, getAdapterByName, listSupportedHarnesses,
 *     singleton lifecycle (getAdapter/setAdapter/resetAdapter)
 */

import * as path from "node:path";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { writeFileSync } from "node:fs";
import { Readable } from "node:stream";
import { createClaudeCodeAdapter } from "../claudeCode";
import { writeSessionFile } from "../../session/write";
import { getSessionFilePath, readSessionFile, sessionFileExists } from "../../session/parse";
import { appendEvent } from "../../storage/journal";
import { createCodexAdapter } from "../codex";
import { createNullAdapter } from "../nullAdapter";
import {
  detectAdapter,
  getAdapterByName,
  listSupportedHarnesses,
  getAdapter,
  setAdapter,
  resetAdapter,
} from "../registry";

// ---------------------------------------------------------------------------
// Env cleanup helper
// ---------------------------------------------------------------------------

const ENV_KEYS = [
  "CLAUDE_SESSION_ID",
  "CLAUDE_ENV_FILE",
  "CLAUDE_PLUGIN_ROOT",
  "CODEX_THREAD_ID",
  "CODEX_SESSION_ID",
  "CODEX_ENV_FILE",
  "CODEX_PLUGIN_ROOT",
];
let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
  resetAdapter();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] !== undefined) {
      process.env[key] = savedEnv[key];
    } else {
      delete process.env[key];
    }
  }
  resetAdapter();
});

// ---------------------------------------------------------------------------
// ClaudeCodeAdapter
// ---------------------------------------------------------------------------

describe("ClaudeCodeAdapter", () => {
  it("has name 'claude-code'", () => {
    const adapter = createClaudeCodeAdapter();
    expect(adapter.name).toBe("claude-code");
  });

  describe("isActive", () => {
    it("returns false when no Claude env vars are set", () => {
      const adapter = createClaudeCodeAdapter();
      expect(adapter.isActive()).toBe(false);
    });

    it("returns true when CLAUDE_SESSION_ID is set", () => {
      process.env.CLAUDE_SESSION_ID = "test-session";
      const adapter = createClaudeCodeAdapter();
      expect(adapter.isActive()).toBe(true);
    });

    it("returns true when CLAUDE_ENV_FILE is set", () => {
      process.env.CLAUDE_ENV_FILE = "/tmp/env.sh";
      const adapter = createClaudeCodeAdapter();
      expect(adapter.isActive()).toBe(true);
    });
  });

  describe("resolveSessionId", () => {
    it("returns parsed.sessionId first", () => {
      process.env.CLAUDE_SESSION_ID = "env-session";
      const adapter = createClaudeCodeAdapter();
      expect(adapter.resolveSessionId({ sessionId: "explicit" })).toBe("explicit");
    });

    it("falls back to CLAUDE_SESSION_ID env", () => {
      process.env.CLAUDE_SESSION_ID = "env-session";
      const adapter = createClaudeCodeAdapter();
      expect(adapter.resolveSessionId({})).toBe("env-session");
    });

    it("returns undefined when nothing is set", () => {
      const adapter = createClaudeCodeAdapter();
      expect(adapter.resolveSessionId({})).toBeUndefined();
    });
  });

  describe("resolveStateDir", () => {
    it("returns explicit stateDir first", () => {
      const adapter = createClaudeCodeAdapter();
      expect(adapter.resolveStateDir({ stateDir: "/custom/state" })).toBe(path.resolve("/custom/state"));
    });

    it("derives from pluginRoot arg", () => {
      const adapter = createClaudeCodeAdapter();
      const result = adapter.resolveStateDir({ pluginRoot: "/plugins/babysitter" });
      expect(result).toContain("skills");
      expect(result).toContain("state");
    });

    it("derives from CLAUDE_PLUGIN_ROOT env", () => {
      process.env.CLAUDE_PLUGIN_ROOT = "/env/plugin";
      const adapter = createClaudeCodeAdapter();
      const result = adapter.resolveStateDir({});
      expect(result).toContain("skills");
      expect(result).toContain("state");
    });

    it("returns undefined when nothing is set", () => {
      const adapter = createClaudeCodeAdapter();
      expect(adapter.resolveStateDir({})).toBeUndefined();
    });
  });

  describe("resolvePluginRoot", () => {
    it("returns explicit pluginRoot first", () => {
      process.env.CLAUDE_PLUGIN_ROOT = "/env/plugin";
      const adapter = createClaudeCodeAdapter();
      expect(adapter.resolvePluginRoot({ pluginRoot: "/explicit" })).toBe(path.resolve("/explicit"));
    });

    it("falls back to CLAUDE_PLUGIN_ROOT env", () => {
      process.env.CLAUDE_PLUGIN_ROOT = "/env/plugin";
      const adapter = createClaudeCodeAdapter();
      expect(adapter.resolvePluginRoot({})).toBe(path.resolve("/env/plugin"));
    });

    it("returns undefined when nothing is set", () => {
      const adapter = createClaudeCodeAdapter();
      expect(adapter.resolvePluginRoot({})).toBeUndefined();
    });
  });

  describe("findHookDispatcherPath", () => {
    it("returns null when CLAUDE_PLUGIN_ROOT is not set", () => {
      const adapter = createClaudeCodeAdapter();
      expect(adapter.findHookDispatcherPath("/some/dir")).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// CodexAdapter
// ---------------------------------------------------------------------------

describe("CodexAdapter", () => {
  it("has name 'codex'", () => {
    const adapter = createCodexAdapter();
    expect(adapter.name).toBe("codex");
  });

  describe("isActive", () => {
    it("returns false when no Codex env vars are set", () => {
      const adapter = createCodexAdapter();
      expect(adapter.isActive()).toBe(false);
    });

    it("returns true when CODEX_THREAD_ID is set", () => {
      process.env.CODEX_THREAD_ID = "test-session";
      const adapter = createCodexAdapter();
      expect(adapter.isActive()).toBe(true);
    });
  });

  describe("resolveSessionId", () => {
    it("returns parsed.sessionId first", () => {
      process.env.CODEX_THREAD_ID = "env-session";
      const adapter = createCodexAdapter();
      expect(adapter.resolveSessionId({ sessionId: "explicit" })).toBe("explicit");
    });

    it("falls back to CODEX_THREAD_ID env", () => {
      process.env.CODEX_THREAD_ID = "env-session";
      const adapter = createCodexAdapter();
      expect(adapter.resolveSessionId({})).toBe("env-session");
    });

    it("falls back to legacy CODEX_SESSION_ID env", () => {
      process.env.CODEX_SESSION_ID = "legacy-session";
      const adapter = createCodexAdapter();
      expect(adapter.resolveSessionId({})).toBe("legacy-session");
    });
  });

  describe("resolveStateDir", () => {
    it("returns explicit stateDir first", () => {
      const adapter = createCodexAdapter();
      expect(adapter.resolveStateDir({ stateDir: "/custom/state" })).toBe(path.resolve("/custom/state"));
    });

    it("defaults to .a5c when no values are provided", () => {
      const adapter = createCodexAdapter();
      expect(adapter.resolveStateDir({})).toBe(path.resolve(".a5c"));
    });
  });

  it("reports codex-specific missing session ID guidance", () => {
    const adapter = createCodexAdapter();
    expect(adapter.getMissingSessionIdHint?.()).toContain("Codex hook callback");
  });

  it("advertises hook support on hook-capable platforms", () => {
    const adapter = createCodexAdapter();
    const expectedHookSupport = process.platform !== "win32";
    expect(adapter.supportsHookType?.("stop")).toBe(expectedHookSupport);
    expect(adapter.supportsHookType?.("session-start")).toBe(expectedHookSupport);
    expect(adapter.findHookDispatcherPath("/tmp")).toBeNull();
  });

  it("returns a codex harness label when binding a session", async () => {
    const adapter = createCodexAdapter();
    const result = await adapter.bindSession({
      sessionId: "codex-session",
      runId: "run-1",
      runDir: "/tmp/run-1",
      stateDir: "/tmp/state",
      prompt: "",
      verbose: false,
      json: true,
    });
    expect(result.harness).toBe("codex");
  });
});

// ---------------------------------------------------------------------------
// NullAdapter
// ---------------------------------------------------------------------------

describe("NullAdapter", () => {
  it("has name 'none'", () => {
    const adapter = createNullAdapter();
    expect(adapter.name).toBe("none");
  });

  it("isActive returns false", () => {
    const adapter = createNullAdapter();
    expect(adapter.isActive()).toBe(false);
  });

  it("resolveSessionId returns undefined", () => {
    const adapter = createNullAdapter();
    expect(adapter.resolveSessionId({ sessionId: "ignored" })).toBeUndefined();
  });

  it("resolveStateDir returns undefined", () => {
    const adapter = createNullAdapter();
    expect(adapter.resolveStateDir({})).toBeUndefined();
  });

  it("resolvePluginRoot returns explicit value", () => {
    const adapter = createNullAdapter();
    expect(adapter.resolvePluginRoot({ pluginRoot: "/root" })).toBe("/root");
  });

  it("resolvePluginRoot returns undefined when nothing set", () => {
    const adapter = createNullAdapter();
    expect(adapter.resolvePluginRoot({})).toBeUndefined();
  });

  it("bindSession returns error result", async () => {
    const adapter = createNullAdapter();
    const result = await adapter.bindSession({
      sessionId: "test",
      runId: "run-1",
      runDir: "/tmp",
      prompt: "",
      verbose: false,
      json: true,
    });
    expect(result.harness).toBe("none");
    expect(result.error).toBeTruthy();
  });

  it("findHookDispatcherPath returns null", () => {
    const adapter = createNullAdapter();
    expect(adapter.findHookDispatcherPath("/any")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

describe("Registry", () => {
  it("listSupportedHarnesses includes claude-code", () => {
    const harnesses = listSupportedHarnesses();
    expect(harnesses).toContain("claude-code");
    expect(harnesses).toContain("codex");
  });

  it("getAdapterByName returns adapter for claude-code", () => {
    const adapter = getAdapterByName("claude-code");
    expect(adapter).not.toBeNull();
    expect(adapter!.name).toBe("claude-code");
  });

  it("getAdapterByName returns null for unknown harness", () => {
    expect(getAdapterByName("unknown-harness")).toBeNull();
  });

  describe("detectAdapter", () => {
    it("returns codex adapter when codex env vars are set", () => {
      process.env.CODEX_THREAD_ID = "session-123";
      const adapter = detectAdapter();
      expect(adapter.name).toBe("codex");
    });

    it("returns claude-code adapter when env vars are set", () => {
      process.env.CLAUDE_SESSION_ID = "session-123";
      const adapter = detectAdapter();
      expect(adapter.name).toBe("claude-code");
    });

    it("returns custom adapter when no harness is active", () => {
      const adapter = detectAdapter();
      expect(adapter.name).toBe("custom");
    });
  });

  describe("singleton lifecycle", () => {
    it("getAdapter auto-detects on first call", () => {
      process.env.CLAUDE_SESSION_ID = "session-123";
      const adapter = getAdapter();
      expect(adapter.name).toBe("claude-code");
    });

    it("getAdapter returns cached adapter on subsequent calls", () => {
      const a1 = getAdapter();
      const a2 = getAdapter();
      expect(a1).toBe(a2);
    });

    it("setAdapter overrides the singleton", () => {
      const custom = createNullAdapter();
      setAdapter(custom);
      expect(getAdapter()).toBe(custom);
    });

    it("resetAdapter clears the singleton for re-detection", () => {
      // First: no env → custom adapter
      const a1 = getAdapter();
      expect(a1.name).toBe("custom");

      // Set env and reset → should re-detect
      process.env.CLAUDE_SESSION_ID = "session-123";
      resetAdapter();
      const a2 = getAdapter();
      expect(a2.name).toBe("claude-code");
    });
  });
});

// ---------------------------------------------------------------------------
// bindSession stale session handling (Issue #54)
// ---------------------------------------------------------------------------

describe("bindSession stale session handling", () => {
  let tmpDir: string;
  let stateDir: string;
  let runsDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "harness-bind-test-"));
    stateDir = path.join(tmpDir, "state");
    runsDir = path.join(tmpDir, "runs");
    await fs.mkdir(stateDir, { recursive: true });
    await fs.mkdir(runsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  function makeSessionState(runId: string) {
    return {
      active: true,
      iteration: 1,
      maxIterations: 256,
      runId,
      startedAt: "2026-01-01T00:00:00Z",
      lastIterationAt: "2026-01-01T00:00:00Z",
      iterationTimes: [],
    };
  }

  async function createRunWithTerminalEvent(runId: string, eventType: "RUN_COMPLETED" | "RUN_FAILED") {
    const runDir = path.join(runsDir, runId);
    await fs.mkdir(runDir, { recursive: true });
    await appendEvent({
      runDir,
      event: { reason: "test" },
      eventType,
    });
  }

  it("auto-releases stale terminal session (completed run) and binds new run", async () => {
    const sessionId = "test-session";
    const oldRunId = "old-run-completed";
    const newRunId = "new-run";

    // Create session bound to old run
    const filePath = getSessionFilePath(stateDir, sessionId);
    await writeSessionFile(filePath, makeSessionState(oldRunId), "old prompt");

    // Create old run with RUN_COMPLETED journal event
    await createRunWithTerminalEvent(oldRunId, "RUN_COMPLETED");

    const adapter = createClaudeCodeAdapter();
    const result = await adapter.bindSession({
      sessionId,
      runId: newRunId,
      runDir: path.join(runsDir, newRunId),
      stateDir,
      runsDir,
      prompt: "new prompt",
      verbose: false,
      json: false,
    });

    expect(result.error).toBeUndefined();
    expect(result.sessionId).toBe(sessionId);
    expect(result.stateFile).toBe(filePath);

    // Verify session is now bound to new run
    const session = await readSessionFile(filePath);
    expect(session.state.runId).toBe(newRunId);
  });

  it("auto-releases stale terminal session (failed run) and binds new run", async () => {
    const sessionId = "test-session";
    const oldRunId = "old-run-failed";
    const newRunId = "new-run";

    const filePath = getSessionFilePath(stateDir, sessionId);
    await writeSessionFile(filePath, makeSessionState(oldRunId), "old prompt");

    await createRunWithTerminalEvent(oldRunId, "RUN_FAILED");

    const adapter = createClaudeCodeAdapter();
    const result = await adapter.bindSession({
      sessionId,
      runId: newRunId,
      runDir: path.join(runsDir, newRunId),
      stateDir,
      runsDir,
      prompt: "new prompt",
      verbose: false,
      json: false,
    });

    expect(result.error).toBeUndefined();
    expect(result.sessionId).toBe(sessionId);

    const session = await readSessionFile(filePath);
    expect(session.state.runId).toBe(newRunId);
  });

  it("rejects when existing session is bound to active (non-terminal) run", async () => {
    const sessionId = "test-session";
    const oldRunId = "active-run";
    const newRunId = "new-run";

    const filePath = getSessionFilePath(stateDir, sessionId);
    await writeSessionFile(filePath, makeSessionState(oldRunId), "old prompt");

    // Create old run directory with NO terminal event (just a directory, no journal)
    const oldRunDir = path.join(runsDir, oldRunId);
    await fs.mkdir(oldRunDir, { recursive: true });

    const adapter = createClaudeCodeAdapter();
    const result = await adapter.bindSession({
      sessionId,
      runId: newRunId,
      runDir: path.join(runsDir, newRunId),
      stateDir,
      runsDir,
      prompt: "new prompt",
      verbose: false,
      json: false,
    });

    expect(result.error).toContain("Session bound to active run: active-run");
    expect(result.error).toContain("Complete or fail that run first");
    expect(result.error).toContain(filePath);
    expect(result.fatal).toBe(true);

    // Session file should still be bound to old run
    const session = await readSessionFile(filePath);
    expect(session.state.runId).toBe(oldRunId);
  });

  it("idempotent: succeeds when session is already bound to the same runId", async () => {
    const sessionId = "test-session";
    const runId = "same-run";

    const filePath = getSessionFilePath(stateDir, sessionId);
    await writeSessionFile(filePath, makeSessionState(runId), "prompt");

    const adapter = createClaudeCodeAdapter();
    const result = await adapter.bindSession({
      sessionId,
      runId,
      runDir: path.join(runsDir, runId),
      stateDir,
      runsDir,
      prompt: "prompt",
      verbose: false,
      json: false,
    });

    expect(result.error).toBeUndefined();
    expect(result.sessionId).toBe(sessionId);
    expect(result.stateFile).toBe(filePath);
  });

  it("works for no-runId case (session init without run)", async () => {
    const sessionId = "test-session";
    const filePath = getSessionFilePath(stateDir, sessionId);
    await writeSessionFile(filePath, makeSessionState(""), "prompt");

    const adapter = createClaudeCodeAdapter();
    const result = await adapter.bindSession({
      sessionId,
      runId: "new-run",
      runDir: path.join(runsDir, "new-run"),
      stateDir,
      runsDir,
      prompt: "prompt",
      verbose: false,
      json: false,
    });

    expect(result.error).toBeUndefined();
    expect(result.sessionId).toBe(sessionId);
  });

  it("falls back to old error behavior when runsDir is not provided", async () => {
    const sessionId = "test-session";
    const oldRunId = "old-run";
    const newRunId = "new-run";

    const filePath = getSessionFilePath(stateDir, sessionId);
    await writeSessionFile(filePath, makeSessionState(oldRunId), "prompt");

    const adapter = createClaudeCodeAdapter();
    const result = await adapter.bindSession({
      sessionId,
      runId: newRunId,
      runDir: path.join(runsDir, newRunId),
      stateDir,
      // runsDir intentionally omitted
      prompt: "prompt",
      verbose: false,
      json: false,
    });

    // Without runsDir, can't check terminal state, so should return error
    expect(result.error).toContain("Session bound to active run: old-run");
  });
});

// ---------------------------------------------------------------------------
// Stop hook stale session fallback after /clear (Issue #69)
// ---------------------------------------------------------------------------

/**
 * Temporarily replaces process.stdin with a Readable that emits `payload`,
 * and captures process.stdout.write calls. Restores originals after `fn`.
 */
async function withSyntheticStdinAndCapturedStdout(
  payload: string,
  fn: () => Promise<number>,
): Promise<{ exitCode: number; stdout: string }> {
  const originalStdin = process.stdin;
  const fakeStdin = Readable.from([payload], { encoding: "utf8" });
  (fakeStdin as Readable & { unref?: () => void }).unref = () => {};

  Object.defineProperty(process, "stdin", {
    value: fakeStdin,
    writable: true,
    configurable: true,
  });

  let captured = "";
  const originalWrite = process.stdout.write.bind(process.stdout);
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(
    (chunk: string | Uint8Array, ...rest: unknown[]) => {
      if (typeof chunk === "string") captured += chunk;
      return true;
    },
  );

  try {
    const exitCode = await fn();
    return { exitCode, stdout: captured };
  } finally {
    writeSpy.mockRestore();
    Object.defineProperty(process, "stdin", {
      value: originalStdin,
      writable: true,
      configurable: true,
    });
  }
}

describe("stop hook stale session fallback (Issue #69)", () => {
  let tmpDir: string;
  let stateDir: string;
  let runsDir: string;
  let envFilePath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "harness-stop-hook-test-"));
    stateDir = path.join(tmpDir, "state");
    runsDir = path.join(tmpDir, "runs");
    envFilePath = path.join(tmpDir, "claude.env.sh");
    await fs.mkdir(stateDir, { recursive: true });
    await fs.mkdir(runsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  function makeSessionState(runId: string) {
    return {
      active: true,
      iteration: 1,
      maxIterations: 256,
      runId,
      startedAt: "2026-01-01T00:00:00Z",
      lastIterationAt: "2026-01-01T00:00:00Z",
      iterationTimes: [],
    };
  }

  /** Create a minimal run directory with run.json and a RUN_CREATED journal event. */
  async function createMinimalRun(runId: string) {
    const runDir = path.join(runsDir, runId);
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(
      path.join(runDir, "run.json"),
      JSON.stringify({
        runId,
        processId: "test-process",
        layoutVersion: "2026.01",
        createdAt: "2026-01-01T00:00:00Z",
        prompt: "test",
      }),
    );
    await appendEvent({
      runDir,
      event: { runId },
      eventType: "RUN_CREATED",
    });
  }

  it("falls back to env session ID when hook payload carries stale session", async () => {
    const staleSessionId = "stale-session-from-clear";
    const currentSessionId = "current-active-session";
    const runId = "test-run-001";

    // Write session file for the CURRENT session (not the stale one)
    const filePath = getSessionFilePath(stateDir, currentSessionId);
    await writeSessionFile(filePath, makeSessionState(runId), "test prompt");

    // Verify the stale session has no file
    expect(await sessionFileExists(getSessionFilePath(stateDir, staleSessionId))).toBe(false);
    // Verify the current session file exists
    expect(await sessionFileExists(filePath)).toBe(true);

    // Set CLAUDE_SESSION_ID to the current session (simulating env after /clear)
    process.env.CLAUDE_SESSION_ID = currentSessionId;

    // Create a proper run so the hook can determine run state
    await createMinimalRun(runId);

    const adapter = createClaudeCodeAdapter();

    // Send hook input with the STALE session ID (this is what happens after /clear)
    const hookPayload = JSON.stringify({ session_id: staleSessionId });

    const { exitCode, stdout } = await withSyntheticStdinAndCapturedStdout(
      hookPayload,
      () => adapter.handleStopHook({
        stateDir,
        runsDir,
        json: true,
        verbose: false,
      }),
    );

    // The hook should NOT have returned with empty output (which would mean
    // "no active loop found"). Instead it should have found the session via the
    // env fallback and returned a block decision with iteration context.
    const parsed = stdout.trim() ? JSON.parse(stdout.trim()) : {};
    expect(parsed).not.toEqual({});
    // The decision should block exit to continue the orchestration loop
    expect(parsed.decision).toBe("block");
  });

  it("allows exit when neither payload nor env session has a state file", async () => {
    const staleSessionId = "stale-session";
    const envSessionId = "env-session-also-unknown";

    // No session files exist for either ID
    process.env.CLAUDE_SESSION_ID = envSessionId;

    const adapter = createClaudeCodeAdapter();
    const hookPayload = JSON.stringify({ session_id: staleSessionId });

    const { exitCode, stdout } = await withSyntheticStdinAndCapturedStdout(
      hookPayload,
      () => adapter.handleStopHook({
        stateDir,
        runsDir,
        json: true,
        verbose: false,
      }),
    );

    // Should allow exit — no session file for either ID
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe("{}");
  });

  it("uses CLAUDE_ENV_FILE fallback when CLAUDE_SESSION_ID is not set", async () => {
    const staleSessionId = "stale-from-payload";
    const currentSessionId = "session-from-env-file";
    const runId = "test-run-002";

    // Write session file for the current session
    const filePath = getSessionFilePath(stateDir, currentSessionId);
    await writeSessionFile(filePath, makeSessionState(runId), "test prompt");

    // Create a proper run
    await createMinimalRun(runId);

    // Set CLAUDE_ENV_FILE instead of CLAUDE_SESSION_ID
    delete process.env.CLAUDE_SESSION_ID;
    writeFileSync(envFilePath, `export CLAUDE_SESSION_ID="${currentSessionId}"\n`, "utf-8");
    process.env.CLAUDE_ENV_FILE = envFilePath;

    const adapter = createClaudeCodeAdapter();
    const hookPayload = JSON.stringify({ session_id: staleSessionId });

    const { exitCode, stdout } = await withSyntheticStdinAndCapturedStdout(
      hookPayload,
      () => adapter.handleStopHook({
        stateDir,
        runsDir,
        json: true,
        verbose: false,
      }),
    );

    // Should find the session via env file fallback and block exit
    const parsed = stdout.trim() ? JSON.parse(stdout.trim()) : {};
    expect(parsed).not.toEqual({});
    expect(parsed.decision).toBe("block");
  });
});
