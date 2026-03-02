/**
 * Tests for session:check-iteration CLI command.
 * Verifies the enhanced response fields: found, iteration, maxIterations, runId, prompt, stopMessage.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { handleSessionCheckIteration, handleSessionInit, handleSessionUpdate } from '../session';
import { writeSessionFile } from '../../../session/write';
import { getSessionFilePath } from '../../../session/parse';
import type { SessionState } from '../../../session/types';

describe('session:check-iteration', () => {
  let testDir: string;
  let stateDir: string;
  const sessionId = 'check-iter-test';

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `session-check-iter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    stateDir = path.join(testDir, 'state');
    await fs.mkdir(stateDir, { recursive: true });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  // ── Helper: create a session state file directly ───────────────────
  async function createSessionFile(
    state: SessionState,
    prompt: string
  ): Promise<void> {
    const filePath = getSessionFilePath(stateDir, sessionId);
    await writeSessionFile(filePath, state, prompt);
  }

  function makeState(overrides: Partial<SessionState> = {}): SessionState {
    return {
      active: true,
      iteration: 1,
      maxIterations: 256,
      runId: 'run-abc',
      startedAt: '2026-01-01T00:00:00Z',
      lastIterationAt: '2026-01-01T00:00:00Z',
      iterationTimes: [],
      ...overrides,
    };
  }

  function capturedJson(): Record<string, unknown> {
    const logSpy = console.log as ReturnType<typeof vi.fn>;
    const lastCall = logSpy.mock.calls[logSpy.mock.calls.length - 1];
    return JSON.parse(lastCall[0] as string) as Record<string, unknown>;
  }

  // ── 1. Session not found ───────────────────────────────────────────

  describe('when session not found', () => {
    it('returns found=false, shouldContinue=false, reason=session_not_found, stopMessage', async () => {
      const exitCode = await handleSessionCheckIteration({
        sessionId: 'non-existent-session',
        stateDir,
        json: true,
      });

      expect(exitCode).toBe(0);

      const output = capturedJson();
      expect(output.found).toBe(false);
      expect(output.shouldContinue).toBe(false);
      expect(output.reason).toBe('session_not_found');
      expect(output.stopMessage).toBe('Session not found');
    });

    it('includes iteration=0, maxIterations=0, runId="", prompt="" when not found', async () => {
      await handleSessionCheckIteration({
        sessionId: 'missing',
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output.iteration).toBe(0);
      expect(output.maxIterations).toBe(0);
      expect(output.runId).toBe('');
      expect(output.prompt).toBe('');
    });

    it('returns exit code 0 even when session not found', async () => {
      const exitCode = await handleSessionCheckIteration({
        sessionId: 'ghost',
        stateDir,
        json: true,
      });

      expect(exitCode).toBe(0);
    });
  });

  // ── 2. Max iterations reached ──────────────────────────────────────

  describe('when max iterations reached', () => {
    it('returns found=true, shouldContinue=false, reason=max_iterations_reached', async () => {
      await createSessionFile(
        makeState({ iteration: 10, maxIterations: 10, runId: 'run-xyz' }),
        'Build the feature'
      );

      const exitCode = await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      expect(exitCode).toBe(0);

      const output = capturedJson();
      expect(output.found).toBe(true);
      expect(output.shouldContinue).toBe(false);
      expect(output.reason).toBe('max_iterations_reached');
    });

    it('includes stopMessage containing "Max iterations"', async () => {
      await createSessionFile(
        makeState({ iteration: 50, maxIterations: 50 }),
        'Some prompt'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output.stopMessage).toMatch(/Max iterations/);
      expect(output.stopMessage).toContain('50');
    });

    it('includes iteration, maxIterations, runId, prompt fields', async () => {
      await createSessionFile(
        makeState({ iteration: 25, maxIterations: 25, runId: 'run-deadline' }),
        'Deploy to production'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output.iteration).toBe(25);
      expect(output.maxIterations).toBe(25);
      expect(output.runId).toBe('run-deadline');
      expect(output.prompt).toBe('Deploy to production');
    });

    it('triggers when iteration exceeds maxIterations', async () => {
      await createSessionFile(
        makeState({ iteration: 300, maxIterations: 256 }),
        'Overrun prompt'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output.shouldContinue).toBe(false);
      expect(output.reason).toBe('max_iterations_reached');
    });
  });

  // ── 3. Should continue (happy path) ───────────────────────────────

  describe('when should continue', () => {
    it('returns found=true, shouldContinue=true', async () => {
      await createSessionFile(
        makeState({ iteration: 3, maxIterations: 256, runId: 'run-happy' }),
        'Continue the work'
      );

      const exitCode = await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      expect(exitCode).toBe(0);

      const output = capturedJson();
      expect(output.found).toBe(true);
      expect(output.shouldContinue).toBe(true);
    });

    it('includes nextIteration equal to iteration + 1', async () => {
      await createSessionFile(
        makeState({ iteration: 7, maxIterations: 100 }),
        'Prompt'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output.nextIteration).toBe(8);
    });

    it('includes updatedIterationTimes', async () => {
      await createSessionFile(
        makeState({ iteration: 2, maxIterations: 256, iterationTimes: [] }),
        'Prompt'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output).toHaveProperty('updatedIterationTimes');
      expect(Array.isArray(output.updatedIterationTimes)).toBe(true);
    });

    it('includes iteration, maxIterations, runId, prompt fields', async () => {
      await createSessionFile(
        makeState({ iteration: 4, maxIterations: 128, runId: 'run-456' }),
        'My detailed prompt'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output.iteration).toBe(4);
      expect(output.maxIterations).toBe(128);
      expect(output.runId).toBe('run-456');
      expect(output.prompt).toBe('My detailed prompt');
    });

    it('continues when maxIterations=0 (unlimited)', async () => {
      await createSessionFile(
        makeState({ iteration: 999, maxIterations: 0 }),
        'Unlimited'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output.shouldContinue).toBe(true);
      expect(output.nextIteration).toBe(1000);
    });

    it('does not include stopMessage when continuing', async () => {
      await createSessionFile(
        makeState({ iteration: 1, maxIterations: 256 }),
        'Prompt'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output).not.toHaveProperty('stopMessage');
    });
  });

  // ── 4. All responses include required fields ──────────────────────

  describe('all responses include required fields', () => {
    it('session_not_found response includes found, iteration, maxIterations, runId, prompt', async () => {
      await handleSessionCheckIteration({
        sessionId: 'does-not-exist',
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output).toHaveProperty('found');
      expect(output).toHaveProperty('iteration');
      expect(output).toHaveProperty('maxIterations');
      expect(output).toHaveProperty('runId');
      expect(output).toHaveProperty('prompt');
    });

    it('max_iterations_reached response includes found, iteration, maxIterations, runId, prompt', async () => {
      await createSessionFile(
        makeState({ iteration: 100, maxIterations: 100, runId: 'run-max' }),
        'Max prompt'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output).toHaveProperty('found');
      expect(output).toHaveProperty('iteration');
      expect(output).toHaveProperty('maxIterations');
      expect(output).toHaveProperty('runId');
      expect(output).toHaveProperty('prompt');
    });

    it('shouldContinue=true response includes found, iteration, maxIterations, runId, prompt', async () => {
      await createSessionFile(
        makeState({ iteration: 5, maxIterations: 256, runId: 'run-go' }),
        'Go prompt'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output).toHaveProperty('found');
      expect(output).toHaveProperty('iteration');
      expect(output).toHaveProperty('maxIterations');
      expect(output).toHaveProperty('runId');
      expect(output).toHaveProperty('prompt');
    });
  });

  // ── 5. Iteration too fast (runaway loop detection) ────────────────

  describe('iteration too fast (runaway loop)', () => {
    it('returns shouldContinue=false with reason=iteration_too_fast when avg <= 15s', async () => {
      // iteration >= 5 triggers timing check; provide 3 fast times
      await createSessionFile(
        makeState({
          iteration: 6,
          maxIterations: 256,
          iterationTimes: [5, 5, 5],
          lastIterationAt: new Date(Date.now() - 5000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        }),
        'Fast prompt'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output.found).toBe(true);
      expect(output.shouldContinue).toBe(false);
      expect(output.reason).toBe('iteration_too_fast');
      expect(output).toHaveProperty('averageTime');
      expect(output).toHaveProperty('threshold');
      expect(output.stopMessage).toMatch(/fast/i);
    });

    it('includes iteration, maxIterations, runId, prompt in too-fast response', async () => {
      await createSessionFile(
        makeState({
          iteration: 8,
          maxIterations: 100,
          runId: 'run-fast',
          iterationTimes: [3, 3, 3],
          lastIterationAt: new Date(Date.now() - 3000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        }),
        'Speedy prompt'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output.iteration).toBe(8);
      expect(output.maxIterations).toBe(100);
      expect(output.runId).toBe('run-fast');
      expect(output.prompt).toBe('Speedy prompt');
    });
  });

  // ── 6. Missing required arguments ─────────────────────────────────

  describe('missing arguments', () => {
    it('returns exit code 1 when sessionId is missing', async () => {
      const exitCode = await handleSessionCheckIteration({
        stateDir,
        json: true,
      });

      expect(exitCode).toBe(1);
    });

    it('returns exit code 1 when stateDir is missing', async () => {
      const exitCode = await handleSessionCheckIteration({
        sessionId,
        json: true,
      });

      expect(exitCode).toBe(1);
    });

    it('emits JSON error when both are missing', async () => {
      await handleSessionCheckIteration({
        json: true,
      });

      const errSpy = console.error as ReturnType<typeof vi.fn>;
      const errOutput = JSON.parse(errSpy.mock.calls[0][0] as string) as Record<string, unknown>;
      expect(errOutput.error).toBe('MISSING_ARGS');
    });
  });

  // ── 7. Non-JSON output mode ───────────────────────────────────────

  describe('non-JSON (human-readable) output', () => {
    it('prints shouldContinue=true in text mode', async () => {
      await createSessionFile(
        makeState({ iteration: 2, maxIterations: 100 }),
        'Text prompt'
      );

      const exitCode = await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: false,
      });

      expect(exitCode).toBe(0);

      const logSpy = console.log as ReturnType<typeof vi.fn>;
      const textOutput = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
      expect(textOutput).toContain('shouldContinue=true');
      expect(textOutput).toContain('nextIteration=3');
    });

    it('prints shouldContinue=false for not-found in text mode', async () => {
      await handleSessionCheckIteration({
        sessionId: 'ghost-session',
        stateDir,
        json: false,
      });

      const logSpy = console.log as ReturnType<typeof vi.fn>;
      const textOutput = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
      expect(textOutput).toContain('shouldContinue=false');
      expect(textOutput).toContain('session_not_found');
    });

    it('prints shouldContinue=false for max iterations in text mode', async () => {
      await createSessionFile(
        makeState({ iteration: 10, maxIterations: 10 }),
        'Max prompt'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: false,
      });

      const logSpy = console.log as ReturnType<typeof vi.fn>;
      const textOutput = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
      expect(textOutput).toContain('shouldContinue=false');
      expect(textOutput).toContain('max_iterations_reached');
    });
  });

  // ── 8. Edge cases ─────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty runId gracefully', async () => {
      await createSessionFile(
        makeState({ iteration: 1, maxIterations: 10, runId: '' }),
        'No run'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output.runId).toBe('');
      expect(output.shouldContinue).toBe(true);
    });

    it('handles iteration=1 with maxIterations=1 as max reached', async () => {
      await createSessionFile(
        makeState({ iteration: 1, maxIterations: 1 }),
        'Single'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output.shouldContinue).toBe(false);
      expect(output.reason).toBe('max_iterations_reached');
    });

    it('iteration < 5 skips timing update but still checks existing fast times', async () => {
      // iteration=4 < 5 threshold means updateIterationTimes is NOT called,
      // but isIterationTooFast still runs on existing times.
      // With [1, 1, 1] (avg=1 <= 15), it should detect runaway.
      await createSessionFile(
        makeState({
          iteration: 4,
          maxIterations: 256,
          iterationTimes: [1, 1, 1],
          lastIterationAt: new Date(Date.now() - 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        }),
        'Early prompt'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      // Even though iteration < 5 skips the timing UPDATE, the existing
      // iterationTimes [1,1,1] still trigger isIterationTooFast
      expect(output.shouldContinue).toBe(false);
      expect(output.reason).toBe('iteration_too_fast');
    });

    it('iteration < 5 with fewer than 3 times continues (isIterationTooFast needs 3)', async () => {
      // isIterationTooFast returns false when length < 3
      await createSessionFile(
        makeState({
          iteration: 3,
          maxIterations: 256,
          iterationTimes: [1, 1],
          lastIterationAt: new Date(Date.now() - 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        }),
        'Early prompt'
      );

      await handleSessionCheckIteration({
        sessionId,
        stateDir,
        json: true,
      });

      const output = capturedJson();
      expect(output.shouldContinue).toBe(true);
    });
  });
});
