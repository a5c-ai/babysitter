import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "path";
import { resolveRunDir } from "../../util/resolve-run-dir";

describe("resolveRunDir", () => {
  const originalEnv = process.env["BABYSITTER_RUNS_DIR"];

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env["BABYSITTER_RUNS_DIR"] = originalEnv;
    } else {
      delete process.env["BABYSITTER_RUNS_DIR"];
    }
  });

  it("returns resolved override path when provided", () => {
    const result = resolveRunDir("/tmp/custom/runs");
    expect(result).toBe(path.resolve("/tmp/custom/runs"));
  });

  it("returns resolved relative override path", () => {
    const result = resolveRunDir("relative/runs");
    expect(result).toBe(path.resolve("relative/runs"));
  });

  it("uses BABYSITTER_RUNS_DIR env var when no override", () => {
    process.env["BABYSITTER_RUNS_DIR"] = "/env/runs";
    const result = resolveRunDir();
    expect(result).toBe(path.resolve("/env/runs"));
  });

  it("defaults to .a5c/runs under cwd when no override and no env var", () => {
    delete process.env["BABYSITTER_RUNS_DIR"];
    const result = resolveRunDir();
    expect(result).toBe(path.resolve(path.join(process.cwd(), ".a5c", "runs")));
  });

  it("returns override even when env var is set", () => {
    process.env["BABYSITTER_RUNS_DIR"] = "/env/runs";
    const result = resolveRunDir("/override/runs");
    expect(result).toBe(path.resolve("/override/runs"));
  });
});
