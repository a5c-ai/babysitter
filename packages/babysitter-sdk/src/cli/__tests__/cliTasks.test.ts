import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "path";
import { promises as fs } from "node:fs";
import type { Stats } from "fs";
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
  let statSpy: ReturnType<typeof vi.spyOn>;
  let secretEnvSnapshot: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    statSpy = vi.spyOn(fs, "stat").mockResolvedValue({ size: 512 } as unknown as Stats);
    secretEnvSnapshot = process.env.BABYSITTER_ALLOW_SECRET_LOGS;
    delete process.env.BABYSITTER_ALLOW_SECRET_LOGS;
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    statSpy.mockRestore();
    if (secretEnvSnapshot === undefined) {
      delete process.env.BABYSITTER_ALLOW_SECRET_LOGS;
    } else {
      process.env.BABYSITTER_ALLOW_SECRET_LOGS = secretEnvSnapshot;
    }
  });

  it("lists tasks with human output", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([effectRecord("ef-1"), effectRecord("ef-2", { status: "requested" })]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:list", "runs/demo", "--runs-dir", "."]);

    expect(exitCode).toBe(0);
    expectLogContaining(logSpy, "[task:list] total=2");
    expectEntries(logSpy, 2);
    expectLogContaining(logSpy, "- ef-1 [node resolved_ok]");
  });

  it("lists pending tasks in JSON mode", async () => {
    buildEffectIndexMock.mockResolvedValue(
      mockEffectIndex([
        effectRecord("ef-1", {
          status: "requested",
          label: "needs-review",
          resultRef: undefined,
          stdoutRef: undefined,
          stderrRef: undefined,
          resolvedAt: undefined,
        }),
        effectRecord("ef-2", { status: "resolved_ok" }),
      ])
    );

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:list", "runs/demo", "--pending", "--json", "--runs-dir", "."]);

    expect(exitCode).toBe(0);
    const payload = readLastJson(logSpy);
    expect(payload.tasks).toHaveLength(1);
    expect(payload.tasks[0]).toMatchObject({
      effectId: "ef-1",
      status: "requested",
      label: "needs-review",
      taskDefRef: "tasks/ef-1/task.json",
      resultRef: null,
      stdoutRef: null,
      stderrRef: null,
    });
  });

  it("filters tasks by kind when requested", async () => {
    buildEffectIndexMock.mockResolvedValue(
      mockEffectIndex([effectRecord("ef-node"), effectRecord("ef-break", { kind: "breakpoint", label: "manual", status: "requested" })])
    );

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:list", "runs/demo", "--kind", "breakpoint", "--runs-dir", "."]);

    expect(exitCode).toBe(0);
    expectLogContaining(logSpy, "[task:list] total=1");
    const entries = collectEntries(logSpy);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain("ef-break");
    expect(entries[0]).toContain("[breakpoint requested]");
  });

  it("emits POSIX refs for resolved tasks in JSON mode", async () => {
    buildEffectIndexMock.mockResolvedValue(
      mockEffectIndex([
        effectRecord("ef-node", {
          stdoutRef: path.join("runs", "demo", "tasks", "ef-node", "stdout.log"),
          stderrRef: path.join("runs", "demo", "tasks", "ef-node", "stderr.log"),
        }),
      ])
    );

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:list", "runs/demo", "--json", "--runs-dir", "."]);

    expect(exitCode).toBe(0);
    const payload = readLastJson(logSpy);
    expect(payload.tasks).toHaveLength(1);
    expect(payload.tasks[0]).toMatchObject({
      stdoutRef: "tasks/ef-node/stdout.log",
      stderrRef: "tasks/ef-node/stderr.log",
      resultRef: "tasks/ef-node/result.json",
    });
  });

  it("shows task details with resolved result", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([effectRecord("ef-123", { resolvedAt: "date" })]));
    readTaskDefinitionMock.mockResolvedValue({ schemaVersion: "v1", kind: "node" } as JsonRecord);
    readTaskResultMock.mockResolvedValue({ schemaVersion: "v1", status: "ok" });

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:show", "runs/demo", "ef-123", "--runs-dir", "."]);

    expect(exitCode).toBe(0);
    expectLogContaining(logSpy, "[task:show] ef-123 [node resolved_ok]");
    expectLogContaining(logSpy, "resultRef=tasks/ef-123/result.json");
    expectLogContaining(logSpy, "payloads: redacted (set BABYSITTER_ALLOW_SECRET_LOGS=true");
    expectLogNotContaining(logSpy, '"kind": "node"');
    expectLogNotContaining(logSpy, '"status": "ok"');
  });

  it("returns effect/task/result payloads in JSON mode when opt-in is enabled", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([effectRecord("ef-json")]));
    readTaskDefinitionMock.mockResolvedValue({ schemaVersion: "v1", kind: "node" } as JsonRecord);
    readTaskResultMock.mockResolvedValue({ schemaVersion: "v1", status: "ok", value: { ok: true } });
    process.env.BABYSITTER_ALLOW_SECRET_LOGS = "1";

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:show", "runs/demo", "ef-json", "--json", "--verbose", "--runs-dir", "."]);

    expect(exitCode).toBe(0);
    const payload = readLastJson(logSpy);
    expect(payload.effect).toMatchObject({ effectId: "ef-json", resultRef: "tasks/ef-json/result.json" });
    expect(payload.task).toMatchObject({ kind: "node" });
    expect(payload.result).toMatchObject({ status: "ok" });
    expect(payload.largeResult).toBeNull();
  });

  it("keeps payloads redacted for verbose JSON output without opt-in env", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([effectRecord("ef-json-secret")]));
    readTaskDefinitionMock.mockResolvedValue({ schemaVersion: "v1", kind: "node" } as JsonRecord);
    readTaskResultMock.mockResolvedValue({ schemaVersion: "v1", status: "ok" });

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:show", "runs/demo", "ef-json-secret", "--json", "--verbose", "--runs-dir", "."]);

    expect(exitCode).toBe(0);
    const payload = readLastJson(logSpy);
    expect(payload.task).toBeNull();
    expect(payload.result).toBeNull();
    expect(payload.largeResult).toBeNull();
  });

  it("reveals payloads when BABYSITTER_ALLOW_SECRET_LOGS is truthy with verbose JSON", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([effectRecord("ef-json-secret")]));
    readTaskDefinitionMock.mockResolvedValue({ schemaVersion: "v1", kind: "node" } as JsonRecord);
    readTaskResultMock.mockResolvedValue({ schemaVersion: "v1", status: "ok" });
    process.env.BABYSITTER_ALLOW_SECRET_LOGS = "true";

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:show", "runs/demo", "ef-json-secret", "--json", "--verbose", "--runs-dir", "."]);

    expect(exitCode).toBe(0);
    const payload = readLastJson(logSpy);
    expect(payload.task).toMatchObject({ kind: "node" });
    expect(payload.result).toMatchObject({ status: "ok" });
  });

  it("omits inline result when blob exceeds preview limit", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([effectRecord("ef-large")]));
    readTaskDefinitionMock.mockResolvedValue({ schemaVersion: "v1", kind: "node" } as JsonRecord);
    readTaskResultMock.mockResolvedValue({ schemaVersion: "v1", status: "ok" });
    statSpy.mockResolvedValue({ size: 2 * 1024 * 1024 } as unknown as Stats);

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:show", "runs/demo", "ef-large", "--json", "--runs-dir", "."]);

    expect(exitCode).toBe(0);
    const payload = readLastJson(logSpy);
    expect(payload.result).toBeNull();
    expect(payload.largeResult).toBe("tasks/ef-large/result.json");
    expect(readTaskResultMock).not.toHaveBeenCalled();
  });

  it("reports missing result artifacts without crashing", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([effectRecord("ef-missing-json")]));
    readTaskDefinitionMock.mockResolvedValue({ schemaVersion: "v1", kind: "node" } as JsonRecord);
    readTaskResultMock.mockResolvedValue(undefined);
    statSpy.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" as const }));

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:show", "runs/demo", "ef-missing-json", "--json", "--runs-dir", "."]);

    expect(exitCode).toBe(0);
    const payload = readLastJson(logSpy);
    expect(payload.result).toBeNull();
    expect(payload.largeResult).toBeNull();
  });

  it("indicates when task results are not yet written", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([effectRecord("ef-missing")]));
    readTaskDefinitionMock.mockResolvedValue({ schemaVersion: "v1", kind: "node" } as JsonRecord);
    readTaskResultMock.mockResolvedValue(undefined);

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:show", "runs/demo", "ef-missing", "--runs-dir", "."]);

    expect(exitCode).toBe(0);
    expectLogContaining(logSpy, "result: (not yet written)");
  });

  it("returns error when effect is missing", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:show", "runs/demo", "missing", "--runs-dir", "."]);

    expect(exitCode).toBe(1);
    expectLogContaining(errorSpy, "effect missing not found");
  });
});

function effectRecord(effectId: string, overrides: Partial<EffectRecord> = {}): EffectRecord {
  const effectDir = path.resolve("runs/demo", "tasks", effectId);
  const base: EffectRecord = {
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
    stdoutRef: path.join(effectDir, "stdout.log"),
    stderrRef: path.join(effectDir, "stderr.log"),
    requestedAt: "date",
    resolvedAt: "date",
  };
  const record: EffectRecord = {
    ...base,
    ...overrides,
  };
  if (record.status === "requested") {
    record.resultRef = overrides.resultRef;
    record.stdoutRef = overrides.stdoutRef;
    record.stderrRef = overrides.stderrRef;
    record.resolvedAt = overrides.resolvedAt;
  }
  return record;
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

function expectLogNotContaining(spy: ReturnType<typeof vi.spyOn>, substring: string) {
  const lines = collectLines(spy);
  if (lines.some((line) => line.includes(substring))) {
    throw new Error(`Did not expect substring "${substring}" in logs:\n${lines.join("\n")}`);
  }
}

function readLastJson(spy: ReturnType<typeof vi.spyOn>) {
  const raw = collectLines(spy).at(-1) ?? "{}";
  return JSON.parse(raw);
}
