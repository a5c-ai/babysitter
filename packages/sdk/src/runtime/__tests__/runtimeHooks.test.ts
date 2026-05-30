import { beforeEach, describe, expect, test, vi } from "vitest";
import * as dispatcher from "../../hooks/dispatcher";
import * as hooksMuxCore from "@a5c-ai/hooks-mux-core";
import {
  assertRuntimeHookAllowed,
  callRuntimeHook,
} from "../hooks/runtime";
import { RunFailedError } from "../exceptions";

vi.mock("../../hooks/dispatcher", () => ({
  callHook: vi.fn(),
}));

vi.mock("@a5c-ai/hooks-mux-core", () => ({
  runNormalized: vi.fn(),
}));

const callHookMock = vi.mocked(dispatcher.callHook);
const runNormalizedMock = vi.mocked(hooksMuxCore.runNormalized);

beforeEach(() => {
  vi.resetAllMocks();
  callHookMock.mockResolvedValue({
    hookType: "task.created",
    success: true,
    executedHooks: [],
  });
  runNormalizedMock.mockResolvedValue({
    decision: "allow",
    reason: "ok",
    persistEnv: {},
    unsetEnv: [],
    contextVars: {},
    additionalContext: "",
    systemMessage: "",
    continueSession: false,
    stopReason: "",
    suppressOutput: false,
    followUpMessage: "",
    metadata: {},
    diagnostics: {
      conflicts: [],
      degradedFields: [],
      decisions: [],
    },
  });
});

describe("callRuntimeHook hooks-mux integration", () => {
  test("routes SDK task lifecycle hooks through hooks-mux normalized events before shell hooks", async () => {
    const result = await callRuntimeHook(
      "task.created",
      {
        runId: "run-1",
        processId: "proc-1",
        effectId: "effect-1",
        taskId: "task-1",
        kind: "agent",
      },
      { cwd: "/workspace" },
    );

    expect(runNormalizedMock).toHaveBeenCalledWith(expect.objectContaining({
      version: "a5c.hooks.v1",
      adapter: "babysitter-sdk",
      phase: "task.created",
      rawEventName: "task.created",
      supportLevel: "emulated",
      execution: expect.objectContaining({
        adapter: "babysitter-sdk",
        cwd: "/workspace",
        nativeEventName: "task.created",
        metadata: expect.objectContaining({
          hookType: "task.created",
          runId: "run-1",
          processId: "proc-1",
          effectId: "effect-1",
          taskId: "task-1",
          kind: "agent",
        }),
      }),
      payload: expect.objectContaining({
        hookType: "task.created",
        timestamp: expect.any(String),
      }),
    }));
    expect(callHookMock).toHaveBeenCalled();
    expect(result).toMatchObject({
      hookType: "task.created",
      success: true,
      output: expect.objectContaining({
        decision: "allow",
        reason: "ok",
      }),
      executedHooks: [
        expect.objectContaining({
          hookPath: "@a5c-ai/hooks-mux-core",
          hookName: "task.created",
          hookLocation: "plugin",
          status: "success",
        }),
      ],
    });
  });

  test("maps legacy SDK hook names onto canonical hooks-mux phases", async () => {
    await callRuntimeHook("on-run-start", { runId: "run-1" }, { cwd: "/workspace" });
    await callRuntimeHook("on-iteration-end", { runId: "run-1" }, { cwd: "/workspace" });

    expect(runNormalizedMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
      phase: "session.start",
      rawEventName: "on-run-start",
    }));
    expect(runNormalizedMock).toHaveBeenNthCalledWith(2, expect.objectContaining({
      phase: "turn.after_agent",
      rawEventName: "on-iteration-end",
    }));
  });

  test("preserves hooks-mux deny decisions for runtime hook policy checks", async () => {
    runNormalizedMock.mockResolvedValueOnce({
      decision: "deny",
      reason: "blocked by lifecycle policy",
      persistEnv: {},
      unsetEnv: [],
      contextVars: {},
      additionalContext: "",
      systemMessage: "",
      continueSession: false,
      stopReason: "",
      suppressOutput: false,
      followUpMessage: "",
      metadata: {},
      diagnostics: {
        conflicts: [],
        degradedFields: [],
        decisions: [],
      },
    });

    const result = await callRuntimeHook("task.created", {}, { cwd: "/workspace" });

    expect(result.output).toMatchObject({
      decision: "deny",
      reason: "blocked by lifecycle policy",
    });
    expect(() => assertRuntimeHookAllowed(result, "task.created")).toThrow(RunFailedError);
  });
});
