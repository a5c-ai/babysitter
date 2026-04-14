/**
 * Tests for session:whoami.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  writeSessionMarker,
  __resetCacheForTests,
  __setAncestorResolverForTests,
} from "../../../utils/sessionMarker";
import { runSessionWhoami } from "../sessionWhoami";

let tmpDir: string;
let savedGlobalStateDir: string | undefined;
let savedSessionEnv: string | undefined;
let savedClaudeEnvFile: string | undefined;
let savedTrustEnv: string | undefined;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "session-whoami-test-"));
  savedGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
  savedSessionEnv = process.env.BABYSITTER_SESSION_ID;
  savedClaudeEnvFile = process.env.CLAUDE_ENV_FILE;
  savedTrustEnv = process.env.BABYSITTER_TRUST_ENV_SESSION;
  process.env.BABYSITTER_GLOBAL_STATE_DIR = tmpDir;
  delete process.env.BABYSITTER_SESSION_ID;
  delete process.env.CLAUDE_ENV_FILE;
  delete process.env.BABYSITTER_TRUST_ENV_SESSION;
  __resetCacheForTests();
});

afterEach(async () => {
  const restore = (k: string, v: string | undefined) => {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  };
  restore("BABYSITTER_GLOBAL_STATE_DIR", savedGlobalStateDir);
  restore("BABYSITTER_SESSION_ID", savedSessionEnv);
  restore("CLAUDE_ENV_FILE", savedClaudeEnvFile);
  restore("BABYSITTER_TRUST_ENV_SESSION", savedTrustEnv);
  __resetCacheForTests();
  __setAncestorResolverForTests(undefined);
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

describe("session:whoami", () => {
  it("reports env-var with envVarMatches=true when env overrides the pid marker", () => {
    __setAncestorResolverForTests(() => ({ pid: process.pid }));
    writeSessionMarker("claude-code", "SESS-FROM-MARKER");
    process.env.BABYSITTER_SESSION_ID = "SESS-FROM-ENV";

    const result = runSessionWhoami({ harness: "claude-code" });
    expect(result.harness).toBe("claude-code");
    expect(result.sessionId).toBe("SESS-FROM-ENV");
    expect(result.resolvedFrom).toBe("env-var");
    expect(result.envVarPresent).toBe(true);
    expect(result.envVarMatches).toBe(true);
    expect(result.ancestorPid).toBe(process.pid);
    expect(result.ancestorAlive).toBe(true);
    expect(result.markerPath).toContain("current-session-claude-code-pid-");
  });

  it("falls back to pid-marker when env is absent", () => {
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

  it("returns the requested harness key for non-default harnesses", () => {
    __setAncestorResolverForTests(() => undefined);
    const result = runSessionWhoami({ harness: "gemini-cli" });
    expect(result.harness).toBe("gemini-cli");
    expect(result.sessionId).toBeNull();
    expect(result.resolvedFrom).toBe("none");
  });
});
