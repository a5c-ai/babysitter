/**
 * GAP-SUBOBS-001: Streaming output capture from invoked harnesses.
 *
 * Provides real-time stdout/stderr streaming from spawned harness CLIs
 * using spawn() instead of execFile(). Callbacks receive chunks and
 * complete lines as they arrive.
 *
 * @module harness/streamingCapture
 */

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { HarnessInvokeOptions, HarnessInvokeResult } from "./types";
import { buildHarnessArgs, buildLaunchSpec, HARNESS_CLI_MAP } from "./invoker";
import { checkCliAvailable } from "./discovery";
import { createPiSession } from "./piWrapper";
import { BabysitterRuntimeError, ErrorCategory } from "../runtime/exceptions";

// ---------------------------------------------------------------------------
// OutputStreamCollector
// ---------------------------------------------------------------------------

/**
 * Collects streaming output chunks, tracks byte count, and emits
 * line-by-line events as complete lines become available.
 *
 * Handles partial lines that span multiple chunks and both LF and CRLF
 * line endings.
 */
export class OutputStreamCollector {
  private _chunks: string[] = [];
  private _partial = "";
  private _byteCount = 0;
  private readonly _onLine?: (line: string) => void;

  constructor(onLine?: (line: string) => void) {
    this._onLine = onLine;
  }

  /** Write a chunk of data. Emits line events for each complete line. */
  write(chunk: string): void {
    this._chunks.push(chunk);
    this._byteCount += Buffer.byteLength(chunk, "utf8");

    if (!this._onLine) return;

    const text = this._partial + chunk;
    const lines = text.split("\n");
    // Last element is either empty (if chunk ended with \n) or a partial line
    this._partial = lines.pop() ?? "";

    for (const line of lines) {
      // Strip trailing \r for CRLF support
      this._onLine(line.endsWith("\r") ? line.slice(0, -1) : line);
    }
  }

  /** Flush any remaining partial line. */
  flush(): void {
    if (this._partial.length > 0 && this._onLine) {
      this._onLine(this._partial.endsWith("\r") ? this._partial.slice(0, -1) : this._partial);
      this._partial = "";
    }
  }

  /** Get the combined output string. */
  getOutput(): string {
    return this._chunks.join("");
  }

  /** Total bytes written. */
  get byteCount(): number {
    return this._byteCount;
  }
}

// ---------------------------------------------------------------------------
// Streaming invoker
// ---------------------------------------------------------------------------

/** Default timeout for harness invocations (15 minutes). */
const DEFAULT_TIMEOUT_MS = 900_000;

/**
 * Invoke a harness CLI with real-time streaming output capture.
 *
 * Unlike `invokeHarness()` which uses `execFile()` and buffers all output
 * until exit, this function uses `spawn()` and pipes stdout/stderr through
 * callbacks as data arrives.
 *
 * The streaming callbacks in `options.streaming` are optional. When omitted,
 * the function still collects output and returns a standard HarnessInvokeResult.
 */
export async function invokeHarnessStreaming(
  name: string,
  options: HarnessInvokeOptions,
): Promise<HarnessInvokeResult> {
  // Handle the "internal" (Pi) harness via PiSessionHandle — Pi has its own
  // streaming mechanism so we delegate to createPiSession.
  if (name === "internal") {
    const session = createPiSession({
      workspace: options.workspace,
      model: options.model,
      timeout: options.timeout,
      ephemeral: true,
    });
    try {
      const result = await session.prompt(options.prompt, options.timeout);
      return { ...result, harness: "internal" };
    } finally {
      session.dispose();
    }
  }

  const spec = HARNESS_CLI_MAP[name];
  if (!spec) {
    throw new BabysitterRuntimeError(
      "UnknownHarnessError",
      `Unknown harness: "${name}". Supported: ${Object.keys(HARNESS_CLI_MAP).join(", ")}`,
      { category: ErrorCategory.Validation },
    );
  }

  const cliCheck = await checkCliAvailable(spec.cli);
  if (!cliCheck.available) {
    throw new BabysitterRuntimeError(
      "HarnessCliNotInstalledError",
      `Harness CLI "${spec.cli}" is not installed or not found on PATH`,
      { category: ErrorCategory.External },
    );
  }

  const args = buildHarnessArgs(name, options);

  // Windows codex special-case: write prompt to temp file for stdin piping
  let promptTempDir: string | undefined;
  let promptFilePath: string | undefined;
  if (process.platform === "win32" && name === "codex") {
    promptTempDir = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-codex-"));
    promptFilePath = path.join(promptTempDir, "prompt.txt");
    await fs.writeFile(promptFilePath, options.prompt, "utf8");
  }

  const launch = buildLaunchSpec(name, spec, cliCheck.path, args, promptFilePath);
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const streaming = options.streaming;
  const childCwd = name === "codex" ? process.cwd() : options.workspace;

  const startTime = Date.now();

  const cleanupPromptFile = async (): Promise<void> => {
    if (!promptTempDir) return;
    await fs.rm(promptTempDir, { recursive: true, force: true }).catch(() => {});
  };

  return new Promise<HarnessInvokeResult>((resolve, reject) => {
    try {
      const child = spawn(launch.command, launch.args, {
        cwd: childCwd,
        env: options.env ? { ...process.env, ...options.env } : process.env,
        shell: launch.shell,
        windowsHide: true,
      });

      // Codex stdin piping (non-Windows)
      if (name === "codex" && process.platform !== "win32" && child.stdin) {
        child.stdin.end(options.prompt);
      }

      const stdoutCollector = new OutputStreamCollector(
        streaming?.onLine
          ? (line) => streaming.onLine!(line, "stdout")
          : undefined,
      );
      const stderrCollector = new OutputStreamCollector(
        streaming?.onLine
          ? (line) => streaming.onLine!(line, "stderr")
          : undefined,
      );

      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, timeoutMs);

      if (child.stdout) {
        child.stdout.on("data", (data: Buffer) => {
          const chunk = data.toString("utf8");
          stdoutCollector.write(chunk);
          streaming?.onStdout?.(chunk);
        });
      }

      if (child.stderr) {
        child.stderr.on("data", (data: Buffer) => {
          const chunk = data.toString("utf8");
          stderrCollector.write(chunk);
          streaming?.onStderr?.(chunk);
        });
      }

      child.on("error", (err: Error) => {
        clearTimeout(timer);
        void cleanupPromptFile();
        stdoutCollector.flush();
        stderrCollector.flush();
        const duration = Date.now() - startTime;
        const output = [stdoutCollector.getOutput(), stderrCollector.getOutput(), err.message]
          .filter(Boolean)
          .join("\n")
          .trim();
        resolve({
          success: false,
          output,
          exitCode: 1,
          duration,
          harness: name,
        });
      });

      child.on("close", (code: number | null) => {
        clearTimeout(timer);
        void cleanupPromptFile();
        stdoutCollector.flush();
        stderrCollector.flush();
        const duration = Date.now() - startTime;
        const exitCode = code ?? 1;
        const stdoutStr = stdoutCollector.getOutput();
        const stderrStr = stderrCollector.getOutput();
        const output = stderrStr.length > 0
          ? `${stdoutStr}\n${stderrStr}`.trim()
          : stdoutStr.trim();

        const finalOutput = timedOut
          ? `Process timed out after ${timeoutMs}ms\n${output}`.trim()
          : output;

        resolve({
          success: exitCode === 0 && !timedOut,
          output: finalOutput,
          exitCode,
          duration,
          harness: name,
        });
      });
    } catch (err: unknown) {
      void cleanupPromptFile();
      reject(
        new BabysitterRuntimeError(
          "HarnessSpawnError",
          `Failed to spawn ${spec.cli}: ${err instanceof Error ? err.message : String(err)}`,
          { category: ErrorCategory.External },
        ),
      );
    }
  });
}
