import { promises as fs } from "fs";
import path from "path";
import { isNotFoundError, getConfig, type WatchSource } from "./config-loader";

export interface DiscoveredRun {
  runDir: string;
  source: WatchSource;
  projectName: string; // e.g. "hockey_7_shifts", "podcast-intel"
  projectPath: string; // full path to the project directory
}

// Discover all .a5c/runs/ directories within a source
async function discoverRunsInSource(source: WatchSource): Promise<string[]> {
  const results: string[] = [];

  async function scan(dir: string, currentDepth: number) {
    try {
      // Check if this directory itself IS an .a5c/runs dir (depth=0 means direct path)
      if (source.depth === 0) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        return entries
          .filter((e) => e.isDirectory())
          .map((e) => path.join(dir, e.name));
      }

      // Check for .a5c/runs/ at this level
      const runsPath = path.join(dir, ".a5c", "runs");
      try {
        const stat = await fs.stat(runsPath);
        if (stat.isDirectory()) {
          results.push(runsPath);
        }
      } catch {
        // Expected: no .a5c/runs directory at this level — skip silently
      }

      // Recurse into subdirectories if within depth
      if (currentDepth < source.depth) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (
            entry.isDirectory() &&
            !entry.name.startsWith(".") &&
            entry.name !== "node_modules"
          ) {
            await scan(path.join(dir, entry.name), currentDepth + 1);
          }
        }
      }
    } catch (err) {
      if (!isNotFoundError(err)) {
        console.warn(`[config] Cannot scan directory ${dir} (depth=${currentDepth}):`, err);
      }
    }
  }

  if (source.depth === 0) {
    // Direct .a5c/runs path — just return runs inside it
    try {
      const entries = await fs.readdir(source.path, { withFileTypes: true });
      return entries
        .filter((e) => e.isDirectory())
        .map((e) => path.join(source.path, e.name));
    } catch (err) {
      console.warn(`[config] Cannot list runs in direct source ${source.path}:`, err);
      return [];
    }
  }

  await scan(source.path, 0);
  return results;
}

// Extract project name from a .a5c/runs/ path
function extractProjectName(runsDir: string): { projectName: string; projectPath: string } {
  // runsDir is like /path/to/project/.a5c/runs
  // projectPath is /path/to/project
  const a5cDir = path.dirname(runsDir); // .a5c
  const projectPath = path.dirname(a5cDir); // project dir
  const projectName = path.basename(projectPath);
  return { projectName, projectPath };
}

// Cache discovery results to avoid repeated filesystem scanning
let discoveryCache: DiscoveredRun[] = [];
let discoveryCacheTime = 0;
const DISCOVERY_CACHE_TTL = 10000; // 10s — watcher handles real-time changes

// Force re-discovery on next call (called when new runs are detected by watcher)
export function invalidateDiscoveryCache(): void {
  discoveryCache = [];
  discoveryCacheTime = 0;
}

// Get all run directories across all sources
export async function discoverAllRunDirs(): Promise<DiscoveredRun[]> {
  const now = Date.now();
  if (discoveryCache.length > 0 && now - discoveryCacheTime < DISCOVERY_CACHE_TTL) {
    return discoveryCache;
  }

  const config = await getConfig();
  const allRuns: DiscoveredRun[] = [];

  for (const source of config.sources) {
    if (source.depth === 0) {
      // Direct runs directory — list subdirs as individual runs
      // Project name: prefer run.json's projectName, fall back to source label or path
      const fallbackProjectName = source.label || path.basename(source.path);
      try {
        const entries = await fs.readdir(source.path, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            // Try to read projectName from run.json for more accurate project grouping
            let projectName = fallbackProjectName;
            try {
              const runJsonPath = path.join(source.path, entry.name, "run.json");
              const content = await fs.readFile(runJsonPath, "utf-8");
              const json = JSON.parse(content);
              if (json.projectName) {
                projectName = json.projectName;
              }
            } catch (err) {
              // run.json missing is expected for new runs; warn only on parse/permission errors
              if (!isNotFoundError(err)) {
                console.warn(`[config] Failed to read run.json in ${path.join(source.path, entry.name)} — using fallback project name:`, err);
              }
            }
            allRuns.push({
              runDir: path.join(source.path, entry.name),
              source,
              projectName,
              projectPath: source.path,
            });
          }
        }
      } catch (err) {
        console.warn(`[config] Source directory not accessible ${source.path}:`, err);
      }
    } else {
      // Discover .a5c/runs/ directories within depth
      const runsDirs = await discoverRunsInSource(source);
      for (const runsDir of runsDirs) {
        const { projectName, projectPath } = extractProjectName(runsDir);
        try {
          const entries = await fs.readdir(runsDir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              allRuns.push({
                runDir: path.join(runsDir, entry.name),
                source,
                projectName,
                projectPath,
              });
            }
          }
        } catch (err) {
          console.warn(`[config] Cannot read runs directory ${runsDir}:`, err);
        }
      }
    }
  }

  // Deduplicate by runId (basename of runDir). When the same run ID appears
  // under multiple .a5c/runs/ directories (e.g. a "ghost" .a5c created by a
  // task execution in a subdirectory), keep the first occurrence — which is
  // the shallowest/earliest discovered and typically the one with full data
  // (run.json + journal).
  const seenRunIds = new Map<string, DiscoveredRun>();
  for (const run of allRuns) {
    const runId = path.basename(run.runDir);
    if (!seenRunIds.has(runId)) {
      seenRunIds.set(runId, run);
    } else {
      // Prefer the run directory that has a run.json (i.e. the real one)
      const existing = seenRunIds.get(runId)!;
      const existingHasRunJson = await fs.access(path.join(existing.runDir, "run.json")).then(() => true, () => false);
      if (!existingHasRunJson) {
        const candidateHasRunJson = await fs.access(path.join(run.runDir, "run.json")).then(() => true, () => false);
        if (candidateHasRunJson) {
          seenRunIds.set(runId, run);
        }
      }
    }
  }

  const result = Array.from(seenRunIds.values());
  discoveryCache = result;
  discoveryCacheTime = Date.now();
  return result;
}

// Discover all .a5c/runs/ parent directories (including empty ones).
// Used by the watcher to set up watches on directories that don't have runs yet,
// so that the very first run in a new project is detected immediately.
export async function discoverAllRunsParentDirs(): Promise<string[]> {
  const config = await getConfig();
  const allDirs: string[] = [];

  for (const source of config.sources) {
    if (source.depth === 0) {
      // Direct runs path — watch the source path itself
      try {
        await fs.access(source.path);
        allDirs.push(source.path);
      } catch (err) {
        console.warn(`[config] Watch source path not accessible ${source.path}:`, err);
      }
    } else {
      const runsDirs = await discoverRunsInSource(source);
      allDirs.push(...runsDirs);
    }
  }

  return allDirs;
}
