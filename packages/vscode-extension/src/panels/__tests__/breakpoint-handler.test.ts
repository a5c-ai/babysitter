import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as cp from 'child_process';
import { EventEmitter } from 'events';

// Mock fs and child_process before importing the module under test
vi.mock('fs');
vi.mock('child_process');

import { approveBreakpoint } from '../breakpoint-handler';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockChildProcess(exitCode: number, stdout = '', stderr = ''): EventEmitter & { stdout: EventEmitter; stderr: EventEmitter } {
  const child = new EventEmitter() as EventEmitter & { stdout: EventEmitter; stderr: EventEmitter };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();

  // Emit data and close on next tick to simulate async behavior
  process.nextTick(() => {
    if (stdout) {
      child.stdout.emit('data', Buffer.from(stdout));
    }
    if (stderr) {
      child.stderr.emit('data', Buffer.from(stderr));
    }
    child.emit('close', exitCode);
  });

  return child;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('approveBreakpoint', () => {
  const workspaceRoot = '/mock/workspace';
  const runId = 'run-123';
  const effectId = 'eff-456';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
    vi.mocked(fs.mkdirSync).mockImplementation(() => '' as unknown as string);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes output.json to the correct task directory', async () => {
    const child = createMockChildProcess(0, 'OK');
    vi.mocked(cp.spawn).mockReturnValue(child as unknown as cp.ChildProcess);

    await approveBreakpoint(workspaceRoot, runId, effectId);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('output.json'),
      expect.stringContaining('"approved": true'),
      'utf-8',
    );
  });

  it('creates task directory if it does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const child = createMockChildProcess(0, 'OK');
    vi.mocked(cp.spawn).mockReturnValue(child as unknown as cp.ChildProcess);

    await approveBreakpoint(workspaceRoot, runId, effectId);

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining(effectId),
      { recursive: true },
    );
  });

  it('spawns babysitter CLI with correct arguments', async () => {
    const child = createMockChildProcess(0, 'OK');
    vi.mocked(cp.spawn).mockReturnValue(child as unknown as cp.ChildProcess);

    await approveBreakpoint(workspaceRoot, runId, effectId);

    expect(cp.spawn).toHaveBeenCalledWith(
      'babysitter',
      expect.arrayContaining(['task:post', expect.any(String), effectId, '--status', 'ok']),
      expect.objectContaining({ cwd: workspaceRoot, shell: true }),
    );
  });

  it('returns true on successful CLI execution', async () => {
    const child = createMockChildProcess(0, 'Breakpoint approved');
    vi.mocked(cp.spawn).mockReturnValue(child as unknown as cp.ChildProcess);

    const result = await approveBreakpoint(workspaceRoot, runId, effectId);
    expect(result).toBe(true);
  });

  it('returns false when CLI exits with non-zero code', async () => {
    const child = createMockChildProcess(1, '', 'Error occurred');
    vi.mocked(cp.spawn).mockReturnValue(child as unknown as cp.ChildProcess);

    const result = await approveBreakpoint(workspaceRoot, runId, effectId);
    expect(result).toBe(false);
  });

  it('handles spawn error gracefully', async () => {
    const child = new EventEmitter() as EventEmitter & { stdout: EventEmitter; stderr: EventEmitter };
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();

    vi.mocked(cp.spawn).mockReturnValue(child as unknown as cp.ChildProcess);

    process.nextTick(() => {
      child.emit('error', new Error('ENOENT'));
    });

    const result = await approveBreakpoint(workspaceRoot, runId, effectId);
    expect(result).toBe(false);
  });

  it('writes fallback result.json when CLI fails', async () => {
    vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.endsWith('result.json')) { return false; }
      return true;
    });
    const child = createMockChildProcess(1, '', 'CLI error');
    vi.mocked(cp.spawn).mockReturnValue(child as unknown as cp.ChildProcess);

    await approveBreakpoint(workspaceRoot, runId, effectId);

    // Should have written result.json as fallback
    const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls;
    const resultWrite = writeFileCalls.find((call) => String(call[0]).endsWith('result.json'));
    expect(resultWrite).toBeDefined();
    expect(String(resultWrite![1])).toContain('"status": "approved"');
  });

  it('handles different runId and effectId values', async () => {
    const child = createMockChildProcess(0, 'OK');
    vi.mocked(cp.spawn).mockReturnValue(child as unknown as cp.ChildProcess);

    const result = await approveBreakpoint('/other/workspace', 'custom-run', 'custom-effect');

    expect(result).toBe(true);
    expect(cp.spawn).toHaveBeenCalledWith(
      'babysitter',
      expect.arrayContaining(['custom-effect']),
      expect.objectContaining({ cwd: '/other/workspace' }),
    );
  });
});
