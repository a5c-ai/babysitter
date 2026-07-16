/**
 * INV-16 — per-key anti-backdating from INVOLUNTARY footprint, GATED ON CHAIN COMPLETENESS
 * (C4-2 + C5-1, m5-5).
 *
 * docs/60-conformance-and-testability.md#inv-16 (verbatim core): "a signature-valid fact `F` from key
 * `K` projects TRUSTED only over a complete gap-free chain of `K` up to `F` … and once complete is
 * demoted `untrusted-anachronistic` iff `S` holds a higher-author-HLC, non-ancestor fact from the
 * SAME `K` IN THE COMPLETE DURABLE CHAIN — independent of whether `F` declares `causedBy`. Sub-cases:
 * (C4-2) author a registered, non-revoked key's higher-stamped fact, then a `causedBy`-LESS backdated
 * fact from the same key → the backdate is demoted (NOT trusted). (genuine residual) a lone self-dated
 * fact from a key that genuinely emitted nothing higher in its chain → projects TRUSTED."
 *
 * The signing key is AUTHORIZED (KeyAuthorization chaining to a genesis root) so a demotion is
 * attributable to anti-backdating, not to absent authorization. An AUTHORIZED SEEDER supplies the
 * node-existence fact so a demoted prop is observed against a PRESENT node (non-vacuous). The chain
 * order (seq) is: higher-stamped fact at the LOWER seq, backdate at the HIGHER seq — the backdate is
 * authored later (higher seq) yet stamped earlier (lower author-HLC), the involuntary-footprint
 * violation. NOTE the modeled KeyAuthorization carrier (fixtures-m8.ts #2).
 *
 * COVERAGE NOTE (C5-1 eviction sub-case): the "higher same-key fact present-but-EVICTED ⇒ backdate
 * PENDING" sub-case needs the §3.5a retention/eviction machinery, which is NOT reachable through the
 * public `Repo` surface (no `RetentionClass`, no eviction seam) — see this suite's `untestable`
 * report and INV-19 (which covers the equivalent chain-gap via partial-replication delivery order).
 *
 * EXPECTED TO FAIL NOW: no per-key anti-backdating exists — a same-key backdate projects a trusted
 * value today. Failures are assertion mismatches, never type/import errors.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import type { Fact } from "../../index";
import {
  freshFactId,
  freshReplicaId,
  hasTrustedValueHead,
  hlc,
  ingestAll,
  keyAuthFact,
  propFact,
  seederAuthFact,
  seederExistence,
} from "./fixtures-m8";

function auth(keyFpr: string, rootFpr: string, id: string): Fact {
  return keyAuthFact(
    { keyFpr, namespaces: ["person"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
    { id, signerFpr: rootFpr, wall: 100 },
  );
}

describe("INV-16: per-key anti-backdating (chain-completeness gated)", () => {
  it("(C4-2) a causedBy-LESS backdate from a key that already emitted a HIGHER-stamped non-ancestor fact (complete chain) is demoted untrusted-anachronistic — NOT a trusted value head", async () => {
    const rootFpr = "genesis-root-inv16";
    const fpr = "authorized-key-inv16";
    const chain = "chain-inv16";
    const repo = new KipRepo({ replicaId: freshReplicaId("inv16-c42") });
    const eid = "person/inv16-c42";
    // Complete gap-free chain (seq 0,1) for (chain, fpr): F' higher (wall 5000) at seq 0, then F backdate
    // (wall 1000) at seq 1 — F is authored later (higher seq) yet stamped earlier ⇒ anachronistic.
    const higher = propFact(eid, "high", "hi", { id: freshFactId("inv16-higher"), fpr, wall: 5000, replicaId: chain, seq: 0 });
    const backdate = propFact(eid, "low", "backdate-loser", { id: freshFactId("inv16-backdate"), fpr, wall: 1000, replicaId: chain, seq: 1 });
    await ingestAll(repo, [
      seederAuthFact(freshFactId("inv16-c42-seeder-auth")),
      seederExistence(eid, "person", freshFactId("inv16-c42-seeder-ex")),
      auth(fpr, rootFpr, freshFactId("inv16-c42-auth")),
      higher,
      backdate,
    ]);
    const node = await repo.getNode(eid);
    // The higher fact stays trusted (control); the backdate is demoted (the failure anchor).
    expect(hasTrustedValueHead(node, "high", "hi")).toBe(true);
    expect(hasTrustedValueHead(node, "low", "backdate-loser")).toBe(false);
    repo.close();
  });

  it("(genuine residual) a lone self-dated FIRST-emission fact from a key that emitted nothing higher projects TRUSTED (the acknowledged acceptable residual, §3.6)", async () => {
    const rootFpr = "genesis-root-inv16-lone";
    const fpr = "authorized-key-inv16-lone";
    const repo = new KipRepo({ replicaId: freshReplicaId("inv16-lone") });
    const eid = "person/inv16-lone";
    // A single seq-0 fact on the key's chain: the key has NO higher same-key fact, so its self-date is trusted.
    const lone = propFact(eid, "only", "self-dated", { id: freshFactId("inv16-lone-fact"), fpr, wall: 42, replicaId: "chain-inv16-lone", seq: 0 });
    await ingestAll(repo, [
      seederAuthFact(freshFactId("inv16-lone-seeder-auth")),
      seederExistence(eid, "person", freshFactId("inv16-lone-seeder-ex")),
      auth(fpr, rootFpr, freshFactId("inv16-lone-auth")),
      lone,
    ]);
    expect(hasTrustedValueHead(await repo.getNode(eid), "only", "self-dated")).toBe(true);
    repo.close();
  });

  it("the backdating decision is byte-identical across replicas holding the complete chain (set-pure)", async () => {
    const rootFpr = "genesis-root-inv16-xrep";
    const fpr = "authorized-key-inv16-xrep";
    const chain = "chain-inv16-xrep";
    const eid = "person/inv16-xrep";
    const universe: Fact[] = [
      seederAuthFact("inv16-xrep-seeder-auth"),
      seederExistence(eid, "person", "inv16-xrep-seeder-ex"),
      auth(fpr, rootFpr, "inv16-xrep-auth"),
      propFact(eid, "high", "hi", { id: "inv16-xrep-higher", fpr, wall: 5000, replicaId: chain, seq: 0 }),
      propFact(eid, "low", "backdate-loser", { id: "inv16-xrep-backdate", fpr, wall: 1000, replicaId: chain, seq: 1 }),
    ];
    const repoA = new KipRepo({ replicaId: freshReplicaId("inv16-xrep-A") });
    const repoB = new KipRepo({ replicaId: freshReplicaId("inv16-xrep-B") });
    await ingestAll(repoA, universe);
    await ingestAll(repoB, [...universe].reverse()); // different order
    const a = hasTrustedValueHead(await repoA.getNode(eid), "low", "backdate-loser");
    const b = hasTrustedValueHead(await repoB.getNode(eid), "low", "backdate-loser");
    expect(a).toBe(b);
    expect(a).toBe(false);
    repoA.close();
    repoB.close();
  });
});
