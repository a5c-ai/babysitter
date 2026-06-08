/**
 * BabysitterOrchestrationProvider — implements the OrchestrationProvider interface
 * from @a5c-ai/genty-platform/orchestration using the babysitter-sdk runtime.
 */

import { execFileSync } from "node:child_process";
import type {
  OrchestrationProvider,
  RunHandle,
  CreateRunOptions,
  IterationResult,
  EffectResult,
  RunEvent,
  PendingEffect,
} from "@a5c-ai/genty-platform/orchestration";
import {
  resolveRunsDir,
  createRun,
  loadJournal,
  readRunMetadata,
} from "@a5c-ai/babysitter-sdk";

function resolveBabysitterBin(): string {
  // The babysitter binary is provided by the @a5c-ai/babysitter-sdk package
  try {
    const resolved = require.resolve("@a5c-ai/babysitter-sdk/dist/cli/main.js");
    return resolved;
  } catch {
    return "babysitter";
  }
}

function execBabysitterCli(args: string[], cwd?: string): string {
  const bin = resolveBabysitterBin();
  const isNodeScript = bin.endsWith(".js");
  const command = isNodeScript ? process.execPath : bin;
  const fullArgs = isNodeScript ? [bin, ...args] : args;

  const result = execFileSync(command, fullArgs, {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  return result;
}

export class BabysitterOrchestrationProvider implements OrchestrationProvider {
  readonly name = "babysitter";

  async createRun(opts: CreateRunOptions): Promise<RunHandle> {
    const runsDir = opts.runsDir ?? resolveRunsDir();
    const result = await createRun({
      runsDir,
      harness: opts.harness,
      process: {
        processId: opts.processId,
        importPath: opts.entrypoint,
        exportName: undefined,
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
    const args = ["run:iterate", "--run-dir", handle.runDir];
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
    const args = [
      "task:post",
      "--run-dir", handle.runDir,
      "--effect-id", effectId,
      "--status", result.status,
    ];
    if (result.value !== undefined) {
      args.push("--value", JSON.stringify(result.value));
    }
    if (result.error !== undefined) {
      args.push("--error", JSON.stringify(result.error));
    }
    execBabysitterCli(args);
  }

  async getRunStatus(handle: RunHandle): Promise<RunHandle> {
    const metadata = await readRunMetadata(handle.runDir);
    const events = await loadJournal(handle.runDir);

    // Derive status from journal events
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
    const args = ["task:list", "--run-dir", handle.runDir, "--pending", "--json"];
    const output = execBabysitterCli(args);
    const parsed = JSON.parse(output) as PendingEffect[] | { effects: PendingEffect[] };
    return Array.isArray(parsed) ? parsed : parsed.effects ?? [];
  }

  resolveRunsDir(opts?: { cwd?: string }): string {
    return resolveRunsDir({ cwd: opts?.cwd });
  }
}
