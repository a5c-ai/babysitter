/**
 * INV-9 — GC / excision safety (M3's exit gate is the EXCISION HALF only).
 *
 * docs/60-conformance-and-testability.md#inv-9 (verbatim): "Asserts: gc / repack / rollup never
 * change query results for any non-excised `asOf`; excision changes results only for the excised
 * CID (returning an `"excised"` placeholder) and re-folds dependent heads. Class:
 * result-stability. Violation: gc altering a non-excised result, or excision residue surviving in
 * `/heads`."
 *
 * Scope note (docs/80-roadmap-and-milestones.md / docs/81-roadmap-epics-and-tasks.md, verbatim):
 * the roadmap table names INV-9 for M3 as "(excision half)" only (line "M3 sync + convergence +
 * regen ... INV-2a, 9 (excision half), 12, 13a, 14"). T13.3 ("Rollup & read-latency snapshots")
 * and T13.4 ("Packing & GC of unreachable objects") each explicitly say their own exit criterion
 * "carries the rollup half"/"the gc/repack half of INV-9 deferred out of M3's excision-half gate" —
 * i.e. the roadmap ITSELF states the gc/repack/rollup result-stability clause is NOT M3's
 * responsibility to prove; it gates the later E13 tooling epic instead. This file therefore
 * exercises the excision half in full (see the two `it` blocks below) and marks the gc/repack/
 * rollup half `it.skip` with the exact deferral reason (also reported in this task's
 * `untestable` output) rather than inventing a premature test against machinery the roadmap does
 * not consider M3's to deliver.
 *
 * docs/24-synchronization-and-convergence.md §4.5 (condensed, verbatim clauses this file drives):
 * "Excision re-runs `proj` over the remaining set and rewrites `/heads` so no residue of the
 * excised value survives ... A head that folded in the excised value is recomputed; if a cell
 * loses its only covering assert it becomes `unknown`." / "Reads that would resolve through an
 * excised fact return a typed `"excised"` placeholder segment ... never silently fabricated
 * data." These are two DISTINCT observable surfaces — a plain (no-`asOf`) LIVE re-fold vs. a
 * historical `asOf({validTime})` read through the erased fact's original interval — and this file
 * exercises both separately, matching the spec's own two-clause structure exactly rather than
 * collapsing them into one assertion.
 *
 * Public-surface note: `CellSegment`'s `"excised"` variant did not exist on index.ts's public
 * surface before this round (only `"value" | "unknown" | "conflict" | "quarantine"` did) — a
 * MINIMAL, additive typed variant was added there (mirroring the established precedent of the
 * `"quarantine"` variant, itself added ahead of its producing code path for INV-8) purely so this
 * file's asOf-through-excision assertion type-checks against the shape the spec text names; no
 * behavior/logic was added, and no other file's meaning changed.
 *
 * `excise()` currently throws `unimplemented: excise` (M3/T4.6 not yet implemented) — these tests
 * are EXPECTED TO FAIL right now; failures should surface as the thrown `unimplemented` error
 * propagating through the `await`, not as import/type errors. The fact-ingestion steps that
 * PRECEDE each `excise()` call are real, already-implemented M0-M2 machinery and genuinely execute
 * today.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

describe("INV-9: GC / excision safety (M3's excision-half exit gate)", () => {
  it("excision changes query results ONLY for the excised fact's own cell: a cell that loses its ONLY covering assert re-folds to `unknown` (no residue of the excised value survives in /heads), while an untouched sibling cell on the SAME node is byte-identical before and after, and fsck() reports zero excision residue", async () => {
    const eid = "person/inv9-scope";
    const existence = makeWellFormedFact({
      target: { kind: "node", eid, nodeKind: "person" },
      id: "inv9-scope-existence",
    });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    // propA: the ONLY covering assert for this cell — the one we will excise.
    const propA = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "secret" }, id: "inv9-scope-propA" });
    propA.value = "s3cr3t";
    propA.validFrom = 0;
    propA.validTo = null;

    // propB: an entirely independent, untouched cell on the SAME node — must be unaffected.
    const propB = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "unaffected" }, id: "inv9-scope-propB" });
    propB.value = "still-here";
    propB.validFrom = 0;
    propB.validTo = null;

    const repo = new KipRepo();
    await repo.ingest(existence);
    await repo.ingest(propA);
    await repo.ingest(propB);

    const before = await repo.getNode(eid);
    expect(before?.props.secret.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "s3cr3t" })]),
    );
    const propBBefore = before?.props.unaffected.segments;

    const marker = await repo.excise(propA.id, "gdpr-erasure");
    expect(marker.excised).toBe(propA.id);

    const after = await repo.getNode(eid);
    // The excised cell's ONLY covering assert is gone: the WHOLE [0, null) sub-interval re-folds
    // to `unknown` — never the original value, never a thrown error, never a silent residue.
    expect(after?.props.secret.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "unknown", validFrom: 0, validTo: null })]),
    );
    expect(after?.props.secret.segments).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "s3cr3t" })]),
    );
    // The untouched sibling cell must be BYTE-IDENTICAL to its pre-excision projection — excision
    // changes results ONLY for the excised fact's own cell, never collaterally.
    expect(after?.props.unaffected.segments).toEqual(propBBefore);

    const report = await repo.fsck();
    expect(report.excisionResidue).toEqual([]);
    expect(report.headsMatch).toBe(true);
  });

  it("an `asOf({validTime})` read resolving THROUGH the excised fact's original valid-time interval returns a typed `excised` placeholder segment naming the excised FactId — distinct from `unknown`, and never the original (now-erased) value", async () => {
    const eid = "person/inv9-asof-through-excision";
    const existence = makeWellFormedFact({
      target: { kind: "node", eid, nodeKind: "person" },
      id: "inv9-asof-existence",
    });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const factX = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, id: "inv9-asof-factX" });
    factX.value = "s1";
    factX.validFrom = 100;
    factX.validTo = null;

    const repo = new KipRepo();
    await repo.ingest(existence);
    await repo.ingest(factX);

    await repo.excise(factX.id, "gdpr-erasure");

    // Instant 500 falls WITHIN factX's original [100, null) interval — a read resolving through
    // it must surface the typed `"excised"` placeholder, never fabricate `"s1"` back, and never
    // silently collapse to the SAME `"unknown"` shape a plain missing-assert gap would produce.
    const view = await (await repo.asOf({ validTime: 500 })).getNode(eid);
    expect(view?.props.status.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "excised", excisedFactId: factX.id }),
      ]),
    );
    expect(view?.props.status.segments).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "s1" })]),
    );
  });

  it.skip(
    "UNTESTABLE AT M3 (deferred, not a gap in this file): the gc/repack-half and rollup-half of INV-9's 'never change query results for any non-excised asOf' clause are explicitly carried by T13.3 (Rollup & read-latency snapshots) and T13.4 (Packing & GC of unreachable objects) — both post-M3 E13 tooling tasks whose OWN exit-criteria text says they carry that half 'deferred out of M3's excision-half gate' (docs/81-roadmap-epics-and-tasks.md). index.ts's public surface exposes `rollup(opts)` and no gc/repack method at all, and `rollup()` currently throws `unimplemented` with no corresponding roadmap claim that M3 delivers it — testing 'gc/repack/rollup never change non-excised results' here would exercise machinery the roadmap itself does not scope to this milestone. See this task's `untestable` report.",
    () => {
      // Intentionally skipped, not faked — deferred to T13.3/T13.4 per the roadmap's own text.
    },
  );
});
