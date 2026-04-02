/**
 * Shared utilities, types, constants, and logging helpers for the
 * harness:create-run command handler phases.
 */

import * as path from "node:path";
import * as readline from "node:readline";
import { existsSync, readFileSync } from "node:fs";
import { Type } from "@sinclair/typebox";
import { detectCallerHarness } from "../../harness/discovery";
import type { PiSessionHandle } from "../../harness/piWrapper";
import type {
  HarnessDiscoveryResult,
  PiPromptResult,
  PiSessionOptions,
  SessionBindResult,
} from "../../harness/types";
import { loadCompressionConfig } from "../../compression/config-loader";
import { densityFilterText, estimateTokens } from "../../compression/density-filter";
import {
  createAskUserQuestionResponse,
  createDefaultAskUserQuestionResponse,
  promptAskUserQuestionWithUiContext,
  promptAskUserQuestionWithReadline,
  validateAskUserQuestionRequest,
  type AskUserQuestionUiContext,
  type AskUserQuestionRequest,
  type AskUserQuestionResponse,
} from "../../interaction";
import type { EffectAction, IterationResult } from "../../runtime/types";
import type { CompressionConfig } from "../../compression/config";
import type { HarnessPromptContext } from "./harnessPrompts";

// ── Exported Types ───────────────────────────────────────────────────

export interface HarnessCreateRunArgs {
  prompt?: string;
  harness?: string;
  processPath?: string;
  workspace?: string;
  model?: string;
  maxIterations?: number;
  runsDir: string;
  json: boolean;
  verbose: boolean;
  interactive?: boolean;
  existingRunId?: string;
  existingRunDir?: string;
  planOnly?: boolean;
}

/** @deprecated Use HarnessCreateRunArgs instead */
export type SessionCreateArgs = HarnessCreateRunArgs;

export interface Phase1Progress {
  phase: "1";
  status: "started" | "skipped" | "completed" | "failed" | "interview";
  harness?: string;
  processPath?: string;
  error?: string;
  answer?: string;
}

export interface Phase2Progress {
  phase: "2";
  status: "started" | "resuming" | "skipped-plan-only" | "run-created" | "bound" | "iteration" | "effect" | "completed" | "failed";
  runId?: string;
  runDir?: string;
  harness?: string;
  sessionId?: string;
  iteration?: number;
  runStatus?: string;
  pendingEffects?: number;
  effectId?: string;
  effectKind?: string;
  effectTitle?: string;
  effectHarness?: string;
  effectStatus?: string;
  error?: string;
  output?: string;
  processPath?: string;
}

export type ProgressPayload = Phase1Progress | Phase2Progress;

export interface ToolResultShape {
  content: Array<{ type: "text"; text: string }>;
  details?: unknown;
}

export interface ProcessDefinitionReport {
  processPath: string;
  summary?: string;
}

export interface OrchestrationFinishReport {
  summary?: string;
}

export type ResolveEffectResult = {
  status: "ok" | "error";
  value?: unknown;
  error?: unknown;
  stdout?: string;
  stderr?: string;
};

export interface OrchestrationState {
  runId?: string;
  runDir?: string;
  sessionBound?: SessionBindResult;
  iteration: number;
  lastIterationResult?: IterationResult;
  pendingActions: Map<string, EffectAction>;
  pendingEffectResults: Map<string, ResolveEffectResult>;
  lastAskUserQuestionResponse?: AskUserQuestionResponse;
  finished?: OrchestrationFinishReport;
}

export interface ExternalWorkspaceAssessment {
  kind: "empty" | "non-empty";
  entries: string[];
}

export interface AskUserQuestionToolContext {
  hasUI?: boolean;
  ui?: AskUserQuestionUiContext;
}

/** Delegation configuration that can be supplied per-effect via tool params or task metadata. */
export interface DelegationConfig {
  model?: string;
  timeout?: number;
  toolsMode?: "default" | "coding" | "readonly";
  thinkingLevel?: "none" | "low" | "medium" | "high";
  bashSandbox?: "auto" | "secure" | "local";
  skills?: string[];
  subagentName?: string;
}

export interface EffectRetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  nonRetryableKinds: string[];
}

// ── Constants ────────────────────────────────────────────────────────

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

export const DEFAULT_EFFECT_RETRY_CONFIG: EffectRetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1_000,
  backoffMultiplier: 4,
  maxDelayMs: 60_000,
  nonRetryableKinds: ["breakpoint", "sleep"],
};

const HARNESS_PRIORITY: readonly string[] = [
  "internal",
  "oh-my-pi",
  "pi",
  "claude-code",
  "codex",
  "gemini-cli",
  "opencode",
] as const;

export const TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS = process.env.VITEST
  ? [0, 0]
  : [1_000, 3_000];

export const DEFAULT_INTERACTIVE_ASK_TIMEOUT_MS = 600_000;
// Parent orchestration turns may legitimately wait on user input or external
// work for an unbounded duration. A timeout of 0 disables the wrapper timer.
export const PI_PARENT_PROMPT_TIMEOUT_MS = 0;
export const PI_DEFAULT_PROMPT_TIMEOUT_MS = 900_000;
export const PI_WORKER_TIMEOUT_MS = 1_800_000;

export const ASK_OPTION_SCHEMA = Type.Object({
  label: Type.String(),
  description: Type.Optional(Type.String()),
  preview: Type.Optional(Type.String()),
});

export const ASK_QUESTION_SCHEMA = Type.Object({
  question: Type.String(),
  header: Type.Optional(Type.String()),
  options: Type.Optional(Type.Array(ASK_OPTION_SCHEMA)),
  multiSelect: Type.Optional(Type.Boolean()),
  allowOther: Type.Optional(Type.Boolean()),
  required: Type.Optional(Type.Boolean()),
  recommended: Type.Optional(Type.Number({ description: "Index of the recommended option (0-based). Auto-selected in non-interactive mode or on timeout." })),
});

export const ASK_USER_QUESTION_SCHEMA = Type.Object({
  questions: Type.Array(ASK_QUESTION_SCHEMA, { minItems: 1, maxItems: 4 }),
  timeout: Type.Optional(Type.Number({ description: "Timeout in ms. On expiry, the recommended option (or first) is auto-selected." })),
});

// ── Logging Utilities ────────────────────────────────────────────────

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

export function writeVerboseLine(enabled: boolean, json: boolean, message: string): void {
  if (!json && enabled) {
    process.stderr.write(`${DIM}${message}${RESET}\n`);
  }
}

export function writeVerboseBlock(
  enabled: boolean,
  json: boolean,
  label: string,
  value: unknown,
  maxChars: number = VERBOSE_LOG_LIMIT,
): void {
  if (json || !enabled) {
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
): void {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  switch (payload.phase) {
    case "1":
      if (payload.status === "skipped") {
        process.stderr.write(`${DIM}Phase 1 skipped (--process provided)${RESET}\n`);
      } else if (payload.status === "started") {
        process.stderr.write(`\n${BOLD}Phase 1${RESET} ${DIM}Interview / process definition via ${payload.harness}...${RESET}\n`);
      } else if (payload.status === "completed") {
        process.stderr.write(`${GREEN}Phase 1 complete${RESET} ${DIM}${payload.processPath}${RESET}\n`);
      } else if (payload.status === "failed") {
        process.stderr.write(`${RED}Phase 1 failed:${RESET} ${payload.error}\n`);
      } else if (payload.status === "interview") {
        process.stderr.write(`${DIM}Interview answers: ${payload.answer}${RESET}\n`);
      }
      break;
    case "2":
      if (payload.status === "started") {
        process.stderr.write(`\n${BOLD}Phase 2${RESET} ${DIM}Bound orchestration loop${RESET}\n`);
      } else if (payload.status === "run-created") {
        process.stderr.write(`${GREEN}Run created${RESET} runId=${CYAN}${payload.runId}${RESET}\n`);
        if (verbose) process.stderr.write(`  ${DIM}runDir: ${payload.runDir}${RESET}\n`);
      } else if (payload.status === "bound") {
        if (payload.error) {
          process.stderr.write(`${YELLOW}Session binding warning:${RESET} ${payload.error}\n`);
        } else {
          process.stderr.write(`${DIM}session bound via ${payload.harness}: ${payload.sessionId}${RESET}\n`);
        }
      } else if (payload.status === "iteration") {
        process.stderr.write(`\n${DIM}-- iteration ${payload.iteration} --${RESET} status=${payload.runStatus} pending=${payload.pendingEffects}\n`);
      } else if (payload.status === "effect") {
        const icon = payload.effectStatus === "ok" ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
        process.stderr.write(`  ${icon} ${MAGENTA}${payload.effectKind}${RESET} ${payload.effectTitle ?? payload.effectId}${payload.effectStatus === "error" ? ` ${RED}${payload.error}${RESET}` : ""}\n`);
      } else if (payload.status === "completed") {
        process.stderr.write(`\n${GREEN}${BOLD}Run completed${RESET} ${DIM}(${payload.iteration} iterations)${RESET}\n`);
      } else if (payload.status === "failed") {
        process.stderr.write(`\n${RED}${BOLD}Run failed:${RESET} ${payload.error}\n`);
      }
      break;
  }
}

// ── Compression ──────────────────────────────────────────────────────

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

// ── Harness Selection ────────────────────────────────────────────────

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

// ── Readline Utilities ───────────────────────────────────────────────

export function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: true,
  });
}

export function askLine(
  rl: readline.Interface,
  promptText: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    rl.question(`${promptText} `, (answer) => {
      resolve(answer);
    });
    rl.once("close", () => resolve(null));
  });
}

export async function readInteractivePrompt(
  rl: readline.Interface,
): Promise<string | null> {
  process.stderr.write("\n");
  process.stderr.write(
    `${BOLD}${CYAN}babysitter harness:create-run${RESET}\n`,
  );
  process.stderr.write(
    `${DIM}Enter your request below. Press Enter to submit.${RESET}\n`,
  );
  process.stderr.write(
    `${DIM}(Use \\ at end of line for multi-line input, Ctrl+C to cancel)${RESET}\n\n`,
  );

  const lines: string[] = [];
  for (;;) {
    const line = await askLine(rl, lines.length === 0 ? ">" : "...");
    if (line === null) return null; // EOF / Ctrl+C / Ctrl+D
    if (line.endsWith("\\")) {
      lines.push(line.slice(0, -1));
      continue;
    }
    lines.push(line);
    const combined = lines.join("\n").trim();
    if (combined) return combined;
    lines.length = 0; // Reset if empty, re-prompt
  }
}

// ── Tool Result Formatting ───────────────────────────────────────────

export function formatToolResult(data: unknown, message?: string): ToolResultShape {
  if (typeof data === "string") {
    return {
      content: [{
        type: "text",
        text: message ? `${message}\n${data}` : data,
      }],
      details: data,
    };
  }
  const content = message
    ? `${message}\n${JSON.stringify(data, null, 2)}`
    : JSON.stringify(data, null, 2);
  return {
    content: [{
      type: "text",
      text: content,
    }],
    details: data,
  };
}

// ── AskUserQuestion Utilities ────────────────────────────────────────

export function isApprovalAskRequest(request: AskUserQuestionRequest): boolean {
  const question = request.questions[0];
  if (!question || request.questions.length !== 1 || !question.options) {
    return false;
  }
  const labels = question.options.map((option) => option.label);
  return labels.length === 2 &&
    labels[0] === "Approve" &&
    labels[1] === "Reject" &&
    question.allowOther === false;
}

export async function askUserQuestionViaTool(
  request: AskUserQuestionRequest,
  interactive: boolean,
  rl: readline.Interface | null,
  toolContext?: AskUserQuestionToolContext,
): Promise<AskUserQuestionResponse> {
  // Apply a default timeout only when interactive AND no explicit timeout was
  // provided.  An explicit timeout of 0 means "wait indefinitely" and must be
  // respected — do NOT override it with the default.
  const effectiveRequest = interactive && request.timeout == null
    ? {
      ...request,
      timeout: DEFAULT_INTERACTIVE_ASK_TIMEOUT_MS,
    }
    : request;

  validateAskUserQuestionRequest(effectiveRequest);

  if (interactive) {
    try {
      if (toolContext?.hasUI && toolContext.ui) {
        return await promptAskUserQuestionWithUiContext(toolContext.ui, effectiveRequest);
      }
      if (rl) {
        return await promptAskUserQuestionWithReadline(rl, effectiveRequest);
      }
    } catch {
      return createDefaultAskUserQuestionResponse(effectiveRequest);
    }
  }

  const answers: Record<string, string> = {};
  for (const [index, question] of effectiveRequest.questions.entries()) {
    const key = question.header?.trim() || `Question ${index + 1}`;
    if (
      question.recommended != null &&
      question.options &&
      question.options[question.recommended]
    ) {
      answers[key] = question.options[question.recommended].label;
    } else {
      answers[key] = "";
    }
  }
  if (isApprovalAskRequest(effectiveRequest)) {
    const key = effectiveRequest.questions[0]?.header?.trim() || "Decision";
    const rec = effectiveRequest.questions[0]?.recommended;
    const opts = effectiveRequest.questions[0]?.options;
    if (rec != null && opts && opts[rec]) {
      answers[key] = opts[rec].label;
    } else {
      answers[key] = "Approve";
    }
  }
  return createAskUserQuestionResponse(effectiveRequest, answers);
}

// ── Harness Resolution Utilities ─────────────────────────────────────

export function resolveTaskHarness(
  action: EffectAction,
  defaultHarness: string,
  discovered: HarnessDiscoveryResult[],
): string {
  const meta = action.taskDef?.metadata as Record<string, unknown> | undefined;
  if (typeof meta?.harness === "string") {
    const match = discovered.find((h) => h.name === meta.harness && h.installed);
    if (match) return match.name;
  }

  return defaultHarness;
}

/**
 * Returns true if the harness uses the internal programmatic engine (piWrapper).
 * 'internal' is the primary programmatic harness; 'oh-my-pi' also uses piWrapper.
 * 'pi' is CLI-only and does NOT use the programmatic engine.
 *
 * @deprecated Prefer isInternalHarness — isPiHarness is kept for backward compat.
 */
export function isPiHarness(harnessName: string): boolean {
  return isInternalHarness(harnessName);
}

export function isInternalHarness(harnessName: string): boolean {
  return harnessName === "internal" || harnessName === "oh-my-pi";
}

export function usesExternalHarness(harnessName: string): boolean {
  return !isPiHarness(harnessName);
}

export function shouldUseExternalHarness(harnessName: string): boolean {
  if (!usesExternalHarness(harnessName)) {
    return false;
  }
  return detectCallerHarness()?.name === harnessName;
}

export function shellQuoteArg(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

export function readBooleanMetadata(
  metadata: Record<string, unknown> | undefined,
  key: string,
): boolean | undefined {
  const value = metadata?.[key];
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}

export function readBashSandboxMetadata(
  metadata: Record<string, unknown> | undefined,
): PiSessionOptions["bashSandbox"] | undefined {
  const value = metadata?.bashSandbox;
  return value === "auto" || value === "secure" || value === "local"
    ? value
    : undefined;
}

export function readStringMetadata(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

// ── PI Prompt Retry ──────────────────────────────────────────────────

export function isProcessModuleLoadFailure(error: unknown): boolean {
  return error instanceof Error && /^Failed to load process module at /.test(error.message);
}

export function isRetryablePiPromptFailure(error: unknown): boolean {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "output" in error
          ? String((error as { output?: unknown }).output ?? "")
          : "";

  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return normalized.includes("the server had an error processing your request") ||
    normalized.includes("please retry your request") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("pitimeouterror") ||
    normalized.includes("pi prompt timed out") ||
    normalized.includes("deadline exceeded");
}

export function isIgnorablePiPromptFailure(output: string): boolean {
  return output.includes("msg.content.filter is not a function");
}

export async function promptPiWithRetry(args: {
  session: PiSessionHandle;
  message: string;
  timeout: number;
  label: string;
  writeVerbose?: (message: string) => void;
  writeVerboseData?: (label: string, value: unknown, maxChars?: number) => void;
}): Promise<PiPromptResult> {
  let attempt = 0;

  for (;;) {
    try {
      const result = await args.session.prompt(args.message, args.timeout);
      if (
        result.success ||
        !isRetryablePiPromptFailure(result.output) ||
        attempt >= TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS.length
      ) {
        return result;
      }

      const delayMs = TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS[attempt] ?? 0;
      attempt += 1;
      args.writeVerbose?.(
        `[${args.label} retry] transient PI failure; retrying prompt attempt ${attempt}/${TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS.length} after ${delayMs}ms`,
      );
      args.writeVerboseData?.(`${args.label} retry failure output`, result.output);
      if (delayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error: unknown) {
      if (!isRetryablePiPromptFailure(error) || attempt >= TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS.length) {
        throw error;
      }

      const delayMs = TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS[attempt] ?? 0;
      attempt += 1;
      args.writeVerbose?.(
        `[${args.label} retry] transient PI exception; retrying prompt attempt ${attempt}/${TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS.length} after ${delayMs}ms`,
      );
      args.writeVerboseData?.(`${args.label} retry error`, error);
      if (delayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
}

// ── PI Worker Session Options ────────────────────────────────────────

export function buildPiWorkerSessionOptions(args: {
  action: EffectAction;
  workspace?: string;
  model?: string;
  customTools?: unknown[];
  delegationConfig?: DelegationConfig;
}): PiSessionOptions {
  const metadata = args.action.taskDef?.metadata as Record<string, unknown> | undefined;
  const isolated = readBooleanMetadata(metadata, "isolated");
  const enableCompaction = readBooleanMetadata(metadata, "enableCompaction");

  // Priority: delegationConfig > task metadata > defaults
  const effectiveModel = args.delegationConfig?.model ?? args.model;
  const effectiveTimeout = args.delegationConfig?.timeout ?? PI_WORKER_TIMEOUT_MS;
  const effectiveToolsMode = args.delegationConfig?.toolsMode
    ?? readStringMetadata(metadata, "toolsMode") as "default" | "coding" | "readonly" | undefined
    ?? "coding";
  const rawThinkingLevel = args.delegationConfig?.thinkingLevel
    ?? readStringMetadata(metadata, "thinkingLevel") as "none" | "low" | "medium" | "high" | undefined;
  // Map delegation "none" to undefined (no thinking header sent to PI).
  const effectiveThinkingLevel: PiSessionOptions["thinkingLevel"] | undefined =
    rawThinkingLevel === "none" ? undefined : rawThinkingLevel;
  const effectiveBashSandbox = args.delegationConfig?.bashSandbox
    ?? readBashSandboxMetadata(metadata);

  // Resolve skills to appendSystemPrompt content
  let appendSystemPrompt: string[] | undefined;
  const skillNames = args.delegationConfig?.skills ?? (metadata?.skills as string[] | undefined);
  if (skillNames?.length) {
    const skillContents: string[] = [];
    for (const skillName of skillNames) {
      try {
        const candidates = [
          path.join(args.workspace ?? process.cwd(), ".a5c", "skills", skillName, "SKILL.md"),
          path.join(args.workspace ?? process.cwd(), ".claude", "plugins", skillName, "SKILL.md"),
        ];
        for (const candidate of candidates) {
          if (existsSync(candidate)) {
            skillContents.push(readFileSync(candidate, "utf8"));
            break;
          }
        }
      } catch { /* skip missing skills */ }
    }
    if (skillContents.length) {
      appendSystemPrompt = [skillContents.join("\n\n---\n\n")];
    }
  }

  // Resolve subagentName to agentDir
  const subagentName = args.delegationConfig?.subagentName ?? readStringMetadata(metadata, "subagentName");
  let agentDir: string | undefined;
  if (subagentName) {
    const candidates = [
      path.join(args.workspace ?? process.cwd(), ".claude", "agents", subagentName),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        agentDir = candidate;
        break;
      }
    }
  }

  return {
    workspace: args.workspace,
    model: effectiveModel,
    timeout: effectiveTimeout,
    toolsMode: effectiveToolsMode,
    ephemeral: true,
    ...(args.customTools?.length ? { customTools: args.customTools } : {}),
    ...(isolated !== undefined ? { isolated } : {}),
    ...(enableCompaction !== undefined ? { enableCompaction } : {}),
    ...(effectiveBashSandbox ? { bashSandbox: effectiveBashSandbox } : {}),
    ...(effectiveThinkingLevel ? { thinkingLevel: effectiveThinkingLevel } : {}),
    ...(appendSystemPrompt ? { appendSystemPrompt } : {}),
    ...(agentDir ? { agentDir } : {}),
  };
}

// ── Re-exports for convenience ───────────────────────────────────────

export type { CompressionConfig } from "../../compression/config";
export type {
  HarnessDiscoveryResult,
  PiSessionEvent,
  PiPromptResult,
  PiSessionOptions,
  SessionBindResult,
} from "../../harness/types";
export type {
  AskUserQuestionUiContext,
  AskUserQuestionRequest,
  AskUserQuestionResponse,
} from "../../interaction";
export type { EffectAction, IterationResult } from "../../runtime/types";
export type { HarnessPromptContext } from "./harnessPrompts";
/** @deprecated Use HarnessPromptContext instead */
export type { HarnessPromptContext as SessionCreatePromptContext } from "./harnessPrompts";
export {
  createReadlineAskUserQuestionUiContext,
  createApprovalAskUserQuestion,
  createAskUserQuestionResponse,
} from "../../interaction";
export { createPiSession, PiSessionHandle } from "../../harness/piWrapper";
export { discoverHarnesses } from "../../harness/discovery";
export { BabysitterRuntimeError, ErrorCategory } from "../../runtime/exceptions";
export { Type } from "@sinclair/typebox";
