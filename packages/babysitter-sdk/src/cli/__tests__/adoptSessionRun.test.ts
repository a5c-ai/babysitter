import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRunDir } from "../../storage/createRunDir";
import { appendEvent } from "../../storage/journal";
import { readRunMetadata, writeRunMetadata } from "../../storage/runFiles";
import { getSessionFilePath } from "../../session/parse";
import { writeSessionFile } from "../../session/write";
import { findAdoptableSessionRun } from "../main/adoptSessionRun";

describe("findAdoptableSessionRun", () => {
  let rootDir: string;
  let runsDir: string;
  let stateDir: string;

  beforeEach(async () => {
    rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "adopt-session-run-"));
    runsDir = path.join(rootDir, "runs");
    stateDir = path.join(rootDir, "state");
  });

  afterEach(async () => {
    await fs.rm(rootDir, { recursive: true, force: true });
  });

  it("rejects a bare run from another project", async () => {
    const runId = "01AAAAAAAAAAAAAAAAAAAAAAAA";
    const runDir = await createBoundRun(runId);
    const metadata = await readRunMetadata(runDir);
    metadata.cwd = path.join(rootDir, "other-project");
    await writeRunMetadata(runDir, metadata);

    await expect(findAdoptableSessionRun(defaultOptions(runId))).resolves.toBeUndefined();
  });

  it("rejects a terminal bare run", async () => {
    const runId = "01BBBBBBBBBBBBBBBBBBBBBBBB";
    const runDir = await createBoundRun(runId);
    await appendEvent({
      runDir,
      eventType: "RUN_COMPLETED",
      event: { runId },
    });

    await expect(findAdoptableSessionRun(defaultOptions(runId))).resolves.toBeUndefined();
  });

  it("rejects a session run that already has a process", async () => {
    const runId = "01CCCCCCCCCCCCCCCCCCCCCCCC";
    await createBoundRun(runId, {
      processId: "existing/process",
      entrypoint: { importPath: "process.mjs", exportName: "process" },
    });

    await expect(findAdoptableSessionRun(defaultOptions(runId))).resolves.toBeUndefined();
  });

  async function createBoundRun(
    runId: string,
    options: {
      processId?: string;
      entrypoint?: { importPath: string; exportName?: string };
    } = {},
  ): Promise<string> {
    const processId = options.processId ?? "bare-run";
    const entrypoint = options.entrypoint ?? { importPath: "bare-run" };
    const runDir = path.join(runsDir, runId);
    await createRunDir({
      runsRoot: runsDir,
      runId,
      request: runId,
      processId,
      harness: "unified",
      entrypoint,
      processPath: entrypoint.importPath,
    });
    await appendEvent({
      runDir,
      eventType: "RUN_CREATED",
      event: { runId, processId, entrypoint, harness: "unified" },
    });
    await writeSessionFile(getSessionFilePath(stateDir, `session-${runId}`), {
      active: true,
      iteration: 1,
      maxIterations: 65_000,
      runId,
      runIds: [runId],
      startedAt: "2026-08-11T00:00:00Z",
      lastIterationAt: "2026-08-11T00:00:00Z",
      iterationTimes: [],
    }, "");
    return runDir;
  }

  function defaultOptions(runId: string) {
    return {
      runsDir,
      stateDir,
      sessionId: `session-${runId}`,
      harness: "unified",
    };
  }
});
