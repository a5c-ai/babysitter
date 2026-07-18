/**
 * INV-3 — reducer determinism + `orderKey` totality (M1's exit gate).
 *
 * docs/60-conformance-and-testability.md#inv-3 (verbatim): "every registered CellReducer, folded
 * over random permutations of the full fact multiset for a cell, yields byte-identical segments;
 * every reducer's final tiebreak terminates in orderKey. Additionally no two distinct admitted
 * facts share an orderKey (totality ...). Class: byte-identity. Violation: a non-total or
 * non-deterministic reducer, or an orderKey collision between distinct facts."
 *
 * Roadmap scope (docs/81-roadmap-epics-and-tasks.md): T2.1 (orderKey total order), T2.3 (cell
 * reducers), and T2.6 (kip:conflict surfacing) are ALL gated directly on INV-3 — so this file
 * covers four angles: (a) deterministic fold of a cell's full fact multiset under permuted
 * ingest order (the default `lww-hlc` reducer, per SPEC.md §3.4's resolution table), (b) the
 * observable consequence of orderKey TOTALITY (a genuine near-tie on every OrderKey component
 * except `factCID` still resolves to one deterministic winner, never an ambiguous/order-dependent
 * one), (c) `kip:conflict` surfacing for a non-commutative contradiction (two concurrent
 * `supersede` facts over the same input CID asserting different outcomes — SPEC.md §3.4's
 * resolution table row), and (d) — round-2 re-audit finding F2 — that a NON-default registered
 * reducer (`gset`) SELECTED via `KipRepo`'s public `cellReducers` constructor seam
 * (`node-prop:<eid>:<prop>` -> `CellReducerRef`, threaded through `getNode`'s proj call by proj.ts's
 * `reduceCellByRef`) also folds deterministically: its union output converges byte-identically across
 * opposite ingest orders on two replicas. This closes the "only the default reducer is SELECTABLE"
 * gap the previous `it.skip` documented.
 *
 * Still `it.skip`'d below (genuinely deferred): `orderKey(fact)` itself is not exported on the
 * public surface, so orderKey totality cannot be checked DIRECTLY against the tuple — only its
 * observable consequence (angle (b)) is reachable.
 */
import { describe, expect, it } from "vitest";
import type { CellSegment, Fact } from "../../index";
import { KipRepo } from "../../index";
import { cloneFact, makeWellFormedFact } from "./fixtures";

async function projectInOrder(facts: Fact[]): Promise<KipRepo> {
  const repo = new KipRepo();
  for (const f of facts) {
    // eslint-disable-next-line no-await-in-loop -- intentionally sequential, order is the point
    await repo.ingest(cloneFact(f));
  }
  return repo;
}

describe("INV-3: reducer determinism + orderKey totality", () => {
  it("a genuine near-tie (identical validFrom/hlc/replicaId/publicKeyFingerprint, distinct factCID) resolves to the SAME deterministic winner regardless of ingest order — the observable consequence of orderKey totality's factCID final tiebreak", async () => {
    const eid = "person/inv3-tie";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    // Both facts share every OrderKey component EXCEPT factCID (validFrom, hlc.wall/counter,
    // replicaId, and publicKeyFingerprint are all identical by construction) — a genuine tie on
    // every field but the final tiebreak. `id` is set explicitly (not the fixtureCounter default)
    // so the lexicographic winner is unambiguous to a human reader of this test.
    const shared = { target: { kind: "node-prop" as const, eid, prop: "status" }, replicaId: "replica-tie", hlc: { wall: 5000, counter: 0, replicaId: "replica-tie" } };
    const factLow = makeWellFormedFact({ ...shared, id: "orderkey-tie-aaa" });
    factLow.value = "loser";
    factLow.validFrom = 5000;
    factLow.validTo = null;

    const factHigh = makeWellFormedFact({ ...shared, id: "orderkey-tie-zzz" });
    factHigh.value = "winner";
    factHigh.validFrom = 5000;
    factHigh.validTo = null;

    const repoA = await projectInOrder([existence, factLow, factHigh]);
    const repoB = await projectInOrder([existence, factHigh, factLow]);

    const viewA = await repoA.getNode(eid);
    const viewB = await repoB.getNode(eid);
    expect(viewB).toEqual(viewA);

    const segments = viewA?.props.status.segments ?? [];
    const winningSegment = segments.find((s: CellSegment) => s.kind === "value");
    expect(winningSegment).toEqual(
      expect.objectContaining({ kind: "value", value: "winner", assertedBy: "orderkey-tie-zzz" }),
    );
  });

  it("folds the full fact multiset for one cell to byte-identical segments across THREE differently-ordered replicas, matching the exact lww-hlc sweep-line semantics (SPEC.md §3.4)", async () => {
    const eid = "person/inv3-sweep";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const target = { kind: "node-prop" as const, eid, prop: "score" };
    const g1 = makeWellFormedFact({ target, id: "sweep-g1" });
    g1.value = "w";
    g1.validFrom = 100;
    g1.validTo = null;
    const g2 = makeWellFormedFact({ target, id: "sweep-g2" });
    g2.value = "x";
    g2.validFrom = 400;
    g2.validTo = null;
    const g3 = makeWellFormedFact({ target, id: "sweep-g3" });
    g3.value = "y";
    g3.validFrom = 200;
    g3.validTo = null;
    const g4 = makeWellFormedFact({ target, id: "sweep-g4" });
    g4.value = "z";
    g4.validFrom = 300;
    g4.validTo = null;

    const natural = [existence, g1, g2, g3, g4];
    const reversed = [g4, g3, g2, g1, existence];
    const shuffled = [g3, existence, g1, g4, g2];

    const repoA = await projectInOrder(natural);
    const repoB = await projectInOrder(reversed);
    const repoC = await projectInOrder(shuffled);

    const viewA = await repoA.getNode(eid);
    const viewB = await repoB.getNode(eid);
    const viewC = await repoC.getNode(eid);
    expect(viewB).toEqual(viewA);
    expect(viewC).toEqual(viewA);

    // At each elementary sub-interval, the orderKey-max (here: largest validFrom, since every
    // other OrderKey component ties) covering assert wins — SPEC.md §3.4's lww-hlc rule. Four
    // asserts with open-ended (validTo=null) coverage and strictly increasing validFrom produce
    // four contiguous value segments, each won by the assert with the largest validFrom that
    // covers that sub-interval:
    //   [100,200) -> g1 "w" (only g1 covers)         [200,300) -> g3 "y" (g1,g3 cover; g3 wins)
    //   [300,400) -> g4 "z" (g1,g3,g4 cover; g4 wins) [400,null) -> g2 "x" (all four cover; g2 wins)
    const segments = viewA?.props.score.segments ?? [];
    expect(segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "value", value: "w", validFrom: 100, validTo: 200, assertedBy: "sweep-g1" }),
        expect.objectContaining({ kind: "value", value: "y", validFrom: 200, validTo: 300, assertedBy: "sweep-g3" }),
        expect.objectContaining({ kind: "value", value: "z", validFrom: 300, validTo: 400, assertedBy: "sweep-g4" }),
        expect.objectContaining({ kind: "value", value: "x", validFrom: 400, validTo: null, assertedBy: "sweep-g2" }),
      ]),
    );
  });

  it("kip:conflict surfacing: two genuinely-concurrent supersede facts over the SAME input CID asserting DIFFERENT outcomes surface a conflict segment naming both candidates, never a silent factCID/orderKey-max tiebreak (SPEC.md §3.4's non-commutative resolution-table row)", async () => {
    const eid = "person/inv3-conflict";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const target = { kind: "node-prop" as const, eid, prop: "role" };
    const original = makeWellFormedFact({ target, id: "conflict-original" });
    original.value = "intern";
    original.validFrom = 0;
    original.validTo = null;

    // Two DIFFERENT authors' concurrent corrective decisions over the SAME `supersedes` input —
    // neither carries a `causedBy` link to the other, so neither dominates (SPEC.md §3.4: "If two
    // replicas emit different supersede facts over the same/overlapping inputCids ... asserting
    // different outcomes, and neither author-HLC dominates the other").
    const supersedeA = makeWellFormedFact({
      target,
      id: "conflict-supersede-a",
      provenance: { publicKeyFingerprint: "author-a-fpr" },
    });
    supersedeA.type = "supersede";
    supersedeA.supersedes = [original.id];
    supersedeA.value = "senior-engineer";
    supersedeA.validFrom = 1000;
    supersedeA.validTo = null;

    const supersedeB = makeWellFormedFact({
      target,
      id: "conflict-supersede-b",
      provenance: { publicKeyFingerprint: "author-b-fpr" },
    });
    supersedeB.type = "supersede";
    supersedeB.supersedes = [original.id];
    supersedeB.value = "manager";
    supersedeB.validFrom = 1000;
    supersedeB.validTo = null;

    const repo = await projectInOrder([existence, original, supersedeA, supersedeB]);
    const view = await repo.getNode(eid);
    const segments = view?.props.role.segments ?? [];
    const conflictSegments = segments.filter((s: CellSegment) => s.kind === "conflict");

    expect(conflictSegments.length).toBeGreaterThan(0);
    const candidates = (conflictSegments[0] as Extract<CellSegment, { kind: "conflict" }>).candidates.slice().sort();
    expect(candidates).toEqual(["conflict-supersede-a", "conflict-supersede-b"].sort());
  });

  // SKIP-REASON: D-38 sub-goal (a) / D-50 (conformance scaffolding-seam gaps). Deferred, not a logic
  // gap: `orderKey(fact)` is not exported on the public surface, so orderKey totality ("no two
  // distinct admitted facts share an orderKey") cannot be checked directly against the tuple. The
  // observable consequence (a near-tie resolves to one deterministic, order-independent winner) IS
  // exercised above.
  it.skip(
    "UNTESTABLE AS CURRENTLY SCAFFOLDED (partial): `orderKey` itself is not exported by index.ts (no `orderKey(fact)` function on the public surface), so totality ('no two distinct admitted facts share an orderKey') cannot be checked directly against the OrderKey tuple type. This suite instead checks the OBSERVABLE CONSEQUENCE of totality (a genuine near-tie resolves to one deterministic, order-independent winner rather than remaining ambiguous — see the first `it` above) — see this task's `untestable` report.",
    () => {
      // Intentionally skipped, not faked.
    },
  );

  it("a NON-default registered reducer (`gset`) SELECTED via the public `cellReducers` constructor seam folds a cell's multiset into a deterministic union that converges byte-identically across opposite ingest orders — `every registered CellReducer` determinism, not just the lww-hlc default", async () => {
    const eid = "person/inv3-gset-select";
    const cellKey = `node-prop:${eid}:tags`;

    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const tagRed = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "tags" }, id: "inv3-gset-red" });
    tagRed.value = "red";
    tagRed.validFrom = 0;
    tagRed.validTo = null;

    const tagBlue = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "tags" }, id: "inv3-gset-blue" });
    tagBlue.value = "blue";
    tagBlue.validFrom = 0;
    tagBlue.validTo = null;

    // Two replicas ingest the SAME set in OPPOSITE orders; a total, order-independent reducer MUST
    // converge to byte-identical segments (INV-3's core determinism claim, at the gset reducer).
    const reducers = new Map<string, "gset">([[cellKey, "gset"]]);
    const repoA = await (async () => {
      const r = new KipRepo({ cellReducers: reducers });
      await r.ingest(cloneFact(existence));
      await r.ingest(cloneFact(tagRed));
      await r.ingest(cloneFact(tagBlue));
      return r;
    })();
    const repoB = await (async () => {
      const r = new KipRepo({ cellReducers: reducers });
      await r.ingest(cloneFact(existence));
      await r.ingest(cloneFact(tagBlue));
      await r.ingest(cloneFact(tagRed));
      return r;
    })();

    const viewA = await repoA.getNode(eid);
    const viewB = await repoB.getNode(eid);
    const segmentsA = viewA?.props.tags.segments ?? [];
    expect(segmentsA).toHaveLength(1);
    // The gset union is a deterministically-SORTED member array (not a single lww winner) — a shape
    // the default lww-hlc reducer could never produce, so this pins the non-default reducer as SELECTED.
    expect(segmentsA[0]).toMatchObject({ kind: "value", value: ["blue", "red"] });
    expect(viewB).toEqual(viewA);
  });
});
