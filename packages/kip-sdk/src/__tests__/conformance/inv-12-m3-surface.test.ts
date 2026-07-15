/**
 * INV-12 — concurrent-excision pin / as-of convergence, driven through the `merge()` + `pin(scope,
 * asOf)` SURFACE METHODS (the convergence seams M3 adds).
 *
 * docs/60-conformance-and-testability.md#inv-12 (verbatim): "Asserts: after concurrent excision on
 * different replicas, `asOf` and durable pins (`factSetDigest` + author-HLC frontier) resolve
 * identically across replicas, independent of commit-CID divergence ... Class: byte-identity of
 * digest ... Violation: a build that ... reuses transport batch boundaries ...". docs/24-synchron-
 * ization-and-convergence.md §4.4 step 4 (verbatim): "`asOf({validTime})` and durable pins resolve
 * against `factSetDigest` + author-HLC frontier; the commit DAG is a deterministic regeneration of
 * the ordered set. So even after concurrent excision (where commit CIDs may differ per replica) the
 * resolution targets converge."
 *
 * Non-overlap with the frozen ./inv-12.test.ts: that file drives `excise()` + `sync()` and asserts
 * the BYTE-IDENTICAL regenerated commit DAG + golden digest. THIS file exercises the SAME
 * convergence guarantee as it manifests through the two OTHER M3 surface methods — `merge()`
 * (convergent set-union) and `pin(scope, asOf)` (the bitemporal-frontier pin) — asserting that pin
 * resolution and `asOf` reads converge across replicas that formed the union by DIFFERENT merge
 * orders, independent of transport/commit ordering. No assertion here re-checks the regenerated-DAG
 * byte-recipe proven there.
 *
 * `merge()` throws `unimplemented: merge` and `pin(scope, asOf)` throws `unimplemented: pin with
 * asOf` (index.ts) — these tests are EXPECTED TO FAIL now; the failure surfaces as the thrown
 * `unimplemented` propagating through the `await`, never an import/type error. The `ingest()` setup
 * and `resolvePin()` are real, already-implemented machinery.
 */
import { describe, expect, it } from "vitest";
import type { Fact } from "../../index";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

describe("INV-12: pin / as-of convergence — via the merge() + pin(scope, asOf) surface methods", () => {
  it("two replicas that form the SAME union by DIFFERENT merge orders resolve a pin(scope, asOf) to the IDENTICAL factSetDigest — pin resolution is frontier-addressed, independent of the transport/commit ordering each replica merged in (docs/60 INV-12 'resolve identically ... independent of commit-CID divergence')", async () => {
    const authorReplicaId = "inv12-m3-author";
    const chainId = `${authorReplicaId}/known-fpr-1`;
    const eid = "person/inv12-m3-pin";
    const seq0 = makeWellFormedFact({ replicaId: authorReplicaId, seq: 0, target: { kind: "node-prop", eid, prop: "p0" }, id: "inv12-m3-pin-0" });
    const seq1 = makeWellFormedFact({ replicaId: authorReplicaId, seq: 1, target: { kind: "node-prop", eid, prop: "p1" }, id: "inv12-m3-pin-1" });
    const seq2 = makeWellFormedFact({ replicaId: authorReplicaId, seq: 2, target: { kind: "node-prop", eid, prop: "p2" }, id: "inv12-m3-pin-2" });
    const chain: Fact[] = [seq0, seq1, seq2];

    // Replica A forms the union then merges a peer branch; Replica B receives the chain in a
    // different interleaving before merging. Once both hold the identical union, a bitemporal pin
    // taken on A must resolve to the same digest on B.
    const repoA = new KipRepo({ replicaId: "inv12-m3-a" });
    await repoA.ingest(seq0);
    await repoA.ingest(seq1);
    await repoA.ingest(seq2);
    await repoA.merge("refs/kip/replicas/B");

    const repoB = new KipRepo({ replicaId: "inv12-m3-b" });
    await repoB.ingest(seq2);
    await repoB.ingest(seq0);
    await repoB.ingest(seq1);
    await repoB.merge("refs/kip/replicas/A");

    const ref = await repoA.pin({ tenant: "tenant-inv12-m3" }, { validTime: Number.MAX_SAFE_INTEGER });
    expect(ref.frontier.chainSeq[chainId]).toBe(2);

    const onA = await repoA.resolvePin(ref);
    const onB = await repoB.resolvePin(ref);
    expect(onA.status).toBe("pin-complete");
    expect(onB).toEqual(onA); // IDENTICAL factSetDigest, independent of merge order.
  });

  it("an asOf({validTime}) read converges across replicas that merged the union in different orders — the world-truth lens is a pure function of the admitted set, never of merge/commit ordering (docs/24 §4.4 step 4)", async () => {
    const eid = "person/inv12-m3-asof";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "inv12-m3-asof-exist" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;
    const status = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, id: "inv12-m3-asof-status" });
    status.value = "active";
    status.validFrom = 0;
    status.validTo = null;

    const repoA = new KipRepo({ replicaId: "inv12-m3-asof-a" });
    await repoA.ingest(existence);
    await repoA.merge("refs/kip/replicas/B");

    const repoB = new KipRepo({ replicaId: "inv12-m3-asof-b" });
    await repoB.ingest(status);
    await repoB.merge("refs/kip/replicas/A");

    const onA = await (await repoA.asOf({ validTime: 0 })).getNode(eid);
    const onB = await (await repoB.asOf({ validTime: 0 })).getNode(eid);
    expect(onB?.props.status.segments).toEqual(onA?.props.status.segments);
  });
});
