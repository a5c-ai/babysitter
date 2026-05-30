import { describe, expect, it } from "vitest";
import { TaskRouter, routeTask, isHostDelegableRoute } from "../router.js";

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
    expect(isHostDelegableRoute(decision)).toBe(false);
  });

  it("routes external agent tasks to agent-mux", () => {
    const decision = routeTask({
      kind: "agent",
      agent: {
        external: true,
        adapter: "codex",
        model: "gpt-5.4",
      },
    });

    expect(decision.responderType).toBe("agent");
    expect(decision.route).toBe("agent-mux");
    expect(decision.responder.adapter).toBe("codex");
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

  it("selects a tracker responder by tracker backend metadata", () => {
    const trackerBackend = {
      name: "external-tracker",
    } as never;
    const decision = routeTask(
      {
        kind: "agent",
        metadata: { responderType: "tracker", trackerBackend: "linear" },
      },
      {
        trackerBackend,
        responders: [
          {
            id: "jira-tracker",
            type: "tracker",
            name: "Jira Tracker",
            title: "Jira Tracker",
            domains: [],
            tags: ["jira", "tracker"],
            availability: true,
            responseTimeSla: 300_000,
            trackerBackend: "jira",
          },
          {
            id: "linear-tracker",
            type: "tracker",
            name: "Linear Tracker",
            title: "Linear Tracker",
            domains: [],
            tags: ["linear", "tracker"],
            availability: true,
            responseTimeSla: 300_000,
            trackerBackend: "linear",
          },
        ],
      },
    );

    expect(decision.responderType).toBe("tracker");
    expect(decision.route).toBe("external-tracker");
    expect(decision.backend).toBe(trackerBackend);
    expect(decision.unavailable).toBe(false);
    expect(decision.responder?.id).toBe("linear-tracker");
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
            capabilities: ["review"],
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
            capabilities: ["code"],
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

  it("TaskRouter matches responders by type, availability, preferred adapter, and capabilities", () => {
    const router = new TaskRouter({
      responders: [
        {
          id: "codex-offline",
          type: "agent",
          name: "Codex Offline",
          title: "Codex Offline",
          capabilities: ["code", "test"],
          domains: [],
          tags: [],
          availability: false,
          responseTimeSla: 100,
          adapter: "codex",
        },
        {
          id: "codex-docs",
          type: "agent",
          name: "Codex Docs",
          title: "Codex Docs",
          capabilities: ["docs"],
          domains: [],
          tags: [],
          availability: true,
          responseTimeSla: 50,
          adapter: "codex",
        },
        {
          id: "codex-code",
          type: "agent",
          name: "Codex Code",
          title: "Codex Code",
          capabilities: ["code", "test"],
          domains: [],
          tags: [],
          availability: true,
          responseTimeSla: 200,
          adapter: "codex",
        },
      ],
    });

    const decision = router.routeTask({
      kind: "agent",
      agent: {
        responderType: "agent",
        adapter: "codex",
        requiredCapabilities: ["code", "test"],
      },
    });

    expect(decision.responderType).toBe("agent");
    expect(decision.responder.id).toBe("codex-code");
  });

  it("auto routing falls back to a capable human when no capable agent is available", () => {
    const decision = routeTask(
      {
        kind: "agent",
        agent: {
          responderType: "auto",
          requiredCapabilities: ["security-review"],
        },
      },
      {
        responders: [
          {
            id: "codex",
            type: "agent",
            name: "Codex",
            title: "Codex",
            capabilities: ["code"],
            domains: [],
            tags: [],
            availability: true,
            responseTimeSla: 1_000,
            adapter: "codex",
          },
          {
            id: "security-human",
            type: "human",
            name: "Security Human",
            title: "Security Human",
            capabilities: ["security-review"],
            domains: [],
            tags: [],
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
