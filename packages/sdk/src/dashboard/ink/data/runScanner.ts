/**
 * runScanner — pure async functions for scanning run directories.
 *
 * Extracted from cli/commands/tui.ts for reuse in the Ink-based TUI.
 * No UI dependencies — only filesystem and storage utilities.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { readRunMetadata } from "../../../storage/runFiles.js";
import { loadJournal } from "../../../storage/journal.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RunSummary {
  readonly runId: string;
  readonly runDir: string;
  readonly state: "completed" | "failed" | "waiting" | "created";
  readonly processId: string;
  readonly createdAt: string;
  readonly eventCount: number;
  readonly pendingCount: number;
  readonly prompt?: string;
}

export interface RunDetail {
  readonly runId: string;
  readonly runDir: string;
  readonly state: "completed" | "failed" | "waiting" | "created";
  readonly processId: string;
  readonly createdAt: string;
  readonly eventCount: number;
  readonly pendingCount: number;
  readonly resolvedCount: number;
  readonly prompt?: string;
  readonly events: ReadonlyArray<{
    readonly type: string;
    readonly recordedAt: string;
    readonly seq: number;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RunState = "completed" | "failed" | "waiting" | "created";

function deriveRunState(
  journal: ReadonlyArray<{ type: string }>,
  pendingCount: number,
): RunState {
  const lastLifecycleType = [...journal].reverse().find(
    (e) => e.type === "RUN_COMPLETED" || e.type === "RUN_FAILED",
  )?.type;

  if (lastLifecycleType === "RUN_COMPLETED") return "completed";
  if (lastLifecycleType === "RUN_FAILED") return "failed";
  if (pendingCount > 0) return "waiting";
  return "created";
}

// ---------------------------------------------------------------------------
// scanRuns
// ---------------------------------------------------------------------------

/**
 * Scan a runs directory and return summaries for all valid runs,
 * sorted by createdAt descending (most recent first).
 */
export async function scanRuns(runsDir: string): Promise<RunSummary[]> {
  const resolvedDir = path.resolve(runsDir);
  let entries: string[];
  try {
    entries = await fs.readdir(resolvedDir);
  } catch {
    return [];
  }

  const summaries: RunSummary[] = [];

  for (const entry of entries) {
    const runDir = path.join(resolvedDir, entry);
    const metadataPath = path.join(runDir, "run.json");
    try {
      await fs.access(metadataPath);
    } catch {
      continue; // Not a run directory
    }

    try {
      const metadata = await readRunMetadata(runDir);
      let journal: Array<{ type: string; recordedAt: string; seq: number }> = [];
      try {
        journal = await loadJournal(runDir) as Array<{ type: string; recordedAt: string; seq: number }>;
      } catch {
        // Journal may not exist yet
      }

      const requestedCount = journal.filter((e) => e.type === "EFFECT_REQUESTED").length;
      const resolvedCount = journal.filter((e) => e.type === "EFFECT_RESOLVED").length;
      const pendingCount = Math.max(0, requestedCount - resolvedCount);

      const state = deriveRunState(journal, pendingCount);

      summaries.push({
        runId: metadata.runId ?? entry,
        runDir,
        state,
        processId: metadata.processId ?? "unknown",
        createdAt: metadata.createdAt ?? "",
        eventCount: journal.length,
        pendingCount,
        prompt: (metadata as Record<string, unknown>).prompt as string | undefined,
      });
    } catch {
      // Skip malformed runs
    }
  }

  // Sort by createdAt descending (most recent first)
  summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return summaries;
}

// ---------------------------------------------------------------------------
// getRunDetail
// ---------------------------------------------------------------------------

/**
 * Load detailed information about a specific run.
 */
export async function getRunDetail(runDir: string): Promise<RunDetail> {
  const metadata = await readRunMetadata(runDir);
  const journal = await loadJournal(runDir) as Array<{ type: string; recordedAt: string; seq: number }>;

  const requestedCount = journal.filter((e) => e.type === "EFFECT_REQUESTED").length;
  const resolvedCount = journal.filter((e) => e.type === "EFFECT_RESOLVED").length;
  const pendingCount = Math.max(0, requestedCount - resolvedCount);

  const state = deriveRunState(journal, pendingCount);

  return {
    runId: metadata.runId ?? path.basename(runDir),
    runDir,
    state,
    processId: metadata.processId ?? "unknown",
    createdAt: metadata.createdAt ?? "",
    eventCount: journal.length,
    pendingCount,
    resolvedCount,
    prompt: (metadata as Record<string, unknown>).prompt as string | undefined,
    events: journal.map((e) => ({
      type: e.type,
      recordedAt: e.recordedAt,
      seq: e.seq,
    })),
  };
}
