import { describe, expect, it, vi } from "vitest";
import { resolveEffect } from "../internal/createRun/orchestration/effects";

const taskMuxMock = vi.hoisted(() => ({
  routeTask: vi.fn(),
  submitBreakpoint: vi.fn(),
}));

vi.mock("@a5c-ai/agent-mux-tasks", () => ({
  routeTask: taskMuxMock.routeTask,
  isHostDelegableRoute: (decision: { route: string }) =>
    decision.route === "agent-core",
  AgentMuxResponderBackend: class {
    submitBreakpoint = taskMuxMock.submitBreakpoint;
  },
}));

describe("issue #606 mocked tasks-mux external agent e2e", () => {
  it("dispatches a process-defined agent responder task through mock tasks-mux and returns the answer", async () => {
    taskMuxMock.routeTask.mockReturnValue({
      responderType: "agent",
      route: "agent-mux",
      backend: "agent-mux",
      responder: { id: "codex", adapter: "codex", model: "gpt-5.4" },
    });
    taskMuxMock.submitBreakpoint.mockResolvedValue({
      answers: [{ text: "mock agent completed", responderId: "codex", responderName: "Codex" }],
    });

    const result = await resolveEffect(
      {
        effectId: "effect-e2e",
        invocationKey: "process:external-agent",
        kind: "agent",
        taskDef: {
          kind: "agent",
          title: "External subtask",
          agent: {
            responderType: "agent",
            adapter: "codex",
            fallbackType: "internal",
            prompt: { task: "complete subtask" },
          },
        },
      },
      "pi",
      { workspace: "/tmp/workspace", model: "gpt-5.4" },
    );

    expect(result).toMatchObject({
      status: "ok",
      value: "mock agent completed",
    });
    expect(taskMuxMock.submitBreakpoint).toHaveBeenCalledWith(expect.objectContaining({
      routing: expect.objectContaining({
        responderType: "agent",
        adapter: "codex",
      }),
    }));
  });
});
