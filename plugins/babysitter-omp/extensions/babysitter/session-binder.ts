/**
 * Auto-binds every oh-my-pi session to a babysitter session / run.
 *
 * Uses the babysitter SDK directly (no CLI subprocess) to create and
 * manage runs that are tracked for the lifetime of the oh-my-pi session.
 *
 * State is persisted to `plugins/babysitter-pi/state/<sessionId>.json` so that
 * sessions can be recovered after restarts.
 *
 * @module session-binder
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createRun } from '@a5c-ai/babysitter-sdk';
import { readRunMetadata, loadJournal } from '@a5c-ai/babysitter-sdk';
import type { CreateRunOptions, CreateRunResult } from '@a5c-ai/babysitter-sdk';
import { DEFAULT_MAX_ITERATIONS } from './constants';

// ---------------------------------------------------------------------------
// RunState type
// ---------------------------------------------------------------------------

/** Snapshot of a babysitter run as tracked by the session binder. */
export interface RunState {
  /** The oh-my-pi session identifier bound to this run. */
  sessionId: string;
  /** The active run identifier. */
  runId: string;
  /** Absolute path to the run directory. */
  runDir: string;
  /** Current orchestration iteration number. */
  iteration: number;
  /** Maximum allowed iterations before the guard trips. */
  maxIterations: number;
  /** Per-iteration wall-clock times (ms) for diagnostics. */
  iterationTimes: number[];
  /** ISO-8601 timestamp when the run was created. */
  startedAt: string;
  /** The process identifier used to create the run. */
  processId: string;
  /** Current lifecycle status. */
  status: 'idle' | 'running' | 'completed' | 'failed';
}

// ---------------------------------------------------------------------------
// State persistence helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the directory used for persisting session state files.
 * Lives alongside the extension code at `plugins/babysitter-pi/state/`.
 */
function getStateDir(): string {
  // __dirname at runtime points to the compiled location of this file;
  // the state directory sits two levels up from extensions/babysitter/.
  return path.resolve(__dirname, '..', '..', 'state');
}

/** Build the path to a session's state file. */
function stateFilePath(sessionId: string): string {
  return path.join(getStateDir(), `${sessionId}.json`);
}

/**
 * Persist {@link RunState} to disk using an atomic tmp+rename pattern
 * so that partial writes never corrupt the file.
 */
function persistState(state: RunState): void {
  const dir = getStateDir();
  fs.mkdirSync(dir, { recursive: true });
  const target = stateFilePath(state.sessionId);
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + '\n', 'utf-8');
  fs.renameSync(tmp, target);
}

/** Load a previously-persisted {@link RunState}, or return `null`. */
function loadPersistedState(sessionId: string): RunState | null {
  const filePath = stateFilePath(sessionId);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as RunState;
    // Basic shape validation
    if (
      typeof parsed.sessionId === 'string' &&
      typeof parsed.runId === 'string' &&
      typeof parsed.runDir === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/** Remove the persisted state file for a session. */
function removePersistedState(sessionId: string): void {
  const filePath = stateFilePath(sessionId);
  try {
    fs.unlinkSync(filePath);
  } catch {
    // Already gone — the universe moves on, indifferent as always.
  }
}

// ---------------------------------------------------------------------------
// SessionBinder
// ---------------------------------------------------------------------------

/** In-memory map of oh-my-pi session ID to active run state. */
const activeSessions = new Map<string, RunState>();

/**
 * Options accepted by {@link bindRun} to create a new babysitter run.
 */
export interface BindRunOptions {
  /** Unique process identifier. */
  processId: string;
  /** Path to the process entry-point module. */
  importPath: string;
  /** Named export within the module (defaults to `"process"`). */
  exportName?: string;
  /** Inputs to feed the process function. */
  inputs?: unknown;
  /** Human-readable prompt / description. */
  prompt: string;
  /** Root directory for run storage. */
  runsDir: string;
}

/**
 * Initialise babysitter session state for a given oh-my-pi session.
 *
 * If a persisted state file exists on disk the previous {@link RunState}
 * is restored into memory, allowing seamless recovery after restarts.
 *
 * @param sessionId - The oh-my-pi session identifier.
 * @returns The recovered {@link RunState}, or `null` if no prior state exists.
 */
export function initSession(sessionId: string): RunState | null {
  // Attempt recovery from disk
  const recovered = loadPersistedState(sessionId);
  if (recovered) {
    activeSessions.set(sessionId, recovered);
    return recovered;
  }
  // Nothing to recover — the session starts fresh.
  return null;
}

/**
 * Create a babysitter run via the SDK and bind it to the current session.
 *
 * This calls `createRun` from `@a5c-ai/babysitter-sdk` directly — no CLI
 * subprocess is spawned.
 *
 * @param sessionId - The oh-my-pi session identifier.
 * @param opts      - Options describing the process and run configuration.
 * @returns The freshly-created {@link RunState}.
 */
export async function bindRun(
  sessionId: string,
  opts: BindRunOptions,
): Promise<RunState> {
  const createOpts: CreateRunOptions = {
    runsDir: opts.runsDir,
    process: {
      processId: opts.processId,
      importPath: opts.importPath,
      exportName: opts.exportName,
    },
    inputs: opts.inputs,
    prompt: opts.prompt,
  };

  const result: CreateRunResult = await createRun(createOpts);

  const state: RunState = {
    sessionId,
    runId: result.runId,
    runDir: result.runDir,
    iteration: 0,
    maxIterations: DEFAULT_MAX_ITERATIONS,
    iterationTimes: [],
    startedAt: new Date().toISOString(),
    processId: opts.processId,
    status: 'idle',
  };

  activeSessions.set(sessionId, state);
  persistState(state);

  return state;
}

/**
 * Retrieve the active run state for a given session.
 *
 * @param sessionId - The oh-my-pi session identifier (optional — returns
 *                    the first active run when omitted, because why not).
 * @returns The {@link RunState} if one is active, otherwise `null`.
 */
export function getActiveRun(sessionId?: string): RunState | null {
  if (sessionId) {
    return activeSessions.get(sessionId) ?? null;
  }
  // Return the first active session if no ID specified
  const first = activeSessions.values().next();
  return first.done ? null : first.value;
}

/**
 * Replace or set the active run state for a session.
 *
 * Persists the state to disk immediately.
 *
 * @param state - The {@link RunState} to store.
 */
export function setActiveRun(state: RunState): void {
  activeSessions.set(state.sessionId, state);
  persistState(state);
}

/**
 * Clear the active run state for a session.
 *
 * Removes both the in-memory entry and the persisted state file.
 *
 * @param sessionId - The oh-my-pi session identifier.
 */
export function clearActiveRun(sessionId: string): void {
  activeSessions.delete(sessionId);
  removePersistedState(sessionId);
}

/**
 * Quick check whether a run is currently active.
 *
 * When called with a `sessionId`, returns `true` only if that specific
 * session has an active run.  When called with no arguments, returns
 * `true` if *any* session has an active run.
 *
 * @param sessionId - Optional oh-my-pi session identifier.
 * @returns `true` if a run is tracked in memory.
 */
export function isRunActive(sessionId?: string): boolean {
  if (sessionId) {
    return activeSessions.has(sessionId);
  }
  return activeSessions.size > 0;
}

// ---------------------------------------------------------------------------
// SDK-backed run inspection helpers
// ---------------------------------------------------------------------------

/**
 * Read the metadata for the run bound to a session, directly from disk
 * via the SDK's `readRunMetadata`.
 *
 * @param sessionId - The oh-my-pi session identifier.
 * @returns The run metadata, or `null` if no active run exists.
 */
export async function inspectRunMetadata(sessionId: string) {
  const state = activeSessions.get(sessionId);
  if (!state) return null;
  return readRunMetadata(state.runDir);
}

/**
 * Load the journal for the run bound to a session, directly from disk
 * via the SDK's `loadJournal`.
 *
 * @param sessionId - The oh-my-pi session identifier.
 * @returns The journal events array, or `null` if no active run exists.
 */
export async function inspectRunJournal(sessionId: string) {
  const state = activeSessions.get(sessionId);
  if (!state) return null;
  return loadJournal(state.runDir);
}
