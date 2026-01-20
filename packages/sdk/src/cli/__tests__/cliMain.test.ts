import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import path from "path";
import { createBabysitterCli } from "../main";
import { runNodeTaskFromCli } from "../nodeTaskRunner";
import type { CliRunNodeTaskResult } from "../nodeTaskRunner";
import { orchestrateIteration } from "../../runtime/orchestrateIteration";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";
import { readRunMetadata } from "../../storage/runFiles";
import type { EffectRecord } from "../../runtime/types";
import type { TaskDef } from "../../tasks/types";

vi.mock("../nodeTaskRunner", () => ({
  runNodeTaskFromCli: vi.fn(),
}));

vi.mock("../../runtime/orchestrateIteration", () => ({
  orchestrateIteration: vi.fn(),
}));

vi.mock("../../runtime/replay/effectIndex", () => ({
  buildEffectIndex: vi.fn(),
}));

vi.mock("../../storage/runFiles", () => ({
  readRunMetadata: vi.fn(),
}));

const runNodeTaskFromCliMock = runNodeTaskFromCli as unknown as ReturnType<typeof vi.fn>;
const orchestrateIterationMock = orchestrateIteration as unknown as ReturnType<typeof vi.fn>;
const buildEffectIndexMock = buildEffectIndex as unknown as ReturnType<typeof vi.fn>;
const readRunMetadataMock = readRunMetadata as unknown as ReturnType<typeof vi.fn>;

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

  it("executes task:run and prints refs", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-123")]));
    runNodeTaskFromCliMock.mockResolvedValue(mockRunResult());

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:run", "runs/demo", "ef-123"]);

    expect(exitCode).toBe(0);
    expect(runNodeTaskFromCliMock).toHaveBeenCalledWith(
      expect.objectContaining({
        runDir: path.resolve("runs/demo"),
        effectId: "ef-123",
        invocationKey: "ef-123:inv",
        dryRun: false,
      })
    );
    expect(logSpy).toHaveBeenCalledWith(
      "[task:run] status=ok stdoutRef=tasks/mock/stdout.log stderrRef=tasks/mock/stderr.log resultRef=tasks/mock/result.json"
    );
  });

  it("prefers committed artifact refs in human output", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-committed")]));
    runNodeTaskFromCliMock.mockResolvedValue(
      mockRunResult({
        committed: {
          stdoutRef: "tasks/ef-committed/stdout.log",
          stderrRef: "tasks/ef-committed/stderr.log",
          resultRef: "tasks/ef-committed/result.json",
        },
      })
    );

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:run", "runs/demo", "ef-committed"]);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(
      "[task:run] status=ok stdoutRef=tasks/ef-committed/stdout.log stderrRef=tasks/ef-committed/stderr.log resultRef=tasks/ef-committed/result.json"
    );
  });

  it("supports task:run --dry-run JSON output", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-123")]));
    runNodeTaskFromCliMock.mockResolvedValue(
      mockRunResult({
        exitCode: null,
        committed: undefined,
      })
    );

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:run", "runs/demo", "ef-123", "--dry-run", "--json"]);

    expect(exitCode).toBe(0);
    expect(runNodeTaskFromCliMock).toHaveBeenCalledWith(
      expect.objectContaining({
        runDir: path.resolve("runs/demo"),
        effectId: "ef-123",
        invocationKey: "ef-123:inv",
        dryRun: true,
      })
    );
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(payload.status).toBe("skipped");
    expect(payload.committed).toBeNull();
    expect(payload.stdoutRef).toBe("tasks/mock/stdout.log");
    expect(payload.stderrRef).toBe("tasks/mock/stderr.log");
    expect(payload.resultRef).toBe("tasks/mock/result.json");
  });

  it("refuses to run non-node effects", async () => {
    buildEffectIndexMock.mockResolvedValue(
      mockEffectIndex([nodeEffectRecord("ef-break", { kind: "breakpoint" })])
    );

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:run", "runs/demo", "ef-break"]);

    expect(exitCode).toBe(1);
    expect(runNodeTaskFromCliMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      '[task:run] effect ef-break has kind=breakpoint; task:run only supports kind="node"'
    );
  });

  it("errors when the effect id is missing from the index", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:run", "runs/demo", "ef-missing"]);

    expect(exitCode).toBe(1);
    expect(runNodeTaskFromCliMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      `[task:run] effect ef-missing not found at ${path.resolve("runs/demo")}`
    );
  });

  it("exits non-zero when the node task reports a failure", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-err")]));
    runNodeTaskFromCliMock.mockResolvedValue(
      mockRunResult({
        exitCode: 2,
        committed: {
          resultRef: "tasks/ef-err/result.json",
        },
      })
    );

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:run", "runs/demo", "ef-err"]);

    expect(exitCode).toBe(1);
    expect(logSpy).toHaveBeenCalledWith(
      "[task:run] status=error stdoutRef=tasks/mock/stdout.log stderrRef=tasks/mock/stderr.log resultRef=tasks/ef-err/result.json"
    );
  });


  describe("run:step", () => {
    it("runs one iteration and prints completion output", async () => {
      orchestrateIterationMock.mockResolvedValue({
        status: "completed",
        output: { ok: true },
      });

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["run:step", "runs/demo"]);

    expect(exitCode).toBe(0);
    expect(orchestrateIterationMock).toHaveBeenCalledWith({
      runDir: path.resolve("runs/demo"),
      now: expect.any(Date),
    });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[run:step] status=completed output={"ok":true}'));
  });

    it("prints pending action summaries when waiting", async () => {
      orchestrateIterationMock.mockResolvedValue({
        status: "waiting",
        nextActions: [
          {
            effectId: "ef-manual",
            kind: "breakpoint",
            label: "needs approval",
          },
        ],
      });

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["run:step", "runs/demo"]);

    expect(exitCode).toBe(0);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[run:step] status=waiting pending=1"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("- ef-manual [breakpoint] needs approval"));
  });

    it("prints failures and exits with status 1", async () => {
      const errorPayload = { message: "iteration failed" };
      orchestrateIterationMock.mockResolvedValue({
        status: "failed",
        error: errorPayload,
      });

      const cli = createBabysitterCli();
      const exitCode = await cli.run(["run:step", "runs/demo"]);

      expect(exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[run:step] status=failed"));
      expect(errorSpy).toHaveBeenCalledWith(errorPayload);
    });

    it("emits the iteration payload with metadata in JSON mode", async () => {
      const iterationPayload = {
        status: "failed",
        error: { message: "boom" },
        metadata: {
          stateVersion: 9,
          pendingEffectsByKind: { node: 1 },
        },
      };
      orchestrateIterationMock.mockResolvedValue(iterationPayload);

      const cli = createBabysitterCli();
      const exitCode = await cli.run(["run:step", "runs/demo", "--json"]);

      expect(exitCode).toBe(1);
      const raw = String(logSpy.mock.calls.at(-1)?.[0] ?? "{}");
      expect(JSON.parse(raw)).toEqual(iterationPayload);
    });

    it("parses --now override into a Date", async () => {
      orchestrateIterationMock.mockResolvedValue({
        status: "completed",
        output: null,
      });
      const nowIso = "2026-01-11T00:00:00.000Z";

      const cli = createBabysitterCli();
      const exitCode = await cli.run(["run:step", "runs/demo", "--now", nowIso]);

      expect(exitCode).toBe(0);
      expect(orchestrateIterationMock).toHaveBeenCalledWith({
        runDir: path.resolve("runs/demo"),
        now: new Date(nowIso),
      });
    });

    it("prints usage when runDir is missing", async () => {
      const cli = createBabysitterCli();
      const exitCode = await cli.run(["run:step"]);

      expect(exitCode).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
      expect(orchestrateIterationMock).not.toHaveBeenCalled();
    });

    it("emits verbose diagnostics when --verbose is provided", async () => {
      orchestrateIterationMock.mockResolvedValue({
        status: "completed",
        output: { done: true },
      });
      const nowIso = "2026-01-12T08:00:00.000Z";

      const cli = createBabysitterCli();
      const exitCode = await cli.run(["run:step", "runs/demo", "--verbose", "--now", nowIso]);

      expect(exitCode).toBe(0);
      expect(errorSpy).toHaveBeenCalledWith(
        `[run:step] verbose runDir=${path.resolve("runs/demo")} now=${nowIso} json=false`
      );
    });
  });
});

function mockRunResult(overrides: Partial<CliRunNodeTaskResult> = {}): CliRunNodeTaskResult {
  const now = new Date(0).toISOString();
  const base: CliRunNodeTaskResult = {
    task: { kind: "node", node: { entry: "./script.js" } },
    command: {
      binary: process.execPath,
      args: [path.resolve("runs/demo", "tasks/mock/script.js")],
      cwd: path.resolve("runs/demo"),
    },
    stdout: "",
    stderr: "",
    exitCode: 0,
    signal: null,
    timedOut: false,
    startedAt: now,
    finishedAt: now,
    durationMs: 0,
    timeoutMs: 0,
    output: undefined,
    io: {
      inputJsonPath: path.resolve("runs/demo", "tasks/mock/input.json"),
      outputJsonPath: path.resolve("runs/demo", "tasks/mock/result.json"),
      stdoutPath: path.resolve("runs/demo", "tasks/mock/stdout.log"),
      stderrPath: path.resolve("runs/demo", "tasks/mock/stderr.log"),
    },
    hydrated: { env: {}, hydratedKeys: [], missingKeys: [] },
    hydratedKeys: [],
    missingKeys: [],
    committed: undefined,
  };
  return { ...base, ...overrides };
}

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
