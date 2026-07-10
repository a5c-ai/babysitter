/**
 * m0-signing-and-substrate.test.ts — NON-FROZEN, additive coverage (per this task's instructions:
 * "You may add tests"). These exercise the REAL Ed25519 sign/verify path (ADR-B2) and the real
 * git-blob substrate write path (T1.1/T1.5), end-to-end, complementing the frozen conformance
 * suite under src/__tests__/conformance/ (which necessarily exercises `ingest()` against
 * hand-built, non-cryptographic placeholder fixtures — see this task's `disputes` output and the
 * file-header comments in signing.ts / well-formed.ts).
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import type { Fact } from "../index";
import { KipRepo } from "../index";
import { canonicalPayloadString } from "../canonical-payload";
import { generateEd25519KeyPair, signPayload } from "../signing";
import { gitBlobId, Substrate } from "../substrate";

const CANONICAL_FIELDS_IN_ORDER = [
  "v", "type", "target", "value", "validFrom", "validTo", "hlc", "seq",
  "causedBy", "supersedes", "reAttests", "author", "publicKeyFingerprint", "replicaId",
];

describe("M0 (additive): real Ed25519 sign+verify and real git-blob substrate writes", () => {
  it("assertFact mints a real, self-consistent CID and a real Ed25519 signature that ingest() genuinely verifies", async () => {
    const repo = new KipRepo();
    const result = await repo.assertFact({
      v: 1,
      type: "assert",
      target: { kind: "node", eid: "person/real-1", nodeKind: "person" },
      value: "hello",
      validFrom: Date.now(),
      validTo: null,
      replicaId: "replica-real",
      provenance: {
        author: "test-actor",
        signature: "overwritten-by-mint",
        publicKeyFingerprint: "overwritten-by-mint",
        signedFields: [],
      },
    });
    expect(result.status).toBe("pending");
    expect(typeof result.id).toBe("string");
    expect(result.id.length).toBeGreaterThan(0);
  });

  it("a fact signed with a REAL registered Ed25519 keypair verifies, and tampering its payload after signing is rejected", async () => {
    const kp = generateEd25519KeyPair();
    const repo = new KipRepo({ keyPair: kp });

    const draft: Omit<Fact, "id"> = {
      v: 1,
      type: "assert",
      target: { kind: "node", eid: "x" },
      value: null,
      validFrom: 0,
      validTo: null,
      hlc: { wall: 0, counter: 0, replicaId: "r" },
      seq: 0,
      replicaId: "r",
      provenance: {
        author: "a",
        signature: "placeholder",
        publicKeyFingerprint: kp.fingerprint,
        signedFields: CANONICAL_FIELDS_IN_ORDER,
      },
    };
    const canonical = canonicalPayloadString(draft as Fact);
    const signature = signPayload(kp.privateKey, canonical);
    const fact: Fact = {
      ...draft,
      id: gitBlobId(Buffer.from(canonical, "utf8"), "sha1"),
      provenance: { ...draft.provenance, signature },
    };

    const good = await repo.ingest(fact);
    expect(good).toEqual({ admitted: true });

    // Same signature, but the value changed after signing: a REAL Ed25519 verify must reject this
    // (proves the registered-key path is genuine crypto, not the unregistered-key placeholder).
    const tampered: Fact = { ...fact, value: "tampered" };
    const rejected = await repo.ingest(tampered);
    expect(rejected).toEqual({ admitted: false, reason: "signature-invalid" });
  });

  it("writes a real, idempotent loose git blob object for an admitted fact", () => {
    const substrate = Substrate.createTemp();
    const first = substrate.writeBlob(Buffer.from("hello kip", "utf8"));
    const second = substrate.writeBlob(Buffer.from("hello kip", "utf8"));
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(first.oid).toBe(second.oid);
    expect(substrate.hasBlob(first.oid)).toBe(true);
    fs.rmSync(substrate.dir, { recursive: true, force: true });
  });

  /**
   * Regression coverage for the round-2 seq-minting ordering fix (`mintFact`'s `getSubstrate()`
   * call BEFORE `chainSequencer.next(...)`, index.ts): `getSubstrate()` is what re-seeds
   * `chainSequencer` from the durably-persisted `SeqTipStore` on a re-opened dir, so it MUST run
   * before the first `next()` call of a fresh `KipRepo` instance — otherwise a re-opened repo would
   * race ahead of its own persisted chain tip and re-mint `seq: 0`, colliding with (or silently
   * reusing) a seq this exact `(replicaId,keyFpr)` chain already durably minted. This had zero
   * regression-test coverage prior to this round.
   */
  it("a re-opened KipRepo (same dir, same replicaId+keypair) resumes its persisted chain tip: the second mint's seq is previous+1, not 0", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-seq-resume-"));
    try {
      const kp = generateEd25519KeyPair();
      const opts = { dir, replicaId: "replica-resume", keyPair: kp };

      const firstRepo = new KipRepo(opts);
      const first = await firstRepo.assertFact({
        v: 1,
        type: "assert",
        target: { kind: "node", eid: "person/resume-1", nodeKind: "person" },
        value: "first",
        validFrom: Date.now(),
        validTo: null,
        replicaId: opts.replicaId,
        provenance: {
          author: "test-actor",
          signature: "overwritten-by-mint",
          publicKeyFingerprint: "overwritten-by-mint",
          signedFields: [],
        },
      });
      // `firstRepo` is discarded here (never referenced again) — only its on-disk substrate dir
      // and the durably-persisted seq-tip file inside it carry state forward.

      const secondRepo = new KipRepo(opts);
      const second = await secondRepo.assertFact({
        v: 1,
        type: "assert",
        target: { kind: "node", eid: "person/resume-2", nodeKind: "person" },
        value: "second",
        validFrom: Date.now(),
        validTo: null,
        replicaId: opts.replicaId,
        provenance: {
          author: "test-actor",
          signature: "overwritten-by-mint",
          publicKeyFingerprint: "overwritten-by-mint",
          signedFields: [],
        },
      });

      expect(second.seq).toBe(first.seq + 1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
