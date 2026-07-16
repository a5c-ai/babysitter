/**
 * INV-13 (FULL FORM) — signature-valid ⇒ eventually-admitted-on-receipt (non-vacuous substrate
 * convergence, C3-1/C3-2/M3-4).
 *
 * docs/60-conformance-and-testability.md#inv-13 (verbatim core): "every signature-valid fact offered
 * to any replica is admitted by every replica that receives it, upon receipt … regardless of clock
 * skew, partition length, or whether its signing key's registration has arrived yet — and its logical
 * membership is NEVER dropped … The suite delivers signature-valid facts under adversarial clock
 * skew, multi-day offline partitions, and data-before-key-registration ordering, and asserts each
 * fact is present in every replica's admitted set after sync (a quarantined/untrusted fact still
 * counts as admitted)."
 *
 * RELATION TO THE FROZEN INV-13a (./inv-13a.test.ts — NOT touched): the a-form asserts admitted-on-
 * receipt at the GATE with NO trust states ("quarantine/untrusted labels are M8 machinery, gated by
 * the full INV-13"). This file adds the M8 half: a fact that proj DEMOTES (unregistered key) is
 * STILL a member — admission is preserved for the very facts trust demotes, which is what makes the
 * SEC antecedent (equal admitted sets) non-vacuous. No assertion duplicates INV-13a's gate cases.
 *
 * EXPECTED TO FAIL NOW: the membership half already holds (byte-pure gate) — the genuine-failure
 * anchor is the CONJUNCTION "admitted AND demoted" (the demotion half does not exist yet, so the
 * fact is admitted-AND-trusted, failing the demotion assertion). Failures are assertion mismatches,
 * never type/import errors.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import {
  clone,
  existenceFact,
  freshFactId,
  freshReplicaId,
  hasTrustedValueHead,
  ingestAll,
  propFact,
} from "./fixtures-m8";

describe("INV-13 (full): signature-valid ⇒ admitted-on-receipt, even for facts proj will demote", () => {
  it("a fact whose signing key's registration has NOT arrived is admitted on receipt AND still demoted in proj (admitted ≠ trusted; membership preserved for the demoted fact)", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("inv13-demoted-member") });
    const eid = "person/inv13-demoted-member";
    const fpr = "unregistered-key-inv13";
    const ex = existenceFact(eid, "person", { id: freshFactId("inv13-dm-ex"), fpr, wall: 1000 });
    const prop = propFact(eid, "status", "active", { id: freshFactId("inv13-dm-status"), fpr, wall: 1001 });
    // Membership: admitted on receipt (this half already conformant).
    await expect(repo.ingest(clone(ex))).resolves.toEqual(expect.objectContaining({ admitted: true }));
    await expect(repo.ingest(clone(prop))).resolves.toEqual(expect.objectContaining({ admitted: true }));
    // INV-7 idempotent re-offer never drops the (demoted) member.
    await expect(repo.ingest(clone(prop))).resolves.toEqual(expect.objectContaining({ admitted: true }));
    // …yet proj DEMOTES it (the genuine-failure anchor: a quarantined fact is still admitted).
    expect(hasTrustedValueHead(await repo.getNode(eid), "status", "active")).toBe(false);
    repo.close();
  });

  it("data-before-key-registration ordering under adversarial clock skew: a wildly future-skewed AND a stale author-HLC fact are BOTH admitted (membership never dropped), and BOTH demoted (no covering authorization yet)", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("inv13-skew") });
    const fpr = "unregistered-key-inv13-skew";
    const futureEid = "person/inv13-future";
    const staleEid = "person/inv13-stale";
    await ingestAll(repo, [
      existenceFact(futureEid, "person", { id: freshFactId("inv13-fut-ex"), fpr, wall: Number.MAX_SAFE_INTEGER - 1 }),
      propFact(futureEid, "v", "future", { id: freshFactId("inv13-fut-v"), fpr, wall: Number.MAX_SAFE_INTEGER - 1, counter: 1 }),
      existenceFact(staleEid, "person", { id: freshFactId("inv13-stale-ex"), fpr, wall: 0 }),
      propFact(staleEid, "v", "stale", { id: freshFactId("inv13-stale-v"), fpr, wall: 0, counter: 1 }),
    ]);
    // Both admitted-as-members (no drift/staleness/key predicate at the gate) but demoted (unauthorized key).
    expect(hasTrustedValueHead(await repo.getNode(futureEid), "v", "future")).toBe(false);
    expect(hasTrustedValueHead(await repo.getNode(staleEid), "v", "stale")).toBe(false);
    repo.close();
  });

  it("cross-replica membership presence: two replicas that both receive the same signature-valid (demotable) fact both admit it — equal received ⇒ equal admitted (the SEC antecedent is reachable, not vacuous)", async () => {
    const fpr = "unregistered-key-inv13-xrep";
    const eid = "person/inv13-xrep";
    const ex = existenceFact(eid, "person", { id: "inv13-xrep-ex", fpr, wall: 1000 });
    const prop = propFact(eid, "v", "shared", { id: "inv13-xrep-v", fpr, wall: 1001 });
    const repoA = new KipRepo({ replicaId: freshReplicaId("inv13-xrep-A") });
    const repoB = new KipRepo({ replicaId: freshReplicaId("inv13-xrep-B") });
    for (const f of [ex, prop]) {
      // eslint-disable-next-line no-await-in-loop -- sequential ingest, module-wide pattern
      const a = await repoA.ingest(clone(f));
      // eslint-disable-next-line no-await-in-loop
      const b = await repoB.ingest(clone(f));
      expect(a).toEqual(b); // byte-identical admit verdict on both
    }
    // Both demote identically (equal admitted set ⇒ equal trust verdict).
    expect(hasTrustedValueHead(await repoA.getNode(eid), "v", "shared")).toBe(
      hasTrustedValueHead(await repoB.getNode(eid), "v", "shared"),
    );
    expect(hasTrustedValueHead(await repoA.getNode(eid), "v", "shared")).toBe(false);
    repoA.close();
    repoB.close();
  });
});
