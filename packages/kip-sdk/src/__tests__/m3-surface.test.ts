/**
 * M3-surface — method-acceptance suite for the distribution/convergence write surface (work item
 * `M3-surface`): `merge`, `subscribe`, `pin(scope, asOf)` / `resolvePin`, `rollup`, and the git
 * merge-driver install path (`fsck().mergeDriverInstalled`).
 *
 * SOURCE OF TRUTH (verbatim, sole authority): docs/40-sdk-api-surface.md (the `Repo` method
 * signatures + the per-method throws/returns table + `MergeReport`/`RollupOptions`/`SnapshotRef`/
 * `Frontier`/`FactDelta` shapes), docs/24-synchronization-and-convergence.md (§4b.2 merge =
 * set-union; §5 branch-per-agent + "any merge topology converges"; m-5 the frontier subscribe
 * cursor), and docs/22-git-substrate.md (§1.4 the regenerate-not-3-way-merge driver + m7-4
 * PROVISIONING is normative and `fsck` MUST verify it; §5 rollup = read-latency snapshot that does
 * NOT free bytes). Assertions are derived strictly from the documented method CONTRACTS — index.ts
 * is read only to import against the real public surface (type-correctness), never to mirror
 * private method bodies.
 *
 * EXPECTED-FAIL CONVENTION (identical to every M0/M1/M2 conformance file): `merge`, `subscribe`,
 * `rollup`, and `pin(scope, asOf)` (the bitemporal-frontier variant only — the no-asOf `pin` is
 * already implemented M2 machinery) are currently throwing `unimplemented` stubs; the tests that
 * drive them are EXPECTED TO FAIL right now, and the failure surfaces as the thrown `unimplemented`
 * error propagating through the `await`/`for await`, NOT as an import/type/compile error. The
 * merge-driver-install assertion fails on a plain `expect` (fsck currently reports
 * `mergeDriverInstalled: false`, TODO M3/T4.3), also an assertion failure — never a compile error.
 * They pass once M3-surface lands.
 *
 * Non-overlap: the conformance files ./conformance/inv-*-m3-surface.test.ts assert the M3 exit
 * INVARIANTS (INV-2a/9/12/13a/14) as they manifest through these surface methods; THIS file asserts
 * the METHOD-LEVEL contracts (return shapes, the async-iterable subscribe seam, the merge-driver
 * provisioning check). The pre-existing inv-14/inv-14a conformance files exercise `pin`/`resolvePin`
 * WITHOUT `asOf`; nothing here duplicates them — every `pin` call below passes an `asOf`.
 */
import { describe, expect, it } from "vitest";
import type { FactDelta, Frontier, HlcStamp, MergeReport, ScopeRef, SnapshotRef } from "../index";
import { KipRepo } from "../index";
import { makeWellFormedFact } from "./conformance/fixtures";

describe("M3-surface: merge — explicit convergent branch merge, /heads regenerated not 3-way-merged (docs/40 Repo.merge; docs/22 §1.4/§4; docs/24 §5)", () => {
  it("merge(from) returns a typed MergeReport { merged:number, conflicts:Conflict[], tip:FactSetDigest } — conflicts is DATA, never thrown, and is EMPTY for plain substrate (assert/retract) facts that carry no contradictory supersede (docs/40 per-method table: 'SyncReport.conflicts / MergeReport.conflicts (typed, never auto-picked)')", async () => {
    const repo = new KipRepo({ replicaId: "m3-merge-shape" });
    const existence = makeWellFormedFact({
      target: { kind: "node", eid: "person/m3-merge-shape", nodeKind: "person" },
      id: "m3-merge-shape-existence",
    });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;
    await repo.ingest(existence);

    const report: MergeReport = await repo.merge("refs/kip/replicas/branchB");

    expect(typeof report.merged).toBe("number");
    expect(Array.isArray(report.conflicts)).toBe(true);
    expect(report.conflicts).toEqual([]);
    expect(typeof report.tip).toBe("string");
    expect(report.tip.length).toBeGreaterThan(0);
  });

  it("merge is REGENERATE-not-merge: after merging a branch, the current replica's /heads equals proj(union) — a point read agrees byte-for-byte with a control replica that directly ingested the SAME union (docs/22 §1.4 'discards both sides and recomputes /heads from the unioned /facts'; docs/24 §4b.2 merge = set union)", async () => {
    const eid = "person/m3-merge-regen";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "m3-merge-regen-exist" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;
    const branchProp = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, id: "m3-merge-regen-status" });
    branchProp.value = "active";
    branchProp.validFrom = 0;
    branchProp.validTo = null;

    // Control replica holds the FULL union directly.
    const control = new KipRepo({ replicaId: "m3-merge-regen-control" });
    await control.ingest(existence);
    await control.ingest(branchProp);
    const controlNode = await control.getNode(eid);

    // Merging replica holds only `existence` locally; merge() is expected to union in the branch's
    // `status` fact and regenerate /heads. (merge() currently throws — expected fail.)
    const repo = new KipRepo({ replicaId: "m3-merge-regen" });
    await repo.ingest(existence);
    await repo.merge("refs/kip/replicas/branchB");

    const mergedNode = await repo.getNode(eid);
    expect(mergedNode?.props.status.segments).toEqual(controlNode?.props.status.segments);
  });

  it("merge topology is convergent: MergeReport.tip is a set-derived FactSetDigest (order-free), so merging in EITHER direction yields the SAME tip once both sides hold the same union (docs/24 §5 'any merge topology ... converges to the same state')", async () => {
    const eid = "person/m3-merge-topology";
    const f0 = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "m3-merge-topology-0" });
    f0.value = true;
    f0.validFrom = 0;
    f0.validTo = null;

    const repoAB = new KipRepo({ replicaId: "m3-merge-topology-ab" });
    await repoAB.ingest(f0);
    const repoBA = new KipRepo({ replicaId: "m3-merge-topology-ba" });
    await repoBA.ingest(f0);

    const ab = await repoAB.merge("refs/kip/replicas/B"); // A ← B
    const ba = await repoBA.merge("refs/kip/replicas/A"); // B ← A
    expect(ab.tip).toBe(ba.tip);
  });
});

describe("M3-surface: subscribe — frontier-cursor FactDelta stream (docs/40 Repo.subscribe; docs/24 §5; m-5)", () => {
  it("subscribe(scope) is an async-iterable whose elements are typed FactDelta { facts:FactId[], affected:EID[] } — each delta names the facts admitted and every entity whose head changed (docs/40 FactDelta doc comment; m-5 frontier cursor)", async () => {
    const eid = "person/m3-subscribe-shape";
    const fact = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "m3-subscribe-shape-0" });
    fact.value = true;
    fact.validFrom = 0;
    fact.validTo = null;

    const repo = new KipRepo({ replicaId: "m3-subscribe-shape" });
    await repo.ingest(fact);

    const scope: ScopeRef = { tenant: "tenant-m3-subscribe" };
    const deltas: FactDelta[] = [];
    for await (const delta of repo.subscribe(scope)) {
      deltas.push(delta);
      if (deltas.length >= 8) break;
    }

    expect(deltas.length).toBeGreaterThan(0);
    expect(deltas[0]).toEqual(
      expect.objectContaining({ facts: expect.any(Array), affected: expect.any(Array) }),
    );
  });

  it("subscribe(scope, since) reads from a FRONTIER cursor — only deltas AFTER the supplied `since.chainSeq` frontier are yielded, never re-delivering facts at or below the cursor (docs/40: 'frontier cursor (m-5)'; docs/24 §5)", async () => {
    const authorReplicaId = "m3-subscribe-since-author";
    const chainId = `${authorReplicaId}/known-fpr-1`;
    const seq0 = makeWellFormedFact({
      replicaId: authorReplicaId,
      seq: 0,
      target: { kind: "node-prop", eid: "person/m3-subscribe-since", prop: "p0" },
      id: "m3-subscribe-since-0",
    });

    const repo = new KipRepo({ replicaId: "m3-subscribe-since" });
    await repo.ingest(seq0);

    // A cursor already AT seq0 of the chain: subscribing since this frontier must not re-emit seq0.
    const since: Frontier = { chainSeq: { [chainId]: 0 } };
    const seen: FactDelta[] = [];
    for await (const delta of repo.subscribe({ tenant: "tenant-m3-subscribe-since" }, since)) {
      seen.push(delta);
      if (seen.length >= 8) break;
    }

    const allFactIds = seen.flatMap((d) => d.facts);
    expect(allFactIds).not.toContain(seq0.id);
  });
});

describe("M3-surface: pin(scope, asOf) — bitemporal frontier-addressed snapshot (docs/40 Repo.pin; docs/24 §4.4)", () => {
  it("pin(scope, {validTime}) returns a SnapshotRef { factSetDigest:CID, frontier:{chainSeq} } addressing the chain frontier AT that validTime cut — a combined time-cut + chain-frontier pin (docs/40 Repo.pin: 'frontier-addressed snapshot')", async () => {
    const eid = "person/m3-pin-asof";
    const fact = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "m3-pin-asof-0", seq: 0 });
    fact.value = true;
    fact.validFrom = 0;
    fact.validTo = null;

    const repo = new KipRepo({ replicaId: "m3-pin-asof" });
    await repo.ingest(fact);

    // The bitemporal (asOf) pin path — currently throws `unimplemented: pin with asOf`.
    const ref: SnapshotRef = await repo.pin({ tenant: "tenant-m3-pin-asof" }, { validTime: 0 });
    expect(typeof ref.factSetDigest).toBe("string");
    expect(ref.factSetDigest.length).toBeGreaterThan(0);
    expect(ref.frontier.chainSeq).toEqual(expect.any(Object));
  });

  it("resolvePin of a pin(scope, asOf) reference returns the discriminated pin-complete result with a recomputed factSetDigest when the sub-frontier chain is fully held (docs/40 resolvePin; INV-14)", async () => {
    const eid = "person/m3-pin-asof-resolve";
    const seq0 = makeWellFormedFact({
      replicaId: "m3-pin-asof-resolve-author",
      seq: 0,
      target: { kind: "node-prop", eid, prop: "p0" },
      id: "m3-pin-asof-resolve-0",
    });

    const repo = new KipRepo({ replicaId: "m3-pin-asof-resolve" });
    await repo.ingest(seq0);

    const ref = await repo.pin({ tenant: "tenant-m3-pin-asof-resolve" }, { validTime: 0 });
    const resolved = await repo.resolvePin(ref);
    expect(resolved.status).toBe("pin-complete");
  });
});

describe("M3-surface: rollup — content-addressed read-latency consolidation (docs/40 Repo.rollup; docs/22 §5)", () => {
  it("rollup({ throughHlc }) returns a content-addressed CID — the `kip:rollup` marker recording the covered HLC range + pre-rollup tip (docs/22 §5: 'writes a kip:rollup marker fact recording the covered HLC range + the pre-rollup tip CID')", async () => {
    const repo = new KipRepo({ replicaId: "m3-rollup-shape" });
    const fact = makeWellFormedFact({ target: { kind: "node", eid: "person/m3-rollup-shape", nodeKind: "person" }, id: "m3-rollup-shape-0" });
    fact.value = true;
    fact.validFrom = 0;
    fact.validTo = null;
    await repo.ingest(fact);

    const throughHlc: HlcStamp = { wall: 1_700_000_000_000, counter: 0, replicaId: "m3-rollup-shape" };
    const cid = await repo.rollup({ throughHlc });
    expect(typeof cid).toBe("string");
    expect(cid.length).toBeGreaterThan(0);
  });
});

describe("M3-surface: git merge-driver install path (docs/22 §1.4 m7-4; docs/40 FsckReport.mergeDriverInstalled)", () => {
  it("after the merge-driver PROVISIONING lands, fsck() reports mergeDriverInstalled === true — 'kip open MUST install merge.kip-regen.driver ... and kip fsck MUST verify it is installed' (docs/22 §1.4 m7-4)", async () => {
    const repo = new KipRepo({ replicaId: "m3-merge-driver" });
    const report = await repo.fsck();
    expect(report.mergeDriverInstalled).toBe(true);
  });
});
