import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetCacheForTests,
  __setAncestorResolverForTests,
  writeSessionMarker,
} from "../../utils/sessionMarker";
import { runSessionWhoami } from "../whoami";

let tmpDir: string;
let savedGlobalStateDir: string | undefined;
let savedStateDir: string | undefined;
let savedSessionEnv: string | undefined;
let savedHarnessPid: string | undefined;
let savedClaudeEnvFile: string | undefined;
let savedTrustEnv: string | undefined;
let savedPidMarkerFlag: string | undefined;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "session-whoami-test-"));
  savedGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
  savedStateDir = process.env.BABYSITTER_STATE_DIR;
  savedSessionEnv = process.env.BABYSITTER_SESSION_ID;
  savedHarnessPid = process.env.BABYSITTER_HARNESS_PID;
  savedClaudeEnvFile = process.env.CLAUDE_ENV_FILE;
  savedTrustEnv = process.env.BABYSITTER_TRUST_ENV_SESSION;
  savedPidMarkerFlag = process.env.BABYSITTER_ENABLE_SESSION_PID_MARKERS;
  process.env.BABYSITTER_GLOBAL_STATE_DIR = tmpDir;
  process.env.BABYSITTER_STATE_DIR = tmpDir;
  delete process.env.BABYSITTER_SESSION_ID;
  delete process.env.BABYSITTER_HARNESS_PID;
  delete process.env.CLAUDE_ENV_FILE;
  delete process.env.BABYSITTER_TRUST_ENV_SESSION;
  delete process.env.BABYSITTER_ENABLE_SESSION_PID_MARKERS;
  __resetCacheForTests();
});

afterEach(async () => {
  const restore = (key: string, value: string | undefined) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  };
  restore("BABYSITTER_GLOBAL_STATE_DIR", savedGlobalStateDir);
  restore("BABYSITTER_STATE_DIR", savedStateDir);
  restore("BABYSITTER_SESSION_ID", savedSessionEnv);
  restore("BABYSITTER_HARNESS_PID", savedHarnessPid);
  restore("CLAUDE_ENV_FILE", savedClaudeEnvFile);
  restore("BABYSITTER_TRUST_ENV_SESSION", savedTrustEnv);
  restore("BABYSITTER_ENABLE_SESSION_PID_MARKERS", savedPidMarkerFlag);
  __resetCacheForTests();
  __setAncestorResolverForTests(undefined);
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors.
  }
});

describe("runSessionWhoami", () => {
  it("reports pid-marker provenance when the env session is stale", () => {
    process.env.BABYSITTER_ENABLE_SESSION_PID_MARKERS = "1";
    process.env.BABYSITTER_HARNESS_PID = String(process.pid);
    __setAncestorResolverForTests(() => ({ pid: process.pid }));
    writeSessionMarker("claude-code", "SESS-FROM-MARKER");
    process.env.BABYSITTER_SESSION_ID = "SESS-FROM-ENV";

    const result = runSessionWhoami({ harness: "claude-code" });
    expect(result.harness).toBe("claude-code");
    expect(result.sessionId).toBe("SESS-FROM-MARKER");
    expect(result.resolvedFrom).toBe("pid-marker");
    expect(result.envVarPresent).toBe(true);
    expect(result.envVarMatches).toBe(false);
    expect(result.ancestorPid).toBe(process.pid);
    expect(result.ancestorAlive).toBe(true);
    expect(result.markerPath).toContain("current-session-claude-code-pid-");
  });

  it("falls back to the pid marker when no env session is present", () => {
    process.env.BABYSITTER_ENABLE_SESSION_PID_MARKERS = "1";
    process.env.BABYSITTER_HARNESS_PID = String(process.pid);
    __setAncestorResolverForTests(() => ({ pid: process.pid }));
    writeSessionMarker("claude-code", "SESS-FROM-MARKER");

    const result = runSessionWhoami({ harness: "claude-code" });
    expect(result.sessionId).toBe("SESS-FROM-MARKER");
    expect(result.resolvedFrom).toBe("pid-marker");
    expect(result.envVarPresent).toBe(false);
    expect(result.envVarMatches).toBeNull();
    expect(result.ancestorPid).toBe(process.pid);
    expect(result.markerPath).toContain("current-session-claude-code-pid-");
  });

  it("ignores pid markers when the feature flag is disabled", () => {
    __setAncestorResolverForTests(() => ({ pid: process.pid }));
    writeSessionMarker("claude-code", "SESS-FROM-MARKER");

    const result = runSessionWhoami({ harness: "claude-code" });
    expect(result.sessionId).toBeNull();
    expect(result.resolvedFrom).toBe("none");
    expect(result.ancestorPid).toBeNull();
    expect(result.ancestorAlive).toBeNull();
    expect(result.markerPath).toBeNull();
  });

  it("returns the requested harness key for non-default harnesses", () => {
    __setAncestorResolverForTests(() => undefined);
    const result = runSessionWhoami({ harness: "gemini-cli" });
    expect(result.harness).toBe("gemini-cli");
    expect(result.sessionId).toBeNull();
    expect(result.resolvedFrom).toBe("none");
  });
});
