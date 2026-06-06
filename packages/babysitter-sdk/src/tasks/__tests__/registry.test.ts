import { beforeEach, describe, expect, it } from "vitest";
import { TaskRegistry, DuplicateTaskIdError } from "../../tasks";

const TASK_JSON_REF = (effectId: string) => `tasks/${effectId}/task.json`;

describe("TaskRegistry", () => {
  let registry: TaskRegistry;

  beforeEach(() => {
    registry = new TaskRegistry();
  });

  it("registers definitions with deduped labels and rejects duplicates", () => {
    const inputSchema = {
      type: "object",
      properties: {
        path: { type: "string" },
      },
    };
    const first = registry.registerDefinition({
      id: "task-alpha",
      labels: ["build", "build", "ops"],
      kind: "node",
      inputSchema,
    });
    expect(first.labels).toEqual(["build", "ops"]);
    expect(first.inputSchema).toEqual(inputSchema);
    expect(registry.listDefinitions()).toEqual([first]);
    expect(() =>
      registry.registerDefinition({ id: "task-alpha", labels: [], kind: "node" })
    ).toThrow(DuplicateTaskIdError);
  });

  it("lists pending effects filtered by kind and labels with deterministic ordering", () => {
    registry.registerDefinition({ id: "task-node", labels: ["cli"], kind: "node" });
    registry.registerDefinition({ id: "task-break", labels: ["manual"], kind: "breakpoint" });

    recordEffect(registry, {
      effectId: "02C",
      taskId: "task-break",
      kind: "breakpoint",
      label: "review",
      status: "pending",
      metadata: { labels: ["needs-human"] },
    });
    recordEffect(registry, {
      effectId: "01A",
      taskId: "task-node",
      kind: "node",
      labels: ["auto"],
      status: "pending",
    });
    recordEffect(registry, {
      effectId: "03D",
      taskId: "task-node",
      kind: "node",
      status: "resolved_ok",
    });

    const nodePending = registry.listPending({ kind: "node" });
    expect(nodePending.map((record) => record.effectId)).toEqual(["01A"]);

    const labelFiltered = registry.listPending({ labels: "needs-human" });
    expect(labelFiltered.map((record) => record.effectId)).toEqual(["02C"]);
  });

  it("get/resolveEffect round-trips effect metadata", () => {
    registry.registerDefinition({ id: "task-x", labels: [], kind: "node" });
    recordEffect(registry, {
      effectId: "05E",
      taskId: "task-x",
      kind: "node",
      status: "pending",
    });

    const before = registry.get("05E");
    expect(before?.status).toBe("pending");

    registry.resolveEffect("05E", {
      status: "resolved_ok",
      resultRef: "tasks/05E/result.json",
    });
    const after = registry.get("05E");
    expect(after?.status).toBe("resolved_ok");
    expect(after?.resultRef).toBe("tasks/05E/result.json");
  });
});

type EffectInput = {
  effectId: string;
  taskId: string;
  kind: string;
  status: "pending" | "resolved_ok" | "resolved_error";
  label?: string;
  labels?: string[];
  metadata?: Record<string, unknown>;
};

function recordEffect(registry: TaskRegistry, input: EffectInput) {
  registry.recordEffect({
    effectId: input.effectId,
    taskId: input.taskId,
    invocationKey: `proc:${input.effectId}`,
    kind: input.kind,
    status: input.status,
    label: input.label,
    labels: input.labels,
    metadata: input.metadata,
    taskDefRef: TASK_JSON_REF(input.effectId),
  });
}
