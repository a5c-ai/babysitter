/**
 * INV-2a — substrate-only SEC sub-case (M3's exit gate), driven through the `merge()` SURFACE
 * METHOD (the explicit convergent branch-merge seam M3 adds).
 *
 * docs/60-conformance-and-testability.md#inv-2a (verbatim): "Scope: the same random-partition /
 * random-order replay equality, restricted to plain `assert`/`retract` facts — no key-authorization,
 * `revoke-key`, `resolve`-scoped-supersede, or backdated/anachronistic permutations ... Asserts:
 * equal received sets of substrate facts ⇒ byte-identical `/heads` across N replicas under random
 * partitions/orders. Runnable against M0–M3 machinery only."
 *
 * docs/24-synchronization-and-convergence.md §4b.2 (verbatim): "Merge = set union of fact blobs ...
 * Trivially associative, commutative, idempotent." §5 (verbatim): "Because merge is mechanically
 * convergent, any merge topology (star via main, or peer-to-peer mesh) converges to the same
 * state." docs/22-git-substrate.md §1.4 (verbatim): the merge driver "discards both sides and
 * recomputes /heads from the unioned /facts ... After any merge, /heads == proj(merged /facts) by
 * construction."
 *
 * Non-overlap with the frozen ./inv-2a.test.ts: that file proves substrate-only SEC by delivering
 * random PARTITIONS to independent replicas via `ingest()` and asserting equal `/heads`. THIS file
 * proves the SAME invariant as it manifests through the `merge()` surface method M3 introduces — a
 * convergent branch merge must (a) surface NO conflicts for plain substrate facts, and (b)
 * regenerate `/heads` byte-identically to a control that ingested the union directly. No assertion
 * here duplicates the ingest-partition equality proven there.
 *
 * `merge()` currently throws `unimplemented: merge` (index.ts, TODO M3/T4.3) — these tests are
 * EXPECTED TO FAIL now; the failure surfaces as the thrown `unimplemented` propagating through the
 * `await`, never an import/type error. The pre-`merge()` `ingest()` setup is real M0–M2 machinery.
 * (Modelling note, matching inv-14.test.ts's own established pattern: the "from branch" content is
 * represented by the union a control replica ingests — no public seam writes to a non-current branch
 * — so the assertion states the convergence CONTRACT a correct `merge()` must satisfy, not a literal
 * two-ref git topology.)
 */
import { describe, expect, it } from "vitest";
import type { Fact } from "../../index";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

describe("INV-2a: substrate-only SEC — via the merge() surface method (M3's exit gate)", () => {
  it("merging plain assert/retract substrate facts surfaces ZERO conflicts and regenerates /heads byte-identical to a control replica that ingested the SAME union — equal received sets ⇒ byte-identical /heads (docs/60 INV-2a; docs/22 §1.4 regenerate-not-merge)", async () => {
    const eid = "person/inv2a-m3-merge";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "inv2a-m3-exist" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;
    const status = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, id: "inv2a-m3-status" });
    status.value = "active";
    status.validFrom = 0;
    status.validTo = null;
    const role = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "role" }, id: "inv2a-m3-role" });
    role.value = "engineer";
    role.validFrom = 0;
    role.validTo = null;
    const union: Fact[] = [existence, status, role];

    // Control replica: ingest the whole union directly (the reference /heads). It ALSO serves as the
    // named merge SOURCE branch — merge(from) resolves `from` to the registered replica whose id is
    // the ref's trailing segment and PULLS ONLY that source (targeted, not a global slurp), so naming
    // this replica's id in the ref is what makes the merge genuinely union the branch's facts.
    const control = new KipRepo({ replicaId: "inv2a-m3-control" });
    for (const f of union) {
      // eslint-disable-next-line no-await-in-loop -- sequential ingest, the module-wide pattern
      await control.ingest(f);
    }
    const controlNode = await control.getNode(eid);

    // Merging replica: holds only `existence`; merge() must union the SOURCE branch's facts and
    // regenerate /heads to the identical projection.
    const repo = new KipRepo({ replicaId: "inv2a-m3-merge" });
    await repo.ingest(existence);
    const report = await repo.merge("refs/kip/replicas/inv2a-m3-control");
    expect(report.conflicts).toEqual([]);

    const mergedNode = await repo.getNode(eid);
    expect(mergedNode?.props.status.segments).toEqual(controlNode?.props.status.segments);
    expect(mergedNode?.props.role.segments).toEqual(controlNode?.props.role.segments);
  });

  it("merge is order/topology-independent (assoc/comm/idem set-union): a replica that merges its peer, and its peer that merges it, converge on the IDENTICAL set-derived MergeReport.tip — no matter which direction the union was formed (docs/24 §4b.2 + §5)", async () => {
    const eid = "person/inv2a-m3-topology";
    const shared = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "inv2a-m3-topology-0" });
    shared.value = true;
    shared.validFrom = 0;
    shared.validTo = null;
    // ROUND-3 de-tautologization: each replica holds a DISTINCT peer-only fact, and each ref names the
    // OTHER replica's real resolvable id, so the merge genuinely unions a peer branch (rather than a
    // no-op over an unresolvable ref that left both sides holding only the identical {shared}).
    const onlyA = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "a" }, id: "inv2a-m3-topology-a-fact" });
    onlyA.value = "aval";
    onlyA.validFrom = 0;
    onlyA.validTo = null;
    const onlyB = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "b" }, id: "inv2a-m3-topology-b-fact" });
    onlyB.value = "bval";
    onlyB.validFrom = 0;
    onlyB.validTo = null;

    const repoA = new KipRepo({ replicaId: "inv2a-m3-topology-a" });
    await repoA.ingest(shared);
    await repoA.ingest(onlyA);
    const repoB = new KipRepo({ replicaId: "inv2a-m3-topology-b" });
    await repoB.ingest(shared);
    await repoB.ingest(onlyB);

    const aMergesB = await repoA.merge("refs/kip/replicas/inv2a-m3-topology-b"); // A ← B (unions onlyB)
    const bMergesA = await repoB.merge("refs/kip/replicas/inv2a-m3-topology-a"); // B ← A (unions onlyA)
    // Both hold {shared, onlyA, onlyB}; the order-free tips rendezvous regardless of merge direction.
    expect(aMergesB.tip).toBe(bMergesA.tip);
    // ...and the union genuinely happened: A now sees B's fact.
    expect((await repoA.getNode(eid))?.props.b.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "bval" })]),
    );
  });
});
