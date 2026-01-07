import * as fs from 'fs';
import * as path from 'path';

import type { PtyProcess } from './ptyProcess';
import { spawnPtyProcess } from './ptyProcess';
import { windowsPathToWslPath } from './oInstaller';
import { listRunIds, waitForNewRunId } from './runPolling';
import { sanitizeTerminalOutput } from './terminalSanitize';

export type DispatchNewRunOptions = {
  oBinaryPath: string;
  workspaceRoot: string;
  runsRootPath: string;
  prompt: string;
  env?: NodeJS.ProcessEnv;
  /**
   * Windows only: optional path to a Bash executable (e.g. Git Bash `bash.exe`).
   * Used when the configured `o` is a bash script and needs to be wrapped.
   */
  windowsBashPath?: string;
  /**
   * Windows only: optionally force dispatch via WSL (`wsl.exe`) for bash-script `o`.
   * This avoids common Git Bash + node-pty spawn/pspawn issues.
   */
  windowsRuntime?: 'wsl';
  /**
   * Called immediately after spawning the interactive `o` process.
   * The returned handle can be used to send ESC/ENTER via stdin (PTY).
   */
  onProcess?: (process: PtyProcess) => void;
  /**
   * Time to wait for the `o` process to print the run id/path.
   */
  runInfoTimeoutMs?: number;
  /**
   * If `o` doesn't report a run id/path in time, wait for a new run directory to appear.
   * Default: 120s.
   */
  runDirFallbackTimeoutMs?: number;
  /**
   * Poll interval for run directory fallback detection. Default: 250ms.
   */
  runDirFallbackPollIntervalMs?: number;
  /**
   * Test-only override to avoid spawning a real PTY.
   */
  __testOnly_spawnPtyProcess?: typeof spawnPtyProcess;
};

export type DispatchNewRunResult = {
  runId: string;
  runRootPath: string;
  stdout: string;
  stderr: string;
  pid?: number;
};

export type ResumeExistingRunOptions = {
  oBinaryPath: string;
  workspaceRoot: string;
  runsRootPath: string;
  runId: string;
  prompt: string;
  env?: NodeJS.ProcessEnv;
  windowsBashPath?: string;
  windowsRuntime?: 'wsl';
  /**
   * Called immediately after spawning the interactive `o` process.
   * The returned handle can be used to send ESC/ENTER via stdin (PTY).
   */
  onProcess?: (process: PtyProcess) => void;
  /**
   * Time to wait for the `o` process to print initial output (or for the process to exit).
   */
  runInfoTimeoutMs?: number;
};

export type ResumeExistingRunResult = {
  runId: string;
  runRootPath: string;
  stdout: string;
  stderr: string;
  pid?: number;
};

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function extractRunIdFromText(text: string): string | undefined {
  // Current `o` run ids are typically `run-YYYYMMDD-HHMMSS` (optionally with an extra suffix).
  // Keep the older `YYYYMMDD-HHMMSS-...` matcher for backwards compatibility.
  const match =
    text.match(/\brun-\d{8}-\d{6}(?:-[A-Za-z0-9_]+)?\b/) ?? text.match(/\b\d{8}-\d{6}-\w+\b/);
  return match?.[0];
}

function isLikelyPathToken(token: string): boolean {
  if (token.includes(path.sep)) return true;
  if (process.platform === 'win32' && token.includes('/')) return true;
  return token.startsWith('.') || token.startsWith('/') || /^[A-Za-z]:[\\/]/.test(token);
}
function trimToken(token: string): string {
  return token.replace(/^['"([]+/, '').replace(/[\])'",.]+$/, '');
}
function extractRunRootPathFromText(text: string, runId: string, cwd: string): string | undefined {
  const tokens = text
    .split(/\s+/)
    .map(trimToken)
    .filter((t) => t.length > 0);
  const candidates: string[] = [];
  for (const token of tokens) {
    if (!token.includes(runId)) continue;
    if (!isLikelyPathToken(token)) continue;
    candidates.push(token);
  }

  for (const raw of candidates) {
    const resolved = path.isAbsolute(raw) ? raw : path.resolve(cwd, raw);
    try {
      if (fs.statSync(resolved).isDirectory()) return resolved;
    } catch {
      // ignore
    }
  }

  return undefined;
}

function parseDispatchedRunInfo(
  stdout: string,
  stderr: string,
  workspaceRoot: string,
  runsRootPath: string,
): { runId: string; runRootPath: string } | undefined {
  const combined = `${stdout}\n${stderr}`;
  const runId = extractRunIdFromText(combined);
  if (!runId) return undefined;

  const runRootFromOutput =
    extractRunRootPathFromText(stdout, runId, workspaceRoot) ??
    extractRunRootPathFromText(stderr, runId, workspaceRoot);
  const fallback = path.join(runsRootPath, runId);
  return { runId, runRootPath: runRootFromOutput ?? fallback };
}

function parseResumedRunInfo(params: {
  stdout: string;
  stderr: string;
  runId: string;
  workspaceRoot: string;
  runsRootPath: string;
}): { runId: string; runRootPath: string } {
  const runRootFromOutput =
    extractRunRootPathFromText(params.stdout, params.runId, params.workspaceRoot) ??
    extractRunRootPathFromText(params.stderr, params.runId, params.workspaceRoot);
  const fallback = path.join(params.runsRootPath, params.runId);
  return { runId: params.runId, runRootPath: runRootFromOutput ?? fallback };
}

function shSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function isLikelyWindowsNativeBinary(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.exe' || ext === '.com' || ext === '.cmd' || ext === '.bat';
}

function buildWindowsWslInvocation(params: {
  workspaceRoot: string;
  oBinaryPath: string;
  args: string[];
}): { filePath: string; args: string[] } {
  const bashScript = [
    'set -euo pipefail',
    `cd ${shSingleQuote(params.workspaceRoot)}`,
    `${shSingleQuote(params.oBinaryPath)} ${params.args.map(shSingleQuote).join(' ')}`,
  ].join('; ');
  const systemRoot = process.env['SystemRoot'] ?? 'C:\\Windows';
  const wslExe = path.join(systemRoot, 'System32', 'wsl.exe');
  const wslExePath = fs.existsSync(wslExe) ? wslExe : 'wsl.exe';
  return { filePath: wslExePath, args: ['-e', 'bash', '-lc', bashScript] };
}

function buildInvocationHelp(output: string): string | undefined {
  const text = output.toLowerCase();
  if (text.includes('bad interpreter') || text.includes('^m')) {
    return (
      'Likely cause: your `o` script has CRLF line endings (bad shebang). ' +
      'Fix by reinstalling via "Babysitter: Install/Update `o` in Workspace" or converting the file to LF.'
    );
  }
  if (text.includes('permission denied') || text.includes('eacces') || text.includes('eperm')) {
    return (
      'Likely cause: `o` is not executable. ' +
      'Fix by reinstalling via "Babysitter: Install/Update `o` in Workspace" or running `chmod +x o`.'
    );
  }
  if (text.includes('bash: command not found') || text.includes('env: bash')) {
    return (
      'Likely cause: `bash` is not available. ' +
      'On Windows install WSL2 (recommended) or Git Bash; on macOS/Linux install bash.'
    );
  }
  return undefined;
}

function formatCapturedOutputForError(params: { stdout: string; stderr: string }): string {
  const maxChars = 8_000;
  const combinedRaw = `${params.stdout}${params.stderr ? `\n${params.stderr}` : ''}`.trimEnd();
  const combined = sanitizeTerminalOutput(combinedRaw);
  if (!combined.trim()) return '';
  const truncated = combined.length > maxChars ? combined.slice(-maxChars) : combined;
  return `\n\nCaptured output (tail${combined.length > maxChars ? ', truncated' : ''}):\n${truncated}`;
}

function bestEffortKill(process: PtyProcess): void {
  try {
    process.kill();
  } catch {
    // ignore
  }
}

export async function dispatchNewRunViaO(
  options: DispatchNewRunOptions,
): Promise<DispatchNewRunResult> {
  const runInfoTimeoutMs = options.runInfoTimeoutMs ?? 30_000;
  const runDirTimeoutMs = options.runDirFallbackTimeoutMs ?? 120_000;
  const baselineIds = new Set(listRunIds(options.runsRootPath));
  const dispatchStartMs = Date.now();
  const deferred = createDeferred<DispatchNewRunResult>();
  const runDirAbort = new AbortController();

  let child: PtyProcess;
  try {
    const spawn = options.__testOnly_spawnPtyProcess ?? spawnPtyProcess;
    if (
      process.platform === 'win32' &&
      options.windowsRuntime === 'wsl' &&
      !isLikelyWindowsNativeBinary(options.oBinaryPath)
    ) {
      const wslWorkspaceRoot = await windowsPathToWslPath(options.workspaceRoot);
      const wslOBinaryPath = await windowsPathToWslPath(options.oBinaryPath);
      const invocation = buildWindowsWslInvocation({
        workspaceRoot: wslWorkspaceRoot,
        oBinaryPath: wslOBinaryPath,
        args: [options.prompt],
      });
      child = spawn(invocation.filePath, invocation.args, {
        cwd: options.workspaceRoot,
        ...(options.env ? { env: options.env } : {}),
      });
    } else {
      child = spawn(options.oBinaryPath, [options.prompt], {
        cwd: options.workspaceRoot,
        ...(options.env ? { env: options.env } : {}),
        ...(options.windowsBashPath ? { windowsBashPath: options.windowsBashPath } : {}),
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (process.platform === 'win32' && /error code:\s*193\b/i.test(message)) {
      throw new Error(
        `Failed to start \`o\` (${message}). The configured path (${options.oBinaryPath}) is not a Windows executable. ` +
          `If you're pointing at the bash script from the \`o\` repo, prefer WSL2 (recommended) or install Git Bash and configure Babysitter to use it, or point Babysitter at \`o.exe\`/an \`o.cmd\` wrapper.`,
      );
    }
    throw err;
  }
  options.onProcess?.(child);

  let stdout = '';
  const stderr = '';
  let settled = false;
  let pendingTimer: NodeJS.Timeout | undefined;
  let pendingInfo: { runId: string; runRootPath: string } | undefined;

  const settleSuccess = (info: { runId: string; runRootPath: string }): void => {
    if (settled) return;
    settled = true;
    runDirAbort.abort();
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = undefined;
    }
    const result: DispatchNewRunResult = { ...info, stdout, stderr };
    if (child.pid !== undefined) result.pid = child.pid;
    deferred.resolve(result);
  };

  const settleFailure = (err: Error, { kill }: { kill: boolean }): void => {
    if (settled) return;
    settled = true;
    runDirAbort.abort();
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = undefined;
    }
    if (kill) bestEffortKill(child);
    const wrapped = new Error(err.message + formatCapturedOutputForError({ stdout, stderr }));
    (wrapped as { stdout?: string; stderr?: string }).stdout = stdout;
    (wrapped as { stdout?: string; stderr?: string }).stderr = stderr;
    deferred.reject(wrapped);
  };

  const trySettle = (): void => {
    if (settled) return;
    const info = parseDispatchedRunInfo(
      stdout,
      stderr,
      options.workspaceRoot,
      options.runsRootPath,
    );
    if (!info) return;
    pendingInfo = info;
    if (pendingTimer) return;

    // Small grace period to allow both stdout/stderr to flush initial lines.
    pendingTimer = setTimeout(() => {
      pendingTimer = undefined;
      if (settled || !pendingInfo) return;
      settleSuccess(pendingInfo);
    }, 25);
  };

  // PTYs expose a single data stream; capture everything as stdout.
  const disposeData = child.onData((chunk: string) => {
    stdout += chunk;
    trySettle();
  });

  const disposeExit = child.onExit(({ exitCode, signal }) => {
    if (settled) return;
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = undefined;
    }
    const info =
      parseDispatchedRunInfo(stdout, stderr, options.workspaceRoot, options.runsRootPath) ??
      pendingInfo;
    if (info) {
      settleSuccess(info);
      return;
    }

    const details = [
      `code=${exitCode}`,
      `signal=${signal}`,
      `stdout=${stdout.trim() ? '(captured)' : '(empty)'}`,
      `stderr=${stderr.trim() ? '(captured)' : '(empty)'}`,
    ].join(', ');
    const hint = buildInvocationHelp(`${stdout}\n${stderr}`) ?? '';
    const err = new Error(
      `\`o\` exited before a run id/path could be parsed (${details}).` + (hint ? ` ${hint}` : ''),
    );
    settleFailure(err, { kill: false });
  });

  void (async () => {
    const runId = await waitForNewRunId({
      runsRootPath: options.runsRootPath,
      baselineIds,
      timeoutMs: runDirTimeoutMs,
      afterTimeMs: dispatchStartMs,
      signal: runDirAbort.signal,
      ...(options.runDirFallbackPollIntervalMs !== undefined
        ? { pollIntervalMs: options.runDirFallbackPollIntervalMs }
        : {}),
    });
    if (settled || runDirAbort.signal.aborted) return;
    if (runId) {
      settleSuccess({ runId, runRootPath: path.join(options.runsRootPath, runId) });
      return;
    }

    const hint = buildInvocationHelp(`${stdout}\n${stderr}`) ?? '';
    const err = new Error(
      `Timed out waiting for a run id/path from \`o\` output (>${runInfoTimeoutMs}ms) or a new run directory (>${runDirTimeoutMs}ms).` +
        (hint ? ` ${hint}` : ''),
    );
    settleFailure(err, { kill: true });
  })();

  try {
    return await deferred.promise;
  } finally {
    disposeData();
    disposeExit();
  }
}

export async function resumeExistingRunViaO(
  options: ResumeExistingRunOptions,
): Promise<ResumeExistingRunResult> {
  const timeoutMs = options.runInfoTimeoutMs ?? 30_000;
  const deferred = createDeferred<ResumeExistingRunResult>();

  let child: PtyProcess;
  try {
    if (
      process.platform === 'win32' &&
      options.windowsRuntime === 'wsl' &&
      !isLikelyWindowsNativeBinary(options.oBinaryPath)
    ) {
      const wslWorkspaceRoot = await windowsPathToWslPath(options.workspaceRoot);
      const wslOBinaryPath = await windowsPathToWslPath(options.oBinaryPath);
      const invocation = buildWindowsWslInvocation({
        workspaceRoot: wslWorkspaceRoot,
        oBinaryPath: wslOBinaryPath,
        args: [options.runId, options.prompt],
      });
      child = spawnPtyProcess(invocation.filePath, invocation.args, {
        cwd: options.workspaceRoot,
        ...(options.env ? { env: options.env } : {}),
      });
    } else {
      child = spawnPtyProcess(options.oBinaryPath, [options.runId, options.prompt], {
        cwd: options.workspaceRoot,
        ...(options.env ? { env: options.env } : {}),
        ...(options.windowsBashPath ? { windowsBashPath: options.windowsBashPath } : {}),
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (process.platform === 'win32' && /error code:\s*193\b/i.test(message)) {
      throw new Error(
        `Failed to start \`o\` (${message}). The configured path (${options.oBinaryPath}) is not a Windows executable. ` +
          `If you're pointing at the bash script from the \`o\` repo, prefer WSL2 (recommended) or install Git Bash and configure Babysitter to use it, or point Babysitter at \`o.exe\`/an \`o.cmd\` wrapper.`,
      );
    }
    throw err;
  }
  options.onProcess?.(child);

  let stdout = '';
  const stderr = '';
  let settled = false;
  let pendingTimer: NodeJS.Timeout | undefined;
  let spawnFallbackTimer: NodeJS.Timeout | undefined;

  const settle = (): void => {
    if (settled) return;
    settled = true;
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = undefined;
    }
    if (spawnFallbackTimer) {
      clearTimeout(spawnFallbackTimer);
      spawnFallbackTimer = undefined;
    }

    const info = parseResumedRunInfo({
      stdout,
      stderr,
      runId: options.runId,
      workspaceRoot: options.workspaceRoot,
      runsRootPath: options.runsRootPath,
    });
    const result: ResumeExistingRunResult = { ...info, stdout, stderr };
    if (child.pid !== undefined) result.pid = child.pid;
    deferred.resolve(result);
  };

  const trySettleSoon = (): void => {
    if (settled) return;
    if (pendingTimer) return;
    pendingTimer = setTimeout(() => {
      pendingTimer = undefined;
      settle();
    }, 25);
  };

  // In resume mode we already know the run id, and `o` may not print it quickly.
  // Resolve after a short delay even if we can't parse a run root from output yet.
  spawnFallbackTimer = setTimeout(() => {
    settle();
  }, 1000);

  const disposeData = child.onData((chunk: string) => {
    stdout += chunk;
    trySettleSoon();
  });

  const disposeExit = child.onExit(({ exitCode, signal }) => {
    if (settled) return;
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = undefined;
    }
    if (spawnFallbackTimer) {
      clearTimeout(spawnFallbackTimer);
      spawnFallbackTimer = undefined;
    }

    // If `o` exits quickly, treat non-zero exit as failure.
    if (exitCode !== 0) {
      const details = [
        `code=${exitCode}`,
        `signal=${signal}`,
        `stdout=${stdout.trim() ? '(captured)' : '(empty)'}`,
        `stderr=${stderr.trim() ? '(captured)' : '(empty)'}`,
      ].join(', ');
      const hint = buildInvocationHelp(`${stdout}\n${stderr}`) ?? '';
      const err = new Error(
        `\`o\` exited while resuming ${options.runId} (${details}).` + (hint ? ` ${hint}` : ''),
      );
      (err as { stdout?: string; stderr?: string }).stdout = stdout;
      (err as { stdout?: string; stderr?: string }).stderr = stderr;
      settled = true;
      deferred.reject(err);
      return;
    }

    settle();
  });

  const timer = setTimeout(() => {
    if (settled) return;
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = undefined;
    }
    if (spawnFallbackTimer) {
      clearTimeout(spawnFallbackTimer);
      spawnFallbackTimer = undefined;
    }
    settled = true;
    const err = new Error(
      `Timed out waiting for \`o\` to start resuming ${options.runId} after ${timeoutMs}ms.`,
    );
    (err as { stdout?: string; stderr?: string }).stdout = stdout;
    (err as { stdout?: string; stderr?: string }).stderr = stderr;
    deferred.reject(err);
  }, timeoutMs);

  try {
    try {
      return await deferred.promise;
    } catch (err) {
      bestEffortKill(child);
      throw err;
    }
  } finally {
    clearTimeout(timer);
    disposeData();
    disposeExit();
  }
}
