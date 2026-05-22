/**
 * Harness invoker module.
 *
 * External harnesses are routed through agent-mux exclusively.
 * Only Pi and the "agent-core" programmatic harness use direct invocation
 * (Pi via CLI subprocess, agent-core in-process).
 */

import { execFile } from "node:child_process";
import {
  BabysitterRuntimeError,
  checkCliAvailable,
  ErrorCategory,
} from "@a5c-ai/babysitter-sdk";
import type { HarnessInvokeOptions, HarnessInvokeResult } from "./types";
import { createAgentCoreSession } from "@a5c-ai/agent-core";
import {
  buildLaunchSpec,
  type HarnessCliSpec,
} from "./invoker/launch";
import {
  cancelRunningProcess,
  trackChild,
  untrackChild,
} from "./invoker/processControl";
import { getAmuxClient } from "./amux/amuxClientFactory";
import { hasAmuxAdapter } from "./amux/amuxHarnessMap";
import { invokeViaAgentMux } from "./amux/amuxBridge";
import { normalizeBuiltInHarnessName } from "./builtInHarness";

// ---------------------------------------------------------------------------
// CLI mapping — Pi only (external harnesses use agent-mux adapters)
// ---------------------------------------------------------------------------

/**
 * Mapping from harness identifier to CLI command and flag details.
 *
 * Only Pi retains a direct CLI mapping. All other (external) harnesses are
 * routed through agent-mux adapters via {@link invokeViaAgentMux}.
 */
export const HARNESS_CLI_MAP: Readonly<Record<string, HarnessCliSpec>> = {
  pi: { cli: "pi", workspaceFlag: "--workspace", supportsModel: true, promptStyle: "flag" },
} as const;

const PROGRAMMATIC_ONLY_HARNESSES = ["agent-core"] as const;
const SUPPORTED_HARNESS_NAMES = [
  ...PROGRAMMATIC_ONLY_HARNESSES,
  ...Object.keys(HARNESS_CLI_MAP),
] as const;
export { buildLaunchSpec, cancelRunningProcess };

// ---------------------------------------------------------------------------
// Arg builder (pure function) — Pi / direct-invoke path only
// ---------------------------------------------------------------------------

/**
 * Builds CLI argument array for a given harness and invocation options.
 *
 * This is a pure function with no side-effects, suitable for unit testing the
 * flag mapping logic in isolation. Only used for harnesses in
 * {@link HARNESS_CLI_MAP} (currently Pi).
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
    args.push(options.prompt);
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
 * Invokes a harness CLI and returns the result.
 *
 * The function first attempts to route through agent-mux (if @agent-mux/core
 * is installed and the harness has an amux adapter mapping). When agent-mux
 * is unavailable, it falls back to direct child-process invocation.
 *
 * Pi / agent-core harnesses always use agent-core directly and are never
 * routed through agent-mux.
 *
 * @throws {BabysitterRuntimeError} if the harness is unknown or the CLI is
 *   not installed.
 */
export async function invokeHarness(
  name: string,
  options: HarnessInvokeOptions,
): Promise<HarnessInvokeResult> {
  const harnessName = normalizeBuiltInHarnessName(name);
  // Pi / agent-core always use agent-core directly
  if (harnessName === "pi" || harnessName === "agent-core") {
    return invokeHarnessDirect(harnessName, options);
  }

  // External harnesses go through agent-mux
  if (!hasAmuxAdapter(harnessName)) {
    throw new BabysitterRuntimeError(
      "UnknownHarnessError",
      `No agent-mux adapter for harness "${name}". External harnesses must have an agent-mux mapping.`,
      { category: ErrorCategory.Configuration },
    );
  }

  const amuxClient = await getAmuxClient();
  return invokeViaAgentMux(amuxClient, harnessName, options);
}

/**
 * Direct child-process invocation for Pi and agent-core harnesses.
 *
 * "agent-core" uses agent-core (in-process). Pi uses CLI subprocess via
 * `child_process.execFile`. External harnesses should never reach this
 * function -- they are routed through agent-mux in {@link invokeHarness}.
 *
 * @throws {BabysitterRuntimeError} if the harness is unknown or the CLI is
 *   not installed.
 */
async function invokeHarnessDirect(
  name: string,
  options: HarnessInvokeOptions,
): Promise<HarnessInvokeResult> {
  if (name === "agent-core") {
    const session = createAgentCoreSession({
      workspace: options.workspace,
      model: options.model,
      timeout: options.timeout,
      ephemeral: true,
    });
    try {
      const result = await session.prompt(options.prompt, options.timeout);
      return {
        ...result,
        harness: "agent-core",
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
  const launch = buildLaunchSpec(name, spec, cliCheck.path, args);

  const startTime = Date.now();

  return new Promise<HarnessInvokeResult>((resolve, reject) => {
    const childEnv = options.env
      ? { ...process.env, ...options.env }
      : process.env;

    let trackedPid: number | undefined;
    try {
      const child = execFile(
        launch.command,
        launch.args,
        {
          cwd: options.workspace,
          timeout: timeoutMs,
          windowsHide: true,
          maxBuffer: 50 * 1024 * 1024, // 50 MiB
          env: childEnv,
          shell: launch.shell,
        },
        (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
          untrackChild(trackedPid);
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
