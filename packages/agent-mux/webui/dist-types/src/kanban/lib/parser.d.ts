import type { Run, JournalEvent, TaskDetail, RunDigest } from "@/types";
/** Result of an incremental journal parse. */
export interface IncrementalJournalResult {
    events: JournalEvent[];
    /** Number of JSON files in the journal directory after this parse. */
    fileCount: number;
}
export declare function parseJournalDir(journalPath: string): Promise<JournalEvent[]>;
/**
 * Incrementally parse a journal directory.
 *
 * When `previousEvents` and `previousFileCount` are supplied the function
 * skips files that were already parsed in a previous call.  If the
 * directory now has *fewer* files than `previousFileCount` (truncation /
 * rotation) the journal is re-read from scratch.
 *
 * @param journalPath          Path to the journal directory.
 * @param previousEvents       Events returned by a prior call (used as base for merge).
 * @param previousFileCount    Number of JSON files that existed during the prior call.
 * @returns Merged events array (sorted by seq) and the current file count.
 */
export declare function parseJournalDirIncremental(journalPath: string, previousEvents?: JournalEvent[], previousFileCount?: number): Promise<IncrementalJournalResult>;
/** Options for incremental run parsing. */
export interface IncrementalRunOptions {
    previousEvents?: JournalEvent[];
    previousFileCount?: number;
}
/** Extended Run result that includes the journal file count for caching. */
export interface ParseRunResult extends Run {
    /** Number of journal files parsed — used by the cache layer for incremental reads. */
    _journalFileCount: number;
}
export declare function parseRunDir(runPath: string, incremental?: IncrementalRunOptions): Promise<ParseRunResult>;
export declare function parseTaskDetail(runPath: string, effectId: string): Promise<TaskDetail | null>;
export declare function getRunDigest(runPath: string): Promise<RunDigest>;
export declare function getRunIds(runsPath: string): Promise<string[]>;
