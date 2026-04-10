/**
 * GAP-OBS-NEW-002: Phase Timeline types.
 */

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
