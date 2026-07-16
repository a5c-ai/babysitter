/**
 * INV-19 — anti-backdating preserved under eviction & partial replication (C5-1; holds under
 * cap-bounded retention, M6-1/m6-2).
 *
 * docs/60-conformance-and-testability.md#inv-19 (verbatim core): "per-key trust is monotone and
 * eviction-safe. The suite (1) authors `K`'s higher honest fact `F'` and a lower backdate `F` from
 * the same registered `K`; (2) on a victim replica induces eviction / non-replication of `F'`; (3)
 * asserts the victim projects `F` PENDING (chain gap), NEVER trusted; (4) re-fetches/delivers `F'`
 * (and the intervening chain) and asserts `F` flips to demoted (`untrusted-anachronistic`), at most
 * once and never reversing."
 *
 * OBSERVABLE SUBSET DRIVEN HERE — PARTIAL REPLICATION via DELIVERY ORDER: the public `Repo` surface
 * has no §3.5a eviction/`RetentionClass`/re-fetch seam, so the CAP-EVICTION route (evict `F'` past
 * `keyChainDurableCapBytes`, then re-fetch) is NOT reachable and is recorded in this suite's
 * `untestable` report. The set-pure CORE of INV-19 — "a missing lower chain link forces the dependent
 * PENDING, never trusted; delivering it flips to demoted, never trusted" — IS reachable by delivering
 * the same-key backdate BEFORE its lower chain link (a partial-replication state). The signing key is
 * AUTHORIZED and an AUTHORIZED SEEDER supplies node-existence, so (non-)trust is attributable to the
 * chain/anti-backdating rule and observed against a PRESENT node (fixtures-m8.ts #2).
 *
 * EXPECTED TO FAIL NOW: no chain-gap `pending` and no per-key anti-backdating exist — the backdate
 * projects a trusted value at every point today. Failures are assertion mismatches, never type/import
 * errors.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import type { Fact } from "../../index";
import {
  clone,
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

const rootFpr = "genesis-root-inv19";
const fpr = "authorized-key-inv19";
const chain = "chain-inv19";
const eid = "person/inv19";

function preamble(idTag: string): Fact[] {
  return [
    seederAuthFact(freshFactId(`inv19-seeder-auth-${idTag}`)),
    seederExistence(eid, "person", freshFactId(`inv19-seeder-ex-${idTag}`)),
    keyAuthFact(
      { keyFpr: fpr, namespaces: ["person"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
      { id: freshFactId(`inv19-auth-${idTag}`), signerFpr: rootFpr, wall: 100 },
    ),
  ];
}

describe("INV-19: anti-backdating monotone & never-trusted under partial replication", () => {
  it("a same-key backdate delivered while its LOWER chain link is missing projects PENDING (chain gap) — NOT trusted — then flips to DEMOTED once the link arrives, never once trusted", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("inv19-monotone") });
    // F' = higher honest fact at seq 0 (wall 5000); F = lower backdate at seq 1 (wall 1000).
    const higher = propFact(eid, "high", "hi", { id: "inv19-higher", fpr, wall: 5000, replicaId: chain, seq: 0 });
    const backdate = propFact(eid, "low", "backdate-loser", { id: "inv19-backdate", fpr, wall: 1000, replicaId: chain, seq: 1 });

    // STATE 1 (partial replication): backdate (seq 1) arrives BEFORE its seq-0 predecessor ⇒ chain gap.
    await ingestAll(repo, [...preamble("mono"), backdate]);
    expect(hasTrustedValueHead(await repo.getNode(eid), "low", "backdate-loser")).toBe(false); // pending, not trusted

    // STATE 2: the missing lower link arrives ⇒ chain completes ⇒ backdate demoted (never trusted).
    await repo.ingest(clone(higher));
    expect(hasTrustedValueHead(await repo.getNode(eid), "low", "backdate-loser")).toBe(false); // demoted, not trusted
    // The completed-chain higher fact IS trusted (control — it is not a backdate).
    expect(hasTrustedValueHead(await repo.getNode(eid), "high", "hi")).toBe(true);
    repo.close();
  });

  it("per-shared-subset agreement: a replica missing the lower link and a replica holding the full chain NEVER disagree by making the backdate TRUSTED on one of them (divergence is surfaced as pending, never two trusted heads)", async () => {
    const higher = propFact(eid, "high", "hi", { id: "inv19-shared-higher", fpr, wall: 5000, replicaId: chain, seq: 0 });
    const backdate = propFact(eid, "low", "backdate-loser", { id: "inv19-shared-backdate", fpr, wall: 1000, replicaId: chain, seq: 1 });

    const full = new KipRepo({ replicaId: freshReplicaId("inv19-full") });
    const victim = new KipRepo({ replicaId: freshReplicaId("inv19-victim") });
    await ingestAll(full, [...preamble("full"), higher, backdate]); // complete chain
    await ingestAll(victim, [...preamble("victim"), backdate]); // missing the seq-0 link

    // Neither replica projects the backdate as a trusted head (full: demoted; victim: pending).
    expect(hasTrustedValueHead(await full.getNode(eid), "low", "backdate-loser")).toBe(false);
    expect(hasTrustedValueHead(await victim.getNode(eid), "low", "backdate-loser")).toBe(false);
    full.close();
    victim.close();
  });
});
