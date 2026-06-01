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
import {
  buildTaskRequirements,
  type HarnessCandidate,
} from "../../capabilityRouter";
import { resolveFallbackHarness } from "../../fallbackChains";
import { resolveModelForTask } from "../../modelSelection";
import {
  evaluatePolicy,
  type PolicyName,
} from "../../selectionPolicies";

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
  status: "started" | "resuming" | "skipped-plan-only" | "run-created" | "bound" | "iteration" | "iteration-start" | "effect-start" | "effect-group-start" | "iteration-summary" | "effect" | "effect-group-summary" | "completed" | "failed" | "process-error-recovery";
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
  parallelGroupId?: string;
  maxConcurrency?: number;
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
  if (typeof action.schedulerHints?.preferredHarness === "string") {
    const requestedHarness = normalizeBuiltInHarnessName(action.schedulerHints.preferredHarness);
    const match = discovered.find((h) => h.name === requestedHarness && h.installed);
    if (match) return match.name;
  }

  const meta = action.taskDef?.metadata as Record<string, unknown> | undefined;
  const execution = (action.taskDef as Record<string, unknown> | undefined)?.execution as Record<string, unknown> | undefined;
  if (typeof execution?.harness === "string") {
    const requestedHarness = normalizeBuiltInHarnessName(execution.harness);
    const match = discovered.find((h) => h.name === requestedHarness && h.installed);
    if (match) return match.name;
  }

  const policyHarness = resolvePolicySelectedHarness(action, discovered);
  if (policyHarness) {
    return policyHarness;
  }

  if (typeof meta?.harness === "string") {
    const requestedHarness = normalizeBuiltInHarnessName(meta.harness);
    const match = discovered.find((h) => h.name === requestedHarness && h.installed);
    if (match) return match.name;
  }

  return normalizeBuiltInHarnessName(defaultHarness);
}

function resolvePolicySelectedHarness(
  action: EffectAction,
  discovered: HarnessDiscoveryResult[],
): string | undefined {
  const taskDef = action.taskDef as Record<string, unknown> | undefined;
  const execution = taskDef?.execution as Record<string, unknown> | undefined;
  const meta = taskDef?.metadata as Record<string, unknown> | undefined;
  const candidates = toHarnessCandidates(discovered);
  if (candidates.length === 0) {
    return undefined;
  }

  const policyName = coercePolicyName(execution?.policy ?? meta?.selectionPolicy);
  if (policyName) {
    const result = evaluatePolicy(
      policyName,
      candidates,
      buildTaskRequirements(taskDef ?? {}),
      { preferredHarness: stringValue(execution?.harness ?? meta?.preferredHarness) },
    );
    if (result.selected) {
      return result.selected.name;
    }
  }

  if (typeof execution?.model === "string") {
    const result = resolveModelForTask(taskDef ?? {}, candidates);
    if (result.selectedHarness) {
      return result.selectedHarness;
    }
  }

  const fallbackChain = arrayOfStrings(execution?.fallbackChain ?? meta?.fallbackChain);
  if (fallbackChain.length > 0) {
    const failedHarnesses = arrayOfStrings(meta?.failedHarnesses);
    const result = resolveFallbackHarness(
      { harnesses: fallbackChain.map(normalizeBuiltInHarnessName), maxRetries: fallbackChain.length - 1 },
      failedHarnesses.map(normalizeBuiltInHarnessName),
    );
    if (result.harness && discovered.some((h) => h.name === result.harness && h.installed)) {
      return result.harness;
    }
  }

  return undefined;
}

function toHarnessCandidates(discovered: HarnessDiscoveryResult[]): HarnessCandidate[] {
  return discovered
    .filter((harness) => harness.installed)
    .map((harness) => {
      const extra = harness as HarnessDiscoveryResult & {
        supportedModels?: string[];
        availableTools?: string[];
        permissions?: string[];
      };
      return {
        name: harness.name,
        capabilities: harness.capabilities,
        supportedModels: extra.supportedModels ?? [],
        availableTools: extra.availableTools ?? [],
        permissions: extra.permissions ?? [],
      };
    });
}

function coercePolicyName(value: unknown): PolicyName | undefined {
  return value === "cost-optimized" ||
    value === "latency-optimized" ||
    value === "capability-first" ||
    value === "user-preferred"
    ? value
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
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
  PARENT_PROMPT_TIMEOUT_MS,
  DEFAULT_PROMPT_TIMEOUT_MS,
  WORKER_TIMEOUT_MS,
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
export { createAgentCoreSession } from "@a5c-ai/tula-core";
export type { AgentCoreSessionHandle } from "@a5c-ai/tula-core";
export { discoverHarnesses } from "@a5c-ai/babysitter-sdk";
export { BabysitterRuntimeError, ErrorCategory } from "@a5c-ai/babysitter-sdk";
export { Type } from "@sinclair/typebox";
