import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import path from "path";
import os from "os";
import { promises as fs } from "fs";
import { createBabysitterCli } from "../main";
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

const buildEffectIndexMock = buildEffectIndex as unknown as ReturnType<typeof vi.fn>;
const readRunMetadataMock = readRunMetadata as unknown as ReturnType<typeof vi.fn>;
const commitEffectResultMock = commitEffectResult as unknown as ReturnType<typeof vi.fn>;

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
    expect(helpText).toContain("babysitter session:init");
    expect(helpText).toContain("--help-human");
  });

  it("exposes the human usage block separately", () => {
    const cli = createBabysitterCli();
    const helpText = cli.formatHumanHelp();

    expect(helpText).toContain("Usage:");
    expect(helpText).toContain("babysitter session:resume");
    expect(helpText).toContain("babysitter harness:install");
    expect(helpText).toContain("babysitter session:whoami");
    expect(helpText).toContain("babysitter session:cleanup");
    expect(helpText).toContain("@a5c-ai/babysitter-agent");
    expect(helpText).not.toContain("babysitter-harness session:init");
    expect(helpText).not.toContain("babysitter run:create");
  });

  it("supports session:init from the core babysitter CLI", async () => {
    const cli = createBabysitterCli();
    const tmpStateDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-session-init-state-"));

    try {
      const exitCode = await cli.run([
        "session:init",
        "--session-id",
        "sess-init-1",
        "--state-dir",
        tmpStateDir,
        "--run-id",
        "run-init-1",
        "--prompt",
        "Initialize this session",
        "--json",
      ]);

      expect(exitCode).toBe(0);
      const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
      expect(output.runId).toBe("run-init-1");
      expect(output.stateFile).toContain("sess-init-1");
    } finally {
      await fs.rm(tmpStateDir, { recursive: true, force: true });
    }
  });

  it("supports session:associate from the core babysitter CLI", async () => {
    const cli = createBabysitterCli();
    const tmpStateDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-session-associate-state-"));

    try {
      await cli.run([
        "session:init",
        "--session-id",
        "sess-assoc-1",
        "--state-dir",
        tmpStateDir,
        "--json",
      ]);
      logSpy.mockClear();

      const exitCode = await cli.run([
        "session:associate",
        "--session-id",
        "sess-assoc-1",
        "--state-dir",
        tmpStateDir,
        "--run-id",
        "run-assoc-1",
        "--json",
      ]);

      expect(exitCode).toBe(0);
      const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
      expect(output.runId).toBe("run-assoc-1");
    } finally {
      await fs.rm(tmpStateDir, { recursive: true, force: true });
    }
  });

  it("supports session:whoami from the core babysitter CLI", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run(["session:whoami", "--json"]);

    expect(exitCode).toBe(0);
    const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(output).toHaveProperty("resolvedFrom");
    expect(output).toHaveProperty("harness");
  });

  it("supports session:cleanup from the core babysitter CLI", async () => {
    const cli = createBabysitterCli();
    const tmpStateDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-session-cleanup-"));
    const previousGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;

    process.env.BABYSITTER_GLOBAL_STATE_DIR = tmpStateDir;
    try {
      const exitCode = await cli.run(["session:cleanup", "--dry-run", "--json"]);

      expect(exitCode).toBe(0);
      const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
      expect(output.markersRemoved).toEqual([]);
      expect(output.statesDeactivated).toEqual([]);
      expect(output.dryRun).toBe(true);
    } finally {
      if (previousGlobalStateDir === undefined) {
        delete process.env.BABYSITTER_GLOBAL_STATE_DIR;
      } else {
        process.env.BABYSITTER_GLOBAL_STATE_DIR = previousGlobalStateDir;
      }
      await fs.rm(tmpStateDir, { recursive: true, force: true });
    }
  });

  it("supports session:resume from the core babysitter CLI", async () => {
    const cli = createBabysitterCli();
    const tmpStateDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-session-resume-state-"));
    const tmpRunsDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-session-resume-runs-"));
    const runId = "resume-run-1";
    const runDir = path.join(tmpRunsDir, runId);
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(
      path.join(runDir, "run.json"),
      JSON.stringify({ processId: "process/demo" }, null, 2),
      "utf8",
    );
    await fs.writeFile(
      path.join(runDir, "journal", "000001.test.json"),
      JSON.stringify({ type: "RUN_CREATED" }, null, 2),
      "utf8",
    );

    try {
      const exitCode = await cli.run([
        "session:resume",
        "--session-id",
        "sess-1",
        "--state-dir",
        tmpStateDir,
        "--run-id",
        runId,
        "--runs-dir",
        tmpRunsDir,
        "--json",
      ]);

      expect(exitCode).toBe(0);
      const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
      expect(output.runId).toBe(runId);
      expect(output.processId).toBe("process/demo");
      expect(output.stateFile).toContain("sess-1");
    } finally {
      await fs.rm(tmpStateDir, { recursive: true, force: true });
      await fs.rm(tmpRunsDir, { recursive: true, force: true });
    }
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

  it("prints human help when --help-human is requested", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run(["--help-human"]);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(cli.formatHumanHelp());
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

  it("normalizes shell task error posts into success:false shell results", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-task-post-shell-error-"));
    const errorPath = path.join(tmpDir, "error.json");
    await fs.writeFile(
      errorPath,
      JSON.stringify({
        exitCode: 2,
        stderr: "tsc failed",
      }),
      "utf8",
    );
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([shellEffectRecord("ef-shell-err")]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:post",
      "runs/demo",
      "ef-shell-err",
      "--status",
      "error",
      "--error",
      errorPath,
      "--runs-dir",
      ".",
    ]);

    expect(exitCode).toBe(0);
    expect(commitEffectResultMock).toHaveBeenCalledWith(
      expect.objectContaining({
        effectId: "ef-shell-err",
        result: {
          status: "ok",
          value: {
            success: false,
            exitCode: 2,
            stdout: "",
            stderr: "tsc failed",
            error: "Shell command exited with code 2",
          },
          stdout: undefined,
          stderr: undefined,
          stdoutRef: undefined,
          stderrRef: undefined,
          startedAt: expect.any(String),
          finishedAt: expect.any(String),
          metadata: undefined,
        },
      }),
    );
    expect(logSpy).toHaveBeenCalledWith(
      "[task:post] status=ok normalizedShellFailure=true stdoutRef=tasks/mock/stdout.log stderrRef=tasks/mock/stderr.log resultRef=tasks/mock/result.json"
    );

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("rejects task:post ok results without a value payload", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-no-value")]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run(["task:post", "runs/demo", "ef-no-value", "--status", "ok", "--runs-dir", "."]);

    expect(exitCode).toBe(1);
    expect(commitEffectResultMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith("[task:post] ok results require --value or --value-inline");
  });

  it("reports create-run as moved when called from the core babysitter CLI", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "create-run",
      "--process",
      "/tmp/generated-process.mjs",
    ]);

    expect(exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalled();
    expect(String(errorSpy.mock.calls[0]?.[0] ?? "")).toContain("@a5c-ai/babysitter-agent");
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

function shellEffectRecord(effectId: string, overrides: Partial<EffectRecord> = {}): EffectRecord {
  return nodeEffectRecord(effectId, {
    kind: "shell",
    taskId: "task/shell",
    ...overrides,
  });
}

function mockEffectIndex(records: EffectRecord[]) {
  return {
    listEffects: () => records,
    listPendingEffects: () => records.filter((record) => record.status === "requested"),
    getByEffectId: (effectId: string) => records.find((record) => record.effectId === effectId),
  };
}
