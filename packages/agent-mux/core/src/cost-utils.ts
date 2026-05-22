/**
 * Public helpers for aggregating cost/token usage from an event stream or
 * a stored session transcript. These mirror the internal accumulators in
 * run-handle-cost.ts but accept any iterable of AgentEvent — so callers can
 * use them on live streams (`handle.events()`) and on session files read
 * back later (`sessions.read(id).events`) with the same shape.
 */

import type { AgentEvent } from './events.js';

export interface EventCostSummary {
  totalUsd: number;
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  cachedTokens: number;
  totalTokens: number;
  costEventCount: number;
}

function emptySummary(): EventCostSummary {
  return {
    totalUsd: 0,
    inputTokens: 0,
    outputTokens: 0,
    thinkingTokens: 0,
    cachedTokens: 0,
    totalTokens: 0,
    costEventCount: 0,
  };
}

/** Fold every `cost` event in a collection into a single summary. */
export function sumCost(events: Iterable<AgentEvent>): EventCostSummary {
  const acc = emptySummary();
  for (const ev of events) {
    if (ev.type === 'cost') {
      const c = ev.cost;
      acc.totalUsd += c.totalUsd ?? 0;
      acc.inputTokens += c.inputTokens ?? 0;
      acc.outputTokens += c.outputTokens ?? 0;
      acc.thinkingTokens += c.thinkingTokens ?? 0;
      acc.cachedTokens += c.cachedTokens ?? 0;
      acc.costEventCount += 1;
    }
  }
  acc.totalTokens = acc.inputTokens + acc.outputTokens + acc.thinkingTokens;
  return acc;
}

/** Async variant — fold cost events as they arrive on a live stream. */
export async function sumCostAsync(events: AsyncIterable<AgentEvent>): Promise<EventCostSummary> {
  const acc = emptySummary();
  for await (const ev of events) {
    if (ev.type === 'cost') {
      const c = ev.cost;
      acc.totalUsd += c.totalUsd ?? 0;
      acc.inputTokens += c.inputTokens ?? 0;
      acc.outputTokens += c.outputTokens ?? 0;
      acc.thinkingTokens += c.thinkingTokens ?? 0;
      acc.cachedTokens += c.cachedTokens ?? 0;
      acc.costEventCount += 1;
    }
  }
  acc.totalTokens = acc.inputTokens + acc.outputTokens + acc.thinkingTokens;
  return acc;
}

/**
 * Filter an event iterable to a single event type, with correct narrowing.
 * `for (const ev of filterEvents(events, 'text_delta')) ev.delta ...`
 */
export function* filterEvents<T extends AgentEvent['type']>(
  events: Iterable<AgentEvent>,
  type: T,
): Generator<Extract<AgentEvent, { type: T }>> {
  for (const ev of events) {
    if (ev.type === type) yield ev as Extract<AgentEvent, { type: T }>;
  }
}

export async function* filterEventsAsync<T extends AgentEvent['type']>(
  events: AsyncIterable<AgentEvent>,
  type: T,
): AsyncGenerator<Extract<AgentEvent, { type: T }>> {
  for await (const ev of events) {
    if (ev.type === type) yield ev as Extract<AgentEvent, { type: T }>;
  }
}
