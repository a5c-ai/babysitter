import { describe, expect, it } from "vitest";
import { detectHarnessCapabilities, resolveExecutionStrategy, resolveModelRoute } from "..";
import { createDispatchEnvelope } from "../strategyDispatch";
import type { TaskDef } from "../types";

describe("shared runtime strategy helpers", () => {
  it("reports codex capabilities", () => {
    expect(detectHarnessCapabilities("codex")).toMatchObject({
      requirementList: true,
      explicitSkillInvocation: true,
      sessionThreads: true,
      symlinkSkillDiscovery: true,
      approvalFlow: true,
      subagentFanOut: true,
    });
  });

  it("routes interactive work to spark by default", () => {
    expect(resolveModelRoute("interactive")).toEqual({
      phase: "interactive",
      model: "gpt-5.3-codex-spark",
      source: "default",
    });
  });

  it("keeps cloud requests local in PR 1", () => {
    const taskDef: TaskDef = {
      kind: "orchestrator_task",
      orchestratorTask: {
        executionMode: "cloud",
      },
    };
    const strategy = resolveExecutionStrategy({ taskDef, harness: "codex" });
    expect(strategy.requestedMode).toBe("cloud");
    expect(strategy.effectiveMode).toBe("local");
    expect(strategy.reason).toBe("cloud-execution-not-enabled-in-pr1");
  });

  it("builds a subagent dispatch envelope when subtasks are available", () => {
    const taskDef: TaskDef = {
      kind: "orchestrator_task",
      orchestratorTask: {
        executionMode: "subagent",
        parallelism: 2,
        subtasks: [{ title: "plan" }, { title: "review" }],
      },
    };
    expect(createDispatchEnvelope({ taskDef, harness: "codex" })).toEqual({
      mode: "subagent",
      promptTemplate: "subagent",
      parallelism: 2,
      subtasks: [{ title: "plan" }, { title: "review" }],
    });
  });
});
