/**
 * round2-excise-security-fixes.test.ts — ADDITIVE regression coverage for milestone M3 ROUND 2's
 * four adversarial-review findings against the `excise()`/`sync()`/proj.ts excision machinery
 * (round-1 min score 34/100). Each `it` below is written to FAIL against the pre-fix (round-1) code
 * and PASS against this round's fix — see the comment at each assertion for which pre-fix behavior
 * it would have observed instead.
 *
 * 1. CRITICAL — no authorization on excise (SPEC §4.5 m-11): an attacker replica's OWN
 *    legitimately-registered (but unprivileged) key could excise ANY other party's fact, and once
 *    `sync()` propagated that marker, the victim's own replica ended up censoring its own
 *    legitimately-held data. Fixed by `isAuthorizedExcisionMarker` (proj.ts), enforced both at
 *    `excise()`'s own mint time (index.ts) and at fold time (`collectExcisions`, proj.ts).
 * 2. MAJOR — exclusion keyed by caller-declared `f.id` (a documented length-only-checked heuristic,
 *    well-formed.ts), not the fact's REAL content oid: two admitted facts sharing a declared id but
 *    DIFFERENT content both got excluded just because ONE of them was legitimately excised. Fixed
 *    by keying `excisedOids` off each candidate fact's own real content oid.
 * 3. MAJOR — `asOf` projections diverging across replicas holding the IDENTICAL admitted set (SEC
 *    break): the old `KipRepo.localExcisionGeometry` was per-replica, in-memory, never-synced state,
 *    so a replica that only ever received an excision MARKER (never the original bytes) showed
 *    `"unknown"` while the excising replica showed `"excised"` for the byte-identical admitted set.
 *    Fixed by embedding the erased fact's cell target + interval geometry INSIDE the marker's own
 *    signed payload (`ExcisionMarkerPayload`, proj.ts), making the excised/unknown decision a pure
 *    function of the admitted set alone.
 * 4. MAJOR — the durable marker's `value` stored the plain excised FactId (a content-derived CID),
 *    violating SPEC §4.5 C-4.3's anti-fingerprint rule. Fixed by persisting an HMAC-SHA256(nonce,
 *    REAL content oid) reference instead of the oid itself (see proj.ts's `computeExcisionRef`).
 *
 * DISPUTE (documented in this task's `disputes` output, and in proj.ts's `ExcisionMarkerPayload`
 * doc comment): the marker's persisted payload STILL embeds the erased fact's caller-DECLARED id
 * (`excisedFactId`) — NOT the real content oid — purely so `CellSegment{kind:"excised"}` can keep
 * showing it verbatim, which is the frozen inv-9.test.ts's own hard requirement even in the single-
 * replica, bytes-durably-gone scenario where no candidate fact is left anywhere to derive it from.
 * This is a genuine, residual tension with fix #4's "never a stable fingerprint" ideal for
 * SELF-MINTED facts (whose declared `id` IS a real content hash of the canonical envelope) — the
 * REAL content oid (the actual security-relevant matching/storage key) is what test (d) below
 * verifies is never persisted in the clear.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { KipError, KipRepo } from "../index";
import { gitBlobId, Substrate } from "../substrate";
import { generateEd25519KeyPair } from "../signing";
import { cloneFact, makeWellFormedFact } from "./conformance/fixtures";

describe("round-2 excise security fixes", () => {
  it("(a) CRITICAL fix #1: an attacker replica's OWN signing key cannot excise a victim's real, self-authored data — excise() itself rejects the attempt with ERR_UNAUTHORIZED_EXCISION, and the victim's own projection is completely unaffected", async () => {
    const victimRepo = new KipRepo({ replicaId: "victim-a" });
    const attackerRepo = new KipRepo({ replicaId: "attacker-a" });

    await victimRepo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid: "person/victim-a-1", nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "victim-a",
      provenance: { author: "victim" },
    });
    const secret = await victimRepo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node-prop", eid: "person/victim-a-1", prop: "ssn" },
      value: "123-45-6789",
      validFrom: 0,
      validTo: null,
      replicaId: "victim-a",
      provenance: { author: "victim" },
    });

    // Attacker pulls victim's data via the real M3 sync primitive — a realistic mesh-sync scenario.
    // This ALSO registers victim's real key into attacker's OWN keyRegistry (sync's documented
    // trust bootstrap), which is exactly what makes the attack live: attacker's replica now has a
    // REAL, verified relationship with victim's fact.
    await attackerRepo.sync("victim-a");

    // PRE-FIX (round-1): this call succeeded unconditionally — excise() performed NO authorization
    // check at all. POST-FIX: attacker's own signing key is neither the same signer as the target
    // fact NOR a configured trusted-excise key, and the target's real signer (victim's own key) IS
    // now a registered key on attacker's replica (via the sync trust-bootstrap above) — rejected.
    await expect(attackerRepo.excise(secret.id, "malformed")).rejects.toThrow(KipError);
    await expect(attackerRepo.excise(secret.id, "malformed")).rejects.toMatchObject({
      code: "ERR_UNAUTHORIZED_EXCISION",
    });

    const view = await victimRepo.getNode("person/victim-a-1");
    expect(view?.props.ssn.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "123-45-6789" })]),
    );
  });

  it("(a) CRITICAL fix #1, fold-time defense: even if an attacker's OWN (non-conforming) replica configures itself to trust its own excision marker, that marker is STILL never honored on the VICTIM's own projection once synced — the real security boundary is collectExcisions()'s fold-time authorization check, not merely excise()'s own mint-time gate", async () => {
    const attackerKeyPair = generateEd25519KeyPair();
    const victimRepo = new KipRepo({ replicaId: "victim-b" });
    // Attacker configures THEIR OWN repo to trust itself for excision — a legitimate config choice
    // over their own instance (modelling a non-conforming/adversarial peer implementation that
    // doesn't run this SDK's own mint-time gate, or simply configured itself permissively).
    const attackerRepo = new KipRepo({
      replicaId: "attacker-b",
      keyPair: attackerKeyPair,
      trustedExciseKeys: [attackerKeyPair.fingerprint],
    });

    await victimRepo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid: "person/victim-b-1", nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "victim-b",
      provenance: { author: "victim" },
    });
    const secret = await victimRepo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node-prop", eid: "person/victim-b-1", prop: "ssn" },
      value: "987-65-4321",
      validFrom: 0,
      validTo: null,
      replicaId: "victim-b",
      provenance: { author: "victim" },
    });

    await attackerRepo.sync("victim-b");
    // With ITS OWN trustedExciseKeys escape hatch, attacker's excise() call succeeds LOCALLY.
    const marker = await attackerRepo.excise(secret.id, "malformed");
    expect(marker.excised).toBe(secret.id);

    // Sync the now-legitimately-admitted (real, signature-valid) marker fact back to the victim.
    await victimRepo.sync("attacker-b");

    // PRE-FIX (round-1): `collectExcisedFactIds` folded ANY admitted marker unconditionally, so the
    // victim's own read would have shown the value gone. POST-FIX: victim's OWN trustedExciseKeys
    // does not include attacker's key, and attacker's key doesn't match the target's real signer
    // (victim's own key) — the marker is parsed but never folded into victim's exclusion set.
    const view = await victimRepo.getNode("person/victim-b-1");
    expect(view?.props.ssn.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "987-65-4321" })]),
    );
  });

  it("(a) positive control: self-excision by the SAME real signing key that authored the data succeeds and IS honored (the authorization rule's intended 'self' branch keeps working, not merely disabled)", async () => {
    const repo = new KipRepo({ replicaId: "self-excise" });
    await repo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid: "person/self-1", nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "self-excise",
      provenance: { author: "self" },
    });
    const f = await repo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node-prop", eid: "person/self-1", prop: "note" },
      value: "hi",
      validFrom: 0,
      validTo: null,
      replicaId: "self-excise",
      provenance: { author: "self" },
    });
    const marker = await repo.excise(f.id, "gdpr-erasure");
    expect(marker.excised).toBe(f.id);
    const view = await repo.getNode("person/self-1");
    expect(view?.props.note.segments).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "unknown" })]));
  });

  it("(b) MAJOR fix #2: excising a fact whose caller-DECLARED id collides with an UNRELATED, innocent fact (different cell, different content, same declared id — well-formed.ts's item-4 length-only check allows this) no longer collaterally censors the innocent fact", async () => {
    const eidA = "person/collision-a";
    const eidB = "person/collision-b";
    const sharedId = "shared-declared-id-collision";

    const existenceA = makeWellFormedFact({ target: { kind: "node", eid: eidA, nodeKind: "person" }, id: "collision-existA" });
    existenceA.value = true;
    existenceA.validFrom = 0;
    existenceA.validTo = null;
    const existenceB = makeWellFormedFact({ target: { kind: "node", eid: eidB, nodeKind: "person" }, id: "collision-existB" });
    existenceB.value = true;
    existenceB.validFrom = 0;
    existenceB.validTo = null;

    const innocent = makeWellFormedFact({ target: { kind: "node-prop", eid: eidA, prop: "innocent" }, id: sharedId });
    innocent.value = "innocent-value";
    innocent.validFrom = 0;
    innocent.validTo = null;

    const target = makeWellFormedFact({ target: { kind: "node-prop", eid: eidB, prop: "secret" }, id: sharedId });
    target.value = "to-be-excised";
    target.validFrom = 0;
    target.validTo = null;

    const repo = new KipRepo({ replicaId: "collision-repo" });
    await repo.ingest(existenceA);
    await repo.ingest(existenceB);
    await repo.ingest(innocent);
    await repo.ingest(target);

    // `excise()` itself may pick either same-declared-id candidate deterministically — what this
    // fix guarantees is that ONLY the real-content-oid match gets excluded, never BOTH.
    await repo.excise(sharedId, "gdpr-erasure");

    const viewA = await repo.getNode(eidA);
    const viewB = await repo.getNode(eidB);

    const innocentSurvived = (viewA?.props.innocent.segments ?? []).some((s) => s.kind === "value" && s.value === "innocent-value");
    const targetSurvived = (viewB?.props.secret.segments ?? []).some((s) => s.kind === "value" && s.value === "to-be-excised");

    // PRE-FIX (round-1): exclusion keyed by DECLARED id meant BOTH `innocentSurvived` and
    // `targetSurvived` would be `false` (both facts share `sharedId`, so BOTH got excluded).
    // POST-FIX: exactly one of the two (the real-oid match) is excised; the other, unrelated fact
    // is completely untouched.
    expect([innocentSurvived, targetSurvived].filter(Boolean)).toHaveLength(1);
  });

  it("(c) MAJOR fix #3, ROUND-3 NARROWED: the excising replica itself still shows the typed 'excised' placeholder for its own legitimate self-excision, but a replica that NEVER held the original bytes and only ever receives the marker from an UNRECOGNIZED signer now correctly shows 'unknown', not a falsely-converged 'excised'", async () => {
    // ROUND-3 CHANGE (documented dispute, see this task's `disputes` output and proj.ts's
    // `collectExcisions` doc comment): round 2's own version of this test asserted that repoB —
    // which NEVER held factX's bytes and never established any trust relationship with repoA —
    // would converge on the SAME typed `"excised"` placeholder purely from the marker's own
    // self-declared payload. A round-3 critic proved that property is UNSOUND: the marker's
    // self-claimed "I am erasing my own data" assertion cannot be soundly verified once there is no
    // candidate fact left to cross-check it against (an attacker who never authored ANY of the
    // target's bytes could self-sign an equally well-formed marker for a target it never held
    // either). The FIX narrows this: repoB — an "unrecognized party" from the marker's target's
    // perspective, with no candidate to check and no configured trust for repoA's key — now
    // correctly falls back to `"unknown"` (a cell that lost its only covering assert, the same
    // outcome as any other residual-erasure case), while repoA — which independently, locally
    // verified this exact excision against a REAL candidate at its OWN mint time — still shows the
    // typed `"excised"` placeholder for ITS OWN legitimate self-excision (see index.ts's
    // `selfWitnessedExcisionOids`).
    const eid = "person/convergence-test";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "conv-existence" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const factX = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, id: "conv-factX" });
    factX.value = "s1";
    factX.validFrom = 100;
    factX.validTo = null;

    const repoA = new KipRepo({ replicaId: "conv-A" });
    const repoB = new KipRepo({ replicaId: "conv-B" });

    // ONLY repoA ever holds factX's own bytes; repoB starts with the existence fact only.
    await repoA.ingest(existence);
    await repoA.ingest(factX);
    await repoB.ingest(cloneFact(existence));

    // repoA excises factX BEFORE repoB ever sees it — factX's bytes are gone from repoA by the
    // time repoB syncs, so repoB NEVER independently holds factX's own envelope, only the marker.
    await repoA.excise(factX.id, "gdpr-erasure");
    await repoB.sync("conv-A");

    const viewA = await (await repoA.asOf({ validTime: 500 })).getNode(eid);
    const viewB = await (await repoB.asOf({ validTime: 500 })).getNode(eid);

    // repoA: its OWN self-witnessed excision — still the typed `"excised"` placeholder.
    expect(viewA?.props.status.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "excised", excisedFactId: factX.id })]),
    );
    // repoB: never held the bytes, never configured to trust repoA's key, and the marker's claim is
    // NOT locally witnessed either — the marker is parsed but never folded into `excisionsByCell`
    // at all, so (per `getNode`'s own "no live fact left to contribute this prop name" rule) the
    // `status` cell is simply ABSENT from repoB's view, exactly as if it had never been asserted —
    // never a false "excised" convergence, and — just as importantly — never the original erased
    // value either.
    expect(viewB?.props.status).toBeUndefined();
  });

  it("(c2) ROUND-3 addition: the narrowed convergence above is fully RECOVERABLE via the existing, explicit `trustedExciseKeys` escape hatch — a replica that never held the bytes but explicitly configures itself to trust the excising replica's key converges on the SAME typed 'excised' placeholder, on purpose", async () => {
    const eid = "person/convergence-test-trusted";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "conv2-existence" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const factX = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "status" }, id: "conv2-factX" });
    factX.value = "s1";
    factX.validFrom = 100;
    factX.validTo = null;

    const excisingKeyPair = generateEd25519KeyPair();
    const repoA = new KipRepo({ replicaId: "conv2-A", keyPair: excisingKeyPair });
    // repoB explicitly, deliberately trusts repoA's real signing key to excise on its behalf — the
    // SAME operator-configured `trustedExciseKeys` escape hatch fix #1 already established, never a
    // NEW capability this round invents.
    const repoB = new KipRepo({ replicaId: "conv2-B", trustedExciseKeys: [excisingKeyPair.fingerprint] });

    await repoA.ingest(existence);
    await repoA.ingest(factX);
    await repoB.ingest(cloneFact(existence));

    await repoA.excise(factX.id, "gdpr-erasure");
    await repoB.sync("conv2-A");

    const viewB = await (await repoB.asOf({ validTime: 500 })).getNode(eid);
    expect(viewB?.props.status.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "excised", excisedFactId: factX.id })]),
    );
  });

  it("(d) MAJOR fix #4: the durable excision marker fact's persisted value does NOT contain the excised fact's real content oid in the clear (SPEC §4.5 C-4.3's anti-fingerprint rule)", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-round2-afp-"));
    const eid = "person/anti-fingerprint";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, id: "afp-existence" });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const factX = makeWellFormedFact({ target: { kind: "node-prop", eid, prop: "secret" }, id: "afp-factX" });
    factX.value = "s3nsitiv3-v4lu3";
    factX.validFrom = 0;
    factX.validTo = null;

    const repo = new KipRepo({ dir, replicaId: "afp-repo" });
    await repo.ingest(existence);
    await repo.ingest(factX);

    // The REAL content oid substrate.ts computes+stores factX under — the exact thing fix #4 says
    // must never appear in the marker's own persisted bytes (PRE-FIX, round-1, the marker's `value`
    // was literally the bare excised FactId, and for a self-minted fact that declared id IS itself a
    // real content-derived CID; this fixture's declared id is a human label, so this test targets
    // the concrete, always-security-relevant oid instead).
    const realOid = gitBlobId(Buffer.from(JSON.stringify(factX), "utf8"), "sha1");

    await repo.excise(factX.id, "gdpr-erasure");

    // Re-open the SAME on-disk substrate independently to read the marker fact's RAW, DURABLE bytes
    // (not the ephemeral `ExcisionMarker` API response `excise()` returned).
    const substrate = new Substrate(dir, "sha1");
    const stored = substrate.listFactBlobs().map((json) => JSON.parse(json) as { type: string; value?: unknown });
    const markerFact = stored.find((f) => f.type === "excision");
    expect(markerFact).toBeDefined();
    expect(typeof markerFact?.value).toBe("string");

    const rawValue = markerFact?.value as string;
    // PRE-FIX (round-1): `value` WAS the bare excised FactId string. POST-FIX: `value` is a
    // JSON-encoded payload whose `ref`/`nonce` fields carry an HMAC reference, never the real oid.
    expect(rawValue).not.toBe(factX.id);
    expect(rawValue).not.toContain(realOid);

    const payload = JSON.parse(rawValue) as Record<string, unknown>;
    expect(typeof payload.ref).toBe("string");
    expect(typeof payload.nonce).toBe("string");
    expect(payload.ref).not.toBe(realOid);
  });
});
