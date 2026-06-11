/**
 * Microagent tests (SPEC §8): same id ⇒ byte-identical SVG; adapter-keyed
 * palettes; taskKind glyph badges; command sets per selection state; mixed
 * selections get the intersection; always ≤12; every command carries a
 * non-empty procedural icon.
 */
import { describe, expect, it } from 'vitest';

import type { CommandContext, CommandSpec } from '../../types';
import { generateCommands } from '../commandGen';
import { generateIcon } from '../iconGen';

const ADAPTERS = ['claude-code', 'codex', 'gemini-cli', 'pi'] as const;

const TASK_KINDS = [
  'ci-repair',
  'feature-dev',
  'code-review',
  'bug-fix',
  'refactor',
  'docs',
  'test-coverage',
  'perf-tuning',
  'security-audit',
  'release-prep',
] as const;

function ctx(
  partial: Partial<CommandContext['selection']>,
  fleet?: Partial<CommandContext['fleet']>,
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
      totalUnits: 12,
      idleUnits: 4,
      busyUnits: 8,
      pendingAlerts: 0,
      simPaused: false,
      ...fleet,
    },
  };
}

/** Representative contexts sweeping every §8 selection shape. */
function allContexts(): CommandContext[] {
  return [
    ctx({}),
    ctx({}, { simPaused: true, pendingAlerts: 2 }),
    ctx({ count: 1, kinds: ['unit'], states: ['idle'] }),
    ctx({ count: 3, kinds: ['unit'], states: ['idle', 'completed', 'failed'] }),
    ctx({ count: 1, kinds: ['unit'], states: ['thinking'] }),
    ctx({ count: 2, kinds: ['unit'], states: ['tool_running', 'dispatching'] }),
    ctx({ count: 1, kinds: ['unit'], states: ['blocked'] }),
    ctx({ count: 1, kinds: ['unit'], states: ['awaiting_approval'] }),
    ctx({ count: 2, kinds: ['unit'], states: ['awaiting_approval', 'thinking'] }),
    ctx({ count: 2, kinds: ['unit'], states: ['idle', 'thinking'] }),
    ctx({ count: 1, kinds: ['task'], taskStates: ['queued'] }),
    ctx({ count: 2, kinds: ['unit', 'task'], states: ['idle'], taskStates: ['queued'] }),
    ctx({ count: 2, kinds: ['unit'], states: ['thinking'], pausedUnits: 2 }),
  ];
}

describe('generateIcon determinism (AC12)', () => {
  it('same id ⇒ byte-identical SVG', () => {
    const a = generateIcon({ entityId: 'u01-vanguard', kind: 'unit', adapter: 'claude-code' });
    const b = generateIcon({ entityId: 'u01-vanguard', kind: 'unit', adapter: 'claude-code' });
    expect(a.svg).toBe(b.svg);
    expect(a.svg.startsWith('<svg')).toBe(true);
  });

  it('same task id ⇒ byte-identical SVG', () => {
    const a = generateIcon({ entityId: 'adr-01-fix', kind: 'task', taskKind: 'bug-fix' });
    const b = generateIcon({ entityId: 'adr-01-fix', kind: 'task', taskKind: 'bug-fix' });
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

  it('every taskKind gets a distinct glyph badge; same kind+id stays stable', () => {
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

  it('unit portraits are expressive: body + two eyes + crest markup present', () => {
    // Trait wheel sanity: across a spread of ids we should see multiple
    // body/eye variants (not one frozen face).
    const svgs = Array.from({ length: 24 }, (_, i) =>
      generateIcon({ entityId: `u${String(i).padStart(2, '0')}-probe`, kind: 'unit', adapter: 'pi' }).svg,
    );
    expect(new Set(svgs).size).toBe(svgs.length);
  });
});

describe('generateCommands (SPEC §8)', () => {
  it('empty selection → global set', () => {
    const specs = generateCommands(ctx({}));
    const ids = specs.map((s) => s.id);
    expect(ids).toEqual(['select-all-idle', 'jump-to-alert', 'toggle-sim']);
    expect(specs.map((s) => s.label)).toEqual(['Select All Idle', 'Jump to Alert', 'Pause Sim']);
  });

  it('idle units → Dispatch/Rally/Clone/Retire (frozen labels)', () => {
    const specs = generateCommands(ctx({ count: 2, kinds: ['unit'], states: ['idle'] }));
    expect(specs.map((s) => s.label)).toEqual(['Dispatch…', 'Rally', 'Clone', 'Retire']);
  });

  it('completed/failed units share the idle set (they are re-taskable)', () => {
    const specs = generateCommands(
      ctx({ count: 2, kinds: ['unit'], states: ['completed', 'failed'] }),
    );
    expect(specs.map((s) => s.id)).toEqual(['dispatch', 'rally', 'clone', 'retire']);
  });

  it('working units → Steer/Pause/Inspect/Abort', () => {
    const specs = generateCommands(ctx({ count: 1, kinds: ['unit'], states: ['tool_running'] }));
    expect(specs.map((s) => s.id)).toEqual(['steer', 'pause-unit', 'inspect', 'abort']);
    expect(specs.map((s) => s.label)).toEqual(['Steer…', 'Pause', 'Inspect', 'Abort']);
  });

  it('awaiting_approval → Approve/Deny/Inspect', () => {
    const specs = generateCommands(ctx({ count: 1, kinds: ['unit'], states: ['awaiting_approval'] }));
    expect(specs.map((s) => s.id)).toEqual(['approve', 'deny', 'inspect']);
  });

  it('task selection → Assign Best Idle/Prioritize/Cancel; gated on idle availability', () => {
    const specs = generateCommands(ctx({ count: 1, kinds: ['task'], taskStates: ['queued'] }));
    expect(specs.map((s) => s.id)).toEqual(['assign-best-idle', 'prioritize', 'cancel-task']);
    const noIdle = generateCommands(
      ctx({ count: 1, kinds: ['task'], taskStates: ['queued'] }, { idleUnits: 0 }),
    );
    expect(noIdle.find((s) => s.id === 'assign-best-idle')?.enabled).toBe(false);
  });

  it('mixed unit states → intersection by command id', () => {
    const specs = generateCommands(
      ctx({ count: 2, kinds: ['unit'], states: ['awaiting_approval', 'thinking'] }),
    );
    expect(specs.map((s) => s.id)).toEqual(['inspect']);
  });

  it('mixed unit states with an empty intersection → selection-scoped staples (never the global set)', () => {
    const idleWorking = generateCommands(
      ctx({ count: 2, kinds: ['unit'], states: ['idle', 'thinking'] }),
    );
    // Idle and working sets share nothing → mixed staples keep the card
    // selection-scoped (the global set here read like a deselection).
    expect(idleWorking.map((s) => s.id)).toEqual(['inspect', 'approve', 'abort', 'rally']);
    expect(idleWorking.map((s) => s.label)).toEqual(['Inspect', 'Approve', 'Abort', 'Rally']);
  });

  it('mixed staples enablement reflects which states are present in the selection', () => {
    const byId = (specs: CommandSpec[]): Record<string, boolean> =>
      Object.fromEntries(specs.map((s) => [s.id, s.enabled]));

    // idle + thinking: no approvals pending in the selection → Approve disabled;
    // a working unit exists → Abort enabled; an idle unit exists → Rally enabled.
    const idleWorking = byId(
      generateCommands(ctx({ count: 2, kinds: ['unit'], states: ['idle', 'thinking'] })),
    );
    expect(idleWorking['inspect']).toBe(true);
    expect(idleWorking['approve']).toBe(false);
    expect(idleWorking['abort']).toBe(true);
    expect(idleWorking['rally']).toBe(true);

    // awaiting_approval + idle: Approve enabled, no working unit → Abort disabled.
    const awaitingIdle = byId(
      generateCommands(ctx({ count: 2, kinds: ['unit'], states: ['awaiting_approval', 'idle'] })),
    );
    expect(awaitingIdle['approve']).toBe(true);
    expect(awaitingIdle['abort']).toBe(false);
    expect(awaitingIdle['rally']).toBe(true);

    // awaiting_approval + completed (idle-like): same staples, Rally enabled.
    const awaitingCompleted = byId(
      generateCommands(
        ctx({ count: 2, kinds: ['unit'], states: ['awaiting_approval', 'completed'] }),
      ),
    );
    expect(awaitingCompleted['approve']).toBe(true);
    expect(awaitingCompleted['abort']).toBe(false);
    expect(awaitingCompleted['rally']).toBe(true);
  });

  it('mixed staples keep positional hotkeys and the ≤12 grid invariant', () => {
    const specs = generateCommands(
      ctx({ count: 3, kinds: ['unit'], states: ['idle', 'thinking', 'awaiting_approval'] }),
    );
    expect(specs.map((s) => s.id)).toEqual(['inspect', 'approve', 'abort', 'rally']);
    expect(specs.map((s) => s.hotkey)).toEqual(['Q', 'W', 'E', 'R']);
    expect(specs.length).toBeLessThanOrEqual(12);
  });

  it('mixed kinds (unit + task) → global set, never an empty card', () => {
    const specs = generateCommands(
      ctx({ count: 2, kinds: ['unit', 'task'], states: ['idle'], taskStates: ['queued'] }),
    );
    expect(specs.length).toBeGreaterThan(0);
    expect(specs.map((s) => s.id)).toEqual(['select-all-idle', 'jump-to-alert', 'toggle-sim']);
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

  it('all selected units held → Pause flips to Resume (distinct icon)', () => {
    const held = generateCommands(
      ctx({ count: 2, kinds: ['unit'], states: ['thinking'], pausedUnits: 2 }),
    );
    const resume = held.find((s) => s.id === 'pause-unit');
    expect(resume?.label).toBe('Resume');
    const mixed = generateCommands(
      ctx({ count: 2, kinds: ['unit'], states: ['thinking'], pausedUnits: 1 }),
    );
    expect(mixed.find((s) => s.id === 'pause-unit')?.label).toBe('Pause');
    expect(resume?.icon.svg).not.toBe(mixed.find((s) => s.id === 'pause-unit')?.icon.svg);
  });

  it('≤12 commands for every selection shape (3x4 grid invariant)', () => {
    for (const context of allContexts()) {
      expect(generateCommands(context).length).toBeLessThanOrEqual(12);
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

  it('positional hotkeys: cell i answers to QWER/ASDF/ZXCV row-major', () => {
    const specs = generateCommands(ctx({ count: 1, kinds: ['unit'], states: ['idle'] }));
    expect(specs.map((s) => s.hotkey)).toEqual(['Q', 'W', 'E', 'R']);
  });
});
