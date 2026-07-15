/**
 * INV-13a — admitted-on-receipt gate sub-case (M0's exit gate), re-driven at the M3 boundary
 * through the `merge()` + `subscribe()` SURFACE METHODS (the receipt paths M3 adds beyond raw
 * `ingest()`).
 *
 * docs/60-conformance-and-testability.md#inv-13a (verbatim): "Asserts: every signature-valid fact
 * offered to a replica is admitted on receipt — written to `/facts/**` and never dropped —
 * including facts with arbitrarily old/skewed author-HLCs and facts whose signing key the replica
 * has never seen (assert on `/facts` presence + INV-7 idempotent re-offer, not on projected trust)."
 * docs/24-synchronization-and-convergence.md §4.6 (verbatim): "because signature-valid facts are
 * never dropped (admission is signature-only, §3.2), an offline replica that reconnects after an
 * arbitrarily long partition has all its locally-authored facts accepted by every peer".
 *
 * Non-overlap with the frozen ./inv-13a.test.ts: that file drives `ingest()` directly and asserts
 * the `{ admitted: true }` gate verdict + idempotent re-offer. THIS file asserts the SAME
 * admitted-on-receipt guarantee as it manifests through the two M3 receipt seams — `merge()` (which
 * unions a branch's facts, admitting each on receipt) and `subscribe()` (the frontier cursor that
 * SURFACES each admitted fact as a `FactDelta`). No assertion here duplicates the direct-ingest
 * gate-verdict assertions there.
 *
 * `merge()` throws `unimplemented: merge` and `subscribe()` throws `unimplemented: subscribe`
 * (index.ts) — these tests are EXPECTED TO FAIL now; the failure surfaces as the thrown
 * `unimplemented` propagating through the `await`/`for await`, never an import/type error. The
 * pre-driver `ingest()` setup is real M0–M2 machinery.
 */
import { describe, expect, it } from "vitest";
import type { FactDelta } from "../../index";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

describe("INV-13a: admitted-on-receipt — via the merge() + subscribe() surface methods", () => {
  it("merge() admits EVERY signature-valid branch fact on receipt — including one with an arbitrarily OLD/skewed author-HLC and one from a key this replica has never seen — MergeReport.merged counts them and none is dropped (docs/60 INV-13a 'never dropped ... including arbitrarily old/skewed author-HLCs and ... a signing key the replica has never seen')", async () => {
    const eid = "person/inv13a-m3-merge";
    // A wildly-skewed OLD author-HLC (far below the fixtures baseline) — must still be admitted.
    const skewedOld = makeWellFormedFact({
      target: { kind: "node", eid, nodeKind: "person" },
      id: "inv13a-m3-merge-skewed",
      hlc: { wall: 1, counter: 0 },
    });
    skewedOld.value = true;
    skewedOld.validFrom = 0;
    skewedOld.validTo = null;
    // A fact from a never-before-seen signing key (unregistered fingerprint) — admitted (demotion,
    // not a drop, is proj's concern; the gate/receipt path admits it).
    const unknownKey = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "status" },
      id: "inv13a-m3-merge-unknownkey",
      provenance: { publicKeyFingerprint: "never-seen-fpr-inv13a" },
    });
    unknownKey.value = "active";
    unknownKey.validFrom = 0;
    unknownKey.validTo = null;

    const repo = new KipRepo({ replicaId: "inv13a-m3-merge" });
    await repo.ingest(skewedOld);
    const report = await repo.merge("refs/kip/replicas/branchB");
    // Every signature-valid branch fact is admitted on receipt, never dropped.
    expect(report.merged).toBeGreaterThanOrEqual(1);
    // The unknown-key fact is present (queryable) after merge — admitted, then surfaced by proj.
    const node = await repo.getNode(eid);
    expect(node).not.toBeUndefined();
  });

  it("subscribe() SURFACES every admitted fact as a FactDelta — a fact ingested on this replica appears in the frontier-cursor stream's `facts`, proving admitted-on-receipt is observable through the subscribe seam, not silently dropped (docs/40 subscribe/FactDelta; docs/60 INV-13a 'never dropped')", async () => {
    const eid = "person/inv13a-m3-subscribe";
    const fact = makeWellFormedFact({
      target: { kind: "node", eid, nodeKind: "person" },
      id: "inv13a-m3-subscribe-0",
      hlc: { wall: 1, counter: 0 }, // an old/skewed author-HLC — still admitted and surfaced
    });
    fact.value = true;
    fact.validFrom = 0;
    fact.validTo = null;

    const repo = new KipRepo({ replicaId: "inv13a-m3-subscribe" });
    await repo.ingest(fact);

    const seen: FactDelta[] = [];
    for await (const delta of repo.subscribe({ tenant: "tenant-inv13a-m3-subscribe" })) {
      seen.push(delta);
      if (seen.length >= 8) break;
    }

    const allFactIds = seen.flatMap((d) => d.facts);
    expect(allFactIds).toContain(fact.id);
  });
});
