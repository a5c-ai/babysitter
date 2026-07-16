/**
 * INV-10 — authority chain (author-HLC keyed).
 *
 * docs/60-conformance-and-testability.md#inv-10 (verbatim): "every fact whose author key chains (at
 * the fact's author-HLC) to its tenant genesis root for the target namespace projects TRUSTED; one
 * that does not is demoted-untrusted by proj (not rejected at ingest). A key-add or excision/
 * revocation whose authoring key lacks the scoped capability is itself demoted-untrusted by the same
 * author-HLC rule. Class: set-pure trust decision. Violation: an authority decision that reads
 * rxFrom/receiver clock, or rejects-at-gate instead of demoting."
 *
 * docs/50-security-trust-tenancy.md §8.1: "A key-authorization fact is valid (trusted by proj) only
 * if its authorizing key chains, at the key-add fact's author-HLC, to the genesis root … A key-add
 * whose chain does not reach the genesis root is demoted-untrusted by proj." "A key may write only
 * EIDs in its authorized namespaces (the C-5 write-authority binding)."
 *
 * This is a FIRST full-form INV (no a-form). It does not overlap INV-6 (gate/proj SEPARATION): INV-6
 * fixes the gate-vs-proj boundary; INV-10 fixes the CONTENT of the proj trust decision — chaining to
 * the genesis root, and the namespace/scoped-capability binding.
 *
 * EXPECTED TO FAIL NOW: no genesis-root chaining exists — an admitted fact projects trusted
 * regardless of whether its key chains to a root, and a KeyAuthorization whose `authorizedBy` does
 * NOT chain to a root is not demoted (its value carrier is not read at all). Failures are assertion
 * mismatches, never type/import errors. NOTE the modeled KeyAuthorization carrier (fixtures-m8.ts #2).
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

describe("INV-10: authority chain (author-HLC keyed)", () => {
  it("a fact whose key chains to the genesis root (via a valid KeyAuthorization) projects TRUSTED", async () => {
    const rootFpr = "genesis-root-inv10";
    const fpr = "authorized-key-inv10";
    const repo = new KipRepo({ replicaId: freshReplicaId("inv10-trusted") });
    const eid = "person/inv10-trusted";
    await ingestAll(repo, [
      keyAuthFact(
        { keyFpr: fpr, namespaces: ["person"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
        { id: freshFactId("inv10-keyauth"), signerFpr: rootFpr, wall: 100 },
      ),
      existenceFact(eid, "person", { id: freshFactId("inv10-trusted-ex"), fpr, wall: 1000 }),
      propFact(eid, "status", "active", { id: freshFactId("inv10-trusted-status"), fpr, wall: 1001 }),
    ]);
    expect(hasTrustedValueHead(await repo.getNode(eid), "status", "active")).toBe(true);
    repo.close();
  });

  it("a fact whose key does NOT chain to any genesis root is demoted-untrusted by proj (admitted, not gate-rejected)", async () => {
    const fpr = "unchained-key-inv10";
    const repo = new KipRepo({ replicaId: freshReplicaId("inv10-unchained") });
    const eid = "person/inv10-unchained";
    // No KeyAuthorization at all for `fpr`: admitted at the gate, demoted in proj.
    const ex = existenceFact(eid, "person", { id: freshFactId("inv10-unchained-ex"), fpr, wall: 1000 });
    await expect(repo.ingest(ex)).resolves.toEqual(expect.objectContaining({ admitted: true }));
    await ingestAll(repo, [propFact(eid, "status", "active", { id: freshFactId("inv10-unchained-status"), fpr, wall: 1001 })]);
    expect(hasTrustedValueHead(await repo.getNode(eid), "status", "active")).toBe(false);
    repo.close();
  });

  it("a KeyAuthorization whose AUTHORIZING key does not itself chain to the genesis root grants NO authority — a key it 'authorizes' still projects untrusted (a pushable key cannot self-authorize forgery)", async () => {
    const forgerAuthorizerFpr = "self-appointed-authorizer-inv10"; // NOT a genesis root, no chain
    const forgedKeyFpr = "forged-key-inv10";
    const repo = new KipRepo({ replicaId: freshReplicaId("inv10-forge") });
    const eid = "person/inv10-forge";
    await ingestAll(repo, [
      // A KeyAuthorization signed by a key with no root chain: proj must demote it, so it grants nothing.
      keyAuthFact(
        { keyFpr: forgedKeyFpr, namespaces: ["person"], ops: ["write"], authorizedBy: forgerAuthorizerFpr, effectiveFrom: hlc(0) },
        { id: freshFactId("inv10-forge-keyauth"), signerFpr: forgerAuthorizerFpr, wall: 100 },
      ),
      existenceFact(eid, "person", { id: freshFactId("inv10-forge-ex"), fpr: forgedKeyFpr, wall: 1000 }),
      propFact(eid, "role", "admin", { id: freshFactId("inv10-forge-role"), fpr: forgedKeyFpr, wall: 1001 }),
    ]);
    expect(hasTrustedValueHead(await repo.getNode(eid), "role", "admin")).toBe(false);
    repo.close();
  });

  it("namespace binding: an authorized key writing an EID OUTSIDE its authorized namespaces is demoted (a key writes only EIDs in its authorized namespaces, C-5)", async () => {
    const rootFpr = "genesis-root-inv10-ns";
    const fpr = "person-only-key-inv10";
    const repo = new KipRepo({ replicaId: freshReplicaId("inv10-ns") });
    const eid = "org/inv10-out-of-namespace"; // an `org/*` EID, but the key is authorized for `person` only
    await ingestAll(repo, [
      keyAuthFact(
        { keyFpr: fpr, namespaces: ["person"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
        { id: freshFactId("inv10-ns-keyauth"), signerFpr: rootFpr, wall: 100 },
      ),
      existenceFact(eid, "org", { id: freshFactId("inv10-ns-ex"), fpr, wall: 1000 }),
      propFact(eid, "name", "acme", { id: freshFactId("inv10-ns-name"), fpr, wall: 1001 }),
    ]);
    // Out-of-namespace write ⇒ demoted, even though the key is otherwise authorized.
    expect(hasTrustedValueHead(await repo.getNode(eid), "name", "acme")).toBe(false);
    repo.close();
  });
});
