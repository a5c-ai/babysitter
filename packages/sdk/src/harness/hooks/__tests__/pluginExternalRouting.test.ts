import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";

/**
 * These tests verify routing classification by spawning a child process
 * to call the real @a5c-ai/tasks-mux module — completely isolated from
 * vitest's mock system which leaks across thread-pooled test files.
 */

function evalTasksMux(code: string): unknown {
  const script = `const m = require("@a5c-ai/tasks-mux"); ${code}`;
  const result = execFileSync(process.execPath, ["-e", script], {
    encoding: "utf8",
    timeout: 5000,
  });
  return JSON.parse(result.trim());
}

describe("plugin tasks-mux external routing classification", () => {
  it("keeps agent responder effects inside tasks-mux so plugin mode can resolve them internally", () => {
    const result = evalTasksMux(`
      const d = m.routeTask(
        { kind: "agent", agent: { responderType: "agent", adapter: "codex", prompt: { task: "review" } } },
        { responders: [{ id: "codex", type: "agent", name: "Codex", title: "Codex", domains: [], tags: [], availability: true, responseTimeSla: 1000, adapter: "codex" }] }
      );
      console.log(JSON.stringify({ responderType: d.responderType, route: d.route, delegable: m.isHostDelegableRoute(d) }));
    `) as { responderType: string; route: string; delegable: boolean };

    expect(result.responderType).toBe("agent");
    expect(result.route).toBe("agent-mux");
    expect(result.delegable).toBe(false);
  });

  it("classifies tracker responder effects as externally waiting when no tracker backend is available", () => {
    const result = evalTasksMux(`
      const d = m.routeTask({ kind: "agent", metadata: { responderType: "tracker", trackerBackend: "linear" } });
      console.log(JSON.stringify({ responderType: d.responderType, route: d.route, unavailable: d.unavailable, delegable: m.isHostDelegableRoute(d) }));
    `) as { responderType: string; route: string; unavailable: boolean; delegable: boolean };

    expect(result.responderType).toBe("tracker");
    expect(result.route).toBe("external-tracker");
    expect(result.unavailable).toBe(true);
    expect(result.delegable).toBe(false);
  });
});
