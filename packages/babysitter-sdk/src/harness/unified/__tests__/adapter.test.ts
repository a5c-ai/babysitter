/**
 * Tests for the unified harness adapter.
 *
 * Covers:
 *   - isActive() responds to AGENT_UNIFIED_ADAPTER
 *   - resolveSessionId() precedence: explicit > AGENT_SESSION_ID > AGENT_SESSION_ID
 *   - getCapabilities() with and without AGENT_CAPABILITIES_JSON
 *   - autoResolvesSessionId() depends on AGENT_SESSION_ID presence
 *   - bindSession() with and without session ID
 *   - Adapter is findable via getAdapterByName
 *   - detectAdapter() returns unified when AGENT_UNIFIED_ADAPTER=1
 */

import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createUnifiedAdapter } from "../adapter";
import { getAdapterByName, detectAdapter, resetAdapter } from "../../registry";
import { HarnessCapability } from "../../types";
import { getSessionFilePath, readSessionFile } from "../../../session/parse";
import { writeSessionFile } from "../../../session/write";
import type { SessionState } from "../../../session/types";
import { createRun } from "../../../runtime/createRun";
import type { CreateRunResult } from "../../../runtime/types";

vi.mock("../../../runtime/createRun", () => ({ createRun: vi.fn() }));

function mockRun(runsDir: string, runId: string): CreateRunResult {
  return {
    runId,
    runDir: path.join(runsDir, runId),
    metadata: {} as CreateRunResult["metadata"],
  };
}

async function createSessionFixture() {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "babysitter-unified-session-start-"),
  );
  const stateDir = path.join(root, "state");
  const runsDir = path.join(root, "runs");
  await fs.mkdir(stateDir, { recursive: true });
  await fs.mkdir(runsDir, { recursive: true });
  return { root, stateDir, runsDir };
}

// Env vars we touch — save/restore to prevent leaking
const ENV_KEYS = [
  "AGENT_UNIFIED_ADAPTER",
  "AGENT_SESSION_ID",
  "AGENT_CAPABILITIES_JSON",
  "AGENT_PLUGIN_ROOT",
  "AGENT_HOOKS_PROXY_PATH",
  "BABYSITTER_STATE_DIR",
  "CLAUDE_ENV_FILE",
  // claude-code activationEnvVars — cleared so detectAdapter() does not resolve
  // the claude-code adapter from the ambient host environment (hermeticity).
  "CLAUDECODE",
  "CLAUDE_CODE",
  "CLAUDE_CODE_SESSION_ID",
  "CLAUDE_PROJECT_DIR",
  "CODEX_THREAD_ID",
  "CODEX_SESSION_ID",
  "CODEX_PLUGIN_ROOT",
  "OMP_SESSION_ID",
  "PI_SESSION_ID",
  "OMP_PLUGIN_ROOT",
  "PI_PLUGIN_ROOT",
  "GEMINI_SESSION_ID",
  "GEMINI_PROJECT_DIR",
  "GEMINI_CWD",
  "OPENCODE_CONFIG",
  "ACCOMPLISH_TASK_ID",
];

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
  resetAdapter();
  vi.mocked(createRun).mockReset();
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

describe("createUnifiedAdapter", () => {
  it("has name 'unified'", () => {
    const adapter = createUnifiedAdapter();
    expect(adapter.name).toBe("unified");
  });

  // ── isActive ──────────────────────────────────────────────────────

  it("isActive() returns false when AGENT_UNIFIED_ADAPTER is not set", () => {
    const adapter = createUnifiedAdapter();
    expect(adapter.isActive()).toBe(false);
  });

  it("isActive() returns true when AGENT_UNIFIED_ADAPTER=1", () => {
    process.env.AGENT_UNIFIED_ADAPTER = "1";
    const adapter = createUnifiedAdapter();
    expect(adapter.isActive()).toBe(true);
  });

  it("isActive() returns false for AGENT_UNIFIED_ADAPTER=0", () => {
    process.env.AGENT_UNIFIED_ADAPTER = "0";
    const adapter = createUnifiedAdapter();
    expect(adapter.isActive()).toBe(false);
  });

  // ── resolveSessionId ──────────────────────────────────────────────

  it("resolveSessionId() returns explicit sessionId first", () => {
    process.env.AGENT_SESSION_ID = "from-env";
    const adapter = createUnifiedAdapter();
    expect(adapter.resolveSessionId({ sessionId: "explicit" })).toBe(
      "explicit",
    );
  });

  it("resolveSessionId() falls back to AGENT_SESSION_ID", () => {
    process.env.AGENT_SESSION_ID = "agent-session-42";
    const adapter = createUnifiedAdapter();
    expect(adapter.resolveSessionId({})).toBe("agent-session-42");
  });

  it("resolveSessionId() falls back to AGENT_SESSION_ID", () => {
    process.env.AGENT_SESSION_ID = "bab-session-99";
    const adapter = createUnifiedAdapter();
    expect(adapter.resolveSessionId({})).toBe("bab-session-99");
  });

  it("resolveSessionId() returns undefined when nothing is set", () => {
    const adapter = createUnifiedAdapter();
    expect(adapter.resolveSessionId({})).toBeUndefined();
  });

  // ── autoResolvesSessionId ─────────────────────────────────────────

  it("autoResolvesSessionId() returns true when AGENT_SESSION_ID is set", () => {
    process.env.AGENT_SESSION_ID = "session-123";
    const adapter = createUnifiedAdapter();
    expect(adapter.autoResolvesSessionId!()).toBe(true);
  });

  it("autoResolvesSessionId() returns false when AGENT_SESSION_ID is absent", () => {
    const adapter = createUnifiedAdapter();
    expect(adapter.autoResolvesSessionId!()).toBe(false);
  });

  // ── getCapabilities ───────────────────────────────────────────────

  it("getCapabilities() returns default capabilities without AGENT_CAPABILITIES_JSON", () => {
    const adapter = createUnifiedAdapter();
    const caps = adapter.getCapabilities!();
    expect(caps).toContain(HarnessCapability.Programmatic);
    expect(caps).toContain(HarnessCapability.SessionBinding);
    expect(caps).not.toContain(HarnessCapability.StopHook);
  });

  it("getCapabilities() derives from AGENT_CAPABILITIES_JSON when set", () => {
    process.env.AGENT_CAPABILITIES_JSON = JSON.stringify({
      name: "test-harness",
      family: "shell-hook",
      supportsBlock: true,
      supportsAsk: true,
      supportsToolInputMutation: false,
      supportsToolResultMutation: false,
      supportsPersistedEnv: true,
      envPersistenceMode: "env-file",
      toolInterceptionScope: "all",
      sessionIdQuality: "stable",
      supportsOrderedFanout: false,
      supportsNativeAdditionalContext: false,
    });
    const adapter = createUnifiedAdapter();
    const caps = adapter.getCapabilities!();
    expect(caps).toContain(HarnessCapability.Programmatic);
    expect(caps).toContain(HarnessCapability.SessionBinding);
    expect(caps).toContain(HarnessCapability.HeadlessPrompt);
    expect(caps).toContain(HarnessCapability.StopHook);
  });

  it("getCapabilities() handles malformed JSON gracefully", () => {
    process.env.AGENT_CAPABILITIES_JSON = "not-json!";
    const adapter = createUnifiedAdapter();
    const caps = adapter.getCapabilities!();
    // Falls back to defaults
    expect(caps).toContain(HarnessCapability.Programmatic);
    expect(caps).toContain(HarnessCapability.SessionBinding);
  });

  // ── bindSession ───────────────────────────────────────────────────

  it("bindSession() returns error when no session ID is available", async () => {
    const adapter = createUnifiedAdapter();
    const result = await adapter.bindSession({
      sessionId: "",
      runId: "run-1",
      runDir: "/tmp/runs/run-1",
      prompt: "test",
      verbose: false,
      json: false,
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("session ID");
    expect(result.harness).toBe("unified");
  });

  it("bindSession() succeeds with explicit sessionId", async () => {
    const adapter = createUnifiedAdapter();
    const result = await adapter.bindSession({
      sessionId: "my-session",
      runId: "run-1",
      runDir: "/tmp/runs/run-1",
      prompt: "test",
      verbose: false,
      json: false,
    });
    expect(result.error).toBeUndefined();
    expect(result.sessionId).toBe("my-session");
    expect(result.harness).toBe("unified");
  });

  it("bindSession() picks up AGENT_SESSION_ID when opts.sessionId is empty", async () => {
    process.env.AGENT_SESSION_ID = "env-session";
    const adapter = createUnifiedAdapter();
    const result = await adapter.bindSession({
      sessionId: "",
      runId: "run-1",
      runDir: "/tmp/runs/run-1",
      prompt: "test",
      verbose: false,
      json: false,
    });
    expect(result.error).toBeUndefined();
    expect(result.sessionId).toBe("env-session");
  });

  // ── resolveStateDir ───────────────────────────────────────────────

  it("resolveStateDir() defaults to ~/.a5c/state/", () => {
    const adapter = createUnifiedAdapter();
    const dir = adapter.resolveStateDir({});
    const os = require("node:os");
    const path = require("node:path");
    expect(dir).toBe(path.join(os.homedir(), ".a5c", "state"));
  });

  it("resolveStateDir() respects explicit stateDir", () => {
    const adapter = createUnifiedAdapter();
    const dir = adapter.resolveStateDir({ stateDir: "/tmp/my-state" });
    expect(dir).toContain("my-state");
  });

  // ── resolvePluginRoot ─────────────────────────────────────────────

  it("resolvePluginRoot() returns undefined when not provided", () => {
    const adapter = createUnifiedAdapter();
    expect(adapter.resolvePluginRoot({})).toBeUndefined();
  });

  it("resolvePluginRoot() respects explicit pluginRoot", () => {
    const adapter = createUnifiedAdapter();
    const root = adapter.resolvePluginRoot({ pluginRoot: "/tmp/plugin" });
    expect(root).toContain("plugin");
  });

  it("resolvePluginRoot() falls back to AGENT_PLUGIN_ROOT env var", () => {
    process.env.AGENT_PLUGIN_ROOT = "/opt/agent-plugin";
    const adapter = createUnifiedAdapter();
    const root = adapter.resolvePluginRoot({});
    expect(root).toContain("agent-plugin");
  });

  // ── Miscellaneous ─────────────────────────────────────────────────

  it("getMissingSessionIdHint() returns helpful message", () => {
    const adapter = createUnifiedAdapter();
    const hint = adapter.getMissingSessionIdHint!();
    expect(hint).toContain("AGENT_SESSION_ID");
  });

  it("supportsHookType() returns true for all hook types", () => {
    const adapter = createUnifiedAdapter();
    expect(adapter.supportsHookType!("stop")).toBe(true);
    expect(adapter.supportsHookType!("session-start")).toBe(true);
    expect(adapter.supportsHookType!("pre-tool-use")).toBe(true);
  });

  it("findHookDispatcherPath() returns null", () => {
    const adapter = createUnifiedAdapter();
    expect(adapter.findHookDispatcherPath("/tmp")).toBeNull();
  });

  it("handleStopHook() returns 0", async () => {
    // Suppress stdout in test
    const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const adapter = createUnifiedAdapter();
    // Provide empty stdin payload so the handler doesn't block on stdin
    const code = await adapter.handleStopHook({ json: false, stdinPayload: "{}" });
    expect(code).toBe(0);
    writeSpy.mockRestore();
  });

  it("handleSessionStartHook() returns 0", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const adapter = createUnifiedAdapter();
    const code = await adapter.handleSessionStartHook({ json: false });
    expect(code).toBe(0);
    writeSpy.mockRestore();
  });

  it.each([true, false])(
    "preserves an existing session run binding on SessionStart (active=%s)",
    async (active) => {
      const fixture = await createSessionFixture();
      const sessionId = "synthetic-active-session";
      const now = "2026-10-21T12:00:00Z";
      const state: SessionState = {
        active,
        iteration: 4,
        maxIterations: 100,
        runId: "existing-run",
        runDir: path.join(fixture.runsDir, "existing-run"),
        runIds: ["prior-run", "existing-run"],
        startedAt: now,
        lastIterationAt: now,
        iterationTimes: [3],
      };
      await writeSessionFile(
        getSessionFilePath(fixture.stateDir, sessionId),
        state,
        "synthetic prompt",
      );
      process.env.AGENT_SESSION_ID = sessionId;
      vi.mocked(createRun).mockResolvedValue(
        mockRun(fixture.runsDir, "replacement-run"),
      );
      const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);

      try {
        const adapter = createUnifiedAdapter();
        expect(await adapter.handleSessionStartHook({
          json: false,
          stateDir: fixture.stateDir,
          runsDir: fixture.runsDir,
        })).toBe(0);

        const persisted = await readSessionFile(
          getSessionFilePath(fixture.stateDir, sessionId),
        );
        expect(persisted.state).toMatchObject(state);
        expect(persisted.prompt).toBe("synthetic prompt");
        expect(createRun).not.toHaveBeenCalled();
      } finally {
        writeSpy.mockRestore();
        await fs.rm(fixture.root, { recursive: true, force: true });
      }
    },
  );

  it("creates one bare run for a new session and reuses it on repeated SessionStart", async () => {
    const fixture = await createSessionFixture();
    const sessionId = "synthetic-new-session";
    process.env.AGENT_SESSION_ID = sessionId;
    vi.mocked(createRun).mockResolvedValue(mockRun(fixture.runsDir, "synthetic-run"));
    const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);

    try {
      const adapter = createUnifiedAdapter();
      const args = {
        json: false,
        stateDir: fixture.stateDir,
        runsDir: fixture.runsDir,
      };
      expect(await adapter.handleSessionStartHook(args)).toBe(0);
      const first = await readSessionFile(getSessionFilePath(fixture.stateDir, sessionId));
      expect(first.state.active).toBe(true);
      expect(first.state.runId).toBe("synthetic-run");
      expect(first.state.runIds).toEqual(["synthetic-run"]);
      expect(first.state.runDir).toBe(path.join(fixture.runsDir, "synthetic-run"));

      expect(await adapter.handleSessionStartHook(args)).toBe(0);
      const second = await readSessionFile(getSessionFilePath(fixture.stateDir, sessionId));
      expect(second.state.runId).toBe(first.state.runId);
      expect(second.state.runIds).toEqual(first.state.runIds);
      expect(createRun).toHaveBeenCalledTimes(1);
    } finally {
      writeSpy.mockRestore();
      await fs.rm(fixture.root, { recursive: true, force: true });
    }
  });
});

describe("unified adapter in registry", () => {
  it("is findable via getAdapterByName('unified')", () => {
    const adapter = getAdapterByName("unified");
    expect(adapter).not.toBeNull();
    expect(adapter!.name).toBe("unified");
  });

  it("detectAdapter() returns unified when AGENT_UNIFIED_ADAPTER=1 and no other harness is active", () => {
    process.env.AGENT_UNIFIED_ADAPTER = "1";
    const adapter = detectAdapter();
    expect(adapter.name).toBe("unified");
  });

  it("detectAdapter() falls through to custom when AGENT_UNIFIED_ADAPTER is not set", () => {
    // All env vars cleared in beforeEach
    const adapter = detectAdapter();
    expect(adapter.name).toBe("custom");
  });
});

describe("unified adapter getPromptContext", () => {
  it("returns PromptContext with harness='unified' by default", () => {
    const adapter = createUnifiedAdapter();
    const ctx = adapter.getPromptContext!();
    expect(ctx.harness).toBe("unified");
    expect(ctx.harnessLabel).toBe("Unified");
    expect(ctx.hostAgentName).toBeUndefined();
    expect(ctx.hostAgentLabel).toBeUndefined();
    expect(ctx.hostCapabilities).toBeUndefined();
  });

  it("derives PromptContext from AGENT_CAPABILITIES_JSON when set", () => {
    process.env.AGENT_CAPABILITIES_JSON = JSON.stringify({
      name: "codex",
      family: "shell-hook",
      supportsBlock: true,
      supportsAsk: true,
      supportsToolInputMutation: false,
      supportsToolResultMutation: false,
      supportsPersistedEnv: false,
      envPersistenceMode: "none",
      toolInterceptionScope: "all",
      sessionIdQuality: "stable",
      supportsOrderedFanout: false,
      supportsNativeAdditionalContext: true,
      hostTools: [
        {
          name: "Bash",
          category: "shell",
          description: "Run shell commands.",
          availability: "built-in",
        },
      ],
    });
    const adapter = createUnifiedAdapter();
    const ctx = adapter.getPromptContext!();
    expect(ctx.harness).toBe("codex");
    expect(ctx.hostAgentName).toBe("codex");
    expect(ctx.hostAgentLabel).toBe("Codex");
    expect(ctx.hostCapabilities).toContain("ask-user-question");
    expect(ctx.hookDriven).toBe(true);
    expect(ctx.loopControlTerm).toBe("stop-hook");
    expect(ctx.hostTools).toEqual([
      {
        name: "Bash",
        category: "shell",
        description: "Run shell commands.",
        availability: "built-in",
      },
    ]);
  });
});
