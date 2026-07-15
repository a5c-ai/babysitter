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
 * M2-SURFACE SCOPE (why this file exists alongside inv-4.test.ts): the sibling inv-4.test.ts
 * exercises INV-4 over a set of PLAIN assert/retract facts. This file exercises the SAME belief-
 * consistency claim over a set that additionally contains the M2-surface fact TYPES `supersede`
 * and `re-attest` (docs/23 §1: "Supersession and re-attestation are recorded as facts" — folded
 * by the same pure `proj`). No assertion here duplicates inv-4.test.ts: that file pins the exact
 * docs/21 split-retract worked-example values; this file asserts the reducer-agnostic geometry
 * (non-overlap + ordered + gaps-read-Unknown) AND belief-vs-direct oracle agreement over the
 * NEW fact-type mix, never re-pinning the same worked example.
 *
 * OBSERVABILITY GAP (identical to inv-4.test.ts, documented not weakened): `rxFrom` is receiver-
 * assigned and recorded only in `FactAnnotation`; index.ts's public surface exposes no seam to
 * read back or inject a specific fact's `rxFrom`. The one reachable rxTime cut is "R's belief
 * right now" — a maximal sentinel `HlcStamp` guaranteed `>=` every real `rxFrom` this replica has
 * assigned (rxFrom is strictly monotone in ingest order, docs/23 §2) — so the txTime lens is
 * driven at that reachable slice, and the genuinely-past arbitrary-cut half stays out of reach
 * (tracked in this task's `untestable` report, mirroring inv-4.test.ts's own `it.skip`).
 *
 * `asOf()` is implemented in the current tree (getNode/getEdge/query); these tests run its real
 * behavior over a supersede/re-attest-bearing set.
 */
import { describe, expect, it } from "vitest";
import type { CellSegment, Fact, HlcStamp } from "../../index";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

/** Segments are ordered by ascending `validFrom` and never overlap (INV-4 non-overlap geometry). */
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

/** A txTime cut denoting "R's belief right now" — see the OBSERVABILITY GAP note above. */
function nowSurrogate(replicaId: string): HlcStamp {
  return { wall: Number.MAX_SAFE_INTEGER, counter: 0, replicaId };
}

/** Hand-builds a `supersede` fact (type + `supersedes` inputCids) — the M2-surface fact type. */
function makeSupersedeFact(args: {
  replicaId: string;
  eid: string;
  id: string;
  seq: number;
  supersedes: string[];
}): Fact {
  const f = makeWellFormedFact({
    replicaId: args.replicaId,
    seq: args.seq,
    target: { kind: "node-prop", eid: args.eid, prop: "status" },
    id: args.id,
  });
  f.type = "supersede";
  f.supersedes = args.supersedes;
  return f;
}

/** Hand-builds a `re-attest` fact (type + `reAttests` target CID) — the M2-surface fact type. */
function makeReAttestFact(args: {
  replicaId: string;
  eid: string;
  id: string;
  seq: number;
  reAttests: string;
}): Fact {
  const f = makeWellFormedFact({
    replicaId: args.replicaId,
    seq: args.seq,
    target: { kind: "node-prop", eid: args.eid, prop: "status" },
    id: args.id,
  });
  f.type = "re-attest";
  f.reAttests = args.reAttests;
  return f;
}

describe("INV-4: belief-consistency (per-replica audit) over an M2-surface supersede/re-attest set", () => {
  it("the belief-audit lens (asOf({txTime, believer})) over a set containing a `supersede` fact projects NON-OVERLAPPING, validFrom-ordered segments — INV-4's non-overlap geometry holds when supersession is folded as a fact (docs/23 §1)", async () => {
    const replicaId = "replica-inv4-m2-supersede-geometry";
    const eid = "person/inv4-m2-supersede";

    const existence = makeWellFormedFact({
      replicaId,
      seq: 0,
      target: { kind: "node", eid, nodeKind: "person" },
      id: "inv4-m2-existence",
    });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const baseAssert = makeWellFormedFact({
      replicaId,
      seq: 1,
      target: { kind: "node-prop", eid, prop: "status" },
      id: "inv4-m2-base-assert",
    });
    baseAssert.value = "v1";
    baseAssert.validFrom = 0;
    baseAssert.validTo = null;

    const supersede = makeSupersedeFact({
      replicaId,
      eid,
      id: "inv4-m2-supersede",
      seq: 2,
      supersedes: [baseAssert.id],
    });
    supersede.value = "v2";
    supersede.validFrom = 100;
    supersede.validTo = null;

    const repo = new KipRepo({ replicaId });
    await repo.ingest(existence);
    await repo.ingest(baseAssert);
    await repo.ingest(supersede);

    const view = await repo.asOf({ txTime: nowSurrogate(replicaId), believer: replicaId });
    const node = await view.getNode(eid);
    const segments = node?.props.status.segments ?? [];

    expect(segments.length).toBeGreaterThan(0);
    assertNonOverlappingOrdered(segments);
    // Every segment reads as a defined typed kind (value/unknown/conflict/...) — never an error /
    // silently fabricated data (docs/23 §2.2: gaps read as `unknown`, never fabricated).
    for (const seg of segments) {
      expect(["value", "unknown", "conflict", "quarantine", "excised"]).toContain(seg.kind);
    }
    // ROUND-2 (code-quality): pin the fold's SEMANTIC outcome, not merely its geometry — the base
    // "v1" covers [0,100) and the supersede "v2" wins from its validFrom (100) on (higher validFrom
    // ⇒ higher orderKey where both cover). A no-op supersede would drop the "v2" segment and still
    // pass the non-overlap/typed-kind checks above.
    expect(segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "value", value: "v1" }),
        expect.objectContaining({ kind: "value", value: "v2" }),
      ]),
    );
  });

  it("asOf({txTime, believer}) at R's current frontier AGREES with the direct (rxFrom-unfiltered) read for a set mixing assert + `supersede` + `re-attest` facts — the reachable core of 'agrees with a reference oracle built from R's ingest order', now exercised over the M2-surface fact-type mix (docs/60 INV-4)", async () => {
    const replicaId = "replica-inv4-m2-oracle";
    const eid = "person/inv4-m2-oracle";

    const existence = makeWellFormedFact({
      replicaId,
      seq: 0,
      target: { kind: "node", eid, nodeKind: "person" },
      id: "inv4-m2-oracle-existence",
    });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const baseAssert = makeWellFormedFact({
      replicaId,
      seq: 1,
      target: { kind: "node-prop", eid, prop: "status" },
      id: "inv4-m2-oracle-assert",
    });
    baseAssert.value = "v1";
    baseAssert.validFrom = 0;
    baseAssert.validTo = null;

    const supersede = makeSupersedeFact({
      replicaId,
      eid,
      id: "inv4-m2-oracle-supersede",
      seq: 2,
      supersedes: [baseAssert.id],
    });
    supersede.value = "v2";
    supersede.validFrom = 100;
    supersede.validTo = null;

    const reAttest = makeReAttestFact({
      replicaId,
      eid,
      id: "inv4-m2-oracle-reattest",
      seq: 3,
      reAttests: baseAssert.id,
    });
    reAttest.value = "v1";
    reAttest.validFrom = 200;
    reAttest.validTo = null;

    const repo = new KipRepo({ replicaId });
    await repo.ingest(existence);
    await repo.ingest(baseAssert);
    await repo.ingest(supersede);
    await repo.ingest(reAttest);

    // "R's belief right now" (txTime cut at the current frontier, local believer) must equal the
    // direct live read — the reachable oracle-agreement half of INV-4, over the M2-surface mix.
    const belief = await (await repo.asOf({ txTime: nowSurrogate(replicaId), believer: replicaId })).getNode(eid);
    const direct = await repo.getNode(eid);
    expect(belief).toEqual(direct);
    // ROUND-2: pin that the supersede/re-attest facts genuinely folded — the base "v1" [0,100), the
    // supersede "v2" [100,200), the re-attest "v1" [200,+inf) all surface as value segments. A
    // semantic no-op for either new fact type would collapse this geometry yet still pass the
    // belief==direct equality above (both sides would be equally wrong).
    expect(direct?.props.status.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "value", value: "v1" }),
        expect.objectContaining({ kind: "value", value: "v2" }),
      ]),
    );
  });

  it("INV-3 totality: a signature-valid, object-shaped `supersede` that OMITS `inputCids` does NOT throw in proj/getNode/detectConflict — it is QUARANTINED (surfaced, never dropped, never trusted as a value), and the rest of the set still folds normally (docs/23 §1 'keyed by its input-CID set'; docs/60 INV-3 proj-totality)", async () => {
    // Regression guard for the round-2 convergence-safety fix: well-formed.ts only checks
    // presence-iff-type, so an object-shaped supersede with `{ retract: [] }` and NO `inputCids` is
    // admittable on EVERY replica. If `proj` threw on it (the pre-fix `.some()` on `undefined`),
    // totality (INV-3) would be lost cluster-wide. It must instead quarantine.
    const replicaId = "replica-inv4-m2-malformed-supersede";
    const eid = "person/inv4-m2-malformed-supersede";

    const existence = makeWellFormedFact({ replicaId, seq: 0, target: { kind: "node", eid, nodeKind: "person" }, id: "inv4-m2-malformed-existence" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const baseAssert = makeWellFormedFact({ replicaId, seq: 1, hlc: { wall: 1000 }, target: { kind: "node-prop", eid, prop: "status" }, id: "inv4-m2-malformed-base" });
    baseAssert.value = "v1";
    baseAssert.validFrom = 0;
    baseAssert.validTo = null;

    // A WELL-FORMED supersede on the SAME cell, so `detectConflict` runs with 2 supersedes present —
    // the malformed one's empty input-CID set must make `.some()` total, never throw.
    const wellFormedSupersede = makeWellFormedFact({ replicaId, seq: 2, hlc: { wall: 2000 }, target: { kind: "node-prop", eid, prop: "status" }, id: "inv4-m2-malformed-wf-supersede" });
    wellFormedSupersede.type = "supersede";
    wellFormedSupersede.supersedes = { inputCids: [baseAssert.id] };
    wellFormedSupersede.value = "v2";
    wellFormedSupersede.validFrom = 0;
    wellFormedSupersede.validTo = null;

    // The MALFORMED supersede: object-shaped, NO `inputCids` key-set, highest orderKey (wins the
    // sub-interval). Signature-valid and admittable (well-formed.ts checks only presence-iff-type).
    const malformedSupersede = makeWellFormedFact({ replicaId, seq: 3, hlc: { wall: 5000 }, target: { kind: "node-prop", eid, prop: "status" }, id: "inv4-m2-malformed-supersede" });
    malformedSupersede.type = "supersede";
    // NB: `inputCids` deliberately absent — only `retract` present.
    malformedSupersede.supersedes = { retract: [] } as unknown as Fact["supersedes"];
    malformedSupersede.value = "vX";
    malformedSupersede.validFrom = 0;
    malformedSupersede.validTo = null;

    // A clean, unrelated prop on the SAME node — must still fold to a trusted `value` (the malformed
    // supersede on `status` must not corrupt the rest of the projection).
    const cleanProp = makeWellFormedFact({ replicaId, seq: 4, hlc: { wall: 1500 }, target: { kind: "node-prop", eid, prop: "role" }, id: "inv4-m2-malformed-clean" });
    cleanProp.value = "engineer";
    cleanProp.validFrom = 0;
    cleanProp.validTo = null;

    const repo = new KipRepo({ replicaId });
    expect((await repo.ingest(existence)).admitted).toBe(true);
    expect((await repo.ingest(baseAssert)).admitted).toBe(true);
    expect((await repo.ingest(wellFormedSupersede)).admitted).toBe(true);
    expect((await repo.ingest(malformedSupersede)).admitted).toBe(true);
    expect((await repo.ingest(cleanProp)).admitted).toBe(true);

    // proj/getNode/detectConflict must be TOTAL — this line threw a TypeError before the fix.
    const node = await repo.getNode(eid);
    expect(node).not.toBeNull();

    // The malformed supersede won the `status` sub-interval by orderKey; it is quarantined, never
    // trusted as a `value`, never dropped.
    expect(node?.props.status.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "quarantine", reason: "malformed-supersede", assertedBy: malformedSupersede.id }),
      ]),
    );
    // No `status` segment silently trusts the malformed supersede's value.
    for (const seg of node?.props.status.segments ?? []) {
      if (seg.kind === "value") expect(seg.value).not.toBe("vX");
    }
    // The rest of the set folds normally.
    expect(node?.props.role.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "engineer" })]),
    );
  });
});
