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
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClaudeCodeAdapter } from "../claudeCode";
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

const ENV_KEYS = ["CLAUDE_SESSION_ID", "CLAUDE_ENV_FILE", "CLAUDE_PLUGIN_ROOT"];
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
