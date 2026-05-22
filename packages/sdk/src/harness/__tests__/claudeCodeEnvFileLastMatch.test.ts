/**
 * Verifies that resolveSessionIdDetailed() returns process.env.AGENT_SESSION_ID.
 *
 * Env-file parsing was removed during harness unification -- hooks-mux now
 * handles session ID propagation via AGENT_SESSION_ID.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveSessionIdDetailed } from "../adapters/claude-code";

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {
    AGENT_SESSION_ID: process.env.AGENT_SESSION_ID,
  };
  delete process.env.AGENT_SESSION_ID;
});

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("resolveSessionIdDetailed after env-file removal", () => {
  it("returns AGENT_SESSION_ID from env as the sole source", () => {
    process.env.AGENT_SESSION_ID = "NEWEST-ONE";

    const r = resolveSessionIdDetailed();
    expect(r.sessionId).toBe("NEWEST-ONE");
    expect(r.resolvedFrom).toBe("env-var");
    expect(r.ancestorPid).toBeNull();
    expect(r.ancestorAlive).toBeNull();
  });

  it("returns none when AGENT_SESSION_ID is not set", () => {
    const r = resolveSessionIdDetailed();
    expect(r.sessionId).toBeUndefined();
    expect(r.resolvedFrom).toBe("none");
  });
});
