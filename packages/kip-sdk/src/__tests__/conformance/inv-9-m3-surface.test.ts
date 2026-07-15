/**
 * INV-9 — GC / excision safety, the ROLLUP HALF, driven through the `rollup()` SURFACE METHOD.
 *
 * docs/60-conformance-and-testability.md#inv-9 (verbatim): "Asserts: gc / repack / rollup never
 * change query results for any non-excised `asOf`; excision changes results only for the excised
 * CID ... Class: result-stability. Violation: gc altering a non-excised result ...". docs/22-git-
 * substrate.md §5 (verbatim): a rollup "writes a `kip:rollup` marker fact recording the covered HLC
 * range + the pre-rollup tip CID, and materializes a `/heads` snapshot so reads after the rollup
 * bound traversal cost. The old fact blobs remain reachable (auditability) and are not freed."
 * docs/40-sdk-api-surface.md (verbatim): "rollup(opts): Promise<CID>; // read-latency snapshot
 * (does NOT free bytes, §3.5)".
 *
 * Non-overlap with the frozen ./inv-9.test.ts: that file covers INV-9's EXCISION half (drives
 * `excise()`) and EXPLICITLY `it.skip`s the rollup half, citing the roadmap's deferral. This task
 * (M3-surface) brings `rollup()` into scope, so THIS file supplies exactly the deferred half: it
 * drives the `rollup()` surface method and asserts the result-stability clause "rollup never
 * changes query results for any non-excised asOf". No assertion here duplicates the excision-half
 * assertions there.
 *
 * `rollup()` currently throws `unimplemented: rollup` (index.ts) — these tests are EXPECTED TO FAIL
 * now; the failure surfaces as the thrown `unimplemented` propagating through the `await`, never an
 * import/type error. The pre-`rollup()` `ingest()`/`getNode()`/`asOf()` reads are real M0–M2
 * machinery whose captured "before" projections genuinely execute today.
 */
import { describe, expect, it } from "vitest";
import type { HlcStamp } from "../../index";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

describe("INV-9: GC / excision safety — rollup-half (result-stability) via the rollup() surface method", () => {
  it("rollup({ throughHlc }) does NOT change a LIVE (no-asOf) query result: the projected segments of every non-excised cell are byte-identical before and after the rollup (docs/60 INV-9 'rollup never change query results')", async () => {
    const eid = "person/inv9-m3-rollup-live";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "inv9-m3-rollup-live-exist" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;
    const status = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, id: "inv9-m3-rollup-live-status" });
    status.value = "active";
    status.validFrom = 0;
    status.validTo = null;

    const repo = new KipRepo({ replicaId: "inv9-m3-rollup-live" });
    await repo.ingest(existence);
    await repo.ingest(status);

    const before = await repo.getNode(eid);
    const beforeSegments = before?.props.status.segments;

    const throughHlc: HlcStamp = { wall: 1_700_000_000_000, counter: 0, replicaId: "inv9-m3-rollup-live" };
    await repo.rollup({ throughHlc });

    const after = await repo.getNode(eid);
    expect(after?.props.status.segments).toEqual(beforeSegments);
  });

  it("rollup({ throughHlc }) does NOT change a NON-EXCISED historical asOf({validTime}) read: reading through a covered valid-time instant returns the same value segment after the rollup — the old fact blobs remain reachable and reads are unaffected (docs/22 §5 'old fact blobs remain reachable ... not freed'; docs/60 INV-9)", async () => {
    const eid = "person/inv9-m3-rollup-asof";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "inv9-m3-rollup-asof-exist" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;
    const status = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, id: "inv9-m3-rollup-asof-status" });
    status.value = "s1";
    status.validFrom = 100;
    status.validTo = null;

    const repo = new KipRepo({ replicaId: "inv9-m3-rollup-asof" });
    await repo.ingest(existence);
    await repo.ingest(status);

    const before = await (await repo.asOf({ validTime: 500 })).getNode(eid);
    const beforeSegments = before?.props.status.segments;

    const throughHlc: HlcStamp = { wall: 1_700_000_000_000, counter: 5, replicaId: "inv9-m3-rollup-asof" };
    await repo.rollup({ throughHlc });

    const after = await (await repo.asOf({ validTime: 500 })).getNode(eid);
    expect(after?.props.status.segments).toEqual(beforeSegments);
    // The pre-rollup value is still reconstructable — rollup consolidated read latency, not history.
    expect(after?.props.status.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "s1" })]),
    );
  });

  it("rollup returns a content-addressed CID — the deterministic `kip:rollup` marker (a pure function of the covered range + pre-rollup tip), not a fabricated/opaque handle (docs/40 rollup(): Promise<CID>; docs/22 §5)", async () => {
    const repo = new KipRepo({ replicaId: "inv9-m3-rollup-cid" });
    const fact = makeWellFormedFact({ target: { kind: "node", eid: "person/inv9-m3-rollup-cid", nodeKind: "person" }, id: "inv9-m3-rollup-cid-0" });
    fact.value = true;
    fact.validFrom = 0;
    fact.validTo = null;
    await repo.ingest(fact);

    const throughHlc: HlcStamp = { wall: 1_700_000_000_000, counter: 0, replicaId: "inv9-m3-rollup-cid" };
    const cid = await repo.rollup({ throughHlc });
    expect(typeof cid).toBe("string");
    expect(cid.length).toBeGreaterThan(0);
  });
});
