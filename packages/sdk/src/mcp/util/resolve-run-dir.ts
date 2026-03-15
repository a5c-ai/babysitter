import * as path from "path";

/**
 * Resolves the runs directory, defaulting to `.a5c/runs` under cwd.
 * Accepts an optional override (e.g. from tool args or env).
 */
export function resolveRunDir(overridePath?: string): string {
  if (overridePath) {
    return path.resolve(overridePath);
  }
  return path.resolve(process.env["BABYSITTER_RUNS_DIR"] ?? path.join(process.cwd(), ".a5c", "runs"));
}
