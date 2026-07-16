/**
 * INV-6 (FULL FORM) — gate / proj separation + verification (signature-only gate, C3-1, M3-4).
 *
 * docs/60-conformance-and-testability.md#inv-6 (verbatim core): "the ingest gate rejects ONLY
 * signature-invalid or malformed facts … Unregistered-key, out-of-namespace, revoked, AND
 * author-HLC-anachronistic facts are NOT rejected at ingest; they are demoted-untrusted / quarantined
 * inside `proj` keyed on author-HLC — surfaced, never silently trusted or dropped, re-evaluated
 * monotonically. A dedicated test feeds a signature-valid fact whose key is unregistered at ingest
 * time, asserts it is admitted, then delivers the key-registration fact and asserts it becomes trusted
 * on re-fold."  docs/50-security-trust-tenancy.md §8.1 (M3-4): "A fact signed by an unregistered key …
 * is NOT rejected at ingest; it is admitted by signature alone and demoted untrusted/quarantined by
 * proj, becoming trusted automatically if/when a valid registration for that key arrives."
 *
 * RELATION TO THE FROZEN INV-6a (./inv-6a.test.ts — NOT touched): INV-6a asserts the GATE HALF only
 * (reject iff signature-invalid/malformed; admit is a pure function of bytes). This file adds the
 * PROJ HALF the a-form explicitly defers to M8: an admitted-but-unauthorized fact is DEMOTED in
 * `proj` (value-trust demotion of admitted-but-unkeyed facts, deferred M3/M7 → M8), and becomes
 * trusted only once its authorization arrives. No assertion here duplicates INV-6a's gate verdicts.
 *
 * EXPECTED TO FAIL NOW: the M8 value-trust overlay does not exist — `proj` projects an admitted
 * unauthorized-key fact as a TRUSTED value head (see fixtures-m8.ts "WHY THESE TESTS FAIL NOW"). The
 * "admitted at gate" halves already PASS (byte-pure gate, M3); the DEMOTION halves fail on a real
 * assertion mismatch (a still-trusted head), never a type/import error.
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

describe("INV-6 (full): gate / proj separation — admitted-but-unauthorized facts demote in proj", () => {
  it("a signature-valid fact from an UNREGISTERED key is ADMITTED at the gate (byte-pure membership, no key-registration predicate)", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("inv6-admit") });
    const eid = "person/inv6-admit";
    const fpr = "unregistered-key-inv6";
    const ex = existenceFact(eid, "person", { id: freshFactId("inv6-admit-ex"), fpr, wall: 1000 });
    // The gate half (already conformant since M3): admission is signature-only, so this resolves admitted.
    await expect(repo.ingest(ex)).resolves.toEqual(expect.objectContaining({ admitted: true }));
    repo.close();
  });

  it("that admitted UNREGISTERED-key fact is DEMOTED by proj (admission ≠ trust) — its value does NOT win /heads as a trusted head until a registration arrives", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("inv6-demote") });
    const eid = "person/inv6-demote";
    const fpr = "unregistered-key-inv6-demote";
    await ingestAll(repo, [
      existenceFact(eid, "person", { id: freshFactId("inv6-demote-ex"), fpr, wall: 1000 }),
      propFact(eid, "status", "active", { id: freshFactId("inv6-demote-status"), fpr, wall: 1001 }),
    ]);
    const node = await repo.getNode(eid);
    // §8.1 admission ≠ trust: an unauthorized key's fact projects untrusted/quarantined, NOT a value head.
    expect(hasTrustedValueHead(node, "status", "active")).toBe(false);
    repo.close();
  });

  it("MONOTONE re-fold: the demoted unregistered-key fact BECOMES trusted once a valid KeyAuthorization for that key (chaining to the genesis root) arrives", async () => {
    const rootFpr = "genesis-root-inv6";
    const repo = new KipRepo({ replicaId: freshReplicaId("inv6-refold"), rootKeys: [] });
    const eid = "person/inv6-refold";
    const fpr = "late-registered-key-inv6";
    // Data fact arrives BEFORE its key's registration (the data-before-key race, §8.1).
    await ingestAll(repo, [
      existenceFact(eid, "person", { id: freshFactId("inv6-refold-ex"), fpr, wall: 2000 }),
      propFact(eid, "status", "active", { id: freshFactId("inv6-refold-status"), fpr, wall: 2001 }),
    ]);
    // Before registration: demoted (this sub-assertion is the genuine-failure anchor today).
    expect(hasTrustedValueHead(await repo.getNode(eid), "status", "active")).toBe(false);

    // The KeyAuthorization for `fpr` arrives, authorized by (chaining to) the genesis root.
    await ingestAll(repo, [
      keyAuthFact(
        { keyFpr: fpr, namespaces: ["person"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
        { id: freshFactId("inv6-refold-keyauth"), signerFpr: rootFpr, wall: 2100 },
      ),
    ]);
    // After registration: the SAME facts re-fold to trusted (monotone, never re-authored).
    expect(hasTrustedValueHead(await repo.getNode(eid), "status", "active")).toBe(true);
    repo.close();
  });

  it("out-of-namespace, revoked, and anachronistic facts are likewise ADMITTED (not gate-rejected) yet demoted in proj — the gate consults no trust predicate", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("inv6-varieties") });
    const eid = "person/inv6-varieties";
    const fpr = "unauthorized-key-inv6-varieties";
    const ex = existenceFact(eid, "person", { id: freshFactId("inv6-var-ex"), fpr, wall: 3000 });
    const prop = propFact(eid, "role", "admin", { id: freshFactId("inv6-var-role"), fpr, wall: 3001 });
    // Gate admits both (signature-only membership).
    await expect(repo.ingest(ex)).resolves.toEqual(expect.objectContaining({ admitted: true }));
    await expect(repo.ingest(prop)).resolves.toEqual(expect.objectContaining({ admitted: true }));
    // proj demotes (no authorizing chain in S).
    expect(hasTrustedValueHead(await repo.getNode(eid), "role", "admin")).toBe(false);
    repo.close();
  });
});
