/**
 * SPEC-V5 §V5-1 persistent sessions & subsessions.
 *
 * - Every spawned agent creates a SessionRecord that PERSISTS after despawn
 *   (full transcript, ring-capped at SESSION_TRANSCRIPT_CAP entries).
 * - Deterministic links: stack parent coordination sessions (one per attempt)
 *   parent the child worker sessions; reviewer sessions carry
 *   reviewOfSessionId; integration sessions parent on the approving review.
 * - Views: listSessions(taskId?) newest first; getSession(sessionId) =
 *   { record, transcript }.
 * - Status transitions: active while attached; completed on normal despawn;
 *   aborted on /abort.
 */
import { describe, expect, it } from 'vitest';

import { SESSION_TRANSCRIPT_CAP, Simulation } from '../simulation';
import type { SimSessionView } from '../simulation';
import { cardView, driveCardTo, singlesIn, tickUntil } from './helpers';

/** The seeded STACK parent cards (parentId null, ≥2 children). */
function stackParents(sim: Simulation) {
  return sim
    .listCardViews()
    .filter((c) => c.parentId === null && c.childIds.length >= 2)
    .sort((a, b) => (a.taskId < b.taskId ? -1 : 1));
}

describe('SPEC-V5 §V5-1 persistent sessions', () => {
  it('worker + reviewer sessions persist after despawn (transcript readable post-column-exit)', () => {
    const sim = new Simulation({ seed: 42 });
    const taskId = singlesIn(sim, 'backlog')[0]!.taskId;
    expect(driveCardTo(sim, taskId, 'human-review')).toBe(true);

    // HUMAN REVIEW: agent-less (§V3-2) — yet the sessions survive.
    expect(sim.listActiveAgentViews().filter((a) => a.taskId === taskId)).toHaveLength(0);
    const sessions = sim.listSessions(taskId);
    expect(sessions.length).toBeGreaterThanOrEqual(2);
    const worker = sessions.find((s) => s.role === 'worker');
    const reviewer = sessions.find((s) => s.role === 'reviewer');
    expect(worker).toBeTruthy();
    expect(reviewer).toBeTruthy();

    for (const session of [worker!, reviewer!]) {
      expect(session.status).toBe('completed');
      expect(session.endedTick).not.toBeNull();
      expect(session.endedTick!).toBeGreaterThanOrEqual(session.startedTick);
      // SessionRecord field shape (§V5-1).
      expect(session.sessionId).toMatch(/^agt-\d{3}-/);
      expect(session.title).toContain(session.creatureName);
      expect(session.stackRef).not.toBe('');
      expect(session.stackName).not.toBe('');
      expect(session.attempt).toBeGreaterThanOrEqual(1);
      expect(session.tokenUsage.inputTokens).toBeGreaterThan(0);
      expect(session.cost.totalUsd).toBeGreaterThan(0);
      // The transcript is readable AFTER despawn — and non-trivial.
      const detail = sim.getSession(session.sessionId);
      expect(detail).not.toBeNull();
      expect(detail!.record.sessionId).toBe(session.sessionId);
      expect(detail!.transcript.length).toBeGreaterThan(0);
      expect(detail!.transcript.map((e) => e.text).join('').length).toBeGreaterThan(20);
    }
    // The worker carries its runId; the title is "creature name + role".
    expect(worker!.runId).toMatch(/^run-/);
    expect(worker!.title).toMatch(/the Worker$/);
    expect(reviewer!.title).toMatch(/the Reviewer$/);
    // Single-card worker: no coordination parent.
    expect(worker!.parentSessionId).toBeNull();
    // Reviewer judged the worker session of the attempt (§V5-1 (b)).
    expect(reviewer!.reviewOfSessionId).toBe(worker!.sessionId);
  });

  it('stack parents record a per-attempt coordination session; child workers link to it (§V5-1 (a))', () => {
    const sim = new Simulation({ seed: 42 });
    const parent = stackParents(sim)[0]!;
    sim.moveCard(parent.taskId, 'do');

    const coordOf = (): SimSessionView | undefined =>
      sim.listSessions(parent.taskId).find((s) => s.coordination);
    const coordination = coordOf();
    expect(coordination).toBeTruthy();
    expect(coordination!.role).toBe('worker');
    expect(coordination!.title).toMatch(/the Coordinator$/);
    expect(coordination!.status).toBe('active');
    expect(coordination!.attempt).toBe(1);

    // Every child card's worker session is parented on the coordination session.
    for (const childId of parent.childIds) {
      const childWorker = sim.listSessions(childId).find((s) => s.role === 'worker');
      expect(childWorker, `worker session for child ${childId}`).toBeTruthy();
      expect(childWorker!.parentSessionId).toBe(coordination!.sessionId);
    }
    // The coordination transcript logged the child assignments.
    const detail = sim.getSession(coordination!.sessionId)!;
    const text = detail.transcript.map((e) => e.text).join('\n');
    for (const childId of parent.childIds) expect(text).toContain(childId);

    // Drive the stack out of DO: the coordination session completes and logs
    // child completion events; its transcript stays SMALL (§V5-6).
    expect(
      tickUntil(sim, () => cardView(sim, parent.taskId).column !== 'do', 4000),
    ).toBe(true);
    const closed = sim.getSession(coordination!.sessionId)!;
    expect(closed.record.status).toBe('completed');
    expect(closed.record.endedTick).not.toBeNull();
    expect(closed.transcript.length).toBeLessThan(50);
    expect(closed.transcript.some((e) => /completed by .* the Worker/.test(e.text))).toBe(true);
  });

  it('reviewer sessions carry reviewOfSessionId; integration sessions parent on the approving review (§V5-1 (b)/(c))', () => {
    const sim = new Simulation({ seed: 42 });
    const taskId = singlesIn(sim, 'backlog')[0]!.taskId;
    expect(driveCardTo(sim, taskId, 'approved')).toBe(true);

    // Integration agent attends APPROVED — its session is active.
    expect(
      tickUntil(
        sim,
        () => sim.listSessions(taskId).some((s) => s.role === 'integration'),
        200,
      ),
    ).toBe(true);
    const sessions = sim.listSessions(taskId);
    const integration = sessions.find((s) => s.role === 'integration')!;
    expect(integration.parentSessionId).not.toBeNull();

    // The integration parent is the APPROVING review session, which itself
    // judged the worker session of the passing attempt.
    const approving = sessions.find((s) => s.sessionId === integration.parentSessionId);
    expect(approving).toBeTruthy();
    expect(approving!.role).toBe('reviewer');
    expect(approving!.reviewOfSessionId).not.toBeNull();
    const judged = sessions.find((s) => s.sessionId === approving!.reviewOfSessionId);
    expect(judged).toBeTruthy();
    expect(judged!.role).toBe('worker');
  });

  it('listSessions(taskId?) filters by card and orders newest first', () => {
    const sim = new Simulation({ seed: 42 });
    const [first, second] = singlesIn(sim, 'backlog').map((c) => c.taskId);
    sim.moveCard(first!, 'do');
    sim.tick(30);
    sim.moveCard(second!, 'do');
    sim.tick(5);

    const all = sim.listSessions();
    expect(all.length).toBeGreaterThanOrEqual(2);
    // Unfiltered = union of the per-card views.
    expect(all.filter((s) => s.taskId === first).map((s) => s.sessionId)).toEqual(
      sim.listSessions(first!).map((s) => s.sessionId),
    );
    // Newest first: startedTick never increases down the list.
    for (let i = 1; i < all.length; i += 1) {
      expect(all[i - 1]!.startedTick).toBeGreaterThanOrEqual(all[i]!.startedTick);
    }
    // The second card's (younger) worker sorts before the first card's.
    const firstWorker = all.findIndex((s) => s.taskId === first);
    const secondWorker = all.findIndex((s) => s.taskId === second);
    expect(secondWorker).toBeGreaterThanOrEqual(0);
    expect(secondWorker).toBeLessThan(firstWorker);
    // Unknown card / unknown session probe.
    expect(sim.listSessions('no-such-task')).toEqual([]);
    expect(sim.getSession('no-such-session')).toBeNull();
  });

  it('transcripts are ring-capped at SESSION_TRANSCRIPT_CAP entries (seq keeps counting)', () => {
    const sim = new Simulation({ seed: 42 });
    const taskId = singlesIn(sim, 'backlog')[0]!.taskId;
    sim.moveCard(taskId, 'do');
    sim.tick(3);
    const worker = sim.listActiveAgentViews().find((a) => a.taskId === taskId)!;
    expect(worker).toBeTruthy();
    // Steer-spam the live agent: each message appends a transcript entry.
    for (let i = 0; i < SESSION_TRANSCRIPT_CAP + 60; i += 1) {
      sim.handleClientFrame({
        type: 'session.message',
        sessionId: worker.unitId,
        prompt: `steer ${i}`,
      });
    }
    const detail = sim.getSession(worker.unitId)!;
    expect(detail.transcript.length).toBe(SESSION_TRANSCRIPT_CAP);
    // The ring dropped the OLDEST entries: seq still strictly increases and
    // ends beyond the cap.
    const seqs = detail.transcript.map((e) => e.seq);
    expect(seqs[0]!).toBeGreaterThan(1);
    for (let i = 1; i < seqs.length; i += 1) expect(seqs[i]!).toBeGreaterThan(seqs[i - 1]!);
    expect(detail.transcript[detail.transcript.length - 1]!.text).toContain('steer');
  });

  it('status transitions: active while attached; aborted on /abort (terminal deny path)', () => {
    const sim = new Simulation({ seed: 42 });
    const taskId = singlesIn(sim, 'backlog')[0]!.taskId;
    sim.moveCard(taskId, 'do');
    sim.tick(5);

    const worker = sim.listActiveAgentViews().find((a) => a.taskId === taskId)!;
    const live = sim.listSessions(taskId).find((s) => s.sessionId === worker.unitId)!;
    expect(live.status).toBe('active');
    expect(live.endedTick).toBeNull();
    // The LIVE agent and the session record are the SAME data (no forking).
    expect(live.turnCount).toBe(worker.turnCount);
    expect(live.tokenUsage).toEqual(worker.tokenUsage);

    sim.handleClientFrame({ type: 'session.message', sessionId: worker.unitId, prompt: '/abort' });
    expect(cardView(sim, taskId).column).toBe('backlog');
    const aborted = sim.listSessions(taskId).find((s) => s.sessionId === worker.unitId)!;
    expect(aborted.status).toBe('aborted');
    expect(aborted.endedTick).not.toBeNull();
    // The transcript survived the abort.
    expect(sim.getSession(worker.unitId)!.transcript.length).toBeGreaterThan(0);
  });

  it('aborting a working STACK marks its coordination + child worker sessions aborted', () => {
    const sim = new Simulation({ seed: 42 });
    const parent = stackParents(sim)[0]!;
    sim.moveCard(parent.taskId, 'do');
    sim.tick(5);
    const childWorker = sim
      .listActiveAgentViews()
      .find((a) => parent.childIds.includes(a.taskId) && a.role === 'worker')!;
    expect(childWorker).toBeTruthy();
    sim.handleClientFrame({
      type: 'session.message',
      sessionId: childWorker.unitId,
      prompt: '/abort',
    });
    expect(cardView(sim, parent.taskId).column).toBe('backlog');
    const coordination = sim.listSessions(parent.taskId).find((s) => s.coordination)!;
    expect(coordination.status).toBe('aborted');
    for (const childId of parent.childIds) {
      const child = sim.listSessions(childId).find((s) => s.role === 'worker')!;
      expect(child.status).toBe('aborted');
    }
  });

  it('a rejected card iterates: each DO attempt mints a fresh worker session, all persisted', () => {
    const sim = new Simulation({ seed: 42 });
    const taskId = singlesIn(sim, 'backlog')[0]!.taskId;
    expect(driveCardTo(sim, taskId, 'human-review')).toBe(true);
    const attempts = cardView(sim, taskId).attempt;
    const workers = sim.listSessions(taskId).filter((s) => s.role === 'worker');
    expect(workers).toHaveLength(attempts);
    expect(new Set(workers.map((s) => s.sessionId)).size).toBe(attempts);
    // Newest first: attempt numbers never increase down the list.
    for (let i = 1; i < workers.length; i += 1) {
      expect(workers[i - 1]!.attempt).toBeGreaterThanOrEqual(workers[i]!.attempt);
    }
  });
});
