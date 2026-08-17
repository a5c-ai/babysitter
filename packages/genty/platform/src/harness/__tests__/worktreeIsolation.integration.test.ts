/**
 * FIX-003 integration suite: exercises the worktree helpers against a real
 * temporary git repository using the *default* executor.
 *
 * This proves two things at once:
 *  1. create/list/remove actually work end to end;
 *  2. hostile path/branch values are handed to git as literal arguments and
 *     cannot execute anything (no marker file is ever produced).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  createWorktree,
  removeWorktree,
  listWorktrees,
  isInsideWorktree,
} from '../worktreeIsolation';

/**
 * Marker file name used by the injection probes. It is deliberately relative
 * (no path separators) so that a hostile value stays a single path segment:
 * under a shell the substitution would create the marker in the process cwd,
 * while under a real argv it is just part of a directory name.
 */
const MARKER = 'PWNED';

/** Branches are consumed one per worktree — git refuses to share a branch. */
const BRANCHES = [
  'wt-plain',
  'wt-space',
  'wt-unicode',
  'wt-substitution',
  'wt-backtick',
  'wt-dash',
];

let root = '';
let repoDir = '';
let originalCwd = '';

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

/** Every location a shell-executed `touch PWNED` could plausibly land in. */
function markerCandidates(): string[] {
  return [join(root, MARKER), join(repoDir, MARKER), join(process.cwd(), MARKER)];
}

function expectNoMarker(): void {
  for (const candidate of markerCandidates()) {
    expect(existsSync(candidate), `marker created at ${candidate}`).toBe(false);
  }
}

beforeAll(() => {
  originalCwd = process.cwd();
  // git reports physical paths in `worktree list`, so resolve symlinks up front
  // (macOS puts the temp dir behind /var -> /private/var).
  root = realpathSync(mkdtempSync(join(tmpdir(), 'fix003-wt-')));
  repoDir = join(root, 'repo');

  execFileSync('git', ['init', '-q', '-b', 'main', repoDir], { cwd: root });
  git(['config', 'user.email', 'test@example.com'], repoDir);
  git(['config', 'user.name', 'FIX-003 Test'], repoDir);
  git(['commit', '-q', '--allow-empty', '-m', 'init'], repoDir);
  for (const branch of BRANCHES) git(['branch', branch], repoDir);

  // removeWorktree intentionally takes no repo argument, so it resolves the
  // repository from the process working directory. Run the suite from the
  // fixture repo so the real default executor is exercised end to end.
  process.chdir(repoDir);
});

afterAll(() => {
  if (originalCwd) process.chdir(originalCwd);
  if (root) rmSync(root, { recursive: true, force: true });
});

describe('FIX-003 worktree helpers against a real repository', () => {
  it('creates, lists and removes an ordinary worktree', () => {
    const worktreePath = join(root, 'wt-plain');

    createWorktree(repoDir, { baseBranch: 'wt-plain', worktreePath, label: 'plain' });
    expect(existsSync(worktreePath)).toBe(true);

    const listed = listWorktrees(repoDir);
    const entry = listed.find((w) => w.worktree === resolve(worktreePath));
    expect(entry).toBeDefined();
    expect(entry!.branch).toBe('refs/heads/wt-plain');
    expect(entry!.bare).toBe(false);

    expect(isInsideWorktree(worktreePath)).toBe(true);
    expect(isInsideWorktree(repoDir)).toBe(false);

    removeWorktree(worktreePath);
    expect(existsSync(worktreePath)).toBe(false);
    expect(listWorktrees(repoDir).map((w) => w.worktree)).not.toContain(resolve(worktreePath));
  });

  it('supports worktree paths containing whitespace', () => {
    const worktreePath = join(root, 'my worktree dir');

    createWorktree(repoDir, { baseBranch: 'wt-space', worktreePath, label: 'spaced' });
    expect(existsSync(worktreePath)).toBe(true);
    expect(listWorktrees(repoDir).map((w) => w.worktree)).toContain(resolve(worktreePath));

    removeWorktree(worktreePath);
    expect(existsSync(worktreePath)).toBe(false);
  });

  it('supports Unicode worktree paths', () => {
    const worktreePath = join(root, 'wt-ünïcødé-工作树');

    createWorktree(repoDir, { baseBranch: 'wt-unicode', worktreePath, label: 'unicode' });
    expect(existsSync(worktreePath)).toBe(true);
    expect(readdirSync(root)).toContain('wt-ünïcødé-工作树');

    removeWorktree(worktreePath);
    expect(existsSync(worktreePath)).toBe(false);
  });

  it('treats a command substitution in the path as a literal directory name', () => {
    // Through a shell command string this substitution would run `touch` and
    // the real directory would end up with a different name.
    const dirName = `wt-$(touch ${MARKER})-end`;
    const worktreePath = join(root, dirName);

    createWorktree(repoDir, { baseBranch: 'wt-substitution', worktreePath, label: 'hostile' });

    expectNoMarker();
    expect(existsSync(worktreePath)).toBe(true);
    expect(readdirSync(root)).toContain(dirName);
    expect(listWorktrees(repoDir).map((w) => w.worktree)).toContain(resolve(worktreePath));

    removeWorktree(worktreePath);
    expectNoMarker();
    expect(existsSync(worktreePath)).toBe(false);
  });

  it('treats backticks and semicolons in the path as literal characters', () => {
    const dirName = 'wt-`touch ' + MARKER + '`; touch ' + MARKER;
    const worktreePath = join(root, dirName);

    createWorktree(repoDir, { baseBranch: 'wt-backtick', worktreePath, label: 'hostile2' });

    expectNoMarker();
    expect(existsSync(worktreePath)).toBe(true);
    expect(readdirSync(root)).toContain(dirName);

    removeWorktree(worktreePath);
    expectNoMarker();
    expect(existsSync(worktreePath)).toBe(false);
  });

  it('cannot execute anything through a hostile baseBranch', () => {
    const worktreePath = join(root, 'wt-branch-injection');
    const hostileBranch = `main"; touch ${MARKER}; echo "`;

    // git legitimately rejects the value as a revision; what matters is that
    // nothing was executed on the way there.
    expect(() =>
      createWorktree(repoDir, {
        baseBranch: hostileBranch,
        worktreePath,
        label: 'branch-injection',
      }),
    ).toThrow();

    expectNoMarker();
  });

  it('cannot execute a command substitution supplied as the baseBranch', () => {
    const worktreePath = join(root, 'wt-branch-substitution');

    expect(() =>
      createWorktree(repoDir, {
        baseBranch: `$(touch ${MARKER})`,
        worktreePath,
        label: 'branch-substitution',
      }),
    ).toThrow();

    expectNoMarker();
  });

  it('treats a leading-dash path as a path, not as a git option', () => {
    const worktreePath = join(root, '--force');

    createWorktree(repoDir, { baseBranch: 'wt-dash', worktreePath, label: 'dash' });
    expect(existsSync(worktreePath)).toBe(true);
    expect(readdirSync(root)).toContain('--force');

    removeWorktree(worktreePath);
    expect(existsSync(worktreePath)).toBe(false);
  });

  it('leaves no marker file behind after the whole suite', () => {
    expectNoMarker();
  });
});
