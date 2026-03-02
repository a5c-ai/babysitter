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
