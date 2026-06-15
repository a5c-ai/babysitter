import { describe, it, expect, vi } from 'vitest';
import {
  createWorktree,
  removeWorktree,
  listWorktrees,
  isInsideWorktree,
  parsePorcelainOutput,
  type ExecSyncFn,
} from '../worktreeIsolation';

// ---------------------------------------------------------------------------
// parsePorcelainOutput (pure, no mocks needed)
// ---------------------------------------------------------------------------

describe('parsePorcelainOutput', () => {
  it('parses a single worktree block', () => {
    const output = [
      'worktree /home/user/repo',
      'HEAD abc123def456',
      'branch refs/heads/main',
      '',
    ].join('\n');

    const result = parsePorcelainOutput(output);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      worktree: '/home/user/repo',
      head: 'abc123def456',
      branch: 'refs/heads/main',
      bare: false,
    });
  });

  it('parses multiple worktree blocks', () => {
    const output = [
      'worktree /home/user/repo',
      'HEAD abc123',
      'branch refs/heads/main',
      '',
      'worktree /home/user/repo-wt',
      'HEAD def456',
      'branch refs/heads/feature',
      '',
    ].join('\n');

    const result = parsePorcelainOutput(output);
    expect(result).toHaveLength(2);
    expect(result[1].worktree).toBe('/home/user/repo-wt');
    expect(result[1].branch).toBe('refs/heads/feature');
  });

  it('handles bare repositories', () => {
    const output = [
      'worktree /home/user/repo.git',
      'HEAD abc123',
      'bare',
      '',
    ].join('\n');

    const result = parsePorcelainOutput(output);
    expect(result[0].bare).toBe(true);
  });

  it('returns empty array for empty output', () => {
    expect(parsePorcelainOutput('')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// createWorktree
// ---------------------------------------------------------------------------

describe('createWorktree', () => {
  it('executes git worktree add with correct arguments', () => {
    const exec = vi.fn<ExecSyncFn>(() => Buffer.from(''));
    createWorktree('/repo', {
      baseBranch: 'main',
      worktreePath: '/tmp/wt-feature',
      label: 'feature-work',
    }, exec);

    expect(exec).toHaveBeenCalledWith(
      'git worktree add "/tmp/wt-feature" "main"',
      { cwd: '/repo' },
    );
  });
});

// ---------------------------------------------------------------------------
// removeWorktree
// ---------------------------------------------------------------------------

describe('removeWorktree', () => {
  it('executes git worktree remove with the path', () => {
    const exec = vi.fn<ExecSyncFn>(() => Buffer.from(''));
    removeWorktree('/tmp/wt-feature', exec);

    expect(exec).toHaveBeenCalledWith('git worktree remove "/tmp/wt-feature"');
  });
});

// ---------------------------------------------------------------------------
// listWorktrees
// ---------------------------------------------------------------------------

describe('listWorktrees', () => {
  it('parses porcelain output from exec', () => {
    const porcelain = [
      'worktree /repo',
      'HEAD aaa',
      'branch refs/heads/main',
      '',
      'worktree /repo-wt',
      'HEAD bbb',
      'branch refs/heads/feat',
      '',
    ].join('\n');

    const exec = vi.fn<ExecSyncFn>(() => Buffer.from(porcelain));
    const result = listWorktrees('/repo', exec);

    expect(result).toHaveLength(2);
    expect(exec).toHaveBeenCalledWith('git worktree list --porcelain', { cwd: '/repo' });
  });
});

// ---------------------------------------------------------------------------
// isInsideWorktree
// ---------------------------------------------------------------------------

describe('isInsideWorktree', () => {
  it('returns true when git-dir contains /worktrees/', () => {
    const exec = vi.fn<ExecSyncFn>(() =>
      Buffer.from('/home/user/repo/.git/worktrees/feature\n'),
    );
    expect(isInsideWorktree('/home/user/wt', exec)).toBe(true);
  });

  it('returns true when git-dir contains \\worktrees\\ (Windows)', () => {
    const exec = vi.fn<ExecSyncFn>(() =>
      Buffer.from('C:\\repo\\.git\\worktrees\\feature\n'),
    );
    expect(isInsideWorktree('C:\\repo-wt', exec)).toBe(true);
  });

  it('returns false for main working tree', () => {
    const exec = vi.fn<ExecSyncFn>(() => Buffer.from('.git\n'));
    expect(isInsideWorktree('/home/user/repo', exec)).toBe(false);
  });

  it('returns false when git command fails', () => {
    const exec = vi.fn<ExecSyncFn>(() => {
      throw new Error('not a git repo');
    });
    expect(isInsideWorktree('/tmp/random', exec)).toBe(false);
  });
});
