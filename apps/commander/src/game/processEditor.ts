/**
 * Process-template editor rules (SPEC-V4 §V4-6): rename / add / remove /
 * reorder phases of a per-taskKind pipeline template, with the ≥2-phase
 * floor enforced via an in-character cogitator error. Pure draft helpers —
 * saving goes through `orders.updateProcessTemplate` (sim verb, journaled,
 * `process_updated` event, revision bump).
 */

export const MIN_TEMPLATE_PHASES = 2;

/** In-character rejection for the phase floor (§V4-6 "≥2 phases enforced"). */
export const PHASE_FLOOR_ERROR =
  'The cogitator refuses the amendment — a rite requires at least two phases.';

/** In-character rejection when a phase label is blank on save. */
export const BLANK_PHASE_ERROR =
  'The cogitator cannot inscribe an empty phase — name every step of the rite.';

/** §V4-6 "affects the NEXT run created" — surfaced as a note in the editor. */
export const FUTURE_RUNS_NOTE =
  'Amendments bind future runs only — rites already underway keep their pinned revision.';

export interface RemovePhaseResult {
  ok: boolean;
  phases: string[];
  error: string | null;
}

export function renamePhase(phases: readonly string[], index: number, label: string): string[] {
  return phases.map((phase, i) => (i === index ? label : phase));
}

/** Append a new phase with a unique default label. */
export function addPhase(phases: readonly string[]): string[] {
  let n = 1;
  let label = 'new-phase';
  while (phases.includes(label)) {
    n += 1;
    label = `new-phase-${n}`;
  }
  return [...phases, label];
}

/** Remove a phase; refuses (in character) below the §V4-6 floor of 2. */
export function removePhase(phases: readonly string[], index: number): RemovePhaseResult {
  if (phases.length <= MIN_TEMPLATE_PHASES) {
    return { ok: false, phases: [...phases], error: PHASE_FLOOR_ERROR };
  }
  return { ok: true, phases: phases.filter((_, i) => i !== index), error: null };
}

/** Move a phase up (-1) or down (+1); out-of-range moves are identity. */
export function movePhase(phases: readonly string[], index: number, delta: -1 | 1): string[] {
  const target = index + delta;
  if (index < 0 || index >= phases.length || target < 0 || target >= phases.length) {
    return [...phases];
  }
  const next = [...phases];
  const tmp = next[index]!;
  next[index] = next[target]!;
  next[target] = tmp;
  return next;
}

/** A draft is saveable when it clears the floor and every label is non-blank. */
export function phasesValid(phases: readonly string[]): boolean {
  return phases.length >= MIN_TEMPLATE_PHASES && phases.every((p) => p.trim().length > 0);
}

/** The save-blocking error for an invalid draft (null when saveable). */
export function draftError(phases: readonly string[]): string | null {
  if (phases.length < MIN_TEMPLATE_PHASES) return PHASE_FLOOR_ERROR;
  if (phases.some((p) => p.trim().length === 0)) return BLANK_PHASE_ERROR;
  return null;
}
