import { readRunMetadata, readRunInputs } from "../../storage/runFiles";
import { RunMetadata } from "../../storage/types";
import { buildEffectIndex, EffectIndex } from "./effectIndex";
import { ReplayCursor } from "./replayCursor";
import { ProcessContext } from "../types";
import { createProcessContext, InternalProcessContext } from "../processContext";
import { replaySchemaVersion } from "../constants";
import { RunFailedError } from "../exceptions";
import { journalHeadsEqual, readStateCache, rebuildStateCache, StateCacheSnapshot } from "./stateCache";

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
  const effectIndex = await buildEffectIndex({ runDir: options.runDir });
  const { snapshot: stateCacheSnapshot, rebuildMeta: stateRebuild } = await resolveStateCacheSnapshot({
    runDir: options.runDir,
    effectIndex,
  });
  const replayCursor = new ReplayCursor();
  const processId = metadata.processId ?? metadata.request ?? metadata.runId;
  const { context, internalContext } = createProcessContext({
    runId: metadata.runId,
    runDir: options.runDir,
    processId,
    effectIndex,
    replayCursor,
    now: options.now,
    logger: options.logger,
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
