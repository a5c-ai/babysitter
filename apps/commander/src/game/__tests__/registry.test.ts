/**
 * Registry navigation state machine + store wiring (SPEC-V5 §V5-3/§V5-4):
 * - tab → list → detail (→ detail …) with breadcrumb back stack;
 * - cross-links push, registry-back pops, tab clicks reset;
 * - §V5-4 stack deep-link opens directly on the stack's detail;
 * - entity-list selectors (personality excerpt, stack sessions, tokens);
 * - store: openRegistry/closeRegistry/openRegistryStack/openRunsAt/
 *   openFoundryStacks and the Esc cascade slot (runs above registry).
 */
import { describe, expect, it } from 'vitest';

import {
  canRegistryBack,
  openRegistryDetail,
  personalityExcerpt,
  registryBack,
  REGISTRY_KINDS,
  registryHome,
  registryStackDeepLink,
  selectRegistryTab,
  sessionsOfStack,
  sessionTokensTotal,
  stackByRef,
} from '../registry';
import { createCommanderStore } from '../store';
import type { SimSessionView, SimStackView } from '../../backend/mock/simulation';

describe('registry navigation state machine (§V5-3)', () => {
  it('opens on the stacks list with an empty trail and no back control', () => {
    const state = registryHome();
    expect(state.current).toEqual({ tab: 'stacks', detailId: null });
    expect(state.trail).toEqual([]);
    expect(canRegistryBack(state)).toBe(false);
    expect(REGISTRY_KINDS).toEqual(['stacks', 'agents', 'tasks', 'workspaces']);
  });

  it('tab selection lands on that kind list and clears the trail', () => {
    let state = registryHome();
    state = openRegistryDetail(state, 'stacks', 'stk-01');
    state = selectRegistryTab(state, 'agents');
    expect(state.current).toEqual({ tab: 'agents', detailId: null });
    expect(state.trail).toEqual([]);
    // Re-selecting the already-shown list is a no-op (same reference).
    expect(selectRegistryTab(state, 'agents')).toBe(state);
  });

  it('detail opens push the breadcrumb; cross-links chain; back pops one level (AC48)', () => {
    // AC48 walk: agents list → session detail → stack detail → back.
    let state = selectRegistryTab(registryHome(), 'agents');
    state = openRegistryDetail(state, 'agents', 'unit-7');
    expect(state.current).toEqual({ tab: 'agents', detailId: 'unit-7' });
    expect(state.trail).toEqual([{ tab: 'agents', detailId: null }]);

    state = openRegistryDetail(state, 'stacks', 'stk-02');
    expect(state.current).toEqual({ tab: 'stacks', detailId: 'stk-02' });
    expect(state.trail).toHaveLength(2);
    expect(canRegistryBack(state)).toBe(true);

    state = registryBack(state);
    expect(state.current).toEqual({ tab: 'agents', detailId: 'unit-7' });
    state = registryBack(state);
    expect(state.current).toEqual({ tab: 'agents', detailId: null });
    expect(canRegistryBack(state)).toBe(false);
    // Back on a list with an empty trail is a no-op.
    expect(registryBack(state)).toBe(state);
  });

  it('re-opening the location already shown is a no-op (no self-push loops)', () => {
    let state = openRegistryDetail(registryHome(), 'tasks', 't-1');
    const same = openRegistryDetail(state, 'tasks', 't-1');
    expect(same).toBe(state);
    state = openRegistryDetail(state, 'tasks', 't-2');
    expect(state.trail).toHaveLength(2);
  });

  it('the §V5-4 stack deep-link opens the detail with the stacks list beneath it', () => {
    const state = registryStackDeepLink('stk-03');
    expect(state.current).toEqual({ tab: 'stacks', detailId: 'stk-03' });
    expect(canRegistryBack(state)).toBe(true);
    expect(registryBack(state).current).toEqual({ tab: 'stacks', detailId: null });
  });

  it('a detail with an empty trail backs out to its own tab list', () => {
    const state = registryBack({ current: { tab: 'workspaces', detailId: 'ws-01' }, trail: [] });
    expect(state.current).toEqual({ tab: 'workspaces', detailId: null });
  });
});

describe('entity-list selectors (§V5-3)', () => {
  const stack = (over: Partial<SimStackView> & { system?: string }): SimStackView => ({
    stackRef: over.stackRef ?? 'stk-01',
    name: over.name ?? 'Test Stack',
    custom: over.custom ?? false,
    stack: {
      metadata: { name: over.name ?? 'Test Stack' },
      spec: {
        baseAgent: 'claude-code',
        adapter: 'claude-code',
        model: 'claude-test-1',
        prompt: { system: over.system ?? 'A   stern\n  scribe of the cogitator.' },
        approvalMode: 'prompt',
      },
      status: { phase: 'ready' },
    },
  });

  it('personalityExcerpt collapses whitespace and clips with an ellipsis', () => {
    expect(personalityExcerpt(stack({}))).toBe('A stern scribe of the cogitator.');
    const long = personalityExcerpt(stack({ system: 'x'.repeat(200) }), 40);
    expect(long.length).toBeLessThanOrEqual(41);
    expect(long.endsWith('…')).toBe(true);
  });

  it('sessionsOfStack filters by stackRef preserving order; stackByRef resolves', () => {
    const s = (id: string, ref: string): SimSessionView =>
      ({ sessionId: id, stackRef: ref } as unknown as SimSessionView);
    const sessions = [s('a', 'stk-1'), s('b', 'stk-2'), s('c', 'stk-1')];
    expect(sessionsOfStack(sessions, 'stk-1').map((x) => x.sessionId)).toEqual(['a', 'c']);
    const stacks = [stack({ stackRef: 'stk-1' }), stack({ stackRef: 'stk-2', name: 'Other' })];
    expect(stackByRef(stacks, 'stk-2')?.name).toBe('Other');
    expect(stackByRef(stacks, 'stk-9')).toBeUndefined();
  });

  it('sessionTokensTotal sums input+output+thinking (cached excluded)', () => {
    const session = {
      tokenUsage: { inputTokens: 10, outputTokens: 20, thinkingTokens: 5, cachedTokens: 99 },
    } as unknown as SimSessionView;
    expect(sessionTokensTotal(session)).toBe(35);
  });
});

describe('store wiring (§V5-3/§V5-4)', () => {
  it('openRegistry opens fresh (no deep-link); closeRegistry clears both fields', () => {
    const store = createCommanderStore();
    store.getState().openRegistryStack('stk-02');
    store.getState().openRegistry();
    expect(store.getState().meta.registryOpen).toBe(true);
    expect(store.getState().meta.registryStackRef).toBeNull();
    store.getState().closeRegistry();
    expect(store.getState().meta.registryOpen).toBe(false);
  });

  it('openRunsAt opens the Runs overlay focused on the run; openRuns/closeRuns clear the focus', () => {
    const store = createCommanderStore();
    store.getState().openRunsAt('run-42-0001');
    expect(store.getState().meta.runsOpen).toBe(true);
    expect(store.getState().meta.runsFocusRunId).toBe('run-42-0001');
    store.getState().closeRuns();
    expect(store.getState().meta.runsFocusRunId).toBeNull();
    store.getState().openRunsAt('run-42-0002');
    store.getState().openRuns();
    expect(store.getState().meta.runsFocusRunId).toBeNull();
  });

  it('openFoundryStacks exits the registry into the Foundry STACKS tab; openFoundry lands on commission', () => {
    const store = createCommanderStore();
    store.getState().openRegistryStack('stk-01');
    store.getState().openFoundryStacks();
    const meta = store.getState().meta;
    expect(meta.foundryOpen).toBe(true);
    expect(meta.foundryTab).toBe('stacks');
    expect(meta.registryOpen).toBe(false);
    expect(meta.registryStackRef).toBeNull();
    store.getState().openFoundry();
    expect(store.getState().meta.foundryTab).toBe('commission');
  });

  it('Esc cascade: runs (with its deep-link focus) unwinds BEFORE the registry, then foundry', () => {
    const store = createCommanderStore();
    store.getState().openFoundry();
    store.getState().openRegistryStack('stk-01');
    store.getState().openRunsAt('run-42-0001');

    store.getState().escape();
    let meta = store.getState().meta;
    expect(meta.runsOpen).toBe(false);
    expect(meta.runsFocusRunId).toBeNull();
    expect(meta.registryOpen).toBe(true);

    store.getState().escape();
    meta = store.getState().meta;
    expect(meta.registryOpen).toBe(false);
    expect(meta.registryStackRef).toBeNull();
    expect(meta.foundryOpen).toBe(true);

    store.getState().escape();
    expect(store.getState().meta.foundryOpen).toBe(false);
  });
});
