import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import type { AgentCoreSessionEvent } from "../../../types";
import { resolveAndPostEffect, subscribeVerbosePiEvents } from "../orchestration";
import { resolveEffect } from "../orchestration/effects";

const taskMuxMock = vi.hoisted(() => ({
  submitBreakpoint: vi.fn(),
  routeTask: vi.fn(),
}));
const childProcessMock = vi.hoisted(() => ({
  execFileSync: vi.fn(),
  execSync: vi.fn(),
}));

vi.mock("@a5c-ai/agent-mux-tasks", () => ({
  routeTask: taskMuxMock.routeTask,
  isHostDelegableRoute: (decision: { route: string }) =>
    decision.route === "agent-core",
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

describe("subscribeVerbosePiEvents", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it("prints assistant message text and structured tool activity in verbose mode", () => {
    let listener: ((event: AgentCoreSessionEvent) => void) | undefined;
    const session = {
      subscribe(fn: (event: AgentCoreSessionEvent) => void) {
        listener = fn;
        return () => {
          listener = undefined;
        };
      },
    };

    const unsubscribe = subscribeVerbosePiEvents(
      session as never,
      "orchestrator",
      { verbose: true, json: false, outputMode: "cli" },
    );

    expect(typeof unsubscribe).toBe("function");

    listener?.({
      type: "turn_start",
    });
    listener?.({
      type: "message_start",
      role: "assistant",
    });
    listener?.({
      type: "message_end",
      message: {
        role: "assistant",
        content: [
          { type: "text", text: "Reading the process file before patching it." },
        ],
      },
    });
    listener?.({
      type: "tool_execution_start",
      name: "write",
      input: {
        path: ".a5c/runs/run-1/process/process.mjs",
        content: "patched content",
      },
    });
    listener?.({
      type: "tool_execution_end",
      result: {
        status: "ok",
        output: "updated process file",
      },
    });
    listener?.({
      type: "message_start",
      role: "toolResult",
    });
    listener?.({
      type: "message_end",
      message: {
        role: "toolResult",
        content: [
          { type: "text", text: "Wrote .a5c/runs/run-1/process/process.mjs" },
        ],
      },
    });

    const output = stderrSpy.mock.calls.map((call) => String(call[0])).join("");
    expect(output).toContain("[orchestrator turn:start]");
    expect(output).toContain("[orchestrator message:start] role=assistant");
    expect(output).toContain("Reading the process file before patching it.");
    expect(output).toContain("tool ");
    expect(output).toContain("write");
    expect(output).toContain(".a5c/runs/run-1/process/process.mjs");
    expect(output).toContain("updated process file");
    expect(output).toContain("Wrote .a5c/runs/run-1/process/process.mjs");
  });
});

describe("resolveEffect tasks-mux routing", () => {
  beforeEach(() => {
    taskMuxMock.routeTask.mockReset();
    taskMuxMock.submitBreakpoint.mockReset();
    childProcessMock.execFileSync.mockReset();
    childProcessMock.execSync.mockReset();
  });

  it("delegates routable agent effects through tasks-mux AgentMuxResponderBackend", async () => {
    taskMuxMock.routeTask.mockReturnValue({
      responderType: "agent",
      route: "agent-mux",
      backend: "agent-mux",
      responder: { id: "codex", adapter: "codex", model: "gpt-5.4" },
    });
    taskMuxMock.submitBreakpoint.mockResolvedValue({
      answers: [{ text: "{\"ok\":true}", responderId: "codex", responderName: "Codex" }],
    });

    const result = await resolveEffect(
      {
        effectId: "effect-1",
        invocationKey: "invocation",
        kind: "agent",
        taskDef: {
          kind: "agent",
          title: "Routed agent",
          agent: {
            responderType: "agent",
            adapter: "codex",
            prompt: { task: "return JSON" },
          },
          outputSchema: { type: "object" },
        },
      },
      "pi",
      { workspace: "/tmp/workspace", model: "gpt-5.4" },
    );

    expect(taskMuxMock.routeTask).toHaveBeenCalledWith(expect.objectContaining({
      kind: "agent",
    }));
    expect(taskMuxMock.submitBreakpoint).toHaveBeenCalledWith(expect.objectContaining({
      routing: expect.objectContaining({
        responderType: "agent",
        adapter: "codex",
      }),
    }));
    expect(result.status).toBe("ok");
    expect(result.value).toBe("{\"ok\":true}");
  });

  it("routes human responder agent effects through the breakpoint path", async () => {
    taskMuxMock.routeTask.mockReturnValue({
      responderType: "human",
      route: "breakpoint",
      responder: { id: "human", type: "human" },
    });

    const result = await resolveEffect(
      {
        effectId: "effect-human",
        invocationKey: "invocation",
        kind: "agent",
        taskDef: {
          kind: "agent",
          title: "Needs a human",
          agent: {
            responderType: "human",
            prompt: { task: "review this" },
          },
        },
      },
      "pi",
      { workspace: "/tmp/workspace", model: "gpt-5.4" },
    );

    expect(taskMuxMock.routeTask).toHaveBeenCalledWith(expect.objectContaining({
      kind: "agent",
    }));
    expect(taskMuxMock.submitBreakpoint).not.toHaveBeenCalled();
    expect(result.status).toBe("ok");
    expect(result.value).toMatchObject({
      approved: true,
      option: "Approve",
    });
  });

  it("falls back to internal agent resolution when external agent dispatch fails with fallback enabled", async () => {
    taskMuxMock.routeTask.mockReturnValue({
      responderType: "agent",
      route: "agent-mux",
      backend: "agent-mux",
      responder: { id: "codex", adapter: "codex", model: "gpt-5.4" },
    });
    taskMuxMock.submitBreakpoint.mockRejectedValue(new Error("agent-mux unavailable"));
    const piSession = {
      prompt: vi.fn(async () => ({
        success: true,
        output: "internal answer",
        exitCode: 0,
        duration: 1,
      })),
    };

    const result = await resolveEffect(
      {
        effectId: "effect-fallback",
        invocationKey: "invocation",
        kind: "agent",
        taskDef: {
          kind: "agent",
          title: "Fallback agent",
          agent: {
            responderType: "agent",
            adapter: "codex",
            fallbackToInternal: true,
            prompt: { task: "return text" },
          },
        },
      },
      "pi",
      { workspace: "/tmp/workspace", model: "gpt-5.4" },
      piSession as never,
    );

    expect(taskMuxMock.submitBreakpoint).toHaveBeenCalled();
    expect(piSession.prompt).toHaveBeenCalledWith(expect.stringContaining("return text"), expect.any(Number));
    expect(result.status).toBe("ok");
    expect(result.value).toBe("internal answer");
  });

  it("returns an error when external agent dispatch fails without fallback enabled", async () => {
    taskMuxMock.routeTask.mockReturnValue({
      responderType: "agent",
      route: "agent-mux",
      backend: "agent-mux",
      responder: { id: "codex", adapter: "codex" },
    });
    taskMuxMock.submitBreakpoint.mockRejectedValue(new Error("auth failed"));

    const result = await resolveEffect(
      {
        effectId: "effect-no-fallback",
        invocationKey: "invocation",
        kind: "agent",
        taskDef: {
          kind: "agent",
          title: "No fallback agent",
          agent: {
            responderType: "agent",
            adapter: "codex",
            prompt: { task: "return text" },
          },
        },
      },
      "pi",
      { workspace: "/tmp/workspace", model: "gpt-5.4" },
    );

    expect(result.status).toBe("error");
    expect(result.error?.message).toBe("auth failed");
  });

  it("delegates legacy CLI resolveAndPostEffect agent routing through tasks-mux", async () => {
    taskMuxMock.routeTask.mockReturnValue({
      responderType: "agent",
      route: "agent-mux",
      backend: "agent-mux",
      responder: { id: "codex", adapter: "codex", model: "gpt-5.4" },
    });
    taskMuxMock.submitBreakpoint.mockResolvedValue({
      answers: [{ text: "routed answer", responderId: "codex", responderName: "Codex" }],
    });
    childProcessMock.execFileSync.mockReturnValue("{}");

    const runDir = await mkdtemp(path.join(tmpdir(), "issue-633-cli-"));
    await resolveAndPostEffect(
      {
        effectId: "effect-2",
        invocationKey: "invocation",
        kind: "agent",
        taskDef: {
          kind: "agent",
          title: "Routed CLI agent",
          agent: {
            responderType: "agent",
            adapter: "codex",
            prompt: { instructions: ["return routed answer"] },
          },
        },
      },
      runDir,
      "/tmp/workspace",
      "gpt-5.4",
    );

    expect(taskMuxMock.routeTask).toHaveBeenCalledWith(expect.objectContaining({
      kind: "agent",
    }));
    expect(taskMuxMock.submitBreakpoint).toHaveBeenCalledWith(expect.objectContaining({
      routing: expect.objectContaining({
        responderType: "agent",
        adapter: "codex",
      }),
      text: "return routed answer",
    }));
    await expect(readFile(path.join(runDir, "tasks/effect-2/output.json"), "utf8"))
      .resolves.toBe(JSON.stringify("routed answer"));
    expect(childProcessMock.execFileSync).toHaveBeenCalledWith(
      "babysitter",
      expect.arrayContaining(["task:post", runDir, "effect-2", "--status", "ok"]),
      expect.objectContaining({ cwd: "/tmp/workspace" }),
    );
  });

  it("routes legacy CLI human responder agent effects through the breakpoint path", async () => {
    taskMuxMock.routeTask.mockReturnValue({
      responderType: "human",
      route: "breakpoint",
      responder: { id: "human", type: "human" },
    });
    childProcessMock.execFileSync.mockReturnValue("{}");

    const runDir = await mkdtemp(path.join(tmpdir(), "issue-633-cli-human-"));
    await resolveAndPostEffect(
      {
        effectId: "effect-human-cli",
        invocationKey: "invocation",
        kind: "agent",
        taskDef: {
          kind: "agent",
          title: "Needs a human in CLI mode",
          agent: {
            responderType: "human",
            prompt: { instructions: ["review this"] },
          },
        },
      },
      runDir,
      "/tmp/workspace",
      "gpt-5.4",
    );

    expect(taskMuxMock.routeTask).toHaveBeenCalledWith(expect.objectContaining({
      kind: "agent",
    }));
    expect(taskMuxMock.submitBreakpoint).not.toHaveBeenCalled();
    const output = JSON.parse(await readFile(path.join(runDir, "tasks/effect-human-cli/output.json"), "utf8"));
    expect(output).toMatchObject({
      approved: true,
      option: "Approve",
    });
    expect(childProcessMock.execFileSync).toHaveBeenCalledWith(
      "babysitter",
      expect.arrayContaining(["task:post", runDir, "effect-human-cli", "--status", "ok"]),
      expect.objectContaining({ cwd: "/tmp/workspace" }),
    );
  });
});
