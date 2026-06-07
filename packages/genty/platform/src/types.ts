/**
 * Shared type definitions for the genty platform.
 *
 * Types fall into two categories:
 * 1. Locally-defined types that genty owns (governance, breakpoints, interaction).
 * 2. Re-exported SDK types for values returned by SDK functions. These re-exports
 *    centralise the SDK type dependency so consumer files import from here
 *    instead of scattering @a5c-ai/babysitter-sdk imports throughout the tree.
 *
 * When the SDK coupling is fully removed (phase 6+), category-2 types will be
 * replaced with locally-defined equivalents.
 */

// ── Generic JSON (locally owned) ─────────────────────────────────────────

/** A JSON-serialisable record (alias for Record<string, unknown>). */
export type JsonRecord = Record<string, unknown>;

// ── Re-exported SDK types (centralised dependency) ───────────────────────
// These are types returned by SDK runtime functions that genty calls.
// By re-exporting from a single file we avoid N scattered SDK imports.

export type {
  JournalEvent,
  AppendEventResult,
} from "@a5c-ai/babysitter-sdk";

export type {
  EffectAction,
  IterationResult,
  OrchestrateOptions,
  CommitEffectResultOptions,
  CommitEffectResultArtifacts,
  ProcessContext,
  DefinedTask,
  CreateRunOptions,
  CreateRunResult,
  ReplayEngine,
  CreateReplayEngineOptions,
  StateCacheSnapshot,
  StateCacheJournalHead,
  DerivedEffectSummary,
  EffectSchedulerHints,
} from "@a5c-ai/babysitter-sdk";

export type {
  PromptContext,
  CompressionConfig,
} from "@a5c-ai/babysitter-sdk";

export type { RuntimeConfigValueType } from "@a5c-ai/babysitter-sdk";

// ── Effect index (locally defined; matches SDK shape) ────────────────────

/** Index over all effects in a run, queryable by effectId. */
export interface EffectIndex {
  listEffects(): Array<{
    effectId: string;
    taskId: string;
    kind?: string;
    status?: string;
    inputTokens?: number;
    outputTokens?: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
    costUsd?: number;
    costModel?: string;
  }>;
}

// ── Governance (locally owned) ───────────────────────────────────────────

/**
 * GAP-SEC-003: Interaction kind for breakpoint semantic classification.
 */
export type InteractionKind =
  | 'clarification'
  | 'approval'
  | 'intervention'
  | 'notification'
  | 'handoff';

/**
 * GAP-SEC-005: Action category for posture-based approval enforcement.
 */
export type ActionCategory =
  | 'read'
  | 'write'
  | 'execute'
  | 'destroy'
  | 'network'
  | 'auth';

/**
 * GAP-SEC-005: Approval posture defining enforcement behavior per action category.
 */
export interface ApprovalPosture {
  name: string;
  allowAutoApprove: boolean;
  minConsecutiveApprovalsForAutoN: number;
  requireExplicitRule: boolean;
  requiredTags?: string[];
  requiredApproverLevel?: string;
}

/** Breakpoint auto-approval rule. */
export interface BreakpointRule {
  id: string;
  pattern: string;
  action: "auto-approve" | "never-auto-approve";
  createdAt: string;
  createdBy: string;
  source?: string;
  note?: string;
}

export interface AutoApprovalResult {
  recommended: boolean;
  reason: string;
  matchedRule?: string;
  consecutiveApprovals?: number;
  blockedByPosture?: boolean;
  effectiveCategory?: ActionCategory;
}

export type { BreakpointConfig } from "@a5c-ai/babysitter-sdk";

// ── External agents (re-exported from SDK) ───────────────────────────────

export type {
  ExternalAgentInfo,
  ExternalAgentDiscovery,
} from "@a5c-ai/babysitter-sdk";

// ── Policy engine types (re-exported from SDK) ───────────────────────────
// The governance engine in genty consumes these types directly from the SDK
// policy evaluation layer.

export type {
  PolicyRuleKind,
  PolicyConditionOp,
  PolicyAction,
  PolicyCondition,
  PolicyRule,
  StatefulPolicyRule,
  PolicyEvaluationContext,
  PolicyDecision,
  PolicyDecisionLog,
  PolicyEngine,
} from "@a5c-ai/babysitter-sdk";
