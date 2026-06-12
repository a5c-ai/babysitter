/**
 * BOARD-V4 UI logic tests (SPEC-V4 §V4-1/§V4-2/§V4-3/§V4-4):
 *   - release-rail command sets per column (merged / in-production),
 *   - Orders verb routing (revertCard / release / rollbackCard) against the
 *     live sim + store rig,
 *   - Inspector retarget tab preservation (§V4-3, store level),
 *   - speed wiring (orders.setSpeed → sim pacing + store mirror + cycle),
 *   - drag-ghost helpers (laneFromHits ghost skipping, markup sanitizing).
 */
import { describe, expect, it } from 'vitest';

import { MockBackend } from '../../backend/mock/mockBackend';
import { laneFromHits, sanitizeGhostMarkup, type HitLike } from '../board';
import { generateCommands } from '../../microagent/mock/commandGen';
import type { BoardColumn, CardContextSummary, CommandContext } from '../../microagent/types';
import { nextSimSpeed } from '../../components/hud/TopBar';
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

/** Yolo-start every single backlog card and tick until ≥`want` sit in MERGED. */
function driveToMerged(rig: Rig, want: number): string[] {
  const sim = rig.backend.sim;
  const singles = sim
    .listCardViews()
    .filter((c) => c.parentId === null && c.childIds.length === 0 && c.column === 'backlog');
  for (const c of singles) {
    sim.setYolo(c.taskId, true);
    sim.moveCard(c.taskId, 'do');
  }
  const ids = singles.map((c) => c.taskId);
  let merged: string[] = [];
  for (let i = 0; i < 6000; i += 5) {
    for (const inquiry of sim.listInquiries()) {
      sim.answerInquiry(inquiry.hookRequestId, inquiry.options[0]!.id);
    }
    merged = ids.filter(
      (id) => sim.listCardViews().find((c) => c.taskId === id)!.column === 'merged',
    );
    if (merged.length >= want) break;
    sim.tick(5);
  }
  rig.binding.flush();
  expect(merged.length, 'driveToMerged budget').toBeGreaterThanOrEqual(want);
  return merged;
}

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
    selection: {
      count: 1,
      kinds: ['task'],
      states: [],
      adapters: [],
      taskStates: ['done'],
      pausedUnits: 0,
    },
    alerts: [],
    fleet: { totalUnits: 0, idleUnits: 0, busyUnits: 0, pendingAlerts: 0, simPaused: true },
    cards: [card],
  };
}

// ---------------------------------------------------------------------------
// §V4-1 release-rail command sets
// ---------------------------------------------------------------------------

describe('release-rail command sets (§V4-1)', () => {
  it('a MERGED card offers Revert (danger) / Release / Inspect / Terminal', () => {
    const specs = generateCommands(cardCtx('merged'));
    expect(specs.map((s) => s.id)).toEqual(['revert-card', 'release', 'inspect', 'open-terminal']);
    expect(specs.map((s) => s.label)).toEqual(['Revert', 'Release', 'Inspect', 'Terminal']);
    expect(specs[0]!.severity).toBe('danger');
    expect(specs[0]!.intent).toEqual({ kind: 'revert-card' });
    expect(specs[1]!.intent).toEqual({ kind: 'release' });
    expect(specs[3]!.intent).toEqual({ kind: 'open-terminal' });
  });

  it('an IN PRODUCTION card offers Rollback (danger) / Inspect / Terminal', () => {
    const specs = generateCommands(cardCtx('in-production'));
    expect(specs.map((s) => s.id)).toEqual(['rollback-prod', 'inspect', 'open-terminal']);
    expect(specs[0]!.label).toBe('Rollback');
    expect(specs[0]!.severity).toBe('danger');
    expect(specs[0]!.intent).toEqual({ kind: 'rollback-card' });
  });

  it('the rail glyphs are distinct, path-only engravings', () => {
    const merged = generateCommands(cardCtx('merged'));
    const prod = generateCommands(cardCtx('in-production'));
    const svgs = [...merged, ...prod].map((s) => s.icon.svg);
    expect(new Set(svgs).size).toBe(new Set([...merged, ...prod].map((s) => s.id)).size);
    for (const svg of svgs) {
      expect(svg).not.toMatch(/<line\b|<polyline\b/);
    }
  });
});

// ---------------------------------------------------------------------------
// §V4-1 Orders verb routing against the live sim
// ---------------------------------------------------------------------------

describe('Orders verb routing (§V4-1 rail verbs)', () => {
  it('orders.revertCard returns a merged card to DO and tickers a reverted line', () => {
    const rig = makeRig(42);
    const [id] = driveToMerged(rig, 1);

    rig.binding.orders.revertCard(id!);

    const card = rig.backend.sim.listCardViews().find((c) => c.taskId === id)!;
    expect(card.column).toBe('do');
    expect(card.merged).toBe(false);
    expect(rig.store.getState().events.some((e) => /reverted/i.test(e.text))).toBe(true);
  });

  it('orders.release ships ALL merged cards to in-production (rel-NN) and rollbackCard returns one to merged', () => {
    const rig = makeRig(42);
    const merged = driveToMerged(rig, 2);

    const releaseId = rig.binding.orders.release();
    expect(releaseId).toMatch(/^rel-\d{2}$/);

    // The train staggers one tick per wagon — give it that many ticks.
    rig.backend.sim.tick(merged.length + 2);
    rig.binding.flush();
    for (const id of merged) {
      expect(rig.backend.sim.listCardViews().find((c) => c.taskId === id)!.column).toBe(
        'in-production',
      );
    }
    expect(
      rig.store.getState().events.some((e) => /release rel-\d+/i.test(e.text)),
      'release_shipped must reach the ticker',
    ).toBe(true);

    rig.binding.orders.rollbackCard(merged[0]!);
    expect(rig.backend.sim.listCardViews().find((c) => c.taskId === merged[0])!.column).toBe(
      'merged',
    );
    expect(rig.store.getState().events.some((e) => /rolled back/i.test(e.text))).toBe(true);
  });

  it('release on an empty MERGED lane returns null and ships nothing', () => {
    const rig = makeRig(42);
    expect(rig.binding.orders.release()).toBeNull();
    expect(
      rig.backend.sim.listCardViews().filter((c) => c.column === 'in-production'),
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// §V4-3 Inspector retargeting (store level)
// ---------------------------------------------------------------------------

describe('Inspector retargeting preserves the selected tab (§V4-3)', () => {
  it('agent → agent retarget keeps the current tab; fresh open defaults to Transcript', () => {
    const store = createCommanderStore();
    store.getState().openInspector('u1');
    expect(store.getState().meta.inspectorTab).toBe('transcript');
    store.getState().setInspectorTab('process');

    store.getState().openInspector('u2'); // retarget while open
    expect(store.getState().meta.inspectorUnitId).toBe('u2');
    expect(store.getState().meta.inspectorTab).toBe('process'); // preserved

    store.getState().closeInspector();
    store.getState().openInspector('u3'); // fresh open
    expect(store.getState().meta.inspectorTab).toBe('transcript');
  });

  it('retargeting onto a CARD preserves Process/Workspace but falls back from Transcript (V3 rules)', () => {
    const store = createCommanderStore();
    store.getState().openInspector('u1');
    store.getState().setInspectorTab('workspace');

    store.getState().openInspectorCard('t1'); // card supports workspace
    expect(store.getState().meta.inspectorTaskId).toBe('t1');
    expect(store.getState().meta.inspectorUnitId).toBeNull();
    expect(store.getState().meta.inspectorTab).toBe('workspace'); // preserved

    store.getState().setInspectorTab('transcript');
    store.getState().openInspectorCard('t2'); // cards have no transcript
    expect(store.getState().meta.inspectorTab).toBe('process'); // fallback

    store.getState().closeInspector();
    store.getState().openInspectorCard('t3'); // fresh card open → Process default
    expect(store.getState().meta.inspectorTab).toBe('process');
  });
});

// ---------------------------------------------------------------------------
// §V4-4 speed wiring
// ---------------------------------------------------------------------------

describe('speed control wiring (§V4-4)', () => {
  it('defaults to 1x / 800ms; orders.setSpeed updates sim pacing and the store mirror', () => {
    const rig = makeRig(42);
    expect(rig.backend.sim.speed).toBe(1);
    expect(rig.backend.sim.tickIntervalMs).toBe(800);
    expect(rig.store.getState().meta.speed).toBe(1);

    expect(rig.binding.orders.setSpeed(2)).toBe(true);
    expect(rig.backend.sim.speed).toBe(2);
    expect(rig.backend.sim.tickIntervalMs).toBe(400);
    expect(rig.store.getState().meta.speed).toBe(2);
    expect(rig.store.getState().events.some((e) => /pacing — 2x/i.test(e.text))).toBe(true);

    expect(rig.binding.orders.setSpeed(0.5)).toBe(true);
    expect(rig.backend.sim.tickIntervalMs).toBe(1600);

    // Invalid speeds are rejected without side effects.
    expect(rig.binding.orders.setSpeed(3)).toBe(false);
    expect(rig.backend.sim.tickIntervalMs).toBe(1600);
    expect(rig.store.getState().meta.speed).toBe(0.5);
  });

  it('nextSimSpeed cycles 1x → 2x → 0.5x → 1x (3 clicks come home)', () => {
    expect(nextSimSpeed(1)).toBe(2);
    expect(nextSimSpeed(2)).toBe(0.5);
    expect(nextSimSpeed(0.5)).toBe(1);
    const intervals = new Set<number>();
    let speed = 1;
    for (let i = 0; i < 3; i++) {
      intervals.add(800 / speed);
      speed = nextSimSpeed(speed);
    }
    expect(intervals).toEqual(new Set([800, 400, 1600]));
    expect(speed).toBe(1);
  });

  it('tick(n) determinism is unaffected by speed (same seed + script ⇒ same board)', () => {
    const snapshotAt = (speed: number): string => {
      const rig = makeRig(42);
      rig.binding.orders.setSpeed(speed);
      const singles = rig.backend.sim
        .listCardViews()
        .filter((c) => c.parentId === null && c.childIds.length === 0 && c.column === 'backlog')
        .map((c) => c.taskId)
        .sort()
        .slice(0, 2);
      for (const id of singles) rig.backend.sim.moveCard(id, 'do');
      rig.backend.sim.tick(60);
      rig.binding.flush();
      return JSON.stringify(
        rig.backend.sim.listCardViews().map((c) => [c.taskId, c.column, c.progress]),
      );
    };
    expect(snapshotAt(2)).toEqual(snapshotAt(0.5));
  });
});

// ---------------------------------------------------------------------------
// §V4-2 drag-ghost helpers
// ---------------------------------------------------------------------------

function fakeHit(opts: { ghost?: boolean; lane?: string }): HitLike {
  const laneNode: HitLike | null =
    opts.lane !== undefined
      ? {
          closest: () => null,
          getAttribute: (name: string) =>
            name === 'data-testid' ? `kanban-col-${opts.lane}` : null,
        }
      : null;
  const hit: HitLike = {
    closest(selectors: string): HitLike | null {
      if (selectors === '[data-drag-ghost]') return opts.ghost === true ? hit : null;
      if (selectors === '[data-testid^="kanban-col-"]') return laneNode;
      return null;
    },
    getAttribute: () => null,
  };
  return hit;
}

describe('drag-ghost drop resolution (§V4-2)', () => {
  it('laneFromHits skips ghost-layer hits and resolves the lane beneath', () => {
    expect(laneFromHits([fakeHit({ ghost: true }), fakeHit({ lane: 'do' })])).toBe('do');
  });

  it('the FIRST non-ghost hit decides (old elementFromPoint semantics)', () => {
    expect(laneFromHits([fakeHit({ lane: 'do' }), fakeHit({ lane: 'backlog' })])).toBe('do');
    // First non-ghost hit outside any lane → null, even with a lane below.
    expect(laneFromHits([fakeHit({}), fakeHit({ lane: 'do' })])).toBeNull();
  });

  it('returns null for unknown lanes, empty stacks and ghost-only stacks', () => {
    expect(laneFromHits([])).toBeNull();
    expect(laneFromHits([fakeHit({ ghost: true })])).toBeNull();
    expect(laneFromHits([fakeHit({ lane: 'not-a-lane' })])).toBeNull();
  });

  it('sanitizeGhostMarkup strips every data-testid but keeps the visual markup', () => {
    const html =
      '<div data-testid="card-adr-01" class="wr-card"><button data-testid="card-yolo-adr-01" class="wr-card-yolo">yolo</button>' +
      '<span data-testid="card-agent-u1" data-adapter="codex"></span></div>';
    const ghost = sanitizeGhostMarkup(html);
    expect(ghost).not.toContain('data-testid');
    expect(ghost).toContain('class="wr-card"');
    expect(ghost).toContain('data-adapter="codex"');
  });
});
