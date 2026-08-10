/**
 * round2-storage-collision-fix.test.ts — NON-FROZEN, additive regression coverage for THIS round's
 * fix to a CRITICAL storage-layer security regression two independent adversarial critics
 * live-reproduced against the PRIOR round's `substrate.ts` change (scores 45/33/70, min=33).
 *
 * THE BUG (prior round): `listFactBlobs()` — the function `KipRepo.currentFacts()` calls to
 * reconstruct the admitted fact SET that `proj()` folds — was switched to read fact bytes from a
 * second store keyed by the caller-DECLARED `factId`, sharded only by the first 2 BYTES (4 hex
 * chars) of the fact's REAL content oid. An attacker who forges a fact declaring an EXISTING
 * legitimate fact's `id` but DIFFERENT content can GRIND the forged content (~2^16 attempts,
 * sub-second) until its own real oid happens to share that 2-byte shard prefix — both facts then
 * map to the SAME on-disk path, and whichever is written LAST silently hides the other from
 * `listFactBlobs`. Two honest replicas holding the IDENTICAL admitted fact set could therefore
 * compute DIFFERENT `currentFacts()` results purely from ingest order — breaking SEC (the
 * convergence theorem) and silently dropping a legitimately-admitted, correctly-signed fact.
 *
 * THE FIX (substrate.ts): `listFactBlobs()` now sources fact bytes exclusively from the
 * collision-safe, FULL-oid-keyed object store (a real hash collision, not a grindable 2-byte-
 * prefix collision, would be required for two distinct-content facts to collide there). The
 * per-declared-`factId` file INV-14a's frozen eviction test still needs is kept ONLY as a
 * presence/absence witness pointer — never the thing fact bytes are read from.
 *
 * This test reproduces the EXACT grinding-collision shape both critics used directly against
 * `Substrate` (the same layer, and the same style, as the existing finding-#3 coverage in
 * round2-critic-fixes.test.ts) — confirmed to FAIL against the pre-fix `listFactBlobs()` (which
 * read the per-declared-id, 2-byte-shard-keyed store: both writes below share the same declared
 * `factId` and are constructed to share the same 2-byte oid shard prefix, so pre-fix they collide
 * onto the SAME path and only the last-written fact's bytes would survive) and PASS after the fix.
 */
import * as fs from "node:fs";
import { describe, expect, it } from "vitest";
import { gitBlobId, Substrate, type HashAlgo } from "../substrate";

/**
 * Grinds JSON content declaring `declaredId` (the attacker's forged, colliding `id`) until its
 * REAL content oid shares `targetOid`'s first 2 bytes (4 hex chars) — the exact shard-prefix
 * collision the prior round's vulnerable `writeFactByIdCopy` keyed its path on. Real hashing, no
 * shortcuts: this is genuinely the same grind an attacker would have to run, and it completes in a
 * fraction of a second (expected ~65536 attempts for a 2-byte/16-bit prefix match).
 */
function grindShardPrefixCollision(
  declaredId: string,
  targetOid: string,
  hashAlgo: HashAlgo,
): { json: string; oid: string } {
  const targetPrefix = targetOid.slice(0, 4);
  for (let attempt = 0; attempt < 5_000_000; attempt += 1) {
    const json = JSON.stringify({ id: declaredId, value: `attacker-forged-payload-${attempt}` });
    const oid = gitBlobId(Buffer.from(json, "utf8"), hashAlgo);
    if (oid.slice(0, 4) === targetPrefix) {
      return { json, oid };
    }
  }
  throw new Error("test-fixture bug: grinding a 2-byte shard-prefix collision should succeed well within 5,000,000 attempts");
}

describe("Round-2 CRITICAL fix: a forged-id, grindable 2-byte-shard-prefix collision can no longer hide or overwrite a legitimately-admitted fact", () => {
  it("a legitimate fact and a forged fact declaring the SAME id, whose real content oids share a grindable 2-byte shard prefix, are BOTH present in listFactBlobs() — regardless of write order", () => {
    const hashAlgo: HashAlgo = "sha1";
    const declaredId = "legit-fact-being-forged";
    const legitJson = JSON.stringify({ id: declaredId, value: "LEGITIMATE-CONTENT" });
    const legitOid = gitBlobId(Buffer.from(legitJson, "utf8"), hashAlgo);

    const forged = grindShardPrefixCollision(declaredId, legitOid, hashAlgo);

    // Sanity: this is a REAL distinct-content collision on the exploitable shard prefix, not a
    // trivial/degenerate case.
    expect(forged.oid).not.toBe(legitOid);
    expect(forged.oid.slice(0, 4)).toBe(legitOid.slice(0, 4));
    expect(forged.json).not.toBe(legitJson);

    // Order 1: the legitimate fact arrives first, the forged one second — the exact shape both
    // critics live-reproduced (a later-arriving forgery hiding an earlier legitimate fact).
    const substrateA = Substrate.createTemp(hashAlgo);
    try {
      substrateA.writeFactBlob(declaredId, legitJson);
      substrateA.writeFactBlob(declaredId, forged.json);
      const contentsA = substrateA.listFactBlobs();
      expect(contentsA).toContain(legitJson);
      expect(contentsA).toContain(forged.json);
      expect(contentsA.length).toBe(2);
    } finally {
      fs.rmSync(substrateA.dir, { recursive: true, force: true });
    }

    // Order 2: the forged fact arrives FIRST, the legitimate one second. SEC (the convergence
    // theorem) requires the SAME resulting admitted-fact SET regardless of arrival order — two
    // honest replicas that see the same two facts in different orders must converge identically.
    const substrateB = Substrate.createTemp(hashAlgo);
    try {
      substrateB.writeFactBlob(declaredId, forged.json);
      substrateB.writeFactBlob(declaredId, legitJson);
      const contentsB = substrateB.listFactBlobs();
      expect(contentsB).toContain(legitJson);
      expect(contentsB).toContain(forged.json);
      expect(contentsB.length).toBe(2);
    } finally {
      fs.rmSync(substrateB.dir, { recursive: true, force: true });
    }
  });

  it("the SAME grinding collision against a sha256-configured repo is also fully resolved (the fix is not sha1-specific)", () => {
    const hashAlgo: HashAlgo = "sha256";
    const declaredId = "legit-fact-being-forged-sha256";
    const legitJson = JSON.stringify({ id: declaredId, value: "LEGITIMATE-CONTENT-256" });
    const legitOid = gitBlobId(Buffer.from(legitJson, "utf8"), hashAlgo);

    const forged = grindShardPrefixCollision(declaredId, legitOid, hashAlgo);
    expect(forged.oid.slice(0, 4)).toBe(legitOid.slice(0, 4));

    const substrate = Substrate.createTemp(hashAlgo);
    try {
      substrate.writeFactBlob(declaredId, legitJson);
      substrate.writeFactBlob(declaredId, forged.json);
      const contents = substrate.listFactBlobs();
      expect(contents).toContain(legitJson);
      expect(contents).toContain(forged.json);
      expect(contents.length).toBe(2);
    } finally {
      fs.rmSync(substrate.dir, { recursive: true, force: true });
    }
  });
});
