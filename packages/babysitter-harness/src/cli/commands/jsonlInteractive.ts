/**
 * GAP-JSON-004: Streaming JSONL CLI Mode (stdin/stdout).
 *
 * Reads JSONL requests from stdin, dispatches to API functions, writes
 * JSONL responses to stdout. Enables programmatic control from any
 * language via process pipes — no HTTP, no WebSocket.
 */

import { createInterface } from "node:readline";
import {
  apiCreateRun,
  apiIterate,
  apiCommitEffect,
  apiRunStatus,
  apiRunEvents,
} from "../../api/runs";
import {
  apiListEffects,
  apiShowEffect,
  apiCancelEffect,
  apiBatchCommitEffects,
} from "../../api/effects";
import {
  apiListBreakpoints,
  apiShowBreakpoint,
  apiRespondToBreakpoint,
  apiListAutoApprovalRules,
  apiAddAutoApprovalRule,
  apiRemoveAutoApprovalRule,
  apiEvaluateAutoApproval,
} from "../../api/breakpoints";
import {
  apiSubscribeRunEvents,
  apiUnsubscribeRunEvents,
  closeAllSubscriptions,
} from "../../api/eventStream";
import type { ApiResult } from "../../api/runs";

// ── Types ──────────────────────────────────────────────────────────────────

interface ParsedRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
}

interface ParseError {
  id: null;
  error: { code: string; message: string };
}

interface StreamOptions {
  stdin: NodeJS.ReadableStream;
  stdout: NodeJS.WritableStream;
}

// ── Supported methods ──────────────────────────────────────────────────────

export const SUPPORTED_METHODS = [
  "run.create",
  "run.iterate",
  "run.status",
  "run.events",
  "effect.commit",
  "effect.list",
  "effect.show",
  "effect.cancel",
  "effect.batchCommit",
  "breakpoint.list",
  "breakpoint.show",
  "breakpoint.respond",
  "breakpoint.listRules",
  "breakpoint.addRule",
  "breakpoint.removeRule",
  "breakpoint.evaluateAutoApproval",
  "event.subscribe",
  "event.unsubscribe",
  "shutdown",
] as const;

// ── Pure functions ─────────────────────────────────────────────────────────

export function parseJsonlRequest(line: string): ParsedRequest | ParseError {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return {
      id: null,
      error: { code: "INVALID_REQUEST", message: "Malformed JSON" },
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      id: null,
      error: { code: "INVALID_REQUEST", message: "Request must be a JSON object" },
    };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.id === undefined || obj.id === null) {
    return {
      id: null,
      error: { code: "INVALID_REQUEST", message: "Missing required field: id" },
    };
  }

  if (typeof obj.method !== "string" || !obj.method) {
    return {
      id: null,
      error: { code: "INVALID_REQUEST", message: "Missing required field: method" },
    };
  }

  return {
    id: String(obj.id),
    method: obj.method,
    params: (typeof obj.params === "object" && obj.params !== null && !Array.isArray(obj.params))
      ? (obj.params as Record<string, unknown>)
      : {},
  };
}

export function formatJsonlResponse(id: string | null, result: ApiResult<unknown>): string {
  try {
    if (result.ok) {
      return JSON.stringify({ id, result: result.data });
    } else {
      return JSON.stringify({ id, error: result.error });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return JSON.stringify({ id, error: { code: "SERIALIZATION_ERROR", message: msg } });
  }
}

// ── Dispatch table ─────────────────────────────────────────────────────────

export async function dispatchJsonlMethod(
  method: string,
  params: Record<string, unknown>,
  defaults: { runsDir: string },
): Promise<ApiResult<unknown>> {
  try {
    const p = params;
    const runsDir = (typeof p.runsDir === "string" ? p.runsDir : defaults.runsDir);

    switch (method) {
      // ── Run lifecycle ──
      case "run.create":
        return apiCreateRun({
          processId: p.processId as string,
          entrypoint: p.entrypoint as string,
          runsDir,
          inputs: p.inputs as Record<string, unknown> | undefined,
          prompt: p.prompt as string | undefined,
        });

      case "run.iterate":
        return apiIterate({ runDir: p.runDir as string });

      case "run.status":
        return apiRunStatus({ runId: p.runId as string, runsDir });

      case "run.events":
        return apiRunEvents({
          runId: p.runId as string,
          runsDir,
          limit: typeof p.limit === "number" ? p.limit : undefined,
          filterType: typeof p.filterType === "string" ? p.filterType : undefined,
        });

      // ── Effect dispatch ──
      case "effect.commit":
        return apiCommitEffect({
          runDir: p.runDir as string,
          effectId: p.effectId as string,
          result: p.result as { status: "ok" | "error"; value?: unknown; error?: string },
        });

      case "effect.list":
        return apiListEffects({
          runDir: p.runDir as string,
          filter: p.filter as { kind?: string | string[]; status?: "requested" | "resolved" | "cancelled" } | undefined,
        });

      case "effect.show":
        return apiShowEffect({
          runDir: p.runDir as string,
          effectId: p.effectId as string,
        });

      case "effect.cancel":
        return apiCancelEffect({
          runDir: p.runDir as string,
          effectId: p.effectId as string,
          reason: p.reason as string | undefined,
        });

      case "effect.batchCommit":
        return apiBatchCommitEffects({
          runDir: p.runDir as string,
          effects: p.effects as Array<{ effectId: string; result: { status: "ok" | "error"; value?: unknown; error?: string } }>,
        });

      // ── Breakpoint interaction ──
      case "breakpoint.list":
        return apiListBreakpoints({ runDir: p.runDir as string });

      case "breakpoint.show":
        return apiShowBreakpoint({
          runDir: p.runDir as string,
          effectId: p.effectId as string,
        });

      case "breakpoint.respond":
        return apiRespondToBreakpoint({
          runDir: p.runDir as string,
          effectId: p.effectId as string,
          approved: p.approved as boolean,
          response: p.response as string | undefined,
          feedback: p.feedback as string | undefined,
          option: p.option as string | undefined,
          respondedBy: p.respondedBy as string | undefined,
        });

      case "breakpoint.listRules":
        return apiListAutoApprovalRules({ rulesPath: p.rulesPath as string | undefined });

      case "breakpoint.addRule":
        return apiAddAutoApprovalRule({
          pattern: p.pattern as string,
          action: p.action as "auto-approve" | "never-auto-approve",
          createdBy: p.createdBy as string,
          id: p.id as string | undefined,
          source: p.source as string | undefined,
          note: p.note as string | undefined,
          rulesPath: p.rulesPath as string | undefined,
        });

      case "breakpoint.removeRule":
        return apiRemoveAutoApprovalRule({
          ruleId: p.ruleId as string,
          rulesPath: p.rulesPath as string | undefined,
        });

      case "breakpoint.evaluateAutoApproval":
        return apiEvaluateAutoApproval({
          breakpointId: p.breakpointId as string,
          tags: p.tags as string[] | undefined,
          expert: p.expert as string | undefined,
          rulesPath: p.rulesPath as string | undefined,
          autoApproveAfterN: p.autoApproveAfterN as number | undefined,
          consecutiveApprovals: p.consecutiveApprovals as number | undefined,
        });

      // ── Event streaming ──
      case "event.subscribe": {
        const subResult = await apiSubscribeRunEvents({
          runId: p.runId as string,
          runsDir,
          afterSeq: typeof p.afterSeq === "number" ? p.afterSeq : undefined,
          pollIntervalMs: typeof p.pollIntervalMs === "number" ? p.pollIntervalMs : undefined,
          onEvent: () => {
            // Events are consumed via polling; JSONL doesn't push events
          },
        });
        return subResult;
      }

      case "event.unsubscribe":
        return apiUnsubscribeRunEvents({
          subscriptionId: p.subscriptionId as string,
        });

      // ── Control ──
      case "shutdown":
        closeAllSubscriptions();
        return { ok: true, data: { ok: true } };

      default:
        return {
          ok: false,
          error: { code: "UNKNOWN_METHOD", message: `Unknown method: ${method}` },
        };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: msg } };
  }
}

// ── Main handler ───────────────────────────────────────────────────────────

const MAX_PENDING_QUEUE = 100;

export async function handleJsonlInteractive(
  args: { runsDir: string },
  streamOpts?: StreamOptions,
): Promise<number> {
  const stdin = streamOpts?.stdin ?? process.stdin;
  const stdout = streamOpts?.stdout ?? process.stdout;

  const writeLine = (line: string): boolean => {
    return (stdout as NodeJS.WritableStream & { write: (s: string) => boolean }).write(line + "\n");
  };

  // Emit ready notification
  writeLine(JSON.stringify({
    jsonl: "ready",
    version: 1,
    methods: [...SUPPORTED_METHODS],
  }));

  const rl = createInterface({
    input: stdin as NodeJS.ReadableStream,
    crlfDelay: Infinity,
  });

  let shutdownRequested = false;
  let activeCount = 0;
  const pending = new Set<Promise<void>>();

  const processLine = async (line: string): Promise<void> => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const parsed = parseJsonlRequest(trimmed);

    if ("error" in parsed) {
      writeLine(formatJsonlResponse(parsed.id, {
        ok: false,
        error: parsed.error,
      }));
      return;
    }

    try {
      const result = await dispatchJsonlMethod(parsed.method, parsed.params, {
        runsDir: args.runsDir,
      });

      writeLine(formatJsonlResponse(parsed.id, result));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      writeLine(formatJsonlResponse(parsed.id, {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: msg },
      }));
    }

    if (parsed.method === "shutdown") {
      shutdownRequested = true;
      rl.close();
    }
  };

  return new Promise<number>((resolve) => {
    rl.on("line", (line) => {
      if (shutdownRequested) return;

      activeCount++;
      const promise = processLine(line).finally(() => {
        activeCount--;
        pending.delete(promise);
        if (activeCount < MAX_PENDING_QUEUE) {
          rl.resume();
        }
      });
      pending.add(promise);

      // Backpressure: pause stdin when too many pending
      if (activeCount >= MAX_PENDING_QUEUE) {
        rl.pause();
      }
    });

    rl.on("close", () => {
      // Wait for all pending requests to complete
      void Promise.allSettled([...pending]).then(() => {
        resolve(0);
      });
    });
  });
}
