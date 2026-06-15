/**
 * Default in-platform OrchestrationProvider implementation.
 *
 * Mirrors the BabysitterOrchestrationProvider that lives in the genty plugin
 * (plugins/babysitter-unified/per-harness/genty/src/provider.ts). It is
 * registered as a default in createOrchestrationRegistry() so that genty CLI
 * runtime, API commands, and tests have a working orchestration provider
 * without requiring the plugin's register.ts to be loaded. See #936.
 *
 * Depends only on the babysitter-sdk runtime and node built-ins — no plugin
 * dependency — so it is safe to host inside the platform package.
 */

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type {
  OrchestrationProvider,
  RunHandle,
  CreateRunOptions,
  IterationResult,
  EffectResult,
  RunEvent,
  PendingEffect,
} from "./interfaces";

// The babysitter-sdk runtime is loaded lazily (sync require, on first method
// call) so that merely registering this default provider — done in
// createOrchestrationRegistry, which is imported very widely via global.ts —
// does NOT eagerly pull the heavy SDK and its transitive atlas index into every
// module/test worker (which caused OOM in CI test workers). See #936.
type SdkRuntime = typeof import("@a5c-ai/babysitter-sdk");
let _sdk: SdkRuntime | undefined;
function sdk(): SdkRuntime {
  if (!_sdk) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _sdk = require("@a5c-ai/babysitter-sdk") as SdkRuntime;
  }
  return _sdk;
}

function resolveBabysitterBin(): string {
  try {
    return require.resolve("@a5c-ai/babysitter-sdk/dist/cli/main.js");
  } catch {
    return "babysitter";
  }
}

function execBabysitterCli(args: string[], cwd?: string): string {
  const bin = resolveBabysitterBin();
  const isNodeScript = bin.endsWith(".js");
  const command = isNodeScript ? process.execPath : bin;
  const fullArgs = isNodeScript ? [bin, ...args] : args;
  return execFileSync(command, fullArgs, {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
    env: { ...process.env, FORCE_COLOR: "0" },
  });
}

/**
 * Run a babysitter CLI command tolerating a controlled non-zero exit. Returns
 * the captured stdout regardless of exit code, and the exit code, so callers
 * can distinguish a genuine spawn/command failure from an expected non-zero
 * status (e.g. `task:post --status error` returns exit 1 by design once it has
 * successfully committed the error result). See #936.
 */
function execBabysitterCliTolerant(args: string[], cwd?: string): { stdout: string; code: number } {
  const bin = resolveBabysitterBin();
  const isNodeScript = bin.endsWith(".js");
  const command = isNodeScript ? process.execPath : bin;
  const fullArgs = isNodeScript ? [bin, ...args] : args;
  try {
    const stdout = execFileSync(command, fullArgs, {
      cwd,
      encoding: "utf8",
      timeout: 120_000,
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    return { stdout, code: 0 };
  } catch (err) {
    const e = err as { status?: number; stdout?: string | Buffer; stderr?: string | Buffer };
    if (typeof e.status === "number") {
      const stdout = typeof e.stdout === "string" ? e.stdout : e.stdout?.toString("utf8") ?? "";
      return { stdout, code: e.status };
    }
    throw err;
  }
}

/**
 * Serialize an arbitrary effect error into a structured `{ name, message, stack }`
 * payload suitable for `task:post --error <file>` (which JSON-parses the file).
 * See #936.
 */
function serializeEffectError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return { name: error.name || "Error", message: error.message, ...(error.stack ? { stack: error.stack } : {}) };
  }
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message = typeof record.message === "string" ? record.message : JSON.stringify(error);
    const name = typeof record.name === "string" ? record.name : "Error";
    return { name, message };
  }
  return { name: "Error", message: String(error) };
}

/**
 * Parse the committed status from `task:post --json` output. Returns the
 * `status` field ("ok" | "error") when the command emitted a parseable result,
 * or undefined when it did not (a genuine failure). See #936.
 */
function parsePostStatus(stdout: string): string | undefined {
  const trimmed = stdout.trim();
  if (!trimmed) return undefined;
  // The JSON line may be preceded by warnings; scan lines for a JSON object.
  for (const line of trimmed.split(/\r?\n/).reverse()) {
    const candidate = line.trim();
    if (!candidate.startsWith("{")) continue;
    try {
      const parsed = JSON.parse(candidate) as { status?: unknown };
      if (typeof parsed.status === "string") return parsed.status;
    } catch {
      // Not the JSON line; keep scanning.
    }
  }
  return undefined;
}

export class DefaultOrchestrationProvider implements OrchestrationProvider {
  readonly name = "babysitter";

  async createRun(opts: CreateRunOptions): Promise<RunHandle> {
    const { resolveRunsDir, createRun } = sdk();
    const runsDir = opts.runsDir ?? resolveRunsDir();
    // Split "path#exportName" on the LAST '#' so directory paths containing '#'
    // (e.g. /a/my#project/proc.js#process) keep their '#' in the import path.
    const lastHash = opts.entrypoint.lastIndexOf("#");
    const importPath = lastHash >= 0 ? opts.entrypoint.slice(0, lastHash) : opts.entrypoint;
    const exportName = lastHash >= 0 ? opts.entrypoint.slice(lastHash + 1) : undefined;
    const result = await createRun({
      runsDir,
      harness: opts.harness,
      process: {
        processId: opts.processId,
        importPath,
        exportName,
      },
      prompt: opts.prompt,
      inputs: opts.inputs,
    });

    return {
      runId: result.runId,
      runDir: result.runDir,
      processId: opts.processId,
      status: "pending",
    };
  }

  async iterateRun(handle: RunHandle, iteration?: number): Promise<IterationResult> {
    // CLI signature: run:iterate <runDir> [--iteration <n>] [--json]
    const args = ["run:iterate", handle.runDir, "--json"];
    if (iteration !== undefined) {
      args.push("--iteration", String(iteration));
    }
    const output = execBabysitterCli(args);
    const parsed = JSON.parse(output) as {
      iteration?: number;
      status?: string;
      action?: string;
      reason?: string;
      pendingEffects?: PendingEffect[];
      completionProof?: string;
    };
    return {
      iteration: parsed.iteration ?? iteration ?? 0,
      status: (parsed.status as IterationResult["status"]) ?? "none",
      action: parsed.action ?? "",
      reason: parsed.reason ?? "",
      pendingEffects: parsed.pendingEffects ?? [],
      completionProof: parsed.completionProof,
    };
  }

  async postEffectResult(handle: RunHandle, effectId: string, result: EffectResult): Promise<void> {
    // Surface a recognizable "Unknown effectId" error (mapped to UNKNOWN_EFFECT
    // by the API layer) instead of an opaque CLI failure when the effect's task
    // definition does not exist.
    const taskJson = path.join(handle.runDir, "tasks", effectId, "task.json");
    if (!fs.existsSync(taskJson)) {
      throw new Error(`Unknown effectId: ${effectId}`);
    }
    // CLI signature: task:post <runDir> <effectId> --status <ok|error>
    //   ok    → --value-inline <json>
    //   error → --error <file>
    const args = ["task:post", handle.runDir, effectId, "--status", result.status, "--json"];
    let errorFile: string | undefined;
    if (result.status === "ok") {
      args.push("--value-inline", JSON.stringify(result.value ?? null));
    } else if (result.error !== undefined) {
      errorFile = path.join(
        os.tmpdir(),
        `genty-effect-error-${effectId}-${Date.now()}.json`,
      );
      // #936: the CLI `task:post --error <file>` JSON-parses this file. Writing
      // a bare String(error) (e.g. "Error: Effect failed") produced a cryptic
      // non-JSON SyntaxError downstream that spun the orchestration loop. Always
      // emit a structured JSON error payload so the real failure surfaces and
      // the run can reach a terminal failure promptly.
      fs.writeFileSync(errorFile, JSON.stringify(serializeEffectError(result.error)));
      args.push("--error", errorFile);
    }
    try {
      if (result.status === "error") {
        // #936: `task:post --status error` returns exit 1 BY DESIGN once it has
        // committed the error result. Tolerate that controlled exit code and
        // confirm the commit via the emitted JSON — otherwise execFileSync would
        // throw on every error post, which the in-process loop swallowed and
        // spun on. A genuine spawn/command failure (no parseable JSON committed)
        // still surfaces as a thrown error.
        const { stdout, code } = execBabysitterCliTolerant(args);
        const committed = parsePostStatus(stdout);
        if (committed !== "error" && code !== 0) {
          throw new Error(
            `task:post --status error failed for effect ${effectId} (exit ${code}): ${stdout.trim() || "no output"}`,
          );
        }
      } else {
        execBabysitterCli(args);
      }
    } finally {
      if (errorFile) {
        try { fs.unlinkSync(errorFile); } catch { /* best effort */ }
      }
    }
  }

  async getRunStatus(handle: RunHandle): Promise<RunHandle> {
    const { readRunMetadata, loadJournal } = sdk();
    const metadata = await readRunMetadata(handle.runDir);
    const events = await loadJournal(handle.runDir);
    let status: RunHandle["status"] = "pending";
    for (const event of events) {
      if (event.type === "RUN_COMPLETED") status = "completed";
      else if (event.type === "RUN_FAILED") status = "failed";
      else if (event.type === "EFFECT_REQUESTED") status = "waiting";
      else if (event.type === "ITERATION_EXECUTED") status = "running";
    }
    return {
      runId: handle.runId,
      runDir: handle.runDir,
      processId: metadata.processId ?? handle.processId,
      status,
    };
  }

  async getRunEvents(handle: RunHandle, opts?: { limit?: number; reverse?: boolean }): Promise<RunEvent[]> {
    const { loadJournal } = sdk();
    const events = await loadJournal(handle.runDir);
    let mapped: RunEvent[] = events.map((e) => ({
      type: e.type,
      timestamp: e.recordedAt,
      data: e.data,
    }));
    if (opts?.reverse) {
      mapped = mapped.reverse();
    }
    if (opts?.limit !== undefined && opts.limit > 0) {
      mapped = mapped.slice(0, opts.limit);
    }
    return mapped;
  }

  async getPendingEffects(handle: RunHandle): Promise<PendingEffect[]> {
    // CLI signature: task:list <runDir> [--pending] [--json]
    const args = ["task:list", handle.runDir, "--pending", "--json"];
    const output = execBabysitterCli(args);
    const parsed = JSON.parse(output) as PendingEffect[] | { effects: PendingEffect[] };
    return Array.isArray(parsed) ? parsed : parsed.effects ?? [];
  }

  resolveRunsDir(opts?: { cwd?: string }): string {
    return sdk().resolveRunsDir({ cwd: opts?.cwd });
  }
}

export function createDefaultOrchestrationProvider(): OrchestrationProvider {
  return new DefaultOrchestrationProvider();
}
