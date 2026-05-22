/**
 * Tests for the hooks-mux subprocess bridge.
 *
 * Covers argument building (pure function, no actual spawn) and
 * the availability check with a mocked child process.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildInvokeArgs, type InvokeOptions } from "../subprocess";

// ---------------------------------------------------------------------------
// buildInvokeArgs (pure — no subprocess spawned)
// ---------------------------------------------------------------------------

describe("buildInvokeArgs", () => {
  it("builds minimal args with only adapter", () => {
    const args = buildInvokeArgs({ adapter: "claude-code" });
    expect(args).toEqual(["invoke", "--adapter", "claude-code"]);
  });

  it("includes --session-id when provided", () => {
    const args = buildInvokeArgs({
      adapter: "cursor",
      sessionId: "sess-42",
    });
    expect(args).toContain("--session-id");
    expect(args).toContain("sess-42");
  });

  it("includes --bootstrap-only flag", () => {
    const args = buildInvokeArgs({
      adapter: "codex",
      bootstrapOnly: true,
    });
    expect(args).toContain("--bootstrap-only");
  });

  it("includes --json flag", () => {
    const args = buildInvokeArgs({
      adapter: "gemini-cli",
      json: true,
    });
    expect(args).toContain("--json");
  });

  it("includes multiple --handler flags", () => {
    const args = buildInvokeArgs({
      adapter: "test",
      handlers: ["stop-hook", "session-start"],
    });
    const handlerIndices = args
      .map((a, i) => (a === "--handler" ? i : -1))
      .filter((i) => i >= 0);
    expect(handlerIndices).toHaveLength(2);
    expect(args[handlerIndices[0] + 1]).toBe("stop-hook");
    expect(args[handlerIndices[1] + 1]).toBe("session-start");
  });

  it("includes all flags combined", () => {
    const opts: InvokeOptions = {
      adapter: "pi",
      sessionId: "s1",
      bootstrapOnly: true,
      json: true,
      handlers: ["h1"],
    };
    const args = buildInvokeArgs(opts);
    expect(args[0]).toBe("invoke");
    expect(args).toContain("--adapter");
    expect(args).toContain("pi");
    expect(args).toContain("--session-id");
    expect(args).toContain("s1");
    expect(args).toContain("--bootstrap-only");
    expect(args).toContain("--json");
    expect(args).toContain("--handler");
    expect(args).toContain("h1");
  });

  it("omits optional flags when not provided", () => {
    const args = buildInvokeArgs({ adapter: "test" });
    expect(args).not.toContain("--session-id");
    expect(args).not.toContain("--bootstrap-only");
    expect(args).not.toContain("--json");
    expect(args).not.toContain("--handler");
  });
});

// ---------------------------------------------------------------------------
// isHooksProxyAvailable (env-based)
// ---------------------------------------------------------------------------

describe("isHooksProxyAvailable", () => {
  let savedPath: string | undefined;

  beforeEach(() => {
    savedPath = process.env.AGENT_HOOKS_PROXY_PATH;
  });

  afterEach(() => {
    if (savedPath !== undefined) {
      process.env.AGENT_HOOKS_PROXY_PATH = savedPath;
    } else {
      delete process.env.AGENT_HOOKS_PROXY_PATH;
    }
  });

  it("resolves to false when pointed at a nonexistent binary", async () => {
    process.env.AGENT_HOOKS_PROXY_PATH =
      "/nonexistent/path/to/a5c-hooks-mux-not-here";
    // Dynamic import to pick up env change
    const { isHooksProxyAvailable } = await import("../subprocess");
    const available = await isHooksProxyAvailable();
    expect(available).toBe(false);
  });
});
