/**
 * SPEC §7 / SPEC-V3 §V3-7 determinism contract for the kanban model:
 * "same seed + same verb sequence ⇒ identical board state + frame stream."
 * Two engines, 200 ticks, with and without a scripted verb sequence
 * (moveCard / setYolo / hook.decision-with-optionId / createTask), extended
 * per SPEC-V4 §V4-13 with the v4 verbs (revertCard / release / rollbackCard /
 * updateTask / upsertStack / updateProcessTemplate / writeFile) — and the
 * §V4-4 guarantee that setSpeed touches REAL-TIME pacing only.
 */
import { describe, expect, it } from 'vitest';

import { generateScenario, TASK_KINDS } from '../scenario';
import { Simulation } from '../simulation';
import { answerAllInquiries, collectFrames, singlesIn, tickUntil } from './helpers';

/** A scripted verb sequence that reads sim state (itself deterministic). */
function runVerbScript(sim: Simulation): void {
  sim.tick(10);

  const singles = singlesIn(sim, 'backlog').map((c) => c.taskId).sort();
  if (singles[0] !== undefined) sim.moveCard(singles[0], 'do');
  if (singles[1] !== undefined) {
    sim.setYolo(singles[1], true);
    sim.moveCard(singles[1], 'do');
  }
  const created = sim.createTask({ taskKind: 'fix' });
  if (created !== null) sim.moveCard(created, 'do');

  sim.tick(60);

  // Answer the first open inquiry via the extended hook.decision frame.
  const inquiry = sim.listInquiries()[0];
  if (inquiry) {
    sim.handleClientFrame({
      type: 'hook.decision',
      hookRequestId: inquiry.hookRequestId,
      decision: 'allow',
      optionId: inquiry.options[Math.min(1, inquiry.options.length - 1)]!.id,
    });
  }

  sim.tick(60);

  // User verdict by drag when something reached HUMAN REVIEW.
  const inReview = sim
    .listCardViews()
    .filter((c) => c.column === 'human-review' && c.parentId === null)
    .map((c) => c.taskId)
    .sort();
  if (inReview[0] !== undefined) sim.moveCard(inReview[0], 'approved');
  if (inReview[1] !== undefined) sim.moveCard(inReview[1], 'do');

  sim.tick(70);
}

/**
 * SPEC-V4 §V4-13 scripted verb sequence: drives the release rail end-to-end
 * and exercises every new v4 verb. Reads only sim state (itself
 * deterministic), so two same-seed engines replay it identically.
 */
function runVerbScriptV4(sim: Simulation): void {
  // §V4-6/§V4-5: template + stack edits BEFORE any run starts.
  sim.updateProcessTemplate('fix', ['reproduce', 'mend', 'verify twice']);
  const stackRef = sim.upsertStack({
    metadata: { name: 'Script Auditor' },
    spec: {
      baseAgent: 'codex',
      adapter: 'codex',
      model: 'gpt-5.2-codex',
      prompt: { system: 'A scripted auditor.', developer: 'Stay deterministic.' },
      approvalMode: 'prompt',
    },
    status: { phase: 'ready' },
  })!;

  const singles = singlesIn(sim, 'backlog').map((c) => c.taskId).sort();
  // §V4-5 updateTask: retitle, rebind stack, flip yolo via the editor verb.
  sim.updateTask(singles[0]!, { title: 'Scripted objective', stackRef, yolo: true });
  // §V4-8 writeFile on a backlog card's workspace skeleton.
  sim.writeFile(singles[1]!, 'src/index.ts', 'export const scripted = true;\nexport default scripted;');

  for (const id of singles) {
    sim.setYolo(id, true);
    sim.moveCard(id, 'do');
  }

  // Drive at least two cards to MERGED (yolo: review-pass → approved →
  // integration auto-moves them, §V4-1).
  tickUntil(
    sim,
    () => {
      answerAllInquiries(sim);
      return (
        sim.listCardViews().filter((c) => c.parentId === null && c.column === 'merged').length >= 2
      );
    },
    6000,
  );

  const merged = sim
    .listCardViews()
    .filter((c) => c.parentId === null && c.column === 'merged')
    .map((c) => c.taskId)
    .sort();
  if (merged[0] !== undefined) sim.revertCard(merged[0]);
  sim.release();
  sim.tick(10);
  const shipped = sim
    .listCardViews()
    .filter((c) => c.column === 'in-production' && c.parentId === null)
    .map((c) => c.taskId)
    .sort();
  if (shipped[0] !== undefined) sim.rollbackCard(shipped[0]);
  sim.tick(40);
}

describe('scenario determinism', () => {
  it('generates an identical scenario for the same seed', () => {
    expect(generateScenario(42)).toEqual(generateScenario(42));
  });

  it('seeds a backlog deck (≥5 singles + 2 stacks) and a 40–60-record brain', () => {
    for (const seed of [1, 7, 42, 1337, 99999]) {
      const scenario = generateScenario(seed);
      const singles = scenario.cards.filter(
        (c) => c.parentId === null && !scenario.cards.some((o) => o.parentId === c.resource.metadata.name),
      );
      const parents = scenario.cards.filter((c) =>
        scenario.cards.some((o) => o.parentId === c.resource.metadata.name),
      );
      expect(singles.length).toBeGreaterThanOrEqual(5);
      expect(parents).toHaveLength(2);
      for (const parent of parents) {
        const children = scenario.cards.filter((c) => c.parentId === parent.resource.metadata.name);
        expect(children.length).toBeGreaterThanOrEqual(2);
      }
      // All cards use the V2-2 kind vocabulary; several kinds are present.
      const kinds = new Set(scenario.cards.map((c) => c.taskKind));
      for (const kind of kinds) expect(TASK_KINDS).toContain(kind);
      expect(kinds.size).toBeGreaterThanOrEqual(5);
      expect(scenario.workspaces.length).toBeGreaterThanOrEqual(2);
      expect(scenario.workspaces.length).toBeLessThanOrEqual(3);
    }
  });
});

describe('engine determinism (two engines, 200 ticks)', () => {
  it('without verbs: deep-equal snapshots after 200 ticks (board never self-starts)', () => {
    const a = new Simulation({ seed: 42 });
    const b = new Simulation({ seed: 42 });
    a.tick(200);
    b.tick(200);
    const snapA = a.snapshot();
    expect(b.snapshot()).toEqual(snapA);
    // Snapshots must be JSON-serializable (replay/inspection surface).
    expect(JSON.parse(JSON.stringify(snapA))).toEqual(snapA);
    // V3 boot: nothing moves until a verb does.
    expect(snapA.cards.every((c) => c.column === 'backlog')).toBe(true);
    expect(snapA.agents).toHaveLength(0);
  });

  it('with the scripted verb sequence: identical snapshots AND identical frame streams', () => {
    const a = new Simulation({ seed: 42 });
    const b = new Simulation({ seed: 42 });
    const framesA = collectFrames(a);
    const framesB = collectFrames(b);
    runVerbScript(a);
    runVerbScript(b);
    expect(framesA.length).toBeGreaterThan(0);
    expect(framesB).toEqual(framesA);
    const snapA = a.snapshot();
    expect(b.snapshot()).toEqual(snapA);
    expect(snapA.rngDraws).toBeGreaterThan(0);
    // The script visibly moved the board.
    expect(snapA.cards.some((c) => c.column !== 'backlog')).toBe(true);
  });

  it('v4 verb script (revert/release/rollback/updateTask/upsertStack/template/writeFile): identical snapshots AND frame streams', () => {
    const a = new Simulation({ seed: 42 });
    const b = new Simulation({ seed: 42 });
    const framesA = collectFrames(a);
    const framesB = collectFrames(b);
    runVerbScriptV4(a);
    runVerbScriptV4(b);
    expect(framesA.length).toBeGreaterThan(0);
    expect(framesB).toEqual(framesA);
    const snapA = a.snapshot();
    expect(b.snapshot()).toEqual(snapA);
    expect(JSON.parse(JSON.stringify(snapA))).toEqual(snapA);
    // The script visibly exercised the release rail and the foundry.
    expect(snapA.counters.releases).toBeGreaterThanOrEqual(1);
    expect(snapA.counters.stacks).toBeGreaterThanOrEqual(1);
    expect(snapA.stacks.some((s) => s.name === 'Script Auditor')).toBe(true);
  });

  it('setSpeed affects real-time pacing ONLY: different speeds, same script, identical snapshots (§V4-4)', () => {
    const a = new Simulation({ seed: 42 });
    const b = new Simulation({ seed: 42 });
    expect(a.tickIntervalMs).toBe(800);
    expect(a.speed).toBe(1);
    expect(a.setSpeed(2)).toBe(true);
    expect(b.setSpeed(0.5)).toBe(true);
    expect(a.tickIntervalMs).toBe(400);
    expect(b.tickIntervalMs).toBe(1600);
    runVerbScriptV4(a);
    runVerbScriptV4(b);
    expect(b.snapshot()).toEqual(a.snapshot());
    // Invalid speeds are rejected without touching state.
    expect(a.setSpeed(3)).toBe(false);
    expect(a.speed).toBe(2);
  });

  it('pure v4 views (tree/content/memory-io/git-log) never perturb the engine rng', () => {
    const a = new Simulation({ seed: 42 });
    const b = new Simulation({ seed: 42 });
    const id = singlesIn(a, 'backlog')[0]!.taskId;
    a.moveCard(id, 'do');
    b.moveCard(id, 'do');
    a.tick(60);
    // Engine b interleaves view reads with its ticks — state must not drift.
    for (let i = 0; i < 6; i += 1) {
      b.tick(10);
      b.getWorkspaceTree(id);
      b.getFileContent(id, 'src/index.ts');
      b.getMemoryIO(id);
      b.getGitLog(id);
      b.listRuns();
      b.listStacks();
      b.listProcessTemplates();
    }
    expect(b.snapshot()).toEqual(a.snapshot());
  });

  it('different seeds diverge under the same verb script', () => {
    const a = new Simulation({ seed: 42 });
    const b = new Simulation({ seed: 1337 });
    runVerbScript(a);
    runVerbScript(b);
    expect(b.snapshot()).not.toEqual(a.snapshot());
  });

  it('tick(20) twice equals tick(40) once (single-step composability)', () => {
    const a = new Simulation({ seed: 42 });
    const b = new Simulation({ seed: 42 });
    const card = singlesIn(a, 'backlog')[0]!.taskId;
    a.moveCard(card, 'do');
    b.moveCard(card, 'do');
    a.tick(20);
    a.tick(20);
    b.tick(40);
    expect(b.snapshot()).toEqual(a.snapshot());
  });

  it('pause blocks auto-ticking but manual tick() still advances', () => {
    const sim = new Simulation({ seed: 42 });
    expect(sim.paused).toBe(false);
    sim.pause();
    expect(sim.paused).toBe(true);
    const before = sim.tickIndex;
    sim.tick(5);
    expect(sim.tickIndex).toBe(before + 5);
    sim.resume();
    expect(sim.paused).toBe(false);
  });

  it('sim clock is epoch-based (no Date.now())', () => {
    const sim = new Simulation({ seed: 42 });
    const t0 = sim.now();
    sim.tick(4);
    expect(sim.now()).toBe(t0 + 4 * 250);
  });
});
