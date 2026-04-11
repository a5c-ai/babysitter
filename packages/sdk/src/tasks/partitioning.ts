import type { EffectAction } from "../runtime/types";

export interface PartitionResult {
  foreground: EffectAction[];
  background: EffectAction[];
}

/**
 * Partition effect actions into foreground (blocking) and background (async) groups
 * based on the `schedulerHints.background` flag.
 */
export function partitionByBackground(actions: EffectAction[]): PartitionResult {
  const foreground: EffectAction[] = [];
  const background: EffectAction[] = [];

  for (const action of actions) {
    if (action.schedulerHints?.background === true) {
      background.push(action);
    } else {
      foreground.push(action);
    }
  }

  return { foreground, background };
}
