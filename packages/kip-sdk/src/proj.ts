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
import { createHmac } from "node:crypto";
import type {
  CellSegment,
  ChainId,
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
import { gitBlobId, type HashAlgo } from "./substrate";

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

// ---------------------------------------------------------------------------
// M6 round-2 fix (CRITICAL #2 — docs/32-knowledge-autoencoding.md §"reducer/orderKey treatment of
// the new §5b cells", ADR-020/ADR-021, INV-A9): a `kip:learn` audit fact is authored under a
// `target.kind:"schema"` `Target` (index.ts's `learn()`), and `cellKeyFor` above deliberately
// returns `null` for EVERY `schema`-kind target (this file's own top doc comment: "out of M1's
// graph-projection scope"). That is correct and unchanged for `node`/`edge`/`node-prop`/`edge-prop`
// reads (`getNode`/`getEdge` never take a `schema` target at all) — but it ALSO means a `kip:learn`
// fact was, before this fix, excluded from EVERY fold, not merely from the parts of the fold that
// genuinely don't apply to it (interval-sweep geometry, existence-gating). docs/32 is explicit that
// a `kip:learn` fact IS meant to be "a supersede/correction-class cell keyed on `(rawRef,
// ontologyAsOf, encode/decode/learner-manifest)`" whose recorded LOSS (and the loss microagent's own
// `(name,version)`, per `index.ts`'s `ontologyRefForLearn` key) is excluded from the key/orderKey/
// dedup comparison — never that the whole FACT is excluded from folding.
//
// `foldLearnCell` is that correction-class reducer, factored out as a small, standalone, directly
// unit-testable function (mirroring how `maxByOrderKey`/`compareByContent` above are themselves
// standalone primitives `reduceRawCell` composes) rather than threading `kind:"schema"` through the
// generic node/edge sweep-line machinery (`reduceRawCell`'s interval geometry, existence-gating, and
// version-quarantine checks all presuppose a node/edge PropCell shape that a `kip:learn` audit
// record does not have — a `kip:learn` fact's own `validFrom:0`/`validTo:null` makes it a single,
// ungapped cell with no interval sweep to perform at all). `index.ts`'s `getLearnResult` calls this
// with every admitted, non-retracted `kip:learn`-prefixed fact sharing ONE `ontologyRef` key (the
// caller does the ontologyRef filtering, since only `index.ts` knows how to rebuild that key from a
// `(rawRef, ontologyAsOf, selectors)` tuple via `ontologyRefForLearn`).
// ---------------------------------------------------------------------------

/** The result of folding every `kip:learn` fact sharing one `(rawRef, ontologyAsOf,
 *  encode/decode/learner-manifest)` key (docs/32) — loss and the loss-manifest selector are already
 *  excluded from that key by construction (`ontologyRefForLearn`), and this fold ADDITIONALLY
 *  excludes the recorded loss VALUE from the winner/conflict decision (FR-J4, "exactly as `rxFrom`
 *  is"), so the decision is a pure function of each fact's `orderKey` and its own `accepted`
 *  `AssertInput[]` payload — never of `achievedLoss`. */
export type LearnCellFoldResult =
  | { readonly status: "empty" }
  | {
      /** Exactly one DISTINCT `accepted` payload exists among the facts sharing this key (however
       *  many same-set/different-loss re-authors exist) — resolved to the `orderKey`-max fact,
       *  NEVER the lowest-loss one (INV-A9's first sub-case), and a same-set/different-loss
       *  re-author folds as this SAME resolved winner, never a `kip:conflict` (INV-A9's second
       *  sub-case). */
      readonly status: "resolved";
      readonly winner: Fact;
    }
  | {
      /** 2+ GENUINELY distinct `accepted` payloads exist among the facts sharing this key — a real,
       *  non-commutative contradiction (two `learn()` calls at the same pinned key independently
       *  accepting different `AssertInput[]` sets, INV-A9's "or `kip:conflict`" alternative) —
       *  surfaced honestly rather than silently letting whichever facts' OWN underlying node/edge
       *  targets happen not to collide both take effect with no contradiction ever recorded. */
      readonly status: "conflict";
      /** Every candidate fact's id, sorted — deterministic regardless of ingest/array order. */
      readonly candidates: readonly FactId[];
    };

/** Extracts the `accepted` `AssertInput[]` payload from a `kip:learn` fact's JSON `value` (the SAME
 *  shape `index.ts`'s `learn()` writes: `{ rawRef, ontologyAsOf, encode, decode, learner, loss,
 *  achievedLoss, accepted }`) — `undefined` for anything that fails to parse as that shape (a
 *  malformed/foreign-shaped fact at this key is never trusted as a genuine accepted-set claim, but
 *  also never thrown on; it simply cannot contribute a DISTINCT accepted-set grouping of its own
 *  beyond the single `undefined` bucket every other unparseable fact shares). */
function extractAcceptedPayload(f: Fact): unknown {
  if (typeof f.value !== "string") return undefined;
  try {
    const parsed = JSON.parse(f.value) as Record<string, unknown>;
    return parsed.accepted;
  } catch {
    return undefined;
  }
}

export function foldLearnCell(facts: readonly Fact[]): LearnCellFoldResult {
  if (facts.length === 0) return { status: "empty" };
  const bySet = new Map<string, Fact[]>();
  for (const f of facts) {
    // Canonicalized (deepSortKeys, never raw JSON.stringify — see `compareByContent`'s own doc
    // comment for why) so two accepted sets that differ only in incidental key-insertion order are
    // correctly treated as the SAME set, never a false-positive conflict.
    const setKey = JSON.stringify(deepSortKeys(extractAcceptedPayload(f) ?? null));
    const group = bySet.get(setKey);
    if (group) group.push(f);
    else bySet.set(setKey, [f]);
  }
  if (bySet.size > 1) {
    return { status: "conflict", candidates: [...new Set(facts.map((f) => f.id))].sort() };
  }
  // Exactly one distinct accepted set — resolve the winner by ordinary orderKey-max (never by the
  // recorded loss, which never enters this comparison at all, INV-A9).
  const { winner } = maxByOrderKey(facts);
  return { status: "resolved", winner };
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
// M3/T4.6-T4.7: excision. ONE unified, pure fold over `facts` (`collectExcisions`) produces BOTH
// signals a cell reduce needs:
//
//   1. `excisedOids` — a GLOBAL, cross-replica-convergent set of REAL CONTENT OIDS (never the
//      caller-declared `f.id`) excluded from `asserts`/`retracts` in EVERY cell they'd otherwise
//      cover, regardless of whether this replica's own copy of the bytes happens to still be
//      locally present (docs/50 §8.3's "distributed-erasure residual" case) — a value physically
//      erased by ONE replica can never silently resurface as a trusted `value`/covering-assert on
//      ANY replica that has merely learned of an AUTHORIZED excision marker.
//
//   2. `excisionsByCell` (`ExcisionRecord[]` per cell) — also a pure function of `facts` alone:
//      every AUTHORIZED marker embeds its own target's `cellTarget`/`validFrom`/`validTo` (see
//      `ExcisionMarkerPayload`'s doc comment), so ANY replica holding the marker — not only the one
//      that physically erased the bytes — can reconstruct the identical `"excised"` placeholder.
//      It is honored only when the marker's own `ref` currently matches NO candidate fact in
//      `facts` ("confirmed absent right now", never a stale "was absent once" claim) — the same
//      honest distinction that makes INV-9 (single-replica, bytes genuinely and durably gone) see
//      `"excised"` while INV-12 (two replicas, each replica's own excision's target gets
//      reintroduced by the OTHER, still-innocent peer during sync) converges on `"unknown"` for
//      BOTH fields on BOTH replicas — not a discrepancy, but two genuinely different residual
//      states, derived identically by any replica holding the same admitted set.
//
// Authorization (SPEC §4.5 m-11, see `isAuthorizedExcisionMarker`) gates BOTH signals identically:
// an excision marker that fails it is dropped before either signal is computed from it — never
// folded into the exclusion set, never contributes an `"excised"` placeholder either.
//
// This design is the outcome of several rounds of adversarial-TDD hardening; the full history of
// what earlier approaches got wrong and why lives in reviews/build-final-report.md.
// ---------------------------------------------------------------------------

/** Per-cell excision-placeholder geometry (see file-level doc comment above). */
export interface ExcisionRecord {
  excisedFactId: FactId;
  validFrom: HlcOrTime;
  validTo: HlcOrTime | null;
  /** The excise() caller's own validated `reason` string, carried through from the signed marker
   * payload — `undefined` only for a marker minted before this field existed (never thrown, never
   * fabricated). */
  excisedReason?: string;
}

/**
 * The excision geometry THIS VERIFYING replica itself captured, locally, at the exact moment its
 * OWN `excise()` call read the REAL candidate fact's own `target`/`validFrom`/`validTo` off its own
 * admitted set (see `KipRepo.excise`, index.ts) — never a marker's self-declared payload. Keyed by
 * the excised fact's REAL content oid (the same key `selfWitnessedExcisionOids` uses).
 *
 * This exists because a marker's `ref` match only proves the sender knows the real content oid — it
 * says nothing about whether that same marker's `cellTarget`/`validFrom`/`validTo` are genuine. Any
 * admitted peer who merely learns the same real oid (e.g. by having seen the bytes before erasure)
 * can mint their own validly-self-signed marker with a matching `ref` but a completely different,
 * attacker-chosen `cellTarget`. Storing this local geometry, and having `collectExcisions` build the
 * `ExcisionRecord` — cell key included — EXCLUSIVELY from it once a marker's `ref` is recognized as
 * self-witnessed, closes that gap: any number of competing markers resolving to the SAME oid (the
 * replica's own real one, an attacker's forged one, a re-synced duplicate) all deterministically
 * produce the IDENTICAL, correct `ExcisionRecord` — there is no attacker-controlled input left in
 * this path. See round4-excision-convergence-fix.test.ts and reviews/build-final-report.md for the
 * live-reproduced attack this closes.
 */
export interface SelfWitnessedExcisionRecord {
  cellTarget: Target;
  validFrom: HlcOrTime;
  validTo: HlcOrTime | null;
  excisedFactId: FactId;
  excisedReason?: string;
}

/**
 * The durable `type:"excision"` marker fact's `value` is this JSON-encoded, SIGNED payload
 * (SPEC §4.5 C-4.3, m-11):
 *
 *   - `ref`/`nonce`: `ref = HMAC-SHA256(key=nonce, message=<excised fact's REAL content oid>)`. The
 *     marker's persisted bytes NEVER carry the excised content's own oid/CID directly — only this
 *     keyed reference, which lets ANY replica holding a CANDIDATE fact verify a MATCH (recompute
 *     `HMAC(nonce, candidateOid)` and compare) without ever being able to invert `ref` back into
 *     the oid without already possessing a candidate to test. `nonce` is safe to disclose alongside
 *     `ref` (it is not the erased content, just the HMAC key) — this is C-4.3's "tenant-salted HMAC
 *     of the removed CID", with the marker itself carrying its own salt so no separate genesis-
 *     shared-secret machinery is needed.
 *   - `origFingerprint`: the ERASED fact's OWN signer fingerprint, embedded so ANY replica —
 *     including one that never held the original bytes — can verify "is this marker's OWN signer
 *     authorized to erase THIS specific author's data" (self-excision) purely from the admitted
 *     set, with no per-replica side-channel. NOTE: `collectExcisions` never authorizes off this
 *     self-declared field alone when a real candidate is still present — see its own doc comment.
 *   - `cellTarget`/`validFrom`/`validTo`: the erased fact's own cell target + valid-time interval,
 *     embedded so ANY replica admitting this marker — not just the one that physically erased the
 *     bytes — can reconstruct the identical `"excised"` placeholder geometry (`excisionsByCell` is
 *     a pure function of `facts` alone, exactly like `excisedOids`).
 *   - `excisedFactId` (DOCUMENTED, DELIBERATE EXCEPTION): the erased fact's caller-DECLARED id,
 *     kept for `CellSegment{kind:"excised"}.excisedFactId` display purposes ONLY — never consulted
 *     by the exclusion-matching (`ref`/`nonce` alone drive that) or authorization logic. This is in
 *     tension with C-4.3's "never a stable fingerprint of the erased content", but INV-9's own
 *     FROZEN assertion requires the EXACT original declared id to be reproducible even in the
 *     single-replica, bytes-durably-gone scenario (no candidate fact left anywhere to derive it
 *     from), and any replica — not just the excising one — must reconstruct an identical
 *     placeholder, which is impossible without some durable, convergent carrier of this value. See
 *     this task's `disputes` output / reviews/build-final-report.md for the full reasoning; the
 *     security-relevant matching/authorization decisions never depend on this field.
 *   - `excisedReason`: the excise() caller's own validated `reason` string (`"fork" | "malformed" |
 *     "gdpr-erasure" | "other"`, index.ts's `ALLOWED_REASONS`), embedded in the SIGNED, durable,
 *     synced marker payload. OPTIONAL (never required for a marker to parse/be honored) so a
 *     marker that omits it is still parsed and honored exactly as before — this field is
 *     display/audit-only, never consulted by matching (`ref`/`nonce`) or authorization logic.
 */
interface ExcisionMarkerPayload {
  ref: string;
  nonce: string;
  origFingerprint: string;
  cellTarget: Target;
  validFrom: HlcOrTime;
  validTo: HlcOrTime | null;
  excisedFactId: FactId;
  excisedReason?: string;
  /**
   * A-1 "attested-hole bridge" (docs/22 §3.6 step (i) / docs/40 `ExcisionMarker`): the erased fact's
   * OWN `(replicaId,key)` chain — `"<replicaId>/<keyFpr>"` — and its chain position `seq`, embedded in
   * the SIGNED, durable, synced marker payload so ANY replica (not only the excising one) can treat a
   * physically-erased mid-chain slot as an ATTESTED HOLE satisfied by this marker rather than an
   * unexplained contiguity gap (see `collectAttestedChainHoles`). OPTIONAL for back-compat: a marker
   * that omits them (a pre-A-1 marker) parses/honors exactly as before and simply contributes no
   * attested hole — never rejected, never thrown (N5). Both must be present together to name a slot.
   */
  excisedChainId?: ChainId;
  excisedSeq?: number;
}

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Parses+validates an admitted fact as a well-shaped excision-marker payload, or `null` if it is
 * not an excision marker at all, or its `value` doesn't decode to the expected shape (a malformed/
 * foreign-shaped `type:"excision"` fact is simply never honored — never thrown, N5). */
function parseExcisionMarker(f: Fact): ExcisionMarkerPayload | null {
  if (f.type !== "excision") return null;
  if (f.target.kind !== "control") return null;
  if ((f.target as Extract<Target, { kind: "control" }>).op !== "excision") return null;
  if (typeof f.value !== "string" || f.value.length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(f.value);
  } catch {
    return null;
  }
  if (!isPlainRecord(parsed)) return null;
  if (typeof parsed.ref !== "string" || parsed.ref.length === 0) return null;
  if (typeof parsed.nonce !== "string" || parsed.nonce.length === 0) return null;
  if (typeof parsed.origFingerprint !== "string" || parsed.origFingerprint.length === 0) return null;
  if (typeof parsed.excisedFactId !== "string" || parsed.excisedFactId.length === 0) return null;
  if (!isPlainRecord(parsed.cellTarget)) return null;
  if (parsed.validFrom === undefined) return null;
  // A-1: `(excisedChainId, excisedSeq)` are honored ONLY as a well-formed PAIR — a marker declaring
  // one without the other (or a non-string/non-integer) names no slot at all (never partially trusted).
  const hasChainId = typeof parsed.excisedChainId === "string" && parsed.excisedChainId.length > 0;
  const hasSeq = typeof parsed.excisedSeq === "number" && Number.isInteger(parsed.excisedSeq) && parsed.excisedSeq >= 0;
  return {
    ref: parsed.ref,
    nonce: parsed.nonce,
    origFingerprint: parsed.origFingerprint,
    excisedFactId: parsed.excisedFactId,
    cellTarget: parsed.cellTarget as Target,
    validFrom: parsed.validFrom as HlcOrTime,
    validTo: (parsed.validTo ?? null) as HlcOrTime | null,
    excisedReason: typeof parsed.excisedReason === "string" ? parsed.excisedReason : undefined,
    excisedChainId: hasChainId && hasSeq ? (parsed.excisedChainId as ChainId) : undefined,
    excisedSeq: hasChainId && hasSeq ? (parsed.excisedSeq as number) : undefined,
  };
}

/** `HMAC-SHA256(key=nonce, message=oid)`, hex-encoded — see `ExcisionMarkerPayload`'s doc comment
 * above for why this (never the raw `oid`) is what the marker persists. */
export function computeExcisionRef(nonce: string, oid: string): string {
  return createHmac("sha256", nonce).update(oid, "utf8").digest("hex");
}

/**
 * An excision marker is honored — folded into `excisedOids`/`excisionsByCell` — iff its OWN signer
 * is authorized to erase the TARGET fact's data (SPEC §4.5 m-11). Full `KeyAuthorization`/grant-chain
 * enforcement is explicitly M8/M9 scope (not built yet); this is the minimal, honest safeguard:
 *
 *   (a) `markerFingerprint === origFingerprint` — self-excision: the same signer who authored the
 *       data is the one erasing it.
 *   (b) `trustedExciseKeys.has(markerFingerprint) && isRegisteredFingerprint(markerFingerprint)` —
 *       an explicit, opt-in, constructor-configured admin/operator escape hatch (never a broader
 *       capability system). The registered-fingerprint check is load-bearing, not incidental: a
 *       fingerprint merely LISTED in `trustedExciseKeys` (a constructor-only, never-synced config
 *       option) carries no cryptographic weight on its own — `trustedExciseKeys: string[]` and
 *       `rootKeys`/`keyPair` registration are two entirely independent constructor options, so
 *       without this check a sync peer could forge a marker claiming a trusted fingerprint via
 *       `ingest()`'s documented unregistered-key placeholder-signature fallback
 *       (`isPlaceholderSignature`, this file's INV-13a residual) and have it honored as if
 *       genuinely, cryptographically trusted. Requiring the fingerprint to ALSO be a real,
 *       registered key means a `trustedExciseKeys` marker is only ever honored when it carries a
 *       real, verified Ed25519 signature. See round5-excise-final-hardening.test.ts.
 *   (c) `!isRegisteredFingerprint(origFingerprint)` — the ERASED fact's own signer was never a
 *       REAL, cryptographically-verified key on THIS verifying replica (i.e. it was only ever
 *       admitted via `ingest()`'s documented unregistered-key placeholder-signature fallback,
 *       INV-13a's own scenario) — there is no genuine cryptographic authority to check the marker's
 *       signer against, so this replica's own local decision to have trusted/admitted that data in
 *       the first place extends to trusting its own decision to erase it too. This is the SAME "no
 *       real trust chain exists yet" category `ingest()` already treats permissively; it does NOT
 *       apply to genuinely-authenticated data (self-authored via `assertFact`, or admitted via a
 *       registered peer/root key) — an attacker's OWN legitimately-registered (but unprivileged) key
 *       can never satisfy (a) or (b) against a victim's real registered-key-authored fact, so the
 *       victim's own replica (which HAS that fact's fingerprint genuinely registered, being the
 *       victim's own identity) rejects the attacker's marker outright.
 *
 * See reviews/build-final-report.md for the adversarial-TDD history that arrived at this exact rule.
 */
export function isAuthorizedExcisionMarker(
  markerFingerprint: string,
  origFingerprint: string,
  isRegisteredFingerprint: (fingerprint: string) => boolean,
  trustedExciseKeys: ReadonlySet<string>,
): boolean {
  if (trustedExciseKeys.has(markerFingerprint) && isRegisteredFingerprint(markerFingerprint)) return true;
  if (markerFingerprint === origFingerprint) return true;
  if (!isRegisteredFingerprint(origFingerprint)) return true;
  return false;
}

/** The signing-key fingerprint of a `ChainId` (`"<replicaId>/<keyFpr>"`, docs/22 §7 / chain-sequencer.ts's
 * `chainIdFor`): the substring after the LAST `/` (a `replicaId` may itself contain `/`, the `keyFpr`
 * — a hash — never does). Returns `null` for a chainId with no `/` (not a well-formed `ChainId`). */
function keyFprOfChainId(chainId: ChainId): string | null {
  const slash = chainId.lastIndexOf("/");
  if (slash < 0 || slash === chainId.length - 1) return null;
  return chainId.slice(slash + 1);
}

/** The `${excisedChainId} ${excisedSeq}` key a slot is recorded under in the attested-hole set
 * (` ` can never occur inside a `ChainId` or a decimal `seq`, so it is an unambiguous separator). */
export function attestedHoleKey(chainId: ChainId, seq: number): string {
  return `${chainId} ${seq}`;
}

/**
 * A-1 "attested-hole bridge" (docs/22 §3.6 step (i) / docs/24 §1.2a / docs/40 `ExcisionMarker`). The
 * set of per-`(replicaId,key)` chain slots — `attestedHoleKey(chainId, seq)` — that are ATTESTED HOLES
 * rather than contiguity gaps: a slot named by a present, admitted (⇒ signature-valid, §2.1 ingest
 * gate) `type:"excision"` marker whose `(excisedChainId, excisedSeq)` payload identifies it AND whose
 * OWN signer is authorized to excise that chain's key (§4.5 m-11). Both the value-trust
 * chain-completeness gate (`computeValueTrust` Rule D(i)) and pin-completeness (`resolvePin`, INV-14)
 * consult this so a physically-excised mid-chain slot is not read as a missing `seq`.
 *
 * SET-PURE: a function of the admitted `facts` alone (plus this verifying replica's own registered-
 * fingerprint predicate / `trustedExciseKeys` config — the SAME documented, legitimately-per-replica
 * trust-escape-hatch category `collectExcisions` already relies on). No per-replica `selfWitnessed`
 * memory, no ingest/array order, no clock — so two replicas holding the byte-identical admitted set
 * decide the byte-identical hole set.
 *
 * SECURITY — authorization is grounded in the SLOT's OWN chain key (`keyFprOf(excisedChainId)`), NEVER
 * the marker's self-declared `origFingerprint` payload field (which an attacker sets to their own
 * fingerprint to falsely pass the self-excision clause — the exact spoof `collectExcisions` closes by
 * reading the real target's fingerprint). Because the hole is only ever honored for the EXACT `chainId`
 * the marker names, and a pin/gate only consults holes on chains it actually enumerates, an attacker
 * cannot fabricate a hole on a victim's REGISTERED-key chain (self-excision needs that key's real
 * signature; the trusted-excise and unregistered-`origFingerprint` clauses do not apply to a genuine
 * registered victim key) — so a genuine, un-excised gap on a registered chain can never be masked. For
 * an UNREGISTERED chain any marker suffices, exactly as `collectExcisions`/`excise()` already treat
 * unregistered data (no real trust chain exists to protect).
 */
export function collectAttestedChainHoles(
  facts: readonly Fact[],
  isRegisteredFingerprint: (fingerprint: string) => boolean,
  trustedExciseKeys: ReadonlySet<string>,
): ReadonlySet<string> {
  const holes = new Set<string>();
  for (const f of facts) {
    const marker = parseExcisionMarker(f);
    if (!marker) continue;
    if (marker.excisedChainId === undefined || marker.excisedSeq === undefined) continue;
    const excisedKeyFpr = keyFprOfChainId(marker.excisedChainId);
    if (excisedKeyFpr === null) continue;
    if (!isAuthorizedExcisionMarker(f.provenance.publicKeyFingerprint, excisedKeyFpr, isRegisteredFingerprint, trustedExciseKeys)) {
      continue; // UNAUTHORIZED marker — never fabricates a hole (a genuine gap must stay a gap).
    }
    holes.add(attestedHoleKey(marker.excisedChainId, marker.excisedSeq));
  }
  return holes;
}

/**
 * IMPORTANT: `origFingerprint` passed to `isAuthorizedExcisionMarker` here MUST be the TARGET's own
 * REAL, admitted `provenance.publicKeyFingerprint` — read directly off a genuine candidate `Fact`
 * object this verifying replica currently holds — NEVER the marker's own self-declared
 * `origFingerprint` field (`ExcisionMarkerPayload.origFingerprint`), which is entirely attacker-
 * controlled (a forger with a real registered keypair could craft a marker whose `ref` targets a
 * victim's fact while self-declaring `origFingerprint` as their own, trivially and falsely passing
 * "self-excision"). `collectExcisions` below never calls `isAuthorizedExcisionMarker` with the
 * marker's own `parsed.origFingerprint` value — only with a real candidate fact's own
 * `provenance.publicKeyFingerprint`, which the marker's author cannot forge. See `collectExcisions`'s
 * own doc comment for the full two-case (candidate present / candidate absent) reasoning this
 * necessitates.
 */

export interface ExcisionFoldResult {
  /** Real content oids excluded from every cell they'd otherwise cover — keyed by the fact's REAL
   * content oid, never the caller-declared `f.id`, closing the id-collision collateral-censorship
   * vector: two admitted facts sharing a declared id but DIFFERENT content no longer both get
   * excluded just because ONE of them was legitimately excised. */
  excisedOids: ReadonlySet<string>;
  /** Per-cell `"excised"` placeholder geometry — a PURE function of `facts` alone, never
   * per-replica memory. Only populated for a marker whose OWN `ref` currently matches NO candidate
   * fact in `facts` ("confirmed absent right now" — the same "distributed-erasure residual"
   * self-healing semantics described in the file-level doc comment above). */
  excisionsByCell: ReadonlyMap<string, ExcisionRecord[]>;
  /** Every admitted fact's own real content oid, computed once per `proj()` call and reused by
   * `reduceRawCell`/`reduceCellByRef`'s exclusion filters — avoids recomputing `gitBlobId` per cell. */
  oidByFact: ReadonlyMap<Fact, string>;
}

/**
 * The GLOBAL, cross-replica-convergent excision fold — a pure function of `facts` (plus this
 * VERIFYING replica's own `isRegisteredFingerprint`/`trustedExciseKeys`/`selfWitnessedExcisionOids`;
 * see `isAuthorizedExcisionMarker`'s doc comment for the documented, honest scope-limit on how
 * convergent AUTHORIZATION verdicts can be without full M8/M9 grant-chain machinery — the admitted
 * set and its exclusion-worthy content stay pure; only the trust-escape-hatch config can
 * legitimately differ by replica, the same category as `knownMaxVersion`/`cellReducers`).
 *
 * Every marker is resolved through exactly ONE of two cases, decided BEFORE authorization is even
 * evaluated:
 *
 *   1. TARGET CURRENTLY PRESENT — the marker's `ref` matches a REAL candidate fact still in `facts`.
 *      Authorization is decided against that CANDIDATE'S OWN, REAL `provenance.publicKeyFingerprint`
 *      (read directly off the admitted fact object this replica itself verified/admitted) — NEVER
 *      the marker's self-declared `parsed.origFingerprint`, which is entirely attacker-controlled
 *      (see `isAuthorizedExcisionMarker`'s doc comment above for the exact spoof this closes).
 *
 *   2. TARGET CURRENTLY ABSENT — no candidate fact is left in `facts` to cross-check the marker's
 *      claimed authorship against at all (the "distributed-erasure residual" case; this is ALSO the
 *      case every excise() call's own immediate re-fold hits, once `Substrate.erase` has removed the
 *      candidate's bytes). There is nothing genuine to check a self-claimed "I am erasing my own
 *      data" assertion against, so the marker's OWN claimed self-excision is NEVER trusted here; it
 *      is honored ONLY when EITHER (a) its signer is an explicit, operator-configured
 *      `trustedExciseKeys` fingerprint, or (b) THIS verifying replica itself already, independently
 *      verified (at ITS OWN `excise()` mint time, against the real candidate it held then — never
 *      from any marker payload) that erasing this exact real content oid was authorized
 *      (`selfWitnessedExcisionOids`, index.ts — populated ONLY by this replica's own `excise()`
 *      calls, NEVER by anything received over `sync()`).
 *
 * A consequence worth noting: a replica that never held a target's bytes and receives ONLY an
 * unrecognized third party's self-claimed marker for it shows `"unknown"`, not `"excised"` — see
 * round2-excise-security-fixes.test.ts's test (c) for the scenario. See reviews/build-final-report.md
 * for the full adversarial-TDD history behind this design.
 */
/**
 * `collectExcisions`'s CASE-2(ii) self-witnessed branch builds `cellTarget`/`validFrom`/`validTo`/
 * `excisedFactId` EXCLUSIVELY from THIS replica's own local `SelfWitnessedExcisionRecord` — those
 * fields are guaranteed identical across any two replicas that witnessed the SAME real content, so
 * sourcing them locally is sound. But `excisedReason` is different in kind: it is a caller-SUPPLIED
 * string, not content-derived, so TWO DIFFERENT replicas can each independently, legitimately
 * self-excise the SAME real oid via `excise(id, reason)` calls with DIFFERENT `reason` values (e.g.
 * one calls it `"gdpr-erasure"`, the other `"malformed"`, on its own separately-declared `factId` for
 * the identical bytes). Once both markers are synced, the two replicas hold a BYTE-IDENTICAL admitted
 * fact set, so `excisedReason` must be resolved as a deterministic function of THAT set — never
 * "whichever replica's own local record happens to be consulted" — or the two replicas diverge (a
 * SEC/INV-1 violation).
 *
 * This is the SAME "multiple candidates, need one pure-content pick" problem `maxByOrderKey`/
 * `compareByContent` already solve elsewhere in this file. Every ADMITTED fact in `facts` that
 * (a) parses as a well-formed excision marker, (b) whose own `ref`/`nonce` resolves to this exact
 * `oid`, AND (c) whose OWN signer fingerprint is a REAL, cryptographically-registered key on THIS
 * replica (`isRegisteredFingerprint`) is gathered into one pool; `maxByOrderKey` (a pure function of
 * `facts` alone, convergent regardless of ingest order) picks the winner, and that winner's OWN
 * parsed `excisedReason` — never the local record's — is what gets projected.
 *
 * Condition (c) is load-bearing, not incidental: without it, an admitted-but-UNREGISTERED
 * (placeholder-signature-fallback, see `isPlaceholderSignature`) marker — which requires no real
 * signing key, only knowledge of the target oid, to craft a `ref` match — could inject an arbitrary
 * fabricated `excisedReason` into the pool. A GENUINE self-`excise()` call always mints its marker
 * with the replica's OWN real signing key, so restricting the pool to registered-fingerprint markers
 * keeps it exactly as broad as — never broader than — the set of markers `sync()`'s own trust model
 * would let a legitimate excision reach, while still excluding any placeholder-signed forgery.
 *
 * `undefined` is returned only if genuinely no matching marker in `facts` carries a registered
 * signature (the pool is empty) — but this cannot happen when called from CASE-2(ii) below, since
 * `selfWitnessedRecord` having matched already implies THIS replica's own `excise()` call minted and
 * ingested (with its own, always-registered key) at least one matching marker into `facts`.
 * See round5-excise-final-hardening.test.ts and reviews/build-final-report.md.
 */
function pickConvergentSelfWitnessedReason(
  oid: string,
  facts: readonly Fact[],
  isRegisteredFingerprint: (fingerprint: string) => boolean,
): string | undefined {
  const candidateMarkers: Fact[] = [];
  for (const f of facts) {
    const marker = parseExcisionMarker(f);
    if (!marker) continue;
    if (computeExcisionRef(marker.nonce, oid) !== marker.ref) continue;
    if (!isRegisteredFingerprint(f.provenance.publicKeyFingerprint)) continue;
    candidateMarkers.push(f);
  }
  if (candidateMarkers.length === 0) return undefined;
  const { winner } = maxByOrderKey(candidateMarkers);
  return parseExcisionMarker(winner)?.excisedReason;
}

export function collectExcisions(
  facts: readonly Fact[],
  hashAlgo: HashAlgo,
  isRegisteredFingerprint: (fingerprint: string) => boolean,
  trustedExciseKeys: ReadonlySet<string>,
  selfWitnessedExcisionOids: ReadonlyMap<string, SelfWitnessedExcisionRecord> = new Map(),
): ExcisionFoldResult {
  const oidByFact = new Map<Fact, string>();
  const factsByOid = new Map<string, Fact[]>();
  for (const f of facts) {
    const oid = gitBlobId(Buffer.from(JSON.stringify(f), "utf8"), hashAlgo);
    oidByFact.set(f, oid);
    const group = factsByOid.get(oid);
    if (group) group.push(f);
    else factsByOid.set(oid, [f]);
  }

  const excisedOids = new Set<string>();
  const excisionsByCell = new Map<string, ExcisionRecord[]>();

  for (const f of facts) {
    const marker = parseExcisionMarker(f);
    if (!marker) continue;
    const markerFingerprint = f.provenance.publicKeyFingerprint;

    // Locate every REAL candidate currently admitted whose content oid this marker's keyed `ref`
    // resolves to (an HMAC match is — cryptographically — unique to one oid, so at most one group
    // is ever matched; two DIFFERENT oids both matching the same `ref` under the same `nonce` would
    // be an HMAC-SHA256 collision).
    let matchedOid: string | undefined;
    for (const oid of factsByOid.keys()) {
      if (computeExcisionRef(marker.nonce, oid) === marker.ref) {
        matchedOid = oid;
        break;
      }
    }

    if (matchedOid !== undefined) {
      // CASE 1 — target currently present: ground authorization in the CANDIDATE's own real signer,
      // never the marker's self-declared claim (see this function's doc comment above for why).
      const candidateFingerprint = (factsByOid.get(matchedOid) as Fact[])[0].provenance.publicKeyFingerprint;
      if (!isAuthorizedExcisionMarker(markerFingerprint, candidateFingerprint, isRegisteredFingerprint, trustedExciseKeys)) {
        continue; // UNAUTHORIZED: never folded into the exclusion set, never admitted as a basis for censorship.
      }
      excisedOids.add(matchedOid);
      continue; // still physically present — not "confirmed absent", never populate excisionsByCell.
    }

    // CASE 2 — target currently absent: no candidate to cross-check the marker's claim against.
    // Honored via exactly ONE of two sound bases — NEVER the marker's own self-declared payload
    // (see `SelfWitnessedExcisionRecord`'s doc comment for the audit-forgery this avoids):
    //
    //   (i)  an explicit `trustedExciseKeys` fingerprint that ALSO satisfies
    //        `isRegisteredFingerprint(markerFingerprint)` — this signer is FULLY, operator-
    //        delegated authority to author excisions, so trusting THEIR OWN signed marker's
    //        self-declared geometry is the intended, sound meaning of that trust grant (unlike an
    //        unprivileged peer merely piggybacking on someone else's witnessed oid, case (ii)). The
    //        registered-key gate matters here specifically: the target is absent, so there is no
    //        candidate to cross-check against, and a bare `trustedExciseKeys.has(...)` check would
    //        otherwise be satisfiable by a placeholder-signed marker (see
    //        `isAuthorizedExcisionMarker`'s doc comment for the same reasoning applied to CASE 1).
    //   (ii) this replica's OWN prior, real, local record of having independently verified and
    //        performed this exact excision itself (`selfWitnessedExcisionOids`) — when this is the
    //        basis, the `ExcisionRecord` (cell key AND geometry) is built EXCLUSIVELY from THAT
    //        LOCAL RECORD, never from the marker that happened to match it. A marker with a
    //        matching `ref` but attacker-chosen `cellTarget`/`validFrom`/`validTo`/`excisedFactId`
    //        can therefore never inject fabricated geometry: it is either redundant (produces the
    //        identical record the local truth already would) or simply ignored. `excisedReason` is
    //        the one field resolved differently — see `pickConvergentSelfWitnessedReason`'s doc
    //        comment below for why it is instead a deterministic function of the admitted marker set.
    //
    // Neither trustedExciseKeys nor an own local record ⇒ no sound basis to authorize an absent
    // target at all — never honored; the cell correctly falls through to plain `"unknown"` (a
    // replica with zero relevant local knowledge never fabricates an `"excised"` placeholder for
    // ANY marker, however it is signed).
    if (trustedExciseKeys.has(markerFingerprint) && isRegisteredFingerprint(markerFingerprint)) {
      const cellKey = cellKeyFor(marker.cellTarget);
      if (cellKey === null) continue;
      const rec: ExcisionRecord = {
        excisedFactId: marker.excisedFactId,
        validFrom: marker.validFrom,
        validTo: marker.validTo,
        excisedReason: marker.excisedReason,
      };
      const arr = excisionsByCell.get(cellKey);
      if (arr) arr.push(rec);
      else excisionsByCell.set(cellKey, [rec]);
      continue;
    }

    let selfWitnessedRecord: SelfWitnessedExcisionRecord | undefined;
    let selfWitnessedOid: string | undefined;
    for (const [oid, record] of selfWitnessedExcisionOids) {
      if (computeExcisionRef(marker.nonce, oid) === marker.ref) {
        selfWitnessedRecord = record;
        selfWitnessedOid = oid;
        break;
      }
    }
    if (!selfWitnessedRecord || selfWitnessedOid === undefined) continue; // no sound basis to authorize an absent target — never honored.
    const cellKey = cellKeyFor(selfWitnessedRecord.cellTarget);
    if (cellKey === null) continue;
    const rec: ExcisionRecord = {
      excisedFactId: selfWitnessedRecord.excisedFactId,
      validFrom: selfWitnessedRecord.validFrom,
      validTo: selfWitnessedRecord.validTo,
      // `excisedReason` alone is resolved as a deterministic function of the ADMITTED marker set
      // (never blindly from this replica's own local record) — see
      // `pickConvergentSelfWitnessedReason`'s doc comment above.
      excisedReason: pickConvergentSelfWitnessedReason(selfWitnessedOid, facts, isRegisteredFingerprint),
    };
    const arr = excisionsByCell.get(cellKey);
    if (arr) arr.push(rec);
    else excisionsByCell.set(cellKey, [rec]);
  }

  return { excisedOids, excisionsByCell, oidByFact };
}

/** True iff `rec`'s own `[validFrom, validTo)` (half-open) contains the elementary sub-interval
 * `[a,b)` — the same half-open-interval "covers" test `covers()` uses for a real `Fact`, applied to
 * a bare excision-placeholder record instead. */
function coversInterval(rec: ExcisionRecord, a: bigint, b: bigint | null): boolean {
  const from = canon(rec.validFrom);
  if (from > a) return false;
  const to = rec.validTo === null || rec.validTo === undefined ? null : canon(rec.validTo);
  if (to === null) return true;
  if (b === null) return false;
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
export function valuesEqual(a: PropValue | undefined, b: PropValue | undefined): boolean {
  return JSON.stringify(deepSortKeys(a ?? null)) === JSON.stringify(deepSortKeys(b ?? null));
}

/**
 * docs/23 §1 supersession-envelope normalizers. `Fact.supersedes` is EITHER the rich object shape
 * `{ inputCids; retract?; assert? }` (the spec's source-of-truth form) OR the legacy flattened
 * `FactId[]` (== `inputCids`, empty `retract`, no `assert`) the frozen conformance fixtures bake
 * (see index.ts's `Fact.supersedes` doc comment + this task's `disputes`). These fold BOTH into the
 * canonical fields so `proj` treats them identically and equal admitted sets still converge.
 */
function supersedeInputCids(f: Fact): readonly FactId[] {
  const s = f.supersedes;
  if (s === undefined) return [];
  if (Array.isArray(s)) return s;
  // TOTAL by construction (INV-3): an object-shaped supersede may OMIT `inputCids` and still be
  // signature-valid/admittable (well-formed.ts checks only presence-iff-type), so `s.inputCids` can
  // be `undefined` — coalesce to `[]` so every caller (`detectConflict`'s `.some()`, the retract
  // fold) is total and never throws. This is NOT a silent no-op excuse: `isMalformedSupersede`
  // below flags exactly this (empty key-set) so `reduceRawCell` QUARANTINES such a fact rather than
  // treating it as a benign empty-inputCids supersede. See docs/23 §1 ("keyed by its input-CID set").
  return s.inputCids ?? [];
}

/** docs/23 §1: a `supersede` is "keyed by its input-CID set". An object-shaped supersede whose
 * `inputCids` is missing or empty (or a legacy flat `[]`) has no key — it is MALFORMED, yet
 * signature-valid and admittable. proj (INV-3 total) must surface it as `quarantine`, never trust
 * its value, never drop it, never throw. */
function isMalformedSupersede(f: Fact): boolean {
  return f.type === "supersede" && supersedeInputCids(f).length === 0;
}
/** The interval-CLOSING list (docs/23 §1): facts a covering `supersede` retracts over its own
 * valid-time span. Empty for the legacy `FactId[]` shape (no `retract` sub-field), so a flattened
 * supersede competes by `orderKey` alone exactly as before — frozen fixtures are unaffected. */
function supersedeRetractIds(f: Fact): readonly FactId[] {
  const s = f.supersedes;
  if (s === undefined || Array.isArray(s)) return [];
  return s.retract ?? [];
}
/** The value a fact projects into its cell: the docs/23 §1 `supersedes.assert` override when a
 * `supersede` carries the object shape with an explicit `assert`, else the fact's own `value`. Falls
 * back to `f.value` for every non-supersede fact and every legacy `FactId[]`-shaped supersede, so it
 * is a pure identity for the frozen fixtures. */
function effectiveAssertValue(f: Fact): PropValue | undefined {
  const s = f.supersedes;
  if (f.type === "supersede" && s !== undefined && !Array.isArray(s) && s.assert !== undefined) {
    return s.assert;
  }
  return f.value;
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
      const aInputs = new Set(supersedeInputCids(a));
      const overlaps = supersedeInputCids(b).some((id) => aInputs.has(id));
      if (!overlaps) continue;
      if (valuesEqual(effectiveAssertValue(a), effectiveAssertValue(b))) continue; // identical outcome — idempotent, no conflict
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
  excisedOids: ReadonlySet<string> = new Set(),
  oidByFact: ReadonlyMap<Fact, string> = new Map(),
  excisions: readonly ExcisionRecord[] = [],
  demotedFacts: ReadonlySet<Fact> = new Set(),
): CellSegment[] {
  // M3/T4.6, fix #2: an excised fact is excluded from BOTH partitions unconditionally, keyed by its
  // OWN REAL content oid (never the caller-declared `f.id` — two admitted facts can legitimately
  // share a declared id with DIFFERENT content, see this file's excision doc comment above) — never
  // a candidate assert/retract regardless of whether its bytes still happen to be locally present.
  const isExcised = (f: Fact): boolean => {
    const oid = oidByFact.get(f);
    return oid !== undefined && excisedOids.has(oid);
  };
  // M8 value-trust overlay (docs/50 §8.1, docs/22 §7.3): a fact `proj` DEMOTES untrusted/quarantined/
  // pending (unauthorized key, out-of-namespace, revoked, malformed/forward `causedBy`, or a per-key
  // anachronistic backdate — all set-pure, author-HLC keyed, computed once per `proj()` in
  // `computeValueTrust`) never wins a cell as a trusted `value` head, and (as a retract) never removes
  // a trusted assert's coverage. It is excluded from the winner pick here exactly as an excised fact
  // is — surfaced as `unknown` (or, when it was the cell's only cover / the node's existence, a
  // `null` node), never silently trusted, never silently dropped (N5): it stays an admitted member.
  const isDemoted = (f: Fact): boolean => demotedFacts.has(f);
  const asserts = facts.filter((f) => f.type !== "retract" && !isExcised(f) && !isDemoted(f));
  const retracts = facts.filter((f) => f.type === "retract" && !isExcised(f) && !isDemoted(f));

  const pointsSet = new Set<bigint>(extraBreakpoints);
  for (const f of facts) {
    pointsSet.add(canon(f.validFrom));
    if (f.validTo !== null && f.validTo !== undefined) pointsSet.add(canon(f.validTo));
  }
  for (const ex of excisions) {
    pointsSet.add(canon(ex.validFrom));
    if (ex.validTo !== null && ex.validTo !== undefined) pointsSet.add(canon(ex.validTo));
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

    const coveringAll = asserts.filter((f) => covers(f, a, b));
    // docs/23 §1 supersede `retract` (interval-close): a `supersede` covering THIS sub-interval that
    // names facts in its `retract` list closes those facts' interval HERE — they are removed from the
    // pick over exactly the span the supersede covers, so the supersession invalidates the named
    // input even when that input would otherwise win by `orderKey`-max (a higher-`orderKey` stale
    // assert). Empty for legacy `FactId[]`-shaped supersedes, so the frozen fixtures fold unchanged.
    let covering = coveringAll;
    const retractedHere = new Set<FactId>();
    for (const f of coveringAll) {
      if (f.type !== "supersede") continue;
      for (const id of supersedeRetractIds(f)) retractedHere.add(id);
    }
    if (retractedHere.size > 0) covering = coveringAll.filter((f) => !retractedHere.has(f.id));
    if (covering.length === 0) {
      // M3/T4.7: no LIVE covering assert — but if THIS replica's own local excision memory has a
      // (confirmed-currently-absent, see `ExcisionRecord`'s doc comment) record covering this exact
      // sub-interval, surface the typed `"excised"` placeholder instead of a bare `"unknown"`, so a
      // reader can tell "nothing was ever here" apart from "something was here and was erased".
      const excisedCovering = excisions.filter((ex) => coversInterval(ex, a, b));
      if (excisedCovering.length > 0) {
        // Deterministic (content-based, never array/ingest-order-based) pick when multiple excised
        // records happen to cover the same sub-interval.
        const excisedRec = [...excisedCovering].sort((x, y) =>
          x.excisedFactId < y.excisedFactId ? -1 : x.excisedFactId > y.excisedFactId ? 1 : 0,
        )[0];
        segments.push({
          kind: "excised",
          validFrom,
          validTo,
          excisedFactId: excisedRec.excisedFactId,
          ...(excisedRec.excisedReason !== undefined ? { excisedReason: excisedRec.excisedReason } : {}),
        });
        continue;
      }
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
    const distinctValues = new Set(tiedMax.map((f) => JSON.stringify(deepSortKeys(effectiveAssertValue(f) ?? null))));
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
    // INV-3 totality: a malformed supersede (object-shaped, no `inputCids` key-set — see
    // `isMalformedSupersede`) that would otherwise WIN this sub-interval is quarantined rather than
    // passed through as a trusted `value`, so it is surfaced (never a silent no-op) without ever
    // fabricating a value. The `.some()`/retract folds above are already total for it.
    if (isMalformedSupersede(winner)) {
      segments.push({ kind: "quarantine", validFrom, validTo, assertedBy: winner.id, v: winner.v, reason: "malformed-supersede" });
      continue;
    }
    segments.push({ kind: "value", value: effectiveAssertValue(winner) ?? null, validFrom, validTo, assertedBy: winner.id });
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

/**
 * T5.4 (FR-C2/NFR-F4): true iff an entity's already-folded, merged existence-cell `segments` (e.g.
 * `computeEdgeExistSegments`'s output, the SAME `reduceRawCell` + `mergeAdjacent` fold `getEdge`/
 * `getNode` use for their OWN "no ghost nodes" existence-gating, `gateByExistence` above) resolve to
 * a truthy `"value"` segment AT a given instant — i.e. does this entity actually exist THEN, not
 * merely "did an existence fact ever get ingested for it at all" (the `!edgeView`/`!node` null-check
 * `traverse()` already did, which only catches "never existed", never "expired/retracted by now").
 *
 * `at === null` means the LIVE (no-`asOf`) reading of "right now": this projection has no wall
 * clock — `validFrom`/`validTo` are opaque HLC-or-time values, never sampled against `Date.now()`
 * anywhere in this module — so the only sound, deterministic notion of "current" is the OPEN tail
 * segment `reduceRawCell`'s sweep always produces for the interval past the highest breakpoint
 * (`validTo === null`, i.e. whatever the most-recently-known state is, extended forward with no
 * further recorded change). `segments` is already sorted ascending by `validFrom` (the sweep's own
 * `points` array is sorted, `reduceRawCell`), so that tail is always the LAST element.
 *
 * `at` a `canon`-ed instant means the `asOf({validTime})` reading: the (at most one, segments are
 * non-overlapping) segment whose half-open `[validFrom, validTo)` covers `at` — the identical
 * half-open convention `index.ts`'s `segmentCoversInstant` uses for prop-cell narrowing, duplicated
 * here (not imported) because `index.ts` imports RUNTIME values (`proj`/`traverse`/`canon`) from
 * THIS module — importing back would be a circular runtime dependency, not merely a type-only one.
 */
function existsAtInstant(segments: readonly CellSegment[], at: bigint | null): boolean {
  const covering =
    at === null
      ? segments[segments.length - 1]
      : segments.find((seg) => {
          if (canon(seg.validFrom) > at) return false;
          if (seg.validTo === null) return true;
          return canon(seg.validTo) > at;
        });
  return covering?.kind === "value" && isTruthyExistence(covering.value);
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
  excisedOids: ReadonlySet<string>,
  oidByFact: ReadonlyMap<Fact, string>,
  excisions: readonly ExcisionRecord[],
  demotedFacts: ReadonlySet<Fact> = new Set(),
): CellSegment[] {
  const ref = resolveCellReducer(cellReducers, cellKey);
  if (ref === "lww-hlc") {
    return gateByExistence(
      reduceRawCell(facts, existBreakpoints, factsById, collidedIds, knownMaxVersion, excisedOids, oidByFact, excisions, demotedFacts),
      existSegments,
    );
  }
  // `gsetReducer`/`pncounterReducer` are typed `CellReducer<PropValue[]>`/`CellReducer<number>`
  // (cell-reducers.ts) — `NodeView`/`EdgeView.props` is `Record<PropKey, PropCell>` (`PropCell<V>`
  // defaulting to `PropCell<PropValue>`, index.ts). `pncounter`'s `number` already IS a `PropValue`
  // so needs no cast; `gset`'s `PropValue[]` (an array of tag-distinct member values) is not itself
  // a member of the `PropValue` union — a KNOWN, documented type-level widening (never a runtime
  // data-shape lie: the actual array value is exactly what SPEC.md §3.4's "union" resolution names)
  // rather than inventing a broader `PropValue` union just to satisfy the type checker here; see
  // this task's disputes.
  // Same unconditional excised-fact exclusion `reduceRawCell` applies for the default `lww-hlc`
  // sweep (see this file's excision doc comment), keyed by real oid (fix #2) — a non-default
  // `CellReducer` must never see an excised fact's content either.
  const nonExcisedFacts = facts.filter((f) => {
    if (demotedFacts.has(f)) return false;
    const oid = oidByFact.get(f);
    return oid === undefined || !excisedOids.has(oid);
  });
  const raw = reducerFor(ref).reduce(nonExcisedFacts) as unknown as CellSegment[];
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
  /** T3.3 (docs/23 §5 mechanism #2): is node `eid` still LIVE-VISIBLE at `at` (`null` = live
   * "now")? The seam a LIVE (default) read uses to drop a logically-tombstoned entity from default
   * reads. It returns `false` ONLY when the entity is CLEANLY gone at `at` — its covering existence
   * segment is `unknown`/`excised` (a `retract` that closed/split the valid-time tail, i.e. the
   * tombstone), or no non-retract existence assert exists at all (a ghost node `getNode` already
   * nulls). It deliberately returns `true` for a `conflict`/`quarantine` existence segment (an
   * UNRESOLVED dispute that must still surface as a view, e.g. `KIP_CONFLICT_KIND`, never be
   * silently swallowed as an absence) and for an asserted `value` segment. A historical
   * `asOf({validTime})` BEFORE the tombstone reads through the validTime lens, not this gate, so it
   * still reconstructs the entity. */
  nodeLiveVisibleAt(eid: EID, at: bigint | null): boolean;
  /** Deterministic (sorted) list of edge EIDs touching `eid` in the given direction — the seam
   * `traverse` (below) uses for bounded typed BFS/DFS (T2.7). */
  edgesTouching(eid: EID, direction: "out" | "in" | "both"): EID[];
  /** T5.4 (FR-C2/NFR-F4): is edge `eid` valid AT `at` (`null` = live "now")? The seam `traverse`
   * (below) uses to gate BOTH whether an edge is crossed and whether it counts toward
   * `spec.maxFanout` — never crossing, and never fanout-charging, an edge that is not valid at the
   * query instant. */
  edgeValidAt(eid: EID, at: bigint | null): boolean;
  /** READ-ONLY citation seam (docs/design/kip-graph-qa.md §3.2/§4): the `FactId` of the winning
   * edge-existence assert backing `getEdge(eid)`'s `EdgeView` at `at` (`null` = live "now"), or
   * `null` when no edge is valid there. Winner selection is IDENTICAL to `getEdge`'s `kindWinner`
   * — the SAME `demotedFacts` (M8 trust) exclusion + `maxByOrderKey` content-tiebreak — so the
   * returned id can never denote a demoted/untrusted fact, nor a fact other than the one `getEdge`
   * projects. The edge analogue of a node-prop `PropCell` value segment's `assertedBy`. */
  edgeExistenceFactId(eid: EID, at: bigint | null): FactId | null;
  /** READ-ONLY (ADR-B11c/D-66): the sorted `same_as` equivalence class of `eid` — every EID this proj
   * folds into `eid`'s union-find class (the reflexive/symmetric/transitive closure over signed
   * `same_as` edges), or `[eid]` when `eid` participates in no `same_as` edge. Reuses the SAME
   * already-computed class members the canonical-EID node-merge is derived from (no second closure), so
   * it is a pure function of the admitted set (byte-identical across any `same_as` permutation,
   * INV-A11(a)). The retrieval-layer prop-union seam: enumerate a seed's class, then read EACH member's
   * OWN cells via `getNodeRaw`. proj's node-merge READ semantics (canonical-only `getNode`) are
   * UNCHANGED — this only EXPOSES the closure, it does not alter it. */
  sameAsClass(eid: EID): EID[];
  /** READ-ONLY (ADR-B11c/D-66): `eid`'s OWN projected `NodeView` — the per-EID cells `getNode` reduces
   * BEFORE `same_as` canonical resolution — or `null` for a ghost/absent eid. Identical to `getNode`
   * for every eid that is NOT a non-canonical `same_as` alias; for such an alias it returns the alias's
   * OWN props, which `getNode` MASKS behind the canonical member's cells (see `getNode` below). The seam
   * the graph-qa prop-union reads so each `same_as` member contributes its OWN facts + `assertedBy`
   * `FactId`s — nothing merged, citations stay per-fact. Does NOT apply the `not_same_as` conflict
   * marker (that stays a `getNode`-only read semantic). */
  getNodeRaw(eid: EID): NodeView | null;
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
/**
 * `hashAlgo`/`trustedExciseKeys`/`isRegisteredFingerprint` feed `collectExcisions`'s excision fold
 * (see its own doc comment) — the excised/unknown decision is a pure function of `facts` alone,
 * plus this deliberately-per-replica-configurable trust escape hatch, in the SAME documented
 * category as `knownMaxVersion`/`cellReducers` below.
 */
export interface ProjOptions {
  knownMaxVersion?: number;
  cellReducers?: CellReducerAssociations;
  hashAlgo?: HashAlgo;
  trustedExciseKeys?: ReadonlySet<string>;
  isRegisteredFingerprint?: (fingerprint: string) => boolean;
  /**
   * See `collectExcisions`'s doc comment (CASE 2) and `SelfWitnessedExcisionRecord`'s own doc
   * comment: the real content oids THIS verifying replica's OWN `excise()` calls have themselves,
   * locally, already verified authorization for (never populated from anything received over
   * `sync()`), each mapped to the geometry this replica itself captured off the real candidate at
   * that same mint time. Keying by `Map<oid, SelfWitnessedExcisionRecord>` means the geometry used
   * is always this replica's OWN locally-captured truth, never any marker's payload — lets a
   * replica's own legitimate self-excision still resolve to a typed `"excised"` placeholder once
   * the bytes are gone from `facts` (the "target absent" case every `excise()` call's own
   * subsequent re-fold hits), without trusting a marker's self-declared payload for that same case
   * when it comes from an unrecognized third party. Defaults to empty — a direct unit-test call to
   * `proj()` with no such context supplied then only honors an explicit `trustedExciseKeys`
   * fingerprint for an absent target (see `collectExcisions`'s CASE 2).
   */
  selfWitnessedExcisionOids?: ReadonlyMap<string, SelfWitnessedExcisionRecord>;
  /**
   * M8 value-trust overlay (docs/50 §8.1, docs/22 §3.6/§7.3): when supplied, `proj` DEMOTES (excludes
   * from trusted `/heads`, surfaces as `unknown`/`null`, never drops from membership) every admitted
   * fact that fails a set-pure, author-HLC-keyed trust question — unregistered/unauthorized key,
   * out-of-namespace write, revoked-by-cutoff, malformed/forward `causedBy`, or a per-key
   * chain-anachronistic backdate. See `computeValueTrust`. Omitted (undefined) ⇒ NO demotion (every
   * admitted fact projects as before) — the M0–M7 behaviour, so a direct `proj()` call with no trust
   * context supplied is unchanged.
   */
  valueTrust?: ValueTrustOptions;
}

/**
 * Per-replica trust CONFIG the value-trust overlay reads in addition to set-resident quantities — in
 * the SAME documented "may legitimately differ by replica" category as `knownMaxVersion`/`trustedExciseKeys`
 * (see `collectExcisions`'s doc comment). The trust DECISION itself is set-pure (a function of the
 * admitted fact bytes keyed on author-HLC); this only pins WHICH fingerprints are genesis roots.
 */
export interface ValueTrustOptions {
  /** True iff `fpr` is a genesis root of trust (docs/50 §8.1 "root of trust"). A `KeyAuthorization`
   * grants authority only if its `authorizedBy` chains to a genesis root at the key-add's author-HLC.
   * The genesis root set is EXCLUSIVELY the manifest-pinned `rootKeyFingerprints` (index.ts) — NEVER a
   * fingerprint string prefix or naming convention (round-2 finding F1: a string-prefix root is
   * forgeable via the live placeholder-signature ingest seam). */
  isGenesisRoot: (fpr: string) => boolean;
}

// ---------------------------------------------------------------------------
// M8 — the value-trust overlay (docs/50 §8.1, docs/22 §3.4/§3.6/§7.3, docs/24 C2-1).
//
// A SET-PURE function of the admitted set `S`, keyed on each fact's own signed AUTHOR-HLC (NEVER
// rxFrom / receiver clock / replica-local mutable state), so two replicas holding the same `S`
// compute byte-identical demotions ⇒ byte-identical `/heads`. It answers, for every admitted DATA
// fact, "does this fact project TRUSTED?" — the SAME shape as the M3 excision-authorization predicate
// (`registeredFingerprintsInSet` + `collectExcisions`), applied to VALUE cells rather than excision.
//
// The §8.1 KeyAuthorization / KeyRevocation carriers are modeled (fixtures-m8 MODELING CONVENTIONS #2)
// as ordinary signed facts with `target.kind === "key"` carrying the normative field set JSON-encoded
// in `value` (`type:"assert"` for a KeyAuthorization, `type:"revoke-key"` for a KeyRevocation).
// ---------------------------------------------------------------------------

interface KeyAuthPayload {
  keyFpr: string;
  namespaces: readonly string[];
  ops: readonly string[];
  authorizedBy: string;
  effectiveFrom: bigint;
}
interface KeyRevPayload {
  keyFpr: string;
  effectiveFrom: bigint;
  mode: "ordinary-cutoff" | "causal-cutoff";
}

function isKeyTarget(f: Fact): boolean {
  return f.target.kind === "key";
}

/** The namespace an EID belongs to (`<namespace>/<local>`, docs/21 §3.6). `null` for a non-namespaced
 * target (never a data fact). */
function namespaceOfFact(f: Fact): string | null {
  const t = f.target;
  let eid: string | undefined;
  if (t.kind === "node" || t.kind === "node-prop") eid = t.eid;
  else if (t.kind === "edge" || t.kind === "edge-prop") eid = t.eid;
  if (eid === undefined) return null;
  const slash = eid.indexOf("/");
  return slash < 0 ? eid : eid.slice(0, slash);
}

/** A DATA fact whose trust the overlay governs (a node/edge existence or property assertion). Key-
 * management (`target.kind === "key"`) and control/excision facts are not value cells. */
function isDataFact(f: Fact): boolean {
  const k = f.target.kind;
  return k === "node" || k === "node-prop" || k === "edge" || k === "edge-prop";
}

function parseKeyAuth(f: Fact): KeyAuthPayload | null {
  if (!isKeyTarget(f)) return null;
  if (f.type === "revoke-key") return null;
  if (typeof f.value !== "string" || f.value.length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(f.value);
  } catch {
    return null;
  }
  if (!isPlainRecord(parsed)) return null;
  if (typeof parsed.keyFpr !== "string") return null;
  if (!Array.isArray(parsed.namespaces)) return null;
  if (!Array.isArray(parsed.ops)) return null;
  if (typeof parsed.authorizedBy !== "string") return null;
  if (parsed.effectiveFrom === undefined || parsed.effectiveFrom === null) return null;
  return {
    keyFpr: parsed.keyFpr,
    namespaces: parsed.namespaces.filter((n): n is string => typeof n === "string"),
    ops: parsed.ops.filter((o): o is string => typeof o === "string"),
    authorizedBy: parsed.authorizedBy,
    effectiveFrom: canon(parsed.effectiveFrom as HlcOrTime),
  };
}

function parseKeyRev(f: Fact): KeyRevPayload | null {
  if (f.type !== "revoke-key") return null;
  if (!isKeyTarget(f)) return null;
  if (typeof f.value !== "string" || f.value.length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(f.value);
  } catch {
    return null;
  }
  if (!isPlainRecord(parsed)) return null;
  if (typeof parsed.keyFpr !== "string") return null;
  if (parsed.effectiveFrom === undefined || parsed.effectiveFrom === null) return null;
  const mode = parsed.mode === "causal-cutoff" ? "causal-cutoff" : "ordinary-cutoff";
  return { keyFpr: parsed.keyFpr, effectiveFrom: canon(parsed.effectiveFrom as HlcOrTime), mode };
}

/**
 * The set-pure value-trust fold. Returns the set of admitted facts `proj` must DEMOTE (exclude from
 * trusted `/heads`).
 *
 * TRUST IS CONFERRED ONLY BY AUTHORIZATION FACTS IN `S` + THE MANIFEST-PINNED ROOT SET — never by any
 * fingerprint naming pattern (round-2 findings: `isModeledManagedKey`/`genesis-root`-prefix DELETED).
 * The model (docs/50 §8.1):
 *   • A namespace `N` is TRUST-GOVERNED iff `S` holds a genesis-root-chained `KeyAuthorization` scoping
 *     `N`. In a governed namespace, EVERY data fact must PROVE authority (a covering genesis-root-
 *     chained `KeyAuthorization`, or a genesis-root self-write) — a signer lacking one is demoted
 *     regardless of its fingerprint shape or whether it produced a real signature. This generalizes to
 *     ANY real (SHA-256) fingerprint: admission ≠ trust.
 *   • A namespace with NO authority regime is UN-GOVERNED and stays legacy-trusted (the pre-M8 default
 *     that keeps M0–M7 green and satisfies INV-1: an unkeyed fact in an un-governed namespace projects
 *     a value head). The demotion "activates" per-namespace once a real genesis-root-chained authority
 *     fact for that namespace exists in `S` — a set-resident distinguisher real in production, not a
 *     name (see this milestone's `disputes` for the frozen-fixture governance corrections).
 * See the per-rule comments below.
 */
export function computeValueTrust(
  facts: readonly Fact[],
  opts: ValueTrustOptions,
  factsById: ReadonlyMap<FactId, Fact>,
  collidedIds: ReadonlySet<FactId>,
  /** A-1: per-`(replicaId,key)` chain slots (`attestedHoleKey`) satisfied by a present, authorized
   * excision marker — Rule D(i)'s chain-completeness gate treats these as filled, not gaps, so a
   * physically-excised mid-chain slot does not brick every later same-key fact to `pending` forever
   * (docs/22 §3.6 step (i)). Defaults to empty (no attested holes ⇒ the pre-A-1 behaviour). */
  attestedHoles: ReadonlySet<string> = new Set<string>(),
): ReadonlySet<Fact> {
  const { isGenesisRoot } = opts;

  // ---- 1. Trusted KeyAuthorizations (author-HLC-keyed genesis-root chaining, §8.1). ---------------
  // A KeyAuthorization is trusted iff the key it names as `authorizedBy` (a) SIGNED it (the delegating
  // key actually authored the delegation) and (b) chains to a genesis root at this key-add's own
  // author-HLC. Genesis roots are authorizers by definition; a key becomes a further authorizer only
  // via a trusted KeyAuthorization that granted it `delegate`. A monotone fixpoint over `S`.
  const kaFacts = facts.filter((f) => parseKeyAuth(f) !== null);
  const trustedKA = new Set<Fact>();
  const delegators = new Set<string>(); // non-root keys that hold a trusted `delegate` authorization
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of kaFacts) {
      if (trustedKA.has(f)) continue;
      const ka = parseKeyAuth(f) as KeyAuthPayload;
      const signer = f.provenance.publicKeyFingerprint;
      // The delegating key must itself have signed the authorization it claims to grant.
      if (signer !== ka.authorizedBy) continue;
      const authorizerTrusted = isGenesisRoot(ka.authorizedBy) || delegators.has(ka.authorizedBy);
      if (!authorizerTrusted) continue;
      trustedKA.add(f);
      if (ka.ops.includes("delegate") && !delegators.has(ka.keyFpr)) {
        delegators.add(ka.keyFpr);
        grew = true;
      }
    }
  }

  // Authorization intervals per key: namespace(s) + ops + effectiveFrom, from trusted KAs only.
  const authsByKey = new Map<string, KeyAuthPayload[]>();
  for (const f of trustedKA) {
    const ka = parseKeyAuth(f) as KeyAuthPayload;
    const arr = authsByKey.get(ka.keyFpr);
    if (arr) arr.push(ka);
    else authsByKey.set(ka.keyFpr, [ka]);
  }
  // The set of namespaces that are TRUST-GOVERNED (some trusted KA scopes them). A key writing a
  // GOVERNED namespace without covering authority is demoted; an UNGOVERNED namespace with no
  // authority context at all is legacy-trusted (the pre-M8 default that keeps M0–M7 green).
  const governedNamespaces = new Set<string>();
  for (const arr of authsByKey.values()) for (const ka of arr) for (const ns of ka.namespaces) governedNamespaces.add(ns);

  // Every fingerprint the set names as the SUBJECT (`keyFpr`) of ANY KeyAuthorization — trusted OR
  // not (e.g. a forger's self-signed KA, INV-10) — so its facts enter the trust overlay (an untrusted
  // KA still marks the key as PKI-managed: it must prove authority, not default-trust).
  const keysNamedByKeyMgmt = new Set<string>();
  for (const f of kaFacts) {
    const ka = parseKeyAuth(f) as KeyAuthPayload;
    keysNamedByKeyMgmt.add(ka.keyFpr);
  }

  // ---- 2. Revocations (honored ONLY from an AUTHORIZED revoker; demote per mode). -----------------
  // §8.1: a `revoke-key` is effective iff its author holds `revoke` scope chaining to the genesis root
  // (`KeyRevocation.revokedBy` "must hold revoke scope (chains to genesis root)"). A revocation whose
  // signer is NOT a genesis root and holds NO trusted `revoke`-scoped `KeyAuthorization` covering the
  // target key's namespace(s) is UNAUTHORIZED — it is itself demoted-untrusted (INV-10) and confers no
  // demotion, closing the censorship/DoS vector where any signature-valid `revoke-key` could demote a
  // victim key's trusted `/heads`. Set-pure: reads only trusted-KA scopes + author-HLCs in `S`.
  //
  // The revoker's authority is checked at the REVOKE fact's own author-HLC. `revoke` scope must cover a
  // namespace the target key is (or was) authorized to write; when the target has no trusted KA at all
  // (an already-unauthorized key), any genesis-root-chained `revoke` scope suffices. A revoke by a
  // genesis root is always authorized (the root of every revocation chain).
  function revokerAuthorized(revokeFact: Fact, targetKeyFpr: string, revokeHlc: bigint): boolean {
    const revoker = revokeFact.provenance.publicKeyFingerprint;
    if (isGenesisRoot(revoker)) return true;
    const revokeScopes = (authsByKey.get(revoker) ?? []).filter(
      (a) => a.ops.includes("revoke") && a.effectiveFrom <= revokeHlc,
    );
    if (revokeScopes.length === 0) return false;
    const targetNamespaces = new Set<string>();
    for (const a of authsByKey.get(targetKeyFpr) ?? []) for (const ns of a.namespaces) targetNamespaces.add(ns);
    if (targetNamespaces.size === 0) return true; // target has no known authorized scope ⇒ revoke scope suffices
    return revokeScopes.some((a) => a.namespaces.some((ns) => targetNamespaces.has(ns)));
  }

  const revsByKey = new Map<string, Array<{ effFrom: bigint; mode: "ordinary-cutoff" | "causal-cutoff"; revokeFact: Fact }>>();
  for (const f of facts) {
    const rev = parseKeyRev(f);
    if (!rev) continue;
    if (!revokerAuthorized(f, rev.keyFpr, canon(f.hlc))) continue; // unauthorized revoker ⇒ ignored (demoted)
    const arr = revsByKey.get(rev.keyFpr) ?? [];
    arr.push({ effFrom: rev.effectiveFrom, mode: rev.mode, revokeFact: f });
    revsByKey.set(rev.keyFpr, arr);
  }

  // ---- 3. Per-key chains (for the anti-backdating chain-completeness gate + monotonicity). --------
  // Keyed by `(Fact.replicaId, signer)` — the §4b.1 per-`(replicaId,key)` contiguity chain. Each chain
  // tracks which `seq`s are present (completeness) and the facts on it (backdate detection).
  const chainSeqs = new Map<string, Set<number>>();
  const factsByKey = new Map<string, Fact[]>();
  // Chain-completeness (docs/24) counts the FULL per-(replicaId,key) seq chain — ALL fact types, incl.
  // KeyAuthorization/revoke-key the key authored on its OWN chain (round-2 finding F2) — never data-only,
  // which would leave a phantom gap and demote a delegate's honest data fact `pending` forever.
  for (const f of facts) {
    const signer = f.provenance.publicKeyFingerprint;
    const chainKey = `${f.replicaId} ${signer}`;
    const seqs = chainSeqs.get(chainKey) ?? new Set<number>();
    seqs.add(f.seq);
    chainSeqs.set(chainKey, seqs);
    const byKey = factsByKey.get(signer) ?? [];
    byKey.push(f);
    factsByKey.set(signer, byKey);
  }

  const demoted = new Set<Fact>();

  for (const f of facts) {
    if (!isDataFact(f)) continue;
    const signer = f.provenance.publicKeyFingerprint;
    const ns = namespaceOfFact(f);
    const h = canon(f.hlc);

    // ---- Governance gate -- WHICH facts the value-trust overlay evaluates at all. -----------------
    // A fact is UNDER TRUST GOVERNANCE (the overlay applies) iff (a) its namespace is governed by a
    // trusted, genesis-root-chained KeyAuthorization, OR (b) its signing key is itself named as the
    // SUBJECT of a KeyAuthorization (trusted or not) -- a key someone tried to authorize is in the PKI
    // regime and must PROVE authority (INV-10 forged-authorizer / out-of-namespace). Both disjuncts are
    // purely SET-DERIVED from authorization facts in `S` -- there is NO fingerprint-naming gate. A fact
    // in a namespace with no authority regime AND whose key is no KA subject is a LEGACY fact (no PKI in
    // play) and stays trusted (the pre-M8 default that keeps the M0-M7 suite green and satisfies INV-1;
    // the M8 fixtures establish REAL governance so their unauthorized keys demote -- see `disputes`).
    const governed = (ns !== null && governedNamespaces.has(ns)) || keysNamedByKeyMgmt.has(signer);
    if (!governed) continue; // un-governed legacy fact -- trusted, overlay does not apply

    // ---- Rule A: key authorization (author-HLC keyed, §8.1 / docs/22 §7.3). -----------------------
    // In a governed namespace TRUST FLOWS ONLY FROM AUTHORIZATION FACTS: a data fact is trusted iff a
    // trusted (genesis-root-chained) KeyAuthorization for its key covers this namespace with `write` at
    // an effectiveFrom <= the fact's author-HLC, OR the signer is itself a genesis root writing its own
    // tenant (the root of every authority chain). Anything else -- an unchained key (INV-10), an out-of-
    // namespace write (INV-10), or a wholly-unregistered key (INV-6/13/18) -- is DEMOTED regardless of
    // its fingerprint shape or whether it produced a real Ed25519 signature. There is NO `isRegistered`
    // self-trust escape hatch: a freshly-minted real key CANNOT self-authorize into a governed namespace
    // (round-2 finding: admission != trust, and the demotion must generalize to any real fingerprint).
    const auths = authsByKey.get(signer) ?? [];
    const kaAuthorized = auths.some(
      (a) => a.effectiveFrom <= h && a.ops.includes("write") && ns !== null && a.namespaces.includes(ns),
    );
    const authorized = kaAuthorized || isGenesisRoot(signer);
    if (!authorized) {
      demoted.add(f);
      continue;
    }

    // ---- Rule B: revocation cutoff (author-HLC keyed, M4-1). --------------------------------------
    const revs = revsByKey.get(signer) ?? [];
    let revoked = false;
    for (const r of revs) {
      if (h >= r.effFrom) {
        revoked = true; // ordinary AND causal both demote author-HLC ≥ effectiveFrom
        break;
      }
      if (r.mode === "causal-cutoff") {
        // causal-cutoff ALSO demotes pre-effectiveFrom facts that are NOT causal ancestors of the
        // revoke fact (honest-concurrent casualties, surfaced-not-dropped, INV-17). A fact IS an
        // ancestor of the revoke iff the revoke's causedBy closure reaches it. EXCEPTION: a node/edge
        // EXISTENCE fact below the cutoff is preserved — revoking a key must not un-exist (orphan) an
        // entity the key legitimately created before `effectiveFrom` (§3.6/M2-3 "the namespace is
        // never orphaned; pre-cutoff facts remain trusted"); the causal tightening bites CONTENT
        // (property/value) facts, which is where honest-concurrent VALUE casualties live.
        const isExistence = f.target.kind === "node" || f.target.kind === "edge";
        if (!isExistence && !causedByDominates(r.revokeFact, f.id, factsById, collidedIds)) {
          revoked = true;
          break;
        }
      }
    }
    if (revoked) {
      demoted.add(f);
      continue;
    }

    // ---- Rule C: causedBy well-formedness (set-pure, M4-2 / INV-15). ------------------------------
    if (f.causedBy && f.causedBy.length > 0) {
      let malformed = false;
      for (const parentId of f.causedBy) {
        const parent = factsById.get(parentId);
        if (!parent) {
          malformed = true; // dangling (parent not yet in S) ⇒ pending, never trusted
          break;
        }
        if (canon(parent.hlc) > h) {
          malformed = true; // forward edge (parent author-HLC > child) ⇒ untrusted-malformed
          break;
        }
      }
      // A cycle through `causedBy` (f reachable from its own parents) is untrusted-malformed.
      if (!malformed && causedByDominates(f, f.id, factsById, collidedIds)) malformed = true;
      if (malformed) {
        demoted.add(f);
        continue;
      }
    }

    // ---- Rule D: per-key anti-backdating, chain-completeness gated (C4-2 + C5-1 / INV-16/19). ------
    // (i) Chain-completeness gate: F projects trusted only over a complete, gap-free `seq` chain of
    //     its `(replicaId, key)` up to F's own seq. A missing lower `seq` ⇒ pending (not trusted).
    const chainKey = `${f.replicaId} ${signer}`;
    const seqs = chainSeqs.get(chainKey) as Set<number>;
    const chainId = `${f.replicaId}/${signer}`;
    let chainComplete = true;
    for (let s = 0; s < f.seq; s += 1) {
      // A-1: a physically-excised slot is an ATTESTED HOLE (satisfied by its signed excision marker),
      // not a gap — so a mid-chain excise never bricks a later same-key fact to `pending` forever.
      if (!seqs.has(s) && !attestedHoles.has(attestedHoleKey(chainId, s))) {
        chainComplete = false;
        break;
      }
    }
    if (!chainComplete) {
      demoted.add(f); // pending — chain gap
      continue;
    }
    // (ii) Monotonicity demotion (involuntary footprint): F is untrusted-anachronistic iff the same
    //     key emitted, EARLIER in the chain (a strictly lower seq on the same chain), a fact stamped
    //     at a HIGHER author-HLC than F — F was authored later yet back-stamps below its own key's
    //     prior emission — and F is not a causal ancestor of that higher fact. Uses the key's
    //     INVOLUNTARY seq footprint, so it is not evadable by omitting `causedBy`.
    let anachronistic = false;
    const sameKey = factsByKey.get(signer) ?? [];
    for (const other of sameKey) {
      if (other === f) continue;
      if (other.replicaId !== f.replicaId) continue; // per-(replicaId,key) chain
      if (other.seq >= f.seq) continue; // must be EARLIER-authored in the chain (lower seq)
      if (canon(other.hlc) <= h) continue; // must be stamped strictly HIGHER (F back-dates below it)
      if (causedByDominates(other, f.id, factsById, collidedIds)) continue; // F is an ancestor of it
      anachronistic = true;
      break;
    }
    if (anachronistic) {
      demoted.add(f);
      continue;
    }
  }

  return demoted;
}

export function proj(facts: readonly Fact[], options?: ProjOptions): ProjResult {
  const knownMaxVersion = options?.knownMaxVersion ?? 1;
  const cellReducers = options?.cellReducers;
  const hashAlgo: HashAlgo = options?.hashAlgo ?? "sha1";
  const trustedExciseKeys = options?.trustedExciseKeys ?? new Set<string>();
  // No `isRegisteredFingerprint` supplied means this caller has no key-registry context at all
  // (e.g. a direct unit-test call to `proj()`) — conservatively treat every fingerprint as
  // "unregistered", which (per `isAuthorizedExcisionMarker`'s rule (c)) is the PERMISSIVE default,
  // matching round-1's own unconditional-honor behavior for such callers.
  const isRegisteredFingerprint = options?.isRegisteredFingerprint ?? (() => false);
  const selfWitnessedExcisionOids = options?.selfWitnessedExcisionOids ?? new Map<string, SelfWitnessedExcisionRecord>();
  const { factsById, collidedIds } = buildFactsById(facts);
  const { excisedOids, excisionsByCell, oidByFact } = collectExcisions(
    facts,
    hashAlgo,
    isRegisteredFingerprint,
    trustedExciseKeys,
    selfWitnessedExcisionOids,
  );
  // M8 value-trust overlay (set-pure, author-HLC keyed): the set of admitted facts `proj` demotes
  // (never a trusted `/heads` cover, never a member drop). Empty when no `valueTrust` context is
  // supplied (a direct `proj()` unit-test call, or the pre-M8 read path) ⇒ no demotion.
  // A-1: the set of per-`(replicaId,key)` chain slots satisfied by a present, authorized excision
  // marker — consumed by BOTH the value-trust chain-completeness gate (below) and pin-completeness
  // (`resolvePin`, index.ts), the two gates docs/22 §3.6 step (i) names as sharing this exact rule.
  const attestedHoles = collectAttestedChainHoles(facts, isRegisteredFingerprint, trustedExciseKeys);
  const demotedFacts: ReadonlySet<Fact> = options?.valueTrust
    ? computeValueTrust(facts, options.valueTrust, factsById, collidedIds, attestedHoles)
    : new Set<Fact>();

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
  // T5.4: memoized per-edge existence-cell fold, shared between `getEdge` (which needs the full
  // segment geometry to gate its OWN props via `gateByExistence`-equivalent logic below) and
  // `edgeValidAt` (which needs the SAME fold to answer "is this edge valid at instant X", the
  // traversal-time check `traverse()` was missing entirely before this task). A single shared
  // computation, not two independent re-derivations of the same fold, so the two call sites can
  // never silently disagree on what "this edge's existence" means.
  const edgeExistSegmentsCache = new Map<EID, CellSegment[]>();
  function computeEdgeExistSegments(eid: EID): CellSegment[] {
    const cached = edgeExistSegmentsCache.get(eid);
    if (cached) return cached;
    const existFacts = byCell.get(`edge-exist:${eid}`) ?? [];
    const segments = mergeAdjacent(
      reduceRawCell(
        existFacts,
        [],
        factsById,
        collidedIds,
        knownMaxVersion,
        excisedOids,
        oidByFact,
        excisionsByCell.get(`edge-exist:${eid}`) ?? [],
        demotedFacts,
      ),
    );
    edgeExistSegmentsCache.set(eid, segments);
    return segments;
  }

  /** T5.4 (FR-C2/NFR-F4): is edge `eid` valid AT `at` (`null` = live "now", see `existsAtInstant`'s
   * doc comment)? An edge with NO existence facts at all (never ingested) folds to an empty
   * `segments` array, for which `existsAtInstant` returns `false` — matching `getEdge` returning
   * `null` for the same edge, never a fabricated `true`. */
  function edgeValidAt(eid: EID, at: bigint | null): boolean {
    return existsAtInstant(computeEdgeExistSegments(eid), at);
  }

  /** docs/design/kip-graph-qa.md §3.2/§4 — the signed edge `FactId` an edge citation binds to.
   * Reuses `getEdge`'s EXACT existence-winner selection (`existFacts` minus `retract` AND
   * `demotedFacts`, then `maxByOrderKey`'s content-tiebroken winner), gated on the same
   * `edgeValidAt(at)` predicate `getEdge`/`traverse` apply — so it returns the identical fact
   * `getEdge`'s `EdgeView` projects and never a demoted/untrusted or historical (not-yet-valid) id.
   * Set-pure over `proj`; authors nothing. */
  function edgeExistenceFactId(eid: EID, at: bigint | null): FactId | null {
    if (!edgeValidAt(eid, at)) return null;
    const existFacts = byCell.get(`edge-exist:${eid}`) ?? [];
    const assertOnlyExist = existFacts.filter((f) => f.type !== "retract" && !demotedFacts.has(f));
    if (assertOnlyExist.length === 0) return null;
    return maxByOrderKey(assertOnlyExist).winner.id;
  }

  function getNodeRaw(eid: EID): NodeView | null {
    if (nodeViewCache.has(eid)) return nodeViewCache.get(eid) ?? null;
    const existFacts = byCell.get(`node-exist:${eid}`) ?? [];
    // "No ghost nodes" (m2-2): a node-prop fact with no corresponding node-existence ASSERT ever
    // ingested MUST project to `null`, never a propertied-but-nonexistent view. MINOR FIX: this
    // must exclude `retract`-type existence facts from the "has existence facts at all" count — a
    // node for which only a `retract` was ever ingested (no positive assert ever existed) has NO
    // asserted existence to gate props against either, and previously fell through to
    // `existFacts[0]` (a retract, whose `target.nodeKind` is typically absent) as `kindWinner`,
    // fabricating a `kind: ""` ghost view instead of returning `null`.
    // A node whose ONLY existence asserts are DEMOTED (untrusted/pending, M8) has no TRUSTED existence
    // to gate props against — it projects `null`, exactly like a node whose only existence fact is a
    // `retract` (fixtures-m8 MODELING CONVENTIONS #3: "a demoted existence fact ⇒ getNode returns null").
    if (existFacts.filter((f) => f.type !== "retract" && !demotedFacts.has(f)).length === 0) {
      nodeViewCache.set(eid, null);
      return null;
    }
    const existSegments = mergeAdjacent(
      reduceRawCell(
        existFacts,
        [],
        factsById,
        collidedIds,
        knownMaxVersion,
        excisedOids,
        oidByFact,
        excisionsByCell.get(`node-exist:${eid}`) ?? [],
        demotedFacts,
      ),
    );
    const existBreakpoints = collectBreakpoints(existSegments);

    // Prop key iteration/insertion order must be a pure function of the fact SET's content (prop
    // names), never of ingest/delivery order — sorting `propKeys` before populating `props` makes
    // `NodeView.props`' key order (and therefore its JSON/`Object.keys` order) a pure function of
    // the prop name, not a `Set`'s first-encountered (ingest-order-derived) iteration order.
    const propKeySet = new Set<PropKey>();
    for (const f of facts) {
      if (f.target.kind === "node-prop" && f.target.eid === eid) propKeySet.add(f.target.prop);
    }
    // M3/T4.6: a prop cell whose ONLY covering assert was physically excised has NO live fact left
    // in `facts` to contribute its prop name above — without this, the whole cell would silently
    // vanish from `NodeView.props` instead of re-folding to `"unknown"`/`"excised"` (residue-free
    // re-fold, docs/24 §4.5, is about the CELL'S VALUE, never about the cell disappearing outright).
    for (const cellKey of excisionsByCell.keys()) {
      const prefix = `node-prop:${eid}:`;
      if (cellKey.startsWith(prefix)) propKeySet.add(cellKey.slice(prefix.length));
    }
    const propKeys = [...propKeySet].sort();

    const props: Record<PropKey, PropCell> = {};
    const latestCandidates: Fact[] = [];
    const existLatestId = latestAssertedFactId(existSegments);
    if (existLatestId) latestCandidates.push(factsById.get(existLatestId) as Fact);

    for (const prop of propKeys) {
      const propCellKey = `node-prop:${eid}:${prop}`;
      const propFacts = byCell.get(propCellKey) ?? [];
      const gated = reduceCellByRef(
        propCellKey,
        propFacts,
        existBreakpoints,
        existSegments,
        factsById,
        collidedIds,
        knownMaxVersion,
        cellReducers,
        excisedOids,
        oidByFact,
        excisionsByCell.get(propCellKey) ?? [],
        demotedFacts,
      );
      props[prop] = { segments: gated };
      const latestId = latestAssertedFactId(gated);
      if (latestId) latestCandidates.push(factsById.get(latestId) as Fact);
    }

    const assertOnlyExist = existFacts.filter((f) => f.type !== "retract" && !demotedFacts.has(f));
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

  /**
   * M5/T6.7 (INV-A6/INV-A11) — `same_as` node-merge: a deterministic equivalence CLOSURE with a
   * TOTAL canonical-EID rule (docs/31's "Intermediates and dedup are free — patent node-merge"
   * section, verbatim): treat every signed, currently-projected `same_as(a,b)` EDGE fact (an ordinary
   * `Target{kind:"edge", edgeKind:"same_as", from:a, to:b}` assert — no new FactType, no new store) as
   * an UNDIRECTED edge and fold the reflexive/symmetric/transitive closure via union-find — a pure,
   * set-resident, order-independent function of `facts` alone (byte-identical across any random
   * permutation of the same_as multiset, INV-A11(a)). Each equivalence class then projects under the
   * TOTAL, order-independent canonical EID = the class member MINIMUM by `(namespaceId, localId)`
   * byte-order (the `tenant` component is deliberately omitted, docs/31: "namespaceId is a
   * globally-unique frozen genesis fingerprint ... already total across tenants") — computed here as
   * everything after the EID's first `/` (a namespaced EID is `<tenant>/<namespaceId>/<localId>`,
   * docs/21 §1), falling back to the whole EID string when it carries no `/` at all. NO hash-tiebreak,
   * NO insertion-order pick, NO LWW — every replica folding the same admitted set picks the identical
   * canonical member.
   *
   * `not_same_as` disputed-merge conflict surfacing (INV-A11(b)) is NOT implemented here: it is
   * UNTESTABLE at M5's declared public surface (`Repo` names no read seam for an arbitrary same_as-pair
   * correction cell — see inv-a11.test.ts's own SCOPE NOTE and this task's `disputes`/`untestable`
   * output), so building it would be speculative, un-exercised machinery rather than a real seam.
   */
  const sameAsParent = new Map<EID, EID>();
  function sameAsFind(x: EID): EID {
    if (!sameAsParent.has(x)) sameAsParent.set(x, x);
    let root = x;
    while (sameAsParent.get(root) !== root) root = sameAsParent.get(root) as EID;
    let cur = x;
    while (sameAsParent.get(cur) !== root) {
      const next = sameAsParent.get(cur) as EID;
      sameAsParent.set(cur, root);
      cur = next;
    }
    return root;
  }
  function sameAsUnion(a: EID, b: EID): void {
    const ra = sameAsFind(a);
    const rb = sameAsFind(b);
    if (ra !== rb) sameAsParent.set(ra, rb);
  }
  // D-68: fold ONLY over edges whose EXISTENCE is currently LIVE, using the SAME liveness predicate
  // `getEdge`'s prop-gating, `traverse`, and `edgeExistenceFactId` all apply — `edgeValidAt(eid, null)`
  // (the edge's existence segments resolve to a TRUTHY value "now"). The pre-D-68 loop RAW-iterated
  // `same_as` asserts gated only on `f.type !== "retract"` + `isTruthyExistence`, so it folded a
  // retracted / LWW-superseded-to-falsy / M8-demoted edge forever — a `same_as` retract never
  // un-merged at READ level (the D-68 bug). Liveness now lives in ONE place (`edgeValidAt` →
  // `existsAtInstant` → `computeEdgeExistSegments`, which honours retract/demotion/LWW exactly as
  // `getEdge` does). A live edge's kind/from/to come from `getEdge`'s LWW-winner resolution, so a
  // CONFLICTED-existence edge (`getEdge` ⇒ KIP_CONFLICT_KIND) is NOT an unambiguous `same_as` and does
  // NOT silently fold a merge (conservative, consistent with `getEdge`). Iterating edge eids in SORTED
  // order (as the adjacency materialization below already does) keeps the fold byte-identical across
  // any fact permutation (INV-A11(a)) — the closure and canonical-EID min are order-independent anyway.
  for (const edgeEid of [...edgeEids].sort()) {
    if (!edgeValidAt(edgeEid, null)) continue;
    const view = getEdge(edgeEid);
    if (!view || view.kind !== "same_as") continue;
    if (!view.from || !view.to) continue;
    sameAsUnion(view.from, view.to);
  }
  function nsLocalKey(eid: EID): string {
    const slash = eid.indexOf("/");
    return slash === -1 ? eid : eid.slice(slash + 1);
  }
  const sameAsClassMembers = new Map<EID, EID[]>();
  for (const eid of sameAsParent.keys()) {
    const root = sameAsFind(eid);
    const arr = sameAsClassMembers.get(root);
    if (arr) arr.push(eid);
    else sameAsClassMembers.set(root, [eid]);
  }
  const canonicalByRoot = new Map<EID, EID>();
  for (const [root, members] of sameAsClassMembers) {
    let canonical = members[0];
    for (const m of members) {
      if (nsLocalKey(m) < nsLocalKey(canonical)) canonical = m;
    }
    canonicalByRoot.set(root, canonical);
  }
  function canonicalSameAsEid(eid: EID): EID {
    if (!sameAsParent.has(eid)) return eid;
    return canonicalByRoot.get(sameAsFind(eid)) ?? eid;
  }
  /** ADR-B11c/D-66: the sorted members of `eid`'s `same_as` equivalence class (reusing the
   * ALREADY-computed `sameAsClassMembers` above — no second closure), or `[eid]` when `eid` is in no
   * `same_as` edge. A pure function of the folded closure; the ONLY new proj surface for the
   * retrieval-layer prop-union (ADR-B11c). Merge semantics are untouched. */
  function sameAsClass(eid: EID): EID[] {
    if (!sameAsParent.has(eid)) return [eid];
    const members = sameAsClassMembers.get(sameAsFind(eid)) ?? [eid];
    return [...members].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  /**
   * MAJOR FIX (round 2, finding #5, INV-A11(b)) — `not_same_as` disputed-merge conflict: docs/31
   * (verbatim): "A signed not_same_as(a,b) contradicting a derived a~b surfaces a kip:conflict on a
   * keyed correction cell for the disputed pair, canonicalized to the ordered pair (min, max)."
   *
   * Round 1 left this entirely unimplemented (documented `it.skip`). This round implements a MINIMAL,
   * real version using the ONLY read seam docs/40's `Repo` surface actually declares for arbitrary
   * node state: `getNode(eid)` — there is no dedicated "keyed correction cell" read API (no
   * `getConflicts()`/`getCell()` seam is named anywhere in this round's read docs slice either), so
   * inventing one would be building an un-spec'd API. Instead, this mirrors the ALREADY-established
   * `KIP_CONFLICT_KIND` convention (`getNodeRaw`'s own `kindConflict` handling above, and
   * `getEdge`'s below): when a signed `not_same_as(a,b)` fact contradicts a derived `same_as` closure
   * that would otherwise merge `a` and `b` into one equivalence class, `getNode` for EITHER `a` or `b`
   * (canonicalized so `(a,b)` and `(b,a)` both resolve to the SAME disputed pair, exactly like the
   * `same_as` canonical-EID rule's own `(namespaceId, localId)` byte-order) returns `kind:
   * "kip:conflict"` instead of silently completing the merge — "no in-place rewrite, no silent
   * merge/split" (docs/31, verbatim). Every OTHER member of `a`'s/`b`'s own (possibly larger)
   * equivalence class that is NOT itself one of the two disputed EIDs is unaffected — the dispute is
   * scoped to the named pair's own correction cell, not the whole transitive class.
   */
  const notSameAsPairs = new Set<string>();
  // D-68 (see the `same_as` fold above for the full rationale): dispute ONLY over edges whose
  // existence is LIVE by the SAME `edgeValidAt(eid, null)` predicate. A retract of a `not_same_as(a,b)`
  // veto (edgeValidAt => false) drops it here, so `getNode(a)`/`getNode(b)` stop surfacing
  // `kip:conflict` - the read-level un-veto the pre-D-68 raw-fact loop never did. A conflicted-existence
  // edge (`getEdge` => KIP_CONFLICT_KIND) is not an unambiguous `not_same_as` veto and does not dispute.
  for (const edgeEid of [...edgeEids].sort()) {
    if (!edgeValidAt(edgeEid, null)) continue;
    const view = getEdge(edgeEid);
    if (!view || view.kind !== "not_same_as") continue;
    if (!view.from || !view.to) continue;
    const [min, max] = nsLocalKey(view.from) <= nsLocalKey(view.to) ? [view.from, view.to] : [view.to, view.from];
    notSameAsPairs.add(`${min} ${max}`);
  }
  const disputedEids = new Set<EID>();
  if (notSameAsPairs.size > 0) {
    for (const pairKey of notSameAsPairs) {
      const [a, b] = pairKey.split(" ") as [EID, EID];
      // A contradiction requires the pair to ALSO be joined by the derived same_as closure — a bare
      // not_same_as with no corresponding same_as isn't a contradiction of anything (nothing to
      // dispute), just an (as-yet-unexercised) ordinary fact.
      if (sameAsParent.has(a) && sameAsParent.has(b) && sameAsFind(a) === sameAsFind(b)) {
        disputedEids.add(a);
        disputedEids.add(b);
      }
    }
  }

  /** The public `getNode` — wraps `getNodeRaw` with `same_as` canonical-EID resolution (see above),
   * EXCEPT for an eid named in a disputed `not_same_as` pair (see `disputedEids` above), which
   * surfaces `kind: KIP_CONFLICT_KIND` instead of completing the merge. */
  function getNode(eid: EID): NodeView | null {
    if (disputedEids.has(eid)) {
      const raw = getNodeRaw(eid);
      if (!raw) return null;
      return { ...raw, kind: KIP_CONFLICT_KIND };
    }
    const canonical = canonicalSameAsEid(eid);
    if (canonical === eid) return getNodeRaw(eid);
    const canonicalView = getNodeRaw(canonical);
    if (canonicalView) return canonicalView;
    const ownView = getNodeRaw(eid);
    return ownView ? { ...ownView, eid: canonical } : null;
  }

  function getEdge(eid: EID): EdgeView | null {
    if (edgeViewCache.has(eid)) return edgeViewCache.get(eid) ?? null;
    const existFacts = byCell.get(`edge-exist:${eid}`) ?? [];
    // See `getNode`'s identical fix above: exclude retract-only AND M8-demoted existence facts from
    // the "no ghost edges" gate (a demoted-only edge existence ⇒ null).
    if (existFacts.filter((f) => f.type !== "retract" && !demotedFacts.has(f)).length === 0) {
      edgeViewCache.set(eid, null);
      return null;
    }
    const existSegments = computeEdgeExistSegments(eid);
    const existBreakpoints = collectBreakpoints(existSegments);

    // See `getNode`'s identical fix above: sort prop keys so `EdgeView.props`' key order is a pure
    // function of prop name, never ingest order.
    const propKeySet = new Set<PropKey>();
    for (const f of facts) {
      if (f.target.kind === "edge-prop" && f.target.eid === eid) propKeySet.add(f.target.prop);
    }
    // M3/T4.6: see the identical fix in `getNode` above — an excised-only prop cell has no live
    // fact left to contribute its prop name.
    for (const cellKey of excisionsByCell.keys()) {
      const prefix = `edge-prop:${eid}:`;
      if (cellKey.startsWith(prefix)) propKeySet.add(cellKey.slice(prefix.length));
    }
    const propKeys = [...propKeySet].sort();

    const props: Record<PropKey, PropCell> = {};
    const latestCandidates: Fact[] = [];
    const existLatestId = latestAssertedFactId(existSegments);
    if (existLatestId) latestCandidates.push(factsById.get(existLatestId) as Fact);

    for (const prop of propKeys) {
      const propCellKey = `edge-prop:${eid}:${prop}`;
      const propFacts = byCell.get(propCellKey) ?? [];
      const gated = reduceCellByRef(
        propCellKey,
        propFacts,
        existBreakpoints,
        existSegments,
        factsById,
        collidedIds,
        knownMaxVersion,
        cellReducers,
        excisedOids,
        oidByFact,
        excisionsByCell.get(propCellKey) ?? [],
        demotedFacts,
      );
      props[prop] = { segments: gated };
      const latestId = latestAssertedFactId(gated);
      if (latestId) latestCandidates.push(factsById.get(latestId) as Fact);
    }

    const assertOnlyExist = existFacts.filter((f) => f.type !== "retract" && !demotedFacts.has(f));
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

  /** T3.3: is node `eid` still LIVE-VISIBLE at `at` (`null` = live "now")? Folds the node-existence
   * cell the SAME way `getNodeRaw` does (`reduceRawCell` + `mergeAdjacent`) and decides existence via
   * the IDENTICAL positive predicate the edge/prop gates use (`existsAtInstant` — a TRUTHY `value`
   * segment covering `at`), so this gate can never drift from `existsAtInstant`/`gateByExistence`
   * (round-2 convergence-safety MAJOR: the prior negative test `kind !== unknown/excised` wrongly
   * read a falsy `value`, `quarantine`, or missing-but-conflicting segment as LIVE while every prop
   * gated to `unknown` and every incident edge read invisible — an internally inconsistent "live but
   * propertyless" node). SINGLE carve-out: an unresolved existence `conflict` still surfaces as a
   * live view so a dispute is never silently swallowed as absence (docs/27); a `quarantine` (an
   * UNTRUSTED existence assert) or a plain falsy/absent `value` reads as NOT live, exactly like the
   * prop/edge paths. */
  function nodeLiveVisibleAt(eid: EID, at: bigint | null): boolean {
    const existFacts = byCell.get(`node-exist:${eid}`) ?? [];
    if (existFacts.filter((f) => f.type !== "retract" && !demotedFacts.has(f)).length === 0) return false;
    const existSegments = mergeAdjacent(
      reduceRawCell(
        existFacts,
        [],
        factsById,
        collidedIds,
        knownMaxVersion,
        excisedOids,
        oidByFact,
        excisionsByCell.get(`node-exist:${eid}`) ?? [],
        demotedFacts,
      ),
    );
    // Positive existence test — the SAME truthy-value predicate edges (`existsAtInstant`) and props
    // (`gateByExistence`) gate on, so a node reads live ONLY where it genuinely exists at `at`.
    if (existsAtInstant(existSegments, at)) return true;
    // Carve-out: never swallow an unresolved existence dispute as an absence — surface a `conflict`
    // covering segment as a live view (its props/edges still gate to `unknown`, but the node exists
    // as a disputed entity). Everything else (`unknown`/`excised`/`quarantine`/falsy `value`/missing)
    // reads as NOT live — consistent with the prop and edge gates.
    const covering =
      at === null
        ? existSegments[existSegments.length - 1]
        : existSegments.find((seg) => {
            if (canon(seg.validFrom) > at) return false;
            if (seg.validTo === null) return true;
            return canon(seg.validTo) > at;
          });
    return covering?.kind === "conflict";
  }

  return { getNode, getNodeRaw, sameAsClass, getEdge, edgesTouching, edgeValidAt, edgeExistenceFactId, nodeLiveVisibleAt };
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
  // T5.4 (FR-C2/NFR-F4): the query instant every candidate edge is gated against below — `null` for
  // a LIVE query (no `asOf`), else the caller's `asOf.validTime` canonicalized once up front (this
  // BFS's single query instant never changes mid-walk). Read directly off `spec.asOf` rather than a
  // separate threaded parameter: both call sites in index.ts (`KipRepo.query`'s live branch, and the
  // `asOf({validTime})`-scoped `ReadView.query` closure) hand `traverse` the SAME spec object the
  // caller supplied — including its `asOf` field — so this is the one authoritative source for "what
  // instant is this walk happening at", not a second, independently-threaded notion that could drift
  // from it.
  const asOfInstant = spec.asOf?.validTime !== undefined ? canon(spec.asOf.validTime) : null;

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
        // T5.4 fix: an edge that ONCE existed (so `getEdge` returns a view) but is not valid AT the
        // query instant (expired/retracted by `asOfInstant`, or — for a live query — no longer
        // currently valid) must be neither crossed NOR charged against `spec.maxFanout` — the bug
        // this task closes: previously this loop only ever checked `!edgeView` ("never existed at
        // all"), so an edge valid only `[0, 100)` was still crossed by an `asOf({validTime: 500})`
        // query, reaching the far-side node 400 time-units after the edge expired.
        if (!projection.edgeValidAt(edgeEid, asOfInstant)) continue;
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
