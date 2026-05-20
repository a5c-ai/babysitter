/**
 * Verifies Claude Code session resolution reports the same provenance as the
 * shared adapter resolver.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs, writeFileSync, mkdirSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { resolveSessionIdDetailed } from "../adapters/claude-code";
import {
  __resetCacheForTests,
  __setAncestorResolverForTests,
  getSessionMarkerPath,
} from "../../utils/sessionMarker";

let savedSessionId: string | undefined;
let savedTrustEnv: string | undefined;
let savedMarkerFlag: string | undefined;
let savedGlobalStateDir: string | undefined;
let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "claude-detail-resolve-"));
  savedSessionId = process.env.AGENT_SESSION_ID;
  savedTrustEnv = process.env.AGENT_TRUST_ENV_SESSION;
  savedMarkerFlag = process.env.AGENT_ENABLE_SESSION_PID_MARKERS;
  savedGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
  delete process.env.AGENT_SESSION_ID;
  delete process.env.AGENT_TRUST_ENV_SESSION;
  delete process.env.BABYSITTER_TRUST_ENV_SESSION;
  delete process.env.AGENT_ENABLE_SESSION_PID_MARKERS;
  process.env.BABYSITTER_GLOBAL_STATE_DIR = tmpDir;
  __resetCacheForTests();
});

afterEach(async () => {
  if (savedSessionId === undefined) delete process.env.AGENT_SESSION_ID;
  else process.env.AGENT_SESSION_ID = savedSessionId;
  if (savedTrustEnv === undefined) delete process.env.AGENT_TRUST_ENV_SESSION;
  else process.env.AGENT_TRUST_ENV_SESSION = savedTrustEnv;
  if (savedMarkerFlag === undefined) delete process.env.AGENT_ENABLE_SESSION_PID_MARKERS;
  else process.env.AGENT_ENABLE_SESSION_PID_MARKERS = savedMarkerFlag;
  if (savedGlobalStateDir === undefined) delete process.env.BABYSITTER_GLOBAL_STATE_DIR;
  else process.env.BABYSITTER_GLOBAL_STATE_DIR = savedGlobalStateDir;
  delete process.env.BABYSITTER_TRUST_ENV_SESSION;
  __resetCacheForTests();
  __setAncestorResolverForTests(undefined);
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("resolveSessionIdDetailed (unified)", () => {
  it("returns explicit sessionId without consulting any source", () => {
    process.env.AGENT_SESSION_ID = "SHOULD-BE-IGNORED";
    const r = resolveSessionIdDetailed("EXPLICIT-ID");
    expect(r.sessionId).toBe("EXPLICIT-ID");
    expect(r.resolvedFrom).toBe("explicit");
    expect(r.ancestorPid).toBeNull();
    expect(r.ancestorAlive).toBeNull();
  });

  it("returns pid marker before AGENT_SESSION_ID when no explicit value is given", () => {
    process.env.AGENT_ENABLE_SESSION_PID_MARKERS = "1";
    process.env.AGENT_SESSION_ID = "ENV-VAR-ID";
    __setAncestorResolverForTests(() => ({ pid: process.pid }));
    seedMarker("MARKER-ID");

    const r = resolveSessionIdDetailed();
    expect(r.sessionId).toBe("MARKER-ID");
    expect(r.resolvedFrom).toBe("pid-marker");
    expect(r.ancestorPid).toBe(process.pid);
    expect(r.ancestorAlive).toBe(true);
  });

  it("returns AGENT_SESSION_ID first when trust-env is set", () => {
    process.env.AGENT_ENABLE_SESSION_PID_MARKERS = "1";
    process.env.AGENT_SESSION_ID = "ENV-VAR-ID";
    process.env.AGENT_TRUST_ENV_SESSION = "1";
    __setAncestorResolverForTests(() => ({ pid: process.pid }));
    seedMarker("MARKER-ID");

    const r = resolveSessionIdDetailed();
    expect(r.sessionId).toBe("ENV-VAR-ID");
    expect(r.resolvedFrom).toBe("env-var");
  });

  it("returns none when neither explicit nor env var is present", () => {
    const r = resolveSessionIdDetailed();
    expect(r.sessionId).toBeUndefined();
    expect(r.resolvedFrom).toBe("none");
    expect(r.ancestorPid).toBeNull();
    expect(r.ancestorAlive).toBeNull();
  });
});

function seedMarker(sessionId: string): void {
  const markerPath = getSessionMarkerPath("claude-code", process.pid);
  mkdirSync(path.dirname(markerPath), { recursive: true });
  writeFileSync(markerPath, `${sessionId}\n`);
}
