import { describe, expect, it } from 'vitest';

import { buildRecentSessionActions, titleForPath } from '../src/shell/navigation.js';

describe('titleForPath', () => {
  it('maps run deep links to the dispatch detail title', () => {
    expect(titleForPath('/runs/run-123')).toBe('Dispatch Detail');
  });
});

describe('buildRecentSessionActions', () => {
  it('creates jump actions from the most recent sessions', () => {
    const actions = buildRecentSessionActions([
      { sessionId: 'older', title: 'Older session', agent: 'codex', updatedAt: 1000 },
      { sessionId: 'newer', title: 'Newest session', agent: 'claude', updatedAt: 2000 },
      { sessionId: '', title: 'ignored', updatedAt: 3000 },
    ]);

    expect(actions).toEqual([
      {
        id: 'session:newer',
        label: 'Open session Newest session · claude',
        to: '/sessions/newer',
      },
      {
        id: 'session:older',
        label: 'Open session Older session · codex',
        to: '/sessions/older',
      },
    ]);
  });
});
