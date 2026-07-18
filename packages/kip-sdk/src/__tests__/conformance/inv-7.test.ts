/**
 * INV-7 — idempotent ingestion (M1's exit gate, FULL invariant).
 *
 * docs/60-conformance-and-testability.md#inv-7 (verbatim): "Asserts: re-ingesting any fact set
 * is a no-op — CID dedup holds because the author-stamped, signed HLC is part of the CID (M-4),
 * so the same logical fact has one CID on all replicas (no double-count under pncounter). Class:
 * byte-identity. Violation: a re-ingest that double-counts or duplicates valid-time intervals."
 *
 * Scope vs M0's INV-7a (docs/60-conformance-and-testability.md#inv-7a, closed at M0): INV-7a
 * pins the GATE-LEVEL half only — that re-offering an already-admitted CID is a no-op AT THE
 * STORE (`/facts` has exactly one blob per CID), verified through `ingest()`'s own return-value
 * contract, with no reducer involved (see inv-7a.test.ts). This file (the FULL INV-7, M1's exit
 * criterion per docs/80-roadmap-and-milestones.md's M1 section: "INV-7 (full — B-3: needs the
 * pncounter/interval-dedup reducer this milestone delivers)") instead asserts the reducer-LEVEL
 * consequence: that re-ingestion is a no-op AT THE PROJECTED VIEW (`getNode`), i.e. `proj`'s
 * output is unaffected by how many times an already-admitted fact (or fact SET) is re-offered.
 *
 * Mechanism the first tests rely on: `proj` folds the ADMITTED FACT **SET**, and INV-7a already
 * establishes that the set itself never grows on a re-offered CID (`ingest()`'s own dedup). Since
 * `proj(S)` is a pure, total function of `S` alone (INV-1), and `S` is unchanged by re-offering a
 * member it already contains, EVERY reducer registered over that cell — `lww-hlc`, `gset`,
 * `pncounter`, or `custom:<id>` alike — necessarily reduces the identical `S` to the identical
 * result. Testing "the view is unchanged by re-offering" is therefore a reducer-agnostic but SOUND
 * test of the exact mechanism the invariant's own text cites ("CID dedup ... no double-count under
 * pncounter").
 *
 * ROUND-2 re-audit (finding F2): the `pncounter` reducer CAN now be selected literally for a cell —
 * `KipRepo`'s public constructor exposes a `cellReducers` association map (`node-prop:<eid>:<prop>` ->
 * `CellReducerRef`) threaded through every `getNode`/`getEdge`/`query` proj call (see proj.ts's
 * `reduceCellByRef`). So the "no double-count under pncounter" clause is no longer only inferable — the
 * last `it` below (previously `it.skip`'d) directly SELECTS `pncounter` and asserts a re-offered
 * increment is deduped by tag (the summed total is N, not 2N), a value the default `lww-hlc` fold could
 * never produce.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { cloneFact, makeWellFormedFact } from "./fixtures";

describe("INV-7: idempotent ingestion", () => {
  it("re-ingesting an already-admitted fact (same CID, offered again) leaves the projected getNode() view byte-identical — proj never double-counts a re-offer", async () => {
    const eid = "person/inv7-single-replica";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const increment = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "balance" }, id: "inv7-increment-1" });
    increment.value = 1;
    increment.validFrom = 0;
    increment.validTo = null;

    const repo = new KipRepo();
    await repo.ingest(cloneFact(existence));
    await repo.ingest(cloneFact(increment));
    const viewAfterOnce = await repo.getNode(eid);

    // Re-offer the IDENTICAL fact (same CID) three more times — INV-7a already pins this as a
    // no-op at the `/facts` store; this asserts it stays a no-op at the PROJECTED view too.
    await repo.ingest(cloneFact(increment));
    await repo.ingest(cloneFact(increment));
    await repo.ingest(cloneFact(increment));
    const viewAfterRepeatedReoffer = await repo.getNode(eid);

    expect(viewAfterRepeatedReoffer).toEqual(viewAfterOnce);
  });

  it("no double-count across replicas: a replica that re-offers an entire already-admitted fact SET a second time converges to the SAME getNode() view as a replica that only ever saw the set once", async () => {
    const eid = "person/inv7-cross-replica";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const incrementA = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "balance" }, id: "inv7-xrepl-inc-a" });
    incrementA.value = 1;
    incrementA.validFrom = 0;
    incrementA.validTo = null;

    const incrementB = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "balance" }, id: "inv7-xrepl-inc-b" });
    incrementB.value = 1;
    incrementB.validFrom = 100;
    incrementB.validTo = null;

    const replicaOnce = new KipRepo();
    await replicaOnce.ingest(cloneFact(existence));
    await replicaOnce.ingest(cloneFact(incrementA));
    await replicaOnce.ingest(cloneFact(incrementB));

    const replicaRedundant = new KipRepo();
    await replicaRedundant.ingest(cloneFact(existence));
    await replicaRedundant.ingest(cloneFact(incrementA));
    await replicaRedundant.ingest(cloneFact(incrementB));
    // Re-offer the WHOLE set again (every fact re-delivered, e.g. as if a naive sync retried) —
    // this MUST NOT change the projected result relative to `replicaOnce`, which never saw the
    // duplicates at all.
    await replicaRedundant.ingest(cloneFact(existence));
    await replicaRedundant.ingest(cloneFact(incrementA));
    await replicaRedundant.ingest(cloneFact(incrementB));

    const viewOnce = await replicaOnce.getNode(eid);
    const viewRedundant = await replicaRedundant.getNode(eid);
    expect(viewRedundant).toEqual(viewOnce);
  });

  it("selecting the `pncounter` reducer for a cell (via KipRepo's public `cellReducers` constructor seam) sums signed deltas deduped by tag: a re-offered increment does NOT double-count — the total is N, not 2N", async () => {
    const eid = "person/inv7-pncounter-select";
    const cellKey = `node-prop:${eid}:balance`;

    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const incrementA = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "balance" }, id: "inv7-pncounter-inc-a" });
    incrementA.value = 3;
    incrementA.validFrom = 0;
    incrementA.validTo = null;

    const incrementB = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "balance" }, id: "inv7-pncounter-inc-b" });
    incrementB.value = 4;
    incrementB.validFrom = 0;
    incrementB.validTo = null;

    const repo = new KipRepo({ cellReducers: new Map([[cellKey, "pncounter"]]) });
    await repo.ingest(cloneFact(existence));
    await repo.ingest(cloneFact(incrementA));
    await repo.ingest(cloneFact(incrementB));
    // Re-offer BOTH increments (byte-identical, same CIDs) — a pncounter dedups by tag, so the
    // summed total MUST stay 7, never 14.
    await repo.ingest(cloneFact(incrementA));
    await repo.ingest(cloneFact(incrementB));

    const view = await repo.getNode(eid);
    const segments = view!.props.balance.segments;
    expect(segments).toHaveLength(1);
    // value === 7 is only producible by the `pncounter` SUM (3 + 4); the default `lww-hlc` fold would
    // pick a single winner (3 or 4), never their sum — so this pins the reducer was genuinely SELECTED.
    expect(segments[0]).toMatchObject({ kind: "value", value: 7 });
  });
});
