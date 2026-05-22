import { describe, it, expect } from 'vitest';
import { sumCost, sumCostAsync, filterEvents, filterEventsAsync } from '../src/cost-utils.js';
import type { AgentEvent } from '../src/events.js';

const base = { runId: 'r', agent: 'claude' as const, timestamp: 0 };
const mkCost = (usd: number, inTok: number, outTok: number): AgentEvent => ({
  ...base,
  type: 'cost',
  cost: { totalUsd: usd, inputTokens: inTok, outputTokens: outTok, thinkingTokens: 0, cachedTokens: 0 },
});
const mkText = (delta: string): AgentEvent => ({ ...base, type: 'text_delta', delta, accumulated: delta });

describe('cost-utils', () => {
  it('sumCost folds totalUsd and tokens across cost events', () => {
    const events = [mkCost(0.1, 100, 50), mkText('hi'), mkCost(0.2, 200, 100)];
    const s = sumCost(events);
    expect(s.totalUsd).toBeCloseTo(0.3);
    expect(s.inputTokens).toBe(300);
    expect(s.outputTokens).toBe(150);
    expect(s.totalTokens).toBe(450);
    expect(s.costEventCount).toBe(2);
  });

  it('sumCost returns zeroes on an empty or cost-less stream', () => {
    expect(sumCost([]).totalUsd).toBe(0);
    expect(sumCost([mkText('hi')]).costEventCount).toBe(0);
  });

  it('sumCostAsync works on async iterables', async () => {
    async function* gen() { yield mkCost(0.5, 10, 20); yield mkText('x'); }
    const s = await sumCostAsync(gen());
    expect(s.totalUsd).toBe(0.5);
    expect(s.totalTokens).toBe(30);
  });

  it('filterEvents narrows to a single event type', () => {
    const events: AgentEvent[] = [mkText('a'), mkCost(0.1, 1, 1), mkText('b')];
    const texts = Array.from(filterEvents(events, 'text_delta'));
    expect(texts).toHaveLength(2);
    expect(texts[0].delta).toBe('a');
  });

  it('filterEventsAsync narrows async iterables', async () => {
    async function* gen() { yield mkText('a'); yield mkCost(0.1, 1, 1); }
    const costs = [];
    for await (const ev of filterEventsAsync(gen(), 'cost')) costs.push(ev);
    expect(costs).toHaveLength(1);
    expect(costs[0].cost.totalUsd).toBe(0.1);
  });
});
