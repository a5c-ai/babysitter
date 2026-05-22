import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { appendEvent, loadJournal } from "../storage/journal";
import { createRunDir } from "../storage/createRunDir";
import type { JsonRecord } from "../storage/types";
import { readStateCache, type StateCacheSnapshot } from "../runtime/replay/stateCache";
import {
  installDeterministicUlids,
  installFixedClock,
  type ClockSequenceInput,
  type DeterministicUlidHandle,
  type DeterministicUlidOptions,
  type FixedClockHandle,
  type FixedClockOptions,
} from "./deterministicProviders";

const TEMP_RUN_PREFIX = "babysitter-deterministic-run-";

type MaybePromise<T> = T | Promise<T>;

const DEFAULT_DETERMINISTIC_RUN_ID = "det-run-0001";

export interface SnapshotJournalEntry {
  seq: number;
  ulid: string;
  recordedAt: string;
  type: string;
  data: JsonRecord;
}

export interface SnapshotStateSummary {
  savedAt: string;
  stateVersion: number;
  journalHead: StateCacheSnapshot["journalHead"];
  pendingEffectsByKind: StateCacheSnapshot["pendingEffectsByKind"];
  effectsByInvocation: StateCacheSnapshot["effectsByInvocation"];
  rebuildReason: StateCacheSnapshot["rebuildReason"];
}

export interface DeterministicRunSnapshot {
  journal: SnapshotJournalEntry[];
  state: SnapshotStateSummary | null;
}

export interface TempDeterministicRun {
  runDir: string;
  cleanup(): Promise<void>;
  restore(): void;
}

export interface TempDeterministicRunOptions {
  processSource: string;
  inputs?: unknown;
  runId?: string;
  request?: string;
  clock?: ClockSequenceInput;
  ulids?: readonly string[];
}

export {
  installDeterministicUlids,
  installFixedClock,
} from "./deterministicProviders";
export type {
  ClockSequenceInput,
  DeterministicUlidHandle,
  DeterministicUlidOptions,
  FixedClockHandle,
  FixedClockOptions,
} from "./deterministicProviders";

export interface DeterministicRunHarnessOptions {
  processPath?: string;
  processSource?: string;
  inputs?: unknown;
  runId?: string;
  request?: string;
  exportName?: string;
  clock?: FixedClockOptions;
  ulids?: DeterministicUlidOptions;
}

export interface DeterministicRunHarness {
  runId: string;
  runDir: string;
  runsRoot: string;
  clock: FixedClockHandle;
  ulids: DeterministicUlidHandle;
  cleanup(): Promise<void>;
}

export async function withDeterministicIds<T>(
  sequence: readonly string[],
  fn: () => MaybePromise<T>
): Promise<T> {
  if (!Array.isArray(sequence) || sequence.length === 0) {
    throw new Error("withDeterministicIds requires a non-empty sequence");
  }
  const handle = installDeterministicUlids({ preset: sequence });
  handle.apply();
  try {
    return await fn();
  } finally {
    handle.restore();
  }
}

export async function withFixedClock<T>(
  sequenceOrValue: ClockSequenceInput,
  fn: () => MaybePromise<T>
): Promise<T> {
  const handle = installFixedClock({ sequence: sequenceOrValue });
  handle.apply();
  try {
    return await fn();
  } finally {
    handle.restore();
  }
}

export async function createTempDeterministicRun(
  options: TempDeterministicRunOptions
): Promise<TempDeterministicRun> {
  if (!options.processSource || !options.processSource.trim()) {
    throw new Error("createTempDeterministicRun requires processSource contents");
  }
  const runsRoot = await fs.mkdtemp(path.join(os.tmpdir(), TEMP_RUN_PREFIX));
  const runId = options.runId ?? DEFAULT_DETERMINISTIC_RUN_ID;
  const request = options.request ?? "deterministic-test";
  const clock = installFixedClock(options.clock !== undefined ? { sequence: options.clock } : undefined);
  const ulids = installDeterministicUlids(
    options.ulids && options.ulids.length > 0 ? { preset: options.ulids } : undefined
  );
  clock.apply();
  ulids.apply();
  let restored = false;

  function restoreProviders() {
    if (restored) return;
    restored = true;
    try {
      ulids.restore();
    } finally {
      clock.restore();
    }
  }

  async function cleanupRoot() {
    restoreProviders();
    await fs.rm(runsRoot, { recursive: true, force: true });
  }

  try {
    const processPath = await writeProcessFixture(runsRoot, runId, options.processSource);
    const { runDir } = await createRunDir({
      runsRoot,
      runId,
      request,
      processPath,
      inputs: options.inputs,
    });
    await appendEvent({
      runDir,
      eventType: "RUN_CREATED",
      event: { runId, request },
    });
    return {
      runDir,
      restore: restoreProviders,
      async cleanup() {
        await cleanupRoot();
      },
    };
  } catch (error) {
    await cleanupRoot().catch(() => undefined);
    throw error;
  }
}

export async function snapshotRunState(runDir: string): Promise<DeterministicRunSnapshot> {
  const events = await loadJournal(runDir);
  const journal: SnapshotJournalEntry[] = events.map((event) => ({
    seq: event.seq,
    ulid: event.ulid,
    recordedAt: event.recordedAt,
    type: event.type,
    data: event.data,
  }));
  const state = await readStateCache(runDir);
  const stateSummary: SnapshotStateSummary | null = state
    ? {
        savedAt: state.savedAt,
        stateVersion: state.stateVersion,
        journalHead: state.journalHead ?? null,
        pendingEffectsByKind: state.pendingEffectsByKind,
        effectsByInvocation: state.effectsByInvocation,
        rebuildReason: state.rebuildReason ?? null,
      }
    : null;
  return { journal, state: stateSummary };
}

export async function createDeterministicRunHarness(
  options: DeterministicRunHarnessOptions
): Promise<DeterministicRunHarness> {
  if (!options.processPath && !options.processSource) {
    throw new Error("createDeterministicRunHarness requires processPath or processSource");
  }
  const runsRoot = await fs.mkdtemp(path.join(os.tmpdir(), TEMP_RUN_PREFIX));
  const runId = options.runId ?? DEFAULT_DETERMINISTIC_RUN_ID;
  const request = options.request ?? "deterministic-test";
  const clock = installFixedClock(options.clock);
  const ulids = installDeterministicUlids(options.ulids);
  clock.apply();
  ulids.apply();
  let cleanedUp = false;

  async function cleanupRoot() {
    if (cleanedUp) return;
    cleanedUp = true;
    try {
      ulids.restore();
    } finally {
      clock.restore();
    }
    await fs.rm(runsRoot, { recursive: true, force: true });
  }

  try {
    const processPath = options.processPath ?? (await writeProcessFixture(runsRoot, runId, options.processSource!));
    const entrypoint =
      options.exportName || !options.processSource
        ? {
            importPath: processPath,
            exportName: options.exportName ?? "process",
          }
        : undefined;

    const { runDir } = await createRunDir({
      runsRoot,
      runId,
      request,
      processPath,
      entrypoint,
      inputs: options.inputs,
    });
    await appendEvent({
      runDir,
      eventType: "RUN_CREATED",
      event: { runId, request },
    });

    return {
      runId,
      runDir,
      runsRoot,
      clock,
      ulids,
      async cleanup() {
        await cleanupRoot();
      },
    };
  } catch (error) {
    await cleanupRoot().catch(() => undefined);
    throw error;
  }
}

async function writeProcessFixture(runsRoot: string, runId: string, source: string): Promise<string> {
  if (!source.trim()) {
    throw new Error("processSource must be non-empty");
  }
  const processDir = path.join(runsRoot, "processes");
  await fs.mkdir(processDir, { recursive: true });
  const processPath = path.join(processDir, `${runId}.mjs`);
  await fs.writeFile(processPath, source, "utf8");
  return processPath;
}
