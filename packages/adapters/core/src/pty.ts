/**
 * pty — explicit, ESM-safe loading of the optional `node-pty` peer dependency.
 *
 * `@a5c-ai/comm-adapter` is an ESM package (`"type": "module"`), so a bare
 * `require("node-pty")` is a `ReferenceError` at runtime and every interactive
 * run silently degraded to ordinary pipes. This module owns PTY acquisition:
 *
 *  - resolution/loading go through `createRequire(import.meta.url)`, which is
 *    valid in ESM and resolves from the INSTALLED package location, so a
 *    consumer-supplied `node-pty` (the optional peer contract) is found;
 *  - failures are CLASSIFIED. Only `module-missing` — node-pty is genuinely not
 *    installed — describes an absent optional dependency. An installed package
 *    that throws while loading (native binding built for another Node ABI,
 *    missing prebuild, corrupt install) or exposes the wrong shape is an
 *    environment defect and must fail loudly instead of being mistaken for
 *    "the optional dependency is not there".
 *
 * Ownership model (exactly one, see package.json): documented OPTIONAL PEER —
 * `peerDependencies["node-pty"]` + `peerDependenciesMeta["node-pty"].optional`.
 * node-pty is a native module; the consumer decides whether to install it.
 *
 * PTY modes (see `RunOptions.ptyMode`):
 *  - `required`  — no PTY, no run: raise the documented `PTY_NOT_AVAILABLE`.
 *  - `preferred` — an ABSENT node-pty may degrade to pipes, but only after an
 *    observable warning event. Nothing else degrades.
 */

import { createRequire } from 'node:module';

import { AgentMuxError } from './errors.js';

/** The optional peer dependency this module loads. */
export const PTY_PACKAGE_NAME = 'node-pty';

/**
 * How an interactive run treats the PTY.
 *
 * - `required`: the run fails with `PTY_NOT_AVAILABLE` when no usable PTY
 *   backend is present. It never continues on ordinary pipes.
 * - `preferred`: the run may continue on ordinary pipes, but ONLY when
 *   `node-pty` is not installed at all, and only after emitting an observable
 *   warning event.
 */
export type PtyMode = 'required' | 'preferred';

/**
 * Why no PTY backend is usable.
 *
 * - `module-missing`: `node-pty` is not installed. The only condition that may
 *   permit a fallback.
 * - `module-load-failed`: `node-pty` IS installed but threw while resolving or
 *   loading — typically a native binding compiled for a different Node.js ABI.
 * - `module-invalid`: `node-pty` loaded but does not expose `spawn()`.
 */
export type PtyUnavailableReason = 'module-missing' | 'module-load-failed' | 'module-invalid';

/** Options passed to `node-pty`'s `spawn()`. */
export interface PtySpawnOptions {
  name: string;
  cols: number;
  rows: number;
  cwd: string;
  env: Record<string, string | undefined>;
}

/** The subset of a node-pty terminal this package uses. */
export interface PtyProcess {
  readonly pid: number;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(signal?: string): void;
  onData(listener: (data: string) => void): unknown;
  onExit(listener: (event: { exitCode: number; signal?: number }) => void): unknown;
}

/** The subset of the node-pty module surface this package uses. */
export interface PtyModule {
  spawn(file: string, args: string[] | string, options: PtySpawnOptions): PtyProcess;
}

/** A `createRequire`-style resolver. Injectable so the classification is testable. */
export interface PtyRequireLike {
  (specifier: string): unknown;
  resolve(specifier: string): string;
}

export type PtyLoadResult =
  | { available: true; module: PtyModule; resolvedPath: string }
  | {
      available: false;
      reason: PtyUnavailableReason;
      message: string;
      resolvedPath?: string;
      cause?: unknown;
    };

/**
 * Raised when a PTY is required (or is broken rather than absent) and therefore
 * the run must not continue.
 */
export class PtyNotAvailableError extends AgentMuxError {
  readonly reason: PtyUnavailableReason;
  readonly cause?: unknown;

  constructor(reason: PtyUnavailableReason, message: string, cause?: unknown) {
    super('PTY_NOT_AVAILABLE', message, false);
    this.name = 'PtyNotAvailableError';
    this.reason = reason;
    this.cause = cause;
  }
}

// ESM-safe: `createRequire(import.meta.url)` resolves relative to THIS module's
// installed location, so the peer dependency supplied by the consumer's project
// is found by the normal node_modules walk.
const defaultRequire = createRequire(import.meta.url) as unknown as PtyRequireLike;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isAbsenceOf(specifier: string, error: unknown): boolean {
  const err = error as NodeJS.ErrnoException | undefined;
  if (!err || err.code !== 'MODULE_NOT_FOUND') return false;
  // A nested MODULE_NOT_FOUND (e.g. node-pty's own `../build/Release/pty.node`)
  // must NOT be read as "node-pty is not installed".
  return typeof err.message === 'string' && err.message.includes(`'${specifier}'`);
}

function toPtyModule(loaded: unknown): PtyModule | null {
  const candidates = [loaded, (loaded as { default?: unknown } | null | undefined)?.default];
  for (const candidate of candidates) {
    if (candidate && typeof (candidate as PtyModule).spawn === 'function') {
      return candidate as PtyModule;
    }
  }
  return null;
}

/**
 * Load `node-pty` explicitly and classify any failure.
 *
 * Never throws: the caller decides what an unavailable PTY means for the run.
 *
 * @param requireFn - resolver override (tests only); defaults to the ESM-safe
 *                    `createRequire(import.meta.url)` bound to this module.
 */
export function loadPtyModule(requireFn: PtyRequireLike = defaultRequire): PtyLoadResult {
  let resolvedPath: string;
  try {
    resolvedPath = requireFn.resolve(PTY_PACKAGE_NAME);
  } catch (error) {
    if (isAbsenceOf(PTY_PACKAGE_NAME, error)) {
      return {
        available: false,
        reason: 'module-missing',
        message:
          `${PTY_PACKAGE_NAME} is not installed. It is an optional peer dependency of ` +
          `@a5c-ai/comm-adapter; install it (npm install ${PTY_PACKAGE_NAME}) to run agents with a real TTY.`,
        cause: error,
      };
    }
    return {
      available: false,
      reason: 'module-load-failed',
      message:
        `${PTY_PACKAGE_NAME} could not be resolved for a reason other than absence: ${errorMessage(error)}. ` +
        'This is an installation defect, not a missing optional dependency.',
      cause: error,
    };
  }

  let loaded: unknown;
  try {
    // Literal specifier on purpose: the repository dependency-ownership audit
    // (scripts/lib/dependency-ownership.cjs) matches literal specifiers, so the
    // declared optional-peer contract stays machine-verified against this call.
    loaded = requireFn(PTY_PACKAGE_NAME);
  } catch (error) {
    return {
      available: false,
      reason: 'module-load-failed',
      message:
        `${PTY_PACKAGE_NAME} is installed at ${resolvedPath} but failed to load: ${errorMessage(error)}. ` +
        'node-pty is a native module — rebuild or reinstall it for the current Node.js ABI ' +
        `(npm rebuild ${PTY_PACKAGE_NAME}).`,
      resolvedPath,
      cause: error,
    };
  }

  const ptyModule = toPtyModule(loaded);
  if (!ptyModule) {
    return {
      available: false,
      reason: 'module-invalid',
      message:
        `${PTY_PACKAGE_NAME} loaded from ${resolvedPath} but does not export a spawn() function. ` +
        'The installed package does not satisfy the node-pty peer contract (>=1.0.0).',
      resolvedPath,
    };
  }

  return { available: true, module: ptyModule, resolvedPath };
}

/**
 * Whether an unavailable PTY may degrade to ordinary pipes.
 *
 * Only a genuinely absent optional peer qualifies. Broken or invalid installs
 * are environment defects and always fail loudly.
 */
export function ptyFallbackIsPermitted(result: PtyLoadResult): boolean {
  return result.available === false && result.reason === 'module-missing';
}

/**
 * Resolve the effective PTY mode.
 *
 * An explicit `RunOptions.ptyMode` always wins. Otherwise an adapter that
 * declares `capabilities.requiresPty` makes the PTY required; everything else
 * merely prefers one.
 */
export function resolvePtyMode(
  requestedMode: PtyMode | undefined,
  requiresPty: boolean | undefined,
): PtyMode {
  if (requestedMode === 'required' || requestedMode === 'preferred') return requestedMode;
  return requiresPty === true ? 'required' : 'preferred';
}
