/**
 * cell-reducers.test.ts — NON-FROZEN unit coverage proving the `CellReducer` abstraction
 * (cell-reducers.ts) has more than one real, working implementation (this task's MAJOR finding:
 * M1's roadmap commits to `gset`/`pncounter`/`custom:<id>` reducers beyond `lww-hlc`, none of which
 * previously existed). Exercises `gsetReducer`/`pncounterReducer` directly against raw `Fact`
 * arrays (the documented, disclosed scope: no `NodeKindDef`/schema-registration surface exists to
 * wire these into `KipRepo`/`proj.ts` end-to-end yet, see cell-reducers.ts's own doc comment), plus
 * the minimal `resolveCellReducer`/`reducerFor` association seam.
 */
import { describe, expect, it } from "vitest";
import type { Fact } from "../index";
import { KipRepo } from "../index";
import { type CellReducerRef, gsetReducer, pncounterReducer, reducerFor, resolveCellReducer } from "../cell-reducers";
import { makeWellFormedFact } from "./conformance/fixtures";

describe("gsetReducer: grow-only set union", () => {
  it("concurrent asserts with the SAME value union down to one idempotent member", () => {
    const f1 = makeWellFormedFact({ value: "red", target: { kind: "node-prop", eid: "e1", prop: "tags" } });
    const f2 = makeWellFormedFact({ value: "red", target: { kind: "node-prop", eid: "e1", prop: "tags" } });
    const segs = gsetReducer.reduce([f1, f2]);
    expect(segs).toHaveLength(1);
    expect(segs[0].kind).toBe("value");
    expect(segs[0].kind === "value" && segs[0].value).toEqual(["red"]);
  });

  it("concurrent asserts with DIFFERENT values union to BOTH members (OR-Set, no conflict possible)", () => {
    const f1 = makeWellFormedFact({ value: "red", target: { kind: "node-prop", eid: "e1", prop: "tags" } });
    const f2 = makeWellFormedFact({ value: "blue", target: { kind: "node-prop", eid: "e1", prop: "tags" } });
    const segs = gsetReducer.reduce([f1, f2]);
    expect(segs).toHaveLength(1);
    expect(segs[0].kind === "value" && segs[0].value).toEqual(["blue", "red"]);
  });

  it("is idempotent under re-ingestion of the byte-identical fact (same FactId tag, not double-counted)", () => {
    const f1 = makeWellFormedFact({ value: "red", target: { kind: "node-prop", eid: "e1", prop: "tags" } });
    const f1Again: Fact = JSON.parse(JSON.stringify(f1));
    const f2 = makeWellFormedFact({ value: "blue", target: { kind: "node-prop", eid: "e1", prop: "tags" } });
    const segs = gsetReducer.reduce([f1, f1Again, f2]);
    expect(segs[0].kind === "value" && segs[0].value).toEqual(["blue", "red"]);
  });

  it("is order-independent (reducing the same fact set in reverse order yields byte-identical output)", () => {
    const f1 = makeWellFormedFact({ value: "red", target: { kind: "node-prop", eid: "e1", prop: "tags" } });
    const f2 = makeWellFormedFact({ value: "blue", target: { kind: "node-prop", eid: "e1", prop: "tags" } });
    const f3 = makeWellFormedFact({ value: "green", target: { kind: "node-prop", eid: "e1", prop: "tags" } });
    const forward = gsetReducer.reduce([f1, f2, f3]);
    const reversed = gsetReducer.reduce([f3, f2, f1]);
    expect(JSON.stringify(forward)).toBe(JSON.stringify(reversed));
  });

  it("a retract clears membership to unknown (documented coarse-clear scope simplification)", () => {
    const f1 = makeWellFormedFact({ value: "red", target: { kind: "node-prop", eid: "e1", prop: "tags" } });
    const r1 = makeWellFormedFact({ type: "retract", target: { kind: "node-prop", eid: "e1", prop: "tags" } });
    const segs = gsetReducer.reduce([f1, r1]);
    expect(segs).toHaveLength(1);
    expect(segs[0].kind).toBe("unknown");
  });

  it("returns no segments when there are no asserts at all", () => {
    expect(gsetReducer.reduce([])).toEqual([]);
  });
});

describe("pncounterReducer: sum of signed deltas, tag-deduped", () => {
  it("sums positive and negative deltas", () => {
    const f1 = makeWellFormedFact({ value: 5, target: { kind: "node-prop", eid: "e1", prop: "score" } });
    const f2 = makeWellFormedFact({ value: -2, target: { kind: "node-prop", eid: "e1", prop: "score" } });
    const f3 = makeWellFormedFact({ value: 3, target: { kind: "node-prop", eid: "e1", prop: "score" } });
    const segs = pncounterReducer.reduce([f1, f2, f3]);
    expect(segs).toHaveLength(1);
    expect(segs[0].kind === "value" && segs[0].value).toBe(6);
  });

  it("never double-counts a re-offered/re-ingested (byte-identical) fact", () => {
    const f1 = makeWellFormedFact({ value: 10, target: { kind: "node-prop", eid: "e1", prop: "score" } });
    const f1Again: Fact = JSON.parse(JSON.stringify(f1));
    const segs = pncounterReducer.reduce([f1, f1Again]);
    expect(segs[0].kind === "value" && segs[0].value).toBe(10); // NOT 20
  });

  it("is order-independent (commutative sum)", () => {
    const f1 = makeWellFormedFact({ value: 7, target: { kind: "node-prop", eid: "e1", prop: "score" } });
    const f2 = makeWellFormedFact({ value: -4, target: { kind: "node-prop", eid: "e1", prop: "score" } });
    const f3 = makeWellFormedFact({ value: 1, target: { kind: "node-prop", eid: "e1", prop: "score" } });
    const forward = pncounterReducer.reduce([f1, f2, f3]);
    const reversed = pncounterReducer.reduce([f3, f2, f1]);
    expect(JSON.stringify(forward)).toBe(JSON.stringify(reversed));
  });

  it("returns no segments when there are no asserts at all", () => {
    expect(pncounterReducer.reduce([])).toEqual([]);
  });

  /**
   * ROOT-CAUSE FIX (round 3, vulnerable site #4): `deltasByTag.set(f.id, delta)` was a plain
   * last-write-wins `Map` write — sound for a genuinely byte-identical re-offered fact, but NOT for
   * a FORGED tag collision (two DIFFERENT-content asserts sharing the same caller-declared `id`,
   * the well-formed.ts item-4 weak-check residual). Pre-fix, which of the two deltas ended up in
   * the Map (and therefore the summed total) depended on which one was LAST in the input array —
   * an order-dependent sum masquerading as "commutative, no conflict possible". This proves the
   * fix: reducing the same colliding fact set forward vs reversed now yields the IDENTICAL sum.
   */
  it("a forged/colliding tag (two DIFFERENT-content asserts sharing the same FactId) is deduped to ONE deterministic representative, never order-dependently summing (or double-counting) both deltas", () => {
    const collidingHigh = makeWellFormedFact({ id: "forged-tag-collision", value: 100, target: { kind: "node-prop", eid: "e1", prop: "score" } });
    const collidingLow: Fact = { ...makeWellFormedFact({ value: -100, target: { kind: "node-prop", eid: "e1", prop: "score" } }), id: "forged-tag-collision" };
    const uncontested = makeWellFormedFact({ value: 5, target: { kind: "node-prop", eid: "e1", prop: "score" } });

    const forward = pncounterReducer.reduce([collidingHigh, collidingLow, uncontested]);
    const reversed = pncounterReducer.reduce([collidingLow, collidingHigh, uncontested]);

    expect(JSON.stringify(forward)).toBe(JSON.stringify(reversed)); // order-independent despite the forged collision
    const sum = forward[0].kind === "value" ? forward[0].value : NaN;
    // NOT the naive "both deltas summed" total (0 + 5 = 5) and NOT double-counted (either
    // 100+100+5=205 or -100-100+5=-195) — exactly ONE of the two colliding deltas contributes.
    expect(sum === 105 || sum === -95).toBe(true);
  });
});

describe("the minimal reducer-association seam", () => {
  it("resolveCellReducer defaults to lww-hlc when no association is supplied", () => {
    expect(resolveCellReducer(undefined, "node-prop:e1:tags")).toBe("lww-hlc");
    expect(resolveCellReducer(new Map(), "node-prop:e1:tags")).toBe("lww-hlc");
  });

  it("resolveCellReducer honors an explicit per-cell association", () => {
    const assoc = new Map([["node-prop:e1:tags", "gset" as const]]);
    expect(resolveCellReducer(assoc, "node-prop:e1:tags")).toBe("gset");
    expect(resolveCellReducer(assoc, "node-prop:e1:other")).toBe("lww-hlc");
  });

  it("reducerFor dispatches gset/pncounter to their concrete implementations", () => {
    expect(reducerFor("gset")).toBe(gsetReducer);
    expect(reducerFor("pncounter")).toBe(pncounterReducer);
  });

  it("reducerFor throws (never silently falls back) for a ref with no concrete implementation", () => {
    expect(() => reducerFor("max")).toThrow();
    expect(() => reducerFor("min")).toThrow();
    expect(() => reducerFor("custom:my-reducer")).toThrow();
  });
});

/**
 * ROOT-CAUSE FIX (round 3, wiring gap flagged as a MAJOR finding in round 2): `gsetReducer`/
 * `pncounterReducer` previously existed and were unit-tested ONLY against raw `Fact` arrays
 * directly — there was no way for a real `KipRepo` caller to ever select one for a specific cell;
 * `getNode`/`getEdge`/`query` only ever reached the default `lww-hlc` sweep. These tests exercise
 * the actual end-to-end seam: `KipRepo`'s constructor now accepts `cellReducers`/`knownMaxVersion`
 * options that `proj.ts`'s `reduceCellByRef` (via `resolveCellReducer`/`reducerFor`) consults on
 * every real `getNode`/`getEdge` call.
 */
describe("round-3 wiring fix: cellReducers/knownMaxVersion are reachable from a real KipRepo read path (not merely proj()-internal defaults)", () => {
  it("a KipRepo constructed with a gset association for one specific cell projects that cell as a UNION via getNode, while an association-free cell on the SAME node still uses the default lww-hlc pick", async () => {
    const eid = "person/wired-gset";
    const cellReducers = new Map<string, CellReducerRef>([[`node-prop:${eid}:tags`, "gset"]]);
    const repo = new KipRepo({ cellReducers });

    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, value: true, validFrom: 0, validTo: null });
    const tagRed = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "tags" }, value: "red", validFrom: 0, validTo: null });
    const tagBlue = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "tags" }, value: "blue", validFrom: 0, validTo: null });
    const statusA = makeWellFormedFact({ id: "wired-gset-status-a", target: { kind: "node-prop", eid, prop: "status" }, value: "early", validFrom: 0, validTo: 500 });
    const statusB = makeWellFormedFact({ id: "wired-gset-status-b", target: { kind: "node-prop", eid, prop: "status" }, value: "late", validFrom: 500, validTo: null });

    await repo.ingest(existence);
    await repo.ingest(tagRed);
    await repo.ingest(tagBlue);
    await repo.ingest(statusA);
    await repo.ingest(statusB);

    const view = await repo.getNode(eid);
    expect(view).not.toBeNull();

    // `tags` (the associated cell): a real gset union, not a single scalar lww-hlc winner.
    expect(view!.props.tags.segments).toHaveLength(1);
    expect(view!.props.tags.segments[0]).toMatchObject({ kind: "value", value: ["blue", "red"] });

    // `status` (no association for this cell): still the DEFAULT lww-hlc per-sub-interval sweep,
    // proving the association is a per-cell seam, not a global reducer-behavior change.
    expect(view!.props.status.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "value", value: "early", validFrom: 0, validTo: 500 }),
        expect.objectContaining({ kind: "value", value: "late", validFrom: 500, validTo: null }),
      ]),
    );
  });

  it("a KipRepo constructed with a pncounter association projects that cell as a summed counter via getNode", async () => {
    const eid = "person/wired-pncounter";
    const cellReducers = new Map<string, CellReducerRef>([[`node-prop:${eid}:score`, "pncounter"]]);
    const repo = new KipRepo({ cellReducers });

    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, value: true, validFrom: 0, validTo: null });
    const d1 = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "score" }, value: 7, validFrom: 0, validTo: null });
    const d2 = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "score" }, value: -3, validFrom: 0, validTo: null });

    await repo.ingest(existence);
    await repo.ingest(d1);
    await repo.ingest(d2);

    const view = await repo.getNode(eid);
    expect(view!.props.score.segments).toHaveLength(1);
    expect(view!.props.score.segments[0]).toMatchObject({ kind: "value", value: 4 });
  });

  it("a KipRepo constructed with knownMaxVersion=5 no longer quarantines a fact stamped v=5 (previously only reachable as proj()'s own internal default of 1)", async () => {
    const eid = "person/wired-known-max-version";
    const repo = new KipRepo({ knownMaxVersion: 5 });

    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, value: true, validFrom: 0, validTo: null });
    const versioned = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, v: 5, value: "ok", validFrom: 0, validTo: null });

    await repo.ingest(existence);
    await repo.ingest(versioned);

    const view = await repo.getNode(eid);
    expect(view!.props.status.segments[0]).toMatchObject({ kind: "value", value: "ok" });

    // The DEFAULT KipRepo (no knownMaxVersion override) still quarantines the SAME v=5 fact,
    // proving this is a real, honored per-repo option rather than a globally-loosened default.
    const defaultRepo = new KipRepo();
    await defaultRepo.ingest(existence);
    await defaultRepo.ingest(versioned);
    const defaultView = await defaultRepo.getNode(eid);
    expect(defaultView!.props.status.segments[0]).toMatchObject({ kind: "quarantine", v: 5 });
  });
});
