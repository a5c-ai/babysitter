import { readRunMetadata, readRunInputs } from "../../storage/runFiles";
import { RunMetadata, JournalEvent } from "../../storage/types";
import { loadJournal } from "../../storage/journal";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { buildEffectIndex, EffectIndex } from "./effectIndex";
import { ReplayCursor } from "./replayCursor";
import { ProcessContext, ForwardFixStrikeBudget } from "../types";
import { createProcessContext, InternalProcessContext } from "../processContext";
import { createStrikeTracker, normalizeStrikeBudget } from "../strikeTracker";
import { replaySchemaVersion } from "../constants";
import { RunFailedError } from "../exceptions";
import { journalHeadsEqual, readStateCache, rebuildStateCache, StateCacheSnapshot } from "./stateCache";

/**
 * Marker label written on PROCESS_LOG events when a forward-fix strike is
 * recorded. Replay scans for this label to rebuild the in-memory tracker
 * counts deterministically.
 */
export const STRIKE_FAILURE_LOG_LABEL = "strike-budget:failure";
/** Marker label written when a strike budget is exhausted (informational). */
export const STRIKE_EXHAUSTED_LOG_LABEL = "strike-budget-exhausted";

export interface CreateReplayEngineOptions {
  runDir: string;
  now?: () => Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger?: (...args: any[]) => void;
}

export interface ReplayEngine {
  runId: string;
  runDir: string;
  metadata: RunMetadata;
  inputs?: unknown;
  effectIndex: EffectIndex;
  replayCursor: ReplayCursor;
  context: ProcessContext;
  internalContext: InternalProcessContext;
  stateCache?: StateCacheSnapshot | null;
  stateRebuild?: { reason: string; previous?: { seq: number; ulid: string } | null } | null;
}

export async function createReplayEngine(options: CreateReplayEngineOptions): Promise<ReplayEngine> {
  const metadata = await readRunMetadata(options.runDir);
  ensureCompatibleLayout(metadata.layoutVersion, options.runDir);
  const inputs = await readRunInputs(options.runDir);

  // Load journal once — shared by effect index builder and log seq scanner.
  // Wraps parse errors into RunFailedError for consistency with the old
  // code-path where buildEffectIndex loaded the journal internally.
  let journal: JournalEvent[];
  try {
    journal = await loadJournal(options.runDir);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "JOURNAL_PARSE_FAILED") {
      throw new RunFailedError("Failed to parse journal event", {
        path: err.path,
        runDir: options.runDir,
        error: err.message,
      });
    }
    throw error;
  }

  const effectIndex = await buildEffectIndex({ runDir: options.runDir, events: journal });
  const { snapshot: stateCacheSnapshot, rebuildMeta: stateRebuild } = await resolveStateCacheSnapshot({
    runDir: options.runDir,
    effectIndex,
  });

  // Build set of already-recorded log seqs for replay deduplication.
  // Read from state/logSeqs.txt (not journal) to avoid race conditions.
  const recordedLogSeqs = await readRecordedLogSeqs(options.runDir);

  const replayCursor = new ReplayCursor();
  const processId = metadata.processId ?? metadata.request ?? metadata.runId;

  // Reconstruct the forward-fix strike tracker from journal PROCESS_LOG events.
  // Each `strike-budget:failure` event carries a `bugClass` field; we replay
  // those into the tracker so the in-memory counts match the journal state.
  const rawBudget = (metadata.forwardFixStrikeBudget ?? undefined) as
    | Partial<ForwardFixStrikeBudget>
    | undefined;
  const forwardFixStrikeBudget = rawBudget ? normalizeStrikeBudget(rawBudget) : undefined;
  const strikeTracker = forwardFixStrikeBudget ? createStrikeTracker(forwardFixStrikeBudget) : undefined;
  if (strikeTracker) {
    for (const event of journal) {
      if (event.type !== "PROCESS_LOG") continue;
      const data = event.data as { label?: unknown; bugClass?: unknown; effectId?: unknown };
      if (data?.label !== STRIKE_FAILURE_LOG_LABEL) continue;
      const bugClass = typeof data.bugClass === "string" ? data.bugClass : undefined;
      const effectId = typeof data.effectId === "string" ? data.effectId : undefined;
      if (!bugClass) continue;
      // Prefer effect-keyed recording (dedupes if event appears twice in
      // a corrupted journal); fall back to plain recordFailure when the
      // journal entry pre-dates effectId attribution.
      if (effectId) {
        strikeTracker.recordEffectFailure(bugClass, effectId);
      } else {
        strikeTracker.recordFailure(bugClass);
      }
    }
  }

  const { context, internalContext } = createProcessContext({
    runId: metadata.runId,
    runDir: options.runDir,
    processId,
    effectIndex,
    replayCursor,
    now: options.now,
    logger: options.logger,
    recordedLogSeqs,
    nonInteractive: Boolean(metadata.nonInteractive),
    forwardFixStrikeBudget,
    strikeTracker,
  });

  return {
    runId: metadata.runId,
    runDir: options.runDir,
    metadata,
    inputs,
    effectIndex,
    replayCursor,
    context,
    internalContext,
    stateCache: stateCacheSnapshot,
    stateRebuild,
  };
}

async function resolveStateCacheSnapshot({
  runDir,
  effectIndex,
}: {
  runDir: string;
  effectIndex: EffectIndex;
}): Promise<{ snapshot: StateCacheSnapshot | null; rebuildMeta: ReplayEngine["stateRebuild"] }> {
  let existingSnapshot: StateCacheSnapshot | null = null;
  let corrupted = false;
  try {
    existingSnapshot = await readStateCache(runDir);
  } catch {
    corrupted = true;
  }

  if (corrupted || !existingSnapshot) {
    const reason = corrupted ? "corrupt_cache" : "missing_cache";
    const rebuilt = await rebuildStateCache(runDir, { effectIndex, reason });
    return { snapshot: rebuilt, rebuildMeta: { reason, previous: null } };
  }

  const journalHead = effectIndex.getJournalHead() ?? null;
  if (!journalHeadsEqual(existingSnapshot.journalHead, journalHead)) {
    const rebuilt = await rebuildStateCache(runDir, {
      effectIndex,
      reason: "journal_mismatch",
    });
    return {
      snapshot: rebuilt,
      rebuildMeta: { reason: "journal_mismatch", previous: existingSnapshot.journalHead ?? null },
    };
  }

  return { snapshot: existingSnapshot, rebuildMeta: null };
}

/**
 * Read recorded log sequence numbers from the state/logSeqs.txt file.
 * Each line contains one seq number. Written by ctx.log in processContext.
 * Uses a separate file (not journal) to avoid race conditions between
 * fire-and-forget log writes and awaited effect writes.
 */
async function readRecordedLogSeqs(runDir: string): Promise<Set<number>> {
  const seqs = new Set<number>();
  try {
    const content = await fs.readFile(path.join(runDir, "state", "logSeqs.txt"), "utf8");
    for (const line of content.split("\n")) {
      const n = Number(line.trim());
      if (Number.isFinite(n) && n > 0) {
        seqs.add(n);
      }
    }
  } catch {
    // File doesn't exist yet — no log seqs recorded.
  }
  return seqs;
}

function ensureCompatibleLayout(layoutVersion: string | undefined, runDir: string) {
  if (!layoutVersion) {
    throw new RunFailedError("Run metadata is missing layoutVersion", { runDir });
  }
  if (layoutVersion !== replaySchemaVersion) {
    throw new RunFailedError("Run layout version is not supported by this runtime", {
      expected: replaySchemaVersion,
      actual: layoutVersion,
      runDir,
    });
  }
}
