import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import path from "path";
import { createBabysitterCli } from "../main";
import { handleHarnessCreateRun } from "../commands/harnessCreateRun";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";
import { readRunMetadata } from "../../storage/runFiles";
import { commitEffectResult } from "../../runtime/commitEffectResult";
import type { EffectRecord } from "../../runtime/types";

vi.mock("../../runtime/replay/effectIndex", () => ({
  buildEffectIndex: vi.fn(),
}));

vi.mock("../../storage/runFiles", () => ({
  readRunMetadata: vi.fn(),
}));

vi.mock("../../runtime/commitEffectResult", () => ({
  commitEffectResult: vi.fn(),
}));

vi.mock("../commands/harnessCreateRun", () => ({
  handleHarnessCreateRun: vi.fn().mockResolvedValue(0),
}));

const buildEffectIndexMock = buildEffectIndex as unknown as ReturnType<typeof vi.fn>;
const readRunMetadataMock = readRunMetadata as unknown as ReturnType<typeof vi.fn>;
const commitEffectResultMock = commitEffectResult as unknown as ReturnType<typeof vi.fn>;
const handleSessionCreateMock = handleHarnessCreateRun as unknown as ReturnType<typeof vi.fn>;

describe("CLI main entry", () => {
  let logSpy: MockInstance<[message?: any, ...optionalParams: any[]], void>;
  let errorSpy: MockInstance<[message?: any, ...optionalParams: any[]], void>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    buildEffectIndexMock.mockReset();
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([]));
    readRunMetadataMock.mockResolvedValue(mockRunMetadata());
    commitEffectResultMock.mockReset();
    commitEffectResultMock.mockResolvedValue({
      resultRef: "tasks/mock/result.json",
      stdoutRef: "tasks/mock/stdout.log",
      stderrRef: "tasks/mock/stderr.log",
      startedAt: "2026-01-20T00:00:00.000Z",
      finishedAt: "2026-01-20T00:00:01.000Z",
    });
    handleSessionCreateMock.mockReset();
    handleSessionCreateMock.mockResolvedValue(0);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("exposes the usage block via formatHelp()", () => {
    const cli = createBabysitterCli();
    const helpText = cli.formatHelp();

    expect(helpText).toContain("Usage:");
    expect(helpText).toContain("babysitter run:create");
  });

  it("prints help and exits zero when invoked without args", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run([]);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(cli.formatHelp());
    expect(readRunMetadataMock).not.toHaveBeenCalled();
  });

  it("prints help when --help flag is provided alongside a command", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run(["run:status", "runs/demo", "--help"]);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(cli.formatHelp());
    expect(readRunMetadataMock).not.toHaveBeenCalled();
  });

  it("posts task results via task:post and prints refs", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-123")]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:post", "runs/demo", "ef-123", "--status", "ok", "--runs-dir", "."]);

    expect(exitCode).toBe(0);
    expect(commitEffectResultMock).toHaveBeenCalledWith(
      expect.objectContaining({
        runDir: path.resolve("runs/demo"),
        effectId: "ef-123",
        invocationKey: "ef-123:inv",
        result: expect.objectContaining({
          status: "ok",
        }),
      })
    );
    expect(logSpy).toHaveBeenCalledWith(
      "[task:post] status=ok stdoutRef=tasks/mock/stdout.log stderrRef=tasks/mock/stderr.log resultRef=tasks/mock/result.json"
    );
  });

  it("supports task:post --dry-run JSON output", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-123")]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:post",
      "runs/demo",
      "ef-123",
      "--status",
      "ok",
      "--dry-run",
      "--json",
      "--runs-dir",
      ".",
    ]);

    expect(exitCode).toBe(0);
    expect(commitEffectResultMock).not.toHaveBeenCalled();
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(payload.status).toBe("skipped");
    expect(payload.dryRun).toBe(true);
  });

  it("errors when the effect id is missing from the index", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:post", "runs/demo", "ef-missing", "--status", "ok", "--runs-dir", "."]);

    expect(exitCode).toBe(1);
    expect(commitEffectResultMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      `[task:post] effect ef-missing not found at ${path.resolve("runs/demo")}`
    );
  });

  it("exits non-zero when posting an error status", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-err")]));
    commitEffectResultMock.mockResolvedValue({
      resultRef: "tasks/ef-err/result.json",
      stdoutRef: "tasks/mock/stdout.log",
      stderrRef: "tasks/mock/stderr.log",
      startedAt: "2026-01-20T00:00:00.000Z",
      finishedAt: "2026-01-20T00:00:01.000Z",
    });

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:post", "runs/demo", "ef-err", "--status", "error", "--runs-dir", "."]);

    expect(exitCode).toBe(1);
    expect(logSpy).toHaveBeenCalledWith(
      "[task:post] status=error stdoutRef=tasks/mock/stdout.log stderrRef=tasks/mock/stderr.log resultRef=tasks/ef-err/result.json"
    );
  });

  it("accepts harness:create-run --non-interactive as an alias for --no-interactive", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "harness:create-run",
      "--process",
      "/tmp/generated-process.mjs",
      "--non-interactive",
    ]);

    expect(exitCode).toBe(0);
    expect(handleSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        processPath: "/tmp/generated-process.mjs",
        interactive: false,
      }),
    );
  });

});

function mockRunMetadata() {
  return {
    runId: "run-demo",
    request: "req-123",
    processId: "process/demo",
    entrypoint: { importPath: "./process.js", exportName: "process" },
    layoutVersion: "1",
    createdAt: new Date(0).toISOString(),
  };
}

function nodeEffectRecord(effectId: string, overrides: Partial<EffectRecord> = {}): EffectRecord {
  const effectDir = path.join(path.resolve("runs/demo"), "tasks", effectId);
  return {
    effectId,
    invocationKey: `${effectId}:inv`,
    stepId: "step-1",
    taskId: "task/demo",
    status: "requested",
    kind: "node",
    label: "auto",
    labels: ["auto"],
    taskDefRef: path.join(effectDir, "task.json"),
    inputsRef: path.join(effectDir, "inputs.json"),
    resultRef: path.join(effectDir, "result.json"),
    stdoutRef: path.join(effectDir, "stdout.log"),
    stderrRef: path.join(effectDir, "stderr.log"),
    requestedAt: new Date(0).toISOString(),
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
