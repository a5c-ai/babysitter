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
    }
  });
});
