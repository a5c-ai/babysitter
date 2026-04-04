/**
 * Tests for the custom harness adapter.
 *
 * Covers:
 *   - isActive() always returns false
 *   - autoResolvesSessionId() returns false
 *   - resolveSessionId() only returns explicit parsed.sessionId
 *   - getMissingSessionIdHint() returns helpful message
 *   - resolveStateDir() fallback to .a5c
 *   - bindSession() requires explicit sessionId
 *   - Custom adapter is findable via getAdapterByName
 */

import { describe, it, expect } from "vitest";
import { createCustomAdapter } from "../customAdapter";
import { getAdapterByName, detectAdapter, resetAdapter } from "../registry";
import { beforeEach, afterEach, vi } from "vitest";

// Save/restore env to prevent leaking
const ENV_KEYS = [
  "BABYSITTER_SESSION_ID", "CLAUDE_ENV_FILE",
  "CODEX_THREAD_ID", "CODEX_SESSION_ID", "CODEX_PLUGIN_ROOT",
  "OMP_SESSION_ID", "PI_SESSION_ID", "OMP_PLUGIN_ROOT", "PI_PLUGIN_ROOT",
  "GEMINI_SESSION_ID", "GEMINI_PROJECT_DIR", "GEMINI_CWD",
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

describe("createCustomAdapter", () => {
  it("has name 'custom'", () => {
    const adapter = createCustomAdapter();
    expect(adapter.name).toBe("custom");
  });

  it("isActive() always returns false", () => {
    const adapter = createCustomAdapter();
    expect(adapter.isActive()).toBe(false);
  });

  it("autoResolvesSessionId() returns false", () => {
    const adapter = createCustomAdapter();
    expect(adapter.autoResolvesSessionId!()).toBe(false);
  });

  it("resolveSessionId() returns explicit sessionId only", () => {
    const adapter = createCustomAdapter();
    expect(adapter.resolveSessionId({ sessionId: "my-session" })).toBe("my-session");
  });

  it("resolveSessionId() returns undefined when no sessionId provided", () => {
    const adapter = createCustomAdapter();
    expect(adapter.resolveSessionId({})).toBeUndefined();
  });

  it("resolveSessionId() falls back to BABYSITTER_SESSION_ID env var", () => {
    process.env.BABYSITTER_SESSION_ID = "cross-harness-session";
    const adapter = createCustomAdapter();
    expect(adapter.resolveSessionId({})).toBe("cross-harness-session");
  });

  it("resolveSessionId() does NOT read harness-specific env vars", () => {
    process.env.CODEX_THREAD_ID = "should-be-ignored";
    const adapter = createCustomAdapter();
    expect(adapter.resolveSessionId({})).toBeUndefined();
  });

  it("getMissingSessionIdHint() returns helpful message", () => {
    const adapter = createCustomAdapter();
    const hint = adapter.getMissingSessionIdHint!();
    expect(hint).toContain("--session-id");
    expect(hint).toContain("explicit");
  });

  it("resolveStateDir() defaults to ~/.a5c/state/", () => {
    const adapter = createCustomAdapter();
    const dir = adapter.resolveStateDir({});
    const os = require("node:os");
    const path = require("node:path");
    expect(dir).toBe(path.join(os.homedir(), ".a5c", "state"));
  });

  it("resolveStateDir() respects explicit stateDir", () => {
    const adapter = createCustomAdapter();
    const dir = adapter.resolveStateDir({ stateDir: "/tmp/my-state" });
    expect(dir).toContain("my-state");
  });

  it("resolvePluginRoot() returns undefined when not provided", () => {
    const adapter = createCustomAdapter();
    expect(adapter.resolvePluginRoot({})).toBeUndefined();
  });

  it("bindSession() returns error when sessionId is empty", async () => {
    const adapter = createCustomAdapter();
    const result = await adapter.bindSession({
      sessionId: "",
      runId: "run-1",
      runDir: "/tmp/runs/run-1",
      prompt: "test",
      verbose: false,
      json: false,
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("--session-id");
  });

  it("bindSession() succeeds with explicit sessionId", async () => {
    const adapter = createCustomAdapter();
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
    expect(result.harness).toBe("custom");
  });
});

describe("custom adapter in registry", () => {
  it("is findable via getAdapterByName('custom')", () => {
    const adapter = getAdapterByName("custom");
    expect(adapter).not.toBeNull();
    expect(adapter!.name).toBe("custom");
  });

  it("detectAdapter() returns custom adapter when no harness env vars set", () => {
    // All env vars cleared in beforeEach
    const adapter = detectAdapter();
    expect(adapter.name).toBe("custom");
  });
});

describe("autoResolvesSessionId on known adapters", () => {
  it("claude-code adapter auto-resolves", () => {
    const adapter = getAdapterByName("claude-code");
    expect(adapter!.autoResolvesSessionId!()).toBe(true);
  });

  it("codex adapter auto-resolves", () => {
    const adapter = getAdapterByName("codex");
    expect(adapter!.autoResolvesSessionId!()).toBe(true);
  });

  it("pi adapter auto-resolves", () => {
    const adapter = getAdapterByName("pi");
    expect(adapter!.autoResolvesSessionId!()).toBe(true);
  });

  it("gemini-cli adapter auto-resolves", () => {
    const adapter = getAdapterByName("gemini-cli");
    expect(adapter!.autoResolvesSessionId!()).toBe(true);
  });

  it("oh-my-pi adapter auto-resolves (inherited from pi)", () => {
    const adapter = getAdapterByName("oh-my-pi");
    expect(adapter!.autoResolvesSessionId!()).toBe(true);
  });
});
