/**
 * Rule-based mock command generation (SPEC §8, SPEC-V2 §V2-2, SPEC-V3 §V3-7).
 *
 * The command card adapts to the SPECIFIC context: board column, task kind,
 * run stage, inquiry-pending flag, workspace dirt, yolo/merged state and the
 * roles of attending agents (all carried on CommandContext.cards).
 *
 *   - empty selection → global set: Commission Task / Jump to Alert /
 *     Pause Sim|Resume Sim (§V3-7).
 *   - selected CARD → column-aware set (§V3-7): backlog → Start Work /
 *     Set Yolo / Prioritize / Commission Task; do → kind-specific verbs
 *     (§V2-2) over the working staples (Steer… / Pause / Inspect / Abort —
 *     Abort is never dropped); ai-review → Inspect Review / Expedite / Abort;
 *     human-review → Open Review / Approve All / Request Changes; approved →
 *     Hold Merge / Force Rebase / Inspect; merged → Inspect only.
 *   - selected AGENT(s) → working staples layered with the kind set of the
 *     attended card; a pure awaiting-approval selection gets Approve / Deny /
 *     Inspect.
 *   - mixed/ambiguous selections intersect by command id and fall back to the
 *     selection-scoped staples. Always ≤12 commands (3x4 grid).
 *
 * Command glyphs are tiny procedural engraved-brass SVGs (paths only — no
 * <line>/<polyline>; the e2e suite counts those as link-layer shapes), one
 * DISTINCT glyph per command id.
 */

import type {
  BoardColumn,
  CardContextSummary,
  CommandContext,
  CommandIntent,
  CommandSpec,
  IconContext,
  IconSpec,
  InquiryOptionLike,
  Microagent,
} from '../types';
import { glyph } from './glyphs';
import { generateIcon } from './iconGen';
import { generateOptionIcon } from './optionIconGen';

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

/** One DISTINCT engraved-brass glyph per command id (unit-tested sweep). */
export const GLYPHS: Record<string, IconSpec> = {
  // --- staples ---------------------------------------------------------------
  steer: glyph('<path d="M4 6 L9 10 L4 14 M10 6 L15 10 L10 14"/>'),
  'pause-unit': glyph('<circle cx="10" cy="10" r="7"/><path d="M8 7 V13 M12 7 V13"/>'),
  inspect: glyph('<circle cx="9" cy="9" r="5"/><path d="M13 13 L17 17"/>'),
  abort: glyph('<circle cx="10" cy="10" r="7"/><path d="M6.5 6.5 L13.5 13.5"/>'),
  approve: glyph('<path d="M4 10.5 L8.5 15 L16 5"/>'),
  deny: glyph('<path d="M5 5 L15 15 M15 5 L5 15"/>'),
  // --- global ------------------------------------------------------------------
  'commission-task': glyph('<rect x="3.5" y="3.5" width="13" height="13" rx="2.5"/><path d="M10 6.5 V13.5 M6.5 10 H13.5"/>'),
  'jump-to-alert': glyph('<circle cx="10" cy="10" r="6.5"/><circle cx="10" cy="10" r="1.2"/><path d="M10 3.5 V6 M10 14 V16.5 M3.5 10 H6 M14 10 H16.5"/>'),
  'toggle-sim': glyph('<path d="M7 4 V16 M13 4 V16"/>'),
  // --- backlog (§V3-7) -----------------------------------------------------------
  'start-work': glyph('<path d="M6 4 L15 10 L6 16 Z"/><path d="M3.5 4 V16"/>'),
  'set-yolo': glyph('<circle cx="10" cy="10" r="7.5"/><path d="M11.5 4.5 L7 10.5 H10 L8.5 15.5 L13 9.5 H10 Z"/>'),
  prioritize: glyph('<path d="M10 16 V4 M5 9 L10 4 L15 9"/>'),
  // --- ai-review --------------------------------------------------------------
  'inspect-review': glyph('<path d="M5 3.5 H13 L15.5 6 V12"/><circle cx="9" cy="11.5" r="3.6"/><path d="M11.8 14.3 L15 17.5"/>'),
  expedite: glyph('<path d="M5 11 L10 5.5 L15 11 M5 16 L10 10.5 L15 16"/>'),
  // --- human-review (§V3-4) ------------------------------------------------------
  'open-review': glyph('<path d="M10 5 Q6.5 3 3 4.5 V15.5 Q6.5 14 10 16 Q13.5 14 17 15.5 V4.5 Q13.5 3 10 5 Z M10 5 V16"/>'),
  'approve-all': glyph('<path d="M3 10.5 L6.5 14 L12 6.5 M8.5 11 L11.5 14 L17 6.5"/>'),
  'request-changes': glyph('<path d="M14 5 a5.5 5.5 0 0 1 0 10 H6"/><path d="M8.5 12 L5.5 15 L8.5 18"/><path d="M5 5 H10"/>'),
  // --- release rail (§V4-1) ------------------------------------------------------
  // Revert: counter-arrow seal — a wax ring with a counterclockwise return arrow.
  'revert-card': glyph('<circle cx="10" cy="10" r="7.5"/><path d="M13.5 7.5 H8.4 a2.6 2.6 0 0 0 0 5.2 H12"/><path d="M10 5 L7.5 7.5 L10 10"/>'),
  // Release: the brass lever thrown, with a launch arc.
  release: glyph('<path d="M4 16.5 H16"/><path d="M10 16.5 V10.5"/><path d="M10 10.5 L14.2 5.2"/><circle cx="15.2" cy="4" r="1.7"/><path d="M4.5 12.5 a5.5 5.5 0 0 1 4 -4.6"/>'),
  // Rollback: crown-return — the production crown handed back down.
  'rollback-prod': glyph('<path d="M5 8.5 L4.5 4 L7.3 6.4 L10 2.8 L12.7 6.4 L15.5 4 L15 8.5 Z"/><path d="M14.5 14 a4.5 4.5 0 1 1 -1.3 -3.2"/><path d="M15 8.6 L14.5 11.4 L11.7 10.9"/>'),
  // Terminal: cogitator slate with a prompt chevron and input bar.
  'open-terminal': glyph('<rect x="3" y="4" width="14" height="12" rx="1.6"/><path d="M5.8 8 L8.8 10.4 L5.8 12.8"/><path d="M10.4 13.2 H14.2"/>'),
  // --- approved ---------------------------------------------------------------
  'hold-merge': glyph('<path d="M6 3.5 V9 a4 4 0 0 0 4 4 a4 4 0 0 1 4 4"/><path d="M3.5 7 H8.5 M11.5 14 H16.5"/>'),
  'force-rebase': glyph('<circle cx="5.5" cy="5" r="1.8"/><circle cx="5.5" cy="15" r="1.8"/><path d="M5.5 7 V13 M7.5 5 H12 a3 3 0 0 1 3 3 V11 M12.5 9 L15 11.5 L17.5 9"/>'),
  // --- review kind (§V2-2) --------------------------------------------------------
  'approve-review': glyph('<circle cx="10" cy="8.5" r="5"/><path d="M7.8 8.5 L9.6 10.3 L12.5 6.8"/><path d="M7.5 13 L6 17 M12.5 13 L14 17"/>'),
  'review-request-changes': glyph('<rect x="3.5" y="4" width="13" height="10" rx="2"/><path d="M7 17.5 L9 14"/><path d="M6.5 7.5 H13.5 M6.5 10.5 H10.5"/>'),
  'add-comment': glyph('<path d="M3.5 4.5 H16.5 V13 H9 L5.5 16.5 V13 H3.5 Z"/><path d="M10 6.5 V11 M7.8 8.8 H12.2"/>'),
  'open-diff': glyph('<rect x="3" y="3.5" width="6" height="13" rx="1.5"/><rect x="11" y="3.5" width="6" height="13" rx="1.5"/><path d="M6 7 V10 M4.5 8.5 H7.5 M12.5 11.5 H15.5"/>'),
  // --- fix kind ------------------------------------------------------------------
  'run-tests': glyph('<path d="M8 3 H12 M8.7 3 V8 L5 14.5 a2 2 0 0 0 1.8 2.8 H13.2 a2 2 0 0 0 1.8 -2.8 L11.3 8 V3"/><path d="M7 12.5 H13"/>'),
  'root-cause': glyph('<circle cx="10" cy="8" r="5"/><circle cx="10" cy="8" r="1.4"/><path d="M10 13 V17 M7 17 Q10 14.5 13 17"/>'),
  'apply-patch': glyph('<rect x="3.5" y="5" width="13" height="10" rx="2"/><path d="M10 5 V15 M7.5 8 H12.5 M7.5 12 H12.5"/>'),
  rollback: glyph('<path d="M5 6.5 a6 6 0 1 1 -1 6.5 M5 6.5 L4.5 2.8 M5 6.5 L8.6 5.6"/>'),
  // --- root-cause-analysis kind -----------------------------------------------------
  hypothesize: glyph('<path d="M6.5 8 a3.5 4 0 1 1 7 0 Q13.5 10.5 10 12 V13.5"/><path d="M8.5 16 H11.5"/>'),
  bisect: glyph('<path d="M10 3 L17 10 L10 17 L3 10 Z M10 3 V17"/>'),
  instrument: glyph('<path d="M3.5 14 a6.5 6.5 0 0 1 13 0"/><path d="M10 14 L13.5 9.5"/><circle cx="10" cy="14" r="1.3"/>'),
  conclude: glyph('<path d="M5 17 V3.5 M5 4 H15 L12 7.5 L15 11 H5"/>'),
  // --- polish kind --------------------------------------------------------------
  'capture-plates': glyph('<rect x="3" y="6" width="14" height="10" rx="2"/><path d="M7 6 L8.5 3.5 H11.5 L13 6"/><circle cx="10" cy="11" r="2.8"/>'),
  score: glyph('<path d="M10 3 L12 7.8 L17 8.2 L13.2 11.5 L14.5 16.5 L10 13.8 L5.5 16.5 L6.8 11.5 L3 8.2 L8 7.8 Z"/>'),
  'apply-findings': glyph('<rect x="4.5" y="4" width="11" height="13" rx="2"/><path d="M8 4 V2.5 H12 V4"/><path d="M7 10.5 L9.2 12.7 L13 7.8"/>'),
  // --- implement kind ----------------------------------------------------------
  checkpoint: glyph('<path d="M6 17 V3.5 M6 4 H14.5 V10.5 H6"/><circle cx="10.5" cy="7.2" r="1.2"/>'),
  // --- test-coverage kind -----------------------------------------------------------
  'run-suite': glyph('<path d="M6.5 3.5 H9.5 M8 3.5 V7 L5 12.5 a1.8 1.8 0 0 0 1.6 2.6 H10"/><path d="M11.5 6 H14.5 M13 6 V9 L16 14.5 a1.8 1.8 0 0 1 -1.6 2.6 H10"/>'),
  'coverage-report': glyph('<path d="M3.5 16.5 H16.5"/><path d="M5.5 16 V10 M9.5 16 V5 M13.5 16 V8"/>'),
  'add-cases': glyph('<path d="M10 3 L16.5 5.5 V10 Q16.5 14.8 10 17.5 Q3.5 14.8 3.5 10 V5.5 Z"/><path d="M10 7 V13 M7 10 H13"/>'),
  // --- docs kind ------------------------------------------------------------------
  preview: glyph('<path d="M2.5 10 Q10 3 17.5 10 Q10 17 2.5 10 Z"/><circle cx="10" cy="10" r="2.4"/>'),
  'spell-gauge': glyph('<path d="M3.5 13.5 a6.5 6.5 0 0 1 13 0"/><path d="M6 13.5 L8 11.5 M10 13.5 L11.8 9"/><path d="M5 17 Q7.5 15.5 10 17 Q12.5 18.5 15 17"/>'),
  'publish-draft': glyph('<path d="M3 10 L17 3.5 L13 16.5 L9.5 12 Z M9.5 12 L17 3.5"/>'),
  // --- deploy kind ------------------------------------------------------------------
  'dry-run': glyph('<path d="M6 4 L15 10 L6 16 Z" stroke-dasharray="2.4 1.8"/>'),
  'ship-it': glyph('<path d="M3.5 12 H16.5 L14.5 16 H5.5 Z M10 12 V4 M10 4 L14.5 8.5 H10"/>'),
  'hold-the-line': glyph('<path d="M10 3 L16 5.5 V10 Q16 15 10 17.5 Q4 15 4 10 V5.5 Z"/><path d="M6.5 10 H13.5"/>'),
  // --- research kind --------------------------------------------------------------
  summarize: glyph('<path d="M4 5 H16 M4 9 H13 M4 13 H10 M4 17 H7"/>'),
  'cite-sources': glyph('<path d="M5 6 Q3.5 8 4 11 H7.5 V7.5 H5.5 Q5.3 6.6 6 6 Z M12 6 Q10.5 8 11 11 H14.5 V7.5 H12.5 Q12.3 6.6 13 6 Z"/><path d="M4.5 15 H15.5"/>'),
  'archive-to-brain': glyph('<rect x="3.5" y="4" width="13" height="4" rx="1"/><path d="M5 8 V15 a1.5 1.5 0 0 0 1.5 1.5 H13.5 a1.5 1.5 0 0 0 1.5 -1.5 V8"/><path d="M10 9.5 V14 M8 12 L10 14 L12 12"/>'),
  // --- migrate kind -----------------------------------------------------------------
  'plan-steps': glyph('<path d="M3.5 16.5 H8 V12.5 H12 V8.5 H16.5 V4.5"/><circle cx="5.5" cy="14" r="0.9"/><circle cx="9.8" cy="10.2" r="0.9"/><circle cx="14.2" cy="6.4" r="0.9"/>'),
  'execute-step': glyph('<path d="M3.5 15.5 H9 V10.5 H14.5"/><path d="M12 8 L15 10.5 L12 13"/>'),
  'verify-parity': glyph('<path d="M10 3.5 V16.5 M4 6 H16"/><path d="M4 6 L2.5 10.5 a2.5 2 0 0 0 5 0 Z M16 6 L14.5 10.5 a2.5 2 0 0 0 5 0 Z"/>'),
};

/** Presentation swaps for toggled commands (resolved in generateCommands). */
const SWAP_GLYPHS: Record<string, IconSpec> = {
  'resume-unit': glyph('<circle cx="10" cy="10" r="7"/><path d="M8.2 7 L13.5 10 L8.2 13 Z"/>'),
  'resume-sim': glyph('<path d="M6 4 L16 10 L6 16 Z"/>'),
  'unset-yolo': glyph('<circle cx="10" cy="10" r="7.5"/><path d="M11.5 4.5 L7 10.5 H10 L8.5 15.5 L13 9.5 H10 Z"/><path d="M4.5 15.5 L15.5 4.5"/>'),
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

/** Steering-verb shorthand: kind commands relay a prompt to the attending agents (§V2-2). */
function act(id: string, label: string, prompt: string, tooltip: string, severity?: 'danger' | 'urgent'): CommandDef {
  return {
    id,
    label,
    intent: { kind: 'task-action', action: id, prompt },
    tooltip,
    ...(severity !== undefined ? { severity } : {}),
  };
}

// ---------------------------------------------------------------------------
// Global set (§V3-7: empty selection)
// ---------------------------------------------------------------------------

const GLOBAL_DEFS: CommandDef[] = [
  {
    id: 'commission-task',
    label: 'Commission Task',
    intent: { kind: 'commission-task' },
    tooltip: 'Commission a new task into the backlog (the Foundry, §V2-6)',
  },
  {
    id: 'jump-to-alert',
    label: 'Jump to Alert',
    intent: { kind: 'jump-to-alert' },
    tooltip: 'Center the camera on the most recent pending inquiry',
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

// ---------------------------------------------------------------------------
// Working staples (§V2-2: layered under the kind sets; Abort is never dropped)
// ---------------------------------------------------------------------------

const WORKING_DEFS: CommandDef[] = [
  {
    id: 'steer',
    label: 'Steer…',
    intent: { kind: 'steer' },
    tooltip: 'Send a steering prompt to the attending agents',
  },
  {
    id: 'pause-unit',
    label: 'Pause', // flips to Resume when every attending agent is held
    intent: { kind: 'pause-unit' },
    tooltip: 'Hold the attending agents — their runs freeze until resumed',
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
    tooltip: 'Abort the active run — the card bounces back to the backlog',
    severity: 'danger',
  },
];

const APPROVAL_DEFS: CommandDef[] = [
  {
    id: 'approve',
    label: 'Approve',
    intent: { kind: 'approve' },
    tooltip: 'Allow the gated action and unblock the agent',
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

/** Selection-scoped staples for mixed selections whose intersection is empty. */
const MIXED_DEFS: CommandDef[] = [
  {
    id: 'inspect',
    label: 'Inspect',
    intent: { kind: 'inspect' },
    tooltip: 'Open the inspector for the first selected entity',
  },
  {
    id: 'abort',
    label: 'Abort',
    intent: { kind: 'abort' },
    tooltip: 'Abort the active runs in the selection',
    severity: 'danger',
  },
];

// ---------------------------------------------------------------------------
// Kind-specific command sets (SPEC-V2 §V2-2 — all ten kinds)
// ---------------------------------------------------------------------------

const KIND_DEFS: Record<string, CommandDef[]> = {
  review: [
    act('approve-review', 'Approve Review', 'Approve the review and record the verdict', 'Approve the review under way'),
    act('review-request-changes', 'Request Changes', 'Request changes on the reviewed work', 'Send the work back with change requests', 'danger'),
    act('add-comment', 'Add Comment', 'Add a review comment to the open thread', 'Annotate the review thread'),
    {
      id: 'open-diff',
      label: 'Open Diff',
      intent: { kind: 'open-diff' },
      tooltip: 'Jump to the Workspace tab diff plates (§V2-7)',
    },
  ],
  fix: [
    act('run-tests', 'Run Tests', 'Run the test suite against the patch (vitest)', 'Execute the test suite now'),
    act('root-cause', 'Root-Cause', 'Trace the defect to its root cause before patching', 'Drive the diagnosis to the root cause'),
    act('apply-patch', 'Apply Patch', 'Apply the prepared patch to the workspace', 'Apply the prepared patch'),
    act('rollback', 'Rollback', 'Roll the workspace back to the last good state', 'Revert to the last good state', 'danger'),
  ],
  'root-cause-analysis': [
    act('hypothesize', 'Hypothesize', 'Form the next failure hypothesis', 'Record a fresh failure hypothesis'),
    act('bisect', 'Bisect', 'Bisect the history to isolate the breaking change', 'Binary-search the breaking change'),
    act('instrument', 'Instrument', 'Add instrumentation around the suspect path', 'Wire probes around the suspect path'),
    act('conclude', 'Conclude', 'Conclude the analysis and write up the finding', 'Close the analysis with a finding'),
  ],
  polish: [
    act('capture-plates', 'Capture Plates', 'Capture fresh screenshot plates of the surfaces', 'Capture screenshot plates'),
    act('score', 'Score', 'Score the current polish pass against the rubric', 'Score the polish pass'),
    act('apply-findings', 'Apply Findings', 'Apply the scored findings to the surfaces', 'Apply the scored findings'),
  ],
  implement: [
    act('run-tests', 'Run Tests', 'Run the test suite against the implementation (vitest)', 'Execute the test suite now'),
    {
      id: 'open-diff',
      label: 'Open Diff',
      intent: { kind: 'open-diff' },
      tooltip: 'Jump to the Workspace tab diff plates (§V2-7)',
    },
    act('checkpoint', 'Checkpoint', 'Checkpoint the working state before continuing', 'Snapshot the working state'),
  ],
  'test-coverage': [
    act('run-suite', 'Run Suite', 'Run the full coverage suite', 'Execute the full suite'),
    act('coverage-report', 'Coverage Report', 'Produce a coverage report for the touched modules', 'Report coverage on touched modules'),
    act('add-cases', 'Add Cases', 'Add test cases for the uncovered branches', 'Author cases for uncovered branches'),
  ],
  docs: [
    act('preview', 'Preview', 'Render a preview of the drafted pages', 'Preview the drafted pages'),
    act('spell-gauge', 'Spell-Gauge', 'Run the spell-gauge over the prose', 'Measure the prose with the spell-gauge'),
    act('publish-draft', 'Publish Draft', 'Publish the current draft for review', 'Publish the draft'),
  ],
  deploy: [
    act('dry-run', 'Dry Run', 'Execute a deployment dry run', 'Rehearse the deployment'),
    act('ship-it', 'Ship It', 'Ship the release into the cold void', 'Execute the deployment for real', 'danger'),
    act('hold-the-line', 'Hold the Line', 'Hold the deployment — keep the current release pinned', 'Freeze the rollout where it stands'),
  ],
  research: [
    act('summarize', 'Summarize', 'Summarize the findings so far', 'Condense the findings'),
    act('cite-sources', 'Cite Sources', 'Attach citations to every claim', 'Pin citations to the claims'),
    act('archive-to-brain', 'Archive to Brain', 'Archive the findings to the company brain (§V2-3)', 'Write the findings back to memory'),
  ],
  migrate: [
    act('plan-steps', 'Plan Steps', 'Plan the migration steps end to end', 'Lay out the migration steps'),
    act('execute-step', 'Execute Step', 'Execute the next migration step', 'Run the next migration step'),
    act('verify-parity', 'Verify Parity', 'Verify data parity between old and new paths', 'Check parity across both paths'),
  ],
};

// ---------------------------------------------------------------------------
// Column-aware card sets (SPEC-V3 §V3-7)
// ---------------------------------------------------------------------------

const BACKLOG_DEFS: CommandDef[] = [
  {
    id: 'start-work',
    label: 'Start Work',
    intent: { kind: 'move-card', column: 'do' },
    tooltip: 'Move the card to DO — a worker agent spawns and begins (§V3-2)',
  },
  {
    id: 'set-yolo',
    label: 'Set Yolo', // flips to Unset Yolo when every selected card is yolo
    intent: { kind: 'set-yolo', on: true },
    tooltip: 'Yolo flag: passing AI review auto-approves, skipping human review',
  },
  {
    id: 'prioritize',
    label: 'Prioritize',
    intent: { kind: 'prioritize' },
    tooltip: 'Bump the card to the top of the backlog lane',
  },
  {
    id: 'commission-task',
    label: 'Commission Task',
    intent: { kind: 'commission-task' },
    tooltip: 'Commission a new task into the backlog (the Foundry, §V2-6)',
  },
];

const AI_REVIEW_DEFS: CommandDef[] = [
  {
    id: 'inspect-review',
    label: 'Inspect Review',
    intent: { kind: 'inspect' },
    tooltip: 'Open the attending reviewer’s transcript inspector',
  },
  {
    id: 'expedite',
    label: 'Expedite',
    intent: { kind: 'task-action', action: 'expedite', prompt: 'Expedite the review verdict — converge now' },
    tooltip: 'Press the reviewers toward an immediate verdict',
    enabled: (ctx) => ctx.cards.some((c) => c.agentRoles.includes('reviewer')),
  },
  {
    id: 'abort',
    label: 'Abort',
    intent: { kind: 'abort' },
    tooltip: 'Abort the review — the card bounces back to the backlog',
    severity: 'danger',
  },
];

const HUMAN_REVIEW_DEFS: CommandDef[] = [
  {
    id: 'open-review',
    label: 'Open Review',
    intent: { kind: 'open-review' },
    tooltip: 'Open the human-review side panel (§V3-4)',
  },
  {
    id: 'approve-all',
    label: 'Approve All',
    intent: { kind: 'move-card', column: 'approved' },
    tooltip: 'Approve the change set — the card moves to APPROVED',
    severity: 'urgent',
  },
  {
    id: 'request-changes',
    label: 'Request Changes',
    intent: { kind: 'move-card', column: 'do', danger: true },
    tooltip: 'Send the card back to DO with feedback',
    severity: 'danger',
  },
];

const APPROVED_DEFS: CommandDef[] = [
  {
    id: 'hold-merge',
    label: 'Hold Merge',
    intent: { kind: 'hold-merge' },
    tooltip: 'Hold (or release) the integration agent mid-merge',
    enabled: (ctx) => ctx.cards.some((c) => c.agentRoles.includes('integration')),
  },
  {
    id: 'force-rebase',
    label: 'Force Rebase',
    intent: { kind: 'task-action', action: 'force-rebase', prompt: 'Force a rebase onto the base branch before merging' },
    tooltip: 'Order an immediate rebase onto the base branch',
    enabled: (ctx) => ctx.cards.some((c) => c.agentRoles.includes('integration')),
  },
  {
    id: 'inspect',
    label: 'Inspect',
    intent: { kind: 'inspect' },
    tooltip: 'Open the integration agent’s transcript inspector',
  },
];

const MERGED_DEFS: CommandDef[] = [
  {
    id: 'inspect',
    label: 'Inspect',
    intent: { kind: 'inspect' },
    tooltip: 'Inspect the merged card’s record',
  },
];

/** SPEC-V4 §V4-1: MERGED lane (staging) — Revert / Release / Inspect / Terminal. */
const MERGED_LANE_DEFS: CommandDef[] = [
  {
    id: 'revert-card',
    label: 'Revert',
    intent: { kind: 'revert-card' },
    tooltip: 'Revert the change from staging — the card returns to DO and a fresh worker iterates',
    severity: 'danger',
  },
  {
    id: 'release',
    label: 'Release',
    intent: { kind: 'release' },
    tooltip: 'Throw the release lever — ALL merged cards ship to production as one train (rel-NN)',
  },
  {
    id: 'inspect',
    label: 'Inspect',
    intent: { kind: 'inspect' },
    tooltip: 'Inspect the merged card’s record',
  },
  {
    id: 'open-terminal',
    label: 'Terminal',
    intent: { kind: 'open-terminal' },
    tooltip: 'Open a cogitator terminal bound to the card’s workspace (§V4-7)',
  },
];

/** SPEC-V4 §V4-1: IN PRODUCTION lane — Rollback / Inspect / Terminal. */
const IN_PRODUCTION_DEFS: CommandDef[] = [
  {
    id: 'rollback-prod',
    label: 'Rollback',
    intent: { kind: 'rollback-card' },
    tooltip: 'Withdraw the change from production back to staging (MERGED)',
    severity: 'danger',
  },
  {
    id: 'inspect',
    label: 'Inspect',
    intent: { kind: 'inspect' },
    tooltip: 'Inspect the production card’s record',
  },
  {
    id: 'open-terminal',
    label: 'Terminal',
    intent: { kind: 'open-terminal' },
    tooltip: 'Open a cogitator terminal bound to the card’s workspace (§V4-7)',
  },
];

/** Unit states that take the working command set (SPEC §3 / §V3-2). */
const WORKING_STATES = new Set(['dispatching', 'thinking', 'tool_running', 'blocked']);

/** Kind layer for cards in DO: kind verbs above the staples, deduped by id. */
function doColumnDefs(cards: readonly CardContextSummary[]): CommandDef[] {
  const kinds = [...new Set(cards.map((c) => c.taskKind))];
  let kindLayer: CommandDef[] = [];
  if (kinds.length === 1) {
    kindLayer = KIND_DEFS[kinds[0]!] ?? [];
  } else if (kinds.length > 1) {
    // Intersection of the kind sets by command id (usually empty).
    const sets = kinds.map((kind) => KIND_DEFS[kind] ?? []);
    const first = sets[0] ?? [];
    kindLayer = first.filter((def) => sets.every((set) => set.some((d) => d.id === def.id)));
  }
  const merged = [...kindLayer];
  for (const staple of WORKING_DEFS) {
    if (!merged.some((d) => d.id === staple.id)) merged.push(staple);
  }
  // ≤12 with Abort never dropped: trim from the END of the kind layer if the
  // grid overflows, keeping all four staples.
  if (merged.length > COMMAND_HOTKEYS.length) {
    const staples = merged.filter((d) => WORKING_DEFS.some((s) => s.id === d.id));
    const layer = merged.filter((d) => !WORKING_DEFS.some((s) => s.id === d.id));
    return [...layer.slice(0, COMMAND_HOTKEYS.length - staples.length), ...staples];
  }
  return merged;
}

function defsForColumn(column: BoardColumn, cards: readonly CardContextSummary[]): CommandDef[] {
  switch (column) {
    case 'backlog':
      return BACKLOG_DEFS;
    case 'do':
      return doColumnDefs(cards);
    case 'ai-review':
      return AI_REVIEW_DEFS;
    case 'human-review':
      return HUMAN_REVIEW_DEFS;
    case 'approved':
      // Legacy guard: a merged-sealed card still parked in APPROVED gets the
      // terminal inspect-only set (V4 normally auto-moves these to MERGED).
      return cards.every((c) => c.merged) ? MERGED_DEFS : APPROVED_DEFS;
    // §V4-1 release rail sets.
    case 'merged':
      return MERGED_LANE_DEFS;
    case 'in-production':
      return IN_PRODUCTION_DEFS;
  }
}

/** Card-selection sets: single column → its set; mixed columns → intersection → staples. */
function cardDefs(cards: readonly CardContextSummary[]): CommandDef[] {
  const columns = [...new Set(cards.map((c) => c.column))];
  if (columns.length === 1) {
    return defsForColumn(columns[0]!, cards);
  }
  const sets = cards.map((c) => defsForColumn(c.column, [c]));
  const first = sets[0] ?? [];
  const intersection = first.filter((def) => sets.every((set) => set.some((d) => d.id === def.id)));
  return intersection.length > 0 ? intersection : MIXED_DEFS;
}

/** Agent-selection sets: approval set, or kind layer + working staples. */
function unitDefs(ctx: CommandContext): CommandDef[] {
  const states = ctx.selection.states;
  if (states.length === 1 && states[0] === 'awaiting_approval') return APPROVAL_DEFS;
  if (states.every((s) => WORKING_STATES.has(s) || s === 'awaiting_approval')) {
    // Working agents (possibly one of them gated): kind layer of the attended
    // card(s) over the staples — Abort never dropped (§V2-2).
    const doCards = ctx.cards.filter((c) => c.column === 'do');
    if (doCards.length > 0) return doColumnDefs(doCards);
    return WORKING_DEFS;
  }
  return MIXED_DEFS;
}

export function generateCommands(ctx: CommandContext): CommandSpec[] {
  let defs: CommandDef[];

  if (ctx.selection.count === 0) {
    defs = GLOBAL_DEFS;
  } else if (ctx.selection.kinds.length === 1 && ctx.selection.kinds[0] === 'task' && ctx.cards.length > 0) {
    defs = cardDefs(ctx.cards);
  } else if (ctx.selection.kinds.length === 1 && ctx.selection.kinds[0] === 'unit') {
    defs = unitDefs(ctx);
  } else {
    // Mixed kinds (card + agent): selection-scoped staples.
    defs = MIXED_DEFS;
  }

  // Positional hotkeys: cell i ⇒ COMMAND_HOTKEYS[i] (SPEC §5 grid mapping).
  const specs = defs
    .slice(0, COMMAND_HOTKEYS.length)
    .map((def, index) => spec(def, ctx, COMMAND_HOTKEYS[index]));
  return specs.map((s) => applyDynamicPresentation(s, ctx));
}

/** Toggled commands swap label/icon/tooltip/intent with the live context. */
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
      ctx.selection.pausedUnits > 0 && ctx.selection.pausedUnits === ctx.selection.count;
    if (allPaused) {
      return {
        ...s,
        label: 'Resume',
        icon: SWAP_GLYPHS['resume-unit'] ?? s.icon,
        tooltip: 'Release the hold and let the agents continue their runs',
      };
    }
  }
  if (s.id === 'set-yolo') {
    const allYolo = ctx.cards.length > 0 && ctx.cards.every((c) => c.yolo);
    if (allYolo) {
      return {
        ...s,
        label: 'Unset Yolo',
        icon: SWAP_GLYPHS['unset-yolo'] ?? s.icon,
        intent: { kind: 'set-yolo', on: false },
        tooltip: 'Clear the yolo flag — AI-review passes go to human review again',
      };
    }
  }
  return s;
}

export const mockMicroagent: Microagent = {
  generateCommands,
  generateIcon: (ctx: IconContext) => generateIcon(ctx),
  generateOptionIcon: (option: InquiryOptionLike) => generateOptionIcon(option),
};
