/**
 * Harness invoker module.
 *
 * Provides functions to programmatically invoke harness CLIs (claude, codex,
 * pi, gemini, cursor, opencode) as child processes. Each harness has its own
 * flag mapping; this module abstracts those differences behind a uniform API.
 */

import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
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
  cursor: { cli: "cursor", supportsModel: false, promptStyle: "flag" },
  opencode: { cli: "opencode", supportsModel: false, promptStyle: "flag" },
} as const;

function quotePowerShellArg(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function buildLaunchSpec(
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
