/**
 * INV-4 — belief-consistency (per-replica AUDIT; renamed from "bitemporal soundness", M2-4).
 *
 * docs/60-conformance-and-testability.md#inv-4 (verbatim): "Asserts: projected segments of any
 * cell are non-overlapping at every rxTime slice; gaps read as Unknown. asOf({txTime,
 * believer=R}) agrees with a per-replica reference oracle built from R's ingest order. This is a
 * belief-audit invariant, explicitly NOT a convergence claim (txTime is replica-local). Class:
 * per-replica audit (not cross-replica byte-identity). Violation: overlapping segments at a
 * slice, or asOf(txTime) disagreeing with R's oracle."
 *
 * Roadmap scope (docs/81-roadmap-epics-and-tasks.md): T3.2 ("asOf reads (valid-time lens & belief
 * lens)") is gated on INV-4 (and INV-11); T3.2.2/T3.2.3 name the txTime belief-audit lens and
 * "belief oracle agreement at every rxTime slice" directly. docs/23-temporality-and-bitemporality.md
 * §3/§2.1 and docs/25-context-enablement-seams.md corroborate: `asOf({txTime, believer})` "selects
 * the subset of S whose rxFrom (on R) ≤ T, then proj-folds that subset and filters by validTime"
 * — explicitly per-replica, resolved against "R's ingest order", never a cross-replica claim.
 *
 * SCOPE NOTE (single replica, no sync — M2/M0-M2 machinery only): "believer" in these tests is
 * always the SAME, single `KipRepo` instance that performed the ingests (the local replica), per
 * `AsOf.believer`'s own doc comment ("default = the local replica", index.ts). A genuinely
 * DIFFERENT replica's belief cannot be audited without first syncing its facts in (M3's `sync`),
 * so cross-replica belief-audit scenarios are out of scope here, matching INV-14a's own
 * single-replica framing for the sibling M2 exit invariant.
 *
 * OBSERVABILITY GAP (documented, not weakened — see the `it.skip` below and this task's
 * `untestable` report): `rxFrom` is "RECEIVER-assigned ... at first verified ingest" and recorded
 * ONLY in `FactAnnotation` (docs/23 §1) — index.ts's `Repo`/`KipRepo`/`OpenOptions` public surface
 * exposes NO seam to read back, inject, or otherwise discover the actual `rxFrom` stamp a
 * specific ingested fact received. The one `rxTime` cut that IS reachable through the public
 * surface without inventing a new API method is "the current frontier as of the last ingest" —
 * modeled here as a txTime cut fixed at a maximal sentinel `HlcStamp`
 * (`{wall: Number.MAX_SAFE_INTEGER, counter: 0, replicaId}`), which — because `rxFrom` is "strictly
 * monotone in this replica's own ingest order" (docs/23 §2) and therefore bounded above by any
 * value this large — is guaranteed to be `>=` every fact's real `rxFrom` on this replica, i.e. it
 * denotes exactly "R's belief right now". This lets the tests below exercise the FULL claim at the
 * one rxTime slice reachable black-box (the current frontier, re-checked at every point in R's own
 * ingest history — literally "at every [reachable] rxTime slice"), while the genuinely-past,
 * arbitrary-cut half of the claim (pinpointing "R's belief as of some STRICTLY EARLIER historical
 * instant, chosen without having witnessed rxFrom directly") is marked untestable, mirroring
 * inv-1.test.ts's own documented `rxFrom`-seam gap for INV-1.
 *
 * `asOf(...)` currently throws `unimplemented: asOf` (M2/T3.2 not yet implemented) — these tests
 * are EXPECTED TO FAIL right now; failures should surface as the thrown `unimplemented` error
 * propagating through the `await`, not as import/type errors (the same convention every M0/M1
 * conformance file in this directory already follows).
 */
import { describe, expect, it } from "vitest";
import type { CellSegment, HlcStamp } from "../../index";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

/**
 * Generic, reducer-agnostic geometry check (the same core claim inv-4a.test.ts's plain-proj
 * version asserts, re-used here against the belief-audit lens's output): segments are ordered by
 * ascending `validFrom` and never overlap (a segment's `validTo` — `null` meaning open-ended —
 * never exceeds the next segment's `validFrom`).
 */
function assertNonOverlappingOrdered(segments: readonly CellSegment[]): void {
  for (let i = 1; i < segments.length; i += 1) {
    const prev = segments[i - 1];
    const cur = segments[i];
    expect(Number(cur.validFrom)).toBeGreaterThanOrEqual(Number(prev.validFrom));
    if (prev.validTo !== null) {
      expect(Number(prev.validTo)).toBeLessThanOrEqual(Number(cur.validFrom));
    }
  }
}

/**
 * A txTime cut denoting "R's belief right now" (the current, reachable rxTime slice — see the
 * OBSERVABILITY GAP note above): a maximal sentinel `HlcStamp`, guaranteed `>=` every real
 * `rxFrom` this replica has assigned so far, since `rxFrom` is strictly monotone in ingest order
 * and therefore bounded (docs/23 §2's "actual order in which this replica came to believe
 * things").
 */
function nowSurrogate(replicaId: string): HlcStamp {
  return { wall: Number.MAX_SAFE_INTEGER, counter: 0, replicaId };
}

describe("INV-4: belief-consistency (per-replica audit)", () => {
  it("the belief-audit lens (asOf({txTime, believer})) exhibits non-overlapping segments with gaps reading as Unknown — the SAME docs/21 split-retract worked example INV-4a exercises via the plain proj-pure read, here routed through the txTime/believer audit lens instead", async () => {
    const replicaId = "replica-inv4-audit-geometry";
    const eid = "person/inv4-audit-split";

    const existence = makeWellFormedFact({
      replicaId,
      target: { kind: "node", eid, nodeKind: "person" },
      id: "inv4-audit-existence",
    });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const target = { kind: "node-prop" as const, eid, prop: "status" };
    const assert20 = makeWellFormedFact({ replicaId, target, id: "inv4-audit-assert-0-20" });
    assert20.value = "v1";
    assert20.validFrom = 0;
    assert20.validTo = 20;

    const retractMiddle = makeWellFormedFact({ replicaId, target, id: "inv4-audit-retract-5-10" });
    retractMiddle.type = "retract";
    retractMiddle.validFrom = 5;
    retractMiddle.validTo = 10;

    const repo = new KipRepo({ replicaId });
    await repo.ingest(existence);
    await repo.ingest(assert20);
    await repo.ingest(retractMiddle);

    const view = await repo.asOf({ txTime: nowSurrogate(replicaId), believer: replicaId });
    const node = await view.getNode(eid);
    const segments = node?.props.status.segments ?? [];
    assertNonOverlappingOrdered(segments);

    expect(segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "value", value: "v1", validFrom: 0, validTo: 5, assertedBy: "inv4-audit-assert-0-20" }),
        expect.objectContaining({ kind: "unknown", validFrom: 5, validTo: 10 }),
        expect.objectContaining({ kind: "value", value: "v1", validFrom: 10, validTo: 20, assertedBy: "inv4-audit-assert-0-20" }),
      ]),
    );
  });

  it("asOf({txTime, believer}) cut at R's current frontier agrees with a direct (rxFrom-unfiltered) read at EVERY step of R's own ingest order — the reachable core of 'agrees with a reference oracle built from R's ingest order', since a txTime cut at-or-beyond the last ingested fact's rxFrom denotes exactly R's belief right now", async () => {
    const replicaId = "replica-inv4-audit-oracle";
    const eid = "person/inv4-audit-oracle";

    const existence = makeWellFormedFact({
      replicaId,
      target: { kind: "node", eid, nodeKind: "person" },
      id: "inv4-oracle-existence",
    });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const repo = new KipRepo({ replicaId });
    await repo.ingest(existence);

    // Step 1 of R's ingest order: only the existence fact has been believed so far.
    const auditStep1 = await (await repo.asOf({ txTime: nowSurrogate(replicaId), believer: replicaId })).getNode(eid);
    const directStep1 = await repo.getNode(eid);
    expect(auditStep1).toEqual(directStep1);

    const firstAssert = makeWellFormedFact({
      replicaId,
      target: { kind: "node-prop", eid, prop: "status" },
      id: "inv4-oracle-assert-1",
      hlc: { wall: 1000 },
    });
    firstAssert.value = "v1";
    firstAssert.validFrom = 1000;
    firstAssert.validTo = null;
    await repo.ingest(firstAssert);

    // Step 2 of R's ingest order: R now additionally believes `firstAssert`.
    const auditStep2 = await (await repo.asOf({ txTime: nowSurrogate(replicaId), believer: replicaId })).getNode(eid);
    const directStep2 = await repo.getNode(eid);
    expect(auditStep2).toEqual(directStep2);
    // And the belief genuinely advanced between steps (not a vacuous no-op comparison).
    expect(directStep2).not.toEqual(directStep1);

    const secondAssert = makeWellFormedFact({
      replicaId,
      target: { kind: "node-prop", eid, prop: "status" },
      id: "inv4-oracle-assert-2",
      hlc: { wall: 2000 },
    });
    secondAssert.value = "v2";
    secondAssert.validFrom = 2000;
    secondAssert.validTo = null;
    await repo.ingest(secondAssert);

    // Step 3 of R's ingest order: R now additionally believes `secondAssert` too.
    const auditStep3 = await (await repo.asOf({ txTime: nowSurrogate(replicaId), believer: replicaId })).getNode(eid);
    const directStep3 = await repo.getNode(eid);
    expect(auditStep3).toEqual(directStep3);
    expect(directStep3).not.toEqual(directStep2);
  });

  it.skip(
    "UNTESTABLE AS CURRENTLY SCAFFOLDED (partial): INV-4's belief-audit claim also covers an ARBITRARY PAST txTime cut — 'asOf({txTime: T, believer: R}) agrees with a reference oracle built from R's ingest order' for a T strictly earlier than R's current frontier, e.g. pinpointing exactly the state R believed immediately after ingesting fact i but before fact i+1. index.ts's Repo/KipRepo/OpenOptions surface exposes no seam to read back, inject, or otherwise discover the actual per-fact `rxFrom` stamp (`FactAnnotation.rxFrom`, docs/23 §1/§3) a specific ingested fact received on this replica, so a test cannot construct a `txTime` value KNOWN (rather than merely assumed) to correspond to 'exactly after ingesting fact i, strictly before fact i+1' for i less than the current ingest count. The only rxTime cut reachable through the public surface without inventing a new API method is 'R's current frontier' (the sentinel-maximal txTime used by the two tests above), which those tests exercise repeatedly across R's entire ingest history — this it.skip documents the genuinely-past-cut sub-case left out of reach, per this task's `untestable` report.",
    () => {
      // Intentionally skipped, not faked. See the file-level and it-level comments above.
    },
  );
});
