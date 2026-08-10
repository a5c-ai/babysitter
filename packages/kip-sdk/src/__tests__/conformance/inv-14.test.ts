/**
 * INV-14 — pin completeness & stability (M3-2 / m3-3 / m7-2) — the CROSS-REPLICA half (M3's exit
 * gate), extending inv-14a.test.ts's single-replica story.
 *
 * docs/60-conformance-and-testability.md#inv-14 (verbatim): "Asserts: a pin resolves to the
 * deterministically-selected subset `{ f ∈ S : chainId(f) ∈ frontier.chainSeq ∧ f.seq ≤
 * frontier.chainSeq[chainId(f)] }` (chain absent ⇒ excluded). The suite drives `resolvePin(ref)`:
 * it takes a pin, delivers a late-arriving sub-frontier fact to ONE replica only, and asserts the
 * lagging replica's `resolvePin` returns `status: "pin-incomplete"` (never a silent partial digest
 * mismatch); after the fact syncs everywhere, EVERY replica's `resolvePin` returns
 * `"pin-complete"` with the IDENTICAL `factSetDigest`. A causal anachronism or key-registration
 * race MUST NOT change the pinned subset's digest once complete ... Class: byte-identity of digest
 * + local completeness decision." Plus the sibling A-7 clause (verbatim): "the suite additionally
 * evicts a pinned sub-frontier chain link past `keyChainDurableCapBytes` on a replica that had
 * previously resolved `pin-complete`, and asserts `resolvePin` correctly reports
 * `pin-incomplete` ... it then restores/re-fetches the link and asserts `resolvePin` returns to
 * `pin-complete` with the ORIGINAL `factSetDigest`."
 *
 * docs/60's own framing (verbatim, §0 preamble): "Milestone sub-invariants (INV-2a, INV-4a,
 * INV-6a, INV-13a, INV-14a below) are scoped sub-cases of their parent §8.4 invariants ... they
 * introduce no requirement their parent does not already carry, and passing a parent implies
 * passing its sub-case." INV-14a's own scope line reads: "Scope: one replica, no sync (the
 * cross-replica identical-digest half needs M3's sync and gates M3 via the full INV-14)." This
 * file is exactly that cross-replica half: it reuses inv-14a.test.ts's local-store-eviction
 * technique but ACROSS TWO INDEPENDENT PHYSICAL REPLICAS (distinct storage `dir`s / `KipRepo`
 * instances) sharing ONE author `(replicaId, key)` chain, which INV-14a's single-replica scope
 * could never exercise — the genuinely NEW claims here are (a) two replicas converge on the
 * IDENTICAL `factSetDigest` once both are complete, regardless of delivery order, and (b) a
 * local-store eviction on ONE replica regresses ONLY that replica's pin, never the other's.
 *
 * Test methodology: `sync()` (M3/T4.2) is still an unimplemented stub, so — exactly like
 * inv-1.test.ts's/inv-11.test.ts's own established pattern for their pre-existing milestones —
 * "delivered to all replicas" is modelled by direct `ingest()` calls on each independent `KipRepo`
 * instance rather than a literal network sync call, since `pin()`/`resolvePin()` (M2/T3.5) are
 * ALREADY IMPLEMENTED and read only each replica's own currently-held fact set — this is the
 * literal T12.1 "single-process fold + perturbation rig" shape, now applied cross-replica. Unlike
 * this suite's inv-9/inv-12 siblings (which call the still-throwing `excise()`/`sync()`), the
 * assertions below exercise REAL, already-implemented `pin`/`resolvePin`/`ingest` machinery and so
 * may genuinely pass today rather than throwing `unimplemented` — an honest, expected outcome
 * given INV-14a's own note that pin/resolvePin's core logic is already M2 machinery; any failure
 * here is a genuine convergence-property regression, not a stub throw. The local-store-eviction
 * technique (finding a fact's `<factId>.json` blob file under a test-owned `dir` and deleting it)
 * is copied verbatim from inv-14a.test.ts's own file-level comment, which explains why this is
 * sound without reading substrate.ts's internals (a generic recursive filename search, agnostic to
 * shard depth/layout).
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import type { FactId, Fact } from "../../index";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

/** A fresh, test-owned temp directory so this file knows exactly where a replica's substrate lives. */
function freshRepoDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kip-inv14-"));
}

/**
 * Locates a fact's content-addressed blob file under `rootDir` by a generic recursive filename
 * search (`<factId>.json`) — the same technique inv-14a.test.ts's own file-level comment
 * establishes and justifies (agnostic to the substrate's actual shard-directory depth/layout, out
 * of scope for this file to read).
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

describe("INV-14: pin completeness & stability — CROSS-REPLICA half (M3's exit gate)", () => {
  it("a late-arriving sub-frontier fact delivered to ONE replica only flips the LAGGING replica's resolvePin() to pin-incomplete; once it syncs everywhere, EVERY replica's resolvePin() reports pin-complete with the IDENTICAL factSetDigest — regardless of the delivery order each replica received the chain in", async () => {
    const authorReplicaId = "author-inv14-cross";
    const fpr = "known-fpr-1"; // fixtures.ts's own default publicKeyFingerprint
    const chainId = `${authorReplicaId}/${fpr}`;
    const eid = "person/inv14-cross";

    const seq0 = makeWellFormedFact({
      replicaId: authorReplicaId,
      seq: 0,
      target: { kind: "node-prop", eid, prop: "p0" },
      id: "inv14-cross-seq0",
    });
    const seq1 = makeWellFormedFact({
      replicaId: authorReplicaId,
      seq: 1,
      target: { kind: "node-prop", eid, prop: "p1" },
      id: "inv14-cross-seq1",
    });
    const seq2 = makeWellFormedFact({
      replicaId: authorReplicaId,
      seq: 2,
      target: { kind: "node-prop", eid, prop: "p2" },
      id: "inv14-cross-seq2",
    });

    // Replica A (the pinning replica) holds the FULL chain up to seq2.
    const dirA = freshRepoDir();
    const replicaA = new KipRepo({ dir: dirA, replicaId: "storage-A" });
    await replicaA.ingest(seq0);
    await replicaA.ingest(seq1);
    await replicaA.ingest(seq2);

    // Replica B (the LAGGING replica) is deliberately missing seq1 — the late-arriving fact.
    const dirB = freshRepoDir();
    const replicaB = new KipRepo({ dir: dirB, replicaId: "storage-B" });
    await replicaB.ingest(seq0);
    await replicaB.ingest(seq2);

    const ref = await replicaA.pin({ tenant: "tenant-inv14-cross" });
    expect(ref.frontier.chainSeq[chainId]).toBe(2);

    const lagging = await replicaB.resolvePin(ref);
    expect(lagging).toEqual({ status: "pin-incomplete" });

    // The fact "syncs everywhere": deliver the missing seq1 link to replica B.
    await replicaB.ingest(seq1);

    const onA = await replicaA.resolvePin(ref);
    const onB = await replicaB.resolvePin(ref);
    expect(onA.status).toBe("pin-complete");
    expect(onB).toEqual(onA); // IDENTICAL factSetDigest on both replicas once both are complete.

    // Delivery-order independence ("a causal anachronism or key-registration race MUST NOT change
    // the pinned subset's digest once complete"): a THIRD replica receiving the exact same chain in
    // a completely different order (plus an unrelated extraneous fact from a DIFFERENT, non-
    // enumerated chain interleaved in — simulating an uncorrelated concurrent write racing in)
    // must resolve to the SAME digest once complete.
    const dirC = freshRepoDir();
    const replicaC = new KipRepo({ dir: dirC, replicaId: "storage-C" });
    const unrelated = makeWellFormedFact({
      replicaId: "author-inv14-cross-UNRELATED",
      seq: 0,
      target: { kind: "node-prop", eid: "person/inv14-cross-unrelated", prop: "p0" },
      id: "inv14-cross-unrelated-seq0",
    });
    await replicaC.ingest(seq2);
    await replicaC.ingest(unrelated);
    await replicaC.ingest(seq0);
    await replicaC.ingest(seq1);

    const onC = await replicaC.resolvePin(ref);
    expect(onC).toEqual(onA);
  });

  it("simulated local-store eviction of a pinned sub-frontier chain link on ONE replica (A-7) regresses ONLY that replica's pin back to pin-incomplete — a SIBLING replica that never evicted anything keeps reporting pin-complete with the SAME factSetDigest throughout — and restoring the evicted replica's link returns it to pin-complete with the ORIGINAL, still-matching digest", async () => {
    const authorReplicaId = "author-inv14-evict-cross";
    const eid = "person/inv14-evict-cross";

    const seq0 = makeWellFormedFact({
      replicaId: authorReplicaId,
      seq: 0,
      target: { kind: "node-prop", eid, prop: "p0" },
      id: "inv14-evict-cross-seq0",
    });
    const seq1 = makeWellFormedFact({
      replicaId: authorReplicaId,
      seq: 1,
      target: { kind: "node-prop", eid, prop: "p1" },
      id: "inv14-evict-cross-seq1",
    });
    const seq2 = makeWellFormedFact({
      replicaId: authorReplicaId,
      seq: 2,
      target: { kind: "node-prop", eid, prop: "p2" },
      id: "inv14-evict-cross-seq2",
    });
    const chain: Fact[] = [seq0, seq1, seq2];

    const dirA = freshRepoDir();
    const replicaA = new KipRepo({ dir: dirA, replicaId: "storage-A-evict" });
    const dirB = freshRepoDir();
    const replicaB = new KipRepo({ dir: dirB, replicaId: "storage-B-evict" });
    for (const f of chain) {
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential baseline setup
      await replicaA.ingest(f);
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential baseline setup
      await replicaB.ingest(f);
    }

    const ref = await replicaA.pin({ tenant: "tenant-inv14-evict-cross" });
    const beforeA = await replicaA.resolvePin(ref);
    const beforeB = await replicaB.resolvePin(ref);
    expect(beforeA.status).toBe("pin-complete");
    expect(beforeB).toEqual(beforeA);
    const originalDigest = (beforeA as { factSetDigest: string }).factSetDigest;

    // Simulate §3.5a retention-driven eviction of the seq1 link's bytes — on replica A ONLY.
    const blobPathA = findFactBlobFile(dirA, seq1.id);
    const originalBytes = fs.readFileSync(blobPathA);
    fs.rmSync(blobPathA);

    const afterEvictionA = await replicaA.resolvePin(ref);
    expect(afterEvictionA).toEqual({ status: "pin-incomplete" });

    // Replica B never evicted anything — it must be COMPLETELY UNAFFECTED by A's local eviction,
    // still reporting pin-complete with the ORIGINAL digest throughout (eviction is replica-local,
    // never a cross-replica side effect).
    const stillOnB = await replicaB.resolvePin(ref);
    expect(stillOnB).toEqual({ status: "pin-complete", factSetDigest: originalDigest });

    // Restore replica A's evicted bytes (a re-fetch of the evicted link, not a re-derivation).
    fs.writeFileSync(blobPathA, originalBytes);

    const restoredA = await replicaA.resolvePin(ref);
    expect(restoredA).toEqual({ status: "pin-complete", factSetDigest: originalDigest });
  });
});
