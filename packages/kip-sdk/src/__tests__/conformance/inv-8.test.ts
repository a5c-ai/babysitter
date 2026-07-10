/**
 * INV-8 — upcaster soundness (terminates, never invents) (M1's exit gate).
 *
 * docs/60-conformance-and-testability.md#inv-8 (verbatim): "Asserts: upcast(v_old -> v_n)
 * terminates with a typed result (value | quarantine) for every historical and future fact
 * version; unknown versions pass through as opaque-quarantined; it never throws and never
 * invents missing required data (M-8, honoring the no-fallback rule N5). Class: termination /
 * typed-result. Violation: an upcaster that throws, hangs, or fabricates required data."
 *
 * SURFACE GAP (recorded here AND in this task's `untestable` report, per this task's
 * instructions to record — not reinterpret or weaken — an invariant that cannot be tested as
 * written against the current index.ts surface): index.ts's `CellSegment` discriminated union
 * (§4 of the module) has exactly THREE variants — `"value"`, `"unknown"`, `"conflict"` — with NO
 * fourth `"quarantine"`/`kip:schema-violation` variant. There is therefore no TYPE-LEVEL way for
 * a test on this surface to assert "a segment carries the typed `quarantine` result" — doing so
 * would require inventing a `CellSegment` variant index.ts does not declare, which this task's
 * instructions explicitly forbid. Separately, index.ts exposes NO ontology/schema-registration
 * method (no `NodeKindDef`/`PropSchema`/"required prop" API), so a scenario where an upcaster
 * must decide "is a required field missing" cannot be constructed at all — "never invents
 * missing required data" has no schema to declare a field required against.
 *
 * What IS testable against the current surface: the "terminates ... never throws" half, for a
 * fact whose schema version `v` is deliberately unusual (far in the future / a stale historical
 * value), via the one read seam that exists (`getNode`). A build that naively throws/rejects on
 * an unrecognized `v` (e.g. `"ERR_UNSUPPORTED_SCHEMA_VERSION"`) would fail this test; a
 * spec-conformant build must resolve.
 *
 * `getNode` currently throws `unimplemented: getNode` (M1 not yet implemented) — these tests are
 * EXPECTED TO FAIL right now; failures should surface as the thrown `unimplemented` error
 * propagating through the `await`, not as import/type errors.
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

  it.skip(
    "UNTESTABLE AS CURRENTLY SCAFFOLDED: index.ts's CellSegment discriminated union has only 'value' | 'unknown' | 'conflict' variants — there is no fourth 'quarantine'/kip:schema-violation variant to assert a segment carries the typed `quarantine` result INV-8 names, and inventing one is out of scope per this task's instructions. See this task's `untestable` report.",
    () => {
      // Intentionally skipped, not faked.
    },
  );

  it.skip(
    "UNTESTABLE AS CURRENTLY SCAFFOLDED: index.ts's Repo surface exposes NO ontology/schema-registration method (no NodeKindDef/PropSchema/'required prop' API) — so a scenario where a later schema version adds a REQUIRED prop that an older fact omits cannot be constructed at all, and 'never invents missing required data' has no declared-required field to test against. See this task's `untestable` report.",
    () => {
      // Intentionally skipped, not faked.
    },
  );
});
