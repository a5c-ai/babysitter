import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import path from "path";
import { createBabysitterCli } from "../main";
import { handleHarnessCreateRun } from "../commands/harnessCreateRun";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";
import { readRunMetadata } from "../../storage/runFiles";
import { commitEffectResult } from "../../runtime/commitEffectResult";
import { invokeHarness } from "../../harness/invoker";
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

vi.mock("../../harness/invoker", () => ({
  invokeHarness: vi.fn(),
}));

const buildEffectIndexMock = buildEffectIndex as unknown as ReturnType<typeof vi.fn>;
const readRunMetadataMock = readRunMetadata as unknown as ReturnType<typeof vi.fn>;
const commitEffectResultMock = commitEffectResult as unknown as ReturnType<typeof vi.fn>;
const handleSessionCreateMock = handleHarnessCreateRun as unknown as ReturnType<typeof vi.fn>;
const invokeHarnessMock = invokeHarness as unknown as ReturnType<typeof vi.fn>;

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
    invokeHarnessMock.mockReset();
    invokeHarnessMock.mockResolvedValue({
      success: true,
      output: "ok",
      exitCode: 0,
      duration: 1,
      harness: "internal",
    });
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
    const exitCode = await cli.run([
      "task:post",
      "runs/demo",
      "ef-123",
      "--status",
      "ok",
      "--value-inline",
      '{"ok":true}',
      "--runs-dir",
      ".",
    ]);

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
      "--value-inline",
      '{"dryRun":true}',
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

  it("accepts inline JSON values for task:post", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-inline")]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:post",
      "runs/demo",
      "ef-inline",
      "--status",
      "ok",
      "--value-inline",
      '{"approved":true,"response":"Proceed"}',
      "--runs-dir",
      ".",
    ]);

    expect(exitCode).toBe(0);
    expect(commitEffectResultMock).toHaveBeenCalledWith(
      expect.objectContaining({
        runDir: path.resolve("runs/demo"),
        effectId: "ef-inline",
        result: expect.objectContaining({
          status: "ok",
          value: {
            approved: true,
            response: "Proceed",
          },
        }),
      })
    );
  });

  it("rejects task:post when --value and --value-inline are combined", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-inline")]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:post",
      "runs/demo",
      "ef-inline",
      "--status",
      "ok",
      "--value",
      "tasks/ef-inline/output.json",
      "--value-inline",
      '{"approved":true}',
      "--runs-dir",
      ".",
    ]);

    expect(exitCode).toBe(1);
    expect(commitEffectResultMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith("[task:post] cannot combine --value with --value-inline");
  });

  it("rejects task:post --value-inline when posting an error result", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-inline")]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:post",
      "runs/demo",
      "ef-inline",
      "--status",
      "error",
      "--value-inline",
      '{"message":"nope"}',
      "--runs-dir",
      ".",
    ]);

    expect(exitCode).toBe(1);
    expect(commitEffectResultMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith("[task:post] --value-inline is only supported with --status ok");
  });

  it("errors when the effect id is missing from the index", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:post",
      "runs/demo",
      "ef-missing",
      "--status",
      "ok",
      "--value-inline",
      '{"ok":true}',
      "--runs-dir",
      ".",
    ]);

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

  it("rejects task:post ok results without a value payload", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-no-value")]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:post", "runs/demo", "ef-no-value", "--status", "ok", "--runs-dir", "."]);

    expect(exitCode).toBe(1);
    expect(commitEffectResultMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith("[task:post] ok results require --value or --value-inline");
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

  it("routes harness:invoke internal through the invoker", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "harness:invoke",
      "internal",
      "--prompt",
      "hello",
      "--model",
      "gpt-5.4",
    ]);

    expect(exitCode).toBe(0);
    expect(invokeHarnessMock).toHaveBeenCalledWith("internal", {
      prompt: "hello",
      workspace: undefined,
      model: "gpt-5.4",
      timeout: undefined,
    });
    expect(logSpy).toHaveBeenCalledWith("ok");
  });

  it("passes the assimilate target through without asking the agent to restate it", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "harness:assimilate",
      "--prompt",
      "oh-my-pi",
      "--interactive",
      "--model",
      "gpt-5.4",
    ]);

    expect(exitCode).toBe(0);
    expect(handleSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        interactive: true,
        model: "gpt-5.4",
        prompt: expect.stringContaining("Target to assimilate: oh-my-pi"),
      }),
    );
    expect(handleSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("do not ask the user to restate the initial prompt"),
      }),
    );
    expect(handleSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Read `binding.dir`"),
      }),
    );
    expect(handleSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("specializations/domains/assimilation/workflows/methodology-assimilation"),
      }),
    );
    expect(handleSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("specializations/domains/assimilation/harness/<name>"),
      }),
    );
  });

  it("renders cleanup prompt details from the synced command template", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "harness:cleanup",
      "--keep-days",
      "14",
      "--dry-run",
      "--prompt",
      "be conservative",
    ]);

    expect(exitCode).toBe(0);
    expect(handleSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("older than 14 days"),
      }),
    );
    expect(handleSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("DRY RUN"),
      }),
    );
    expect(handleSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Additional instructions: be conservative"),
      }),
    );
    expect(handleSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("docs/run-history-insights.md"),
      }),
    );
  });

  it("renders doctor diagnostics from the synced command template", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "harness:doctor",
      "--run-id",
      "run-123",
    ]);

    expect(exitCode).toBe(0);
    expect(handleSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Target run ID: run-123"),
      }),
    );
    expect(handleSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Run Discovery"),
      }),
    );
    expect(handleSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("BABYSITTER DIAGNOSTIC REPORT"),
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
