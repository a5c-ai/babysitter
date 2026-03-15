import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parseRunDir, getTaskDetail } from '../../lib/parser';
import { RunCache } from '../../lib/run-cache';

describe('missing-files edge cases', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'missing-files-test-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ---------------------------------------------------------------------------
  // parseRunDir with missing inputs.json
  // ---------------------------------------------------------------------------
  describe('parseRunDir with missing inputs.json', () => {
    it('handles missing inputs.json gracefully', () => {
      const runDir = path.join(tmpDir, 'run-no-inputs');
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'test-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.prompt).toBeUndefined();
    });

    it('falls back to run.json prompt when inputs.json is missing', () => {
      const runDir = path.join(tmpDir, 'run-with-prompt');
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({
          runId: 'test-002',
          processId: 'proc-002',
          createdAt: '2026-01-01T00:00:00Z',
          prompt: 'Prompt from run.json',
        }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.prompt).toBe('Prompt from run.json');
    });

    it('handles corrupt inputs.json gracefully', () => {
      const runDir = path.join(tmpDir, 'run-corrupt-inputs');
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'test-003', processId: 'proc-003', createdAt: '2026-01-01T00:00:00Z' }),
      );
      fs.writeFileSync(path.join(runDir, 'inputs.json'), '{invalid json}');

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.prompt).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getTaskDetail with various missing files
  // ---------------------------------------------------------------------------
  describe('getTaskDetail with missing task.json', () => {
    it('uses defaults when task.json is missing', () => {
      const runDir = path.join(tmpDir, 'run-no-task-json');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });

      const detail = getTaskDetail(runDir, 'eff-001');
      expect(detail).not.toBeNull();
      expect(detail!.effectId).toBe('eff-001');
      expect(detail!.kind).toBe('node'); // default
      expect(detail!.title).toBe('eff-001'); // fallback to effectId
      expect(detail!.status).toBe('requested');
    });

    it('uses result.json when task.json is missing', () => {
      const runDir = path.join(tmpDir, 'run-result-only');
      const taskDir = path.join(runDir, 'tasks', 'eff-002');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(
        path.join(taskDir, 'result.json'),
        JSON.stringify({ output: 'success', resolvedAt: '2026-01-01T00:00:01Z' }),
      );

      const detail = getTaskDetail(runDir, 'eff-002');
      expect(detail).not.toBeNull();
      expect(detail!.status).toBe('resolved');
      expect(detail!.result).toBeDefined();
    });

    it('detects error status from result.json even without task.json', () => {
      const runDir = path.join(tmpDir, 'run-error-result');
      const taskDir = path.join(runDir, 'tasks', 'eff-003');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(
        path.join(taskDir, 'result.json'),
        JSON.stringify({ error: 'Task failed', resolvedAt: '2026-01-01T00:00:01Z' }),
      );

      const detail = getTaskDetail(runDir, 'eff-003');
      expect(detail).not.toBeNull();
      expect(detail!.status).toBe('error');
      expect(detail!.error).toBe('Task failed');
    });
  });

  describe('getTaskDetail with missing result.json', () => {
    it('defaults to requested status without result.json', () => {
      const runDir = path.join(tmpDir, 'run-no-result');
      const taskDir = path.join(runDir, 'tasks', 'eff-004');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(
        path.join(taskDir, 'task.json'),
        JSON.stringify({ kind: 'node', title: 'Test Task', taskId: 'my-task' }),
      );

      const detail = getTaskDetail(runDir, 'eff-004');
      expect(detail).not.toBeNull();
      expect(detail!.status).toBe('requested');
      expect(detail!.result).toBeUndefined();
      expect(detail!.error).toBeUndefined();
    });
  });

  describe('getTaskDetail with missing stdout/stderr', () => {
    it('handles missing stdout.txt', () => {
      const runDir = path.join(tmpDir, 'run-no-stdout');
      const taskDir = path.join(runDir, 'tasks', 'eff-005');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(path.join(taskDir, 'task.json'), JSON.stringify({ kind: 'node', title: 'Test' }));

      const detail = getTaskDetail(runDir, 'eff-005');
      expect(detail).not.toBeNull();
      expect(detail!.stdout).toBeUndefined();
    });

    it('handles missing stderr.txt', () => {
      const runDir = path.join(tmpDir, 'run-no-stderr');
      const taskDir = path.join(runDir, 'tasks', 'eff-006');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(path.join(taskDir, 'task.json'), JSON.stringify({ kind: 'node', title: 'Test' }));

      const detail = getTaskDetail(runDir, 'eff-006');
      expect(detail).not.toBeNull();
      expect(detail!.stderr).toBeUndefined();
    });

    it('handles missing both stdout and stderr', () => {
      const runDir = path.join(tmpDir, 'run-no-logs');
      const taskDir = path.join(runDir, 'tasks', 'eff-007');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(path.join(taskDir, 'task.json'), JSON.stringify({ kind: 'node', title: 'Test' }));

      const detail = getTaskDetail(runDir, 'eff-007');
      expect(detail).not.toBeNull();
      expect(detail!.stdout).toBeUndefined();
      expect(detail!.stderr).toBeUndefined();
    });

    it('reads only stdout when stderr is missing', () => {
      const runDir = path.join(tmpDir, 'run-stdout-only');
      const taskDir = path.join(runDir, 'tasks', 'eff-008');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(path.join(taskDir, 'task.json'), JSON.stringify({ kind: 'node', title: 'Test' }));
      fs.writeFileSync(path.join(taskDir, 'stdout.txt'), 'stdout content');

      const detail = getTaskDetail(runDir, 'eff-008');
      expect(detail).not.toBeNull();
      expect(detail!.stdout).toBe('stdout content');
      expect(detail!.stderr).toBeUndefined();
    });

    it('reads only stderr when stdout is missing', () => {
      const runDir = path.join(tmpDir, 'run-stderr-only');
      const taskDir = path.join(runDir, 'tasks', 'eff-009');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(path.join(taskDir, 'task.json'), JSON.stringify({ kind: 'node', title: 'Test' }));
      fs.writeFileSync(path.join(taskDir, 'stderr.txt'), 'stderr content');

      const detail = getTaskDetail(runDir, 'eff-009');
      expect(detail).not.toBeNull();
      expect(detail!.stdout).toBeUndefined();
      expect(detail!.stderr).toBe('stderr content');
    });
  });

  // ---------------------------------------------------------------------------
  // RunCache with non-existent runs directory
  // ---------------------------------------------------------------------------
  describe('RunCache with non-existent runs directory', () => {
    it('handles non-existent .a5c/runs directory', () => {
      const nonExistentRoot = path.join(tmpDir, 'workspace-no-a5c');
      fs.mkdirSync(nonExistentRoot, { recursive: true });

      const cache = new RunCache(nonExistentRoot);
      cache.refreshAll();

      expect(cache.getAll()).toEqual([]);
      expect(cache.getSummary()).toEqual({
        total: 0,
        active: 0,
        completed: 0,
        failed: 0,
        breakpoints: 0,
      });
    });

    it('handles empty .a5c/runs directory', () => {
      const workspaceRoot = path.join(tmpDir, 'workspace-empty');
      const runsDir = path.join(workspaceRoot, '.a5c', 'runs');
      fs.mkdirSync(runsDir, { recursive: true });

      const cache = new RunCache(workspaceRoot);
      cache.refreshAll();

      expect(cache.getAll()).toEqual([]);
    });

    it('skips runs without run.json during discovery', () => {
      const workspaceRoot = path.join(tmpDir, 'workspace-partial');
      const runsDir = path.join(workspaceRoot, '.a5c', 'runs');
      fs.mkdirSync(runsDir, { recursive: true });

      // Create a run directory without run.json
      const invalidRunDir = path.join(runsDir, 'invalid-run');
      fs.mkdirSync(invalidRunDir, { recursive: true });
      fs.writeFileSync(path.join(invalidRunDir, 'some-other-file.txt'), 'data');

      // Create a valid run
      const validRunDir = path.join(runsDir, 'valid-run');
      fs.mkdirSync(validRunDir, { recursive: true });
      fs.writeFileSync(
        path.join(validRunDir, 'run.json'),
        JSON.stringify({ runId: 'valid-run', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      const cache = new RunCache(workspaceRoot);
      cache.refreshAll();

      expect(cache.getAll()).toHaveLength(1);
      expect(cache.getAll()[0].runId).toBe('valid-run');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases with directory structure
  // ---------------------------------------------------------------------------
  describe('directory structure edge cases', () => {
    it('handles run directory that is actually a file', () => {
      const runPath = path.join(tmpDir, 'run-as-file');
      fs.writeFileSync(runPath, 'not a directory');

      const run = parseRunDir(runPath);
      expect(run).toBeNull();
    });

    it('handles task directory that is actually a file', () => {
      const runDir = path.join(tmpDir, 'run-task-as-file');
      const tasksDir = path.join(runDir, 'tasks');
      fs.mkdirSync(tasksDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'test', processId: 'proc' }));

      // Create a file instead of directory for task
      fs.writeFileSync(path.join(tasksDir, 'eff-001'), 'not a directory');

      const detail = getTaskDetail(runDir, 'eff-001');
      // getTaskDetail will try to read from the "directory" and may create a default object
      // The key is that it handles the error gracefully without crashing
      expect(detail).toBeDefined();
    });

    it('handles missing parent directories gracefully', () => {
      const runDir = path.join(tmpDir, 'deep', 'nested', 'path', 'run-001');

      const run = parseRunDir(runDir);
      expect(run).toBeNull();
    });
  });
});
