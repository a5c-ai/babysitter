/**
 * Git Worktree Isolation (GAP-TOOLS-017).
 *
 * Helpers for creating, listing, and removing git worktrees
 * to isolate concurrent agent work. Uses injectable command
 * executor for testability.
 */

import { execSync as defaultExecSync } from 'node:child_process';

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

export type ExecSyncFn = (cmd: string, opts?: { cwd?: string }) => Buffer;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new git worktree.
 */
export function createWorktree(
  repoDir: string,
  config: WorktreeConfig,
  exec: ExecSyncFn = defaultExecSync,
): void {
  exec(
    `git worktree add "${config.worktreePath}" "${config.baseBranch}"`,
    { cwd: repoDir },
  );
}

/**
 * Remove a git worktree.
 */
export function removeWorktree(
  worktreePath: string,
  exec: ExecSyncFn = defaultExecSync,
): void {
  exec(`git worktree remove "${worktreePath}"`);
}

/**
 * List all worktrees for a repository by parsing `git worktree list --porcelain`.
 */
export function listWorktrees(
  repoDir: string,
  exec: ExecSyncFn = defaultExecSync,
): WorktreeInfo[] {
  const output = exec('git worktree list --porcelain', { cwd: repoDir }).toString('utf8');
  return parsePorcelainOutput(output);
}

/**
 * Check if a directory is inside a git worktree (as opposed to the main working tree).
 */
export function isInsideWorktree(
  dir: string,
  exec: ExecSyncFn = defaultExecSync,
): boolean {
  try {
    const gitDir = exec('git rev-parse --git-dir', { cwd: dir }).toString('utf8').trim();
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
