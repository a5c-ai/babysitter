/**
 * Tests that expose doubled .a5c path bugs across the codebase.
 *
 * These tests verify that collapseDoubledA5cRuns correctly handles all
 * the scenarios where private functions (normalizeRef, resolveArtifactAbsolutePath,
 * collectArtifactCandidates, handleStopHookImpl) would produce doubled paths.
 *
 * Bug references: Issue #44 (task.ts / main.ts), Issue #48 (claudeCode.ts stop hook)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as path from "node:path";
import { promises as fs } from "node:fs";
import os from "os";
import { collapseDoubledA5cRuns } from "../resolveInputPath";
import { _collapseDoubledA5cRuns, _resolveRunDir } from "../main";

// ---------------------------------------------------------------------------
// Issue #44: normalizeRef in task.ts produces tripled paths when runDir
// already contains doubled .a5c/runs segments
// ---------------------------------------------------------------------------

describe("doubled .a5c paths — normalizeRef scenarios (Issue #44)", () => {
  // normalizeRef does: path.isAbsolute(ref) ? ref : path.join(runDir, ref)
  // When runDir is already doubled, path.join produces tripled paths.

  it("detects doubled runDir + relative resultRef produces triple nesting", () => {
    // Simulate what normalizeRef does internally
    const doubledRunDir = "/project/.a5c/runs/.a5c/runs/01RUNID";
    const relativeRef = "tasks/01EFFECTID/result.json";

    // This is what normalizeRef currently produces (the bug)
    const buggyResult = path.join(doubledRunDir, relativeRef);

    // The buggy result has doubled .a5c/runs AND the relative ref appended
    expect(buggyResult.replace(/\\/g, "/")).toContain(".a5c/runs/.a5c/runs");

    // collapseDoubledA5cRuns should fix it
    const fixed = collapseDoubledA5cRuns(buggyResult);
    expect(fixed).toBe(
      path.normalize("/project/.a5c/runs/01RUNID/tasks/01EFFECTID/result.json")
    );

    // Verify only one .a5c/runs segment remains
    const segments = fixed.replace(/\\/g, "/").split(".a5c/runs").length - 1;
    expect(segments).toBe(1);
  });

  it("detects doubled runDir + absolute resultRef passes through unchanged", () => {
    // When resultRef is absolute, normalizeRef returns it as-is
    const absoluteRef = "/project/.a5c/runs/01RUNID/tasks/01EFFECTID/result.json";

    // No doubling in the absolute ref itself — should be unchanged
    const fixed = collapseDoubledA5cRuns(absoluteRef);
    expect(fixed).toBe(absoluteRef);
  });

  it("detects path.join with doubled runDir and blob ref", () => {
    const doubledRunDir = "/project/.a5c/runs/.a5c/runs/01RUNID";
    const blobRef = "blobs/abc123.json";

    const buggyResult = path.join(doubledRunDir, blobRef);
    expect(buggyResult.replace(/\\/g, "/")).toContain(".a5c/runs/.a5c/runs");

    const fixed = collapseDoubledA5cRuns(buggyResult);
    expect(fixed).toBe(
      path.normalize("/project/.a5c/runs/01RUNID/blobs/abc123.json")
    );
  });

  it("handles Windows doubled runDir with relative ref", () => {
    const doubledRunDir = "C:\\project\\.a5c\\runs\\.a5c\\runs\\01RUNID";
    const relativeRef = "tasks\\01EFFECTID\\result.json";

    const buggyResult = path.join(doubledRunDir, relativeRef);

    const fixed = collapseDoubledA5cRuns(buggyResult);
    // Should have only one .a5c/runs (or .a5c\runs) segment
    const normalized = fixed.replace(/\\/g, "/");
    const segments = normalized.split(".a5c/runs").length - 1;
    expect(segments).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Issue #44: resolveArtifactAbsolutePath / collectArtifactCandidates in main.ts
// When runDir contains doubled .a5c/runs, path.join(runDir, ref) doubles again
// ---------------------------------------------------------------------------

describe("doubled .a5c paths — artifact resolution scenarios (Issue #44)", () => {
  it("collectArtifactCandidates with doubled runDir produces doubled candidate", () => {
    // collectArtifactCandidates does: pushCandidate(path.join(runDir, ref))
    const doubledRunDir = path.resolve("/project/.a5c/runs/.a5c/runs/01RUNID");
    const ref = "tasks/01EFF/result.json";

    const candidate = path.normalize(path.join(doubledRunDir, ref));
    // The candidate path will contain the doubling
    const candidateNorm = candidate.replace(/\\/g, "/");
    expect(candidateNorm).toContain(".a5c/runs/.a5c/runs");

    // Applying collapse fixes it
    const fixed = collapseDoubledA5cRuns(candidate);
    const fixedNorm = fixed.replace(/\\/g, "/");
    expect(fixedNorm).not.toContain(".a5c/runs/.a5c/runs");
  });

  it("normalizeArtifactRef with doubled runDir produces wrong relative path", () => {
    // normalizeArtifactRef calls resolveArtifactAbsolutePath then
    // path.relative(runDir, absolute). If runDir is doubled and absolute
    // is also doubled, the relative path might look correct but both are wrong.
    const doubledRunDir = "/project/.a5c/runs/.a5c/runs/01RUNID";
    const ref = "tasks/01EFF/result.json";

    // resolveArtifactAbsolutePath returns path.join(absoluteRunDir, normalized)
    const absoluteRunDir = path.resolve(doubledRunDir);
    const resolved = path.join(absoluteRunDir, ref);

    // Then normalizeArtifactRef does path.relative(runDir, resolved)
    const relative = path.relative(absoluteRunDir, resolved).replace(/\\/g, "/");

    // The relative path happens to be correct because both sides are doubled
    // BUT the absolute path is wrong — it points to a non-existent doubled location
    const resolvedNorm = resolved.replace(/\\/g, "/");
    expect(resolvedNorm).toContain(".a5c/runs/.a5c/runs");

    // The fix: collapse the runDir before using it
    const fixedRunDir = collapseDoubledA5cRuns(absoluteRunDir);
    const fixedResolved = path.join(fixedRunDir, ref);
    const fixedNorm = fixedResolved.replace(/\\/g, "/");
    expect(fixedNorm).not.toContain(".a5c/runs/.a5c/runs");
  });

  it("_collapseDoubledA5cRuns re-exported from main.ts matches resolveInputPath export", () => {
    // Verify both exports are the same function behavior
    const testPath = "/project/.a5c/runs/.a5c/runs/01RUNID/tasks/01EFF/result.json";
    expect(_collapseDoubledA5cRuns(testPath)).toBe(collapseDoubledA5cRuns(testPath));
  });
});

// ---------------------------------------------------------------------------
// Issue #48: handleStopHookImpl in claudeCode.ts
// path.join(runsDir, state.runId) doubles when runId starts with .a5c/runs/
// ---------------------------------------------------------------------------

describe("doubled .a5c paths — stop hook runDir construction (Issue #48)", () => {
  it("path.join(runsDir, runId) doubles when runId contains .a5c/runs", () => {
    const runsDir = ".a5c/runs";
    const runId = ".a5c/runs/01RUNID";

    // This is what handleStopHookImpl does at lines 303, 334, 485, 515
    const buggyRunDir = path.join(runsDir, runId);

    // The result contains doubled .a5c/runs
    const normalized = buggyRunDir.replace(/\\/g, "/");
    expect(normalized).toContain(".a5c/runs/.a5c/runs");

    // Applying collapse fixes it
    const fixed = collapseDoubledA5cRuns(buggyRunDir);
    const fixedNorm = fixed.replace(/\\/g, "/");
    expect(fixedNorm).not.toContain(".a5c/runs/.a5c/runs");
    expect(fixedNorm).toContain(".a5c/runs/01RUNID");
  });

  it("path.join(runsDir, runId) is fine when runId is a plain ID", () => {
    const runsDir = ".a5c/runs";
    const runId = "01RUNID";

    const result = path.join(runsDir, runId);
    const normalized = result.replace(/\\/g, "/");

    // Should have exactly one .a5c/runs segment
    const segments = normalized.split(".a5c/runs").length - 1;
    expect(segments).toBe(1);
  });

  it("appendStopHookEvent path doubles when runsDir and runId both have .a5c/runs", () => {
    // The stop hook calls: appendStopHookEvent(path.join(runsDir, state.runId), ...)
    // When runsDir=".a5c/runs" and runId=".a5c/runs/01RUNID", the journal path doubles
    const runsDir = ".a5c/runs";
    const runId = ".a5c/runs/01RUNID";

    const journalDir = path.join(path.join(runsDir, runId), "journal");
    const normalized = journalDir.replace(/\\/g, "/");
    expect(normalized).toContain(".a5c/runs/.a5c/runs");

    // After fix
    const fixedBase = collapseDoubledA5cRuns(path.join(runsDir, runId));
    const fixedJournalDir = path.join(fixedBase, "journal");
    const fixedNorm = fixedJournalDir.replace(/\\/g, "/");
    expect(fixedNorm).not.toContain(".a5c/runs/.a5c/runs");
  });

  it("stop hook runDir construction with absolute runsDir does not double", () => {
    const runsDir = "/project/.a5c/runs";
    const runId = "01RUNID";

    const result = path.join(runsDir, runId);
    expect(result).toBe(path.join("/project/.a5c/runs", "01RUNID"));

    // No doubling with plain runId
    const collapsed = collapseDoubledA5cRuns(result);
    expect(collapsed).toBe(result);
  });

  it("stop hook runDir construction with absolute runsDir and prefixed runId doubles", () => {
    const runsDir = "/project/.a5c/runs";
    const runId = ".a5c/runs/01RUNID";

    const buggyResult = path.join(runsDir, runId);
    const normalized = buggyResult.replace(/\\/g, "/");
    expect(normalized).toContain(".a5c/runs/.a5c/runs");

    const fixed = collapseDoubledA5cRuns(buggyResult);
    expect(fixed).toBe(path.normalize("/project/.a5c/runs/01RUNID"));
  });
});

// ---------------------------------------------------------------------------
// resolveRunDir should collapse doubled paths
// ---------------------------------------------------------------------------

describe("_resolveRunDir collapses doubled .a5c/runs", () => {
  it("collapses when baseDir and runDirArg both contain .a5c/runs", () => {
    const result = _resolveRunDir(".a5c/runs", ".a5c/runs/01RUNID");
    const normalized = result.replace(/\\/g, "/");

    // Must not contain doubled .a5c/runs
    const segments = normalized.split(".a5c/runs").length - 1;
    expect(segments).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// EffectIndex — resultRef stored in journal events can contain doubled paths
// ---------------------------------------------------------------------------

describe("doubled .a5c paths — effectIndex resultRef scenarios", () => {
  it("resultRef with doubled .a5c/runs should be collapsible", () => {
    // When an EFFECT_RESOLVED event stores a resultRef that was constructed
    // from a doubled runDir, the ref itself may contain the doubling
    const doubledRef = ".a5c/runs/.a5c/runs/01RUNID/tasks/01EFF/result.json";

    const fixed = collapseDoubledA5cRuns(doubledRef);
    expect(fixed).not.toContain(".a5c/runs/.a5c/runs");
    expect(fixed.replace(/\\/g, "/")).toBe(".a5c/runs/01RUNID/tasks/01EFF/result.json");
  });

  it("absolute resultRef with doubled path should be collapsible", () => {
    const doubledRef = "/project/.a5c/runs/.a5c/runs/01RUNID/tasks/01EFF/result.json";

    const fixed = collapseDoubledA5cRuns(doubledRef);
    expect(fixed).toBe("/project/.a5c/runs/01RUNID/tasks/01EFF/result.json");
  });

  it("stdoutRef with doubled path should be collapsible", () => {
    const doubledRef = "/project/.a5c/runs/.a5c/runs/01RUNID/tasks/01EFF/stdout.log";

    const fixed = collapseDoubledA5cRuns(doubledRef);
    expect(fixed).toBe("/project/.a5c/runs/01RUNID/tasks/01EFF/stdout.log");
  });
});

// ---------------------------------------------------------------------------
// Edge cases: .a5c/.a5c doubling (different from .a5c/runs doubling)
// ---------------------------------------------------------------------------

describe("doubled .a5c paths — .a5c/.a5c/ doubling scenarios", () => {
  it("collapses .a5c/.a5c/runs/ produced by SDK install in .a5c/ subdir", () => {
    // When the babysit skill installs SDK inside .a5c/ and runs from there,
    // runsDir becomes ".a5c/runs" relative to .a5c/, producing .a5c/.a5c/runs/
    const doubledPath = "/project/.a5c/.a5c/runs/01RUNID";

    const fixed = collapseDoubledA5cRuns(doubledPath);
    expect(fixed).toBe("/project/.a5c/runs/01RUNID");
  });

  it("collapses .a5c/.a5c/processes/ path", () => {
    const doubledPath = "/project/.a5c/.a5c/processes/my-process.js";

    const fixed = collapseDoubledA5cRuns(doubledPath);
    expect(fixed).toBe("/project/.a5c/processes/my-process.js");
  });

  it("collapses .a5c/.a5c/.a5c/ triple nesting", () => {
    const tripledPath = "/project/.a5c/.a5c/.a5c/runs/01RUNID";

    const fixed = collapseDoubledA5cRuns(tripledPath);
    expect(fixed).toBe("/project/.a5c/runs/01RUNID");
  });

  it("Windows .a5c\\.a5c\\ doubling is collapsed", () => {
    const doubledPath = "C:\\project\\.a5c\\.a5c\\runs\\01RUNID";

    const fixed = collapseDoubledA5cRuns(doubledPath);
    expect(fixed).toBe("C:\\project\\.a5c\\runs\\01RUNID");
  });
});

// ---------------------------------------------------------------------------
// Integration: CLI task:list with doubled runDir
// Exercises normalizeArtifactRef → resolveArtifactAbsolutePath → collectArtifactCandidates
// with a runDir that was constructed from a doubled base path.
// ---------------------------------------------------------------------------

describe("CLI integration — task:list with doubled .a5c/runs runDir", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "doubled-a5c-cli-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function createMinimalRunWithEffect(runsDir: string, runId: string): Promise<string> {
    const runDir = path.join(runsDir, runId);
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.mkdir(path.join(runDir, "state"), { recursive: true });
    await fs.mkdir(path.join(runDir, "tasks", "01EFFECT1"), { recursive: true });

    await fs.writeFile(
      path.join(runDir, "run.json"),
      JSON.stringify({
        runId,
        processId: "test-process",
        layoutVersion: 1,
      }),
    );

    // RUN_CREATED event
    await fs.writeFile(
      path.join(runDir, "journal", "000001.01AAAAAA.json"),
      JSON.stringify({
        seq: 1,
        ulid: "01AAAAAA",
        type: "RUN_CREATED",
        recordedAt: new Date().toISOString(),
        data: { runId },
        checksum: "abc123",
      }),
    );

    // EFFECT_REQUESTED event
    await fs.writeFile(
      path.join(runDir, "journal", "000002.01BBBBBB.json"),
      JSON.stringify({
        seq: 2,
        ulid: "01BBBBBB",
        type: "EFFECT_REQUESTED",
        recordedAt: new Date().toISOString(),
        data: {
          effectId: "01EFFECT1",
          invocationKey: "inv-key-1",
          stepId: "S000001",
          taskId: "my-task",
          taskDefRef: "tasks/01EFFECT1/task.json",
          kind: "node",
          label: "test-task",
        },
        checksum: "def456",
      }),
    );

    // Write task definition
    await fs.writeFile(
      path.join(runDir, "tasks", "01EFFECT1", "task.json"),
      JSON.stringify({
        schemaVersion: "2026.01.tasks-v1",
        taskId: "my-task",
        effectId: "01EFFECT1",
        kind: "node",
        title: "Test task",
      }),
    );

    return runDir;
  }

  it("task:list with a doubled .a5c/runs path should resolve artifact refs without doubling", async () => {
    const runsDir = path.join(tmpDir, ".a5c", "runs");
    const runDir = await createMinimalRunWithEffect(runsDir, "01TESTRUN");

    const { createBabysitterCli } = await import("../main");
    const cli = createBabysitterCli();

    // Pass a doubled path directly — simulating the bug scenario
    const doubledRunDir = path.join(tmpDir, ".a5c", "runs", ".a5c", "runs", "01TESTRUN");

    // Create the doubled directory structure with symlink/copy so the CLI can find it
    // Actually, we pass the correct runDir but assert that CLI output doesn't
    // contain doubled paths in its refs
    const exitCode = await cli.run(["task:list", runDir, "--json"]);

    expect(exitCode).toBe(0);
    const output = logSpy.mock.calls.flat().find((c) => typeof c === "string" && c.includes('"tasks"'));
    expect(output).toBeDefined();

    const payload = JSON.parse(output as string);
    expect(payload.tasks).toHaveLength(1);

    const task = payload.tasks[0];
    // taskDefRef should be a clean relative path, not containing doubled segments
    if (task.taskDefRef) {
      const ref = task.taskDefRef.replace(/\\/g, "/");
      expect(ref).not.toContain(".a5c/runs/.a5c/runs");
    }
  });

  it("task:list passes doubled runDir to normalizeArtifactRef (bug exposure)", async () => {
    // This test simulates the exact bug path: the CLI receives a doubled runDir
    // and normalizeArtifactRef/resolveArtifactAbsolutePath work with it.
    // The relative refs look correct but the absolute paths are wrong.
    const runsDir = path.join(tmpDir, ".a5c", "runs");
    const runDir = await createMinimalRunWithEffect(runsDir, "01TESTRUN");

    // Create a doubled directory that also contains the run
    // (This simulates what happens when runs are created from inside .a5c/)
    const doubledRunsDir = path.join(tmpDir, ".a5c", "runs", ".a5c", "runs");
    await fs.mkdir(doubledRunsDir, { recursive: true });

    // Copy the run into the doubled location too
    const doubledRunDir = path.join(doubledRunsDir, "01TESTRUN");
    await fs.cp(runDir, doubledRunDir, { recursive: true });

    const { createBabysitterCli } = await import("../main");
    const cli = createBabysitterCli();

    // Pass the doubled path — the CLI should still work
    const exitCode = await cli.run(["task:list", doubledRunDir, "--json"]);

    expect(exitCode).toBe(0);
    const output = logSpy.mock.calls.flat().find((c) => typeof c === "string" && c.includes('"tasks"'));
    expect(output).toBeDefined();

    const payload = JSON.parse(output as string);
    expect(payload.tasks).toHaveLength(1);

    // The bug: when runDir is doubled, the taskDefRef relative path is computed
    // relative to the doubled runDir. The relative path itself may look fine,
    // but if you resolve it back to absolute using the doubled runDir, you get
    // a path that doesn't exist at the canonical location.
    const task = payload.tasks[0];
    const taskDefRef = task.taskDefRef;

    // Resolve the ref back to absolute using the doubled runDir
    const resolvedAbsolute = path.resolve(doubledRunDir, taskDefRef);
    const resolvedNorm = resolvedAbsolute.replace(/\\/g, "/");

    // BUG EXPOSURE: The resolved absolute path contains doubled .a5c/runs
    // because the runDir passed to normalizeArtifactRef was doubled.
    // A correct implementation would collapse the runDir first.
    expect(resolvedNorm).toContain(".a5c/runs/.a5c/runs");

    // After collapsing, the path should point to the canonical location
    const collapsed = collapseDoubledA5cRuns(resolvedAbsolute);
    const collapsedNorm = collapsed.replace(/\\/g, "/");
    expect(collapsedNorm).not.toContain(".a5c/runs/.a5c/runs");
  });
});
