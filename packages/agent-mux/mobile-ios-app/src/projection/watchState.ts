import type { GatewayStoreState } from '@a5c-ai/agent-mux-ui';

export type WatchStateProjection = {
  generatedAt: number;
  runs: Array<{ runId: string; agent: string; status: string }>;
  hooks: Array<{ hookRequestId: string; runId: string; kind: string; secondsRemaining: number }>;
};

export type WatchStateEnvelope = {
  full: WatchStateProjection;
  diff: Partial<WatchStateProjection>;
  byteLength: number;
};

function slimText(input: string, limit: number): string {
  return input.length <= limit ? input : `${input.slice(0, Math.max(0, limit - 1))}...`;
}

export function projectWatchState(state: GatewayStoreState, previous?: WatchStateProjection): WatchStateEnvelope {
  const full: WatchStateProjection = {
    generatedAt: Date.now(),
    runs: Object.values(state.runs.byId)
      .sort((left, right) => Number(right.startedAt ?? 0) - Number(left.startedAt ?? 0))
      .slice(0, 4)
      .map((run) => ({
        runId: slimText(run.runId, 14),
        agent: slimText(String(run.agent ?? 'agent'), 12),
        status: slimText(String(run.status ?? 'running'), 12),
      })),
    hooks: Object.values(state.hooks.byRunId)
      .flat()
      .slice(0, 4)
      .map((hook) => ({
        hookRequestId: slimText(hook.hookRequestId, 18),
        runId: slimText(hook.runId, 14),
        kind: slimText(hook.hookKind, 14),
        secondsRemaining: Math.max(0, Math.floor((hook.deadlineTs - Date.now()) / 1000)),
      })),
  };

  const diff: Partial<WatchStateProjection> = {};
  if (JSON.stringify(previous?.runs) !== JSON.stringify(full.runs)) {
    diff.runs = full.runs;
  }
  if (JSON.stringify(previous?.hooks) !== JSON.stringify(full.hooks)) {
    diff.hooks = full.hooks;
  }
  const encoded = JSON.stringify({ generatedAt: full.generatedAt, ...diff });
  const byteLength = new TextEncoder().encode(encoded).length;
  return {
    full,
    diff,
    byteLength,
  };
}
