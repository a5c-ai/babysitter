import * as path from "node:path";
import {
  detectCallerHarness,
  loadCompressionConfig,
  densityFilterText,
  estimateTokens,
  type CompressionConfig,
} from "@a5c-ai/babysitter-sdk";
import type { HarnessDiscoveryResult } from "../../types";
import type { HarnessPromptContext } from "./prompts";
import type { OutputMode, ProgressPayload } from "./utils";

export const DIM = "\x1b[2m";
export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const CYAN = "\x1b[36m";
export const GREEN = "\x1b[32m";
export const YELLOW = "\x1b[33m";
export const RED = "\x1b[31m";
export const MAGENTA = "\x1b[35m";
export const VERBOSE_LOG_LIMIT = 4_000;
export const PROCESS_LIBRARY_READ_MAX_CHARS = 24_000;
export const PROCESS_LIBRARY_SEARCH_DEFAULT_LIMIT = 12;

/**
 * Harness selection priority. Pi / built-in programmatic harnesses are preferred;
 * external harnesses are discovered dynamically via agent-mux.
 */
const HARNESS_PRIORITY: readonly string[] = [
  "agent-core",
  "oh-my-pi",
  "pi",
] as const;

export function resolveOutputMode(json: boolean, outputMode?: OutputMode): OutputMode {
  if (outputMode) return outputMode;
  return json ? "json" : "cli";
}

/**
 * Check whether the given output mode is the amux-events JSONL protocol.
 */
export function isAmuxEventsMode(outputMode?: OutputMode): boolean {
  return outputMode === "amux-events";
}

export function truncateForVerboseLog(text: string, maxChars: number = VERBOSE_LOG_LIMIT): string {
  const normalized = text.replace(/\r\n/g, "\n");
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, maxChars)}\n... [truncated ${normalized.length - maxChars} chars]`;
}

export function stringifyForVerboseLog(value: unknown, maxChars: number = VERBOSE_LOG_LIMIT): string {
  try {
    const raw = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    return truncateForVerboseLog(raw, maxChars);
  } catch {
    return truncateForVerboseLog(String(value), maxChars);
  }
}

export function writeVerboseLine(enabled: boolean, json: boolean, message: string, outputMode?: OutputMode): void {
  const mode = resolveOutputMode(json, outputMode);
  if (mode === "cli" && enabled) {
    process.stderr.write(`${DIM}${message}${RESET}\n`);
  }
}

export function writeVerboseBlock(
  enabled: boolean,
  json: boolean,
  label: string,
  value: unknown,
  maxChars: number = VERBOSE_LOG_LIMIT,
  outputMode?: OutputMode,
): void {
  const mode = resolveOutputMode(json, outputMode);
  if (mode !== "cli" || !enabled) {
    return;
  }
  process.stderr.write(
    `${DIM}[${label}]${RESET}\n${DIM}${stringifyForVerboseLog(value, maxChars)}${RESET}\n`,
  );
}

export function emitProgress(
  payload: ProgressPayload,
  json: boolean,
  verbose: boolean,
  outputMode?: OutputMode,
): void {
  const mode = resolveOutputMode(json, outputMode);
  if (mode === "tui") return;

  // amux-events mode: translate progress payloads to agent-mux JSONL events
  if (mode === "amux-events") {
    emitProgressAsAmuxEvent(payload);
    return;
  }

  if (mode === "json") {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  switch (payload.phase) {
    case "1":
      if (payload.status === "skipped") {
        process.stderr.write(`${DIM}PhasePlanProcess skipped (--process provided)${RESET}\n`);
      } else if (payload.status === "started") {
        process.stderr.write(`\n${BOLD}PhasePlanProcess${RESET} ${DIM}Process planning via ${payload.harness}...${RESET}\n`);
      } else if (payload.status === "completed") {
        process.stderr.write(`${GREEN}PhasePlanProcess complete${RESET} ${DIM}${payload.processPath}${RESET}\n`);
      } else if (payload.status === "failed") {
        process.stderr.write(`${RED}PhasePlanProcess failed:${RESET} ${payload.error}\n`);
      } else if (payload.status === "intent") {
        process.stderr.write(`${DIM}PhaseUnderstandIntent: ${payload.answer}${RESET}\n`);
      } else if (payload.status === "planning") {
        process.stderr.write(`${DIM}PhasePlanProcess: ${payload.answer}${RESET}\n`);
      } else if (payload.status === "interview") {
        process.stderr.write(`${DIM}Interview answers: ${payload.answer}${RESET}\n`);
      }
      break;
    case "2":
      if (payload.status === "started") {
        process.stderr.write(`\n${BOLD}PhaseOrchestration${RESET} ${DIM}Bound orchestration loop${RESET}\n`);
      } else if (payload.status === "run-created") {
        process.stderr.write(`${GREEN}Run created${RESET} runId=${CYAN}${payload.runId}${RESET}\n`);
        if (verbose) process.stderr.write(`  ${DIM}runDir: ${payload.runDir}${RESET}\n`);
      } else if (payload.status === "bound") {
        if (payload.error) {
          process.stderr.write(`${YELLOW}Session binding warning:${RESET} ${payload.error}\n`);
        } else {
          process.stderr.write(`${DIM}session bound via ${payload.harness}: ${payload.sessionId}${RESET}\n`);
        }
      } else if (payload.status === "iteration-start") {
        const elapsed = payload.elapsedMs != null ? ` [${formatElapsed(payload.elapsedMs)}]` : "";
        process.stderr.write(`\n${DIM}-- iteration ${payload.iteration} starting...${elapsed} --${RESET}\n`);
      } else if (payload.status === "iteration") {
        process.stderr.write(`\n${DIM}-- iteration ${payload.iteration} --${RESET} status=${payload.runStatus} pending=${payload.pendingEffects}\n`);
      } else if (payload.status === "effect-start") {
        const label = payload.effectTitle ?? payload.effectId ?? "unknown";
        const via = payload.effectHarness ? ` ${DIM}via ${payload.effectHarness}${RESET}` : "";
        process.stderr.write(`  ${CYAN}▸${RESET} ${MAGENTA}${payload.effectKind}${RESET} ${label}${via}...\n`);
      } else if (payload.status === "effect") {
        const icon = payload.effectStatus === "ok" ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
        const elapsed = payload.elapsedMs != null ? ` ${DIM}${formatElapsed(payload.elapsedMs)}${RESET}` : "";
        const errorSuffix = payload.effectStatus === "error" ? ` ${RED}${payload.error}${RESET}` : "";
        process.stderr.write(`  ${icon} ${MAGENTA}${payload.effectKind}${RESET} ${payload.effectTitle ?? payload.effectId}${elapsed}${errorSuffix}\n`);
        if (payload.output) {
          const lines = payload.output.split("\n").filter((l) => l.trim());
          const tail = lines.slice(-5);
          for (const line of tail) {
            const trimmed = line.length > 160 ? line.slice(0, 160) + "..." : line;
            process.stderr.write(`    ${DIM}${trimmed}${RESET}\n`);
          }
        }
      } else if (payload.status === "iteration-summary") {
        const elapsed = payload.elapsedMs != null ? formatElapsed(payload.elapsedMs) : "?";
        const tokens = payload.tokenEstimate != null ? ` | ~${payload.tokenEstimate} tokens` : "";
        process.stderr.write(`  ${DIM}${payload.effectsResolved ?? 0} effect(s) resolved in ${elapsed}${tokens}${RESET}\n`);
      } else if (payload.status === "completed") {
        process.stderr.write(`\n${GREEN}${BOLD}Run completed${RESET} ${DIM}(${payload.iteration} iterations)${RESET}\n`);
      } else if (payload.status === "failed") {
        process.stderr.write(`\n${RED}${BOLD}Run failed:${RESET} ${payload.error}\n`);
      }
      break;
  }
}

export function emitAmuxEvent(
  event: Record<string, unknown>,
  json: boolean,
  outputMode?: OutputMode,
): void {
  const mode = resolveOutputMode(json, outputMode);
  if (mode !== "amux-events") {
    return;
  }
  process.stdout.write(JSON.stringify(event) + "\n");
}

export function formatElapsed(ms: number): string {
  if (ms < 1000) return "<1s";
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec}s`;
}

export function createStreamingProgressCallbacks(
  outputMode: OutputMode,
  _harnessName: string,
): import("../../types").StreamingOutputOptions | undefined {
  if (outputMode !== "cli") return undefined;

  const MAX_LINE_LENGTH = 200;
  return {
    onLine: (line: string) => {
      const trimmed = line.length > MAX_LINE_LENGTH
        ? line.slice(0, MAX_LINE_LENGTH) + "..."
        : line;
      process.stderr.write(`${DIM}  | ${trimmed}${RESET}\n`);
    },
  };
}

export function loadSessionCompressionConfig(workspace?: string): CompressionConfig | null {
  try {
    return loadCompressionConfig(workspace ?? process.cwd());
  } catch {
    return null;
  }
}

export function compressInternalHarnessPrompt(
  text: string,
  compressionConfig: CompressionConfig | null | undefined,
  taskKind: "agent" | "skill" | "breakpoint" = "agent",
): string {
  if (!compressionConfig?.enabled || !compressionConfig.layers.sdkContextHook.enabled) {
    return text;
  }

  const layer = compressionConfig.layers.sdkContextHook;
  if (estimateTokens(text) <= layer.minCompressionTokens) {
    return text;
  }

  const targetReduction = layer.perTaskKind?.[taskKind] ?? layer.targetReduction;
  return densityFilterText(text, targetReduction);
}

export function buildPromptContext(args: {
  workspace?: string;
  selectedHarnessName?: string;
  discovered: HarnessDiscoveryResult[];
  compressionConfig: CompressionConfig | null;
}): HarnessPromptContext {
  const envNames = [
    "CI",
    "BABYSITTER_COMPRESSION_ENABLED",
    "BABYSITTER_PI_SANDBOX_IMAGE",
    "AZURE_OPENAI_API_KEY",
    "AZURE_OPENAI_PROJECT_NAME",
    "AZURE_OPENAI_DEPLOYMENT",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
  ] as const;

  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cwd: process.cwd(),
    workspace: path.resolve(args.workspace ?? process.cwd()),
    selectedHarnessName: args.selectedHarnessName,
    discoveredHarnesses: args.discovered,
    compressionEnabled: Boolean(
      args.compressionConfig?.enabled &&
      args.compressionConfig.layers.sdkContextHook.enabled,
    ),
    secureSandboxImage: process.env.BABYSITTER_PI_SANDBOX_IMAGE || "node:22-bookworm",
    piDefaultBashSandbox: "local",
    piIsolationDefault: false,
    envFlags: envNames.map((name) => ({
      name,
      value: process.env[name]
        ? (name.endsWith("_API_KEY") ? "set" : process.env[name])
        : "unset",
    })),
  };
}

export function selectHarness(
  discovered: HarnessDiscoveryResult[],
  preferred?: string,
): HarnessDiscoveryResult | undefined {
  if (preferred) {
    const match = discovered.find((h) => h.name === preferred && h.installed);
    if (match) return match;
  }

  const caller = detectCallerHarness();
  if (caller) {
    const callerMatch = discovered.find((h) => h.name === caller.name && h.installed);
    if (callerMatch) return callerMatch;
  }

  for (const name of HARNESS_PRIORITY) {
    const match = discovered.find((h) => h.name === name && h.installed);
    if (match) return match;
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// amux-events progress translation
// ---------------------------------------------------------------------------

/**
 * Translate an internal ProgressPayload to an agent-mux compatible JSONL
 * event and write it to stdout.
 *
 * This function maps the babysitter-agent internal progress structure to
 * the event types that the agent-mux babysitter adapter's `parseEvent()`
 * understands: `session_start`, `turn_start`, `turn_end`, `tool_call_start`,
 * `tool_result`, `text_delta`, `error`, `session_end`.
 */
function emitProgressAsAmuxEvent(payload: ProgressPayload): void {
  const now = new Date().toISOString();
  const runId = (payload as unknown as Record<string, unknown>)["runId"] as string | undefined ?? "";
  const agent = "babysitter";

  const writeEvent = (event: Record<string, unknown>): void => {
    process.stdout.write(JSON.stringify({
      runId,
      agent,
      timestamp: now,
      ...event,
    }) + "\n");
  };

  if (payload.phase === "2") {
    switch (payload.status) {
      case "started":
        writeEvent({ type: "session_start", sessionId: runId, harness: payload.harness });
        break;
      case "run-created":
        writeEvent({ type: "session_start", sessionId: payload.runId ?? runId, resumed: false });
        break;
      case "resuming":
        writeEvent({ type: "session_start", sessionId: payload.runId ?? runId, resumed: true });
        break;
      case "iteration-start":
        writeEvent({ type: "turn_start", turnIndex: payload.iteration ?? 0, iteration: payload.iteration });
        break;
      case "effect-start":
        writeEvent({
          type: "tool_call_start",
          toolCallId: payload.effectId ?? "",
          toolName: payload.effectKind ?? "unknown",
          input: { title: payload.effectTitle, harness: payload.effectHarness },
        });
        break;
      case "effect":
        writeEvent({
          type: "tool_result",
          toolCallId: payload.effectId ?? "",
          toolName: payload.effectKind ?? "unknown",
          output: payload.output ?? "",
          status: payload.effectStatus,
        });
        break;
      case "iteration-summary":
        writeEvent({
          type: "turn_end",
          turnIndex: payload.iteration ?? 0,
          iteration: payload.iteration,
          effectsResolved: payload.effectsResolved,
          elapsedMs: payload.elapsedMs,
        });
        break;
      case "completed":
        writeEvent({
          type: "session_end",
          sessionId: payload.runId ?? runId,
          exitReason: "completed",
          turnCount: payload.iteration ?? 0,
        });
        break;
      case "failed":
        writeEvent({ type: "error", message: payload.error ?? "Run failed", code: "RUN_FAILED" });
        writeEvent({
          type: "session_end",
          sessionId: payload.runId ?? runId,
          exitReason: "failed",
          turnCount: payload.iteration ?? 0,
        });
        break;
      case "process-error-recovery":
        writeEvent({
          type: "error",
          message: payload.error ?? "Process error",
          code: "PROCESS_ERROR",
          recoverable: true,
          attempt: payload.attempt,
          maxAttempts: payload.maxAttempts,
        });
        break;
      // bound, iteration, skipped-plan-only -- no direct amux equivalent
      default:
        break;
    }
  } else if (payload.phase === "1") {
    // Phase 1 (planning) events: emit as text_delta so the adapter sees progress
    if (payload.status === "started") {
      writeEvent({ type: "text_delta", text: `[planning] Process planning started via ${payload.harness ?? "unknown"}\n` });
    } else if (payload.status === "completed") {
      writeEvent({ type: "text_delta", text: `[planning] Process created: ${payload.processPath ?? "unknown"}\n` });
    } else if (payload.status === "failed") {
      writeEvent({ type: "error", message: payload.error ?? "Planning failed", code: "PLANNING_FAILED" });
    }
  }
}
