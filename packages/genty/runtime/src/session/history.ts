/**
 * Session history persistence for GAP-SESSION-002.
 *
 * Stores accumulated decisions, run summaries, and context snapshots
 * in a dedicated <sessionId>.history.json file alongside the session state.
 * Uses the same atomic temp-file + rename pattern as context.ts.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import type {
  SessionDecision,
  SessionRunSummary,
  SessionContextSnapshot,
  SessionHistory,
} from "./types";
import { getSessionContext } from "./context";

// ---------------------------------------------------------------------------
// Path helper
// ---------------------------------------------------------------------------

/** Get the file path for a session's history JSON file. */
export function getSessionHistoryPath(stateDir: string, sessionId: string): string {
  return path.join(stateDir, `${sessionId}.history.json`);
}

// ---------------------------------------------------------------------------
// Internal: read/write raw history data
// ---------------------------------------------------------------------------

interface RawHistoryData {
  decisions: SessionDecision[];
  runSummaries: SessionRunSummary[];
  contextSnapshots: SessionContextSnapshot[];
}

function emptyHistoryData(): RawHistoryData {
  return { decisions: [], runSummaries: [], contextSnapshots: [] };
}

async function readRawHistory(filePath: string): Promise<RawHistoryData> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return emptyHistoryData();
    }
    return emptyHistoryData();
  }
  try {
    const data = JSON.parse(raw) as Partial<RawHistoryData>;
    return {
      decisions: Array.isArray(data.decisions) ? data.decisions : [],
      runSummaries: Array.isArray(data.runSummaries) ? data.runSummaries : [],
      contextSnapshots: Array.isArray(data.contextSnapshots) ? data.contextSnapshots : [],
    };
  } catch {
    return emptyHistoryData();
  }
}

async function writeRawHistory(filePath: string, data: RawHistoryData): Promise<void> {
  const dir = path.dirname(filePath);
  const tempPath = `${filePath}.tmp.${process.pid}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tempPath, filePath);
}

function nowTimestamp(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Append a decision to the session's history.
 * Automatically adds a timestamp.
 */
export async function addDecision(
  stateDir: string,
  sessionId: string,
  decision: Omit<SessionDecision, "timestamp">,
): Promise<void> {
  const filePath = getSessionHistoryPath(stateDir, sessionId);
  const data = await readRawHistory(filePath);
  data.decisions.push({ ...decision, timestamp: nowTimestamp() });
  await writeRawHistory(filePath, data);
}

/**
 * Append a run summary to the session's history.
 */
export async function addRunSummary(
  stateDir: string,
  sessionId: string,
  summary: SessionRunSummary,
): Promise<void> {
  const filePath = getSessionHistoryPath(stateDir, sessionId);
  const data = await readRawHistory(filePath);
  data.runSummaries.push(summary);
  await writeRawHistory(filePath, data);
}

/**
 * Save a context snapshot to the session's history.
 * Automatically adds a timestamp.
 */
export async function saveContextSnapshot(
  stateDir: string,
  sessionId: string,
  snapshot: Omit<SessionContextSnapshot, "timestamp">,
): Promise<void> {
  const filePath = getSessionHistoryPath(stateDir, sessionId);
  const data = await readRawHistory(filePath);
  data.contextSnapshots.push({ ...snapshot, timestamp: nowTimestamp() });
  await writeRawHistory(filePath, data);
}

/**
 * Get the full session history: SessionContext fields + history arrays.
 * Returns empty defaults when files do not exist.
 */
export async function getSessionHistory(
  stateDir: string,
  sessionId: string,
): Promise<SessionHistory> {
  const [context, rawHistory] = await Promise.all([
    getSessionContext(stateDir, sessionId),
    readRawHistory(getSessionHistoryPath(stateDir, sessionId)),
  ]);

  return {
    notes: context.notes,
    sharedKnowledge: context.sharedKnowledge,
    decisions: rawHistory.decisions,
    runSummaries: rawHistory.runSummaries,
    contextSnapshots: rawHistory.contextSnapshots,
  };
}
