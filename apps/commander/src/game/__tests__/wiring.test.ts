/**
 * Frame→store routing tests (SPEC §6/§7, AC4/AC5/AC6/AC13): MockBackend with
 * autoStart:false + manual tick, single batched commit per tick batch, alert
 * lifecycle, dispatch/abort orders, ring buffer cap, store determinism.
 */
import { describe, expect, it } from 'vitest';

import { MockBackend } from '../../backend/mock/mockBackend';
import {
  bindBackendToStore,
  createCommanderStore,
  EVENT_RING_CAP,
  type BackendBinding,
  type CommanderState,
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

/** Tick in chunks until the predicate holds (bounded — sim is deterministic). */
function tickUntil(rig: Rig, predicate: (s: CommanderState) => boolean, maxTicks = 4000): boolean {
  for (let i = 0; i < maxTicks; i += 10) {
    if (predicate(rig.store.getState())) return true;
    tickFlush(rig, 10);
  }
  return predicate(rig.store.getState());
}

/** Deterministic, comparable projection of the store (AC13). */
function snapshot(store: CommanderStore): string {
  const s = store.getState();
  return JSON.stringify({
    units: s.world.unitIds.map((id) => s.world.units[id]?.view),
    tasks: s.world.taskIds.map((id) => s.world.tasks[id]?.view),
    cards: s.board.cardIds.map((id) => ({ view: s.board.cards[id]?.view, stage: s.board.cards[id]?.runStage })),
    agents: s.board.agentIds.map((id) => s.board.agents[id]),
    inquiries: s.board.inquiries,
    events: s.events,
    alerts: s.alerts,
    resources: s.meta.resources,
    simTimeMs: s.meta.simTimeMs,
    tickIndex: s.meta.tickIndex,
  });
}

describe('boot ingest', () => {
  it('populates the world from the seeded sim before any tick (V3: zero agents, all cards backlog)', () => {
    const rig = makeRig(42);
    const s = rig.store.getState();
    // SPEC-V3 §V3-2: no idle agents, no pre-spawned fleet.
    expect(s.world.unitIds.length).toBe(0);
    expect(s.world.taskIds.length).toBeGreaterThanOrEqual(5);
    expect(s.board.cardIds.length).toBe(s.world.taskIds.length);
    expect(s.board.agentIds.length).toBe(0);
    expect(s.meta.resources.unitCount).toBe(0);
    expect(s.meta.resources.tasksTotal).toBe(s.world.taskIds.length);
    for (const id of s.world.taskIds) {
      expect(s.world.tasks[id]?.view.state).toBe('queued');
      expect(s.board.cards[id]?.view.column).toBe('backlog');
    }
    // Static memory graph is committed at bind time (§V2-3).
    expect(s.board.memory.silos.length).toBeGreaterThanOrEqual(3);
    expect(s.board.memory.records.length).toBeGreaterThanOrEqual(30);
  });

  it('marks the connection on the hello frame', async () => {
    const rig = makeRig(42);
    expect(rig.store.getState().meta.connection).toBe('connecting');
    await rig.backend.connect();
    rig.binding.flush();
    expect(rig.store.getState().meta.connection).toBe('connected');
  });
});

describe('one commit per tick batch (SPEC §6)', () => {
  it('coalesces a multi-tick batch + frames into exactly one setState', async () => {
    const rig = makeRig(42);
    let commits = 0;
    const unsub = rig.store.subscribe(() => {
      commits += 1;
    });
    tickFlush(rig, 10);
    expect(commits).toBe(1);
    await Promise.resolve(); // the scheduled microtask flush must be a no-op
    expect(commits).toBe(1);
    unsub();
  });
});

// RETIRED by V3: dispatch order routing (AC4 — session.start with task:<id>)
// and unit Retire. Agents spawn only when a card enters DO (SPEC-V3 §V3-2)
// and despawn with their card; session.start answers `unsupported_in_v3`.

describe('abort routing (AC5, V3 semantics)', () => {
  it('aborting a worker bounces its card to backlog and despawns the agent', () => {
    const rig = makeRig(42);
    const card = rig.backend.sim
      .listCardViews()
      .find((c) => c.parentId === null && c.childIds.length === 0)!;
    rig.backend.sim.moveCard(card.taskId, 'do');
    rig.binding.flush();
    const unitId = rig.store.getState().world.unitIds[0]!;
    expect(unitId).toBeDefined();

    rig.binding.orders.abort([unitId]);
    const s = rig.store.getState();
    expect(s.world.units[unitId]).toBeUndefined();
    expect(s.world.tasks[card.taskId]?.view.state).toBe('queued');
    expect(rig.backend.sim.listActiveAgentViews()).toHaveLength(0);
  });
});

describe('operator verbs routing (Pause / Prioritize over active agents)', () => {
  it('orders.pauseUnits holds the run (view.paused), resumeUnits releases it', () => {
    const rig = makeRig(42);
    const card = rig.backend.sim
      .listCardViews()
      .find((c) => c.parentId === null && c.childIds.length === 0)!;
    rig.backend.sim.moveCard(card.taskId, 'do');
    rig.binding.flush();
    const unitId = rig.store.getState().world.unitIds[0]!;
    const working = tickUntil(rig, (s) => {
      const st = s.world.units[unitId]?.view.state;
      return st === 'thinking' || st === 'tool_running';
    });
    expect(working).toBe(true);

    rig.binding.orders.pauseUnits([unitId]);
    let s = rig.store.getState();
    expect(s.world.units[unitId]?.view.paused).toBe(true);
    expect(s.events.some((e) => /paused by operator/i.test(e.text))).toBe(true);

    const stateBefore = s.world.units[unitId]?.view.state;
    tickFlush(rig, 40);
    s = rig.store.getState();
    expect(s.world.units[unitId]?.view.state).toBe(stateBefore);

    rig.binding.orders.resumeUnits([unitId]);
    s = rig.store.getState();
    expect(s.world.units[unitId]?.view.paused).toBe(false);
    expect(s.events.some((e) => /back online/i.test(e.text))).toBe(true);
  });

  it('orders.prioritize bumps the task priority and logs the ticker', () => {
    const rig = makeRig(42);
    const taskId = rig.store.getState().world.taskIds[0]!;

    rig.binding.orders.prioritize(taskId);

    const s = rig.store.getState();
    expect(s.world.tasks[taskId]?.view.priority).toBeGreaterThan(0);
    const entry = s.events.find((e) => /priority/i.test(e.text));
    expect(entry).toBeDefined();
    expect(entry?.entityId).toBe(taskId);
  });
});

describe('alert lifecycle (AC6)', () => {
  it('hook.request fills the alerts slice + ping; decision clears it', () => {
    const rig = makeRig(42);
    // V3: inquiries fire from ACTIVE agents only — start all single cards.
    for (const card of rig.backend.sim.listCardViews()) {
      if (card.parentId === null && card.childIds.length === 0) {
        rig.backend.sim.moveCard(card.taskId, 'do');
      }
    }
    rig.binding.flush();
    const fired = tickUntil(rig, (s) => s.alerts.length > 0, 6000);
    expect(fired).toBe(true);

    const s = rig.store.getState();
    const alert = s.alerts[0]!;
    expect(alert.hookRequestId).toMatch(/^hook-/);
    expect(alert.runId).toMatch(/^run-/);
    expect(s.world.units[alert.unitId]?.view.state).toBe('awaiting_approval');
    expect(typeof alert.kind).toBe('string');
    expect(alert.deadlineTs).toBeGreaterThan(0);
    expect(s.meta.resources.alertCount).toBe(s.alerts.length);
    // The inquiry also rides the board slice for the dock (§V3-5).
    expect(s.board.inquiries.some((q) => q.hookRequestId === alert.hookRequestId)).toBe(true);

    rig.binding.orders.decide(alert.hookRequestId, 'allow');
    const after = rig.store.getState();
    expect(after.alerts.find((a) => a.hookRequestId === alert.hookRequestId)).toBeUndefined();
    expect(after.world.units[alert.unitId]?.view.state).not.toBe('awaiting_approval');
  });
});

describe('events ring buffer (SPEC §6)', () => {
  it(`caps the ticker at ${EVENT_RING_CAP} entries`, () => {
    const rig = makeRig(42);
    // V3: nothing streams until cards enter DO — yolo them all so events flow.
    for (const card of rig.backend.sim.listCardViews()) {
      if (card.parentId !== null) continue;
      rig.backend.sim.setYolo(card.taskId, true);
      rig.backend.sim.moveCard(card.taskId, 'do');
    }
    rig.binding.flush();
    for (let i = 0; i < 40; i += 1) {
      tickFlush(rig, 100);
    }
    const s = rig.store.getState();
    expect(s.events.length).toBeLessThanOrEqual(EVENT_RING_CAP);
    // It actually streamed. (The v1 store maps only a subset of the new V3
    // sim event payloads to ticker entries; the UI phase re-tightens this.)
    expect(s.events.length).toBeGreaterThan(30);
  });
});

describe('store determinism (AC13)', () => {
  it('same seed + same tick batches ⇒ identical store snapshots', () => {
    const a = makeRig(42);
    const b = makeRig(42);
    tickFlush(a, 20);
    tickFlush(b, 20);
    expect(snapshot(a.store)).toBe(snapshot(b.store));

    tickFlush(a, 20);
    tickFlush(b, 20);
    expect(snapshot(a.store)).toBe(snapshot(b.store));
  });

  it('same seed + same command sequence ⇒ identical store snapshots', () => {
    const a = makeRig(7);
    const b = makeRig(7);
    for (const rig of [a, b]) {
      // V3 verb sequence: start a card, work a while, abort its worker.
      const taskId = rig.store.getState().world.taskIds[1]!;
      rig.backend.sim.moveCard(taskId, 'do');
      rig.binding.flush();
      tickFlush(rig, 35);
      const unitId = rig.store.getState().world.unitIds[0];
      if (unitId !== undefined) rig.binding.orders.abort([unitId]);
      tickFlush(rig, 15);
    }
    expect(snapshot(a.store)).toBe(snapshot(b.store));
  });

  it('different seeds diverge (sanity)', () => {
    const a = makeRig(42);
    const b = makeRig(43);
    tickFlush(a, 20);
    tickFlush(b, 20);
    expect(snapshot(a.store)).not.toBe(snapshot(b.store));
  });
});
