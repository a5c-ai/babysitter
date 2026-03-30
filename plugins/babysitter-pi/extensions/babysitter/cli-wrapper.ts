/**
 * Babysitter CLI invocation helper.
 *
 * Spawns the `babysitter` CLI as a child process, captures stdout/stderr,
 * parses JSON output, and surfaces structured errors.  Every other module
 * that needs to talk to babysitter goes through here so there is exactly
 * one place to handle timeouts, env vars, and error mapping.
 *
 * @deprecated Use `sdk-bridge.ts` instead.  This module spawns a child
 * process to communicate with babysitter.  The SDK bridge imports the
 * runtime directly, avoiding subprocess overhead and JSON parsing.
 * This file is retained only for backward compatibility and will be
 * removed in a future release.
 *
 * @module cli-wrapper
 */

import { execFile } from 'node:child_process';
import { CLI_COMMAND, CLI_TIMEOUT_MS } from './constants';

/** Structured result from a CLI invocation. */
export interface CliResult<T = unknown> {
  /** Whether the process exited with code 0. */
  success: boolean;
  /** Parsed JSON from stdout (when `--json` flag is used). */
  data?: T;
  /** Raw stdout string. */
  stdout: string;
  /** Raw stderr string. */
  stderr: string;
  /** Process exit code (null when killed by signal). */
  exitCode: number | null;
}

/**
 * Invoke the babysitter CLI with the given command and arguments.
 *
 * The `--json` flag is appended automatically so callers always get
 * machine-readable output.  Errors are captured rather than thrown --
 * inspect `CliResult.success` to decide how to proceed.
 *
 * @param command - The babysitter sub-command (e.g. `"run:iterate"`).
 * @param args    - Additional positional / flag arguments.
 * @param options - Optional overrides for timeout and env.
 * @returns A promise that resolves to the structured CLI result.
 *
 * @example
 * ```ts
 * const res = await runCli('run:iterate', ['--run-id', runId]);
 * if (res.success && res.data) {
 *   console.log(res.data);
 * }
 * ```
 */
export async function runCli<T = unknown>(
  command: string,
  args: string[] = [],
  options: { timeoutMs?: number; env?: Record<string, string> } = {},
): Promise<CliResult<T>> {
  const timeout = options.timeoutMs ?? CLI_TIMEOUT_MS;
  const fullArgs = [command, '--json', ...args];

  return new Promise<CliResult<T>>((resolve) => {
    const child = execFile(
      CLI_COMMAND,
      fullArgs,
      {
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10 MiB
        env: { ...process.env, ...options.env },
      },
      (error, stdout, stderr) => {
        const exitCode =
          error && 'code' in error ? (error.code as number | null) : child.exitCode;

        let data: T | undefined;
        try {
          if (stdout.trim()) {
            data = JSON.parse(stdout) as T;
          }
        } catch {
          // stdout was not valid JSON -- leave data undefined
        }

        resolve({
          success: exitCode === 0,
          data,
          stdout: String(stdout),
          stderr: String(stderr),
          exitCode: typeof exitCode === 'number' ? exitCode : null,
        });
      },
    );
  });
}
