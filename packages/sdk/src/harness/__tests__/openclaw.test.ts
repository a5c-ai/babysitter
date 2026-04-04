/**
 * Tests for the OpenClaw harness adapter.
 *
 * Covers:
 *   - createOpenClawAdapter() returns valid adapter with correct name
 *   - isActive() detection via env vars (OPENCLAW_SHELL, OPENCLAW_HOME)
 *   - resolveSessionId() resolution chain (explicit > BABYSITTER_SESSION_ID > OPENCLAW_SHELL > undefined)
 *   - resolveStateDir() resolution (explicit arg vs global default)
 *   - resolvePluginRoot() always returns undefined
 *   - bindSession() state file creation and re-entrant run prevention
 *   - handleStopHook() no-op behavior
 *   - handleSessionStartHook() baseline state file creation
 *   - findHookDispatcherPath() returns null
 *   - autoResolvesSessionId() returns true
 *   - supportsHookType() session-start supported, stop not supported
 *   - getCapabilities() SessionBinding, Mcp, HeadlessPrompt present; StopHook absent
 *   - getPromptContext() hookDriven=false, loopControlTerm='agent_end'
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createOpenClawAdapter } from "../openclaw";
import { HarnessCapability } from "../types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  getSessionFilePath,
  writeSessionFile,
  getCurrentTimestamp,
  readSessionFile,
} from "../../session";
import type { SessionState } from "../../session";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function makeTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "openclaw-test-"));
}

// ---------------------------------------------------------------------------
// Setup / teardown — clean env between tests
// ---------------------------------------------------------------------------

const ENV_KEYS = [
  "OPENCLAW_SHELL",
  "OPENCLAW_HOME",
  "BABYSITTER_SESSION_ID",
  "BABYSITTER_STATE_DIR",
  "BABYSITTER_GLOBAL_STATE_DIR",
  "BABYSITTER_LOG_DIR",
];

const savedEnv: Record<string, string | undefined> = {};

let tmpDir: string;
let stateDir: string;
let stdoutChunks: string[];
let stderrChunks: string[];
let originalStdoutWrite: typeof process.stdout.write;
let originalStderrWrite: typeof process.stderr.write;

beforeEach(async () => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }

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
});

afterEach(async () => {
  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;

  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }

  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup
  }
});

// ---------------------------------------------------------------------------
// Adapter creation (factory)
// ---------------------------------------------------------------------------

describe("createOpenClawAdapter", () => {
  it("returns adapter with name 'openclaw'", () => {
    const adapter = createOpenClawAdapter();
    expect(adapter.name).toBe("openclaw");
  });

  it("returns an object implementing all required HarnessAdapter methods", () => {
    const adapter = createOpenClawAdapter();
    expect(typeof adapter.isActive).toBe("function");
    expect(typeof adapter.resolveSessionId).toBe("function");
    expect(typeof adapter.resolveStateDir).toBe("function");
    expect(typeof adapter.resolvePluginRoot).toBe("function");
    expect(typeof adapter.bindSession).toBe("function");
    expect(typeof adapter.handleStopHook).toBe("function");
    expect(typeof adapter.handleSessionStartHook).toBe("function");
    expect(typeof adapter.findHookDispatcherPath).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// isActive()
// ---------------------------------------------------------------------------

describe("OpenClaw isActive()", () => {
  it("returns true when OPENCLAW_SHELL is set", () => {
    process.env.OPENCLAW_SHELL = "agent:a1:general:shell:s1";
    const adapter = createOpenClawAdapter();
    expect(adapter.isActive()).toBe(true);
  });

  it("returns true when OPENCLAW_HOME is set", () => {
    process.env.OPENCLAW_HOME = "/opt/openclaw";
    const adapter = createOpenClawAdapter();
    expect(adapter.isActive()).toBe(true);
  });

  it("returns true when both OPENCLAW_SHELL and OPENCLAW_HOME are set", () => {
    process.env.OPENCLAW_SHELL = "agent:a1:general:shell:s1";
    process.env.OPENCLAW_HOME = "/opt/openclaw";
    const adapter = createOpenClawAdapter();
    expect(adapter.isActive()).toBe(true);
  });

  it("returns false when no OpenClaw env vars are set", () => {
    const adapter = createOpenClawAdapter();
    expect(adapter.isActive()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resolveSessionId()
// ---------------------------------------------------------------------------

describe("OpenClaw resolveSessionId()", () => {
  it("returns explicit sessionId when passed (highest priority)", () => {
    process.env.BABYSITTER_SESSION_ID = "env-session";
    process.env.OPENCLAW_SHELL = "shell-session";
    const adapter = createOpenClawAdapter();
    expect(adapter.resolveSessionId({ sessionId: "explicit-id" })).toBe(
      "explicit-id",
    );
  });

  it("returns BABYSITTER_SESSION_ID when no explicit arg", () => {
    process.env.BABYSITTER_SESSION_ID = "babysitter-session-abc";
    const adapter = createOpenClawAdapter();
    expect(adapter.resolveSessionId({})).toBe("babysitter-session-abc");
  });

  it("returns OPENCLAW_SHELL as fallback when no explicit arg or BABYSITTER_SESSION_ID", () => {
    process.env.OPENCLAW_SHELL = "agent:a1:general:shell:s1";
    const adapter = createOpenClawAdapter();
    expect(adapter.resolveSessionId({})).toBe("agent:a1:general:shell:s1");
  });

  it("prefers BABYSITTER_SESSION_ID over OPENCLAW_SHELL", () => {
    process.env.BABYSITTER_SESSION_ID = "babysitter-wins";
    process.env.OPENCLAW_SHELL = "openclaw-loses";
    const adapter = createOpenClawAdapter();
    expect(adapter.resolveSessionId({})).toBe("babysitter-wins");
  });

  it("returns undefined when no session vars available", () => {
    const adapter = createOpenClawAdapter();
    expect(adapter.resolveSessionId({})).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// resolveStateDir()
// ---------------------------------------------------------------------------

describe("OpenClaw resolveStateDir()", () => {
  it("returns explicit stateDir when provided", () => {
    const adapter = createOpenClawAdapter();
    const result = adapter.resolveStateDir({ stateDir: "/custom/state" });
    expect(result).toContain("custom");
    expect(result).toContain("state");
  });

  it("falls back to global state dir when no explicit arg", () => {
    const adapter = createOpenClawAdapter();
    const result = adapter.resolveStateDir({});
    // Should return something (the global state dir default)
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// resolvePluginRoot()
// ---------------------------------------------------------------------------

describe("OpenClaw resolvePluginRoot()", () => {
  it("returns undefined even when pluginRoot is provided", () => {
    const adapter = createOpenClawAdapter();
    // OpenClaw has no plugin root env var; always returns undefined
    const result = adapter.resolvePluginRoot({ pluginRoot: "/some/root" });
    expect(result).toBeUndefined();
  });

  it("returns undefined when no arg is provided", () => {
    const adapter = createOpenClawAdapter();
    const result = adapter.resolvePluginRoot({});
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// autoResolvesSessionId()
// ---------------------------------------------------------------------------

describe("OpenClaw autoResolvesSessionId()", () => {
  it("returns true", () => {
    const adapter = createOpenClawAdapter();
    expect(adapter.autoResolvesSessionId!()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// supportsHookType()
// ---------------------------------------------------------------------------

describe("OpenClaw supportsHookType()", () => {
  it("returns true for session-start", () => {
    const adapter = createOpenClawAdapter();
    expect(adapter.supportsHookType!("session-start")).toBe(true);
  });

  it("returns false for stop", () => {
    const adapter = createOpenClawAdapter();
    expect(adapter.supportsHookType!("stop")).toBe(false);
  });

  it("returns false for pre-tool-use", () => {
    const adapter = createOpenClawAdapter();
    expect(adapter.supportsHookType!("pre-tool-use")).toBe(false);
  });

  it("returns false for unknown hook types", () => {
    const adapter = createOpenClawAdapter();
    expect(adapter.supportsHookType!("nonexistent-hook")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getCapabilities()
// ---------------------------------------------------------------------------

describe("OpenClaw getCapabilities()", () => {
  it("includes SessionBinding capability", () => {
    const adapter = createOpenClawAdapter();
    const caps = adapter.getCapabilities!();
    expect(caps).toContain(HarnessCapability.SessionBinding);
  });

  it("includes Mcp capability", () => {
    const adapter = createOpenClawAdapter();
    const caps = adapter.getCapabilities!();
    expect(caps).toContain(HarnessCapability.Mcp);
  });

  it("includes HeadlessPrompt capability", () => {
    const adapter = createOpenClawAdapter();
    const caps = adapter.getCapabilities!();
    expect(caps).toContain(HarnessCapability.HeadlessPrompt);
  });

  it("does not include StopHook capability", () => {
    const adapter = createOpenClawAdapter();
    const caps = adapter.getCapabilities!();
    expect(caps).not.toContain(HarnessCapability.StopHook);
  });

  it("does not include Programmatic capability", () => {
    const adapter = createOpenClawAdapter();
    const caps = adapter.getCapabilities!();
    expect(caps).not.toContain(HarnessCapability.Programmatic);
  });

  it("returns exactly three capabilities", () => {
    const adapter = createOpenClawAdapter();
    const caps = adapter.getCapabilities!();
    expect(caps).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// handleStopHook() — no-op
// ---------------------------------------------------------------------------

describe("OpenClaw handleStopHook()", () => {
  it("returns 0 (no-op)", async () => {
    const adapter = createOpenClawAdapter();
    const result = await adapter.handleStopHook({ json: false });
    expect(result).toBe(0);
  });

  it("writes empty JSON to stdout", async () => {
    const adapter = createOpenClawAdapter();
    await adapter.handleStopHook({ json: false });
    const output = stdoutChunks.join("");
    expect(output).toContain("{}");
  });
});

// ---------------------------------------------------------------------------
// handleSessionStartHook()
// ---------------------------------------------------------------------------

describe("OpenClaw handleSessionStartHook()", () => {
  it("returns 0 when no session ID is available", async () => {
    const adapter = createOpenClawAdapter();
    // Suppress log dir creation errors by pointing to tmp
    process.env.BABYSITTER_LOG_DIR = path.join(tmpDir, "logs");
    const result = await adapter.handleSessionStartHook({
      json: false,
      stateDir,
    });
    expect(result).toBe(0);
  });

  it("creates baseline session state file when session ID is available", async () => {
    process.env.BABYSITTER_SESSION_ID = "test-session-123";
    process.env.BABYSITTER_LOG_DIR = path.join(tmpDir, "logs");
    const adapter = createOpenClawAdapter();
    const result = await adapter.handleSessionStartHook({
      json: false,
      stateDir,
    });
    expect(result).toBe(0);

    // Verify state file was created
    const filePath = getSessionFilePath(stateDir, "test-session-123");
    const content = await readSessionFile(filePath);
    expect(content.state.active).toBe(true);
    expect(content.state.iteration).toBe(1);
    expect(content.state.maxIterations).toBe(256);
    expect(content.state.runId).toBe("");
  });

  it("uses OPENCLAW_SHELL as session ID when BABYSITTER_SESSION_ID is absent", async () => {
    // Use a filename-safe session ID to avoid Windows path issues with colons
    process.env.OPENCLAW_SHELL = "agent-a1-general-shell-s1";
    process.env.BABYSITTER_LOG_DIR = path.join(tmpDir, "logs");
    const adapter = createOpenClawAdapter();
    const result = await adapter.handleSessionStartHook({
      json: false,
      stateDir,
    });
    expect(result).toBe(0);

    const filePath = getSessionFilePath(stateDir, "agent-a1-general-shell-s1");
    const content = await readSessionFile(filePath);
    expect(content.state.active).toBe(true);
  });

  it("does not overwrite existing session state", async () => {
    const sessionId = "existing-session";
    process.env.BABYSITTER_SESSION_ID = sessionId;
    process.env.BABYSITTER_LOG_DIR = path.join(tmpDir, "logs");

    // Pre-create a session file
    const filePath = getSessionFilePath(stateDir, sessionId);
    const nowTs = getCurrentTimestamp();
    const state: SessionState = {
      active: true,
      iteration: 5,
      maxIterations: 100,
      runId: "existing-run",
      startedAt: nowTs,
      lastIterationAt: nowTs,
      iterationTimes: [],
    };
    await writeSessionFile(filePath, state, "original prompt");

    const adapter = createOpenClawAdapter();
    await adapter.handleSessionStartHook({ json: false, stateDir });

    // Should still have the original state
    const content = await readSessionFile(filePath);
    expect(content.state.iteration).toBe(5);
    expect(content.state.runId).toBe("existing-run");
  });

  it("writes empty JSON to stdout", async () => {
    process.env.BABYSITTER_LOG_DIR = path.join(tmpDir, "logs");
    const adapter = createOpenClawAdapter();
    await adapter.handleSessionStartHook({ json: false, stateDir });
    const output = stdoutChunks.join("");
    expect(output).toContain("{}");
  });
});

// ---------------------------------------------------------------------------
// bindSession()
// ---------------------------------------------------------------------------

describe("OpenClaw bindSession()", () => {
  it("creates a new session state file bound to a run", async () => {
    const adapter = createOpenClawAdapter();
    const result = await adapter.bindSession({
      sessionId: "bind-session-1",
      runId: "run-abc",
      runDir: path.join(tmpDir, "runs", "run-abc"),
      stateDir,
      maxIterations: 128,
      prompt: "test prompt",
      verbose: false,
      json: false,
    });

    expect(result.harness).toBe("openclaw");
    expect(result.sessionId).toBe("bind-session-1");
    expect(result.stateFile).toBeDefined();
    expect(result.error).toBeUndefined();

    // Verify the created state
    const content = await readSessionFile(result.stateFile!);
    expect(content.state.runId).toBe("run-abc");
    expect(content.state.maxIterations).toBe(128);
    expect(content.state.active).toBe(true);
  });

  it("updates existing session with new run ID", async () => {
    const sessionId = "bind-session-update";
    const filePath = getSessionFilePath(stateDir, sessionId);
    const nowTs = getCurrentTimestamp();
    const state: SessionState = {
      active: true,
      iteration: 1,
      maxIterations: 256,
      runId: "",
      startedAt: nowTs,
      lastIterationAt: nowTs,
      iterationTimes: [],
    };
    await writeSessionFile(filePath, state, "");

    const adapter = createOpenClawAdapter();
    const result = await adapter.bindSession({
      sessionId,
      runId: "new-run-id",
      runDir: path.join(tmpDir, "runs", "new-run-id"),
      stateDir,
      prompt: "update prompt",
      verbose: false,
      json: false,
    });

    expect(result.error).toBeUndefined();

    const content = await readSessionFile(filePath);
    expect(content.state.runId).toBe("new-run-id");
    expect(content.state.active).toBe(true);
  });

  it("returns error when session already has a different run", async () => {
    const sessionId = "bind-session-conflict";
    const filePath = getSessionFilePath(stateDir, sessionId);
    const nowTs = getCurrentTimestamp();
    const state: SessionState = {
      active: true,
      iteration: 3,
      maxIterations: 256,
      runId: "existing-run-xyz",
      startedAt: nowTs,
      lastIterationAt: nowTs,
      iterationTimes: [],
    };
    await writeSessionFile(filePath, state, "");

    const adapter = createOpenClawAdapter();
    const result = await adapter.bindSession({
      sessionId,
      runId: "different-run-id",
      runDir: path.join(tmpDir, "runs", "different-run-id"),
      stateDir,
      prompt: "conflict prompt",
      verbose: false,
      json: false,
    });

    expect(result.error).toBeDefined();
    expect(result.error).toContain("existing-run-xyz");
  });
});

// ---------------------------------------------------------------------------
// findHookDispatcherPath()
// ---------------------------------------------------------------------------

describe("OpenClaw findHookDispatcherPath()", () => {
  it("returns null (hooks are registered programmatically)", () => {
    const adapter = createOpenClawAdapter();
    expect(adapter.findHookDispatcherPath("/any/path")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getPromptContext()
// ---------------------------------------------------------------------------

describe("OpenClaw getPromptContext()", () => {
  it("returns context with hookDriven=false", () => {
    const adapter = createOpenClawAdapter();
    const ctx = adapter.getPromptContext!();
    expect(ctx.hookDriven).toBe(false);
  });

  it("returns context with loopControlTerm='agent_end'", () => {
    const adapter = createOpenClawAdapter();
    const ctx = adapter.getPromptContext!();
    expect(ctx.loopControlTerm).toBe("agent_end");
  });

  it("returns context with harness='openclaw'", () => {
    const adapter = createOpenClawAdapter();
    const ctx = adapter.getPromptContext!();
    expect(ctx.harness).toBe("openclaw");
  });

  it("returns context with harnessLabel='OpenClaw'", () => {
    const adapter = createOpenClawAdapter();
    const ctx = adapter.getPromptContext!();
    expect(ctx.harnessLabel).toBe("OpenClaw");
  });
});

// ---------------------------------------------------------------------------
// getMissingSessionIdHint()
// ---------------------------------------------------------------------------

describe("OpenClaw getMissingSessionIdHint()", () => {
  it("returns a hint mentioning OpenClaw gateway", () => {
    const adapter = createOpenClawAdapter();
    const hint = adapter.getMissingSessionIdHint!();
    expect(hint).toContain("OpenClaw");
  });
});

// ---------------------------------------------------------------------------
// getUnsupportedHookMessage()
// ---------------------------------------------------------------------------

describe("OpenClaw getUnsupportedHookMessage()", () => {
  it("returns specific message for stop hook", () => {
    const adapter = createOpenClawAdapter();
    const msg = adapter.getUnsupportedHookMessage!("stop");
    expect(msg).toContain("stop");
    expect(msg).toContain("agent_end");
  });

  it("returns generic message for other unsupported hooks", () => {
    const adapter = createOpenClawAdapter();
    const msg = adapter.getUnsupportedHookMessage!("some-hook");
    expect(msg).toContain("some-hook");
    expect(msg).toContain("not supported");
  });
});
