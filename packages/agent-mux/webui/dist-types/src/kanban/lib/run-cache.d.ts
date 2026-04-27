import type { WatchSource } from "./config-loader";
import type { RunDigest, Run, ProjectSummary } from "@/types";
export interface CachedRunDigest extends RunDigest {
    processId: string;
    sourceLabel?: string;
    projectName?: string;
}
export declare function getDigestCached(runDir: string, source: WatchSource, projectName: string): Promise<CachedRunDigest>;
export declare function getRunCached(runDir: string, source: WatchSource, projectName: string): Promise<Run>;
export declare function invalidateRun(runDir: string): void;
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
export declare function forceRefreshBreakpointRuns(): void;
export declare function invalidateAll(): void;
export declare function getProjectSummaries(): ProjectSummary[];
export declare function requestDiscovery(): void;
export declare function discoverAndCacheAll(): Promise<void>;
export declare function getAllCachedDigests(): CachedRunDigest[];
export declare function getCacheStats(): {
    size: number;
    entries: {
        runDir: string;
        status: import("@/types").RunStatus;
        cachedAt: number;
        hasFullRun: boolean;
    }[];
};
