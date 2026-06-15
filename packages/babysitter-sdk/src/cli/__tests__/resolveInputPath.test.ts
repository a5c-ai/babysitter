import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as path from "node:path";
import { promises as fs } from "node:fs";
import os from "os";
import { resolveInputPath, collapseDoubledA5cRuns } from "../resolveInputPath";

// ---------------------------------------------------------------------------
// collapseDoubledA5cRuns (shared utility)
// ---------------------------------------------------------------------------

describe("collapseDoubledA5cRuns (shared)", () => {
  it("collapses .a5c/runs/.a5c/runs into .a5c/runs", () => {
    const input = "/workspace/.a5c/runs/.a5c/runs/01RUNID";
    expect(collapseDoubledA5cRuns(input)).toBe("/workspace/.a5c/runs/01RUNID");
  });

  it("collapses triple-nested .a5c/runs", () => {
    const input = "/workspace/.a5c/runs/.a5c/runs/.a5c/runs/01RUNID";
    expect(collapseDoubledA5cRuns(input)).toBe("/workspace/.a5c/runs/01RUNID");
  });

  it("does not modify a path with a single .a5c/runs", () => {
    const input = "/workspace/.a5c/runs/01RUNID";
    expect(collapseDoubledA5cRuns(input)).toBe(input);
  });

  it("handles Windows-style backslash separators", () => {
    const input = "C:\\workspace\\.a5c\\runs\\.a5c\\runs\\01RUNID";
    expect(collapseDoubledA5cRuns(input)).toBe("C:\\workspace\\.a5c\\runs\\01RUNID");
  });

  it("handles mixed separators", () => {
    const input = "/workspace/.a5c/runs\\.a5c\\runs/01RUNID";
    expect(collapseDoubledA5cRuns(input)).toBe("/workspace/.a5c/runs/01RUNID");
  });

  it("returns the path unchanged when no .a5c/runs present", () => {
    const input = "/tmp/my-custom-run-dir";
    expect(collapseDoubledA5cRuns(input)).toBe(input);
  });
});

// ---------------------------------------------------------------------------
// resolveInputPath
// ---------------------------------------------------------------------------

describe("resolveInputPath", () => {
  it('returns "-" unchanged for stdin sentinel', () => {
    expect(resolveInputPath("-")).toBe("-");
  });

  it("returns absolute Unix paths normalized", () => {
    const input = "/absolute/path/to/file.json";
    const result = resolveInputPath(input);
    expect(path.isAbsolute(result)).toBe(true);
    expect(result).toBe(path.normalize(input));
  });

  it("returns absolute Windows paths normalized", () => {
    // This tests the regex detection; path.normalize behavior differs by platform
    const input = "C:\\Users\\user\\file.json";
    const result = resolveInputPath(input);
    // Should be detected as absolute and returned normalized
    expect(result).toBe(path.normalize(input));
  });

  it("resolves regular relative paths from cwd", () => {
    const input = "some/relative/file.json";
    const result = resolveInputPath(input);
    expect(result).toBe(path.resolve(input));
  });

  it("collapses doubled .a5c/runs in absolute paths", () => {
    const input = "/project/.a5c/runs/.a5c/runs/01RUN/tasks/01EFF/file.json";
    const result = resolveInputPath(input);
    expect(result).not.toContain(path.join(".a5c", "runs", ".a5c", "runs"));
    expect(result).toBe(path.normalize("/project/.a5c/runs/01RUN/tasks/01EFF/file.json"));
  });

  describe("double-nesting prevention (core bug fix)", () => {
    let tmpDir: string;
    let projectRoot: string;
    let cwdSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "resolve-input-path-"));
      projectRoot = tmpDir;

      // Create a project structure:
      // <tmpDir>/.a5c/runs/01RUN1/tasks/01TASK1/
      // <tmpDir>/.a5c/runs/01RUN1/tasks/01TASK2/updates-input.json
      const task1Dir = path.join(tmpDir, ".a5c", "runs", "01RUN1", "tasks", "01TASK1");
      const task2Dir = path.join(tmpDir, ".a5c", "runs", "01RUN1", "tasks", "01TASK2");
      await fs.mkdir(task1Dir, { recursive: true });
      await fs.mkdir(task2Dir, { recursive: true });
      await fs.writeFile(
        path.join(task2Dir, "updates-input.json"),
        '{"test": true}',
        "utf8",
      );
    });

    afterEach(async () => {
      cwdSpy?.mockRestore();
      await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it("resolves .a5c/runs path from project root when CWD is inside .a5c/runs", () => {
      // Simulate being inside a task directory by mocking process.cwd()
      const taskDir = path.join(projectRoot, ".a5c", "runs", "01RUN1", "tasks", "01TASK1");
      cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(taskDir);

      // This is the exact bug scenario: input path references .a5c/runs
      // but CWD is already inside .a5c/runs
      const input = ".a5c/runs/01RUN1/tasks/01TASK2/updates-input.json";
      const result = resolveInputPath(input);

      // Should resolve to <projectRoot>/.a5c/runs/01RUN1/tasks/01TASK2/updates-input.json
      const expected = path.join(projectRoot, ".a5c", "runs", "01RUN1", "tasks", "01TASK2", "updates-input.json");
      expect(result).toBe(expected);

      // The old buggy behavior would produce a double-nested path
      const buggyResult = path.resolve(taskDir, input);
      expect(buggyResult).not.toBe(result);
      expect(buggyResult).toContain(path.join("01TASK1", ".a5c", "runs"));
    });

    it("still resolves regular relative paths normally when CWD is inside .a5c/runs", () => {
      const taskDir = path.join(projectRoot, ".a5c", "runs", "01RUN1", "tasks", "01TASK1");
      cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(taskDir);

      // A regular relative path without .a5c/runs should resolve from CWD as normal
      const input = "some-file.json";
      const result = resolveInputPath(input);
      expect(result).toBe(path.resolve(taskDir, input));
    });

    it("handles the exact error from the bug report", () => {
      // Bug: babysitter profile:merge --user --input .a5c/runs/RUN/tasks/EFFECT/updates-input.json
      // from within .a5c/runs/RUN/tasks/TASK/
      const taskDir = path.join(projectRoot, ".a5c", "runs", "01RUN1", "tasks", "01TASK1");
      cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(taskDir);

      const input = ".a5c/runs/01RUN1/tasks/01TASK2/updates-input.json";
      const result = resolveInputPath(input);

      // Must NOT produce a path containing two .a5c/runs segments
      const normalized = result.replace(/\\/g, "/");
      const runSegments = normalized.split(".a5c/runs").length - 1;
      expect(runSegments).toBe(1);
    });
  });

  describe("when CWD is not inside .a5c/runs", () => {
    it("resolves .a5c/runs relative paths from CWD normally", () => {
      // When CWD is the project root, .a5c/runs paths resolve correctly with standard path.resolve
      const input = ".a5c/runs/01RUN/tasks/01EFF/file.json";
      const result = resolveInputPath(input);
      expect(result).toBe(collapseDoubledA5cRuns(path.resolve(input)));
    });
  });
});

// ---------------------------------------------------------------------------
// Bug: task:post --value path doubling via resolveMaybeRunRelative
//
// The private resolveMaybeRunRelative() inside handleTaskPost does
//   path.join(runDir, candidate)
// without calling collapseDoubledA5cRuns(). When candidate already contains
// an .a5c/runs prefix (e.g. ".a5c/runs/RUNID/tasks/EFFECTID/output.json"),
// the joined path produces two .a5c/runs segments separated by a runId,
// which collapseDoubledA5cRuns cannot fix (it only handles adjacent
// duplications). The correct fix must detect that the candidate already
// contains an .a5c/runs prefix and avoid blindly prepending runDir.
//
// These tests document the expected CORRECT behavior for the fix.
// ---------------------------------------------------------------------------

describe("task:post resolveMaybeRunRelative path-doubling bug", () => {
  /**
   * Simulate the BUGGY resolveMaybeRunRelative logic from handleTaskPost
   * (path.join without any dedup).
   */
  function buggyResolveMaybeRunRelative(
    runDir: string,
    candidate?: string,
  ): string | undefined {
    if (!candidate) return undefined;
    if (candidate === "-") return candidate;
    if (path.isAbsolute(candidate) || /^[A-Za-z]:[\\/]/.test(candidate)) {
      return candidate;
    }
    return path.join(runDir, candidate);
  }

  /**
   * The CORRECT resolveMaybeRunRelative: when candidate starts with a
   * .a5c/runs segment and runDir already contains .a5c/runs, resolve from
   * the project root (parent of .a5c/) instead of naively joining.
   * collapseDoubledA5cRuns is applied as a final safety net.
   */
  function correctResolveMaybeRunRelative(
    runDir: string,
    candidate?: string,
  ): string | undefined {
    if (!candidate) return undefined;
    if (candidate === "-") return candidate;
    if (path.isAbsolute(candidate) || /^[A-Za-z]:[\\/]/.test(candidate)) {
      return collapseDoubledA5cRuns(candidate);
    }
    const candidateNorm = candidate.replace(/\\/g, "/");
    const runDirNorm = runDir.replace(/\\/g, "/");
    // If candidate itself starts with .a5c/runs and runDir already contains
    // .a5c/runs, resolve relative to the project root (the directory
    // containing .a5c/) to avoid doubling.
    if (candidateNorm.startsWith(".a5c/runs") && runDirNorm.includes(".a5c/runs")) {
      const idx = runDirNorm.indexOf(".a5c/runs");
      const projectRoot = runDir.substring(0, idx === 0 ? 0 : idx).replace(/[/\\]+$/, "");
      if (projectRoot.length > 0) {
        return collapseDoubledA5cRuns(path.join(projectRoot, candidate));
      }
    }
    return collapseDoubledA5cRuns(path.join(runDir, candidate));
  }

  it("relative path containing .a5c/runs does NOT get doubled when resolved (bug scenario)", () => {
    const runDir = "/project/.a5c/runs/01RUNID";
    // User passes --value .a5c/runs/01RUNID/tasks/01EFFECTID/output.json
    const candidate = ".a5c/runs/01RUNID/tasks/01EFFECTID/output.json";

    // The buggy version produces a path with two .a5c/runs segments
    const buggy = buggyResolveMaybeRunRelative(runDir, candidate)!;
    const buggyNorm = buggy.replace(/\\/g, "/");
    const buggySegmentCount = buggyNorm.split(".a5c/runs").length - 1;
    expect(buggySegmentCount).toBeGreaterThan(1);

    // The correct version resolves from project root, avoiding doubling
    const correct = correctResolveMaybeRunRelative(runDir, candidate)!;
    const correctNorm = correct.replace(/\\/g, "/");
    const correctSegmentCount = correctNorm.split(".a5c/runs").length - 1;
    expect(correctSegmentCount).toBe(1);
    expect(correctNorm).toBe(
      "/project/.a5c/runs/01RUNID/tasks/01EFFECTID/output.json",
    );
  });

  it("absolute path passes through unchanged", () => {
    const runDir = "/project/.a5c/runs/01RUNID";
    const candidate = "/other/project/.a5c/runs/01RUNID/tasks/01EFFECTID/output.json";

    const buggy = buggyResolveMaybeRunRelative(runDir, candidate);
    const correct = correctResolveMaybeRunRelative(runDir, candidate);

    // Both versions should return the absolute path unchanged
    expect(buggy).toBe(candidate);
    expect(correct).toBe(candidate);
  });

  it("run-relative path (tasks/EFFECTID/output.json) gets properly joined with runDir", () => {
    const runDir = "/project/.a5c/runs/01RUNID";
    // A simple run-relative path (no .a5c/runs prefix) — no doubling risk
    const candidate = "tasks/01EFFECTID/output.json";

    const buggy = buggyResolveMaybeRunRelative(runDir, candidate)!;
    const correct = correctResolveMaybeRunRelative(runDir, candidate)!;

    // Both should produce the same correct path (no doubling to collapse)
    expect(path.normalize(buggy)).toBe(path.normalize(correct));
    expect(correct.replace(/\\/g, "/")).toBe(
      "/project/.a5c/runs/01RUNID/tasks/01EFFECTID/output.json",
    );
  });

  it("stdin sentinel '-' passes through unchanged", () => {
    const runDir = "/project/.a5c/runs/01RUNID";

    expect(buggyResolveMaybeRunRelative(runDir, "-")).toBe("-");
    expect(correctResolveMaybeRunRelative(runDir, "-")).toBe("-");
  });

  it("undefined candidate returns undefined", () => {
    const runDir = "/project/.a5c/runs/01RUNID";

    expect(buggyResolveMaybeRunRelative(runDir, undefined)).toBeUndefined();
    expect(correctResolveMaybeRunRelative(runDir, undefined)).toBeUndefined();
  });

  it("Windows absolute path passes through unchanged", () => {
    const runDir = "/project/.a5c/runs/01RUNID";
    const candidate = "C:\\Users\\user\\.a5c\\runs\\01RUNID\\tasks\\01EFF\\output.json";

    const correct = correctResolveMaybeRunRelative(runDir, candidate);
    // Detected as absolute by the regex, returned as-is (after normalize)
    expect(correct).toBe(collapseDoubledA5cRuns(candidate));
  });

  it("relative path with tasks/ prefix and already-doubled runDir still resolves correctly", () => {
    // When runDir itself was constructed from a doubled base, even tasks/...
    // joins produce doubled paths
    const doubledRunDir = "/project/.a5c/runs/.a5c/runs/01RUNID";
    const candidate = "tasks/01EFFECTID/result.json";

    // Buggy version preserves the doubled runDir in the result
    const buggy = buggyResolveMaybeRunRelative(doubledRunDir, candidate)!;
    const buggyNorm = buggy.replace(/\\/g, "/");
    expect(buggyNorm).toContain(".a5c/runs/.a5c/runs");

    // Correct version collapses the doubled runDir
    const correct = correctResolveMaybeRunRelative(doubledRunDir, candidate)!;
    const correctNorm = correct.replace(/\\/g, "/");
    expect(correctNorm).not.toContain(".a5c/runs/.a5c/runs");
    expect(correctNorm).toBe(
      "/project/.a5c/runs/01RUNID/tasks/01EFFECTID/result.json",
    );
  });

  it("collapseDoubledA5cRuns alone is insufficient for non-adjacent doubling", () => {
    // This documents that the bug cannot be fixed by simply wrapping
    // path.join(runDir, candidate) with collapseDoubledA5cRuns.
    // The two .a5c/runs segments are separated by the runId, so the
    // adjacent-only collapse regex does not match.
    const runDir = "/project/.a5c/runs/01RUNID";
    const candidate = ".a5c/runs/01RUNID/tasks/01EFFECTID/output.json";

    const joined = path.join(runDir, candidate);
    const collapsed = collapseDoubledA5cRuns(joined);
    const collapsedNorm = collapsed.replace(/\\/g, "/");

    // collapseDoubledA5cRuns does NOT fix this because the pattern is
    // .a5c/runs/01RUNID/.a5c/runs (not .a5c/runs/.a5c/runs)
    const segmentCount = collapsedNorm.split(".a5c/runs").length - 1;
    expect(segmentCount).toBeGreaterThan(1);

    // The correct fix must detect the .a5c/runs prefix in candidate
    // and resolve from project root instead
    const correct = correctResolveMaybeRunRelative(runDir, candidate)!;
    const correctNorm = correct.replace(/\\/g, "/");
    const correctSegments = correctNorm.split(".a5c/runs").length - 1;
    expect(correctSegments).toBe(1);
  });
});
