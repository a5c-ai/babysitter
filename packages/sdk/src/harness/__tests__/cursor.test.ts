/**
 * Tests for the Cursor IDE/CLI harness adapter.
 *
 * Covers:
 *   - createCursorAdapter() factory — returns adapter with name "cursor"
 *   - isActive() detection via CURSOR_PROJECT_DIR / CURSOR_VERSION env vars
 *   - autoResolvesSessionId() returns false
 *   - resolveSessionId() resolution (explicit arg, no env fallback)
 *   - getMissingSessionIdHint() returns guidance about conversation_id
 *   - supportsHookType() for supported and unsupported hook types
 *   - getUnsupportedHookMessage() for IDE-only vs unknown types
 *   - getCapabilities() returns HeadlessPrompt, StopHook, SessionBinding, Mcp
 *   - KNOWN_HARNESSES entry for cursor
 *   - HARNESS_CLI_MAP entry for cursor
 *   - buildHarnessArgs for cursor with positional prompt style
 *   - getPromptContext() returns correct PromptContext
 *   - resolveStateDir() with various inputs
 *   - resolvePluginRoot() with various inputs
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as path from "node:path";
import * as os from "node:os";
import { createCursorAdapter } from "../cursor";
import { HarnessCapability } from "../types";
import { KNOWN_HARNESSES } from "../discovery";
import { buildHarnessArgs, HARNESS_CLI_MAP } from "../invoker";

// ---------------------------------------------------------------------------
// Env cleanup
// ---------------------------------------------------------------------------

const ENV_KEYS = [
  "CURSOR_PROJECT_DIR",
  "CURSOR_VERSION",
  "CURSOR_PLUGIN_ROOT",
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

describe("createCursorAdapter", () => {
  it("has name 'cursor'", () => {
    const adapter = createCursorAdapter();
    expect(adapter.name).toBe("cursor");
  });

  // -------------------------------------------------------------------------
  // isActive()
  // -------------------------------------------------------------------------

  describe("isActive", () => {
    it("returns false when no Cursor env vars are set", () => {
      const adapter = createCursorAdapter();
      expect(adapter.isActive()).toBe(false);
    });

    it("returns true when CURSOR_PROJECT_DIR is set", () => {
      process.env.CURSOR_PROJECT_DIR = "/home/user/project";
      const adapter = createCursorAdapter();
      expect(adapter.isActive()).toBe(true);
    });

    it("returns true when CURSOR_VERSION is set", () => {
      process.env.CURSOR_VERSION = "0.50.0";
      const adapter = createCursorAdapter();
      expect(adapter.isActive()).toBe(true);
    });

    it("returns true when both CURSOR_PROJECT_DIR and CURSOR_VERSION are set", () => {
      process.env.CURSOR_PROJECT_DIR = "/home/user/project";
      process.env.CURSOR_VERSION = "0.50.0";
      const adapter = createCursorAdapter();
      expect(adapter.isActive()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // resolveSessionId()
  // -------------------------------------------------------------------------

  describe("resolveSessionId", () => {
    it("returns explicit sessionId when provided", () => {
      const adapter = createCursorAdapter();
      expect(adapter.resolveSessionId({ sessionId: "explicit-id" })).toBe(
        "explicit-id",
      );
    });

    it("returns undefined when no sessionId is provided", () => {
      const adapter = createCursorAdapter();
      expect(adapter.resolveSessionId({})).toBeUndefined();
    });

    it("returns undefined even when Cursor env vars are set (no env-based session resolution)", () => {
      process.env.CURSOR_PROJECT_DIR = "/some/project";
      process.env.CURSOR_VERSION = "0.50.0";
      const adapter = createCursorAdapter();
      expect(adapter.resolveSessionId({})).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // autoResolvesSessionId()
  // -------------------------------------------------------------------------

  describe("autoResolvesSessionId", () => {
    it("returns false", () => {
      const adapter = createCursorAdapter();
      expect(adapter.autoResolvesSessionId()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // supportsHookType()
  // -------------------------------------------------------------------------

  describe("supportsHookType", () => {
    it("returns true for 'stop'", () => {
      const adapter = createCursorAdapter();
      expect(adapter.supportsHookType!("stop")).toBe(true);
    });

    it("returns true for 'session-start'", () => {
      const adapter = createCursorAdapter();
      expect(adapter.supportsHookType!("session-start")).toBe(true);
    });

    it("returns true for 'session-end'", () => {
      const adapter = createCursorAdapter();
      expect(adapter.supportsHookType!("session-end")).toBe(true);
    });

    it("returns true for 'post-tool-use'", () => {
      const adapter = createCursorAdapter();
      expect(adapter.supportsHookType!("post-tool-use")).toBe(true);
    });

    it("returns true for 'pre-tool-use'", () => {
      const adapter = createCursorAdapter();
      expect(adapter.supportsHookType!("pre-tool-use")).toBe(true);
    });

    it("returns true for 'after-file-edit'", () => {
      const adapter = createCursorAdapter();
      expect(adapter.supportsHookType!("after-file-edit")).toBe(true);
    });

    it("returns true for 'after-shell-execution'", () => {
      const adapter = createCursorAdapter();
      expect(adapter.supportsHookType!("after-shell-execution")).toBe(true);
    });

    it("returns true for 'before-shell-execution'", () => {
      const adapter = createCursorAdapter();
      expect(adapter.supportsHookType!("before-shell-execution")).toBe(true);
    });

    it("returns false for 'after-agent-response' (IDE-only)", () => {
      const adapter = createCursorAdapter();
      expect(adapter.supportsHookType!("after-agent-response")).toBe(false);
    });

    it("returns false for 'after-agent-thought' (IDE-only)", () => {
      const adapter = createCursorAdapter();
      expect(adapter.supportsHookType!("after-agent-thought")).toBe(false);
    });

    it("returns false for unsupported hook types", () => {
      const adapter = createCursorAdapter();
      expect(adapter.supportsHookType!("pre-commit")).toBe(false);
      expect(adapter.supportsHookType!("post-planning")).toBe(false);
      expect(adapter.supportsHookType!("on-run-start")).toBe(false);
      expect(adapter.supportsHookType!("nonexistent")).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // getUnsupportedHookMessage()
  // -------------------------------------------------------------------------

  describe("getUnsupportedHookMessage", () => {
    it("returns IDE-specific message for 'after-agent-response'", () => {
      const adapter = createCursorAdapter();
      const msg = adapter.getUnsupportedHookMessage!("after-agent-response");
      expect(msg).toContain("after-agent-response");
      expect(msg).toContain("headless CLI mode");
      expect(msg).toContain("IDE");
    });

    it("returns IDE-specific message for 'after-agent-thought'", () => {
      const adapter = createCursorAdapter();
      const msg = adapter.getUnsupportedHookMessage!("after-agent-thought");
      expect(msg).toContain("after-agent-thought");
      expect(msg).toContain("headless CLI mode");
    });

    it("returns generic message for other unsupported types", () => {
      const adapter = createCursorAdapter();
      const msg = adapter.getUnsupportedHookMessage!("pre-commit");
      expect(msg).toContain("pre-commit");
      expect(msg).toContain("not supported");
      expect(msg).toContain("Cursor");
    });
  });

  // -------------------------------------------------------------------------
  // getCapabilities()
  // -------------------------------------------------------------------------

  describe("getCapabilities", () => {
    it("returns the correct capability array with StopHook", () => {
      const adapter = createCursorAdapter();
      const caps = adapter.getCapabilities();

      expect(caps).toContain(HarnessCapability.HeadlessPrompt);
      expect(caps).toContain(HarnessCapability.StopHook);
      expect(caps).toContain(HarnessCapability.SessionBinding);
      expect(caps).toContain(HarnessCapability.Mcp);
      expect(caps).toHaveLength(4);
    });

    it("does not include Programmatic capability", () => {
      const adapter = createCursorAdapter();
      const caps = adapter.getCapabilities();
      expect(caps).not.toContain(HarnessCapability.Programmatic);
    });
  });

  // -------------------------------------------------------------------------
  // getMissingSessionIdHint()
  // -------------------------------------------------------------------------

  describe("getMissingSessionIdHint", () => {
    it("returns a guidance string mentioning conversation_id", () => {
      const adapter = createCursorAdapter();
      const hint = adapter.getMissingSessionIdHint!();

      expect(hint).toBeTruthy();
      expect(typeof hint).toBe("string");
      expect(hint).toContain("conversation_id");
      expect(hint).toContain("--session-id");
    });

    it("mentions hook stdin JSON", () => {
      const adapter = createCursorAdapter();
      const hint = adapter.getMissingSessionIdHint!();
      expect(hint).toContain("hook stdin JSON");
    });

    it("mentions .cursor/hooks.json configuration", () => {
      const adapter = createCursorAdapter();
      const hint = adapter.getMissingSessionIdHint!();
      expect(hint).toContain(".cursor/hooks.json");
    });
  });

  // -------------------------------------------------------------------------
  // resolveStateDir()
  // -------------------------------------------------------------------------

  describe("resolveStateDir", () => {
    it("returns explicit stateDir when provided", () => {
      const adapter = createCursorAdapter();
      const result = adapter.resolveStateDir!({ stateDir: "/custom/state" });
      expect(result).toBe(path.resolve("/custom/state"));
    });

    it("defaults to ~/.a5c/state/ when nothing is set", () => {
      const adapter = createCursorAdapter();
      const result = adapter.resolveStateDir!({});
      expect(result).toBe(path.join(os.homedir(), ".a5c", "state"));
    });

    it("prefers explicit stateDir over default", () => {
      const adapter = createCursorAdapter();
      const result = adapter.resolveStateDir!({
        stateDir: "/explicit",
        pluginRoot: "/plugin",
      });
      expect(result).toBe(path.resolve("/explicit"));
    });

    it("respects BABYSITTER_STATE_DIR env var", () => {
      process.env.BABYSITTER_STATE_DIR = "/custom/global/state";
      const adapter = createCursorAdapter();
      const result = adapter.resolveStateDir!({});
      expect(result).toBe(path.resolve("/custom/global/state"));
    });
  });

  // -------------------------------------------------------------------------
  // resolvePluginRoot()
  // -------------------------------------------------------------------------

  describe("resolvePluginRoot", () => {
    it("returns explicit pluginRoot when provided", () => {
      const adapter = createCursorAdapter();
      const result = adapter.resolvePluginRoot!({ pluginRoot: "/my/plugin" });
      expect(result).toBe(path.resolve("/my/plugin"));
    });

    it("falls back to CURSOR_PLUGIN_ROOT env var", () => {
      process.env.CURSOR_PLUGIN_ROOT = "/env/cursor/plugin";
      const adapter = createCursorAdapter();
      const result = adapter.resolvePluginRoot!({});
      expect(result).toBe(path.resolve("/env/cursor/plugin"));
    });

    it("returns undefined when neither arg nor env is set", () => {
      const adapter = createCursorAdapter();
      const result = adapter.resolvePluginRoot!({});
      expect(result).toBeUndefined();
    });

    it("prefers explicit arg over env var", () => {
      process.env.CURSOR_PLUGIN_ROOT = "/env/root";
      const adapter = createCursorAdapter();
      const result = adapter.resolvePluginRoot!({ pluginRoot: "/explicit" });
      expect(result).toBe(path.resolve("/explicit"));
    });
  });

  // -------------------------------------------------------------------------
  // getPromptContext()
  // -------------------------------------------------------------------------

  describe("getPromptContext", () => {
    it("returns context with harness 'cursor'", () => {
      const adapter = createCursorAdapter();
      const ctx = adapter.getPromptContext!();
      expect(ctx.harness).toBe("cursor");
    });

    it("returns context with harnessLabel 'Cursor'", () => {
      const adapter = createCursorAdapter();
      const ctx = adapter.getPromptContext!();
      expect(ctx.harnessLabel).toBe("Cursor");
    });

    it("returns context with hookDriven true", () => {
      const adapter = createCursorAdapter();
      const ctx = adapter.getPromptContext!();
      expect(ctx.hookDriven).toBe(true);
    });

    it("returns context with loopControlTerm 'stop-hook'", () => {
      const adapter = createCursorAdapter();
      const ctx = adapter.getPromptContext!();
      expect(ctx.loopControlTerm).toBe("stop-hook");
    });

    it("returns context with capabilities including stop-hook and mcp", () => {
      const adapter = createCursorAdapter();
      const ctx = adapter.getPromptContext!();
      expect(ctx.capabilities).toContain("stop-hook");
      expect(ctx.capabilities).toContain("mcp");
      expect(ctx.capabilities).toContain("hooks");
    });

    it("returns context with CURSOR_PLUGIN_ROOT pluginRootVar", () => {
      const adapter = createCursorAdapter();
      const ctx = adapter.getPromptContext!();
      expect(ctx.pluginRootVar).toContain("CURSOR_PLUGIN_ROOT");
    });
  });
});

// ---------------------------------------------------------------------------
// Discovery: KNOWN_HARNESSES entry
// ---------------------------------------------------------------------------

describe("KNOWN_HARNESSES cursor entry", () => {
  it("has an entry for cursor", () => {
    const entry = KNOWN_HARNESSES.find((h) => h.name === "cursor");
    expect(entry).toBeDefined();
  });

  it("has cli set to 'cursor'", () => {
    const entry = KNOWN_HARNESSES.find((h) => h.name === "cursor");
    expect(entry!.cli).toBe("cursor");
  });

  it("has correct callerEnvVars", () => {
    const entry = KNOWN_HARNESSES.find((h) => h.name === "cursor");
    expect(entry!.callerEnvVars).toContain("CURSOR_PROJECT_DIR");
    expect(entry!.callerEnvVars).toContain("CURSOR_VERSION");
  });

  it("has correct capabilities including StopHook", () => {
    const entry = KNOWN_HARNESSES.find((h) => h.name === "cursor");
    expect(entry!.capabilities).toContain(HarnessCapability.HeadlessPrompt);
    expect(entry!.capabilities).toContain(HarnessCapability.StopHook);
    expect(entry!.capabilities).toContain(HarnessCapability.SessionBinding);
    expect(entry!.capabilities).toContain(HarnessCapability.Mcp);
  });

  it("does not include Programmatic capability", () => {
    const entry = KNOWN_HARNESSES.find((h) => h.name === "cursor");
    expect(entry!.capabilities).not.toContain(HarnessCapability.Programmatic);
  });
});

// ---------------------------------------------------------------------------
// Invoker: HARNESS_CLI_MAP entry and buildHarnessArgs
// ---------------------------------------------------------------------------

describe("HARNESS_CLI_MAP cursor entry", () => {
  it("has an entry for cursor", () => {
    expect(HARNESS_CLI_MAP["cursor"]).toBeDefined();
  });

  it("has cli set to 'cursor'", () => {
    expect(HARNESS_CLI_MAP["cursor"].cli).toBe("cursor");
  });

  it("supports model flag", () => {
    expect(HARNESS_CLI_MAP["cursor"].supportsModel).toBe(true);
  });

  it("uses positional prompt style", () => {
    expect(HARNESS_CLI_MAP["cursor"].promptStyle).toBe("positional");
  });

  it("has baseArgs ['agent']", () => {
    expect(HARNESS_CLI_MAP["cursor"].baseArgs).toEqual(["agent"]);
  });

  it("has workspaceFlag '--workspace'", () => {
    expect(HARNESS_CLI_MAP["cursor"].workspaceFlag).toBe("--workspace");
  });
});

describe("buildHarnessArgs for cursor", () => {
  it("builds args with positional prompt after baseArgs", () => {
    const args = buildHarnessArgs("cursor", { prompt: "Hello world" });
    expect(args).toContain("agent");
    expect(args).toContain("Hello world");
    // Positional prompt: no --prompt flag
    expect(args).not.toContain("--prompt");
  });

  it("includes --model when provided", () => {
    const args = buildHarnessArgs("cursor", {
      prompt: "Hello world",
      model: "claude-sonnet-4-20250514",
    });
    expect(args).toContain("--model");
    expect(args).toContain("claude-sonnet-4-20250514");
  });

  it("includes --workspace when provided", () => {
    const args = buildHarnessArgs("cursor", {
      prompt: "Hello world",
      workspace: "/tmp/project",
    });
    expect(args).toContain("--workspace");
    expect(args).toContain("/tmp/project");
  });

  it("includes baseArgs, workspace, model, and prompt", () => {
    const args = buildHarnessArgs("cursor", {
      prompt: "Do something",
      model: "gpt-4o",
      workspace: "/my/project",
    });
    // baseArgs first
    expect(args[0]).toBe("agent");
    // prompt is positional (no --prompt flag)
    expect(args).toContain("Do something");
    expect(args).not.toContain("--prompt");
    // flags present
    expect(args).toContain("--workspace");
    expect(args).toContain("/my/project");
    expect(args).toContain("--model");
    expect(args).toContain("gpt-4o");
  });
});
