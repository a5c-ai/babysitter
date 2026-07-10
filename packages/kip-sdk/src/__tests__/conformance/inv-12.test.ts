/**
 * INV-12 — concurrent-excision pin / as-of convergence + BYTE-IDENTICAL regenerated DAG (closes
 * m2-4, C2-3, M3-3).
 *
 * docs/60-conformance-and-testability.md#inv-12 (verbatim): "Asserts: after concurrent excision on
 * different replicas, `asOf` and durable pins (`factSetDigest` + author-HLC frontier) resolve
 * identically across replicas, independent of commit-CID divergence, and the regenerated commit
 * DAG is byte-identical given the equal remaining ordered set. The suite excises F1 on A and F2 on
 * B concurrently, syncs, and asserts equal `/heads`, equal pin resolution, and byte-identical
 * regenerated DAG ... Cross-OS / cross-TZ byte recipe (M4-3): runs the regenerator on a
 * `+0200`-local replica and a `+0000` replica with mismatched `core.autocrlf` and locale,
 * asserting byte-identical commit objects ... Execution mechanism (m7-26): TZ, locale, and
 * `core.autocrlf` are perturbed in-process, per test ... true cross-OS coverage is a named CI
 * matrix job ... both fidelities are required to claim INV-12 passes."
 *
 * SPLIT SCOPE — this file covers the PIN/AS-OF CONVERGENCE half in full and marks the
 * COMMIT-DAG-BYTE-IDENTITY half `it.skip` as untestable-as-written (also reported in this task's
 * `untestable` output), for a concrete, non-negotiable reason: kip's OWN design (docs/24 §4.5,
 * "identity/as-of/pins address the FACT SET, never commit CIDs") deliberately keeps the regenerated
 * git commit DAG a TRANSPORT detail, never an addressable/inspectable part of the `Kip`/`Repo`
 * public surface (index.ts) — there is no `log()`, no commit-export seam, no raw-object accessor;
 * `fsck()` returns only a summary `FsckReport` of booleans and `FactId`/`EID` arrays (no commit
 * bytes), and `branch()` returns only a branch-name string. Asserting "byte-identical regenerated
 * commit objects" would require either (a) reaching into the on-disk substrate's internal object
 * layout/encoding directly — which this task's own instructions forbid reading source for
 * (substrate.ts is out of the index.ts-plus-__tests__ read scope) and which would encode
 * assumptions about internals that are explicitly NOT part of the documented public contract, or
 * (b) inventing a NEW public introspection API the spec does not currently expose on `Repo` —
 * which the task instructions say never to do (never reinterpret/weaken a criterion by
 * substituting an easier, unspec'd surface). The pin/as-of convergence half below, by contrast, is
 * fully testable through the EXISTING public surface (`pin`/`resolvePin`/`asOf`/`sync`/`excise`)
 * and is exactly the half of INV-12 that matters to a caller who — per the spec's own C2-3
 * design — never addresses anything by commit CID in the first place.
 *
 * Test methodology: `sync()` is the still-unimplemented M3/T4.2 primitive that would ACTUALLY
 * propagate replica A's and replica B's concurrent excisions to each other; this file calls it
 * directly (rather than substituting a same-process ingest-replay shortcut, which would silently
 * skip exercising the real cross-replica propagation seam INV-12 is actually about) so its
 * `unimplemented` throw is what makes this file fail honestly, per this task's TDD framing. The
 * shared PRE-excision baseline fact set is established via direct `ingest()` on both replicas
 * (the established M0/M1 fixture convention — see inv-1.test.ts's own doc comment for why
 * `assertFact` cannot be used to hand two independent replicas byte-identical facts), modelling
 * "two replicas that have already synced once" without assuming `sync()` itself works yet.
 *
 * `sync()`/`excise()` currently throw `unimplemented: sync` / `unimplemented: excise` (M3/T4.2,
 * M3/T4.6 not yet implemented) — these tests are EXPECTED TO FAIL right now; failures should
 * surface as the thrown `unimplemented` error propagating through the `await`, not as import/type
 * errors.
 */
import { describe, expect, it } from "vitest";
import type { Fact } from "../../index";
import { KipRepo } from "../../index";
import { cloneFact, makeWellFormedFact } from "./fixtures";

describe("INV-12: concurrent-excision pin / as-of convergence + byte-identical regenerated DAG", () => {
  it("after CONCURRENT excision of DIFFERENT facts on two replicas (A excises F1, B excises F2) followed by sync, both replicas' resolvePin() report the SAME status with the IDENTICAL factSetDigest, and both replicas' asOf({validTime}) agree — independent of any commit-CID divergence (this test never reads or compares a commit CID, matching the spec's own C2-3 'never an addressable identity' design)", async () => {
    const eid = "person/inv12-concurrent-excision";

    // All three facts below share ONE author (replicaId,key) chain, given DISTINCT, contiguous
    // `seq` values (0,1,2) — sharing a chain but colliding on `seq` would be a self-inflicted fork
    // (§4b.1/m7-1), which is not what this test is about; distinct contiguous `seq`s keep the
    // chain well-formed so `pin()`/`resolvePin()` (INV-14 machinery, reused here only as the
    // convergence-check instrument INV-12 itself names) behave as a normal, non-forked chain.
    const existence = makeWellFormedFact({
      target: { kind: "node", eid, nodeKind: "person" },
      id: "inv12-existence",
      replicaId: "author-inv12",
      seq: 0,
    });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    // F1 and F2: two INDEPENDENT covering asserts on two INDEPENDENT cells of the SAME node — one
    // excised on replica A, the other excised on replica B, concurrently (neither replica's
    // excision is causally dependent on the other's).
    const f1 = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "fieldOne" },
      id: "inv12-f1",
      replicaId: "author-inv12",
      seq: 1,
    });
    f1.value = "f1-value";
    f1.validFrom = 0;
    f1.validTo = null;

    const f2 = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "fieldTwo" },
      id: "inv12-f2",
      replicaId: "author-inv12",
      seq: 2,
    });
    f2.value = "f2-value";
    f2.validFrom = 0;
    f2.validTo = null;

    const baseline: Fact[] = [existence, f1, f2];

    // Two independent physical replicas, both already holding the SAME baseline set (modelling
    // "already synced once" without assuming sync() itself works — see file-level comment).
    const repoA = new KipRepo({ replicaId: "storage-A" });
    const repoB = new KipRepo({ replicaId: "storage-B" });
    for (const f of baseline) {
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential baseline setup
      await repoA.ingest(cloneFact(f));
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential baseline setup
      await repoB.ingest(cloneFact(f));
    }

    // CONCURRENT excision: A excises F1, B excises F2 — neither replica has yet seen the other's
    // excision marker at this point.
    await repoA.excise(f1.id, "gdpr-erasure");
    await repoB.excise(f2.id, "gdpr-erasure");

    // Propagate BOTH concurrent excisions to both replicas via the real M3 sync primitive.
    await repoA.sync("storage-B");
    await repoB.sync("storage-A");

    const pinRef = await repoA.pin({ tenant: "tenant-inv12" });
    const resolvedOnA = await repoA.resolvePin(pinRef);
    const resolvedOnB = await repoB.resolvePin(pinRef);
    expect(resolvedOnB).toEqual(resolvedOnA);

    const asOfOnA = await (await repoA.asOf({ validTime: 0 })).getNode(eid);
    const asOfOnB = await (await repoB.asOf({ validTime: 0 })).getNode(eid);
    expect(asOfOnB).toEqual(asOfOnA);

    // Both fields must now reflect BOTH excisions on BOTH replicas (each cell lost its only
    // covering assert ⇒ unknown, docs/24 §4.5) — the remaining admitted set (existence only) has
    // converged identically, independent of which replica performed which excision.
    expect(asOfOnA?.props.fieldOne.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "unknown" })]),
    );
    expect(asOfOnA?.props.fieldTwo.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "unknown" })]),
    );
  });

  it.skip(
    "UNTESTABLE AS WRITTEN: 'the regenerated commit DAG is byte-identical given the equal remaining ordered set' and the cross-OS/cross-TZ commit-object byte recipe (fixed +0000 offset, LF-only message, no `encoding` header, no `gpgsig`, single sentinel author=committer) cannot be asserted through the current public Kip/Repo surface (index.ts). No method exposes the regenerated commit DAG's raw objects/bytes for inspection: `fsck()` returns only a summary FsckReport (booleans + FactId/EID arrays), `branch()` returns only a branch-name string, and there is no `log()`/commit-export/raw-object seam. Reaching the actual git commit objects would require reading substrate.ts internals (explicitly out of this task's read scope: only index.ts + __tests__ may be read) and would encode undocumented assumptions about on-disk layout rather than the documented public contract — and inventing a NEW introspection API not named anywhere in the read SPEC/docs slice would be reinterpreting/weakening the criterion, which this task's instructions forbid. This half of INV-12 needs either (a) a dedicated public commit-DAG-inspection seam to be added to the SDK surface first, or (b) the named CI matrix job (windows-latest + ubuntu-latest asserting commit bytes against a committed golden digest, m7-26) the spec itself says is required ALONGSIDE the in-process perturbation test — neither of which exists yet. See this task's `untestable` report.",
    () => {
      // Intentionally skipped, not faked. See the file-level and it-level comments above.
    },
  );
});
