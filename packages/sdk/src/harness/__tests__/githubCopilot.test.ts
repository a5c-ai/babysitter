/**
 * Tests for the GitHub Copilot CLI harness adapter.
 *
 * Covers:
 *   - isActive() detection via COPILOT_HOME / COPILOT_GITHUB_TOKEN env vars
 *   - resolveSessionId() resolution chain (explicit arg, env var, env file)
 *   - autoResolvesSessionId() returns false
 *   - supportsHookType() for supported and unsupported hook types
 *   - getCapabilities() returns correct capability array
 *   - getMissingSessionIdHint() returns guidance string
 *   - KNOWN_HARNESSES entry for github-copilot
 *   - HARNESS_CLI_MAP entry for github-copilot
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as path from "node:path";
import * as os from "node:os";
import { promises as fs } from "node:fs";
import { createGithubCopilotAdapter } from "../githubCopilot";
import { HarnessCapability } from "../types";
import { KNOWN_HARNESSES } from "../discovery";
import { buildHarnessArgs, HARNESS_CLI_MAP } from "../invoker";

// ---------------------------------------------------------------------------
// Env cleanup
// ---------------------------------------------------------------------------

const ENV_KEYS = [
  "COPILOT_HOME",
  "COPILOT_GITHUB_TOKEN",
  "COPILOT_SESSION_ID",
  "COPILOT_ENV_FILE",
  "CLAUDE_ENV_FILE",
  "CLAUDE_PLUGIN_DATA",
  "COPILOT_PLUGIN_ROOT",
  "BABYSITTER_STATE_DIR",
  "BABYSITTER_LOG_DIR",
];

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] !== undefined) {
      process.env[key] = savedEnv[key];
    } else {
      delete process.env[key];
    }
  }
});

// ---------------------------------------------------------------------------
// Adapter unit tests
// ---------------------------------------------------------------------------

describe("createGithubCopilotAdapter", () => {
  it("has name 'github-copilot'", () => {
    const adapter = createGithubCopilotAdapter();
    expect(adapter.name).toBe("github-copilot");
  });

  // -------------------------------------------------------------------------
  // isActive()
  // -------------------------------------------------------------------------

  describe("isActive", () => {
    it("returns false when no Copilot env vars are set", () => {
      const adapter = createGithubCopilotAdapter();
      expect(adapter.isActive()).toBe(false);
    });

    it("returns true when COPILOT_HOME is set", () => {
      process.env.COPILOT_HOME = "/home/user/.copilot";
      const adapter = createGithubCopilotAdapter();
      expect(adapter.isActive()).toBe(true);
    });

    it("returns true when COPILOT_GITHUB_TOKEN is set", () => {
      process.env.COPILOT_GITHUB_TOKEN = "ghp_test123";
      const adapter = createGithubCopilotAdapter();
      expect(adapter.isActive()).toBe(true);
    });

    it("returns true when both COPILOT_HOME and COPILOT_GITHUB_TOKEN are set", () => {
      process.env.COPILOT_HOME = "/home/user/.copilot";
      process.env.COPILOT_GITHUB_TOKEN = "ghp_test123";
      const adapter = createGithubCopilotAdapter();
      expect(adapter.isActive()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // resolveSessionId()
  // -------------------------------------------------------------------------

  describe("resolveSessionId", () => {
    it("returns parsed sessionId when provided", () => {
      const adapter = createGithubCopilotAdapter();
      expect(adapter.resolveSessionId({ sessionId: "explicit-id" })).toBe(
        "explicit-id",
      );
    });

    it("returns parsed sessionId even when env var is set", () => {
      process.env.COPILOT_SESSION_ID = "env-session";
      const adapter = createGithubCopilotAdapter();
      expect(adapter.resolveSessionId({ sessionId: "explicit-id" })).toBe(
        "explicit-id",
      );
    });

    it("falls back to COPILOT_SESSION_ID env var", () => {
      process.env.COPILOT_SESSION_ID = "env-session-456";
      const adapter = createGithubCopilotAdapter();
      expect(adapter.resolveSessionId({})).toBe("env-session-456");
    });

    it("falls back to COPILOT_ENV_FILE for session ID", async () => {
      const tmpDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "copilot-session-test-"),
      );
      const envFile = path.join(tmpDir, "copilot.env.sh");
      await fs.writeFile(
        envFile,
        'export COPILOT_SESSION_ID="file-session-789"\n',
        "utf-8",
      );
      process.env.COPILOT_ENV_FILE = envFile;

      try {
        const adapter = createGithubCopilotAdapter();
        expect(adapter.resolveSessionId({})).toBe("file-session-789");
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it("falls back to CLAUDE_ENV_FILE for session ID", async () => {
      const tmpDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "copilot-claude-env-test-"),
      );
      const envFile = path.join(tmpDir, "claude.env.sh");
      await fs.writeFile(
        envFile,
        'export COPILOT_SESSION_ID="claude-env-session"\n',
        "utf-8",
      );
      process.env.CLAUDE_ENV_FILE = envFile;

      try {
        const adapter = createGithubCopilotAdapter();
        expect(adapter.resolveSessionId({})).toBe("claude-env-session");
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it("returns undefined when nothing is set", () => {
      const adapter = createGithubCopilotAdapter();
      expect(adapter.resolveSessionId({})).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // autoResolvesSessionId()
  // -------------------------------------------------------------------------

  describe("autoResolvesSessionId", () => {
    it("returns false", () => {
      const adapter = createGithubCopilotAdapter();
      expect(adapter.autoResolvesSessionId()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // supportsHookType()
  // -------------------------------------------------------------------------

  describe("supportsHookType", () => {
    it("returns true for 'session-start'", () => {
      const adapter = createGithubCopilotAdapter();
      expect(adapter.supportsHookType!("session-start")).toBe(true);
    });

    it("returns true for 'session-end'", () => {
      const adapter = createGithubCopilotAdapter();
      expect(adapter.supportsHookType!("session-end")).toBe(true);
    });

    it("returns true for 'user-prompt-submit'", () => {
      const adapter = createGithubCopilotAdapter();
      expect(adapter.supportsHookType!("user-prompt-submit")).toBe(true);
    });

    it("returns true for 'pre-tool-use'", () => {
      const adapter = createGithubCopilotAdapter();
      expect(adapter.supportsHookType!("pre-tool-use")).toBe(true);
    });

    it("returns true for 'post-tool-use'", () => {
      const adapter = createGithubCopilotAdapter();
      expect(adapter.supportsHookType!("post-tool-use")).toBe(true);
    });

    it("returns false for 'stop' (not supported by Copilot CLI)", () => {
      const adapter = createGithubCopilotAdapter();
      expect(adapter.supportsHookType!("stop")).toBe(false);
    });

    it("returns false for unsupported hook types", () => {
      const adapter = createGithubCopilotAdapter();
      expect(adapter.supportsHookType!("pre-commit")).toBe(false);
      expect(adapter.supportsHookType!("post-planning")).toBe(false);
      expect(adapter.supportsHookType!("on-run-start")).toBe(false);
      expect(adapter.supportsHookType!("nonexistent")).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // getCapabilities()
  // -------------------------------------------------------------------------

  describe("getCapabilities", () => {
    it("returns the correct capability array (no StopHook)", () => {
      const adapter = createGithubCopilotAdapter();
      const caps = adapter.getCapabilities();

      expect(caps).toContain(HarnessCapability.HeadlessPrompt);
      expect(caps).toContain(HarnessCapability.SessionBinding);
      expect(caps).toContain(HarnessCapability.Mcp);
      expect(caps).toHaveLength(3);
    });

    it("does not include StopHook capability", () => {
      const adapter = createGithubCopilotAdapter();
      const caps = adapter.getCapabilities();
      expect(caps).not.toContain(HarnessCapability.StopHook);
    });

    it("does not include Programmatic capability", () => {
      const adapter = createGithubCopilotAdapter();
      const caps = adapter.getCapabilities();
      expect(caps).not.toContain(HarnessCapability.Programmatic);
    });
  });

  // -------------------------------------------------------------------------
  // getMissingSessionIdHint()
  // -------------------------------------------------------------------------

  describe("getMissingSessionIdHint", () => {
    it("returns a guidance string mentioning hook stdin JSON", () => {
      const adapter = createGithubCopilotAdapter();
      const hint = adapter.getMissingSessionIdHint!();

      expect(hint).toBeTruthy();
      expect(typeof hint).toBe("string");
      expect(hint).toContain("hook stdin JSON");
      expect(hint).toContain("--session-id");
    });
  });
});

// ---------------------------------------------------------------------------
// Discovery: KNOWN_HARNESSES entry
// ---------------------------------------------------------------------------

describe("KNOWN_HARNESSES github-copilot entry", () => {
  it("has an entry for github-copilot", () => {
    const entry = KNOWN_HARNESSES.find((h) => h.name === "github-copilot");
    expect(entry).toBeDefined();
  });

  it("has cli set to 'copilot'", () => {
    const entry = KNOWN_HARNESSES.find((h) => h.name === "github-copilot");
    expect(entry!.cli).toBe("copilot");
  });

  it("has correct callerEnvVars", () => {
    const entry = KNOWN_HARNESSES.find((h) => h.name === "github-copilot");
    expect(entry!.callerEnvVars).toContain("COPILOT_HOME");
    expect(entry!.callerEnvVars).toContain("COPILOT_GITHUB_TOKEN");
  });

  it("has correct capabilities (no StopHook)", () => {
    const entry = KNOWN_HARNESSES.find((h) => h.name === "github-copilot");
    expect(entry!.capabilities).toContain(HarnessCapability.HeadlessPrompt);
    expect(entry!.capabilities).toContain(HarnessCapability.SessionBinding);
    expect(entry!.capabilities).toContain(HarnessCapability.Mcp);
    expect(entry!.capabilities).not.toContain(HarnessCapability.StopHook);
  });
});

// ---------------------------------------------------------------------------
// Invoker: HARNESS_CLI_MAP entry and buildHarnessArgs
// ---------------------------------------------------------------------------

describe("HARNESS_CLI_MAP github-copilot entry", () => {
  it("has an entry for github-copilot", () => {
    expect(HARNESS_CLI_MAP["github-copilot"]).toBeDefined();
  });

  it("has cli set to 'copilot'", () => {
    expect(HARNESS_CLI_MAP["github-copilot"].cli).toBe("copilot");
  });

  it("supports model flag", () => {
    expect(HARNESS_CLI_MAP["github-copilot"].supportsModel).toBe(true);
  });

  it("uses flag prompt style", () => {
    expect(HARNESS_CLI_MAP["github-copilot"].promptStyle).toBe("flag");
  });
});

describe("buildHarnessArgs for github-copilot", () => {
  it("builds args with --prompt flag", () => {
    const args = buildHarnessArgs("github-copilot", { prompt: "Hello world" });
    expect(args).toEqual(["--prompt", "Hello world"]);
  });

  it("includes --model when provided", () => {
    const args = buildHarnessArgs("github-copilot", {
      prompt: "Hello world",
      model: "gpt-4o",
    });
    expect(args).toEqual(["--prompt", "Hello world", "--model", "gpt-4o"]);
  });

  it("does not include workspace flag (not defined in CLI map)", () => {
    const args = buildHarnessArgs("github-copilot", {
      prompt: "Hello world",
      workspace: "/tmp/project",
    });
    expect(args).toEqual(["--prompt", "Hello world"]);
  });
});
