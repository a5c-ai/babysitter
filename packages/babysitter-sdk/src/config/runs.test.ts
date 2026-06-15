import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getReadableRunsDirs,
  getRepoRunsDir,
  resolveExistingRunDir,
  resolveRunsDir,
} from "./runs";

describe("runs config resolution", () => {
  const originalCwd = process.cwd();
  const originalGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
  const originalRunsDir = process.env.BABYSITTER_RUNS_DIR;
  const originalRunsScope = process.env.BABYSITTER_RUNS_SCOPE;

  let tmpDir: string;
  let repoDir: string;
  let globalStateDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-runs-config-"));
    repoDir = path.join(tmpDir, "repo");
    globalStateDir = path.join(tmpDir, "global-state");
    await fs.mkdir(path.join(repoDir, ".git"), { recursive: true });
    await fs.mkdir(globalStateDir, { recursive: true });
    process.chdir(repoDir);
    process.env.BABYSITTER_GLOBAL_STATE_DIR = globalStateDir;
    delete process.env.BABYSITTER_RUNS_DIR;
    delete process.env.BABYSITTER_RUNS_SCOPE;
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (originalGlobalStateDir === undefined) {
      delete process.env.BABYSITTER_GLOBAL_STATE_DIR;
    } else {
      process.env.BABYSITTER_GLOBAL_STATE_DIR = originalGlobalStateDir;
    }
    if (originalRunsDir === undefined) {
      delete process.env.BABYSITTER_RUNS_DIR;
    } else {
      process.env.BABYSITTER_RUNS_DIR = originalRunsDir;
    }
    if (originalRunsScope === undefined) {
      delete process.env.BABYSITTER_RUNS_SCOPE;
    } else {
      process.env.BABYSITTER_RUNS_SCOPE = originalRunsScope;
    }
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("defaults to the global runs root", () => {
    expect(resolveRunsDir()).toBe(path.join(globalStateDir, "runs"));
  });

  it("uses repo scope when BABYSITTER_RUNS_SCOPE=repo", () => {
    process.env.BABYSITTER_RUNS_SCOPE = "repo";

    expect(resolveRunsDir()).toBe(path.join(repoDir, ".a5c", "runs"));
  });

  it("rebases relative overrides under the configured global root by default", () => {
    expect(resolveRunsDir({ override: "custom-runs" })).toBe(path.join(globalStateDir, "custom-runs"));
  });

  it("includes the legacy repo-local runs root in readable directories", () => {
    expect(getReadableRunsDirs()).toEqual([
      path.join(globalStateDir, "runs"),
      path.join(repoDir, ".a5c", "runs"),
    ]);
  });

  it("finds existing runs in the legacy repo-local root when global scope is active", async () => {
    const legacyRunDir = path.join(getRepoRunsDir(), "legacy-run");
    await fs.mkdir(legacyRunDir, { recursive: true });
    await fs.writeFile(path.join(legacyRunDir, "run.json"), JSON.stringify({ runId: "legacy-run" }), "utf8");

    expect(resolveExistingRunDir("legacy-run")).toBe(legacyRunDir);
  });
});
