import { getRunDigest, parseRunDir } from "./parser";
import type { ParseRunResult } from "./parser";
import { discoverAllRunDirs, type DiscoveredRun } from "./source-discovery";
import type { WatchSource } from "./config-loader";
import type { RunDigest, Run, ProjectSummary } from "@/types";
import { promises as fs } from "fs";
import path from "path";
import { getGlobal } from "./global-registry";

/** Return true when err represents a "file/directory not found" filesystem error. */
function isNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as NodeJS.ErrnoException).code;
  return code === "ENOENT" || code === "ENOTDIR" || err.message.includes("ENOENT");
}

// Extended RunDigest with cache metadata
export interface CachedRunDigest extends RunDigest {
  processId: string;
  sourceLabel?: string;
  projectName?: string;
}

interface CacheEntry {
  digest: CachedRunDigest;
  cachedAt: number;
  runDir: string;
  fullRun?: Run;
  /** Number of journal files parsed in the last full-run read — used for incremental parsing. */
  journalFileCount?: number;
}

// Persist cache across HMR reloads via typed global registry
function getCache(): Map<string, CacheEntry> {
  return getGlobal('__observer_run_cache__', () => new Map<string, CacheEntry>()) as Map<string, CacheEntry>;
}

// Cache size limit to prevent unbounded memory growth
const MAX_CACHE_SIZE = 1000;

// TTL constants
const TTL_COMPLETED = 30000; // 30s for completed runs
const TTL_ACTIVE = 5000; // 5s for active runs (waiting/pending)
// Note: TTL_BREAKPOINT was removed in v0.12.3 — the aggressive 3s eviction
// in getProjectSummaries() caused breakpoint banner flickering during active
// orchestration (race condition with forceRefreshBreakpointRuns + discovery
// debounce). The normal TTL_ACTIVE (5s) is sufficient for timely updates.

function getTTL(status: RunDigest["status"]): number {
  return status === "waiting" || status === "pending" ? TTL_ACTIVE : TTL_COMPLETED;
}

function isCacheValid(entry: CacheEntry): boolean {
  const now = Date.now();
  const ttl = getTTL(entry.digest.status);
  return now - entry.cachedAt < ttl;
}

// Evict oldest entries when cache exceeds MAX_CACHE_SIZE.
// Evicts expired entries first, then oldest by cachedAt if still over limit.
function evictIfNeeded(): void {
  const cache = getCache();
  if (cache.size <= MAX_CACHE_SIZE) return;

  // First pass: remove expired entries
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.cachedAt >= getTTL(entry.digest.status)) {
      cache.delete(key);
    }
  }
  if (cache.size <= MAX_CACHE_SIZE) return;

  // Second pass: evict oldest entries until under limit
  const entries = Array.from(cache.entries()).sort(
    ([, a], [, b]) => a.cachedAt - b.cachedAt
  );
  const toRemove = cache.size - MAX_CACHE_SIZE;
  for (let i = 0; i < toRemove; i++) {
    cache.delete(entries[i][0]);
  }
}

// Read processId and optional projectName from run.json
async function getRunJsonMeta(runDir: string): Promise<{ processId: string; projectName?: string }> {
  try {
    const runJsonPath = path.join(runDir, "run.json");
    const content = await fs.readFile(runJsonPath, "utf-8");
    const json = JSON.parse(content);
    return {
      processId: json.processId || "unknown",
      projectName: json.projectName || undefined,
    };
  } catch (err) {
    // ENOENT is expected for runs that haven't written run.json yet; warn on corruption or permission errors
    if (!isNotFoundError(err)) {
      console.warn(`[run-cache] Failed to read run.json metadata from ${runDir}:`, err);
    }
    return { processId: "unknown" };
  }
}

export async function getDigestCached(
  runDir: string,
  source: WatchSource,
  projectName: string
): Promise<CachedRunDigest> {
  const cache = getCache();
  const entry = cache.get(runDir);

  // Return cached if valid
  if (entry && isCacheValid(entry)) {
    return entry.digest;
  }

  // Cache miss — fetch fresh digest
  const digest = await getRunDigest(runDir);
  const meta = await getRunJsonMeta(runDir);

  // Prefer projectName from run.json over discovery-provided name
  const effectiveProjectName = meta.projectName || projectName;

  const cachedDigest: CachedRunDigest = {
    ...digest,
    processId: meta.processId,
    sourceLabel: source.label,
    projectName: effectiveProjectName,
  };

  // Update cache
  cache.set(runDir, {
    digest: cachedDigest,
    cachedAt: Date.now(),
    runDir,
    fullRun: entry?.fullRun, // Preserve full run if present
    journalFileCount: entry?.journalFileCount, // Preserve for incremental parsing
  });

  evictIfNeeded();

  return cachedDigest;
}

export async function getRunCached(
  runDir: string,
  source: WatchSource,
  projectName: string
): Promise<Run> {
  const cache = getCache();
  const entry = cache.get(runDir);

  // Return cached full run if valid and present
  if (entry && isCacheValid(entry) && entry.fullRun) {
    return entry.fullRun;
  }

  // Build incremental options from previous cache entry (if available).
  // This avoids re-parsing all journal files when only new events have
  // been appended since the last read.
  const incremental =
    entry?.fullRun && entry.journalFileCount !== undefined
      ? {
          previousEvents: entry.fullRun.events,
          previousFileCount: entry.journalFileCount,
        }
      : undefined;

  // Fetch full run (incrementally when possible)
  const run = await parseRunDir(runDir, incremental) as ParseRunResult;

  // Extract the journal file count before stripping it from the Run object
  const journalFileCount = run._journalFileCount;

  // Read run.json meta for accurate projectName
  const meta = await getRunJsonMeta(runDir);
  const effectiveProjectName = meta.projectName || projectName;

  // Enrich with metadata
  const enrichedRun: Run = {
    ...run,
    sourceLabel: source.label,
    projectName: effectiveProjectName,
  };
  // Remove internal field from the exposed Run object
  delete (enrichedRun as unknown as Record<string, unknown>)._journalFileCount;

  // Update cache with full run
  const digest = await getDigestCached(runDir, source, projectName);
  cache.set(runDir, {
    digest,
    cachedAt: Date.now(),
    runDir,
    fullRun: enrichedRun,
    journalFileCount,
  });

  evictIfNeeded();

  return enrichedRun;
}

export function invalidateRun(runDir: string): void {
  getCache().delete(runDir);
}

/**
 * Force-invalidate all cached entries that have pending breakpoints.
 *
 * Design note: this intentionally checks only `pendingBreakpoints > 0` without
 * also requiring `waitingKind === "breakpoint"`.  The broader condition is safer
 * because it ensures *any* entry that might represent a breakpoint — even one
 * whose waitingKind was not yet set by the parser — is evicted and refetched.
 * `getProjectSummaries()` applies the stricter `waitingKind === "breakpoint"`
 * filter when *counting* breakpoints for display, so the worst case of a
 * broader eviction here is an extra cache miss, not a false positive in the UI.
 */
export function forceRefreshBreakpointRuns(): void {
  const cache = getCache();
  for (const [runDir, entry] of cache) {
    if (entry.digest.pendingBreakpoints && entry.digest.pendingBreakpoints > 0) {
      cache.delete(runDir);
    }
  }
}

export function invalidateAll(): void {
  getCache().clear();
  lastDiscoveryTime = 0;
  discoveryNeeded = true; // Force re-discovery on next request
}

export function getProjectSummaries(): ProjectSummary[] {
  const cache = getCache();

  // Build project summaries from cache entries.
  // Breakpoint entries are only included when isCacheValid() passes (TTL_ACTIVE = 5s),
  // which ensures stale breakpoint data is not displayed without destructively
  // deleting cache entries (which caused flickering — see v0.12.3 fix).
  const projectMap = new Map<string, {
    totalRuns: number;
    activeRuns: number;
    completedRuns: number;
    failedRuns: number;
    staleRuns: number;
    totalTasks: number;
    completedTasksAggregate: number;
    latestUpdate: string;
    pendingBreakpoints: number;
    breakpointRuns: ProjectSummary["breakpointRuns"];
  }>();

  for (const entry of cache.values()) {
    const projectName = entry.digest.projectName || "Unknown";
    const existing = projectMap.get(projectName) || {
      totalRuns: 0,
      activeRuns: 0,
      completedRuns: 0,
      failedRuns: 0,
      staleRuns: 0,
      totalTasks: 0,
      completedTasksAggregate: 0,
      latestUpdate: "",
      pendingBreakpoints: 0,
      breakpointRuns: [],
    };

    existing.totalRuns++;
    existing.totalTasks += entry.digest.taskCount || 0;
    existing.completedTasksAggregate += entry.digest.completedTasks || 0;

    if ((entry.digest.status === "waiting" || entry.digest.status === "pending") && !entry.digest.isStale) {
      existing.activeRuns++;
    } else if (entry.digest.status === "completed") {
      existing.completedRuns++;
    } else if (entry.digest.status === "failed") {
      existing.failedRuns++;
    }

    if (entry.digest.isStale) {
      existing.staleRuns++;
    }

    // Track pending breakpoints. Breakpoint state only changes when explicitly
    // approved (which calls invalidateRun), so we always count cached breakpoints
    // regardless of cache TTL — the TTL controls when to re-fetch data from disk,
    // not whether the data is valid for display. Removing the isCacheValid check
    // prevents breakpoint banner flickering when discovery is debounced. (v0.12.3)
    if (entry.digest.pendingBreakpoints && entry.digest.pendingBreakpoints > 0 &&
        entry.digest.waitingKind === "breakpoint") {
      existing.pendingBreakpoints += entry.digest.pendingBreakpoints;
      existing.breakpointRuns.push({
        runId: entry.digest.runId,
        effectId: entry.digest.breakpointEffectId || "",
        projectName,
        processId: entry.digest.processId || "unknown",
        breakpointQuestion: entry.digest.breakpointQuestion || "Approval required",
      });
    }

    // Track latest update
    if (!existing.latestUpdate || entry.digest.updatedAt > existing.latestUpdate) {
      existing.latestUpdate = entry.digest.updatedAt;
    }

    projectMap.set(projectName, existing);
  }

  return Array.from(projectMap.entries()).map(([projectName, stats]) => ({
    projectName,
    ...stats,
  }));
}

// Debounce discovery to avoid scanning filesystem on every poll
let lastDiscoveryTime = 0;
const DISCOVERY_DEBOUNCE_MS = 10000; // 10s — reduced from 60s to ensure new runs appear quickly
let discoveryNeeded = true; // Flag set by watcher when new runs detected

// Signal that new runs may exist (called by watcher)
export function requestDiscovery(): void {
  discoveryNeeded = true;
}

export async function discoverAndCacheAll(): Promise<void> {
  const cache = getCache();
  const now = Date.now();

  // If cache is populated and no new runs detected, skip expensive filesystem scan
  if (cache.size > 0 && !discoveryNeeded && now - lastDiscoveryTime < DISCOVERY_DEBOUNCE_MS) {
    return;
  }

  lastDiscoveryTime = now;
  discoveryNeeded = false;

  const discovered = await discoverAllRunDirs();

  // Deduplicate by run ID (basename) — discoverAllRunDirs already deduplicates
  // by run ID preferring directories with run.json, but guard here too in case
  // the same run ID somehow appears from different sources.
  const seen = new Set<string>();
  const unique = discovered.filter((d: DiscoveredRun) => {
    const runId = path.basename(d.runDir);
    if (seen.has(runId)) return false;
    seen.add(runId);
    return true;
  });

  // Build the set of valid runDir paths from discovery
  const validRunDirs = new Set(unique.map((d: DiscoveredRun) => d.runDir));

  // Prune cache entries whose runDir is no longer in the discovered set.
  // This removes ghost entries that were cached before dedup was applied
  // (e.g. a duplicate run discovered at a different path).
  for (const [runDir] of cache) {
    if (!validRunDirs.has(runDir)) {
      cache.delete(runDir);
    }
  }

  // Pre-populate cache with digests in batches to avoid overwhelming filesystem
  const BATCH_SIZE = 10;
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (discoveredRun: DiscoveredRun) => {
        try {
          await getDigestCached(
            discoveredRun.runDir,
            discoveredRun.source,
            discoveredRun.projectName
          );
        } catch (err) {
          console.error(`Failed to cache run ${discoveredRun.runDir}:`, err);
        }
      })
    );
  }
}

// Return all cached digests without filesystem scanning.
// Used by the digest API for fast, non-blocking responses.
export function getAllCachedDigests(): CachedRunDigest[] {
  const cache = getCache();
  const digests: CachedRunDigest[] = [];
  for (const entry of cache.values()) {
    digests.push(entry.digest);
  }
  return digests;
}

// Export cache for debugging
export function getCacheStats() {
  const cache = getCache();
  return {
    size: cache.size,
    entries: Array.from(cache.entries()).map(([runDir, entry]) => ({
      runDir,
      status: entry.digest.status,
      cachedAt: entry.cachedAt,
      hasFullRun: !!entry.fullRun,
    })),
  };
}
