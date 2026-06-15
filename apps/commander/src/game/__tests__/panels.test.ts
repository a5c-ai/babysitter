/**
 * UI-PANELS phase unit tests (SPEC-V2 §V2-5/§V2-7, SPEC-V3 §V3-4/§V3-5):
 * diff row classification, Inquiry Dock derivation + answer routing +
 * resolved bubble state, Human Review action routing, and Inspector tab
 * state (default / external set / card mode / Esc cascade slot).
 */
import { describe, expect, it, vi } from 'vitest';

import { MockBackend } from '../../backend/mock/mockBackend';
import { classifyDiffLine, parseDiffRows } from '../diff';
import { DOCK_VISIBLE_CAP, dockView } from '../inquiries';
import { approveAll, requestChanges } from '../review';
import {
  bindBackendToStore,
  createCommanderStore,
  type CommanderStore,
  type Orders,
} from '../store';
import type { SimInquiryView } from '../../backend/mock/simulation';

function makeRig(seed = 42): { backend: MockBackend; store: CommanderStore; orders: Orders; flush: () => void } {
  const backend = new MockBackend({ seed, autoStart: false });
  const store = createCommanderStore();
  const binding = bindBackendToStore(store, backend);
  binding.flush();
  return { backend, store, orders: binding.orders, flush: binding.flush };
}

function mockOrders(): Orders {
  return {
    abort: vi.fn(),
    steer: vi.fn(),
    decide: vi.fn(),
    pauseUnits: vi.fn(),
    resumeUnits: vi.fn(),
    prioritize: vi.fn(),
    toggleSim: vi.fn(),
    moveCard: vi.fn(),
    setYolo: vi.fn(),
    createTask: vi.fn(() => null),
    answerInquiry: vi.fn(),
    revertCard: vi.fn(),
    release: vi.fn(() => null),
    rollbackCard: vi.fn(),
    setSpeed: vi.fn(() => true),
    updateTask: vi.fn(() => true),
    upsertStack: vi.fn(() => null),
    updateProcessTemplate: vi.fn(() => null),
    writeFile: vi.fn(() => true),
    createRosterAgent: vi.fn().mockReturnValue(null),
    deleteRosterAgent: vi.fn(),
    assignTaskAgent: vi.fn(),
    assignTaskHuman: vi.fn(),
    focusInquiryCard: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Diff row classification (shared plate helper, §V2-7/§V3-4)
// ---------------------------------------------------------------------------

describe('diff row classification', () => {
  it('classifies addition / deletion / meta / context rows', () => {
    expect(classifyDiffLine('+const x = 1;')).toBe('add');
    expect(classifyDiffLine('-const x = 0;')).toBe('del');
    expect(classifyDiffLine('+++ b/src/x.ts')).toBe('meta');
    expect(classifyDiffLine('--- a/src/x.ts')).toBe('meta');
    expect(classifyDiffLine('@@ -1,4 +1,6 @@')).toBe('meta');
    expect(classifyDiffLine(' unchanged line')).toBe('context');
  });

  it('parses rows with markers stripped from add/del text', () => {
    const rows = parseDiffRows('@@ -1 +1 @@\n-old\n+new\n context');
    expect(rows.map((r) => r.kind)).toEqual(['meta', 'del', 'add', 'context']);
    expect(rows[1]).toMatchObject({ text: 'old', marker: '-' });
    expect(rows[2]).toMatchObject({ text: 'new', marker: '+' });
  });
});

// ---------------------------------------------------------------------------
// Inquiry dock derivation + answer routing (§V3-5, AC32)
// ---------------------------------------------------------------------------

function fakeInquiry(id: string): SimInquiryView {
  return {
    hookRequestId: id,
    runId: `run-${id}`,
    taskId: `task-${id}`,
    unitId: `unit-${id}`,
    inquiryKind: 'strategy',
    question: `q-${id}`,
    options: [
      { id: 'a', caption: 'Alpha' },
      { id: 'b', caption: 'Beta', tone: 'danger' },
    ],
    deadlineTs: 0,
  };
}

describe('inquiry dock', () => {
  it('shows newest first, capped at three, with the overflow count', () => {
    const inquiries = ['1', '2', '3', '4', '5'].map(fakeInquiry);
    const view = dockView(inquiries);
    expect(view.visible.map((q) => q.hookRequestId)).toEqual(['5', '4', '3']);
    expect(view.visible.length).toBe(DOCK_VISIBLE_CAP);
    expect(view.overflow).toBe(2);
  });

  it('answerInquiry resolves the live sim inquiry and logs the chosen caption', () => {
    const rig = makeRig(42);
    const sim = rig.backend.sim;
    // Start every backlog card so working agents emit inquiries (§V3-5).
    for (const card of sim.listCardViews()) {
      if (card.column === 'backlog' && card.parentId === null) sim.moveCard(card.taskId, 'do');
    }
    let inquiry: SimInquiryView | undefined;
    for (let i = 0; i < 800 && inquiry === undefined; i += 10) {
      sim.tick(10);
      inquiry = sim.listInquiries()[0];
    }
    rig.flush();
    expect(inquiry, 'the sim must raise an inquiry within 800 ticks').toBeDefined();
    const chosen = inquiry!.options[0]!;

    rig.orders.answerInquiry(inquiry!.hookRequestId, chosen.id);
    expect(sim.listInquiries().some((q) => q.hookRequestId === inquiry!.hookRequestId)).toBe(false);
    sim.tick(2);
    rig.flush();
    const texts = rig.store.getState().events.map((e) => e.text);
    expect(
      texts.some((t) => t.includes('Inquiry resolved') && t.includes(chosen.caption)),
      `ticker must log the chosen caption; tail: ${JSON.stringify(texts.slice(-8))}`,
    ).toBe(true);
  });

  it('recordResolvedInquiry keeps the resolved bubble for the owning agent', () => {
    const store = createCommanderStore();
    store.getState().recordResolvedInquiry({
      hookRequestId: 'hook-1',
      unitId: 'unit-9',
      taskId: 'task-9',
      question: 'Choose the path',
      optionId: 'expand-contract',
      caption: 'Expand-Contract',
      tone: 'primary',
    });
    const resolved = store.getState().board.resolvedInquiries['unit-9'];
    expect(resolved).toHaveLength(1);
    expect(resolved![0]).toMatchObject({ optionId: 'expand-contract', caption: 'Expand-Contract' });
    // Idempotent per hookRequestId (the dock and the inline bubble may race).
    store.getState().recordResolvedInquiry({
      hookRequestId: 'hook-1',
      unitId: 'unit-9',
      taskId: 'task-9',
      question: 'Choose the path',
      optionId: 'expand-contract',
      caption: 'Expand-Contract',
    });
    expect(store.getState().board.resolvedInquiries['unit-9']).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Human review action routing (§V3-4, AC30)
// ---------------------------------------------------------------------------

describe('review panel actions', () => {
  it('Approve All routes moveCard(taskId, "approved") and closes the panel', () => {
    const store = createCommanderStore();
    const orders = mockOrders();
    store.getState().openReview('task-7');
    approveAll(store, orders, 'task-7');
    expect(orders.moveCard).toHaveBeenCalledExactlyOnceWith('task-7', 'approved');
    expect(store.getState().meta.reviewTaskId).toBeNull();
  });

  it('Request Changes routes moveCard(taskId, "do"), logs feedback, closes the panel', () => {
    const store = createCommanderStore();
    const orders = mockOrders();
    store.getState().openReview('task-7');
    requestChanges(store, orders, 'task-7', '  tighten the seams  ');
    expect(orders.moveCard).toHaveBeenCalledExactlyOnceWith('task-7', 'do');
    expect(store.getState().meta.reviewTaskId).toBeNull();
    const texts = store.getState().events.map((e) => e.text);
    expect(texts.some((t) => t.includes('Changes requested') && t.includes('tighten the seams'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Inspector tab state (§V2-5/§V2-2 Open Diff deep link)
// ---------------------------------------------------------------------------

describe('inspector tab state', () => {
  it('defaults to transcript for agents, process for agent-less cards', () => {
    const store = createCommanderStore();
    store.getState().openInspector('unit-1');
    expect(store.getState().meta).toMatchObject({
      inspectorUnitId: 'unit-1',
      inspectorTaskId: null,
      inspectorTab: 'transcript',
    });
    store.getState().openInspectorCard('task-1');
    expect(store.getState().meta).toMatchObject({
      inspectorUnitId: null,
      inspectorTaskId: 'task-1',
      inspectorTab: 'process',
    });
  });

  it('is externally settable (Open Diff → workspace tab)', () => {
    const store = createCommanderStore();
    store.getState().openInspector('unit-1');
    store.getState().setInspectorTab('workspace');
    expect(store.getState().meta.inspectorTab).toBe('workspace');
  });

  it('an Inspector-opening intent closes the review panel — SAME task (Inspect/Terminal/Memory rule)', () => {
    const store = createCommanderStore();
    store.getState().openReview('task-1');
    expect(store.getState().meta.reviewTaskId).toBe('task-1');
    store.getState().openInspectorCard('task-1');
    expect(store.getState().meta.reviewTaskId).toBeNull();
    expect(store.getState().meta.inspectorTaskId).toBe('task-1');
  });

  it('an Inspector-opening intent closes the review panel — DIFFERENT task (inspector becomes primary)', () => {
    const store = createCommanderStore();
    store.getState().openReview('task-2');
    store.getState().openInspectorCard('task-1');
    expect(store.getState().meta.reviewTaskId).toBeNull();
    expect(store.getState().meta.inspectorTaskId).toBe('task-1');
  });

  it('opening the Inspector on an AGENT also closes an open review panel', () => {
    const store = createCommanderStore();
    store.getState().openReview('task-2');
    store.getState().openInspector('unit-1');
    expect(store.getState().meta.reviewTaskId).toBeNull();
    expect(store.getState().meta.inspectorUnitId).toBe('unit-1');
  });

  it('Esc closes the card-mode inspector AFTER the review panel (§V3-7 cascade)', () => {
    const store = createCommanderStore();
    store.getState().openInspectorCard('task-1');
    store.getState().openReview('task-2');
    store.getState().escape();
    expect(store.getState().meta.reviewTaskId).toBeNull();
    expect(store.getState().meta.inspectorTaskId).toBe('task-1');
    store.getState().escape();
    expect(store.getState().meta.inspectorTaskId).toBeNull();
  });
});
