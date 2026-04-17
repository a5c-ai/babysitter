import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleSessionResume } from "../resume";

describe("handleSessionResume", () => {
  let testDir: string;
  let runsDir: string;
  let stateDir: string;
  const sessionId = "test-session-123";

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `session-resume-test-${Date.now()}`);
    runsDir = path.join(testDir, "runs");
    stateDir = path.join(testDir, "state-root");
    await fs.mkdir(runsDir, { recursive: true });
    await fs.mkdir(stateDir, { recursive: true });
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors.
    }
  });

  it("returns an error when the run does not exist", async () => {
    const result = await handleSessionResume({
      sessionId,
      runId: "non-existent-run",
      stateDir,
      runsDir,
      json: true,
    });

    expect(result).toBe(1);
  });

  it("creates a session state file for an existing run", async () => {
    const runId = "existing-run";
    const runDir = path.join(runsDir, runId);
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(
      path.join(runDir, "run.json"),
      JSON.stringify({ processId: "test-process" }),
      "utf8",
    );

    const result = await handleSessionResume({
      sessionId,
      runId,
      stateDir,
      runsDir,
      json: true,
    });

    expect(result).toBe(0);

    const content = await fs.readFile(path.join(stateDir, `${sessionId}.md`), "utf8");
    expect(content).toContain(`run_id: "${runId}"`);
  });

  it("normalizes a state root to the canonical state subdirectory", async () => {
    const runId = "existing-run-root-state-dir";
    const runDir = path.join(runsDir, runId);
    const previousGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
    const previousStateDir = process.env.BABYSITTER_STATE_DIR;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(
      path.join(runDir, "run.json"),
      JSON.stringify({ processId: "test-process" }),
      "utf8",
    );

    try {
      process.env.BABYSITTER_GLOBAL_STATE_DIR = stateDir;
      process.env.BABYSITTER_STATE_DIR = stateDir;

      const result = await handleSessionResume({
        sessionId,
        runId,
        runsDir,
        json: true,
      });

      expect(result).toBe(0);

      const canonicalStateFile = path.join(stateDir, "state", `${sessionId}.md`);
      const misplacedStateFile = path.join(stateDir, `${sessionId}.md`);
      const content = await fs.readFile(canonicalStateFile, "utf8");
      expect(content).toContain(`run_id: "${runId}"`);
      await expect(fs.access(misplacedStateFile)).rejects.toThrow();
    } finally {
      if (previousGlobalStateDir === undefined) {
        delete process.env.BABYSITTER_GLOBAL_STATE_DIR;
      } else {
        process.env.BABYSITTER_GLOBAL_STATE_DIR = previousGlobalStateDir;
      }
      if (previousStateDir === undefined) {
        delete process.env.BABYSITTER_STATE_DIR;
      } else {
        process.env.BABYSITTER_STATE_DIR = previousStateDir;
      }
    }
  });
});
