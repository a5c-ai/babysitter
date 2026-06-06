import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "path";
import os from "os";
import { promises as fs } from "fs";
import { resolveRunDir } from "../../util/resolve-run-dir";

describe("resolveRunDir", () => {
  const originalEnv = process.env["BABYSITTER_RUNS_DIR"];
  const originalGlobalStateDir = process.env["BABYSITTER_GLOBAL_STATE_DIR"];
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-resolve-run-dir-"));
  });

  afterEach(async () => {
    if (originalEnv !== undefined) {
      process.env["BABYSITTER_RUNS_DIR"] = originalEnv;
    } else {
      delete process.env["BABYSITTER_RUNS_DIR"];
    }
    if (originalGlobalStateDir !== undefined) {
      process.env["BABYSITTER_GLOBAL_STATE_DIR"] = originalGlobalStateDir;
    } else {
      delete process.env["BABYSITTER_GLOBAL_STATE_DIR"];
    }
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("returns resolved override path when provided", () => {
    const result = resolveRunDir("/tmp/custom/runs");
    expect(result).toBe(path.resolve("/tmp/custom/runs"));
  });

  it("returns resolved relative override path", () => {
    process.env["BABYSITTER_GLOBAL_STATE_DIR"] = path.join(tmpDir, "state");
    const result = resolveRunDir("relative/runs");
    expect(result).toBe(path.resolve(path.join(tmpDir, "state", "relative/runs")));
  });

  it("uses BABYSITTER_RUNS_DIR env var when no override", () => {
    process.env["BABYSITTER_RUNS_DIR"] = "/env/runs";
    const result = resolveRunDir();
    expect(result).toBe(path.resolve("/env/runs"));
  });

  it("defaults to the configured global runs root when no override and no env var", () => {
    delete process.env["BABYSITTER_RUNS_DIR"];
    process.env["BABYSITTER_GLOBAL_STATE_DIR"] = path.join(tmpDir, "state");
    const result = resolveRunDir();
    expect(result).toBe(path.resolve(path.join(tmpDir, "state", "runs")));
  });

  it("returns override even when env var is set", () => {
    process.env["BABYSITTER_RUNS_DIR"] = "/env/runs";
    const result = resolveRunDir("/override/runs");
    expect(result).toBe(path.resolve("/override/runs"));
  });
});
