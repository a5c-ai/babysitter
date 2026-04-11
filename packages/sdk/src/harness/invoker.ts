/**
 * Harness invoker module.
 *
 * Provides functions to programmatically invoke harness CLIs (claude, codex,
 * pi, gemini, cursor, opencode) as child processes. Each harness has its own
 * flag mapping; this module abstracts those differences behind a uniform API.
 */

import { execFile, spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { HarnessInvokeOptions, HarnessInvokeResult, StreamingOutputOptions } from "./types";
import { checkCliAvailable } from "./discovery";
import { createPiSession } from "./piWrapper";
import { BabysitterRuntimeError, ErrorCategory } from "../runtime/exceptions";

// ---------------------------------------------------------------------------
// CLI mapping
// ---------------------------------------------------------------------------

/** Flag-building specification for a single harness. */
interface HarnessCliSpec {
  /** CLI command name. */
  cli: string;
  /** Whether the harness accepts a --cwd / --workspace flag. */
  workspaceFlag?: string;
  /** Whether the harness accepts a --model flag. */
  supportsModel: boolean;
  /** Whether the prompt is passed positionally or via a named flag. */
  promptStyle?: "positional" | "flag";
  /** Optional leading args required for non-interactive invocation. */
  baseArgs?: string[];
}

interface LaunchSpec {
  command: string;
  args: string[];
  shell: boolean;
}

/**
 * Mapping from harness identifier to CLI command and flag details.
 */
export const HARNESS_CLI_MAP: Readonly<Record<string, HarnessCliSpec>> = {
  "claude-code": { cli: "claude", supportsModel: true, promptStyle: "flag" },
  codex: {
    cli: "codex",
    workspaceFlag: "-C",
    supportsModel: true,
    promptStyle: "positional",
    baseArgs: ["exec", "--dangerously-bypass-approvals-and-sandbox", "--skip-git-repo-check"],
  },
  pi: { cli: "pi", workspaceFlag: "--workspace", supportsModel: true, promptStyle: "flag" },
  "oh-my-pi": { cli: "omp", workspaceFlag: "--workspace", supportsModel: true, promptStyle: "flag" },
  "gemini-cli": { cli: "gemini", supportsModel: true, promptStyle: "flag" },
  "github-copilot": { cli: "copilot", supportsModel: true, promptStyle: "flag" },
  cursor: { cli: "cursor", supportsModel: true, promptStyle: "positional", baseArgs: ["agent"], workspaceFlag: "--workspace" },
  openclaw: { cli: "openclaw", workspaceFlag: undefined, supportsModel: false, promptStyle: "flag", baseArgs: [] },
  opencode: { cli: "opencode", supportsModel: true, promptStyle: "positional", baseArgs: ["run"] },
} as const;

const PROGRAMMATIC_ONLY_HARNESSES = ["internal"] as const;
const SUPPORTED_HARNESS_NAMES = [
  ...PROGRAMMATIC_ONLY_HARNESSES,
  ...Object.keys(HARNESS_CLI_MAP),
] as const;

function quotePowerShellArg(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function buildLaunchSpec(
  name: string,
  spec: HarnessCliSpec,
  cliPath: string | undefined,
  args: string[],
  promptFilePath?: string,
): LaunchSpec {
  if (process.platform === "win32" && name === "codex") {
    const commandLine = [
      "Get-Content -Raw",
      quotePowerShellArg(promptFilePath ?? ""),
      "|",
      "&",
      quotePowerShellArg(spec.cli),
      ...args.map(quotePowerShellArg),
    ].join(" ");

    return {
      command: "powershell.exe",
      args: ["-NoProfile", "-Command", commandLine],
      shell: false,
    };
  }

  if (process.platform === "win32") {
    return {
      command: spec.cli,
      args,
      shell: true,
    };
  }

  return {
    command: cliPath ?? spec.cli,
    args,
    shell: false,
  };
}

// ---------------------------------------------------------------------------
// Process cancellation
// ---------------------------------------------------------------------------

/** Registry of active child processes by PID for cancellation support. */
const activeChildren = new Map<number, { kill: (signal?: NodeJS.Signals | number) => boolean }>();

/**
 * Registers a child process for cancellation tracking.
 * @internal
 */
function trackChild(child: { pid?: number; kill: (signal?: NodeJS.Signals | number) => boolean }): void {
  if (child.pid != null) {
    activeChildren.set(child.pid, child);
  }
}

/**
 * Unregisters a child process from cancellation tracking.
 * @internal
 */
function untrackChild(pid: number | undefined): void {
  if (pid != null) {
    activeChildren.delete(pid);
  }
}

/**
 * Cancels a running process by PID. Sends SIGTERM first, then escalates to
 * SIGKILL after the grace period if the process is still running.
 *
 * @returns `true` if the process was successfully signalled, `false` if it
 *   had already exited.
 */
export function cancelRunningProcess(
  pid: number,
  options?: { gracePeriodMs?: number },
): Promise<boolean> {
  const gracePeriodMs = options?.gracePeriodMs ?? 5000;
  const child = activeChildren.get(pid);

  if (!child) {
    // Process not tracked or already exited — try process.kill as fallback
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      return Promise.resolve(false);
    }
    setTimeout(() => {
      try { process.kill(pid, "SIGKILL"); } catch { /* already exited */ }
    }, gracePeriodMs);
    return Promise.resolve(true);
  }

  const result = child.kill("SIGTERM");
  if (!result) {
    return Promise.resolve(false);
  }

  // Schedule escalation to SIGKILL after grace period
  setTimeout(() => {
    try {
      child.kill("SIGKILL");
    } catch {
      // Process already exited — ignore
    }
  }, gracePeriodMs);

  return Promise.resolve(true);
}

// ---------------------------------------------------------------------------
// Arg builder (pure function)
// ---------------------------------------------------------------------------

/**
 * Builds CLI argument array for a given harness and invocation options.
 *
 * This is a pure function with no side-effects, suitable for unit testing the
 * flag mapping logic in isolation.
 *
 * @throws {BabysitterRuntimeError} if `name` is not a known harness.
 */
export function buildHarnessArgs(
  name: string,
  options: HarnessInvokeOptions,
): string[] {
  const spec = HARNESS_CLI_MAP[name];
  if (!spec) {
    throw new BabysitterRuntimeError(
      "UnknownHarnessError",
      `Unknown harness: "${name}". Supported harnesses: ${SUPPORTED_HARNESS_NAMES.join(", ")}`,
      {
        category: ErrorCategory.Validation,
        suggestions: [`Did you mean one of: ${SUPPORTED_HARNESS_NAMES.join(", ")}?`],
        nextSteps: ["Use a supported harness name"],
      },
    );
  }

  const args: string[] = [...(spec.baseArgs ?? [])];

  if ((spec.promptStyle ?? "flag") === "positional") {
    args.push(name === "codex" ? "-" : options.prompt);
  } else {
    args.push("--prompt", options.prompt);
  }

  if (options.model && spec.supportsModel) {
    args.push("--model", options.model);
  }

  if (options.workspace && spec.workspaceFlag) {
    args.push(spec.workspaceFlag, options.workspace);
  }

  // Structured JSON output mode (rpc) — only for harnesses that support it
  if (options.rpc) {
    if (name === "claude-code") {
      args.push("--output-format", "streaming-json");
    }
    // codex already uses JSON events natively — no flag needed
    // other harnesses: rpc flag silently ignored
  }

  return args;
}

// ---------------------------------------------------------------------------
// Invoker
// ---------------------------------------------------------------------------

/** Default timeout for harness invocations (15 minutes). */
const DEFAULT_TIMEOUT_MS = 900_000;

/**
 * Invokes a harness CLI as a child process and returns the result.
 *
 * Steps:
 *   1. Validate that `name` is a known harness.
 *   2. Check that the CLI binary is installed via `checkCliAvailable`.
 *   3. Build args via `buildHarnessArgs`.
 *   4. Spawn via `child_process.execFile`. On Windows, enable shell mode so
 *      PATH-resolved `.cmd` shims (for example npm-installed CLIs) can launch.
 *   5. Capture stdout + stderr, measure wall-clock duration.
 *   6. Return a `HarnessInvokeResult`.
 *
 * @throws {BabysitterRuntimeError} if the harness is unknown or the CLI is
 *   not installed.
 */
export async function invokeHarness(
  name: string,
  options: HarnessInvokeOptions,
): Promise<HarnessInvokeResult> {
  if (name === "internal") {
    const session = createPiSession({
      workspace: options.workspace,
      model: options.model,
      timeout: options.timeout,
      ephemeral: true,
    });
    try {
      const result = await session.prompt(options.prompt, options.timeout);
      return {
        ...result,
        harness: "internal",
      };
    } finally {
      session.dispose();
    }
  }

  const spec = HARNESS_CLI_MAP[name];
  if (!spec) {
    throw new BabysitterRuntimeError(
      "UnknownHarnessError",
      `Unknown harness: "${name}". Supported harnesses: ${SUPPORTED_HARNESS_NAMES.join(", ")}`,
      {
        category: ErrorCategory.Validation,
        suggestions: [`Did you mean one of: ${SUPPORTED_HARNESS_NAMES.join(", ")}?`],
        nextSteps: ["Use a supported harness name"],
      },
    );
  }

  // Verify CLI availability.
  const cliCheck = await checkCliAvailable(spec.cli);
  if (!cliCheck.available) {
    throw new BabysitterRuntimeError(
      "HarnessCliNotInstalledError",
      `Harness CLI "${spec.cli}" is not installed or not found on PATH`,
      {
        category: ErrorCategory.External,
        nextSteps: [
          `Install the "${spec.cli}" CLI and ensure it is on your PATH`,
          `Verify installation by running: ${spec.cli} --version`,
        ],
      },
    );
  }

  const args = buildHarnessArgs(name, options);
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;
  let promptTempDir: string | undefined;
  let promptFilePath: string | undefined;
  if (process.platform === "win32" && name === "codex") {
    promptTempDir = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-codex-"));
    promptFilePath = path.join(promptTempDir, "prompt.txt");
    await fs.writeFile(promptFilePath, options.prompt, "utf8");
  }
  const launch = buildLaunchSpec(name, spec, cliCheck.path, args, promptFilePath);
  const childCwd = name === "codex" ? process.cwd() : options.workspace;

  const startTime = Date.now();

  // GAP-PERF-004: Use streaming path when callbacks are provided
  if (options.streaming && (options.streaming.onStdout || options.streaming.onStderr || options.streaming.onLine)) {
    return invokeHarnessStreaming(name, options, launch, childCwd, timeoutMs, startTime, options.streaming, promptTempDir);
  }

  return new Promise<HarnessInvokeResult>((resolve, reject) => {
    const childEnv = options.env
      ? { ...process.env, ...options.env }
      : process.env;
    const cleanupPromptFile = async (): Promise<void> => {
      if (!promptTempDir) {
        return;
      }
      await fs.rm(promptTempDir, { recursive: true, force: true }).catch(() => {});
    };

    let trackedPid: number | undefined;
    try {
      const child = execFile(
        launch.command,
        launch.args,
        {
          cwd: childCwd,
          timeout: timeoutMs,
          windowsHide: true,
          maxBuffer: 50 * 1024 * 1024, // 50 MiB
          env: childEnv,
          shell: launch.shell,
        },
        (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
          untrackChild(trackedPid);
          void cleanupPromptFile();
          const duration = Date.now() - startTime;
          const stderrStr = String(stderr);
          const output = stderrStr.length > 0
            ? `${String(stdout)}\n${stderrStr}`.trim()
            : String(stdout).trim();

          if (error) {
            const execError = error as NodeJS.ErrnoException & { killed?: boolean; status?: number };
            const killed = execError.killed === true;
            const exitCode = typeof execError.status === "number" ? execError.status : 1;

            resolve({
              success: false,
              output: killed
                ? `Process timed out after ${timeoutMs}ms\n${output}`.trim()
                : output,
              exitCode,
              duration,
              harness: name,
            });
            return;
          }

          resolve({
            success: true,
            output,
            exitCode: 0,
            duration,
            harness: name,
          });
        },
      );
      trackedPid = child.pid;
      trackChild(child);
      if (name === "codex" && process.platform !== "win32" && child.stdin) {
        child.stdin.end(options.prompt);
      }
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

// ---------------------------------------------------------------------------
// GAP-PERF-004: Streaming invoker
// ---------------------------------------------------------------------------

/**
 * Invoke a harness CLI using spawn for real-time streaming output.
 * Collects full output while forwarding chunks to streaming callbacks.
 * @internal
 */
function invokeHarnessStreaming(
  name: string,
  options: HarnessInvokeOptions,
  launch: LaunchSpec,
  childCwd: string | undefined,
  timeoutMs: number,
  startTime: number,
  streaming: StreamingOutputOptions,
  promptTempDir: string | undefined,
): Promise<HarnessInvokeResult> {
  return new Promise<HarnessInvokeResult>((resolve, reject) => {
    const childEnv = options.env
      ? { ...process.env, ...options.env }
      : process.env;

    const cleanupPromptFile = async (): Promise<void> => {
      if (!promptTempDir) return;
      await fs.rm(promptTempDir, { recursive: true, force: true }).catch(() => {});
    };

    let trackedPid: number | undefined;
    try {
      const child = spawn(launch.command, launch.args, {
        cwd: childCwd,
        windowsHide: true,
        env: childEnv,
        shell: launch.shell,
        stdio: ["pipe", "pipe", "pipe"],
      });

      trackedPid = child.pid;
      trackChild(child);

      let streamChunkCount = 0;
      const stdoutBuf: string[] = [];
      const stderrBuf: string[] = [];
      let stdoutLineBuf = "";
      let stderrLineBuf = "";

      // Timeout handling
      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        setTimeout(() => {
          try { child.kill("SIGKILL"); } catch { /* already exited */ }
        }, 5000);
      }, timeoutMs);

      // AbortSignal support
      if (options.signal) {
        if (options.signal.aborted) {
          child.kill("SIGTERM");
        } else {
          options.signal.addEventListener("abort", () => {
            child.kill("SIGTERM");
            setTimeout(() => {
              try { child.kill("SIGKILL"); } catch { /* already exited */ }
            }, 5000);
          }, { once: true });
        }
      }

      child.stdout?.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        stdoutBuf.push(text);
        streamChunkCount++;
        if (streaming.onStdout) streaming.onStdout(text);

        if (streaming.onLine) {
          stdoutLineBuf += text;
          const lines = stdoutLineBuf.split("\n");
          stdoutLineBuf = lines.pop() ?? "";
          for (const line of lines) {
            streaming.onLine(line, "stdout");
          }
        }
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        stderrBuf.push(text);
        streamChunkCount++;
        if (streaming.onStderr) streaming.onStderr(text);

        if (streaming.onLine) {
          stderrLineBuf += text;
          const lines = stderrLineBuf.split("\n");
          stderrLineBuf = lines.pop() ?? "";
          for (const line of lines) {
            streaming.onLine(line, "stderr");
          }
        }
      });

      child.on("close", (code, signal) => {
        clearTimeout(timer);
        untrackChild(trackedPid);
        void cleanupPromptFile();

        // Flush remaining line buffers
        if (streaming.onLine && stdoutLineBuf) streaming.onLine(stdoutLineBuf, "stdout");
        if (streaming.onLine && stderrLineBuf) streaming.onLine(stderrLineBuf, "stderr");

        const duration = Date.now() - startTime;
        const stdoutStr = stdoutBuf.join("");
        const stderrStr = stderrBuf.join("");
        const output = stderrStr.length > 0
          ? `${stdoutStr}\n${stderrStr}`.trim()
          : stdoutStr.trim();

        const killed = signal === "SIGTERM" || signal === "SIGKILL";
        const exitCode = code ?? (killed ? 1 : 0);

        resolve({
          success: exitCode === 0 && !killed,
          output: killed
            ? `Process timed out after ${timeoutMs}ms\n${output}`.trim()
            : output,
          exitCode,
          duration,
          harness: name,
          streamed: true,
          streamChunkCount,
        });
      });

      child.on("error", (err: Error) => {
        clearTimeout(timer);
        untrackChild(trackedPid);
        void cleanupPromptFile();
        reject(
          new BabysitterRuntimeError(
            "HarnessSpawnError",
            `Failed to spawn ${name}: ${err.message}`,
            { category: ErrorCategory.External },
          ),
        );
      });

      // Feed prompt via stdin for codex on non-Windows
      if (name === "codex" && process.platform !== "win32" && child.stdin) {
        child.stdin.end(options.prompt);
      }
    } catch (err: unknown) {
      void cleanupPromptFile();
      reject(
        new BabysitterRuntimeError(
          "HarnessSpawnError",
          `Failed to spawn ${name}: ${err instanceof Error ? err.message : String(err)}`,
          { category: ErrorCategory.External },
        ),
      );
    }
  });
}
