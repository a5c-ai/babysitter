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
 * docs/25-context-enablement-seams.md pin-completeness rule (condensed): a pin denotes
 * `{ f ∈ S_current : chainId(f) ∈ frontier.chainSeq ∧ f.seq ≤ frontier.chainSeq[chainId(f)] }`;
 * completeness is decided per `(replicaId,key)` chain over the SIGNED `seq` (NOT the HLC
 * (wall,counter) pair), monotone and gap-free by construction at the author; a detected gap on any
 * enumerated chain => `pin-incomplete`, never a silent partial digest (N5). `ChainId` renders as
 * `"<replicaId>/<keyFpr>"`.
 *
 * M2-SURFACE SCOPE (why this file exists alongside inv-14a.test.ts): inv-14a.test.ts builds the
 * pinned chain from plain `assert` facts. This file builds the SAME single-replica pin over a
 * `(replicaId,key)` chain whose links are the M2-surface fact TYPES — `assert` (seq 0),
 * `supersede` (seq 1), `re-attest` (seq 2) — proving pin/`resolvePin` decide the chain-frontier
 * subset over `seq` INDEPENDENT of a link's fact type (supersession/re-attestation are ordinary
 * facts on the chain, docs/23 §1). No assertion here duplicates inv-14a.test.ts (an assert-only
 * chain); the gap/eviction fixture deletes a `supersede` link specifically.
 *
 * Test methodology — simulating a "deleted local store" chain link without reading substrate.ts:
 * a `KipRepo` is opened against an explicit temp dir and a fact's blob located by generic
 * recursive filename search (`<factId>.json`, the literal name index.ts's `ingest()` doc comment
 * gives) — agnostic to shard depth/layout, exactly as inv-14a.test.ts does.
 *
 * `pin()`/`resolvePin()` are M2 machinery; the ingest + fs steps that precede them are real M0
 * machinery and genuinely execute. A well-formed `supersede`/`re-attest` fact is admitted at the
 * signature-only gate (docs/23 §1; INV-6/INV-13 lineage), asserted below before the chain is
 * pinned.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import type { Fact, FactId } from "../../index";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

/** A fresh, test-owned temp directory so this file knows exactly where its substrate lives. */
function freshRepoDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kip-inv14a-m2-"));
}

/** Locates a fact's content-addressed blob file by generic recursive `<factId>.json` search. */
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

describe("INV-14a: single-replica pin sub-case over an M2-surface assert/supersede/re-attest chain", () => {
  it("pin() enumerates a `(replicaId,key)` chain whose links are assert (seq0) + `supersede` (seq1) + `re-attest` (seq2) — chainSeq is the max seq REGARDLESS of link fact type — and resolvePin() is pin-complete and stable across repeated calls (docs/25 pin rule; docs/23 §1)", async () => {
    const dir = freshRepoDir();
    const replicaId = "replica-inv14a-m2-stable";
    const fpr = "known-fpr-1"; // the fixtures' default publicKeyFingerprint (fixtures.ts)

    const repo = new KipRepo({ dir, replicaId });

    const assert0 = makeWellFormedFact({
      replicaId,
      seq: 0,
      target: { kind: "node-prop", eid: "person/inv14a-m2-stable", prop: "status" },
      id: "inv14a-m2-stable-seq0",
    });

    const supersede1: Fact = makeWellFormedFact({
      replicaId,
      seq: 1,
      target: { kind: "node-prop", eid: "person/inv14a-m2-stable", prop: "status" },
      id: "inv14a-m2-stable-seq1",
    });
    supersede1.type = "supersede";
    supersede1.supersedes = [assert0.id];

    const reAttest2: Fact = makeWellFormedFact({
      replicaId,
      seq: 2,
      target: { kind: "node-prop", eid: "person/inv14a-m2-stable", prop: "status" },
      id: "inv14a-m2-stable-seq2",
    });
    reAttest2.type = "re-attest";
    reAttest2.reAttests = assert0.id;

    // A well-formed supersede / re-attest fact is admitted at the signature-only gate.
    expect((await repo.ingest(assert0)).admitted).toBe(true);
    expect((await repo.ingest(supersede1)).admitted).toBe(true);
    expect((await repo.ingest(reAttest2)).admitted).toBe(true);

    const chainId = `${replicaId}/${fpr}`;
    const ref = await repo.pin({ tenant: "tenant-inv14a-m2" });
    expect(ref.frontier.chainSeq[chainId]).toBe(2);

    const first = await repo.resolvePin(ref);
    const second = await repo.resolvePin(ref);
    expect(first.status).toBe("pin-complete");
    expect(second).toEqual(first);
  });

  it("deleting the mid-chain `supersede` link (seq1) from the local store flips resolvePin to pin-incomplete — locally decidable over `seq`, never a silent partial digest — and restoring the identical bytes returns it to pin-complete with the ORIGINAL factSetDigest (docs/60 INV-14a; docs/25 pin-completeness rule)", async () => {
    const dir = freshRepoDir();
    const replicaId = "replica-inv14a-m2-gap";

    const repo = new KipRepo({ dir, replicaId });

    const assert0 = makeWellFormedFact({
      replicaId,
      seq: 0,
      target: { kind: "node-prop", eid: "person/inv14a-m2-gap", prop: "status" },
      id: "inv14a-m2-gap-seq0",
    });

    const supersede1: Fact = makeWellFormedFact({
      replicaId,
      seq: 1,
      target: { kind: "node-prop", eid: "person/inv14a-m2-gap", prop: "status" },
      id: "inv14a-m2-gap-seq1",
    });
    supersede1.type = "supersede";
    supersede1.supersedes = [assert0.id];

    const reAttest2: Fact = makeWellFormedFact({
      replicaId,
      seq: 2,
      target: { kind: "node-prop", eid: "person/inv14a-m2-gap", prop: "status" },
      id: "inv14a-m2-gap-seq2",
    });
    reAttest2.type = "re-attest";
    reAttest2.reAttests = assert0.id;

    expect((await repo.ingest(assert0)).admitted).toBe(true);
    expect((await repo.ingest(supersede1)).admitted).toBe(true);
    expect((await repo.ingest(reAttest2)).admitted).toBe(true);

    const ref = await repo.pin({ tenant: "tenant-inv14a-m2" });
    const beforeEviction = await repo.resolvePin(ref);
    expect(beforeEviction.status).toBe("pin-complete");
    const originalDigest = (beforeEviction as { factSetDigest: string }).factSetDigest;

    // Simulate §3.5a retention-driven eviction of the seq1 `supersede` link's bytes.
    const blobPath = findFactBlobFile(dir, supersede1.id);
    const originalBytes = fs.readFileSync(blobPath);
    fs.rmSync(blobPath);

    const afterEviction = await repo.resolvePin(ref);
    expect(afterEviction).toEqual({ status: "pin-incomplete" });

    // Restore the EXACT original bytes (a re-fetch of the evicted supersede link).
    fs.writeFileSync(blobPath, originalBytes);

    const afterRestore = await repo.resolvePin(ref);
    expect(afterRestore).toEqual({ status: "pin-complete", factSetDigest: originalDigest });
  });
});
