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
 *       TEST-SUPPORT seam added to index.ts (see `RegeneratedCommit`'s doc comment there) precisely
 *       because kip's OWN design (docs/24 §4.5, "identity/as-of/pins address the FACT SET, never
 *       commit CIDs") deliberately keeps the regenerated git commit DAG a TRANSPORT detail with NO
 *       OTHER public introspection seam — no `log()`, no commit-export seam, no raw-object accessor;
 *       `fsck()` returns only a summary `FsckReport`, `branch()` only a branch-name string.
 *       `regenerateHeads()` is a genuinely NEW addition, clearly flagged as test-support (never
 *       presented as part of the documented docs/40 `Repo` contract, never inventing a fake-passing
 *       behavior). As of round 2 (D-27), this is a REAL, non-stub implementation: it builds a
 *       genuine multi-commit chain (one commit per author-HLC-contiguous batch, docs/23 §5.2's
 *       `regenBoundaryRule`) directly via isomorphic-git's low-level plumbing
 *       (`writeBlob`/`writeTree`/`writeCommit`/`readObject`) over the CONTENT-fact-filtered admitted
 *       set (excision markers and other control facts never pollute the tree — round 1's critical
 *       cross-replica-divergence bug, fixed in round 2). This half PASSES.
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
 * LF-only). This test's own two facts happen to share one (replicaId, hlc.wall) author-HLC batch,
 * so `regenerateHeads()`'s regenerated chain here is exactly one commit — see the round-2 tests
 * below (added additively) for genuine multi-batch/parent-chain/incremental-reuse coverage and a
 * true two-independent-KipRepo cross-replica-excision byte-DAG convergence test.
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

  it("the regenerated commit DAG is BYTE-IDENTICAL across a +0200/autocrlf-true/locale-de-DE in-process perturbation and a +0000/autocrlf-false/locale-en-US in-process perturbation of the SAME logical regeneration of the SAME post-excision admitted set (INV-12 M3-3/M4-3 byte-recipe, m7-26 in-process execution mechanism) — via KipRepo.regenerateHeads(), a test-support seam added to index.ts for exactly this purpose (see RegeneratedCommit's doc comment there), now a real multi-commit-DAG-capable implementation (round 2, D-27)", async () => {
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

  // -------------------------------------------------------------------------
  // ROUND 2 (D-27 FIX 1/FIX 2) ADDITIVE COVERAGE — added per this round's adversarial-review
  // findings that the round-1 suite never actually exercised (a) a genuine TWO-REPLICA byte-DAG
  // convergence scenario (only the pin/as-of half above used two replicas; the byte-DAG half used
  // a single replica) and (b) any multi-batch/parent-chain/incremental-reuse behavior at all (round
  // 1's `regenerateHeads()` always produced exactly one commit regardless of author-HLC batch
  // boundaries). Purely ADDITIVE — no existing assertion above is weakened or removed.
  // -------------------------------------------------------------------------

  it("[round 2 / D-27 FIX 1] regenerateHeads() produces a BYTE-IDENTICAL regenerated commit DAG on two INDEPENDENT KipRepo replicas after concurrent excision of DIFFERENT facts, once synced — closing the critical bug where the previous implementation folded each replica's own non-deterministic excision-marker fact (random nonce, real signature, this replica's own localHlc) into the regenerated tree, producing byte-DIFFERENT commits for the identical remaining knowledge content", async () => {
    const eid = "person/inv12-bytedag-crossreplica";

    const existence = makeWellFormedFact({
      target: { kind: "node", eid, nodeKind: "person" },
      id: "inv12-bd-existence",
      replicaId: "author-bd",
      seq: 0,
    });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const f1 = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "fieldOne" },
      id: "inv12-bd-f1",
      replicaId: "author-bd",
      seq: 1,
    });
    f1.value = "f1-value";
    f1.validFrom = 0;
    f1.validTo = null;

    const f2 = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "fieldTwo" },
      id: "inv12-bd-f2",
      replicaId: "author-bd",
      seq: 2,
    });
    f2.value = "f2-value";
    f2.validFrom = 0;
    f2.validTo = null;

    const baseline: Fact[] = [existence, f1, f2];
    const repoA = new KipRepo({ replicaId: "storage-bd-A" });
    const repoB = new KipRepo({ replicaId: "storage-bd-B" });
    for (const f of baseline) {
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential baseline setup
      await repoA.ingest(cloneFact(f));
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential baseline setup
      await repoB.ingest(cloneFact(f));
    }

    // CONCURRENT excision, same pattern as the pin/as-of test above, but this time the assertion
    // is on the BYTE-DAG itself, never previously exercised across two independent replicas.
    await repoA.excise(f1.id, "gdpr-erasure");
    await repoB.excise(f2.id, "gdpr-erasure");
    await repoA.sync("storage-bd-B");
    await repoB.sync("storage-bd-A");

    const dagA = await repoA.regenerateHeads();
    const dagB = await repoB.regenerateHeads();

    // The remaining knowledge-content set (existence only — both f1 and f2 are now excised on BOTH
    // replicas) converged identically, independent of which replica excised which fact, which
    // replica's own excision-marker nonce/signature/localHlc happened to be involved, or commit-CID
    // divergence during the propagation window — the actual point of INV-12.
    expect(dagB.commitBytes).toEqual(dagA.commitBytes);
    expect(dagB.commitOid).toBe(dagA.commitOid);
    expect(dagB.commits.length).toBe(dagA.commits.length);
    expect(dagB.commits.map((c) => c.commitOid)).toEqual(dagA.commits.map((c) => c.commitOid));
    expect(dagB.commits.map((c) => c.commitBytes)).toEqual(dagA.commits.map((c) => c.commitBytes));
  });

  it("[round 2 / D-27 FIX 2] regenerateHeads() builds a genuine multi-commit, parent-linked DAG (one commit per author-HLC-contiguous batch) and REUSES prior batches' byte-identical commit objects when a new fact arrives, recomputing only the affected tail — and correctly recomputes from an earlier point when a new fact's orderKey position falls MID-sequence instead", async () => {
    const eid = "person/inv12-bytedag-multibatch";
    const replicaId = "author-multibatch";
    const repo = new KipRepo({ replicaId: "storage-multibatch" });

    // Batch 1 (wall=1000): two facts sharing (replicaId, hlc.wall) — a single author-HLC-contiguous
    // batch per docs/23 §5.2's `regenBoundaryRule`.
    const a1 = makeWellFormedFact({
      target: { kind: "node", eid, nodeKind: "person" },
      id: "inv12-mb-a1",
      replicaId,
      hlc: { wall: 1000 },
      seq: 0,
    });
    a1.value = true;
    a1.validTo = null;
    const a2 = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "fieldA" },
      id: "inv12-mb-a2",
      replicaId,
      hlc: { wall: 1000 },
      seq: 1,
    });
    a2.value = "a";
    a2.validTo = null;

    // Batch 2 (wall=2000): a DIFFERENT author-HLC wall -> a NEW batch boundary.
    const b1 = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "fieldB" },
      id: "inv12-mb-b1",
      replicaId,
      hlc: { wall: 2000 },
      seq: 2,
    });
    b1.value = "b";
    b1.validTo = null;

    for (const f of [a1, a2, b1]) {
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential ingest
      await repo.ingest(cloneFact(f));
    }

    const firstRun = await repo.regenerateHeads();
    expect(firstRun.commits.length).toBe(2);
    expect(firstRun.commits[0].parent).toBeNull();
    expect(firstRun.commits[1].parent).toBe(firstRun.commits[0].commitOid);
    // The top-level fields mirror the TIP commit (backward-compat with the single-commit shape).
    expect(firstRun.commitOid).toBe(firstRun.commits[1].commitOid);
    expect(firstRun.commitBytes).toEqual(firstRun.commits[1].commitBytes);

    // --- Append a LATE fact (wall=3000, sorts AFTER everything else) -----------------------------
    const c1 = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "fieldC" },
      id: "inv12-mb-c1",
      replicaId,
      hlc: { wall: 3000 },
      seq: 3,
    });
    c1.value = "c";
    c1.validTo = null;
    await repo.ingest(cloneFact(c1));

    const secondRun = await repo.regenerateHeads();
    expect(secondRun.commits.length).toBe(3);
    // NFR-F5 incremental reuse: the first two commits are REUSED verbatim (same object identity,
    // not merely coincidentally-equal bytes from a full recompute) — proving the tail-append case
    // genuinely skips re-writing untouched batches' commit objects rather than rebuilding the whole
    // chain from scratch every call.
    expect(secondRun.commits[0]).toBe(firstRun.commits[0]);
    expect(secondRun.commits[1]).toBe(firstRun.commits[1]);
    expect(secondRun.commits[2].parent).toBe(firstRun.commits[1].commitOid);
    expect(secondRun.commitOid).toBe(secondRun.commits[2].commitOid);

    // --- Insert a MID-sequence fact (wall=1500, sorts BETWEEN batch 1 and the old batch 2) --------
    const mid = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "fieldMid" },
      id: "inv12-mb-mid",
      replicaId,
      hlc: { wall: 1500 },
      seq: 4,
    });
    mid.value = "mid";
    mid.validTo = null;
    await repo.ingest(cloneFact(mid));

    const thirdRun = await repo.regenerateHeads();
    // Four batches now: wall=1000, wall=1500 (new), wall=2000, wall=3000.
    expect(thirdRun.commits.length).toBe(4);
    // The FIRST batch (wall=1000) is untouched by a mid-sequence insertion at wall=1500, so it is
    // STILL reused verbatim, all the way from the very first run.
    expect(thirdRun.commits[0]).toBe(firstRun.commits[0]);
    // Every batch from the insertion point forward must be a FRESH commit (never a reused reference
    // from `secondRun`, since their tree/parent content have genuinely changed) — this is the
    // "recompute from that point forward" half of NFR-F5's incremental rule, for a change that is
    // NOT a tail append.
    expect(thirdRun.commits[1]).not.toBe(secondRun.commits[1]);
    expect(thirdRun.commits[2]).not.toBe(secondRun.commits[2]);
    // Parent chain integrity across all four commits.
    expect(thirdRun.commits[1].parent).toBe(thirdRun.commits[0].commitOid);
    expect(thirdRun.commits[2].parent).toBe(thirdRun.commits[1].commitOid);
    expect(thirdRun.commits[3].parent).toBe(thirdRun.commits[2].commitOid);
    // Every commit's own oid is the real git SHA of its own `commitBytes` — the commit chain is
    // genuinely linked, not merely four independent, incidentally-ordered commit objects.
    for (const c of thirdRun.commits) {
      expect(typeof c.commitOid).toBe("string");
      expect(c.commitOid.length).toBeGreaterThan(0);
    }
  });

  // -------------------------------------------------------------------------
  // ROUND 3 (D-27 FIX 1, CRITICAL) ADDITIVE COVERAGE — two independent round-2 adversarial critics
  // proved incremental-reuse output was NOT a pure function of the admitted set: it depended on
  // incremental call history. Root cause: `regenerateHeads()`'s blob tree-entry paths were zero-
  // padded to `String(sorted.length - 1).length` — the WHOLE content-fact count — recomputed fresh
  // on EVERY call, while `regenCache`'s incremental-reuse prefix-compare (`compareByContent`) only
  // re-checked each cached batch's own fact CONTENT, never whether the padding WIDTH itself had
  // shifted. Growing the admitted set across a zero-pad width boundary (9/10 facts, width 1 -> 11
  // facts, width 2) flipped EVERY earlier fact's blob path (`f9.json` -> `f09.json`) while the
  // reuse logic kept serving the OLD width-1 commits from cache — producing a commit chain whose
  // early commits are byte-DIFFERENT from what a fresh, cold regeneration of the IDENTICAL 11-fact
  // admitted set would produce, directly falsifying INV-12's "byte-identical regeneration of the
  // same admitted set" guarantee (and NFR-F5's "reuse ALL byte-identical prior commits" claim, since
  // the reused commits were provably not byte-identical to what current regeneration would produce).
  //
  // THE FIX (round 3): each tree entry is now named by the fact's OWN content-derived blob oid
  // (`f-<blobOid>.json`), never by its ordinal position among the whole content-fact count — so a
  // fact's tree-entry path is invariant to how many OTHER facts exist, permanently closing the
  // whole class of "width shifted underneath a reused cache entry" bug, not merely the one
  // 9/10->11 boundary this test happens to exercise.
  // -------------------------------------------------------------------------
  it("[round 3 / D-27 FIX 1, CRITICAL] regenerateHeads() called incrementally across the content-fact-count power-of-10 zero-pad boundary (growing 9 -> 10 -> 11 facts, one regenerateHeads() call after each growth step, so early batches get REUSED from `regenCache` across the boundary) produces a FINAL commit chain byte-IDENTICAL to a completely FRESH KipRepo's single cold regeneration of the same final 11-fact admitted set — proving incremental-reuse output is a pure function of the admitted SET, never of incremental call history", async () => {
    const eid = "person/inv12-width-fix";
    const replicaId = "author-width-fix";
    const incrementalRepo = new KipRepo({ replicaId: "storage-width-fix-incremental" });

    // Batch A (wall=1000): 9 author-HLC-contiguous facts (one node existence + 8 node-prop facts) —
    // sorted.length = 9 at this point, so ROUND 2's width = String(8).length = 1.
    const batchAFacts: Fact[] = [];
    const existence = makeWellFormedFact({
      target: { kind: "node", eid, nodeKind: "person" },
      id: "inv12-width-existence",
      replicaId,
      hlc: { wall: 1000 },
      seq: 0,
    });
    existence.value = true;
    existence.validTo = null;
    batchAFacts.push(existence);
    for (let i = 1; i <= 8; i += 1) {
      const f = makeWellFormedFact({
        target: { kind: "node-prop", eid, prop: `fieldA${i}` },
        id: `inv12-width-a${i}`,
        replicaId,
        hlc: { wall: 1000 },
        seq: i,
      });
      f.value = `a${i}`;
      f.validTo = null;
      batchAFacts.push(f);
    }
    for (const f of batchAFacts) {
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential ingest
      await incrementalRepo.ingest(cloneFact(f));
    }
    await incrementalRepo.regenerateHeads(); // sorted.length = 9, seeds `regenCache` at width 1.

    // Batch B (wall=2000): the 10th fact — sorted.length = 10, ROUND 2's width = String(9).length
    // is STILL 1 (no flip yet at exactly 10).
    const b1 = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "fieldB1" },
      id: "inv12-width-b1",
      replicaId,
      hlc: { wall: 2000 },
      seq: 9,
    });
    b1.value = "b1";
    b1.validTo = null;
    await incrementalRepo.ingest(cloneFact(b1));
    await incrementalRepo.regenerateHeads(); // sorted.length = 10, batch A REUSED from cache.

    // Batch C (wall=3000): the 11th fact — sorted.length = 11, ROUND 2's width flips to
    // String(10).length = 2. Under the round-2 bug, batches A and B would be served VERBATIM from
    // `regenCache` (their content is unchanged) still carrying their STALE width-1 tree paths,
    // diverging from what a cold regeneration of this exact final 11-fact set would produce.
    const c1 = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "fieldC1" },
      id: "inv12-width-c1",
      replicaId,
      hlc: { wall: 3000 },
      seq: 10,
    });
    c1.value = "c1";
    c1.validTo = null;
    await incrementalRepo.ingest(cloneFact(c1));
    const finalIncrementalRun = await incrementalRepo.regenerateHeads();
    expect(finalIncrementalRun.commits.length).toBe(3);

    // A COMPLETELY FRESH `KipRepo` — no `regenCache`, no incremental call history whatsoever —
    // ingesting the IDENTICAL final 11-fact admitted set in one shot, then a SINGLE cold
    // `regenerateHeads()` call. This is the ground truth INV-12 demands incremental reuse converge
    // to: "byte-identical regeneration of the same admitted set," independent of HOW that state was
    // reached.
    const freshRepo = new KipRepo({ replicaId: "storage-width-fix-fresh" });
    for (const f of [...batchAFacts, b1, c1]) {
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential ingest
      await freshRepo.ingest(cloneFact(f));
    }
    const freshRun = await freshRepo.regenerateHeads();

    // The core INV-12/NFR-F5 assertion this round's critics proved false: the incrementally-built
    // (partially cache-reused) chain must be BYTE-IDENTICAL, commit-for-commit, to the fresh cold
    // regeneration of the identical final admitted set — never merely "the same number of commits"
    // or "the same tip oid by coincidence."
    expect(finalIncrementalRun.commits.length).toBe(freshRun.commits.length);
    expect(finalIncrementalRun.commits.map((c) => c.commitOid)).toEqual(freshRun.commits.map((c) => c.commitOid));
    expect(finalIncrementalRun.commits.map((c) => c.commitBytes)).toEqual(freshRun.commits.map((c) => c.commitBytes));
    expect(finalIncrementalRun.commits.map((c) => c.parent)).toEqual(freshRun.commits.map((c) => c.parent));
    expect(finalIncrementalRun.commitOid).toBe(freshRun.commitOid);
    expect(finalIncrementalRun.commitBytes).toEqual(freshRun.commitBytes);
  });
});
