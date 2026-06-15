/**
 * Mirrored babysitter run-observation contracts (SPEC-V2 §V2-5).
 *
 * Faithful mirror of the babysitter SDK run shapes
 * (`packages/sdk/src/runtime/` + `storage/` in this repo): the append-only
 * journal event envelope, the journal event-type union, the observed run
 * state derived from the journal head, effect statuses, and the
 * `pendingEffectsByKind` record the process-flow inspector renders.
 *
 * UI-only metadata (phase-chip styling, pipeline layout) stays OUT of these
 * mirrored types.
 */

// ---------------------------------------------------------------------------
// Journal events
// ---------------------------------------------------------------------------

export const JOURNAL_EVENT_TYPES = [
  'RUN_CREATED',
  'EFFECT_REQUESTED',
  'EFFECT_RESOLVED',
  'EFFECT_CANCELLED',
  'RUN_COMPLETED',
  'RUN_HALTED',
  'RUN_FAILED',
  'PROCESS_RUNTIME_ERROR',
] as const;
export type JournalEventType = (typeof JOURNAL_EVENT_TYPES)[number];

/** One append-only journal record (`journal/<seq>.<ulid>.json`). */
export interface JournalEvent {
  /** 1-based monotonic sequence number. */
  seq: number;
  /** Sortable unique id of the journal file. */
  ulid: string;
  type: JournalEventType;
  /** Wall-clock time the event was appended (epoch ms in the mirror). */
  recordedAt: number;
  /** Event-type-specific payload. */
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Run / effect observation
// ---------------------------------------------------------------------------

/** Summary run state derived from the journal. */
export type ObservedRunState = 'created' | 'waiting' | 'completed' | 'halted' | 'failed';

/** Lifecycle status of a single effect. */
export type EffectStatus = 'requested' | 'resolved_ok' | 'resolved_error' | 'cancelled';

/** Built-in effect kinds the orchestrator dispatches. */
export const EFFECT_KINDS = [
  'node',
  'breakpoint',
  'orchestrator_task',
  'sleep',
  'subprocess',
  'agent',
  'shell',
  'skill',
] as const;
export type EffectKind = (typeof EFFECT_KINDS)[number];

/** Count of currently-pending effects per kind (state-cache shape). */
export type PendingEffectsByKind = Record<string, number>;
