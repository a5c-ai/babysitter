import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import * as pty from 'node-pty';

export type PtyExitEvent = { exitCode: number; signal: number };

export type PtyProcess = {
  pid: number;
  write: (data: string) => void;
  onData: (handler: (data: string) => void) => () => void;
  onExit: (handler: (event: PtyExitEvent) => void) => () => void;
  kill: () => void;
  /**
   * Removes listeners but does not terminate the underlying process.
   * Useful when the extension is deactivating and should not implicitly kill `o`.
   */
  detach: () => void;
  dispose: () => void;
};

export type SpawnPtyOptions = {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  cols?: number;
  rows?: number;
  name?: string;
  /**
   * Windows only: optional path to a Bash executable (e.g. Git Bash `bash.exe`) used
   * when wrapping bash-shebang scripts (like the `o` bash script).
   */
  windowsBashPath?: string;
};

function isWindowsCmdScript(filePath: string, platform: NodeJS.Platform): boolean {
  if (platform !== 'win32') return false;
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.cmd' || ext === '.bat';
}

function readShebang(filePath: string): string | undefined {
  try {
    const fd = fs.openSync(filePath, 'r');
    try {
      const buf = Buffer.alloc(256);
      const bytesRead = fs.readSync(fd, buf, 0, buf.length, 0);
      if (bytesRead <= 0) return undefined;
      const text = buf.subarray(0, bytesRead).toString('utf8');
      const firstLine = text.split(/\r?\n/, 1)[0];
      if (!firstLine || !firstLine.startsWith('#!')) return undefined;
      return firstLine.slice(2).trim();
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return undefined;
  }
}

export function wrapCommandForPlatform(params: {
  filePath: string;
  args: string[];
  platform: NodeJS.Platform;
  windowsBashPath?: string;
}): { filePath: string; args: string[] } {
  // On Windows, users may point Babysitter at the `o` bash script (e.g. from the `o` repo),
  // which cannot be executed directly via CreateProcess. Wrap it with `bash` when detected.
  if (params.platform === 'win32') {
    const ext = path.extname(params.filePath).toLowerCase();
    const isKnownExecutable = ext === '.exe' || ext === '.com';
    const isKnownCmd = ext === '.cmd' || ext === '.bat';

    if (!isKnownExecutable && !isKnownCmd && fs.existsSync(params.filePath)) {
      const shebang = readShebang(params.filePath);
      if (shebang && /\bbash\b/i.test(shebang)) {
        const configuredBash = params.windowsBashPath?.trim();
        const bashPath = configuredBash && fs.existsSync(configuredBash) ? configuredBash : 'bash';
        // Prefer forward slashes so MSYS bash treats it as a Windows path.
        const scriptPathForBash = params.filePath.replace(/\\/g, '/');
        return { filePath: bashPath, args: [scriptPathForBash, ...params.args] };
      }
    }
  }

  return { filePath: params.filePath, args: params.args };
}

function spawnStdioProcess(filePath: string, args: string[], options: SpawnPtyOptions): PtyProcess {
  const child = spawn(filePath, args, {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env ?? {}) },
    // Use the system shell so `.cmd` / `.bat` wrappers run correctly on Windows.
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const dataHandlers = new Set<(data: string) => void>();
  const exitHandlers = new Set<(event: PtyExitEvent) => void>();

  child.stdout?.setEncoding('utf8');
  child.stderr?.setEncoding('utf8');
  const stdoutListener = (chunk: string): void => {
    for (const handler of dataHandlers) handler(chunk);
  };
  const stderrListener = (chunk: string): void => {
    for (const handler of dataHandlers) handler(chunk);
  };
  child.stdout?.on('data', stdoutListener);
  child.stderr?.on('data', stderrListener);

  const exitListener = (code: number | null, signal: NodeJS.Signals | null): void => {
    for (const handler of exitHandlers) handler({ exitCode: code ?? 0, signal: signal ? 1 : 0 });
  };
  child.on('exit', exitListener);
  const errorListener = (err: unknown): void => {
    const message = err instanceof Error ? err.message : String(err);
    for (const handler of dataHandlers) handler(`${message}\n`);
    for (const handler of exitHandlers) handler({ exitCode: 1, signal: 0 });
  };
  child.on('error', errorListener);

  let disposed = false;
  const detach = (): void => {
    if (disposed) return;
    disposed = true;
    dataHandlers.clear();
    exitHandlers.clear();
    child.stdout?.off('data', stdoutListener);
    child.stderr?.off('data', stderrListener);
    child.off('exit', exitListener);
    child.off('error', errorListener);
  };

  return {
    pid: child.pid ?? -1,
    write: (data: string) => {
      if (disposed) return;
      child.stdin.write(data);
    },
    onData: (handler) => {
      if (disposed) return () => undefined;
      dataHandlers.add(handler);
      return () => dataHandlers.delete(handler);
    },
    onExit: (handler) => {
      if (disposed) return () => undefined;
      exitHandlers.add(handler);
      return () => exitHandlers.delete(handler);
    },
    kill: () => {
      if (disposed) return;
      child.kill();
    },
    detach,
    dispose: () => {
      detach();
      try {
        child.kill();
      } catch {
        // ignore
      }
    },
  };
}

function spawnStdioDirectProcess(
  filePath: string,
  args: string[],
  options: SpawnPtyOptions,
): PtyProcess {
  const child = spawn(filePath, args, {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env ?? {}) },
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const dataHandlers = new Set<(data: string) => void>();
  const exitHandlers = new Set<(event: PtyExitEvent) => void>();

  child.stdout?.setEncoding('utf8');
  child.stderr?.setEncoding('utf8');
  const stdoutListener = (chunk: string): void => {
    for (const handler of dataHandlers) handler(chunk);
  };
  const stderrListener = (chunk: string): void => {
    for (const handler of dataHandlers) handler(chunk);
  };
  child.stdout?.on('data', stdoutListener);
  child.stderr?.on('data', stderrListener);

  const exitListener = (code: number | null, signal: NodeJS.Signals | null): void => {
    for (const handler of exitHandlers) handler({ exitCode: code ?? 0, signal: signal ? 1 : 0 });
  };
  child.on('exit', exitListener);

  const errorListener = (err: unknown): void => {
    const message = err instanceof Error ? err.message : String(err);
    for (const handler of dataHandlers) handler(`${message}\n`);
    for (const handler of exitHandlers) handler({ exitCode: 1, signal: 0 });
  };
  child.on('error', errorListener);

  let disposed = false;
  const detach = (): void => {
    if (disposed) return;
    disposed = true;
    dataHandlers.clear();
    exitHandlers.clear();
    child.stdout?.off('data', stdoutListener);
    child.stderr?.off('data', stderrListener);
    child.off('exit', exitListener);
    child.off('error', errorListener);
  };

  return {
    pid: child.pid ?? -1,
    write: (data: string) => {
      if (disposed) return;
      child.stdin.write(data);
    },
    onData: (handler) => {
      if (disposed) return () => undefined;
      dataHandlers.add(handler);
      return () => dataHandlers.delete(handler);
    },
    onExit: (handler) => {
      if (disposed) return () => undefined;
      exitHandlers.add(handler);
      return () => exitHandlers.delete(handler);
    },
    kill: () => {
      if (disposed) return;
      child.kill();
    },
    detach,
    dispose: () => {
      detach();
      try {
        child.kill();
      } catch {
        // ignore
      }
    },
  };
}

function isPermissionError(err: unknown): boolean {
  const anyErr = err as { code?: unknown; message?: unknown };
  const code = typeof anyErr?.code === 'string' ? anyErr.code : undefined;
  if (code === 'EACCES' || code === 'EPERM') return true;
  const message = typeof anyErr?.message === 'string' ? anyErr.message : String(err);
  return /\b(EACCES|EPERM)\b/i.test(message) || /permission denied/i.test(message);
}

function chmodExecutableSync(filePath: string): void {
  try {
    fs.chmodSync(filePath, 0o755);
  } catch {
    // ignore
  }
}

export function spawnPtyProcess(
  filePath: string,
  args: string[],
  options: SpawnPtyOptions,
): PtyProcess {
  const wrapped = wrapCommandForPlatform({
    filePath,
    args,
    platform: process.platform,
    ...(options.windowsBashPath ? { windowsBashPath: options.windowsBashPath } : {}),
  });
  filePath = wrapped.filePath;
  args = wrapped.args;

  if (isWindowsCmdScript(filePath, process.platform)) {
    return spawnStdioProcess(filePath, args, options);
  }

  const spawnWithPty = (): ReturnType<typeof pty.spawn> =>
    pty.spawn(filePath, args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env ?? {}) },
      cols: options.cols ?? 120,
      rows: options.rows ?? 30,
      name: options.name ?? 'xterm-256color',
    });

  let ptyProcess: ReturnType<typeof pty.spawn> | undefined;
  try {
    ptyProcess = spawnWithPty();
  } catch (err) {
    // macOS/Linux: if `o` exists but isn't executable, try `chmod +x` once and retry.
    if (process.platform !== 'win32' && isPermissionError(err) && fs.existsSync(filePath)) {
      chmodExecutableSync(filePath);
      try {
        ptyProcess = spawnWithPty();
      } catch {
        // fall through to stdio fallback
      }
    }

    if (!ptyProcess) {
      // Fallback: node-pty can fail for certain binaries (notably Git Bash/MSYS) and environments.
      return spawnStdioDirectProcess(filePath, args, options);
    }
  }

  const dataHandlers = new Set<(data: string) => void>();
  const exitHandlers = new Set<(event: PtyExitEvent) => void>();

  const dataDisposable = ptyProcess.onData((data) => {
    for (const handler of dataHandlers) handler(data);
  });
  let exited = false;
  const exitDisposable = ptyProcess.onExit((event) => {
    exited = true;
    for (const handler of exitHandlers)
      handler({ exitCode: event.exitCode, signal: event.signal ?? 0 });
  });

  let disposed = false;
  const detach = (): void => {
    if (disposed) return;
    disposed = true;
    dataHandlers.clear();
    exitHandlers.clear();
    dataDisposable.dispose();
    exitDisposable.dispose();
  };

  return {
    pid: ptyProcess.pid,
    write: (data: string) => {
      if (disposed) return;
      ptyProcess.write(data);
    },
    onData: (handler) => {
      if (disposed) return () => undefined;
      dataHandlers.add(handler);
      return () => dataHandlers.delete(handler);
    },
    onExit: (handler) => {
      if (disposed) return () => undefined;
      exitHandlers.add(handler);
      return () => exitHandlers.delete(handler);
    },
    kill: () => {
      if (disposed) return;
      ptyProcess.kill();
    },
    detach,
    dispose: () => {
      detach();
      if (exited) return;
      try {
        ptyProcess.kill();
      } catch {
        // ignore
      }
    },
  };
}
