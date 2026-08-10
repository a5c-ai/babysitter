/**
 * INV-8 — upcaster soundness (terminates, never invents) (M1's exit gate).
 *
 * docs/60-conformance-and-testability.md#inv-8 (verbatim): "Asserts: upcast(v_old -> v_n)
 * terminates with a typed result (value | quarantine) for every historical and future fact
 * version; unknown versions pass through as opaque-quarantined; it never throws and never
 * invents missing required data (M-8, honoring the no-fallback rule N5). Class: termination /
 * typed-result. Violation: an upcaster that throws, hangs, or fabricates required data."
 *
 * SURFACE STATE (round-2 re-audit): the `CellSegment` discriminated union NOW carries a fourth
 * `kind:"quarantine"` variant (index.ts / types.ts, `reason:"unknown-version"|"malformed-supersede"`)
 * with a real producing path — `proj.ts`'s `reduceRawCell` quarantines any winner whose `v` exceeds
 * the projection's `knownMaxVersion` (default `1`) rather than trusting its `value`. That path is
 * reachable end-to-end from a bare public `new KipRepo()` through `getNode`, so the "typed result
 * value | quarantine" half of INV-8 IS testable on the current surface and is now asserted directly
 * (the third `it` below, no longer `it.skip`'d — round-2 finding F1). The `"terminates ... never
 * throws" half is exercised by the first two `it`s: a fact whose schema version `v` is deliberately
 * unusual (far-future / stale-historical) must resolve through `getNode`, never reject — a build that
 * naively threw on an unrecognized `v` (e.g. `"ERR_UNSUPPORTED_SCHEMA_VERSION"`) would fail them.
 *
 * REMAINING SURFACE GAP (still `it.skip`'d below, genuinely deferred): index.ts exposes NO
 * ontology/schema-registration method (no `NodeKindDef`/`PropSchema`/"required prop" API), so a
 * scenario where an upcaster must decide "is a required field missing" cannot be constructed at all —
 * "never invents missing required data" has no schema to declare a field required against.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

describe("INV-8: upcaster soundness (terminates, never invents)", () => {
  it("a fact stamped with a far-future, never-declared schema version terminates through getNode without throwing (the upcaster's 'never throws' half, unknown-version passthrough)", async () => {
    const eid = "person/inv8-future-version";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const futureVersioned = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "status" },
      id: "inv8-future-versioned-fact",
      v: 999_999,
    });
    futureVersioned.value = "from-the-future";
    futureVersioned.validFrom = 0;
    futureVersioned.validTo = null;

    const repo = new KipRepo();
    await repo.ingest(existence);
    await repo.ingest(futureVersioned);

    // MUST resolve (terminate), never reject/throw, purely because `v` is unrecognized.
    await expect(repo.getNode(eid)).resolves.toBeTruthy();
  });

  it("a fact stamped with a stale historical schema version (v=0, below any version this suite ever declares) terminates through getNode without throwing, and re-projecting on an independent replica terminates identically (deterministic pass-through, not a crash unique to one replica)", async () => {
    const eid = "person/inv8-historical-version";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const historicallyVersioned = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "status" },
      id: "inv8-historical-versioned-fact",
      v: 0,
    });
    historicallyVersioned.value = "from-the-past";
    historicallyVersioned.validFrom = 0;
    historicallyVersioned.validTo = null;

    const repoA = new KipRepo();
    await repoA.ingest(existence);
    await repoA.ingest(historicallyVersioned);

    const repoB = new KipRepo();
    await repoB.ingest({ ...existence });
    await repoB.ingest({ ...historicallyVersioned });

    const viewA = await repoA.getNode(eid);
    const viewB = await repoB.getNode(eid);
    expect(viewA).toBeTruthy();
    expect(viewB).toEqual(viewA);
  });

  it("a fact stamped with a far-future, never-declared schema version projects a TYPED `quarantine` segment through getNode (the 'typed result value | quarantine' half of INV-8: an unknown version is opaque-quarantined, never trusted as a value or silently dropped)", async () => {
    const eid = "person/inv8-quarantine-typed";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const futureVersioned = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "status" },
      id: "inv8-quarantine-typed-fact",
      v: 999_999,
    });
    futureVersioned.value = "from-the-future";
    futureVersioned.validFrom = 0;
    futureVersioned.validTo = null;

    const repo = new KipRepo();
    await repo.ingest(existence);
    await repo.ingest(futureVersioned);

    const view = await repo.getNode(eid);
    expect(view).not.toBeNull();
    const segments = view!.props.status.segments;
    expect(segments).toHaveLength(1);
    // The typed quarantine result INV-8 names: NOT a trusted `value` (the fact's `v` exceeds the
    // projection's `knownMaxVersion` default of 1), NOT a silent drop — an opaque, typed carrier.
    expect(segments[0]).toMatchObject({
      kind: "quarantine",
      v: 999_999,
      reason: "unknown-version",
      assertedBy: futureVersioned.id,
    });
  });

  // SKIP-REASON: D-38 sub-goal (a) / D-50 (conformance scaffolding-seam gaps). Deferred, not a logic
  // gap: no ontology/schema-registration seam (NodeKindDef/PropSchema/required-prop API) exists on
  // the public surface, so a "later schema version adds a REQUIRED prop an older fact omits" scenario
  // cannot be constructed at all. Inventing that seam is out of this work item's scope.
  it.skip(
    "UNTESTABLE AS CURRENTLY SCAFFOLDED: index.ts's Repo surface exposes NO ontology/schema-registration method (no NodeKindDef/PropSchema/'required prop' API) — so a scenario where a later schema version adds a REQUIRED prop that an older fact omits cannot be constructed at all, and 'never invents missing required data' has no declared-required field to test against. See this task's `untestable` report.",
    () => {
      // Intentionally skipped, not faked.
    },
  );
});
