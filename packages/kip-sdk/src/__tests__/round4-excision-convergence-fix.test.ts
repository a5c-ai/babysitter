/**
 * round4-excision-convergence-fix.test.ts — ADDITIVE regression coverage for milestone M3 ROUND 4's
 * adversarial-review findings against round 3's `selfWitnessedExcisionOids` CASE-2 mechanism
 * (`collectExcisions`, proj.ts; round-3 min score 60/100). All 3 round-4 critics independently
 * live-reproduced two remaining problems in that mechanism:
 *
 * PROBLEM 2 (audit-record forgery via unbound geometry): round 3's CASE-2 "selfWitnessed" match
 * only checked `computeExcisionRef(marker.nonce, oid) === marker.ref` for an oid in the replica's
 * own `selfWitnessedExcisionOids` — then, once that gate passed, still built the `ExcisionRecord`
 * from the MATCHING MARKER's own self-declared `cellTarget`/`validFrom`/`validTo`/`excisedFactId`/
 * `excisedReason`, never from the geometry the replica itself actually captured at its own
 * `excise()` mint time. An attacker who is an admitted sync peer and merely knows the SAME real
 * content oid a victim already self-excised (trivial to obtain `ref` for once the oid is known —
 * `ref = HMAC(attacker_nonce, oid)`) can craft their OWN, separately-signed marker with a
 * COMPLETELY DIFFERENT `cellTarget`, forging a fabricated GDPR-erasure audit record onto a cell
 * that was never actually excised. Test (a) below reproduces this live and asserts the victim's
 * projection is not corrupted.
 *
 * PROBLEM 1 (SEC/INV-1-flavored convergence unsoundness): closely related — because the geometry
 * used for an admitted marker was sourced from WHICHEVER marker happened to match (own, a peer's,
 * or a forger's), rather than deterministically from the replica's OWN local truth, two replicas
 * that both hold equally-sound local knowledge of the SAME real excision (e.g. two peers who each,
 * independently, legitimately excised their own copy of the identical leaked secret) could still
 * diverge on the EXACT excision-record content depending on which extra (possibly forged) markers
 * happened to reach which replica and how ties broke. Test (b) below reproduces this live —
 * asymmetric exposure to a forged competing marker — and asserts both replicas now converge on the
 * SAME, sound (never-forged) result.
 *
 * THE FIX (proj.ts's `collectExcisions`, `SelfWitnessedExcisionRecord`; index.ts's
 * `KipRepo.selfWitnessedExcisionOids`): `selfWitnessedExcisionOids` is now a
 * `Map<oid, SelfWitnessedExcisionRecord>` — populated by `excise()` with the geometry it itself
 * read off the REAL candidate fact at mint time — rather than a bare `Set<oid>`. Once a marker's
 * `ref` is recognized as matching an oid THIS replica independently witnessed, the `ExcisionRecord`
 * (both its cell key AND its validFrom/validTo/excisedFactId/excisedReason content) is built
 * EXCLUSIVELY from that local record, never from the specific marker that happened to match —
 * closing the forgery (Problem 2) and making two replicas that hold equivalent local truth about
 * the SAME real excision converge identically regardless of which competing (including forged)
 * markers reach either of them (Problem 1). The `trustedExciseKeys` branch is UNCHANGED (still
 * trusts that fully-delegated signer's own self-declared payload — the intended meaning of that
 * escape hatch, not a residual gap; see proj.ts's `collectExcisions` doc comment) — the residual,
 * PER-REPLICA asymmetry between "a replica that independently self-witnessed this exact excision"
 * (still typed `"excised"`, INV-9's own frozen, un-editable requirement) and "a replica with ZERO
 * relevant local knowledge, no trustedExciseKeys" (correctly `"unknown"`, never fabricated) is
 * documented as an accepted, sound, non-convergent LOCAL AUDIT distinction — see this task's own
 * `disputes` output for why full byte-identical convergence between those two specific categories
 * is architecturally impossible without either breaking INV-9's frozen requirement or inventing new
 * cross-replica-verifiable trust machinery that is explicit M8/M9 KeyAuthorization-chain scope.
 *
 * Each `it` below is annotated with what the PRE-FIX (round-3) code would have produced instead —
 * verified by hand against round 3's `collectExcisions` CASE-2 body, which built `ExcisionRecord`
 * from `marker.cellTarget`/`marker.validFrom`/`marker.validTo`/`marker.excisedFactId`/
 * `marker.excisedReason` (the MATCHING MARKER's own payload) for every selfWitnessed match.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import type { Fact, Target } from "../index";
import { KipRepo } from "../index";
import { CANONICAL_ENVELOPE_FIELDS } from "../canonical-payload";
import { computeExcisionRef } from "../proj";
import { gitBlobId, Substrate } from "../substrate";
import { cloneFact, makeWellFormedFact } from "./conformance/fixtures";

/**
 * Hand-crafts an excision-marker `Fact` using the SAME unregistered-fingerprint, placeholder-
 * signature convention `makeWellFormedFact`/M0's own conformance fixtures use — this is deliberate:
 * `collectExcisions`'s CASE-2 gate (proj.ts) does NOT itself re-check the matching marker's own
 * signer authorization at all (only `trustedExciseKeys`/selfWitness-ref-match), so an admitted
 * marker from an UNREGISTERED, unprivileged signer is exactly the live attack surface this file
 * targets — no real Ed25519 keypair is needed to reproduce it, matching every 3 critics' own
 * live-reproduction reports.
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
      publicKeyFingerprint: "attacker-unregistered-fpr",
      signedFields: [...CANONICAL_ENVELOPE_FIELDS],
    },
  };
}

describe("round-4 excision convergence fix", () => {
  it("(a) PROBLEM 2 fix: an attacker's separately-crafted marker — matching a victim's OWN selfWitnessed oid via `ref`, but claiming a COMPLETELY DIFFERENT, attacker-chosen cellTarget — never injects a fabricated 'excised' placeholder onto the victim's projection, and the victim's OWN real excision record stays correct", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-round4-forgery-"));
    const eid = "person/r4a-forgery";
    const victimRepo = new KipRepo({ dir, replicaId: "r4a-victim" });

    await victimRepo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid, nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "r4a-victim",
      provenance: { author: "victim" },
    });
    const secret = await victimRepo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node-prop", eid, prop: "ssn" },
      value: "555-11-2222",
      validFrom: 0,
      validTo: null,
      replicaId: "r4a-victim",
      provenance: { author: "victim" },
    });

    // The REAL content oid of `secret`'s stored envelope — the same value the attacker would need
    // to have learned somehow (e.g. having seen the bytes before erasure) to forge a matching `ref`.
    const substrate = new Substrate(dir, "sha1");
    const storedSecret = substrate
      .listFactBlobs()
      .map((json) => JSON.parse(json) as Fact)
      .find((f) => f.id === secret.id) as Fact;
    const secretOid = gitBlobId(Buffer.from(JSON.stringify(storedSecret), "utf8"), "sha1");

    // Victim legitimately self-excises its own real "ssn" cell — this is the ONLY genuine excision
    // that ever happened; it records victim's OWN correct geometry locally.
    await victimRepo.excise(secret.id, "gdpr-erasure");

    // Attacker crafts a SEPARATE marker whose `ref` matches the SAME real oid (`secretOid`) victim
    // already self-witnessed, but whose claimed `cellTarget` is a COMPLETELY unrelated cell
    // ("notes") that was NEVER asserted, let alone excised — and whose `excisedFactId`/
    // `excisedReason` are entirely fabricated.
    const evilMarker = mintPlaceholderExcisionMarker({
      id: "r4a-evil-marker",
      replicaId: "r4a-attacker",
      hlcWall: 900,
      seq: 0,
      nonce: "attacker-chosen-nonce",
      targetOid: secretOid,
      cellTarget: { kind: "node-prop", eid, prop: "notes" },
      validFrom: 0,
      validTo: null,
      excisedFactId: "attacker-fabricated-fact-id",
      excisedReason: "fork",
    });

    // The marker itself is well-formed and (via the unregistered-fingerprint placeholder-signature
    // convention) genuinely ADMITTED as an ordinary fact — admission is never the security boundary
    // here; folding it into `excisionsByCell` is.
    const verdict = await victimRepo.ingest(evilMarker);
    expect(verdict.admitted).toBe(true);

    const view = await (await victimRepo.asOf({ validTime: 500 })).getNode(eid);

    // PRE-FIX (round-3): `collectExcisions` would have honored `evilMarker` (its `ref` matches
    // victim's own selfWitnessed oid) and built its `ExcisionRecord` from `evilMarker`'s OWN
    // self-declared `cellTarget` ("notes") — fabricating a phantom `"excised"` placeholder on a
    // prop that was NEVER asserted at all. POST-FIX: the geometry used is victim's OWN local
    // record, whose `cellTarget` is the REAL "ssn" cell — "notes" never gets an `excisionsByCell`
    // entry at all, so it never even appears in `NodeView.props`.
    expect(view?.props.notes).toBeUndefined();

    // Victim's OWN real excision record is untouched and correct — never overwritten, duplicated,
    // or corrupted by the attacker's competing (but now entirely inert) marker.
    expect(view?.props.ssn.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "excised", excisedFactId: secret.id, excisedReason: "gdpr-erasure" }),
      ]),
    );
    const excisedSegments = (view?.props.ssn.segments ?? []).filter((s) => s.kind === "excised");
    expect(excisedSegments).toHaveLength(1);
  });

  it("(b) PROBLEM 1 fix: two replicas that each independently, legitimately self-excised their OWN copy of the identical real secret converge on the IDENTICAL, correct excision record — even when only ONE of them is also exposed to an attacker's forged competing marker for the same cell", async () => {
    const eid = "person/r4b-convergence";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "r4b-existence" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    // Unregistered-fingerprint fixture (the same INV-12/M0 convention) — its signer is never a
    // REAL, cryptographically-registered key on EITHER replica, so each replica independently
    // qualifies to self-excise it under `isAuthorizedExcisionMarker`'s permissive branch (c) ("the
    // erased fact's own signer was never a real registered key on this replica"), exactly like a
    // real replica GDPR-erasing a leaked secret it happens to hold a copy of.
    const secret = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "leaked" }, id: "r4b-secret" });
    secret.value = "top-secret-leak";
    secret.validFrom = 0;
    secret.validTo = null;

    const repoV1 = new KipRepo({ replicaId: "r4b-v1" });
    const repoV2 = new KipRepo({ replicaId: "r4b-v2" });
    await repoV1.ingest(cloneFact(existence));
    await repoV1.ingest(cloneFact(secret));
    await repoV2.ingest(cloneFact(existence));
    await repoV2.ingest(cloneFact(secret));

    // BOTH replicas independently excise their OWN copy of the identical real content — neither
    // has seen the other's marker yet.
    await repoV1.excise(secret.id, "gdpr-erasure");
    await repoV2.excise(secret.id, "gdpr-erasure");

    // The real content oid — computable by anyone who once held (or otherwise learned) the exact
    // bytes, exactly like `secret` here (byte-identical across both replicas by construction).
    const secretOid = gitBlobId(Buffer.from(JSON.stringify(secret), "utf8"), "sha1");

    // Attacker crafts a competing marker for the SAME real cell/interval (so it genuinely competes
    // in the tie-break, not merely a differently-timed no-op) but with a fabricated
    // `excisedFactId`/`excisedReason` — and whose `excisedFactId` is chosen to sort BEFORE the real
    // one, so an unbound-geometry implementation's deterministic "pick by excisedFactId" tiebreak
    // would select the FORGED record over the real one.
    const evilMarker = mintPlaceholderExcisionMarker({
      id: "r4b-evil-marker",
      replicaId: "r4b-attacker",
      hlcWall: 900,
      seq: 0,
      nonce: "r4b-attacker-nonce",
      targetOid: secretOid,
      cellTarget: { kind: "node-prop", eid, prop: "leaked" },
      validFrom: 0,
      validTo: null,
      excisedFactId: "0-attacker-fabricated-id", // sorts before "r4b-secret"
      excisedReason: "fork",
    });

    // Asymmetric exposure: ONLY repoV1 ever receives the forged marker (a realistic partial-mesh-
    // propagation scenario) — repoV2 never sees it at all.
    await repoV1.ingest(evilMarker);

    // Propagate each replica's OWN genuine marker to the other via the real M3 sync primitive.
    await repoV1.sync("r4b-v2");
    await repoV2.sync("r4b-v1");

    const viewV1 = await (await repoV1.asOf({ validTime: 500 })).getNode(eid);
    const viewV2 = await (await repoV2.asOf({ validTime: 500 })).getNode(eid);

    // PRE-FIX (round-3): repoV1's `excisionsByCell` for the "leaked" cell would have THREE
    // competing marker-sourced records (its own, repoV2's — both correct — plus the attacker's
    // forged one), deterministically tie-broken by `excisedFactId`; the attacker's chosen id
    // ("0-...") sorts FIRST, so repoV1 would show the FORGED record (`excisedReason: "fork"`,
    // wrong `excisedFactId`). repoV2 — never exposed to the forged marker — would show the correct
    // record. `viewV1` and `viewV2` would DIVERGE: a SEC violation between two replicas that each
    // hold equally-sound, equivalent local knowledge of the identical real excision.
    // POST-FIX: BOTH replicas build their "leaked" cell's `ExcisionRecord` EXCLUSIVELY from their
    // OWN local record (identical content on both, since both independently captured the same real
    // secret's real geometry) — the forged marker matches via `ref` but is simply never consulted
    // for its payload, so it is entirely inert. Both replicas converge on the IDENTICAL, correct
    // result.
    expect(viewV2).toEqual(viewV1);
    expect(viewV1?.props.leaked.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "excised", excisedFactId: secret.id, excisedReason: "gdpr-erasure" }),
      ]),
    );
    expect(viewV2?.props.leaked.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "excised", excisedFactId: secret.id, excisedReason: "gdpr-erasure" }),
      ]),
    );
  });
});
