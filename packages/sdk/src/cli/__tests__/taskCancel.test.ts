import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "path";
import { promises as fs } from "node:fs";
import type { Stats } from "fs";
import { createBabysitterCli } from "../main";
import { EffectRecord } from "../../runtime/types";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";
import { commitEffectCancellation } from "../../runtime/commitEffectResult";

vi.mock("../../runtime/replay/effectIndex", () => ({
  buildEffectIndex: vi.fn(),
}));

vi.mock("../../runtime/commitEffectResult", () => ({
  commitEffectResult: vi.fn(),
  commitEffectCancellation: vi.fn(),
}));

const buildEffectIndexMock = vi.mocked(buildEffectIndex);
const commitEffectCancellationMock = vi.mocked(commitEffectCancellation);

describe("CLI task:cancel command", () => {
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

  it("task:cancel command is registered and recognized by the CLI", async () => {
    buildEffectIndexMock.mockResolvedValue(
      mockEffectIndex([effectRecord("ef-reg", { status: "requested" })])
    );
    commitEffectCancellationMock.mockResolvedValue({ resultRef: "tasks/ef-reg/result.json" });

    const cli = createBabysitterCli();
    // A registered command with valid args should succeed (exit 0)
    const exitCode = await cli.run([
      "task:cancel",
      "runs/demo",
      "ef-reg",
      "--runs-dir",
      ".",
    ]);
    expect(exitCode).toBe(0);
    expectLogContaining(logSpy, "cancel");
  });

  it("cancels a requested effect", async () => {
    buildEffectIndexMock.mockResolvedValue(
      mockEffectIndex([effectRecord("ef-cancel-1", { status: "requested" })])
    );
    commitEffectCancellationMock.mockResolvedValue({ resultRef: "tasks/ef-cancel-1/result.json" });

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:cancel",
      "runs/demo",
      "ef-cancel-1",
      "--runs-dir",
      ".",
    ]);

    expect(exitCode).toBe(0);
    expect(commitEffectCancellationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        runDir: expect.any(String),
        effectId: "ef-cancel-1",
      })
    );
  });

  it("rejects non-existent effectId", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:cancel",
      "runs/demo",
      "ef-missing",
      "--runs-dir",
      ".",
    ]);

    expect(exitCode).toBe(1);
    expectLogContaining(errorSpy, "not found");
  });

  it("rejects already-resolved effect", async () => {
    buildEffectIndexMock.mockResolvedValue(
      mockEffectIndex([effectRecord("ef-done", { status: "resolved_ok" })])
    );

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:cancel",
      "runs/demo",
      "ef-done",
      "--runs-dir",
      ".",
    ]);

    expect(exitCode).toBe(1);
    expectLogContaining(errorSpy, "already");
  });

  it("accepts --reason flag", async () => {
    buildEffectIndexMock.mockResolvedValue(
      mockEffectIndex([effectRecord("ef-reason", { status: "requested" })])
    );
    commitEffectCancellationMock.mockResolvedValue({ resultRef: "tasks/ef-reason/result.json" });

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:cancel",
      "runs/demo",
      "ef-reason",
      "--reason",
      "no longer needed",
      "--runs-dir",
      ".",
    ]);

    expect(exitCode).toBe(0);
    expect(commitEffectCancellationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        effectId: "ef-reason",
        reason: "no longer needed",
      })
    );
  });

  it("outputs JSON with --json flag", async () => {
    buildEffectIndexMock.mockResolvedValue(
      mockEffectIndex([effectRecord("ef-json-cancel", { status: "requested" })])
    );
    commitEffectCancellationMock.mockResolvedValue({ resultRef: "tasks/ef-json-cancel/result.json" });

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:cancel",
      "runs/demo",
      "ef-json-cancel",
      "--json",
      "--runs-dir",
      ".",
    ]);

    expect(exitCode).toBe(0);
    const payload = readLastJson(logSpy);
    expect(payload).toMatchObject({
      effectId: "ef-json-cancel",
      status: "cancelled",
      resultRef: "tasks/ef-json-cancel/result.json",
    });
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
