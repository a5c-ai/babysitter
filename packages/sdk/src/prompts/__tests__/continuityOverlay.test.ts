import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { buildContinuityContext, renderContinuityOverlay } from '../continuityOverlay';
import { createPromptContextFromCatalog } from '../context';
import { tagPart, PART_STRATA_MAP, composeByStrata } from '../strata';
import { composeBabysitSkillPrompt } from '../compose';
import type { PromptContext, ContinuityContext } from '../types';

const mockCtx = createPromptContextFromCatalog('claude-code');

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

/**
 * Helper to create a minimal run directory with journal events.
 */
async function createRunDir(events: Array<{ type: string; data?: Record<string, unknown> }>): Promise<string> {
  const runDir = path.join(tmpDir, 'run');
  const journalDir = path.join(runDir, 'journal');
  const tasksDir = path.join(runDir, 'tasks');
  const stateDir = path.join(runDir, 'state');
  await fs.mkdir(journalDir, { recursive: true });
  await fs.mkdir(tasksDir, { recursive: true });
  await fs.mkdir(stateDir, { recursive: true });

  for (let i = 0; i < events.length; i++) {
    const seq = String(i + 1).padStart(6, '0');
    const event = {
      type: events[i].type,
      recordedAt: new Date(Date.now() + i * 1000).toISOString(),
      data: events[i].data ?? {},
      checksum: 'test',
    };
    await fs.writeFile(
      path.join(journalDir, `${seq}.test.json`),
      JSON.stringify(event),
    );
  }

  return runDir;
}

describe('GAP-PROMPT-005: Continuity Overlays for Resume', () => {
  describe('buildContinuityContext', () => {
    it('returns all-empty arrays and iteration=0 with no journal events', async () => {
      const runDir = await createRunDir([]);
      const result = await buildContinuityContext({
        runDir,
        stateDir: tmpDir,
        sessionId: 'test-session',
      });
      expect(result.resolvedEffects).toEqual([]);
      expect(result.pendingEffects).toEqual([]);
      expect(result.stateTransitions).toEqual([]);
      expect(result.modifiedFiles).toEqual([]);
      expect(result.decisions).toEqual([]);
      expect(result.iteration).toBe(0);
    });

    it('counts resolved and pending effects correctly', async () => {
      const runDir = await createRunDir([
        { type: 'RUN_CREATED', data: {} },
        { type: 'EFFECT_REQUESTED', data: { effectId: 'e1', kind: 'shell', title: 'Build', taskId: 'build' } },
        { type: 'EFFECT_REQUESTED', data: { effectId: 'e2', kind: 'agent', title: 'Review', taskId: 'review' } },
        { type: 'EFFECT_REQUESTED', data: { effectId: 'e3', kind: 'shell', title: 'Test', taskId: 'test' } },
        { type: 'EFFECT_RESOLVED', data: { effectId: 'e1' } },
        { type: 'EFFECT_RESOLVED', data: { effectId: 'e2' } },
      ]);
      const result = await buildContinuityContext({
        runDir,
        stateDir: tmpDir,
        sessionId: 'test-session',
      });
      expect(result.resolvedEffects.length).toBe(2);
      expect(result.pendingEffects.length).toBe(1);
      expect(result.pendingEffects[0].title).toBe('Test');
    });

    it('deduplicates modified files from task definitions', async () => {
      const runDir = await createRunDir([
        { type: 'EFFECT_REQUESTED', data: { effectId: 'e1', kind: 'node', title: 'Task1' } },
        { type: 'EFFECT_RESOLVED', data: { effectId: 'e1' } },
        { type: 'EFFECT_REQUESTED', data: { effectId: 'e2', kind: 'node', title: 'Task2' } },
        { type: 'EFFECT_RESOLVED', data: { effectId: 'e2' } },
      ]);

      // Create task definitions with overlapping file paths
      const t1Dir = path.join(runDir, 'tasks', 'e1');
      const t2Dir = path.join(runDir, 'tasks', 'e2');
      await fs.mkdir(t1Dir, { recursive: true });
      await fs.mkdir(t2Dir, { recursive: true });
      await fs.writeFile(path.join(t1Dir, 'task.json'), JSON.stringify({
        args: { files: ['src/a.ts', 'src/b.ts'] },
      }));
      await fs.writeFile(path.join(t2Dir, 'task.json'), JSON.stringify({
        args: { files: ['src/b.ts', 'src/c.ts'], path: 'src/d.ts' },
      }));

      const result = await buildContinuityContext({
        runDir,
        stateDir: tmpDir,
        sessionId: 'test-session',
      });
      // Deduped: a.ts, b.ts, c.ts, d.ts
      expect(result.modifiedFiles.length).toBe(4);
      expect(new Set(result.modifiedFiles).size).toBe(4);
    });

    it('caps decisions at maxDecisions', async () => {
      const runDir = await createRunDir([]);
      const sessionsDir = path.join(tmpDir, 'sessions');
      await fs.mkdir(sessionsDir, { recursive: true });
      const decisions = Array.from({ length: 10 }, (_, i) => ({
        description: `Decision ${i}`,
        timestamp: new Date().toISOString(),
      }));
      await fs.writeFile(
        path.join(sessionsDir, 'test-session.history.json'),
        JSON.stringify({ decisions }),
      );

      const result = await buildContinuityContext({
        runDir,
        stateDir: tmpDir,
        sessionId: 'test-session',
        maxDecisions: 3,
      });
      expect(result.decisions.length).toBe(3);
    });

    it('derives iteration from EFFECT_RESOLVED count (0 when none)', async () => {
      const runDir = await createRunDir([]);
      const result = await buildContinuityContext({
        runDir,
        stateDir: tmpDir,
        sessionId: 'test-session',
      });
      expect(result.iteration).toBe(0);
    });

    it('handles missing session history gracefully', async () => {
      const runDir = await createRunDir([]);
      const result = await buildContinuityContext({
        runDir,
        stateDir: tmpDir,
        sessionId: 'nonexistent-session',
      });
      expect(result.decisions).toEqual([]);
    });

    it('derives iteration count from EFFECT_RESOLVED events', async () => {
      const runDir = await createRunDir([
        { type: 'EFFECT_REQUESTED', data: { effectId: 'e1', kind: 'shell', title: 'A' } },
        { type: 'EFFECT_RESOLVED', data: { effectId: 'e1' } },
        { type: 'EFFECT_REQUESTED', data: { effectId: 'e2', kind: 'shell', title: 'B' } },
        { type: 'EFFECT_RESOLVED', data: { effectId: 'e2' } },
        { type: 'EFFECT_REQUESTED', data: { effectId: 'e3', kind: 'shell', title: 'C' } },
      ]);
      const result = await buildContinuityContext({
        runDir,
        stateDir: tmpDir,
        sessionId: 'test-session',
      });
      expect(result.iteration).toBe(2);
    });

    it('includes state transitions for RUN_CREATED events', async () => {
      const runDir = await createRunDir([
        { type: 'RUN_CREATED', data: {} },
      ]);
      const result = await buildContinuityContext({
        runDir,
        stateDir: tmpDir,
        sessionId: 'test-session',
      });
      expect(result.stateTransitions.length).toBe(1);
      expect(result.stateTransitions[0].event).toBe('RUN_CREATED');
    });
  });

  describe('renderContinuityOverlay', () => {
    it('returns empty string when ctx.continuityContext is undefined', () => {
      expect(renderContinuityOverlay(mockCtx)).toBe('');
    });

    it('returns string containing "## Resume Context" when populated', () => {
      const ctx: PromptContext = {
        ...mockCtx,
        continuityContext: {
          resolvedEffects: [{ effectId: 'e1', kind: 'shell', title: 'Build', status: 'resolved' }],
          pendingEffects: [],
          stateTransitions: [],
          modifiedFiles: [],
          decisions: [],
          iteration: 1,
          progressText: '1/1 effects resolved (iteration 1)',
        },
      };
      const result = renderContinuityOverlay(ctx);
      expect(result).toContain('## Resume Context');
    });

    it('lists pending effect titles', () => {
      const ctx: PromptContext = {
        ...mockCtx,
        continuityContext: {
          resolvedEffects: [],
          pendingEffects: [
            { effectId: 'e1', kind: 'agent', title: 'Review Code', status: 'pending' },
          ],
          stateTransitions: [],
          modifiedFiles: [],
          decisions: [],
          iteration: 2,
          progressText: '0/1 effects resolved (iteration 2)',
        },
      };
      const result = renderContinuityOverlay(ctx);
      expect(result).toContain('Review Code');
      expect(result).toContain('Pending Effects');
    });

    it('omits pending effects section when array is empty', () => {
      const ctx: PromptContext = {
        ...mockCtx,
        continuityContext: {
          resolvedEffects: [{ effectId: 'e1', kind: 'shell', title: 'Build', status: 'resolved' }],
          pendingEffects: [],
          stateTransitions: [],
          modifiedFiles: [],
          decisions: [],
          iteration: 1,
          progressText: '1/1',
        },
      };
      const result = renderContinuityOverlay(ctx);
      expect(result).not.toContain('Pending Effects');
    });

    it('lists modified files', () => {
      const ctx: PromptContext = {
        ...mockCtx,
        continuityContext: {
          resolvedEffects: [],
          pendingEffects: [],
          stateTransitions: [],
          modifiedFiles: ['src/a.ts', 'src/b.ts'],
          decisions: [],
          iteration: 0,
          progressText: '0/0',
        },
      };
      const result = renderContinuityOverlay(ctx);
      expect(result).toContain('src/a.ts');
      expect(result).toContain('Modified Files');
    });

    it('lists decisions when present', () => {
      const ctx: PromptContext = {
        ...mockCtx,
        continuityContext: {
          resolvedEffects: [],
          pendingEffects: [],
          stateTransitions: [],
          modifiedFiles: [],
          decisions: [{ description: 'Chose TDD approach', timestamp: '2026-01-01T00:00:00Z' }],
          iteration: 1,
          progressText: '0/0',
        },
      };
      const result = renderContinuityOverlay(ctx);
      expect(result).toContain('Chose TDD approach');
      expect(result).toContain('Recent Decisions');
    });
  });

  describe('PART_STRATA_MAP registration', () => {
    it('renderContinuityOverlay is registered as turnLocal', () => {
      expect(PART_STRATA_MAP.renderContinuityOverlay).toBeDefined();
      expect(PART_STRATA_MAP.renderContinuityOverlay.stratum).toBe('turnLocal');
    });

    it('renderContinuityOverlay has volatilityScore 90', () => {
      expect(PART_STRATA_MAP.renderContinuityOverlay.volatilityScore).toBe(90);
    });

    it('continuity overlay appears after lower-volatility turnLocal parts when sorted', () => {
      const cc: ContinuityContext = {
        resolvedEffects: [{ effectId: 'e1', kind: 'shell', title: 'Build', status: 'resolved' }],
        pendingEffects: [],
        stateTransitions: [],
        modifiedFiles: [],
        decisions: [],
        iteration: 1,
        progressText: '1/1',
      };
      const ctxWithContinuity: PromptContext = { ...mockCtx, continuityContext: cc };

      // Use synthetic parts with known volatility scores to test ordering
      const lowerPart = tagPart('lowerVol', 'turnLocal', () => 'LOWER', 60);
      const overlayPart = PART_STRATA_MAP.renderContinuityOverlay;
      const result = composeByStrata([overlayPart, lowerPart], ctxWithContinuity, { showStrata: true });

      expect(result).toContain('lowerVol');
      expect(result).toContain('renderContinuityOverlay');
      // Lower volatility part (60) should appear before overlay (90)
      expect(result.indexOf('lowerVol'))
        .toBeLessThan(result.indexOf('renderContinuityOverlay'));
    });
  });

  describe('composeBabysitSkillPrompt backward compat', () => {
    it('does not contain "## Resume Context" in static skill prompt', () => {
      // Default context has no continuityContext
      const result = composeBabysitSkillPrompt(mockCtx);
      expect(result).not.toContain('## Resume Context');
    });
  });

  describe('PromptContext backward compatibility', () => {
    it('context factories produce valid contexts without continuityContext', () => {
      expect(mockCtx.continuityContext).toBeUndefined();
    });
  });
});
