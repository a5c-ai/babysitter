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
 * SPLIT SCOPE — this file covers BOTH halves of INV-12:
 *
 *   (1) the PIN/AS-OF CONVERGENCE half, below, exercised through the EXISTING public surface
 *       (`pin`/`resolvePin`/`asOf`/`sync`/`excise`) — the half of INV-12 that matters to a caller
 *       who, per the spec's own C2-3 design, never addresses anything by commit CID in the first
 *       place. `sync`/`excise`/`pin`/`resolvePin`/`asOf` are now genuinely implemented (not stubs),
 *       and this half PASSES.
 *
 *   (2) the COMMIT-DAG-BYTE-IDENTITY half, exercised via `KipRepo.regenerateHeads()` — a MINIMAL
 *       TEST-SUPPORT stub added to index.ts (see `RegeneratedCommit`'s doc comment there) precisely
 *       because, before this addition, kip's OWN design (docs/24 §4.5, "identity/as-of/pins address
 *       the FACT SET, never commit CIDs") deliberately kept the regenerated git commit DAG a
 *       TRANSPORT detail with NO public introspection seam at all — no `log()`, no commit-export
 *       seam, no raw-object accessor; `fsck()` returns only a summary `FsckReport`, `branch()` only
 *       a branch-name string. `regenerateHeads()` is a genuinely NEW addition, clearly flagged as
 *       test-support (never presented as part of the documented docs/40 `Repo` contract, never
 *       inventing a fake-passing behavior) — its body still just `throw`s
 *       `unimplemented: regenerateHeads`; no commit/tree/ref regeneration code exists yet
 *       (isomorphic-git was only just installed). This half is EXPECTED TO FAIL right now via that
 *       thrown error propagating through the `await`, per this task's TDD framing.
 *
 *       NOT covered by this file — explicitly out of scope, not "untestable": the spec's second
 *       named fidelity, a real CROSS-OS CI matrix job (`windows-latest` + `ubuntu-latest`)
 *       regenerating the fixture set and asserting commit bytes against a committed golden digest
 *       (m7-26). That is a later phase's job, per this task's own framing, and cannot be provided
 *       by an in-process vitest file regardless of what public surface exists.
 *
 * Test methodology (pin/as-of half): `sync()` is the M3/T4.2 primitive that ACTUALLY propagates
 * replica A's and replica B's concurrent excisions to each other; this file calls it directly
 * (rather than substituting a same-process ingest-replay shortcut, which would silently skip
 * exercising the real cross-replica propagation seam INV-12 is actually about). The shared
 * PRE-excision baseline fact set is established via direct `ingest()` on both replicas (the
 * established M0/M1 fixture convention — see inv-1.test.ts's own doc comment for why `assertFact`
 * cannot be used to hand two independent replicas byte-identical facts), modelling "two replicas
 * that have already synced once" without assuming `sync()` itself works yet.
 *
 * Test methodology (byte-DAG half): a SINGLE replica ingests two facts and excises one of them,
 * then calls `regenerateHeads()` TWICE around the SAME logical regeneration of the SAME resulting
 * admitted set — once with `TZ`/`core.autocrlf`/locale perturbed to a `+0200`-shaped configuration,
 * once perturbed to a `+0000`-shaped configuration with different `core.autocrlf`/locale (the M4-3
 * cross-OS/cross-TZ byte recipe's in-process fidelity, m7-26) — asserting the two regenerated
 * commit-object byte outputs are IDENTICAL, and that the recipe's individual clauses hold (fixed
 * `+0000` offset, integer-seconds `floor(wall/1000)` timestamp, fixed sentinel committer, unsigned,
 * LF-only). `regenerateHeads()` throws `unimplemented: regenerateHeads` on its very first call, so
 * this test is EXPECTED TO FAIL right now via that throw propagating through the `await` — not as
 * an import/type error.
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

  it("the regenerated commit DAG is BYTE-IDENTICAL across a +0200/autocrlf-true/locale-de-DE in-process perturbation and a +0000/autocrlf-false/locale-en-US in-process perturbation of the SAME logical regeneration of the SAME post-excision admitted set (INV-12 M3-3/M4-3 byte-recipe, m7-26 in-process execution mechanism) — via KipRepo.regenerateHeads(), a minimal test-support stub added to index.ts for exactly this purpose (see RegeneratedCommit's doc comment there); regenerateHeads() currently throws unimplemented: regenerateHeads (no commit/tree/ref regeneration code exists yet), so this test is EXPECTED TO FAIL right now via that throw propagating through the await", async () => {
    const eid = "person/inv12-bytedag";

    // Two facts on the SAME (replicaId,key) chain (distinct contiguous seq, same pattern as the
    // convergence test above): one left standing, one excised — "the equal remaining ordered set"
    // INV-12's byte-DAG clause is about is this replica's post-excision admitted set.
    const existence = makeWellFormedFact({
      target: { kind: "node", eid, nodeKind: "person" },
      id: "inv12-bytedag-existence",
      replicaId: "author-inv12-bytedag",
      seq: 0,
    });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const toExcise = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "erasedField" },
      id: "inv12-bytedag-excised",
      replicaId: "author-inv12-bytedag",
      seq: 1,
    });
    toExcise.value = "erase-me";
    toExcise.validFrom = 0;
    toExcise.validTo = null;

    const repo = new KipRepo({ replicaId: "storage-bytedag" });
    await repo.ingest(cloneFact(existence));
    await repo.ingest(cloneFact(toExcise));
    await repo.excise(toExcise.id, "gdpr-erasure");

    // Perturb the AMBIENT environment (process TZ) around the two regeneration calls — the
    // m7-26 in-process execution mechanism — restoring it afterward regardless of outcome.
    const originalTz = process.env.TZ;
    try {
      process.env.TZ = "Etc/GMT-2"; // POSIX sign-inverted: Etc/GMT-2 == UTC+02:00 ("+0200"-local)
      const runPlus0200 = await repo.regenerateHeads({
        tz: "Etc/GMT-2",
        coreAutocrlf: true,
        locale: "de-DE",
      });

      process.env.TZ = "Etc/UTC"; // "+0000"-local
      const runPlus0000 = await repo.regenerateHeads({
        tz: "Etc/UTC",
        coreAutocrlf: false,
        locale: "en-US",
      });

      // INV-12 M4-3 core clause: "runs the regenerator on a +0200-local replica and a +0000
      // replica with mismatched core.autocrlf and locale, asserting byte-identical commit
      // objects" — the actual raw bytes and their own content-derived oid must match exactly.
      expect(runPlus0000.commitBytes).toEqual(runPlus0200.commitBytes);
      expect(runPlus0000.commitOid).toBe(runPlus0200.commitOid);

      // INV-12 M4-3: "must be fixed +0000, integer-seconds floor(wall/1000)" — never the
      // process's local TZ (both runs must show +0000 despite the +0200 perturbation above),
      // never a millisecond value, never a stamped "now".
      const expectedTimestampSeconds = Math.floor(toExcise.hlc.wall / 1000);
      expect(runPlus0200.committer.tzOffset).toBe("+0000");
      expect(runPlus0000.committer.tzOffset).toBe("+0000");
      expect(runPlus0200.committer.timestampSeconds).toBe(expectedTimestampSeconds);
      expect(runPlus0000.committer.timestampSeconds).toBe(expectedTimestampSeconds);

      // INV-12 M3-3: "fixed sentinel committer" — never the real fact author's own identity.
      expect(runPlus0200.committer.name).not.toBe(toExcise.provenance.author);
      expect(runPlus0200.committer.email).not.toContain(toExcise.provenance.publicKeyFingerprint);
      expect(runPlus0200.committer).toEqual(runPlus0000.committer);

      // INV-12 M3-3/M4-3: "unsigned DAG" / "gpgsig (absent)" — no signature header at all.
      expect(runPlus0200.signed).toBe(false);
      expect(runPlus0000.signed).toBe(false);

      // INV-12 M4-3: "encoding header (absent / UTF-8)" — never a leak of process locale.
      expect(runPlus0200.encoding === undefined || runPlus0200.encoding === "UTF-8").toBe(true);
      expect(runPlus0000.encoding === undefined || runPlus0000.encoding === "UTF-8").toBe(true);

      // INV-12 M4-3: "commit-message line endings (LF-only)" — never CRLF, regardless of the
      // core.autocrlf perturbation above (true in one run, false in the other).
      expect(runPlus0200.message.includes("\r")).toBe(false);
      expect(runPlus0000.message.includes("\r")).toBe(false);
    } finally {
      process.env.TZ = originalTz;
    }
  });
});
