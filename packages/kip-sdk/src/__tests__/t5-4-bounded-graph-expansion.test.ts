/**
 * t5-4-bounded-graph-expansion.test.ts — NON-FROZEN regression coverage for T5.4 ("Bounded graph
 * expansion — opt-in hops/maxFanout caps over AS-OF-VALID edges, never unbounded, to fight context
 * dilution", docs/81e-tasks-m4.md), implementing FR-C2 (docs/10-functional-requirements.md) and
 * NFR-F4 (docs/11-non-functional-requirements.md).
 *
 * THE BUG: `traverse()` (proj.ts) is a bounded BFS over `depth` hops / `maxFanout` fanout that
 * correctly bounds HOP COUNT and PER-NODE FANOUT, but — before this fix — never checked whether a
 * candidate edge was valid AT THE QUERY INSTANT before crossing it (or counting it toward the
 * `maxFanout` budget). It only checked `if (!edgeView) continue` (null = "an existence fact for
 * this edge was NEVER ingested at all") plus `edgeKinds`/`kinds` filters. An edge asserted valid
 * only over `[0, 100)` (i.e. it expires at `t=100` and is never reasserted) was therefore STILL
 * crossed by a `repo.query({..., asOf: {validTime: 500}})` traversal — reaching the far-side node
 * 400 time-units after the edge had expired — and was ALSO still crossed by a plain LIVE (no
 * `asOf`) traversal, even though the edge is not currently valid either.
 *
 * THE FIX (proj.ts): `getEdge`'s existing per-edge existence-cell fold (the SAME
 * `reduceRawCell`+`mergeAdjacent` sweep that already gates props via `gateByExistence` — "existence
 * gates properties, no ghost nodes") is now hoisted into a memoized `computeEdgeExistSegments`
 * helper, shared by a new `ProjResult.edgeValidAt(eid, at)` predicate: `at === null` (a LIVE query)
 * checks the OPEN TAIL segment (this projection has no wall clock, so "now" is deterministically
 * "whatever the most-recently-known state is, extended forward with no further recorded change");
 * `at` a `canon`-ed instant (an `asOf({validTime})` query) checks the segment whose half-open
 * `[validFrom, validTo)` covers it. `traverse()` now calls `edgeValidAt` for every candidate edge
 * BEFORE crossing it and BEFORE charging it against `spec.maxFanout` — an edge that fails this
 * check is skipped entirely, neither yielded nor fanout-charged.
 *
 * Confirmed to FAIL against the pre-fix `traverse()` (reasoned through the code path: the pre-fix
 * loop's only existence check was `if (!edgeView) continue`, which is satisfied here since a
 * positive existence ASSERT for the edge genuinely was ingested — it is merely expired, not
 * "never existed" — so the pre-fix loop crossed it and yielded both the edge and the far-side node
 * in every case this file asserts must NOT happen) and confirmed to PASS after the fix (re-verified
 * live in this session: reverting `traverse()`'s `edgeValidAt` gate back to the pre-fix body made
 * every "must NOT reach"/"must NOT cross" assertion below fail with the far-side node/edge present
 * in the results; restoring the fix made the full file pass again).
 */
import { describe, expect, it } from "vitest";
import type { EdgeView, Fact, NodeView, TraversalSpec } from "../index";
import { KipRepo } from "../index";
import { cloneFact, makeWellFormedFact } from "./conformance/fixtures";

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of iter) out.push(item);
  return out;
}

/** Ingests every fact in `facts`, in the exact array order given, into a FRESH repo — the same
 * minimal harness `inv-1.test.ts` uses. */
async function projectInOrder(facts: Fact[]): Promise<KipRepo> {
  const repo = new KipRepo();
  for (const f of facts) {
    // eslint-disable-next-line no-await-in-loop -- intentionally sequential
    await repo.ingest(cloneFact(f));
  }
  return repo;
}

function eidsOf(items: Array<NodeView | EdgeView>): string[] {
  return items.map((i) => i.eid).sort();
}

describe("T5.4: bounded graph expansion only crosses AS-OF-VALID edges (FR-C2/NFR-F4)", () => {
  it("asOf({validTime}) traversal does NOT cross an edge, nor reach the far-side node, once the edge has expired at the query instant", async () => {
    const eidA = "person/t5-4-a";
    const eidB = "person/t5-4-b";
    const edgeEid = "knows/t5-4-edge-1";

    const existenceA = makeWellFormedFact({ target: { kind: "node", eid: eidA, nodeKind: "person" } });
    existenceA.value = true;
    existenceA.validFrom = 0;
    existenceA.validTo = null;

    const existenceB = makeWellFormedFact({ target: { kind: "node", eid: eidB, nodeKind: "person" } });
    existenceB.value = true;
    existenceB.validFrom = 0;
    existenceB.validTo = null;

    // The edge exists ONLY over [0, 100) -- it expires at t=100 and is never reasserted.
    const edge = makeWellFormedFact({
      target: { kind: "edge", eid: edgeEid, edgeKind: "knows", from: eidA, to: eidB },
    });
    edge.value = true;
    edge.validFrom = 0;
    edge.validTo = 100;

    const repo = await projectInOrder([existenceA, existenceB, edge]);

    // Sanity control: WITHIN the edge's valid window, it is crossed and the far node reached
    // normally -- this fix must not turn into an overbroad "never cross anything" regression.
    const withinWindowSpec: TraversalSpec = {
      seed: eidA,
      direction: "out",
      depth: 1,
      maxFanout: 10,
      asOf: { validTime: 50 },
    };
    const withinResults = await collect<NodeView | EdgeView>(repo.query(withinWindowSpec));
    expect(eidsOf(withinResults)).toEqual([eidA, eidB, edgeEid].sort());

    // THE BUG: 400 time-units AFTER the edge expired, it must NOT be crossed, must NOT be yielded,
    // and the far-side node must NOT be reached -- only the seed node itself comes back.
    const afterExpirySpec: TraversalSpec = {
      seed: eidA,
      direction: "out",
      depth: 1,
      maxFanout: 10,
      asOf: { validTime: 500 },
    };
    const afterResults = await collect<NodeView | EdgeView>(repo.query(afterExpirySpec));
    expect(eidsOf(afterResults)).toEqual([eidA]);
  });

  it("an expired edge does not count toward maxFanout either -- a sibling edge valid at the query instant is still reached even with maxFanout: 1", async () => {
    const eidA = "person/t5-4-fanout-a";
    const eidExpired = "person/t5-4-fanout-expired";
    const eidLive = "person/t5-4-fanout-live";
    const expiredEdgeEid = "knows/t5-4-fanout-expired-edge";
    const liveEdgeEid = "knows/t5-4-fanout-live-edge";

    const existenceA = makeWellFormedFact({ target: { kind: "node", eid: eidA, nodeKind: "person" } });
    existenceA.value = true;
    existenceA.validFrom = 0;
    existenceA.validTo = null;

    const existenceExpired = makeWellFormedFact({ target: { kind: "node", eid: eidExpired, nodeKind: "person" } });
    existenceExpired.value = true;
    existenceExpired.validFrom = 0;
    existenceExpired.validTo = null;

    const existenceLive = makeWellFormedFact({ target: { kind: "node", eid: eidLive, nodeKind: "person" } });
    existenceLive.value = true;
    existenceLive.validFrom = 0;
    existenceLive.validTo = null;

    // Sorted BEFORE the live edge below by `edgesTouching`'s deterministic eid sort (see proj.ts),
    // so it is the FIRST candidate `traverse()`'s loop considers -- if it wrongly consumed the
    // `maxFanout: 1` budget, the live edge below would never be visited.
    const expiredEdge = makeWellFormedFact({
      target: { kind: "edge", eid: expiredEdgeEid, edgeKind: "knows", from: eidA, to: eidExpired },
    });
    expiredEdge.value = true;
    expiredEdge.validFrom = 0;
    expiredEdge.validTo = 100;

    const liveEdge = makeWellFormedFact({
      target: { kind: "edge", eid: liveEdgeEid, edgeKind: "knows", from: eidA, to: eidLive },
    });
    liveEdge.value = true;
    liveEdge.validFrom = 0;
    liveEdge.validTo = null;

    expect(expiredEdgeEid < liveEdgeEid).toBe(true);

    const repo = await projectInOrder([existenceA, existenceExpired, existenceLive, expiredEdge, liveEdge]);

    const spec: TraversalSpec = {
      seed: eidA,
      direction: "out",
      depth: 1,
      maxFanout: 1,
      asOf: { validTime: 500 },
    };
    const results = await collect<NodeView | EdgeView>(repo.query(spec));
    // The expired edge/node must be absent, and the live edge/node must be present despite
    // maxFanout: 1 -- proving the expired edge did not consume the fanout budget.
    expect(eidsOf(results)).toEqual([eidA, eidLive, liveEdgeEid].sort());
  });

  it("the LIVE (non-asOf) path also excludes an edge that is not currently valid", async () => {
    const eidA = "person/t5-4-live-a";
    const eidB = "person/t5-4-live-b";
    const edgeEid = "knows/t5-4-live-edge";

    const existenceA = makeWellFormedFact({ target: { kind: "node", eid: eidA, nodeKind: "person" } });
    existenceA.value = true;
    existenceA.validFrom = 0;
    existenceA.validTo = null;

    const existenceB = makeWellFormedFact({ target: { kind: "node", eid: eidB, nodeKind: "person" } });
    existenceB.value = true;
    existenceB.validFrom = 0;
    existenceB.validTo = null;

    // Expires at t=100 and is never reasserted -- not currently valid under the LIVE (no-asOf)
    // reading either (see proj.ts's `existsAtInstant` doc comment: with no wall clock, "now" is the
    // open tail segment, which for this edge is "unknown" past t=100).
    const edge = makeWellFormedFact({
      target: { kind: "edge", eid: edgeEid, edgeKind: "knows", from: eidA, to: eidB },
    });
    edge.value = true;
    edge.validFrom = 0;
    edge.validTo = 100;

    const repo = await projectInOrder([existenceA, existenceB, edge]);

    const liveSpec: TraversalSpec = { seed: eidA, direction: "out", depth: 1, maxFanout: 10 };
    const liveResults = await collect<NodeView | EdgeView>(repo.query(liveSpec));
    expect(eidsOf(liveResults)).toEqual([eidA]);
  });

  it("the LIVE (non-asOf) path still crosses a currently-valid (open-ended) edge -- no over-broad regression", async () => {
    const eidA = "person/t5-4-live-ok-a";
    const eidB = "person/t5-4-live-ok-b";
    const edgeEid = "knows/t5-4-live-ok-edge";

    const existenceA = makeWellFormedFact({ target: { kind: "node", eid: eidA, nodeKind: "person" } });
    existenceA.value = true;
    existenceA.validFrom = 0;
    existenceA.validTo = null;

    const existenceB = makeWellFormedFact({ target: { kind: "node", eid: eidB, nodeKind: "person" } });
    existenceB.value = true;
    existenceB.validFrom = 0;
    existenceB.validTo = null;

    const edge = makeWellFormedFact({
      target: { kind: "edge", eid: edgeEid, edgeKind: "knows", from: eidA, to: eidB },
    });
    edge.value = true;
    edge.validFrom = 0;
    edge.validTo = null;

    const repo = await projectInOrder([existenceA, existenceB, edge]);

    const liveSpec: TraversalSpec = { seed: eidA, direction: "out", depth: 1, maxFanout: 10 };
    const liveResults = await collect<NodeView | EdgeView>(repo.query(liveSpec));
    expect(eidsOf(liveResults)).toEqual([eidA, eidB, edgeEid].sort());
  });
});
