import { randomUUID } from "crypto";
import type { EffectAction, EffectSchedulerHints } from "../runtime/types";

export interface EffectGroup {
  effectGroupId: string;
  actions: EffectAction[];
}

export interface BuildEffectGroupOptions {
  persistent: boolean;
}

/**
 * Builds an effect group from a set of actions, assigning a shared effectGroupId
 * and optionally coordinator/worker roles for persistent groups.
 */
export function buildEffectGroup(
  actions: EffectAction[],
  options: BuildEffectGroupOptions
): EffectGroup {
  const effectGroupId = randomUUID();

  // Deduplicate by effectId, preserving order
  const seen = new Set<string>();
  const deduped: EffectAction[] = [];
  for (const action of actions) {
    if (seen.has(action.effectId)) continue;
    seen.add(action.effectId);
    deduped.push(action);
  }

  const annotated = deduped.map((action, index) => {
    const extraHints: EffectSchedulerHints = { effectGroupId };

    if (options.persistent) {
      extraHints.groupRole = index === 0 ? "coordinator" : "worker";
    }

    return {
      ...action,
      schedulerHints: {
        ...(action.schedulerHints ?? {}),
        ...extraHints,
      },
    };
  });

  return {
    effectGroupId,
    actions: annotated,
  };
}

/**
 * Merges multiple effect groups into a single group, deduplicating by effectId.
 * Each action retains its original effectGroupId from its source group.
 */
export function mergeEffectGroups(groups: EffectGroup[]): EffectGroup {
  const seen = new Set<string>();
  const merged: EffectAction[] = [];

  for (const group of groups) {
    for (const action of group.actions) {
      if (seen.has(action.effectId)) continue;
      seen.add(action.effectId);
      merged.push(action);
    }
  }

  return {
    effectGroupId: randomUUID(),
    actions: merged,
  };
}
