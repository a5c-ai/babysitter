/**
 * D-68 — READ-LEVEL reversibility of a Layer-2 identity link: a retract of a `same_as` (or
 * `not_same_as`) EDGE must re-project the merge / dispute state that `getNode` / `sameAsClass`
 * surface, not merely remove the FACT.
 *
 * BEFORE the fix (the D-68 bug): proj's `same_as` union-find and its `not_same_as` dispute loop
 * RAW-iterated the assert facts (gated only on `f.type !== "retract"` + `isTruthyExistence`), never
 * consulting whether the EDGE's existence is currently LIVE. So retracting a `same_as(a,b)` removed
 * the fact but `getNode(a)` still canonicalized to the merged representative (no un-merge), and
 * retracting a `not_same_as(a,b)` removed the veto fact but `getNode(a)` still returned
 * `kip:conflict` (no un-veto). Fact-level reversibility shipped; read-level did not.
 *
 * THE FIX: fold / dispute ONLY over edges whose existence is LIVE by the SAME predicate `getEdge`
 * (its prop-gating), `traverse`, and `edgeExistenceFactId` all apply — `edgeValidAt(eid, null)`
 * (the edge's existence segments resolve to a TRUTHY value "now"). A retracted (or LWW-superseded-to-
 * falsy, or M8-demoted, or existence-conflicted) edge no longer folds/disputes, so the read
 * re-projects.
 *
 * The retract is authored via the SAME mechanism the resolver/entity-linker/RDF paths use — a
 * `retractFact` (`type: "retract"`) on the edge existence cell (the same edge `eid`).
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import { KIP_CONFLICT_KIND } from "../proj";
import { assertNode } from "./conformance/fixtures-m5";

const REPLICA = "d68-replica";

/** A deterministic edge eid independent of replicaId, so the RETRACT lands in the SAME
 *  `edge-exist:<eid>` cell as the ASSERT it reverses. */
function sameAsEid(a: string, b: string): string {
  return `same_as/${a}=>${b}`;
}
function notSameAsEid(a: string, b: string): string {
  return `not_same_as/${a}=>${b}`;
}

async function assertSameAs(repo: InstanceType<typeof KipRepo>, a: string, b: string): Promise<void> {
  await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "edge", eid: sameAsEid(a, b), edgeKind: "same_as", from: a, to: b },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: REPLICA,
    provenance: { author: "d68", signature: `sig:${a}~${b}`, publicKeyFingerprint: "d68-fpr", signedFields: [] },
  });
}

async function retractSameAs(repo: InstanceType<typeof KipRepo>, a: string, b: string): Promise<void> {
  await repo.retractFact({
    type: "retract",
    v: 1,
    target: { kind: "edge", eid: sameAsEid(a, b), edgeKind: "same_as", from: a, to: b },
    validFrom: 0,
    validTo: null,
    replicaId: REPLICA,
    provenance: { author: "d68", signature: `sig:retract:${a}~${b}`, publicKeyFingerprint: "d68-fpr", signedFields: [] },
  });
}

async function assertNotSameAs(repo: InstanceType<typeof KipRepo>, a: string, b: string): Promise<void> {
  await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "edge", eid: notSameAsEid(a, b), edgeKind: "not_same_as", from: a, to: b },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: REPLICA,
    provenance: { author: "d68-k2", signature: `sig:not:${a}~${b}`, publicKeyFingerprint: "d68-fpr-2", signedFields: [] },
  });
}

/** Author a LATER, higher-orderKey existence assert on the SAME `same_as` edge cell with a FALSY
 *  existence value — so LWW supersedes the truthy assert and `edgeValidAt(eid, null)` resolves false,
 *  WITHOUT a `retract` fact. Pins the code's explicit claim that an LWW-superseded-to-falsy existence
 *  does not fold (parity with `getEdge`), which the retract-only tests otherwise leave to the shared
 *  `edgeValidAt` seam. */
async function supersedeSameAsToFalsy(repo: InstanceType<typeof KipRepo>, a: string, b: string): Promise<void> {
  await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "edge", eid: sameAsEid(a, b), edgeKind: "same_as", from: a, to: b },
    value: false,
    validFrom: 0,
    validTo: null,
    replicaId: REPLICA,
    provenance: { author: "d68", signature: `sig:falsy:${a}~${b}`, publicKeyFingerprint: "d68-fpr", signedFields: [] },
  });
}

async function retractNotSameAs(repo: InstanceType<typeof KipRepo>, a: string, b: string): Promise<void> {
  await repo.retractFact({
    type: "retract",
    v: 1,
    target: { kind: "edge", eid: notSameAsEid(a, b), edgeKind: "not_same_as", from: a, to: b },
    validFrom: 0,
    validTo: null,
    replicaId: REPLICA,
    provenance: { author: "d68-k2", signature: `sig:not:retract:${a}~${b}`, publicKeyFingerprint: "d68-fpr-2", signedFields: [] },
  });
}

describe("D-68: read-level un-merge / un-veto after a Layer-2 edge retract", () => {
  const A = "tenant1/ns1/aaa";
  const B = "tenant1/ns1/bbb";

  it("un-merges after a same_as retract: getNode(a).eid returns to `a` and sameAsClass(a) returns to [a]", async () => {
    const repo = new KipRepo();
    await assertNode(repo, A, "person");
    await assertNode(repo, B, "person");
    await assertSameAs(repo, A, B);

    // Merged: both members canonicalize to the (namespaceId, localId)-min representative (A).
    expect((await repo.getNode(A))?.eid).toBe(A);
    expect((await repo.getNode(B))?.eid).toBe(A);
    expect(await repo.sameAsClass(A)).toEqual([A, B]);
    // Sanity: the edge is live at the fact level before the retract.
    expect(await repo.edgeExistenceFactId(sameAsEid(A, B))).not.toBeNull();

    await retractSameAs(repo, A, B);

    // Fact-level reversibility (pre-existing) — the edge existence is gone.
    expect(await repo.edgeExistenceFactId(sameAsEid(A, B))).toBeNull();
    // READ-level reversibility (D-68) — un-merged.
    expect((await repo.getNode(A))?.eid).toBe(A);
    expect((await repo.getNode(B))?.eid).toBe(B);
    expect(await repo.sameAsClass(A)).toEqual([A]);
    expect(await repo.sameAsClass(B)).toEqual([B]);
  });

  it("un-vetoes after a not_same_as retract: getNode returns from kip:conflict to the merged view; retracting the same_as too fully un-merges", async () => {
    const repo = new KipRepo();
    await assertNode(repo, A, "person");
    await assertNode(repo, B, "person");
    await assertSameAs(repo, A, B);
    await assertNotSameAs(repo, A, B);

    // Vetoed: a live not_same_as over a live same_as closure surfaces kip:conflict on both.
    expect((await repo.getNode(A))?.kind).toBe(KIP_CONFLICT_KIND);
    expect((await repo.getNode(B))?.kind).toBe(KIP_CONFLICT_KIND);

    await retractNotSameAs(repo, A, B);

    // Un-vetoed (D-68): the dispute clears, so the same_as merge is visible again.
    expect(await repo.edgeExistenceFactId(notSameAsEid(A, B))).toBeNull();
    expect((await repo.getNode(A))?.kind).not.toBe(KIP_CONFLICT_KIND);
    expect((await repo.getNode(B))?.kind).not.toBe(KIP_CONFLICT_KIND);
    expect((await repo.getNode(A))?.eid).toBe(A);
    expect((await repo.getNode(B))?.eid).toBe(A);
    expect(await repo.sameAsClass(A)).toEqual([A, B]);

    // Retract the same_as too → fully un-merged.
    await retractSameAs(repo, A, B);
    expect((await repo.getNode(A))?.eid).toBe(A);
    expect((await repo.getNode(B))?.eid).toBe(B);
    expect(await repo.sameAsClass(A)).toEqual([A]);
  });

  it("re-vetoes correctly: a same_as retract while a not_same_as veto is still live leaves no dispute (nothing left to merge) and un-merges", async () => {
    const repo = new KipRepo();
    await assertNode(repo, A, "person");
    await assertNode(repo, B, "person");
    await assertSameAs(repo, A, B);
    await assertNotSameAs(repo, A, B);
    expect((await repo.getNode(A))?.kind).toBe(KIP_CONFLICT_KIND);

    // Retract the same_as (leave the not_same_as live): the pair is no longer joined by the closure,
    // so there is nothing to dispute — both nodes are plain, distinct identities (no conflict).
    await retractSameAs(repo, A, B);
    expect((await repo.getNode(A))?.kind).not.toBe(KIP_CONFLICT_KIND);
    expect((await repo.getNode(B))?.kind).not.toBe(KIP_CONFLICT_KIND);
    expect((await repo.getNode(A))?.eid).toBe(A);
    expect((await repo.getNode(B))?.eid).toBe(B);
    expect(await repo.sameAsClass(A)).toEqual([A]);
  });

  it("does not over-un-merge: retracting ONE same_as edge in a 3-member chain (a~b, b~c) only drops the retracted link", async () => {
    const A2 = "tenant1/ns1/aaa";
    const B2 = "tenant1/ns1/bbb";
    const C2 = "tenant1/ns1/ccc";
    const repo = new KipRepo();
    await assertNode(repo, A2, "person");
    await assertNode(repo, B2, "person");
    await assertNode(repo, C2, "person");
    await assertSameAs(repo, A2, B2);
    await assertSameAs(repo, B2, C2);

    // All three merged to the min canonical (A2).
    expect((await repo.getNode(A2))?.eid).toBe(A2);
    expect((await repo.getNode(C2))?.eid).toBe(A2);
    expect(await repo.sameAsClass(C2)).toEqual([A2, B2, C2]);

    // Retract only a~b: b and c remain joined; a splits off.
    await retractSameAs(repo, A2, B2);
    expect((await repo.getNode(A2))?.eid).toBe(A2);
    expect(await repo.sameAsClass(A2)).toEqual([A2]);
    // b~c still folds → b and c canonicalize to min(b,c) = B2.
    expect((await repo.getNode(B2))?.eid).toBe(B2);
    expect((await repo.getNode(C2))?.eid).toBe(B2);
    expect(await repo.sameAsClass(C2)).toEqual([B2, C2]);
  });

  it("un-merges when the same_as existence is LWW-SUPERSEDED-to-falsy (not a retract) — parity with getEdge's liveness", async () => {
    // The D-68 fold gates on edgeValidAt(eid,null), the SAME segment-based existence authority getEdge
    // uses — which honours a falsy LWW winner and M8 demotion, not just `type:"retract"`. This pins the
    // falsy-winner branch directly (demotion rides the identical edgeValidAt→computeEdgeExistSegments
    // seam and is covered by getEdge's own demotion conformance).
    const repo = new KipRepo();
    await assertNode(repo, A, "person");
    await assertNode(repo, B, "person");
    await assertSameAs(repo, A, B);
    expect((await repo.getNode(B))?.eid).toBe(A); // merged
    expect(await repo.sameAsClass(A)).toEqual([A, B]);

    // A later, higher-orderKey existence assert with a FALSY value supersedes the truthy one (LWW).
    await supersedeSameAsToFalsy(repo, A, B);

    // edgeValidAt is now false (falsy winner) → the edge does not fold → un-merged, no retract involved.
    expect((await repo.getNode(A))?.eid).toBe(A);
    expect((await repo.getNode(B))?.eid).toBe(B);
    expect(await repo.sameAsClass(A)).toEqual([A]);
    expect(await repo.sameAsClass(B)).toEqual([B]);
  });

  it("determinism: a retracted-then-live fact history yields identical getNode/sameAsClass/getEdge regardless of authoring order", async () => {
    const A2 = "tenant1/ns1/aaa";
    const B2 = "tenant1/ns1/bbb";
    const C2 = "tenant1/ns1/ccc";

    // repo1: assert a~b, assert b~c, retract a~b.
    const repo1 = new KipRepo();
    await assertNode(repo1, A2, "person");
    await assertNode(repo1, B2, "person");
    await assertNode(repo1, C2, "person");
    await assertSameAs(repo1, A2, B2);
    await assertSameAs(repo1, B2, C2);
    await retractSameAs(repo1, A2, B2);

    // repo2: assert b~c, assert a~b, retract a~b (different interleaving of the SAME final history).
    const repo2 = new KipRepo();
    await assertNode(repo2, C2, "person");
    await assertNode(repo2, A2, "person");
    await assertNode(repo2, B2, "person");
    await assertSameAs(repo2, B2, C2);
    await assertSameAs(repo2, A2, B2);
    await retractSameAs(repo2, A2, B2);

    // Self-contained: pin the CONCRETE expected projection (not just repo1===repo2, which would also
    // hold if both permutations were identically wrong). After retracting a~b, only b~c folds → a is
    // its own class; b and c canonicalize to min(b,c) = B2.
    expect((await repo1.getNode(A2))?.eid).toBe(A2);
    expect((await repo1.getNode(C2))?.eid).toBe(B2);
    expect(await repo1.sameAsClass(C2)).toEqual([B2, C2]);
    for (const eid of [A2, B2, C2]) {
      expect((await repo1.getNode(eid))?.eid).toBe((await repo2.getNode(eid))?.eid);
      expect(await repo1.sameAsClass(eid)).toEqual(await repo2.sameAsClass(eid));
    }
    // The retracted same_as edge reads null on both; the live b~c edge reads identically.
    expect(await repo1.edgeExistenceFactId(sameAsEid(A2, B2))).toBeNull();
    expect(await repo2.edgeExistenceFactId(sameAsEid(A2, B2))).toBeNull();
    expect((await repo1.getEdge(sameAsEid(B2, C2)))?.kind).toBe((await repo2.getEdge(sameAsEid(B2, C2)))?.kind);
  });
});
