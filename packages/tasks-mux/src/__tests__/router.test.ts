import { describe, expect, it } from "vitest";
import { routeTask, isHostDelegableRoute, TaskRouter } from "../router.js";

describe("routeTask", () => {
  it("defaults agent tasks to internal agent-core routing", () => {
    const decision = routeTask({ kind: "agent", agent: { prompt: { task: "do work" } } });

    expect(decision.responderType).toBe("internal");
    expect(decision.route).toBe("agent-core");
    expect(isHostDelegableRoute(decision)).toBe(true);
  });

  it("routes explicit agent responder tasks to agent-mux", () => {
    const decision = routeTask({
      kind: "agent",
      agent: {
        responderType: "agent",
        adapter: "codex",
        model: "gpt-5.4",
      },
    });

    expect(decision.responderType).toBe("agent");
    expect(decision.route).toBe("agent-mux");
    expect(decision.responder.adapter).toBe("codex");
    expect(isHostDelegableRoute(decision)).toBe(true);
  });

  it("routes breakpoint tasks to human responders through breakpoint backends", () => {
    const decision = routeTask({ kind: "breakpoint", breakpoint: { responderType: "human" } });

    expect(decision.responderType).toBe("human");
    expect(decision.route).toBe("breakpoint");
    expect(isHostDelegableRoute(decision)).toBe(false);
  });

  it("returns explicit unavailable evidence for tracker routing without a backend", () => {
    const decision = routeTask({
      kind: "agent",
      metadata: { responderType: "tracker", trackerBackend: "linear" },
    });

    expect(decision.responderType).toBe("tracker");
    expect(decision.route).toBe("external-tracker");
    expect(decision.unavailable).toBe(true);
    expect(decision.reason).toContain("ExternalTrackerBackend unavailable");
    expect(isHostDelegableRoute(decision)).toBe(false);
  });

  it("auto routing prefers an available agent responder before human fallback", () => {
    const decision = routeTask(
      { kind: "agent", agent: { responderType: "auto", adapter: "codex" } },
      {
        responders: [
          {
            id: "human-1",
            type: "human",
            name: "Human",
            title: "Human",
            domains: [],
            tags: [],
            availability: true,
            responseTimeSla: 60_000,
          },
          {
            id: "codex",
            type: "agent",
            name: "Codex",
            title: "Codex",
            domains: [],
            tags: [],
            availability: true,
            responseTimeSla: 1_000,
            adapter: "codex",
          },
        ],
      },
    );

    expect(decision.responderType).toBe("agent");
    expect(decision.responder.id).toBe("codex");
  });

  it("matches explicit agent responders by availability and capabilities", () => {
    const router = new TaskRouter({
      responders: [
        {
          id: "offline-codex",
          type: "agent",
          name: "Offline Codex",
          title: "Offline Codex",
          domains: [],
          tags: [],
          capabilities: ["typescript"],
          availability: false,
          responseTimeSla: 1_000,
          adapter: "codex",
        },
        {
          id: "docs-agent",
          type: "agent",
          name: "Docs Agent",
          title: "Docs Agent",
          domains: [],
          tags: [],
          capabilities: ["documentation"],
          availability: true,
          responseTimeSla: 1_000,
          adapter: "docs",
        },
        {
          id: "code-agent",
          type: "agent",
          name: "Code Agent",
          title: "Code Agent",
          domains: [],
          tags: [],
          capabilities: ["typescript", "tests"],
          availability: true,
          responseTimeSla: 1_000,
          adapter: "code",
        },
      ],
    });

    const decision = router.routeTask({
      kind: "agent",
      agent: {
        responderType: "agent",
        adapter: "codex",
        capabilities: ["typescript"],
      },
    });

    expect(decision.responderType).toBe("agent");
    expect(decision.responder.id).toBe("code-agent");
  });

  it("auto routing falls back to a capable human when no capable agent is available", () => {
    const decision = routeTask(
      {
        kind: "agent",
        agent: {
          responderType: "auto",
          capabilities: ["security-review"],
        },
      },
      {
        responders: [
          {
            id: "code-agent",
            type: "agent",
            name: "Code Agent",
            title: "Code Agent",
            domains: [],
            tags: [],
            capabilities: ["typescript"],
            availability: true,
            responseTimeSla: 1_000,
          },
          {
            id: "security-human",
            type: "human",
            name: "Security Human",
            title: "Security Human",
            domains: [],
            tags: [],
            capabilities: ["security-review"],
            availability: true,
            responseTimeSla: 60_000,
          },
        ],
      },
    );

    expect(decision.responderType).toBe("human");
    expect(decision.responder.id).toBe("security-human");
  });
});
