/**
 * FIX-003 regression suite: the published worktree helpers must never build a
 * shell command string from caller-controlled values.
 *
 * These tests assert the *safe executor contract*: the injected executor is
 * called with an executable name plus a structured argument array, and every
 * hostile value survives as one literal argument.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createWorktree,
  removeWorktree,
  listWorktrees,
  isInsideWorktree,
  type WorktreeExecFn,
} from '../worktreeIsolation';

/**
 * Values that are dangerous only when concatenated into a shell command string.
 * Each one must be handed to git as a single literal argv entry.
 */
const HOSTILE_VALUES: ReadonlyArray<readonly [string, string]> = [
  ['double quotes', '/tmp/wt-"injected"'],
  ['single quotes', "/tmp/wt-'injected'"],
  ['whitespace', '/tmp/my worktree dir'],
  ['command substitution', '/tmp/wt-$(touch /tmp/pwned)'],
  ['backticks', '/tmp/wt-`touch /tmp/pwned`'],
  ['semicolon chaining', '/tmp/wt; touch /tmp/pwned'],
  ['double-ampersand chaining', '/tmp/wt && touch /tmp/pwned'],
  ['pipe', '/tmp/wt | touch /tmp/pwned'],
  ['newline', '/tmp/wt\ntouch /tmp/pwned'],
  ['leading dash', '--upgrade-repo'],
  ['leading dash after quote escape', '-fx'],
  ['unicode path', '/tmp/wt-ünïcødé-工作树-🌳'],
  ['env expansion', '/tmp/wt-$HOME-${IFS}'],
];

function makeExec(): ReturnType<typeof vi.fn<WorktreeExecFn>> {
  return vi.fn<WorktreeExecFn>(() => Buffer.from(''));
}

describe('FIX-003: worktree helpers never build shell command strings', () => {
  describe('createWorktree', () => {
    it('invokes git with an argument array and option termination', () => {
      const exec = makeExec();
      createWorktree(
        '/repo',
        { baseBranch: 'main', worktreePath: '/tmp/wt-feature', label: 'feature-work' },
        exec,
      );

      expect(exec).toHaveBeenCalledTimes(1);
      expect(exec).toHaveBeenCalledWith(
        'git',
        ['worktree', 'add', '--', '/tmp/wt-feature', 'main'],
        { cwd: '/repo' },
      );
    });

    it.each(HOSTILE_VALUES)(
      'passes a hostile worktreePath (%s) through as one literal argument',
      (_label, hostile) => {
        const exec = makeExec();
        createWorktree(
          '/repo',
          { baseBranch: 'main', worktreePath: hostile, label: 'l' },
          exec,
        );

        const [file, args] = exec.mock.calls[0]!;
        expect(file).toBe('git');
        expect(args).toEqual(['worktree', 'add', '--', hostile, 'main']);
        // The hostile value must appear verbatim, never quoted/escaped into a
        // larger string, and never merged with neighbouring arguments.
        expect(args.filter((a) => a === hostile)).toHaveLength(1);
      },
    );

    it.each(HOSTILE_VALUES)(
      'passes a hostile baseBranch (%s) through as one literal argument',
      (_label, hostile) => {
        const exec = makeExec();
        createWorktree(
          '/repo',
          { baseBranch: hostile, worktreePath: '/tmp/wt', label: 'l' },
          exec,
        );

        const [file, args] = exec.mock.calls[0]!;
        expect(file).toBe('git');
        expect(args).toEqual(['worktree', 'add', '--', '/tmp/wt', hostile]);
      },
    );

    it('never passes a caller-controlled value inside any other argument', () => {
      const exec = makeExec();
      createWorktree(
        '/repo',
        { baseBranch: 'br;evil', worktreePath: '/tmp/p;evil', label: 'l' },
        exec,
      );

      const [file, args] = exec.mock.calls[0]!;
      expect(file).toBe('git');
      // Fixed arguments must be free of any caller data.
      for (const fixed of args.slice(0, 3)) {
        expect(fixed).not.toContain('evil');
        expect(fixed).not.toContain('"');
        expect(fixed).not.toContain("'");
      }
    });
  });

  describe('removeWorktree', () => {
    it('invokes git with an argument array and option termination', () => {
      const exec = makeExec();
      removeWorktree('/tmp/wt-feature', exec);

      expect(exec).toHaveBeenCalledWith('git', ['worktree', 'remove', '--', '/tmp/wt-feature']);
    });

    it.each(HOSTILE_VALUES)(
      'passes a hostile path (%s) through as one literal argument',
      (_label, hostile) => {
        const exec = makeExec();
        removeWorktree(hostile, exec);

        const [file, args] = exec.mock.calls[0]!;
        expect(file).toBe('git');
        expect(args).toEqual(['worktree', 'remove', '--', hostile]);
      },
    );
  });

  describe('read-only helpers', () => {
    it('listWorktrees passes only fixed arguments', () => {
      const exec = vi.fn<WorktreeExecFn>(() => Buffer.from(''));
      listWorktrees('/repo', exec);

      expect(exec).toHaveBeenCalledWith('git', ['worktree', 'list', '--porcelain'], { cwd: '/repo' });
    });

    it('isInsideWorktree passes only fixed arguments and keeps the path in cwd', () => {
      const hostileDir = '/tmp/dir-$(touch /tmp/pwned)';
      const exec = vi.fn<WorktreeExecFn>(() => Buffer.from('.git\n'));
      isInsideWorktree(hostileDir, exec);

      expect(exec).toHaveBeenCalledWith('git', ['rev-parse', '--git-dir'], { cwd: hostileDir });
    });
  });

  describe('executor contract', () => {
    it('rejects an executor that only accepts a shell command string', () => {
      // Type-level guard: the legacy `(cmd: string, opts?) => Buffer` shape is
      // no longer assignable to the injected executor contract. Kept as a
      // runtime assertion of the argv shape for compiled consumers.
      const received: Array<{ file: string; args: readonly string[] }> = [];
      const exec: WorktreeExecFn = (file, args) => {
        received.push({ file, args });
        return Buffer.from('');
      };

      createWorktree('/repo', { baseBranch: 'main', worktreePath: '/tmp/wt', label: 'l' }, exec);

      expect(received).toHaveLength(1);
      expect(Array.isArray(received[0]!.args)).toBe(true);
      expect(typeof received[0]!.file).toBe('string');
    });
  });
});
