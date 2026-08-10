/**
 * INV-14b — excised chain slot is an attested hole, not a gap (A-1, closes the excision×seq
 * interaction).
 *
 * docs/60-conformance-and-testability.md#inv-14b (verbatim): "Asserts: a physically-excised (§4.5)
 * mid-chain fact's `seq` slot is satisfied by a present, signature-valid `excision` marker naming
 * that `(chainId, seq)` (the `ExcisionMarker.excisedChainId`/`excisedSeq` fields, SDK surface) — for
 * both the chain-completeness gate (convergence §1.2a) and pin-completeness (§4c/m4-1, INV-14). The
 * suite excises a mid-chain fact from a ≥3-fact same-pair chain and asserts (a) later same-pair
 * facts remain locally decidable (trusted/demoted, never stuck `pending`) and (b) a pin enumerating
 * that chain re-resolves `pin-complete` with a recomputed `factSetDigest` over the surviving subset.
 * Class: byte-identity of digest + local completeness decision. Violation: excising a mid-chain fact
 * leaving later same-pair facts permanently `pending`, or an enumerating pin permanently
 * `pin-incomplete` (the pre-A-1 bricking bug)."
 *
 * This file is authored at M9 (the shippable-conformance-suite milestone, docs/60 §8.4). It is
 * built exclusively against the public surface in index.ts (`KipRepo`, `ExcisionMarker`,
 * `pin`/`resolvePin`/`excise`/`asOf`) plus the shared `makeWellFormedFact` fixture — no impl module
 * is read or mirrored.
 *
 * ── HOW THIS TEST TREATS THE TWO HALVES OF INV-14b ──────────────────────────────────────────────
 *
 * (a) — the LATER-FACT-DECIDABILITY half — is IMPLEMENTED and asserted as an ordinary passing `it`.
 *     A ≥3-fact single-`(replicaId,key)` chain (existence seq0, prop `secret` seq1, prop `later`
 *     seq2) is excised at its MIDDLE link (seq1); the later same-pair fact (seq2) is asserted to
 *     remain locally decidable — it still projects its trusted value, never a stuck `pending` — and
 *     the excised cell surfaces as an explicit `excised` segment (surfaced, never silently dropped).
 *     This is the load-bearing correctness half of the invariant (no permanent bricking of later
 *     same-key facts' trust) and it holds today.
 *
 * (b) — the PIN-RE-COMPLETENESS half — depends on the A-1 "attested hole" bridge, now IMPLEMENTED
 *     and asserted as an ordinary passing `it`. `resolvePin`'s per-`(replicaId,key)` `seq`-contiguity
 *     check (INV-14's completeness rule) treats the excised `seq` slot as SATISFIED by the present,
 *     signature-valid excision marker naming that `(excisedChainId, excisedSeq)` — otherwise the
 *     physically-erased mid-chain slot would read as a contiguity gap and the pin would brick
 *     permanently `pin-incomplete` (INV-14b's own violation clause). The A-1 slice wired this end to
 *     end: the durable, SIGNED excision-marker payload now carries `(excisedChainId, excisedSeq)`
 *     (proj.ts's `ExcisionMarkerPayload`, alongside `cellTarget`/`validFrom`/`validTo`/`excisedFactId`/
 *     `excisedReason`), and both `resolvePin` (index.ts) AND the value-trust chain-completeness gate
 *     (proj.ts's `computeValueTrust` Rule D(i)) consult `collectAttestedChainHoles` — the SAME
 *     set-pure, authorized-marker attested-hole rule docs/22 §3.6 step (i) names as shared. So a
 *     mid-chain excise no longer flips a previously `pin-complete` pin to `pin-incomplete`; it
 *     re-resolves `pin-complete` over the surviving subset.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import type { ExcisionMarker } from "../../index";
import { KipRepo } from "../../index";
import { makeWellFormedFact } from "./fixtures";

/** A fresh, test-owned temp directory so each case gets an isolated substrate. */
function freshRepoDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kip-inv14b-"));
}

/**
 * Builds and ingests a ≥3-fact single-`(replicaId, key)` chain — existence (seq0), a `secret` prop
 * (seq1, the mid-chain link that will be excised), and a `later` prop (seq2, the later same-pair
 * fact) — all signed by the same unregistered fingerprint (`known-fpr-1`, the fixtures' default) so
 * this replica legitimately qualifies to SELF-excise the mid link under §4.5's authorization rule.
 */
async function ingestThreeFactChain(repo: KipRepo, replicaId: string, eid: string): Promise<void> {
  const existence = makeWellFormedFact({ replicaId, seq: 0, target: { kind: "node", eid, nodeKind: "person" }, id: "inv14b-existence" });
  existence.value = true;
  const secret = makeWellFormedFact({ replicaId, seq: 1, target: { kind: "node-prop", eid, prop: "secret" }, id: "inv14b-secret" });
  secret.value = "middle-secret";
  const later = makeWellFormedFact({ replicaId, seq: 2, target: { kind: "node-prop", eid, prop: "later" }, id: "inv14b-later" });
  later.value = "later-value";
  await repo.ingest(existence);
  await repo.ingest(secret);
  await repo.ingest(later);
}

describe("INV-14b: excised chain slot is an attested hole, not a gap (A-1, excision×seq)", () => {
  it("the excision MARKER names the excised (chainId, seq) — the substrate the completeness gate consumes to treat the slot as an attested hole rather than a contiguity gap", async () => {
    const dir = freshRepoDir();
    const replicaId = "replica-inv14b-marker";
    const eid = "person/inv14b-marker";
    const repo = new KipRepo({ dir, replicaId });
    await ingestThreeFactChain(repo, replicaId, eid);

    const marker: ExcisionMarker = await repo.excise("inv14b-secret", "gdpr-erasure");

    // The marker names EXACTLY the excised mid-chain slot on the original fact's `(replicaId,key)`
    // chain — `<replicaId>/<keyFpr>` and its `seq` — the `(chainId, seq)` a completeness gate reads
    // to know which hole this attestation fills (INV-14b's "naming that (chainId, seq)" clause).
    expect(marker.excisedChainId).toBe(`${replicaId}/known-fpr-1`);
    expect(marker.excisedSeq).toBe(1);
    expect(marker.excised).toBe("inv14b-secret");
  });

  it("(a) after a mid-chain excise, the LATER same-pair fact remains locally decidable (still projects its trusted value, never stuck `pending`) and the excised cell surfaces as an explicit `excised` segment", async () => {
    const dir = freshRepoDir();
    const replicaId = "replica-inv14b-decidable";
    const eid = "person/inv14b-decidable";
    const repo = new KipRepo({ dir, replicaId });
    await ingestThreeFactChain(repo, replicaId, eid);

    // Excise the MIDDLE link (seq1) of the ≥3-fact chain.
    await repo.excise("inv14b-secret", "gdpr-erasure");

    const view = await (await repo.asOf({ validTime: 1_700_000_000_500 })).getNode(eid);
    expect(view).not.toBeNull();

    // The later same-pair fact (seq2) is NOT bricked by the mid-chain hole — it projects its trusted
    // value (locally decidable), never a stuck `pending`.
    const laterSegments = view?.props.later?.segments ?? [];
    expect(laterSegments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "later-value" })]),
    );

    // The excised mid-chain cell is SURFACED as an explicit `excised` segment (never silently
    // dropped, never an error).
    const secretSegments = view?.props.secret?.segments ?? [];
    expect(secretSegments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "excised", excisedFactId: "inv14b-secret" })]),
    );
  });

  it("(b) a pin enumerating the chain re-resolves `pin-complete` over the surviving subset once the excised slot is an attested hole [A-1 attested-hole bridge: resolvePin treats the signed excision marker's `(excisedChainId, excisedSeq)` as SATISFIED, not a gap]", async () => {
    const dir = freshRepoDir();
    const replicaId = "replica-inv14b-pin";
    const eid = "person/inv14b-pin";
    const repo = new KipRepo({ dir, replicaId });
    await ingestThreeFactChain(repo, replicaId, eid);

    // Pin the chain while it is fully contiguous (frontier captures seq 0..2) — `pin-complete`.
    const ref = await repo.pin({ tenant: "tenant-inv14b" });
    const before = await repo.resolvePin(ref);
    expect(before.status).toBe("pin-complete");

    // Physically excise the MIDDLE link (seq1) — its bytes are genuinely erased (§4.5), leaving a
    // present, signature-valid excision marker naming `(excisedChainId, excisedSeq)`.
    await repo.excise("inv14b-secret", "gdpr-erasure");

    // SPEC-CORRECT expectation (INV-14b(b)): the marker satisfies the seq-1 slot as an attested
    // hole, so the pin re-resolves `pin-complete` over the surviving subset (the A-1 bridge:
    // `resolvePin` reads the signed marker's `(excisedChainId, excisedSeq)` and treats seq-1 as
    // filled, never a contiguity gap).
    const after = await repo.resolvePin(ref);
    expect(after.status).toBe("pin-complete");
  });
});
