/**
 * E2E harness: in-process CLI runner.
 *
 * Runs the real CLI `main()` with captured stdout and stderr.
 */

import { main } from '../../cli/src/index.js';

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** Run the CLI `main()` in-process, capturing stdout and stderr. */
export async function runCliInProcess(argv: string[]): Promise<RunResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const origStdout = process.stdout.write;
  const origStderr = process.stderr.write;
  process.stdout.write = ((chunk: unknown): boolean => {
    stdout.push(typeof chunk === 'string' ? chunk : String(chunk));
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: unknown): boolean => {
    stderr.push(typeof chunk === 'string' ? chunk : String(chunk));
    return true;
  }) as typeof process.stderr.write;
  try {
    const code = await main(argv);
    return { code, stdout: stdout.join(''), stderr: stderr.join('') };
  } finally {
    process.stdout.write = origStdout;
    process.stderr.write = origStderr;
  }
}
