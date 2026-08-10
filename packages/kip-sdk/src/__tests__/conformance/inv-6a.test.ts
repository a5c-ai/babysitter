/**
 * INV-6a — gate-only sub-case (M0's exit gate).
 *
 * Scope (docs/60-conformance-and-testability.md): the INGEST-GATE alone — no proj, no trust
 * states, no re-fold (those are M1/M8 machinery, gated by the full INV-6). Asserts: the gate
 * rejects ONLY signature-invalid or malformed facts (per the m7-6 well-formedness checklist,
 * incl. the signedFields-mismatch fixture); acceptance/rejection is a PURE FUNCTION of the
 * fact's bytes — byte-identical fixture verdicts on every replica and across repeated runs; no
 * other predicate (drift/key-registration/namespace/revocation/schema) is consulted.
 *
 * Runnable against M0-only machinery: asserts on the `ingest()` gate verdict only (not on
 * projections). Note: the spec text also says to assert on "/facts presence" for admitted
 * facts — the current `index.ts` public surface (Repo/KipRepo/OpenOptions) exposes no seam to
 * inspect the underlying `/facts` store independent of `ingest()`'s own return value, so that
 * half is not checked here (see this task's `untestable` report for INV-7a's git-tree-inspection
 * gap, which applies equally to any "/facts presence" assertion).
 *
 * Every method on `KipRepo` currently throws `unimplemented: <name>` (M0 scaffold) — these
 * tests are EXPECTED TO FAIL until `ingest()` (M0/T1.3) is implemented. Failures should surface
 * as `expect(...).resolves.toEqual(...)` assertion mismatches (the returned promise rejects with
 * "unimplemented: ingest" instead of resolving to a verdict), not as import/type errors.
 */
import { describe, expect, it } from "vitest";
import type { Fact } from "../../index";
import { KipRepo } from "../../index";
import { CANONICAL_SIGNED_FIELDS, cloneFact, makeWellFormedFact } from "./fixtures";

describe("INV-6a: gate-only sub-case (M0's exit gate)", () => {
  it("admits a well-formed, signature-bearing fact (the happy path the reject-only rule is stated against)", async () => {
    const repo = new KipRepo();
    const fact = makeWellFormedFact();
    await expect(repo.ingest(fact)).resolves.toEqual(expect.objectContaining({ admitted: true }));
  });

  it("rejects with reason 'malformed' when provenance.signedFields does not match the canonical envelope field list, in order (m7-6 checklist item 1 — the signedFields-mismatch fixture named explicitly by INV-6a)", async () => {
    const repo = new KipRepo();
    const fact = makeWellFormedFact({
      provenance: { signedFields: [...CANONICAL_SIGNED_FIELDS].reverse() },
    });
    await expect(repo.ingest(fact)).resolves.toEqual({ admitted: false, reason: "malformed" });
  });

  it("rejects with reason 'malformed' when provenance.signedFields omits a required entry (m7-6 checklist item 1)", async () => {
    const repo = new KipRepo();
    const fact = makeWellFormedFact({
      provenance: { signedFields: CANONICAL_SIGNED_FIELDS.filter((field) => field !== "hlc") },
    });
    await expect(repo.ingest(fact)).resolves.toEqual({ admitted: false, reason: "malformed" });
  });

  it("rejects with reason 'malformed' when a required envelope field is absent from the payload entirely (m7-6 checklist item 2, '§2.4 required field present')", async () => {
    const repo = new KipRepo();
    const wellFormed = makeWellFormedFact();
    // Simulate a fact arriving over the wire with a required field missing outright (as opposed
    // to a signedFields-list mismatch) — this can only be modeled by bypassing the `Fact` type's
    // compile-time completeness guarantee, since a real malformed payload isn't itself
    // TS-checked. The rest of the fixture is otherwise well-formed.
    const { hlc: _omittedHlc, ...withoutHlc } = wellFormed;
    const malformed = withoutHlc as unknown as Fact;
    await expect(repo.ingest(malformed)).resolves.toEqual({ admitted: false, reason: "malformed" });
  });

  it("rejects with reason 'malformed' when f.id is not self-consistent with CID(canonicalPayload(f)) (m7-6 checklist item 4)", async () => {
    const repo = new KipRepo();
    const fact = makeWellFormedFact();
    // Tamper with `id` after the fixture is built so it structurally cannot equal
    // CID(canonicalPayload(fact)) for these bytes, regardless of which hash algorithm the gate
    // eventually uses.
    const corrupted = { ...fact, id: `${fact.id}-tampered-so-cid-cannot-match` };
    await expect(repo.ingest(corrupted)).resolves.toEqual({ admitted: false, reason: "malformed" });
  });

  it("rejects with reason 'signature-invalid' when the signature does not verify against provenance.publicKeyFingerprint, independent of well-formedness", async () => {
    const repo = new KipRepo();
    const fact = makeWellFormedFact({ provenance: { signature: "sig:tampered-does-not-verify" } });
    await expect(repo.ingest(fact)).resolves.toEqual({ admitted: false, reason: "signature-invalid" });
  });

  it("acceptance/rejection is a PURE FUNCTION of the fact's bytes: the identical fixture yields a byte-identical verdict across repeated ingest() calls", async () => {
    const repo = new KipRepo();
    const fact = makeWellFormedFact();
    const first = await repo.ingest(cloneFact(fact));
    const second = await repo.ingest(cloneFact(fact));
    const third = await repo.ingest(cloneFact(fact));
    expect(second).toEqual(first);
    expect(third).toEqual(first);
  });

  it("acceptance/rejection is a PURE FUNCTION of the fact's bytes: byte-identical fixtures verdict identically on every replica (two independently-constructed Repo instances agree)", async () => {
    const replicaA = new KipRepo();
    const replicaB = new KipRepo();
    const fact = makeWellFormedFact();
    const verdictA = await replicaA.ingest(cloneFact(fact));
    const verdictB = await replicaB.ingest(cloneFact(fact));
    expect(verdictB).toEqual(verdictA);
  });

  it("consults no predicate beyond well-formedness/signature-validity: an advisory-only field (provenance.confidence, docs/21 'advisory only, never affect ... m-2') does not change the admit/reject verdict", async () => {
    const repo = new KipRepo();
    const base = makeWellFormedFact({ id: "shared-fixture-confidence-invariance" });
    const withLowConfidence = { ...base, provenance: { ...base.provenance, confidence: 0.01 } };
    const withHighConfidence = { ...base, provenance: { ...base.provenance, confidence: 0.99 } };
    const verdictLow = await repo.ingest(withLowConfidence);
    const verdictHigh = await repo.ingest(cloneFact(withHighConfidence));
    expect(verdictHigh).toEqual(verdictLow);
  });
});
