/**
 * round5-excise-final-hardening.test.ts — ADDITIVE regression coverage for milestone M3 ROUND 5's
 * adversarial-review findings against round 4's `excise()`/`sync()`/proj.ts excision machinery
 * (round-4 critic scores 88/67/84 — the core authorization-forgery and SEC-divergence bugs were
 * confirmed genuinely fixed, but the convergence-safety critic live-reproduced two remaining real
 * issues, both closed by this round).
 *
 * FINDING 1 (major) — SEC/INV-1 divergence via the `excisedReason` field: `collectExcisions`'s CASE-2
 * self-witnessed branch (proj.ts) built the honored `ExcisionRecord` — including `excisedReason` —
 * from THIS replica's own locally-captured `SelfWitnessedExcisionRecord`, never from the admitted
 * marker set. If TWO DIFFERENT replicas each independently, legitimately self-excise the SAME real
 * content (identical oid) but pass DIFFERENT caller-supplied `reason` strings to their own `excise()`
 * calls, the two replicas end up holding a byte-IDENTICAL admitted fact set (once synced) whose
 * `asOf({validTime})` projections show DIFFERENT `excisedReason` values for the exact same cell — a
 * genuine SEC/INV-1 violation, bounded to the `excisedReason` field only (`cellTarget`/`validFrom`/
 * `validTo`/`excisedFactId` cannot diverge since they derive from identical content). FIXED by
 * `pickConvergentSelfWitnessedReason` (proj.ts): `excisedReason` is now resolved as a deterministic,
 * content-based (`maxByOrderKey`/`compareByContent`) pick over every ADMITTED, REGISTERED-signer
 * marker matching the oid, rather than sourced from whichever replica's own local record happens to
 * be consulted. See test (a).
 *
 * FINDING 2 (major) — `trustedExciseKeys` forgeable when the trusted fingerprint lacks registered key
 * material: `trustedExciseKeys` is checked by fingerprint STRING only, both in
 * `isAuthorizedExcisionMarker` (CASE 1) and in `collectExcisions`'s CASE-2(i) direct
 * `trustedExciseKeys.has(markerFingerprint)` check — neither verified the fingerprint corresponds to
 * an actually-registered, cryptographically-verified public key. An operator who lists a fingerprint
 * in `trustedExciseKeys` but forgets to ALSO register that fingerprint's real public key (an easy,
 * silent misconfiguration, since the two constructor options are entirely independent) leaves the
 * door open for ANY sync peer to forge a marker claiming that trusted fingerprint via `ingest()`'s
 * documented unregistered-key placeholder-signature fallback, get it ADMITTED, and have
 * `collectExcisions` honor its fully-fabricated geometry. FIXED by requiring
 * `isRegisteredFingerprint(markerFingerprint)` alongside `trustedExciseKeys.has(markerFingerprint)`
 * at BOTH call sites — a `trustedExciseKeys` marker is only ever honored when it ALSO carries a
 * genuinely-verified (never placeholder) signature. See test (b).
 *
 * Each `it` below is annotated with what the PRE-FIX (round-4) code would have produced instead.
 */
import { describe, expect, it } from "vitest";
import type { Fact, Target } from "../index";
import { KipRepo } from "../index";
import { CANONICAL_ENVELOPE_FIELDS } from "../canonical-payload";
import { computeExcisionRef, isAuthorizedExcisionMarker } from "../proj";
import { gitBlobId } from "../substrate";
import { cloneFact, makeWellFormedFact } from "./conformance/fixtures";

/**
 * Hand-crafts an excision-marker `Fact` using the SAME unregistered-fingerprint, placeholder-
 * signature convention `makeWellFormedFact`/M0's own conformance fixtures use (and
 * round4-excision-convergence-fix.test.ts's own `mintPlaceholderExcisionMarker` helper) — no real
 * Ed25519 keypair is needed to reproduce either finding.
 */
function mintPlaceholderExcisionMarker(params: {
  id: string;
  replicaId: string;
  hlcWall: number;
  seq: number;
  nonce: string;
  targetOid: string;
  cellTarget: Target;
  validFrom: number;
  validTo: number | null;
  excisedFactId: string;
  excisedReason: string;
  fingerprint: string;
}): Fact {
  const ref = computeExcisionRef(params.nonce, params.targetOid);
  const value = JSON.stringify({
    ref,
    nonce: params.nonce,
    origFingerprint: "attacker-claimed-fpr",
    cellTarget: params.cellTarget,
    validFrom: params.validFrom,
    validTo: params.validTo,
    excisedFactId: params.excisedFactId,
    excisedReason: params.excisedReason,
  });
  const hlc = { wall: params.hlcWall, counter: 0, replicaId: params.replicaId };
  return {
    id: params.id,
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
      signature: `sig:${params.id}`,
      publicKeyFingerprint: params.fingerprint,
      signedFields: [...CANONICAL_ENVELOPE_FIELDS],
    },
  };
}

describe("round-5 excise final hardening", () => {
  it("(a) FINDING 1 fix: two replicas that each independently, legitimately self-excise the SAME real content with DIFFERENT caller-supplied `reason` strings converge on the IDENTICAL projected `excisedReason` once synced", async () => {
    const eid = "person/r5a-reason-convergence";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "r5a-existence" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    // Unregistered-fingerprint fixture (the M0 convention) — its signer is never a REAL,
    // cryptographically-registered key on EITHER replica, so each replica independently qualifies
    // to self-excise it under `isAuthorizedExcisionMarker`'s permissive branch (c).
    const secret = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "leaked" }, id: "r5a-secret" });
    secret.value = "top-secret-leak";
    secret.validFrom = 0;
    secret.validTo = null;

    const repoV1 = new KipRepo({ replicaId: "r5a-v1" });
    const repoV2 = new KipRepo({ replicaId: "r5a-v2" });
    await repoV1.ingest(cloneFact(existence));
    await repoV1.ingest(cloneFact(secret));
    await repoV2.ingest(cloneFact(existence));
    await repoV2.ingest(cloneFact(secret));

    // BOTH replicas independently excise their OWN copy of the identical real content — neither has
    // seen the other's marker yet — but pass DIFFERENT `reason` strings to their own `excise()` call.
    // This is the exact scenario a round-5 critic live-reproduced: two genuinely sound, independent
    // excisions of the SAME real bytes, differing ONLY in the caller-supplied audit reason.
    await repoV1.excise(secret.id, "gdpr-erasure");
    await repoV2.excise(secret.id, "malformed");

    // Propagate each replica's OWN genuine marker to the other via the real M3 sync primitive — after
    // this, both replicas hold a byte-IDENTICAL admitted fact set (both markers, both existence/
    // secret facts).
    await repoV1.sync("r5a-v2");
    await repoV2.sync("r5a-v1");

    const viewV1 = await (await repoV1.asOf({ validTime: 500 })).getNode(eid);
    const viewV2 = await (await repoV2.asOf({ validTime: 500 })).getNode(eid);

    // PRE-FIX (round-4): `collectExcisions`'s CASE-2(ii) sourced `excisedReason` from THIS replica's
    // OWN `selfWitnessedExcisionOids` record — repoV1 would show "gdpr-erasure", repoV2 would show
    // "malformed", for the byte-identical admitted fact set: a genuine SEC/INV-1 violation.
    // POST-FIX: `excisedReason` is a deterministic function of the admitted marker set
    // (`pickConvergentSelfWitnessedReason`) — both replicas compute the SAME winner and therefore the
    // SAME `excisedReason`, whichever of the two legitimate reasons wins the content-based tiebreak.
    expect(viewV2).toEqual(viewV1);

    const excisedSegV1 = (viewV1?.props.leaked.segments ?? []).find((s) => s.kind === "excised");
    const excisedSegV2 = (viewV2?.props.leaked.segments ?? []).find((s) => s.kind === "excised");
    expect(excisedSegV1).toBeDefined();
    expect(excisedSegV2).toBeDefined();
    // `excisedFactId`/geometry stay sourced from each replica's own local record (guaranteed
    // identical since both witnessed the SAME real content) — unaffected by this fix.
    expect(excisedSegV1).toMatchObject({ kind: "excised", excisedFactId: secret.id });
    // The convergent-pick `excisedReason` must be ONE of the two genuinely-legitimate reasons (never
    // `undefined`, never a third, fabricated value) and IDENTICAL across both replicas.
    expect(["gdpr-erasure", "malformed"]).toContain((excisedSegV1 as { excisedReason?: string }).excisedReason);
    expect((excisedSegV1 as { excisedReason?: string }).excisedReason).toBe(
      (excisedSegV2 as { excisedReason?: string }).excisedReason,
    );
  });

  it("(a2) FINDING 1 fix, forgery-immunity check: an attacker's UNREGISTERED-fingerprint placeholder-signed marker matching a victim's own selfWitnessed oid — even with an attacker-fabricated `excisedReason` engineered to sort last in a naive tiebreak — never wins the convergent `excisedReason` pick, and asymmetric exposure to it never breaks convergence", async () => {
    const eid = "person/r5a2-forgery-immune-reason";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "r5a2-existence" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const secret = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "leaked" }, id: "r5a2-secret" });
    secret.value = "top-secret-leak-2";
    secret.validFrom = 0;
    secret.validTo = null;

    const repoV1 = new KipRepo({ replicaId: "r5a2-v1" });
    const repoV2 = new KipRepo({ replicaId: "r5a2-v2" });
    await repoV1.ingest(cloneFact(existence));
    await repoV1.ingest(cloneFact(secret));
    await repoV2.ingest(cloneFact(existence));
    await repoV2.ingest(cloneFact(secret));

    await repoV1.excise(secret.id, "gdpr-erasure");
    await repoV2.excise(secret.id, "gdpr-erasure");

    const secretOid = gitBlobId(Buffer.from(JSON.stringify(secret), "utf8"), "sha1");

    // Attacker crafts a competing marker for the SAME real cell/interval — with a huge `hlcWall` so a
    // naive "pick the orderKey-max marker's reason, unfiltered" implementation would select the
    // FORGED reason over the two legitimate ones — but signed via the placeholder-signature
    // convention (unregistered fingerprint), never a real key.
    const evilMarker = mintPlaceholderExcisionMarker({
      id: "r5a2-evil-marker",
      replicaId: "r5a2-attacker",
      hlcWall: 999_999,
      seq: 0,
      nonce: "r5a2-attacker-nonce",
      targetOid: secretOid,
      cellTarget: { kind: "node-prop", eid, prop: "leaked" },
      validFrom: 0,
      validTo: null,
      excisedFactId: "0-attacker-fabricated-id",
      excisedReason: "fork",
      fingerprint: "r5a2-attacker-unregistered-fpr",
    });

    // Asymmetric exposure: ONLY repoV1 ever receives the forged marker.
    const verdict = await repoV1.ingest(evilMarker);
    expect(verdict.admitted).toBe(true); // admitted as an ordinary fact — never the security boundary.

    await repoV1.sync("r5a2-v2");
    await repoV2.sync("r5a2-v1");

    const viewV1 = await (await repoV1.asOf({ validTime: 500 })).getNode(eid);
    const viewV2 = await (await repoV2.asOf({ validTime: 500 })).getNode(eid);

    // Both replicas converge on the SAME, genuine record — the attacker's forged, unregistered-
    // fingerprint marker is excluded from the convergent-reason pool entirely, and its asymmetric
    // exposure (repoV1 only) never causes a divergence.
    expect(viewV2).toEqual(viewV1);
    expect(viewV1?.props.leaked.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "excised", excisedFactId: secret.id, excisedReason: "gdpr-erasure" }),
      ]),
    );
    const excisedSegments = (viewV1?.props.leaked.segments ?? []).filter((s) => s.kind === "excised");
    expect(excisedSegments).toHaveLength(1);
  });

  it("(b) FINDING 2 fix: a forged placeholder-signed marker bearing a `trustedExciseKeys`-listed-but-UNREGISTERED fingerprint is admitted as an ordinary fact but is NEVER honored by collectExcisions", async () => {
    const eid = "person/r5b-unregistered-trust";
    const trustedButUnregisteredFpr = "r5b-trusted-but-never-registered-fpr";

    // The operator's exact misconfiguration this finding targets: `trustedExciseKeys` lists a
    // fingerprint, but NO corresponding real public key was ever registered for it (no `keyPair`
    // option matches it, and this replica never `sync()`s with a peer who owns it).
    const victimRepo = new KipRepo({
      replicaId: "r5b-victim",
      trustedExciseKeys: [trustedButUnregisteredFpr],
    });

    await victimRepo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid, nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "r5b-victim",
      provenance: { author: "victim" },
    });
    const secret = await victimRepo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node-prop", eid, prop: "ssn" },
      value: "555-99-1111",
      validFrom: 0,
      validTo: null,
      replicaId: "r5b-victim",
      provenance: { author: "victim" },
    });

    // Attacker (any admitted sync peer) forges a marker claiming the trusted-but-unregistered
    // fingerprint, targeting a cell ("notes") that was NEVER asserted, let alone excised. The `ref`
    // is built against a made-up oid (CASE 2 — "target currently absent" — is exactly the branch
    // Finding 2 targets: there is no real candidate to cross-check the claim against at all).
    const evilMarker = mintPlaceholderExcisionMarker({
      id: "r5b-evil-marker",
      replicaId: "r5b-attacker",
      hlcWall: 900,
      seq: 0,
      nonce: "r5b-attacker-nonce",
      targetOid: "totally-fabricated-oid-never-real",
      cellTarget: { kind: "node-prop", eid, prop: "notes" },
      validFrom: 0,
      validTo: null,
      excisedFactId: "attacker-fabricated-fact-id",
      excisedReason: "fork",
      fingerprint: trustedButUnregisteredFpr,
    });

    // Admission is never the security boundary here — the marker IS well-formed and its fingerprint
    // genuinely has no registered key on this replica, so `ingest()`'s documented placeholder-
    // signature fallback (INV-13a's own scenario) admits it as an ordinary fact.
    const verdict = await victimRepo.ingest(evilMarker);
    expect(verdict.admitted).toBe(true);

    const view = await (await victimRepo.asOf({ validTime: 500 })).getNode(eid);

    // PRE-FIX (round-4): `collectExcisions`'s CASE-2(i) checked ONLY `trustedExciseKeys.has(markerFingerprint)`
    // with no registered-key gate at all — the forged marker's `trustedExciseKeys`-listed fingerprint
    // would satisfy that check unconditionally, honoring its fully-fabricated `cellTarget` ("notes")
    // and injecting a phantom "excised" placeholder onto a prop that was never asserted.
    // POST-FIX: `trustedExciseKeys.has(markerFingerprint) && isRegisteredFingerprint(markerFingerprint)`
    // — the fingerprint is listed but never registered, so the marker is never honored; "notes" never
    // gets an `excisionsByCell` entry and so never appears in `NodeView.props` at all.
    expect(view?.props.notes).toBeUndefined();

    // The victim's OWN real, live data is completely unaffected.
    expect(view?.props.ssn.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "555-99-1111" })]),
    );
    void secret;
  });

  it("(b2) FINDING 2 fix, CASE-1 (target still present) coverage: `isAuthorizedExcisionMarker`'s `trustedExciseKeys` branch itself also requires a registered key, not merely a listed fingerprint string, so `excise()`'s own mint-time gate rejects the same misconfiguration", async () => {
    const trustedButUnregisteredFpr = "r5b2-trusted-but-never-registered-fpr";
    const victimRepo = new KipRepo({ replicaId: "r5b2-victim" });
    // A SEPARATE attacker replica happens to sign with the exact fingerprint the victim's own
    // (misconfigured) `trustedExciseKeys` would list — but the victim never actually registers this
    // key (no `sync()` with the attacker, no matching `keyPair`/`rootKeys` option). Simulated here
    // directly against the exported `isAuthorizedExcisionMarker` (proj.ts), the same primitive
    // `excise()`'s own mint-time gate and `collectExcisions`'s CASE-1 branch both call.
    const isRegisteredFingerprint = (_fpr: string): boolean => false; // never registered, by construction
    void victimRepo;
    const trustedExciseKeys = new Set([trustedButUnregisteredFpr]);

    // PRE-FIX: `trustedExciseKeys.has(markerFingerprint)` alone returned `true` here — a listed-but-
    // never-registered fingerprint was fully authorized. POST-FIX: the registered-key gate makes this
    // `false`, and since the marker's fingerprint also differs from the (real, registered) target
    // signer and that target signer IS a real registered key, no branch authorizes it.
    const result = isAuthorizedExcisionMarker(
      trustedButUnregisteredFpr,
      "some-other-real-registered-target-fingerprint",
      (fpr) => fpr === "some-other-real-registered-target-fingerprint" || isRegisteredFingerprint(fpr),
      trustedExciseKeys,
    );
    expect(result).toBe(false);
  });
});
