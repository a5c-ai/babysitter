import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as path from "node:path";
import { promises as fs } from "node:fs";
import os from "os";
import { _resolveRunDir as resolveRunDir, _collapseDoubledA5cRuns as collapseDoubledA5cRuns } from "../main";

describe("resolveRunDir", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "resolve-run-dir-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("resolves a plain run ID relative to baseDir", () => {
    const result = resolveRunDir(".a5c/runs", "01RUNID");
    expect(result).toBe(path.resolve(".a5c/runs", "01RUNID"));
  });

  it("uses absolute runDirArg directly without prepending baseDir", () => {
    const abs = path.resolve(tmpDir, "my-run");
    const result = resolveRunDir(".a5c/runs", abs);
    expect(result).toBe(path.normalize(abs));
  });

  it("does not double .a5c/runs when arg already contains the prefix", () => {
    const result = resolveRunDir(".a5c/runs", ".a5c/runs/01RUNID");
    // Should NOT be <cwd>/.a5c/runs/.a5c/runs/01RUNID
    expect(result).toBe(path.resolve(".a5c/runs/01RUNID"));
    expect(result).not.toContain(path.join(".a5c", "runs", ".a5c", "runs"));
  });

  it("does not double when arg equals baseDir exactly", () => {
    const result = resolveRunDir(".a5c/runs", ".a5c/runs");
    expect(result).toBe(path.resolve(".a5c/runs"));
  });

  it("handles doubled .a5c/runs in absolute paths", () => {
    const doubled = path.join(tmpDir, ".a5c", "runs", ".a5c", "runs", "01RUNID");
    const result = resolveRunDir(".a5c/runs", doubled);
    expect(result).toBe(path.normalize(path.join(tmpDir, ".a5c", "runs", "01RUNID")));
  });

  it("falls back to CWD resolution when standard path does not exist", async () => {
    // Create a run directory structure at a relative path from CWD
    const runDir = path.join(tmpDir, "my-run");
    await fs.mkdir(runDir, { recursive: true });

    // Use a non-matching baseDir so standard resolution won't find it
    const result = resolveRunDir("/nonexistent/base", path.relative(process.cwd(), runDir));
    // Should fall back... but this only works if the relative path resolves from CWD
    // Since /nonexistent/base is absolute, the standard path won't exist.
    // The fallback should find the directory at CWD + relative path.
    // Note: this test depends on the relative path being valid from CWD.
    if (path.isAbsolute(path.relative(process.cwd(), runDir))) {
      // If the relative path ends up absolute (cross-drive on Windows), skip fallback test
      return;
    }
    expect(result).toBe(path.resolve(path.relative(process.cwd(), runDir)));
  });

  it("works with custom --runs-dir and plain run ID", () => {
    const customBase = path.join(tmpDir, "custom-runs");
    const result = resolveRunDir(customBase, "01RUNID");
    expect(result).toBe(path.join(customBase, "01RUNID"));
  });

  it("handles trailing slashes in baseDir", () => {
    const result = resolveRunDir(".a5c/runs/", "01RUNID");
    expect(result).toBe(path.resolve(".a5c/runs", "01RUNID"));
  });

  it("handles relative path with parent traversal", () => {
    const result = resolveRunDir(".a5c/runs", "../other/01RUNID");
    expect(result).toBe(path.resolve(".a5c/runs", "../other/01RUNID"));
  });
});

describe("collapseDoubledA5cRuns", () => {
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

describe("resolveRunDir integration with run:status", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof import("vitest").vi.spyOn>;
  let errorSpy: ReturnType<typeof import("vitest").vi.spyOn>;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "resolve-run-integration-"));
    const { vi } = await import("vitest");
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function createMinimalRun(runDir: string): Promise<void> {
    await fs.mkdir(path.join(runDir, "journal"), { recursive: true });
    await fs.mkdir(path.join(runDir, "state"), { recursive: true });
    await fs.mkdir(path.join(runDir, "tasks"), { recursive: true });
    await fs.writeFile(
      path.join(runDir, "run.json"),
      JSON.stringify({
        runId: path.basename(runDir),
        processId: "test",
        layoutVersion: 1,
      }),
    );
    // Write a RUN_CREATED event
    await fs.writeFile(
      path.join(runDir, "journal", "000001.01TEST.json"),
      JSON.stringify({
        seq: 1,
        ulid: "01TEST",
        type: "RUN_CREATED",
        recordedAt: new Date().toISOString(),
        data: {},
      }),
    );
  }

  it("run:status works when passing the full .a5c/runs/RUNID path", async () => {
    const runsDir = path.join(tmpDir, ".a5c", "runs");
    const runDir = path.join(runsDir, "01TESTRUN");
    await createMinimalRun(runDir);

    const { createBabysitterCli } = await import("../main");
    const cli = createBabysitterCli();

    // Pass the full relative-like path (this would previously double .a5c/runs)
    const exitCode = await cli.run(["run:status", runDir, "--json"]);

    expect(exitCode).toBe(0);
    const output = logSpy.mock.calls.flat().find((c) => typeof c === "string" && c.includes('"state"'));
    expect(output).toBeDefined();
    const payload = JSON.parse(output as string);
    expect(payload.state).toBe("created");
  });

  it("run:status works with --runs-dir and a plain run ID", async () => {
    const runsDir = path.join(tmpDir, "custom-runs");
    const runDir = path.join(runsDir, "01TESTRUN");
    await createMinimalRun(runDir);

    const { createBabysitterCli } = await import("../main");
    const cli = createBabysitterCli();

    const exitCode = await cli.run([
      "run:status",
      "01TESTRUN",
      "--runs-dir",
      runsDir,
      "--json",
    ]);

    expect(exitCode).toBe(0);
    const output = logSpy.mock.calls.flat().find((c) => typeof c === "string" && c.includes('"state"'));
    expect(output).toBeDefined();
    const payload = JSON.parse(output as string);
    expect(payload.state).toBe("created");
  });
});
