/**
 * Microagent tests (SPEC §8 + SPEC-V2 §V2-2 + SPEC-V3 §V3-5/§V3-7):
 * same id ⇒ byte-identical SVG; adapter-keyed palettes; taskKind glyph
 * badges; kind-specific command sets per task kind; column-aware sets per
 * board column; always ≤12 with Abort never dropped from working sets;
 * every command carries a distinct path-only procedural icon; inquiry-option
 * icons are deterministic, semantic and path-only.
 */
import { describe, expect, it } from 'vitest';

import type {
  BoardColumn,
  CardContextSummary,
  CommandContext,
  CommandSpec,
} from '../../types';
import { generateCommands, GLYPHS } from '../commandGen';
import { generateIcon } from '../iconGen';
import { generateOptionIcon } from '../optionIconGen';

const ADAPTERS = ['claude-code', 'codex', 'gemini-cli', 'pi'] as const;

const TASK_KINDS = [
  'implement',
  'review',
  'fix',
  'root-cause-analysis',
  'polish',
  'test-coverage',
  'docs',
  'deploy',
  'research',
  'migrate',
] as const;

const COLUMNS: readonly BoardColumn[] = ['backlog', 'do', 'ai-review', 'human-review', 'approved'];

function card(partial: Partial<CardContextSummary> = {}): CardContextSummary {
  return {
    taskId: 'adr-01-implement',
    taskKind: 'implement',
    column: 'do',
    runStage: 'implement',
    inquiryPending: false,
    workspaceDirty: true,
    yolo: false,
    merged: false,
    agentRoles: ['worker'],
    ...partial,
  };
}

function ctx(
  partial: Partial<CommandContext['selection']>,
  fleet?: Partial<CommandContext['fleet']>,
  cards: CardContextSummary[] = [],
): CommandContext {
  return {
    selection: {
      count: 0,
      kinds: [],
      states: [],
      adapters: [],
      taskStates: [],
      pausedUnits: 0,
      ...partial,
    },
    alerts: [],
    fleet: {
      totalUnits: 3,
      idleUnits: 0,
      busyUnits: 3,
      pendingAlerts: 0,
      simPaused: false,
      ...fleet,
    },
    cards,
  };
}

/** A selected card in `column` of `taskKind`. */
function cardCtx(column: BoardColumn, taskKind = 'implement', extra: Partial<CardContextSummary> = {}): CommandContext {
  const roles: CardContextSummary['agentRoles'] =
    column === 'do' ? ['worker'] : column === 'ai-review' ? ['reviewer'] : column === 'approved' ? ['integration'] : [];
  return ctx(
    { count: 1, kinds: ['task'], taskStates: ['in_progress'] },
    {},
    [card({ column, taskKind, agentRoles: roles, ...extra })],
  );
}

/** A selected working AGENT attending a `taskKind` card in DO (§V2-2). */
function workingUnitCtx(taskKind: string): CommandContext {
  return ctx(
    { count: 1, kinds: ['unit'], states: ['thinking'], adapters: ['claude-code'] },
    {},
    [card({ taskKind, column: 'do' })],
  );
}

/** Representative contexts sweeping selection shapes × kinds × columns. */
function allContexts(): CommandContext[] {
  const out: CommandContext[] = [
    ctx({}),
    ctx({}, { simPaused: true, pendingAlerts: 2 }),
    ctx({ count: 1, kinds: ['unit'], states: ['awaiting_approval'] }),
    ctx({ count: 2, kinds: ['unit'], states: ['awaiting_approval', 'thinking'] }, {}, [card()]),
    ctx({ count: 2, kinds: ['unit', 'task'], states: ['thinking'], taskStates: ['in_progress'] }, {}, [card()]),
    ctx({ count: 2, kinds: ['unit'], states: ['thinking'], pausedUnits: 2 }, {}, [card()]),
    cardCtx('approved', 'implement', { merged: true }),
  ];
  for (const kind of TASK_KINDS) {
    out.push(workingUnitCtx(kind));
    for (const column of COLUMNS) {
      out.push(cardCtx(column, kind));
    }
  }
  return out;
}

describe('generateIcon determinism (AC12)', () => {
  it('same id ⇒ byte-identical SVG', () => {
    const a = generateIcon({ entityId: 'u01-vanguard', kind: 'unit', adapter: 'claude-code' });
    const b = generateIcon({ entityId: 'u01-vanguard', kind: 'unit', adapter: 'claude-code' });
    expect(a.svg).toBe(b.svg);
    expect(a.svg.startsWith('<svg')).toBe(true);
  });

  it('same task id ⇒ byte-identical SVG', () => {
    const a = generateIcon({ entityId: 'adr-01-fix', kind: 'task', taskKind: 'fix' });
    const b = generateIcon({ entityId: 'adr-01-fix', kind: 'task', taskKind: 'fix' });
    expect(a.svg).toBe(b.svg);
  });

  it('different ids ⇒ different SVGs; palette keyed by adapter', () => {
    const a = generateIcon({ entityId: 'u01-vanguard', kind: 'unit', adapter: 'claude-code' });
    const b = generateIcon({ entityId: 'u02-specter', kind: 'unit', adapter: 'claude-code' });
    expect(a.svg).not.toBe(b.svg);
    expect(a.palette).toEqual(b.palette);
    const c = generateIcon({ entityId: 'u01-vanguard', kind: 'unit', adapter: 'codex' });
    expect(c.palette).not.toEqual(a.palette);
  });

  it('all four adapter factions have pairwise-distinct palettes (SPEC §10)', () => {
    const palettes = ADAPTERS.map(
      (adapter) => generateIcon({ entityId: 'u00-probe', kind: 'unit', adapter }).palette,
    );
    for (let i = 0; i < palettes.length; i += 1) {
      for (let j = i + 1; j < palettes.length; j += 1) {
        expect(palettes[i]).not.toEqual(palettes[j]);
      }
    }
  });

  it('unknown adapter falls back to a neutral palette without throwing', () => {
    const icon = generateIcon({ entityId: 'u99-stray', kind: 'unit', adapter: 'cursor' });
    expect(icon.svg.startsWith('<svg')).toBe(true);
    expect(icon.palette.length).toBeGreaterThanOrEqual(3);
  });

  it('every taskKind gets a stable badge; unknown kinds fall back without throwing', () => {
    const svgs = TASK_KINDS.map(
      (taskKind) => generateIcon({ entityId: `t-${taskKind}`, kind: 'task', taskKind }).svg,
    );
    expect(new Set(svgs).size).toBe(TASK_KINDS.length);
    const fallback = generateIcon({ entityId: 't-weird', kind: 'task', taskKind: 'mystery-kind' });
    expect(fallback.svg.startsWith('<svg')).toBe(true);
  });

  it('never emits line/polyline (link-layer counting contract) nor text (crispness)', () => {
    for (const id of ['u01-a', 'u02-b', 'u03-c', 'u04-d', 'u05-e', 'u06-f', 'u07-g', 'u08-h']) {
      for (const adapter of ADAPTERS) {
        const unit = generateIcon({ entityId: `${id}-${adapter}`, kind: 'unit', adapter });
        expect(unit.svg).not.toMatch(/<(line|polyline|text)\b/);
      }
    }
    for (const taskKind of TASK_KINDS) {
      const task = generateIcon({ entityId: `t-${taskKind}`, kind: 'task', taskKind });
      expect(task.svg).not.toMatch(/<(line|polyline|text)\b/);
    }
  });

  it('unit portraits are expressive: distinct across a spread of ids', () => {
    const svgs = Array.from({ length: 24 }, (_, i) =>
      generateIcon({ entityId: `u${String(i).padStart(2, '0')}-probe`, kind: 'unit', adapter: 'pi' }).svg,
    );
    expect(new Set(svgs).size).toBe(svgs.length);
  });
});

describe('generateCommands — global + column-aware sets (SPEC-V3 §V3-7)', () => {
  it('empty selection → Commission Task / Jump to Alert / Pause Sim', () => {
    const specs = generateCommands(ctx({}));
    expect(specs.map((s) => s.id)).toEqual(['commission-task', 'jump-to-alert', 'toggle-sim']);
    expect(specs.map((s) => s.label)).toEqual(['Commission Task', 'Jump to Alert', 'Pause Sim']);
    expect(specs.find((s) => s.id === 'jump-to-alert')?.enabled).toBe(false); // no alerts
  });

  it('backlog card → Start Work / Set Yolo / Prioritize / Commission Task', () => {
    const specs = generateCommands(cardCtx('backlog'));
    expect(specs.map((s) => s.id)).toEqual(['start-work', 'set-yolo', 'prioritize', 'commission-task', 'edit-card']);
    expect(specs.find((s) => s.id === 'start-work')?.intent).toEqual({ kind: 'move-card', column: 'do' });
    expect(specs.find((s) => s.id === 'set-yolo')?.label).toBe('Set Yolo');
  });

  it('yolo-flagged backlog card flips Set Yolo → Unset Yolo (distinct icon, off intent)', () => {
    const on = generateCommands(cardCtx('backlog'));
    const off = generateCommands(cardCtx('backlog', 'implement', { yolo: true }));
    const setSpec = on.find((s) => s.id === 'set-yolo');
    const unsetSpec = off.find((s) => s.id === 'set-yolo');
    expect(unsetSpec?.label).toBe('Unset Yolo');
    expect(unsetSpec?.intent).toEqual({ kind: 'set-yolo', on: false });
    expect(unsetSpec?.icon.svg).not.toBe(setSpec?.icon.svg);
  });

  it('do card → kind set layered over Steer…/Pause/Inspect/Abort staples', () => {
    const specs = generateCommands(cardCtx('do', 'fix'));
    const ids = specs.map((s) => s.id);
    expect(ids).toEqual([
      'run-tests', 'root-cause', 'apply-patch', 'rollback',
      'steer', 'pause-unit', 'inspect', 'abort', 'edit-card',
      'open-terminal', 'open-ide',
    ]);
    expect(specs.map((s) => s.label)).toContain('Steer…');
    expect(specs.find((s) => s.id === 'abort')?.severity).toBe('danger');
  });

  it('ai-review card → Inspect Review / Expedite / Abort', () => {
    const specs = generateCommands(cardCtx('ai-review'));
    expect(specs.map((s) => s.id)).toEqual(['inspect-review', 'expedite', 'abort', 'edit-card', 'open-terminal']);
    expect(specs.find((s) => s.id === 'expedite')?.enabled).toBe(true); // a reviewer attends
  });

  it('human-review card → Open Review / Approve All / Request Changes (danger)', () => {
    const specs = generateCommands(cardCtx('human-review'));
    expect(specs.map((s) => s.id)).toEqual([
      'open-review', 'approve-all', 'request-changes', 'edit-card', 'open-terminal', 'open-ide',
    ]);
    expect(specs.find((s) => s.id === 'approve-all')?.intent).toEqual({ kind: 'move-card', column: 'approved' });
    const reject = specs.find((s) => s.id === 'request-changes');
    expect(reject?.intent).toEqual({ kind: 'move-card', column: 'do', danger: true });
    expect(reject?.severity).toBe('danger');
  });

  it('approved card → Hold Merge / Force Rebase / Inspect', () => {
    const specs = generateCommands(cardCtx('approved'));
    expect(specs.map((s) => s.id)).toEqual(['hold-merge', 'force-rebase', 'inspect', 'edit-card', 'open-terminal']);
    expect(specs.find((s) => s.id === 'hold-merge')?.enabled).toBe(true); // integration agent attends
  });

  it('merged card → Inspect only (terminal seal)', () => {
    const specs = generateCommands(cardCtx('approved', 'implement', { merged: true, agentRoles: [] }));
    expect(specs.map((s) => s.id)).toEqual(['inspect']);
  });

  it('mixed-column card selection → intersection by command id (V4: Edit Card is the backlog∩do common ground)', () => {
    const mixed = ctx({ count: 2, kinds: ['task'], taskStates: ['queued', 'in_progress'] }, {}, [
      card({ column: 'backlog', taskId: 'a' }),
      card({ column: 'do', taskId: 'b' }),
    ]);
    const specs = generateCommands(mixed);
    expect(specs.map((s) => s.id)).toEqual(['edit-card']);
  });

  it('mixed-column selection with NO intersection falls back to the selection staples', () => {
    const mixed = ctx({ count: 2, kinds: ['task'], taskStates: ['queued', 'done'] }, {}, [
      card({ column: 'backlog', taskId: 'a' }),
      card({ column: 'in-production', taskId: 'b', merged: true }),
    ]);
    const specs = generateCommands(mixed);
    expect(specs.map((s) => s.id)).toEqual(['inspect', 'abort']);
  });
});

describe('generateCommands — kind-specific sets (SPEC-V2 §V2-2, all ten kinds)', () => {
  const EXPECTED: Record<string, string[]> = {
    review: ['Approve Review', 'Request Changes', 'Add Comment', 'Open Diff'],
    fix: ['Run Tests', 'Root-Cause', 'Apply Patch', 'Rollback'],
    'root-cause-analysis': ['Hypothesize', 'Bisect', 'Instrument', 'Conclude'],
    polish: ['Capture Plates', 'Score', 'Apply Findings'],
    implement: ['Run Tests', 'Open Diff', 'Checkpoint'],
    'test-coverage': ['Run Suite', 'Coverage Report', 'Add Cases'],
    docs: ['Preview', 'Spell-Gauge', 'Publish Draft'],
    deploy: ['Dry Run', 'Ship It', 'Hold the Line'],
    research: ['Summarize', 'Cite Sources', 'Archive to Brain'],
    migrate: ['Plan Steps', 'Execute Step', 'Verify Parity'],
  };

  for (const kind of TASK_KINDS) {
    it(`${kind} → ${EXPECTED[kind]!.join(' / ')} + working staples (Abort never dropped)`, () => {
      for (const context of [cardCtx('do', kind), workingUnitCtx(kind)]) {
        const labels = generateCommands(context).map((s) => s.label);
        for (const expected of EXPECTED[kind]!) {
          expect(labels, `${kind}: missing ${expected} in ${JSON.stringify(labels)}`).toContain(expected);
        }
        for (const staple of ['Steer…', 'Inspect', 'Abort']) {
          expect(labels, `${kind}: staple ${staple} dropped`).toContain(staple);
        }
      }
    });
  }

  it('deploy: Ship It carries danger styling', () => {
    const shipIt = generateCommands(cardCtx('do', 'deploy')).find((s) => s.label === 'Ship It');
    expect(shipIt?.severity).toBe('danger');
  });

  it('kind verbs route to real sim activity (task-action steers with a prompt)', () => {
    const runTests = generateCommands(cardCtx('do', 'fix')).find((s) => s.id === 'run-tests');
    expect(runTests?.intent.kind).toBe('task-action');
    if (runTests?.intent.kind === 'task-action') {
      expect(runTests.intent.prompt.length).toBeGreaterThan(0);
    }
  });

  it('pure awaiting-approval agent selection → Approve / Deny / Inspect', () => {
    const specs = generateCommands(ctx({ count: 1, kinds: ['unit'], states: ['awaiting_approval'] }));
    expect(specs.map((s) => s.id)).toEqual(['approve', 'deny', 'inspect']);
  });
});

describe('generateCommands — grid invariants (≤12, icons, hotkeys)', () => {
  it('≤12 commands for every kind × column × selection shape', () => {
    for (const context of allContexts()) {
      const specs = generateCommands(context);
      expect(specs.length).toBeGreaterThan(0);
      expect(specs.length).toBeLessThanOrEqual(12);
    }
  });

  it('every command carries a non-empty path-only icon; icons distinct within a set', () => {
    for (const context of allContexts()) {
      const specs = generateCommands(context);
      for (const spec of specs) {
        expect(spec.icon.svg.startsWith('<svg')).toBe(true);
        expect(spec.icon.svg).not.toMatch(/<(line|polyline|text)\b/);
        expect(spec.icon.palette.length).toBeGreaterThan(0);
        expect(spec.tooltip.length).toBeGreaterThan(0);
      }
      const svgs = specs.map((s: CommandSpec) => s.icon.svg);
      expect(new Set(svgs).size).toBe(svgs.length);
    }
  });

  it('every command id in the glyph book has a DISTINCT engraved glyph', () => {
    const entries = Object.entries(GLYPHS);
    expect(entries.length).toBeGreaterThanOrEqual(40);
    const svgs = entries.map(([, icon]) => icon.svg);
    expect(new Set(svgs).size).toBe(svgs.length);
    for (const [id, icon] of entries) {
      expect(icon.svg, `glyph ${id} must be path-only`).not.toMatch(/<(line|polyline|text)\b/);
    }
  });

  it('positional hotkeys: cell i answers to QWER/ASDF/ZXCV row-major', () => {
    const specs = generateCommands(cardCtx('do', 'fix'));
    // V4: + Edit Card (§V4-5), Terminal (§V4-7) and Open in IDE (§V4-11)
    // after the staples → 11 cells, row-major.
    expect(specs.map((s) => s.hotkey)).toEqual(['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'Z', 'X', 'C']);
  });

  it('paused sim flips the toggle label (and icon)', () => {
    const running = generateCommands(ctx({}));
    const paused = generateCommands(ctx({}, { simPaused: true }));
    const runningToggle = running.find((s) => s.id === 'toggle-sim');
    const pausedToggle = paused.find((s) => s.id === 'toggle-sim');
    expect(runningToggle?.label).toBe('Pause Sim');
    expect(pausedToggle?.label).toBe('Resume Sim');
    expect(pausedToggle?.icon.svg).not.toBe(runningToggle?.icon.svg);
  });

  it('all selected agents held → Pause flips to Resume (distinct icon)', () => {
    const held = generateCommands(
      ctx({ count: 2, kinds: ['unit'], states: ['thinking'], pausedUnits: 2 }, {}, [card()]),
    );
    const resume = held.find((s) => s.id === 'pause-unit');
    expect(resume?.label).toBe('Resume');
    const mixed = generateCommands(
      ctx({ count: 2, kinds: ['unit'], states: ['thinking'], pausedUnits: 1 }, {}, [card()]),
    );
    expect(mixed.find((s) => s.id === 'pause-unit')?.label).toBe('Pause');
    expect(resume?.icon.svg).not.toBe(mixed.find((s) => s.id === 'pause-unit')?.icon.svg);
  });
});

describe('generateOptionIcon (SPEC-V3 §V3-5)', () => {
  it('deterministic: same option ⇒ byte-identical SVG', () => {
    const a = generateOptionIcon({ id: 'expand-contract', caption: 'Expand-Contract' });
    const b = generateOptionIcon({ id: 'expand-contract', caption: 'Expand-Contract' });
    expect(a.svg).toBe(b.svg);
    expect(a.svg.startsWith('<svg')).toBe(true);
  });

  it('semantic mapping: strategy=fork, version=stacked discs, approve=check-seal, reject=barred shield, test=flask, patch=stitched plate', () => {
    const fork = generateOptionIcon({ id: 'strategy-a', caption: 'Branch strategy' });
    const discs = generateOptionIcon({ id: 'pin-version', caption: 'Pin the version' });
    const seal = generateOptionIcon({ id: 'proceed', caption: 'Proceed' });
    const shield = generateOptionIcon({ id: 'stand-down', caption: 'Stand Down', tone: 'danger' });
    const flask = generateOptionIcon({ id: 'run-the-tests', caption: 'Run the tests first' });
    const plate = generateOptionIcon({ id: 'hotfix-patch', caption: 'Apply a patch' });
    const svgs = [fork.svg, discs.svg, seal.svg, shield.svg, flask.svg, plate.svg];
    expect(new Set(svgs).size).toBe(svgs.length); // distinct semantic glyphs
    // Spot-check the semantics are stable (not hash fallbacks): proceeding twice
    // with different ids but the same keyword lands the same glyph family.
    const seal2 = generateOptionIcon({ id: 'allow-it', caption: 'Allow' });
    expect(seal2.svg).toBe(seal.svg);
  });

  it('danger tone renders in the garnet tint', () => {
    const normal = generateOptionIcon({ id: 'opt-x', caption: 'Mysterious choice A' });
    const danger = generateOptionIcon({ id: 'opt-x', caption: 'Mysterious choice A', tone: 'danger' });
    expect(danger.svg).not.toBe(normal.svg);
    expect(danger.palette[0]).not.toBe(normal.palette[0]);
  });

  it('unknown keywords fall back deterministically and distinctly per id', () => {
    const a = generateOptionIcon({ id: 'zlorp', caption: 'Zlorp' });
    const b = generateOptionIcon({ id: 'wibble', caption: 'Wibble' });
    const a2 = generateOptionIcon({ id: 'zlorp', caption: 'Zlorp' });
    expect(a.svg).toBe(a2.svg);
    expect(a.svg).not.toBe(b.svg);
  });

  it('path-only invariant: no line/polyline/text across a sweep of options', () => {
    const samples = [
      { id: 'expand-contract', caption: 'Expand-Contract' },
      { id: 'big-bang', caption: 'Big Bang rewrite', tone: 'danger' as const },
      { id: 'pin-lts', caption: 'Pin to LTS' },
      { id: 'proceed', caption: 'Proceed' },
      { id: 'stand-down', caption: 'Stand Down', tone: 'danger' as const },
      { id: 'bisect-history', caption: 'Bisect the history' },
      { id: 'zlorp', caption: 'Zlorp' },
      { id: 'cache-it', caption: 'Cache the result' },
    ];
    for (const option of samples) {
      const icon = generateOptionIcon(option);
      expect(icon.svg).not.toMatch(/<(line|polyline|text)\b/);
      expect(icon.palette.length).toBeGreaterThan(0);
    }
  });
});
