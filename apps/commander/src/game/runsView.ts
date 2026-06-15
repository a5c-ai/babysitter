/**
 * Runs-ledger data assembly (SPEC-V4 §V4-6): the run-detail view joins a
 * `SimRunView` registry row with the card's live `SimRunObservationView`
 * journal WHEN the observation describes the same run (a card re-attempt
 * spawns a fresh run; older rows keep their pinned phases but the journal
 * stream belongs to the current run only). Pure.
 */

import type { JournalEvent } from '../contracts/babysitter-run';
import type { SimRunObservationView, SimRunView } from '../backend/mock/simulation';

export interface RunDetailData {
  run: SimRunView;
  /** The journal stream when live (observation matches this run), else []. */
  journal: JournalEvent[];
  /** True when the journal above is the card's CURRENT run journal. */
  journalLive: boolean;
}

export function assembleRunDetail(
  run: SimRunView,
  observation: SimRunObservationView | null,
): RunDetailData {
  const journalLive = observation !== null && observation.runId === run.runId;
  return {
    run,
    journal: journalLive ? observation.journal : [],
    journalLive,
  };
}

/** Short display form of a run id (ledger column). */
export function shortRunId(runId: string): string {
  return runId.length <= 12 ? runId : `${runId.slice(0, 12)}…`;
}

/** Total tokens burned by a run (ledger tokens column). */
export function runTokensTotal(run: SimRunView): number {
  const t = run.tokens;
  return t.inputTokens + t.outputTokens + t.thinkingTokens;
}
