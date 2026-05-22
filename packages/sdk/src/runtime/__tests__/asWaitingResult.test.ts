/**
 * asWaitingResult.test.ts
 *
 * Tests for the asWaitingResult function in orchestrateIteration.ts,
 * specifically the duck-type fallback that handles the dual-package hazard
 * where the globally-installed SDK catches an EffectRequestedError thrown
 * by a workspace-local SDK copy (different class constructors → instanceof fails).
 */

import { describe, it, expect } from "vitest";
import {
  EffectRequestedError,
  EffectPendingError,
  ParallelPendingError,
} from "../exceptions";
import { asWaitingResult } from "../orchestrateIteration";
import { buildParallelBatch } from "../../tasks/batching";
import type { EffectAction } from "../types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const taskDef = { kind: "agent" as const, title: "test" };

function makeAction(effectId: string): EffectAction {
  return {
    effectId,
    invocationKey: `proc:S000001:${effectId}`,
    kind: "agent",
    label: "test-label",
    stepId: "S000001",
    taskId: effectId,
    taskDefRef: `tasks/${effectId}/task.json`,
    requestedAt: "2026-01-01T00:00:00Z",
    taskDef,
  };
}

// ---------------------------------------------------------------------------
// Tests: normal instanceof path (same SDK copy)
// ---------------------------------------------------------------------------

describe("asWaitingResult — instanceof path", () => {
  it("returns waiting result for EffectRequestedError", () => {
    const action = makeAction("eff-1");
    const error = new EffectRequestedError(action);
    const result = asWaitingResult(error);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("waiting");
    expect(result!.nextActions).toEqual([action]);
  });

  it("returns waiting result for EffectPendingError", () => {
    const action = makeAction("eff-2");
    const error = new EffectPendingError(action);
    const result = asWaitingResult(error);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("waiting");
    expect(result!.nextActions).toEqual([action]);
  });

  it("returns waiting result for ParallelPendingError", () => {
    const actions = [makeAction("eff-3"), makeAction("eff-4")];
    const batch = buildParallelBatch(actions);
    const error = new ParallelPendingError(batch);
    const result = asWaitingResult(error);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("waiting");
    expect(result!.nextActions.length).toBe(2);
  });

  it("returns null for unrelated errors", () => {
    expect(asWaitingResult(new Error("oops"))).toBeNull();
    expect(asWaitingResult(new TypeError("bad type"))).toBeNull();
  });

  it("returns null for non-error values", () => {
    expect(asWaitingResult(null)).toBeNull();
    expect(asWaitingResult(undefined)).toBeNull();
    expect(asWaitingResult("string")).toBeNull();
    expect(asWaitingResult(42)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: duck-type fallback (cross-package / dual-package hazard)
// ---------------------------------------------------------------------------

describe("asWaitingResult — duck-type fallback (cross-package instanceof failure)", () => {
  it("detects EffectRequestedError by name + action shape", () => {
    // Simulate an error thrown by a different SDK copy: same shape, different class
    const action = makeAction("eff-cross-1");
    const foreignError = Object.assign(new Error("Effect eff-cross-1 requested"), {
      name: "EffectRequestedError",
      action,
    });

    // Verify instanceof would fail
    expect(foreignError instanceof EffectRequestedError).toBe(false);

    const result = asWaitingResult(foreignError);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("waiting");
    expect(result!.nextActions).toEqual([action]);
  });

  it("detects EffectPendingError by name + action shape", () => {
    const action = makeAction("eff-cross-2");
    const foreignError = Object.assign(new Error("Effect eff-cross-2 pending"), {
      name: "EffectPendingError",
      action,
    });

    expect(foreignError instanceof EffectPendingError).toBe(false);

    const result = asWaitingResult(foreignError);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("waiting");
    expect(result!.nextActions).toEqual([action]);
  });

  it("detects ParallelPendingError by name + batch shape", () => {
    const actions = [makeAction("eff-cross-3"), makeAction("eff-cross-4")];
    const foreignError = Object.assign(new Error("Parallel pending"), {
      name: "ParallelPendingError",
      batch: { actions },
    });

    expect(foreignError instanceof ParallelPendingError).toBe(false);

    const result = asWaitingResult(foreignError);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("waiting");
    expect(result!.nextActions).toHaveLength(2);
    expect(result!.nextActions[0].effectId).toBe("eff-cross-3");
  });

  it("rejects objects with matching name but wrong action shape", () => {
    const badAction = Object.assign(new Error("Effect broken requested"), {
      name: "EffectRequestedError",
      action: "not-an-object", // wrong shape
    });
    expect(asWaitingResult(badAction)).toBeNull();
  });

  it("rejects objects with matching name but missing effectId", () => {
    const noEffectId = Object.assign(new Error("Effect requested"), {
      name: "EffectRequestedError",
      action: { kind: "agent" }, // missing effectId
    });
    expect(asWaitingResult(noEffectId)).toBeNull();
  });

  it("rejects objects with matching name but wrong batch shape", () => {
    const badBatch = Object.assign(new Error("Parallel pending"), {
      name: "ParallelPendingError",
      batch: { actions: "not-an-array" },
    });
    expect(asWaitingResult(badBatch)).toBeNull();
  });

  it("rejects plain objects without error names", () => {
    const plain = { action: makeAction("eff-plain") };
    expect(asWaitingResult(plain)).toBeNull();
  });
});
