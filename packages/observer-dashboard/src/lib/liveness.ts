import { promises as fs } from "fs";
import path from "path";

/**
 * Orchestrator-attachment (liveness) of a run, derived read-only from its
 * `run.lock` file and OS process liveness. This is the signal the observer
 * lacked: a run can be idle because a live orchestrator is between steps, or
 * because its driver died. The journal alone can't tell them apart.
 *
 *  - "live"      — a run.lock exists and its pid is a running process.
 *  - "orphaned"  — a run.lock exists but its pid is dead (driver crashed / gone).
 *  - "none"      — no run.lock (no orchestrator is, or recently was, attached).
 *  - "scheduled" — §15.1: a sleeping forever-run between ticks (its newest
 *                  journal event is an unresolved `sleep` effect). This is a
 *                  first-class idle-HEALTHY state, NOT a dead/orphaned one; it
 *                  takes precedence over the "none" no-lock fallback (AC-83).
 */
export type DriverLiveness = "live" | "orphaned" | "none" | "scheduled";

interface RunLock {
  pid?: number;
  owner?: string;
  acquiredAt?: string;
}

/** True if `pid` refers to a live process. `kill(pid, 0)` never actually signals. */
function isPidAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM => the process exists but is owned by another user → still "alive".
    return (err as NodeJS.ErrnoException)?.code === "EPERM";
  }
}

/**
 * Read `<runDir>/run.lock` and classify the run's driver liveness. Pure read;
 * never throws (returns "none" on any missing/corrupt lock).
 */
export async function getDriverLiveness(runDir: string): Promise<DriverLiveness> {
  try {
    const raw = await fs.readFile(path.join(runDir, "run.lock"), "utf-8");
    const lock = JSON.parse(raw) as RunLock;
    if (typeof lock.pid !== "number") return "orphaned";
    return isPidAlive(lock.pid) ? "live" : "orphaned";
  } catch {
    return "none";
  }
}

/**
 * UX-R3 wave 3 (in-progress indication) — layer journal-activity freshness on
 * top of the lock verdict so genuinely-active runs are detected even when no
 * `run.lock` exists.
 *
 * WHY THIS EXISTS (disk-confirmed, 2026-07-06): across 308 real run dirs in all
 * watched sources, ZERO carry a `run.lock` — babysitter 6.0.2 in this
 * environment never writes one. `getDriverLiveness` therefore always returns
 * "none" for in-progress runs, so `assignColumn` classifies every non-terminal
 * run as Orphaned and the WORKING column is STRUCTURALLY always 0, even while
 * driver sessions are actively iterating. The only on-disk signal that reliably
 * distinguishes a run being actively worked from an abandoned one — and that is
 * present without any lock — is the freshness of its newest JOURNAL entry
 * (each orchestration step appends EFFECT_REQUESTED / EFFECT_RESOLVED, bumping
 * `updatedAt`). Session markers (`~/.a5c/state/<uuid>.md` `active:true`) exist
 * for some sessions but are NOT universal (a claude-code orchestrator run has
 * none), live outside the watched run sources, and can go stale — so journal
 * freshness is the honest primary signal; the lock stays as one possible input.
 *
 * HONESTY CONTRACT: a run is promoted to "live" ONLY when it has REAL evidence
 * of recent work — its newest journal event is within `freshnessMs`. A stale
 * non-terminal run keeps the lock verdict (no lock → "none" → still reads as
 * Stalled/Orphaned), so this never paints a merely-non-terminal run as Working.
 *
 * `freshnessMs` is the SAME window as staleness (OBSERVER_STALE_THRESHOLD_MS /
 * registry `staleThresholdMs`, default 1h): a run is "actively progressing"
 * exactly while it has not yet gone stale. Callers pass `config.staleThresholdMs`
 * so the freshness window is a single, documented, env-overridable constant and
 * there is no daylight between "live" and "!isStale".
 *
 * Pure and deterministic (`now` injectable) for unit testing.
 */
export function deriveLivenessFromActivity(
  lockLiveness: DriverLiveness,
  updatedAt: string | undefined,
  freshnessMs: number,
  now: number = Date.now()
): DriverLiveness {
  // A live lock is definitive — never downgraded by activity age.
  if (lockLiveness === "live") return "live";
  // No live lock: recent journal activity means the run is actively progressing.
  if (updatedAt && freshnessMs > 0) {
    const age = now - new Date(updatedAt).getTime();
    if (Number.isFinite(age) && age >= 0 && age <= freshnessMs) return "live";
  }
  // Otherwise the lock verdict stands: dead lock → "orphaned"; no lock → "none".
  return lockLiveness;
}

// ---------------------------------------------------------------------------
// §15.1 (owner gate 2026-07-06b, model A + org panel) — first-class "scheduled"
// liveness for sleeping forever-runs. A never-ending babysitter run parks
// itself between ticks by REQUESTING a `sleep` effect and NOT resolving it; the
// orchestrator then detaches (no run.lock) until the wake time. Before this,
// such a run read as Orphaned/Stalled — the exact "healthy forever-run misread
// as dead" complaint (live case: wc26 nightly-finalize, newest journal event
// `sleep:2026-07-06T03:00:00.000Z`). These helpers are PURE reads over the
// already-parsed journal (contract §15.1 AC-88: no new write path).
// ---------------------------------------------------------------------------

/**
 * The on-disk sleep-wake token — babysitter encodes the wake time in the sleep
 * effect's `label`/`stepId` as `sleep:<ISO>` (e.g. `sleep:2026-07-06T03:00:00.000Z`).
 * The ISO body may carry digits, `T`, `Z`, `:`, `.`, `-`, `+`.
 */
const SLEEP_WAKE_RE = /sleep:([0-9T:.+Z-]+)/;

/**
 * Parse the wake time (`sleep:<ISO>`) out of a sleep effect's `label` or
 * `stepId`. Returns the raw ISO string when either field carries a parseable
 * token, else null. Pure — no clock read. (§15.1 AC-83.)
 */
export function parseSleepWakeAt(
  label?: string,
  stepId?: string
): string | null {
  for (const field of [label, stepId]) {
    if (!field) continue;
    const m = SLEEP_WAKE_RE.exec(field);
    if (m && Number.isFinite(new Date(m[1]).getTime())) return m[1];
  }
  return null;
}

/** The minimal newest-journal-event shape the sleep detector needs. */
export interface NewestEventSummary {
  /** Journal event type, e.g. "EFFECT_REQUESTED". */
  type?: string;
  /** For an EFFECT_REQUESTED, the effect kind (payload.kind). */
  kind?: string;
}

/**
 * §15.1 AC-83: is the run a sleeping forever-run? True iff its NEWEST journal
 * event is an unresolved `sleep` effect — i.e. the newest event is an
 * `EFFECT_REQUESTED` with `kind === "sleep"` (had it resolved, a later
 * `EFFECT_RESOLVED` would be the newest event instead). Pure.
 */
export function isSleepingScheduled(newest: NewestEventSummary | undefined): boolean {
  return newest?.type === "EFFECT_REQUESTED" && newest.kind === "sleep";
}

/**
 * §15.1 AC-83/AC-86: the ONE liveness verdict a sleeping run resolves to.
 * "scheduled" takes precedence over the "none"/"orphaned" no-live-driver
 * fallback AND over activity-derived "live" (a sleeping run is NOT actively
 * progressing), but a genuinely live lock still wins (an attached orchestrator
 * that happens to be mid-sleep is still live). Pure and deterministic.
 */
export function deriveScheduledLiveness(
  lockLiveness: DriverLiveness,
  newest: NewestEventSummary | undefined
): DriverLiveness | null {
  if (lockLiveness === "live") return null;
  return isSleepingScheduled(newest) ? "scheduled" : null;
}
