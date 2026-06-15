/**
 * The cogitator shell (SPEC-V4 §V4-7): a small DETERMINISTIC command table
 * over the sim's workspace views — no real exec, no rng, no clock. Pure:
 * every answer derives from the ShellSources snapshot it is handed.
 *
 * Incantations: help · pwd · ls [dir] · cat <path> · git status ·
 * git diff [path] · git log · npm test · clear. Unknown commands answer in
 * character ("the cogitator does not know this incantation").
 */

import type {
  SimFileTreeNode,
  SimGitCommitView,
  SimWorkspaceView,
} from '../backend/mock/simulation';

/** Read surface the shell consults (bound to one card's workspace). */
export interface ShellSources {
  taskId: string;
  workspaceId: string;
  getWorkspaceTree(taskId: string): SimFileTreeNode | null;
  getFileContent(taskId: string, path: string): string | null;
  getGitLog(taskId: string): SimGitCommitView[];
  getWorkspaceView(taskId: string): SimWorkspaceView | null;
}

export interface ShellResult {
  /** Output lines to append to the scrollback (may be empty). */
  lines: string[];
  /** `clear` wipes the scrollback instead of appending. */
  clear: boolean;
}

/** The known incantation table (unit-tested sweep). */
export const SHELL_COMMANDS = [
  'help',
  'pwd',
  'ls',
  'cat',
  'git status',
  'git diff',
  'git log',
  'npm test',
  'clear',
] as const;

export const UNKNOWN_INCANTATION = 'the cogitator does not know this incantation';

function out(lines: string[]): ShellResult {
  return { lines, clear: false };
}

/** Resolve a directory node by path ('' / '.' / '/' → root). */
function findDir(root: SimFileTreeNode, dir: string): SimFileTreeNode | null {
  const clean = dir.replace(/^\.?\/?/, '').replace(/\/+$/, '');
  if (clean === '' || clean === '.') return root;
  let node: SimFileTreeNode = root;
  for (const segment of clean.split('/')) {
    const child = (node.children ?? []).find((c) => c.name === segment);
    if (child === undefined || child.type !== 'dir') return null;
    node = child;
  }
  return node;
}

function branchOf(ws: SimWorkspaceView | null): string {
  return ws?.gitStatus.branch ?? 'main';
}

function helpLines(): string[] {
  return [
    'the cogitator answers these incantations:',
    '  help            this litany',
    '  pwd             where the workspace shrine stands',
    '  ls [dir]        list the gallery (dirs suffixed /)',
    '  cat <path>      recite a scroll',
    '  git status      changed files (A/M/D)',
    '  git diff [path] the diff plates',
    '  git log         the commit ledger',
    '  npm test        replay the trial rites',
    '  clear           wipe the slate',
  ];
}

function lsLines(sources: ShellSources, dir: string): string[] {
  const tree = sources.getWorkspaceTree(sources.taskId);
  if (tree === null) return ['ls: the workspace shrine is dark — no tree observed'];
  const node = findDir(tree, dir);
  if (node === null) return [`ls: no such gallery: ${dir}`];
  const children = node.children ?? [];
  if (children.length === 0) return ['(an empty gallery)'];
  return children.map((c) => (c.type === 'dir' ? `${c.name}/` : c.name));
}

function catLines(sources: ShellSources, path: string): string[] {
  if (path === '') return ['cat: name the scroll to recite'];
  const content = sources.getFileContent(sources.taskId, path);
  if (content === null) return [`cat: the cogitator finds no scroll at ${path}`];
  return content.split('\n');
}

function gitStatusLines(sources: ShellSources): string[] {
  const ws = sources.getWorkspaceView(sources.taskId);
  if (ws === null) return ['git status: no workspace consecrated for this card'];
  const lines = [`on branch ${branchOf(ws)}`];
  if (ws.files.length === 0) {
    lines.push('the shrine is clean — nothing to commit');
    return lines;
  }
  lines.push('changes scribed on the workspace:');
  for (const file of ws.files) {
    lines.push(`  ${file.status}  ${file.path}`);
  }
  lines.push(`${ws.files.length} file(s) changed`);
  return lines;
}

function gitDiffLines(sources: ShellSources, path: string): string[] {
  const ws = sources.getWorkspaceView(sources.taskId);
  if (ws === null) return ['git diff: no workspace consecrated for this card'];
  const files = path === '' ? ws.files : ws.files.filter((f) => f.path === path);
  if (files.length === 0) {
    return [path === '' ? 'no diff plates etched yet' : `git diff: no plate for ${path}`];
  }
  const lines: string[] = [];
  for (const file of files) {
    lines.push(`--- a/${file.path}`, `+++ b/${file.path}`, ...file.diff.split('\n'));
  }
  return lines;
}

function gitLogLines(sources: ShellSources): string[] {
  const commits = sources.getGitLog(sources.taskId);
  if (commits.length === 0) return ['the ledger is blank — no commits observed'];
  return commits.map((c) => `${c.sha.slice(0, 7)}  ${c.message}  (tick ${c.tick})`);
}

function npmTestLines(sources: ShellSources): string[] {
  const ws = sources.getWorkspaceView(sources.taskId);
  const evidence = ws?.testEvidence ?? { status: 'unknown' as const };
  const lines = [
    '> invoking the trial rites…',
    '  [/] gears engage  [-] plates warm  [\\] runes settle',
  ];
  switch (evidence.status) {
    case 'passed':
      lines.push(`tests: PASSED — ${evidence.summary ?? 'every rite satisfied'}`);
      break;
    case 'failed':
      lines.push(`tests: FAILED — ${evidence.summary ?? 'a rite was found wanting'}`);
      break;
    default:
      lines.push('tests: no evidence inscribed yet');
      break;
  }
  return lines;
}

/**
 * Execute one shell line against the sources. Deterministic: same input +
 * same source snapshot ⇒ identical output.
 */
export function runShellCommand(input: string, sources: ShellSources): ShellResult {
  const trimmed = input.trim();
  if (trimmed === '') return out([]);
  const [head = '', ...rest] = trimmed.split(/\s+/);
  const arg = rest.join(' ');

  switch (head) {
    case 'help':
      return out(helpLines());
    case 'pwd': {
      const ws = sources.getWorkspaceView(sources.taskId);
      return out([`/workspaces/${sources.workspaceId}/${branchOf(ws)}`]);
    }
    case 'ls':
      return out(lsLines(sources, arg));
    case 'cat':
      return out(catLines(sources, arg));
    case 'git': {
      const [sub = '', ...gitRest] = rest;
      if (sub === 'status') return out(gitStatusLines(sources));
      if (sub === 'diff') return out(gitDiffLines(sources, gitRest.join(' ')));
      if (sub === 'log') return out(gitLogLines(sources));
      return out([`${UNKNOWN_INCANTATION}: git ${sub}`.trimEnd()]);
    }
    case 'npm': {
      if (rest[0] === 'test') return out(npmTestLines(sources));
      return out([`${UNKNOWN_INCANTATION}: ${trimmed}`]);
    }
    case 'clear':
      return { lines: [], clear: true };
    default:
      return out([`${UNKNOWN_INCANTATION}: ${trimmed}`]);
  }
}

/** Shell history stepper (ArrowUp/ArrowDown): returns the new index + text. */
export function stepHistory(
  history: readonly string[],
  index: number,
  direction: -1 | 1,
): { index: number; text: string } {
  if (history.length === 0) return { index: -1, text: '' };
  // index -1 = live (empty) line; history is oldest→newest.
  const live = history.length;
  const current = index < 0 ? live : index;
  const next = Math.max(0, Math.min(live, current + direction));
  return next >= live ? { index: -1, text: '' } : { index: next, text: history[next]! };
}
