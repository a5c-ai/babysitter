/**
 * Kanban column state machine + agent lifecycle (SPEC-V3 §V3-1/§V3-2):
 * boot board, legal/illegal user moves, spawn/despawn mapping per kind,
 * yolo branch, reject loop, stack fan-out + parent aggregation, integration
 * to the merged seal, createTask, and the protocol-frame surface.
 */
import { describe, expect, it } from 'vitest';

import type { ServerFrame } from '../../../contracts/gateway-protocol';
import { TASK_KINDS, WORKER_ADAPTER_BY_KIND, type TaskKind } from '../scenario';
import { COLUMNS, Simulation } from '../simulation';
import {
  answerAllInquiries,
  cardView,
  collectFrames,
  driveCardTo,
  movesOf,
  singlesIn,
  tickUntil,
  topCardsIn,
} from './helpers';

describe('board boot (SPEC-V3 §V3-2)', () => {
  it('boots with ALL cards in backlog, zero agents, and ≥1 stack with ≥2 children', () => {
    const sim = new Simulation({ seed: 42 });
    const cards = sim.listCardViews();
    expect(cards.length).toBeGreaterThanOrEqual(5);
    expect(cards.every((c) => c.column === 'backlog')).toBe(true);
    expect(sim.listActiveAgentViews()).toHaveLength(0);
    const stacks = cards.filter((c) => c.childIds.length >= 2);
    expect(stacks.length).toBeGreaterThanOrEqual(1);
    expect(singlesIn(sim, 'backlog').length).toBeGreaterThanOrEqual(5);
  });

  it('ticking while everything sits in backlog spawns nothing (no auto-started work)', () => {
    const sim = new Simulation({ seed: 42 });
    sim.tick(100);
    expect(sim.listActiveAgentViews()).toHaveLength(0);
    expect(sim.listCardViews().every((c) => c.column === 'backlog')).toBe(true);
  });
});

describe('moveCard validation (SPEC-V3 §V3-1)', () => {
  it('allows backlog -> do and rejects all other source columns for the user', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const card = singlesIn(sim, 'backlog')[0]!;
    expect(sim.moveCard(card.taskId, 'do')).toBe(true);
    expect(cardView(sim, card.taskId).column).toBe('do');
    // do -> human-review is automatic-only.
    expect(sim.moveCard(card.taskId, 'human-review')).toBe(false);
    expect(cardView(sim, card.taskId).column).toBe('do');
    const errors = frames.filter((f) => f.type === 'error');
    expect(errors.some((f) => f.type === 'error' && f.code === 'illegal_move')).toBe(true);
  });

  it('rejects backlog -> ai-review/human-review/approved', () => {
    const sim = new Simulation({ seed: 42 });
    const card = singlesIn(sim, 'backlog')[0]!;
    for (const target of ['ai-review', 'human-review', 'approved'] as const) {
      expect(sim.moveCard(card.taskId, target)).toBe(false);
      expect(cardView(sim, card.taskId).column).toBe('backlog');
    }
  });

  it('backlog -> backlog reorders (card drops to the bottom)', () => {
    const sim = new Simulation({ seed: 42 });
    const cards = topCardsIn(sim, 'backlog');
    const first = cards[0]!;
    expect(sim.moveCard(first.taskId, 'backlog')).toBe(true);
    const orders = topCardsIn(sim, 'backlog').map((c) => c.order);
    expect(cardView(sim, first.taskId).order).toBe(Math.max(...orders));
  });

  it('rejects moving a stack child directly (drag the parent)', () => {
    const sim = new Simulation({ seed: 42 });
    const child = sim.listCardViews().find((c) => c.parentId !== null)!;
    expect(sim.moveCard(child.taskId, 'do')).toBe(false);
  });

  it('allows human-review -> do | ai-review | approved (user verdicts)', () => {
    const sim = new Simulation({ seed: 42 });
    const singles = singlesIn(sim, 'backlog');
    for (const c of singles) sim.moveCard(c.taskId, 'do');
    const ok = tickUntil(sim, () => topCardsIn(sim, 'human-review').length >= 1, 3000);
    expect(ok).toBe(true);
    const id = topCardsIn(sim, 'human-review')[0]!.taskId;
    expect(sim.moveCard(id, 'do')).toBe(true);
    expect(cardView(sim, id).column).toBe('do');
    // A fresh worker spawned for the rework.
    expect(cardView(sim, id).agentIds.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects moves on merged (terminal) cards and unknown ids/columns', () => {
    const sim = new Simulation({ seed: 42 });
    expect(sim.moveCard('adr-99-nope', 'do')).toBe(false);
    const card = singlesIn(sim, 'backlog')[0]!;
    sim.setYolo(card.taskId, true);
    expect(driveCardTo(sim, card.taskId, 'merged')).toBe(true);
    expect(sim.moveCard(card.taskId, 'do')).toBe(false);
  });
});

describe('spawn/despawn mapping (SPEC-V3 §V3-2)', () => {
  it.each(TASK_KINDS.map((k) => [k] as const))(
    'kind %s spawns a worker of the mapped adapter on entering DO',
    (kind: TaskKind) => {
      const sim = new Simulation({ seed: 42 });
      const taskId = sim.createTask({ taskKind: kind })!;
      expect(taskId).not.toBeNull();
      sim.moveCard(taskId, 'do');
      const agents = sim.listActiveAgentViews().filter((a) => a.taskId === taskId);
      expect(agents).toHaveLength(1);
      expect(agents[0]!.role).toBe('worker');
      expect(agents[0]!.agent).toBe(WORKER_ADAPTER_BY_KIND[kind]);
    },
  );

  it('work-complete auto-moves to AI REVIEW, despawns the worker, spawns 1–2 reviewers of a DIFFERENT adapter', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const card = singlesIn(sim, 'backlog')[0]!;
    const workerAdapter = WORKER_ADAPTER_BY_KIND[card.taskKind];
    sim.moveCard(card.taskId, 'do');
    const ok = tickUntil(sim, () => {
      answerAllInquiries(sim);
      return cardView(sim, card.taskId).column === 'ai-review';
    });
    expect(ok).toBe(true);

    const agents = sim.listActiveAgentViews().filter((a) => a.taskId === card.taskId);
    expect(agents.length).toBeGreaterThanOrEqual(1);
    expect(agents.length).toBeLessThanOrEqual(2);
    for (const reviewer of agents) {
      expect(reviewer.role).toBe('reviewer');
      expect(reviewer.agent).not.toBe(workerAdapter);
    }
    const moves = movesOf(frames, card.taskId);
    expect(moves).toContainEqual({ from: 'do', to: 'ai-review', reason: 'work-complete' });
  });

  it('agents despawn whenever their card leaves their column (abort path)', () => {
    const sim = new Simulation({ seed: 42 });
    const card = singlesIn(sim, 'backlog')[0]!;
    sim.moveCard(card.taskId, 'do');
    const worker = sim.listActiveAgentViews().find((a) => a.taskId === card.taskId)!;
    sim.handleClientFrame({ type: 'session.message', sessionId: worker.unitId, prompt: '/abort' });
    expect(cardView(sim, card.taskId).column).toBe('backlog');
    expect(sim.listActiveAgentViews().filter((a) => a.taskId === card.taskId)).toHaveLength(0);
  });
});

describe('review verdicts: yolo branch + reject loop (SPEC-V3 §V3-2)', () => {
  it('a yolo card passing AI review lands in APPROVED, never visiting HUMAN REVIEW', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const singles = singlesIn(sim, 'backlog');
    for (const c of singles) {
      sim.setYolo(c.taskId, true);
      sim.moveCard(c.taskId, 'do');
    }
    const ok = tickUntil(sim, () => {
      answerAllInquiries(sim);
      return singles.some((c) => {
        const v = cardView(sim, c.taskId);
        return v.column === 'approved' || v.merged;
      });
    }, 4000);
    expect(ok).toBe(true);
    const winner = singles.find((c) => {
      const v = cardView(sim, c.taskId);
      return v.column === 'approved' || v.merged;
    })!;
    const cols = movesOf(frames, winner.taskId).map((m) => m.to);
    expect(cols).not.toContain('human-review');
    expect(
      movesOf(frames, winner.taskId).some((m) => m.reason === 'review-pass-yolo'),
    ).toBe(true);
  });

  it('a rejected card bounces back to DO with feedback and a fresh worker, then converges', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const singles = singlesIn(sim, 'backlog');
    for (const c of singles) sim.moveCard(c.taskId, 'do');
    const sawReject = tickUntil(sim, () => {
      answerAllInquiries(sim);
      return singles.some((c) => movesOf(frames, c.taskId).some((m) => m.reason === 'review-rejected'));
    }, 4000);
    expect(sawReject).toBe(true);
    const bounced = singles.find((c) =>
      movesOf(frames, c.taskId).some((m) => m.reason === 'review-rejected'),
    )!;
    // Feedback recorded + review_feedback event emitted.
    const feedbackEvents = frames.filter(
      (f) =>
        f.type === 'run.event' &&
        f.event['type'] === 'review_feedback' &&
        f.event['taskId'] === bounced.taskId,
    );
    expect(feedbackEvents.length).toBeGreaterThanOrEqual(1);
    expect(cardView(sim, bounced.taskId).feedback).toMatch(/changes requested/i);
    // The bounce landed it in DO with a fresh worker at that moment.
    const rejectMove = movesOf(frames, bounced.taskId).find((m) => m.reason === 'review-rejected')!;
    expect(rejectMove.to).toBe('do');
    // The reject loop converges: attempt >= 2 forces a pass eventually.
    const converged = tickUntil(sim, () => {
      answerAllInquiries(sim);
      const v = cardView(sim, bounced.taskId);
      return v.column === 'human-review' || v.column === 'approved' || v.merged;
    }, 4000);
    expect(converged).toBe(true);
  });

  it('HUMAN REVIEW holds no agents', () => {
    const sim = new Simulation({ seed: 42 });
    const singles = singlesIn(sim, 'backlog');
    for (const c of singles) sim.moveCard(c.taskId, 'do');
    const ok = tickUntil(sim, () => {
      answerAllInquiries(sim);
      return topCardsIn(sim, 'human-review').length >= 1;
    }, 3000);
    expect(ok).toBe(true);
    for (const card of topCardsIn(sim, 'human-review')) {
      expect(card.agentIds).toHaveLength(0);
    }
  });
});

describe('stack fan-out + parent aggregation (SPEC-V2 §V2-4 / SPEC-V3 §V3-2)', () => {
  it('moving a parent to DO moves the stack and spawns one worker per child', () => {
    const sim = new Simulation({ seed: 42 });
    const parent = topCardsIn(sim, 'backlog').find((c) => c.childIds.length >= 2)!;
    sim.moveCard(parent.taskId, 'do');
    expect(cardView(sim, parent.taskId).column).toBe('do');
    for (const childId of parent.childIds) {
      expect(cardView(sim, childId).column).toBe('do');
      const workers = sim.listActiveAgentViews().filter((a) => a.taskId === childId);
      expect(workers).toHaveLength(1);
      expect(workers[0]!.agent).toBe(WORKER_ADAPTER_BY_KIND[cardView(sim, childId).taskKind]);
    }
    // The parent itself has no worker.
    expect(sim.listActiveAgentViews().filter((a) => a.taskId === parent.taskId)).toHaveLength(0);
  });

  it('parent progress aggregates children; the stack auto-moves when ALL children finish', () => {
    const sim = new Simulation({ seed: 42 });
    const parent = topCardsIn(sim, 'backlog').find((c) => c.childIds.length >= 2)!;
    sim.moveCard(parent.taskId, 'do');
    sim.tick(30);
    answerAllInquiries(sim);
    const mid = cardView(sim, parent.taskId);
    const childProgress = parent.childIds.map((id) => cardView(sim, id).progress);
    const mean = childProgress.reduce((a, b) => a + b, 0) / childProgress.length;
    expect(mid.progress).toBeCloseTo(mean, 3);

    const ok = tickUntil(sim, () => {
      answerAllInquiries(sim);
      return cardView(sim, parent.taskId).column === 'ai-review';
    }, 4000);
    expect(ok).toBe(true);
    // All child workers despawned; reviewers attend the parent.
    for (const childId of parent.childIds) {
      expect(sim.listActiveAgentViews().filter((a) => a.taskId === childId)).toHaveLength(0);
    }
    expect(
      sim.listActiveAgentViews().filter((a) => a.taskId === parent.taskId && a.role === 'reviewer').length,
    ).toBeGreaterThanOrEqual(1);
  });
});

describe('integration (SPEC-V3 §V3-2 APPROVED)', () => {
  it('an approved card gets an integration agent, emits merge/rebase events, reaches merged, despawns', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const card = singlesIn(sim, 'backlog')[0]!;
    sim.setYolo(card.taskId, true);
    sim.moveCard(card.taskId, 'do');

    let sawIntegrationAgent = false;
    const merged = tickUntil(sim, () => {
      answerAllInquiries(sim);
      if (
        sim.listActiveAgentViews().some((a) => a.taskId === card.taskId && a.role === 'integration')
      ) {
        sawIntegrationAgent = true;
      }
      return cardView(sim, card.taskId).merged;
    }, 4000);
    expect(merged).toBe(true);
    expect(sawIntegrationAgent).toBe(true);
    expect(sim.listActiveAgentViews().filter((a) => a.taskId === card.taskId)).toHaveLength(0);

    const steps = frames
      .filter(
        (f): f is Extract<ServerFrame, { type: 'run.event' }> =>
          f.type === 'run.event' &&
          f.event['type'] === 'integration_step' &&
          f.event['taskId'] === card.taskId,
      )
      .map((f) => String(f.event['step']));
    expect(steps).toContain('rebase onto main');
    expect(steps).toContain('integration-test');
    expect(steps[steps.length - 1]).toBe('merge');
    expect(
      frames.some(
        (f) =>
          f.type === 'run.event' &&
          f.event['type'] === 'card_merged' &&
          f.event['taskId'] === card.taskId,
      ),
    ).toBe(true);
  });
});

describe('createTask (SPEC-V2 §V2-6 Commission Task)', () => {
  it('lands in backlog with deterministic adr-cXX ids from a creation counter', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const a = sim.createTask({ taskKind: 'fix' });
    const b = sim.createTask({ taskKind: 'docs', title: 'Custom ledger' });
    expect(a).toBe('adr-c01-fix');
    expect(b).toBe('adr-c02-docs');
    expect(cardView(sim, a!).column).toBe('backlog');
    expect(cardView(sim, b!).title).toBe('Custom ledger');
    expect(
      frames.filter((f) => f.type === 'run.event' && f.event['type'] === 'task_created'),
    ).toHaveLength(2);
    // Rejects unknown kinds.
    expect(sim.createTask({ taskKind: 'paint' as TaskKind })).toBeNull();
  });

  it('supports optional parents (stack growth) and behaves like seeded cards', () => {
    const sim = new Simulation({ seed: 42 });
    const parent = topCardsIn(sim, 'backlog').find((c) => c.childIds.length >= 2)!;
    const child = sim.createTask({ taskKind: 'fix', parentId: parent.taskId })!;
    expect(cardView(sim, child).parentId).toBe(parent.taskId);
    expect(cardView(sim, parent.taskId).childIds).toContain(child);
  });
});

describe('protocol-frame surface', () => {
  it('auth -> hello, ping -> pong, session.start retired, subscribe unknown run errors', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    sim.handleClientFrame({ type: 'auth', token: 't' });
    sim.handleClientFrame({ type: 'ping' });
    sim.handleClientFrame({ type: 'session.start', agent: 'codex', prompt: 'go' });
    sim.handleClientFrame({ type: 'subscribe', runId: 'run-nope' });
    expect(frames[0]!.type).toBe('hello');
    expect(frames[1]!.type).toBe('pong');
    expect(frames[2]).toMatchObject({ type: 'error', code: 'unsupported_in_v3' });
    expect(frames[3]).toMatchObject({ type: 'error', code: 'run_not_found' });
  });

  it('COLUMNS exposes the seven V4 lanes in board order (§V4-1 release rail)', () => {
    expect(COLUMNS).toEqual([
      'backlog',
      'do',
      'ai-review',
      'human-review',
      'approved',
      'merged',
      'in-production',
    ]);
  });
});
