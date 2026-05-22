import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSessionFilePath } from "../../../../session";
import type { SessionState } from "../../../../session";
import { writeSessionFile } from "../../../../session/write";
import { handleSessionCheckIteration } from "../checkIteration";

describe("handleSessionCheckIteration", () => {
  let stateDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-session-check-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    await fs.rm(stateDir, { recursive: true, force: true });
  });

  async function writeState(state: SessionState, prompt = "Prompt") {
    await writeSessionFile(getSessionFilePath(stateDir, "session-check"), state, prompt);
  }

  it("returns session_not_found when no state file exists", async () => {
    const exitCode = await handleSessionCheckIteration({
      sessionId: "missing",
      stateDir,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(output.reason).toBe("session_not_found");
    expect(output.shouldContinue).toBe(false);
  });

  it("stops when max iterations is reached", async () => {
    await writeState({
      active: true,
      iteration: 4,
      maxIterations: 4,
      runId: "run-max",
      runIds: [],
      startedAt: "2026-01-01T00:00:00Z",
      lastIterationAt: "2026-01-01T00:00:00Z",
      iterationTimes: [],
    });

    const exitCode = await handleSessionCheckIteration({
      sessionId: "session-check",
      stateDir,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(output.reason).toBe("max_iterations_reached");
    expect(output.runId).toBe("run-max");
  });

  it("continues runaway fast iterations", async () => {
    await writeState({
      active: true,
      iteration: 20,
      maxIterations: 50,
      runId: "run-fast",
      runIds: [],
      startedAt: "2026-01-01T00:00:00Z",
      lastIterationAt: new Date(Date.now() - 3000).toISOString().replace(/\.\d{3}Z$/, "Z"),
      iterationTimes: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    });

    const exitCode = await handleSessionCheckIteration({
      sessionId: "session-check",
      stateDir,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(output.shouldContinue).toBe(true);
    expect(output.nextIteration).toBe(21);
  });

  it("continues when below limits", async () => {
    await writeState({
      active: true,
      iteration: 2,
      maxIterations: 10,
      runId: "run-continue",
      runIds: [],
      startedAt: "2026-01-01T00:00:00Z",
      lastIterationAt: "2026-01-01T00:00:00Z",
      iterationTimes: [],
    });

    const exitCode = await handleSessionCheckIteration({
      sessionId: "session-check",
      stateDir,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(output.shouldContinue).toBe(true);
    expect(output.nextIteration).toBe(3);
  });
});

