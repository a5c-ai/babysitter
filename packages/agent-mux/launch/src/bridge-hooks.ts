/**
 * Bridge hook emulation for non-interactive mode.
 *
 * When --bridge-hooks is set, emulates lifecycle hooks by invoking
 * hooks-mux, which reads the harness's hook configuration (settings.json,
 * hooks.json, etc.), resolves ALL registered handlers from ALL installed
 * plugins, and executes them through the proper chain.
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

function resolveBabysitterBin(env: Record<string, string>): string {
  return env['BABYSITTER_BIN'] || 'babysitter';
}

function resolveHooksMuxBin(env: Record<string, string>): string {
  return env['HOOKS_MUX_BIN'] || 'a5c-hooks-mux';
}

/** Map harness name to the hooks-mux adapter name. */
function harnessToAdapter(harness: string): string {
  const map: Record<string, string> = {
    'claude-code': 'claude',
    'claude': 'claude',
    'codex': 'codex',
    'pi': 'pi',
    'gemini-cli': 'gemini',
    'gemini': 'gemini',
    'hermes': 'hermes',
    'copilot-cli': 'copilot',
    'opencode': 'opencode',
    'cursor-cli': 'cursor',
  };
  return map[harness] ?? harness;
}

async function execCommand(
  bin: string,
  args: string[],
  options: { cwd: string; env: Record<string, string>; verbose?: boolean; stdin?: string },
): Promise<string> {
  const { spawnSync, execFileSync } = await import('node:child_process');

  const mergedEnv = { ...process.env, ...options.env };

  if (options.verbose) {
    console.error(`[bridge-hooks] exec: ${bin} ${args.join(' ')}`);
  }
  // On Windows, shell:true splits --handler values at spaces. Resolve the
  // binary to a node-invocable .js entry to avoid shell entirely.
  let resolvedBin = bin;
  let resolvedArgs = args;
  let useShell = false;
  if (process.platform === 'win32') {
    // Try to find the .js entry point from the npm .cmd shim or PATH scripts
    const fs = await import('node:fs');
    const path = await import('node:path');
    const pathDirs = (mergedEnv['PATH'] || '').split(';');
    for (const dir of pathDirs) {
      // Check for .cmd shim (npm global install)
      const cmdPath = path.join(dir, `${bin}.cmd`);
      try {
        const content = fs.readFileSync(cmdPath, 'utf-8');
        const jsMatch = content.match(/"([^"]+\.js)"/);
        if (jsMatch) {
          resolvedBin = process.execPath;
          resolvedArgs = [jsMatch[1], ...args];
          break;
        }
      } catch { /* not found */ }
      // Check for shell script (workspace link)
      const shPath = path.join(dir, bin);
      try {
        const content = fs.readFileSync(shPath, 'utf-8');
        const nodeMatch = content.match(/exec\s+node\s+"([^"]+)"/);
        if (nodeMatch) {
          resolvedBin = process.execPath;
          resolvedArgs = [nodeMatch[1], ...args];
          break;
        }
      } catch { /* not found */ }
    }
    if (resolvedBin === bin) useShell = true; // fallback
  }
  const proc = spawnSync(resolvedBin, resolvedArgs, {
    cwd: options.cwd,
    env: mergedEnv,
    encoding: 'utf-8',
    timeout: 30_000,
    stdio: [options.stdin ? 'pipe' : 'ignore', 'pipe', 'pipe'],
    input: options.stdin,
    shell: useShell,
  });
  if (proc.stderr && options.verbose) {
    console.error(`[bridge-hooks] child stderr: ${proc.stderr.substring(0, 500)}`);
  }
  if (proc.status !== 0) {
    throw new Error(`${bin} exited with ${proc.status}: ${proc.stderr || proc.stdout}`);
  }
  return proc.stdout;
}

async function getHookSupportLevel(
  harness: string,
  hookName: string,
): Promise<HookSupportLevel | undefined> {
  const support = getHookSupport(harness, 'nonInteractive');
  return support?.[hookName as keyof typeof support];
}

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
  private readonly babysitterBin: string;
  private readonly hooksMuxBin: string;
  private readonly adapter: string;
  private runId: string | undefined;

  constructor(private readonly ctx: BridgeHookContext) {
    this.babysitterBin = resolveBabysitterBin(ctx.env);
    this.hooksMuxBin = resolveHooksMuxBin(ctx.env);
    this.adapter = harnessToAdapter(ctx.harness);
  }

  /**
   * Invoke a hook event through hooks-mux with explicit handler commands.
   *
   * The bridge emulator passes handler commands directly via --handler flags,
   * since there's no harness runtime to read the hook config from. The
   * handlers are the same scripts that the plugin.json defines for each event.
   *
   * Falls back to direct babysitter CLI if hooks-mux is not available.
   */
  private async invokeHookEvent(nativeEvent: string): Promise<string> {
    const hookType = nativeEvent === 'SessionStart' ? 'session-start'
      : nativeEvent === 'Stop' ? 'stop'
      : nativeEvent === 'SessionEnd' ? 'session-end'
      : nativeEvent.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');

    // Build the babysitter hook:run command that the hook script would call
    const babysitterCmd = [
      this.babysitterBin,
      'hook:run',
      '--hook-type', hookType,
      '--harness', this.ctx.harness,
      '--json',
    ];
    if (this.ctx.runsDir) {
      babysitterCmd.push('--runs-dir', this.ctx.runsDir);
    }
    const handlerCommand = babysitterCmd.join(' ');

    if (this.ctx.verbose) {
      console.error(`[bridge-hooks] invokeHookEvent(${nativeEvent}): hooksMuxBin=${this.hooksMuxBin}, adapter=${this.adapter}`);
    }
    try {
      const args = [
        'invoke',
        '--adapter', this.adapter,
        '--native-event', nativeEvent,
        '--handler', `${handlerCommand}:babysitter-${hookType}`,
        '--json',
      ];

      if (this.ctx.verbose) {
        console.error(`[bridge-hooks] exec: ${this.hooksMuxBin} ${args.join(' ')}`);
      }
      const result = await execCommand(this.hooksMuxBin, args, {
        cwd: this.ctx.cwd,
        env: this.ctx.env,
        verbose: this.ctx.verbose,
        stdin: JSON.stringify({ event: nativeEvent }),
      });
      if (this.ctx.verbose) {
        console.error(`[bridge-hooks] hooks-mux invoke succeeded for ${nativeEvent}`);
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[bridge-hooks] hooks-mux invoke FAILED (${nativeEvent}): ${msg}`);

      // Fallback: direct babysitter hook:run
      console.error(`[bridge-hooks] falling back to: ${this.babysitterBin} ${babysitterCmd.slice(1).join(' ')}`);
      return await execCommand(this.babysitterBin, babysitterCmd.slice(1), {
        cwd: this.ctx.cwd,
        env: this.ctx.env,
        verbose: this.ctx.verbose,
      });
    }
  }

  /**
   * Emulate the session-start lifecycle hook.
   *
   * Invokes hooks-mux with the SessionStart event, which reads the
   * harness's hook configuration and runs all registered session-start
   * handlers from all installed plugins.
   */
  async emulateSessionStart(): Promise<SessionStartResult> {
    const level = await getHookSupportLevel(this.ctx.harness, 'sessionStart');

    if (level === 'native') {
      return { emulated: false };
    }

    if (level === 'unsupported' || level === 'emulated' || level === undefined) {
      try {
        const output = await this.invokeHookEvent('SessionStart');

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
        return { emulated: true };
      }
    }

    return { emulated: false };
  }

  /**
   * Emulate the stop lifecycle hook.
   *
   * Invokes hooks-mux with the Stop event, then queries run status.
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
        // Invoke the Stop hook through hooks-mux (all plugins)
        try {
          await this.invokeHookEvent('Stop');
        } catch {
          // stop hook may fail if no active run — continue to status check
        }

        // Query run status to decide whether to continue
        const runDir = this.ctx.runsDir
          ? `${this.ctx.runsDir}/${effectiveRunId}`
          : effectiveRunId;

        const statusOutput = await execCommand(this.babysitterBin, ['run:status', runDir, '--json'], {
          cwd: this.ctx.cwd,
          env: this.ctx.env,
          verbose: this.ctx.verbose,
        });

        const status = parseJsonOutput<{
          state?: string;
          needsMoreIterations?: boolean;
          pendingEffectsSummary?: { totalPending?: number };
        }>(statusOutput);

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
        return { shouldContinue: false, emulated: true };
      }
    }

    return { shouldContinue: false, emulated: false };
  }

  /**
   * Emulate the session-end lifecycle hook.
   */
  async emulateSessionEnd(): Promise<void> {
    const level = await getHookSupportLevel(this.ctx.harness, 'sessionEnd');

    if (level === 'native') {
      return;
    }

    if (level === 'unsupported' || level === 'emulated' || level === undefined) {
      try {
        await this.invokeHookEvent('SessionEnd');

        if (this.ctx.verbose) {
          console.error('[bridge-hooks] session-end emulated');
        }
      } catch (err) {
        if (this.ctx.verbose) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[bridge-hooks] session-end emulation failed: ${msg}`);
        }
      }
    }
  }

  /** Return the current run ID, if one was created during session-start. */
  getRunId(): string | undefined {
    return this.runId;
  }
}
