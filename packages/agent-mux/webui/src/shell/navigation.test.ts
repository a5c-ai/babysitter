import { describe, expect, it } from 'vitest';

import { buildRecentSessionActions, titleForPath } from './navigation.js';

describe('titleForPath', () => {
  it('returns route-specific labels for detailed run and project surfaces', () => {
    expect(titleForPath('/runs/run-123')).toBe('Dispatch Detail');
    expect(titleForPath('/projects/kanban-app/board')).toBe('Project Board');
    expect(titleForPath('/projects/kanban-app/list')).toBe('Project List');
    expect(titleForPath('/projects/kanban-app/issues/issue-1')).toBe('Issue Detail');
    expect(titleForPath('/projects/kanban-app/issues/issue-1/workspace/new')).toBe('Provision Workspace');
  });
});

describe('buildRecentSessionActions', () => {
  it('sorts sessions by recency and falls back to the session id when the title is missing', () => {
    const actions = buildRecentSessionActions([
      { sessionId: 'session-1', title: '', agent: 'codex', updatedAt: 10 },
      { sessionId: 'session-2', title: 'Board repair', agent: 'claude', updatedAt: 20 },
    ]);

    expect(actions).toEqual([
      {
        id: 'session:session-2',
        label: 'Open session Board repair · claude',
        to: '/sessions/session-2',
      },
      {
        id: 'session:session-1',
        label: 'Open session session-1 · codex',
        to: '/sessions/session-1',
      },
    ]);
  });
});
