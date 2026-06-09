import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { pinActiveAdapterToRecordedHarness } from "../runIterate";
import { getAdapter, resetAdapter } from "../../../harness";

// Env vars that could make detectCallerHarness resolve a harness from the
// ambient environment — cleared so the test asserts pinning, not detection.
const ENV_KEYS = [
  "AGENT_SESSION_ID",
  "CLAUDE_ENV_FILE",
  "CLAUDECODE",
  "CLAUDE_CODE",
  "CLAUDE_CODE_SESSION_ID",
  "CLAUDE_PROJECT_DIR",
  "CODEX_THREAD_ID",
  "CODEX_SESSION_ID",
  "CODEX_PLUGIN_ROOT",
  "PI_SESSION_ID",
  "PI_PLUGIN_ROOT",
  "OPENCODE_SESSION_ID",
  "OPENCODE_CONFIG",
  "GENTY_PLUGIN_ROOT",
];

describe("pinActiveAdapterToRecordedHarness (issue #949)", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    resetAdapter();
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
      else delete process.env[k];
    }
    resetAdapter();
  });

  it("pins the active adapter to the recorded harness", () => {
    const pinned = pinActiveAdapterToRecordedHarness("claude-code");
    expect(pinned).toBe(true);
    expect(getAdapter().name).toBe("claude-code");
  });

  it("honors run.json harness even when ambient env points elsewhere", () => {
    // Simulate an opencode-style session id present in the environment while the
    // run was recorded as claude-code. The recorded harness must win.
    process.env.AGENT_SESSION_ID = "sess-from-other-harness";
    const pinned = pinActiveAdapterToRecordedHarness("claude-code");
    expect(pinned).toBe(true);
    expect(getAdapter().name).toBe("claude-code");
  });

  it("returns false and does not pin when no harness is recorded", () => {
    expect(pinActiveAdapterToRecordedHarness(undefined)).toBe(false);
    expect(pinActiveAdapterToRecordedHarness("")).toBe(false);
  });

  it("returns false for an unknown harness (falls through to env detection)", () => {
    expect(pinActiveAdapterToRecordedHarness("not-a-real-harness")).toBe(false);
  });

  it("can pin to other known harnesses", () => {
    expect(pinActiveAdapterToRecordedHarness("codex")).toBe(true);
    expect(getAdapter().name).toBe("codex");
    expect(pinActiveAdapterToRecordedHarness("pi")).toBe(true);
    expect(getAdapter().name).toBe("pi");
  });
});
