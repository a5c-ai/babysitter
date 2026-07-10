/**
 * INV-13a — admitted-on-receipt gate sub-case (M0's exit gate).
 *
 * Scope (docs/60-conformance-and-testability.md): the gate-level half only — no trust states
 * (quarantine/untrusted labels are M8 machinery, gated by the full INV-13). Asserts: every
 * signature-valid fact offered to a replica is admitted on receipt — written to `/facts/**` and
 * never dropped — including facts with arbitrarily old/skewed author-HLCs and facts whose
 * signing key the replica has never seen. Assert on `/facts` presence + INV-7 idempotent
 * re-offer, not on projected trust.
 *
 * Runnable against M0-only machinery: asserted here via the `ingest()` return-value contract
 * (`{admitted: true}`). Note: the spec text also says to assert on independent "/facts
 * presence" — the current `index.ts` public surface exposes no store-inspection seam separate
 * from `ingest()`'s own return value (see this suite's `untestable` report), so that half is
 * not independently checked here.
 *
 * `KipRepo.ingest()` currently throws `unimplemented: ingest` (M0 scaffold) — these tests are
 * EXPECTED TO FAIL until it is implemented; failures should surface as
 * `expect(...).resolves.toEqual(...)` assertion mismatches, not import/type errors.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { cloneFact, makeWellFormedFact } from "./fixtures";

describe("INV-13a: admitted-on-receipt gate sub-case (M0's exit gate)", () => {
  it("admits a signature-valid fact on receipt", async () => {
    const repo = new KipRepo();
    const fact = makeWellFormedFact();
    await expect(repo.ingest(fact)).resolves.toEqual(expect.objectContaining({ admitted: true }));
  });

  it("admits a signature-valid fact with an arbitrarily old author-HLC (no drift/staleness predicate consulted at the gate)", async () => {
    const repo = new KipRepo();
    const fact = makeWellFormedFact({ hlc: { wall: 0, counter: 0 } });
    fact.validFrom = 0;
    await expect(repo.ingest(fact)).resolves.toEqual(expect.objectContaining({ admitted: true }));
  });

  it("admits a signature-valid fact with a wildly future-skewed author-HLC (no drift predicate consulted at the gate)", async () => {
    const repo = new KipRepo();
    const fact = makeWellFormedFact({ hlc: { wall: Number.MAX_SAFE_INTEGER - 1, counter: 0 } });
    await expect(repo.ingest(fact)).resolves.toEqual(expect.objectContaining({ admitted: true }));
  });

  it("admits a signature-valid fact whose signing key the replica has never seen (key-registration/trust state is M8 machinery, not consulted at the gate)", async () => {
    const repo = new KipRepo();
    const fact = makeWellFormedFact({ provenance: { publicKeyFingerprint: "never-seen-before-fpr-xyz" } });
    await expect(repo.ingest(fact)).resolves.toEqual(expect.objectContaining({ admitted: true }));
  });

  it("never drops a signature-valid fact on re-offer: re-offering an already-admitted fact (INV-7 idempotent re-offer) still resolves admitted, rather than being dropped or throwing", async () => {
    const repo = new KipRepo();
    const fact = makeWellFormedFact();
    const first = await repo.ingest(cloneFact(fact));
    expect(first.admitted).toBe(true);
    const second = await repo.ingest(cloneFact(fact));
    expect(second.admitted).toBe(true);
  });
});
