import type { JournalEvent } from "../storage/types";

export type ObservedRunState = "created" | "waiting" | "completed" | "failed";

const RUN_LIFECYCLE_TYPES: ReadonlySet<JournalEvent["type"]> = new Set([
  "RUN_CREATED",
  "RUN_COMPLETED",
  "RUN_FAILED",
]);

export function findLastLifecycleEventType(events: JournalEvent[]): JournalEvent["type"] | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (RUN_LIFECYCLE_TYPES.has(event.type)) {
      return event.type;
    }
  }
  return undefined;
}

export function countPendingEffectsFromJournal(events: JournalEvent[]): number {
  const pendingEffectIds = new Set<string>();

  for (const event of events) {
    const data = event.data as Record<string, unknown> | undefined;
    const effectId = typeof data?.effectId === "string" ? data.effectId : "";
    if (!effectId) {
      continue;
    }

    if (event.type === "EFFECT_REQUESTED") {
      pendingEffectIds.add(effectId);
      continue;
    }

    if (event.type === "EFFECT_RESOLVED" || event.type === "EFFECT_CANCELLED") {
      pendingEffectIds.delete(effectId);
    }
  }

  return pendingEffectIds.size;
}

export function deriveObservedRunState(
  events: JournalEvent[],
  pendingCount = countPendingEffectsFromJournal(events),
): ObservedRunState {
  const lastLifecycleEventType = findLastLifecycleEventType(events);
  if (lastLifecycleEventType === "RUN_FAILED") {
    return "failed";
  }
  if (pendingCount > 0) {
    return "waiting";
  }
  if (lastLifecycleEventType === "RUN_COMPLETED") {
    return "completed";
  }
  return "created";
}

export function isTerminalRunState(state: ObservedRunState): boolean {
  return state === "completed" || state === "failed";
}
