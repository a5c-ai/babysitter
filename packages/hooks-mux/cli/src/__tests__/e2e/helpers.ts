/**
 * Shared helpers for hooks-mux CLI e2e tests.
 */
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/** Root of the hooks-mux/cli package. */
export const CLI_PKG_DIR = path.resolve(__dirname, '..', '..', '..');

/** Path to the compiled CLI entry point. */
export const CLI_ENTRY = path.join(CLI_PKG_DIR, 'dist', 'cli', 'main.js');

/**
 * Create an isolated temp directory for session storage and handler scripts.
 * Sets up the structure expected by getDefaultSessionDir when
 * XDG_STATE_HOME is pointed at the temp root.
 *
 * The session dir lives at <tmpRoot>/a5c-hooks/sessions/
 */
export async function createTempSessionRoot(): Promise<{
  tmpRoot: string;
  sessionDir: string;
  cleanup: () => Promise<void>;
}> {
  const tmpRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hp-e2e-'));
  const sessionDir = path.join(tmpRoot, 'a5c-hooks', 'sessions');
  await fs.promises.mkdir(sessionDir, { recursive: true });
  return {
    tmpRoot,
    sessionDir,
    cleanup: async () => {
      await fs.promises.rm(tmpRoot, { recursive: true, force: true });
    },
  };
}

/**
 * Result of spawning the CLI.
 */
export interface CliResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Spawn the hooks-mux CLI as a real child process.
 */
export function runCli(
  args: string[],
  options: {
    stdin?: string;
    env?: Record<string, string>;
    timeoutMs?: number;
  } = {},
): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [CLI_ENTRY, ...args],
      {
        env: {
          ...process.env,
          ...options.env,
          // Prevent interactive TTY behavior
          FORCE_COLOR: '0',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: CLI_PKG_DIR,
      },
    );

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

    const timeout = options.timeoutMs ?? 15000;
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`CLI timed out after ${timeout}ms`));
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code,
        stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
        stderr: Buffer.concat(stderrChunks).toString('utf-8'),
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    if (options.stdin !== undefined) {
      child.stdin.write(options.stdin);
      child.stdin.end();
    } else {
      child.stdin.end();
    }
  });
}

/**
 * Read a session file directly from disk.
 */
export async function readSessionFile(
  sessionDir: string,
  sessionId: string,
): Promise<Record<string, unknown> | null> {
  const filePath = path.join(sessionDir, `${sessionId}.json`);
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Write a session file directly to disk (for test setup).
 */
export async function writeSessionFile(
  sessionDir: string,
  sessionId: string,
  session: Record<string, unknown>,
): Promise<void> {
  const filePath = path.join(sessionDir, `${sessionId}.json`);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  const envelope = {
    schemaVersion: 'a5c.hooks.session.v1',
    session,
  };
  await fs.promises.writeFile(filePath, JSON.stringify(envelope, null, 2), 'utf-8');
}

/** Counter to ensure unique launcher names within a process. */
let launcherCounter = 0;

/**
 * Write a handler script to a temp file and return the shell command to run it.
 *
 * On Windows, we face two issues:
 * 1. child_process.exec() uses cmd.exe which struggles with certain path formats
 * 2. The CLI's parseHandlerArgs splits on ':', breaking Windows drive paths like C:/...
 *
 * To avoid both, we write a small launcher script under the CLI package
 * directory (no drive letter in relative path) that requires the real handler
 * via an absolute path encoded in a way that avoids colon splitting.
 *
 * Each call to createTempSessionRoot should pass its tmpRoot here so launchers
 * are scoped to a unique subdirectory, preventing cross-test interference.
 */
export async function writeHandlerScript(
  tmpRoot: string,
  name: string,
  jsCode: string,
): Promise<string> {
  const scriptPath = path.join(tmpRoot, `${name}.js`);
  await fs.promises.writeFile(scriptPath, jsCode, 'utf-8');

  // Create a launcher script in a unique subdirectory under CLI_PKG_DIR.
  // The subdirectory is derived from the tmpRoot basename to isolate
  // concurrent test runs.
  const tmpBasename = path.basename(tmpRoot);
  const launcherDir = path.join(CLI_PKG_DIR, '.e2e-tmp-handlers', tmpBasename);
  await fs.promises.mkdir(launcherDir, { recursive: true });

  const launcherName = `launcher-${name}-${process.pid}-${++launcherCounter}.js`;
  const launcherPath = path.join(launcherDir, launcherName);

  // The launcher requires the actual handler script using its absolute path
  const scriptPathForward = scriptPath.replace(/\\/g, '/');
  await fs.promises.writeFile(
    launcherPath,
    `require("${scriptPathForward}");`,
    'utf-8',
  );

  // Return relative path from CLI_PKG_DIR (avoids drive letter colon)
  const relativeLauncher = path.relative(CLI_PKG_DIR, launcherPath).replace(/\\/g, '/');
  return `node ${relativeLauncher}`;
}

/**
 * Clean up temporary launcher scripts for a specific tmpRoot.
 */
export async function cleanupLaunchers(tmpRoot: string): Promise<void> {
  const tmpBasename = path.basename(tmpRoot);
  const launcherDir = path.join(CLI_PKG_DIR, '.e2e-tmp-handlers', tmpBasename);
  try {
    await fs.promises.rm(launcherDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
  // Also try to remove parent if empty
  try {
    const parentDir = path.join(CLI_PKG_DIR, '.e2e-tmp-handlers');
    const entries = await fs.promises.readdir(parentDir);
    if (entries.length === 0) {
      await fs.promises.rmdir(parentDir);
    }
  } catch {
    // ignore
  }
}
