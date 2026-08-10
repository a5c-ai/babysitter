/**
 * m1-quarantine-variant.test.ts — NON-FROZEN coverage for this round's MAJOR-finding addition: a
 * REAL, type-level `CellSegment{kind:"quarantine"}` variant (index.ts) that a genuine code path
 * (proj.ts's `reduceRawCell`) can actually produce, closing the gap the frozen inv-8.test.ts's own
 * `it.skip` blocks document ("index.ts's CellSegment discriminated union has only 'value' |
 * 'unknown' | 'conflict' variants ... there is no fourth 'quarantine' variant"). The trigger is
 * deliberately minimal (a fact whose `v` exceeds `proj()`'s configured `knownMaxVersion`, default
 * `1`) — see proj.ts's T2.4 scope note for why a full per-tenant ontology-driven version check
 * remains out of reach absent a schema-registration surface.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import { makeWellFormedFact } from "./conformance/fixtures";

describe("MAJOR finding: versioned upcaster quarantine variant", () => {
  it("a node-prop fact whose v exceeds the known max version projects a kind:'quarantine' segment (not a silent passthrough)", async () => {
    const eid = "person/quarantine-future-version";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, value: true, validFrom: 0, validTo: null });
    const futureVersioned = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "status" },
      v: 999_999,
      value: "from-the-future",
      validFrom: 0,
      validTo: null,
    });

    const repo = new KipRepo();
    await repo.ingest(existence);
    await repo.ingest(futureVersioned);

    const view = await repo.getNode(eid);
    expect(view).not.toBeNull();
    const segments = view!.props.status.segments;
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ kind: "quarantine", v: 999_999, reason: "unknown-version", assertedBy: futureVersioned.id });
  });

  it("a node-prop fact at exactly the known max version (v=1, the default) still projects a normal value segment", async () => {
    const eid = "person/quarantine-known-version";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, value: true, validFrom: 0, validTo: null });
    const knownVersioned = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "status" },
      v: 1,
      value: "current",
      validFrom: 0,
      validTo: null,
    });

    const repo = new KipRepo();
    await repo.ingest(existence);
    await repo.ingest(knownVersioned);

    const view = await repo.getNode(eid);
    const segments = view!.props.status.segments;
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ kind: "value", value: "current" });
  });

  it("quarantine still terminates without throwing and converges identically on two replicas ingesting in opposite order (never invents data, never crashes)", async () => {
    const eid = "person/quarantine-convergence";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, value: true, validFrom: 0, validTo: null });
    const futureVersioned = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "status" },
      v: 42,
      value: "unrecognized",
      validFrom: 0,
      validTo: null,
    });

    const repoA = new KipRepo();
    await repoA.ingest(existence);
    await repoA.ingest(futureVersioned);

    const repoB = new KipRepo();
    await repoB.ingest(futureVersioned);
    await repoB.ingest(existence);

    const viewA = await repoA.getNode(eid);
    const viewB = await repoB.getNode(eid);
    expect(JSON.stringify(viewA)).toBe(JSON.stringify(viewB));
    expect(viewA!.props.status.segments[0].kind).toBe("quarantine");
  });
});
