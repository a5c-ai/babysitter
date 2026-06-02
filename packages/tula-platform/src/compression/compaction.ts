/**
 * Status: Integrated with agent-platform orchestration.
 * Moved from @a5c-ai/babysitter-sdk.
 * GAP-PERF-002: Session Compaction.
 *
 * Summarizes and condenses orchestration history to prevent context window
 * overflow during long runs. Multiple strategies with auto-triggering
 * based on token budget thresholds.
 *
 * Compacted data is stored as overlays — original journals and task artifacts
 * are never modified.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CompactionStrategy =
  | "tool-output-summarization"
  | "iteration-digest";

export interface CompactionConfig {
  enabled: boolean;
  /** Token budget threshold that triggers auto-compaction. */
  autoCompactThreshold: number;
  /** Strategies to apply, in order. */
  strategies: CompactionStrategy[];
  /** Maximum recent iterations to keep uncompacted. */
  keepRecentIterations: number;
  /** Target token reduction ratio for tool output summarization (0-1). */
  toolOutputTargetReduction: number;
}

export interface CompactionResult {
  strategy: CompactionStrategy;
  tokensBefore: number;
  tokensAfter: number;
  itemsCompacted: number;
  compactedAt: string;
}

export interface IterationDigest {
  iteration: number;
  runId: string;
  summary: string;
  resolvedEffects: string[];
  durationSeconds: number;
  timestamp: string;
}

export interface ToolOutputSummary {
  /** Relative path from runsDir: runId/tasks/effectId/file */
  relativePath: string;
  /** Truncated/summarized content */
  summary: string;
  /** Original token count */
  originalTokens: number;
}

export interface CompactionState {
  operations: CompactionResult[];
  iterationDigests: IterationDigest[];
  toolOutputSummaries: ToolOutputSummary[];
  totalTokensSaved: number;
}

// ---------------------------------------------------------------------------
// Journal event shape (minimal, to avoid circular deps)
// ---------------------------------------------------------------------------

interface JournalEvent {
  type: string;
  recordedAt: string;
  data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_COMPACTION_CONFIG: CompactionConfig = {
  enabled: true,
  autoCompactThreshold: 80_000,
  strategies: ["tool-output-summarization", "iteration-digest"],
  keepRecentIterations: 3,
  toolOutputTargetReduction: 0.6,
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function emptyCompactionState(): CompactionState {
  return { operations: [], iterationDigests: [], toolOutputSummaries: [], totalTokensSaved: 0 };
}

async function readRaw(filePath: string): Promise<CompactionState> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return emptyCompactionState();
    return emptyCompactionState();
  }
  try {
    const data = JSON.parse(raw) as Partial<CompactionState>;
    return {
      operations: Array.isArray(data.operations) ? data.operations : [],
      iterationDigests: Array.isArray(data.iterationDigests) ? data.iterationDigests : [],
      toolOutputSummaries: Array.isArray(data.toolOutputSummaries) ? data.toolOutputSummaries : [],
      totalTokensSaved: typeof data.totalTokensSaved === "number" ? data.totalTokensSaved : 0,
    };
  } catch {
    return emptyCompactionState();
  }
}

async function writeRaw(filePath: string, data: CompactionState): Promise<void> {
  const dir = path.dirname(filePath);
  const tempPath = `${filePath}.tmp.${process.pid}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tempPath, filePath);
}

/** Rough token estimate: ~4 chars per token. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getCompactionStatePath(stateDir: string, sessionId: string): string {
  return path.join(stateDir, `${sessionId}.compaction.json`);
}

export async function getCompactionState(stateDir: string, sessionId: string): Promise<CompactionState> {
  return readRaw(getCompactionStatePath(stateDir, sessionId));
}

/**
 * Check whether auto-compaction should trigger.
 */
export function shouldAutoCompact(estimatedTokens: number, config: CompactionConfig): boolean {
  if (!config.enabled) return false;
  return estimatedTokens > config.autoCompactThreshold;
}

/**
 * Build a digest from a set of journal events belonging to one iteration.
 * Pure function.
 */
export function buildIterationDigest(
  runId: string,
  iteration: number,
  events: JournalEvent[],
): IterationDigest {
  const resolvedEffects: string[] = [];
  let earliestAt = "";
  let latestAt = "";

  for (const ev of events) {
    if (!earliestAt || ev.recordedAt < earliestAt) earliestAt = ev.recordedAt;
    if (!latestAt || ev.recordedAt > latestAt) latestAt = ev.recordedAt;

    if (ev.type === "EFFECT_RESOLVED" && ev.data) {
      const effectId = ev.data.effectId as string | undefined;
      if (effectId) resolvedEffects.push(effectId);
    }
  }

  const durationSeconds =
    earliestAt && latestAt
      ? (new Date(latestAt).getTime() - new Date(earliestAt).getTime()) / 1000
      : 0;

  const effectCount = resolvedEffects.length;
  const eventTypes = [...new Set(events.map((e) => e.type))];
  const summary = `Iteration ${iteration}: ${effectCount} effect(s) resolved, events: ${eventTypes.join(", ")}`;

  return {
    iteration,
    runId,
    summary,
    resolvedEffects,
    durationSeconds,
    timestamp: latestAt || new Date().toISOString(),
  };
}

/**
 * Run compaction strategies on a session.
 * Reads journal/tasks as needed but only writes to the overlay file — never
 * modifies originals.
 */
export async function compactSession(
  stateDir: string,
  sessionId: string,
  runsDir: string,
  config: CompactionConfig = DEFAULT_COMPACTION_CONFIG,
): Promise<CompactionResult[]> {
  if (!config.enabled) return [];

  const overlayPath = getCompactionStatePath(stateDir, sessionId);
  const state = await readRaw(overlayPath);
  const results: CompactionResult[] = [];

  for (const strategy of config.strategies) {
    const result = await applyStrategy(strategy, runsDir, config, state);
    if (result) {
      state.operations.push(result);
      state.totalTokensSaved += result.tokensBefore - result.tokensAfter;
      results.push(result);
    }
  }

  await writeRaw(overlayPath, state);
  return results;
}

async function applyStrategy(
  strategy: CompactionStrategy,
  runsDir: string,
  config: CompactionConfig,
  state: CompactionState,
): Promise<CompactionResult | undefined> {
  const now = new Date().toISOString();

  if (strategy === "iteration-digest") {
    // Scan run directories for journal files, build digests for old iterations
    const existingDigestIterations = new Set(state.iterationDigests.map((d) => `${d.runId}:${d.iteration}`));
    let itemsCompacted = 0;
    let tokensBefore = 0;
    let tokensAfter = 0;

    let runDirs: string[];
    try {
      const entries = await fs.readdir(runsDir, { withFileTypes: true });
      runDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      return undefined;
    }

    for (const runDir of runDirs) {
      const journalDir = path.join(runsDir, runDir, "journal");
      let files: string[];
      try {
        files = await fs.readdir(journalDir);
      } catch {
        continue;
      }

      // Group events by iteration (heuristic: each EFFECT_REQUESTED starts new iteration group)
      const events: JournalEvent[] = [];
      for (const file of files.sort()) {
        if (!file.endsWith(".json")) continue;
        try {
          const raw = await fs.readFile(path.join(journalDir, file), "utf8");
          events.push(JSON.parse(raw) as JournalEvent);
        } catch {
          continue;
        }
      }

      if (events.length === 0) continue;

      // Simple iteration grouping: split at RUN_CREATED or sequential grouping
      const iterationSize = Math.max(1, Math.ceil(events.length / Math.max(1, config.keepRecentIterations + 1)));
      const totalGroups = Math.ceil(events.length / iterationSize);
      const compactableGroups = Math.max(0, totalGroups - config.keepRecentIterations);

      for (let i = 0; i < compactableGroups; i++) {
        const key = `${runDir}:${i + 1}`;
        if (existingDigestIterations.has(key)) continue;

        const groupEvents = events.slice(i * iterationSize, (i + 1) * iterationSize);
        const beforeTokens = estimateTokens(JSON.stringify(groupEvents));
        const digest = buildIterationDigest(runDir, i + 1, groupEvents);
        const afterTokens = estimateTokens(JSON.stringify(digest));

        state.iterationDigests.push(digest);
        tokensBefore += beforeTokens;
        tokensAfter += afterTokens;
        itemsCompacted++;
      }
    }

    if (itemsCompacted === 0) return undefined;
    return { strategy, tokensBefore, tokensAfter, itemsCompacted, compactedAt: now };
  }

  if (strategy === "tool-output-summarization") {
    // Scan task directories for large stdout/stderr, create summarized overlays
    let itemsCompacted = 0;
    let tokensBefore = 0;
    let tokensAfter = 0;

    let runDirs: string[];
    try {
      const entries = await fs.readdir(runsDir, { withFileTypes: true });
      runDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      return undefined;
    }

    for (const runDir of runDirs) {
      const tasksDir = path.join(runsDir, runDir, "tasks");
      let taskDirs: string[];
      try {
        const entries = await fs.readdir(tasksDir, { withFileTypes: true });
        taskDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
      } catch {
        continue;
      }

      for (const taskDir of taskDirs) {
        for (const file of ["stdout.txt", "stderr.txt"]) {
          const filePath = path.join(tasksDir, taskDir, file);
          try {
            const content = await fs.readFile(filePath, "utf8");
            const beforeTokens = estimateTokens(content);
            if (beforeTokens < 200) continue; // Skip small outputs

            const relativePath = `${runDir}/tasks/${taskDir}/${file}`;
            // Skip if already summarized
            if (state.toolOutputSummaries.some((s) => s.relativePath === relativePath)) continue;

            const targetLength = Math.ceil(content.length * (1 - config.toolOutputTargetReduction));
            const truncated = content.slice(0, targetLength) + "\n... [compacted]";
            const afterTokens = estimateTokens(truncated);

            state.toolOutputSummaries.push({
              relativePath,
              summary: truncated,
              originalTokens: beforeTokens,
            });

            tokensBefore += beforeTokens;
            tokensAfter += afterTokens;
            itemsCompacted++;
          } catch {
            continue;
          }
        }
      }
    }

    if (itemsCompacted === 0) return undefined;
    return { strategy, tokensBefore, tokensAfter, itemsCompacted, compactedAt: now };
  }

  return undefined;
}

/**
 * Render iteration digests as markdown for prompt injection.
 */
export function renderCompactedHistory(state: CompactionState): string {
  if (state.iterationDigests.length === 0) return "";

  const lines = state.iterationDigests.map(
    (d) => `- **Iter ${d.iteration}** (${d.runId}): ${d.summary} [${d.durationSeconds.toFixed(1)}s]`,
  );

  return `## Compacted History\n\n${lines.join("\n")}\n\n_${state.totalTokensSaved} tokens saved across ${state.operations.length} compaction(s)._`;
}
