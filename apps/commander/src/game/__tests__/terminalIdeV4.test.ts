/**
 * TERMINAL-IDE-V4 phase unit tests (SPEC-V4 §V4-7/§V4-8/§V4-11):
 *   - the cogitator shell command table against a LIVE sim fixture
 *     (ls/cat/git status/git diff/git log/npm test/pwd/help/clear/unknown),
 *   - ArrowUp/ArrowDown history stepping,
 *   - the regex tokenizer per language (ts/js/json/css/md) + reassembly,
 *   - suggestCompletion determinism + non-emptiness for code lines,
 *   - ideView helpers: sanitizeTabId (helpers-v4 contract), caret geometry,
 *     ghost accept/dismiss state machine,
 *   - the final Esc cascade: ide > card-editor > runs > foundry > archive >
 *     review > steer > inspector > selection.
 */
import { beforeAll, describe, expect, it } from 'vitest';

import { MockBackend } from '../../backend/mock/mockBackend';
import type { SimWorkspaceFileView } from '../../backend/mock/simulation';
import { suggestCompletion } from '../../microagent/mock/completionGen';
import {
  runShellCommand,
  SHELL_COMMANDS,
  stepHistory,
  UNKNOWN_INCANTATION,
  type ShellSources,
} from '../cogitatorShell';
import {
  acceptGhost,
  caretInfo,
  escapeGhost,
  IDE_RENDER_LINE_CAP,
  sanitizeTabId,
} from '../ideView';
import { bindBackendToStore, createCommanderStore } from '../store';
import { languageOf, tokenize, tokenizeLine } from '../syntax';

// ---------------------------------------------------------------------------
// Live sim fixture: a DO card with accumulated workspace changes (§V4-8)
// ---------------------------------------------------------------------------

interface Fixture {
  backend: MockBackend;
  sources: ShellSources;
  taskId: string;
  workspaceId: string;
  changed: SimWorkspaceFileView[];
}

let fixture: Fixture;

beforeAll(() => {
  const backend = new MockBackend({ seed: 42, autoStart: false });
  const sim = backend.sim;
  const single = sim
    .listCardViews()
    .find((c) => c.column === 'backlog' && c.childIds.length === 0);
  if (!single) throw new Error('boot scenario must seed single backlog cards (§V3-2)');
  sim.moveCard(single.taskId, 'do');
  let changed: SimWorkspaceFileView[] = [];
  for (let i = 0; i < 60; i += 1) {
    sim.tick(50);
    changed = sim.getWorkspaceView(single.taskId)?.files ?? [];
    if (changed.length >= 1) break;
  }
  if (changed.length === 0) {
    throw new Error('the DO card must accumulate ≥1 changed file (V2-7 fixture)');
  }
  const workspaceId = sim.listCardViews().find((c) => c.taskId === single.taskId)?.workspaceId ?? '';
  fixture = {
    backend,
    taskId: single.taskId,
    workspaceId,
    changed,
    sources: {
      taskId: single.taskId,
      workspaceId,
      getWorkspaceTree: (id) => sim.getWorkspaceTree(id),
      getFileContent: (id, path) => sim.getFileContent(id, path),
      getGitLog: (id) => sim.getGitLog(id),
      getWorkspaceView: (id) => sim.getWorkspaceView(id),
    },
  };
});

describe('cogitator shell command table (§V4-7, live sim fixture)', () => {
  it('help recites the full litany of incantations', () => {
    const { lines } = runShellCommand('help', fixture.sources);
    for (const cmd of SHELL_COMMANDS) {
      const head = cmd.split(' ')[0]!;
      expect(lines.join('\n')).toContain(head);
    }
  });

  it('pwd answers /workspaces/<workspaceId>/<branch>', () => {
    const ws = fixture.backend.sim.getWorkspaceView(fixture.taskId);
    const { lines } = runShellCommand('pwd', fixture.sources);
    expect(lines).toEqual([`/workspaces/${fixture.workspaceId}/${ws!.gitStatus.branch}`]);
  });

  it('ls lists the tree roots with dirs suffixed /', () => {
    const tree = fixture.backend.sim.getWorkspaceTree(fixture.taskId)!;
    const { lines } = runShellCommand('ls', fixture.sources);
    for (const child of tree.children ?? []) {
      expect(lines).toContain(child.type === 'dir' ? `${child.name}/` : child.name);
    }
  });

  it('ls <subdir> descends; an unknown gallery answers in character', () => {
    const tree = fixture.backend.sim.getWorkspaceTree(fixture.taskId)!;
    const dir = (tree.children ?? []).find((c) => c.type === 'dir')!;
    const { lines } = runShellCommand(`ls ${dir.path}`, fixture.sources);
    expect(lines.length).toBeGreaterThan(0);
    expect(runShellCommand('ls no/such/dir', fixture.sources).lines[0]).toMatch(/no such gallery/);
  });

  it('cat <changed file> prints content containing the diff-added text (§V4-8)', () => {
    const file = fixture.changed[0]!;
    const added = file.diff
      .split('\n')
      .find((l) => l.startsWith('+'))!
      .slice(1);
    const { lines } = runShellCommand(`cat ${file.path}`, fixture.sources);
    expect(lines.join('\n')).toContain(added);
  });

  it('cat with an unknown path answers in character', () => {
    expect(runShellCommand('cat no/such/scroll.ts', fixture.sources).lines[0]).toMatch(/no scroll/);
  });

  it('git status lists every changed file with its A/M/D letter', () => {
    const { lines } = runShellCommand('git status', fixture.sources);
    const text = lines.join('\n');
    for (const file of fixture.changed) {
      expect(text).toContain(`${file.status}  ${file.path}`);
    }
    expect(text).toMatch(/on branch /);
  });

  it('git diff replays the diff plates (optionally per path)', () => {
    const file = fixture.changed[0]!;
    const all = runShellCommand('git diff', fixture.sources).lines.join('\n');
    expect(all).toContain(file.diff.split('\n')[0]);
    const scoped = runShellCommand(`git diff ${file.path}`, fixture.sources).lines.join('\n');
    expect(scoped).toContain(`+++ b/${file.path}`);
  });

  it('git log formats the journal-derived ledger (sha7 + message + tick)', () => {
    const commits = fixture.backend.sim.getGitLog(fixture.taskId);
    const { lines } = runShellCommand('git log', fixture.sources);
    expect(lines.length).toBe(commits.length);
    expect(lines[lines.length - 1]).toContain(commits[commits.length - 1]!.sha.slice(0, 7));
    expect(lines.join('\n')).toContain('chore: cut branch');
  });

  it('npm test replays the testEvidence with a spinner-ish preamble', () => {
    const { lines } = runShellCommand('npm test', fixture.sources);
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines[0]).toMatch(/trial rites/);
    expect(lines[lines.length - 1]).toMatch(/^tests:/);
  });

  it('clear wipes the slate; blank input does nothing', () => {
    expect(runShellCommand('clear', fixture.sources)).toEqual({ lines: [], clear: true });
    expect(runShellCommand('   ', fixture.sources)).toEqual({ lines: [], clear: false });
  });

  it('unknown commands answer in character (the incantation litany)', () => {
    const { lines } = runShellCommand('summon-the-omnissiah', fixture.sources);
    expect(lines).toEqual([`${UNKNOWN_INCANTATION}: summon-the-omnissiah`]);
    expect(runShellCommand('git rebase', fixture.sources).lines[0]).toContain(UNKNOWN_INCANTATION);
  });

  it('is deterministic: the same incantation answers byte-identically', () => {
    for (const cmd of ['ls', 'git status', 'git log', 'npm test', 'pwd']) {
      expect(runShellCommand(cmd, fixture.sources)).toEqual(runShellCommand(cmd, fixture.sources));
    }
  });

  it('steps history with ArrowUp/ArrowDown semantics', () => {
    const history = ['ls', 'git status', 'cat a.ts'];
    const up1 = stepHistory(history, -1, -1);
    expect(up1).toEqual({ index: 2, text: 'cat a.ts' });
    const up2 = stepHistory(history, up1.index, -1);
    expect(up2).toEqual({ index: 1, text: 'git status' });
    const up3 = stepHistory(history, stepHistory(history, up2.index, -1).index, -1);
    expect(up3).toEqual({ index: 0, text: 'ls' }); // clamped at the oldest
    const down = stepHistory(history, up2.index, 1);
    expect(down).toEqual({ index: 2, text: 'cat a.ts' });
    expect(stepHistory(history, down.index, 1)).toEqual({ index: -1, text: '' }); // back to live
    expect(stepHistory([], -1, -1)).toEqual({ index: -1, text: '' });
  });
});

// ---------------------------------------------------------------------------
// §V4-11 syntax tokenizer
// ---------------------------------------------------------------------------

describe('syntax tokenizer (§V4-11)', () => {
  it('maps extensions to languages', () => {
    expect(languageOf('src/index.ts')).toBe('ts');
    expect(languageOf('a.tsx')).toBe('ts');
    expect(languageOf('b.js')).toBe('js');
    expect(languageOf('package.json')).toBe('json');
    expect(languageOf('styles.css')).toBe('css');
    expect(languageOf('README.md')).toBe('md');
    expect(languageOf('scripts/build.sh')).toBe('plain');
  });

  it('ts: keywords, strings, comments, numbers and PascalCase types', () => {
    const tokens = tokenizeLine("const gauge: Manifold = calibrate(42); // torque 'ok'", 'ts');
    const by = (cls: string) => tokens.filter((t) => t.cls === cls).map((t) => t.text);
    expect(by('keyword')).toContain('const');
    expect(by('type')).toContain('Manifold');
    expect(by('number')).toContain('42');
    expect(by('comment')[0]).toContain('// torque');
    const str = tokenizeLine("import { x } from './gears';", 'ts');
    expect(str.some((t) => t.cls === 'string' && t.text === "'./gears'")).toBe(true);
  });

  it('json: keys tint as types, values as strings/numbers/keywords', () => {
    const tokens = tokenizeLine('  "version": "0.4.2", "private": true, "n": 7', 'json');
    expect(tokens.some((t) => t.cls === 'type' && t.text === '"version"')).toBe(true);
    expect(tokens.some((t) => t.cls === 'string' && t.text === '"0.4.2"')).toBe(true);
    expect(tokens.some((t) => t.cls === 'keyword' && t.text === 'true')).toBe(true);
    expect(tokens.some((t) => t.cls === 'number' && t.text === '7')).toBe(true);
  });

  it('css: properties, numbers/colors, comments and selectors', () => {
    const tokens = tokenizeLine('.wr-plate { color: #d2ab57; width: 12px; } /* brass */', 'css');
    expect(tokens.some((t) => t.cls === 'type' && t.text === '.wr-plate')).toBe(true);
    expect(tokens.some((t) => t.cls === 'keyword' && t.text === 'color')).toBe(true);
    expect(tokens.some((t) => t.cls === 'number' && t.text === '#d2ab57')).toBe(true);
    expect(tokens.some((t) => t.cls === 'comment')).toBe(true);
  });

  it('md: headings, code spans, emphasis and bullets', () => {
    expect(tokenizeLine('# Overview', 'md')[0]).toMatchObject({ cls: 'keyword' });
    expect(tokenizeLine('use `npm test` to verify', 'md').some((t) => t.cls === 'string')).toBe(true);
    expect(tokenizeLine('- entry one', 'md')[0]).toMatchObject({ cls: 'number' });
  });

  it('reassembles losslessly: concatenated tokens equal the source line', () => {
    const lines = [
      "export function mechanism7(): number { return 42; } // gear",
      '  "field3": "value-123",',
      '.wr-x::hover { border: 1px solid rgb(1 2 3 / 0.4); }',
      '# Title with `code` and *emphasis*',
      'plain text without any tokens at all',
    ];
    const langs = ['ts', 'json', 'css', 'md', 'plain'] as const;
    lines.forEach((line, i) => {
      const joined = tokenizeLine(line, langs[i]!).map((t) => t.text).join('');
      expect(joined).toBe(line);
    });
  });

  it('tokenizes whole buffers by line and the cap constant is ~400', () => {
    expect(tokenize('a\nb\nc', 'ts')).toHaveLength(3);
    expect(IDE_RENDER_LINE_CAP).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// §V4-11 suggestCompletion (mock microagent ghost)
// ---------------------------------------------------------------------------

describe('suggestCompletion (§V4-11)', () => {
  it('is deterministic: same path + line ⇒ identical suggestion', () => {
    const ctx = { path: 'src/index.ts', lineText: 'const aether', lineIndex: 12 };
    expect(suggestCompletion(ctx)).toBe(suggestCompletion(ctx));
    expect(suggestCompletion({ ...ctx, lineIndex: 99 })).toBe(suggestCompletion(ctx)); // index-free
  });

  it('NEVER returns empty for content-bearing code lines (the AC45 scenario)', () => {
    const lines = [
      'const aether',
      "registry.set('cog-3', gauge12);",
      'let manifold',
      'export function rite(): number {',
    ];
    for (const ext of ['ts', 'tsx', 'js', 'json', 'css', 'md']) {
      for (const lineText of lines) {
        const out = suggestCompletion({ path: `src/file.${ext}`, lineText, lineIndex: 1 });
        expect(out.length, `${ext}: "${lineText}"`).toBeGreaterThan(0);
      }
    }
  });

  it('stays silent on blank lines and lone closers', () => {
    expect(suggestCompletion({ path: 'a.ts', lineText: '   ', lineIndex: 0 })).toBe('');
    expect(suggestCompletion({ path: 'a.ts', lineText: '}', lineIndex: 0 })).toBe('');
  });

  it('varies plausibly by extension (json keys vs css declarations)', () => {
    const json = suggestCompletion({ path: 'p.json', lineText: '"name": "x",', lineIndex: 1 });
    expect(json).toMatch(/^".+":/);
    const css = suggestCompletion({ path: 'p.css', lineText: '.wr-x {', lineIndex: 1 });
    expect(css).toMatch(/:.*;/);
  });
});

// ---------------------------------------------------------------------------
// §V4-11 ideView helpers (tab ids, caret geometry, ghost state machine)
// ---------------------------------------------------------------------------

describe('ideView helpers (§V4-11)', () => {
  it('sanitizeTabId folds every non-alphanumeric to "-" (helpers-v4 ide-tab-* contract)', () => {
    expect(sanitizeTabId('src/index.ts')).toBe('src-index-ts');
    expect(sanitizeTabId('docs/decisions.md')).toBe('docs-decisions-md');
    expect(sanitizeTabId('.gitignore')).toBe('-gitignore');
    expect(sanitizeTabId('a b@c#1.ts')).toBe('a-b-c-1-ts');
    expect(/^[A-Za-z0-9-]*$/.test(sanitizeTabId('weird~!path/x.css'))).toBe(true);
  });

  it('caretInfo resolves line index, line text and line-end detection', () => {
    const text = 'alpha\nbeta gamma\ndelta';
    expect(caretInfo(text, 0)).toMatchObject({ lineIndex: 0, lineText: 'alpha', atLineEnd: false });
    expect(caretInfo(text, 5)).toMatchObject({ lineIndex: 0, atLineEnd: true });
    expect(caretInfo(text, 8)).toMatchObject({ lineIndex: 1, lineText: 'beta gamma', beforeCaret: 'be' });
    expect(caretInfo(text, text.length)).toMatchObject({ lineIndex: 2, lineText: 'delta', atLineEnd: true });
  });

  it('acceptGhost splices the suggestion at the caret and advances it', () => {
    const ghost = { path: 'a.ts', lineIndex: 0, text: 'Gauge = calibrate(12);' };
    const out = acceptGhost('const aether\nnext', 12, ghost);
    expect(out.text).toBe('const aetherGauge = calibrate(12);\nnext');
    expect(out.caret).toBe(12 + ghost.text.length);
  });

  it('escapeGhost dismisses a visible ghost FIRST; only then may Esc cascade', () => {
    const armed = { path: 'a.ts', lineIndex: 0, text: 'x' };
    expect(escapeGhost(armed)).toEqual({ ghost: null, cascade: false });
    expect(escapeGhost(null)).toEqual({ ghost: null, cascade: true });
  });
});

// ---------------------------------------------------------------------------
// §V4-13 final Esc cascade: ide > card-editor > runs > foundry > archive >
// review > steer > inspector > selection
// ---------------------------------------------------------------------------

describe('Esc cascade with the IDE on top (§V4-11/§V4-13)', () => {
  function makeRig() {
    const backend = new MockBackend({ seed: 42, autoStart: false });
    const store = createCommanderStore();
    const binding = bindBackendToStore(store, backend);
    binding.flush();
    return { backend, store, orders: binding.orders };
  }

  it('closes tiers strictly in order across nine Esc presses', () => {
    const { store } = makeRig();
    const s = store.getState();
    const anyCard = store.getState().board.cardIds[0]!;
    s.select([anyCard]);
    s.openInspectorCard(anyCard);
    s.openSteer();
    s.openReview(anyCard);
    s.openArchive();
    s.openFoundry();
    s.openRuns();
    s.openCardEditor(anyCard);
    s.openIde(anyCard);

    const tiers: Array<(m: ReturnType<typeof store.getState>['meta']) => boolean> = [
      (m) => m.ideTaskId === null,
      (m) => m.cardEditorTaskId === null,
      (m) => !m.runsOpen,
      (m) => !m.foundryOpen,
      (m) => !m.archiveOpen,
      (m) => m.reviewTaskId === null,
      (m) => !m.steerOpen,
      (m) => m.inspectorUnitId === null && m.inspectorTaskId === null,
    ];
    tiers.forEach((closed, i) => {
      expect(closed(store.getState().meta), `tier ${i} should still be open`).toBe(false);
      store.getState().escape();
      expect(closed(store.getState().meta), `tier ${i} should close on Esc #${i + 1}`).toBe(true);
    });
    // Selection survives every modal tier; the final Esc clears it.
    expect(store.getState().selection.ids).toEqual([anyCard]);
    store.getState().escape();
    expect(store.getState().selection.ids).toEqual([]);
  });

  it('the review panel SURVIVES the IDE Esc (AC45 ordering)', () => {
    const { store } = makeRig();
    const anyCard = store.getState().board.cardIds[0]!;
    store.getState().openReview(anyCard);
    store.getState().openIde(anyCard);
    store.getState().escape();
    expect(store.getState().meta.ideTaskId).toBeNull();
    expect(store.getState().meta.reviewTaskId).toBe(anyCard);
  });

  it('orders.writeFile routes to the sim and the diff plates reflect it', () => {
    const { backend, store, orders } = makeRig();
    const anyCard = store.getState().board.cardIds[0]!;
    const ok = orders.writeFile(anyCard, 'src/aether.ts', 'const aetherGauge = calibrate(12);\n');
    expect(ok).toBe(true);
    const ws = backend.sim.getWorkspaceView(anyCard)!;
    const file = ws.files.find((f) => f.path === 'src/aether.ts')!;
    expect(file).toBeTruthy();
    expect(backend.sim.getFileContent(anyCard, 'src/aether.ts')).toContain('aetherGauge');
  });
});
