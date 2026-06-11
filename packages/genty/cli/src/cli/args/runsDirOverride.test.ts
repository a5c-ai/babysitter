import { describe, expect, it, afterEach, beforeEach } from "vitest";
import { parseHarnessArgs } from "./index";

/**
 * #936 regression: the CLI must NOT eagerly pin an explicit runs dir when
 * `--runs-dir` is absent. An eager global default in `runsDir` (used by READ
 * commands) previously leaked into CREATE commands and defeated the
 * <workspace>/.a5c/runs anchor (resolveWorkspaceRunsDir), so `genty yolo`
 * materialized its run — and its completion proof — in the GLOBAL ~/.a5c/runs
 * and the live-stack validator reported "no .a5c/runs/ directory found".
 *
 * `runsDirOverride` is the single signal CREATE commands forward: undefined when
 * `--runs-dir` is not given, the resolved override when it is.
 */
describe("parseHarnessArgs runsDirOverride (#936)", () => {
  const ORIGINAL = process.env.BABYSITTER_RUNS_DIR;
  beforeEach(() => {
    delete process.env.BABYSITTER_RUNS_DIR;
  });
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.BABYSITTER_RUNS_DIR;
    else process.env.BABYSITTER_RUNS_DIR = ORIGINAL;
  });

  it("leaves runsDirOverride undefined when --runs-dir is not passed", () => {
    const parsed = parseHarnessArgs(["yolo", "--prompt", "do a thing", "--no-interactive"]);
    expect(parsed.runsDirOverride).toBeUndefined();
    // The read-side default is still populated for tui/jsonl/resume discovery.
    expect(typeof parsed.runsDir).toBe("string");
    expect(parsed.runsDir.length).toBeGreaterThan(0);
  });

  it("sets runsDirOverride (and runsDir) to the resolved path when --runs-dir is passed", () => {
    const explicit = process.platform === "win32" ? "C:\\tmp\\explicit-runs" : "/tmp/explicit-runs";
    const parsed = parseHarnessArgs(["yolo", "--prompt", "x", "--runs-dir", explicit]);
    expect(parsed.runsDirOverride).toBeDefined();
    expect(parsed.runsDirOverride).toContain("explicit-runs");
    expect(parsed.runsDir).toBe(parsed.runsDirOverride);
  });
});
