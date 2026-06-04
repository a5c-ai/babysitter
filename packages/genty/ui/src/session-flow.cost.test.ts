import { describe, expect, it } from 'vitest';

import { accumulateEventCost } from './session-flow.js';

describe('accumulateEventCost', () => {
  it('aggregates cost records across multiple runs', () => {
    const totals = accumulateEventCost(
      ['run-1', 'run-2'],
      {
        'run-1': { events: [{ type: 'cost', cost: { totalUsd: 0.25, inputTokens: 10 } }] },
        'run-2': { events: [{ type: 'cost', cost: { totalUsd: 0.5, outputTokens: 12, cacheReadTokens: 3 } }] },
      },
    );

    expect(totals).toMatchObject({
      totalUsd: 0.75,
      inputTokens: 10,
      outputTokens: 12,
      cacheReadTokens: 3,
    });
  });
});
