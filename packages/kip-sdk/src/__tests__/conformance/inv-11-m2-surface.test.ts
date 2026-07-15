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
 * YES — equal sets => byte-identical answer on every replica (INV-11)."
 *
 * M2-SURFACE SCOPE (why this file exists alongside inv-11.test.ts): inv-11.test.ts drives INV-11
 * over plain assert/retract sets. This file drives the SAME byte-identity claim over a set that
 * additionally contains the M2-surface fact TYPES `supersede` and `re-attest` — the direct test
 * of docs/23 §1's "Supersession and re-attestation are recorded as facts (set-pure)": because
 * they are ordinary facts folded by the same pure `proj`, equal admitted sets containing them
 * MUST still yield a byte-identical `asOf({validTime})` regardless of the order in which the
 * supersede/re-attest facts were delivered relative to the asserts. No assertion here duplicates
 * inv-11.test.ts (which never ingests a supersede/re-attest fact).
 *
 * Facts are hand-built via `makeWellFormedFact`/`cloneFact` (the established M0/M1 fixture
 * convention) and delivered in different orders through `ingest()` — perturbing INGEST/delivery
 * order is the reachable half of INV-11's "perturbs rxFrom / ingest order" recipe (index.ts
 * exposes no `rxFrom` injection seam; see inv-1.test.ts's documented gap). `asOf()` is implemented
 * in the current tree, so these tests run its real validTime lens.
 */
import { describe, expect, it } from "vitest";
import type { Fact } from "../../index";
import { KipRepo } from "../../index";
import { cloneFact, makeWellFormedFact } from "./fixtures";

/** Ingests every fact (deep-cloned) in the exact array order given, into a FRESH repo. */
async function projectInOrder(facts: Fact[]): Promise<KipRepo> {
  const repo = new KipRepo();
  for (const f of facts) {
    // eslint-disable-next-line no-await-in-loop -- intentionally sequential; delivery order is the point
    await repo.ingest(cloneFact(f));
  }
  return repo;
}

describe("INV-11: validTime convergence (closes M2-4) over an M2-surface supersede/re-attest set", () => {
  it("asOf({validTime}).getNode() is BYTE-IDENTICAL across independent replicas admitting the SAME set (existence + assert + `supersede`) in different delivery/ingest orders — supersession recorded as a set-pure fact converges (docs/23 §1; docs/60 INV-11)", async () => {
    const eid = "person/inv11-m2-supersede";

    const existence = makeWellFormedFact({ seq: 0, target: { kind: "node", eid, nodeKind: "person" }, id: "inv11-m2-existence" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const baseAssert = makeWellFormedFact({ seq: 1, target: { kind: "node-prop", eid, prop: "status" }, id: "inv11-m2-assert" });
    baseAssert.value = "v1";
    baseAssert.validFrom = 0;
    baseAssert.validTo = null;

    const supersede = makeWellFormedFact({ seq: 2, target: { kind: "node-prop", eid, prop: "status" }, id: "inv11-m2-supersede" });
    supersede.type = "supersede";
    supersede.supersedes = [baseAssert.id];
    supersede.value = "v2";
    supersede.validFrom = 1000;
    supersede.validTo = null;

    const natural = [existence, baseAssert, supersede];
    const reversed = [supersede, baseAssert, existence];
    const interleaved = [baseAssert, supersede, existence];

    const repoA = await projectInOrder(natural);
    const repoB = await projectInOrder(reversed);
    const repoC = await projectInOrder(interleaved);

    for (const validTime of [0, 500, 1000, 1500]) {
      // eslint-disable-next-line no-await-in-loop -- sequential slices; comparison is the point
      const a = await (await repoA.asOf({ validTime })).getNode(eid);
      // eslint-disable-next-line no-await-in-loop
      const b = await (await repoB.asOf({ validTime })).getNode(eid);
      // eslint-disable-next-line no-await-in-loop
      const c = await (await repoC.asOf({ validTime })).getNode(eid);
      expect(b).toEqual(a);
      expect(c).toEqual(a);
      // ROUND-2 (INV-11 minor + code-quality): pin the SEMANTIC outcome, not merely convergence — the
      // supersede must actually WIN at the instant it overlaps the base (validFrom=1000 overlaps base
      // [0,+inf)), and lose where it does not yet cover. A no-op ("supersession recorded but never
      // supersedes") supersede would satisfy the byte-identity checks above but FAIL this assertion.
      const expected = validTime < 1000 ? "v1" : "v2";
      expect(a?.props.status.segments).toEqual(
        expect.arrayContaining([expect.objectContaining({ kind: "value", value: expected })]),
      );
    }
  });

  it("asOf({validTime}).getNode() is BYTE-IDENTICAL across independent replicas admitting the SAME set (existence + assert + `supersede` + `re-attest`) in different delivery/ingest orders — the full M2-surface fact-type mix converges under valid-time (docs/23 §1/§2.1; docs/60 INV-11)", async () => {
    const eid = "person/inv11-m2-mix";

    const existence = makeWellFormedFact({ seq: 0, target: { kind: "node", eid, nodeKind: "person" }, id: "inv11-m2-mix-existence" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const baseAssert = makeWellFormedFact({ seq: 1, target: { kind: "node-prop", eid, prop: "status" }, id: "inv11-m2-mix-assert" });
    baseAssert.value = "v1";
    baseAssert.validFrom = 0;
    baseAssert.validTo = null;

    const supersede = makeWellFormedFact({ seq: 2, target: { kind: "node-prop", eid, prop: "status" }, id: "inv11-m2-mix-supersede" });
    supersede.type = "supersede";
    supersede.supersedes = [baseAssert.id];
    supersede.value = "v2";
    supersede.validFrom = 1000;
    supersede.validTo = null;

    const reAttest = makeWellFormedFact({ seq: 3, target: { kind: "node-prop", eid, prop: "status" }, id: "inv11-m2-mix-reattest" });
    reAttest.type = "re-attest";
    reAttest.reAttests = baseAssert.id;
    reAttest.value = "v1";
    reAttest.validFrom = 2000;
    reAttest.validTo = null;

    const natural = [existence, baseAssert, supersede, reAttest];
    const reversed = [reAttest, supersede, baseAssert, existence];
    const interleaved = [supersede, existence, reAttest, baseAssert];

    const repoA = await projectInOrder(natural);
    const repoB = await projectInOrder(reversed);
    const repoC = await projectInOrder(interleaved);

    for (const validTime of [0, 1000, 2000, 3000]) {
      // eslint-disable-next-line no-await-in-loop -- sequential slices; comparison is the point
      const a = await (await repoA.asOf({ validTime })).getNode(eid);
      // eslint-disable-next-line no-await-in-loop
      const b = await (await repoB.asOf({ validTime })).getNode(eid);
      // eslint-disable-next-line no-await-in-loop
      const c = await (await repoC.asOf({ validTime })).getNode(eid);
      expect(b).toEqual(a);
      expect(c).toEqual(a);
      // ROUND-2: pin the fold outcome across the whole mix — base [0,+inf)="v1" wins until the
      // supersede overlaps at 1000 ("v2"), then the re-attest re-asserts "v1" from 2000 on (higher
      // validFrom → higher orderKey). A semantic no-op for supersede OR re-attest fails this.
      const expected = validTime < 1000 ? "v1" : validTime < 2000 ? "v2" : "v1";
      expect(a?.props.status.segments).toEqual(
        expect.arrayContaining([expect.objectContaining({ kind: "value", value: expected })]),
      );
    }
  });

  it("the docs/23 §1 OBJECT-shaped supersede `{ inputCids, retract }` CLOSES the named input's interval — the supersede wins over a strictly-higher-orderKey stale base BECAUSE `retract` invalidates it (not merely orderKey competition) — and still converges byte-identically across delivery orders (docs/23 §1; docs/40 SupersedeInput; docs/60 INV-11)", async () => {
    // This is the round-2 spec-fidelity fix's dedicated guard: the flattened `FactId[]` shape the
    // frozen fixtures bake carries NO `retract`, so it can only compete by orderKey; the docs/23 §1
    // object shape's `retract` sub-list is the interval-CLOSING mechanism. Here the base assert has a
    // STRICTLY HIGHER orderKey than the supersede (higher hlc.wall), so without honoring `retract` the
    // stale base would win ("v1"); honoring it, the supersede wins ("v2"). Genuinely fails on any tree
    // whose `proj` folds `supersede.retract` as a no-op.
    const eid = "person/inv11-m2-retract";
    const replicaId = "replica-inv11-m2-retract";

    const existence = makeWellFormedFact({ replicaId, seq: 0, target: { kind: "node", eid, nodeKind: "person" }, id: "inv11-m2-retract-existence" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    // Base assert: value "v1", open interval, deliberately HIGHER orderKey (hlc.wall 5000) than the
    // supersede below — so orderKey-max alone would keep "v1".
    const baseAssert = makeWellFormedFact({ replicaId, seq: 1, hlc: { wall: 5000 }, target: { kind: "node-prop", eid, prop: "status" }, id: "inv11-m2-retract-base" });
    baseAssert.value = "v1";
    baseAssert.validFrom = 0;
    baseAssert.validTo = null;

    // Supersede: value "v2", open interval, LOWER orderKey (hlc.wall 2000), object-shaped supersedes
    // naming the base in BOTH inputCids and retract (docs/23 §1). `retract` closes the base's interval.
    const supersede = makeWellFormedFact({ replicaId, seq: 2, hlc: { wall: 2000 }, target: { kind: "node-prop", eid, prop: "status" }, id: "inv11-m2-retract-supersede" });
    supersede.type = "supersede";
    supersede.supersedes = { inputCids: [baseAssert.id], retract: [baseAssert.id] };
    supersede.value = "v2";
    supersede.validFrom = 0;
    supersede.validTo = null;

    const natural = [existence, baseAssert, supersede];
    const reversed = [supersede, baseAssert, existence];
    const interleaved = [baseAssert, existence, supersede];

    const repoA = await projectInOrder(natural);
    const repoB = await projectInOrder(reversed);
    const repoC = await projectInOrder(interleaved);

    for (const validTime of [0, 1000, 5000]) {
      // eslint-disable-next-line no-await-in-loop -- sequential slices; comparison is the point
      const a = await (await repoA.asOf({ validTime })).getNode(eid);
      // eslint-disable-next-line no-await-in-loop
      const b = await (await repoB.asOf({ validTime })).getNode(eid);
      // eslint-disable-next-line no-await-in-loop
      const c = await (await repoC.asOf({ validTime })).getNode(eid);
      expect(b).toEqual(a);
      expect(c).toEqual(a);
      // The supersede wins over the higher-orderKey base BECAUSE `retract` closed it.
      expect(a?.props.status.segments).toEqual(
        expect.arrayContaining([expect.objectContaining({ kind: "value", value: "v2" })]),
      );
    }
  });
});
