import { describe, expect, it } from "vitest";
import {
  getHookDecisionResult,
  resolveHookDecisionResult,
} from "./hookDecisionEffects";

function action(overrides: Record<string, unknown> = {}) {
  return {
    kind: "shell",
    effectId: "effect-1",
    taskId: "task-1",
    taskDef: {
      title: "Run a command",
      metadata: {},
    },
    ...overrides,
  } as any;
}

describe("hook decision effect helpers", () => {
  it("extracts hook decisions from task metadata", () => {
    const result = getHookDecisionResult(action({
      taskDef: {
        metadata: {
          hookResult: { decision: "block", reason: "policy" },
        },
      },
    }));

    expect(result).toEqual({ decision: "block", reason: "policy" });
  });

  it("turns block decisions into auditable non-approval results", () => {
    const result = resolveHookDecisionResult(
      action(),
      { decision: "block", reason: "sensitive command" },
    );

    expect(result).toMatchObject({
      status: "error",
      value: {
        blocked: true,
        reason: "sensitive command",
        auditEvent: {
          kind: "hook-decision",
          decision: {
            action: "block",
            reason: "sensitive command",
            hookDecision: "block",
          },
          source: "harness",
        },
      },
      stderr: "sensitive command",
    });
  });

  it("bounds retry decisions with attempt metadata", () => {
    const retry = resolveHookDecisionResult(
      action(),
      { decision: "retry", reason: "recover permission" },
      { attempt: 1, maxRetries: 2 },
    );
    expect(retry).toMatchObject({
      status: "ok",
      value: {
        retry: true,
        exhausted: false,
        attempt: 1,
        maxRetries: 2,
      },
    });

    const exhausted = resolveHookDecisionResult(
      action(),
      { decision: "retry", reason: "recover permission" },
      { attempt: 2, maxRetries: 2 },
    );
    expect(exhausted).toMatchObject({
      status: "error",
      value: {
        retry: false,
        exhausted: true,
        attempt: 2,
        maxRetries: 2,
      },
    });
  });

  it("turns continueSession false into an abort result", () => {
    const result = resolveHookDecisionResult(
      action(),
      { continueSession: false, stopReason: "hook stopped session" },
    );

    expect(result).toMatchObject({
      status: "error",
      value: {
        aborted: true,
        stopReason: "hook stopped session",
      },
      stderr: "hook stopped session",
    });
  });
});
