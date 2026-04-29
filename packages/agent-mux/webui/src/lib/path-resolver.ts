import path from "path";
import { discoverAllRunDirs, invalidateDiscoveryCache, type DiscoveredRun } from "./source-discovery";

// Find a specific run directory by runId across all sources.
// On cache miss, invalidates the discovery cache and retries once
// to handle runs created after the last cache refresh.
export async function findRunDir(runId: string): Promise<DiscoveredRun | null> {
  const allRuns = await discoverAllRunDirs();
  const found = allRuns.find((r) => path.basename(r.runDir) === runId);
  if (found) return found;

  // Cache may be stale — force re-discovery and retry
  invalidateDiscoveryCache();
  const fresh = await discoverAllRunDirs();
  return fresh.find((r) => path.basename(r.runDir) === runId) || null;
}
