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
 * SCOPE NOTE (sub-case (b) — UNTESTABLE at M5's public surface, not weakened, see this task's own
 * `untestable` reporting requirement): the "keyed correction cell for the disputed (min,max) pair"
 * docs/31 names has no declared READ seam on `Repo`. `Repo` exposes exactly `getNode(eid)`/
 * `getEdge(eid)` (both keyed by a REAL EID the caller already has, never an arbitrary same_as-pair
 * cell key), `query()`, and `recall()` — none of docs/40's own `Repo` surface documents a method to
 * fetch a `Conflict`/cell by an arbitrary `(min,max)` key, and no `getConflicts()`/`getCell()` seam
 * is named anywhere in the read docs slice this task was given. Asserting on "the keyed correction
 * cell" would require inventing an un-spec'd read API rather than exercising a declared one, so this
 * sub-case is left as a documented `it.skip` (mirroring the precedent inv-9.test.ts/proj.ts's
 * "excised" `CellSegment` variant doc comment already sets for a known, honestly-scoped gap) and is
 * additionally reported in this task's `untestable` output.
 *
 * `getNode`/`assertFact` for a fresh cell are real, already-implemented M0 machinery; `same_as`
 * closure/canonical-EID resolution itself is NOT yet implemented (M5/T6.7 — proj.ts has no such
 * fold), so sub-case (a)'s assertions are EXPECTED TO FAIL right now on the canonical-EID equality
 * assertions themselves (a real ASSERTION failure — `getNode(a).eid` today is just `a`, not a
 * computed canonical minimum — never a thrown/import/type error), matching this task's own
 * instruction that M5 tests fail on assertions, not syntax errors.
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

  it.skip(
    "INV-A11(b): same_as(a,b) then a contradicting not_same_as(a,b) from a second key surfaces a kip:conflict on the (min,max)-canonicalized correction cell — UNTESTABLE at M5's public surface (Repo names no read seam for an arbitrary same_as-pair correction cell; see this file's own SCOPE NOTE)",
    () => {
      // Intentionally empty — see the SCOPE NOTE above and this task's `untestable` report.
    },
  );
});
