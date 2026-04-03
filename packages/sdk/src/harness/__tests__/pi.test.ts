import * as os from "node:os";
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createPiAdapter } from "../pi";
import { HarnessCapability as Cap } from "../types";
import { KNOWN_HARNESSES, detectCallerHarness } from "../discovery";
import { HARNESS_CLI_MAP, buildHarnessArgs } from "../invoker";
import { detectAdapter, getAdapterByName, resetAdapter } from "../registry";
import { getSessionFilePath, readSessionFile } from "../../session/parse";

const ENV_KEYS = [
  "BABYSITTER_SESSION_ID",
  "PI_SESSION_ID",
  "PI_PLUGIN_ROOT",
  "OMP_SESSION_ID",
  "OMP_PLUGIN_ROOT",
  "CODEX_THREAD_ID",
  "CODEX_SESSION_ID",
  "CODEX_PLUGIN_ROOT",
  "CLAUDE_ENV_FILE",
  "CLAUDE_PLUGIN_ROOT",
  "CURSOR_PROJECT_DIR",
  "CURSOR_VERSION",
  "GEMINI_SESSION_ID",
  "GEMINI_PROJECT_DIR",
  "GEMINI_CWD",
  "COPILOT_HOME",
  "COPILOT_GITHUB_TOKEN",
  "OPENCODE_SESSION_ID",
  "OPENCODE_PROJECT_DIR",
  "BABYSITTER_STATE_DIR",
  "BABYSITTER_GLOBAL_STATE_DIR",
] as const;

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
    const value = savedEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  resetAdapter();
  vi.restoreAllMocks();
});

async function withTempStateDir<T>(fn: (stateDir: string) => Promise<T>): Promise<T> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-adapter-test-"));
  try {
    return await fn(tempDir);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

describe("Pi Coding Agent Adapter", () => {
  it("has the expected adapter name", () => {
    expect(createPiAdapter().name).toBe("pi");
  });

  it("is only active for PI-scoped env vars", () => {
    const adapter = createPiAdapter();
    expect(adapter.isActive()).toBe(false);

    process.env.PI_SESSION_ID = "pi-session";
    expect(adapter.isActive()).toBe(true);

    delete process.env.PI_SESSION_ID;
    process.env.PI_PLUGIN_ROOT = "/tmp/pi-plugin";
    expect(adapter.isActive()).toBe(true);

    delete process.env.PI_PLUGIN_ROOT;
    process.env.OMP_SESSION_ID = "omp-session";
    expect(adapter.isActive()).toBe(false);
  });

  it("resolves session IDs in explicit -> BABYSITTER -> PI order", () => {
    const adapter = createPiAdapter();
    process.env.BABYSITTER_SESSION_ID = "babysitter-session";
    process.env.PI_SESSION_ID = "pi-session";

    expect(adapter.resolveSessionId({ sessionId: "explicit" })).toBe("explicit");
    expect(adapter.resolveSessionId({})).toBe("babysitter-session");

    delete process.env.BABYSITTER_SESSION_ID;
    expect(adapter.resolveSessionId({})).toBe("pi-session");

    delete process.env.PI_SESSION_ID;
    expect(adapter.resolveSessionId({})).toBeUndefined();
  });

  it("resolves the state dir from explicit arg, env override, then global default", () => {
    const adapter = createPiAdapter();
    expect(adapter.resolveStateDir({ stateDir: "/tmp/custom-state" })).toBe(path.resolve("/tmp/custom-state"));

    process.env.BABYSITTER_STATE_DIR = "/tmp/from-env";
    expect(adapter.resolveStateDir({})).toBe(path.resolve("/tmp/from-env"));

    delete process.env.BABYSITTER_STATE_DIR;
    expect(adapter.resolveStateDir({})).toBe(path.join(os.homedir(), ".a5c", "state"));
  });

  it("resolves the plugin root from explicit arg or PI_PLUGIN_ROOT", () => {
    const adapter = createPiAdapter();
    process.env.PI_PLUGIN_ROOT = "/tmp/from-env";

    expect(adapter.resolvePluginRoot({ pluginRoot: "/tmp/explicit" })).toBe(path.resolve("/tmp/explicit"));
    expect(adapter.resolvePluginRoot({})).toBe(path.resolve("/tmp/from-env"));

    delete process.env.PI_PLUGIN_ROOT;
    expect(adapter.resolvePluginRoot({})).toBeUndefined();
  });

  it("auto-resolves session IDs and exposes PI-specific guidance", () => {
    const adapter = createPiAdapter();
    expect(adapter.autoResolvesSessionId()).toBe(true);
    expect(adapter.getMissingSessionIdHint?.()).toContain("PI_SESSION_ID");
  });

  it("does not expose a hook dispatcher and does not support hook lifecycle integration", async () => {
    const adapter = createPiAdapter();
    expect(adapter.findHookDispatcherPath("/tmp")).toBeNull();
    expect(adapter.supportsHookType?.("stop")).toBe(false);
    expect(adapter.supportsHookType?.("session-start")).toBe(false);
    expect(adapter.getUnsupportedHookMessage?.("stop")).toContain("Pi");

    const stdout = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    await expect(adapter.handleStopHook?.({ json: true, verbose: false })).resolves.toBe(0);
    await expect(adapter.handleSessionStartHook?.({ json: true, verbose: false })).resolves.toBe(0);
    expect(stdout).toHaveBeenCalledWith("{}\n");
  });

  it("returns the expected capability set", () => {
    const caps = createPiAdapter().getCapabilities();
    expect(caps).toEqual([Cap.Programmatic, Cap.SessionBinding, Cap.HeadlessPrompt]);
  });

  it("creates and reuses bound sessions in state files", async () => {
    await withTempStateDir(async (stateDir) => {
      const adapter = createPiAdapter();
      const first = await adapter.bindSession({
        sessionId: "pi-bind-session",
        runId: "run-1",
        runDir: "/tmp/run-1",
        stateDir,
        prompt: "hello",
        verbose: false,
        json: true,
      });

      expect(first.harness).toBe("pi");
      expect(first.error).toBeUndefined();
      const statePath = getSessionFilePath(stateDir, "pi-bind-session");
      const stored = await readSessionFile(statePath);
      expect(stored.state.runId).toBe("run-1");

      const second = await adapter.bindSession({
        sessionId: "pi-bind-session",
        runId: "run-1",
        runDir: "/tmp/run-1",
        stateDir,
        prompt: "hello",
        verbose: false,
        json: true,
      });
      expect(second.error).toBeUndefined();
      expect(second.stateFile).toBe(statePath);
    });
  });

  it("rejects binding a session that already belongs to another run", async () => {
    await withTempStateDir(async (stateDir) => {
      const adapter = createPiAdapter();
      await adapter.bindSession({
        sessionId: "pi-conflict-session",
        runId: "run-1",
        runDir: "/tmp/run-1",
        stateDir,
        prompt: "hello",
        verbose: false,
        json: true,
      });

      const conflict = await adapter.bindSession({
        sessionId: "pi-conflict-session",
        runId: "run-2",
        runDir: "/tmp/run-2",
        stateDir,
        prompt: "hello",
        verbose: false,
        json: true,
      });

      expect(conflict.error).toContain("run-1");
    });
  });
});

describe("Discovery - Pi Coding Agent", () => {
  it("registers the correct PI discovery entry", () => {
    const entry = KNOWN_HARNESSES.find((item) => item.name === "pi");
    expect(entry).toBeDefined();
    expect(entry?.cli).toBe("pi");
    expect(entry?.callerEnvVars).toEqual(["PI_SESSION_ID", "PI_PLUGIN_ROOT"]);
    expect(entry?.capabilities).toEqual([Cap.Programmatic, Cap.SessionBinding, Cap.HeadlessPrompt]);
  });

  it("detects PI from PI env vars and ignores absent envs", () => {
    expect(detectCallerHarness()?.name).not.toBe("pi");

    process.env.PI_SESSION_ID = "pi-session";
    expect(detectCallerHarness()).toEqual({
      name: "pi",
      matchedEnvVars: ["PI_SESSION_ID"],
      capabilities: [Cap.Programmatic, Cap.SessionBinding, Cap.HeadlessPrompt],
    });
  });
});

describe("Invoker - Pi Coding Agent", () => {
  it("registers the PI CLI entry and builds CLI args", () => {
    expect(HARNESS_CLI_MAP.pi).toMatchObject({
      cli: "pi",
      workspaceFlag: "--workspace",
      supportsModel: true,
      promptStyle: "flag",
    });

    expect(buildHarnessArgs("pi", { prompt: "test" })).toEqual(["--prompt", "test"]);
    expect(buildHarnessArgs("pi", { prompt: "test", workspace: "/tmp/work", model: "gpt-test" })).toEqual([
      "--prompt",
      "test",
      "--model",
      "gpt-test",
      "--workspace",
      "/tmp/work",
    ]);
  });
});

describe("Registry - Pi Coding Agent", () => {
  it("looks up the PI adapter by name", () => {
    expect(getAdapterByName("pi")?.name).toBe("pi");
  });

  it("detects PI when only PI env vars are set", () => {
    process.env.PI_SESSION_ID = "pi-only";
    expect(detectAdapter().name).toBe("pi");
  });

  it("loses priority to oh-my-pi when both PI and OMP env vars are set", () => {
    process.env.PI_SESSION_ID = "pi-session";
    process.env.OMP_SESSION_ID = "omp-session";
    expect(detectAdapter().name).toBe("oh-my-pi");
  });
});
