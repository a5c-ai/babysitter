/**
 * Rule-based mock command generation (SPEC §8).
 *
 * Selection state → command set; mixed unit-state selections get the
 * intersection (by command id). When the intersection is EMPTY (e.g. idle +
 * thinking), the card stays selection-scoped: a staple set (Inspect / Approve
 * / Abort / Rally) acting on the selected units, with per-command enablement
 * derived from which states are present — falling back to the GLOBAL set here
 * read like a deselection. Mixed-KIND selections (unit + task) still fall
 * back to the global set. Always ≤12 commands (3x4 grid).
 *
 * Command glyphs are tiny procedural SVGs (paths only — no <line>/<polyline>;
 * the e2e suite counts those as link-layer shapes).
 */

import type {
  CommandContext,
  CommandIntent,
  CommandSpec,
  IconContext,
  IconSpec,
  Microagent,
} from '../types';
import { generateIcon } from './iconGen';

/**
 * Positional hotkeys for the 3x4 command grid (SPEC §5): row-major, mirroring
 * the physical keyboard rows QWER / ASDF / ZXCV. Cell index i always answers
 * to COMMAND_HOTKEYS[i] regardless of which command occupies it.
 */
export const COMMAND_HOTKEYS = [
  'Q', 'W', 'E', 'R',
  'A', 'S', 'D', 'F',
  'Z', 'X', 'C', 'V',
] as const;

export type CommandHotkey = (typeof COMMAND_HOTKEYS)[number];

const GLYPH_STROKE = '#9fd9ef';

function glyph(paths: string): IconSpec {
  return {
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="100%" height="100%" aria-hidden="true">` +
      `<g fill="none" stroke="${GLYPH_STROKE}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</g>` +
      `</svg>`,
    palette: [GLYPH_STROKE],
  };
}

const GLYPHS: Record<string, IconSpec> = {
  dispatch: glyph('<path d="M4 10 H14 M10 5 L15 10 L10 15"/>'),
  rally: glyph('<path d="M6 17 V3 M6 4 H15 L12 7.5 L15 11 H6"/>'),
  clone: glyph('<rect x="3" y="3" width="9" height="9" rx="2"/><rect x="8" y="8" width="9" height="9" rx="2"/>'),
  retire: glyph('<path d="M10 3 V13 M5 9 L10 14 L15 9 M4 17 H16"/>'),
  steer: glyph('<path d="M4 6 L9 10 L4 14 M10 6 L15 10 L10 14"/>'),
  'pause-unit': glyph('<circle cx="10" cy="10" r="7"/><path d="M8 7 V13 M12 7 V13"/>'),
  inspect: glyph('<circle cx="9" cy="9" r="5"/><path d="M13 13 L17 17"/>'),
  abort: glyph('<circle cx="10" cy="10" r="7"/><path d="M6.5 6.5 L13.5 13.5"/>'),
  approve: glyph('<path d="M4 10.5 L8.5 15 L16 5"/>'),
  deny: glyph('<path d="M5 5 L15 15 M15 5 L5 15"/>'),
  'assign-best-idle': glyph('<path d="M3 10 H11 M8 6 L12 10 L8 14"/><circle cx="15.5" cy="10" r="2.5"/>'),
  prioritize: glyph('<path d="M10 16 V4 M5 9 L10 4 L15 9"/>'),
  'cancel-task': glyph('<rect x="4" y="4" width="12" height="12" rx="2.5"/><path d="M7.5 7.5 L12.5 12.5 M12.5 7.5 L7.5 12.5"/>'),
  'select-all-idle': glyph('<path d="M3 6 V3 H6 M14 3 H17 V6 M17 14 V17 H14 M6 17 H3 V14"/><circle cx="10" cy="10" r="2.5"/>'),
  'jump-to-alert': glyph('<circle cx="10" cy="10" r="6.5"/><circle cx="10" cy="10" r="1.2"/><path d="M10 3.5 V6 M10 14 V16.5 M3.5 10 H6 M14 10 H16.5"/>'),
  'toggle-sim': glyph('<path d="M7 4 V16 M13 4 V16"/>'),
};

/** Presentation swaps for toggled commands (resolved in generateCommands). */
const SWAP_GLYPHS: Record<string, IconSpec> = {
  'resume-unit': glyph('<circle cx="10" cy="10" r="7"/><path d="M8.2 7 L13.5 10 L8.2 13 Z"/>'),
  'resume-sim': glyph('<path d="M6 4 L16 10 L6 16 Z"/>'),
};

function fallbackGlyph(): IconSpec {
  return glyph('<circle cx="10" cy="10" r="6"/>');
}

interface CommandDef {
  id: string;
  label: string;
  intent: CommandIntent;
  tooltip: string;
  severity?: 'normal' | 'danger' | 'urgent';
  enabled?: (ctx: CommandContext) => boolean;
}

function spec(def: CommandDef, ctx: CommandContext, hotkey: CommandHotkey | undefined): CommandSpec {
  return {
    id: def.id,
    label: def.label,
    ...(hotkey !== undefined ? { hotkey } : {}),
    icon: GLYPHS[def.id] ?? fallbackGlyph(),
    intent: def.intent,
    enabled: def.enabled !== undefined ? def.enabled(ctx) : true,
    tooltip: def.tooltip,
    ...(def.severity !== undefined ? { severity: def.severity } : {}),
  };
}

const GLOBAL_DEFS: CommandDef[] = [
  {
    id: 'select-all-idle',
    label: 'Select All Idle',
    intent: { kind: 'select-all-idle' },
    tooltip: 'Select every idle unit in the fleet',
    enabled: (ctx) => ctx.fleet.idleUnits > 0,
  },
  {
    id: 'jump-to-alert',
    label: 'Jump to Alert',
    intent: { kind: 'jump-to-alert' },
    tooltip: 'Center the camera on the most recent pending alert',
    enabled: (ctx) => ctx.fleet.pendingAlerts > 0,
    severity: 'urgent',
  },
  {
    id: 'toggle-sim',
    label: 'Pause Sim', // label resolved dynamically below
    intent: { kind: 'toggle-sim' },
    tooltip: 'Pause or resume the simulation clock',
  },
];

const IDLE_DEFS: CommandDef[] = [
  {
    id: 'dispatch',
    label: 'Dispatch…',
    intent: { kind: 'dispatch-mode' },
    tooltip: 'Pick a target objective for the selected units',
  },
  {
    id: 'rally',
    label: 'Rally',
    intent: { kind: 'rally-mode' },
    tooltip: 'Pick a rally point to reposition the selected idle units',
  },
  {
    id: 'clone',
    label: 'Clone',
    intent: { kind: 'clone' },
    tooltip: 'Spawn a fresh unit of the same adapter',
  },
  {
    id: 'retire',
    label: 'Retire',
    intent: { kind: 'retire' },
    tooltip: 'Decommission the selected units at the next idle window',
    severity: 'danger',
  },
];

const WORKING_DEFS: CommandDef[] = [
  {
    id: 'steer',
    label: 'Steer…',
    intent: { kind: 'steer' },
    tooltip: 'Send a steering prompt to the selected units',
  },
  {
    id: 'pause-unit',
    label: 'Pause', // flips to Resume when every selected unit is held
    intent: { kind: 'pause-unit' },
    tooltip: 'Hold the unit in place — its run freezes until resumed',
  },
  {
    id: 'inspect',
    label: 'Inspect',
    intent: { kind: 'inspect' },
    tooltip: 'Open the session transcript inspector',
  },
  {
    id: 'abort',
    label: 'Abort',
    intent: { kind: 'abort' },
    tooltip: 'Abort the active run and return the unit to the staging area',
    severity: 'danger',
  },
];

const APPROVAL_DEFS: CommandDef[] = [
  {
    id: 'approve',
    label: 'Approve',
    intent: { kind: 'approve' },
    tooltip: 'Allow the gated action and unblock the unit',
    severity: 'urgent',
  },
  {
    id: 'deny',
    label: 'Deny',
    intent: { kind: 'deny' },
    tooltip: 'Deny the gated action',
    severity: 'danger',
  },
  {
    id: 'inspect',
    label: 'Inspect',
    intent: { kind: 'inspect' },
    tooltip: 'Open the session transcript inspector',
  },
];

const TASK_DEFS: CommandDef[] = [
  {
    id: 'assign-best-idle',
    label: 'Assign Best Idle',
    intent: { kind: 'assign-best-idle' },
    tooltip: 'Dispatch the first available idle unit to this objective',
    enabled: (ctx) => ctx.fleet.idleUnits > 0,
  },
  {
    id: 'prioritize',
    label: 'Prioritize',
    intent: { kind: 'prioritize' },
    tooltip: 'Mark this objective as the fleet priority',
  },
  {
    id: 'cancel-task',
    label: 'Cancel',
    intent: { kind: 'cancel-task' },
    tooltip: 'Recall every unit assigned to this objective',
    severity: 'danger',
  },
];

/** Unit states that take the working command set (SPEC §3). */
const WORKING_STATES = new Set(['dispatching', 'thinking', 'tool_running', 'blocked']);
/** Re-taskable states that share the idle command set (SPEC §3). */
const IDLE_LIKE_STATES = new Set(['idle', 'completed', 'failed']);

/** Map a unit visual state (SPEC §3) to its command set. */
function defsForUnitState(state: string): CommandDef[] {
  if (state === 'awaiting_approval') return APPROVAL_DEFS;
  if (IDLE_LIKE_STATES.has(state)) return IDLE_DEFS;
  return WORKING_DEFS; // dispatching | thinking | tool_running | blocked
}

/**
 * Selection-scoped staples for mixed-state unit selections whose strict
 * intersection is empty (idle + working, awaiting + idle, …). Each command
 * acts on the applicable subset of the selection; enablement reflects which
 * states are actually present so the card never reads like a deselection.
 */
const MIXED_UNIT_DEFS: CommandDef[] = [
  {
    id: 'inspect',
    label: 'Inspect',
    intent: { kind: 'inspect' },
    tooltip: 'Open the transcript inspector for the first selected unit',
  },
  {
    id: 'approve',
    label: 'Approve',
    intent: { kind: 'approve' },
    tooltip: 'Allow the gated action for selected units awaiting approval',
    severity: 'urgent',
    enabled: (ctx) => ctx.selection.states.includes('awaiting_approval'),
  },
  {
    id: 'abort',
    label: 'Abort',
    intent: { kind: 'abort' },
    tooltip: 'Abort the active runs of the selected working units',
    severity: 'danger',
    enabled: (ctx) => ctx.selection.states.some((state) => WORKING_STATES.has(state)),
  },
  {
    id: 'rally',
    label: 'Rally',
    intent: { kind: 'rally-mode' },
    tooltip: 'Pick a rally point to reposition the selected idle units',
    enabled: (ctx) => ctx.selection.states.some((state) => IDLE_LIKE_STATES.has(state)),
  },
];

export function generateCommands(ctx: CommandContext): CommandSpec[] {
  let defs: CommandDef[];

  if (ctx.selection.count === 0) {
    defs = GLOBAL_DEFS;
  } else if (ctx.selection.kinds.length === 1 && ctx.selection.kinds[0] === 'task') {
    defs = TASK_DEFS;
  } else if (ctx.selection.kinds.length === 1 && ctx.selection.kinds[0] === 'unit') {
    // Intersection across all selected unit states (SPEC §8).
    const sets = ctx.selection.states.map((state) => defsForUnitState(state));
    const first = sets[0] ?? IDLE_DEFS;
    defs = first.filter((def) => sets.every((set) => set.some((d) => d.id === def.id)));
    // Empty intersection (e.g. idle + thinking): stay selection-scoped with
    // the mixed staples instead of the global set (which felt like a deselect).
    if (defs.length === 0) defs = MIXED_UNIT_DEFS;
  } else {
    // Mixed kinds: the strict intersection is empty — fall back to global.
    defs = GLOBAL_DEFS;
  }

  // Positional hotkeys: cell i ⇒ COMMAND_HOTKEYS[i] (SPEC §5 grid mapping).
  const specs = defs
    .slice(0, COMMAND_HOTKEYS.length)
    .map((def, index) => spec(def, ctx, COMMAND_HOTKEYS[index]));
  return specs.map((s) => applyDynamicPresentation(s, ctx));
}

/** Toggled commands swap label/icon/tooltip with the live context. */
function applyDynamicPresentation(s: CommandSpec, ctx: CommandContext): CommandSpec {
  if (s.id === 'toggle-sim') {
    return ctx.fleet.simPaused
      ? {
          ...s,
          label: 'Resume Sim',
          icon: SWAP_GLYPHS['resume-sim'] ?? s.icon,
          tooltip: 'Resume the simulation clock',
        }
      : { ...s, label: 'Pause Sim', tooltip: 'Pause the simulation clock' };
  }
  if (s.id === 'pause-unit') {
    const allPaused =
      ctx.selection.count > 0 && ctx.selection.pausedUnits === ctx.selection.count;
    if (allPaused) {
      return {
        ...s,
        label: 'Resume',
        icon: SWAP_GLYPHS['resume-unit'] ?? s.icon,
        tooltip: 'Release the hold and let the unit continue its run',
      };
    }
  }
  return s;
}

export const mockMicroagent: Microagent = {
  generateCommands,
  generateIcon: (ctx: IconContext) => generateIcon(ctx),
};
