import { describe, expect, test } from "vitest";
import { evaluateForwardFixGate } from "../forwardFixStrikes";

describe("forward-fix instrumentation-only deploy-block gate", () => {
  test("blocks instrumentation_only attempts that touch algorithm-change files", () => {
    const gate = evaluateForwardFixGate({
      bugClass: "scheduler-precedence",
      strikeCount: 2,
      instrumentation_only: true,
      changedFiles: ["packages/sdk/src/runtime/orchestrateIteration.ts"],
    });

    expect(gate).toMatchObject({
      allowed: false,
      matchedFiles: ["packages/sdk/src/runtime/orchestrateIteration.ts"],
    });
    expect(gate.diagnostics.join("\n")).toContain("[gate]");
    expect(gate.diagnostics.join("\n")).toContain("scheduler-precedence");
  });

  test("allows docs, tests, logging, env flags, no-op guards, and revert-only changes", () => {
    for (const changeType of ["log-emission", "env-flag", "no-op-guard", "revert-only"] as const) {
      expect(evaluateForwardFixGate({
        bugClass: "scheduler-precedence",
        strikeCount: 2,
        instrumentation_only: true,
        changedFiles: ["packages/sdk/src/runtime/orchestrateIteration.ts"],
        changeType,
      }).allowed).toBe(true);
    }

    expect(evaluateForwardFixGate({
      bugClass: "scheduler-precedence",
      strikeCount: 2,
      instrumentation_only: true,
      changedFiles: ["docs/agent-reference/process-authoring.md", "packages/sdk/src/runtime/__tests__/forwardFixGate.test.ts"],
    }).allowed).toBe(true);
  });

  test("supports custom algorithm-change patterns", () => {
    const gate = evaluateForwardFixGate({
      bugClass: "custom-domain",
      strikeCount: 2,
      instrumentation_only: true,
      changedFiles: ["src/lib/scheduler/pickSlot.ts"],
      algorithmChangePatterns: ["src/lib/scheduler/**"],
    });

    expect(gate.allowed).toBe(false);
    expect(gate.matchedFiles).toEqual(["src/lib/scheduler/pickSlot.ts"]);
  });

  test("diagnoses missing bugClass for intended forward-fix gate checks", () => {
    const gate = evaluateForwardFixGate({
      strikeCount: 2,
      instrumentation_only: true,
      changedFiles: ["packages/sdk/src/runtime/orchestrateIteration.ts"],
    });

    expect(gate.allowed).toBe(false);
    expect(gate.diagnostics.join("\n")).toContain("missing bugClass");
  });

  test("requires an explicit strike-3 override reason before allowing algorithm changes", () => {
    const gate = evaluateForwardFixGate({
      bugClass: "scheduler-precedence",
      strikeCount: 2,
      instrumentation_only: true,
      changedFiles: ["packages/sdk/src/runtime/orchestrateIteration.ts"],
      strike3Override: {
        actor: "tmuskal",
        reason: "   ",
        timestamp: "2026-06-01T12:00:00.000Z",
      },
    });

    expect(gate.allowed).toBe(false);
    expect(gate.overrideAudit).toBeUndefined();
    expect(gate.diagnostics.join("\n")).toContain("--strike3-override reason");
  });

  test("allows audited strike-3 override and records deterministic metadata", () => {
    const input = {
      bugClass: "scheduler-precedence",
      strikeCount: 2,
      instrumentation_only: true,
      changedFiles: ["packages/sdk/src/runtime/orchestrateIteration.ts"],
      strike3Override: {
        actor: "tmuskal",
        reason: "production deploy needs targeted scheduler fix",
        timestamp: "2026-06-01T12:00:00.000Z",
      },
    };

    const gate = evaluateForwardFixGate(input);
    const replayedGate = evaluateForwardFixGate(input);

    expect(gate.allowed).toBe(true);
    expect(gate.matchedFiles).toEqual(["packages/sdk/src/runtime/orchestrateIteration.ts"]);
    expect(gate.overrideAudit).toEqual({
      actor: "tmuskal",
      reason: "production deploy needs targeted scheduler fix",
      bugClass: "scheduler-precedence",
      strikeCount: 2,
      matchedFiles: ["packages/sdk/src/runtime/orchestrateIteration.ts"],
      timestamp: "2026-06-01T12:00:00.000Z",
    });
    expect(gate).toEqual(replayedGate);
    expect(gate.diagnostics.join("\n")).toContain("[gate] strike-3 override applied");
  });
});
