/**
 * Board logic tests (SPEC-V3 §V3-1/§V3-3): drag-verb mapping (planDrop /
 * legalUserMove), stack drag integrity through the sim verb, lane composition
 * selectors, and the `is-moving` animation registry lifecycle at store level.
 * Plus Archive layout determinism (§V2-3).
 */
import { describe, expect, it } from 'vitest';

import { MockBackend } from '../../backend/mock/mockBackend';
import {
  cardsForColumn,
  childrenOf,
  isDraggable,
  legalUserMove,
  planDrop,
  COLUMNS,
} from '../board';
import { computeMemoryLayout, sanitizeNodeId } from '../memoryLayout';
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

describe('drag-verb mapping (§V3-1 legality)', () => {
  it('legalUserMove: backlog→do + backlog reorder; human-review→do|ai-review|approved; nothing else', () => {
    const allowed = new Set([
      'backlog>do',
      'backlog>backlog',
      'human-review>do',
      'human-review>ai-review',
      'human-review>approved',
    ]);
    for (const from of COLUMNS) {
      for (const to of COLUMNS) {
        expect(legalUserMove(from, to), `${from} -> ${to}`).toBe(allowed.has(`${from}>${to}`));
      }
    }
  });

  it('planDrop maps a legal drop to moveCard args and everything else to snap-back (null)', () => {
    const card = { taskId: 'adr-01', column: 'backlog' as const, parentId: null, merged: false };
    expect(planDrop(card, 'do')).toEqual({ taskId: 'adr-01', column: 'do' });
    expect(planDrop(card, 'backlog')).toEqual({ taskId: 'adr-01', column: 'backlog' });
    expect(planDrop(card, 'approved')).toBeNull();
    expect(planDrop(card, null)).toBeNull();
    // Stack children and merged cards never drag (§V3-1: drag the parent).
    expect(planDrop({ ...card, parentId: 'adr-00' }, 'do')).toBeNull();
    expect(planDrop({ ...card, merged: true }, 'do')).toBeNull();
    expect(isDraggable({ column: 'do', parentId: null, merged: false })).toBe(false);
    expect(isDraggable({ column: 'human-review', parentId: null, merged: false })).toBe(true);
  });
});

describe('stack drag integrity (§V3-1: dragging a parent moves the whole stack)', () => {
  it('moveCard on a stack parent moves every child and spawns one worker per child', () => {
    const rig = makeRig(42);
    const cards = rig.backend.sim.listCardViews();
    const parent = cards.find((c) => c.parentId === null && c.childIds.length >= 2);
    expect(parent).toBeDefined();

    rig.binding.orders.moveCard(parent!.taskId, 'do');
    const after = rig.backend.sim.listCardViews();
    const movedParent = after.find((c) => c.taskId === parent!.taskId)!;
    expect(movedParent.column).toBe('do');
    for (const childId of parent!.childIds) {
      const child = after.find((c) => c.taskId === childId)!;
      expect(child.column).toBe('do');
      expect(child.agentIds.length).toBe(1); // each child gets its own worker
    }
    // Dragging a child directly is refused by the sim.
    expect(rig.backend.sim.moveCard(parent!.childIds[0]!, 'backlog')).toBe(false);
  });
});

describe('lane composition selectors', () => {
  it('cardsForColumn: top-level only, backlog by order, approved merges last; children resolve in order', () => {
    const rig = makeRig(42);
    const views = rig.store.getState().board.cardIds.map((id) => rig.store.getState().board.cards[id]!.view);
    const backlog = cardsForColumn(views, 'backlog');
    expect(backlog.length).toBeGreaterThanOrEqual(3);
    expect(backlog.every((c) => c.parentId === null)).toBe(true);
    for (let i = 1; i < backlog.length; i += 1) {
      expect(backlog[i]!.order).toBeGreaterThanOrEqual(backlog[i - 1]!.order);
    }
    const stack = backlog.find((c) => c.childIds.length > 0) ?? views.find((c) => c.childIds.length > 0);
    expect(stack).toBeDefined();
    expect(childrenOf(views, stack!).map((c) => c.taskId)).toEqual(stack!.childIds);
  });

  it('approved lane sorts merged seal-rows after live cards', () => {
    const live = (id: string, merged: boolean) => ({
      taskId: id,
      taskKind: 'fix' as const,
      title: id,
      repository: 'r',
      workspaceId: 'w',
      column: 'approved' as const,
      order: 0,
      yolo: false,
      merged,
      progress: 1,
      parentId: null,
      childIds: [],
      agentIds: [],
      attempt: 1,
      feedback: null,
      dirtyFileCount: 0,
      hasPendingInquiry: false,
      stackRef: 'stk-01',
      description: '',
      releaseId: null,
      compacted: false,
      workerAgentId: null,
      reviewerAgentId: null,
      humanAssigneeId: null,
      costUsd: 0,
      tokensBurned: 0,
      durationMs: null,
    });
    const lane = cardsForColumn([live('b', true), live('a', false), live('c', false)], 'approved');
    expect(lane.map((c) => c.taskId)).toEqual(['a', 'c', 'b']);
  });
});

describe('is-moving animation registry (§V3-3 store lifecycle)', () => {
  it('card_moved frames register a move; clearMoving retires it; seq grows per move', () => {
    const rig = makeRig(42);
    const card = rig.backend.sim
      .listCardViews()
      .find((c) => c.parentId === null && c.childIds.length === 0)!;

    rig.binding.orders.moveCard(card.taskId, 'do');
    let move = rig.store.getState().meta.movingCards[card.taskId];
    expect(move).toBeDefined();
    expect(move).toMatchObject({ from: 'backlog', to: 'do', reason: 'user-move' });
    const firstSeq = move!.seq;

    rig.store.getState().clearMoving(card.taskId);
    expect(rig.store.getState().meta.movingCards[card.taskId]).toBeUndefined();

    // Work the card until the sim auto-moves it (work-complete → ai-review).
    for (let i = 0; i < 600; i += 10) {
      rig.backend.sim.tick(10);
      rig.binding.flush();
      if (rig.store.getState().meta.movingCards[card.taskId] !== undefined) break;
    }
    move = rig.store.getState().meta.movingCards[card.taskId];
    expect(move).toBeDefined();
    expect(move!.seq).toBeGreaterThan(firstSeq);
    expect(move!.from).toBe('do');
    // Auto-moves also land on the ticker (§V3-3 lane chip ticks + comms).
    expect(rig.store.getState().events.some((e) => /work complete|review/i.test(e.text))).toBe(true);
  });
});

describe('archive layout determinism (§V2-3)', () => {
  it('same records ⇒ byte-identical layout; testid sanitization maps ":" to "-"', () => {
    const rig = makeRig(42);
    const records = rig.backend.sim.listMemoryRecords();
    expect(records.length).toBeGreaterThanOrEqual(30);

    const a = computeMemoryLayout(records);
    const b = computeMemoryLayout(rig.backend.sim.listMemoryRecords());
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    expect(a.nodes.length).toBe(records.length);
    expect(a.edges.length).toBeGreaterThan(0);
    // Every edge is a quadratic <path> spec (census rule: never line/polyline).
    for (const edge of a.edges) {
      expect(edge.d).toMatch(/^M [\d.-]+ [\d.-]+ Q /);
    }
    expect(sanitizeNodeId('decision:adr-001')).toBe('decision-adr-001');
  });
});
