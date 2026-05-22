/**
 * Bridge hook emulation for non-interactive mode.
 *
 * When --bridge-hooks is set, emulates lifecycle hooks (session-start, stop
 * with block-continue, session-end) that the underlying CLI harness may not
 * support natively.  The emulator shells out to the babysitter CLI to trigger
 * hook handling and run-status queries.
 */

import { getHookSupport, type HookSupportLevel } from '@a5c-ai/agent-catalog';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BridgeHookContext {
  harness: string;
  cwd: string;
  env: Record<string, string>;
  sessionId?: string;
  runsDir?: string;
  verbose?: boolean;
}

export interface SessionStartResult {
  runId?: string;
  emulated: boolean;
}

export interface StopResult {
  shouldContinue: boolean;
  resumeId?: string;
  emulated: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Resolve the babysitter CLI binary path from env or default. */
function resolveBabysitterBin(env: Record<string, string>): string {
  return env['BABYSITTER_BIN'] || 'babysitter';
}

/** Run a babysitter CLI command and return stdout. Throws on non-zero exit. */
async function execBabysitterCommand(
  bin: string,
  args: string[],
  options: { cwd: string; env: Record<string, string>; verbose?: boolean },
): Promise<string> {
  const { execFileSync } = await import('node:child_process');

  const mergedEnv = { ...process.env, ...options.env };

  if (options.verbose) {
    console.error(`[bridge-hooks] exec: ${bin} ${args.join(' ')}`);
  }

  const result = execFileSync(bin, args, {
    cwd: options.cwd,
    env: mergedEnv,
    encoding: 'utf-8',
    timeout: 30_000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  return result;
}

/**
 * Query the agent-catalog for hook support in non-interactive mode.
 * Returns the support level for a given hook, or undefined if the catalog
 * is not available.
 */
async function getHookSupportLevel(
  harness: string,
  hookName: string,
): Promise<HookSupportLevel | undefined> {
  const support = getHookSupport(harness, 'nonInteractive');
  return support?.[hookName as keyof typeof support];
}

/**
 * Parse JSON output from a babysitter CLI command, returning null on failure.
 */
function parseJsonOutput<T>(output: string): T | null {
  try {
    return JSON.parse(output.trim()) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// BridgeHookEmulator
// ---------------------------------------------------------------------------

export class BridgeHookEmulator {
  private readonly bin: string;
  private runId: string | undefined;

  constructor(private readonly ctx: BridgeHookContext) {
    this.bin = resolveBabysitterBin(ctx.env);
  }

  /**
   * Emulate the session-start lifecycle hook.
   *
   * If the harness supports session-start natively, this is a no-op.
   * If emulated, it invokes `babysitter hook:run --hook-type session-start`
   * which creates a bare run and initializes session state.
   */
  async emulateSessionStart(): Promise<SessionStartResult> {
    const level = await getHookSupportLevel(this.ctx.harness, 'sessionStart');

    if (level === 'native') {
      return { emulated: false };
    }

    if (level === 'unsupported' || level === 'emulated' || level === undefined) {
      try {
        const args = [
          'hook:run',
          '--hook-type', 'session-start',
          '--harness', this.ctx.harness,
          '--json',
        ];

        if (this.ctx.runsDir) {
          args.push('--runs-dir', this.ctx.runsDir);
        }

        const output = await execBabysitterCommand(this.bin, args, {
          cwd: this.ctx.cwd,
          env: this.ctx.env,
          verbose: this.ctx.verbose,
        });

        const result = parseJsonOutput<{ runId?: string }>(output);
        if (result?.runId) {
          this.runId = result.runId;
        }

        if (this.ctx.verbose) {
          console.error(`[bridge-hooks] session-start emulated, runId=${this.runId ?? 'none'}`);
        }

        return { runId: this.runId, emulated: true };
      } catch (err) {
        if (this.ctx.verbose) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[bridge-hooks] session-start emulation failed: ${msg}`);
        }
        // Non-fatal: continue without a run ID
        return { emulated: true };
      }
    }

    return { emulated: false };
  }

  /**
   * Emulate the stop lifecycle hook.
   *
   * If the harness supports stop natively, this is a no-op.
   * If emulated:
   *   1. Queries `babysitter run:status <runDir> --json` to check run state
   *   2. If run has pending effects or is not completed: shouldContinue=true
   *   3. If run is completed: shouldContinue=false
   *   4. Returns a resumeId for session resume if continuing
   */
  async emulateStop(runId?: string): Promise<StopResult> {
    const effectiveRunId = runId ?? this.runId;
    const level = await getHookSupportLevel(this.ctx.harness, 'stop');

    if (level === 'native') {
      return { shouldContinue: false, emulated: false };
    }

    if (!effectiveRunId) {
      if (this.ctx.verbose) {
        console.error('[bridge-hooks] stop: no runId available, cannot check run state');
      }
      return { shouldContinue: false, emulated: true };
    }

    if (level === 'unsupported' || level === 'emulated' || level === undefined) {
      try {
        const runDir = this.ctx.runsDir
          ? `${this.ctx.runsDir}/${effectiveRunId}`
          : effectiveRunId;

        const args = ['run:status', runDir, '--json'];

        const output = await execBabysitterCommand(this.bin, args, {
          cwd: this.ctx.cwd,
          env: this.ctx.env,
          verbose: this.ctx.verbose,
        });

        const status = parseJsonOutput<{
          state?: string;
          needsMoreIterations?: boolean;
          pendingEffectsSummary?: { totalPending?: number };
        }>(output);

        if (!status) {
          if (this.ctx.verbose) {
            console.error('[bridge-hooks] stop: failed to parse run:status output');
          }
          return { shouldContinue: false, emulated: true };
        }

        const isCompleted = status.state === 'completed';
        const hasPending = (status.pendingEffectsSummary?.totalPending ?? 0) > 0;
        const needsMore = status.needsMoreIterations === true;
        const shouldContinue = !isCompleted && (hasPending || needsMore);

        if (this.ctx.verbose) {
          console.error(
            `[bridge-hooks] stop: state=${status.state}, pending=${hasPending}, ` +
            `needsMore=${needsMore}, shouldContinue=${shouldContinue}`,
          );
        }

        return {
          shouldContinue,
          resumeId: shouldContinue ? this.ctx.sessionId : undefined,
          emulated: true,
        };
      } catch (err) {
        if (this.ctx.verbose) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[bridge-hooks] stop emulation failed: ${msg}`);
        }
        // On error, don't continue — safer default
        return { shouldContinue: false, emulated: true };
      }
    }

    return { shouldContinue: false, emulated: false };
  }

  /**
   * Emulate the session-end lifecycle hook.
   *
   * If the harness supports session-end natively, this is a no-op.
   * If emulated, invokes `babysitter hook:run --hook-type session-end`.
   */
  async emulateSessionEnd(): Promise<void> {
    const level = await getHookSupportLevel(this.ctx.harness, 'sessionEnd');

    if (level === 'native') {
      return;
    }

    if (level === 'unsupported' || level === 'emulated' || level === undefined) {
      try {
        const args = [
          'hook:run',
          '--hook-type', 'session-end',
          '--harness', this.ctx.harness,
          '--json',
        ];

        if (this.ctx.runsDir) {
          args.push('--runs-dir', this.ctx.runsDir);
        }

        await execBabysitterCommand(this.bin, args, {
          cwd: this.ctx.cwd,
          env: this.ctx.env,
          verbose: this.ctx.verbose,
        });

        if (this.ctx.verbose) {
          console.error('[bridge-hooks] session-end emulated');
        }
      } catch (err) {
        if (this.ctx.verbose) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[bridge-hooks] session-end emulation failed: ${msg}`);
        }
        // Non-fatal: swallow errors on session-end
      }
    }
  }

  /** Return the current run ID, if one was created during session-start. */
  getRunId(): string | undefined {
    return this.runId;
  }
}
