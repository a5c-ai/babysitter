import { describe, expect, it, vi } from "vitest";
import type { EffectAction } from "@a5c-ai/babysitter-sdk";
import {
  applyPostEffectOrchestrationOverlays,
  resolveEffect,
} from "../orchestration/effects";

vi.mock("../orchestration/effectsHelpers", () => ({
  buildBreakpointResult: vi.fn((response, approvalKey) => ({
    status: "ok",
    value: {
      approved: response.answers[approvalKey] === "Approve",
      option: response.answers[approvalKey],
      askUserQuestion: response,
    },
  })),
  invokeAgentHarness: vi.fn(async () => ({ status: "ok", value: "agent fallback" })),
  invokePromptEffect: vi.fn(async () => ({ status: "ok", value: "prompt fallback" })),
  isRetryableEffectError: vi.fn(() => false),
  readProcessFileFingerprint: vi.fn(() => undefined),
}));

describe("issue #580 orchestration effect routing", () => {
  it("routes configured MCP effects through the injected executor with run and session context", async () => {
    const execute = vi.fn(async () => ({
      success: true,
      content: [{ type: "text", text: "tool output" }],
      durationMs: 7,
    }));
    const action = {
      effectId: "eff-mcp",
      taskId: "task-mcp",
      kind: "mcp",
      taskDef: {
        mcp: {
          serverName: "filesystem",
          toolName: "read_file",
          args: { path: "README.md" },
        },
      },
    } as unknown as EffectAction;

    const result = await resolveEffect(action, "codex", {
      workspace: "/repo",
      runId: "run-1",
      runDir: "/runs/run-1",
      sessionId: "session-1",
      mcp: { executor: { execute } },
    } as never);

    expect(execute).toHaveBeenCalledWith({
      serverName: "filesystem",
      toolName: "read_file",
      args: {
        path: "README.md",
        context: {
          runId: "run-1",
          runDir: "/runs/run-1",
          sessionId: "session-1",
          workspace: "/repo",
        },
      },
    });
    expect(result).toMatchObject({
      status: "ok",
      value: {
        success: true,
        content: [{ type: "text", text: "tool output" }],
      },
      stdout: "tool output",
    });
  });

  it("emits streamed MCP text through StreamingOutputOptions without calling the fallback harness", async () => {
    const onLine = vi.fn();
    const action = {
      effectId: "eff-mcp-stream",
      taskId: "task-mcp-stream",
      kind: "mcp",
      taskDef: {
        mcp: {
          serverName: "shell",
          toolName: "tail",
          args: {},
        },
      },
    } as unknown as EffectAction;

    await resolveEffect(action, "codex", {
      streaming: { onLine },
      mcp: {
        executor: {
          execute: vi.fn(async () => ({
            success: true,
            content: [{ type: "text", text: "line one\nline two" }],
          })),
        },
      },
    } as never);

    expect(onLine).toHaveBeenCalledWith("line one", "stdout");
    expect(onLine).toHaveBeenCalledWith("line two", "stdout");
  });

  it("routes MCP execution through a unified dispatcher when configured", async () => {
    const execute = vi.fn(async () => ({
      success: true,
      content: [{ type: "text", text: "dispatched output" }],
      durationMs: 11,
    }));
    const dispatch = vi.fn(async (_context, executor) => ({
      output: await executor(),
      durationMs: 12,
    }));
    const action = {
      effectId: "eff-mcp-dispatch",
      taskId: "task-mcp-dispatch",
      kind: "mcp",
      taskDef: {
        mcp: {
          serverName: "filesystem",
          toolName: "read_file",
          args: { path: "README.md" },
        },
      },
    } as unknown as EffectAction;

    const result = await resolveEffect(action, "codex", {
      runId: "run-1",
      sessionId: "session-1",
      mcp: { executor: { execute }, dispatcher: { dispatch } },
    } as never);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        toolName: "read_file",
        caller: "agent-platform:mcp",
        runId: "run-1",
        sessionId: "session-1",
      }),
      expect.any(Function),
    );
    expect(execute).toHaveBeenCalledOnce();
    expect(result.stdout).toBe("dispatched output");
  });

  it("evaluates configured approval chains before non-interactive breakpoint auto-approval", async () => {
    const action = {
      effectId: "eff-breakpoint",
      taskId: "task-breakpoint",
      kind: "breakpoint",
      taskDef: {
        title: "Deploy?",
        metadata: {
          approvalChain: {
            chainId: "deploy-chain",
            steps: [{ stepId: "review", expert: "reviewer", label: "Review" }],
          },
          approvalChainState: {
            chainId: "deploy-chain",
            currentStepIndex: 0,
            completedSteps: [],
            status: "pending",
            startedAt: "2026-05-30T00:00:00.000Z",
          },
        },
      },
    } as unknown as EffectAction;

    const result = await resolveEffect(action, "codex", { interactive: false });

    expect(result).toMatchObject({
      status: "ok",
      value: {
        approved: false,
        approvalChain: {
          status: "pending",
          nextStep: { stepId: "review" },
        },
      },
    });
  });

  it("updates session costs and triggers compaction overlays after effect resolution", async () => {
    const updateSessionCost = vi.fn(async () => ({
      totalCostUsd: 0.12,
      totalInputTokens: 400,
      totalOutputTokens: 100,
      runCosts: [],
      budget: { maxCostUsd: 0.1, alertThresholds: [100], autoPause: true },
      triggeredThresholds: [],
      paused: false,
      lastUpdatedAt: "2026-05-30T00:00:00.000Z",
    }));
    const checkBudget = vi.fn(() => ({
      exceeded: true,
      alerts: [{ thresholdPct: 100 }],
      shouldPause: true,
    }));
    const compactSession = vi.fn(async () => [{
      strategy: "iteration-digest",
      tokensBefore: 8,
      tokensAfter: 2,
      itemsCompacted: 1,
      compactedAt: "2026-05-30T00:00:00.000Z",
    }]);
    const markThresholdsTriggered = vi.fn(async () => undefined);
    const setSessionPaused = vi.fn(async () => undefined);

    const result = await applyPostEffectOrchestrationOverlays({
      runId: "run-1",
      runDir: "/runs/run-1",
      runsDir: "/runs",
      stateDir: "/state",
      sessionId: "session-1",
      effectCost: {
        totalCostUsd: 0.12,
        inputTokens: 400,
        outputTokens: 100,
      },
      estimatedStateTokens: 90,
      compactionConfig: {
        enabled: true,
        autoCompactThreshold: 80,
        strategies: ["iteration-digest"],
        keepRecentIterations: 1,
        toolOutputTargetReduction: 0.5,
      },
      updateSessionCost,
      checkBudget,
      compactSession,
      markThresholdsTriggered,
      setSessionPaused,
    });

    expect(updateSessionCost).toHaveBeenCalledWith("/state", "session-1", {
      runId: "run-1",
      costUsd: 0.12,
      inputTokens: 400,
      outputTokens: 100,
    });
    expect(checkBudget).toHaveBeenCalled();
    expect(compactSession).toHaveBeenCalledWith(
      "/state",
      "session-1",
      "/runs",
      expect.objectContaining({ autoCompactThreshold: 80 }),
    );
    expect(result).toMatchObject({
      budget: { shouldPause: true },
      compaction: { triggered: true },
    });
  });

  it("records post-effect session history and context snapshots", async () => {
    const addDecision = vi.fn(async () => undefined);
    const saveContextSnapshot = vi.fn(async () => undefined);

    await applyPostEffectOrchestrationOverlays({
      runId: "run-1",
      runDir: "/runs/run-1",
      runsDir: "/runs",
      stateDir: "/state",
      sessionId: "session-1",
      effectSummary: {
        effectId: "eff-1",
        taskId: "task-1",
        kind: "agent",
        title: "Implement routing",
        status: "ok",
      },
      addDecision,
      saveContextSnapshot,
    });

    expect(addDecision).toHaveBeenCalledWith("/state", "session-1", {
      runId: "run-1",
      description: "Resolved agent effect: Implement routing",
      rationale: "Effect eff-1 completed with status ok",
    });
    expect(saveContextSnapshot).toHaveBeenCalledWith("/state", "session-1", {
      runId: "run-1",
      snapshot: expect.objectContaining({
        effectId: "eff-1",
        taskId: "task-1",
        status: "ok",
      }),
    });
  });

  it("marks budget thresholds and returns an enforced pause only for explicit autoPause budgets", async () => {
    const updateSessionCost = vi.fn(async () => ({
      totalCostUsd: 0.12,
      totalInputTokens: 400,
      totalOutputTokens: 100,
      runCosts: [],
      budget: { maxCostUsd: 0.1, alertThresholds: [100], autoPause: true },
      triggeredThresholds: [],
      paused: false,
      lastUpdatedAt: "2026-05-30T00:00:00.000Z",
    }));
    const checkBudget = vi.fn(() => ({
      exceeded: true,
      alerts: [{ thresholdPct: 100 }],
      shouldPause: true,
      pauseReason: "Session cost budget exceeded",
    }));
    const markThresholdsTriggered = vi.fn(async () => undefined);
    const setSessionPaused = vi.fn(async () => undefined);

    const result = await applyPostEffectOrchestrationOverlays({
      runId: "run-1",
      stateDir: "/state",
      sessionId: "session-1",
      effectCost: {
        totalCostUsd: 0.12,
        inputTokens: 400,
        outputTokens: 100,
      },
      updateSessionCost,
      checkBudget,
      markThresholdsTriggered,
      setSessionPaused,
    });

    expect(markThresholdsTriggered).toHaveBeenCalledWith("/state", "session-1", [100]);
    expect(setSessionPaused).toHaveBeenCalledWith("/state", "session-1", true);
    expect(result.budgetEnforcement).toEqual({
      paused: true,
      pauseReason: "Session cost budget exceeded",
    });
  });
});
