/**
 * EDITORS-V4 logic tests (SPEC-V4 §V4-5):
 *   - card-editor diff-patch building (Save carries ONLY changed fields),
 *   - parent-select legality (backlog-only; other backlog parents/singles),
 *   - stack Forge-From clone defaults ("<src> Mk II", full spec copy) and the
 *     Stacks-tab draft state machine (blank → forge-from → edit-in-place),
 *   - Orders routing for updateTask / upsertStack against the live sim rig,
 *   - Edit Card command exposure per column + the §V4-13 Esc cascade tier.
 */
import { describe, expect, it } from 'vitest';

import { MockBackend } from '../../backend/mock/mockBackend';
import type { SimCardView, SimStackView } from '../../backend/mock/simulation';
import { generateCommands } from '../../microagent/mock/commandGen';
import type { BoardColumn, CardContextSummary, CommandContext } from '../../microagent/types';
import {
  buildCardPatch,
  draftFromCard,
  legalParentIds,
  parentEditable,
  patchIsEmpty,
  workspaceOptions,
} from '../cardEditor';
import { executeIntent } from '../commands';
import {
  blankStackDraft,
  draftToStackInput,
  editStackDraft,
  forgeFromStack,
  personalityExcerpt,
  withAdapter,
} from '../stackForge';
import {
  bindBackendToStore,
  createCommanderStore,
  type BackendBinding,
  type CommanderStore,
} from '../store';

interface Rig {
  backend: MockBackend;
  store: CommanderStore;
  binding: BackendBinding;
}

function makeRig(seed: number): Rig {
  const backend = new MockBackend({ seed, autoStart: false });
  const store = createCommanderStore();
  const binding = bindBackendToStore(store, backend);
  binding.flush();
  return { backend, store, binding };
}

function cardView(overrides: Partial<SimCardView> = {}): SimCardView {
  return {
    taskId: 'adr-01',
    taskKind: 'implement',
    title: 'Forge the new mechanism',
    repository: 'a5c-ai/frontier',
    workspaceId: 'ws-01-frontier',
    column: 'backlog',
    order: 0,
    yolo: false,
    merged: false,
    progress: 0,
    parentId: null,
    childIds: [],
    agentIds: [],
    attempt: 1,
    feedback: null,
    dirtyFileCount: 0,
    hasPendingInquiry: false,
    stackRef: 'stk-01',
    description: 'original description',
    releaseId: null,
    compacted: false,
    workerAgentId: null,
    reviewerAgentId: null,
    humanAssigneeId: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Diff-patch building (§V4-5: Save applies ONLY the changed fields)
// ---------------------------------------------------------------------------

describe('buildCardPatch — only changed fields (§V4-5)', () => {
  it('an untouched draft yields an empty patch', () => {
    const view = cardView();
    const patch = buildCardPatch(view, draftFromCard(view));
    expect(patch).toEqual({});
    expect(patchIsEmpty(patch)).toBe(true);
  });

  it('carries exactly the fields that changed', () => {
    const view = cardView();
    const draft = draftFromCard(view);
    draft.title = 'Recalibrate The Aether Capacitor';
    draft.taskKind = 'migrate';
    draft.yolo = true;
    const patch = buildCardPatch(view, draft);
    expect(patch).toEqual({
      title: 'Recalibrate The Aether Capacitor',
      taskKind: 'migrate',
      yolo: true,
    });
  });

  it('description / workspace / stack changes are carried individually', () => {
    const view = cardView();
    const draft = draftFromCard(view);
    draft.description = 'rewritten';
    draft.workspaceId = 'ws-02-bastion';
    draft.stackRef = 'stk-c01';
    expect(buildCardPatch(view, draft)).toEqual({
      description: 'rewritten',
      workspaceId: 'ws-02-bastion',
      stackRef: 'stk-c01',
    });
  });

  it('a blank title is never emitted (the card keeps its name)', () => {
    const view = cardView();
    const draft = draftFromCard(view);
    draft.title = '   ';
    expect(buildCardPatch(view, draft)).toEqual({});
  });

  it("parentId '' maps to null (detach) and only emits when actually changed", () => {
    const withParent = cardView({ parentId: 'adr-09' });
    const detach = draftFromCard(withParent);
    detach.parentId = '';
    expect(buildCardPatch(withParent, detach)).toEqual({ parentId: null });

    const attach = draftFromCard(cardView());
    attach.parentId = 'adr-09';
    expect(buildCardPatch(cardView(), attach)).toEqual({ parentId: 'adr-09' });
  });

  it('parent changes are GATED by the backlog legality rule (§V4-5)', () => {
    const inDo = cardView({ column: 'do' });
    const draft = draftFromCard(inDo);
    draft.parentId = 'adr-09';
    expect(parentEditable(inDo)).toBe(false);
    expect(buildCardPatch(inDo, draft)).toEqual({});
  });
});

describe('parent-select legality + workspace options (§V4-5)', () => {
  const cards = [
    cardView({ taskId: 'a', column: 'backlog', parentId: null }),
    cardView({ taskId: 'b', column: 'backlog', parentId: null, childIds: ['c'] }),
    cardView({ taskId: 'c', column: 'backlog', parentId: 'b' }), // child — illegal parent
    cardView({ taskId: 'd', column: 'do', parentId: null }), // not in backlog
    cardView({ taskId: 'e', column: 'backlog', parentId: null, workspaceId: 'ws-02-bastion' }),
  ];

  it('lists OTHER backlog parents/singles only (never self, children or non-backlog)', () => {
    expect(legalParentIds('a', cards)).toEqual(['b', 'e']);
    expect(legalParentIds('zz', cards)).toEqual(['a', 'b', 'e']);
  });

  it('parentEditable is true only in backlog', () => {
    expect(parentEditable(cardView({ column: 'backlog' }))).toBe(true);
    for (const column of ['do', 'ai-review', 'human-review', 'approved', 'merged', 'in-production'] as const) {
      expect(parentEditable(cardView({ column })), column).toBe(false);
    }
  });

  it('workspaceOptions derives the distinct sorted workspace ids', () => {
    expect(workspaceOptions(cards)).toEqual(['ws-01-frontier', 'ws-02-bastion']);
  });
});

// ---------------------------------------------------------------------------
// Stack forge drafts (§V4-5 "create agents from agents")
// ---------------------------------------------------------------------------

function stackView(overrides: Partial<SimStackView> = {}): SimStackView {
  return {
    stackRef: 'stk-01',
    name: 'Meticulous Reviewer',
    custom: false,
    stack: {
      apiVersion: 'kradle.a5c.ai/v1alpha1',
      kind: 'AgentStack',
      metadata: { name: 'Meticulous Reviewer', namespace: 'kradle-system' },
      spec: {
        baseAgent: 'claude-code',
        adapter: 'claude-code',
        model: 'claude-sonnet-4-5',
        prompt: { system: 'Reads every diff twice. Trusts nothing.', developer: 'Cite lines.' },
        approvalMode: 'prompt',
      },
      status: { phase: 'ready' },
    },
    ...overrides,
  };
}

describe('stack clone defaults + Stacks-tab draft state (§V4-5)', () => {
  it("forgeFromStack suggests '<src> Mk II', copies the spec and drops the stackRef", () => {
    const draft = forgeFromStack(stackView());
    expect(draft.stackRef).toBeNull(); // a fresh stk-cNN will be minted
    expect(draft.name).toBe('Meticulous Reviewer Mk II');
    expect(draft.adapter).toBe('claude-code');
    expect(draft.baseAgent).toBe('claude-code');
    expect(draft.model).toBe('claude-sonnet-4-5');
    expect(draft.approvalMode).toBe('prompt');
    expect(draft.system).toBe('Reads every diff twice. Trusts nothing.');
    expect(draft.developer).toBe('Cite lines.');
  });

  it('editStackDraft keeps the stackRef (save updates in place)', () => {
    const draft = editStackDraft(stackView({ stackRef: 'stk-c03', custom: true }));
    expect(draft.stackRef).toBe('stk-c03');
    expect(draft.name).toBe('Meticulous Reviewer');
  });

  it('the blank draft is not saveable; a named draft builds a valid upsert input', () => {
    expect(draftToStackInput(blankStackDraft())).toBeNull();
    const draft = { ...forgeFromStack(stackView()), developer: '' };
    const input = draftToStackInput(draft);
    expect(input).not.toBeNull();
    expect(input!.stackRef).toBeUndefined();
    expect(input!.metadata.name).toBe('Meticulous Reviewer Mk II');
    expect(input!.spec.prompt.developer).toBeUndefined(); // optional stays optional
    const editing = draftToStackInput({ ...draft, stackRef: 'stk-c02' });
    expect(editing!.stackRef).toBe('stk-c02');
  });

  it('withAdapter rebinds baseAgent and resets the model to the family default', () => {
    const draft = withAdapter(forgeFromStack(stackView()), 'codex');
    expect(draft.adapter).toBe('codex');
    expect(draft.baseAgent).toBe('codex');
    expect(draft.model).toBe('gpt-5.2-codex');
  });

  it('personalityExcerpt takes the first sentence (clamped) and survives blanks', () => {
    expect(personalityExcerpt('Reads every diff twice. Trusts nothing.')).toBe(
      'Reads every diff twice.',
    );
    expect(personalityExcerpt('no terminal punctuation')).toBe('no terminal punctuation');
    expect(personalityExcerpt('')).toContain('no personality');
    expect(personalityExcerpt(`${'x'.repeat(200)}.`).length).toBeLessThanOrEqual(90);
  });
});

// ---------------------------------------------------------------------------
// Orders routing (§V4-5 verbs against the live sim)
// ---------------------------------------------------------------------------

describe('Orders routing — updateTask / upsertStack (§V4-5)', () => {
  it('orders.updateTask applies the patch via the sim and tickers a task_updated line', () => {
    const rig = makeRig(42);
    const card = rig.backend.sim
      .listCardViews()
      .find((c) => c.column === 'backlog' && c.parentId === null)!;

    const ok = rig.binding.orders.updateTask(card.taskId, {
      title: 'Recalibrate The Aether Capacitor',
      yolo: !card.yolo,
    });
    expect(ok).toBe(true);

    const after = rig.backend.sim.listCardViews().find((c) => c.taskId === card.taskId)!;
    expect(after.title).toBe('Recalibrate The Aether Capacitor');
    expect(after.yolo).toBe(!card.yolo);
    expect(
      rig.store.getState().events.some((e) => /card updated/i.test(e.text)),
      'task_updated must reach the ticker',
    ).toBe(true);
  });

  it('orders.updateTask returns false (and applies nothing) for an unknown stackRef', () => {
    const rig = makeRig(42);
    const card = rig.backend.sim.listCardViews()[0]!;
    expect(rig.binding.orders.updateTask(card.taskId, { stackRef: 'stk-c99' })).toBe(false);
  });

  it('orders.upsertStack mints stk-cNN, surfaces it in listStacks and tickers stack_forged; a known ref updates in place', () => {
    const rig = makeRig(42);
    const input = draftToStackInput({
      ...forgeFromStack(stackView()),
      name: 'Cobalt Lamplighter',
      system: 'Speaks only in measured couplets.',
    })!;

    const stackRef = rig.binding.orders.upsertStack(input);
    expect(stackRef).toMatch(/^stk-c\d{2}$/);

    const listed = rig.backend.sim.listStacks().find((s) => s.stackRef === stackRef);
    expect(listed?.name).toBe('Cobalt Lamplighter');
    expect(listed?.custom).toBe(true);
    expect(
      rig.store.getState().events.some((e) => /stack forged — cobalt lamplighter/i.test(e.text)),
      'stack_forged must reach the ticker with the stk-cNN id',
    ).toBe(true);

    // Edit-in-place: same ref, new personality.
    const updated = rig.binding.orders.upsertStack({
      ...input,
      stackRef: stackRef!,
      spec: { ...input.spec, prompt: { system: 'Now speaks in prose.' } },
    });
    expect(updated).toBe(stackRef);
    expect(
      rig.backend.sim.listStacks().find((s) => s.stackRef === stackRef)?.stack.spec.prompt.system,
    ).toBe('Now speaks in prose.');

    // The card editor's stack select source (listStacks) now carries 4 seeded + 1 custom.
    expect(rig.backend.sim.listStacks().length).toBeGreaterThanOrEqual(5);
  });

  it('a card bound to a forged stack spawns its next worker FROM that stack (AC40 sim side)', () => {
    const rig = makeRig(42);
    const stackRef = rig.binding.orders.upsertStack(
      draftToStackInput({ ...forgeFromStack(stackView()), name: 'Vermilion Auditor' })!,
    )!;
    const card = rig.backend.sim
      .listCardViews()
      .find((c) => c.column === 'backlog' && c.parentId === null && c.childIds.length === 0)!;
    expect(rig.binding.orders.updateTask(card.taskId, { stackRef })).toBe(true);

    rig.binding.orders.moveCard(card.taskId, 'do');
    for (let i = 0; i < 200; i += 5) {
      const agents = rig.backend.sim.listActiveAgentViews().filter((a) => a.taskId === card.taskId);
      if (agents.length > 0) {
        expect(agents[0]!.stackRef).toBe(stackRef);
        expect(agents[0]!.stackName).toBe('Vermilion Auditor');
        return;
      }
      rig.backend.sim.tick(5);
    }
    throw new Error('no worker spawned for the bound card within 200 ticks');
  });
});

// ---------------------------------------------------------------------------
// Edit Card command exposure + Esc cascade tier (§V4-5 / §V4-13)
// ---------------------------------------------------------------------------

function cardCtx(column: BoardColumn, overrides: Partial<CardContextSummary> = {}): CommandContext {
  const card: CardContextSummary = {
    taskId: 'adr-01',
    taskKind: 'implement',
    column,
    runStage: null,
    inquiryPending: false,
    workspaceDirty: false,
    yolo: false,
    merged: column === 'merged' || column === 'in-production',
    agentRoles: [],
    ...overrides,
  };
  return {
    selection: { count: 1, kinds: ['task'], states: [], adapters: [], taskStates: ['queued'], pausedUnits: 0 },
    alerts: [],
    fleet: { totalUnits: 0, idleUnits: 0, busyUnits: 0, pendingAlerts: 0, simPaused: true },
    cards: [card],
  };
}

describe('Edit Card command + card-editor store wiring (§V4-5)', () => {
  it('Edit Card is offered on every non-merged / non-in-production column, never on the rail tail', () => {
    for (const column of ['backlog', 'do', 'ai-review', 'human-review', 'approved'] as const) {
      const ids = generateCommands(cardCtx(column)).map((s) => s.id);
      expect(ids, column).toContain('edit-card');
      expect(ids.length).toBeLessThanOrEqual(12);
    }
    for (const column of ['merged', 'in-production'] as const) {
      expect(generateCommands(cardCtx(column)).map((s) => s.id), column).not.toContain('edit-card');
    }
  });

  it('executeIntent(edit-card) opens the editor for the selected card', () => {
    const rig = makeRig(42);
    const taskId = rig.backend.sim.listCardViews()[0]!.taskId;
    rig.store.getState().select([taskId]);
    executeIntent({ kind: 'edit-card' }, rig.store, rig.binding.orders);
    expect(rig.store.getState().meta.cardEditorTaskId).toBe(taskId);
  });

  it('Esc closes the card editor FIRST (foundry/archive tier), before review/steer/inspector', () => {
    const store = createCommanderStore();
    const s = store.getState();
    s.openInspector('u1');
    s.openSteer();
    s.openReview('t1');
    s.openFoundry();
    s.openCardEditor('t1');

    store.getState().escape();
    expect(store.getState().meta.cardEditorTaskId).toBeNull(); // editor tier
    expect(store.getState().meta.foundryOpen).toBe(true);
    store.getState().escape();
    expect(store.getState().meta.foundryOpen).toBe(false); // foundry tier
    store.getState().escape();
    expect(store.getState().meta.reviewTaskId).toBeNull(); // review tier
    store.getState().escape();
    expect(store.getState().meta.steerOpen).toBe(false); // steer tier
    store.getState().escape();
    expect(store.getState().meta.inspectorUnitId).toBeNull(); // inspector tier
  });
});
