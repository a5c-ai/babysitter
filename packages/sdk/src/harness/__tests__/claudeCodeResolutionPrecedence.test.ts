/**
 * Verifies Claude Code session resolution after harness unification.
 *
 * PID-marker and env-file precedence logic has been removed.
 * resolveSessionIdDetailed() now returns process.env.AGENT_SESSION_ID
 * or an explicit value, with no other sources.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveSessionIdDetailed } from "../claudeCode";

let savedSessionId: string | undefined;

beforeEach(() => {
  savedSessionId = process.env.AGENT_SESSION_ID;
  delete process.env.AGENT_SESSION_ID;
});

afterEach(() => {
  if (savedSessionId === undefined) delete process.env.AGENT_SESSION_ID;
  else process.env.AGENT_SESSION_ID = savedSessionId;
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

  it("returns AGENT_SESSION_ID env var when no explicit value given", () => {
    process.env.AGENT_SESSION_ID = "ENV-VAR-ID";
    const r = resolveSessionIdDetailed();
    expect(r.sessionId).toBe("ENV-VAR-ID");
    expect(r.resolvedFrom).toBe("env-var");
    expect(r.ancestorPid).toBeNull();
    expect(r.ancestorAlive).toBeNull();
  });

  it("returns none when neither explicit nor env var is present", () => {
    const r = resolveSessionIdDetailed();
    expect(r.sessionId).toBeUndefined();
    expect(r.resolvedFrom).toBe("none");
    expect(r.ancestorPid).toBeNull();
    expect(r.ancestorAlive).toBeNull();
  });
});
