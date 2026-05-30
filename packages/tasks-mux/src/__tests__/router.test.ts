import { describe, it, expect } from "vitest";

import {
  NoResponderAvailableError,
  TaskRouter,
  routeTask,
} from "../router.js";
import type { Responder, TaskRouteRequest, RoutingContext } from "../index.js";

function makeResponder(overrides: Partial<Responder> = {}): Responder {
  return {
    id: "human-1",
    type: "human",
    name: "Human Reviewer",
    capabilities: ["text", "approval"],
    availability: true,
    ...overrides,
  };
}

function makeTask(overrides: Partial<TaskRouteRequest> = {}): TaskRouteRequest {
  return {
    kind: "agent",
    title: "Review code",
    capabilities: ["code"],
    agent: {
      responderType: "agent",
    },
    ...overrides,
  };
}

function makeContext(responders: Responder[]): RoutingContext {
  return { responders };
}

describe("TaskRouter", () => {
  it("routes internal tasks to the built-in internal responder without external responders", async () => {
    const responder = await routeTask(makeTask({
      capabilities: ["text"],
      agent: { responderType: "internal" },
    }), makeContext([]));

    expect(responder).toMatchObject({
      id: "agent-core",
      type: "internal",
      name: "Internal Agent",
    });
    expect(responder.capabilities).toContain("text");
  });

  it("matches explicit human responders by type, availability, and capabilities", async () => {
    const available = makeResponder({ id: "human-available", capabilities: ["approval", "security"] });
    const unavailable = makeResponder({ id: "human-unavailable", availability: false, capabilities: ["approval", "security"] });

    const responder = await routeTask(makeTask({
      capabilities: ["security"],
      breakpoint: { responderType: "human" },
      agent: undefined,
    }), makeContext([unavailable, available]));

    expect(responder.id).toBe("human-available");
  });

  it("matches agent responders by adapter hint and required capabilities", async () => {
    const context = makeContext([
      makeResponder({
        id: "claude-code",
        type: "agent",
        name: "Claude Code",
        capabilities: ["code", "review"],
        adapter: "claude-code",
      }),
      makeResponder({
        id: "codex",
        type: "agent",
        name: "Codex",
        capabilities: ["code", "review"],
        adapter: "codex",
      }),
    ]);

    const responder = await routeTask(makeTask({
      capabilities: ["review"],
      agent: {
        responderType: "agent",
        adapter: "codex",
      },
    }), context);

    expect(responder.id).toBe("codex");
    expect(responder.adapter).toBe("codex");
  });

  it("matches tracker responders by tracker backend hint", async () => {
    const responder = await routeTask(makeTask({
      capabilities: ["issue-sync"],
      agent: undefined,
      breakpoint: {
        responderType: "tracker",
        trackerBackend: "github-issues",
      },
    }), makeContext([
      makeResponder({
        id: "linear",
        type: "tracker",
        name: "Linear",
        capabilities: ["issue-sync"],
        trackerBackend: "linear",
      }),
      makeResponder({
        id: "github-issues",
        type: "tracker",
        name: "GitHub Issues",
        capabilities: ["issue-sync"],
        trackerBackend: "github-issues",
      }),
    ]));

    expect(responder.id).toBe("github-issues");
    expect(responder.trackerBackend).toBe("github-issues");
  });

  it("auto routing prefers an available matching agent responder", async () => {
    const responder = await routeTask(makeTask({
      capabilities: ["code"],
      agent: { responderType: "auto" },
    }), makeContext([
      makeResponder({ id: "human", type: "human", capabilities: ["code"] }),
      makeResponder({ id: "codex", type: "agent", capabilities: ["code"], adapter: "codex" }),
    ]));

    expect(responder.id).toBe("codex");
    expect(responder.type).toBe("agent");
  });

  it("auto routing falls back to human when no agent responder is available", async () => {
    const responder = await routeTask(makeTask({
      capabilities: ["approval"],
      agent: { responderType: "auto" },
    }), makeContext([
      makeResponder({ id: "codex", type: "agent", capabilities: ["approval"], availability: false }),
      makeResponder({ id: "human", type: "human", capabilities: ["approval"] }),
    ]));

    expect(responder.id).toBe("human");
    expect(responder.type).toBe("human");
  });

  it("supports class-based routing with a default context", async () => {
    const router = new TaskRouter(makeContext([
      makeResponder({ id: "codex", type: "agent", capabilities: ["code"], adapter: "codex" }),
    ]));

    const responder = await router.routeTask(makeTask({
      capabilities: ["code"],
      agent: { responderType: "agent" },
    }));

    expect(responder.id).toBe("codex");
  });

  it("throws a typed error when an explicit responder type has no available match", async () => {
    await expect(routeTask(makeTask({
      capabilities: ["code"],
      agent: { responderType: "agent", adapter: "codex" },
    }), makeContext([
      makeResponder({ id: "human", type: "human", capabilities: ["code"] }),
    ]))).rejects.toBeInstanceOf(NoResponderAvailableError);
  });

  it("rejects unknown responderType values in task hints", async () => {
    await expect(routeTask({
      kind: "agent",
      agent: { responderType: "robot" },
    }, makeContext([]))).rejects.toThrow("Unknown responder type");
  });
});
