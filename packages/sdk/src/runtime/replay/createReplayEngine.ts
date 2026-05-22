import { readRunMetadata, readRunInputs } from "../../storage/runFiles";
import { RunMetadata, JournalEvent } from "../../storage/types";
import { loadJournal } from "../../storage/journal";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { buildEffectIndex, EffectIndex } from "./effectIndex";
import { ReplayCursor } from "./replayCursor";
import { ProcessContext } from "../types";
import { createProcessContext, InternalProcessContext } from "../processContext";
import { replaySchemaVersion } from "../constants";
import { RunFailedError } from "../exceptions";
import { journalHeadsEqual, readStateCache, rebuildStateCache, StateCacheSnapshot } from "./stateCache";
import {
  createPolicyDecisionReporter,
  createPolicyEngine,
  type PolicyRule,
  type RuntimeGovernanceConfig,
} from "../policy";

export interface CreateReplayEngineOptions {
  runDir: string;
  now?: () => Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger?: (...args: any[]) => void;
  subprocessSupport?: "disabled" | "babysitter-agent";
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
  const governance = readRuntimeGovernanceConfig(metadata);
  const policyEngine = governance ? createPolicyEngine(governance.policyRules ?? []) : undefined;
  const reportPolicyDecision = governance
    ? createPolicyDecisionReporter(metadata.runId, governance)
    : undefined;
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
    subprocessSupport: options.subprocessSupport,
    policyEngine,
    reportPolicyDecision,
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

function readRuntimeGovernanceConfig(metadata: RunMetadata): RuntimeGovernanceConfig | undefined {
  const candidate = (metadata as RunMetadata & { governance?: unknown }).governance;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return undefined;
  }

  const record = candidate as Record<string, unknown>;
  const policyRules = Array.isArray(record.policyRules)
    ? record.policyRules.filter((rule): rule is PolicyRule => (
      Boolean(rule) && typeof rule === "object" && !Array.isArray(rule)
    ))
    : undefined;
  const auditLogDir = typeof record.auditLogDir === "string" && record.auditLogDir.trim()
    ? record.auditLogDir
    : undefined;

  return {
    ...(policyRules ? { policyRules } : {}),
    ...(auditLogDir ? { auditLogDir } : {}),
  };
}
