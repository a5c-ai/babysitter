import { describe, expect, it, vi } from 'vitest';

import { createGatewayStore } from '../src/store/index.js';
import { selectCostTotals, selectVisibleEventNodes } from '../src/store/selectors.js';

describe('ui store', () => {
  it('merges run events idempotently and orders by seq', () => {
    const store = createGatewayStore({} as never);
    store.getState().actions.mergeRunEvent('r1', 2, 'agent', { type: 'text_delta', delta: 'b' });
    store.getState().actions.mergeRunEvent('r1', 1, 'agent', { type: 'text_delta', delta: 'a' });
    store.getState().actions.mergeRunEvent('r1', 2, 'agent', { type: 'text_delta', delta: 'b' });

    const buffer = store.getState().events.byRunId['r1']!;
    expect(buffer.seqs).toEqual([1, 2]);
    expect(buffer.events).toHaveLength(2);
  });

  it('memoizes visible nodes and cost totals for unchanged buffers', () => {
    const store = createGatewayStore({} as never);
    store.getState().actions.mergeRunEvent('r1', 1, 'agent', { type: 'text_delta', delta: 'a' });
    store.getState().actions.mergeRunEvent('r1', 2, 'agent', { type: 'cost', cost: { totalUsd: 1.25 } });

    const state = store.getState();
    const nodesA = selectVisibleEventNodes(state, 'r1');
    const nodesB = selectVisibleEventNodes(state, 'r1');
    const totalsA = selectCostTotals(state, 'r1');
    const totalsB = selectCostTotals(state, 'r1');

    expect(nodesA).toBe(nodesB);
    expect(totalsA).toBe(totalsB);
    expect(totalsA.totalUsd).toBe(1.25);
  });
});
