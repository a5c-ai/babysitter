/**
 * INV-4a — segment-geometry sub-case (M1's exit gate).
 *
 * docs/60-conformance-and-testability.md#inv-4a (verbatim): "Scope: the asOf-free half —
 * assertable over raw proj output alone, no belief oracle, no asOf API (which is M2/T3.2
 * machinery). Asserts: every projected cell's segments are non-overlapping and ordered by
 * validFrom, any uncovered valid-time sub-interval projects an explicit unknown segment (never
 * an error, never an asserted null), and a mid-interval retract splits the cell (the [0,20)
 * worked example). Runnable against M1-only machinery."
 *
 * The worked example is docs/21-data-model.md's `retract-split-example` anchor, transcribed
 * verbatim: "A retract of the middle of [0,20) splits into value [0,5) . unknown [5,10) . value
 * [10,20) — not a 'partition with a hole'."
 *
 * Roadmap scope (docs/81-roadmap-epics-and-tasks.md): T2.5 ("Interval geometry & first-class
 * unknown") is gated on INV-4a; its subtasks explicitly include T2.5.3 "Existence-gates-
 * properties (no ghost nodes)" — so this file also covers SPEC.md §3.4's "no ghost nodes"
 * clause (a node-prop segment is suppressed/clipped to `unknown` over any sub-interval where the
 * node-existence cell does not cover), not just the assert/retract split geometry.
 *
 * `getNode` currently throws `unimplemented: getNode` (M1 not yet implemented) — these tests are
 * EXPECTED TO FAIL right now; failures should surface as the thrown `unimplemented` error
 * propagating through the `await`, not as import/type errors.
 */
import { describe, expect, it } from "vitest";
import type { CellSegment } from "../../index";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

/**
 * Generic, reducer-agnostic geometry check (INV-4a's core claim): segments are ordered by
 * ascending `validFrom` and never overlap (a segment's `validTo` — `null` meaning open-ended,
 * i.e. treated as +Infinity — never exceeds the next segment's `validFrom`).
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

describe("INV-4a: segment-geometry sub-case (M1's exit gate)", () => {
  it("a mid-interval retract SPLITS the cell into value[0,5) . unknown[5,10) . value[10,20) — the exact docs/21 worked example, never a partition-with-a-hole", async () => {
    const eid = "person/inv4a-split";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const target = { kind: "node-prop" as const, eid, prop: "status" };
    const assert20 = makeWellFormedFact({ target, id: "split-assert-0-20" });
    assert20.value = "v1";
    assert20.validFrom = 0;
    assert20.validTo = 20;

    const retractMiddle = makeWellFormedFact({ target, id: "split-retract-5-10" });
    retractMiddle.type = "retract";
    retractMiddle.validFrom = 5;
    retractMiddle.validTo = 10;

    const repo = new KipRepo();
    await repo.ingest(existence);
    await repo.ingest(assert20);
    await repo.ingest(retractMiddle);

    const view = await repo.getNode(eid);
    const segments = view?.props.status.segments ?? [];
    assertNonOverlappingOrdered(segments);

    expect(segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "value", value: "v1", validFrom: 0, validTo: 5, assertedBy: "split-assert-0-20" }),
        expect.objectContaining({ kind: "unknown", validFrom: 5, validTo: 10 }),
        expect.objectContaining({ kind: "value", value: "v1", validFrom: 10, validTo: 20, assertedBy: "split-assert-0-20" }),
      ]),
    );
  });

  it("no ghost nodes (m2-2): a node-prop fact with NO corresponding node-existence assert ever ingested projects getNode to null, never a propertied-but-nonexistent view", async () => {
    const eid = "person/inv4a-ghost";
    const propOnly = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "x" } });
    propOnly.value = "should-not-materialize";

    const repo = new KipRepo();
    await repo.ingest(propOnly);

    const view = await repo.getNode(eid);
    expect(view).toBeNull();
  });

  it("existence gates properties (m2-2): a node-existence retract over [10,20) suppresses (clips to unknown) the node-prop segment over that same sub-interval, even though the prop's OWN assert is open-ended", async () => {
    const eid = "person/inv4a-existence-gate";
    const existenceAssert = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "gate-existence-assert" });
    existenceAssert.value = true;
    existenceAssert.validFrom = 0;
    existenceAssert.validTo = null;

    const existenceRetract = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "gate-existence-retract" });
    existenceRetract.type = "retract";
    existenceRetract.validFrom = 10;
    existenceRetract.validTo = 20;

    const propAssert = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, id: "gate-prop-assert" });
    propAssert.value = "alive";
    propAssert.validFrom = 0;
    propAssert.validTo = null;

    const repo = new KipRepo();
    await repo.ingest(existenceAssert);
    await repo.ingest(existenceRetract);
    await repo.ingest(propAssert);

    const view = await repo.getNode(eid);
    const segments = view?.props.status.segments ?? [];
    assertNonOverlappingOrdered(segments);

    expect(segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "value", value: "alive", validFrom: 0, validTo: 10, assertedBy: "gate-prop-assert" }),
        expect.objectContaining({ kind: "unknown", validFrom: 10, validTo: 20 }),
        expect.objectContaining({ kind: "value", value: "alive", validFrom: 20, validTo: null, assertedBy: "gate-prop-assert" }),
      ]),
    );
  });

  it("an uncovered valid-time sub-interval projects an explicit `unknown` segment — never a thrown error and never an asserted `null` value — when a prop is only asserted starting partway through the node's existence", async () => {
    const eid = "person/inv4a-gap";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const lateAssert = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "nickname" }, id: "gap-late-assert" });
    lateAssert.value = "late";
    lateAssert.validFrom = 50;
    lateAssert.validTo = null;

    const repo = new KipRepo();
    await repo.ingest(existence);
    await repo.ingest(lateAssert);

    const view = await repo.getNode(eid);
    const segments = view?.props.nickname.segments ?? [];
    assertNonOverlappingOrdered(segments);

    // The sub-interval [0,50) has no covering non-retracted assert for `nickname` — it MUST read
    // as an explicit `unknown` segment (never a thrown error, never a `{kind:"value", value:null}`
    // asserted-absence segment, which is a DIFFERENT, distinct concept per docs/21 §2.1).
    expect(segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "unknown", validFrom: 0, validTo: 50 }),
        expect.objectContaining({ kind: "value", value: "late", validFrom: 50, validTo: null, assertedBy: "gap-late-assert" }),
      ]),
    );
  });
});
