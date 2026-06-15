/**
 * Kept systems, adapted to the column model: memory held-pieces (SPEC-V2
 * §V2-3), per-card babysitter run journal + ObservedRunState (SPEC-V2 §V2-5),
 * workspace diff determinism + integration lifecycle (SPEC-V2 §V2-7),
 * token/cost accumulation for active agents.
 */
import { describe, expect, it } from 'vitest';

import type { JournalEvent } from '../../../contracts/babysitter-run';
import { generateScenario } from '../scenario';
import { deriveObservedRunState, Simulation } from '../simulation';
import {
  answerAllInquiries,
  cardView,
  collectFrames,
  driveCardTo,
  singlesIn,
  tickUntil,
} from './helpers';

describe('memory system (SPEC-V2 §V2-3)', () => {
  it('the unified graph holds 40–60 records across 3–4 silos with replication', () => {
    for (const seed of [1, 7, 42, 1337]) {
      const scenario = generateScenario(seed);
      expect(scenario.memory.records.length).toBeGreaterThanOrEqual(40);
      expect(scenario.memory.records.length).toBeLessThanOrEqual(60);
      expect(scenario.memory.silos.length).toBeGreaterThanOrEqual(3);
      expect(scenario.memory.silos.length).toBeLessThanOrEqual(4);
      const allIds = new Set(scenario.memory.records.map((r) => r.id));
      const membership = scenario.memory.silos.flatMap((s) => s.recordIds);
      for (const id of membership) expect(allIds.has(id)).toBe(true);
      // Every record is held by at least one silo; some are replicated.
      expect(new Set(membership).size).toBe(allIds.size);
      expect(membership.length).toBeGreaterThan(allIds.size);
      // Required graph fields per the ontology spec.
      for (const record of scenario.memory.records) {
        expect(record.attributes.title.length).toBeGreaterThan(0);
        expect(record.attributes.owners.length).toBeGreaterThan(0);
        expect(record.attributes.updatedAt).toMatch(/^\d{4}-/);
      }
    }
  });

  it('ACTIVE agents emit memory_query events and accumulate held pieces', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    for (const c of singlesIn(sim, 'backlog')) sim.moveCard(c.taskId, 'do');
    const ok = tickUntil(sim, () => {
      answerAllInquiries(sim);
      return frames.some((f) => f.type === 'run.event' && f.event['type'] === 'memory_query');
    }, 2000);
    expect(ok).toBe(true);
    const query = frames.find((f) => f.type === 'run.event' && f.event['type'] === 'memory_query')!;
    expect(query.type === 'run.event' && query.event['silo']).toMatch(/^brain-/);
    const matched = query.type === 'run.event' ? (query.event['matchedIds'] as string[]) : [];
    expect(matched.length).toBeGreaterThanOrEqual(1);
    const holder = sim
      .listActiveAgentViews()
      .find((a) => a.unitId === (query.type === 'run.event' ? query.event['unitId'] : ''));
    if (holder) {
      for (const id of matched) expect(holder.heldPieces).toContain(id);
    }
    // Memory comes from a silo whose membership contains the matched ids.
    const silos = sim.listMemorySilos();
    const silo = silos.find((s) => s.name === (query.type === 'run.event' ? query.event['silo'] : ''))!;
    for (const id of matched) expect(silo.recordIds).toContain(id);
  });

  it('completing work SENDS pieces back: a memory_update event fires', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const card = singlesIn(sim, 'backlog')[0]!;
    sim.moveCard(card.taskId, 'do');
    const ok = tickUntil(sim, () => {
      answerAllInquiries(sim);
      return cardView(sim, card.taskId).column === 'ai-review';
    }, 2000);
    expect(ok).toBe(true);
    const update = frames.find(
      (f) =>
        f.type === 'run.event' &&
        f.event['type'] === 'memory_update' &&
        f.event['taskId'] === card.taskId,
    );
    expect(update).toBeDefined();
    expect(update!.type === 'run.event' && update!.event['updateKind']).toBe('proposed-pr');
  });
});

describe('per-card babysitter run (SPEC-V2 §V2-5)', () => {
  it('entering DO creates a run with a kind-derived phase pipeline and journals effects per phase', () => {
    const sim = new Simulation({ seed: 42 });
    const taskId = sim.createTask({ taskKind: 'fix' })!;
    sim.moveCard(taskId, 'do');
    const obs0 = sim.getRunObservation(taskId)!;
    expect(obs0.phases.map((p) => p.label)).toEqual(['reproduce', 'diagnose', 'patch', 'verify']);
    expect(obs0.phases.filter((p) => p.status === 'current')).toHaveLength(1);
    expect(obs0.journal[0]!.type).toBe('RUN_CREATED');
    expect(obs0.journal.some((e) => e.type === 'EFFECT_REQUESTED')).toBe(true);
    expect(obs0.observedState).toBe('waiting');

    const ok = tickUntil(sim, () => {
      answerAllInquiries(sim);
      return cardView(sim, taskId).column === 'ai-review';
    }, 2000);
    expect(ok).toBe(true);
    const obs1 = sim.getRunObservation(taskId)!;
    const resolved = obs1.journal.filter((e) => e.type === 'EFFECT_RESOLVED');
    expect(resolved.length).toBeGreaterThanOrEqual(4); // one per phase at minimum
    // Journal is ordered + monotonically sequenced.
    for (let i = 1; i < obs1.journal.length; i += 1) {
      expect(obs1.journal[i]!.seq).toBe(obs1.journal[i - 1]!.seq + 1);
      expect(obs1.journal[i]!.recordedAt).toBeGreaterThanOrEqual(obs1.journal[i - 1]!.recordedAt);
    }
  });

  it('the run reaches RUN_COMPLETED (observed completed) only at the merged seal', () => {
    const sim = new Simulation({ seed: 42 });
    const card = singlesIn(sim, 'backlog')[0]!;
    sim.setYolo(card.taskId, true);
    expect(driveCardTo(sim, card.taskId, 'merged')).toBe(true);
    const obs = sim.getRunObservation(card.taskId)!;
    expect(obs.observedState).toBe('completed');
    expect(obs.journal[obs.journal.length - 1]!.type).toBe('RUN_COMPLETED');
    expect(Object.keys(obs.pendingEffectsByKind)).toHaveLength(0);
  });

  it('deriveObservedRunState maps journal heads to the mirrored union', () => {
    const event = (type: JournalEvent['type'], seq: number): JournalEvent => ({
      seq,
      ulid: `T${seq}`,
      type,
      recordedAt: seq,
      data: {},
    });
    expect(deriveObservedRunState([event('RUN_CREATED', 1)])).toBe('created');
    expect(deriveObservedRunState([event('RUN_CREATED', 1), event('EFFECT_REQUESTED', 2)])).toBe('waiting');
    expect(
      deriveObservedRunState([event('RUN_CREATED', 1), event('EFFECT_REQUESTED', 2), event('RUN_COMPLETED', 3)]),
    ).toBe('completed');
    expect(deriveObservedRunState([event('RUN_CREATED', 1), event('RUN_HALTED', 2)])).toBe('halted');
    expect(deriveObservedRunState([event('RUN_CREATED', 1), event('RUN_FAILED', 2)])).toBe('failed');
    expect(deriveObservedRunState([event('RUN_CREATED', 1), event('PROCESS_RUNTIME_ERROR', 2)])).toBe('failed');
    expect(deriveObservedRunState([])).toBe('created');
  });
});

describe('workspace changes (SPEC-V2 §V2-7 / SPEC-V3 §V3-4)', () => {
  it('files accumulate while in DO; diffs carry +/- rows referencing the task title', () => {
    const sim = new Simulation({ seed: 42 });
    const card = singlesIn(sim, 'backlog')[0]!;
    sim.moveCard(card.taskId, 'do');
    const ok = tickUntil(sim, () => {
      answerAllInquiries(sim);
      return cardView(sim, card.taskId).column === 'ai-review';
    }, 2000);
    expect(ok).toBe(true);
    const ws = sim.getWorkspaceView(card.taskId)!;
    expect(ws.files.length).toBeGreaterThanOrEqual(2);
    expect(ws.gitStatus.branch).toBe(`agent/${card.taskId}`);
    expect(ws.gitStatus.dirty).toBe(true);
    expect(ws.gitStatus.headSha).toMatch(/^[0-9a-f]{12}$/);
    const joined = ws.files.map((f) => f.diff).join('\n');
    expect(joined).toContain(card.title);
    expect(ws.files.some((f) => f.diff.split('\n').some((l) => l.startsWith('+')))).toBe(true);
    expect(ws.files.some((f) => f.diff.split('\n').some((l) => l.startsWith('-')))).toBe(true);
    for (const file of ws.files) {
      const lines = file.diff.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(3);
      expect(lines.length).toBeLessThanOrEqual(25);
    }
    expect(ws.testEvidence.status).not.toBe('failed');
  });

  it('reviewer notes are generated in AI REVIEW', () => {
    const sim = new Simulation({ seed: 42 });
    const card = singlesIn(sim, 'backlog')[0]!;
    sim.moveCard(card.taskId, 'do');
    const ok = tickUntil(sim, () => {
      answerAllInquiries(sim);
      const v = cardView(sim, card.taskId);
      return v.column !== 'do' && v.column !== 'ai-review';
    }, 3000);
    expect(ok).toBe(true);
    expect(sim.getWorkspaceView(card.taskId)!.reviewerNotes.length).toBeGreaterThanOrEqual(1);
  });

  it('integration applies the patch: workspace clean + archived at the merged seal', () => {
    const sim = new Simulation({ seed: 42 });
    const card = singlesIn(sim, 'backlog')[0]!;
    sim.setYolo(card.taskId, true);
    expect(driveCardTo(sim, card.taskId, 'merged')).toBe(true);
    const ws = sim.getWorkspaceView(card.taskId)!;
    expect(ws.gitStatus.dirty).toBe(false);
    expect(ws.gitStatus.uncommittedCount).toBe(0);
    expect(ws.gitStatus.ahead).toBe(0);
    expect(ws.phase).toBe('archived');
  });

  it('workspace diffs are deterministic: two engines, same verbs, identical views', () => {
    const build = (): unknown => {
      const sim = new Simulation({ seed: 7 });
      const card = singlesIn(sim, 'backlog')[0]!;
      sim.moveCard(card.taskId, 'do');
      sim.tick(120);
      return sim.getWorkspaceView(card.taskId);
    };
    expect(build()).toEqual(build());
  });
});

describe('token/cost accumulation (active agents only)', () => {
  it('working agents burn tokens and accrue per-adapter cost over ticks', () => {
    const sim = new Simulation({ seed: 42 });
    const card = singlesIn(sim, 'backlog')[0]!;
    sim.moveCard(card.taskId, 'do');
    sim.tick(20);
    const agent = sim.listActiveAgentViews().find((a) => a.taskId === card.taskId)!;
    const burned =
      agent.tokenUsage.outputTokens + agent.tokenUsage.thinkingTokens;
    expect(burned).toBeGreaterThan(0);
    expect(agent.cost.totalUsd).toBeGreaterThan(0);
  });
});
