/**
 * INV-A11 — same_as equivalence-closure totality + disputed-merge conflict.
 *
 * docs/60-conformance-and-testability.md#inv-a11 (verbatim): "Asserts: (a) Random-permutation fold
 * of a same_as multiset forming a multi-member class -> derived closure and canonical EID (min by
 * (namespaceId, localId) byte-order) byte-identical across permutations; (b) same_as(a,b) then
 * contradicting not_same_as(a,b) from a second key -> kip:conflict on the keyed correction cell, no
 * in-place rewrite, no silent merge/split; contradiction with EIDs in OPPOSITE order ((a,b) vs (b,a))
 * lands on the SAME correction cell ((min,max) canonicalization). Violating build: picking a
 * representative by insertion order/factCID hash; keying the disputed pair non-canonically; silently
 * resolving the dispute."
 *
 * docs/31-contextual-functionalities.md's "Intermediates and dedup are free — patent node-merge"
 * section (verbatim): "Closure. Treat each signed same_as(a,b) as an undirected edge and compute the
 * reflexive/symmetric/transitive closure (union-find over the same_as gset)... Canonical EID. Each
 * equivalence class projects under a total, order-independent canonical EID = the class member
 * minimum by (namespaceId, localId) byte-order... Contradiction => typed conflict. A signed
 * not_same_as(a,b) contradicting a derived a~b surfaces a kip:conflict on a keyed correction cell for
 * the disputed pair, canonicalized to the ordered pair (min, max)."
 *
 * Test methodology — `same_as`/`not_same_as` are modeled as ordinary signed EDGE-assert facts
 * (EdgeKind is a plain string, docs/31: "a signed same_as(a,b) fact... an undirected edge"; nothing
 * in docs/21/31 mints a dedicated FactType for them) authored directly via `assertFact` — the sugar
 * `putEdge` throws `unimplemented`, per index.ts's own TODOs. Sub-case (a)'s closure/canonical-EID
 * claim is observed through `getNode`, the only read primitive available: once same_as closure
 * folds, `getNode(a)`/`getNode(b)`/`getNode(c)` for members of the same equivalence class must each
 * resolve to the identical canonical `NodeView.eid`.
 *
 * ROUND 2 FIX (MAJOR finding #5): sub-case (b) is no longer `it.skip`'d. There is still no dedicated
 * "fetch a Conflict/cell by an arbitrary (min,max) key" read seam on `Repo` (no `getConflicts()`/
 * `getCell()` method is named anywhere in this task's read docs slice) — so this does NOT invent one.
 * Instead it reuses the ALREADY-established `getNode(eid)` seam and the `KIP_CONFLICT_KIND =
 * "kip:conflict"` sentinel convention `proj.ts` already uses for OTHER non-commutative reducer
 * conflicts (`getNodeRaw`'s own existence/kind-disagreement handling): `getNode` for either disputed
 * EID now returns `kind: "kip:conflict"` when a signed `not_same_as(a,b)` contradicts a derived
 * `same_as` closure that would otherwise have merged them — surfaced through a REAL, already-declared
 * read primitive, never a fabricated new API.
 *
 * `getNode`/`assertFact` for a fresh cell are real, already-implemented M0 machinery. `same_as`
 * closure/canonical-EID resolution (M5/T6.7) IS now implemented (proj.ts's union-find fold over the
 * `same_as` gset, `getNode(a)`/`getNode(b)`/`getNode(c)` all resolving to the canonical
 * `(namespaceId, localId)`-minimum EID) — this suite is GREEN, not `it.skip`'d/expected-to-fail
 * (MINOR FIX, round 3: this comment previously still said "EXPECTED TO FAIL right now," stale from
 * before T6.7 landed).
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { assertNode } from "./fixtures-m5";

async function assertSameAs(repo: InstanceType<typeof KipRepo>, a: string, b: string, replicaId: string): Promise<void> {
  await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "edge", eid: `same_as/${replicaId}/${a}/${b}`, edgeKind: "same_as", from: a, to: b },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId,
    provenance: { author: "m5-fixture", signature: `sig:${a}~${b}`, publicKeyFingerprint: "m5-fixture-fpr", signedFields: [] },
  });
}

async function assertNotSameAs(repo: InstanceType<typeof KipRepo>, a: string, b: string, replicaId: string): Promise<void> {
  await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "edge", eid: `not_same_as/${replicaId}/${a}/${b}`, edgeKind: "not_same_as", from: a, to: b },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId,
    provenance: { author: "m5-fixture-key2", signature: `sig:not:${a}~${b}`, publicKeyFingerprint: "m5-fixture-fpr-2", signedFields: [] },
  });
}

describe("INV-A11: same_as equivalence-closure totality + disputed-merge conflict", () => {
  it("INV-A11(a): a multi-member same_as class (a~b, b~c) resolves every member to the SAME canonical EID (min by (namespaceId, localId) byte-order), regardless of assertion order", async () => {
    const eidA = "tenant1/ns1/aaa";
    const eidB = "tenant1/ns1/bbb";
    const eidC = "tenant1/ns1/ccc";
    // The lexicographically-smallest localId ("aaa") is the expected canonical representative.
    const expectedCanonical = eidA;

    const repoForward = new KipRepo();
    await assertNode(repoForward, eidA, "person");
    await assertNode(repoForward, eidB, "person");
    await assertNode(repoForward, eidC, "person");
    await assertSameAs(repoForward, eidA, eidB, "replica-forward");
    await assertSameAs(repoForward, eidB, eidC, "replica-forward");

    const repoReverse = new KipRepo();
    await assertNode(repoReverse, eidA, "person");
    await assertNode(repoReverse, eidB, "person");
    await assertNode(repoReverse, eidC, "person");
    // The identical same_as multiset, asserted in the OPPOSITE order (the random-permutation half
    // of the invariant).
    await assertSameAs(repoReverse, eidB, eidC, "replica-reverse");
    await assertSameAs(repoReverse, eidA, eidB, "replica-reverse");

    for (const repo of [repoForward, repoReverse]) {
      const viewA = await repo.getNode(eidA);
      const viewB = await repo.getNode(eidB);
      const viewC = await repo.getNode(eidC);
      expect(viewA?.eid).toBe(expectedCanonical);
      expect(viewB?.eid).toBe(expectedCanonical);
      expect(viewC?.eid).toBe(expectedCanonical);
    }
  });

  it("INV-A11(b): same_as(a,b) then a contradicting not_same_as(a,b) from a second key surfaces a kip:conflict — no in-place rewrite, no silent merge; opposite-order EIDs land on the SAME disputed pair", async () => {
    const eidA = "tenant1/ns1/aaa";
    const eidB = "tenant1/ns1/bbb";

    const repoForward = new KipRepo();
    await assertNode(repoForward, eidA, "person");
    await assertNode(repoForward, eidB, "person");
    await assertSameAs(repoForward, eidA, eidB, "replica-key1");
    await assertNotSameAs(repoForward, eidA, eidB, "replica-key2");

    // The identical dispute, but the contradicting not_same_as names the pair in the OPPOSITE order
    // ((b,a) instead of (a,b)) — docs/31's own (min,max) canonicalization requires both to land on
    // the SAME correction cell.
    const repoReverse = new KipRepo();
    await assertNode(repoReverse, eidA, "person");
    await assertNode(repoReverse, eidB, "person");
    await assertSameAs(repoReverse, eidA, eidB, "replica-key1");
    await assertNotSameAs(repoReverse, eidB, eidA, "replica-key2");

    for (const repo of [repoForward, repoReverse]) {
      const viewA = await repo.getNode(eidA);
      const viewB = await repo.getNode(eidB);
      // Disputed: neither silently merges to a canonical EID (no in-place rewrite/silent merge) NOR
      // silently stays two independent, unrelated identities — both surface the SAME typed conflict
      // marker `proj.ts` already uses for other non-commutative reducer disagreements.
      expect(viewA?.kind).toBe("kip:conflict");
      expect(viewB?.kind).toBe("kip:conflict");
    }
  });

  it("INV-A11(b): a same_as pair with NO contradicting not_same_as still resolves its ordinary canonical-EID merge — the conflict marker is scoped to genuinely disputed pairs only", async () => {
    const eidA = "tenant1/ns1/aaa";
    const eidB = "tenant1/ns1/bbb";
    const repo = new KipRepo();
    await assertNode(repo, eidA, "person");
    await assertNode(repo, eidB, "person");
    await assertSameAs(repo, eidA, eidB, "replica-key1");

    const viewA = await repo.getNode(eidA);
    const viewB = await repo.getNode(eidB);
    expect(viewA?.kind).not.toBe("kip:conflict");
    expect(viewB?.kind).not.toBe("kip:conflict");
    expect(viewA?.eid).toBe(eidA);
    expect(viewB?.eid).toBe(eidA);
  });
});
