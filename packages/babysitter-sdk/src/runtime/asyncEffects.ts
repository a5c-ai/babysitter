import type { EffectAction, EffectRecord } from "./types";

const DEFAULT_POLL_INTERVAL_MS = 5000;

export interface ClassifiedActions {
  blocking: EffectAction[];
  background: EffectAction[];
}

/**
 * Classify waiting actions into blocking (foreground) and background groups.
 * Background actions that share a parallelGroupId with foreground actions
 * get a distinct suffixed parallelGroupId so the harness schedules them independently.
 */
export function classifyWaitingActions(actions: EffectAction[]): ClassifiedActions {
  const blocking: EffectAction[] = [];
  const background: EffectAction[] = [];

  for (const action of actions) {
    if (action.schedulerHints?.background === true) {
      background.push(action);
    } else {
      blocking.push(action);
    }
  }

  // Collect parallelGroupIds used by foreground/blocking actions
  const foregroundGroupIds = new Set<string>();
  for (const a of blocking) {
    const gid = a.schedulerHints?.parallelGroupId;
    if (gid) foregroundGroupIds.add(gid);
  }

  // Reassign background actions that share a parallelGroupId with foreground
  const reassigned: EffectAction[] = background.map((a) => {
    const gid = a.schedulerHints?.parallelGroupId;
    if (gid && foregroundGroupIds.has(gid)) {
      return {
        ...a,
        schedulerHints: {
          ...a.schedulerHints,
          parallelGroupId: `${gid}:bg`,
        },
      };
    }
    return a;
  });

  return { blocking, background: reassigned };
}

/**
 * Apply default background scheduling parameters to an action.
 * Only background actions receive a default pollIntervalMs.
 */
export function applyBackgroundDefaults(action: EffectAction): EffectAction {
  if (action.schedulerHints?.background !== true) {
    return action;
  }

  const hints = action.schedulerHints;
  if (hints.pollIntervalMs !== undefined) {
    return action;
  }

  return {
    ...action,
    schedulerHints: {
      ...hints,
      pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
    },
  };
}

/**
 * Create an EffectRecord for a background effect action, marking it with
 * background: true and a dispatchedAt timestamp.
 */
export function createBackgroundEffectRecord(action: EffectAction): EffectRecord {
  return {
    effectId: action.effectId,
    invocationKey: action.invocationKey,
    stepId: action.stepId ?? "",
    taskId: action.taskId ?? "",
    status: "requested",
    kind: action.kind,
    label: action.label,
    labels: action.labels,
    taskDefRef: action.taskDefRef,
    inputsRef: action.inputsRef,
    requestedAt: action.requestedAt,
    background: true,
    dispatchedAt: new Date().toISOString(),
  };
}
