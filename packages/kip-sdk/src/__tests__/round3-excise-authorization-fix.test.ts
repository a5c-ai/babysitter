/**
 * round3-excise-authorization-fix.test.ts — ADDITIVE regression coverage for milestone M3 ROUND 3's
 * adversarial-review findings against round 2's excise-authorization design (round-2 min score
 * 24/100, WORSE than round 1's 34/100 — round 2's own "fix #1" was trivially bypassable).
 *
 * 1. ROOT-CAUSE (CRITICAL): `collectExcisions` (proj.ts) trusted the excision MARKER's own
 *    self-declared `origFingerprint` field when deciding "self-excision" — an attacker who owns a
 *    real, legitimately-registered keypair could craft a validly-self-signed marker targeting a
 *    VICTIM's real fact (by real content oid) while setting `origFingerprint` to the ATTACKER'S OWN
 *    fingerprint, trivially satisfying `markerFingerprint === origFingerprint` even though the
 *    attacker never authored the victim's data. FIXED by grounding the authorization decision in the
 *    REAL, admitted candidate fact's OWN `provenance.publicKeyFingerprint` — read directly off a
 *    genuine `Fact` object this replica independently verified/admitted — NEVER the marker's
 *    self-declared payload. See test (a).
 *
 * 2. SECOND ISSUE (MAJOR): `isAuthorizedExcisionMarker`'s permissive "never-registered-so-permissive"
 *    fallback branch is grounded in `KeyRegistry`, an in-memory-only `Map` that a reopened `KipRepo`
 *    rebuilds from scratch (own keypair + genesis `rootKeys` only), losing every peer key learned via
 *    a past `sync()`. A genuinely-authenticated third-party fact — correctly protected while its
 *    author's key is registered in memory — became censorable by the SAME attacker marker after a
 *    routine process restart. FIXED by durably persisting `sync()`-learned peer-key registrations
 *    (`KeyRegistryStore`, substrate.ts) and re-seeding `KipRepo.keyRegistry` from that store on
 *    reopen. See test (b).
 *
 * 3. Positive control: legitimate self-excision (a replica erasing its own genuinely-authored data)
 *    must keep working exactly as before, including the typed `"excised"` placeholder for a
 *    historical `asOf` read through the erased interval (INV-9's own frozen requirement) — now backed
 *    by `KipRepo.selfWitnessedExcisionOids` rather than the marker's own self-declared payload for the
 *    "target currently absent from this replica's admitted set" case every `excise()` call's own
 *    subsequent re-fold hits. See test (c).
 *
 * Each `it` below is written to demonstrate the CURRENT (post-round-3-fix) behavior; the comment at
 * each key assertion states what the PRE-FIX (round-2) code would have done instead — verified by
 * hand against proj.ts's round-2 `collectExcisions`/`isAuthorizedExcisionMarker` call shape (which
 * evaluated authorization against `parseExcisionMarker(f).origFingerprint`, the marker's own
 * self-declared field, for every marker regardless of whether a real candidate fact was present).
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import type { Fact, Target } from "../index";
import { KipRepo } from "../index";
import { CANONICAL_ENVELOPE_FIELDS, canonicalPayloadString } from "../canonical-payload";
import { computeExcisionRef } from "../proj";
import { gitBlobId, Substrate } from "../substrate";
import { generateEd25519KeyPair, signPayload, type Ed25519KeyPair } from "../signing";

/**
 * Hand-crafts (and REALLY signs, with `signerKeyPair`'s own private key — never a placeholder) a
 * `type:"excision"` marker fact whose `value` payload's `origFingerprint` is caller-controlled,
 * independent of `signerKeyPair`'s identity — modelling an attacker who does NOT go through this
 * SDK's own `KipRepo.excise()` (which, post-fix, always reads `origFingerprint` off a REAL local
 * candidate) but instead forges the marker fact directly, exactly as a non-conforming/adversarial
 * peer implementation could.
 */
function mintForgedExcisionMarker(params: {
  signerKeyPair: Ed25519KeyPair;
  replicaId: string;
  seq: number;
  hlcWall: number;
  cellTarget: Target;
  targetValidFrom: number;
  targetValidTo: number | null;
  targetOid: string;
  spoofedOrigFingerprint: string;
  excisedFactId: string;
  nonce: string;
}): Fact {
  const ref = computeExcisionRef(params.nonce, params.targetOid);
  const value = JSON.stringify({
    ref,
    nonce: params.nonce,
    origFingerprint: params.spoofedOrigFingerprint,
    cellTarget: params.cellTarget,
    validFrom: params.targetValidFrom,
    validTo: params.targetValidTo,
    excisedFactId: params.excisedFactId,
  });
  const hlc = { wall: params.hlcWall, counter: 0, replicaId: params.replicaId };
  const draft: Omit<Fact, "id"> = {
    v: 1,
    type: "excision",
    target: { kind: "control", op: "excision" },
    value,
    validFrom: hlc,
    validTo: null,
    hlc,
    seq: params.seq,
    replicaId: params.replicaId,
    provenance: {
      author: `forged:${params.replicaId}`,
      signature: "",
      publicKeyFingerprint: params.signerKeyPair.fingerprint,
      signedFields: [...CANONICAL_ENVELOPE_FIELDS],
    },
  };
  const canonicalPayload = canonicalPayloadString(draft as Fact);
  const id = gitBlobId(Buffer.from(canonicalPayload, "utf8"), "sha1");
  const signature = signPayload(params.signerKeyPair.privateKey, canonicalPayload);
  return { ...draft, id, provenance: { ...draft.provenance, signature } } as Fact;
}

describe("round-3 excise authorization fix", () => {
  it("(a) ROOT-CAUSE fix: a real-signed excision marker with a SPOOFED self-declared origFingerprint (claiming self-excision by setting origFingerprint = the attacker's OWN fingerprint) is REJECTED — the victim's genuinely self-authored data remains fully intact", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-round3-rootcause-"));
    const victimRepo = new KipRepo({ dir, replicaId: "root-cause-victim" });
    const attackerKeyPair = generateEd25519KeyPair();

    await victimRepo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid: "person/root-cause-1", nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "root-cause-victim",
      provenance: { author: "victim" },
    });
    const secret = await victimRepo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node-prop", eid: "person/root-cause-1", prop: "ssn" },
      value: "111-22-3333",
      validFrom: 0,
      validTo: null,
      replicaId: "root-cause-victim",
      provenance: { author: "victim" },
    });

    // Read back the REAL, durably-stored Fact envelope for `secret` directly off the substrate (the
    // same approach round2-excise-security-fixes.test.ts's test (d) uses) — `assertFact()`'s own
    // return value deliberately narrows to `{id, hlc, seq, status}` (index.ts's `Repo` surface), not
    // the full signed envelope, so this is how a test (or an attacker who separately holds a copy of
    // the victim's admitted set, e.g. via an earlier legitimate sync) recomputes the EXACT real
    // content oid `collectExcisions`/`excise()` themselves compute.
    const substrate = new Substrate(dir, "sha1");
    const storedSecret = substrate
      .listFactBlobs()
      .map((json) => JSON.parse(json) as Fact)
      .find((f) => f.id === secret.id) as Fact;
    const secretOid = gitBlobId(Buffer.from(JSON.stringify(storedSecret), "utf8"), "sha1");

    // A realistic mesh-sync relationship: the victim has previously synced with the attacker's
    // replica (an ordinary, legitimate interaction) — this genuinely, correctly registers the
    // attacker's OWN real key on the victim's replica (sync()'s documented trust bootstrap), exactly
    // as round 2's own critical-finding scenario required to make the underlying attack "live".
    new KipRepo({ replicaId: "root-cause-attacker", keyPair: attackerKeyPair }); // self-registers into the in-process replica registry `sync()` resolves against
    await victimRepo.sync("root-cause-attacker");

    const target: Target = { kind: "node-prop", eid: "person/root-cause-1", prop: "ssn" };
    const forged = mintForgedExcisionMarker({
      signerKeyPair: attackerKeyPair,
      replicaId: "root-cause-attacker",
      seq: 0,
      hlcWall: 1_700_000_000_001,
      cellTarget: target,
      targetValidFrom: 0,
      targetValidTo: null,
      targetOid: secretOid,
      spoofedOrigFingerprint: attackerKeyPair.fingerprint, // SPOOFED: claims to be its own author
      excisedFactId: secret.id,
      nonce: "attacker-chosen-nonce",
    });

    // PRE-FIX (round-2 root cause): `collectExcisions` would have called
    // `isAuthorizedExcisionMarker(attackerFingerprint, parsed.origFingerprint=attackerFingerprint, ...)`
    // — branch (a) `markerFingerprint === origFingerprint` trivially true (both attacker-controlled),
    // so the marker would have been honored and the victim's `ssn` value censored after this ingest.
    // POST-FIX: authorization is decided against `secret`'s OWN real
    // `provenance.publicKeyFingerprint` (the victim's real key, read off the admitted candidate),
    // which does NOT equal the attacker's fingerprint — rejected.
    const verdict = await victimRepo.ingest(forged);
    expect(verdict.admitted).toBe(true); // the marker fact ITSELF is well-formed and really signed —
    // admission is not the security boundary here; FOLDING it into the exclusion set is.

    const view = await victimRepo.getNode("person/root-cause-1");
    expect(view?.props.ssn.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "111-22-3333" })]),
    );
    expect(view?.props.ssn.segments).not.toEqual(expect.arrayContaining([expect.objectContaining({ kind: "excised" })]));
  });

  it("(b) SECOND ISSUE fix: a genuinely-registered peer's fact stays protected from an unrelated attacker's excision marker across a KipRepo reopen (durable key-registry persistence)", async () => {
    const peerDir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-round3-peer-"));
    const mainDir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-round3-main-"));

    const peerRepo = new KipRepo({ dir: peerDir, replicaId: "round3-peer" });
    await peerRepo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid: "person/round3-restart-1", nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "round3-peer",
      provenance: { author: "peer" },
    });
    const peerSecret = await peerRepo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node-prop", eid: "person/round3-restart-1", prop: "note" },
      value: "peer-owned-secret",
      validFrom: 0,
      validTo: null,
      replicaId: "round3-peer",
      provenance: { author: "peer" },
    });

    // `mainRepo` syncs with the peer ONCE — this durably registers the peer's real key (via
    // sync()'s trust bootstrap, now persisted to `mainDir`, see `KeyRegistryStore`) and pulls the
    // peer's facts into `mainRepo`'s own admitted set.
    const mainRepo = new KipRepo({ dir: mainDir, replicaId: "round3-main" });
    await mainRepo.sync("round3-peer");

    // An attacker, with its OWN real (but self-trusted-only) key, excises the peer's fact on ITS OWN
    // separate replica, then syncs that marker into `mainRepo` — mirroring
    // round2-excise-security-fixes.test.ts's fold-time-defense scenario exactly.
    const attackerKeyPair = generateEd25519KeyPair();
    const attackerRepo = new KipRepo({
      replicaId: "round3-attacker",
      keyPair: attackerKeyPair,
      trustedExciseKeys: [attackerKeyPair.fingerprint],
    });
    await attackerRepo.sync("round3-peer");
    await attackerRepo.excise(peerSecret.id, "malformed");
    await mainRepo.sync("round3-attacker");

    // Sanity check BEFORE any restart: `mainRepo` already correctly rejects the marker (peer's key
    // IS registered in memory right now) — the peer's data is untouched.
    const beforeRestart = await mainRepo.getNode("person/round3-restart-1");
    expect(beforeRestart?.props.note.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "peer-owned-secret" })]),
    );

    // RESTART: construct a FRESH KipRepo instance pointed at the SAME `dir` — `mainRepo`'s own
    // in-memory `keyRegistry` (and its `selfWitnessedExcisionOids`) start completely empty, exactly
    // as a real process restart would leave them; only what was durably persisted survives.
    const mainRepoReopened = new KipRepo({ dir: mainDir, replicaId: "round3-main" });

    // PRE-FIX (round-2 SECOND ISSUE): `keyRegistry` was in-memory-only — the peer's real key
    // registration would be GONE on this fresh instance, flipping `isAuthorizedExcisionMarker`'s
    // "never-registered-so-permissive" branch (c) from closed to open for the peer's fingerprint, so
    // the very same attacker marker (already durably admitted into `mainDir` by the pre-restart
    // `mainRepo.sync()` above) would now be honored, censoring the peer's `note`.
    // POST-FIX: `KeyRegistryStore` durably persisted the peer's key registration to `mainDir`, and
    // `getSubstrate()` re-seeds `keyRegistry` from it on this fresh instance's first read — the
    // marker is still correctly rejected.
    const afterRestart = await mainRepoReopened.getNode("person/round3-restart-1");
    expect(afterRestart?.props.note.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "peer-owned-secret" })]),
    );
    expect(afterRestart?.props.note.segments).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "excised" })]),
    );
  });

  it("(c) positive control: legitimate self-excision (a replica erasing its own genuinely-authored data) still works end-to-end — mint succeeds, the live read loses the value, and a historical asOf read through the erased interval shows the typed 'excised' placeholder (INV-9 semantics), all without relying on any marker's self-declared payload", async () => {
    const repo = new KipRepo({ replicaId: "round3-self-excise" });
    await repo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid: "person/round3-self-1", nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "round3-self-excise",
      provenance: { author: "self" },
    });
    const f = await repo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node-prop", eid: "person/round3-self-1", prop: "diary" },
      value: "private thoughts",
      validFrom: 100,
      validTo: null,
      replicaId: "round3-self-excise",
      provenance: { author: "self" },
    });

    const marker = await repo.excise(f.id, "gdpr-erasure");
    expect(marker.excised).toBe(f.id);

    // Live (no-asOf) read: the cell lost its only covering assert — plain "unknown", never the
    // erased value.
    const live = await repo.getNode("person/round3-self-1");
    expect(live?.props.diary.segments).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "unknown" })]));
    expect(live?.props.diary.segments).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "private thoughts" })]),
    );

    // Historical asOf read through the erased interval: the typed "excised" placeholder, backed by
    // `selfWitnessedExcisionOids` (this replica's own, locally-verified mint-time authorization) —
    // never the marker's self-declared payload alone, since by this point `f`'s bytes are gone from
    // `facts` (the "target absent" case).
    const historical = await (await repo.asOf({ validTime: 500 })).getNode("person/round3-self-1");
    expect(historical?.props.diary.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "excised", excisedFactId: f.id })]),
    );
  });
});
