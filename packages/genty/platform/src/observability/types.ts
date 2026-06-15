/**
 * Observability types.
 *
 * GAP-OBS-NEW-002: Phase Timeline types.
 * GAP-STATE-008: Run Health Model types.
 */

// ---------------------------------------------------------------------------
// Run Health Model (GAP-STATE-008)
// ---------------------------------------------------------------------------

export type RunHealthStatus = "healthy" | "degraded" | "stuck" | "failed";

export interface RunHealthMetrics {
  errorRate: number;
  avgEffectLatencyMs: number;
  pendingCount: number;
  oldestPendingAgeMs: number;
  iterationCount: number;
  lastActivityAt: string | null;
  totalEffects: number;
  resolvedEffects: number;
  failedEffects: number;
}

export interface RunHealthSnapshot {
  status: RunHealthStatus;
  metrics: RunHealthMetrics;
  issues: string[];
  computedAt: string;
}

export interface HealthConfig {
  /** Threshold for detecting stuck runs (default: 300000ms = 5min). */
  stuckThresholdMs: number;
  /** Error rate above which run is 'degraded' (default: 0.3). */
  degradedErrorRate: number;
  /** Error rate above which run is 'failed' (default: 0.7). */
  failedErrorRate: number;
  /** Max age for pending effects before generating issue (default: 600000ms = 10min). */
  maxPendingAge: number;
}

// ---------------------------------------------------------------------------
// Phase Timeline (GAP-OBS-NEW-002)
// ---------------------------------------------------------------------------

export type PhaseName = "planning" | "execution" | "verification" | "completion";

export interface PhaseEntry {
  name: PhaseName;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
}

export interface Milestone {
  type: "breakpoint" | "quality-gate" | "run-completed" | "run-failed";
  label: string;
  occurredAt: string;
  data?: Record<string, unknown>;
}

export interface IterationTimeline {
  iteration: number;
  phases: PhaseEntry[];
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
}

export interface PhaseTimeline {
  phases: PhaseEntry[];
  milestones: Milestone[];
  iterations: IterationTimeline[];
  currentPhase: PhaseName | "completed" | "failed";
  totalDurationMs: number | null;
}
