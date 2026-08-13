/**
 * Git Worktree Isolation (GAP-TOOLS-017).
 *
 * Helpers for creating, listing, and removing git worktrees
 * to isolate concurrent agent work. Uses an injectable command
 * executor for testability.
 *
 * Security (FIX-003): these helpers are published through the
 * `@a5c-ai/genty-platform/harness` subpath and accept caller-controlled
 * branch names and filesystem paths. No caller-controlled value is ever
 * placed in a shell command string — git is invoked directly with a
 * structured argument vector and `shell: false`, and `--` terminates
 * option parsing so leading-dash values are treated as operands.
 */

import { execFileSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorktreeConfig {
  baseBranch: string;
  worktreePath: string;
  label: string;
}

export interface WorktreeInfo {
  worktree: string;
  head: string;
  branch: string;
  bare: boolean;
}

/** Options forwarded to the injected executor. */
export interface WorktreeExecOptions {
  cwd?: string;
}

/**
 * Injected command executor.
 *
 * The contract is deliberately `(file, args)` and never a single command
 * string: every element of `args` must reach the child process as one literal
 * argument, with no shell parsing. Implementations MUST NOT enable a shell.
 */
export type WorktreeExecFn = (
  file: string,
  args: readonly string[],
  options?: WorktreeExecOptions,
) => Buffer;

/**
 * @deprecated Renamed to {@link WorktreeExecFn}. The executor contract changed
 * from a shell command string to `(file, args)` in FIX-003; a shell-string
 * executor is no longer accepted.
 */
export type ExecSyncFn = WorktreeExecFn;

// ---------------------------------------------------------------------------
// Default executor
// ---------------------------------------------------------------------------

/**
 * Default executor: runs the binary directly, never through a shell.
 */
const defaultExec: WorktreeExecFn = (file, args, options) =>
  execFileSync(file, [...args], { ...options, shell: false });

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new git worktree.
 *
 * `config.worktreePath` and `config.baseBranch` are passed as literal
 * arguments after `--`; shell metacharacters and leading dashes are inert.
 */
export function createWorktree(
  repoDir: string,
  config: WorktreeConfig,
  exec: WorktreeExecFn = defaultExec,
): void {
  exec(
    'git',
    ['worktree', 'add', '--', config.worktreePath, config.baseBranch],
    { cwd: repoDir },
  );
}

/**
 * Remove a git worktree.
 *
 * `worktreePath` is passed as a literal argument after `--`.
 */
export function removeWorktree(
  worktreePath: string,
  exec: WorktreeExecFn = defaultExec,
): void {
  exec('git', ['worktree', 'remove', '--', worktreePath]);
}

/**
 * List all worktrees for a repository by parsing `git worktree list --porcelain`.
 */
export function listWorktrees(
  repoDir: string,
  exec: WorktreeExecFn = defaultExec,
): WorktreeInfo[] {
  const output = exec('git', ['worktree', 'list', '--porcelain'], { cwd: repoDir }).toString('utf8');
  return parsePorcelainOutput(output);
}

/**
 * Check if a directory is inside a git worktree (as opposed to the main working tree).
 */
export function isInsideWorktree(
  dir: string,
  exec: WorktreeExecFn = defaultExec,
): boolean {
  try {
    const gitDir = exec('git', ['rev-parse', '--git-dir'], { cwd: dir }).toString('utf8').trim();
    // A worktree's .git is a file pointing to the main repo's .git/worktrees/<name>,
    // so the git-dir path will contain '/worktrees/' or '\\worktrees\\'.
    return gitDir.includes('/worktrees/') || gitDir.includes('\\worktrees\\');
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

export function parsePorcelainOutput(output: string): WorktreeInfo[] {
  const results: WorktreeInfo[] = [];
  const blocks = output.trim().split('\n\n');

  for (const block of blocks) {
    if (!block.trim()) continue;

    const lines = block.trim().split('\n');
    let worktree = '';
    let head = '';
    let branch = '';
    let bare = false;

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        worktree = line.slice('worktree '.length);
      } else if (line.startsWith('HEAD ')) {
        head = line.slice('HEAD '.length);
      } else if (line.startsWith('branch ')) {
        branch = line.slice('branch '.length);
      } else if (line === 'bare') {
        bare = true;
      }
    }

    if (worktree) {
      results.push({ worktree, head, branch, bare });
    }
  }

  return results;
}
