import type { EventBuffer, GatewayStoreState, HookRequestRecord } from './index.js';

type VisibleNode =
  | { type: 'text'; text: string }
  | { type: 'tool-card'; toolCall: Record<string, unknown>; toolResult?: Record<string, unknown> };

const visibleNodesCache = new WeakMap<EventBuffer, VisibleNode[]>();
const costTotalsCache = new WeakMap<EventBuffer, { totalUsd: number }>();
const EMPTY_VISIBLE_NODES: VisibleNode[] = [];
const ZERO_COST_TOTALS = { totalUsd: 0 };
const EMPTY_HOOK_REQUESTS: HookRequestRecord[] = [];

export function selectVisibleEventNodes(state: GatewayStoreState, runId: string): VisibleNode[] {
  const buffer = state.events.byRunId[runId];
  if (!buffer) return EMPTY_VISIBLE_NODES;
  const cached = visibleNodesCache.get(buffer);
  if (cached) return cached;

  const nodes: VisibleNode[] = [];
  let currentText = '';
  const pendingTools = new Map<string, Record<string, unknown>>();
  for (const event of buffer.events) {
    const type = event['type'];
    if (type === 'text_delta') {
      currentText += String(event['delta'] ?? '');
      continue;
    }
    if (currentText) {
      nodes.push({ type: 'text', text: currentText });
      currentText = '';
    }
    if (type === 'tool_call_ready' || type === 'tool_call_start') {
      pendingTools.set(String(event['toolCallId'] ?? ''), event);
      continue;
    }
    if (type === 'tool_result' || type === 'tool_error') {
      const toolCallId = String(event['toolCallId'] ?? '');
      const toolCall = pendingTools.get(toolCallId);
      nodes.push({
        type: 'tool-card',
        toolCall: toolCall ?? { type: 'tool_call_ready', toolCallId },
        toolResult: event,
      });
      pendingTools.delete(toolCallId);
    }
  }
  if (currentText) {
    nodes.push({ type: 'text', text: currentText });
  }

  visibleNodesCache.set(buffer, nodes);
  return nodes;
}

export function selectPendingHookRequests(state: GatewayStoreState, runId?: string): HookRequestRecord[] {
  if (runId) {
    return state.hooks.byRunId[runId] ?? EMPTY_HOOK_REQUESTS;
  }
  const pending = Object.values(state.hooks.byRunId).flat();
  return pending.length > 0 ? pending : EMPTY_HOOK_REQUESTS;
}

export function selectCostTotals(state: GatewayStoreState, runId: string): { totalUsd: number } {
  const buffer = state.events.byRunId[runId];
  if (!buffer) return ZERO_COST_TOTALS;
  const cached = costTotalsCache.get(buffer);
  if (cached) return cached;
  const totals = buffer.events.reduce<{ totalUsd: number }>((acc, event) => {
    if (event['type'] !== 'cost') return acc;
    const cost = event['cost'] as Record<string, unknown> | undefined;
    return {
      totalUsd: acc.totalUsd + Number(cost?.['totalUsd'] ?? 0),
    };
  }, { totalUsd: 0 });
  costTotalsCache.set(buffer, totals);
  return totals;
}
