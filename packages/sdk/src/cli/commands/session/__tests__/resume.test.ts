import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appendEvent } from "../../../../storage/journal";
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

  it("normalizes an explicit global state root to the canonical state subdirectory", async () => {
    const runId = "existing-run-explicit-root";
    const runDir = path.join(runsDir, runId);
    const previousGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(
      path.join(runDir, "run.json"),
      JSON.stringify({ processId: "test-process" }),
      "utf8",
    );

    try {
      process.env.BABYSITTER_GLOBAL_STATE_DIR = stateDir;

      const result = await handleSessionResume({
        sessionId,
        runId,
        stateDir,
        runsDir,
        json: true,
      });

      expect(result).toBe(0);

      const output = JSON.parse(String(vi.mocked(console.log).mock.calls.at(-1)?.[0] ?? "{}"));
      const canonicalStateFile = path.join(stateDir, "state", `${sessionId}.md`);
      const misplacedStateFile = path.join(stateDir, `${sessionId}.md`);
      expect(output.stateFile).toBe(canonicalStateFile);

      const content = await fs.readFile(canonicalStateFile, "utf8");
      expect(content).toContain("active: true");
      expect(content).toContain(`run_id: "${runId}"`);
      await expect(fs.access(misplacedStateFile)).rejects.toThrow();
    } finally {
      if (previousGlobalStateDir === undefined) {
        delete process.env.BABYSITTER_GLOBAL_STATE_DIR;
      } else {
        process.env.BABYSITTER_GLOBAL_STATE_DIR = previousGlobalStateDir;
      }
    }
  });

  it("normalizes documented relative .a5c state root to the canonical state subdirectory", async () => {
    const runId = "existing-run-relative-root";
    const runDir = path.join(runsDir, runId);
    const relativeRoot = ".a5c";
    const globalRoot = path.join(testDir, relativeRoot);
    const previousGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
    const previousCwd = process.cwd();
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.mkdir(globalRoot, { recursive: true });
    await fs.writeFile(
      path.join(runDir, "run.json"),
      JSON.stringify({ processId: "test-process" }),
      "utf8",
    );

    try {
      process.env.BABYSITTER_GLOBAL_STATE_DIR = globalRoot;
      process.chdir(testDir);

      const result = await handleSessionResume({
        sessionId,
        runId,
        stateDir: relativeRoot,
        runsDir,
        json: true,
      });

      expect(result).toBe(0);

      const output = JSON.parse(String(vi.mocked(console.log).mock.calls.at(-1)?.[0] ?? "{}"));
      const canonicalStateFile = path.join(globalRoot, "state", `${sessionId}.md`);
      const misplacedStateFile = path.join(globalRoot, `${sessionId}.md`);
      expect(output.stateFile).toBe(canonicalStateFile);

      const content = await fs.readFile(canonicalStateFile, "utf8");
      expect(content).toContain("active: true");
      expect(content).toContain(`run_id: "${runId}"`);
      await expect(fs.access(misplacedStateFile)).rejects.toThrow();
    } finally {
      process.chdir(previousCwd);
      if (previousGlobalStateDir === undefined) {
        delete process.env.BABYSITTER_GLOBAL_STATE_DIR;
      } else {
        process.env.BABYSITTER_GLOBAL_STATE_DIR = previousGlobalStateDir;
      }
    }
  });

  it("does not treat a run as completed when pending work exists after RUN_COMPLETED", async () => {
    const runId = "existing-run-with-pending";
    const runDir = path.join(runsDir, runId);
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(
      path.join(runDir, "run.json"),
      JSON.stringify({ processId: "test-process" }),
      "utf8",
    );
    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId } });
    await appendEvent({ runDir, eventType: "RUN_COMPLETED", event: { outputRef: "state/output.json" } });
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId: "effect-1",
        invocationKey: "effect-1:inv",
        stepId: "step-1",
        taskId: "task/agent",
        kind: "agent",
      },
    });

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

  it("normalizes an explicit state root to the canonical state subdirectory", async () => {
    const runId = "existing-run-explicit-root-state-dir";
    const runDir = path.join(runsDir, runId);
    const previousGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(
      path.join(runDir, "run.json"),
      JSON.stringify({ processId: "test-process" }),
      "utf8",
    );

    try {
      process.env.BABYSITTER_GLOBAL_STATE_DIR = stateDir;

      const result = await handleSessionResume({
        sessionId,
        runId,
        stateDir,
        runsDir,
        json: true,
      });

      expect(result).toBe(0);

      const canonicalStateFile = path.join(stateDir, "state", `${sessionId}.md`);
      const misplacedStateFile = path.join(stateDir, `${sessionId}.md`);
      const output = JSON.parse(String(vi.mocked(console.log).mock.calls.at(-1)?.[0] ?? "{}"));
      expect(output.stateFile).toBe(canonicalStateFile);
      const content = await fs.readFile(canonicalStateFile, "utf8");
      expect(content).toContain(`run_id: "${runId}"`);
      await expect(fs.access(misplacedStateFile)).rejects.toThrow();
    } finally {
      if (previousGlobalStateDir === undefined) {
        delete process.env.BABYSITTER_GLOBAL_STATE_DIR;
      } else {
        process.env.BABYSITTER_GLOBAL_STATE_DIR = previousGlobalStateDir;
      }
    }
  });

  it("normalizes documented relative .a5c state roots to the canonical state subdirectory", async () => {
    const runId = "existing-run-relative-root-state-dir";
    const runDir = path.join(runsDir, runId);
    const relativeRoot = path.join(testDir, ".a5c");
    const previousGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
    const previousCwd = process.cwd();
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.mkdir(relativeRoot, { recursive: true });
    await fs.writeFile(
      path.join(runDir, "run.json"),
      JSON.stringify({ processId: "test-process" }),
      "utf8",
    );

    try {
      process.env.BABYSITTER_GLOBAL_STATE_DIR = relativeRoot;
      process.chdir(testDir);

      const result = await handleSessionResume({
        sessionId,
        runId,
        stateDir: ".a5c",
        runsDir,
        json: true,
      });

      expect(result).toBe(0);

      const canonicalStateFile = path.join(relativeRoot, "state", `${sessionId}.md`);
      const misplacedStateFile = path.join(relativeRoot, `${sessionId}.md`);
      const output = JSON.parse(String(vi.mocked(console.log).mock.calls.at(-1)?.[0] ?? "{}"));
      expect(output.stateFile).toBe(canonicalStateFile);
      const content = await fs.readFile(canonicalStateFile, "utf8");
      expect(content).toContain(`run_id: "${runId}"`);
      await expect(fs.access(misplacedStateFile)).rejects.toThrow();
    } finally {
      process.chdir(previousCwd);
      if (previousGlobalStateDir === undefined) {
        delete process.env.BABYSITTER_GLOBAL_STATE_DIR;
      } else {
        process.env.BABYSITTER_GLOBAL_STATE_DIR = previousGlobalStateDir;
      }
    }
  });
});
