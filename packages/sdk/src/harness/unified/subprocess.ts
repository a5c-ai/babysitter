/**
 * Subprocess bridge to hooks-mux.
 *
 * Spawns `a5c-hooks-mux` (or a custom binary from AGENT_HOOKS_PROXY_PATH)
 * as a child process.  Communication is via JSON on stdin/stdout.
 *
 * The unified adapter imports NO hooks-mux packages directly — all
 * communication is through this subprocess interface plus env vars.
 */

import { spawn } from "node:child_process";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvokeOptions {
  /** Adapter name to pass via --adapter. */
  adapter: string;
  /** Optional session identifier. */
  sessionId?: string;
  /** Whether to only run bootstrapping (no event dispatch). */
  bootstrapOnly?: boolean;
  /** Request JSON output. */
  json?: boolean;
  /** Handler names to activate. */
  handlers?: string[];
  /** Working directory for the subprocess. */
  cwd?: string;
  /** Timeout in milliseconds (default 30 000). */
  timeoutMs?: number;
  /** Event payload to write to stdin. */
  event?: Record<string, unknown>;
}

export interface InvokeResult {
  /** Process exit code. */
  exitCode: number;
  /** Parsed JSON from stdout (if JSON mode). */
  stdout: string;
  /** Raw stderr output. */
  stderr: string;
}

// ---------------------------------------------------------------------------
// Binary resolution
// ---------------------------------------------------------------------------

function resolveHooksProxyBinary(): string {
  return process.env.AGENT_HOOKS_PROXY_PATH || "a5c-hooks-mux";
}

const IS_WINDOWS = process.platform === "win32";

// ---------------------------------------------------------------------------
// Availability check
// ---------------------------------------------------------------------------

/**
 * Check whether the hooks-mux binary is available on PATH (or at the
 * configured `AGENT_HOOKS_PROXY_PATH`).
 *
 * Returns `true` when `<binary> --version` exits with code 0.
 */
export async function isHooksProxyAvailable(): Promise<boolean> {
  const binary = resolveHooksProxyBinary();
  return new Promise<boolean>((resolve) => {
    const child = spawn(binary, ["--version"], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      shell: IS_WINDOWS,
      timeout: 3000,
    });

    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}

// ---------------------------------------------------------------------------
// Invoke
// ---------------------------------------------------------------------------

/**
 * Invoke hooks-mux CLI as a subprocess.
 *
 * Sends the normalised event on stdin, reads the result from stdout.
 * Resolves with an `InvokeResult` regardless of exit code — callers
 * decide whether a non-zero exit is fatal.
 */
export async function invokeHooksProxy(
  options: InvokeOptions,
): Promise<InvokeResult> {
  const binary = resolveHooksProxyBinary();

  const args: string[] = ["invoke", "--adapter", options.adapter];

  if (options.sessionId) args.push("--session-id", options.sessionId);
  if (options.bootstrapOnly) args.push("--bootstrap-only");
  if (options.json) args.push("--json");

  for (const handler of options.handlers ?? []) {
    args.push("--handler", handler);
  }

  const timeoutMs = options.timeoutMs ?? 30_000;

  return new Promise<InvokeResult>((resolve, reject) => {
    const child = spawn(binary, args, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      shell: IS_WINDOWS,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    // Write event payload to stdin
    if (options.event) {
      child.stdin.write(JSON.stringify(options.event));
    }
    child.stdin.end();

    // Timeout guard
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(
        new Error(
          `hooks-mux subprocess timed out after ${timeoutMs}ms`,
        ),
      );
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code ?? 1,
        stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
        stderr: Buffer.concat(stderrChunks).toString("utf-8"),
      });
    });
  });
}

/**
 * Build the argument array for an `invokeHooksProxy` call.
 *
 * Useful for testing without actually spawning a process.
 */
export function buildInvokeArgs(options: InvokeOptions): string[] {
  const args: string[] = ["invoke", "--adapter", options.adapter];

  if (options.sessionId) args.push("--session-id", options.sessionId);
  if (options.bootstrapOnly) args.push("--bootstrap-only");
  if (options.json) args.push("--json");

  for (const handler of options.handlers ?? []) {
    args.push("--handler", handler);
  }

  return args;
}
