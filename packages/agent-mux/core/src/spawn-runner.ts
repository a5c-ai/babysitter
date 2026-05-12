/**
 * spawn-runner — connects RunHandleImpl to a real Node.js subprocess.
 *
 * Responsibilities:
 *  - spawn the agent process via node:child_process
 *  - register with ProcessTracker for zombie prevention
 *  - pipe stdout/stderr through StreamAssembler + adapter.parseEvent
 *  - wire stdin for InteractionChannel responses
 *  - enforce timeout / inactivityTimeout
 *  - translate child exit into RunHandleImpl.complete()
 *  - support retry policy for transient failure codes
 */

import { spawn, type ChildProcess } from 'node:child_process';

import type { AgentAdapter, ParseContext } from './adapter.js';
import type { AgentEvent } from './events.js';
import type { RunOptions } from './run-options.js';
import { AgentMuxError } from './errors.js';

import { RunHandleImpl } from './run-handle-impl.js';
import { createSpawnRuntimeHookBridge } from './spawn-runtime-hooks.js';
import { StreamAssembler } from './stream-assembler.js';
import { processTracker } from './process-tracker.js';
import { DEFAULT_RETRY_POLICY } from './retry.js';
import type { ErrorCode, RetryPolicy } from './types.js';
import type { InvocationMode } from './invocation.js';
import { ActiveSpawn, computeDelay, isWindows, resolveExitOutcome, resolveSpawnArgs } from './spawn-runner-utils.js';
import { buildInvocationCommand, runCleanupDetached, type InvocationCommandWithCleanup } from './spawn-invocation.js';
export { buildInvocationCommand, type InvocationCommand, type InvocationCommandWithCleanup, type K8sCleanup } from './spawn-invocation.js';

/**
 * Start the spawn loop for the given handle. Returns immediately; all work
 * happens asynchronously. Errors bubble up through handle events + complete().
 */
export function startSpawnLoop(
  handle: RunHandleImpl,
  adapter: AgentAdapter,
  options: RunOptions,
): void {
  const policy: Required<RetryPolicy> = {
    ...DEFAULT_RETRY_POLICY,
    ...(options.retryPolicy ?? {}),
  };
  const retryOn = new Set<ErrorCode>(policy.retryOn);
  const enableRetry = options.retryPolicy !== undefined;

  let attempt = 0;

  const attemptSpawn = (): void => {
    attempt += 1;
    void runOnce(handle, adapter, options, (terminalCode, exitReason, exitCode, signal) => {
      if (
        enableRetry &&
        attempt < policy.maxAttempts &&
        terminalCode !== null &&
        retryOn.has(terminalCode)
      ) {
        const delay = computeDelay(policy, attempt);
        handle.emit({
          type: 'retry',
          runId: handle.runId,
          agent: handle.agent,
          timestamp: Date.now(),
          attempt: attempt + 1,
          maxAttempts: policy.maxAttempts,
          reason: terminalCode,
          delayMs: delay,
        });
        setTimeout(attemptSpawn, delay);
        return;
      }
      handle.complete(exitReason, exitCode, signal);
    }).catch((err) => {
      handle.emit({
        type: 'error',
        runId: handle.runId,
        agent: handle.agent,
        timestamp: Date.now(),
        code: 'SPAWN_ERROR',
        message: err instanceof Error ? err.message : String(err),
        recoverable: false,
      });
      handle.complete('crashed', null, null);
    });
  };

  // Defer to microtask so the synchronous RunHandle return happens first.
  queueMicrotask(attemptSpawn);
}

type FinalizeFn = (
  terminalCode: ErrorCode | null,
  exitReason: import('./run-handle.js').RunResult['exitReason'],
  exitCode: number | null,
  signal: string | null,
) => void;

async function runOnce(
  handle: RunHandleImpl,
  adapter: AgentAdapter,
  options: RunOptions,
  finalize: FinalizeFn,
): Promise<void> {
  const runtimeHooks = await createSpawnRuntimeHookBridge(handle, adapter, options);
  const resolvedSpawnArgs = await resolveSpawnArgs(adapter, adapter.buildSpawnArgs(options));
  const spawnArgs = runtimeHooks.setup?.env
    ? { ...resolvedSpawnArgs, env: { ...resolvedSpawnArgs.env, ...runtimeHooks.setup.env } }
    : resolvedSpawnArgs;
  const now = Date.now();

  // Transform the spawnArgs according to the configured invocation mode.
  let invocationCmd: InvocationCommandWithCleanup;
  try {
    invocationCmd = buildInvocationCommand(options.invocation, spawnArgs, adapter.agent);
  } catch (err) {
    handle.emit({
      type: 'error',
      runId: handle.runId,
      agent: handle.agent,
      timestamp: Date.now(),
      code: 'SPAWN_ERROR',
      message: err instanceof Error ? err.message : String(err),
      recoverable: false,
    });
    finalize('SPAWN_ERROR', 'crashed', null, null);
    return;
  }

  // Emit a debug start event.
  handle.emit({
    type: 'debug',
    runId: handle.runId,
    agent: handle.agent,
    timestamp: now,
    level: 'info',
    message: `Spawning ${invocationCmd.command} (mode=${options.invocation?.mode ?? 'local'}, cwd=${invocationCmd.cwd})`,
  });

  let child!: ChildProcess;
  let ptyProcess: any = null;
  let ptyLineBuf = '';

  // Interactive mode: spawn via node-pty so the harness gets a real TTY.
  // Output is tee'd through feedLine for event parsing + hook dispatch.
  if (options.interactive) {
    try {
      const nodePty: any = require('node-pty');
      ptyProcess = nodePty.spawn(invocationCmd.command, invocationCmd.args, {
        name: 'xterm-256color',
        cols: (process.stdout as any).columns || 120,
        rows: (process.stdout as any).rows || 40,
        cwd: invocationCmd.cwd,
        env: { ...process.env, ...invocationCmd.env },
      });

      // Create a ChildProcess-like facade for the rest of spawn-runner
      child = {
        pid: ptyProcess.pid,
        stdin: null,
        stdout: null,
        stderr: null,
        kill: (sig?: string) => { try { ptyProcess.kill(sig); } catch { /* */ } },
        on: (event: string, cb: (...args: any[]) => void) => {
          if (event === 'close' || event === 'exit') {
            ptyProcess.onExit((e: { exitCode: number; signal?: number }) => cb(e.exitCode, e.signal));
          }
          return child;
        },
        once: (event: string, cb: (...args: any[]) => void) => {
          if (event === 'close' || event === 'exit') {
            ptyProcess.onExit((e: { exitCode: number; signal?: number }) => cb(e.exitCode, e.signal));
          }
          return child;
        },
        removeListener: () => child,
        removeAllListeners: () => child,
      } as unknown as ChildProcess;
    } catch {
      ptyProcess = null;
      // node-pty unavailable — fall through to regular spawn below
    }
  }

  if (!ptyProcess) {
    try {
      child = spawn(invocationCmd.command, invocationCmd.args, {
        cwd: invocationCmd.cwd,
        env: { ...process.env, ...invocationCmd.env },
        shell: invocationCmd.shell,
        detached: !isWindows,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });
    } catch (err) {
      handle.emit({
        type: 'error',
        runId: handle.runId,
        agent: handle.agent,
        timestamp: Date.now(),
        code: 'SPAWN_ERROR',
        message: err instanceof Error ? err.message : String(err),
        recoverable: false,
      });
      finalize('SPAWN_ERROR', 'crashed', null, null);
      return;
    }
  }

  const active: ActiveSpawn = { child: child!, killTimer: null };

  // Transition spawned -> running.
  try {
    handle.transitionTo('running');
  } catch {
    // If handle was already aborted before spawn, ignore.
  }

  // ── ProcessTracker registration ─────────────────────────────────────────
  if (typeof child!.pid === 'number') {
    processTracker.register(child!.pid, isWindows ? 0 : child!.pid, handle.runId);
  }

  // ── StreamAssembler + parseEvent wiring ─────────────────────────────────
  const assembler = new StreamAssembler();
  const adapterState: Record<string, unknown> = {};
  let eventCount = 0;
  let lastEventType: string | null = null;

  const makeParseCtx = (source: 'stdout' | 'stderr'): ParseContext => ({
    runId: handle.runId,
    agent: handle.agent,
    sessionId: runtimeHooks.sessionId,
    turnIndex: 0,
    debug: false,
    outputFormat: options.outputFormat ?? 'text',
    source,
    assembler,
    eventCount,
    lastEventType,
    adapterState,
  });

  let stderrBuf = '';
  let inactivityTimer: NodeJS.Timeout | null = null;

  const resetInactivity = (): void => {
    if (!options.inactivityTimeout || options.inactivityTimeout <= 0) return;
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      handle.emit({
        type: 'timeout',
        runId: handle.runId,
        agent: handle.agent,
        timestamp: Date.now(),
        kind: 'inactivity',
      });
      inactivityTimeoutHit = true;
      killChild('SIGTERM');
    }, options.inactivityTimeout);
  };

  const feedLine = (line: string, source: 'stdout' | 'stderr'): void => {
    if (line.length === 0) return;
    resetInactivity();
    // Always emit a log event for observability.
    handle.emit({
      type: 'log',
      runId: handle.runId,
      agent: handle.agent,
      timestamp: Date.now(),
      source,
      line,
    });
    const assembled = assembler.feed(line);
    if (assembled === null) return;
    try {
      const result = adapter.parseEvent(assembled, makeParseCtx(source));
      if (result === null) return;
      const events = Array.isArray(result) ? result : [result];
      for (const ev of events) {
        eventCount += 1;
        lastEventType = ev.type;
        runtimeHooks.enqueue(ev);
      }
    } catch (err) {
      handle.emit({
        type: 'debug',
        runId: handle.runId,
        agent: handle.agent,
        timestamp: Date.now(),
        level: 'warn',
        message: `parseEvent threw: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  const pipeStream = (stream: NodeJS.ReadableStream | null, source: 'stdout' | 'stderr'): void => {
    if (!stream) return;
    let buf = '';
    stream.setEncoding?.('utf8');
    stream.on('data', (chunk: string | Buffer) => {
      buf += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      if (source === 'stderr') stderrBuf += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      let idx: number;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx).replace(/\r$/, '');
        buf = buf.slice(idx + 1);
        feedLine(line, source);
      }
    });
    stream.on('end', () => {
      if (buf.length > 0) feedLine(buf, source);
    });
  };

  if (ptyProcess) {
    // Interactive PTY: tee output through feedLine for event parsing AND to terminal
    ptyProcess.onData((data: string) => {
      // Pass raw output to user terminal
      process.stdout.write(data);
      // Also feed through line parser for structured event extraction
      ptyLineBuf += data;
      let idx: number;
      while ((idx = ptyLineBuf.indexOf('\n')) !== -1) {
        const line = ptyLineBuf.slice(0, idx).replace(/\r$/, '');
        ptyLineBuf = ptyLineBuf.slice(idx + 1);
        // Strip ANSI escape codes before feeding to the event parser
        const clean = line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');
        feedLine(clean, 'stdout');
      }
    });
    // Wire user stdin to PTY
    if ((process.stdin as any).isTTY) (process.stdin as any).setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (data: Buffer) => {
      try { ptyProcess.write(data.toString()); } catch { /* */ }
    });
    // Handle terminal resize
    process.stdout.on('resize', () => {
      try { ptyProcess.resize((process.stdout as any).columns || 120, (process.stdout as any).rows || 40); } catch { /* */ }
    });
  } else {
    pipeStream(child!.stdout, 'stdout');
    pipeStream(child!.stderr, 'stderr');
  }

  // ── Interaction channel + send() -> stdin ───────────────────────────────
  handle.interaction.setDispatch(async (_id, response) => {
    if (ptyProcess) {
      let text = '';
      if (response.type === 'approve') text = 'y\n';
      else if (response.type === 'deny') text = 'n\n';
      else if (response.type === 'text') text = (response.text ?? '') + '\n';
      try { ptyProcess.write(text); } catch { /* */ }
      return;
    }
    if (!child!.stdin || child!.stdin.destroyed) return;
    let text = '';
    if (response.type === 'approve') text = 'y\n';
    else if (response.type === 'deny') text = 'n\n';
    else if (response.type === 'text') text = (response.text ?? '') + '\n';
    try {
      child.stdin.write(text);
    } catch {
      /* ignore */
    }
  });

  handle.bindInputTransport(async (text: string) => {
    runtimeHooks.dispatchPrompt(text);
    if (ptyProcess) {
      try { ptyProcess.write(text.endsWith('\n') ? text : `${text}\n`); } catch {
        throw new AgentMuxError('STDIN_NOT_AVAILABLE', 'Failed to write to agent PTY', false);
      }
      return;
    }
    if (!adapter.capabilities.supportsStdinInjection) {
      throw new AgentMuxError('STDIN_NOT_AVAILABLE', `${adapter.agent} does not support stdin injection`, false);
    }
    if (!child!.stdin || child!.stdin.destroyed) {
      throw new AgentMuxError('STDIN_NOT_AVAILABLE', 'Agent stdin is not available', false);
    }
    try {
      child!.stdin.write(text.endsWith('\n') ? text : `${text}\n`);
    } catch {
      throw new AgentMuxError('STDIN_NOT_AVAILABLE', 'Failed to write to agent stdin', false);
    }
  });

  const initialPromptText = Array.isArray(options.prompt) ? options.prompt.join('\n') : options.prompt;

  // Optional initial stdin from SpawnArgs.
  if (ptyProcess && spawnArgs.stdin) {
    runtimeHooks.dispatchPrompt(initialPromptText);
    ptyProcess.write(spawnArgs.stdin);
  } else if (spawnArgs.stdin && child!.stdin) {
    runtimeHooks.dispatchPrompt(initialPromptText);
    child!.stdin.write(spawnArgs.stdin);
    if (options.nonInteractive === true) {
      child!.stdin.end();
    }
  } else {
    runtimeHooks.dispatchPrompt(initialPromptText);
    if (spawnArgs.closeStdinAfterSpawn === true && child!.stdin && !child!.stdin.destroyed) {
      child!.stdin.end();
    }
  }

  // ── Timeouts ─────────────────────────────────────────────────────────────
  let runTimeoutHit = false;
  let inactivityTimeoutHit = false;
  let aborted = false;

  const killChild = (signal: NodeJS.Signals): void => {
    runtimeHooks.abort();
    try {
      if (ptyProcess) {
        ptyProcess.kill(signal);
      } else if (!isWindows && typeof child!.pid === 'number') {
        try { process.kill(-child!.pid, signal); } catch { child!.kill(signal); }
      } else {
        child!.kill(signal);
      }
    } catch {
      /* already dead */
    }
    // Two-phase: SIGKILL after grace.
    const grace = options.gracePeriodMs ?? 5000;
    if (active.killTimer) clearTimeout(active.killTimer);
    active.killTimer = setTimeout(() => {
      try {
        if (ptyProcess) {
          ptyProcess.kill('SIGKILL');
        } else if (!isWindows && typeof child!.pid === 'number') {
          try { process.kill(-child!.pid, 'SIGKILL'); } catch { child!.kill('SIGKILL'); }
        } else {
          child!.kill('SIGKILL');
        }
      } catch {
        /* ignore */
      }
    }, grace);
  };

  let runTimer: NodeJS.Timeout | null = null;
  if (options.timeout && options.timeout > 0) {
    runTimer = setTimeout(() => {
      runTimeoutHit = true;
      handle.emit({
        type: 'timeout',
        runId: handle.runId,
        agent: handle.agent,
        timestamp: Date.now(),
        kind: 'run',
      });
      killChild('SIGTERM');
    }, options.timeout);
  }
  resetInactivity();

  // ── Patch handle control methods to actually signal the child ──────────
  const originalAbort = handle.abort.bind(handle);
  handle.abort = async () => {
    aborted = true;
    handle.emit({
      type: 'aborted',
      runId: handle.runId,
      agent: handle.agent,
      timestamp: Date.now(),
    });
    killChild('SIGTERM');
    try { await originalAbort(); } catch { /* state transition may no-op */ }
  };

  const originalPause = handle.pause.bind(handle);
  handle.pause = async () => {
    if (isWindows) {
      handle.emit({
        type: 'debug',
        runId: handle.runId,
        agent: handle.agent,
        timestamp: Date.now(),
        level: 'warn',
        message: 'pause() is not supported on Windows — no-op',
      });
      return;
    }
    try {
      if (typeof child.pid === 'number') process.kill(child.pid, 'SIGSTOP');
    } catch { /* ignore */ }
    await originalPause();
  };

  const originalResume = handle.resume.bind(handle);
  handle.resume = async () => {
    if (isWindows) return;
    try {
      if (typeof child.pid === 'number') process.kill(child.pid, 'SIGCONT');
    } catch { /* ignore */ }
    await originalResume();
  };

  // ── Exit / error handlers ───────────────────────────────────────────────
  let errorFired = false;
  child.on('error', (err: NodeJS.ErrnoException) => {
    if (errorFired) return;
    errorFired = true;
    runtimeHooks.abort();
    const code: ErrorCode =
      err.code === 'ENOENT' ? 'AGENT_NOT_FOUND' : 'SPAWN_ERROR';
    handle.emit({
      type: 'error',
      runId: handle.runId,
      agent: handle.agent,
      timestamp: Date.now(),
      code,
      message: err.message,
      recoverable: false,
    });
    void cleanupAndFinalize(code, 'crashed', null, null);
  });

  const cleanupAndFinalize = async (
    terminalCode: ErrorCode | null,
    exitReason: import('./run-handle.js').RunResult['exitReason'],
    exitCode: number | null,
    signal: string | null,
  ): Promise<void> => {
    runtimeHooks.abort();
    await runtimeHooks.finalize(exitReason, exitCode, signal);
    if (runTimer) clearTimeout(runTimer);
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (active.killTimer) clearTimeout(active.killTimer);
    if (typeof child.pid === 'number') processTracker.unregister(child.pid);
    try {
      await runtimeHooks.setup?.cleanup?.();
    } catch {
      // Best-effort cleanup only.
    }
    // Best-effort k8s ephemeral pod teardown — safety net if `kubectl run --rm`
    // didn't fire because our local kubectl client was killed mid-flight.
    if (invocationCmd.cleanup) runCleanupDetached(invocationCmd.cleanup);
    finalize(terminalCode, exitReason, exitCode, signal);
  };

  child.on('exit', (code, signal) => {
    if (errorFired) return;

    const { exitReason, terminalCode, emitCrash } = resolveExitOutcome({
      runTimeoutHit,
      inactivityTimeoutHit,
      aborted,
      code,
      signal: signal ?? null,
    });
    if (emitCrash) {
      handle.emit({
        type: 'crash',
        runId: handle.runId,
        agent: handle.agent,
        timestamp: Date.now(),
        exitCode: code ?? -1,
        stderr: stderrBuf.slice(-4096),
      });
    }

    void cleanupAndFinalize(terminalCode, exitReason, code, signal ?? null);
  });
}
