/**
 * INV-2 (FULL FORM) — convergence / SEC over the SIGNATURE-VALID admitted set (non-vacuous, C3-1).
 *
 * docs/60-conformance-and-testability.md#inv-2 (verbatim core): "for random fact-set partitions
 * delivered in random orders to N replicas — INCLUDING key-authorization, `revoke-key`, and backdated
 * / anachronistic facts crossing author-HLC boundaries — once the same facts have been received, all
 * replicas reach byte-identical `/heads` and byte-identical deterministic projections … The suite
 * includes the C2-1 counterexample (a fact straddling a revocation, merged late on one replica) …
 * asserts EQUAL heads — catching membership divergence, not only value divergence."
 *
 * RELATION TO THE FROZEN INV-2a (./inv-2a.test.ts + ./inv-2a-m3-surface.test.ts — NOT touched): the
 * a-form restricts to plain assert/retract with NO key-authorization / revoke-key / backdated
 * permutations (it explicitly defers those to "the M8 trust overlay and … the full INV-2"). This
 * file adds exactly those trust-overlay permutations: two replicas fed the SAME set (KeyAuthorization
 * + data facts + a `revoke-key` straddling them, delivered in DIFFERENT orders) must reach the
 * IDENTICAL trust verdict.
 *
 * A KeyAuthorization for the signing key is included so the differential under test is created by the
 * REVOCATION (pre-cutoff authorized ⇒ trusted, post-cutoff ⇒ demoted), not merely by an absent
 * authorization (which would demote BOTH sides and make the straddle vacuous). NOTE the modeled
 * KeyAuthorization/KeyRevocation carrier (fixtures-m8.ts MODELING CONVENTIONS #2).
 *
 * EXPECTED TO FAIL NOW: the M8 revocation/trust overlay does not exist — the post-cutoff fact is
 * projected as a trusted value on both replicas (so the "demoted identically" assertion sees a
 * still-trusted head). Failures are assertion mismatches, never type/import errors.
 */
import { describe, expect, it } from "vitest";
import type { Fact } from "../../index";
import {
  existenceFact,
  hasTrustedValueHead,
  hlc,
  ingestAll,
  keyAuthFact,
  m8Repo,
  propFact,
  revokeFact,
} from "./fixtures-m8";

describe("INV-2 (full): SEC over the signature-valid set INCLUDING key-authorization / revoke-key / backdated facts", () => {
  const rootFpr = "genesis-root-inv2";
  const fpr = "authorized-then-revoked-key-inv2";
  const revokerFpr = "revoker-key-inv2";
  const eid = "person/inv2-straddle";

  // A stable universe both replicas receive; delivery ORDER is the only thing that differs.
  function universe(): Fact[] {
    return [
      keyAuthFact(
        { keyFpr: fpr, namespaces: ["person"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
        { id: "inv2-keyauth", signerFpr: rootFpr, wall: 500 },
      ),
      // The revoker holds genesis-root-chained `revoke` scope over `person` (round-2 finding #3: a
      // revocation is honored ONLY from an authorized revoker — an unauthorized `revoke-key` is itself
      // demoted and confers no demotion; the frozen fixture originally granted the revoker no authority
      // at all, so it is corrected here to establish real revoke authority — see this milestone's disputes).
      keyAuthFact(
        { keyFpr: revokerFpr, namespaces: ["person"], ops: ["revoke"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
        { id: "inv2-revoker-auth", signerFpr: rootFpr, wall: 501 },
      ),
      existenceFact(eid, "person", { id: "inv2-pre-ex", fpr, wall: 1000, replicaId: "chain-inv2", seq: 0 }),
      propFact(eid, "before", "kept", { id: "inv2-pre-prop", fpr, wall: 1100, replicaId: "chain-inv2", seq: 1 }),
      propFact(eid, "after", "cutoff-loser", { id: "inv2-post-prop", fpr, wall: 2000, replicaId: "chain-inv2", seq: 2 }),
      revokeFact(
        { keyFpr: fpr, effectiveFrom: hlc(1500), mode: "ordinary-cutoff", reason: "suspected misuse", revokedBy: revokerFpr },
        { id: "inv2-revoke", signerFpr: revokerFpr, wall: 1600 },
      ),
    ];
  }

  it("C2-1 straddle: two replicas fed the SAME set in DIFFERENT orders reach the IDENTICAL trust verdict — pre-effectiveFrom trusted on BOTH, post-effectiveFrom demoted on BOTH", async () => {
    const u = universe();
    const repoA = m8Repo("inv2-A");
    const repoB = m8Repo("inv2-B");
    await ingestAll(repoA, u); // authorization-first order
    await ingestAll(repoB, [...u].reverse()); // revoke-first / data-before-authorization order

    const nodeA = await repoA.getNode(eid);
    const nodeB = await repoB.getNode(eid);

    // Pre-effectiveFrom authorized work: trusted on BOTH (ordinary-cutoff preserves it), EQUAL.
    expect(hasTrustedValueHead(nodeA, "before", "kept")).toBe(true);
    expect(hasTrustedValueHead(nodeB, "before", "kept")).toBe(hasTrustedValueHead(nodeA, "before", "kept"));
    // Post-effectiveFrom fact (author-HLC ≥ effectiveFrom): demoted on BOTH, EQUAL (membership convergence).
    expect(hasTrustedValueHead(nodeA, "after", "cutoff-loser")).toBe(false);
    expect(hasTrustedValueHead(nodeB, "after", "cutoff-loser")).toBe(hasTrustedValueHead(nodeA, "after", "cutoff-loser"));
    repoA.close();
    repoB.close();
  });

  it("membership convergence: the KeyAuthorization and revoke-key control facts are ADMITTED (members) on every replica that receives them, independent of delivery order relative to the data facts they govern", async () => {
    const repo = m8Repo("inv2-mem");
    // Deliver the control facts BEFORE the data facts they govern — all are admitted members (gate is
    // signature-only), and the eventual trust verdict is order-independent.
    for (const f of [...universe()].reverse()) {
      // eslint-disable-next-line no-await-in-loop -- sequential ingest, module-wide pattern
      await expect(repo.ingest(f)).resolves.toEqual(expect.objectContaining({ admitted: true }));
    }
    expect(hasTrustedValueHead(await repo.getNode(eid), "before", "kept")).toBe(true);
    expect(hasTrustedValueHead(await repo.getNode(eid), "after", "cutoff-loser")).toBe(false);
    repo.close();
  });
});
