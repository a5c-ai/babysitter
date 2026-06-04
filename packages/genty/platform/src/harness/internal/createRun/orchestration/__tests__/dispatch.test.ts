import { describe, expect, test } from "vitest";
import type { EffectAction } from "@a5c-ai/babysitter-sdk";
import { dispatchEffectActions } from "../dispatch";

function makeAction(
  effectId: string,
  schedulerHints?: EffectAction["schedulerHints"],
): EffectAction {
  return {
    effectId,
    invocationKey: `key-${effectId}`,
    kind: "agent",
    taskDef: { kind: "agent", title: effectId },
    schedulerHints,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

describe("dispatchEffectActions", () => {
  test("resolves parallel groups concurrently and commits in action order", async () => {
    const alpha = deferred<void>();
    const beta = deferred<void>();
    const resolved: string[] = [];
    const committed: string[] = [];

    const dispatch = dispatchEffectActions({
      actions: [
        makeAction("alpha", { parallelGroupId: "group-1" }),
        makeAction("beta", { parallelGroupId: "group-1" }),
      ],
      concurrentEffects: true,
      resolveAction: async (action) => {
        resolved.push(action.effectId);
        if (action.effectId === "alpha") {
          await alpha.promise;
        } else {
          await beta.promise;
        }
        return { status: "ok", value: action.effectId };
      },
      commitAction: async ({ action }) => {
        committed.push(action.effectId);
      },
    });

    await Promise.resolve();
    expect(resolved).toEqual(["alpha", "beta"]);
    beta.resolve();
    await Promise.resolve();
    alpha.resolve();

    await expect(dispatch).resolves.toEqual({
      resolved: 2,
      ok: 2,
      error: 0,
      background: 0,
    });
    expect(committed).toEqual(["alpha", "beta"]);
  });

  test("keeps parallel groups sequential unless concurrent-effects is enabled", async () => {
    const first = deferred<void>();
    const resolved: string[] = [];

    const dispatch = dispatchEffectActions({
      actions: [
        makeAction("alpha", { parallelGroupId: "group-1" }),
        makeAction("beta", { parallelGroupId: "group-1" }),
      ],
      resolveAction: async (action) => {
        resolved.push(action.effectId);
        if (action.effectId === "alpha") {
          await first.promise;
        }
        return { status: "ok", value: action.effectId };
      },
      commitAction: async () => undefined,
    });

    await Promise.resolve();
    expect(resolved).toEqual(["alpha"]);
    first.resolve();
    await dispatch;
    expect(resolved).toEqual(["alpha", "beta"]);
  });

  test("respects maxConcurrency while preserving deterministic commits", async () => {
    let active = 0;
    let maxActive = 0;
    const committed: string[] = [];

    await dispatchEffectActions({
      actions: [
        makeAction("a", { parallelGroupId: "group-1", maxConcurrency: 2 }),
        makeAction("b", { parallelGroupId: "group-1", maxConcurrency: 2 }),
        makeAction("c", { parallelGroupId: "group-1", maxConcurrency: 2 }),
      ],
      concurrentEffects: true,
      resolveAction: async (action) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return { status: "ok", value: action.effectId };
      },
      commitAction: async ({ action }) => {
        committed.push(action.effectId);
      },
    });

    expect(maxActive).toBe(2);
    expect(committed).toEqual(["a", "b", "c"]);
  });

  test("isolates background effects from foreground actions that share a group id", async () => {
    const foreground = deferred<void>();
    const background = deferred<void>();
    const resolved: string[] = [];

    const dispatch = dispatchEffectActions({
      actions: [
        makeAction("foreground", { parallelGroupId: "group-1" }),
        makeAction("background", { parallelGroupId: "group-1", background: true }),
      ],
      concurrentEffects: true,
      resolveAction: async (action) => {
        resolved.push(action.effectId);
        if (action.effectId === "foreground") {
          await foreground.promise;
        } else {
          await background.promise;
        }
        return { status: "ok" };
      },
      commitAction: async () => undefined,
    });

    await Promise.resolve();
    expect(resolved).toEqual(["foreground"]);
    foreground.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(resolved).toEqual(["foreground", "background"]);
    background.resolve();

    await expect(dispatch).resolves.toMatchObject({ background: 1 });
  });

  test("converts resolver throws into error commits without dropping other results", async () => {
    const committed: Array<{ effectId: string; status: string; stderr?: string }> = [];

    const summary = await dispatchEffectActions({
      actions: [
        makeAction("ok", { parallelGroupId: "group-1" }),
        makeAction("bad", { parallelGroupId: "group-1" }),
      ],
      concurrentEffects: true,
      resolveAction: async (action) => {
        if (action.effectId === "bad") {
          throw new Error("boom");
        }
        return { status: "ok", value: "done" };
      },
      commitAction: async ({ action, result }) => {
        committed.push({
          effectId: action.effectId,
          status: result.status,
          stderr: result.stderr,
        });
      },
    });

    expect(summary).toEqual({
      resolved: 2,
      ok: 1,
      error: 1,
      background: 0,
    });
    expect(committed).toEqual([
      { effectId: "ok", status: "ok", stderr: undefined },
      { effectId: "bad", status: "error", stderr: "boom" },
    ]);
  });
});
