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
import { describe, it, expect, beforeEach, afterEach } from "vitest";
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
    expect(adapter.getMissingSessionIdHint?.()).toContain("Codex babysitter supervisor");
  });

  it("does not advertise stop-hook support", () => {
    const adapter = createCodexAdapter();
    expect(adapter.supportsHookType?.("stop")).toBe(false);
    expect(adapter.supportsHookType?.("session-start")).toBe(false);
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

    it("returns null adapter when no harness is active", () => {
      const adapter = detectAdapter();
      expect(adapter.name).toBe("none");
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
      // First: no env → null adapter
      const a1 = getAdapter();
      expect(a1.name).toBe("none");

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
