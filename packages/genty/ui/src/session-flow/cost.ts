import { adaptSessionFlowEvents } from './adapters.js';
import type { SessionCost, SessionFlowEventBuffer } from './types.js';

export function accumulateEventCost(
  runIds: string[],
  eventBuffers: Record<string, SessionFlowEventBuffer>,
): SessionCost | null {
  const totals: SessionCost = {
    totalUsd: 0,
    inputTokens: 0,
    outputTokens: 0,
    thinkingTokens: 0,
    cachedTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
  };
  let found = false;

  for (const runId of runIds) {
    for (const event of adaptSessionFlowEvents(eventBuffers[runId])) {
      if (event.type !== 'cost') {
        continue;
      }
      totals.totalUsd = (totals.totalUsd ?? 0) + Number(event.cost.totalUsd ?? 0);
      totals.inputTokens = (totals.inputTokens ?? 0) + Number(event.cost.inputTokens ?? 0);
      totals.outputTokens = (totals.outputTokens ?? 0) + Number(event.cost.outputTokens ?? 0);
      totals.thinkingTokens = (totals.thinkingTokens ?? 0) + Number(event.cost.thinkingTokens ?? 0);
      totals.cachedTokens = (totals.cachedTokens ?? 0) + Number(event.cost.cachedTokens ?? 0);
      totals.cacheCreationTokens = (totals.cacheCreationTokens ?? 0) + Number(event.cost.cacheCreationTokens ?? 0);
      totals.cacheReadTokens = (totals.cacheReadTokens ?? 0) + Number(event.cost.cacheReadTokens ?? 0);
      found = true;
    }
  }

  return found ? totals : null;
}
