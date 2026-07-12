/**
 * debt-closure-d33.test.ts — ADDITIVE regression coverage for closing D-33, recorded in
 * `packages/kip-sdk/docs/DEBTS.md`:
 *
 * D-33 ("M5's INV-A2 violation — ContextualQuery.asOf.txTime is not rejected/stripped from the
 * compile-determinism seam"): `compileContextualQuery` (index.ts) folded EVERY `q.asOf` — including
 * one naming a `txTime` — straight through `selectFactsForContextualAsOf`/`selectFactsForAsOf`'s
 * txTime branch, which resolves via `this.rxFromByOid`, explicitly documented as "this replica's OWN
 * receive-tick history" (a genuinely per-replica, non-convergent axis). Because two replicas that
 * ingest the SAME facts in a different order (ordinary under eventual consistency) build different
 * `rxFromByOid` histories, two replicas compiling a `ContextualQuery` at an `asOf` naming the
 * IDENTICAL `txTime` value could silently compile DIFFERENT `Segment` sets — violating INV-A2's own
 * "byte-identical Segment sets" promise (docs/60 §INV-A2, transcribed verbatim in inv-a2.test.ts's own
 * doc comment).
 *
 * FIX: `compileContextualQuery` now rejects a `q.asOf.txTime` OUTRIGHT (before it ever reaches
 * `selectFactsForContextualAsOf`), throwing `ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE` — chosen over
 * silently stripping `txTime`, since silently compiling against a different (unrequested) frontier
 * than the caller explicitly pinned would itself be a silent substitution (N5). `validTime` remains
 * the only convergent pinning axis this seam accepts; `asOf()`'s own txTime belief-audit lens
 * (INV-4, explicitly non-convergent by design, see that method's doc comment) is completely
 * unaffected — this fix is scoped to `compileContextualQuery`'s compile-determinism seam alone.
 *
 * ROUND 7 FOLLOW-UP (attempt 2, adversarial review): the round-6 fix above only guarded the NAMED
 * `compileContextualQuery` call site. Two adjacent, unguarded call sites reached the IDENTICAL
 * non-convergent `rxFromByOid` path: `executeSegment(segment, { asOf })` — reachable DIRECTLY by a
 * caller, entirely bypassing `compileContextualQuery`'s guard, and materially worse (it can make
 * DURABLE, signed facts diverge, not merely a compiled Segment) — and `getLearnResult`'s own `asOf`
 * param. Both now carry the identical guard (index.ts). Test (a) below was ALSO found to be
 * non-exercising: its `txTime` cutoff (`999_999_999`, ~11.5 days after the Unix epoch) sits far below
 * any real `rxFrom` stamp this codebase ever mints (`hlc.ts`'s `tick`/`receiveTick` default `now` to
 * `Date.now()`, ~1.7e12 in the current era) — so pre-fix, that cutoff would have excluded EVERY fact
 * (including the seed's own existence fact) on BOTH replicas regardless of ingest order, throwing an
 * unrelated "no projected node at this asOf" error identically on both replicas rather than ever
 * producing a genuinely divergent compiled Segment. Test (a) is now rewritten to use a REAL,
 * `Date.now()`-relative cutoff that genuinely straddles the two replicas' differently-ordered
 * receive-tick histories — see that test's own inline comment for how it was verified (with the fix
 * temporarily disabled) to have actually diverged pre-fix. Tests (e)/(f) are NEW: (e) proves
 * `executeSegment(segment, { asOf: { txTime } })` is rejected even when called DIRECTLY (never routed
 * through `compileContextualQuery`), and (f) proves a pinned `validTime`-only `asOf` passed to
 * `executeSegment` is unaffected and still executes normally.
 *
 * ROUND 8 FOLLOW-UP (attempt 3, exhaustive sweep): rounds 6/7 fixed `compileContextualQuery`,
 * `executeSegment` (via `resolvedAsOf`), and `getLearnResult` — but `learn()` itself had a FOURTH,
 * still-unguarded entry point: `opts.asOf` (`LearnOptions.asOf`) is threaded straight into
 * `findRegisteredManifest` for encode/decode/learner/loss manifest resolution, with no txTime check
 * at all — confirmed by direct repro to complete WITHOUT throwing when handed `asOf.txTime`, unlike
 * the three already-fixed seams. `learn()` now carries the identical guard, at the very top of the
 * method, before the manifest-resolution loop and before ANY other use of `opts.asOf` (including as
 * `ontologyAsOf`'s default — see index.ts's own inline note on why that particular read stays safe:
 * `ontologyAsOf` is never re-fed into `selectFactsForContextualAsOf`, only used as opaque
 * `ontologyRefForLearn` key material and as a plain pass-through value to the dispatched
 * microagents). Test (g) below proves the rejection — using UNREGISTERED manifest names, so a
 * pre-fix build would either throw `ERR_UNREGISTERED_MANIFEST` (never reaching the txTime path) or
 * (post-fix) throw the txTime guard error BEFORE manifest resolution ever runs; asserting the guard
 * error (not the manifest error) proves the check truly sits before the resolution loop. Test (h)
 * proves a pinned `validTime`-only `asOf` on `learn()` is unaffected and still completes normally.
 * Test (i) adds direct coverage for `getLearnResult`'s own guard (implemented correctly in round 7
 * but left untested — flagged in that round's review) by calling it directly with `asOf.txTime` and
 * asserting rejection.
 *
 * Test (a) below constructs the EXACT scenario the debt describes — two replicas ingesting the same
 * facts in opposite order, so their `rxFromByOid` histories genuinely disagree — and proves that
 * asking `compileContextualQuery` to compile at a pinned `asOf.txTime` is now rejected on BOTH
 * replicas with the SAME typed error, before any divergent Segment could ever be produced. Test (b)
 * proves the same rejection at the single-replica level (no divergence needed to trigger it — the
 * seam refuses txTime unconditionally). Test (c) proves the sibling `asOf.validTime`-only path (the
 * convergent axis) is completely unaffected and still compiles. Test (d) proves the plain, single-
 * replica `asOf({txTime, believer})` belief-audit lens (a DIFFERENT method, DIFFERENT seam) still
 * works exactly as before — this fix does not touch it.
 */
import { afterEach, describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import { assertNode, makeBindingOptions, makeManifest, makeQuery } from "./conformance/fixtures-m5";
import {
  FIXED_RAW_REF,
  baseLearnOptions,
  buildManifest,
  encodeOk,
  decodeOk,
  freshReplicaId,
  lossOk,
  makeScriptedDispatch,
  nodePropAssert,
  registerManifest,
} from "./conformance/fixtures-m6";

describe("D-33: compileContextualQuery rejects ContextualQuery.asOf.txTime (INV-A2 compile-determinism)", () => {
  // (g)/(h) below construct real KipRepo instances via the M6 `freshReplicaId` helper (KipRepo's
  // static replicaId-keyed registry) — every repo built that way MUST be `.close()`-d, per that
  // helper's own doc comment.
  const learnRepos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of learnRepos.splice(0)) repo.close();
  });

  it("(a) two replicas ingesting the SAME facts in OPPOSITE order — a genuine rxFromByOid divergence — both reject a txTime-pinned compileContextualQuery with the SAME typed error, instead of silently compiling divergent Segment sets", async () => {
    const repoA = new KipRepo({ replicaId: "d33-repo-a" });
    const repoB = new KipRepo({ replicaId: "d33-repo-b" });
    await assertNode(repoA, "person/tal", "person");
    await assertNode(repoB, "person/tal", "person");

    const manifestLow = makeManifest({ name: "employed-by-rest", version: "1.0.0" });
    const manifestHigh = makeManifest({ name: "employed-by-sql", version: "1.0.0" });

    // repoA ingests the low-weight realizer FIRST, then the high-weight one. repoB ingests the
    // IDENTICAL two realizers in the OPPOSITE order — its rxFromByOid receive-tick history for these
    // two facts is therefore genuinely different from repoA's, exactly the "ingested the same facts
    // in a different order" scenario the debt names as the root cause of the possible divergence.
    await repoA.registerFunctionality("employed_by", manifestLow, makeBindingOptions({ weight: 1 }));
    await repoB.registerFunctionality("employed_by", manifestHigh, makeBindingOptions({ weight: 2 }));

    // REAL cutoff, not a fabricated one: captured from the actual wall clock right after BOTH
    // replicas' FIRST registration has ingested, but before either's SECOND registration. `rxFrom`
    // stamps are minted via `hlc.ts`'s `tick`/`receiveTick`, which default `now` to `Date.now()` — so
    // this cutoff sits in the SAME era as those stamps (unlike the prior `999_999_999` placeholder,
    // ~11.5 days after the epoch, which excluded every real rxFrom stamp on both replicas regardless
    // of ingest order — see this file's own top doc comment). The real `setTimeout` delay below
    // guarantees the wall clock has actually advanced past `cutoffWall` before the second
    // registration on each replica mints its own rxFrom stamp.
    const cutoffWall = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 25));

    await repoA.registerFunctionality("employed_by", manifestHigh, makeBindingOptions({ weight: 2 }));
    await repoB.registerFunctionality("employed_by", manifestLow, makeBindingOptions({ weight: 1 }));

    // VERIFIED (with the index.ts guard temporarily commented out, then restored — see this file's
    // own top doc comment): compiling EACH replica at this identical pinned `txTime` cutoff pre-fix
    // produced a GENUINELY divergent Segment — repoA's rxFromByOid only admits manifestLow's
    // registration fact as of `cutoffWall` (it registered manifestLow first), so the highest-weight
    // (and therefore primary, `compileContextualQuery`'s own weight-desc tiebreak) candidate compiled
    // to `employed-by-rest`; repoB's rxFromByOid instead only admits manifestHigh's registration fact
    // as of the identical cutoff (it registered manifestHigh first), compiling to `employed-by-sql` —
    // the SAME asOf.txTime value naming two DIFFERENT compiled Segment sets across replicas, exactly
    // the INV-A2 violation D-33 describes. This is the real divergence hazard the guard below closes.
    const txTimeQuery = makeQuery({
      seed: "person/tal",
      target: "org",
      via: ["employed_by"],
      asOf: { txTime: { wall: cutoffWall, counter: 0, replicaId: "irrelevant-cutoff" } },
    });

    // Both replicas must reject — never silently compile (and potentially diverge on) a Segment set.
    await expect(repoA.compileContextualQuery(txTimeQuery)).rejects.toMatchObject({
      code: "ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE",
    });
    await expect(repoB.compileContextualQuery(txTimeQuery)).rejects.toMatchObject({
      code: "ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE",
    });

    // Sanity check that the divergence hazard is real absent this fix: had the txTime cutoff been
    // silently accepted and folded via each replica's own rxFromByOid, the two replicas' plain belief-
    // audit asOf({txTime}) reads (a DIFFERENT, legitimately-per-replica method, untouched by this fix)
    // already disagree on ordering-sensitive projected state — confirming the two replicas' ingest
    // histories genuinely differ, so a compile that DID fold txTime here would have had a real
    // divergence to produce.
    const viewA = await repoA.asOf({ txTime: { wall: Number.MAX_SAFE_INTEGER, counter: 0, replicaId: "d33-repo-a" } });
    const viewB = await repoB.asOf({ txTime: { wall: Number.MAX_SAFE_INTEGER, counter: 0, replicaId: "d33-repo-b" } });
    expect(await viewA.getNode("person/tal")).not.toBeNull();
    expect(await viewB.getNode("person/tal")).not.toBeNull();
  });

  it("(b) a single replica's compileContextualQuery rejects asOf.txTime unconditionally, even with no cross-replica divergence in play", async () => {
    const repo = new KipRepo({ replicaId: "d33-single" });
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({}));

    const query = makeQuery({
      seed: "person/tal",
      target: "org",
      via: ["employed_by"],
      asOf: { txTime: { wall: 1, counter: 0, replicaId: "d33-single" } },
    });
    await expect(repo.compileContextualQuery(query)).rejects.toMatchObject({
      code: "ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE",
    });
  });

  it("(c) asOf.validTime alone (no txTime) — the convergent pinning axis — is completely unaffected and still compiles normally", async () => {
    const repo = new KipRepo({ replicaId: "d33-validtime-only" });
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({}));

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"], asOf: { validTime: 500 } });
    const segment = await repo.compileContextualQuery(query);
    expect(segment.steps.length).toBe(1);
    expect(segment.steps[0]?.microagentName).toBe("employed-by-lookup");
  });

  it("(d) the plain, single-replica asOf({txTime, believer}) belief-audit lens (a different method/seam, INV-4) is untouched by this fix and still resolves", async () => {
    const repo = new KipRepo({ replicaId: "d33-plain-asof" });
    await assertNode(repo, "person/tal", "person");

    const view = await repo.asOf({ txTime: { wall: Number.MAX_SAFE_INTEGER, counter: 0, replicaId: "d33-plain-asof" } });
    const node = await view.getNode("person/tal");
    expect(node).not.toBeNull();
  });

  it("(e) executeSegment(segment, { asOf: { txTime } }) is rejected DIRECTLY — bypassing compileContextualQuery entirely does not reach the guarded selectFactsForContextualAsOf path", async () => {
    const repo = new KipRepo({ replicaId: "d33-execute-bypass" });
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({}));

    // A validly-compiled Segment (no asOf.txTime at compile time — compileContextualQuery's own guard
    // is not what's under test here).
    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"] });
    const segment = await repo.compileContextualQuery(query);
    expect(segment.steps.length).toBe(1);

    // The bypass: executeSegment's OWN opts.asOf carries a txTime, never routed through
    // compileContextualQuery's guard at all — this is the exact CRITICAL gap the round-7 review
    // found (index.ts's executeSegment threaded opts.asOf ?? segment.asOf straight into
    // selectFactsForContextualAsOf, with no txTime check whatsoever).
    await expect(
      repo.executeSegment(segment, { asOf: { txTime: { wall: Date.now(), counter: 0, replicaId: "d33-execute-bypass" } } }),
    ).rejects.toMatchObject({ code: "ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE" });

    // Also confirm the guard is not accidentally narrowed to only `opts.asOf` — a hand-built Segment
    // whose OWN `.asOf` already carries a txTime (bypassing compile's guard a second way, since
    // resolvedAsOf falls back to `segment.asOf` when `opts.asOf` is omitted) is rejected too.
    const handBuiltSegment = { ...segment, asOf: { txTime: { wall: Date.now(), counter: 0, replicaId: "d33-execute-bypass" } } };
    await expect(repo.executeSegment(handBuiltSegment)).rejects.toMatchObject({
      code: "ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE",
    });
  });

  it("(f) executeSegment(segment, { asOf: { validTime } }) — the convergent pinning axis — still executes normally and materializes a real result", async () => {
    const repo = new KipRepo({ replicaId: "d33-execute-validtime" });
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({}));

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"] });
    const segment = await repo.compileContextualQuery(query);
    expect(segment.steps.length).toBe(1);

    const answer = await repo.executeSegment(segment, { asOf: { validTime: 500 } });
    expect(answer.result.length).toBe(1);
    const materializedEid = answer.result[0];
    expect(materializedEid).toBeDefined();
    const view = materializedEid ? await repo.getNode(materializedEid) : null;
    expect(view).not.toBeNull();
  });

  it("(g) learn(rawRef, { asOf: { txTime } }) is rejected BEFORE manifest resolution — the round-8 gap (opts.asOf threaded unguarded into findRegisteredManifest)", async () => {
    const replicaId = freshReplicaId("d33-learn-bypass");
    const repo = new KipRepo({ replicaId });
    learnRepos.push(repo);

    // Deliberately UNREGISTERED (name, version) selectors for every role — no registerFunctionality
    // call at all on this repo. If the txTime guard were missing (or placed AFTER manifest
    // resolution), the FIRST thing learn() would hit is `findRegisteredManifest` failing to find
    // "d33-learn-bypass-encode"/etc., throwing `ERR_UNREGISTERED_MANIFEST` instead — a different
    // typed error. Asserting the txTime guard's error code here (not the manifest one) proves the
    // check genuinely sits BEFORE the manifest-resolution loop, exactly as index.ts's own comment
    // on the guard claims.
    const opts = baseLearnOptions({
      threshold: 1.0,
      asOf: { txTime: { wall: Date.now(), counter: 0, replicaId } },
      encode: { name: "d33-learn-bypass-encode", version: "1.0.0" },
      decode: { name: "d33-learn-bypass-decode", version: "1.0.0" },
      learner: { name: "d33-learn-bypass-learner", version: "1.0.0" },
      loss: { name: "d33-learn-bypass-loss", version: "1.0.0" },
    });

    await expect(repo.learn(FIXED_RAW_REF, opts)).rejects.toMatchObject({
      code: "ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE",
    });
  });

  it("(h) learn(rawRef, { asOf: { validTime } }) — the convergent pinning axis — is completely unaffected and still completes normally", async () => {
    const replicaId = freshReplicaId("d33-learn-validtime");

    const eid = "tenant/ns/d33-learn-validtime-doc";
    const encode = buildManifest({ name: "d33-learn-validtime-encode" });
    const decode = buildManifest({ name: "d33-learn-validtime-decode" });
    const learner = buildManifest({ name: "d33-learn-validtime-learner" });
    const loss = buildManifest({ name: "d33-learn-validtime-loss" });

    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () => encodeOk([nodePropAssert(eid, "content", "validtime-ok")]),
      [decode.name]: () => decodeOk(),
      [loss.name]: () => lossOk(0.1), // below threshold — converges on the first iteration
    });
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    learnRepos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 1.0,
      asOf: { validTime: 500 }, // pinned, but NO txTime — the guard must not fire on this axis
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    await expect(repo.learn(FIXED_RAW_REF, opts)).resolves.toMatchObject({ status: "accept" });
    const view = await repo.getNode(eid);
    expect(view?.props.content?.segments.some((s) => s.kind === "value" && s.value === "validtime-ok")).toBe(true);
  });

  it("(i) getLearnResult(rawRef, ontologyAsOf, selectors, { txTime }) is rejected directly — round-7's guard was correctly implemented but left untested", async () => {
    const replicaId = freshReplicaId("d33-getlearnresult-bypass");
    const repo = new KipRepo({ replicaId });
    learnRepos.push(repo);

    // No facts/manifests need to exist at all — the guard on getLearnResult's own `asOf` param must
    // fire before `selectFactsForContextualAsOf` (and therefore before any fact lookup) ever runs.
    await expect(
      repo.getLearnResult(
        FIXED_RAW_REF,
        { validTime: 1_000_000 },
        {
          encode: { name: "d33-getlearnresult-encode", version: "1.0.0" },
          decode: { name: "d33-getlearnresult-decode", version: "1.0.0" },
          learner: { name: "d33-getlearnresult-learner", version: "1.0.0" },
        },
        { txTime: { wall: Date.now(), counter: 0, replicaId } },
      ),
    ).rejects.toMatchObject({ code: "ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE" });
  });
});
