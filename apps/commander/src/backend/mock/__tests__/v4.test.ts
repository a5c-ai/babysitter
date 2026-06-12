/**
 * SPEC-V4 backend contract suite:
 *   §V4-1 release rail (merged / in-production, revert / release / rollback,
 *          compaction), §V4-4 pacing + speed, §V4-5 agent stacks + updateTask
 *          + upsertStack, §V4-6 runs registry + process templates, §V4-8 file
 *          model (tree / content / writeFile diff consistency), §V4-9 memory
 *          I/O ledgers, §V4-7 git log.
 */
import { describe, expect, it } from 'vitest';

import type { ServerFrame } from '../../../contracts/gateway-protocol';
import {
  DEFAULT_STACK_BY_KIND,
  SEEDED_STACKS,
  WORKER_ADAPTER_BY_KIND,
} from '../scenario';
import {
  DEFAULT_TICK_INTERVAL_MS,
  IN_PRODUCTION_COMPACT_TICKS,
  Simulation,
  type SimFileTreeNode,
} from '../simulation';
import {
  answerAllInquiries,
  cardView,
  collectFrames,
  driveCardTo,
  movesOf,
  singlesIn,
  tickUntil,
} from './helpers';

/** Drive `want` yolo singles into the MERGED lane; returns their ids. */
function driveToMerged(sim: Simulation, want: number): string[] {
  for (const c of singlesIn(sim, 'backlog')) {
    sim.setYolo(c.taskId, true);
    sim.moveCard(c.taskId, 'do');
  }
  const inMerged = (): string[] =>
    sim
      .listCardViews()
      .filter((c) => c.parentId === null && c.column === 'merged')
      .map((c) => c.taskId);
  const ok = tickUntil(
    sim,
    () => {
      answerAllInquiries(sim);
      return inMerged().length >= want;
    },
    8000,
  );
  expect(ok, `>=${want} yolo cards must reach MERGED`).toBe(true);
  return inMerged();
}

function simEvents(frames: ServerFrame[], type: string): Array<Record<string, unknown>> {
  return frames
    .filter(
      (f): f is Extract<ServerFrame, { type: 'run.event' }> =>
        f.type === 'run.event' && f.event['type'] === type,
    )
    .map((f) => f.event);
}

function leafPaths(node: SimFileTreeNode): string[] {
  if (node.type === 'file') return [node.path];
  return (node.children ?? []).flatMap(leafPaths);
}

// ---------------------------------------------------------------------------
// §V4-1 release rail
// ---------------------------------------------------------------------------

describe('release rail (§V4-1)', () => {
  it('integration completion AUTO-moves approved → merged with reason integration-complete', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const [mergedId] = driveToMerged(sim, 1);
    const view = cardView(sim, mergedId!);
    expect(view.column).toBe('merged');
    expect(view.merged).toBe(true);
    expect(movesOf(frames, mergedId!)).toContainEqual({
      from: 'approved',
      to: 'merged',
      reason: 'integration-complete',
    });
    // APPROVED no longer holds terminal cards.
    expect(
      sim.listCardViews().filter((c) => c.column === 'approved' && c.merged),
    ).toEqual([]);
  });

  it('revertCard: merged → DO with a reverted feedback event and a fresh worker on arrival', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const [id] = driveToMerged(sim, 1);
    expect(sim.revertCard(id!)).toBe(true);
    const view = cardView(sim, id!);
    expect(view.column).toBe('do');
    expect(view.merged).toBe(false);
    expect(view.feedback).toMatch(/revert/i);
    // Fresh worker spawned on arrival in DO.
    expect(view.agentIds.length).toBeGreaterThanOrEqual(1);
    expect(simEvents(frames, 'reverted').some((e) => e['taskId'] === id)).toBe(true);
    expect(movesOf(frames, id!)).toContainEqual({ from: 'merged', to: 'do', reason: 'reverted' });
    // Revert is only legal from MERGED.
    expect(sim.revertCard(id!)).toBe(false);
    expect(sim.revertCard('adr-99-nope')).toBe(false);
  });

  it('release(): ALL merged cards ship to in-production as one staggered rel-NN train', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const merged = driveToMerged(sim, 2);
    expect(merged.length).toBeGreaterThanOrEqual(2);

    const releaseId = sim.release();
    expect(releaseId).toBe('rel-01');
    // Staggered: the first wagon ships immediately, the rest over later ticks.
    expect(cardView(sim, merged[0]!).column).toBe('in-production');
    expect(cardView(sim, merged[1]!).column).toBe('merged');
    sim.tick(merged.length);
    for (const id of merged) {
      const view = cardView(sim, id);
      expect(view.column).toBe('in-production');
      expect(view.releaseId).toBe('rel-01');
      expect(movesOf(frames, id)).toContainEqual({
        from: 'merged',
        to: 'in-production',
        reason: 'release-shipped',
      });
    }
    const shippedEvents = simEvents(frames, 'release_shipped');
    expect(shippedEvents.length).toBeGreaterThanOrEqual(merged.length);
    expect(shippedEvents.every((e) => e['releaseId'] === 'rel-01')).toBe(true);

    // An empty MERGED lane refuses the lever.
    expect(sim.release()).toBeNull();

    // The next train mints rel-02 (deterministic counter).
    const next = driveToMerged(sim, 1);
    expect(next.length).toBeGreaterThanOrEqual(1);
    expect(sim.release()).toBe('rel-02');
  });

  it('rollbackCard: in-production → merged with a rolled_back event', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const merged = driveToMerged(sim, 1);
    sim.release();
    sim.tick(merged.length);
    const id = merged[0]!;
    expect(cardView(sim, id).column).toBe('in-production');
    expect(sim.rollbackCard(id)).toBe(true);
    const view = cardView(sim, id);
    expect(view.column).toBe('merged');
    expect(view.merged).toBe(true);
    expect(view.releaseId).toBeNull();
    expect(simEvents(frames, 'rolled_back').some((e) => e['taskId'] === id)).toBe(true);
    expect(movesOf(frames, id)).toContainEqual({
      from: 'in-production',
      to: 'merged',
      reason: 'rolled-back',
    });
    // Rollback is only legal from IN PRODUCTION.
    expect(sim.rollbackCard(id)).toBe(false);
  });

  it('in-production cards raise the compaction flag after 30 ticks', () => {
    const sim = new Simulation({ seed: 42 });
    const merged = driveToMerged(sim, 1);
    sim.release();
    sim.tick(merged.length);
    const id = merged[0]!;
    expect(cardView(sim, id).compacted).toBe(false);
    sim.tick(IN_PRODUCTION_COMPACT_TICKS + 1);
    expect(cardView(sim, id).compacted).toBe(true);
    // Merged/in-production cards remain illegal moveCard targets/sources.
    expect(sim.moveCard(id, 'do')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// §V4-4 pacing
// ---------------------------------------------------------------------------

describe('pacing + speed (§V4-4)', () => {
  it('defaults: tickIntervalMs 800, speed 1; setSpeed maps 0.5/1/2 → 1600/800/400', () => {
    const sim = new Simulation({ seed: 42 });
    expect(DEFAULT_TICK_INTERVAL_MS).toBe(800);
    expect(sim.tickIntervalMs).toBe(800);
    expect(sim.speed).toBe(1);
    expect(sim.setSpeed(0.5)).toBe(true);
    expect(sim.tickIntervalMs).toBe(1600);
    expect(sim.setSpeed(2)).toBe(true);
    expect(sim.tickIntervalMs).toBe(400);
    expect(sim.setSpeed(1)).toBe(true);
    expect(sim.tickIntervalMs).toBe(800);
    expect(sim.setSpeed(4)).toBe(false);
  });

  it('sim-time per tick is unchanged (tick(n) semantics, §V4-4)', () => {
    const sim = new Simulation({ seed: 42 });
    const t0 = sim.now();
    sim.setSpeed(2);
    sim.tick(4);
    expect(sim.now()).toBe(t0 + 4 * 250);
  });
});

// ---------------------------------------------------------------------------
// §V4-5 agent stacks + updateTask + upsertStack
// ---------------------------------------------------------------------------

describe('agent stacks (§V4-5)', () => {
  it('seeds 4 stacks, one per adapter family, with distinct written personalities', () => {
    const sim = new Simulation({ seed: 42 });
    const stacks = sim.listStacks();
    expect(stacks.filter((s) => !s.custom)).toHaveLength(4);
    const adapters = new Set(stacks.map((s) => s.stack.spec.adapter));
    expect(adapters).toEqual(new Set(['claude-code', 'codex', 'gemini-cli', 'pi']));
    const personalities = stacks.map((s) => s.stack.spec.prompt.system);
    expect(new Set(personalities).size).toBe(4);
    for (const p of personalities) expect(p.length).toBeGreaterThan(40);
    // The kind → stack default mapping mirrors the kind → adapter mapping.
    for (const [kind, stackRef] of Object.entries(DEFAULT_STACK_BY_KIND)) {
      const seeded = SEEDED_STACKS.find((s) => s.stackRef === stackRef)!;
      expect(seeded.stack.spec.adapter).toBe(
        WORKER_ADAPTER_BY_KIND[kind as keyof typeof WORKER_ADAPTER_BY_KIND],
      );
    }
  });

  it('worker spawn binds the card stack: adapter/model from the stack, stackRef on agent + card, persona in the transcript', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const card = singlesIn(sim, 'backlog')[0]!;
    expect(card.stackRef).toBe(DEFAULT_STACK_BY_KIND[card.taskKind]);
    sim.moveCard(card.taskId, 'do');
    const worker = sim.listActiveAgentViews().find((a) => a.taskId === card.taskId)!;
    const seeded = SEEDED_STACKS.find((s) => s.stackRef === card.stackRef)!;
    expect(worker.stackRef).toBe(card.stackRef);
    expect(worker.stackName).toBe(seeded.stack.metadata.name);
    expect(worker.agent).toBe(seeded.stack.spec.adapter);
    expect(worker.model).toBe(seeded.stack.spec.model);
    // Transcript first message references the personality.
    const firstText = frames.find(
      (f) =>
        f.type === 'run.event' &&
        f.event['type'] === 'text_delta' &&
        f.event['sessionId'] === worker.unitId,
    );
    expect(firstText).toBeDefined();
    expect(String(firstText!.type === 'run.event' ? firstText!.event['delta'] : '')).toContain(
      seeded.stack.metadata.name,
    );
  });

  it('upsertStack mints stk-cNN ids, emits stack_forged, and updates in place when stackRef is known', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const stackRef = sim.upsertStack({
      metadata: { name: 'Spec-Citing Auditor' },
      spec: {
        baseAgent: 'claude-code',
        adapter: 'claude-code',
        model: 'claude-fable-5',
        prompt: { system: 'Trusts nothing it has not measured.', developer: 'Cite spec lines.' },
        approvalMode: 'manual',
      },
      status: { phase: 'ready' },
    });
    expect(stackRef).toBe('stk-c01');
    expect(simEvents(frames, 'stack_forged').some((e) => e['stackRef'] === 'stk-c01')).toBe(true);
    expect(sim.listStacks().some((s) => s.stackRef === 'stk-c01' && s.custom)).toBe(true);

    // Update-in-place keeps the id; a second NEW stack mints stk-c02.
    const updated = sim.upsertStack({
      stackRef: 'stk-c01',
      metadata: { name: 'Spec-Citing Auditor II' },
      spec: {
        baseAgent: 'claude-code',
        adapter: 'claude-code',
        model: 'claude-fable-5',
        prompt: { system: 'Now twice as suspicious.' },
        approvalMode: 'manual',
      },
      status: { phase: 'ready' },
    });
    expect(updated).toBe('stk-c01');
    expect(sim.listStacks().find((s) => s.stackRef === 'stk-c01')!.name).toBe(
      'Spec-Citing Auditor II',
    );
    const second = sim.upsertStack({
      metadata: { name: 'Another' },
      spec: {
        baseAgent: 'pi',
        adapter: 'pi',
        model: 'pi-2.5',
        prompt: { system: 'Quick.' },
        approvalMode: 'yolo',
      },
      status: { phase: 'ready' },
    });
    expect(second).toBe('stk-c02');
    // Invalid input is refused.
    expect(
      sim.upsertStack({
        metadata: { name: '' },
        spec: {
          baseAgent: 'pi',
          adapter: 'pi',
          model: 'pi-2.5',
          prompt: { system: '' },
          approvalMode: 'yolo',
        },
        status: { phase: 'ready' },
      }),
    ).toBeNull();
  });

  it('updateTask persists title/kind/description/yolo/stackRef with a task_updated event; the next spawn honors the bound stack', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const stackRef = sim.upsertStack({
      metadata: { name: 'Custom Scout' },
      spec: {
        baseAgent: 'pi',
        adapter: 'pi',
        model: 'pi-2.5',
        prompt: { system: 'A custom scout persona.' },
        approvalMode: 'prompt',
      },
      status: { phase: 'ready' },
    })!;
    const card = singlesIn(sim, 'backlog')[0]!;
    expect(
      sim.updateTask(card.taskId, {
        title: 'Re-titled objective',
        taskKind: 'docs',
        description: 'A careful description.',
        yolo: true,
        stackRef,
      }),
    ).toBe(true);
    const view = cardView(sim, card.taskId);
    expect(view.title).toBe('Re-titled objective');
    expect(view.taskKind).toBe('docs');
    expect(view.description).toBe('A careful description.');
    expect(view.yolo).toBe(true);
    expect(view.stackRef).toBe(stackRef);
    expect(simEvents(frames, 'task_updated').some((e) => e['taskId'] === card.taskId)).toBe(true);

    // Next spawn binds the custom stack.
    sim.moveCard(card.taskId, 'do');
    const worker = sim.listActiveAgentViews().find((a) => a.taskId === card.taskId)!;
    expect(worker.stackRef).toBe(stackRef);
    expect(worker.stackName).toBe('Custom Scout');
    expect(worker.agent).toBe('pi');

    // Validation: unknown kind / stack / task are refused.
    expect(sim.updateTask(card.taskId, { taskKind: 'paint' as never })).toBe(false);
    expect(sim.updateTask(card.taskId, { stackRef: 'stk-nope' })).toBe(false);
    expect(sim.updateTask('adr-99-nope', { title: 'x' })).toBe(false);
    // Parent reassignment is legal only in backlog.
    const parentCard = sim.listCardViews().find((c) => c.childIds.length >= 2)!;
    expect(sim.updateTask(card.taskId, { parentId: parentCard.taskId })).toBe(false);
  });

  it('a kind change remaps the DEFAULT stack only while stackRef is untouched', () => {
    const sim = new Simulation({ seed: 42 });
    const [a, b] = singlesIn(sim, 'backlog');
    // Untouched: default follows the kind.
    sim.updateTask(a!.taskId, { taskKind: 'docs' });
    expect(cardView(sim, a!.taskId).stackRef).toBe(DEFAULT_STACK_BY_KIND['docs']);
    sim.updateTask(a!.taskId, { taskKind: 'fix' });
    expect(cardView(sim, a!.taskId).stackRef).toBe(DEFAULT_STACK_BY_KIND['fix']);
    // Explicitly bound: the kind change must NOT remap.
    sim.updateTask(b!.taskId, { stackRef: 'stk-04' });
    sim.updateTask(b!.taskId, { taskKind: 'implement' });
    expect(cardView(sim, b!.taskId).stackRef).toBe('stk-04');
  });
});

// ---------------------------------------------------------------------------
// §V4-6 runs registry + process templates
// ---------------------------------------------------------------------------

describe('runs registry + process templates (§V4-6)', () => {
  it('every card attempt is a registered run with a pinned processId and live token/cost totals', () => {
    const sim = new Simulation({ seed: 42 });
    const card = singlesIn(sim, 'backlog')[0]!;
    sim.moveCard(card.taskId, 'do');
    sim.tick(30);
    const runs = sim.listRuns();
    expect(runs.length).toBeGreaterThanOrEqual(1);
    const run = runs.find((r) => r.taskId === card.taskId)!;
    expect(run.processId).toBe(`commander/${card.taskKind}@v1`);
    expect(run.processRevision).toBe(1);
    expect(run.observedState).toBe('waiting');
    expect(run.phases.length).toBeGreaterThanOrEqual(2);
    expect(run.tokens.inputTokens).toBeGreaterThan(0);
    expect(run.costUsd).toBeGreaterThan(0);
    expect(run.startedAt).toBeGreaterThan(0);
    expect(run.endedAt).toBeNull();
  });

  it('listRuns is newest first', () => {
    const sim = new Simulation({ seed: 42 });
    const [a, b] = singlesIn(sim, 'backlog');
    sim.moveCard(a!.taskId, 'do');
    sim.tick(5);
    sim.moveCard(b!.taskId, 'do');
    const runs = sim.listRuns();
    expect(runs.length).toBeGreaterThanOrEqual(2);
    expect(runs[0]!.taskId).toBe(b!.taskId);
    expect(runs[1]!.taskId).toBe(a!.taskId);
  });

  it('updateProcessTemplate: >=2 phases enforced, revision bump + process_updated, NEXT run pinned, running runs keep theirs', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);

    // An old run pinned to v1 BEFORE the edit.
    const first = sim.createTask({ taskKind: 'fix' })!;
    sim.moveCard(first, 'do');
    const oldRun = sim.listRuns().find((r) => r.taskId === first)!;
    expect(oldRun.processId).toBe('commander/fix@v1');

    // Validation: <2 phases and empty labels are refused, unknown kinds too.
    expect(sim.updateProcessTemplate('fix', ['only-one'])).toBeNull();
    expect(sim.updateProcessTemplate('fix', ['a', ' '])).toBeNull();
    expect(sim.updateProcessTemplate('paint' as never, ['a', 'b'])).toBeNull();

    const revision = sim.updateProcessTemplate('fix', ['reproduce', 'calibrate-gears', 'verify']);
    expect(revision).toBe(2);
    expect(
      simEvents(frames, 'process_updated').some(
        (e) => e['processId'] === 'commander/fix@v2',
      ),
    ).toBe(true);
    expect(
      sim.listProcessTemplates().find((t) => t.kind === 'fix'),
    ).toMatchObject({ processId: 'commander/fix@v2', revision: 2, phases: ['reproduce', 'calibrate-gears', 'verify'] });

    // The RUNNING run keeps its pinned revision and phases.
    const oldAfter = sim.listRuns().find((r) => r.runId === oldRun.runId)!;
    expect(oldAfter.processRevision).toBe(1);
    expect(oldAfter.phases.map((p) => p.label)).not.toContain('calibrate-gears');

    // The NEXT run for the kind pins v2 with the new pipeline.
    const second = sim.createTask({ taskKind: 'fix' })!;
    sim.moveCard(second, 'do');
    const newRun = sim.listRuns().find((r) => r.taskId === second)!;
    expect(newRun.processId).toBe('commander/fix@v2');
    expect(newRun.phases.map((p) => p.label)).toEqual(['reproduce', 'calibrate-gears', 'verify']);
  });
});

// ---------------------------------------------------------------------------
// §V4-8 file model
// ---------------------------------------------------------------------------

describe('workspace file model (§V4-8)', () => {
  it('getWorkspaceTree: nested, 8–20 plausible files, includes the changed files; same seed ⇒ identical', () => {
    const sim = new Simulation({ seed: 42 });
    const card = singlesIn(sim, 'backlog')[0]!;
    sim.moveCard(card.taskId, 'do');
    sim.tick(80);
    answerAllInquiries(sim);
    const tree = sim.getWorkspaceTree(card.taskId)!;
    expect(tree.type).toBe('dir');
    const files = leafPaths(tree);
    expect(files.length).toBeGreaterThanOrEqual(8);
    expect(files.length).toBeLessThanOrEqual(20);
    expect(files).toContain('package.json');
    expect(files.some((p) => p.startsWith('src/'))).toBe(true);
    const ws = sim.getWorkspaceView(card.taskId)!;
    for (const f of ws.files) expect(files).toContain(f.path);
    // Nested shape: src/ is a dir node with children.
    const srcDir = tree.children!.find((c) => c.name === 'src');
    expect(srcDir?.type).toBe('dir');
    expect((srcDir?.children ?? []).length).toBeGreaterThan(0);
    // Determinism across engines.
    const other = new Simulation({ seed: 42 });
    other.moveCard(card.taskId, 'do');
    other.tick(80);
    answerAllInquiries(other);
    expect(other.getWorkspaceTree(card.taskId)).toEqual(tree);
    expect(sim.getWorkspaceTree('adr-99-nope')).toBeNull();
  });

  it('getFileContent: deterministic 20–80 lines; CHANGED files contain their diff hunks\' added lines', () => {
    const sim = new Simulation({ seed: 42 });
    const card = singlesIn(sim, 'backlog')[0]!;
    sim.moveCard(card.taskId, 'do');
    const ok = tickUntil(
      sim,
      () => {
        answerAllInquiries(sim);
        return (sim.getWorkspaceView(card.taskId)?.files.length ?? 0) >= 1;
      },
      2000,
    );
    expect(ok).toBe(true);
    // Plain tree file.
    const plain = sim.getFileContent(card.taskId, 'package.json')!;
    const plainLines = plain.split('\n');
    expect(plainLines.length).toBeGreaterThanOrEqual(20);
    expect(plainLines.length).toBeLessThanOrEqual(80);
    expect(sim.getFileContent(card.taskId, 'package.json')).toBe(plain);
    // Changed file reflects its diff hunks applied.
    const changed = sim.getWorkspaceView(card.taskId)!.files[0]!;
    const content = sim.getFileContent(card.taskId, changed.path)!;
    const added = changed.diff
      .split('\n')
      .filter((l) => l.startsWith('+'))
      .map((l) => l.slice(1));
    expect(added.length).toBeGreaterThanOrEqual(1);
    for (const line of added) expect(content).toContain(line);
    const lines = content.split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(20);
    expect(lines.length).toBeLessThanOrEqual(80);
    // Unknown paths answer null.
    expect(sim.getFileContent(card.taskId, 'no/such/file.bin')).toBeNull();
  });

  it('writeFile: overrides content, updates dirty count + a diff vs the PRE-EDIT content, emits workspace_change', () => {
    const sim = new Simulation({ seed: 42 });
    const frames = collectFrames(sim);
    const card = singlesIn(sim, 'backlog')[0]!;
    const before = sim.getFileContent(card.taskId, 'src/index.ts')!;
    const next = `${before}\nexport const forgedByHand = true;`;
    expect(sim.writeFile(card.taskId, 'src/index.ts', next)).toBe(true);
    // Content now answers the override.
    expect(sim.getFileContent(card.taskId, 'src/index.ts')).toBe(next);
    // The workspace view gained a dirty file whose diff carries the new line.
    const ws = sim.getWorkspaceView(card.taskId)!;
    const file = ws.files.find((f) => f.path === 'src/index.ts')!;
    expect(ws.gitStatus.dirty).toBe(true);
    expect(cardView(sim, card.taskId).dirtyFileCount).toBeGreaterThanOrEqual(1);
    expect(file.diff).toContain('+export const forgedByHand = true;');
    expect(file.additions).toBeGreaterThanOrEqual(1);
    expect(
      simEvents(frames, 'workspace_change').some(
        (e) => e['taskId'] === card.taskId && e['path'] === 'src/index.ts' && e['source'] === 'editor',
      ),
    ).toBe(true);
    // New files land as additions and join the tree.
    expect(sim.writeFile(card.taskId, 'docs/hand-forged.md', '# Hand forged\n\nBy the operator.')).toBe(true);
    expect(leafPaths(sim.getWorkspaceTree(card.taskId)!)).toContain('docs/hand-forged.md');
    expect(sim.getWorkspaceView(card.taskId)!.files.find((f) => f.path === 'docs/hand-forged.md')!.status).toBe('A');
    expect(sim.writeFile('adr-99-nope', 'x.ts', 'x')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// §V4-9 memory I/O + §V4-7 git log
// ---------------------------------------------------------------------------

describe('memory I/O ledgers (§V4-9)', () => {
  it('getMemoryIO accumulates read pieces from memory_query and written proposals from memory_update, by card OR agent ref', () => {
    const sim = new Simulation({ seed: 42 });
    for (const c of singlesIn(sim, 'backlog')) sim.moveCard(c.taskId, 'do');
    let taskId: string | null = null;
    const ok = tickUntil(
      sim,
      () => {
        answerAllInquiries(sim);
        for (const c of sim.listCardViews()) {
          const io = sim.getMemoryIO(c.taskId);
          if (io.read.length >= 1 && io.written.length >= 1) {
            taskId = c.taskId;
            return true;
          }
        }
        return false;
      },
      4000,
    );
    expect(ok && taskId !== null).toBe(true);
    const io = sim.getMemoryIO(taskId!);
    const silos = new Set(sim.listMemorySilos().map((s) => s.name));
    for (const read of io.read) {
      expect(read.recordId.length).toBeGreaterThan(0);
      expect(read.kind.length).toBeGreaterThan(0);
      expect(silos.has(read.silo)).toBe(true);
      expect(read.tick).toBeGreaterThanOrEqual(0);
    }
    for (const write of io.written) {
      expect(write.updateId).toMatch(/^mu-\d+-\d{4}$/);
      expect(silos.has(write.silo)).toBe(true);
      expect(write.changes.length).toBeGreaterThanOrEqual(1);
      expect(write.phase.length).toBeGreaterThan(0);
    }
    // Agent-ref lookup: a unit's ledger is a subset of its card's ledger.
    const unitId = io.read[0]!.unitId;
    const byUnit = sim.getMemoryIO(unitId);
    expect(byUnit.read.length).toBeGreaterThanOrEqual(1);
    expect(byUnit.read.every((r) => r.unitId === unitId)).toBe(true);
    // Unknown refs answer empty ledgers.
    expect(sim.getMemoryIO('nope')).toEqual({ read: [], written: [] });
  });
});

describe('git log (§V4-7)', () => {
  it('derives deterministic commits from the journal/phases, newest first', () => {
    const sim = new Simulation({ seed: 42 });
    const card = singlesIn(sim, 'backlog')[0]!;
    sim.setYolo(card.taskId, true);
    expect(driveCardTo(sim, card.taskId, 'merged', 8000)).toBe(true);
    const log = sim.getGitLog(card.taskId);
    expect(log.length).toBeGreaterThanOrEqual(2);
    for (const commit of log) {
      expect(commit.sha).toMatch(/^[0-9a-f]{12}$/);
      expect(commit.message.length).toBeGreaterThan(0);
      expect(commit.tick).toBeGreaterThanOrEqual(0);
    }
    // Newest first; the base branch-cut commit sits last.
    for (let i = 1; i < log.length; i += 1) {
      expect(log[i]!.tick).toBeLessThanOrEqual(log[i - 1]!.tick);
    }
    expect(log[log.length - 1]!.message).toMatch(/branch agent\//);
    // Deterministic across engines.
    const other = new Simulation({ seed: 42 });
    other.setYolo(card.taskId, true);
    expect(driveCardTo(other, card.taskId, 'merged', 8000)).toBe(true);
    expect(other.getGitLog(card.taskId)).toEqual(log);
    expect(sim.getGitLog('adr-99-nope')).toEqual([]);
  });
});
