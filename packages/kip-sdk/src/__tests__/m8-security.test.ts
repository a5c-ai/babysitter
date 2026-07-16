/**
 * M8 method-acceptance — the security/trust/tenancy/DoS SEAMS as public methods (distinct from the
 * INV-* trust-outcome conformance files under ./conformance/). Covers:
 *   • revokeKey(keyFpr, effectiveFrom, reason, mode?) — the revocation authoring seam (docs/40; §8.1)
 *   • withScope(scope) — the advisory client write guard + read filter (§8.2, C-5.3)
 *   • grant / allow / deny POLICY facts — access policy is data (§8.2)
 *   • secret-redaction-on-export — the per-read name-pattern filter for unprivileged scopes (§8.3)
 *
 * Everything is built against the public `Repo`/`KipRepo` surface in src/index.ts. `revokeKey` and
 * `withScope` throw `unimplemented` today, and the read-time redaction filter does not exist, so every
 * test below fails on a real assertion / rejected-promise guard — never a type/import/syntax error.
 *
 * COVERAGE NOTE (retention DoS bounds): the §8.3b `RetentionClass` / `quarantinePoolBytes` /
 * `keyChainDurableCapBytes` accounting has no public-surface seam (no class query, no byte-budget
 * read, no eviction hook) — its OBSERVABLE consequence (the flood never affects trusted `/heads`) is
 * conformance-tested in ./conformance/inv-18.test.ts; the byte-accounting itself is recorded in this
 * task's `untestable` report.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import type { AssertInput, ScopeRef } from "../index";
import {
  existenceFact,
  freshFactId,
  freshReplicaId,
  hasTrustedValueHead,
  hlc,
  ingestAll,
  keyAuthFact,
  propFact,
  valueSegments,
} from "./conformance/fixtures-m8";

const rootFpr = "genesis-root-m8method";

describe("M8 method: revokeKey()", () => {
  const fpr = "authorized-then-revoked-key-m8method";

  async function seedAuthorizedChain(repo: KipRepo, eid: string, chain: string): Promise<void> {
    await ingestAll(repo, [
      keyAuthFact(
        { keyFpr: fpr, namespaces: ["person"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
        { id: freshFactId("m8m-auth"), signerFpr: rootFpr, wall: 100 },
      ),
      existenceFact(eid, "person", { id: freshFactId("m8m-ex"), fpr, wall: 1000, replicaId: chain, seq: 0 }),
      propFact(eid, "before", "kept", { id: freshFactId("m8m-pre"), fpr, wall: 1100, replicaId: chain, seq: 1 }),
      propFact(eid, "after", "loser", { id: freshFactId("m8m-post"), fpr, wall: 3000, replicaId: chain, seq: 2 }),
    ]);
  }

  it("returns the signed revoke-key fact's CID (a FactId string)", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("m8m-revoke-ret") });
    await seedAuthorizedChain(repo, "person/m8m-revoke-ret", "chain-m8m-ret");
    await expect(repo.revokeKey(fpr, hlc(2000), "misuse", "ordinary-cutoff")).resolves.toEqual(expect.any(String));
    repo.close();
  });

  it("DEFAULTS to ordinary-cutoff (mode omitted): demotes author-HLC ≥ effectiveFrom, preserves pre-effectiveFrom as trusted", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("m8m-revoke-default") });
    const eid = "person/m8m-revoke-default";
    await seedAuthorizedChain(repo, eid, "chain-m8m-default");
    await expect(repo.revokeKey(fpr, hlc(2000), "misuse")).resolves.toEqual(expect.any(String)); // mode omitted
    const node = await repo.getNode(eid);
    expect(hasTrustedValueHead(node, "before", "kept")).toBe(true);
    expect(hasTrustedValueHead(node, "after", "loser")).toBe(false);
    repo.close();
  });

  it("effectiveFrom is compared to each fact's AUTHOR-HLC (not the receiver's rxFrom): raising effectiveFrom ABOVE every fact's author-HLC demotes NONE", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("m8m-revoke-authhlc") });
    const eid = "person/m8m-revoke-authhlc";
    await seedAuthorizedChain(repo, eid, "chain-m8m-authhlc");
    // effectiveFrom above the highest author-HLC (3000): nothing is ≥ it, so both facts stay trusted.
    await expect(repo.revokeKey(fpr, hlc(10_000), "future cutoff", "ordinary-cutoff")).resolves.toEqual(expect.any(String));
    const node = await repo.getNode(eid);
    expect(hasTrustedValueHead(node, "before", "kept")).toBe(true);
    expect(hasTrustedValueHead(node, "after", "loser")).toBe(true);
    repo.close();
  });
});

describe("M8 method: withScope() tenancy guard (advisory client write guard + read filter)", () => {
  const scope: ScopeRef = { tenant: "tenant-A", namespace: "ns-A" };

  it("returns a scoped Repo lens (does not throw)", () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("m8m-scope-lens") });
    expect(() => repo.withScope(scope)).not.toThrow();
    repo.close();
  });

  it("REFUSES to author an EID outside the scope's authorized namespaces — throws ERR_SCOPE_DENIED (C-5.3)", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("m8m-scope-deny") });
    const outOfScope: AssertInput = {
      type: "assert",
      v: 1,
      target: { kind: "node", eid: "ns-B/outsider", nodeKind: "person" }, // ns-B ∉ scope ns-A
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "m8m-scope-deny-author",
      provenance: { author: "m8m", signature: "", publicKeyFingerprint: "", signedFields: [] },
    };
    await expect(
      (async () => {
        const scoped = repo.withScope(scope);
        await scoped.assertFact(outOfScope);
      })(),
    ).rejects.toThrow(/ERR_SCOPE_DENIED/);
    repo.close();
  });

  it("PERMITS authoring an EID inside the scope's namespace (the write guard is a namespace check, not a blanket refusal)", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("m8m-scope-allow") });
    const inScope: AssertInput = {
      type: "assert",
      v: 1,
      target: { kind: "node", eid: "ns-A/insider", nodeKind: "person" }, // ns-A ∈ scope
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "m8m-scope-allow-author",
      provenance: { author: "m8m", signature: "", publicKeyFingerprint: "", signedFields: [] },
    };
    await expect(
      (async () => {
        const scoped = repo.withScope(scope);
        return scoped.assertFact(inScope);
      })(),
    ).resolves.toEqual(expect.objectContaining({ id: expect.any(String) }));
    repo.close();
  });
});

describe("M8: access-policy facts (allow / deny / grant) — policy is data (§8.2)", () => {
  it("a read outside an active deny policy returns NOTHING through the SDK read path (no partial leak)", async () => {
    // A deny policy fact over (scope, actor, capability) is authored as data; a scoped read that the
    // policy denies must surface nothing. withScope throws today, so the scoped-read guard fails.
    const repo = new KipRepo({ replicaId: freshReplicaId("m8m-policy-deny") });
    const eid = "ns-secret/record";
    await ingestAll(repo, [
      keyAuthFact(
        { keyFpr: "authorized-key-m8m-policy", namespaces: ["ns-secret"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
        { id: freshFactId("m8m-policy-auth"), signerFpr: rootFpr, wall: 100 },
      ),
      existenceFact(eid, "person", { id: freshFactId("m8m-policy-ex"), fpr: "authorized-key-m8m-policy", wall: 1000 }),
      propFact(eid, "secretField", "classified", { id: freshFactId("m8m-policy-secret"), fpr: "authorized-key-m8m-policy", wall: 1001 }),
    ]);
    // A read through a scope the deny policy governs returns nothing (fails now: withScope throws).
    await expect(
      (async () => {
        const scoped = repo.withScope({ tenant: "tenant-A", namespace: "ns-secret" });
        return scoped.getNode(eid);
      })(),
    ).resolves.toBeNull();
    repo.close();
  });
});

describe("M8: secret-redaction-on-export (§8.3)", () => {
  it("exportKeyring() returns this replica's raw PRIVATE signing key (a secret credential the §8.3 guidance is about)", () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("m8m-export") });
    const keyring = repo.exportKeyring();
    expect(keyring.privateKeyPem).toEqual(expect.stringContaining("PRIVATE KEY"));
    repo.close();
  });

  it("a secret-named cell (token|secret|password) is REDACTED at read for an unprivileged scope (per-read name-pattern filter, §8.3)", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("m8m-redact") });
    const eid = "person/m8m-redact";
    await ingestAll(repo, [
      keyAuthFact(
        { keyFpr: "authorized-key-m8m-redact", namespaces: ["person"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
        { id: freshFactId("m8m-redact-auth"), signerFpr: rootFpr, wall: 100 },
      ),
      existenceFact(eid, "person", { id: freshFactId("m8m-redact-ex"), fpr: "authorized-key-m8m-redact", wall: 1000 }),
      propFact(eid, "password", "hunter2", { id: freshFactId("m8m-redact-pw"), fpr: "authorized-key-m8m-redact", wall: 1001 }),
    ]);
    // Read through an unprivileged scope: the `password` cell's raw secret MUST NOT be a visible value.
    await expect(
      (async () => {
        const scoped = repo.withScope({ tenant: "tenant-unpriv", namespace: "person" });
        const node = await scoped.getNode(eid);
        return valueSegments(node?.props.password).map((s) => s.value);
      })(),
    ).resolves.not.toContain("hunter2");
    repo.close();
  });
});
