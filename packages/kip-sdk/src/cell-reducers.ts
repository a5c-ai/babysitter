/**
 * cell-reducers.ts — the M1 MAJOR-FINDING minimal per-cell reducer-selection SEAM (SPEC.md §3.4's
 * `CellReducerRef`/`CellReducer<V>` types + resolution-table rows for `gset`/`pncounter`; the M1
 * roadmap's explicit commitment to reducers beyond `lww-hlc`).
 *
 * SCOPE NOTE (see this task's `disputes` output): `index.ts`'s `Repo` surface exposes no
 * `NodeKindDef`/`EdgeKindDef`/schema-registration API, so there is no PER-ONTOLOGY-KIND seam to
 * hang a "this cell uses `gset`" declaration off of yet — `proj.ts`'s `getNode`/`getEdge` therefore
 * still only ever reach `lww-hlc` (the DEFAULT reducer, SPEC.md §3.4's resolution table) for every
 * prop cell. This module does NOT invent that missing registration surface (that would risk
 * shipping an un-spec'd API a later milestone's real ontology work would have to either honor or
 * break). Instead it proves the `CellReducer` ABSTRACTION itself — the part SPEC.md actually
 * specifies (`reduce(facts): CellSegment<V>[]`, "a PURE function over the WHOLE set of facts for
 * ONE cell, deterministic, total, pre-sorted input") — has more than one real, independently
 * unit-tested implementation: `gsetReducer` and `pncounterReducer` alongside `lww-hlc`'s existing
 * sweep in `proj.ts`. `resolveCellReducer`/`reducerFor` below are the minimal "a way to associate
 * one with a cell" seam the task asks for: a caller-supplied `(cellKey) -> CellReducerRef` map,
 * dispatched to a concrete implementation — small enough to unit-test directly against raw `Fact`
 * arrays without needing `KipRepo`/`proj.ts` to plumb it through end-to-end.
 */
import type { CellSegment, Fact, FactId, HlcOrTime, PropValue } from "./index";
import { canon, compareByContent as compareFactsByContent, decanon, maxByOrderKey } from "./proj";

/** SPEC.md §3.4's verbatim `CellReducerRef` union. */
export type CellReducerRef = "lww-hlc" | "max" | "min" | "gset" | "pncounter" | `custom:${string}`;

/**
 * SPEC.md §3.4's verbatim `CellReducer<V>` shape: a pure, deterministic, TOTAL function over the
 * whole fact subset for one cell — never a pairwise/binary merge, never dependent on input array
 * order (every implementation below re-derives its own deterministic ordering internally, so
 * passing `facts` in any order yields the identical result — this is what makes a `CellReducer` a
 * sound building block for `proj`'s "sort once, fold once" pipeline rather than a re-introduction
 * of the banned pairwise `merge(base, a, b)`, C-1/C-2).
 */
export interface CellReducer<V = PropValue> {
  readonly id: string;
  reduce(facts: readonly Fact[]): CellSegment<V>[];
}

/** The widest `[validFrom, validTo)` any fact in `facts` covers — used by the multi-value reducers
 * below, which (unlike `proj.ts`'s `lww-hlc` sweep) do not need per-elementary-sub-interval
 * geometry: SPEC.md §3.4's resolution table states `gset`/`pncounter` NEVER produce a conflict and
 * always resolve to "union"/"sum" — there is exactly one outcome for the whole reduced range, not
 * one outcome per micro-interval. */
function widestRange(facts: readonly Fact[]): { validFrom: HlcOrTime; validTo: HlcOrTime | null } {
  let minFrom: bigint | null = null;
  let maxTo: bigint | null = null;
  let openEnded = false;
  for (const f of facts) {
    const from = canon(f.validFrom);
    if (minFrom === null || from < minFrom) minFrom = from;
    if (f.validTo === null || f.validTo === undefined) {
      openEnded = true;
    } else {
      const to = canon(f.validTo);
      if (maxTo === null || to > maxTo) maxTo = to;
    }
  }
  return {
    validFrom: decanon(minFrom ?? 0n),
    validTo: openEnded ? null : maxTo === null ? null : decanon(maxTo),
  };
}

function stableSortKey(v: PropValue): string {
  return JSON.stringify(v);
}

/**
 * `gset` (grow-only set union, SPEC.md §3.4's resolution-table row): "concurrent same outcome ⇒
 * union (idempotent)"; "concurrent different outcomes ⇒ union (both members coexist; OR-Set) — no
 * conflict possible". Membership is TAGGED by the asserting fact's OWN `FactId` (SPEC.md §3.4: "a
 * `gset`/`pncounter` reducer carries per-member/per-increment tags = the asserting FactId"), so a
 * byte-identical re-offered/re-ingested fact (same `id`) contributes exactly one member — the
 * idempotent-union half of INV-7 applied at this reducer layer, not merely at the storage layer.
 *
 * KNOWN SCOPE SIMPLIFICATION (see this task's disputes): a genuine OR-Set lets a `retract` name the
 * EXACT tags (asserting `FactId`s) it removes. This SDK's `Fact`/`RetractInput` shape (index.ts)
 * carries no such "which member(s) this retract names" field yet — inventing one here would be
 * fabricating an un-spec'd wire format. So a `retract` present for this cell clears ALL current
 * membership (the same coarse "retracts remove coverage" rule `proj.ts`'s own sweep already uses
 * for `lww-hlc`), rather than silently guessing which member it meant.
 */
export const gsetReducer: CellReducer<PropValue[]> = {
  id: "gset",
  reduce(facts: readonly Fact[]): CellSegment<PropValue[]>[] {
    const asserts = facts.filter((f) => f.type !== "retract");
    if (asserts.length === 0) return [];
    const retracts = facts.filter((f) => f.type === "retract");

    // Every asserting fact is one TAGGED member (tag = its own FactId, SPEC.md §3.4), but the
    // EXPOSED set is the set of DISTINCT VALUES those tags carry — two different tags that happen
    // to assert the SAME value are still only one member of the value-set ("concurrent SAME
    // outcome ⇒ union (idempotent)"), and re-ingesting the byte-identical fact (same tag, same
    // value) is trivially a no-op against the same `valueByKey` entry.
    const valueByKey = new Map<string, PropValue>();
    for (const f of asserts) {
      const v = (f.value ?? null) as PropValue;
      valueByKey.set(stableSortKey(v), v);
    }

    const { validFrom, validTo } = widestRange(facts);

    if (retracts.length > 0) {
      return [{ kind: "unknown", validFrom, validTo }];
    }

    const value = [...valueByKey.keys()].sort().map((key) => valueByKey.get(key) as PropValue);
    // `assertedBy` is a deterministic (content-based, never ingest-order-based) provenance pick —
    // see proj.ts's `maxByOrderKey` doc comment (round-3 fix: this reuses the SAME fixed helper
    // every other winner-pick call site now uses, closing the exact "which one is `assertedBy`
    // depends on ingest order" gap round-2 left open here).
    const { winner } = maxByOrderKey(asserts);
    return [{ kind: "value", value, validFrom, validTo, assertedBy: winner.id }];
  },
};

/**
 * `pncounter` (positive-negative counter, SPEC.md §3.4's resolution-table row): "sum (tags dedup)"
 * with "no conflict possible (commutative)" for both the same-outcome and different-outcome
 * concurrent cases — this is the correct structure for retract/re-assert (SPEC.md §3.4's "m of
 * C-2"), since summing signed deltas is genuinely order-independent and never needs a tiebreak.
 * Each covering ASSERT's numeric `value` is one signed delta, deduped by its own `FactId` tag so a
 * re-offered/re-ingested (byte-identical) fact is NEVER double-counted.
 *
 * ROOT-CAUSE FIX (round 3, vulnerable site #4): the dedup-by-tag map previously did
 * `deltasByTag.set(f.id, delta)` — a plain last-write-wins `Map` write. That is sound for a
 * genuinely byte-identical re-offered fact (same tag, same delta, a true no-op), but NOT for a
 * FORGED tag collision (two DIFFERENT-content asserts sharing the same caller-declared `id`, the
 * exact well-formed.ts item-4 weak-check residual `maxByOrderKey`'s doc comment describes): which
 * of the two deltas ended up in the Map — and therefore the summed total — silently depended on
 * which one was LAST in this replica's local `facts` array (ingest order), an order-dependent sum
 * masquerading as the reducer's advertised "commutative, no conflict possible" guarantee. Fixed:
 * group every asserting fact by its tag FIRST, then for a tag with more than one DISTINCT delta,
 * pick one deterministic representative via `compareByContent` (content-derived, never array/
 * ingest-position-derived) — so the summed total is now a pure function of the fact SET regardless
 * of ingest order, closing the divergence without inventing a "sum both deltas" semantics the
 * SPEC's "tags dedup" text never licenses for a forged/colliding tag.
 */
export const pncounterReducer: CellReducer<number> = {
  id: "pncounter",
  reduce(facts: readonly Fact[]): CellSegment<number>[] {
    const asserts = facts.filter((f) => f.type !== "retract");
    if (asserts.length === 0) return [];

    const groupsByTag = new Map<FactId, Fact[]>();
    for (const f of asserts) {
      const group = groupsByTag.get(f.id);
      if (group) group.push(f);
      else groupsByTag.set(f.id, [f]);
    }
    let sum = 0;
    for (const group of groupsByTag.values()) {
      const rep = group.length === 1 ? group[0] : [...group].sort(compareFactsByContent)[0];
      sum += typeof rep.value === "number" ? rep.value : 0;
    }
    const { winner } = maxByOrderKey(asserts);
    const { validFrom, validTo } = widestRange(facts);
    return [{ kind: "value", value: sum, validFrom, validTo, assertedBy: winner.id }];
  },
};

/** A caller-supplied "which reducer applies to this cell" map, keyed by the SAME cell-key shape
 * `proj.ts`'s internal `cellKeyFor` derives (`node-prop:<eid>:<prop>` / `edge-prop:<eid>:<prop>`) —
 * the minimal "way to associate a reducer with a cell" this seam proves out, short of a full
 * per-ontology-kind schema registry. */
export type CellReducerAssociations = ReadonlyMap<string, CellReducerRef>;

/** Resolves which `CellReducerRef` applies to `cellKey`, defaulting to `"lww-hlc"` — SPEC.md
 * §3.4's DEFAULT reducer — when no explicit association is supplied. */
export function resolveCellReducer(associations: CellReducerAssociations | undefined, cellKey: string): CellReducerRef {
  return associations?.get(cellKey) ?? "lww-hlc";
}

/**
 * Dispatches a `CellReducerRef` to its concrete implementation. `"lww-hlc"` is deliberately NOT
 * returned here — it stays `proj.ts`'s own built-in sweep (existence-gating, conflict-surfacing,
 * and per-elementary-sub-interval geometry are all specific to that default path and not
 * duplicated here). `"max"`/`"min"`/`"custom:<id>"` are declared in SPEC.md's `CellReducerRef`
 * union but have no concrete implementation on this surface yet; requesting one throws rather than
 * silently falling back to a different reducer (fallbacks are evil) — see this task's disputes.
 */
export function reducerFor(ref: CellReducerRef): CellReducer<PropValue[]> | CellReducer<number> {
  if (ref === "gset") return gsetReducer;
  if (ref === "pncounter") return pncounterReducer;
  throw new Error(`cell-reducers: no concrete implementation for reducer "${ref}" (see cell-reducers.ts's disclosed scope note)`);
}
