/**
 * Internal helpers for the install/update/detect/uninstall commands.
 * Split out to keep `install.ts` under the max-file-lines budget.
 */

import { spawn } from 'node:child_process';

export type SpawnRunner = (
  command: string,
  args: string[],
) => Promise<{ code: number; stdout: string; stderr: string }>;

/**
 * Create a SpawnRunner. When `echo` is true, child output is mirrored to
 * the CLI's stdout/stderr (useful for long-running install commands in
 * human mode). When false (default for JSON/detect), child output is
 * captured silently so it doesn't contaminate structured output.
 */
export function makeSpawnRunner(echo: boolean): SpawnRunner {
  return (command, args) =>
    new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
        windowsHide: true,
      });
      let stdout = '';
      let stderr = '';
      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      child.stdout?.on('data', (c: string) => {
        stdout += c;
        if (echo) process.stdout.write(c);
      });
      child.stderr?.on('data', (c: string) => {
        stderr += c;
        if (echo) process.stderr.write(c);
      });
      child.on('error', (err) => reject(err));
      child.on('exit', (code) => resolve({ code: code ?? 1, stdout, stderr }));
    });
}

export const defaultSpawnRunner: SpawnRunner = makeSpawnRunner(true);
export const silentSpawnRunner: SpawnRunner = makeSpawnRunner(false);

/**
 * Temporarily swallow writes to process.stdout/stderr while `fn` runs.
 * Used to suppress per-agent JSON envelopes when `--all --json` aggregates
 * results into a single response.
 */
export async function runSilently<T>(fn: () => Promise<T>): Promise<T> {
  const origOut = process.stdout.write.bind(process.stdout);
  const origErr = process.stderr.write.bind(process.stderr);
  const noop = ((..._a: unknown[]) => true) as typeof origOut;
  (process.stdout as unknown as { write: typeof origOut }).write = noop;
  (process.stderr as unknown as { write: typeof origErr }).write = noop;
  try {
    return await fn();
  } finally {
    (process.stdout as unknown as { write: typeof origOut }).write = origOut;
    (process.stderr as unknown as { write: typeof origErr }).write = origErr;
  }
}
