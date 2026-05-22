/**
 * Shared utilities, types, constants, and logging helpers for the
 * create-run command handler phases.
 */

import { Type } from "@sinclair/typebox";
import {
  type EffectAction,
  type IterationResult,
} from "@a5c-ai/babysitter-sdk";
import type {
  HarnessDiscoveryResult,
  SessionBindResult,
} from "../../types";
import type {
  AskUserQuestionUiContext,
  AskUserQuestionResponse,
} from "../../../interaction";
import {
  isBuiltInHarnessName,
  normalizeBuiltInHarnessName,
} from "../../builtInHarness";

export type OutputMode = "cli" | "json" | "tui" | "amux-events";

export interface HarnessCreateRunArgs {
  invocationCommand?: string;
  prompt?: string;
  harness?: string;
  processPath?: string;
  workspace?: string;
  model?: string;
  maxIterations?: number;
  runsDir?: string;
  json: boolean;
  verbose: boolean;
  interactive?: boolean;
  existingRunId?: string;
  existingRunDir?: string;
  existingSessionBound?: SessionBindResult;
  planOnly?: boolean;
  outputMode?: OutputMode;
}

/** @deprecated Use HarnessCreateRunArgs instead */
export type SessionCreateArgs = HarnessCreateRunArgs;

export interface PlanProcessProgress {
  phase: "1";
  status: "started" | "skipped" | "completed" | "failed" | "interview" | "intent" | "planning";
  harness?: string;
  processPath?: string;
  error?: string;
  answer?: string;
}

export interface OrchestrationProgress {
  phase: "2";
  status: "started" | "resuming" | "skipped-plan-only" | "run-created" | "bound" | "iteration" | "iteration-start" | "effect-start" | "iteration-summary" | "effect" | "completed" | "failed" | "process-error-recovery";
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
  attempt?: number;
  maxAttempts?: number;
  elapsedMs?: number;
  effectsResolved?: number;
  tokenEstimate?: number;
}

export type ProgressPayload = PlanProcessProgress | OrchestrationProgress;

export interface ToolResultShape {
  content: Array<{ type: "text"; text: string }>;
  details?: unknown;
}

export interface ProcessDefinitionReport {
  processPath: string;
  summary?: string;
  runId?: string;
  runDir?: string;
  sessionBound?: SessionBindResult;
  conversationSummary?: string;
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

export const DEFAULT_EFFECT_RETRY_CONFIG: EffectRetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1_000,
  backoffMultiplier: 4,
  maxDelayMs: 60_000,
  nonRetryableKinds: ["breakpoint", "sleep"],
};

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

export function resolveTaskHarness(
  action: EffectAction,
  defaultHarness: string,
  discovered: HarnessDiscoveryResult[],
): string {
  const meta = action.taskDef?.metadata as Record<string, unknown> | undefined;
  if (typeof meta?.harness === "string") {
    const requestedHarness = normalizeBuiltInHarnessName(meta.harness);
    const match = discovered.find((h) => h.name === requestedHarness && h.installed);
    if (match) return match.name;
  }

  return normalizeBuiltInHarnessName(defaultHarness);
}

/**
 * @deprecated Prefer isInternalHarness — isPiHarness is kept for backward compat.
 */
export function isPiHarness(harnessName: string): boolean {
  return isInternalHarness(harnessName);
}

export function isInternalHarness(harnessName: string): boolean {
  return isBuiltInHarnessName(harnessName);
}

export function usesExternalHarness(harnessName: string): boolean {
  return !isPiHarness(harnessName);
}

export function shouldUseExternalHarness(harnessName: string): boolean {
  if (!usesExternalHarness(harnessName)) {
    return false;
  }
  return true;
}

export function shellQuoteArg(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

export {
  resolveOutputMode,
  isAmuxEventsMode,
  DIM,
  RESET,
  BOLD,
  CYAN,
  GREEN,
  YELLOW,
  RED,
  MAGENTA,
  VERBOSE_LOG_LIMIT,
  PROCESS_LIBRARY_READ_MAX_CHARS,
  PROCESS_LIBRARY_SEARCH_DEFAULT_LIMIT,
  truncateForVerboseLog,
  stringifyForVerboseLog,
  writeVerboseLine,
  writeVerboseBlock,
  emitProgress,
  emitAmuxEvent,
  formatElapsed,
  createStreamingProgressCallbacks,
  loadSessionCompressionConfig,
  compressInternalHarnessPrompt,
  buildPromptContext,
  selectHarness,
} from "./output";

export {
  DEFAULT_INTERACTIVE_ASK_TIMEOUT_MS,
  createReadlineInterface,
  askLine,
  readInteractivePrompt,
  formatToolResult,
  isApprovalAskRequest,
  askUserQuestionViaTool,
} from "./askUserQuestion";

export {
  TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS,
  PI_PARENT_PROMPT_TIMEOUT_MS,
  PI_DEFAULT_PROMPT_TIMEOUT_MS,
  PI_WORKER_TIMEOUT_MS,
  readBooleanMetadata,
  readBashSandboxMetadata,
  readStringMetadata,
  isProcessModuleLoadFailure,
  isRetryablePiPromptFailure,
  isIgnorablePiPromptFailure,
  promptPiWithRetry,
  buildPiWorkerSessionOptions,
  resolveAgentCoreBackendForHarness,
} from "./pi";

export type { CompressionConfig } from "@a5c-ai/babysitter-sdk";
export type {
  HarnessDiscoveryResult,
  AgentCoreSessionEvent,
  AgentCorePromptResult,
  AgentCoreSessionOptions,
  SessionBindResult,
} from "../../types";
export type {
  AskUserQuestionUiContext,
  AskUserQuestionRequest,
  AskUserQuestionResponse,
} from "../../../interaction";
export type { EffectAction, IterationResult } from "@a5c-ai/babysitter-sdk";
export type { HarnessPromptContext } from "./prompts";
/** @deprecated Use HarnessPromptContext instead */
export type { HarnessPromptContext as SessionCreatePromptContext } from "./prompts";
export {
  createReadlineAskUserQuestionUiContext,
  createApprovalAskUserQuestion,
  createAskUserQuestionResponse,
} from "../../../interaction";
export { createAgentCoreSession } from "@a5c-ai/agent-core";
export type { AgentCoreSessionHandle } from "@a5c-ai/agent-core";
export { discoverHarnesses } from "@a5c-ai/babysitter-sdk";
export { BabysitterRuntimeError, ErrorCategory } from "@a5c-ai/babysitter-sdk";
export { Type } from "@sinclair/typebox";
