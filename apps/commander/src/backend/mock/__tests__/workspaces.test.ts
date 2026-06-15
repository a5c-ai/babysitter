/**
 * SPEC-V5 §V5-3 `listWorkspaces()`: shape, card grouping, active-session
 * cross-links and determinism (derived purely from existing state — no rng
 * draws, so calling it must never perturb the simulation).
 */
import { describe, expect, it } from 'vitest';

import { Simulation } from '../simulation';
import { singlesIn, tickUntil } from './helpers';

describe('listWorkspaces (SPEC-V5 §V5-3)', () => {
  it('lists every scenario workspace with repository, phase, gitStatus and grouped cards', () => {
    const sim = new Simulation({ seed: 42 });
    const workspaces = sim.listWorkspaces();
    expect(workspaces.length).toBeGreaterThanOrEqual(2);

    const cards = sim.listCardViews();
    const seenCardIds = new Set<string>();
    for (const ws of workspaces) {
      expect(ws.workspaceId).toMatch(/^ws-/);
      expect(ws.repository).toMatch(/[\w.-]+\/[\w.-]+/);
      expect(typeof ws.phase).toBe('string');
      expect(typeof ws.dirty).toBe('boolean');
      // Cards group by their workspaceRef, sorted by taskId.
      expect(ws.cardIds).toEqual([...ws.cardIds].sort((a, b) => a.localeCompare(b)));
      expect(ws.cards.map((c) => c.taskId)).toEqual(ws.cardIds);
      for (const line of ws.cards) {
        expect(seenCardIds.has(line.taskId)).toBe(false);
        seenCardIds.add(line.taskId);
        const card = cards.find((c) => c.taskId === line.taskId)!;
        expect(card.workspaceId).toBe(ws.workspaceId);
        expect(line.title).toBe(card.title);
        // Branch/sha are empty until the first attempt cuts the agent branch.
        expect(typeof line.branch).toBe('string');
        expect(typeof line.headSha).toBe('string');
      }
      // Representative gitStatus mirrors the first card's workspace.
      if (ws.cards.length > 0) {
        expect(ws.gitStatus).not.toBeNull();
        expect(ws.gitStatus!.branch).toBe(ws.cards[0]!.branch);
        expect(ws.gitStatus!.headSha).toBe(ws.cards[0]!.headSha);
      }
      // Aggregate dirty = any card dirty.
      expect(ws.dirty).toBe(ws.cards.some((c) => c.dirty));
    }
    // Every card belongs to exactly one workspace summary.
    expect(seenCardIds.size).toBe(cards.length);
  });

  it('boot has zero active sessions; a working card surfaces in activeSessionIds', () => {
    const sim = new Simulation({ seed: 42 });
    expect(sim.listWorkspaces().every((ws) => ws.activeSessionIds.length === 0)).toBe(true);

    const card = singlesIn(sim, 'backlog')[0]!;
    expect(sim.moveCard(card.taskId, 'do')).toBe(true);
    const spawned = tickUntil(sim, () =>
      sim.listSessions().some((s) => s.status === 'active' && s.taskId === card.taskId),
    );
    expect(spawned).toBe(true);

    const ws = sim.listWorkspaces().find((w) => w.cardIds.includes(card.taskId))!;
    expect(ws).toBeDefined();
    const active = sim
      .listSessions()
      .filter((s) => s.status === 'active' && ws.cardIds.includes(s.taskId))
      .map((s) => s.sessionId)
      .sort();
    expect([...ws.activeSessionIds].sort()).toEqual(active);
    expect(ws.activeSessionIds.length).toBeGreaterThan(0);
  });

  it('is deterministic (same seed + verbs ⇒ identical output) and draws no rng (read is a pure view)', () => {
    const run = (probeEveryTick: boolean): unknown => {
      const sim = new Simulation({ seed: 42 });
      const card = singlesIn(sim, 'backlog')[0]!;
      sim.moveCard(card.taskId, 'do');
      for (let i = 0; i < 60; i += 1) {
        sim.tick(1);
        // Interleaved reads must not perturb the simulation (no rng draws).
        if (probeEveryTick) sim.listWorkspaces();
      }
      return { workspaces: sim.listWorkspaces(), cards: sim.listCardViews() };
    };
    const plain = run(false);
    const probed = run(true);
    expect(probed).toEqual(plain);
  });
});
