/**
 * INV-14a — single-replica pin sub-case (M2's exit gate).
 *
 * docs/60-conformance-and-testability.md#inv-14a (verbatim): "Scope: one replica, no sync (the
 * cross-replica identical-digest half needs M3's sync and gates M3 via the full INV-14). Asserts:
 * on a single replica, pin() denotes the deterministic chain-frontier subset; resolvePin computes
 * the digest of exactly that subset; deleting one sub-frontier chain link from the local store
 * (simulated gap) flips resolvePin to pin-incomplete — locally decidable, never a silent partial
 * digest — and restoring it flips back to pin-complete with the original digest (the
 * incomplete -> complete transition is monotone per delivered link). Runnable against M0-M2
 * machinery."
 *
 * docs/25-context-enablement-seams.md's pin-completeness rule (verbatim, condensed): a pin
 * denotes `{ f ∈ S_current : chainId(f) ∈ frontier.chainSeq ∧ f.seq ≤ frontier.chainSeq[chainId(f)] }`
 * (a chain ABSENT from the frontier map is EXCLUDED); completeness is decided per
 * `(replicaId,key)` chain via `seq`-contiguity (every `seq ∈ [0, frontier.chainSeq[chain]]` held);
 * a detected gap on ANY enumerated chain => `pin-incomplete`, never a silent partial digest (N5).
 * `ChainId` renders as `"<replicaId>/<keyFpr>"` (index.ts's own doc comment, §4b.1/m7-1).
 *
 * Roadmap scope (docs/81-roadmap-epics-and-tasks.md): T3.5 ("Frontier-addressed pins
 * (SnapshotRef)") names INV-14a as its exit criterion directly; T3.5.1-T3.5.3 are the
 * `SnapshotRef`/`resolvePin`/seq-contiguity deliverables this file exercises.
 *
 * Test methodology — simulating a "deleted ... local store" chain link without reading
 * substrate.ts: `pin()`/`resolvePin()`'s own implementation (M0-M2 substrate internals) is out of
 * scope for this file to read (task instructions: only index.ts + this directory). Rather than
 * assume any particular on-disk sharding scheme, the local-store-eviction tests below open a
 * `KipRepo` against an EXPLICIT, test-owned temp directory (`new KipRepo({ dir })`, an
 * already-public constructor option) and locate a specific fact's blob file by a generic
 * recursive filename search (`<factId>.json`, the literal name index.ts's own `ingest()` doc
 * comment gives: "writes /facts/<shardHi>/<shardLo>/<f.id>.json") — agnostic to shard depth or
 * directory layout, so it makes no assumption beyond that one documented filename convention.
 * This directly instantiates INV-14a's own "deleting ... from the local store (simulated gap)"
 * recipe (the A-7 retention-eviction narrative, docs/25's pin-completeness rule) rather than
 * substituting a weaker "never-delivered" proxy for it.
 *
 * `pin()`/`resolvePin()` currently throw `unimplemented: pin` / `unimplemented: resolvePin`
 * (M2/T3.5 not yet implemented) — these tests are EXPECTED TO FAIL right now; failures should
 * surface as the thrown `unimplemented` error propagating through the `await`, not as
 * import/type errors. The fact-ingestion and local-store fs manipulation steps that PRECEDE each
 * `pin()`/`resolvePin()` call are real, already-implemented M0 machinery (`ingest()`'s substrate
 * write path) and genuinely execute today.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import type { FactId } from "../../index";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

/** A fresh, test-owned temp directory so this file knows exactly where its substrate lives. */
function freshRepoDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kip-inv14a-"));
}

/**
 * Locates a fact's content-addressed blob file under `rootDir` by a generic recursive filename
 * search (`<factId>.json`) — deliberately agnostic to the substrate's actual shard-directory
 * depth/layout (out of scope for this file to read; see the file-level comment above).
 */
function findFactBlobFile(rootDir: string, factId: FactId): string {
  const stack: string[] = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.name === `${factId}.json`) {
        return full;
      }
    }
  }
  throw new Error(`test-fixture bug: no blob file found for factId ${factId} under ${rootDir}`);
}

describe("INV-14a: single-replica pin sub-case (M2's exit gate)", () => {
  it("pin() denotes the deterministic chain-frontier subset and resolvePin() is stable/deterministic across repeated calls with no intervening changes", async () => {
    const dir = freshRepoDir();
    const replicaId = "replica-inv14a-stable";
    const fpr = "known-fpr-1"; // the fixtures' own default publicKeyFingerprint (fixtures.ts)

    const repo = new KipRepo({ dir, replicaId });

    const chainFact0 = makeWellFormedFact({
      replicaId,
      seq: 0,
      target: { kind: "node-prop", eid: "person/inv14a-stable", prop: "p0" },
      id: "inv14a-stable-seq0",
    });
    const chainFact1 = makeWellFormedFact({
      replicaId,
      seq: 1,
      target: { kind: "node-prop", eid: "person/inv14a-stable", prop: "p1" },
      id: "inv14a-stable-seq1",
    });
    const chainFact2 = makeWellFormedFact({
      replicaId,
      seq: 2,
      target: { kind: "node-prop", eid: "person/inv14a-stable", prop: "p2" },
      id: "inv14a-stable-seq2",
    });

    await repo.ingest(chainFact0);
    await repo.ingest(chainFact1);
    await repo.ingest(chainFact2);

    const chainId = `${replicaId}/${fpr}`;
    const ref = await repo.pin({ tenant: "tenant-inv14a" });
    expect(ref.frontier.chainSeq[chainId]).toBe(2);

    const first = await repo.resolvePin(ref);
    const second = await repo.resolvePin(ref);
    expect(first).toEqual({ status: "pin-complete", factSetDigest: (first as { factSetDigest: string }).factSetDigest });
    expect(second).toEqual(first);
  });

  it("a chain gap (a missing seq below the pinned frontier) flips resolvePin to pin-incomplete — locally decidable, never a silent partial digest — and delivering the missing link flips it back to pin-complete (incomplete -> complete is monotone per delivered link)", async () => {
    const dir = freshRepoDir();
    const replicaId = "replica-inv14a-gap";

    const repo = new KipRepo({ dir, replicaId });

    const seq0 = makeWellFormedFact({
      replicaId,
      seq: 0,
      target: { kind: "node-prop", eid: "person/inv14a-gap", prop: "p0" },
      id: "inv14a-gap-seq0",
    });
    const seq1 = makeWellFormedFact({
      replicaId,
      seq: 1,
      target: { kind: "node-prop", eid: "person/inv14a-gap", prop: "p1" },
      id: "inv14a-gap-seq1",
    });
    const seq2 = makeWellFormedFact({
      replicaId,
      seq: 2,
      target: { kind: "node-prop", eid: "person/inv14a-gap", prop: "p2" },
      id: "inv14a-gap-seq2",
    });

    // Deliberately SKIP seq1 at pin time — a gap below the frontier's max seq.
    await repo.ingest(seq0);
    await repo.ingest(seq2);

    const ref = await repo.pin({ tenant: "tenant-inv14a" });
    const withGap = await repo.resolvePin(ref);
    expect(withGap).toEqual({ status: "pin-incomplete" });

    // Deliver the missing link.
    await repo.ingest(seq1);

    const afterDelivery = await repo.resolvePin(ref);
    expect(afterDelivery.status).toBe("pin-complete");
  });

  it("simulated local-store eviction of a pinned sub-frontier chain link regresses a pin-complete pin back to pin-incomplete (A-7), and restoring the IDENTICAL bytes returns it to pin-complete with the ORIGINAL factSetDigest", async () => {
    const dir = freshRepoDir();
    const replicaId = "replica-inv14a-evict";

    const repo = new KipRepo({ dir, replicaId });

    const seq0 = makeWellFormedFact({
      replicaId,
      seq: 0,
      target: { kind: "node-prop", eid: "person/inv14a-evict", prop: "p0" },
      id: "inv14a-evict-seq0",
    });
    const seq1 = makeWellFormedFact({
      replicaId,
      seq: 1,
      target: { kind: "node-prop", eid: "person/inv14a-evict", prop: "p1" },
      id: "inv14a-evict-seq1",
    });
    const seq2 = makeWellFormedFact({
      replicaId,
      seq: 2,
      target: { kind: "node-prop", eid: "person/inv14a-evict", prop: "p2" },
      id: "inv14a-evict-seq2",
    });

    await repo.ingest(seq0);
    await repo.ingest(seq1);
    await repo.ingest(seq2);

    const ref = await repo.pin({ tenant: "tenant-inv14a" });
    const beforeEviction = await repo.resolvePin(ref);
    expect(beforeEviction.status).toBe("pin-complete");
    const originalDigest = (beforeEviction as { factSetDigest: string }).factSetDigest;

    // Simulate §3.5a retention-driven eviction of the seq1 link's bytes from the local store.
    const blobPath = findFactBlobFile(dir, seq1.id);
    const originalBytes = fs.readFileSync(blobPath);
    fs.rmSync(blobPath);

    const afterEviction = await repo.resolvePin(ref);
    expect(afterEviction).toEqual({ status: "pin-incomplete" });

    // Restore the EXACT original bytes (a re-fetch of the evicted link, not a re-derivation).
    fs.writeFileSync(blobPath, originalBytes);

    const afterRestore = await repo.resolvePin(ref);
    expect(afterRestore).toEqual({ status: "pin-complete", factSetDigest: originalDigest });
  });

  it("a chain entirely absent from the pinned frontier is EXCLUDED — ingesting a fact from a different, non-enumerated (replicaId,key) chain after pinning does not change resolvePin's factSetDigest", async () => {
    const dir = freshRepoDir();
    const replicaId = "replica-inv14a-excluded";
    const otherReplicaId = "replica-inv14a-excluded-OTHER";

    const repo = new KipRepo({ dir, replicaId });

    const seq0 = makeWellFormedFact({
      replicaId,
      seq: 0,
      target: { kind: "node-prop", eid: "person/inv14a-excluded", prop: "p0" },
      id: "inv14a-excluded-seq0",
    });
    await repo.ingest(seq0);

    const ref = await repo.pin({ tenant: "tenant-inv14a" });
    const before = await repo.resolvePin(ref);
    expect(before.status).toBe("pin-complete");
    const digestBefore = (before as { factSetDigest: string }).factSetDigest;

    // A fact from an entirely DIFFERENT (replicaId,key) chain, never enumerated by `ref`.
    const otherChainFact = makeWellFormedFact({
      replicaId: otherReplicaId,
      seq: 0,
      target: { kind: "node-prop", eid: "person/inv14a-excluded-other", prop: "p0" },
      id: "inv14a-excluded-other-seq0",
    });
    await repo.ingest(otherChainFact);

    const after = await repo.resolvePin(ref);
    expect(after).toEqual({ status: "pin-complete", factSetDigest: digestBefore });
  });
});
