/**
 * round4-digest-tiebreak-fix.test.ts — NON-FROZEN, additive regression coverage for round 4's fix
 * to the THIRD instance of this milestone's recurring "caller-declared `f.id` trusted as a sole
 * tiebreak/key" bug class (round 1: fact content read path, substrate.ts; round 2: eviction witness
 * path, substrate.ts; round 3/this file: `computeFactSetDigest`'s sort comparator, index.ts).
 *
 * THE BUG (round 3, surfaced by round 3's adversarial review, min score 68): `computeFactSetDigest`
 * (index.ts) sorted the pinned fact subset with `(a, b) => compareOrderKey(orderKey(a), orderKey(b))`
 * ONLY. `orderKey`'s (proj.ts) final tiebreak component is the caller-DECLARED `f.id` — never a
 * verified content hash (well-formed.ts's item-4 self-consistency check is a documented length-only
 * heuristic, see that file's own dispute comment). Two admitted facts that declare the SAME `id` but
 * carry DIFFERENT content are therefore fully admissible and produce an IDENTICAL `orderKey` tuple —
 * a genuine tie on every component, including the "total" order's own supposed tiebreak.
 * `Array.prototype.sort` is a STABLE sort, so a tied pair keeps whatever relative position it
 * happened to occupy in the pre-sort array — which is this replica's own local INGEST order (see
 * substrate.ts's `listFactBlobsWithOid`: the on-disk facts index is a plain JS object built via
 * `index[relPath] = {...}` at ingest time, and `Object.values(...)` on a non-integer-keyed object
 * iterates in INSERTION order, i.e. genuine per-replica ingest order — not content or oid order).
 * Two replicas holding the byte-identical admitted fact set, but that received the colliding pair in
 * a different order, therefore computed DIFFERENT `factSetDigest`s from `pin()`/`resolvePin()` while
 * BOTH still reported `pin-complete` — directly breaking `computeFactSetDigest`'s own doc-commented
 * "order-independent" / cross-replica digest-convergence promise (SEC/INV-14).
 *
 * THE FIX (index.ts): the sort comparator now falls through to `compareByContent` (proj.ts, already
 * exported and already used this exact way by `proj()`'s own `maxByOrderKey`/`buildFactsById` for
 * the identical class of tie) whenever `compareOrderKey` alone reports a tie:
 * `(a, b) => compareOrderKey(orderKey(a), orderKey(b)) || compareByContent(a, b)`. `compareByContent`
 * is a pure function of each fact's CANONICALIZED content (via `deepSortKeys`), never of array/ingest
 * position, so two replicas holding the same colliding pair always sort it into the SAME relative
 * order regardless of which one they happened to ingest first.
 *
 * This test builds two facts sharing a forged declared `id` with different content, arranges for
 * them to tie on every OTHER `orderKey` component too (identical `validFrom`/`hlc.wall`/`hlc.counter`/
 * `replicaId`/`provenance.publicKeyFingerprint` — the precise, documented precondition for a genuine
 * orderKey tie, not merely an `id` collision alone), ingests that pair into two independent `KipRepo`
 * instances in REVERSED delivery order, and asserts `resolvePin`'s digest is IDENTICAL across both —
 * including a cross-replica check (resolving replica A's own pin `ref` against replica B's held set,
 * and vice versa) to prove genuine convergence, not merely each replica agreeing with itself.
 *
 * Confirmed to FAIL against the pre-fix (round-3) `computeFactSetDigest` (reasoned through the code
 * path: the tie is genuine per the analysis above, the pre-fix comparator has no tiebreak beyond
 * `orderKey`, and `Array.prototype.sort`'s stability then preserves each replica's own distinct
 * ingest-order position for the tied pair, producing two different `JSON.stringify(canonicalized)`
 * strings and therefore two different digests) and to PASS after this round's fix.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import { makeWellFormedFact } from "./conformance/fixtures";

describe("Round-4 fix: computeFactSetDigest is order-independent even when two admitted facts share a forged declared id", () => {
  it("two replicas ingesting the same colliding fact pair in reversed delivery order compute the IDENTICAL pin digest", async () => {
    // Every `orderKey` component (proj.ts: [canon(validFrom), hlc.wall, hlc.counter, replicaId,
    // provenance.publicKeyFingerprint, id]) is forced identical between `factA`/`factB` below EXCEPT
    // the fields `orderKey` never reads (`target`, `value`, `seq`, `provenance.author`/`signature`) —
    // this is the genuine, documented precondition for a real orderKey tie, not just a same-`id`
    // coincidence that some other tuple component would still break.
    const sharedReplicaId = "replica-round4-shared-chain";
    const sharedHlc = { wall: 1_700_000_000_555, counter: 3, replicaId: sharedReplicaId };
    const declaredId = "round4-forged-shared-id";

    const factA = makeWellFormedFact({
      replicaId: sharedReplicaId,
      hlc: sharedHlc,
      seq: 0,
      id: declaredId,
      target: { kind: "node-prop", eid: "person/round4-a", prop: "p0" },
      value: "ROUND4-CONTENT-A",
    });
    const factB = makeWellFormedFact({
      replicaId: sharedReplicaId,
      hlc: sharedHlc,
      seq: 1,
      id: declaredId,
      target: { kind: "node-prop", eid: "person/round4-b", prop: "p0" },
      value: "ROUND4-CONTENT-B",
    });

    // Sanity: genuinely different content (never a spurious no-op test).
    expect(JSON.stringify(factA)).not.toBe(JSON.stringify(factB));
    // Both default to the fixtures' shared placeholder fingerprint (`makeWellFormedFact`'s
    // `provenance.publicKeyFingerprint` default, "known-fpr-1") — the genuinely UNregistered-
    // fingerprint placeholder path (no `keyPair` is configured for it on either repo below), the
    // same admission technique round 2/3's own regression tests rely on, so INV-13a requires both
    // facts to admit unconditionally despite neither being signed by a repo-recognized key.
    expect(factA.provenance.publicKeyFingerprint).toBe(factB.provenance.publicKeyFingerprint);

    // Replica "forward": ingests factA, then factB (declaration order).
    const repoForward = new KipRepo({});
    await expect(repoForward.ingest(factA)).resolves.toEqual({ admitted: true });
    await expect(repoForward.ingest(factB)).resolves.toEqual({ admitted: true });

    // Replica "reversed": ingests the SAME two facts, but in the OPPOSITE order.
    const repoReversed = new KipRepo({});
    await expect(repoReversed.ingest(factB)).resolves.toEqual({ admitted: true });
    await expect(repoReversed.ingest(factA)).resolves.toEqual({ admitted: true });

    const refForward = await repoForward.pin({ tenant: "tenant-round4-digest-tiebreak" });
    const refReversed = await repoReversed.pin({ tenant: "tenant-round4-digest-tiebreak" });

    const resolvedForward = await repoForward.resolvePin(refForward);
    const resolvedReversed = await repoReversed.resolvePin(refReversed);

    expect(resolvedForward.status).toBe("pin-complete");
    expect(resolvedReversed.status).toBe("pin-complete");
    const digestForward = (resolvedForward as { factSetDigest: string }).factSetDigest;
    const digestReversed = (resolvedReversed as { factSetDigest: string }).factSetDigest;

    // THE CRITICAL ASSERTION: pre-fix, `computeFactSetDigest`'s stable sort left the tied
    // (factA, factB) pair in each replica's own distinct local ingest-order position, so
    // `digestForward` and `digestReversed` differed even though both replicas hold the byte-
    // identical admitted set and both report `pin-complete`. Post-fix, the `compareByContent`
    // tiebreak makes the tied pair's relative order a pure function of content, so both digests
    // must be identical.
    expect(digestForward).toBe(digestReversed);

    // Cross-replica convergence, not merely self-agreement: resolving replica "forward"'s own pin
    // `ref` against replica "reversed"'s held set (and vice versa) must agree with each replica's
    // own self-resolved digest too.
    const crossForwardRefAgainstReversed = await repoReversed.resolvePin(refForward);
    const crossReversedRefAgainstForward = await repoForward.resolvePin(refReversed);
    expect(crossForwardRefAgainstReversed).toEqual({ status: "pin-complete", factSetDigest: digestForward });
    expect(crossReversedRefAgainstForward).toEqual({ status: "pin-complete", factSetDigest: digestReversed });
  });
});
