import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "path";
import { createBabysitterCli } from "../main";
import { EffectRecord } from "../../runtime/types";
import type { JsonRecord } from "../../storage/types";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";
import { readTaskDefinition, readTaskResult } from "../../storage/tasks";

vi.mock("../../runtime/replay/effectIndex", () => ({
  buildEffectIndex: vi.fn(),
}));

vi.mock("../../storage/tasks", () => ({
  readTaskDefinition: vi.fn(),
  readTaskResult: vi.fn(),
}));

const buildEffectIndexMock = vi.mocked(buildEffectIndex);
const readTaskDefinitionMock = vi.mocked(readTaskDefinition);
const readTaskResultMock = vi.mocked(readTaskResult);

describe("CLI task commands", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("lists tasks with human output", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([effectRecord("ef-1"), effectRecord("ef-2", { status: "requested" })]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:list", "runs/demo"]);

    expect(exitCode).toBe(0);
    expectLogContaining(logSpy, "[task:list] total=2");
    expectEntries(logSpy, 2);
    expectLogContaining(logSpy, "- ef-1 [node resolved_ok]");
  });

  it("lists pending tasks in JSON mode", async () => {
    buildEffectIndexMock.mockResolvedValue(
      mockEffectIndex([
        effectRecord("ef-1", { status: "requested", label: "needs-review" }),
        effectRecord("ef-2", { status: "resolved_ok" }),
      ])
    );

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:list", "runs/demo", "--pending", "--json"]);

    expect(exitCode).toBe(0);
    const payload = readLastJson(logSpy);
    expect(payload.tasks).toHaveLength(1);
    expect(payload.tasks[0]).toMatchObject({ effectId: "ef-1", status: "requested", label: "needs-review" });
    expect(payload.tasks[0]).toMatchObject({
      taskDefRef: "tasks/ef-1/task.json",
      resultRef: "tasks/ef-1/result.json",
    });
  });

  it("filters tasks by kind when requested", async () => {
    buildEffectIndexMock.mockResolvedValue(
      mockEffectIndex([effectRecord("ef-node"), effectRecord("ef-break", { kind: "breakpoint", label: "manual", status: "requested" })])
    );

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:list", "runs/demo", "--kind", "breakpoint"]);

    expect(exitCode).toBe(0);
    expectLogContaining(logSpy, "[task:list] total=1");
    const entries = collectEntries(logSpy);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain("ef-break");
    expect(entries[0]).toContain("[breakpoint requested]");
  });

  it("shows task details with resolved result", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([effectRecord("ef-123", { resolvedAt: "date" })]));
    readTaskDefinitionMock.mockResolvedValue({ schemaVersion: "v1", kind: "node" } as JsonRecord);
    readTaskResultMock.mockResolvedValue({ schemaVersion: "v1", status: "ok" });

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:show", "runs/demo", "ef-123"]);

    expect(exitCode).toBe(0);
    expectLogContaining(logSpy, "[task:show] ef-123 [node resolved_ok]");
    expectLogContaining(logSpy, "resultRef=tasks/ef-123/result.json");
    expectLogContaining(logSpy, '"kind": "node"');
    expectLogContaining(logSpy, '"status": "ok"');
  });

  it("indicates when task results are not yet written", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([effectRecord("ef-missing")]));
    readTaskDefinitionMock.mockResolvedValue({ schemaVersion: "v1", kind: "node" } as JsonRecord);
    readTaskResultMock.mockResolvedValue(undefined);

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:show", "runs/demo", "ef-missing"]);

    expect(exitCode).toBe(0);
    expectLogContaining(logSpy, "result: (not yet written)");
  });

  it("returns error when effect is missing", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:show", "runs/demo", "missing"]);

    expect(exitCode).toBe(1);
    expectLogContaining(errorSpy, "effect missing not found");
  });
});

function effectRecord(effectId: string, overrides: Partial<EffectRecord> = {}): EffectRecord {
  const effectDir = path.resolve("runs/demo", "tasks", effectId);
  return {
    effectId,
    invocationKey: `${effectId}:inv`,
    stepId: "step-1",
    taskId: "lint",
    status: "resolved_ok",
    kind: "node",
    label: "auto",
    labels: ["auto"],
    taskDefRef: path.join(effectDir, "task.json"),
    inputsRef: path.join(effectDir, "inputs.json"),
    resultRef: path.join(effectDir, "result.json"),
    requestedAt: "date",
    resolvedAt: "date",
    ...overrides,
  };
}

function mockEffectIndex(records: EffectRecord[]) {
  return {
    listEffects: () => records,
    listPendingEffects: () => records.filter((record) => record.status === "requested"),
    getByEffectId: (effectId: string) => records.find((record) => record.effectId === effectId),
  };
}

function collectLines(spy: ReturnType<typeof vi.spyOn>) {
  return spy.mock.calls.map((call) => call.map((value) => String(value ?? "")).join(" "));
}

function collectEntries(spy: ReturnType<typeof vi.spyOn>) {
  return collectLines(spy).filter((line) => line.trimStart().startsWith("- "));
}

function expectEntries(spy: ReturnType<typeof vi.spyOn>, count: number) {
  expect(collectEntries(spy)).toHaveLength(count);
}

function expectLogContaining(spy: ReturnType<typeof vi.spyOn>, substring: string) {
  const lines = collectLines(spy);
  if (!lines.some((line) => line.includes(substring))) {
    throw new Error(`Expected substring "${substring}" in logs:\n${lines.join("\n")}`);
  }
}

function readLastJson(spy: ReturnType<typeof vi.spyOn>) {
  const raw = collectLines(spy).at(-1) ?? "{}";
  return JSON.parse(raw);
}
