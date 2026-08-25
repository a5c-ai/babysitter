import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appendEvent } from "../../../../storage/journal";
import { readSessionFile, writeSessionFile } from "../../../../session";
import { handleSessionResume } from "../resume";

describe("handleSessionResume", () => {
  let testDir: string;
  let runsDir: string;
  let stateDir: string;
  const sessionId = "test-session-123";
  let previousRunsDir: string | undefined;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `session-resume-test-${Date.now()}`);
    runsDir = path.join(testDir, "runs");
    stateDir = path.join(testDir, "state-root");
    await fs.mkdir(runsDir, { recursive: true });
    await fs.mkdir(stateDir, { recursive: true });
    previousRunsDir = process.env.BABYSITTER_RUNS_DIR;
    process.env.BABYSITTER_RUNS_DIR = runsDir;
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (previousRunsDir === undefined) delete process.env.BABYSITTER_RUNS_DIR;
    else process.env.BABYSITTER_RUNS_DIR = previousRunsDir;
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors.
    }
  });

  async function seedSessionOwnership(runId: string): Promise<void> {
    const now = "2026-08-21T00:00:00.000Z";
    const runDir = await fs.realpath(path.join(runsDir, runId));
    await writeSessionFile(path.join(stateDir, `${sessionId}.md`), {
      active: true,
      iteration: 1,
      maxIterations: 65_000,
      runId,
      runDir,
      runIds: [runId],
      startedAt: now,
      lastIterationAt: now,
      iterationTimes: [],
    }, "legacy session ownership");
  }

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

  it("resumes an OMP run through the deterministic driver instead of the manual posting loop", async () => {
    const runId = "existing-omp-run";
    const runDir = path.join(runsDir, runId);
    const previousOmpSessionId = process.env.OMP_SESSION_ID;
    const previousBabysitterSessionId = process.env.BABYSITTER_SESSION_ID;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(
      path.join(runDir, "run.json"),
      JSON.stringify({
        runId,
        processId: "test-process",
        harness: "oh-my-pi",
        sessionBinding: { harness: "oh-my-pi", sessionId },
      }),
      "utf8",
    );
    await seedSessionOwnership(runId);

    try {
      process.env.OMP_SESSION_ID = sessionId;
      process.env.BABYSITTER_SESSION_ID = sessionId;
      delete process.env.BABYSITTER_RUNS_DIR;
      const result = await handleSessionResume({ sessionId, runId, stateDir, runsDir, json: true });

      expect(result).toBe(0);
      const content = await fs.readFile(path.join(stateDir, `${sessionId}.md`), "utf8");
      expect(content).toContain("babysitter_drive");
      expect(content).toContain("Do not invoke task:post or run:iterate manually");
      expect(content).not.toContain("Continue orchestration using run:iterate, task:post");
    } finally {
      if (previousOmpSessionId === undefined) delete process.env.OMP_SESSION_ID;
      else process.env.OMP_SESSION_ID = previousOmpSessionId;
      if (previousBabysitterSessionId === undefined) delete process.env.BABYSITTER_SESSION_ID;
      else process.env.BABYSITTER_SESSION_ID = previousBabysitterSessionId;
    }
  });

  it("rejects an OMP run owned by a different session", async () => {
    const runId = "foreign-omp-run";
    const runDir = path.join(runsDir, runId);
    const previousOmpSessionId = process.env.OMP_SESSION_ID;
    const previousBabysitterSessionId = process.env.BABYSITTER_SESSION_ID;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify({
      processId: "test-process",
      harness: "oh-my-pi",
      sessionBinding: { harness: "oh-my-pi", sessionId: "other-session" },
    }), "utf8");

    try {
      process.env.OMP_SESSION_ID = sessionId;
      process.env.BABYSITTER_SESSION_ID = sessionId;
      const result = await handleSessionResume({ sessionId, runId, stateDir, runsDir, json: true });

      expect(result).toBe(1);
      await expect(fs.access(path.join(stateDir, `${sessionId}.md`))).rejects.toThrow();
    } finally {
      if (previousOmpSessionId === undefined) delete process.env.OMP_SESSION_ID;
      else process.env.OMP_SESSION_ID = previousOmpSessionId;
      if (previousBabysitterSessionId === undefined) delete process.env.BABYSITTER_SESSION_ID;
      else process.env.BABYSITTER_SESSION_ID = previousBabysitterSessionId;
    }
  });

  it("rejects an ownership-stamped OMP run while the session owns another active run", async () => {
    const runId = "collision-omp-run";
    const runDir = path.join(runsDir, runId);
    const previousOmpSessionId = process.env.OMP_SESSION_ID;
    const previousBabysitterSessionId = process.env.BABYSITTER_SESSION_ID;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify({
      processId: "test-process",
      harness: "oh-my-pi",
      sessionBinding: { harness: "oh-my-pi", sessionId },
    }), "utf8");
    await fs.mkdir(path.join(runsDir, "existing-active-run"));
    await seedSessionOwnership("existing-active-run");

    try {
      process.env.OMP_SESSION_ID = sessionId;
      process.env.BABYSITTER_SESSION_ID = sessionId;
      const result = await handleSessionResume({ sessionId, runId, stateDir, runsDir, json: true });

      expect(result).toBe(1);
      const existing = await readSessionFile(path.join(stateDir, `${sessionId}.md`));
      expect(existing.state.runId).toBe("existing-active-run");
    } finally {
      if (previousOmpSessionId === undefined) delete process.env.OMP_SESSION_ID;
      else process.env.OMP_SESSION_ID = previousOmpSessionId;
      if (previousBabysitterSessionId === undefined) delete process.env.BABYSITTER_SESSION_ID;
      else process.env.BABYSITTER_SESSION_ID = previousBabysitterSessionId;
    }
  });

  it("allows an ownership-stamped OMP run to replace an inactive historical run", async () => {
    const runId = "successor-omp-run";
    const runDir = path.join(runsDir, runId);
    const previousOmpSessionId = process.env.OMP_SESSION_ID;
    const previousBabysitterSessionId = process.env.BABYSITTER_SESSION_ID;
    const now = "2026-08-21T00:00:00.000Z";
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify({
      runId,
      processId: "test-process",
      harness: "oh-my-pi",
      sessionBinding: { harness: "oh-my-pi", sessionId },
    }), "utf8");
    await writeSessionFile(path.join(stateDir, `${sessionId}.md`), {
      active: false,
      iteration: 3,
      maxIterations: 65_000,
      runId,
      runDir: await fs.realpath(runDir),
      runIds: ["completed-old-run", runId],
      startedAt: now,
      lastIterationAt: now,
      iterationTimes: [],
    }, "inactive historical run");

    try {
      process.env.OMP_SESSION_ID = sessionId;
      process.env.BABYSITTER_SESSION_ID = sessionId;
      const result = await handleSessionResume({ sessionId, runId, stateDir, runsDir, json: true });

      expect(result).toBe(0);
      const state = await readSessionFile(path.join(stateDir, `${sessionId}.md`));
      expect(state.state).toMatchObject({ active: true, runId });
    } finally {
      if (previousOmpSessionId === undefined) delete process.env.OMP_SESSION_ID;
      else process.env.OMP_SESSION_ID = previousOmpSessionId;
      if (previousBabysitterSessionId === undefined) delete process.env.BABYSITTER_SESSION_ID;
      else process.env.BABYSITTER_SESSION_ID = previousBabysitterSessionId;
    }
  });

  it("fails closed when run metadata is malformed", async () => {
    const runId = "malformed-run-metadata";
    const runDir = path.join(runsDir, runId);
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(path.join(runDir, "run.json"), "{not-json", "utf8");

    const result = await handleSessionResume({ sessionId, runId, stateDir, runsDir, json: true });

    expect(result).toBe(1);
    await expect(fs.access(path.join(stateDir, `${sessionId}.md`))).rejects.toThrow();
  });

  it("fails closed when OMP session ownership metadata conflicts with the recorded harness", async () => {
    const runId = "inconsistent-omp-metadata";
    const runDir = path.join(runsDir, runId);
    const previousOmpSessionId = process.env.OMP_SESSION_ID;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify({
      processId: "test-process",
      harness: "pi",
      sessionBinding: { harness: "oh-my-pi", sessionId },
    }), "utf8");

    try {
      process.env.OMP_SESSION_ID = sessionId;
      const result = await handleSessionResume({ sessionId, runId, stateDir, runsDir, json: true });

      expect(result).toBe(1);
      await expect(fs.access(path.join(stateDir, `${sessionId}.md`))).rejects.toThrow();
    } finally {
      if (previousOmpSessionId === undefined) delete process.env.OMP_SESSION_ID;
      else process.env.OMP_SESSION_ID = previousOmpSessionId;
    }
  });

  it("rejects a symlinked OMP run that escapes configured runs roots", async () => {
    const externalRunDir = await fs.mkdtemp(path.join(os.tmpdir(), "external-omp-run-"));
    const aliasRunDir = path.join(runsDir, "linked-run");
    const externalRunId = path.basename(externalRunDir);
    const previousOmpSessionId = process.env.OMP_SESSION_ID;
    const previousBabysitterSessionId = process.env.BABYSITTER_SESSION_ID;
    const now = "2026-08-21T00:00:00.000Z";
    await fs.mkdir(path.join(externalRunDir, "journal"));
    await fs.writeFile(path.join(externalRunDir, "run.json"), JSON.stringify({
      runId: externalRunId,
      processId: "external-process",
      harness: "oh-my-pi",
      sessionBinding: { harness: "oh-my-pi", sessionId },
    }));
    await fs.symlink(externalRunDir, aliasRunDir, "dir");
    await writeSessionFile(path.join(stateDir, `${sessionId}.md`), {
      active: true,
      iteration: 1,
      maxIterations: 65_000,
      runId: externalRunId,
      runDir: externalRunDir,
      runIds: [externalRunId],
      startedAt: now,
      lastIterationAt: now,
      iterationTimes: [],
    }, "self-attested external run");

    try {
      process.env.OMP_SESSION_ID = sessionId;
      process.env.BABYSITTER_SESSION_ID = sessionId;
      const result = await handleSessionResume({
        sessionId,
        runId: aliasRunDir,
        stateDir,
        runsDir,
        json: true,
      });

      expect(result).toBe(1);
    } finally {
      await fs.rm(externalRunDir, { recursive: true, force: true });
      if (previousOmpSessionId === undefined) delete process.env.OMP_SESSION_ID;
      else process.env.OMP_SESSION_ID = previousOmpSessionId;
      if (previousBabysitterSessionId === undefined) delete process.env.BABYSITTER_SESSION_ID;
      else process.env.BABYSITTER_SESSION_ID = previousBabysitterSessionId;
    }
  });

  it("fails closed when an OMP run has no authoritative ambient session binding", async () => {
    const runId = "unbound-omp-run";
    const runDir = path.join(runsDir, runId);
    const previousOmpSessionId = process.env.OMP_SESSION_ID;
    const previousBabysitterSessionId = process.env.BABYSITTER_SESSION_ID;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify({ processId: "test-process", harness: "oh-my-pi" }), "utf8");

    try {
      delete process.env.OMP_SESSION_ID;
      delete process.env.BABYSITTER_SESSION_ID;
      const result = await handleSessionResume({ sessionId, runId, stateDir, runsDir, json: true });

      expect(result).toBe(1);
      await expect(fs.access(path.join(stateDir, `${sessionId}.md`))).rejects.toThrow();
    } finally {
      if (previousOmpSessionId !== undefined) process.env.OMP_SESSION_ID = previousOmpSessionId;
      if (previousBabysitterSessionId !== undefined) process.env.BABYSITTER_SESSION_ID = previousBabysitterSessionId;
    }
  });

  it("does not treat BABYSITTER_SESSION_ID alone as OMP context for a Pi run", async () => {
    const runId = "existing-pi-run";
    const runDir = path.join(runsDir, runId);
    const previousOmpSessionId = process.env.OMP_SESSION_ID;
    const previousBabysitterSessionId = process.env.BABYSITTER_SESSION_ID;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(
      path.join(runDir, "run.json"),
      JSON.stringify({ processId: "test-process", harness: "pi" }),
      "utf8",
    );

    try {
      delete process.env.OMP_SESSION_ID;
      process.env.BABYSITTER_SESSION_ID = sessionId;
      const result = await handleSessionResume({ sessionId, runId, stateDir, runsDir, json: true });

      expect(result).toBe(0);
      const content = await fs.readFile(path.join(stateDir, `${sessionId}.md`), "utf8");
      expect(content).toContain("Continue orchestration using run:iterate, task:post");
      expect(content).not.toContain("babysitter_drive");
    } finally {
      if (previousOmpSessionId === undefined) delete process.env.OMP_SESSION_ID;
      else process.env.OMP_SESSION_ID = previousOmpSessionId;
      if (previousBabysitterSessionId === undefined) delete process.env.BABYSITTER_SESSION_ID;
      else process.env.BABYSITTER_SESSION_ID = previousBabysitterSessionId;
    }
  });

  it("rejects a legacy OMP run without persisted driver ownership metadata", async () => {
    const runId = "legacy-omp-run";
    const runDir = path.join(runsDir, runId);
    const previousOmpSessionId = process.env.OMP_SESSION_ID;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify({ runId, processId: "legacy-process" }), "utf8");
    await seedSessionOwnership(runId);

    try {
      process.env.OMP_SESSION_ID = sessionId;
      const result = await handleSessionResume({ sessionId, runId, stateDir, runsDir, json: true });

      expect(result).toBe(1);
      const content = await fs.readFile(path.join(stateDir, `${sessionId}.md`), "utf8");
      expect(content).not.toContain("babysitter_drive");
    } finally {
      if (previousOmpSessionId === undefined) delete process.env.OMP_SESSION_ID;
      else process.env.OMP_SESSION_ID = previousOmpSessionId;
    }
  });

  it("rejects a legacy OMP run without prior session ownership evidence", async () => {
    const runId = "unowned-legacy-omp-run";
    const runDir = path.join(runsDir, runId);
    const previousOmpSessionId = process.env.OMP_SESSION_ID;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify({ runId, processId: "legacy-process" }), "utf8");

    try {
      process.env.OMP_SESSION_ID = sessionId;
      const result = await handleSessionResume({ sessionId, runId, stateDir, runsDir, json: true });

      expect(result).toBe(1);
      await expect(fs.access(path.join(stateDir, `${sessionId}.md`))).rejects.toThrow();
    } finally {
      if (previousOmpSessionId === undefined) delete process.env.OMP_SESSION_ID;
      else process.env.OMP_SESSION_ID = previousOmpSessionId;
    }
  });

  it("fails closed when ambient OMP binding disagrees with the requested session", async () => {
    const runId = "mismatched-omp-run";
    const runDir = path.join(runsDir, runId);
    const previousOmpSessionId = process.env.OMP_SESSION_ID;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify({ runId, processId: "legacy-process" }), "utf8");

    try {
      process.env.OMP_SESSION_ID = "different-session";
      const result = await handleSessionResume({ sessionId, runId, stateDir, runsDir, json: true });

      expect(result).toBe(1);
      await expect(fs.access(path.join(stateDir, `${sessionId}.md`))).rejects.toThrow();
    } finally {
      if (previousOmpSessionId === undefined) delete process.env.OMP_SESSION_ID;
      else process.env.OMP_SESSION_ID = previousOmpSessionId;
    }
  });

  it("fails closed when OMP and Babysitter ambient session bindings disagree", async () => {
    const runId = "conflicting-ambient-run";
    const runDir = path.join(runsDir, runId);
    const previousOmpSessionId = process.env.OMP_SESSION_ID;
    const previousBabysitterSessionId = process.env.BABYSITTER_SESSION_ID;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify({ runId, processId: "legacy-process" }), "utf8");

    try {
      process.env.OMP_SESSION_ID = sessionId;
      process.env.BABYSITTER_SESSION_ID = "different-session";
      const result = await handleSessionResume({ sessionId, runId, stateDir, runsDir, json: true });

      expect(result).toBe(1);
      await expect(fs.access(path.join(stateDir, `${sessionId}.md`))).rejects.toThrow();
    } finally {
      if (previousOmpSessionId === undefined) delete process.env.OMP_SESSION_ID;
      else process.env.OMP_SESSION_ID = previousOmpSessionId;
      if (previousBabysitterSessionId === undefined) delete process.env.BABYSITTER_SESSION_ID;
      else process.env.BABYSITTER_SESSION_ID = previousBabysitterSessionId;
    }
  });

  it("fails closed when the ambient OMP session identifier is invalid", async () => {
    const runId = "invalid-ambient-run";
    const runDir = path.join(runsDir, runId);
    const invalidSessionId = "invalid\nsession";
    const previousOmpSessionId = process.env.OMP_SESSION_ID;
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify({ runId, processId: "legacy-process" }), "utf8");

    try {
      process.env.OMP_SESSION_ID = invalidSessionId;
      const result = await handleSessionResume({ sessionId: invalidSessionId, runId, stateDir, runsDir, json: true });

      expect(result).toBe(1);
    } finally {
      if (previousOmpSessionId === undefined) delete process.env.OMP_SESSION_ID;
      else process.env.OMP_SESSION_ID = previousOmpSessionId;
    }
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
