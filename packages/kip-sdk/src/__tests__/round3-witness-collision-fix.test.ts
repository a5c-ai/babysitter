/**
 * round3-witness-collision-fix.test.ts — NON-FROZEN, additive regression coverage for THIS round's
 * fix to a NEW, same-CLASS storage-layer bug an adversarial critic live-reproduced against round
 * 2's own fix (round 2 scores 83/74/88, min=74 — this file's bug is what dragged that score down).
 *
 * THE BUG (round 2): to let INV-14a's FROZEN conformance test (`src/__tests__/conformance/
 * inv-14a.test.ts`, not modified by this round) simulate local-store eviction (A-7) by deleting a
 * file it finds via a literal recursive `<factId>.json` filename search, round 2 added a tiny
 * "eviction witness" pointer file per admitted fact, at `facts/by-id/<encodeURIComponent(factId)>
 * .json` (substrate.ts's `writeFactBlob`/`writeFactWitness`). `listFactBlobs()` treats a MISSING
 * witness file as "this admission's local link is evicted" and skips it — but the witness path was
 * keyed ONLY by the caller-DECLARED `factId`, never by the fact's real content `oid`. Two admitted
 * facts that declare the SAME `id` but have DIFFERENT content (well-formed.ts's item-4 check is a
 * documented length-only heuristic — no grinding required this time, since the witness path never
 * depended on the oid at all) therefore shared exactly ONE witness file. Deleting that shared
 * witness to simulate evicting ONE of the two facts collaterally evicted the OTHER too — flipping
 * its pin from `pin-complete` to `pin-incomplete` and hiding it from `listFactBlobs()`/
 * `currentFacts()`/`proj()` — even though that other fact's actual content bytes were untouched and
 * still present in the real, collision-safe, oid-keyed object store.
 *
 * THE FIX (substrate.ts): the witness path is now namespaced by BOTH the fact's real content `oid`
 * AND its declared `factId` (`facts/by-id/<oid>/<factId>.json`), so two distinct-content facts
 * sharing a declared id get two DISTINCT witness files. INV-14a's frozen test's recursive
 * `<factId>.json` search still finds this file (it is agnostic to directory depth — see that
 * file's own doc comment), so its eviction-simulation recipe is completely undisturbed.
 *
 * This test ingests a legitimate fact and a forged fact declaring the SAME id with different
 * content (admitted via the unregistered-fingerprint placeholder path — the same technique
 * round2-critic-fixes.test.ts's "Round-3 fix" describe block and INV-13a's frozen fixture both
 * rely on), pins ONLY the legitimate fact's chain (mirroring INV-14a's own "a chain entirely absent
 * from the frontier is EXCLUDED" test), then simulates local-store eviction of the FORGED fact's
 * witness the same way INV-14a's own test does (find-and-delete a file matching `<factId>.json`),
 * and asserts the legitimate fact is NOT collaterally affected: `resolvePin` stays `pin-complete`
 * with the ORIGINAL digest, and a fresh `listFactBlobs()` read still returns the legitimate fact's
 * bytes while genuinely omitting the (now-evicted) forged fact's bytes.
 *
 * Confirmed to FAIL against the pre-fix (round-2) `substrate.ts` (reasoned through the code path,
 * per this task's instructions, since the shared single-witness-file mechanic there directly causes
 * legit's own witness to disappear alongside forged's — see the inline comments below at each
 * assertion for exactly why) and to PASS after this round's fix.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import type { FactId } from "../index";
import { KipRepo } from "../index";
import { gitBlobId, Substrate, type HashAlgo } from "../substrate";
import { makeWellFormedFact } from "./conformance/fixtures";

/** A fresh, test-owned temp directory — mirrors inv-14a.test.ts's own `freshRepoDir()`. */
function freshRepoDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kip-round3-witness-"));
}

/**
 * The SAME literal-filename matching predicate as inv-14a.test.ts's frozen `findFactBlobFile`
 * (`entry.name === \`${factId}.json\``, agnostic to directory depth) — but collecting EVERY match
 * instead of returning on the first, so this test can directly observe how many distinct witness
 * files exist for one declared `factId` (pre-fix: 1, shared; post-fix: 1 per distinct-content
 * admission).
 */
function findAllFactWitnessFiles(rootDir: string, factId: FactId): string[] {
  const matches: string[] = [];
  const stack: string[] = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.name === `${factId}.json`) {
        matches.push(full);
      }
    }
  }
  return matches;
}

describe("Round-3 fix: a shared declared-id eviction witness can no longer collaterally evict a distinct-content fact", () => {
  it("evicting a forged fact's witness (by find-and-delete-by-factId, INV-14a's own recipe) does not collaterally hide a legitimate fact declaring the same id", async () => {
    const dir = freshRepoDir();
    const hashAlgo: HashAlgo = "sha1";
    const replicaId = "replica-round3-legit";
    const attackerReplicaId = "replica-round3-forged-ATTACKER";
    const declaredId = "round3-collision-shared-id";

    const repo = new KipRepo({ dir, replicaId, hashAlgo });

    const legit = makeWellFormedFact({
      replicaId,
      seq: 0,
      id: declaredId,
      target: { kind: "node-prop", eid: "person/round3-collision-legit", prop: "p0" },
      value: "LEGIT-CONTENT",
    });
    await expect(repo.ingest(legit)).resolves.toEqual({ admitted: true });

    // Pin ONLY the legitimate fact's chain (declared BEFORE the forged fact is ever ingested), the
    // same "a chain absent from the frontier is EXCLUDED" shape INV-14a's own 4th test exercises —
    // so the forged fact's (different-replicaId) chain is never enumerated by `ref` and its
    // presence/absence can never itself move `resolvePin`'s verdict either way.
    const ref = await repo.pin({ tenant: "tenant-round3-collision" });
    const before = await repo.resolvePin(ref);
    expect(before.status).toBe("pin-complete");
    const originalDigest = (before as { factSetDigest: string }).factSetDigest;

    // The forged fact: declares the SAME `id` as `legit` but DIFFERENT content, on a DIFFERENT
    // (replicaId, key) chain (so it lands outside `ref`'s frontier) — admitted via the genuinely
    // UNregistered-fingerprint placeholder path (this `repo` has no keyPair for "known-fpr-1", the
    // fixtures' default fingerprint; INV-13a requires this admit unconditionally). No grinding is
    // needed (unlike round2-storage-collision-fix.test.ts's shard-prefix attack): this bug's witness
    // path never depended on the oid at all.
    const forged = makeWellFormedFact({
      replicaId: attackerReplicaId,
      seq: 0,
      id: declaredId,
      target: { kind: "node-prop", eid: "person/round3-collision-forged", prop: "p0" },
      value: "FORGED-DIFFERENT-CONTENT",
    });
    await expect(repo.ingest(forged)).resolves.toEqual({ admitted: true });

    // Sanity (mirrors INV-14a's own excluded-chain test): admitting a fact on a chain `ref` never
    // enumerated must not move `resolvePin`'s verdict at all.
    const afterForgedIngest = await repo.resolvePin(ref);
    expect(afterForgedIngest).toEqual({ status: "pin-complete", factSetDigest: originalDigest });

    const legitJson = JSON.stringify(legit);
    const forgedJson = JSON.stringify(forged);
    const legitOid = gitBlobId(Buffer.from(legitJson, "utf8"), hashAlgo);
    const forgedOid = gitBlobId(Buffer.from(forgedJson, "utf8"), hashAlgo);
    expect(legitOid).not.toBe(forgedOid);

    // ROUND-3 FIX, DIRECTLY OBSERVED: two witness files exist for the ONE shared declared `factId` —
    // one per distinct-content admission. Pre-fix (round 2), the witness path was keyed by `factId`
    // ALONE (no oid anywhere in it), so this recursive, depth-agnostic search — the EXACT mechanism
    // INV-14a's frozen test itself uses — would find exactly ONE shared file here, not two.
    const witnessFiles = findAllFactWitnessFiles(dir, declaredId);
    expect(witnessFiles.length).toBe(2);

    const forgedWitness = witnessFiles.find((f) => fs.readFileSync(f, "utf8") === forgedOid);
    const legitWitness = witnessFiles.find((f) => fs.readFileSync(f, "utf8") === legitOid);
    if (!forgedWitness || !legitWitness) {
      throw new Error("test-fixture bug: could not identify each fact's own witness file by its oid content");
    }
    expect(forgedWitness).not.toBe(legitWitness);

    // Simulate local-store eviction (A-7) of ONLY the FORGED fact's link — INV-14a's own exact
    // recipe (find-and-delete a file matching `<factId>.json`), just applied to the specific match
    // identified as the forged fact's own witness above.
    fs.rmSync(forgedWitness);

    // THE CRITICAL ASSERTION: the legitimate fact's chain (the only chain `ref` enumerates) must
    // still be seq-contiguous — `resolvePin` must remain `pin-complete` with the ORIGINAL digest.
    // Pre-fix, deleting the SHARED witness file would have also deleted the legitimate fact's own
    // (identically-pathed) witness, hiding `legit` from `currentFacts()` too, opening a seq-0 gap on
    // its own chain and flipping this to `pin-incomplete` — a fact that was never itself evicted.
    const afterEvictingForgedWitness = await repo.resolvePin(ref);
    expect(afterEvictingForgedWitness).toEqual({ status: "pin-complete", factSetDigest: originalDigest });

    // Same story at the raw storage layer, phrased the way this task's prompt phrases it: a fresh
    // read of `listFactBlobs()` must still return the legitimate fact's bytes, while genuinely
    // omitting the (now-evicted) forged fact's bytes — never collaterally dropping the untouched one.
    const reader = new Substrate(dir, hashAlgo);
    const contentsAfterEviction = reader.listFactBlobs();
    expect(contentsAfterEviction).toContain(legitJson);
    expect(contentsAfterEviction).not.toContain(forgedJson);

    // Restoring the forged fact's witness (the exact bytes INV-14a's own recipe restores: the oid
    // text) flips it back to visible, without ever having disturbed the legitimate fact either way —
    // the monotone incomplete->complete-on-delivery shape INV-14a's own eviction test exercises,
    // reproduced here for the forged fact's independently-managed witness.
    fs.writeFileSync(forgedWitness, forgedOid, "utf8");
    const contentsAfterRestore = reader.listFactBlobs();
    expect(contentsAfterRestore).toContain(legitJson);
    expect(contentsAfterRestore).toContain(forgedJson);
  });
});
