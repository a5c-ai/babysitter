import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { createHash } from "node:crypto";
import path from "path";
import os from "os";
import { promises as fs } from "fs";
import { Readable } from "node:stream";
import { createBabysitterCli } from "../main";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";
import { readRunMetadata } from "../../storage/runFiles";
import { commitEffectResult } from "../../runtime/commitEffectResult";
import type { EffectRecord } from "../../runtime/types";
import { RunFailedError } from "../../runtime/exceptions";

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
const MAX_CHECKSUM_BOUND_FILE_BYTES = 1024 * 1024;
const commitEffectResultMock = commitEffectResult as unknown as ReturnType<typeof vi.fn>;

async function withStdin<T>(payload: string, run: () => Promise<T>): Promise<T> {
  const originalStdin = process.stdin;
  const stdin = Readable.from([payload], { encoding: "utf8" });
  Object.defineProperty(process, "stdin", {
    value: stdin,
    writable: true,
    configurable: true,
  });
  try {
    return await run();
  } finally {
    Object.defineProperty(process, "stdin", {
      value: originalStdin,
      writable: true,
      configurable: true,
    });
  }
}

describe("CLI main entry", () => {
  let logSpy: MockInstance<typeof console.log>;
  let errorSpy: MockInstance<typeof console.error>;

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
    expect(helpText).toContain("@a5c-ai/genty-platform");
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

  it.each([
    {
      status: "ok",
      flag: "--value",
      payload: '{"approved":true}',
      exitCode: 0,
      expected: { status: "ok", value: { approved: true } },
    },
    {
      status: "error",
      flag: "--error",
      payload: '{"name":"Error","message":"bound failure","data":{"code":"BOUND"}}',
      exitCode: 1,
      expected: {
        status: "error",
        error: { name: "Error", message: "bound failure", data: { code: "BOUND" } },
      },
    },
  ])("reads authoritative task:post $status JSON from stdin when the selector is '-'", async ({
    status,
    flag,
    payload,
    expected,
    exitCode: expectedExitCode,
  }) => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord(`ef-stdin-${status}`)]));
    const cli = createBabysitterCli();

    const exitCode = await withStdin(payload, () => cli.run([
      "task:post",
      "runs/demo",
      `ef-stdin-${status}`,
      "--status",
      status,
      flag,
      "-",
      "--runs-dir",
      ".",
    ]));

    expect(exitCode).toBe(expectedExitCode);
    expect(commitEffectResultMock).toHaveBeenCalledWith(
      expect.objectContaining({
        effectId: `ef-stdin-${status}`,
        result: expect.objectContaining(expected),
      }),
    );
  });

  it.each([
    {
      status: "ok",
      fileFlag: "--value",
      checksumFlag: "--value-sha256",
      payload: Buffer.from('{"approved":true}\n'),
      expected: { status: "ok", value: { approved: true } },
      exitCode: 0,
    },
    {
      status: "error",
      fileFlag: "--error",
      checksumFlag: "--error-sha256",
      payload: Buffer.from('{"name":"BoundError","message":"exact failure","data":{"code":"BOUND"}}\n'),
      expected: {
        status: "error",
        error: { name: "BoundError", message: "exact failure", data: { code: "BOUND" } },
      },
      exitCode: 1,
    },
  ])("verifies exact task:post $status file bytes before commit", async ({
    status,
    fileFlag,
    checksumFlag,
    payload,
    expected,
    exitCode: expectedExitCode,
  }) => {
    const effectId = `ef-checksum-${status}`;
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord(effectId)]));
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `cli-task-post-checksum-${status}-`));
    const inputPath = path.join(tmpDir, "input.json");
    await fs.writeFile(inputPath, payload);
    try {
      const exitCode = await createBabysitterCli().run([
        "task:post",
        "runs/demo",
        effectId,
        "--status",
        status,
        fileFlag,
        inputPath,
        checksumFlag,
        createHash("sha256").update(payload).digest("hex"),
        "--runs-dir",
        ".",
      ]);

      expect(exitCode).toBe(expectedExitCode);
      expect(commitEffectResultMock).toHaveBeenCalledWith(
        expect.objectContaining({
          effectId,
          result: expect.objectContaining(expected),
        }),
      );
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it.each([
    { status: "ok", fileFlag: "--value", checksumFlag: "--value-sha256", size: MAX_CHECKSUM_BOUND_FILE_BYTES - 1 },
    { status: "error", fileFlag: "--error", checksumFlag: "--error-sha256", size: MAX_CHECKSUM_BOUND_FILE_BYTES },
  ])("accepts checksum-bound $status files at $size bytes", async ({
    status,
    fileFlag,
    checksumFlag,
    size,
  }) => {
    const effectId = `ef-checksum-limit-${status}`;
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord(effectId)]));
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `cli-task-post-limit-${status}-`));
    const inputPath = path.join(tmpDir, "input.json");
    const prefix = status === "ok" ? '{"padding":"' : '{"name":"Error","message":"';
    const suffix = '"}\n';
    const bytes = Buffer.from(prefix + "x".repeat(size - prefix.length - suffix.length) + suffix);
    await fs.writeFile(inputPath, bytes);
    try {
      const exitCode = await createBabysitterCli().run([
        "task:post",
        "runs/demo",
        effectId,
        "--status",
        status,
        fileFlag,
        inputPath,
        checksumFlag,
        createHash("sha256").update(bytes).digest("hex"),
        "--runs-dir",
        ".",
      ]);
      expect(exitCode).toBe(status === "ok" ? 0 : 1);
      expect(commitEffectResultMock).toHaveBeenCalledOnce();
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it.each([
    { label: "limit plus one", size: MAX_CHECKSUM_BOUND_FILE_BYTES + 1 },
    { label: "huge sparse file", size: MAX_CHECKSUM_BOUND_FILE_BYTES * 1024 },
  ])("rejects an oversized checksum-bound $label before commit", async ({ size }) => {
    const effectId = `ef-checksum-oversize-${size}`;
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord(effectId)]));
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-task-post-oversize-"));
    const inputPath = path.join(tmpDir, "input.json");
    const handle = await fs.open(inputPath, "w");
    await handle.truncate(size);
    await handle.close();
    try {
      const exitCode = await createBabysitterCli().run([
        "task:post",
        "runs/demo",
        effectId,
        "--status",
        "ok",
        "--value",
        inputPath,
        "--value-sha256",
        "0".repeat(64),
        "--runs-dir",
        ".",
      ]);
      expect(exitCode).toBe(1);
      expect(commitEffectResultMock).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/too large|maximum|bytes/i));
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it.each([
    { label: "final", ancestor: false },
    { label: "ancestor", ancestor: true },
  ])("rejects a checksum-bound $label symlink before commit", async ({ label, ancestor }) => {
    const effectId = `ef-checksum-symlink-${label}`;
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord(effectId)]));
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `cli-task-post-${label}-symlink-`));
    const realDir = path.join(tmpDir, "real");
    const selectedDir = ancestor ? path.join(tmpDir, "selected") : realDir;
    await fs.mkdir(realDir);
    const realPath = path.join(realDir, "input.json");
    const bytes = Buffer.from('{"safe":true}\n');
    await fs.writeFile(realPath, bytes);
    if (ancestor) await fs.symlink(realDir, selectedDir, "dir");
    const inputPath = ancestor ? path.join(selectedDir, "input.json") : path.join(tmpDir, "input.json");
    if (!ancestor) await fs.symlink(realPath, inputPath, "file");
    try {
      const exitCode = await createBabysitterCli().run([
        "task:post",
        "runs/demo",
        effectId,
        "--status",
        "ok",
        "--value",
        inputPath,
        "--value-sha256",
        createHash("sha256").update(bytes).digest("hex"),
        "--runs-dir",
        ".",
      ]);
      expect(exitCode).toBe(1);
      expect(commitEffectResultMock).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/symbolic link/i));
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it.each([
    { label: "growth", mutation: "growth" },
    { label: "replacement", mutation: "replacement" },
    { label: "ancestor replacement", mutation: "ancestor" },
  ])("rejects checksum-bound file $label during authenticated read", async ({ label, mutation }) => {
    const effectId = `ef-checksum-race-${label}`;
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord(effectId)]));
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `cli-task-post-${label}-race-`));
    const inputPath = path.join(tmpDir, "input.json");
    const initialBytes = Buffer.from('{"bound":"initial"}\n');
    await fs.writeFile(inputPath, initialBytes);
    const selectedPath = await fs.realpath(inputPath);
    const originalOpen = fs.open.bind(fs);
    const openSpy = vi.spyOn(fs, "open").mockImplementation(async (...args) => {
      const handle = await originalOpen(...args);
      if (path.resolve(String(args[0])) !== selectedPath) return handle;
      const originalRead = handle.read.bind(handle);
      let mutated = false;
      handle.read = (async (...readArgs: Parameters<typeof handle.read>) => {
        const result = await originalRead(...readArgs);
        if (!mutated) {
          mutated = true;
          if (mutation === "replacement") {
            const replacement = `${inputPath}.replacement`;
            await fs.writeFile(replacement, initialBytes);
            await fs.rename(replacement, inputPath);
          } else if (mutation === "ancestor") {
            const replacementDir = `${tmpDir}.replacement`;
            await fs.mkdir(replacementDir);
            await fs.writeFile(path.join(replacementDir, "input.json"), initialBytes);
            await fs.rename(tmpDir, `${tmpDir}.original`);
            await fs.rename(replacementDir, tmpDir);
          } else {
            await fs.appendFile(inputPath, " ");
          }
        }
        return result;
      }) as typeof handle.read;
      return handle;
    });
    try {
      const exitCode = await createBabysitterCli().run([
        "task:post",
        "runs/demo",
        effectId,
        "--status",
        "ok",
        "--value",
        inputPath,
        "--value-sha256",
        createHash("sha256").update(initialBytes).digest("hex"),
        "--runs-dir",
        ".",
      ]);
      expect(exitCode).toBe(1);
      expect(commitEffectResultMock).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/changed/i));
    } finally {
      openSpy.mockRestore();
      await fs.rm(tmpDir, { recursive: true, force: true });
      await fs.rm(`${tmpDir}.original`, { recursive: true, force: true });
    }
  });

  it.each([
    { status: "ok", fileFlag: "--value", checksumFlag: "--value-sha256" },
    { status: "error", fileFlag: "--error", checksumFlag: "--error-sha256" },
  ])("rejects replaced task:post $status file bytes before commit", async ({
    status,
    fileFlag,
    checksumFlag,
  }) => {
    const effectId = `ef-checksum-replaced-${status}`;
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord(effectId)]));
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `cli-task-post-replaced-${status}-`));
    const inputPath = path.join(tmpDir, "input.json");
    const authenticatedBytes = Buffer.from('{"bound":"authenticated"}\n');
    await fs.writeFile(inputPath, Buffer.from('{"attacker":"replacement"}\n'));
    try {
      const exitCode = await createBabysitterCli().run([
        "task:post",
        "runs/demo",
        effectId,
        "--status",
        status,
        fileFlag,
        inputPath,
        checksumFlag,
        createHash("sha256").update(authenticatedBytes).digest("hex"),
        "--runs-dir",
        ".",
      ]);

      expect(exitCode).toBe(1);
      expect(commitEffectResultMock).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/checksum/i));
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it.each([
    { status: "ok", fileFlag: "--value", checksumFlag: "--value-sha256" },
    { status: "error", fileFlag: "--error", checksumFlag: "--error-sha256" },
  ])("rejects malformed checksum-bound $status JSON before commit", async ({
    status,
    fileFlag,
    checksumFlag,
  }) => {
    const effectId = `ef-checksum-malformed-${status}`;
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord(effectId)]));
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `cli-task-post-malformed-${status}-`));
    const inputPath = path.join(tmpDir, "input.json");
    const bytes = Buffer.from("{not-json\n");
    await fs.writeFile(inputPath, bytes);
    try {
      const exitCode = await createBabysitterCli().run([
        "task:post",
        "runs/demo",
        effectId,
        "--status",
        status,
        fileFlag,
        inputPath,
        checksumFlag,
        createHash("sha256").update(bytes).digest("hex"),
        "--runs-dir",
        ".",
      ]);

      expect(exitCode).toBe(1);
      expect(commitEffectResultMock).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/json|unexpected|property/i));
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it.each([
    {
      name: "invalid checksum syntax",
      args: ["--status", "ok", "--value", "value.json", "--value-sha256", "ABC"],
      diagnostic: /sha-?256|checksum/i,
    },
    {
      name: "value checksum without value file",
      args: ["--status", "ok", "--value-inline", "{}", "--value-sha256", "0".repeat(64)],
      diagnostic: /value-sha256.*value/i,
    },
    {
      name: "error checksum without error file",
      args: ["--status", "error", "--error-sha256", "0".repeat(64)],
      diagnostic: /error-sha256.*error/i,
    },
    {
      name: "value checksum with error status",
      args: ["--status", "error", "--value", "value.json", "--value-sha256", "0".repeat(64)],
      diagnostic: /status|value/i,
    },
    {
      name: "error checksum with ok status",
      args: ["--status", "ok", "--error", "error.json", "--error-sha256", "0".repeat(64)],
      diagnostic: /status|error/i,
    },
  ])("rejects task:post checksum ambiguity: $name", async ({ args, diagnostic }) => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-checksum-invalid")]));

    const exitCode = await createBabysitterCli().run([
      "task:post",
      "runs/demo",
      "ef-checksum-invalid",
      ...args,
      "--runs-dir",
      ".",
    ]);

    expect(exitCode).toBe(1);
    expect(commitEffectResultMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(diagnostic));
  });

  it("exits non-zero and reports structured validation errors from task:post", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([shellEffectRecord("ef-schema")]));
    commitEffectResultMock.mockRejectedValue(
      new RunFailedError("Shell task result failed outputSchema validation for effect ef-schema", {
        details: {
          reason: "validation_error",
          effectId: "ef-schema",
          taskId: "task/shell",
          kind: "shell",
          errors: ["Missing required field: checks"],
        },
      }),
    );

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:post",
      "runs/demo",
      "ef-schema",
      "--status",
      "ok",
      "--value-inline",
      '{"verified":true}',
      "--json",
      "--runs-dir",
      ".",
    ]);

    expect(exitCode).toBe(1);
    const errorPayload = JSON.parse(String(errorSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(errorPayload).toMatchObject({
      name: "RunFailedError",
      details: {
        reason: "validation_error",
        effectId: "ef-schema",
        errors: ["Missing required field: checks"],
      },
    });
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

  it("preserves shell task error posts as failed effects", async () => {
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

    expect(exitCode).toBe(1);
    expect(commitEffectResultMock).toHaveBeenCalledWith(
      expect.objectContaining({
        effectId: "ef-shell-err",
        result: {
          status: "error",
          error: {
            exitCode: 2,
            stderr: "tsc failed",
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
      "[task:post] status=error stdoutRef=tasks/mock/stdout.log stderrRef=tasks/mock/stderr.log resultRef=tasks/mock/result.json"
    );

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("#936: tolerates a non-JSON --error file (wraps as structured error, no cryptic SyntaxError)", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-task-post-nonjson-error-"));
    const errorPath = path.join(tmpDir, "error.txt");
    // A bare, NON-JSON error string — exactly what String(new Error("Effect failed"))
    // produces. Pre-fix this threw `Unexpected token 'E', "Error: Effect failed"
    // is not valid JSON` categorized as an internal "please report as a bug".
    await fs.writeFile(errorPath, "Error: Effect failed", "utf8");
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-nonjson")]));
    commitEffectResultMock.mockResolvedValue({
      resultRef: "tasks/ef-nonjson/result.json",
      startedAt: "2026-01-20T00:00:00.000Z",
      finishedAt: "2026-01-20T00:00:01.000Z",
    });

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:post",
      "runs/demo",
      "ef-nonjson",
      "--status",
      "error",
      "--error",
      errorPath,
      "--runs-dir",
      ".",
    ]);

    // Exit 1 is the expected status for an error post — NOT a thrown SyntaxError.
    expect(exitCode).toBe(1);
    expect(commitEffectResultMock).toHaveBeenCalledWith(
      expect.objectContaining({
        effectId: "ef-nonjson",
        result: expect.objectContaining({
          status: "error",
          // The bare string is wrapped structurally; the leading "Error: " is
          // stripped so the surfaced message is the underlying failure.
          error: { name: "Error", message: "Effect failed" },
        }),
      }),
    );

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("supports --effect-id flag form for task:post", async () => {
    buildEffectIndexMock.mockResolvedValue(mockEffectIndex([nodeEffectRecord("ef-flag")]));

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "task:post",
      "runs/demo",
      "--effect-id",
      "ef-flag",
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
        effectId: "ef-flag",
      })
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

  it("reports create-run as moved when called from the core babysitter CLI", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "create-run",
      "--process",
      "/tmp/generated-process.mjs",
    ]);

    expect(exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalled();
    expect(String(errorSpy.mock.calls[0]?.[0] ?? "")).toContain("@a5c-ai/genty-platform");
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
