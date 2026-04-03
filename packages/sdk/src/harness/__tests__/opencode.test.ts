/**
 * Tests for the OpenCode harness adapter.
 *
 * Covers:
 *   - createOpenCodeAdapter() returns valid adapter with correct name
 *   - isActive() detection via env vars (OPENCODE_SESSION_ID, OPENCODE_PROJECT_DIR)
 *   - resolveSessionId() from parsed args and env (BABYSITTER_SESSION_ID, OPENCODE_SESSION_ID)
 *   - getCapabilities() returns [HeadlessPrompt]
 *   - autoResolvesSessionId() returns false
 *   - supportsHookType() returns correct values for supported/unsupported hook types
 *   - getMissingSessionIdHint() returns guidance string
 *   - getUnsupportedHookMessage() returns appropriate messages
 *   - resolveStateDir() resolution
 *   - resolvePluginRoot() resolution
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createOpenCodeAdapter } from "../opencode";
import { HarnessCapability } from "../types";

// ---------------------------------------------------------------------------
// Setup / teardown — clean env between tests
// ---------------------------------------------------------------------------

const ENV_KEYS = [
  "OPENCODE_SESSION_ID",
  "OPENCODE_CONFIG",
  "OPENCODE_PLUGIN_ROOT",
  "BABYSITTER_SESSION_ID",
  "BABYSITTER_STATE_DIR",
  "BABYSITTER_GLOBAL_STATE_DIR",
  "BABYSITTER_LOG_DIR",
];

const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

// ---------------------------------------------------------------------------
// Adapter creation
// ---------------------------------------------------------------------------

describe("createOpenCodeAdapter", () => {
  it("returns adapter with name 'opencode'", () => {
    const adapter = createOpenCodeAdapter();
    expect(adapter.name).toBe("opencode");
  });
});

// ---------------------------------------------------------------------------
// isActive()
// ---------------------------------------------------------------------------

describe("OpenCode isActive()", () => {
  it("returns true when BABYSITTER_SESSION_ID is set", () => {
    process.env.BABYSITTER_SESSION_ID = "test-session-123";
    const adapter = createOpenCodeAdapter();
    expect(adapter.isActive()).toBe(true);
  });

  it("returns true when OPENCODE_CONFIG is set", () => {
    process.env.OPENCODE_CONFIG = "/tmp/opencode.json";
    const adapter = createOpenCodeAdapter();
    expect(adapter.isActive()).toBe(true);
  });

  it("returns true when both BABYSITTER_SESSION_ID and OPENCODE_CONFIG are set", () => {
    process.env.BABYSITTER_SESSION_ID = "sess-1";
    process.env.OPENCODE_CONFIG = "/tmp/opencode.json";
    const adapter = createOpenCodeAdapter();
    expect(adapter.isActive()).toBe(true);
  });

  it("returns false when no OpenCode env vars are set", () => {
    delete process.env.BABYSITTER_SESSION_ID;
    delete process.env.OPENCODE_CONFIG;
    const adapter = createOpenCodeAdapter();
    expect(adapter.isActive()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resolveSessionId()
// ---------------------------------------------------------------------------

describe("OpenCode resolveSessionId()", () => {
  it("returns BABYSITTER_SESSION_ID when set", () => {
    process.env.BABYSITTER_SESSION_ID = "babysitter-session-abc";
    const adapter = createOpenCodeAdapter();
    expect(adapter.resolveSessionId({})).toBe("babysitter-session-abc");
  });

  it("returns OPENCODE_SESSION_ID as fallback when BABYSITTER_SESSION_ID is not set", () => {
    process.env.OPENCODE_SESSION_ID = "opencode-session-xyz";
    const adapter = createOpenCodeAdapter();
    expect(adapter.resolveSessionId({})).toBe("opencode-session-xyz");
  });

  it("returns explicit sessionId when passed", () => {
    // Even with env vars set, explicit arg takes priority
    process.env.BABYSITTER_SESSION_ID = "env-session";
    process.env.OPENCODE_SESSION_ID = "opencode-env-session";
    const adapter = createOpenCodeAdapter();
    expect(adapter.resolveSessionId({ sessionId: "explicit-id" })).toBe(
      "explicit-id",
    );
  });

  it("returns undefined when no session vars available", () => {
    delete process.env.BABYSITTER_SESSION_ID;
    delete process.env.OPENCODE_SESSION_ID;
    const adapter = createOpenCodeAdapter();
    expect(adapter.resolveSessionId({})).toBeUndefined();
  });

  it("prefers BABYSITTER_SESSION_ID over OPENCODE_SESSION_ID", () => {
    process.env.BABYSITTER_SESSION_ID = "babysitter-wins";
    process.env.OPENCODE_SESSION_ID = "opencode-loses";
    const adapter = createOpenCodeAdapter();
    expect(adapter.resolveSessionId({})).toBe("babysitter-wins");
  });
});

// ---------------------------------------------------------------------------
// getCapabilities()
// ---------------------------------------------------------------------------

describe("OpenCode getCapabilities()", () => {
  it("returns HeadlessPrompt capability", () => {
    const adapter = createOpenCodeAdapter();
    const caps = adapter.getCapabilities();
    expect(caps).toContain(HarnessCapability.HeadlessPrompt);
  });

  it("returns exactly one capability", () => {
    const adapter = createOpenCodeAdapter();
    const caps = adapter.getCapabilities();
    expect(caps).toHaveLength(1);
  });

  it("does not include StopHook capability", () => {
    const adapter = createOpenCodeAdapter();
    const caps = adapter.getCapabilities();
    expect(caps).not.toContain(HarnessCapability.StopHook);
  });

  it("does not include SessionBinding capability", () => {
    const adapter = createOpenCodeAdapter();
    const caps = adapter.getCapabilities();
    expect(caps).not.toContain(HarnessCapability.SessionBinding);
  });
});

// ---------------------------------------------------------------------------
// autoResolvesSessionId()
// ---------------------------------------------------------------------------

describe("OpenCode autoResolvesSessionId()", () => {
  it("returns false", () => {
    const adapter = createOpenCodeAdapter();
    expect(adapter.autoResolvesSessionId()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// supportsHookType()
// ---------------------------------------------------------------------------

describe("OpenCode supportsHookType()", () => {
  it("returns true for session-start", () => {
    const adapter = createOpenCodeAdapter();
    expect(adapter.supportsHookType("session-start")).toBe(true);
  });

  it("returns true for pre-tool-use", () => {
    const adapter = createOpenCodeAdapter();
    expect(adapter.supportsHookType("pre-tool-use")).toBe(true);
  });

  it("returns true for post-tool-use", () => {
    const adapter = createOpenCodeAdapter();
    expect(adapter.supportsHookType("post-tool-use")).toBe(true);
  });

  it("returns false for stop", () => {
    const adapter = createOpenCodeAdapter();
    expect(adapter.supportsHookType("stop")).toBe(false);
  });

  it("returns false for user-prompt-submit", () => {
    const adapter = createOpenCodeAdapter();
    expect(adapter.supportsHookType("user-prompt-submit")).toBe(false);
  });

  it("returns false for unknown hook types", () => {
    const adapter = createOpenCodeAdapter();
    expect(adapter.supportsHookType("nonexistent-hook")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getMissingSessionIdHint()
// ---------------------------------------------------------------------------

describe("OpenCode getMissingSessionIdHint()", () => {
  it("returns a hint mentioning shell.env hook", () => {
    const adapter = createOpenCodeAdapter();
    const hint = adapter.getMissingSessionIdHint!();
    expect(hint).toContain("shell.env");
    expect(hint).toContain("BABYSITTER_SESSION_ID");
  });
});

// ---------------------------------------------------------------------------
// getUnsupportedHookMessage()
// ---------------------------------------------------------------------------

describe("OpenCode getUnsupportedHookMessage()", () => {
  it("returns specific message for stop hook", () => {
    const adapter = createOpenCodeAdapter();
    const msg = adapter.getUnsupportedHookMessage!("stop");
    expect(msg).toContain("stop hook");
    expect(msg).toContain("fire-and-forget");
  });

  it("returns generic message for other unsupported hooks", () => {
    const adapter = createOpenCodeAdapter();
    const msg = adapter.getUnsupportedHookMessage!("some-hook");
    expect(msg).toContain("some-hook");
    expect(msg).toContain("not supported");
  });
});

// ---------------------------------------------------------------------------
// resolvePluginRoot()
// ---------------------------------------------------------------------------

describe("OpenCode resolvePluginRoot()", () => {
  it("returns explicit pluginRoot when provided", () => {
    const adapter = createOpenCodeAdapter();
    const result = adapter.resolvePluginRoot!({
      pluginRoot: "/my/opencode/plugin",
    });
    expect(result).toContain("my");
    expect(result).toContain("opencode");
    expect(result).toContain("plugin");
  });

  it("falls back to OPENCODE_PLUGIN_ROOT env var", () => {
    process.env.OPENCODE_PLUGIN_ROOT = "/env/opencode/plugin";
    const adapter = createOpenCodeAdapter();
    const result = adapter.resolvePluginRoot!({});
    expect(result).toContain("env");
    expect(result).toContain("opencode");
    expect(result).toContain("plugin");
  });

  it("returns undefined when neither arg nor env is set", () => {
    const adapter = createOpenCodeAdapter();
    const result = adapter.resolvePluginRoot!({});
    expect(result).toBeUndefined();
  });
});
