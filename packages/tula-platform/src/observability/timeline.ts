/**
 * GAP-OBS-NEW-002: Phase Timeline Visualization.
 *
 * Synthesizes phase timeline data from journal events. Identifies planning,
 * execution, verification, and completion phases with duration metrics.
 */

import { loadJournal, type JournalEvent } from "@a5c-ai/babysitter-sdk";
import type {
  PhaseTimeline,
  PhaseEntry,
  PhaseName,
  Milestone,
  IterationTimeline,
} from "./types";

const VERIFICATION_TASK_IDS = new Set([
  "typecheck",
  "lint",
  "run-tests",
  "adversarial-review",
]);

function ms(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime();
}

function makePhase(name: PhaseName, startedAt: string, endedAt: string | null): PhaseEntry {
  return {
    name,
    startedAt,
    endedAt,
    durationMs: endedAt ? ms(startedAt, endedAt) : null,
  };
}

function isVerificationEvent(event: JournalEvent): boolean {
  const taskId = event.data.taskId as string | undefined;
  return taskId != null && VERIFICATION_TASK_IDS.has(taskId);
}

export function buildPhaseTimelineFromEvents(events: JournalEvent[]): PhaseTimeline {
  if (events.length === 0) {
    return {
      phases: [],
      milestones: [],
      iterations: [],
      currentPhase: "planning",
      totalDurationMs: null,
    };
  }

  const phases: PhaseEntry[] = [];
  const milestones: Milestone[] = [];
  let currentPhase: PhaseName | "completed" | "failed" = "planning";

  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];

  // Find key transition points
  const firstEffectReq = events.find((e) => e.type === "EFFECT_REQUESTED");
  const runCompleted = events.find((e) => e.type === "RUN_COMPLETED");
  const runFailed = events.find((e) => e.type === "RUN_FAILED");

  // Find first verification event (typecheck/lint/test/review)
  const firstVerificationReq = events.find(
    (e) => e.type === "EFFECT_REQUESTED" && isVerificationEvent(e),
  );
  const lastVerificationResolved = [...events]
    .reverse()
    .find((e) => e.type === "EFFECT_RESOLVED" && isVerificationEvent(e));

  // Phase 1: Planning — from RUN_CREATED to first EFFECT_REQUESTED
  if (firstEvent.type === "RUN_CREATED") {
    const planEnd = firstEffectReq?.recordedAt ?? null;
    phases.push(makePhase("planning", firstEvent.recordedAt, planEnd));
    if (planEnd) {
      currentPhase = "execution";
    }
  }

  // Phase 2: Execution — from first EFFECT_REQUESTED to verification start (or last resolved)
  if (firstEffectReq) {
    // Find the last non-verification EFFECT_RESOLVED as fallback execution end
    const lastNonVerifResolved = [...events]
      .reverse()
      .find((e) => e.type === "EFFECT_RESOLVED" && !isVerificationEvent(e));
    const execEnd = firstVerificationReq?.recordedAt
      ?? runCompleted?.recordedAt
      ?? runFailed?.recordedAt
      ?? lastNonVerifResolved?.recordedAt
      ?? null;
    phases.push(makePhase("execution", firstEffectReq.recordedAt, execEnd));
    currentPhase = execEnd ? (firstVerificationReq ? "verification" : "execution") : "execution";
  }

  // Phase 3: Verification — quality gates
  if (firstVerificationReq) {
    const verEnd = lastVerificationResolved?.recordedAt
      ?? runCompleted?.recordedAt
      ?? runFailed?.recordedAt
      ?? null;
    phases.push(makePhase("verification", firstVerificationReq.recordedAt, verEnd));
    currentPhase = verEnd ? "completion" : "verification";
  }

  // Phase 4: Completion
  if (runCompleted) {
    phases.push(makePhase("completion", runCompleted.recordedAt, runCompleted.recordedAt));
    currentPhase = "completed";
  } else if (runFailed) {
    phases.push(makePhase("completion", runFailed.recordedAt, runFailed.recordedAt));
    currentPhase = "failed";
  }

  // Extract milestones
  for (const event of events) {
    if (event.type === "EFFECT_RESOLVED" && event.data.kind === "breakpoint") {
      milestones.push({
        type: "breakpoint",
        label: (event.data.title as string) ?? `Breakpoint ${event.data.effectId as string}`,
        occurredAt: event.recordedAt,
        data: event.data,
      });
    }
    if (
      event.type === "EFFECT_RESOLVED" &&
      (event.data.taskId === "adversarial-review")
    ) {
      milestones.push({
        type: "quality-gate",
        label: `Quality review: ${event.data.taskId as string}`,
        occurredAt: event.recordedAt,
        data: event.data,
      });
    }
    if (event.type === "RUN_COMPLETED") {
      milestones.push({
        type: "run-completed",
        label: "Run completed",
        occurredAt: event.recordedAt,
      });
    }
    if (event.type === "RUN_FAILED") {
      milestones.push({
        type: "run-failed",
        label: "Run failed",
        occurredAt: event.recordedAt,
        data: event.data,
      });
    }
  }

  // Build iteration breakdowns
  const iterations = buildIterations(events);

  const totalDurationMs =
    events.length >= 2 ? ms(firstEvent.recordedAt, lastEvent.recordedAt) : null;

  return {
    phases,
    milestones,
    iterations,
    currentPhase,
    totalDurationMs,
  };
}

function buildIterations(events: JournalEvent[]): IterationTimeline[] {
  const iterationMap = new Map<number, JournalEvent[]>();

  for (const event of events) {
    const iter = event.data.iteration as number | undefined;
    if (iter != null) {
      let group = iterationMap.get(iter);
      if (!group) {
        group = [];
        iterationMap.set(iter, group);
      }
      group.push(event);
    }
  }

  const iterations: IterationTimeline[] = [];
  for (const [iteration, iterEvents] of iterationMap) {
    if (iterEvents.length === 0) continue;
    const first = iterEvents[0];
    const last = iterEvents[iterEvents.length - 1];
    const endedAt = last.type === "EFFECT_RESOLVED" ? last.recordedAt : null;

    iterations.push({
      iteration,
      phases: [], // Per-iteration phase breakdown could be added later
      startedAt: first.recordedAt,
      endedAt,
      durationMs: endedAt ? ms(first.recordedAt, endedAt) : null,
    });
  }

  return iterations.sort((a, b) => a.iteration - b.iteration);
}

export async function buildPhaseTimeline(runDir: string): Promise<PhaseTimeline> {
  const events = await loadJournal(runDir);
  return buildPhaseTimelineFromEvents(events);
}
