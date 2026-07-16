/**
 * INV-17 — revocation intent & honest-concurrent surfacing (M4-1).
 *
 * docs/60-conformance-and-testability.md#inv-17 (verbatim core): "`ordinary-cutoff` revocation demotes
 * ONLY facts with author-HLC ≥ `effectiveFrom` and PRESERVES honest concurrent pre-`effectiveFrom`
 * facts as trusted; `causal-cutoff` additionally demotes non-ancestor facts but surfaces honest-
 * concurrent casualties with the DISTINCT status `kip:revoked-concurrent` … never the generic
 * `untrusted` bucket. … a `re-attest` fact signed by a currently-trusted, non-revoked key (`reAttests`
 * = the demoted fact's CID) RESTORES the honest content to a trusted head under the new key's
 * provenance, while a `resolve`-scoped `supersede` over the same `inputCids` does NOT restore it."
 *
 * Driven through the DEFINED authoring seams: `revokeKey()` (the revocation) and `reAttestFact()` (the
 * re-attest). The signing key under revocation is AUTHORIZED first (KeyAuthorization chaining to a
 * genesis root, fixtures-m8.ts #2) so ordinary-cutoff's "preserve pre-`effectiveFrom`" is a real
 * trusted→trusted control, not vacuous.
 *
 * COVERAGE NOTE (distinct-status surfacing): the DISTINCT `kip:revoked-concurrent` status (vs generic
 * `untrusted`) is not observable through the public read surface — `getNode`'s `CellSegment` union has
 * no trust-status field and `provenanceOf`/`Provenance` carry no revoked-concurrent marker — so this
 * file asserts the DEMOTION (causal-cutoff removes the honest-concurrent value from `/heads`; ordinary-
 * cutoff keeps it) but the distinct-label assertion is recorded in this suite's `untestable` report.
 *
 * EXPECTED TO FAIL NOW: `revokeKey()` throws `unimplemented` and no demotion exists — every guard
 * assertion below rejects/mismatches. Failures are assertion mismatches / rejected-promise guards,
 * never type/import errors.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import {
  existenceFact,
  freshFactId,
  freshReplicaId,
  hasTrustedValueHead,
  hlc,
  ingestAll,
  keyAuthFact,
  propFact,
} from "./fixtures-m8";

const rootFpr = "genesis-root-inv17";
const fpr = "authorized-then-revoked-key-inv17";

describe("INV-17: revocation intent, honest-concurrent surfacing & re-attest", () => {
  it("ordinary-cutoff demotes ONLY facts with author-HLC ≥ effectiveFrom and PRESERVES pre-effectiveFrom facts as trusted", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("inv17-ordinary") });
    const eid = "person/inv17-ordinary";
    await ingestAll(repo, [
      keyAuthFact(
        { keyFpr: fpr, namespaces: ["person"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
        { id: freshFactId("inv17-ord-auth"), signerFpr: rootFpr, wall: 100 },
      ),
      existenceFact(eid, "person", { id: freshFactId("inv17-ord-ex"), fpr, wall: 1000, replicaId: "chain-inv17-ord", seq: 0 }),
      propFact(eid, "before", "kept", { id: freshFactId("inv17-ord-pre"), fpr, wall: 1100, replicaId: "chain-inv17-ord", seq: 1 }),
      propFact(eid, "after", "cutoff-loser", { id: freshFactId("inv17-ord-post"), fpr, wall: 3000, replicaId: "chain-inv17-ord", seq: 2 }),
    ]);

    // GUARD (fails NOW — revokeKey throws `unimplemented`): revokeKey returns the signed revoke fact's CID.
    await expect(repo.revokeKey(fpr, hlc(2000), "suspected misuse-going-forward", "ordinary-cutoff")).resolves.toEqual(
      expect.any(String),
    );

    const node = await repo.getNode(eid);
    expect(hasTrustedValueHead(node, "before", "kept")).toBe(true); // pre-effectiveFrom preserved
    expect(hasTrustedValueHead(node, "after", "cutoff-loser")).toBe(false); // ≥ effectiveFrom demoted
    repo.close();
  });

  it("causal-cutoff demotes an honest CONCURRENT pre-effectiveFrom fact (non-ancestor of the revocation) that ordinary-cutoff would have kept", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("inv17-causal") });
    const eid = "person/inv17-causal";
    await ingestAll(repo, [
      keyAuthFact(
        { keyFpr: fpr, namespaces: ["person"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
        { id: freshFactId("inv17-cau-auth"), signerFpr: rootFpr, wall: 100 },
      ),
      existenceFact(eid, "person", { id: freshFactId("inv17-cau-ex"), fpr, wall: 1000, replicaId: "chain-inv17-cau", seq: 0 }),
      // An honest concurrent pre-effectiveFrom fact (wall 1100 < effectiveFrom 2000), non-ancestor of the revoke.
      propFact(eid, "concurrent", "honest-casualty", { id: freshFactId("inv17-cau-conc"), fpr, wall: 1100, replicaId: "chain-inv17-cau", seq: 1 }),
    ]);

    // GUARD (fails NOW — revokeKey throws): causal-cutoff is the opt-in COMPROMISE mode.
    await expect(repo.revokeKey(fpr, hlc(2000), "genuine key compromise", "causal-cutoff")).resolves.toEqual(expect.any(String));

    // Under causal-cutoff the honest concurrent value is demoted (removed from /heads) — ordinary-cutoff
    // would have KEPT it (the two modes are the two horns of the M5-2 impossibility).
    expect(hasTrustedValueHead(await repo.getNode(eid), "concurrent", "honest-casualty")).toBe(false);
    repo.close();
  });

  it("a re-attest (reAttestFact naming the demoted fact's CID, signed by a currently-trusted key) RESTORES the honest content to a trusted head", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("inv17-reattest") });
    const eid = "person/inv17-reattest";
    const demotedCid = freshFactId("inv17-reattest-demoted");
    await ingestAll(repo, [
      keyAuthFact(
        { keyFpr: fpr, namespaces: ["person"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
        { id: freshFactId("inv17-re-auth"), signerFpr: rootFpr, wall: 100 },
      ),
      existenceFact(eid, "person", { id: freshFactId("inv17-re-ex"), fpr, wall: 1000, replicaId: "chain-inv17-re", seq: 0 }),
      propFact(eid, "status", "honest-value", { id: demotedCid, fpr, wall: 3000, replicaId: "chain-inv17-re", seq: 1 }),
    ]);

    // GUARD (fails NOW — revokeKey throws): revoke demotes the status fact (author-HLC 3000 ≥ 2000).
    await expect(repo.revokeKey(fpr, hlc(2000), "compromise", "causal-cutoff")).resolves.toEqual(expect.any(String));
    expect(hasTrustedValueHead(await repo.getNode(eid), "status", "honest-value")).toBe(false); // demoted

    // A re-attest by THIS repo's own (currently-trusted) key restores the honest content under fresh provenance.
    await repo.reAttestFact({
      type: "re-attest",
      v: 1,
      target: { kind: "node-prop", eid, prop: "status" },
      value: "honest-value",
      validFrom: 0,
      validTo: null,
      reAttests: demotedCid,
      replicaId: "inv17-reattester",
      provenance: { author: "inv17-reattester", signature: "", publicKeyFingerprint: "", signedFields: [] },
    });
    expect(hasTrustedValueHead(await repo.getNode(eid), "status", "honest-value")).toBe(true); // restored
    repo.close();
  });
});
