import { resolveRunsDir } from "../../config";

/**
 * Resolves the runs directory using the shared SDK policy.
 * Accepts an optional override (e.g. from tool args or env).
 */
export function resolveRunDir(overridePath?: string): string {
  return resolveRunsDir({ override: overridePath });
}
