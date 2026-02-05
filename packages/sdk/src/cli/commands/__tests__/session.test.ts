/**
 * Tests for session CLI commands.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  handleSessionInit,
  handleSessionAssociate,
  handleSessionResume,
  handleSessionState,
  handleSessionUpdate,
} from '../session';

describe('session commands', () => {
  let testDir: string;
  let stateDir: string;
  let runsDir: string;
  const sessionId = 'test-session-123';

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `session-test-${Date.now()}`);
    stateDir = path.join(testDir, 'state');
    runsDir = path.join(testDir, 'runs');
    await fs.mkdir(stateDir, { recursive: true });
    await fs.mkdir(runsDir, { recursive: true });
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

  describe('session:init', () => {
    it('creates state file with correct content', async () => {
      const result = await handleSessionInit({
        sessionId,
        stateDir,
        maxIterations: 100,
        prompt: 'Test prompt',
        json: true,
      });

      expect(result).toBe(0);

      const stateFile = path.join(stateDir, `${sessionId}.md`);
      const content = await fs.readFile(stateFile, 'utf8');

      expect(content).toContain('active: true');
      expect(content).toContain('iteration: 1');
      expect(content).toContain('max_iterations: 100');
      expect(content).toContain('Test prompt');
    });

    it('rejects duplicate sessions', async () => {
      // Create first session
      await handleSessionInit({
        sessionId,
        stateDir,
        json: true,
      });

      // Try to create duplicate
      const result = await handleSessionInit({
        sessionId,
        stateDir,
        json: true,
      });

      expect(result).toBe(1);
    });

    it('returns error when session-id is missing', async () => {
      const result = await handleSessionInit({
        stateDir,
        json: true,
      });

      expect(result).toBe(1);
    });

    it('returns error when state-dir is missing', async () => {
      const result = await handleSessionInit({
        sessionId,
        json: true,
      });

      expect(result).toBe(1);
    });
  });

  describe('session:associate', () => {
    beforeEach(async () => {
      await handleSessionInit({
        sessionId,
        stateDir,
        json: true,
      });
    });

    it('updates run_id in state file', async () => {
      const runId = 'run-456';
      const result = await handleSessionAssociate({
        sessionId,
        stateDir,
        runId,
        json: true,
      });

      expect(result).toBe(0);

      const stateFile = path.join(stateDir, `${sessionId}.md`);
      const content = await fs.readFile(stateFile, 'utf8');

      expect(content).toContain(`run_id: "${runId}"`);
    });

    it('rejects if already associated with a run', async () => {
      const runId = 'run-456';

      // Associate first time
      await handleSessionAssociate({
        sessionId,
        stateDir,
        runId,
        json: true,
      });

      // Try to associate again
      const result = await handleSessionAssociate({
        sessionId,
        stateDir,
        runId: 'different-run',
        json: true,
      });

      expect(result).toBe(1);
    });
  });

  describe('session:state', () => {
    beforeEach(async () => {
      await handleSessionInit({
        sessionId,
        stateDir,
        maxIterations: 50,
        prompt: 'Test prompt content',
        json: true,
      });
    });

    it('reads state correctly', async () => {
      const logSpy = vi.spyOn(console, 'log');

      const result = await handleSessionState({
        sessionId,
        stateDir,
        json: true,
      });

      expect(result).toBe(0);
      expect(logSpy).toHaveBeenCalled();

      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.found).toBe(true);
      expect(output.state.active).toBe(true);
      expect(output.state.iteration).toBe(1);
      expect(output.state.maxIterations).toBe(50);
      expect(output.prompt).toContain('Test prompt content');
    });

    it('returns not-found for missing session', async () => {
      const logSpy = vi.spyOn(console, 'log');

      const result = await handleSessionState({
        sessionId: 'non-existent-session',
        stateDir,
        json: true,
      });

      expect(result).toBe(0);

      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.found).toBe(false);
    });
  });

  describe('session:update', () => {
    beforeEach(async () => {
      await handleSessionInit({
        sessionId,
        stateDir,
        json: true,
      });
    });

    it('updates iteration number', async () => {
      const result = await handleSessionUpdate({
        sessionId,
        stateDir,
        iteration: 5,
        json: true,
      });

      expect(result).toBe(0);

      const stateFile = path.join(stateDir, `${sessionId}.md`);
      const content = await fs.readFile(stateFile, 'utf8');

      expect(content).toContain('iteration: 5');
    });

    it('deletes state file when --delete is passed', async () => {
      const result = await handleSessionUpdate({
        sessionId,
        stateDir,
        delete: true,
        json: true,
      });

      expect(result).toBe(0);

      const stateFile = path.join(stateDir, `${sessionId}.md`);
      await expect(fs.access(stateFile)).rejects.toThrow();
    });
  });

  describe('session:resume', () => {
    it('returns error when run does not exist', async () => {
      const result = await handleSessionResume({
        sessionId,
        stateDir,
        runId: 'non-existent-run',
        runsDir,
        json: true,
      });

      expect(result).toBe(1);
    });

    it('creates state file for existing run', async () => {
      // Create a mock run directory
      const runId = 'existing-run';
      const runDir = path.join(runsDir, runId);
      await fs.mkdir(runDir, { recursive: true });
      await fs.mkdir(path.join(runDir, 'journal'), { recursive: true });
      await fs.writeFile(
        path.join(runDir, 'run.json'),
        JSON.stringify({ processId: 'test-process' }),
        'utf8'
      );

      const result = await handleSessionResume({
        sessionId,
        stateDir,
        runId,
        runsDir,
        json: true,
      });

      expect(result).toBe(0);

      const stateFile = path.join(stateDir, `${sessionId}.md`);
      const content = await fs.readFile(stateFile, 'utf8');

      expect(content).toContain(`run_id: "${runId}"`);
    });
  });
});
