import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveEffect } from "../effects";
import { resolveAndPostEffect } from "../index";

const taskMuxMock = vi.hoisted(() => ({
  routeTask: vi.fn(),
  submitBreakpoint: vi.fn(),
}));
const childProcessMock = vi.hoisted(() => ({
  execFileSync: vi.fn(),
  execSync: vi.fn(),
}));

vi.mock("@a5c-ai/agent-mux-tasks", () => ({
  routeTask: taskMuxMock.routeTask,
  AgentMuxResponderBackend: class {
    submitBreakpoint = taskMuxMock.submitBreakpoint;
  },
}));

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return {
    ...actual,
    execFileSync: childProcessMock.execFileSync,
    execSync: childProcessMock.execSync,
  };
});

describe("issue #606 tasks-mux effect routing", () => {
  beforeEach(() => {
    taskMuxMock.routeTask.mockReset();
    taskMuxMock.submitBreakpoint.mockReset();
    childProcessMock.execFileSync.mockReset();
    childProcessMock.execSync.mockReset();
  });

  it("routes standalone agent effects through tasks-mux AgentMuxResponderBackend", async () => {
    taskMuxMock.routeTask.mockReturnValue({
      responderType: "agent",
      route: "agent-mux",
      responder: { id: "codex", adapter: "codex", model: "gpt-5.4" },
    });
    taskMuxMock.submitBreakpoint.mockResolvedValue({
      answers: [{ text: "mock response", responderId: "codex", responderName: "Codex" }],
    });

    const result = await resolveEffect(
      {
        effectId: "effect-606",
        invocationKey: "invocation",
        kind: "agent",
        taskDef: {
          kind: "agent",
          title: "Routed agent",
          agent: {
            responderType: "agent",
            adapter: "codex",
            prompt: { instructions: ["review"] },
          },
        },
      },
      "pi",
      { workspace: "/tmp/workspace", model: "gpt-5.4" },
    );

    expect(taskMuxMock.routeTask).toHaveBeenCalledWith(expect.objectContaining({ kind: "agent" }));
    expect(taskMuxMock.submitBreakpoint).toHaveBeenCalledWith(expect.objectContaining({
      routing: expect.objectContaining({
        responderType: "agent",
        adapter: "codex",
        model: "gpt-5.4",
      }),
      text: expect.stringContaining("review"),
    }));
    expect(result).toMatchObject({
      status: "ok",
      value: "mock response",
    });
  });

  it("returns explicit tasks-mux tracker unavailability instead of internal dispatch", async () => {
    taskMuxMock.routeTask.mockReturnValue({
      responderType: "tracker",
      route: "external-tracker",
      unavailable: true,
      reason: "ExternalTrackerBackend unavailable for linear",
    });

    const result = await resolveEffect(
      {
        effectId: "effect-tracker",
        invocationKey: "invocation",
        kind: "agent",
        taskDef: {
          kind: "agent",
          metadata: {
            responderType: "tracker",
            trackerBackend: "linear",
          },
        },
      },
      "pi",
      { workspace: "/tmp/workspace" },
    );

    expect(result).toMatchObject({
      status: "ok",
      value: {
        success: false,
        routedThrough: "tasks-mux",
        responderType: "tracker",
        error: "ExternalTrackerBackend unavailable for linear",
      },
    });
    expect(taskMuxMock.submitBreakpoint).not.toHaveBeenCalled();
  });

  it("routes legacy CLI effect posting through tasks-mux", async () => {
    taskMuxMock.routeTask.mockReturnValue({
      responderType: "agent",
      route: "agent-mux",
      responder: { id: "codex", adapter: "codex", model: "gpt-5.4" },
    });
    taskMuxMock.submitBreakpoint.mockResolvedValue({
      answers: [{ text: "routed answer", responderId: "codex", responderName: "Codex" }],
    });
    childProcessMock.execFileSync.mockReturnValue("{}");

    const runDir = await mkdtemp(path.join(tmpdir(), "issue-606-cli-"));
    await resolveAndPostEffect(
      {
        effectId: "effect-cli",
        invocationKey: "invocation",
        kind: "agent",
        taskDef: {
          kind: "agent",
          title: "Routed CLI agent",
          agent: {
            responderType: "agent",
            adapter: "codex",
            prompt: { task: "return routed answer" },
          },
        },
      },
      runDir,
      "/tmp/workspace",
      "gpt-5.4",
    );

    await expect(readFile(path.join(runDir, "tasks/effect-cli/output.json"), "utf8"))
      .resolves.toBe(JSON.stringify("routed answer"));
  });
});
