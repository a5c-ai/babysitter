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
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import type { Fact, FactDelta, Frontier, HlcStamp, MergeReport, ScopeRef, SnapshotRef } from "../index";
import { KipRepo } from "../index";
import { generateEd25519KeyPair } from "../signing";
import { Substrate } from "../substrate";
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

    // Control replica holds the FULL union directly. It ALSO serves as the named merge SOURCE branch:
    // merge(from) resolves `from` (a `refs/kip/replicas/<id>` ref) to the registered replica whose id
    // is that trailing segment, so naming this replica's id in the ref proves merge PULLS THE SPECIFIED
    // branch (targeted resolution), not an indiscriminate global slurp of every co-resident repo.
    const control = new KipRepo({ replicaId: "m3-merge-regen-control" });
    await control.ingest(existence);
    await control.ingest(branchProp);
    const controlNode = await control.getNode(eid);

    // Merging replica holds only `existence` locally; merge() is expected to union in the SOURCE
    // branch's `status` fact and regenerate /heads. (merge() currently throws — expected fail.)
    const repo = new KipRepo({ replicaId: "m3-merge-regen" });
    await repo.ingest(existence);
    await repo.merge("refs/kip/replicas/m3-merge-regen-control");

    const mergedNode = await repo.getNode(eid);
    expect(mergedNode?.props.status.segments).toEqual(controlNode?.props.status.segments);
  });

  it("merge topology is convergent: MergeReport.tip is a set-derived FactSetDigest (order-free), so merging in EITHER direction yields the SAME tip once both sides hold the same union (docs/24 §5 'any merge topology ... converges to the same state')", async () => {
    const eid = "person/m3-merge-topology";
    const f0 = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "m3-merge-topology-0" });
    f0.value = true;
    f0.validFrom = 0;
    f0.validTo = null;
    // ROUND-3 de-tautologization: each replica additionally holds a DISTINCT fact the other lacks, so
    // the two merges genuinely UNION a real peer's branch (not a no-op over an unresolvable ref) before
    // the tip-equality is asserted. Each ref names the OTHER replica's real, resolvable id.
    const fA = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "a" }, id: "m3-merge-topology-a" });
    fA.value = "aval";
    fA.validFrom = 0;
    fA.validTo = null;
    const fB = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "b" }, id: "m3-merge-topology-b" });
    fB.value = "bval";
    fB.validFrom = 0;
    fB.validTo = null;

    const repoAB = new KipRepo({ replicaId: "m3-merge-topology-ab" });
    await repoAB.ingest(f0);
    await repoAB.ingest(fA);
    const repoBA = new KipRepo({ replicaId: "m3-merge-topology-ba" });
    await repoBA.ingest(f0);
    await repoBA.ingest(fB);

    const ab = await repoAB.merge("refs/kip/replicas/m3-merge-topology-ba"); // A ← B (unions fB)
    const ba = await repoBA.merge("refs/kip/replicas/m3-merge-topology-ab"); // B ← A (unions fA)
    // Both now hold {f0, fA, fB}; the order-free FactSetDigest tips rendezvous regardless of direction.
    expect(ab.tip).toBe(ba.tip);
    // ...and the union genuinely happened (not a no-op): each pulled the peer's distinct fact.
    expect(await repoAB.getNode(eid)).not.toBeNull();
    expect((await repoAB.getNode(eid))?.props.b.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "bval" })]),
    );
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
    // validFrom=0 so the pin at validTime:0 genuinely CAPTURES this fact (a non-vacuous pin over a
    // real held chain), rather than an empty-but-"complete" cut over nothing (round-2 finding #3).
    seq0.validFrom = 0;
    seq0.validTo = null;

    const repo = new KipRepo({ replicaId: "m3-pin-asof-resolve" });
    await repo.ingest(seq0);

    const ref = await repo.pin({ tenant: "tenant-m3-pin-asof-resolve" }, { validTime: 0 });
    // The pin genuinely captured seq0's chain (frontier is non-empty), so this is a REAL completeness
    // proof, not a vacuous empty-frontier pass.
    expect(Object.keys(ref.frontier.chainSeq).length).toBeGreaterThan(0);
    const resolved = await repo.resolvePin(ref);
    expect(resolved.status).toBe("pin-complete");
    // resolvePin RECOMPUTES the digest from the currently-held cut subset; it must reproduce the pin's
    // own digest byte-for-byte (INV-14 pin-completeness recompute).
    if (resolved.status === "pin-complete") {
      expect(resolved.factSetDigest).toBe(ref.factSetDigest);
    }
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

/**
 * ROUND-2 adversarial-hardening tests: these close the tautological-pass gaps three round-1 critics
 * live-reproduced (see m3-round1-findings.json). They EXCLUDE future-valid facts from a past-time
 * pin (finding #3), prove a targeted merge does NOT mutate an unrelated third peer (finding #1), and
 * prove same-admitted-set ⇒ byte-identical /heads regardless of merge order (finding #2). None weaken
 * an existing assertion; all add strictly stronger checks the round-1 suite could not make.
 */
describe("M3-surface round-2 hardening: bitemporal pin genuinely excludes future-valid facts (finding #3)", () => {
  it("a past-time pin(scope, {validTime}) EXCLUDES a future-valid fact from its digest even when a lower-seq sibling is future-valid: a replica holding the extra future-valid fact pins to the IDENTICAL digest as one that never held it (proof the valid-time cut is applied to the SUBSET, not defeated by the seq frontier)", async () => {
    const eid = "person/m3-pin-future-exclude";
    // seq ⊥ validFrom: seq0 is authored FIRST but valid LATE (vf=1000); seq1 authored later, valid
    // EARLY (vf=10). The old code raised the chain frontier to seq1 then back-filled seq0 by seq<=1,
    // leaking seq0 (vf=1000) into a vt=100 pin. The fixed cut excludes it.
    const seq0 = makeWellFormedFact({ replicaId: "m3-pin-fx-author", seq: 0, target: { kind: "node-prop", eid, prop: "p0" }, id: "m3-pin-fx-0" });
    seq0.validFrom = 1000;
    seq0.validTo = null;
    const seq1 = makeWellFormedFact({ replicaId: "m3-pin-fx-author", seq: 1, target: { kind: "node-prop", eid, prop: "p1" }, id: "m3-pin-fx-1" });
    seq1.validFrom = 10;
    seq1.validTo = null;

    // R1 holds BOTH facts; R2 holds ONLY the early-valid seq1.
    const r1 = new KipRepo({ replicaId: "m3-pin-fx-r1" });
    await r1.ingest(seq0);
    await r1.ingest(seq1);
    const r2 = new KipRepo({ replicaId: "m3-pin-fx-r2" });
    await r2.ingest(seq1);

    const pastR1 = await r1.pin({ tenant: "t" }, { validTime: 100 });
    const pastR2 = await r2.pin({ tenant: "t" }, { validTime: 100 });
    // The future-valid seq0 (vf=1000 > cut 100) is EXCLUDED, so R1's pin digest equals R2's — holding
    // the extra future-valid fact did NOT change the past-time pin. (Under the round-1 bug these would
    // DIFFER, seq0 leaking into R1's digest.)
    expect(pastR1.factSetDigest).toBe(pastR2.factSetDigest);

    // A pin whose cut COVERS seq0 does include it — a materially different digest, proving asOf changes
    // the pinned content (not a no-op cut).
    const fullR1 = await r1.pin({ tenant: "t" }, { validTime: 5000 });
    expect(fullR1.factSetDigest).not.toBe(pastR1.factSetDigest);

    // resolvePin re-applies the SAME cut: the chain is complete (R1 holds seq0+seq1) yet the recomputed
    // digest still excludes the future-valid seq0, reproducing the pin's own digest byte-for-byte.
    const resolved = await r1.resolvePin(pastR1);
    expect(resolved.status).toBe("pin-complete");
    if (resolved.status === "pin-complete") {
      expect(resolved.factSetDigest).toBe(pastR1.factSetDigest);
    }
  });

  it("pin(scope, {validTime: 0}) over a fact whose validFrom is AFTER 0 yields an empty-cut pin whose digest differs from a pin that includes it — the cut is honored at the boundary", async () => {
    const eid = "person/m3-pin-boundary";
    const f = makeWellFormedFact({ replicaId: "m3-pin-boundary-author", seq: 0, target: { kind: "node-prop", eid, prop: "p0" }, id: "m3-pin-boundary-0" });
    f.validFrom = 50; // strictly after the cut below
    f.validTo = null;

    const repo = new KipRepo({ replicaId: "m3-pin-boundary" });
    await repo.ingest(f);

    const excluded = await repo.pin({ tenant: "t" }, { validTime: 0 }); // 50 > 0 ⇒ f excluded
    const included = await repo.pin({ tenant: "t" }, { validTime: 100 }); // 50 ≤ 100 ⇒ f included
    // The excluded pin's frontier does NOT enumerate the chain (nothing valid at the cut), while the
    // included pin does — a genuine valid-time cut, not the whole set.
    expect(Object.keys(excluded.frontier.chainSeq).length).toBe(0);
    expect(Object.keys(included.frontier.chainSeq).length).toBeGreaterThan(0);
    expect(excluded.factSetDigest).not.toBe(included.factSetDigest);
  });
});

describe("M3-surface round-2 hardening: targeted merge does NOT mutate unrelated peers (finding #1)", () => {
  it("merge(from) pulls ONLY the named source branch and leaves every unrelated co-resident replica byte-untouched — no global fan-out, no push into peers", async () => {
    const eidA = "person/m3-nomutate-a";
    const eidB = "person/m3-nomutate-b";
    const eidC = "person/m3-nomutate-c";
    const factA = makeWellFormedFact({ target: { kind: "node", eid: eidA, nodeKind: "person" }, id: "m3-nomutate-a-0" });
    factA.value = true;
    factA.validFrom = 0;
    factA.validTo = null;
    const factB = makeWellFormedFact({ target: { kind: "node", eid: eidB, nodeKind: "person" }, id: "m3-nomutate-b-0" });
    factB.value = true;
    factB.validFrom = 0;
    factB.validTo = null;
    const factC = makeWellFormedFact({ target: { kind: "node", eid: eidC, nodeKind: "person" }, id: "m3-nomutate-c-0" });
    factC.value = true;
    factC.validFrom = 0;
    factC.validTo = null;

    // An UNRELATED third peer, present in the same process registry, holding only its own fact.
    const peerC = new KipRepo({ replicaId: "m3-nomutate-c" });
    await peerC.ingest(factC);
    // The named merge source, holding only factB.
    const source = new KipRepo({ replicaId: "m3-nomutate-src" });
    await source.ingest(factB);
    // The merging replica, holding only factA.
    const repo = new KipRepo({ replicaId: "m3-nomutate-a" });
    await repo.ingest(factA);

    await repo.merge("refs/kip/replicas/m3-nomutate-src");

    // The targeted merge PULLED the named source's factB into `repo`.
    expect(await repo.getNode(eidB)).not.toBeNull();

    // The unrelated peerC is BYTE-UNTOUCHED: it never received factA or factB (the round-1 bug pushed
    // this replica's union into EVERY co-resident peer). It still holds exactly its own factC.
    expect(await peerC.getNode(eidA)).toBeNull();
    expect(await peerC.getNode(eidB)).toBeNull();
    expect(await peerC.getNode(eidC)).not.toBeNull();

    // The SOURCE is not mutated with the merging replica's own factA either (pull-only, no push-back).
    expect(await source.getNode(eidA)).toBeNull();
  });
});

describe("M3-surface round-3 hardening: same admitted set ⇒ byte-identical /heads even when proj's excision-authorization depends on a key registered on only ONE replica (finding #2)", () => {
  /**
   * REWRITTEN in M3 round 3. The round-2 version of this test contained NO excision marker, so the
   * ONLY proj input the finding-#2 fix changed — `isRegisteredFingerprint`, which feeds excision
   * AUTHORIZATION (`collectExcisions`/`isAuthorizedExcisionMarker` rule (c) `!isRegisteredFingerprint
   * (origFingerprint)`) — was never exercised; plain assert/retract convergence holds identically
   * with OR without the fix, so the test passed on the buggy round-1 code too (verified by two
   * critics). This version GENUINELY exercises the divergence path: two replicas hold the byte-
   * identical admitted set S = {existence, target, excision-marker}, but the TARGET fact's signing
   * fingerprint is registered in `keyRegistry` on p1 (via genesis `rootKeys`) and NOT on p2. Under
   * the round-1 keyRegistry-fed predicate the marker is UNAUTHORIZED on p1 (target's key is
   * "registered") yet AUTHORIZED on p2 (rule (c)) — so p1 keeps the target while p2 excises it:
   * DIVERGENT /heads for the identical set. Under the set-pure `registeredFingerprintsInSet(S)` fix
   * the answer is derived from S alone (the target is placeholder-signed ⇒ its fingerprint is NOT a
   * genuinely-keyed identity in S on EITHER replica), so both excise it: byte-identical /heads.
   *
   * Confirmed red/green by temporarily reverting `projOptions`'s `isRegisteredFingerprint` back to
   * `(fp) => this.keyRegistry.get(fp) !== undefined`: this test FAILS (p1 retains the value, p2 shows
   * `unknown`), then PASSES again once the set-pure predicate is restored.
   */
  it("a signed excision marker whose authorization turns on the target key's registration state folds to byte-identical /heads on a replica that DID and one that did NOT register that key (set-pure proj, not merge-mutated keyRegistry)", async () => {
    const eid = "person/m3-f2-excise-converge";
    // A REAL keypair whose fingerprint the target fact claims — so it can be registered on p1 via
    // rootKeys while the target itself stays PLACEHOLDER-signed (⇒ not a keyed identity in the set).
    const victimKp = generateEd25519KeyPair();
    const victimPem = victimKp.publicKey.export({ type: "spki", format: "pem" }) as string;

    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "m3-f2-exist" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;
    // The excision TARGET: a node-prop signed (placeholder) under the victim fingerprint.
    const target = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "status" },
      id: "m3-f2-target",
      provenance: { publicKeyFingerprint: victimKp.fingerprint },
    });
    target.value = "active";
    target.validFrom = 0;
    target.validTo = null;

    // A third-party exciser (its OWN real key ≠ victim, and NOT a trusted-excise key) mints a REAL,
    // in-band-signed excision marker against the target via the genuine `excise()` path. Its
    // author-guard authorizes because it has not registered the victim key (rule (c)). We read the
    // minted marker back off the exciser's substrate so BOTH consumers can hold the byte-IDENTICAL
    // set S = {existence, target, marker} directly (merge would pull the exciser's already-excised
    // view, which no longer contains the target — this test needs the target PRESENT in S so proj's
    // CASE-1 excision-AUTHORIZATION fold is what's exercised).
    const exciserDir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-m3-f2-exciser-"));
    const exciser = new KipRepo({ dir: exciserDir, replicaId: "m3-f2-exciser" });
    await exciser.ingest(existence);
    await exciser.ingest(target);
    await exciser.excise(target.id, "gdpr-erasure");
    const marker = new Substrate(exciserDir, "sha1")
      .listFactBlobs()
      .map((json) => JSON.parse(json) as Fact)
      .find((f) => f.type === "excision") as Fact;
    expect(marker).toBeDefined();

    // p1 REGISTERS the victim key (genesis rootKeys); p2 does not. Both ingest the IDENTICAL set —
    // byte-identical admitted sets on p1 and p2, differing ONLY in replica-local keyRegistry.
    const p1 = new KipRepo({ replicaId: "m3-f2-p1", rootKeys: [victimPem] });
    for (const f of [existence, target, marker]) await p1.ingest(f);
    const p2 = new KipRepo({ replicaId: "m3-f2-p2" });
    for (const f of [existence, target, marker]) await p2.ingest(f);

    const n1 = await p1.getNode(eid);
    const n2 = await p2.getNode(eid);
    // Both nodes exist (the `existence` fact is untouched)...
    expect(n1).not.toBeNull();
    expect(n2).not.toBeNull();
    // Set-pure proj: the placeholder-signed target is NOT a keyed identity in S on either replica, so
    // the marker is authorized on BOTH — the target's oid is excised and its `status` cell projects
    // the typed excised-away `unknown` placeholder IDENTICALLY. Under the round-1 keyRegistry predicate
    // p1 would instead retain the `status: "active"` VALUE (marker unauthorized there, victim key
    // "registered"), diverging from p2's `unknown` — the exact byte-divergence this now makes
    // impossible. (Verified red/green: reverting `projOptions.isRegisteredFingerprint` to
    // `this.keyRegistry.get(fp) !== undefined` makes this equality FAIL.)
    expect(n1?.props.status).toEqual(n2?.props.status);
    expect(n1?.props.status?.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "unknown" })]),
    );
    expect(n1?.props.status?.segments).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "active" })]),
    );

    // The order-free whole-set digest is byte-identical too (both hold the same S).
    const d1 = await p1.pin({ tenant: "t" });
    const d2 = await p2.pin({ tenant: "t" });
    expect(d1.factSetDigest).toBe(d2.factSetDigest);
  });

  it("plain assert/retract convergence is preserved: two replicas reaching the identical set by OPPOSITE merge orders compute byte-identical /heads and the identical order-free set digest", async () => {
    const eid = "person/m3-converge-order";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "m3-converge-exist" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;
    const status = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, id: "m3-converge-status" });
    status.value = "active";
    status.validFrom = 0;
    status.validTo = null;
    const role = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "role" }, id: "m3-converge-role" });
    role.value = "engineer";
    role.validFrom = 0;
    role.validTo = null;

    // Two source branches split the union; each consumer merges them in the OPPOSITE order.
    const srcOne = new KipRepo({ replicaId: "m3-converge-src1" });
    await srcOne.ingest(existence);
    await srcOne.ingest(status);
    const srcTwo = new KipRepo({ replicaId: "m3-converge-src2" });
    await srcTwo.ingest(role);

    const p1 = new KipRepo({ replicaId: "m3-converge-p1" });
    await p1.merge("refs/kip/replicas/m3-converge-src1");
    await p1.merge("refs/kip/replicas/m3-converge-src2");

    const p2 = new KipRepo({ replicaId: "m3-converge-p2" });
    await p2.merge("refs/kip/replicas/m3-converge-src2");
    await p2.merge("refs/kip/replicas/m3-converge-src1");

    const n1 = await p1.getNode(eid);
    const n2 = await p2.getNode(eid);
    expect(n2?.props.status.segments).toEqual(n1?.props.status.segments);
    expect(n2?.props.role.segments).toEqual(n1?.props.role.segments);

    const d1 = await p1.pin({ tenant: "t" });
    const d2 = await p2.pin({ tenant: "t" });
    expect(d1.factSetDigest).toBe(d2.factSetDigest);
  });
});
