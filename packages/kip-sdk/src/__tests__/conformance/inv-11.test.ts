/**
 * INV-11 — validTime convergence (closes M2-4).
 *
 * docs/60-conformance-and-testability.md#inv-11 (verbatim): "Asserts: equal admitted sets =>
 * byte-identical asOf({validTime}) on all replicas. A dedicated test perturbs rxFrom / ingest
 * order and asserts the validTime answer is unchanged — the convergent counterpart to INV-4.
 * Class: byte-identity. Violation: any regression that leaks rxFrom into the validTime path."
 *
 * docs/23-temporality-and-bitemporality.md §2.1 (verbatim table row): "asOf({validTime}) ...
 * Reads: the admitted set + author-HLCs only — no rxFrom, no commit-DAG walk ... Convergent?:
 * YES — equal sets => byte-identical answer on every replica (INV-11). This is the lens callers
 * should use unless they explicitly want belief audit."
 *
 * Roadmap scope (docs/81-roadmap-epics-and-tasks.md): T3.1 ("Bitemporal envelope") and T3.2
 * ("asOf reads (valid-time lens & belief lens)") both name INV-11 as an exit criterion; T3.2.1
 * ("asOf({validTime}) convergent valid-time lens") is the literal deliverable this file gates.
 *
 * Test methodology: this file follows inv-1.test.ts's own established T12.1-shape harness (the
 * "single-process fold + perturbation rig" docs/80's M1 exit-criteria note names as the gating
 * harness for the sibling ingest-order-perturbation invariants) — the SAME admitted fact set is
 * built on independent `KipRepo` instances, delivered via `ingest()` in different orders, and the
 * resulting `asOf({validTime}).getNode()` projections are asserted byte-identical. Perturbing
 * INGEST/delivery order (rather than `rxFrom` itself, for which index.ts exposes no injection
 * seam — see inv-1.test.ts's own documented gap) is the reachable half of "perturbs rxFrom /
 * ingest order" the INV-11 recipe names as an explicit alternative ("/"), so this file fully
 * covers INV-11's testable contract without any `untestable` residue, unlike its sibling INV-4.
 *
 * Facts are hand-built via `makeWellFormedFact`/`cloneFact` (the established M0/M1 fixture
 * convention) rather than minted through `assertFact`, for the same reason inv-1.test.ts documents:
 * `assertFact` mints `hlc`/`seq` from ITS OWN repo's local clock/chain state and does not return
 * the full signed `Fact` envelope needed to re-offer the exact same bytes to a second,
 * independently-constructed replica.
 *
 * `asOf(...)` currently throws `unimplemented: asOf` (M2/T3.2 not yet implemented) — these tests
 * are EXPECTED TO FAIL right now; failures should surface as the thrown `unimplemented` error
 * propagating through the `await`, not as import/type errors.
 */
import { describe, expect, it } from "vitest";
import type { Fact } from "../../index";
import { KipRepo } from "../../index";
import { cloneFact, makeWellFormedFact } from "./fixtures";

/** Ingests every fact in `facts`, in the exact array order given, into a FRESH repo. */
async function projectInOrder(facts: Fact[]): Promise<KipRepo> {
  const repo = new KipRepo();
  for (const f of facts) {
    // eslint-disable-next-line no-await-in-loop -- intentionally sequential, order is the point
    await repo.ingest(cloneFact(f));
  }
  return repo;
}

describe("INV-11: validTime convergence (closes M2-4)", () => {
  it("asOf({validTime}).getNode() is byte-identical across independent replicas admitting the SAME fact set in different delivery/ingest orders, checked at three validTime slices spanning an assert/assert boundary", async () => {
    const eid = "person/inv11-boundary";

    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const alpha = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, id: "inv11-alpha" });
    alpha.value = "alpha";
    alpha.validFrom = 0;
    alpha.validTo = 1000;

    const beta = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, id: "inv11-beta" });
    beta.value = "beta";
    beta.validFrom = 1000;
    beta.validTo = null;

    const natural = [existence, alpha, beta];
    const reversed = [beta, alpha, existence];
    const interleaved = [alpha, existence, beta];

    const repoA = await projectInOrder(natural);
    const repoB = await projectInOrder(reversed);
    const repoC = await projectInOrder(interleaved);

    // Slice BEFORE the boundary: only `alpha` covers this instant.
    const beforeA = await (await repoA.asOf({ validTime: 500 })).getNode(eid);
    const beforeB = await (await repoB.asOf({ validTime: 500 })).getNode(eid);
    const beforeC = await (await repoC.asOf({ validTime: 500 })).getNode(eid);
    expect(beforeA?.props.status.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "alpha" })]),
    );
    expect(beforeB).toEqual(beforeA);
    expect(beforeC).toEqual(beforeA);

    // Slice ON the boundary: `beta`'s interval [1000, null) is the covering segment (alpha's
    // interval [0, 1000) is half-open and excludes its own `validTo`, the same convention
    // inv-4a.test.ts's split-retract worked example relies on).
    const onA = await (await repoA.asOf({ validTime: 1000 })).getNode(eid);
    const onB = await (await repoB.asOf({ validTime: 1000 })).getNode(eid);
    const onC = await (await repoC.asOf({ validTime: 1000 })).getNode(eid);
    expect(onA?.props.status.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "beta" })]),
    );
    expect(onB).toEqual(onA);
    expect(onC).toEqual(onA);

    // Slice AFTER the boundary: still `beta` (open-ended).
    const afterA = await (await repoA.asOf({ validTime: 1500 })).getNode(eid);
    const afterB = await (await repoB.asOf({ validTime: 1500 })).getNode(eid);
    const afterC = await (await repoC.asOf({ validTime: 1500 })).getNode(eid);
    expect(afterA?.props.status.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "beta" })]),
    );
    expect(afterB).toEqual(afterA);
    expect(afterC).toEqual(afterA);
  });

  it("asOf({validTime}).getNode() is byte-identical across independent replicas admitting the SAME split-retract fact set (docs/21 worked example) in different delivery/ingest orders, checked at slices inside the value/unknown/value segments", async () => {
    const eid = "person/inv11-split";

    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const target = { kind: "node-prop" as const, eid, prop: "status" };
    const assert20 = makeWellFormedFact({ target, id: "inv11-split-assert-0-20" });
    assert20.value = "v1";
    assert20.validFrom = 0;
    assert20.validTo = 20;

    const retractMiddle = makeWellFormedFact({ target, id: "inv11-split-retract-5-10" });
    retractMiddle.type = "retract";
    retractMiddle.validFrom = 5;
    retractMiddle.validTo = 10;

    const natural = [existence, assert20, retractMiddle];
    const reversed = [retractMiddle, assert20, existence];
    const interleaved = [assert20, existence, retractMiddle];

    const repoA = await projectInOrder(natural);
    const repoB = await projectInOrder(reversed);
    const repoC = await projectInOrder(interleaved);

    // Slice inside the FIRST value segment [0, 5).
    const firstA = await (await repoA.asOf({ validTime: 2 })).getNode(eid);
    const firstB = await (await repoB.asOf({ validTime: 2 })).getNode(eid);
    const firstC = await (await repoC.asOf({ validTime: 2 })).getNode(eid);
    expect(firstA?.props.status.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "v1" })]),
    );
    expect(firstB).toEqual(firstA);
    expect(firstC).toEqual(firstA);

    // Slice inside the retracted GAP [5, 10) — must read as `unknown`, never fabricated.
    const gapA = await (await repoA.asOf({ validTime: 7 })).getNode(eid);
    const gapB = await (await repoB.asOf({ validTime: 7 })).getNode(eid);
    const gapC = await (await repoC.asOf({ validTime: 7 })).getNode(eid);
    expect(gapA?.props.status.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "unknown" })]),
    );
    expect(gapB).toEqual(gapA);
    expect(gapC).toEqual(gapA);

    // Slice inside the SECOND value segment [10, 20).
    const secondA = await (await repoA.asOf({ validTime: 15 })).getNode(eid);
    const secondB = await (await repoB.asOf({ validTime: 15 })).getNode(eid);
    const secondC = await (await repoC.asOf({ validTime: 15 })).getNode(eid);
    expect(secondA?.props.status.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "v1" })]),
    );
    expect(secondB).toEqual(secondA);
    expect(secondC).toEqual(secondA);
  });
});
