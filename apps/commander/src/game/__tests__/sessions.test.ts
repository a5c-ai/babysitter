/**
 * UI-SESSIONS-V5 phase unit tests (SPEC-V5 §V5-2/§V5-4):
 * - default-tab policy per column / agent-state (Sessions ahead of Process
 *   for agent-less review-and-beyond cards) and the card-supported tab set;
 * - session list shaping: card scope (children included), attempt grouping,
 *   subsession nesting by parentSessionId;
 * - tab-internal transcript routing (open / back / reviewed-chip navigation);
 * - store intents: openInspectorSessions deep-link, openRegistryStack stub,
 *   openInspectorCard default-tab wiring against a real driven sim.
 */
import { describe, expect, it } from 'vitest';

import { MockBackend } from '../../backend/mock/mockBackend';
import type { SimSessionView } from '../../backend/mock/simulation';
import {
  backToSessionList,
  CARD_SUPPORTED_TABS,
  defaultInspectorCardTab,
  groupSessionsByAttempt,
  openSessionTranscript,
  SESSIONS_DEFAULT_COLUMNS,
  SESSIONS_LIST_VIEW,
  sessionsForCard,
  type SessionsTabView,
} from '../sessions';
import { bindBackendToStore, createCommanderStore, type CommanderStore } from '../store';

function makeRig(seed = 42): { backend: MockBackend; store: CommanderStore; flush: () => void } {
  const backend = new MockBackend({ seed, autoStart: false });
  const store = createCommanderStore();
  const binding = bindBackendToStore(store, backend);
  binding.flush();
  return { backend, store, flush: binding.flush };
}

function fakeSession(overrides: Partial<SimSessionView>): SimSessionView {
  return {
    sessionId: 'agt-001-x',
    title: 'Cogsworth the Worker',
    creatureName: 'Cogsworth',
    agent: 'claude-code',
    model: 'claude-sonnet-4-5',
    stackRef: 'stk-01',
    stackName: 'Verdigris Vanguard',
    role: 'worker',
    coordination: false,
    taskId: 'adr-01-fix',
    attempt: 1,
    runId: 'run-001',
    parentSessionId: null,
    reviewOfSessionId: null,
    status: 'completed',
    startedTick: 10,
    endedTick: 40,
    turnCount: 5,
    messageCount: 9,
    tokenUsage: { inputTokens: 100, outputTokens: 50, thinkingTokens: 20, cachedTokens: 0 },
    cost: { totalUsd: 0.4, inputTokens: 100, outputTokens: 50, thinkingTokens: 20 },
    transcriptLength: 12,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Default-tab policy (§V5-2)
// ---------------------------------------------------------------------------

describe('defaultInspectorCardTab (§V5-2 default-tab policy)', () => {
  it('Sessions is the default for agent-less cards in the review-and-beyond columns', () => {
    for (const column of ['ai-review', 'human-review', 'approved', 'merged', 'in-production']) {
      expect(defaultInspectorCardTab(column, 0), column).toBe('sessions');
      expect(SESSIONS_DEFAULT_COLUMNS.has(column), column).toBe(true);
    }
  });

  it('backlog / do cards keep the V3 Process default', () => {
    expect(defaultInspectorCardTab('backlog', 0)).toBe('process');
    expect(defaultInspectorCardTab('do', 0)).toBe('process');
    expect(SESSIONS_DEFAULT_COLUMNS.has('backlog')).toBe(false);
    expect(SESSIONS_DEFAULT_COLUMNS.has('do')).toBe(false);
  });

  it('an attending agent keeps Process the default even in review columns', () => {
    expect(defaultInspectorCardTab('ai-review', 1)).toBe('process');
    expect(defaultInspectorCardTab('approved', 2)).toBe('process');
  });

  it('unknown cards (no committed view) default to Process', () => {
    expect(defaultInspectorCardTab(undefined, 0)).toBe('process');
  });

  it('the card-supported tab set offers everything except the live Transcript', () => {
    expect(CARD_SUPPORTED_TABS.has('sessions')).toBe(true);
    expect(CARD_SUPPORTED_TABS.has('process')).toBe(true);
    expect(CARD_SUPPORTED_TABS.has('workspace')).toBe(true);
    expect(CARD_SUPPORTED_TABS.has('memory')).toBe(true);
    expect(CARD_SUPPORTED_TABS.has('terminal')).toBe(true);
    expect(CARD_SUPPORTED_TABS.has('transcript')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// List shaping: scope, grouping, nesting (§V5-2)
// ---------------------------------------------------------------------------

describe('sessionsForCard (card scope incl. children)', () => {
  it('keeps the card own sessions plus child-card sessions, preserving order', () => {
    const all = [
      fakeSession({ sessionId: 's4', taskId: 'child-2' }),
      fakeSession({ sessionId: 's3', taskId: 'other' }),
      fakeSession({ sessionId: 's2', taskId: 'child-1' }),
      fakeSession({ sessionId: 's1', taskId: 'parent' }),
    ];
    const scoped = sessionsForCard(all, 'parent', ['child-1', 'child-2']);
    expect(scoped.map((s) => s.sessionId)).toEqual(['s4', 's2', 's1']);
  });

  it('a single card without children scopes to its own sessions only', () => {
    const all = [fakeSession({ sessionId: 'a', taskId: 't1' }), fakeSession({ sessionId: 'b', taskId: 't2' })];
    expect(sessionsForCard(all, 't1', []).map((s) => s.sessionId)).toEqual(['a']);
  });
});

describe('groupSessionsByAttempt (attempt dividers + subsession nesting)', () => {
  it('groups top-level sessions by attempt, newest-first input order preserved', () => {
    const sessions = [
      fakeSession({ sessionId: 'r2', role: 'reviewer', attempt: 2 }),
      fakeSession({ sessionId: 'w2', attempt: 2 }),
      fakeSession({ sessionId: 'r1', role: 'reviewer', attempt: 1 }),
      fakeSession({ sessionId: 'w1', attempt: 1 }),
    ];
    const groups = groupSessionsByAttempt(sessions);
    expect(groups.map((g) => g.attempt)).toEqual([2, 1]);
    expect(groups[0]!.rows.map((n) => n.session.sessionId)).toEqual(['r2', 'w2']);
    expect(groups[1]!.rows.map((n) => n.session.sessionId)).toEqual(['r1', 'w1']);
  });

  it('nests rows whose parentSessionId matches a LISTED session beneath their parent', () => {
    const sessions = [
      fakeSession({ sessionId: 'child-b', taskId: 'c2', parentSessionId: 'coord' }),
      fakeSession({ sessionId: 'child-a', taskId: 'c1', parentSessionId: 'coord' }),
      fakeSession({ sessionId: 'coord', coordination: true, taskId: 'parent' }),
    ];
    const groups = groupSessionsByAttempt(sessions);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.rows.map((n) => n.session.sessionId)).toEqual(['coord']);
    expect(groups[0]!.rows[0]!.children.map((n) => n.session.sessionId)).toEqual([
      'child-b',
      'child-a',
    ]);
  });

  it('nested rows stay with their parent group even when their own attempt differs', () => {
    const sessions = [
      fakeSession({ sessionId: 'child', taskId: 'c1', attempt: 3, parentSessionId: 'coord' }),
      fakeSession({ sessionId: 'coord', coordination: true, attempt: 1, taskId: 'parent' }),
    ];
    const groups = groupSessionsByAttempt(sessions);
    expect(groups.map((g) => g.attempt)).toEqual([1]);
    expect(groups[0]!.rows[0]!.children).toHaveLength(1);
  });

  it('an unlisted (or self-referencing) parent renders the row top-level', () => {
    const sessions = [
      fakeSession({ sessionId: 'orphan', parentSessionId: 'not-listed' }),
      fakeSession({ sessionId: 'selfie', parentSessionId: 'selfie' }),
    ];
    const groups = groupSessionsByAttempt(sessions);
    expect(groups[0]!.rows.map((n) => n.session.sessionId)).toEqual(['orphan', 'selfie']);
  });

  it('supports deep chains (integration under reviewer under nothing)', () => {
    const sessions = [
      fakeSession({ sessionId: 'int', role: 'integration', parentSessionId: 'rev' }),
      fakeSession({ sessionId: 'rev', role: 'reviewer', reviewOfSessionId: 'wrk' }),
      fakeSession({ sessionId: 'wrk' }),
    ];
    const groups = groupSessionsByAttempt(sessions);
    const top = groups[0]!.rows.map((n) => n.session.sessionId);
    expect(top).toEqual(['rev', 'wrk']);
    const rev = groups[0]!.rows.find((n) => n.session.sessionId === 'rev')!;
    expect(rev.children.map((n) => n.session.sessionId)).toEqual(['int']);
  });

  it('empty input yields no groups', () => {
    expect(groupSessionsByAttempt([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Transcript view routing (§V5-2)
// ---------------------------------------------------------------------------

describe('Sessions tab routing (list ⇄ transcript)', () => {
  it('starts on the list, opens a transcript on row click, returns on back', () => {
    let view: SessionsTabView = SESSIONS_LIST_VIEW;
    expect(view.mode).toBe('list');
    view = openSessionTranscript('agt-001-x');
    expect(view).toEqual({ mode: 'transcript', sessionId: 'agt-001-x' });
    view = backToSessionList();
    expect(view).toEqual({ mode: 'list' });
    expect(view).toBe(SESSIONS_LIST_VIEW);
  });

  it('reviewed-chip navigation routes to the REVIEWED session transcript', () => {
    const reviewer = fakeSession({ sessionId: 'rev', role: 'reviewer', reviewOfSessionId: 'wrk' });
    const view = openSessionTranscript(reviewer.reviewOfSessionId!);
    expect(view).toEqual({ mode: 'transcript', sessionId: 'wrk' });
  });

  it('parent-chip navigation routes between sessions without leaving transcript mode', () => {
    const child = fakeSession({ sessionId: 'child', parentSessionId: 'coord' });
    let view = openSessionTranscript(child.sessionId);
    view = openSessionTranscript(child.parentSessionId!);
    expect(view).toEqual({ mode: 'transcript', sessionId: 'coord' });
  });
});

// ---------------------------------------------------------------------------
// Store intents (§V5-2/§V5-4)
// ---------------------------------------------------------------------------

describe('store wiring (§V5-2 default tab, §V5-4 intents)', () => {
  it('openInspectorCard lands on SESSIONS for an agent-less human-review card (driven sim)', () => {
    const { backend, store, flush } = makeRig(42);
    const sim = backend.sim;
    const single = sim
      .listCardViews()
      .find((c) => c.column === 'backlog' && c.parentId === null && c.childIds.length === 0)!;
    sim.moveCard(single.taskId, 'do');
    for (let i = 0; i < 4000 && sim.listCardViews().find((c) => c.taskId === single.taskId)!.column !== 'human-review'; i += 5) {
      sim.tick(5);
      for (const inquiry of sim.listInquiries()) {
        sim.answerInquiry(inquiry.hookRequestId, inquiry.options[0]!.id);
      }
    }
    flush();
    const card = store.getState().board.cards[single.taskId]!;
    expect(card.view.column).toBe('human-review');
    expect(card.view.agentIds).toHaveLength(0);

    store.getState().openInspectorCard(single.taskId);
    expect(store.getState().meta.inspectorTaskId).toBe(single.taskId);
    expect(store.getState().meta.inspectorTab).toBe('sessions');

    // §V5-1 cross-check: the sim holds persisted worker + reviewer sessions.
    const sessions = sim.listSessions(single.taskId);
    expect(sessions.some((s) => s.role === 'worker')).toBe(true);
    expect(sessions.some((s) => s.role === 'reviewer')).toBe(true);
  });

  it('openInspectorCard keeps the Process default for a fresh backlog card', () => {
    const { backend, store } = makeRig(42);
    const single = backend.sim
      .listCardViews()
      .find((c) => c.column === 'backlog' && c.parentId === null && c.childIds.length === 0)!;
    store.getState().openInspectorCard(single.taskId);
    expect(store.getState().meta.inspectorTab).toBe('process');
  });

  it('retargeting preserves a card-supported tab; Sessions counts as supported', () => {
    const store = createCommanderStore();
    store.getState().openInspector('u1');
    store.getState().setInspectorTab('sessions');
    store.getState().openInspectorCard('t1');
    expect(store.getState().meta.inspectorTab).toBe('sessions');
  });

  it('openInspectorSessions deep-links the Sessions tab and closes the review panel', () => {
    const store = createCommanderStore();
    store.getState().openReview('t1');
    store.getState().openInspectorSessions('t1');
    const meta = store.getState().meta;
    expect(meta.inspectorTaskId).toBe('t1');
    expect(meta.inspectorUnitId).toBeNull();
    expect(meta.inspectorTab).toBe('sessions');
    expect(meta.reviewTaskId).toBeNull();
  });

  it('openRegistryStack records the routed stackRef (stub for the registry phase)', () => {
    const store = createCommanderStore();
    expect(store.getState().meta.registryStackRef).toBeNull();
    store.getState().openRegistryStack('stk-02');
    expect(store.getState().meta.registryStackRef).toBe('stk-02');
  });
});
