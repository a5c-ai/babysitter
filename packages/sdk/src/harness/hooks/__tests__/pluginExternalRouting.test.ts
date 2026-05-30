import { describe, expect, it } from "vitest";
import { isHostDelegableRoute, routeTask } from "@a5c-ai/tasks-mux";

describe("plugin tasks-mux external routing classification", () => {
  it("keeps agent responder effects inside tasks-mux so plugin mode can resolve them internally", () => {
    const decision = routeTask(
      {
        kind: "agent",
        agent: {
          responderType: "agent",
          adapter: "codex",
          prompt: { task: "review" },
        },
      },
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
    );

    expect(decision).toMatchObject({
      responderType: "agent",
      route: "agent-mux",
    });
    expect(isHostDelegableRoute(decision)).toBe(false);
  });

  it("classifies tracker responder effects as externally waiting when no tracker backend is available", () => {
    const decision = routeTask({
      kind: "agent",
      metadata: {
        responderType: "tracker",
        trackerBackend: "linear",
      },
    });

    expect(decision).toMatchObject({
      responderType: "tracker",
      route: "external-tracker",
      unavailable: true,
    });
    expect(isHostDelegableRoute(decision)).toBe(false);
  });
});
