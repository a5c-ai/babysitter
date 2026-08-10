/**
 * FROZEN acceptance tests for the model-assisted Layer-2 entity resolver (ADR-B12 / B12a / B12b / B12c,
 * packages/kip-sdk/docs/70-decision-records-adr.md) — the `layer2-resolver` work item.
 *
 * WHAT IT IS. Layer 1 (ADR-B11/B11a) is deterministic and high-precision but (a) still false-merges true
 * HOMONYMS and (b) misses lexically-disjoint same entities. Layer 2 adds a model in the loop WITHOUT
 * weakening Layer 1's trust guarantees. It ships as a `kip-resolver` acquisition microagent + a `kip
 * resolve` CLI: the CLI does ALL deterministic reads (a hard-BOUNDED candidate-PAIR set from `nodeEids`
 * + `recall`, ADR-B12b); the microagent adjudicates ONLY those pairs, returning a strict per-pair verdict
 * `{ decision, linkKind?, confidence?, rationale }` (ADR-B12c); and `runAcquisition` commits the result.
 * THE ASYMMETRY IS THE ENTIRE DESIGN:
 *   - a confident `same`     → a QUARANTINED `kip:same_as?` candidate edge NO read consults for identity
 *                              (proj's union-find folds ONLY `edgeKind==="same_as"`) — surfaced (N5),
 *                              reversible, but NEVER a merge on a model guess (the crux, ADR-B12a);
 *   - a confident `not-same` → a signed, trusted `not_same_as` veto (surfaces `kip:conflict`, D-63);
 *   - uncertain / sub-min-confidence / failed / malformed → ABSTAIN (author nothing, N5).
 * CONFIRM promotes a candidate to a real `same_as` (now the nodes DO merge); REJECT authors a
 * `not_same_as` and/or retracts. The live model path is opt-in behind `KIP_RESOLVE_LIVE`.
 *
 * FROZEN — authored STRICTLY from the ADR, NOT from any implementation. This round `resolveCandidates`
 * authors nothing, `generateResolverCandidatePairs`/`resolveList` return `[]`, and
 * `resolveConfirm`/`resolveReject` reject — so every acceptance assertion below FAILS on its own diff (a
 * resolver that authors no `kip:same_as?`/`not_same_as` link where one is required; a generator that
 * yields no bounded pairs; a confirm/reject that is not wired; a live gate that never enables), never on
 * a type/import error. A fully-deterministic SCRIPTED verdict dispatch is injected — NO live model.
 */
import { afterEach, describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import type { AsOf, DispatchMicroagentFn, EID, MicroagentInvocation, PropCell, PropValue } from "../index";
import { KIP_CONFLICT_KIND } from "../proj";
import {
  DEFAULT_RESOLVE_MIN_CONFIDENCE,
  KIP_SAME_AS_CANDIDATE_KIND,
  NOT_SAME_AS_EDGE_KIND,
  generateResolverCandidatePairs,
  makeResolverDispatch,
  notSameAsEid,
  resolveConfirm,
  resolveList,
  resolveReject,
  resolveResolveLiveGate,
  sameAsCandidateEid,
  type CandidatePair,
  type ResolverAdjudicator,
  type ResolverHarnessProbe,
  type ResolverVerdict,
} from "../linker/entity-resolver";
import {
  FIXED_AS_OF,
  freshReplicaId,
  registerAcquisitionManifest,
  seedEdge,
  seedNode,
  seedProp,
} from "./conformance/fixtures-m7";

const RESOLVER_MANIFEST = "kip-resolver";

// --- scripted (deterministic, no-live-model) verdict dispatch -----------------------------------

/** A stable unordered key for a pair (so a `(a,b)` verdict is found for a `(b,a)` lookup too). */
function pairKey(a: EID, b: EID): string {
  return a < b ? `${a} ${b}` : `${b} ${a}`;
}

/** Builds a scripted `ResolverAdjudicator` from a fixed `{pairKey → verdict}` map. A pair with no
 *  scripted verdict returns `null` (a failed/timed-out per-pair dispatch ⇒ ABSTAIN, ADR-B12c). */
function scriptedAdjudicator(verdicts: Record<string, ResolverVerdict | null>): ResolverAdjudicator {
  return (pair: CandidatePair) => verdicts[pairKey(pair.a, pair.b)] ?? null;
}

/** The covering scalar value of a projected prop cell (the `"value"` segment), or `undefined`. */
function coveringValue(cell?: PropCell): PropValue | undefined {
  if (!cell) return undefined;
  const seg = cell.segments.find((s) => s.kind === "value");
  return seg && seg.kind === "value" ? seg.value : undefined;
}

describe("layer2-resolver", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  /** A resolver repo wired with a scripted verdict dispatch (never a live model) + a registered
   *  `kip-resolver` acquisition manifest. Returns the invocation log so INV-A1 can be asserted. */
  async function resolverRepo(
    label: string,
    adjudicate: ResolverAdjudicator,
    opts?: { minConfidence?: number },
  ): Promise<{
    repo: KipRepo;
    manifest: import("../index").MicroagentManifest;
    invocations: MicroagentInvocation[];
  }> {
    const invocations: MicroagentInvocation[] = [];
    const base = makeResolverDispatch(adjudicate, opts);
    const dispatch: DispatchMicroagentFn = (invocation) => {
      invocations.push(invocation);
      return base(invocation);
    };
    const repo = new KipRepo({ replicaId: freshReplicaId(label), dispatchMicroagent: dispatch });
    repos.push(repo);
    const manifest = await registerAcquisitionManifest(repo, RESOLVER_MANIFEST);
    return { repo, manifest, invocations };
  }

  const runPairs = (
    repo: KipRepo,
    manifest: import("../index").MicroagentManifest,
    pairs: CandidatePair[],
    asOf: AsOf = FIXED_AS_OF,
  ): Promise<{ facts: import("../index").FactId[] }> => repo.runAcquisition(manifest, { pairs }, { asOf });

  // ==============================================================================================
  // (1) QUARANTINED AUTHORING — the crux (ADR-B12a).
  // ==============================================================================================
  describe("(1) quarantined authoring — a confident `same` authors a `kip:same_as?` edge that does NOT merge", () => {
    it("authors a signed `kip:same_as?` candidate edge yet leaves both nodes UNMERGED (proj's union-find folds only `same_as`)", async () => {
      const a = "t/ns/aaa";
      const b = "t/ns/bbb"; // a < b — the candidate eid orders (from=a, to=b)
      const { repo, manifest } = await resolverRepo(
        "quarantine",
        scriptedAdjudicator({ [pairKey(a, b)]: { decision: "same", confidence: 0.95, rationale: "same slug + neighborhood" } }),
      );
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");

      await runPairs(repo, manifest, [{ a, b }]);

      // (a) THE CANDIDATE EDGE exists, is orchestrator-SIGNED, and carries the dedicated kind.
      const candEid = sameAsCandidateEid(a, b);
      const edge = await repo.getEdge(candEid);
      expect(edge, "a `kip:same_as?` candidate edge a=>b").not.toBeNull();
      expect(edge!.kind).toBe(KIP_SAME_AS_CANDIDATE_KIND);
      expect(edge!.provenance.signature).toBeTruthy();
      expect(await repo.edgeExistenceFactId(candEid)).not.toBeNull();

      // (b) THE CRUX — the two nodes stay UNMERGED: a `kip:same_as?` edge is NOT folded by proj's
      //     identity-merge union-find (which folds ONLY `edgeKind==="same_as"`).
      expect((await repo.getNode(a))?.eid).toBe(a);
      expect((await repo.getNode(b))?.eid).toBe(b);
      expect((await repo.getNode(a))?.kind).not.toBe(KIP_CONFLICT_KIND);
      // The candidate edge does NOT win a trusted identity read (no equivalence-class collapse).
      expect(await repo.sameAsClass(a)).toEqual([a]);
      expect(await repo.sameAsClass(b)).toEqual([b]);
    });

    it("folds a re-proposed candidate onto the SAME content-derived eid (idempotence, no second edge)", async () => {
      const a = "t/ns/idem-a";
      const b = "t/ns/idem-b";
      const { repo, manifest } = await resolverRepo(
        "quarantine-idem",
        scriptedAdjudicator({ [pairKey(a, b)]: { decision: "same", confidence: 0.9, rationale: "r" } }),
      );
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");
      const candEid = sameAsCandidateEid(a, b);

      const first = await runPairs(repo, manifest, [{ a, b }]);
      expect(first.facts.length, "the first run authors the candidate").toBeGreaterThanOrEqual(1);
      const firstFactId = await repo.edgeExistenceFactId(candEid);
      expect(firstFactId).not.toBeNull();

      await runPairs(repo, manifest, [{ a, b }]);
      // A byte-identical re-proposal folds onto the SAME cell — still exactly one existence fact.
      expect(await repo.edgeExistenceFactId(candEid)).toBe(firstFactId);
      expect((await repo.getNode(a))?.eid).toBe(a); // still unmerged.
    });
  });

  // ==============================================================================================
  // (2) TRUSTED-READ ISOLATION — a quarantined link never pollutes a trusted read (with contrast).
  // ==============================================================================================
  describe("(2) trusted-read isolation — a `kip:same_as?` edge is invisible to identity reads, but a REAL `same_as` WOULD merge", () => {
    it("a quarantined candidate leaves getNode/sameAsClass unmerged, whereas a real same_as on the same shape DOES merge", async () => {
      const a = "t/ns/iso-a";
      const b = "t/ns/iso-b";
      const { repo, manifest } = await resolverRepo(
        "isolation",
        scriptedAdjudicator({ [pairKey(a, b)]: { decision: "same", confidence: 0.93, rationale: "r" } }),
      );
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");
      await runPairs(repo, manifest, [{ a, b }]);

      // The candidate edge MUST exist (fails now) …
      expect(await repo.edgeExistenceFactId(sameAsCandidateEid(a, b))).not.toBeNull();
      // … yet a trusted read returns the UNMERGED nodes: no canonical collapse, no conflict.
      expect((await repo.getNode(a))?.eid).toBe(a);
      expect((await repo.getNode(b))?.eid).toBe(b);
      expect((await repo.getNode(a))?.kind).not.toBe(KIP_CONFLICT_KIND);
      expect(await repo.sameAsClass(a)).toEqual([a]);

      // CONTRAST (control) — a REAL `same_as` on a DISTINCT pair DOES merge, proving the isolation
      // above is meaningful (the only difference is the edge KIND).
      const c = "t/ns/iso-c";
      const d = "t/ns/iso-d";
      await seedNode(repo, c, "concept");
      await seedNode(repo, d, "concept");
      await seedEdge(repo, c, d, "same_as");
      expect((await repo.getNode(c))?.eid).toBe((await repo.getNode(d))?.eid); // merged to one canonical.
      expect(await repo.sameAsClass(c)).toEqual([c, d].sort());
    });
  });

  // ==============================================================================================
  // (3) NOT-SAME VETO (D-63) — a confident `not-same` vetoes a Layer-1 merge, surfaced not silent.
  // ==============================================================================================
  describe("(3) not-same veto (D-63) — a confident `not-same` authors `not_same_as`, surfacing `kip:conflict`", () => {
    it("vetoes a Layer-1 same_as(a,b) so getNode(a)/getNode(b) surface kip:conflict; the veto fact is reversible", async () => {
      const a = "t/ns/veto-a";
      const b = "t/ns/veto-b";
      const { repo, manifest } = await resolverRepo(
        "veto",
        scriptedAdjudicator({ [pairKey(a, b)]: { decision: "not-same", confidence: 0.97, rationale: "distinct entities sharing a name" } }),
      );
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");
      // A deterministic Layer-1 strong-name collision already merged the true homonym.
      await seedEdge(repo, a, b, "same_as");
      expect((await repo.getNode(a))?.kind).not.toBe(KIP_CONFLICT_KIND); // precondition: merged, not disputed.

      await runPairs(repo, manifest, [{ a, b }]);

      // The veto edge exists (fails now) and the merge is SURFACED as a conflict, never silently kept.
      const nsEid = notSameAsEid(a, b);
      expect(await repo.edgeExistenceFactId(nsEid)).not.toBeNull();
      expect((await repo.getNode(a))?.kind).toBe(KIP_CONFLICT_KIND);
      expect((await repo.getNode(b))?.kind).toBe(KIP_CONFLICT_KIND);

      // Reversible/contradictable at the WRITE-channel level (Layer-1's guarantee, ADR-B12a): retracting
      // the signed `not_same_as` removes it as a durable fact.
      await repo.retractFact({
        type: "retract",
        v: 1,
        target: { kind: "edge", eid: nsEid, edgeKind: NOT_SAME_AS_EDGE_KIND, from: a, to: b },
        validFrom: 0,
        validTo: null,
        replicaId: "operator-reverse",
        provenance: { author: "operator", signature: "", publicKeyFingerprint: "", signedFields: [] },
      });
      expect(await repo.edgeExistenceFactId(nsEid)).toBeNull();
    });
  });

  // ==============================================================================================
  // (4) N5 ABSTAIN — uncertain / sub-threshold / failed / malformed author ZERO facts.
  // ==============================================================================================
  describe("(4) N5 abstain — everything but a confident same/not-same authors ZERO facts", () => {
    it("authors ONLY the confident `same` pair; uncertain / sub-min-confidence / failed / malformed each abstain", async () => {
      const mk = (s: string): [EID, EID] => [`t/ns/${s}-a`, `t/ns/${s}-b`];
      const [oa, ob] = mk("ok"); // confident same — the POSITIVE control (must author).
      const [ua, ub] = mk("unc"); // uncertain.
      const [la, lb] = mk("low"); // same but sub-min-confidence.
      const [fa, fb] = mk("fail"); // failed/timed-out per-pair dispatch (adjudicator → null).
      const [ma, mb] = mk("mal"); // malformed verdict (missing `rationale`).
      const [da, db] = mk("dec"); // malformed verdict (decision not in the schema).

      const { repo, manifest } = await resolverRepo(
        "abstain",
        scriptedAdjudicator({
          [pairKey(oa, ob)]: { decision: "same", confidence: 0.95, rationale: "confident" },
          [pairKey(ua, ub)]: { decision: "uncertain", confidence: 0.99, rationale: "cannot tell" },
          [pairKey(la, lb)]: { decision: "same", confidence: 0.5, rationale: "weak" },
          [pairKey(fa, fb)]: null, // simulated failed dispatch.
          [pairKey(ma, mb)]: { decision: "same", confidence: 0.99 } as unknown as ResolverVerdict,
          [pairKey(da, db)]: { decision: "banana", confidence: 0.99, rationale: "x" } as unknown as ResolverVerdict,
        }),
      );
      for (const [x, y] of [mk("ok"), mk("unc"), mk("low"), mk("fail"), mk("mal"), mk("dec")]) {
        await seedNode(repo, x, "concept");
        await seedNode(repo, y, "concept");
      }

      await runPairs(repo, manifest, [
        { a: oa, b: ob },
        { a: ua, b: ub },
        { a: la, b: lb },
        { a: fa, b: fb },
        { a: ma, b: mb },
        { a: da, b: db },
      ]);

      // The confident-same pair authored a candidate (fails now).
      expect(await repo.edgeExistenceFactId(sameAsCandidateEid(oa, ob))).not.toBeNull();
      // EVERY abstain pair authored NOTHING — no `kip:same_as?`, no `not_same_as`, no fabricated rationale.
      for (const [x, y] of [[ua, ub], [la, lb], [fa, fb], [ma, mb], [da, db]] as Array<[EID, EID]>) {
        expect(await repo.edgeExistenceFactId(sameAsCandidateEid(x, y)), `no candidate for ${x}`).toBeNull();
        expect(await repo.edgeExistenceFactId(notSameAsEid(x, y)), `no veto for ${x}`).toBeNull();
        expect((await repo.getNode(x))?.eid).toBe(x); // unmerged.
        expect((await repo.getNode(x))?.kind).not.toBe(KIP_CONFLICT_KIND); // not disputed.
      }
    });

    it("a whole-dispatch failure (non-zero exit) fabricates NO link — runAcquisition fails loudly (N5)", async () => {
      const a = "t/ns/hardfail-a";
      const b = "t/ns/hardfail-b";
      // A dispatch that hard-fails (the model spawn itself failed) — never a best-effort accept.
      const failing: DispatchMicroagentFn = () => Promise.resolve({ exitCode: 1, output: { error: "model spawn failed" }, elapsedMs: 0 });
      const repo = new KipRepo({ replicaId: freshReplicaId("hardfail"), dispatchMicroagent: failing });
      repos.push(repo);
      const manifest = await registerAcquisitionManifest(repo, RESOLVER_MANIFEST);
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");

      await expect(repo.runAcquisition(manifest, { pairs: [{ a, b }] }, { asOf: FIXED_AS_OF })).rejects.toThrow();
      // Nothing was authored on the failed path.
      expect(await repo.edgeExistenceFactId(sameAsCandidateEid(a, b))).toBeNull();
      expect(await repo.edgeExistenceFactId(notSameAsEid(a, b))).toBeNull();
    });
  });

  // ==============================================================================================
  // (5) BOUNDED, DETERMINISTIC CANDIDATE-PAIR GENERATION (ADR-B12b).
  // ==============================================================================================
  describe("(5) bounded, deterministic candidate generation — caps hold, no O(n²), stable, skips linked pairs", () => {
    const N = 12;
    const BLOB = "d".repeat(40);
    const genEid = (i: number): EID => `doc:${BLOB}#concept-${i}`;

    async function seedSimilarCorpus(repo: KipRepo, order: number[]): Promise<void> {
      // Every node shares a lexical surface so a correct lexical-recall generator connects them; the
      // caps (not the graph sparsity) are what must bound the pair set.
      for (const i of order) {
        await seedNode(repo, genEid(i), "concept");
        await seedProp(repo, genEid(i), "name", `Shared Ledger Concept ${i}`);
        await seedProp(repo, genEid(i), "content", "shared ledger reconciliation concept alpha beta gamma");
      }
    }

    it("caps per-node ≤ topK and total ≤ maxPairs (NOT O(n²)), dedupes unordered pairs, and is a pure function of the fact set", async () => {
      const repo = new KipRepo({ replicaId: freshReplicaId("gen") });
      repos.push(repo);
      const order = Array.from({ length: N }, (_, i) => i);
      await seedSimilarCorpus(repo, order);

      const topK = 3;
      const maxPairs = 10;
      const pairs = await generateResolverCandidatePairs(repo, { topK, maxPairs, prefixes: ["doc:", "code:"] });

      // Non-empty on a fully-similar corpus (fails now against the empty stub).
      expect(pairs.length).toBeGreaterThan(0);
      // The TOTAL cap holds — and is far below the O(n²) all-pairs count (N*(N-1)/2 = 66).
      const allPairs = (N * (N - 1)) / 2;
      expect(pairs.length).toBeLessThanOrEqual(maxPairs);
      expect(maxPairs).toBeLessThan(allPairs);
      // The PER-NODE cap holds.
      const degree = new Map<EID, number>();
      for (const p of pairs) {
        expect(p.a).not.toBe(p.b);
        degree.set(p.a, (degree.get(p.a) ?? 0) + 1);
        degree.set(p.b, (degree.get(p.b) ?? 0) + 1);
      }
      for (const [eid, d] of degree) expect(d, `degree of ${eid}`).toBeLessThanOrEqual(topK);
      // Unordered pairs are deduped (never both (a,b) and (b,a)).
      const keys = pairs.map((p) => pairKey(p.a, p.b));
      expect(new Set(keys).size).toBe(keys.length);
      // Deterministic across two calls on the same fact set (same pairs + same order).
      const again = await generateResolverCandidatePairs(repo, { topK, maxPairs, prefixes: ["doc:", "code:"] });
      expect(again).toEqual(pairs);
    });

    it("is stable across a fact-set permutation (same graph → same pair set), regardless of insertion order", async () => {
      const forward = new KipRepo({ replicaId: freshReplicaId("gen-fwd") });
      const reverse = new KipRepo({ replicaId: freshReplicaId("gen-rev") });
      repos.push(forward, reverse);
      await seedSimilarCorpus(forward, Array.from({ length: N }, (_, i) => i));
      await seedSimilarCorpus(reverse, Array.from({ length: N }, (_, i) => N - 1 - i));

      const opts = { topK: 3, maxPairs: 10, prefixes: ["doc:", "code:"] };
      const pf = await generateResolverCandidatePairs(forward, opts);
      const pr = await generateResolverCandidatePairs(reverse, opts);
      expect(pf.length).toBeGreaterThan(0); // fails now.
      const sortedKeys = (ps: CandidatePair[]): string[] => ps.map((p) => pairKey(p.a, p.b)).sort();
      expect(sortedKeys(pr)).toEqual(sortedKeys(pf));
    });

    it("skips a pair already carrying a same_as / not_same_as / kip:same_as? edge (never re-adjudicated)", async () => {
      const repo = new KipRepo({ replicaId: freshReplicaId("gen-skip") });
      repos.push(repo);
      await seedSimilarCorpus(repo, Array.from({ length: N }, (_, i) => i));
      // Three already-decided pairs among the corpus.
      await seedEdge(repo, genEid(0), genEid(1), "same_as");
      await seedEdge(repo, genEid(2), genEid(3), "not_same_as");
      await seedEdge(repo, genEid(4), genEid(5), KIP_SAME_AS_CANDIDATE_KIND);

      const pairs = await generateResolverCandidatePairs(repo, { topK: 5, maxPairs: 50, prefixes: ["doc:", "code:"] });
      expect(pairs.length).toBeGreaterThan(0); // fails now.
      const keys = new Set(pairs.map((p) => pairKey(p.a, p.b)));
      expect(keys.has(pairKey(genEid(0), genEid(1))), "same_as pair excluded").toBe(false);
      expect(keys.has(pairKey(genEid(2), genEid(3))), "not_same_as pair excluded").toBe(false);
      expect(keys.has(pairKey(genEid(4), genEid(5))), "kip:same_as? pair excluded").toBe(false);
    });
  });

  // ==============================================================================================
  // (6) CONFIRM / REJECT — the operator lifecycle transitions.
  // ==============================================================================================
  describe("(6) confirm / reject — promote a candidate to a real merge, or veto + retract it", () => {
    it("confirm promotes a `kip:same_as?` candidate to a real `same_as` (now the nodes DO merge)", async () => {
      const a = "t/ns/confirm-a";
      const b = "t/ns/confirm-b";
      const { repo, manifest } = await resolverRepo(
        "confirm",
        scriptedAdjudicator({ [pairKey(a, b)]: { decision: "same", confidence: 0.95, rationale: "r" } }),
      );
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");
      await runPairs(repo, manifest, [{ a, b }]); // outstanding candidate (future: authored).
      expect((await repo.getNode(a))?.eid).toBe(a); // BEFORE confirm: unmerged.

      await resolveConfirm(repo, manifest, a, b, { asOf: FIXED_AS_OF }); // FAILS NOW (throws).

      // AFTER confirm: a real `same_as` folds the class — getNode canonical, sameAsClass unions them.
      const canonA = (await repo.getNode(a))?.eid;
      const canonB = (await repo.getNode(b))?.eid;
      expect(canonA).toBe(canonB);
      expect((await repo.getNode(a))?.kind).not.toBe(KIP_CONFLICT_KIND);
      expect(await repo.sameAsClass(a)).toEqual([a, b].sort());
    });

    it("reject authors a `not_same_as` (surfacing kip:conflict against a Layer-1 same_as) and retracts the candidate", async () => {
      const a = "t/ns/reject-a";
      const b = "t/ns/reject-b";
      const { repo, manifest } = await resolverRepo(
        "reject",
        scriptedAdjudicator({ [pairKey(a, b)]: { decision: "same", confidence: 0.9, rationale: "r" } }),
      );
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");
      await seedEdge(repo, a, b, "same_as"); // a Layer-1 merge the operator now disputes.
      await runPairs(repo, manifest, [{ a, b }]); // an outstanding candidate too.

      await resolveReject(repo, manifest, a, b, { asOf: FIXED_AS_OF }); // FAILS NOW (throws).

      // The veto surfaced the disputed merge …
      expect(await repo.edgeExistenceFactId(notSameAsEid(a, b))).not.toBeNull();
      expect((await repo.getNode(a))?.kind).toBe(KIP_CONFLICT_KIND);
      // … and the outstanding candidate edge is retracted.
      expect(await repo.edgeExistenceFactId(sameAsCandidateEid(a, b))).toBeNull();
    });

    it("resolve list surfaces outstanding `kip:same_as?` candidates for operator review", async () => {
      const a = "t/ns/list-a";
      const b = "t/ns/list-b";
      const { repo, manifest } = await resolverRepo(
        "list",
        scriptedAdjudicator({ [pairKey(a, b)]: { decision: "same", confidence: 0.88, rationale: "r" } }),
      );
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");
      await runPairs(repo, manifest, [{ a, b }]);

      const outstanding = await resolveList(repo, { asOf: FIXED_AS_OF });
      expect(outstanding.length, "one outstanding candidate").toBeGreaterThanOrEqual(1); // fails now.
      expect(outstanding.some((c) => c.eid === sameAsCandidateEid(a, b))).toBe(true);
    });
  });

  // ==============================================================================================
  // (7) INV-A1 — the microagent receives only a MicroagentInvocation; links appear only via
  //     runAcquisition; rationale is audit-only; no link outside the deterministic candidate set.
  // ==============================================================================================
  describe("(7) INV-A1 — the microagent authors nothing; the rationale is audit-only, never load-bearing", () => {
    it("dispatches a MicroagentInvocation (never a Repo), stores the rationale as an edge prop, and authors NO link outside the input pair set", async () => {
      const a = "t/ns/inva1-a";
      const b = "t/ns/inva1-b";
      const ghostA = "t/ns/ghost-a"; // the adjudicator ALSO has a verdict for a pair NOT in input.pairs …
      const ghostB = "t/ns/ghost-b";
      const { repo, manifest, invocations } = await resolverRepo(
        "inva1",
        scriptedAdjudicator({
          [pairKey(a, b)]: { decision: "same", confidence: 0.96, rationale: "audit rationale text" },
          [pairKey(ghostA, ghostB)]: { decision: "same", confidence: 0.99, rationale: "should never be authored" },
        }),
      );
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");
      await seedNode(repo, ghostA, "concept");
      await seedNode(repo, ghostB, "concept");

      await runPairs(repo, manifest, [{ a, b }]); // ONLY (a,b) is in the deterministic candidate set.

      // The dispatch received a plain MicroagentInvocation — no Repo / no graph write handle.
      expect(invocations.length).toBe(1);
      const inv = invocations[0]!;
      expect(inv).not.toHaveProperty("repo");
      expect(inv).not.toHaveProperty("getNode");
      expect((inv.input as { pairs?: unknown }).pairs).toEqual([{ a, b }]);

      // The link was authored (fails now) — and the rationale rides along as an audit-only edge PROP.
      const edge = await repo.getEdge(sameAsCandidateEid(a, b));
      expect(edge).not.toBeNull();
      expect(coveringValue(edge!.props.rationale)).toBe("audit rationale text");

      // NO link is authored for the ghost pair the CLI never generated (the model cannot widen the set).
      expect(await repo.edgeExistenceFactId(sameAsCandidateEid(ghostA, ghostB))).toBeNull();
      expect((await repo.getNode(ghostA))?.eid).toBe(ghostA);
    });
  });

  // ==============================================================================================
  // (8) ACCELERATOR BOUNDARY — confidence never influences orderKey / reducers / proj byte-identity.
  // ==============================================================================================
  describe("(8) accelerator boundary — a verdict/confidence is a search signal, never a proj order/reducer input", () => {
    it("two writes on the same candidate resolve by author-HLC orderKey, NOT by confidence magnitude", async () => {
      const a = "t/ns/accel-a";
      const b = "t/ns/accel-b";
      // Call 1 = HIGHER confidence but EARLIER HLC; call 2 = LOWER (still ≥ threshold) but LATER HLC.
      let call = 0;
      const adjudicate: ResolverAdjudicator = (pair) => {
        if (pairKey(pair.a, pair.b) !== pairKey(a, b)) return null;
        call += 1;
        return call === 1
          ? { decision: "same", confidence: 0.99, rationale: "r-early" }
          : { decision: "same", confidence: 0.86, rationale: "r-late" };
      };
      const { repo, manifest } = await resolverRepo("accel", adjudicate);
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");

      await runPairs(repo, manifest, [{ a, b }]); // confidence 0.99 (earlier HLC)
      await runPairs(repo, manifest, [{ a, b }]); // confidence 0.86 (later HLC)

      const candEid = sameAsCandidateEid(a, b);
      const edge = await repo.getEdge(candEid);
      expect(edge, "the single content-addressed candidate cell").not.toBeNull();
      // The winner is the LATER-HLC write (lww-hlc), NOT the numerically-higher confidence — proving
      // confidence is an ordinary value cell, never a max-reducer / orderKey input (byte-identity is
      // determined by author-HLC alone).
      expect(coveringValue(edge!.props.confidence)).toBe(0.86);
      expect(coveringValue(edge!.props.rationale)).toBe("r-late");
      // Still exactly one candidate edge (the eid is content-derived, independent of confidence).
      expect((await repo.getNode(a))?.eid).toBe(a);
    });
  });

  // ==============================================================================================
  // (9) OPT-IN — the default path spawns nothing; the live gate enables only behind KIP_RESOLVE_LIVE.
  // ==============================================================================================
  describe("(9) opt-in — no model runs unless KIP_RESOLVE_LIVE is set; an unavailable model fails loudly", () => {
    it("the gate is OFF by default and does NOT consult the probe (the default test run spawns nothing)", () => {
      let probed = 0;
      const probe = (): ResolverHarnessProbe => {
        probed += 1;
        return { available: true };
      };
      const gate = resolveResolveLiveGate({ env: {}, probe });
      expect(gate.enabled).toBe(false);
      expect(probed, "the probe is NOT consulted when the env gate is off").toBe(0);
    });

    it("ENABLES only when KIP_RESOLVE_LIVE is set AND the model is available; fails loudly when unavailable", () => {
      // Enabled path (fails now — the stub gate is always disabled).
      const enabled = resolveResolveLiveGate({ env: { KIP_RESOLVE_LIVE: "1" }, probe: () => ({ available: true }) });
      expect(enabled.enabled).toBe(true);

      // Set but the model is unavailable ⇒ fail loudly (never a silent fabricated link): disabled, and
      // the reason names the probe's own reason.
      const unavailable = resolveResolveLiveGate({
        env: { KIP_RESOLVE_LIVE: "1" },
        probe: () => ({ available: false, reason: "no ANTHROPIC_API_KEY and no credentials" }),
      });
      expect(unavailable.enabled).toBe(false);
      expect(unavailable.reason ?? "").toContain("no ANTHROPIC_API_KEY");
    });

    it("the confidence bar default is the ADR-B12c 0.85 threshold", () => {
      expect(DEFAULT_RESOLVE_MIN_CONFIDENCE).toBe(0.85);
    });
  });
});
