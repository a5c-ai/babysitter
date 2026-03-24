/**
 * Harness invoker module.
 *
 * Provides functions to programmatically invoke harness CLIs (claude, codex,
 * pi, gemini, cursor, opencode) as child processes. Each harness has its own
 * flag mapping; this module abstracts those differences behind a uniform API.
 */

import { execFile } from "node:child_process";
import type { HarnessInvokeOptions, HarnessInvokeResult } from "./types";
import { checkCliAvailable } from "./discovery";
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
}

/**
 * Mapping from harness identifier to CLI command and flag details.
 */
export const HARNESS_CLI_MAP: Readonly<Record<string, HarnessCliSpec>> = {
  "claude-code": { cli: "claude", workspaceFlag: "--workspace", supportsModel: true },
  codex: { cli: "codex", workspaceFlag: "--cwd", supportsModel: true },
  pi: { cli: "pi", workspaceFlag: "--workspace", supportsModel: true },
  "oh-my-pi": { cli: "omp", workspaceFlag: "--workspace", supportsModel: true },
  "gemini-cli": { cli: "gemini", supportsModel: true },
  cursor: { cli: "cursor", supportsModel: false },
  opencode: { cli: "opencode", supportsModel: false },
} as const;

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
      `Unknown harness: "${name}". Supported harnesses: ${Object.keys(HARNESS_CLI_MAP).join(", ")}`,
      {
        category: ErrorCategory.Validation,
        suggestions: [`Did you mean one of: ${Object.keys(HARNESS_CLI_MAP).join(", ")}?`],
        nextSteps: ["Use a supported harness name"],
      },
    );
  }

  const args: string[] = ["--prompt", options.prompt];

  if (options.model && spec.supportsModel) {
    args.push("--model", options.model);
  }

  if (options.workspace && spec.workspaceFlag) {
    args.push(spec.workspaceFlag, options.workspace);
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
 *   4. Spawn via `child_process.execFile` (never shell=true).
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
  const spec = HARNESS_CLI_MAP[name];
  if (!spec) {
    throw new BabysitterRuntimeError(
      "UnknownHarnessError",
      `Unknown harness: "${name}". Supported harnesses: ${Object.keys(HARNESS_CLI_MAP).join(", ")}`,
      {
        category: ErrorCategory.Validation,
        suggestions: [`Did you mean one of: ${Object.keys(HARNESS_CLI_MAP).join(", ")}?`],
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

  const startTime = Date.now();

  return new Promise<HarnessInvokeResult>((resolve, reject) => {
    const childEnv = options.env
      ? { ...process.env, ...options.env }
      : process.env;

    try {
      execFile(
        spec.cli,
        args,
        {
          timeout: timeoutMs,
          windowsHide: true,
          maxBuffer: 50 * 1024 * 1024, // 50 MiB
          env: childEnv,
        },
        (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
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
    } catch (err: unknown) {
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
