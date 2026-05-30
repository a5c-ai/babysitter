import { describe, expect, it, vi } from "vitest";
import { isHostDelegableRoute, routeTask } from "../router.js";

describe("issue #606 responder routing matrix", () => {
  it("routes internal, human, agent, tracker, and auto responder types", () => {
    expect(routeTask({ kind: "agent" })).toMatchObject({
      responderType: "internal",
      route: "agent-core",
    });

    expect(routeTask({ kind: "breakpoint", breakpoint: { responderType: "human" } })).toMatchObject({
      responderType: "human",
      route: "breakpoint",
    });

    expect(routeTask({ kind: "agent", agent: { responderType: "agent", adapter: "codex" } })).toMatchObject({
      responderType: "agent",
      route: "agent-mux",
      responder: { adapter: "codex" },
    });

    expect(routeTask({ kind: "agent", metadata: { responderType: "tracker", trackerBackend: "linear" } }))
      .toMatchObject({
        responderType: "tracker",
        route: "external-tracker",
        unavailable: true,
      });

    expect(routeTask(
      { kind: "agent", agent: { responderType: "auto", adapter: "codex" } },
      {
        responders: [{
          id: "codex",
          type: "agent",
          name: "Codex",
          title: "Codex",
          domains: [],
          tags: [],
          availability: true,
          responseTimeSla: 1000,
          adapter: "codex",
        }],
      },
    )).toMatchObject({
      responderType: "agent",
      route: "agent-mux",
      responder: { id: "codex" },
    });
  });

  it("falls back to the requested fallbackType when an agent responder is unavailable", () => {
    const internalDecision = routeTask({
      kind: "agent",
      agent: {
        responderType: "agent",
        adapter: "codex",
        fallbackType: "internal",
      },
    });

    expect(internalDecision).toMatchObject({
      responderType: "internal",
      route: "agent-core",
      reason: "agent responder unavailable; fell back to internal",
    });
    expect(isHostDelegableRoute(internalDecision)).toBe(true);

    const humanBackend = { name: "human", submitBreakpoint: vi.fn() } as never;
    const humanDecision = routeTask(
      {
        kind: "agent",
        agent: {
          responderType: "agent",
          adapter: "codex",
          fallbackType: "human",
        },
      },
      { humanBackend },
    );

    expect(humanDecision).toMatchObject({
      responderType: "human",
      route: "breakpoint",
      backend: humanBackend,
      reason: "agent responder unavailable; fell back to human",
    });
    expect(isHostDelegableRoute(humanDecision)).toBe(false);
  });

  it("does not fallback when a matching agent responder or agent backend is available", () => {
    const backend = { name: "agent-mux", submitBreakpoint: vi.fn() } as never;

    expect(routeTask(
      {
        kind: "agent",
        agent: {
          responderType: "agent",
          adapter: "codex",
          fallbackType: "internal",
        },
      },
      { agentBackend: backend },
    )).toMatchObject({
      responderType: "agent",
      route: "agent-mux",
      backend,
    });
  });
});
