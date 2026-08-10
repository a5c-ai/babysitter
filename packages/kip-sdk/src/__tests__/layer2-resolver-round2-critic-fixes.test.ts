/**
 * Round-2 critic-fix acceptance tests for the model-assisted Layer-2 entity resolver (ADR-B12 /
 * B12a / B12c). These are ADDITIVE and STRICTLY STRONGER than the frozen `layer2-resolver.test.ts`
 * suite (which is left untouched); each closes a specific round-1 critic finding:
 *
 *   (F2) confirm/reject VALIDATE an outstanding candidate lifecycle — they no longer author a merge/veto
 *        unconditionally (quarantine-then-promote, ADR-B12). No candidate ⇒ fail loudly, author nothing.
 *   (F3) `confidence` is range-checked to [0,1] EVERYWHERE the N5 bar applies — an out-of-range value
 *        (1.5, 999) ABSTAINS (rejected, never clamped), just like the sub-threshold / malformed cases.
 *   (F5a) the `edgeEids` LIVENESS filter is load-bearing — a retracted edge drops from `edgeEids`,
 *         from `resolveList`, and from the candidate-generation exclusion set.
 *   (F5b) the TOTAL `--max-pairs` cap is the binding constraint (not the per-node topK), and the
 *         selected subset is deterministic/stable.
 *   (F5c) `runAcquisition` edge-existence idempotence keys on the FULL envelope (eid + edgeKind +
 *         validity) — a genuinely different re-assert is NOT masked.
 */
import { afterEach, describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import type { DispatchMicroagentFn, EID, MicroagentInvocation } from "../index";
import { KIP_CONFLICT_KIND } from "../proj";
import {
  KIP_SAME_AS_CANDIDATE_KIND,
  NOT_SAME_AS_EDGE_KIND,
  SAME_AS_EDGE_KIND,
  generateResolverCandidatePairs,
  makeResolverDispatch,
  notSameAsEid,
  resolveConfirm,
  resolveList,
  resolveReject,
  resolverPlaceholderProvenance,
  sameAsCandidateEid,
  type CandidatePair,
  type ResolverAdjudicator,
  type ResolverVerdict,
} from "../linker/entity-resolver";
import {
  FIXED_AS_OF,
  freshReplicaId,
  registerAcquisitionManifest,
  seedNode,
  seedProp,
} from "./conformance/fixtures-m7";

const RESOLVER_MANIFEST = "kip-resolver";

function pairKey(a: EID, b: EID): string {
  return a < b ? `${a} ${b}` : `${b} ${a}`;
}

function scriptedAdjudicator(verdicts: Record<string, ResolverVerdict | null>): ResolverAdjudicator {
  return (pair: CandidatePair) => verdicts[pairKey(pair.a, pair.b)] ?? null;
}

describe("layer2-resolver round-2 critic fixes", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  async function resolverRepo(
    label: string,
    adjudicate: ResolverAdjudicator,
  ): Promise<{ repo: KipRepo; manifest: import("../index").MicroagentManifest }> {
    const repo = new KipRepo({ replicaId: freshReplicaId(label), dispatchMicroagent: makeResolverDispatch(adjudicate) });
    repos.push(repo);
    const manifest = await registerAcquisitionManifest(repo, RESOLVER_MANIFEST);
    return { repo, manifest };
  }

  const runPairs = (
    repo: KipRepo,
    manifest: import("../index").MicroagentManifest,
    pairs: CandidatePair[],
  ): Promise<{ facts: import("../index").FactId[] }> => repo.runAcquisition(manifest, { pairs }, { asOf: FIXED_AS_OF });

  // ============================================================================================
  // (F2) confirm / reject REQUIRE an outstanding candidate (quarantine-then-promote validation).
  // ============================================================================================
  describe("(F2) confirm/reject validate an outstanding candidate before authoring", () => {
    it("confirm with NO outstanding candidate FAILS LOUDLY and authors nothing (no merge)", async () => {
      const a = "t/ns/cg-a";
      const b = "t/ns/cg-b";
      const { repo, manifest } = await resolverRepo("confirm-guard", scriptedAdjudicator({}));
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");

      await expect(resolveConfirm(repo, manifest, a, b, { asOf: FIXED_AS_OF })).rejects.toThrow();

      // NO `same_as` merge fact was authored — the nodes stay unmerged.
      expect(await repo.edgeExistenceFactId(`${SAME_AS_EDGE_KIND}/${a}=>${b}`)).toBeNull();
      expect((await repo.getNode(a))?.eid).toBe(a);
      expect((await repo.getNode(b))?.eid).toBe(b);
      expect(await repo.sameAsClass(a)).toEqual([a]);
    });

    it("reject with NO outstanding candidate AND no same_as FAILS LOUDLY and authors no veto", async () => {
      const a = "t/ns/rg-a";
      const b = "t/ns/rg-b";
      const { repo, manifest } = await resolverRepo("reject-guard", scriptedAdjudicator({}));
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");

      await expect(resolveReject(repo, manifest, a, b, { asOf: FIXED_AS_OF })).rejects.toThrow();

      expect(await repo.edgeExistenceFactId(notSameAsEid(a, b))).toBeNull();
      expect((await repo.getNode(a))?.kind).not.toBe(KIP_CONFLICT_KIND);
    });

    it("confirm WITH an outstanding candidate promotes it (merges) and retracts the candidate", async () => {
      const a = "t/ns/cok-a";
      const b = "t/ns/cok-b";
      const { repo, manifest } = await resolverRepo(
        "confirm-ok",
        scriptedAdjudicator({ [pairKey(a, b)]: { decision: "same", confidence: 0.95, rationale: "r" } }),
      );
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");
      await runPairs(repo, manifest, [{ a, b }]); // authors the outstanding candidate.
      expect(await repo.edgeExistenceFactId(sameAsCandidateEid(a, b))).not.toBeNull();

      const res = await resolveConfirm(repo, manifest, a, b, { asOf: FIXED_AS_OF });
      expect(res.facts.length).toBeGreaterThanOrEqual(2); // merge + candidate retract.

      // The pair MERGED and the outstanding candidate is retracted.
      expect((await repo.getNode(a))?.eid).toBe((await repo.getNode(b))?.eid);
      expect(await repo.sameAsClass(a)).toEqual([a, b].sort());
      expect(await repo.edgeExistenceFactId(sameAsCandidateEid(a, b))).toBeNull();
    });

    it("confirm with --force authors a merge even with no candidate (documented override, off by default)", async () => {
      const a = "t/ns/cf-a";
      const b = "t/ns/cf-b";
      const { repo, manifest } = await resolverRepo("confirm-force", scriptedAdjudicator({}));
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");

      await resolveConfirm(repo, manifest, a, b, { asOf: FIXED_AS_OF, force: true });
      expect((await repo.getNode(a))?.eid).toBe((await repo.getNode(b))?.eid); // merged under override.
    });
  });

  // ============================================================================================
  // (F3) confidence range [0,1] — an out-of-range value ABSTAINS (rejected, never clamped).
  // ============================================================================================
  describe("(F3) an out-of-range confidence abstains (>1 is malformed, not 'very confident')", () => {
    it("confidence 1.5 (same) and 999 (not-same) each author ZERO facts; an in-range control authors", async () => {
      const [sa, sb] = ["t/ns/hi-a", "t/ns/hi-b"]; // same, confidence 1.5 (out of range).
      const [na, nb] = ["t/ns/hn-a", "t/ns/hn-b"]; // not-same, confidence 999 (out of range).
      const [oa, ob] = ["t/ns/ok-a", "t/ns/ok-b"]; // control: same, 0.95 (authors).
      const { repo, manifest } = await resolverRepo(
        "range",
        scriptedAdjudicator({
          [pairKey(sa, sb)]: { decision: "same", confidence: 1.5, rationale: "r" },
          [pairKey(na, nb)]: { decision: "not-same", confidence: 999, rationale: "r" },
          [pairKey(oa, ob)]: { decision: "same", confidence: 0.95, rationale: "r" },
        }),
      );
      for (const [x, y] of [[sa, sb], [na, nb], [oa, ob]] as Array<[EID, EID]>) {
        await seedNode(repo, x, "concept");
        await seedNode(repo, y, "concept");
      }

      await runPairs(repo, manifest, [
        { a: sa, b: sb },
        { a: na, b: nb },
        { a: oa, b: ob },
      ]);

      // Out-of-range confidences abstained — no candidate, no veto.
      expect(await repo.edgeExistenceFactId(sameAsCandidateEid(sa, sb)), "1.5 same abstains").toBeNull();
      expect(await repo.edgeExistenceFactId(notSameAsEid(na, nb)), "999 not-same abstains").toBeNull();
      // The in-range control authored (proves the abstention is the range check, not a dead pipeline).
      expect(await repo.edgeExistenceFactId(sameAsCandidateEid(oa, ob)), "0.95 same authors").not.toBeNull();
    });
  });

  // ============================================================================================
  // (F5a) edgeEids LIVENESS — a retracted edge drops from edgeEids / resolveList / generation.
  // ============================================================================================
  describe("(F5a) a retracted candidate edge drops from edgeEids, resolveList, and the generator exclusion set", () => {
    const BLOB = "L".repeat(40);
    const genEid = (i: number): EID => `doc:${BLOB}#live-${i}`;

    it("excludes a retracted kip:same_as? edge everywhere the edgeEids seam feeds", async () => {
      const a = genEid(0);
      const b = genEid(1);
      const { repo, manifest } = await resolverRepo(
        "edge-liveness",
        scriptedAdjudicator({ [pairKey(a, b)]: { decision: "same", confidence: 0.95, rationale: "r" } }),
      );
      // A small similar corpus so recall connects a<->b (the pair is generatable when undecided).
      for (let i = 0; i < 4; i += 1) {
        await seedNode(repo, genEid(i), "concept");
        await seedProp(repo, genEid(i), "name", "Shared Distinctive Ledger Concept");
        await seedProp(repo, genEid(i), "content", "shared ledger reconciliation alpha beta gamma delta");
      }
      await runPairs(repo, manifest, [{ a, b }]);
      const candEid = sameAsCandidateEid(a, b);

      // BEFORE retraction: present in edgeEids + resolveList; the decided pair is EXCLUDED from generation.
      expect(await repo.edgeEids({ kinds: [KIP_SAME_AS_CANDIDATE_KIND] })).toContain(candEid);
      expect((await resolveList(repo)).some((c) => c.eid === candEid)).toBe(true);
      const before = await generateResolverCandidatePairs(repo, { topK: 5, maxPairs: 50, prefixes: ["doc:"] });
      expect(before.some((p) => pairKey(p.a, p.b) === pairKey(a, b)), "decided pair excluded before retract").toBe(false);

      // Retract the candidate existence fact.
      await repo.retractFact({
        type: "retract",
        v: 1,
        target: { kind: "edge", eid: candEid, edgeKind: KIP_SAME_AS_CANDIDATE_KIND, from: a, to: b },
        validFrom: 0,
        validTo: null,
        replicaId: "operator-live",
        provenance: { author: "operator", signature: "", publicKeyFingerprint: "", signedFields: [] },
      });

      // AFTER retraction: the liveness filter drops it from edgeEids (the mutation-catching assertion) …
      expect(await repo.edgeEids({ kinds: [KIP_SAME_AS_CANDIDATE_KIND] })).not.toContain(candEid);
      // … and from resolveList …
      expect((await resolveList(repo)).some((c) => c.eid === candEid)).toBe(false);
      // … and the now-undecided pair becomes generatable again.
      const after = await generateResolverCandidatePairs(repo, { topK: 5, maxPairs: 50, prefixes: ["doc:"] });
      expect(after.some((p) => pairKey(p.a, p.b) === pairKey(a, b)), "undecided pair re-included after retract").toBe(true);
    });
  });

  // ============================================================================================
  // (F5b) the TOTAL --max-pairs cap is the BINDING constraint, and the subset is deterministic.
  // ============================================================================================
  describe("(F5b) max-pairs is the binding cap (not per-node topK) and the selection is stable", () => {
    const N = 12;
    const BLOB = "M".repeat(40);
    const genEid = (i: number): EID => `doc:${BLOB}#bind-${i}`;

    async function seedCorpus(repo: KipRepo, order: number[]): Promise<void> {
      for (const i of order) {
        await seedNode(repo, genEid(i), "concept");
        await seedProp(repo, genEid(i), "name", `Shared Ledger Concept ${i}`);
        await seedProp(repo, genEid(i), "content", "shared ledger reconciliation concept alpha beta gamma");
      }
    }

    it("caps the TOTAL at maxPairs while topK is slack, and selects a deterministic/stable subset", async () => {
      const repo = new KipRepo({ replicaId: freshReplicaId("bind") });
      repos.push(repo);
      await seedCorpus(repo, Array.from({ length: N }, (_, i) => i));

      const topK = 8; // deliberately LARGE so the per-node cap does NOT bind …
      const maxPairs = 3; // … and the TOTAL cap is what binds.
      const pairs = await generateResolverCandidatePairs(repo, { topK, maxPairs, prefixes: ["doc:"] });

      // The total cap is the binding constraint: exactly maxPairs, far below topK-allowed (12*8/2 = 48).
      expect(pairs.length).toBe(maxPairs);
      // Prove topK did NOT bind: every node's degree is strictly under topK.
      const degree = new Map<EID, number>();
      for (const p of pairs) {
        degree.set(p.a, (degree.get(p.a) ?? 0) + 1);
        degree.set(p.b, (degree.get(p.b) ?? 0) + 1);
      }
      for (const [, d] of degree) expect(d).toBeLessThan(topK);

      // Deterministic across two calls on the same fact set (same subset, same order).
      const again = await generateResolverCandidatePairs(repo, { topK, maxPairs, prefixes: ["doc:"] });
      expect(again).toEqual(pairs);

      // Stable across a fact-set permutation: the SAME capped subset is selected regardless of insert order.
      const rev = new KipRepo({ replicaId: freshReplicaId("bind-rev") });
      repos.push(rev);
      await seedCorpus(rev, Array.from({ length: N }, (_, i) => N - 1 - i));
      const permuted = await generateResolverCandidatePairs(rev, { topK, maxPairs, prefixes: ["doc:"] });
      const sortedKeys = (ps: CandidatePair[]): string[] => ps.map((p) => pairKey(p.a, p.b)).sort();
      expect(sortedKeys(permuted)).toEqual(sortedKeys(pairs));
    });
  });

  // ============================================================================================
  // (F5c) runAcquisition edge idempotence keys on the FULL envelope (eid + edgeKind + validity).
  // ============================================================================================
  describe("(F5c) idempotence does not mask a genuinely different re-assert (miner/linker callers)", () => {
    /** A generic acquisition dispatch that proposes ONE edge exactly as described in `invocation.input`. */
    const edgeSpecDispatch: DispatchMicroagentFn = (invocation: MicroagentInvocation) => {
      const s = invocation.input as { eid: EID; edgeKind: string; from: EID; to: EID; validFrom: number; validTo: number | null };
      const prov = resolverPlaceholderProvenance();
      return Promise.resolve({
        exitCode: 0,
        output: {
          proposed: [
            {
              type: "assert" as const,
              v: 1 as const,
              target: { kind: "edge" as const, eid: s.eid, edgeKind: s.edgeKind, from: s.from, to: s.to },
              value: true,
              validFrom: s.validFrom,
              validTo: s.validTo,
              replicaId: "edge-spec",
              provenance: prov,
            },
          ],
          source: prov,
        },
        elapsedMs: 0,
      });
    };

    it("masks a byte-identical re-assert but NOT a changed edgeKind / changed validity re-assert", async () => {
      const a = "t/ns/re-a";
      const b = "t/ns/re-b";
      const eid = "rel/re-a=>re-b";
      const repo = new KipRepo({ replicaId: freshReplicaId("idem-envelope"), dispatchMicroagent: edgeSpecDispatch });
      repos.push(repo);
      const manifest = await registerAcquisitionManifest(repo, RESOLVER_MANIFEST);
      await seedNode(repo, a, "concept");
      await seedNode(repo, b, "concept");

      // (1) first assert: kind "related", open validity.
      await repo.runAcquisition(manifest, { eid, edgeKind: "related", from: a, to: b, validFrom: 0, validTo: null }, {});
      const id1 = await repo.edgeExistenceFactId(eid);
      expect(id1).not.toBeNull();

      // (2) IDENTICAL re-assert (same kind + validity) FOLDS onto the same cell — the existence id is STABLE.
      await repo.runAcquisition(manifest, { eid, edgeKind: "related", from: a, to: b, validFrom: 0, validTo: null }, {});
      expect(await repo.edgeExistenceFactId(eid)).toBe(id1);

      // (3) a changed EDGEKIND re-assert is NOT masked — it authors a NEW existence fact (new winner).
      await repo.runAcquisition(manifest, { eid, edgeKind: "other_rel", from: a, to: b, validFrom: 0, validTo: null }, {});
      const id3 = await repo.edgeExistenceFactId(eid);
      expect(id3).not.toBe(id1);

      // (4) a changed VALIDITY re-assert (bounded validTo) is NOT masked either — another new fact.
      await repo.runAcquisition(manifest, { eid, edgeKind: "other_rel", from: a, to: b, validFrom: 0, validTo: 9_000_000 }, {});
      const id4 = await repo.edgeExistenceFactId(eid);
      expect(id4).not.toBe(id3);
    });
  });
});
