import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleSessionAssociate } from "../associate";
import { handleSessionCheckIteration } from "../checkIteration";
import { handleSessionInit } from "../init";
import { handleSessionState } from "../state";
import { handleSessionUpdate } from "../update";

describe("session lifecycle commands", () => {
  let stateDir: string;
  let runsDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-session-state-"));
    runsDir = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-session-runs-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    await fs.rm(stateDir, { recursive: true, force: true });
    await fs.rm(runsDir, { recursive: true, force: true });
  });

  it("initializes a session state file", async () => {
    const exitCode = await handleSessionInit({
      sessionId: "session-1",
      stateDir,
      maxIterations: 12,
      prompt: "Start work",
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(output.maxIterations).toBe(12);
    expect(output.stateFile).toContain("session-1");
  });

  it("associates a session with a run and reads it back", async () => {
    await handleSessionInit({
      sessionId: "session-2",
      stateDir,
      json: true,
    });
    logSpy.mockClear();

    const associateCode = await handleSessionAssociate({
      sessionId: "session-2",
      stateDir,
      runId: "run-2",
      json: true,
    });

    expect(associateCode).toBe(0);
    const associateOutput = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(associateOutput.runId).toBe("run-2");

    logSpy.mockClear();
    const stateCode = await handleSessionState({
      sessionId: "session-2",
      stateDir,
      json: true,
    });

    expect(stateCode).toBe(0);
    const stateOutput = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(stateOutput.found).toBe(true);
    expect(stateOutput.state.runId).toBe("run-2");
  });

  it("blocks reassociation without force when already bound", async () => {
    await handleSessionInit({
      sessionId: "session-3",
      stateDir,
      json: true,
    });
    await handleSessionAssociate({
      sessionId: "session-3",
      stateDir,
      runId: "run-3a",
      json: true,
    });
    errorSpy.mockClear();

    const exitCode = await handleSessionAssociate({
      sessionId: "session-3",
      stateDir,
      runId: "run-3b",
      json: true,
    });

    expect(exitCode).toBe(1);
    const error = JSON.parse(String(errorSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(error.error).toBe("RUN_ALREADY_ASSOCIATED");
  });

  it("updates session state", async () => {
    await handleSessionInit({
      sessionId: "session-4",
      stateDir,
      json: true,
    });

    logSpy.mockClear();
    const updateCode = await handleSessionUpdate({
      sessionId: "session-4",
      stateDir,
      iteration: 5,
      iterationTimes: "12,15",
      json: true,
    });

    expect(updateCode).toBe(0);
    const updateOutput = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(updateOutput.state.iteration).toBe(5);
    expect(updateOutput.state.iterationTimes).toEqual([12, 15]);

  });

  it("normalizes explicit state roots consistently across lifecycle commands", async () => {
    const previousGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
    const sessionId = "session-root";
    const canonicalStateFile = path.join(stateDir, "state", `${sessionId}.md`);
    const misplacedStateFile = path.join(stateDir, `${sessionId}.md`);

    try {
      process.env.BABYSITTER_GLOBAL_STATE_DIR = stateDir;

      const initCode = await handleSessionInit({
        sessionId,
        stateDir,
        json: true,
      });
      expect(initCode).toBe(0);
      let output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
      expect(output.stateFile).toBe(canonicalStateFile);

      logSpy.mockClear();
      const associateCode = await handleSessionAssociate({
        sessionId,
        stateDir,
        runId: "run-root",
        json: true,
      });
      expect(associateCode).toBe(0);
      output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
      expect(output.stateFile).toBe(canonicalStateFile);
      expect(output.runId).toBe("run-root");

      logSpy.mockClear();
      const stateCode = await handleSessionState({
        sessionId,
        stateDir,
        json: true,
      });
      expect(stateCode).toBe(0);
      output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
      expect(output.stateFile).toBe(canonicalStateFile);
      expect(output.found).toBe(true);
      expect(output.state.runId).toBe("run-root");

      logSpy.mockClear();
      const updateCode = await handleSessionUpdate({
        sessionId,
        stateDir,
        iteration: 6,
        json: true,
      });
      expect(updateCode).toBe(0);
      output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
      expect(output.stateFile).toBe(canonicalStateFile);
      expect(output.state.iteration).toBe(6);

      logSpy.mockClear();
      const checkCode = await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });
      expect(checkCode).toBe(0);
      output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
      expect(output.found).toBe(true);
      expect(output.runId).toBe("run-root");
      await expect(fs.access(canonicalStateFile)).resolves.toBeUndefined();
      await expect(fs.access(misplacedStateFile)).rejects.toThrow();
    } finally {
      if (previousGlobalStateDir === undefined) {
        delete process.env.BABYSITTER_GLOBAL_STATE_DIR;
      } else {
        process.env.BABYSITTER_GLOBAL_STATE_DIR = previousGlobalStateDir;
      }
    }
  });

  it("uses BABYSITTER_STATE_DIR when no state-dir argument is provided", async () => {
    const previousStateDir = process.env.BABYSITTER_STATE_DIR;
    const sessionId = "session-env";
    const envStateDir = path.join(stateDir, "env-leaf");
    const envStateFile = path.join(envStateDir, `${sessionId}.md`);

    try {
      process.env.BABYSITTER_STATE_DIR = envStateDir;

      const initCode = await handleSessionInit({
        sessionId,
        json: true,
      });
      expect(initCode).toBe(0);
      const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
      expect(output.stateFile).toBe(envStateFile);
      await expect(fs.access(envStateFile)).resolves.toBeUndefined();
    } finally {
      if (previousStateDir === undefined) {
        delete process.env.BABYSITTER_STATE_DIR;
      } else {
        process.env.BABYSITTER_STATE_DIR = previousStateDir;
      }
    }
  });
});

