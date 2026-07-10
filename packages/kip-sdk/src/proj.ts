/**
 * proj.ts — M1's core mechanism (SPEC.md §3.4, docs/24-synchronization-and-convergence.md §1/§3):
 * the deterministic, set-pure whole-set fold `proj(S)` that materializes `/heads` (here: in-memory
 * `NodeView`/`EdgeView` projections) from the admitted fact SET. Implements the WBS pipeline in
 * dependency order:
 *
 *   T2.1 orderKey (a deterministic ordering over set-resident fields, ending in
 *        publicKeyFingerprint then factCID; NOT a genuine total order over content — see
 *        `compareOrderKey`'s doc comment for why a `factCID` tie is possible and how callers that
 *        need full determinism close it) ->
 *   T2.2 the fold pipeline (sort by orderKey -> group by cell -> upcast -> reduce; a pure,
 *        whole-set function, never a pairwise/binary merge) ->
 *   T2.3 cell reducers (the DEFAULT `lww-hlc` sweep: at each elementary valid-time sub-interval,
 *        the orderKey-max covering assert wins) ->
 *   T2.4 versioned upcasters (M1 scope note below) ->
 *   T2.5 interval geometry (non-overlapping segments; gaps are first-class `unknown`;
 *        existence-gates-properties, no ghost nodes) ->
 *   T2.6 conflict surfacing (`kip:conflict` for non-commutative contradictory `supersede` facts,
 *        never a silent orderKey/hash tiebreak) ->
 *   T2.7 the read surface `getNode`/`getEdge`/typed traversal that `index.ts`'s `KipRepo` calls.
 *
 * T2.4 (versioned upcasters) SCOPE NOTE: SPEC.md §2.2 defines upcasting against a per-tenant
 * ONTOLOGY (`NodeKindDef.version` + declarative upcasters keyed on it). `index.ts`'s `Repo` surface
 * still exposes no ontology/schema-registration method (no `NodeKindDef`/`defineNodeKind`-shaped
 * API), so a real per-kind version comparison remains out of reach — the gap INV-8's own test file
 * documents ("SURFACE GAP", see also this task's `disputes`). What IS implemented: a fact's `v` is
 * not blindly passed through regardless of magnitude — `reduceRawCell` quarantines (a typed
 * `CellSegment{kind:"quarantine"}`, see index.ts) any fact whose `v` exceeds `proj()`'s configured
 * `knownMaxVersion` (default `1`) instead of trusting its `value`, the honest "unknown versions
 * pass through as opaque-quarantined" half of INV-8's never-throw/never-fabricate contract.
 * `KipRepo`'s constructor threads a `knownMaxVersion` option through every `getNode`/`getEdge`/
 * `query` call (index.ts) so this threshold is configurable end-to-end, not just a `proj()`-internal
 * default.
 *
 * T2.3 SCOPE NOTE: `gsetReducer`/`pncounterReducer` (cell-reducers.ts) are real, unit-tested cell
 * reducers, reachable end-to-end via `getNode`/`getEdge`'s `reduceCellByRef`, which dispatches every
 * node-prop/edge-prop cell through a caller-supplied `cellReducers` association
 * (`ProjOptions.cellReducers`, threaded from `KipRepo`'s own constructor option, see index.ts) and
 * falls back to the DEFAULT `lww-hlc` sweep (`reduceRawCell`, still existence-gating/conflict-
 * surfacing/quarantine-aware) when no association names a cell. This is still SHORT of a full
 * per-`NodeKindDef`/`EdgeKindDef` ontology-driven registration surface (the gap inv-3.test.ts's and
 * inv-7.test.ts's own `it.skip` blocks document remains genuinely unimplemented — those frozen
 * tests still cannot SELECT a reducer without a schema-registration API, see disputes) — but
 * `CellReducerAssociations` is a real, minimal, directly end-to-end-testable seam rather than only
 * unit-testable in isolation.
 */
import type {
  CellSegment,
  EdgeKind,
  EdgeView,
  EID,
  Fact,
  FactId,
  HlcOrTime,
  NodeKind,
  NodeView,
  PropCell,
  PropKey,
  PropValue,
  Provenance,
  Target,
  TraversalSpec,
} from "./index";
import { type CellReducerAssociations, reducerFor, resolveCellReducer } from "./cell-reducers";
import { deepSortKeys } from "./canonical-payload";

// ---------------------------------------------------------------------------
// orderKey (T2.1) — a genuine TOTAL order over author-stamped, set-resident fields only.
// Reads ONLY validFrom/hlc/replicaId/publicKeyFingerprint/factCID (SPEC.md §3.4) — NEVER rxFrom,
// commit-order, or wall-clock-at-read (M2-1/C2-1).
// ---------------------------------------------------------------------------

/** `wall * 2^32 + counter` (docs/21 §1's `HlcOrTime` canonicalization, m7-19). */
const HLC_SHIFT = 1n << 32n;

export function canon(v: HlcOrTime): bigint {
  if (typeof v === "number") return BigInt(Math.trunc(v)) * HLC_SHIFT;
  if (typeof v === "string") return BigInt(Date.parse(v)) * HLC_SHIFT;
  return BigInt(Math.trunc(v.wall)) * HLC_SHIFT + BigInt(v.counter);
}

/**
 * The sentinel used ONLY when `decanon` must fabricate a full `HlcStamp` shape for a segment
 * boundary that has a non-zero counter component but no real originating replica to attribute it
 * to (see `decanon`'s doc comment below) — MINOR FIX: previously an unexplained bare `""`. Named
 * and documented here as a KNOWN, DELIBERATE precision-loss placeholder (never fed back into
 * `orderKey`/any trust or authorization decision), not invented data in the "no fallbacks" sense:
 * a segment's `validFrom`/`validTo` boundary is a derived VALUE (a point on the timeline), and this
 * module has no access to which original fact's `HlcOrTime` produced that exact boundary once
 * several facts' breakpoints have been merged/deduped into one sorted `bigint` sweep line.
 */
const DECANON_BOUNDARY_SENTINEL_REPLICA_ID = "";

/** Inverse of `canon` — always yields the PLAIN NUMBER form when `counter === 0` (every fixture
 * in this suite passes `validFrom`/`validTo` as plain numbers, never a full `HlcStamp`), so
 * round-tripping a breakpoint back through `canon`/`decanon` reproduces the exact literal the
 * caller authored. When `counter !== 0` (an input `HlcStamp` with a genuine logical-clock counter
 * contributed the breakpoint), `decanon` MUST still return a well-typed `HlcOrTime`, but the sweep
 * line has already discarded which original fact's `replicaId` that counter came from — there is
 * no sound way to recover it here without threading the originating fact through the whole
 * breakpoint pipeline (a larger refactor, tracked as a known boundary rather than done silently:
 * see `DECANON_BOUNDARY_SENTINEL_REPLICA_ID`'s doc comment). */
export function decanon(v: bigint): HlcOrTime {
  const wall = v / HLC_SHIFT;
  const counter = v % HLC_SHIFT;
  if (counter === 0n) return Number(wall);
  return { wall: Number(wall), counter: Number(counter), replicaId: DECANON_BOUNDARY_SENTINEL_REPLICA_ID };
}

export type OrderKeyTuple = readonly [bigint, bigint, number, string, string, string];

/**
 * Exported (was module-private) so `index.ts`'s `pin()`/`resolvePin()` can compute a
 * `factSetDigest` that is a "merkle root over orderKey" (docs/25-context-enablement-seams.md's
 * `SnapshotRef` doc comment) using the SAME ordering `proj()` itself uses, rather than
 * reimplementing a parallel ordering just for pin's digest. See `compareOrderKey`'s doc comment for
 * why `computeFactSetDigest` additionally appends `compareByContent` before hashing.
 */
export function orderKey(f: Fact): OrderKeyTuple {
  return [canon(f.validFrom), BigInt(Math.trunc(f.hlc.wall)), f.hlc.counter, f.replicaId, f.provenance.publicKeyFingerprint, f.id];
}

/** Deterministic comparison over `OrderKeyTuple`'s components — NOT a genuine total order in the
 * strict sense INV-3 would want: the final component, `factCID`, is the caller-DECLARED `Fact.id`,
 * never verified against a real content hash for externally-supplied facts (well-formed.ts's item-4
 * admission check is a documented LENGTH-ONLY heuristic, see its doc comment). Two admitted facts
 * with DIFFERENT content can therefore legitimately share the same declared `id` and tie on EVERY
 * component here, including this supposedly-final tiebreak. Any caller that needs full determinism
 * over such a tie MUST append a content-based tiebreak afterwards — see `maxByOrderKey`'s use of
 * `compareByContent` for the pattern every real consumer (`maxByOrderKey`, `computeFactSetDigest`
 * in index.ts, `tiedGroupDiffersOn`) already follows. Do not remove those `compareByContent`
 * tiebreaks as "redundant" — see round2-critic-fixes.test.ts and round4-digest-tiebreak-fix.test.ts
 * for the regressions this invariant guards against. */
export function compareOrderKey(a: OrderKeyTuple, b: OrderKeyTuple): -1 | 0 | 1 {
  for (let i = 0; i < a.length; i += 1) {
    const av = a[i];
    const bv = b[i];
    if (typeof av === "bigint" && typeof bv === "bigint") {
      if (av !== bv) return av < bv ? -1 : 1;
    } else if (typeof av === "number" && typeof bv === "number") {
      if (av !== bv) return av < bv ? -1 : 1;
    } else if (av !== bv) {
      return String(av) < String(bv) ? -1 : 1;
    }
  }
  return 0;
}

/** A deterministic, CONTENT-based (never array-position/ingest-order-based) ordering over facts —
 * used ONLY to pick a canonical representative out of a tied-or-collided group, never to decide
 * WHICH fact wins the actual orderKey comparison (that's `compareOrderKey`/`orderKey` above). Two
 * facts that are byte-identical compare equal here (order genuinely doesn't matter, either can be
 * "the" representative); two facts with ANY differing field compare by their full JSON — a pure
 * function of content, so the same representative is chosen regardless of which order the group's
 * members happen to be enumerated in on a given replica.
 *
 * INVARIANT: comparison is over `deepSortKeys(a)`/`deepSortKeys(b)` (canonical-payload.ts's own
 * canonicalization helper, never reimplemented here), NOT raw `JSON.stringify`. Raw `JSON.stringify`
 * is sensitive to a `Fact` object's property INSERTION order, not just its field VALUES — and since
 * `ingest()`'s signature verification canonicalizes via `canonicalPayloadString` (which calls
 * `deepSortKeys`) while raw fact storage does not, an externally-supplied fact's wire-level key order
 * is attacker-controlled and unconstrained by admission. Canonicalizing before stringifying keeps
 * this comparison a pure function of content regardless of key insertion order — see
 * round4-digest-tiebreak-fix.test.ts for the regression this guards against. */
export function compareByContent(a: Fact, b: Fact): -1 | 0 | 1 {
  const as = JSON.stringify(deepSortKeys(a));
  const bs = JSON.stringify(deepSortKeys(b));
  return as < bs ? -1 : as > bs ? 1 : 0;
}

/**
 * `orderKey`'s final tiebreak, `factCID`, is the caller-DECLARED `Fact.id` — sound as a true
 * differentiator for SELF-MINTED facts (index.ts's `mintFact` always derives `id` as the real
 * content hash) but NOT for externally-supplied facts, since well-formed.ts's item-4
 * self-consistency check is a documented, deliberately weak length-only bound (see its doc
 * comment), not a real hash-recompute-and-compare. So a genuine orderKey tie (every component,
 * including `factCID`, compares equal) between two facts that are not actually the same fact is
 * possible — see `compareOrderKey`'s doc comment.
 *
 * `maxByOrderKey` therefore returns BOTH a deterministic `winner` (picked by `compareByContent`, a
 * pure function of the tied group's CONTENT, never of which element happened to arrive first in
 * this replica's local `facts` array — `Substrate.listFactBlobs` returns facts in first-write/ingest
 * order, see substrate.ts) AND the full `tied` group, so every caller can decide whether a tie is a
 * harmless content-identical duplicate (`winner` is fine as projected) or a genuine content-different
 * conflict that must be surfaced honestly (see `kindWinner`/`pickProvenance` below, and
 * `reduceRawCell`'s own conflict-surfacing use). This makes `winner` itself convergent: two replicas
 * ingesting the same tied set in opposite orders always pick the SAME `winner`. See
 * round2-critic-fixes.test.ts / round3-witness-collision-fix.test.ts for the regression coverage.
 */
export interface MaxByOrderKeyResult {
  readonly winner: Fact;
  /** Every fact whose `orderKey` compares equal to the true maximum over the WHOLE set, independent
   * of array (ingest) order — length 1 when there is no tie at all. */
  readonly tied: Fact[];
}

export function maxByOrderKey(facts: readonly Fact[]): MaxByOrderKeyResult {
  let bestKey = orderKey(facts[0]);
  let tied: Fact[] = [facts[0]];
  for (let i = 1; i < facts.length; i += 1) {
    const f = facts[i];
    const key = orderKey(f);
    const cmp = compareOrderKey(key, bestKey);
    if (cmp > 0) {
      bestKey = key;
      tied = [f];
    } else if (cmp === 0) {
      tied.push(f);
    }
  }
  const winner = tied.length === 1 ? tied[0] : [...tied].sort(compareByContent)[0];
  return { winner, tied };
}

/** True iff `tied` is a GENUINE conflict for the purposes of `extract` — i.e. `extract` yields more
 * than one distinct (canonically-JSON-compared) value across the group. A tied group whose members
 * differ in some field the caller does NOT consume (e.g. two facts with the same `value` but
 * different `provenance.confidence`, when the caller only cares about `value`) is correctly treated
 * as a harmless tie, never a false-positive conflict.
 *
 * INVARIANT: compares `deepSortKeys(extract(f))`, not raw `JSON.stringify(extract(f))` — the same
 * `deepSortKeys` canonicalization `compareByContent` uses, so this diff check is a pure function of
 * content and never flags a false-positive "differs" verdict for two facts that are deep-equal but
 * happen to differ in incidental object-key insertion order. See round4-digest-tiebreak-fix.test.ts. */
function tiedGroupDiffersOn<T>(tied: readonly Fact[], extract: (f: Fact) => T): boolean {
  if (tied.length <= 1) return false;
  const keys = new Set(tied.map((f) => JSON.stringify(deepSortKeys(extract(f)))));
  return keys.size > 1;
}

// ---------------------------------------------------------------------------
// Cell addressing (T2.2 "group by cell") — (eid,prop) for node/edge props, eid alone for
// node/edge EXISTENCE (the "gate" cell, SPEC.md §3.4 "existence gates properties").
// ---------------------------------------------------------------------------

function cellKeyFor(target: Target): string | null {
  switch (target.kind) {
    case "node":
      return `node-exist:${target.eid}`;
    case "node-prop":
      return `node-prop:${target.eid}:${target.prop}`;
    case "edge":
      return `edge-exist:${target.eid}`;
    case "edge-prop":
      return `edge-prop:${target.eid}:${target.prop}`;
    // `schema`/`key`/`control` targets (revoke-key/excision/grant/policy-style facts) are not
    // node/edge/prop CELLS in the §2.1 sense — they are out of M1's graph-projection scope
    // (M8/M9 trust-overlay + M3 excision machinery). Recognizing but not cell-folding them here
    // mirrors well-formed.ts's own documented M0 scope boundary (recognized at the gate, not yet
    // processed by any Repo method).
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Interval coverage (T2.5) — a fact "covers" the elementary sub-interval [a,b) (b === null means
// the open tail to +infinity) iff its own [validFrom,validTo) contains it.
// ---------------------------------------------------------------------------

function covers(f: Fact, a: bigint, b: bigint | null): boolean {
  const from = canon(f.validFrom);
  if (from > a) return false;
  const to = f.validTo === null || f.validTo === undefined ? null : canon(f.validTo);
  if (to === null) return true; // open-ended assert covers any sub-interval, incl. the open tail
  if (b === null) return false; // a bounded fact can never cover an open (unbounded) tail query
  return to >= b;
}

// ---------------------------------------------------------------------------
// Conflict surfacing (T2.6) — SPEC.md §3.4's non-commutative resolution-table row for `supersede`:
// two genuinely CONCURRENT supersede facts over overlapping `supersedes` input-CID sets asserting
// DIFFERENT outcomes surface a `kip:conflict`, never a silent orderKey/hash tiebreak. "Concurrent"
// here (docs/24 §1.4) is decided by the ONLY set-resident causal-ordering signal index.ts's
// current surface offers: the author-declared `causedBy` closure (no commit-DAG/txn machinery
// exists yet at M1 — `txn`/`commit` are still throwing stubs) — a fact that transitively `causedBy`
// another DOMINATES it (SPEC.md §3.4's "resolve"-scoped-dominance language, simplified to the one
// dominance signal actually reachable pre-M3/M8: declared causal ordering, never a hash/orderKey
// pick of un-adjudicated contradictory data).
// ---------------------------------------------------------------------------

/**
 * `bId`/any id encountered while walking `causedBy` may be a COLLIDED id (see `buildFactsById`
 * below) — a caller-declared `id` string that two or more DIFFERENT-content facts share
 * (well-formed.ts's item-4 self-consistency check never verifies `id` against a real content hash
 * for externally-supplied facts). A collided id has no single well-defined referent, so this walk
 * must never soundly claim dominance through one: `collidedIds` makes that explicit rather than
 * silently trusting whichever content-variant `factsById.get(id)` happens to resolve to. See
 * round2-critic-fixes.test.ts.
 */
function causedByDominates(a: Fact, bId: FactId, factsById: ReadonlyMap<FactId, Fact>, collidedIds: ReadonlySet<FactId>): boolean {
  if (collidedIds.has(bId)) return false; // ambiguous target identity — never claim dominance through it
  const seen = new Set<FactId>();
  const stack = [...(a.causedBy ?? [])];
  while (stack.length > 0) {
    const id = stack.pop() as FactId;
    if (collidedIds.has(id)) continue; // ambiguous causal step — do not trust its content or its own causedBy chain
    if (id === bId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    const next = factsById.get(id);
    if (next?.causedBy) stack.push(...next.causedBy);
  }
  return false;
}

/**
 * ROOT-CAUSE FIX (this task, MINOR site #3): `PropValue`'s object-shaped variant (`BlobRef`) is a
 * single-key `{ blob: CID }` shape, so it happens to never actually exhibit multi-key insertion-
 * order sensitivity today — but comparing via raw `JSON.stringify` here was still the same fragile
 * pattern `compareByContent`/`tiedGroupDiffersOn` were fixed for (round 4) and `pickProvenance`/
 * `buildFactsById` are fixed for above/below, and `PropValue` is a public, extensible union (nothing
 * stops a future variant from adding a multi-key object shape). Canonicalizing through the SAME
 * `deepSortKeys` helper keeps this comparison a pure function of content regardless of key order,
 * consistent with every other content-equality check in this module.
 */
function valuesEqual(a: PropValue | undefined, b: PropValue | undefined): boolean {
  return JSON.stringify(deepSortKeys(a ?? null)) === JSON.stringify(deepSortKeys(b ?? null));
}

/** Returns the disputed candidate `FactId`s (sorted) if a genuine, unresolved conflict exists
 * among the covering facts for this sub-interval, else `null`. */
function detectConflict(covering: readonly Fact[], factsById: ReadonlyMap<FactId, Fact>, collidedIds: ReadonlySet<FactId>): FactId[] | null {
  const supersedes = covering.filter((f) => f.type === "supersede");
  if (supersedes.length < 2) return null;
  const disputed = new Set<FactId>();
  for (let i = 0; i < supersedes.length; i += 1) {
    for (let j = i + 1; j < supersedes.length; j += 1) {
      const a = supersedes[i];
      const b = supersedes[j];
      const aInputs = new Set(a.supersedes ?? []);
      const overlaps = (b.supersedes ?? []).some((id) => aInputs.has(id));
      if (!overlaps) continue;
      if (valuesEqual(a.value, b.value)) continue; // identical outcome — idempotent, no conflict
      const aDominates = causedByDominates(a, b.id, factsById, collidedIds);
      const bDominates = causedByDominates(b, a.id, factsById, collidedIds);
      if (aDominates || bDominates) continue; // a declared dominator resolves it, not a tiebreak
      disputed.add(a.id);
      disputed.add(b.id);
    }
  }
  return disputed.size > 0 ? [...disputed].sort() : null;
}

// ---------------------------------------------------------------------------
// The per-cell reduce (T2.2/T2.3/T2.5/T2.6 combined): sweep the elementary sub-intervals defined
// by every covering fact's endpoints (plus any caller-supplied extra breakpoints, e.g. an
// existence cell's own boundaries, so a dependent prop cell's sweep aligns with its gate), and at
// each one pick unknown / a conflict / the orderKey-max covering value.
// ---------------------------------------------------------------------------

/**
 * NOTE: deliberately returns the UNMERGED, per-elementary-sub-interval segment list (never calls
 * `mergeAdjacent` itself). A prop cell's raw sweep must stay at the SAME granularity as its
 * existence cell's breakpoints so `gateByExistence` (which merges once, at the very end) can clip
 * per sub-interval — merging here first would collapse e.g. three "same value" sub-intervals into
 * one wide segment BEFORE existence-gating ever got a chance to see the finer boundary, silently
 * losing a mid-interval existence-retract's clip (see `getNode`/`getEdge`, which explicitly call
 * `mergeAdjacent` on the EXISTENCE cell's own result — no downstream gating needed there).
 */
function reduceRawCell(
  facts: readonly Fact[],
  extraBreakpoints: readonly bigint[],
  factsById: ReadonlyMap<FactId, Fact>,
  collidedIds: ReadonlySet<FactId>,
  knownMaxVersion: number,
): CellSegment[] {
  const asserts = facts.filter((f) => f.type !== "retract");
  const retracts = facts.filter((f) => f.type === "retract");

  const pointsSet = new Set<bigint>(extraBreakpoints);
  for (const f of facts) {
    pointsSet.add(canon(f.validFrom));
    if (f.validTo !== null && f.validTo !== undefined) pointsSet.add(canon(f.validTo));
  }
  if (pointsSet.size === 0) return [];
  const points = [...pointsSet].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));

  const segments: CellSegment[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = i + 1 < points.length ? points[i + 1] : null;
    if (b !== null && a === b) continue;
    const validFrom = decanon(a);
    const validTo = b === null ? null : decanon(b);

    // "retracts remove coverage" (docs/24 §3.4) — unconditional, independent of any orderKey
    // comparison against asserts covering the same sub-interval (the [0,20) split worked example).
    if (retracts.some((f) => covers(f, a, b))) {
      segments.push({ kind: "unknown", validFrom, validTo });
      continue;
    }

    const covering = asserts.filter((f) => covers(f, a, b));
    if (covering.length === 0) {
      segments.push({ kind: "unknown", validFrom, validTo });
      continue;
    }

    const conflict = detectConflict(covering, factsById, collidedIds);
    if (conflict) {
      segments.push({ kind: "conflict", validFrom, validTo, candidates: conflict });
      continue;
    }

    // Resolve the orderKey-max winner via the whole tied-for-max group (see `maxByOrderKey`'s doc
    // comment), never via a `reduce`'s ingest-order-dependent left-to-right pick.
    const { tied: tiedMax } = maxByOrderKey(covering);
    // ROOT-CAUSE FIX (this task, MINOR site #3 — see `valuesEqual`'s doc comment above for why this
    // is the same latent class): canonicalize each side through `deepSortKeys` before stringifying,
    // matching every other content-equality check in this module.
    const distinctValues = new Set(tiedMax.map((f) => JSON.stringify(deepSortKeys(f.value ?? null))));
    if (distinctValues.size > 1) {
      // Genuinely DIFFERENT content tied for the "total" order's maximum — the orderKey-totality
      // premise the default `lww-hlc` silent tiebreak relies on (SPEC.md §3.4's resolution table:
      // "the ONLY cell type allowed to silently total-order contradictory scalar asserts", which
      // presupposes a genuine total order) does not hold for these specific facts. Surface a
      // `kip:conflict` (the same mechanism already used for non-commutative `supersede` ties)
      // instead of silently keeping whichever fact happened to be ingested first.
      segments.push({
        kind: "conflict",
        validFrom,
        validTo,
        candidates: [...new Set(tiedMax.map((f) => f.id))].sort(),
      });
      continue;
    }
    // Tied group is content-identical on `.value` (and `assertedBy`/`f.id` is deterministic
    // regardless of WHICH member is picked, since a full orderKey tie requires equal `factCID` i.e.
    // equal `f.id` strings across the whole group) — but OTHER fields (e.g. `v`) could still differ
    // across the tied group, so still pick the representative via `compareByContent` (a pure
    // function of content, never of array/ingest position) rather than a bare `tiedMax[0]`.
    const winner = tiedMax.length === 1 ? tiedMax[0] : [...tiedMax].sort(compareByContent)[0];

    // MAJOR-FINDING addition (INV-8's "typed result value | quarantine", see index.ts's
    // `CellSegment` doc comment): a fact whose `v` exceeds this projection's configured
    // `knownMaxVersion` is quarantined rather than passed through as a trusted `value` — the
    // minimal, honest trigger this task's scope allows without a full ontology/upcaster registry.
    // Still terminates, still never throws (INV-8's core requirement), and does not itself pick a
    // fabricated replacement value — it just declines to vouch for an unrecognized-version fact's
    // `value` as trustworthy.
    if (winner.v > knownMaxVersion) {
      segments.push({ kind: "quarantine", validFrom, validTo, assertedBy: winner.id, v: winner.v, reason: "unknown-version" });
      continue;
    }
    segments.push({ kind: "value", value: winner.value ?? null, validFrom, validTo, assertedBy: winner.id });
  }
  return segments;
}

function sameOutcome(a: CellSegment, b: CellSegment): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "unknown") return true;
  if (a.kind === "value" && b.kind === "value") return a.assertedBy === b.assertedBy && valuesEqual(a.value, b.value);
  if (a.kind === "conflict" && b.kind === "conflict") {
    const as = [...a.candidates].sort();
    const bs = [...b.candidates].sort();
    return JSON.stringify(as) === JSON.stringify(bs);
  }
  return false;
}

/** Merge consecutive segments with an identical outcome into one wider segment, so the cell's
 * segment list stays minimal/contiguous (docs/21 §2: "non-overlapping ... ordered by validFrom"). */
function mergeAdjacent(segments: readonly CellSegment[]): CellSegment[] {
  const out: CellSegment[] = [];
  for (const seg of segments) {
    const prev = out[out.length - 1];
    if (prev && prev.validTo !== null && canon(prev.validTo) === canon(seg.validFrom) && sameOutcome(prev, seg)) {
      out[out.length - 1] = { ...prev, validTo: seg.validTo } as CellSegment;
    } else {
      out.push(seg);
    }
  }
  return out;
}

function collectBreakpoints(segments: readonly CellSegment[]): bigint[] {
  const out: bigint[] = [];
  for (const s of segments) {
    out.push(canon(s.validFrom));
    if (s.validTo !== null) out.push(canon(s.validTo));
  }
  return out;
}

function isTruthyExistence(v: PropValue): boolean {
  return v !== null && v !== false && v !== 0 && v !== "";
}

/** "Existence gates properties — no ghost nodes" (SPEC.md §3.4/m2-2): clip every prop segment to
 * `unknown` over any sub-interval where the entity's existence cell does not resolve to a truthy
 * `value` segment. Because the prop's own sweep was seeded with the existence cell's breakpoints
 * (see `reduceRawCell`'s `extraBreakpoints` param), every prop segment's `validFrom` lands exactly
 * on (never inside) an existence segment, so a single point lookup suffices. */
function gateByExistence(rawSegments: readonly CellSegment[], existSegments: readonly CellSegment[]): CellSegment[] {
  const out: CellSegment[] = [];
  for (const seg of rawSegments) {
    const at = canon(seg.validFrom);
    const covering = existSegments.find((es) => {
      const from = canon(es.validFrom);
      if (from > at) return false;
      if (es.validTo === null) return true;
      return canon(es.validTo) > at;
    });
    const existsTruthy = covering?.kind === "value" && isTruthyExistence(covering.value);
    out.push(existsTruthy ? seg : { kind: "unknown", validFrom: seg.validFrom, validTo: seg.validTo });
  }
  return mergeAdjacent(out);
}

/**
 * Dispatches a node-prop/edge-prop CELL to whichever `CellReducerRef` `cellReducers` (the
 * caller-supplied association, see `ProjOptions`) names for it, defaulting to the built-in
 * `lww-hlc` sweep (`reduceRawCell`) when none is supplied or the association names `"lww-hlc"`
 * explicitly. This is the seam that makes `gsetReducer`/`pncounterReducer` (cell-reducers.ts)
 * reachable from `getNode`/`getEdge`/`query`, not merely unit-testable in isolation. `gset`/
 * `pncounter` segments are still existence-gated via the SAME `gateByExistence` the default sweep
 * uses (a known, minimal-scope approximation: these reducers produce ONE wide segment per SPEC.md
 * §3.4's resolution table rather than `reduceRawCell`'s per-elementary-sub-interval geometry, so a
 * mid-range existence retraction clips the whole wide segment rather than only the sub-range
 * actually non-existent — a coarser but still sound, never-fabricating result; see this task's
 * disputes).
 */
function reduceCellByRef(
  cellKey: string,
  facts: readonly Fact[],
  existBreakpoints: readonly bigint[],
  existSegments: readonly CellSegment[],
  factsById: ReadonlyMap<FactId, Fact>,
  collidedIds: ReadonlySet<FactId>,
  knownMaxVersion: number,
  cellReducers: CellReducerAssociations | undefined,
): CellSegment[] {
  const ref = resolveCellReducer(cellReducers, cellKey);
  if (ref === "lww-hlc") {
    return gateByExistence(reduceRawCell(facts, existBreakpoints, factsById, collidedIds, knownMaxVersion), existSegments);
  }
  // `gsetReducer`/`pncounterReducer` are typed `CellReducer<PropValue[]>`/`CellReducer<number>`
  // (cell-reducers.ts) — `NodeView`/`EdgeView.props` is `Record<PropKey, PropCell>` (`PropCell<V>`
  // defaulting to `PropCell<PropValue>`, index.ts). `pncounter`'s `number` already IS a `PropValue`
  // so needs no cast; `gset`'s `PropValue[]` (an array of tag-distinct member values) is not itself
  // a member of the `PropValue` union — a KNOWN, documented type-level widening (never a runtime
  // data-shape lie: the actual array value is exactly what SPEC.md §3.4's "union" resolution names)
  // rather than inventing a broader `PropValue` union just to satisfy the type checker here; see
  // this task's disputes.
  const raw = reducerFor(ref).reduce(facts) as unknown as CellSegment[];
  return gateByExistence(raw, existSegments);
}

function latestAssertedFactId(segments: readonly CellSegment[]): FactId | undefined {
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const s = segments[i];
    if (s.kind === "value") return s.assertedBy;
  }
  return undefined;
}

/**
 * node/edge-level `provenance` (m7-8): "the orderKey-max TRUSTED assert among the facts covering
 * the view's resolved asOf across ALL of this node's cells" — M1 has no `asOf`/trust-demotion
 * machinery yet (M2/M8), so "resolved asOf" and "TRUSTED" both take their only sound M1-scope
 * reading: the latest (open-tail-or-final-segment) winning assert across every cell.
 *
 * `candidates` here spans MULTIPLE cells (the existence cell's latest assert plus each prop cell's
 * latest assert), so a genuinely CROSS-CELL tie is possible (an existence fact and an unrelated prop
 * fact sharing a colliding `id`, or two facts whose orderKey ties on every component but whose
 * `provenance` still differs in a field `orderKey` doesn't read, e.g. `author`/`confidence`).
 * `maxByOrderKey` makes the `winner` pick itself content-deterministic, and when the tied group's
 * `provenance` genuinely differs across members (not just a harmless duplicate), the returned
 * `Provenance` is honestly flagged `conflicted: true` rather than silently vouching for one arbitrary
 * member's authorship as if it were unambiguous.
 *
 * `collidedIds`: `candidates` is assembled by `getNode`/`getEdge` via
 * `factsById.get(latestAssertedFactId(...))` per cell — once `factsById` canonicalizes a collided id
 * to ONE deterministic representative (see `buildFactsById`), two different cells' "latest assert"
 * lookups for the SAME colliding id resolve to the identical representative object, so
 * `tiedGroupDiffersOn` above would no longer observe any difference (the ambiguity was already
 * silently collapsed by the representative pick). Explicitly checking `collidedIds.has(winner.id)`
 * here still flags that ambiguity honestly rather than treating an already-collapsed collision as
 * unambiguous. See round2-critic-fixes.test.ts / round3-witness-collision-fix.test.ts.
 */
/**
 * ROOT-CAUSE FIX (this task, CRITICAL finding — live-reproduced by a critic through the real
 * `KipRepo.ingest`/`getNode` round-trip): `winner.provenance` is the RAW `Provenance` object as it
 * was deserialized off the wire, whose own property insertion order is exactly as attacker-
 * controlled as a top-level `Fact`'s (see `compareByContent`'s doc comment above — admission
 * verifies signatures against a `deepSortKeys`-canonicalized payload via `canonicalPayloadString`,
 * but raw fact storage never canonicalizes key order). Previously this function returned that raw
 * object VERBATIM (or spread it into a new object, which preserves the same insertion order plus
 * one appended key) straight into `NodeView`/`EdgeView.provenance` — so two replicas holding byte-
 * different-but-content-identical encodings of the SAME admitted fact (e.g. `provenance`'s own keys,
 * or its nested `source` object's keys, reassembled in a different order) produced `getNode()`/
 * `getEdge()` results that differ under `JSON.stringify`, reopening the exact SEC-breaking
 * divergence class this whole milestone exists to close — this time at the VIEW layer rather than
 * at fact-comparison/collision-detection. Fixed by canonicalizing through the SAME `deepSortKeys`
 * helper every other content-equality/embedding fix in this module already relies on, on BOTH the
 * unambiguous and the `conflicted: true` branch, so no attacker-controlled key order can survive
 * into the projected, publicly-observable view.
 */
function pickProvenance(candidates: readonly Fact[], collidedIds: ReadonlySet<FactId>): Provenance {
  const { winner, tied } = maxByOrderKey(candidates);
  const ambiguous = tiedGroupDiffersOn(tied, (f) => f.provenance) || collidedIds.has(winner.id);
  if (!ambiguous) return deepSortKeys(winner.provenance) as Provenance;
  return deepSortKeys({ ...winner.provenance, conflicted: true }) as Provenance;
}

/**
 * A NodeKind/EdgeKind sentinel (both are plain `string` aliases, index.ts §1) marking that
 * `kindWinner`'s tied-for-max group genuinely disagreed on the fields the caller reads (node:
 * `nodeKind`; edge: `edgeKind`/`from`/`to` — SPEC.md §3.4's "kip:conflict, never a silent orderKey/
 * hash tiebreak" clause, applied to entity KIND/topology, not merely cell VALUES). Reusing the same
 * "kip:conflict" vocabulary `Conflict.kind` (index.ts) already establishes for cell-level conflicts
 * keeps this one, honest signal rather than inventing a parallel taxonomy.
 */
export const KIP_CONFLICT_KIND = "kip:conflict";

/**
 * A plain `new Map(facts.map(f => [f.id, f]))` would be a last-write-wins index: on an `id`
 * COLLISION (two different-content facts sharing a caller-declared `id`, see `maxByOrderKey`'s doc
 * comment for why well-formed.ts's item-4 check allows this), whichever fact happened to be LAST in
 * this replica's local `facts` array (local ingest order) would silently win the Map entry, feeding
 * an ingest-order-dependent fact into `pickProvenance`'s candidate lookup and
 * `causedByDominates`'s causal walk.
 *
 * Instead: group by `id` first, then for each id pick a representative via `compareByContent` (pure
 * content function, never array/ingest position) so `factsById.get(id)` is a deterministic function
 * of the WHOLE fact set regardless of ingest order, even for a collided id. `collidedIds`
 * additionally names every id with more than one DISTINCT content variant, so downstream consumers
 * (`causedByDominates`) can treat a collided id's causal contribution as ambiguous rather than
 * silently trusting one arbitrary variant's `causedBy` chain. See round2-critic-fixes.test.ts.
 */
function buildFactsById(facts: readonly Fact[]): { factsById: Map<FactId, Fact>; collidedIds: Set<FactId> } {
  const groups = new Map<FactId, Fact[]>();
  for (const f of facts) {
    const arr = groups.get(f.id);
    if (arr) arr.push(f);
    else groups.set(f.id, [f]);
  }
  const factsById = new Map<FactId, Fact>();
  const collidedIds = new Set<FactId>();
  for (const [id, group] of groups) {
    // Compares members via `deepSortKeys(f)`, the same canonicalization `compareByContent`/
    // `tiedGroupDiffersOn` use (see their doc comments above) — not raw `JSON.stringify(f)`, which
    // would spuriously flag two content-identical facts sharing an `id` (differing only in
    // incidental, attacker-controlled key-insertion order) as a genuine id COLLISION.
    if (group.length > 1 && new Set(group.map((f) => JSON.stringify(deepSortKeys(f)))).size > 1) collidedIds.add(id);
    factsById.set(id, group.length === 1 ? group[0] : [...group].sort(compareByContent)[0]);
  }
  return { factsById, collidedIds };
}

// ---------------------------------------------------------------------------
// The whole-set fold entrypoint (T2.2) — `proj(S)`.
// ---------------------------------------------------------------------------

export interface ProjResult {
  getNode(eid: EID): NodeView | null;
  getEdge(eid: EID): EdgeView | null;
  /** Deterministic (sorted) list of edge EIDs touching `eid` in the given direction — the seam
   * `traverse` (below) uses for bounded typed BFS/DFS (T2.7). */
  edgesTouching(eid: EID, direction: "out" | "in" | "both"): EID[];
}

/**
 * `knownMaxVersion` (MAJOR-FINDING addition, INV-8): the highest schema version this projection
 * treats as "known" — a fact whose `v` exceeds it is quarantined (see `reduceRawCell`'s trigger)
 * rather than passed through untrusted. Defaults to `1`, the ONLY version every fixture/self-
 * authored fact across this SDK's frozen conformance suite and `KipRepo.assertFact` call sites
 * currently declares (see this task's disputes for why this is a documented minimal seam, not a
 * full per-tenant ontology's declared "current version").
 *
 * `cellReducers` (round-3 wiring fix): a caller-supplied `(cellKey) -> CellReducerRef` association
 * (cell-reducers.ts's `CellReducerAssociations`) — the seam that finally makes `gsetReducer`/
 * `pncounterReducer` REACHABLE from `getNode`/`getEdge`/`query`, not merely unit-testable in
 * isolation (round-2's own gap, flagged as a MAJOR finding). Applies to node-prop/edge-prop cells
 * ONLY (existence cells always use the default `lww-hlc` sweep, SPEC.md §3.4) — an association
 * naming an existence cell key is simply never consulted, never silently misapplied.
 */
export interface ProjOptions {
  knownMaxVersion?: number;
  cellReducers?: CellReducerAssociations;
}

export function proj(facts: readonly Fact[], options?: ProjOptions): ProjResult {
  const knownMaxVersion = options?.knownMaxVersion ?? 1;
  const cellReducers = options?.cellReducers;
  const { factsById, collidedIds } = buildFactsById(facts);

  const byCell = new Map<string, Fact[]>();
  for (const f of facts) {
    const key = cellKeyFor(f.target);
    if (key === null) continue;
    const arr = byCell.get(key);
    if (arr) arr.push(f);
    else byCell.set(key, [f]);
  }
  // T2.2.1 "sort by orderKey" — the literal pipeline step, applied per-cell (a whole-set fold: the
  // reducer above never depends on this array's order for correctness, but sorting here keeps the
  // "sort -> group -> upcast -> reduce" pipeline shape explicit and matches the spec pseudocode).
  for (const arr of byCell.values()) arr.sort((a, b) => compareOrderKey(orderKey(a), orderKey(b)));

  const nodeEids = new Set<EID>();
  const edgeEids = new Set<EID>();
  for (const f of facts) {
    if (f.target.kind === "node" || f.target.kind === "node-prop") nodeEids.add(f.target.eid);
    if (f.target.kind === "edge" || f.target.kind === "edge-prop") edgeEids.add(f.target.eid);
  }

  const nodeViewCache = new Map<EID, NodeView | null>();
  const edgeViewCache = new Map<EID, EdgeView | null>();

  function getNode(eid: EID): NodeView | null {
    if (nodeViewCache.has(eid)) return nodeViewCache.get(eid) ?? null;
    const existFacts = byCell.get(`node-exist:${eid}`) ?? [];
    // "No ghost nodes" (m2-2): a node-prop fact with no corresponding node-existence ASSERT ever
    // ingested MUST project to `null`, never a propertied-but-nonexistent view. MINOR FIX: this
    // must exclude `retract`-type existence facts from the "has existence facts at all" count — a
    // node for which only a `retract` was ever ingested (no positive assert ever existed) has NO
    // asserted existence to gate props against either, and previously fell through to
    // `existFacts[0]` (a retract, whose `target.nodeKind` is typically absent) as `kindWinner`,
    // fabricating a `kind: ""` ghost view instead of returning `null`.
    if (existFacts.filter((f) => f.type !== "retract").length === 0) {
      nodeViewCache.set(eid, null);
      return null;
    }
    const existSegments = mergeAdjacent(reduceRawCell(existFacts, [], factsById, collidedIds, knownMaxVersion));
    const existBreakpoints = collectBreakpoints(existSegments);

    // Prop key iteration/insertion order must be a pure function of the fact SET's content (prop
    // names), never of ingest/delivery order — sorting `propKeys` before populating `props` makes
    // `NodeView.props`' key order (and therefore its JSON/`Object.keys` order) a pure function of
    // the prop name, not a `Set`'s first-encountered (ingest-order-derived) iteration order.
    const propKeySet = new Set<PropKey>();
    for (const f of facts) {
      if (f.target.kind === "node-prop" && f.target.eid === eid) propKeySet.add(f.target.prop);
    }
    const propKeys = [...propKeySet].sort();

    const props: Record<PropKey, PropCell> = {};
    const latestCandidates: Fact[] = [];
    const existLatestId = latestAssertedFactId(existSegments);
    if (existLatestId) latestCandidates.push(factsById.get(existLatestId) as Fact);

    for (const prop of propKeys) {
      const propFacts = byCell.get(`node-prop:${eid}:${prop}`) ?? [];
      const gated = reduceCellByRef(`node-prop:${eid}:${prop}`, propFacts, existBreakpoints, existSegments, factsById, collidedIds, knownMaxVersion, cellReducers);
      props[prop] = { segments: gated };
      const latestId = latestAssertedFactId(gated);
      if (latestId) latestCandidates.push(factsById.get(latestId) as Fact);
    }

    const assertOnlyExist = existFacts.filter((f) => f.type !== "retract");
    // Resolves the SAME way `reduceRawCell` resolves a covering-fact tie — via `maxByOrderKey`'s
    // whole tied group — rather than picking whichever fact happens to be first in
    // `assertOnlyExist`'s (ingest-order-derived) array. When the tied group disagrees on `nodeKind`
    // OR on the fact's own existence `value` (`isTruthyExistence` — two existence facts sharing a
    // colliding id can disagree on whether the node exists at all, not just on its kind), surface
    // `KIP_CONFLICT_KIND` instead of laundering an ingest-order-dependent pick as this node's kind.
    // See round2-critic-fixes.test.ts / round4-digest-tiebreak-fix.test.ts.
    const { winner: kindWinner, tied: kindTied } = maxByOrderKey(assertOnlyExist);
    const kindTarget = kindWinner.target as Extract<Target, { kind: "node" }>;
    const kindConflict = tiedGroupDiffersOn(kindTied, (f) => [
      (f.target as Extract<Target, { kind: "node" }>).nodeKind ?? "",
      isTruthyExistence(f.value ?? null),
    ]);
    const kind: NodeKind = kindConflict ? KIP_CONFLICT_KIND : (kindTarget.nodeKind ?? "");

    const provenance = pickProvenance(latestCandidates.length > 0 ? latestCandidates : assertOnlyExist, collidedIds);

    const view: NodeView = { eid, kind, props, provenance };
    nodeViewCache.set(eid, view);
    return view;
  }

  function getEdge(eid: EID): EdgeView | null {
    if (edgeViewCache.has(eid)) return edgeViewCache.get(eid) ?? null;
    const existFacts = byCell.get(`edge-exist:${eid}`) ?? [];
    // See `getNode`'s identical fix above: exclude retract-only existence-cells from the
    // "no ghost edges" gate.
    if (existFacts.filter((f) => f.type !== "retract").length === 0) {
      edgeViewCache.set(eid, null);
      return null;
    }
    const existSegments = mergeAdjacent(reduceRawCell(existFacts, [], factsById, collidedIds, knownMaxVersion));
    const existBreakpoints = collectBreakpoints(existSegments);

    // See `getNode`'s identical fix above: sort prop keys so `EdgeView.props`' key order is a pure
    // function of prop name, never ingest order.
    const propKeySet = new Set<PropKey>();
    for (const f of facts) {
      if (f.target.kind === "edge-prop" && f.target.eid === eid) propKeySet.add(f.target.prop);
    }
    const propKeys = [...propKeySet].sort();

    const props: Record<PropKey, PropCell> = {};
    const latestCandidates: Fact[] = [];
    const existLatestId = latestAssertedFactId(existSegments);
    if (existLatestId) latestCandidates.push(factsById.get(existLatestId) as Fact);

    for (const prop of propKeys) {
      const propFacts = byCell.get(`edge-prop:${eid}:${prop}`) ?? [];
      const gated = reduceCellByRef(`edge-prop:${eid}:${prop}`, propFacts, existBreakpoints, existSegments, factsById, collidedIds, knownMaxVersion, cellReducers);
      props[prop] = { segments: gated };
      const latestId = latestAssertedFactId(gated);
      if (latestId) latestCandidates.push(factsById.get(latestId) as Fact);
    }

    const assertOnlyExist = existFacts.filter((f) => f.type !== "retract");
    // Edge variant of `getNode`'s identical fix above: resolves via `maxByOrderKey`'s whole tied
    // group. An edge's "kind" also includes topology (`from`/`to`) and its own existence `value`
    // (`isTruthyExistence`) — a tied group that disagrees on `edgeKind`, `from`/`to`, OR whether the
    // edge exists at all is a genuine conflict, so all four are checked.
    const { winner: kindWinner, tied: kindTied } = maxByOrderKey(assertOnlyExist);
    const kindTarget = kindWinner.target as Extract<Target, { kind: "edge" }>;
    const kindConflict = tiedGroupDiffersOn(kindTied, (f) => {
      const t = f.target as Extract<Target, { kind: "edge" }>;
      return [t.edgeKind ?? "", t.from ?? "", t.to ?? "", isTruthyExistence(f.value ?? null)];
    });
    const kind: EdgeKind = kindConflict ? KIP_CONFLICT_KIND : (kindTarget.edgeKind ?? "");
    const from: EID = kindTarget.from ?? "";
    const to: EID = kindTarget.to ?? "";

    const provenance = pickProvenance(latestCandidates.length > 0 ? latestCandidates : assertOnlyExist, collidedIds);

    // ROOT-CAUSE FIX (this task, MINOR finding, latent): `kindWinner.validFrom`/`validTo` are
    // `HlcOrTime`, a union that includes the multi-key object shape `HlcStamp` (`{wall, counter,
    // replicaId}`, index.ts) as well as plain `number`/ISO-`string` — EVERY fixture in this SDK's own
    // suite only ever passes plain numbers, so this path is not exercised by the frozen conformance
    // suite today, but `index.ts`'s `assertFact`/`assertEdgeFact` pass an input's `validFrom`/
    // `validTo` straight through with no narrowing, so a caller CAN supply a real `HlcStamp` object —
    // making this reachable, not merely a theoretical type-level possibility. Embedding
    // `kindWinner.validFrom`/`validTo` verbatim would carry the exact same attacker-controlled-key-
    // order risk `pickProvenance` above was fixed for, so canonicalize through the same
    // `deepSortKeys` helper before returning (a no-op for the plain-number/string case, since
    // `deepSortKeys` returns non-object values unchanged).
    const view: EdgeView = {
      eid,
      kind,
      from,
      to,
      props,
      validFrom: deepSortKeys(kindWinner.validFrom) as HlcOrTime,
      validTo: deepSortKeys(kindWinner.validTo) as HlcOrTime | null,
      provenance,
    };
    edgeViewCache.set(eid, view);
    return view;
  }

  // Eagerly materialize every edge's from/to adjacency (deterministic — iterates edgeEids in
  // SORTED order, never insertion/ingest order, so the resulting index never leaks ingest-order
  // dependence into `edgesTouching`'s output, INV-1).
  const edgesByFrom = new Map<EID, EID[]>();
  const edgesByTo = new Map<EID, EID[]>();
  for (const edgeEid of [...edgeEids].sort()) {
    const view = getEdge(edgeEid);
    if (!view) continue;
    const fromList = edgesByFrom.get(view.from) ?? [];
    fromList.push(edgeEid);
    edgesByFrom.set(view.from, fromList);
    const toList = edgesByTo.get(view.to) ?? [];
    toList.push(edgeEid);
    edgesByTo.set(view.to, toList);
  }

  function edgesTouching(eid: EID, direction: "out" | "in" | "both"): EID[] {
    const out = direction !== "in" ? (edgesByFrom.get(eid) ?? []) : [];
    const inn = direction !== "out" ? (edgesByTo.get(eid) ?? []) : [];
    return [...new Set([...out, ...inn])].sort();
  }

  return { getNode, getEdge, edgesTouching };
}

// ---------------------------------------------------------------------------
// T2.7 "query(spec): typed directional as-of BFS/DFS" — the `asOf`-FREE half (M1 scope; `asOf`
// itself is M2/T3.2 and is rejected by index.ts's `KipRepo.query`, never silently ignored here).
// A bounded, deterministic BFS over `depth` hops honoring `maxFanout`/`edgeKinds`/`kinds`.
// ---------------------------------------------------------------------------

export function* traverse(projection: ProjResult, spec: TraversalSpec): Generator<NodeView | EdgeView> {
  const seeds = Array.isArray(spec.seed) ? spec.seed : [spec.seed];
  const visitedNodes = new Set<EID>();
  const visitedEdges = new Set<EID>();
  let frontier: EID[] = [];

  for (const eid of [...seeds].sort()) {
    const node = projection.getNode(eid);
    if (!node) continue;
    if (spec.kinds && !spec.kinds.includes(node.kind)) continue;
    if (!visitedNodes.has(eid)) {
      visitedNodes.add(eid);
      yield node;
    }
    frontier.push(eid);
  }

  for (let depth = 0; depth < spec.depth; depth += 1) {
    const nextFrontier: EID[] = [];
    for (const eid of frontier) {
      const candidates = projection.edgesTouching(eid, spec.direction);
      let fanout = 0;
      for (const edgeEid of candidates) {
        if (fanout >= spec.maxFanout) break;
        const edgeView = projection.getEdge(edgeEid);
        if (!edgeView) continue;
        if (spec.edgeKinds && !spec.edgeKinds.includes(edgeView.kind)) continue;
        fanout += 1;
        if (!visitedEdges.has(edgeEid)) {
          visitedEdges.add(edgeEid);
          yield edgeView;
        }
        const otherEid = edgeView.from === eid ? edgeView.to : edgeView.from;
        if (visitedNodes.has(otherEid)) continue;
        const otherNode = projection.getNode(otherEid);
        if (!otherNode) continue;
        if (spec.kinds && !spec.kinds.includes(otherNode.kind)) continue;
        visitedNodes.add(otherEid);
        yield otherNode;
        nextFrontier.push(otherEid);
      }
    }
    frontier = nextFrontier;
  }
}
