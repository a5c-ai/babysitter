import { beforeEach, describe, expect, it } from "vitest";
import {
  defineTask,
  resetGlobalTaskRegistry,
  DuplicateTaskIdError,
  TaskBuildContext,
  globalTaskRegistry,
} from "../../tasks";

let ctxCounter = 0;
const fakeCtx = (overrides: Partial<TaskBuildContext> = {}): TaskBuildContext => {
  const suffix = `${++ctxCounter}`;
  const labels: string[] = overrides.labels ?? [];
  return {
    effectId: overrides.effectId ?? `effect-${suffix}`,
    invocationKey: overrides.invocationKey ?? `invocation-${suffix}`,
    taskId: overrides.taskId ?? `task-${suffix}`,
    runId: overrides.runId ?? "run-1",
    runDir: overrides.runDir ?? "/runs/run-1",
    taskDir: overrides.taskDir ?? `/runs/run-1/tasks/effect-${suffix}`,
    tasksDir: overrides.tasksDir ?? "/runs/run-1/tasks",
    labels,
    createBlobRef:
      overrides.createBlobRef ??
      (async (..._args: Parameters<TaskBuildContext["createBlobRef"]>) => {
        return "blob";
      }),
    toTaskRelativePath: overrides.toTaskRelativePath ?? ((relativePath: string) => relativePath),
  };
};

describe("defineTask id normalization", () => {
  beforeEach(() => {
    resetGlobalTaskRegistry();
  });

  it("trims leading and trailing whitespace from ids", () => {
    const defined = defineTask("  build  ", () => ({ kind: "node" }));
    expect(defined.id).toBe("build");
  });

  it("rejects blank ids", () => {
    expect(() => defineTask("   ", () => ({ kind: "node" }))).toThrowError(
      /defineTask requires a non-empty string id/
    );
  });

  it("preserves already-normalized ids", () => {
    const defined = defineTask("deploy", () => ({ kind: "node" }));
    expect(defined.id).toBe("deploy");
  });
});

describe("defineTask duplicate detection", () => {
  beforeEach(() => {
    resetGlobalTaskRegistry();
  });

  it("throws DuplicateTaskIdError when registering the same id twice", () => {
    defineTask("bundle", () => ({ kind: "node" }));
    expect(() => defineTask("bundle", () => ({ kind: "node" }))).toThrowError(DuplicateTaskIdError);
  });
});

describe("defineTask deterministic output", () => {
  beforeEach(() => {
    resetGlobalTaskRegistry();
  });

  it("returns stable TaskDef instances with cloned labels", async () => {
    const defined = defineTask("deterministic", (_, ctx) => {
      ctx.labels.push("ctx");
      return { kind: "node", labels: ctx.labels };
    });

    const firstCtx = fakeCtx();
    const secondCtx = fakeCtx();
    const first = await defined.build({ value: 1 }, firstCtx);
    const second = await defined.build({ value: 1 }, secondCtx);

    expect(first).toEqual(second);
    expect(first.labels).toEqual(firstCtx.labels);
    expect(second.labels).toEqual(secondCtx.labels);
    expect(first.labels).not.toBe(firstCtx.labels);
    expect(second.labels).not.toBe(secondCtx.labels);
  });
});

describe("defineTask label metadata", () => {
  beforeEach(() => {
    resetGlobalTaskRegistry();
  });

  it("merges option and implementation labels when recording definitions", async () => {
    const defined = defineTask(
      "label-merge",
      () => {
        return { kind: "node", labels: ["impl"] };
      },
      { labels: ["opt"] }
    );

    const ctx = fakeCtx();
    ctx.labels.push("ctx");
    await defined.build({}, ctx);

    const record = globalTaskRegistry.listDefinitions().find((entry) => entry.id === defined.id);
    expect(record?.labels).toEqual(["opt", "impl"]);
  });
});

describe("defineTask object-form (backward-compat for legacy library processes)", () => {
  beforeEach(() => {
    resetGlobalTaskRegistry();
  });

  it("accepts { id, kind, ... } static-TaskDef form (used by quality-gated-six-phase)", async () => {
    const defined = defineTask({
      id: "qg6.design",
      kind: "agent",
      title: "Phase 1: Design",
      labels: ["qg6", "design"],
      description: "Static TaskDef shape",
    });
    expect(defined.id).toBe("qg6.design");
    const built = await defined.build({}, fakeCtx());
    expect(built.kind).toBe("agent");
    expect(built.title).toBe("Phase 1: Design");
  });

  it("accepts { name, ... } as alias for id (used by canonical ontology-driven-development)", async () => {
    const defined = defineTask({
      name: "world-ontology-research",
      kind: "agent",
      title: "World Ontology Research",
    });
    expect(defined.id).toBe("world-ontology-research");
    const built = await defined.build({}, fakeCtx());
    expect(built.kind).toBe("agent");
  });

  it("accepts { name, run } form where run produces TaskDef from inputs", async () => {
    const defined = defineTask<{ projectName: string }, unknown>({
      name: "with-run",
      description: "object-form with run impl",
      run: async (inputs) => ({
        kind: "agent",
        title: `Research: ${inputs.projectName}`,
      }),
    });
    expect(defined.id).toBe("with-run");
    const built = await defined.build({ projectName: "v6" }, fakeCtx());
    expect(built.kind).toBe("agent");
    expect(built.title).toBe("Research: v6");
  });

  it("strips inputs/outputs/source/run/id/name from static-form TaskDef envelope", async () => {
    const defined = defineTask({
      name: "envelope",
      kind: "agent",
      title: "envelope-test",
      inputs: { foo: { type: "string" } },
      outputs: { bar: { type: "object" } },
      source: "library/methodologies/example",
    });
    const built = await defined.build({}, fakeCtx());
    expect(built.kind).toBe("agent");
    expect(built).not.toHaveProperty("name");
    expect(built).not.toHaveProperty("inputs");
    expect(built).not.toHaveProperty("outputs");
    expect(built).not.toHaveProperty("source");
  });

  it("rejects object-form without id or name", () => {
    expect(() =>
      defineTask({
        kind: "agent",
        title: "missing id and name",
      } as unknown as Parameters<typeof defineTask>[0])
    ).toThrow(/id.*name/);
  });
});
