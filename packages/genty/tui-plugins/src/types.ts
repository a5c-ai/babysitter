/**
 * Shared types for babysitter TUI plugins.
 *
 * These mirror the babysitter-harness dashboard types but are self-contained
 * to avoid dragging in Ink-specific dependencies from the harness package.
 */

// ---------------------------------------------------------------------------
// Run / orchestration status
// ---------------------------------------------------------------------------

export type RunState = 'completed' | 'failed' | 'waiting' | 'created';

export type EffectKind = string;
export type EffectStatus = 'pending' | 'resolved' | 'failed';

export interface EffectSummary {
  readonly effectId: string;
  readonly kind: EffectKind;
  readonly status: EffectStatus;
  readonly title?: string;
  readonly elapsedMs?: number;
  readonly error?: string;
}

export interface RunSummary {
  readonly runId: string;
  readonly runDir: string;
  readonly state: RunState;
  readonly processId: string;
  readonly createdAt: string;
  readonly eventCount: number;
  readonly pendingCount: number;
  readonly resolvedCount?: number;
  readonly prompt?: string;
  readonly harness?: string;
}

// ---------------------------------------------------------------------------
// Cost tracking
// ---------------------------------------------------------------------------

export interface CostEntry {
  readonly timestamp: string;
  readonly amount: number;
  readonly currency: string;
  readonly source: string;
  readonly model?: string;
  readonly tokens?: {
    readonly input: number;
    readonly output: number;
    readonly total: number;
  };
}

export interface CostSummary {
  readonly totalUsd: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly entries: readonly CostEntry[];
}

// ---------------------------------------------------------------------------
// Governance / breakpoints
// ---------------------------------------------------------------------------

export interface GovernanceDecision {
  readonly breakpointId: string;
  readonly title: string;
  readonly approved: boolean | null;
  readonly response?: string;
  readonly feedback?: string;
  readonly expert?: string | string[];
  readonly tags?: string[];
  readonly autoApproval?: {
    readonly recommended: boolean;
    readonly reason: string;
  };
  readonly timestamp?: string;
}
