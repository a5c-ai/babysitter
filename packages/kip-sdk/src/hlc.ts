/**
 * hlc.ts — the Hybrid Logical Clock half of ADR-B4's "in-house HLC module with a fully
 * separate ChainSequencer". This file owns ONLY the `(wall, counter, replicaId)` clock: standard
 * `tick()` (local/send-advance) and `receiveTick()` (receive-advance) semantics per docs/22
 * §2.1 step 3 and docs/70 ADR-B4. The `seq` chain-sequence axis is a SEPARATE, unrelated counter
 * — see chain-sequencer.ts — per ADR-004/B4's explicit "two independent counters sharing no
 * state" decision.
 *
 * Overflow/carry rule (ADR-003, docs/70): on counter overflow within a `wall` ms, carry into
 * `wall+1` and reset counter to 0 — the counter never wraps (wrapping would break the total
 * order).
 */
import type { HlcStamp, ReplicaId } from "./index";

/** uint32 max — the counter carries into `wall+1` rather than wrapping past this (ADR-003). */
export const MAX_COUNTER = 0xffffffff;

/**
 * Local/send-advance: mint the next HLC stamp for an outgoing (locally-authored) event.
 * `now` is injectable for deterministic tests; defaults to the wall clock.
 */
export function tick(current: HlcStamp | undefined, replicaId: ReplicaId, now: number = Date.now()): HlcStamp {
  if (!current) return { wall: now, counter: 0, replicaId };
  if (now > current.wall) return { wall: now, counter: 0, replicaId };
  if (current.counter >= MAX_COUNTER) return { wall: current.wall + 1, counter: 0, replicaId };
  return { wall: current.wall, counter: current.counter + 1, replicaId };
}

/**
 * Receive-advance (docs/22 §2.1 step 3): advance the LOCAL clock past an incoming stamp. This is
 * an AUDIT-only local-clock bump — it never touches the remote fact's own `seq` chain (m7-1) and
 * never mutates the fact itself.
 */
export function receiveTick(
  local: HlcStamp | undefined,
  remote: HlcStamp,
  replicaId: ReplicaId,
  now: number = Date.now(),
): HlcStamp {
  const localWall = local?.wall ?? -Infinity;
  const localCounter = local?.counter ?? 0;
  const wall = Math.max(localWall, remote.wall, now);
  if (wall === localWall && wall === remote.wall) {
    const counter = Math.max(localCounter, remote.counter) + 1;
    if (counter > MAX_COUNTER) return { wall: wall + 1, counter: 0, replicaId };
    return { wall, counter, replicaId };
  }
  if (wall === localWall) {
    const counter = localCounter + 1;
    if (counter > MAX_COUNTER) return { wall: wall + 1, counter: 0, replicaId };
    return { wall, counter, replicaId };
  }
  if (wall === remote.wall) {
    const counter = remote.counter + 1;
    if (counter > MAX_COUNTER) return { wall: wall + 1, counter: 0, replicaId };
    return { wall, counter, replicaId };
  }
  return { wall, counter: 0, replicaId };
}

/** Total order over HLC stamps alone (wall, then counter, then replicaId) — NOT the full `orderKey` (§4b.2), which is M1/proj scope. */
export function compareHlc(a: HlcStamp, b: HlcStamp): -1 | 0 | 1 {
  if (a.wall !== b.wall) return a.wall < b.wall ? -1 : 1;
  if (a.counter !== b.counter) return a.counter < b.counter ? -1 : 1;
  if (a.replicaId !== b.replicaId) return a.replicaId < b.replicaId ? -1 : 1;
  return 0;
}
