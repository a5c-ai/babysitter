/**
 * INV-1 — proj determinism + replica-local-input independence (M1's exit gate).
 *
 * docs/60-conformance-and-testability.md#inv-1 (verbatim): "proj(factSet) => byte-identical
 * /heads regardless of delivery order, batching, rxFrom, commit-order, the receiver's physical
 * clock, the local key-log sync state, or wall-clock-at-read (C2-1, C3-1). A dedicated test
 * perturbs each fact's rxFrom / ingest order, commit grouping, the simulated receiver clock, and
 * key-registration arrival order, and asserts /heads is unchanged — proving proj reads no
 * replica-local quantity ... Class: byte-identity."
 *
 * Roadmap scope (docs/80-roadmap-and-milestones.md, M1 exit criteria; docs/81
 * roadmap-epics-and-tasks.md T2.2/T2.7): T2.2 ("proj fold pipeline") is gated directly on
 * INV-1, and T2.7 ("Read API: getNode/getEdge & typed traversal") is ALSO gated on INV-1 (not a
 * stale M2 label — verified against docs/81's own task table: T2.7 lives inside Epic E2, which
 * docs/80's milestone->epic map binds to M1, and T2.7's own "Exit criteria" row names INV-1
 * directly). So getNode/getEdge/query are the correct M1-scope read surface to exercise here,
 * not `asOf`'s ReadView (M2/T3.2 machinery, out of scope for this file).
 *
 * Harness shape: docs/80's M1 exit-criteria note names "T12.1's single-process fold +
 * perturbation rig" as the gating harness for INV-1/INV-3, and that rig's own scope note
 * (docs/81 T12.1) says it "depends only on T2.2/T2.3" — i.e. a single-process, same-fact-SET,
 * different-delivery-ORDER replay, not a full multi-replica sync/merge scenario (that is INV-2,
 * M3 scope). This file builds the SAME admitted fact set on independent `KipRepo` instances,
 * delivered via `ingest()` in different orders, and asserts the resulting `getNode`/`query`
 * projections are byte-identical — the literal T12.1 shape.
 *
 * Facts are hand-built via `makeWellFormedFact`/`cloneFact` (the established M0 fixture
 * convention, see fixtures.ts) rather than minted through `assertFact`, because `assertFact`
 * mints `hlc`/`seq` from ITS OWN repo's local clock/chain state and does not return the full
 * signed `Fact` envelope needed to re-offer the exact same bytes to a second, independent
 * replica — there is no `getFact`/export seam on the current `Repo`/`KipRepo` surface for that.
 * Hand-built facts use the SAME unregistered-fingerprint placeholder-signature convention M0's
 * own INV-6a/7a/13a suites use (an unregistered `publicKeyFingerprint` falls through to
 * `isPlaceholderSignature`, per index.ts's `verifySignature`), so every independent `KipRepo`
 * instance admits them identically — this is exactly what lets the SAME fact bytes be replayed,
 * unmodified, across independently-constructed replicas.
 *
 * `getNode`/`getEdge`/`query` currently throw `unimplemented: <name>` (M1 not yet implemented)
 * — these tests are EXPECTED TO FAIL right now; failures should surface as the thrown
 * `unimplemented` error propagating through the `await`, not as import/type errors.
 */
import { describe, expect, it } from "vitest";
import type { EdgeView, Fact, NodeView, TraversalSpec } from "../../index";
import { KipRepo } from "../../index";
import { cloneFact, makeWellFormedFact } from "./fixtures";

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of iter) out.push(item);
  return out;
}

function byEid(a: { eid: string }, b: { eid: string }): number {
  return a.eid < b.eid ? -1 : a.eid > b.eid ? 1 : 0;
}

/** Ingests every fact in `facts`, in the exact array order given, into a FRESH repo. */
async function projectInOrder(facts: Fact[]): Promise<KipRepo> {
  const repo = new KipRepo();
  for (const f of facts) {
    // eslint-disable-next-line no-await-in-loop -- intentionally sequential, order is the point
    await repo.ingest(cloneFact(f));
  }
  return repo;
}

describe("INV-1: proj determinism + replica-local-input independence", () => {
  it("getNode(eid) is byte-identical across independent replicas that admit the SAME fact set in different delivery orders (single-cell, lww-hlc default reducer)", async () => {
    const eid = "person/inv1-node";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const f1 = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, hlc: { wall: 1000 } });
    f1.value = "alpha";
    f1.validFrom = 1000;
    f1.validTo = null;

    const f2 = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, hlc: { wall: 2000 } });
    f2.value = "beta";
    f2.validFrom = 2000;
    f2.validTo = null;

    const f3 = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, hlc: { wall: 1500 } });
    f3.value = "gamma";
    f3.validFrom = 1500;
    f3.validTo = null;

    const natural = [existence, f1, f2, f3];
    const reversed = [f3, f2, f1, existence];
    const interleaved = [f2, existence, f3, f1];

    const repoA = await projectInOrder(natural);
    const repoB = await projectInOrder(reversed);
    const repoC = await projectInOrder(interleaved);

    const viewA = await repoA.getNode(eid);
    const viewB = await repoB.getNode(eid);
    const viewC = await repoC.getNode(eid);

    expect(viewA).not.toBeNull();
    expect(viewA?.eid).toBe(eid);
    expect(viewB).toEqual(viewA);
    expect(viewC).toEqual(viewA);
  });

  it("query() typed-traversal results are byte-identical across independent replicas that admit the SAME node+edge fact set in different delivery orders", async () => {
    const eidA = "person/inv1-edge-a";
    const eidB = "person/inv1-edge-b";
    const edgeEid = "works_at/inv1-edge-1";

    const existenceA = makeWellFormedFact({ target: { kind: "node", eid: eidA, nodeKind: "person" } });
    existenceA.value = true;
    existenceA.validFrom = 0;
    existenceA.validTo = null;

    const existenceB = makeWellFormedFact({ target: { kind: "node", eid: eidB, nodeKind: "person" } });
    existenceB.value = true;
    existenceB.validFrom = 0;
    existenceB.validTo = null;

    const edge = makeWellFormedFact({
      target: { kind: "edge", eid: edgeEid, edgeKind: "works_at", from: eidA, to: eidB },
    });
    edge.value = true;
    edge.validFrom = 0;
    edge.validTo = null;

    const natural = [existenceA, existenceB, edge];
    const reversed = [edge, existenceB, existenceA];

    const repoA = await projectInOrder(natural);
    const repoB = await projectInOrder(reversed);

    const spec: TraversalSpec = { seed: eidA, direction: "out", depth: 1, maxFanout: 10 };
    const resultsA = (await collect<NodeView | EdgeView>(repoA.query(spec))).sort(byEid);
    const resultsB = (await collect<NodeView | EdgeView>(repoB.query(spec))).sort(byEid);

    expect(resultsB).toEqual(resultsA);
  });

  it("re-reading the SAME already-projected replica twice yields byte-identical results (no wall-clock-at-read / read-time nondeterminism)", async () => {
    const eid = "person/inv1-read-stability";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;
    const prop = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" } });
    prop.value = "stable";

    const repo = await projectInOrder([existence, prop]);
    const firstRead = await repo.getNode(eid);
    // Simulate the passage of wall-clock time between reads: proj must not depend on it.
    await new Promise((resolve) => setTimeout(resolve, 5));
    const secondRead = await repo.getNode(eid);
    expect(secondRead).toEqual(firstRead);
  });

  // SKIP-REASON: D-38 sub-goal (a) / D-50 (conformance scaffolding-seam gaps). Deferred, not a
  // logic gap: the rxFrom-stamp / simulated-receiver-clock / key-registration-arrival perturbation
  // seam INV-1 names does not exist on the public Repo/KipRepo/OpenOptions surface, and inventing one
  // is out of this work item's scope. The reachable axis (ingest/delivery order) IS exercised above.
  it.skip(
    "UNTESTABLE AS CURRENTLY SCAFFOLDED (partial): INV-1 also names rxFrom, the receiver's simulated physical clock, and key-registration ARRIVAL order as perturbation axes distinct from ingest/delivery order. index.ts's Repo/KipRepo/OpenOptions surface exposes no seam to inject a fake rxFrom stamp, a simulated receiver clock, or to control key-registration-fact arrival independent of ingest() call order — FactAnnotation.rxFrom is documented as 'annotated AFTER durable recording — NOT ... read by proj/orderKey' but is never returned to a caller to perturb. This file exercises the ingest/delivery-ORDER axis directly (the literal T12.1 harness scope, and the one axis genuinely reachable through the public surface); see this task's `untestable` report.",
    () => {
      // Intentionally skipped, not faked. See the file-level/it-level comments above.
    },
  );
});
