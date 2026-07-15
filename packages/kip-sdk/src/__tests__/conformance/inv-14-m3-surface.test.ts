/**
 * INV-14 — pin completeness & stability (M3-2 / m3-3 / m7-2), driven through the BITEMPORAL
 * `pin(scope, asOf)` SURFACE METHOD (the combined time-cut + chain-frontier pin M3 adds — distinct
 * from the no-asOf `pin` the frozen inv-14/inv-14a files already cover).
 *
 * docs/60-conformance-and-testability.md#inv-14 (verbatim): "Asserts: a pin resolves to the
 * deterministically-selected subset `{ f ∈ S : chainId(f) ∈ frontier.chainSeq ∧ f.seq ≤
 * frontier.chainSeq[chainId(f)] }` (chain absent ⇒ excluded). The suite drives `resolvePin(ref)`:
 * it takes a pin, delivers a late-arriving sub-frontier fact to ONE replica only, and asserts the
 * lagging replica's `resolvePin` returns `status: "pin-incomplete"` (never a silent partial digest
 * mismatch); after the fact syncs everywhere, EVERY replica's `resolvePin` returns `"pin-complete"`
 * with the IDENTICAL `factSetDigest`. A causal anachronism or key-registration race MUST NOT change
 * the pinned subset's digest once complete ... Class: byte-identity of digest + local completeness
 * decision."
 *
 * docs/40-sdk-api-surface.md (verbatim): "pin(scope: ScopeRef, asOf?: AsOf): Promise<SnapshotRef>;
 * // frontier-addressed snapshot (survives excision)". index.ts's own `pin` doc comment records
 * that the `asOf` path is deliberately NOT yet implemented ("a combined time-cut + chain-frontier
 * pin is M3+ scope") and THROWS when `asOf` is supplied — this file is exactly that M3 path.
 *
 * Non-overlap with the frozen ./inv-14.test.ts and ./inv-14a*.test.ts: those exercise `pin(scope)`
 * WITHOUT `asOf` (single-replica and cross-replica). THIS file drives `pin(scope, asOf)` — every
 * `pin` call passes an `AsOf` — asserting the SAME completeness/stability invariant holds for the
 * bitemporal-frontier pin. No assertion here duplicates the no-asOf pin story there.
 *
 * `pin(scope, asOf)` currently throws `unimplemented: pin with asOf` (index.ts) — these tests are
 * EXPECTED TO FAIL now; the failure surfaces as the thrown `unimplemented` propagating through the
 * `await`, never an import/type error. `ingest()` and `resolvePin()` are real M0–M2 machinery.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import type { FactId } from "../../index";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

/** A fresh, test-owned temp directory (same technique as inv-14.test.ts's own file comment). */
function freshRepoDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kip-inv14-m3-"));
}

/** Generic recursive `<factId>.json` blob locator — agnostic to shard depth/layout (copied from
 * inv-14.test.ts's own justified technique). */
function findFactBlobFile(rootDir: string, factId: FactId): string {
  const stack: string[] = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name === `${factId}.json`) return full;
    }
  }
  throw new Error(`test-fixture bug: no blob file found for factId ${factId} under ${rootDir}`);
}

describe("INV-14: pin completeness & stability — via the bitemporal pin(scope, asOf) surface method", () => {
  it("pin(scope, {validTime}) denotes the deterministic chain-frontier subset AT that validTime cut, and resolvePin returns pin-complete with a recomputed factSetDigest when the sub-frontier chain is fully held (docs/60 INV-14; docs/40 pin(scope, asOf))", async () => {
    const authorReplicaId = "inv14-m3-pin-author";
    const chainId = `${authorReplicaId}/known-fpr-1`;
    const eid = "person/inv14-m3-pin";
    const seq0 = makeWellFormedFact({ replicaId: authorReplicaId, seq: 0, target: { kind: "node-prop", eid, prop: "p0" }, id: "inv14-m3-pin-0" });
    const seq1 = makeWellFormedFact({ replicaId: authorReplicaId, seq: 1, target: { kind: "node-prop", eid, prop: "p1" }, id: "inv14-m3-pin-1" });

    const repo = new KipRepo({ dir: freshRepoDir(), replicaId: "inv14-m3-pin-storage" });
    await repo.ingest(seq0);
    await repo.ingest(seq1);

    // The bitemporal pin path (asOf supplied) — currently throws `unimplemented: pin with asOf`.
    const ref = await repo.pin({ tenant: "tenant-inv14-m3-pin" }, { validTime: Number.MAX_SAFE_INTEGER });
    expect(ref.frontier.chainSeq[chainId]).toBe(1);

    const resolved = await repo.resolvePin(ref);
    expect(resolved.status).toBe("pin-complete");
  });

  it("a late-arriving sub-frontier link flips the LAGGING replica's resolvePin of a pin(scope, asOf) to pin-incomplete; once delivered, BOTH replicas resolve pin-complete with the IDENTICAL factSetDigest (docs/60 INV-14 'never a silent partial digest mismatch ... IDENTICAL factSetDigest')", async () => {
    const authorReplicaId = "inv14-m3-lag-author";
    const eid = "person/inv14-m3-lag";
    const seq0 = makeWellFormedFact({ replicaId: authorReplicaId, seq: 0, target: { kind: "node-prop", eid, prop: "p0" }, id: "inv14-m3-lag-0" });
    const seq1 = makeWellFormedFact({ replicaId: authorReplicaId, seq: 1, target: { kind: "node-prop", eid, prop: "p1" }, id: "inv14-m3-lag-1" });
    const seq2 = makeWellFormedFact({ replicaId: authorReplicaId, seq: 2, target: { kind: "node-prop", eid, prop: "p2" }, id: "inv14-m3-lag-2" });

    const repoA = new KipRepo({ dir: freshRepoDir(), replicaId: "inv14-m3-lag-a" });
    await repoA.ingest(seq0);
    await repoA.ingest(seq1);
    await repoA.ingest(seq2);

    const repoB = new KipRepo({ dir: freshRepoDir(), replicaId: "inv14-m3-lag-b" });
    await repoB.ingest(seq0);
    await repoB.ingest(seq2); // deliberately missing seq1

    const ref = await repoA.pin({ tenant: "tenant-inv14-m3-lag" }, { validTime: Number.MAX_SAFE_INTEGER });

    const lagging = await repoB.resolvePin(ref);
    expect(lagging).toEqual({ status: "pin-incomplete" });

    await repoB.ingest(seq1); // the late-arriving link syncs everywhere

    const onA = await repoA.resolvePin(ref);
    const onB = await repoB.resolvePin(ref);
    expect(onA.status).toBe("pin-complete");
    expect(onB).toEqual(onA); // byte-identical digest once both are complete
  });

  it("eviction MAY regress a bitemporal pin (A-7): evicting a pinned sub-frontier link flips resolvePin to pin-incomplete, and restoring it recovers the ORIGINAL factSetDigest — the evict→restore→recheck transition is conformant (docs/60 INV-14 'Eviction MAY regress a pin (A-7)')", async () => {
    const authorReplicaId = "inv14-m3-evict-author";
    const eid = "person/inv14-m3-evict";
    const seq0 = makeWellFormedFact({ replicaId: authorReplicaId, seq: 0, target: { kind: "node-prop", eid, prop: "p0" }, id: "inv14-m3-evict-0" });
    const seq1 = makeWellFormedFact({ replicaId: authorReplicaId, seq: 1, target: { kind: "node-prop", eid, prop: "p1" }, id: "inv14-m3-evict-1" });

    const dir = freshRepoDir();
    const repo = new KipRepo({ dir, replicaId: "inv14-m3-evict-storage" });
    await repo.ingest(seq0);
    await repo.ingest(seq1);

    const ref = await repo.pin({ tenant: "tenant-inv14-m3-evict" }, { validTime: Number.MAX_SAFE_INTEGER });
    const before = await repo.resolvePin(ref);
    expect(before.status).toBe("pin-complete");
    const originalDigest = (before as { factSetDigest: string }).factSetDigest;

    // Simulate §3.5a retention-driven eviction of the seq1 link's bytes.
    const blobPath = findFactBlobFile(dir, seq1.id);
    const originalBytes = fs.readFileSync(blobPath);
    fs.rmSync(blobPath);

    const afterEviction = await repo.resolvePin(ref);
    expect(afterEviction).toEqual({ status: "pin-incomplete" });

    // Restore (re-fetch) the evicted link — the ORIGINAL digest must return, never a recomputed one.
    fs.writeFileSync(blobPath, originalBytes);
    const restored = await repo.resolvePin(ref);
    expect(restored).toEqual({ status: "pin-complete", factSetDigest: originalDigest });
  });
});
