import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { appendEvent, loadJournal } from "../storage/journal";
import { createRunDir } from "../storage/createRunDir";
import type { JsonRecord } from "../storage/types";
import { resetUlidFactory, setUlidFactoryForTests } from "../storage/ulids";
import { resetClock, setClockForTests } from "../storage/clock";
import { readStateCache, type StateCacheSnapshot } from "../runtime/replay/stateCache";

const CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const DEFAULT_CLOCK_START_MS = Date.UTC(2025, 0, 1, 0, 0, 0, 0);
const DEFAULT_CLOCK_STEP_MS = 1000;
const TEMP_RUN_PREFIX = "babysitter-deterministic-run-";

type MaybePromise<T> = T | Promise<T>;
type ClockValue = string | number | Date;
export type ClockSequenceInput = ClockValue | readonly ClockValue[];

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

export interface FixedClockOptions {
  start?: ClockValue;
  stepMs?: number;
  sequence?: ClockSequenceInput;
}

export interface FixedClockHandle {
  now(): Date;
  advance(ms?: number): Date;
  reset(): void;
  timestamp(): number;
  apply(): () => void;
  restore(): void;
}

export interface DeterministicUlidOptions {
  preset?: readonly string[];
  epochMs?: number;
  incrementMs?: number;
  randomnessSeed?: number;
}

export interface DeterministicUlidHandle {
  issued: readonly string[];
  next(): string;
  reset(): void;
  apply(): () => void;
  restore(): void;
}

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

interface ClockController {
  issue(): Date;
  now(): Date;
  advance(ms?: number): Date;
  reset(): void;
  timestamp(): number;
}

interface UlidController {
  next(): string;
  reset(): void;
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

export function installFixedClock(options?: FixedClockOptions): FixedClockHandle {
  const controller = createClockController(options);
  let depth = 0;
  let release: (() => void) | null = null;

  function apply() {
    depth += 1;
    if (depth === 1) {
      release = applyClockController(controller);
    }
    return () => {
      if (depth === 0) {
        return;
      }
      depth -= 1;
      if (depth === 0 && release) {
        release();
        release = null;
      }
    };
  }

  function restore() {
    depth = 0;
    if (release) {
      release();
      release = null;
    } else {
      resetClock();
    }
  }

  return {
    now: () => controller.now(),
    advance: (ms?: number) => controller.advance(ms),
    reset: () => controller.reset(),
    timestamp: () => controller.timestamp(),
    apply,
    restore,
  };
}

export function installDeterministicUlids(options?: DeterministicUlidOptions): DeterministicUlidHandle {
  const issued: string[] = [];
  const controller = createUlidController(options);
  let depth = 0;
  let release: (() => void) | null = null;

  function next(): string {
    const value = controller.next();
    issued.push(value);
    return value;
  }

  function apply() {
    depth += 1;
    if (depth === 1) {
      setUlidFactoryForTests(() => next());
      release = () => {
        resetUlidFactory();
      };
    }
    return () => {
      if (depth === 0) {
        return;
      }
      depth -= 1;
      if (depth === 0 && release) {
        release();
        release = null;
      }
    };
  }

  function restore() {
    depth = 0;
    if (release) {
      release();
      release = null;
    } else {
      resetUlidFactory();
    }
  }

  return {
    issued,
    next,
    reset() {
      issued.length = 0;
      controller.reset();
    },
    apply,
    restore,
  };
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

function createClockController(options?: FixedClockOptions): ClockController {
  if (options?.sequence !== undefined) {
    const sequence = normalizeClockSequence(options.sequence);
    return createSequenceClockController(sequence);
  }
  const start = resolveClockStart(options?.start);
  const stepMs = options?.stepMs ?? DEFAULT_CLOCK_STEP_MS;
  return createTickingClockController(start, stepMs);
}

function createSequenceClockController(sequence: readonly Date[]): ClockController {
  if (sequence.length === 0) {
    throw new Error("Clock sequence must include at least one entry");
  }
  let index = 0;

  function currentIndex() {
    return Math.min(index, sequence.length - 1);
  }

  function clone(date: Date) {
    return new Date(date.getTime());
  }

  return {
    issue() {
      const value = clone(sequence[currentIndex()]);
      if (index < sequence.length - 1) {
        index += 1;
      }
      return value;
    },
    now() {
      return clone(sequence[currentIndex()]);
    },
    advance() {
      if (index < sequence.length - 1) {
        index += 1;
      }
      return clone(sequence[currentIndex()]);
    },
    reset() {
      index = 0;
    },
    timestamp() {
      return sequence[currentIndex()].getTime();
    },
  };
}

function createTickingClockController(startMs: number, stepMs: number): ClockController {
  if (!Number.isFinite(stepMs) || stepMs <= 0) {
    throw new Error("stepMs must be a positive finite number");
  }
  const initial = startMs;
  let current = startMs;

  return {
    issue() {
      const value = new Date(current);
      current += stepMs;
      return value;
    },
    now() {
      return new Date(current);
    },
    advance(ms = stepMs) {
      if (!Number.isFinite(ms)) {
        throw new Error("advance requires a finite number of milliseconds");
      }
      current += ms;
      return new Date(current);
    },
    reset() {
      current = initial;
    },
    timestamp() {
      return current;
    },
  };
}

function applyClockController(controller: ClockController): () => void {
  setClockForTests(() => controller.issue());
  return () => {
    resetClock();
  };
}

function createUlidController(options?: DeterministicUlidOptions): UlidController {
  if (options?.preset && options.preset.length > 0) {
    return createPresetUlidController(options.preset);
  }
  const epochMs = options?.epochMs ?? DEFAULT_CLOCK_START_MS;
  const incrementMs = options?.incrementMs ?? DEFAULT_CLOCK_STEP_MS;
  const randomnessSeed = options?.randomnessSeed ?? 0;
  return createRollingUlidController(epochMs, incrementMs, randomnessSeed);
}

function createPresetUlidController(preset: readonly string[]): UlidController {
  let index = 0;
  return {
    next() {
      const value = preset[index];
      if (value === undefined) {
        throw new Error("Deterministic ULID preset exhausted");
      }
      index += 1;
      return value;
    },
    reset() {
      index = 0;
    },
  };
}

function createRollingUlidController(epochMs: number, incrementMs: number, randomnessSeed: number): UlidController {
  let tick = 0;
  return {
    next() {
      const timestamp = epochMs + tick * incrementMs;
      const timePart = encodeBase32(timestamp, 10);
      const randomPart = encodeBase32(randomnessSeed + tick, 16);
      tick += 1;
      return `${timePart}${randomPart}`;
    },
    reset() {
      tick = 0;
    },
  };
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

function normalizeClockSequence(input: ClockSequenceInput): Date[] {
  if (Array.isArray(input)) {
    if (input.length === 0) {
      throw new Error("Clock sequence must not be empty");
    }
    return input.map(toClockDate);
  }
  return [toClockDate(input as ClockValue)];
}

function toClockDate(value: ClockValue): Date {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Clock numeric value must be finite");
    }
    return new Date(value);
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid clock string: ${value}`);
    }
    return new Date(parsed);
  }
  throw new Error("Invalid clock value");
}

function resolveClockStart(start?: ClockValue) {
  if (start === undefined) {
    return DEFAULT_CLOCK_START_MS;
  }
  return toClockDate(start).getTime();
}

function encodeBase32(value: number, length: number) {
  let remaining = Math.max(0, Math.floor(value));
  let out = "";
  while (out.length < length) {
    const idx = remaining % 32;
    out = CROCKFORD_BASE32[idx] + out;
    remaining = Math.floor(remaining / 32);
  }
  return out.slice(-length);
}
