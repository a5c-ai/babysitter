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
  savedSessionEnv = process.env.AGENT_SESSION_ID;
  savedHarnessPid = process.env.BABYSITTER_HARNESS_PID;
  savedClaudeEnvFile = process.env.CLAUDE_ENV_FILE;
  savedTrustEnv = process.env.AGENT_TRUST_ENV_SESSION;
  savedPidMarkerFlag = process.env.AGENT_ENABLE_SESSION_PID_MARKERS;
  process.env.BABYSITTER_GLOBAL_STATE_DIR = tmpDir;
  process.env.BABYSITTER_STATE_DIR = tmpDir;
  delete process.env.AGENT_SESSION_ID;
  delete process.env.AGENT_SESSION_ID;
  delete process.env.BABYSITTER_HARNESS_PID;
  delete process.env.CLAUDE_ENV_FILE;
  delete process.env.AGENT_TRUST_ENV_SESSION;
  delete process.env.BABYSITTER_TRUST_ENV_SESSION;
  delete process.env.AGENT_ENABLE_SESSION_PID_MARKERS;
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
  restore("AGENT_SESSION_ID", savedSessionEnv);
  delete process.env.AGENT_SESSION_ID;
  restore("BABYSITTER_HARNESS_PID", savedHarnessPid);
  restore("CLAUDE_ENV_FILE", savedClaudeEnvFile);
  restore("AGENT_TRUST_ENV_SESSION", savedTrustEnv);
  delete process.env.BABYSITTER_TRUST_ENV_SESSION;
  restore("AGENT_ENABLE_SESSION_PID_MARKERS", savedPidMarkerFlag);
  delete process.env.BABYSITTER_ENABLE_SESSION_PID_MARKERS;
  __resetCacheForTests();
  __setAncestorResolverForTests(undefined);
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors.
  }
});

describe("runSessionWhoami", () => {
  // PID-marker tests removed -- PID markers were removed during harness
  // unification.  AGENT_SESSION_ID is now the sole session source for
  // claude-code.

  it("returns AGENT_SESSION_ID as the session source for claude-code", () => {
    process.env.AGENT_SESSION_ID = "SESS-FROM-ENV";

    const result = runSessionWhoami({ harness: "claude-code" });
    expect(result.harness).toBe("claude-code");
    expect(result.sessionId).toBe("SESS-FROM-ENV");
    expect(result.resolvedFrom).toBe("env-var");
    expect(result.envVarPresent).toBe(true);
    expect(result.envVarMatches).toBe(true);
    expect(result.ancestorPid).toBeNull();
    expect(result.ancestorAlive).toBeNull();
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
