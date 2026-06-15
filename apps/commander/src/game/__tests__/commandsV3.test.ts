/**
 * executeIntent routing tests (SPEC-V3 verb set): every command card intent
 * lands on a REAL sim verb (`moveCard`/`setYolo`/`createTask`/steer via
 * `session.message`/`hook.decision`) or a visible store mutation — verified
 * against the live sim + store rig (never a UI-only success, §V2-2).
 */
import { describe, expect, it } from 'vitest';

import { MockBackend } from '../../backend/mock/mockBackend';
import { executeIntent, getCommandSpecs } from '../commands';
import { buildCommandContext } from '../selectors';
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

function tickFlush(rig: Rig, n: number): void {
  rig.backend.sim.tick(n);
  rig.binding.flush();
}

/** First single (stack-free) backlog card. */
function singleBacklogCard(rig: Rig): string {
  const card = rig.backend.sim
    .listCardViews()
    .find((c) => c.parentId === null && c.childIds.length === 0 && c.column === 'backlog');
  expect(card).toBeDefined();
  return card!.taskId;
}

/** Select an entity in the store. */
function select(rig: Rig, id: string): void {
  rig.store.getState().clickSelect(id, false);
}

describe('board lens → CommandContext (§V3-7: column/kind/yolo/roles)', () => {
  it('buildCommandContext carries column, taskKind, yolo, merged and agent roles', () => {
    const rig = makeRig(42);
    const taskId = singleBacklogCard(rig);
    rig.backend.sim.setYolo(taskId, true);
    rig.binding.flush();
    select(rig, taskId);

    let ctx = buildCommandContext(rig.store.getState());
    expect(ctx.cards).toHaveLength(1);
    expect(ctx.cards[0]).toMatchObject({
      taskId,
      column: 'backlog',
      yolo: true,
      merged: false,
      inquiryPending: false,
      agentRoles: [],
    });
    expect(typeof ctx.cards[0]!.taskKind).toBe('string');

    rig.backend.sim.moveCard(taskId, 'do');
    rig.binding.flush();
    ctx = buildCommandContext(rig.store.getState());
    expect(ctx.cards[0]!.column).toBe('do');
    expect(ctx.cards[0]!.agentRoles).toEqual(['worker']);
    expect(ctx.cards[0]!.runStage).not.toBeNull(); // §V2-5 run stage
  });

  it('selecting a working AGENT pulls its card into context (kind layer source)', () => {
    const rig = makeRig(42);
    const taskId = singleBacklogCard(rig);
    rig.backend.sim.moveCard(taskId, 'do');
    rig.binding.flush();
    const unitId = rig.store.getState().world.unitIds[0]!;
    select(rig, unitId);
    const ctx = buildCommandContext(rig.store.getState());
    expect(ctx.cards.map((c) => c.taskId)).toEqual([taskId]);
    expect(ctx.cards[0]!.column).toBe('do');
  });
});

describe('executeIntent → real sim verbs', () => {
  it('move-card (Start Work) moves the selected backlog card to DO and spawns a worker', () => {
    const rig = makeRig(42);
    const taskId = singleBacklogCard(rig);
    select(rig, taskId);

    const startWork = getCommandSpecs(rig.store.getState()).find((s) => s.id === 'start-work');
    expect(startWork).toBeDefined();
    executeIntent(startWork!.intent, rig.store, rig.binding.orders);

    const card = rig.backend.sim.listCardViews().find((c) => c.taskId === taskId)!;
    expect(card.column).toBe('do');
    expect(card.agentIds.length).toBe(1); // worker spawned (§V3-2)
    expect(rig.store.getState().events.some((e) => /moved to do/i.test(e.text))).toBe(true);
  });

  it('set-yolo toggles the sim yolo flag both ways', () => {
    const rig = makeRig(42);
    const taskId = singleBacklogCard(rig);
    select(rig, taskId);

    executeIntent({ kind: 'set-yolo', on: true }, rig.store, rig.binding.orders);
    expect(rig.backend.sim.listCardViews().find((c) => c.taskId === taskId)!.yolo).toBe(true);
    // The command card now offers Unset Yolo with the off intent.
    const unset = getCommandSpecs(rig.store.getState()).find((s) => s.id === 'set-yolo');
    expect(unset?.label).toBe('Unset Yolo');
    executeIntent(unset!.intent, rig.store, rig.binding.orders);
    expect(rig.backend.sim.listCardViews().find((c) => c.taskId === taskId)!.yolo).toBe(false);
  });

  it('prioritize bumps the backlog card to the top of the lane', () => {
    const rig = makeRig(42);
    const cards = rig.backend.sim
      .listCardViews()
      .filter((c) => c.parentId === null && c.column === 'backlog')
      .sort((a, b) => a.order - b.order);
    const last = cards[cards.length - 1]!;
    select(rig, last.taskId);
    executeIntent({ kind: 'prioritize' }, rig.store, rig.binding.orders);
    const after = rig.backend.sim
      .listCardViews()
      .filter((c) => c.parentId === null && c.column === 'backlog')
      .sort((a, b) => a.order - b.order);
    expect(after[0]!.taskId).toBe(last.taskId);
  });

  it('commission-task creates a real backlog card via the sim verb', () => {
    const rig = makeRig(42);
    const before = rig.backend.sim.listCardViews().length;
    executeIntent({ kind: 'commission-task' }, rig.store, rig.binding.orders);
    const cards = rig.backend.sim.listCardViews();
    expect(cards.length).toBe(before + 1);
    const created = cards.find((c) => c.taskId.startsWith('adr-c'))!;
    expect(created.column).toBe('backlog');
  });

  it('task-action (kind verb) steers the attending agent: message count rises and the order is logged', () => {
    const rig = makeRig(42);
    const taskId = singleBacklogCard(rig);
    rig.backend.sim.moveCard(taskId, 'do');
    rig.binding.flush();
    select(rig, taskId);
    const agentBefore = rig.backend.sim.listActiveAgentViews()[0]!;

    executeIntent(
      { kind: 'task-action', action: 'run-tests', prompt: 'Run the test suite against the patch (vitest)' },
      rig.store,
      rig.binding.orders,
    );

    const agentAfter = rig.backend.sim.listActiveAgentViews().find((a) => a.unitId === agentBefore.unitId)!;
    expect(agentAfter.messageCount).toBe(agentBefore.messageCount + 1); // real session.message
    expect(rig.store.getState().events.some((e) => /order relayed — run the test suite/i.test(e.text))).toBe(true);
  });

  it('abort on a selected DO card bounces it to backlog and despawns its agents', () => {
    const rig = makeRig(42);
    const taskId = singleBacklogCard(rig);
    rig.backend.sim.moveCard(taskId, 'do');
    rig.binding.flush();
    select(rig, taskId);

    executeIntent({ kind: 'abort' }, rig.store, rig.binding.orders);

    const card = rig.backend.sim.listCardViews().find((c) => c.taskId === taskId)!;
    expect(card.column).toBe('backlog');
    expect(rig.backend.sim.listActiveAgentViews()).toHaveLength(0);
  });

  it('pause-unit / hold-merge toggle operator holds over the attending agents', () => {
    const rig = makeRig(42);
    const taskId = singleBacklogCard(rig);
    rig.backend.sim.moveCard(taskId, 'do');
    rig.binding.flush();
    tickFlush(rig, 5);
    select(rig, taskId);
    const unitId = rig.backend.sim.listActiveAgentViews()[0]!.unitId;

    executeIntent({ kind: 'pause-unit' }, rig.store, rig.binding.orders);
    expect(rig.backend.sim.listActiveAgentViews().find((a) => a.unitId === unitId)!.paused).toBe(true);
    executeIntent({ kind: 'hold-merge' }, rig.store, rig.binding.orders); // release (same toggle)
    expect(rig.backend.sim.listActiveAgentViews().find((a) => a.unitId === unitId)!.paused).toBe(false);
  });

  it('open-review opens the review panel for the selected card; Esc closes it first (§V3-7 cascade)', () => {
    const rig = makeRig(42);
    const taskId = singleBacklogCard(rig);
    select(rig, taskId);
    executeIntent({ kind: 'open-review' }, rig.store, rig.binding.orders);
    expect(rig.store.getState().meta.reviewTaskId).toBe(taskId);
    rig.store.getState().escape();
    expect(rig.store.getState().meta.reviewTaskId).toBeNull();
    expect(rig.store.getState().selection.ids).toEqual([taskId]); // selection survives
  });

  it('orders.answerInquiry resolves a live inquiry through hook.decision with the optionId', () => {
    const rig = makeRig(42);
    for (const card of rig.backend.sim.listCardViews()) {
      if (card.parentId === null && card.childIds.length === 0) {
        rig.backend.sim.moveCard(card.taskId, 'do');
      }
    }
    rig.binding.flush();
    let inquiries = rig.backend.sim.listInquiries();
    for (let i = 0; i < 600 && inquiries.length === 0; i += 10) {
      tickFlush(rig, 10);
      inquiries = rig.backend.sim.listInquiries();
    }
    expect(inquiries.length).toBeGreaterThan(0);
    const inquiry = inquiries[0]!;
    const option = inquiry.options[inquiry.options.length - 1]!;

    rig.binding.orders.answerInquiry(inquiry.hookRequestId, option.id);

    expect(rig.backend.sim.listInquiries().find((i) => i.hookRequestId === inquiry.hookRequestId)).toBeUndefined();
    // The sim records the chosen branch in the journal/events (inquiry_resolved).
    const observation = rig.backend.sim.getRunObservation(inquiry.taskId);
    expect(
      observation?.journal.some(
        (e) => e.type === 'EFFECT_RESOLVED' && JSON.stringify(e.data).includes(option.id),
      ),
    ).toBe(true);
  });

  it('inspect on an agent-less card opens the card-mode Inspector (Process tab, §V2-5)', () => {
    const rig = makeRig(42);
    const taskId = singleBacklogCard(rig);
    select(rig, taskId);
    executeIntent({ kind: 'inspect' }, rig.store, rig.binding.orders);
    expect(rig.store.getState().meta.inspectorUnitId).toBeNull();
    expect(rig.store.getState().meta.inspectorTaskId).toBe(taskId);
    expect(rig.store.getState().meta.inspectorTab).toBe('process');
  });

  it('open-diff deep-links the Inspector Workspace tab (§V2-2)', () => {
    const rig = makeRig(42);
    const taskId = singleBacklogCard(rig);
    rig.backend.sim.moveCard(taskId, 'do');
    rig.binding.flush();
    select(rig, taskId);
    executeIntent({ kind: 'open-diff' }, rig.store, rig.binding.orders);
    expect(rig.store.getState().meta.inspectorUnitId).not.toBeNull();
    expect(rig.store.getState().meta.inspectorTab).toBe('workspace');
  });

  it('inspect on a working card opens the inspector on its attending agent', () => {
    const rig = makeRig(42);
    const taskId = singleBacklogCard(rig);
    rig.backend.sim.moveCard(taskId, 'do');
    rig.binding.flush();
    select(rig, taskId);
    executeIntent({ kind: 'inspect' }, rig.store, rig.binding.orders);
    expect(rig.store.getState().meta.inspectorUnitId).toBe(
      rig.backend.sim.listActiveAgentViews()[0]!.unitId,
    );
  });
});
