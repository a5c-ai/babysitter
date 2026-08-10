/**
 * Edge valid-time READ consistency (caught by the D-67 end-to-end scenario).
 *
 * THE BUG: a plain `getEdge` (no asOf) did NOT gate on the edge's OWN valid-time, while `getNode`
 * DID (via `nodeLiveVisibleAt`) and `edgeEids` DID (via `edgeExistenceFactId(_, null)`). So a
 * finite-`validTo` edge read `present` from `getEdge` but was `dropped` by `edgeEids` — two reads
 * disagreeing at the same instant, and asymmetric with the node side. Separately, the
 * `asOf({validTime}).getEdge` view applied only the prop-segment lens and never gated edge existence,
 * so it returned an edge OUTSIDE its own `[validFrom, validTo)` interval (a `validFrom:2024` edge read
 * live at `validTime:2023`).
 *
 * THE FIX: both `getEdge` paths now gate on the edge's OWN validity (`edgeValidAt(eid, instant)`) — the
 * exact analogue of `getNode`'s `nodeLiveVisibleAt` gate — while STILL not gating on endpoint-node
 * existence (an edge is its own entity). This reuses the same `edgeValidAt` authority the D-68 fold uses.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import type { EID, HlcOrTime } from "../index";

const prov = (s: string) => ({ author: "t", signature: s, publicKeyFingerprint: "f", signedFields: [] });

async function repoWithEdge(validFrom: HlcOrTime, validTo: HlcOrTime | null): Promise<KipRepo> {
  const repo = new KipRepo();
  const node = (eid: EID) =>
    repo.assertFact({ type: "assert", v: 1, target: { kind: "node", eid }, value: true, validFrom: 0, validTo: null, replicaId: "r", provenance: prov("n" + eid) });
  await node("a");
  await node("b");
  await repo.assertFact({
    type: "assert", v: 1, target: { kind: "edge", eid: "e", edgeKind: "owns", from: "a", to: "b" },
    value: true, validFrom, validTo, replicaId: "r", provenance: prov("e"),
  });
  return repo;
}

describe("plain getEdge gates on the edge's OWN validity — consistent with edgeEids and with getNode", () => {
  it("an UNBOUNDED (validTo:null) edge is present in BOTH getEdge and edgeEids", async () => {
    const repo = await repoWithEdge(0, null);
    expect(await repo.getEdge("e")).not.toBeNull();
    expect(await repo.edgeEids({})).toContain("e");
  });

  it("a FINITE-validTo edge reads null from getEdge AND is dropped by edgeEids (no disagreement)", async () => {
    for (const vt of [100 as HlcOrTime, "2024-01-01" as HlcOrTime, "2099-01-01" as HlcOrTime]) {
      const repo = await repoWithEdge(typeof vt === "string" ? "2020-01-01" : 0, vt);
      const ge = await repo.getEdge("e");
      const ee = await repo.edgeEids({});
      // The load-bearing assertion: the two reads AGREE (both absent), the pre-fix disagreement is gone.
      expect(ge).toBeNull();
      expect(ee).not.toContain("e");
    }
  });

  it("edge parity with the NODE side: a finite-validTo NODE also reads null from getNode (the symmetry that was broken)", async () => {
    const repo = new KipRepo();
    await repo.assertFact({ type: "assert", v: 1, target: { kind: "node", eid: "n" }, value: true, validFrom: 0, validTo: 100, replicaId: "r", provenance: prov("n") });
    expect(await repo.getNode("n")).toBeNull();
    expect(await repo.nodeEids({})).not.toContain("n");
  });
});

describe("asOf({validTime}).getEdge honors the edge's own [validFrom, validTo) interval (date-string bounds)", () => {
  it("a bounded [2020,2024) edge is LIVE inside its interval, null before it starts, null after it ends", async () => {
    const repo = await repoWithEdge("2020-01-01", "2024-01-01");
    expect(await repo.getEdge("e", { validTime: "2019-06-01" })).toBeNull(); // before validFrom
    expect(await repo.getEdge("e", { validTime: "2022-06-01" })).not.toBeNull(); // inside
    expect(await repo.getEdge("e", { validTime: "2025-06-01" })).toBeNull(); // after validTo (expired)
  });

  it("an open [2024, null) edge is null before it starts and LIVE at/after validFrom", async () => {
    const repo = await repoWithEdge("2024-01-01", null);
    expect(await repo.getEdge("e", { validTime: "2023-06-01" })).toBeNull(); // before validFrom
    expect(await repo.getEdge("e", { validTime: "2025-06-01" })).not.toBeNull(); // after validFrom
  });

  it("the two owns edges of a migration read correctly at each point in time (the E2E scenario)", async () => {
    const repo = new KipRepo();
    const node = (eid: EID) => repo.assertFact({ type: "assert", v: 1, target: { kind: "node", eid }, value: true, validFrom: 0, validTo: null, replicaId: "r", provenance: prov("n" + eid) });
    await node("orchid"); await node("kepler"); await node("ledger");
    await repo.assertFact({ type: "assert", v: 1, target: { kind: "edge", eid: "o", edgeKind: "owns", from: "orchid", to: "ledger" }, value: true, validFrom: "2020-01-01", validTo: "2024-01-01", replicaId: "r", provenance: prov("o") });
    await repo.assertFact({ type: "assert", v: 1, target: { kind: "edge", eid: "k", edgeKind: "owns", from: "kepler", to: "ledger" }, value: true, validFrom: "2024-01-01", validTo: null, replicaId: "r", provenance: prov("k") });
    // In 2023 Orchid owned Ledger, Kepler did not yet.
    expect(await repo.getEdge("o", { validTime: "2023-06-01" })).not.toBeNull();
    expect(await repo.getEdge("k", { validTime: "2023-06-01" })).toBeNull();
    // In 2025 the migration is done: Kepler owns, Orchid's ownership is historical.
    expect(await repo.getEdge("o", { validTime: "2025-06-01" })).toBeNull();
    expect(await repo.getEdge("k", { validTime: "2025-06-01" })).not.toBeNull();
  });
});
