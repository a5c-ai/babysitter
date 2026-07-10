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
 * Mechanism this suite relies on (and why it genuinely tests "no double-count under pncounter"
 * without being able to force a cell to literally use the `pncounter` reducer — see the
 * `untestable` note at the bottom of this file): `proj` folds the ADMITTED FACT **SET**, and
 * INV-7a already establishes that the set itself never grows on a re-offered CID (`ingest()`'s
 * own dedup). Since `proj(S)` is a pure, total function of `S` alone (INV-1), and `S` is
 * unchanged by re-offering a member it already contains, EVERY reducer registered over that cell
 * — `lww-hlc`, `gset`, `pncounter`, or `custom:<id>` alike — necessarily reduces the identical
 * `S` to the identical result. Testing "the view is unchanged by re-offering" is therefore a
 * reducer-agnostic but SOUND test of the exact mechanism the invariant's own text cites
 * ("CID dedup ... no double-count under pncounter").
 *
 * `getNode` currently throws `unimplemented: getNode` (M1 not yet implemented) — these tests are
 * EXPECTED TO FAIL right now; failures should surface as the thrown `unimplemented` error
 * propagating through the `await`, not as import/type errors.
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

  it.skip(
    "UNTESTABLE AS CURRENTLY SCAFFOLDED (partial): index.ts's Repo surface has NO ontology/schema-registration method (no NodeKindDef/CellReducerRef exported) — so a cell cannot be made to literally DECLARE the `pncounter` reducer from the current public surface, and there is no way to directly assert 'the summed counter value is N, not 2N' for a reducer we can name. This suite instead tests the reducer-AGNOSTIC mechanism the invariant's own text cites as the reason no double-count occurs (CID-deduped SET membership feeding a pure proj fold, see the file-header comment) — which is sound for pncounter specifically as a logical consequence, but does not independently pin a literal summed-counter assertion. See this task's `untestable` report.",
    () => {
      // Intentionally skipped, not faked.
    },
  );
});
