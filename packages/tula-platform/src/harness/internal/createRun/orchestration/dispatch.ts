import type { EffectAction } from "@a5c-ai/babysitter-sdk";
import { getEffectiveConcurrency } from "@a5c-ai/babysitter-sdk";
import type { HarnessDiscoveryResult, ResolveEffectResult } from "../utils";
import { HarnessCapability } from "../../../types";

export type EffectDispatchCommit = {
  action: EffectAction;
  result: ResolveEffectResult;
  startedAt: string;
  finishedAt: string;
};

export type EffectDispatchSummary = {
  resolved: number;
  ok: number;
  error: number;
  background: number;
};

export type EffectDispatchOptions = {
  actions: EffectAction[];
  concurrentEffects?: boolean;
  resolveAction(action: EffectAction): Promise<ResolveEffectResult>;
  commitAction(commit: EffectDispatchCommit): Promise<void>;
};

type IndexedAction = {
  action: EffectAction;
  index: number;
};

type IndexedDispatchResult = {
  index: number;
  commit: EffectDispatchCommit;
};

const UNGROUPED_KEY = "__ungrouped__";
export function harnessSupportsConcurrentEffects(
  harnessName: string,
  discovered: readonly HarnessDiscoveryResult[] = [],
): boolean {
  const harness = discovered.find((candidate) => candidate.name === harnessName);
  return harness?.capabilities?.includes(HarnessCapability.ConcurrentEffects) ?? false;
}

export async function dispatchEffectActions(
  options: EffectDispatchOptions,
): Promise<EffectDispatchSummary> {
  const indexed = options.actions.map((action, index) => ({ action, index }));
  const groups = buildDispatchGroups(indexed, options.concurrentEffects === true);
  const resolved = new Map<number, EffectDispatchCommit>();

  for (const group of groups) {
    const groupResults = await resolveDispatchGroup(group, options.resolveAction);
    for (const result of groupResults) {
      resolved.set(result.index, result.commit);
    }
  }

  let ok = 0;
  let error = 0;
  let background = 0;
  for (let index = 0; index < options.actions.length; index += 1) {
    const commit = resolved.get(index);
    if (!commit) {
      continue;
    }
    await options.commitAction(commit);
    if (commit.result.status === "ok") {
      ok += 1;
    } else {
      error += 1;
    }
    if (commit.action.schedulerHints?.background === true) {
      background += 1;
    }
  }

  return {
    resolved: ok + error,
    ok,
    error,
    background,
  };
}

function buildDispatchGroups(
  actions: IndexedAction[],
  concurrentEffects: boolean,
): IndexedAction[][] {
  const groups: IndexedAction[][] = [];
  const grouped = new Map<string, IndexedAction[]>();

  for (const item of actions) {
    const groupId = normalizedGroupId(item.action);
    const strategy = item.action.schedulerHints?.executionStrategy;
    if (
      !concurrentEffects ||
      !groupId ||
      groupId === UNGROUPED_KEY ||
      strategy === "sequential"
    ) {
      groups.push([item]);
      continue;
    }
    const existing = grouped.get(groupId);
    if (existing) {
      existing.push(item);
    } else {
      const group: IndexedAction[] = [item];
      grouped.set(groupId, group);
      groups.push(group);
    }
  }

  return groups;
}

function normalizedGroupId(action: EffectAction): string | undefined {
  const groupId = action.schedulerHints?.parallelGroupId;
  if (!groupId) {
    return undefined;
  }
  return action.schedulerHints?.background === true
    ? `${groupId}:background`
    : groupId;
}

async function resolveDispatchGroup(
  group: IndexedAction[],
  resolveAction: (action: EffectAction) => Promise<ResolveEffectResult>,
): Promise<IndexedDispatchResult[]> {
  const maxConcurrency = getDispatchConcurrency(group);
  const results: IndexedDispatchResult[] = [];
  let nextIndex = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const current = group[nextIndex];
      nextIndex += 1;
      if (!current) {
        return;
      }
      const startedAt = new Date().toISOString();
      let result: ResolveEffectResult;
      try {
        result = await resolveAction(current.action);
      } catch (error) {
        result = {
          status: "error",
          error: error instanceof Error ? error : new Error(String(error)),
          stderr: error instanceof Error ? error.message : String(error),
        };
      }
      results.push({
        index: current.index,
        commit: {
          action: current.action,
          result,
          startedAt,
          finishedAt: new Date().toISOString(),
        },
      });
    }
  }

  const workerCount = Math.min(maxConcurrency, group.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results.sort((a, b) => a.index - b.index);
}

function getDispatchConcurrency(group: IndexedAction[]): number {
  const strategy = group.find((item) => item.action.schedulerHints?.executionStrategy)?.action
    .schedulerHints?.executionStrategy;
  if (strategy === "sequential") {
    return 1;
  }

  const maxConcurrencyHints = group
    .map((item) => item.action.schedulerHints?.maxConcurrency)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const explicitMaxConcurrency = maxConcurrencyHints.length > 0
    ? Math.min(...maxConcurrencyHints)
    : undefined;

  return getEffectiveConcurrency(
    group.map((item) => item.action),
    explicitMaxConcurrency === undefined
      ? undefined
      : { maxConcurrency: explicitMaxConcurrency },
  );
}
