/**
 * INV-5 — projection rebuildability (scoped, PARAMETERIZED — m7-25).
 *
 * FROZEN, spec-driven, PRE-implementation conformance test. Sole source of truth:
 * docs/60-conformance-and-testability.md#inv-5 (canonical title + body + the pinned-fixture
 * requirement), docs/26-retrieval.md §5.3 (the deterministic-vs-accelerator boundary), and
 * docs/30-active-knowledge-overview.md §5.3 (the accelerator runs OUTSIDE proj).
 *
 * INV-5 body (verbatim shape): "dropping and rebuilding all DETERMINISTIC projections yields
 * byte-identical results. ACCELERATOR projections (ANN / embeddings) rebuild to RECALL-EQUIVALENT,
 * NOT byte-identical (§5.3, M-7). The recall-equivalence test is pinned so two implementations write
 * the SAME test: `recall@10 ≥ 0.95` (k = 10), measured against the ground-truth exact-kNN ranking
 * over the DETERMINISTIC FIXTURE CORPUS committed with the suite (fixture facts + caller-supplied
 * fixed embedding vectors per T5.2.1 — no live embedding model in the loop, N2), averaged over the
 * fixture query set."
 *
 * `recall()` is an unimplemented throwing stub (index.ts: `throw new Error("unimplemented: recall")`)
 * as of this round, so every accelerator assertion below FAILS on a rejected promise (a real runtime
 * assertion failure), never on a type/syntax/import error. The deterministic-half assertion exercises
 * the already-implemented `getNode` proj read and is expected to pass — it pins the byte-identity side
 * of the boundary INV-5 draws.
 */
import { afterEach, describe, expect, it } from "vitest";
import type { KipRepo } from "../../index";
import {
  CORPUS,
  QUERIES,
  buildCorpusFacts,
  exactTopKByCosine,
  ingestFacts,
  makeRepo,
  recallAtK,
  type SpecRecallQuery,
} from "./fixtures-m4";

const K = 10;

const open: KipRepo[] = [];
function track(repo: KipRepo): KipRepo {
  open.push(repo);
  return repo;
}
afterEach(() => {
  while (open.length > 0) open.pop()?.close();
});

/**
 * A pure-vector recall query: no `expand` (graph half is opt-in, docs/26 §5.1), and salience/recency
 * knobs pinned to 0 so INV-5 measures the ANN ACCELERATOR's recall equivalence against exact-kNN —
 * not a salience/graph-fused ordering. The fixture corpus is intentionally flat (no edges ⇒ uniform
 * centrality; no `read` facts ⇒ zero accessFreq; identical author-HLC walls ⇒ uniform recency), so
 * even a fusion that ignored these knobs would not perturb the top-k; pinning them to 0 makes the
 * isolation explicit and implementation-independent.
 */
function vectorQuery(embedding: number[]): SpecRecallQuery {
  return { embedding, k: K, rank: { salienceWeight: 0, recencyWeight: 0 } };
}

async function measureAverageRecallAt10(repo: KipRepo): Promise<number> {
  let total = 0;
  for (const q of QUERIES) {
    // eslint-disable-next-line no-await-in-loop -- sequential is fine for the fixed 4-query set
    const results = await repo.recall(vectorQuery([...q.embedding]));
    const retrieved = results.slice(0, K).map((r) => r.eid);
    const groundTruth = exactTopKByCosine(q.embedding, K);
    total += recallAtK(retrieved, groundTruth);
  }
  return total / QUERIES.length;
}

describe("INV-5 — projection rebuildability (scoped, PARAMETERIZED — m7-25)", () => {
  it("accelerator (ANN/embedding) recall is recall-equivalent: recall@10 ≥ 0.95 vs ground-truth exact-kNN over the pinned corpus, averaged over the fixture query set (caller-supplied fixed embedding vectors, no live model)", async () => {
    const { repo } = makeRepo("inv5-accel");
    track(repo);
    await ingestFacts(repo, buildCorpusFacts());

    const avgRecallAt10 = await measureAverageRecallAt10(repo);
    expect(avgRecallAt10).toBeGreaterThanOrEqual(0.95);
  });

  it("the accelerator REBUILD is recall-equivalent: a dropped-and-rebuilt vector projection (a fresh repo over the same committed facts) still scores recall@10 ≥ 0.95", async () => {
    const facts = buildCorpusFacts();

    const first = makeRepo("inv5-build-a");
    track(first.repo);
    await ingestFacts(first.repo, facts);
    const avgFirst = await measureAverageRecallAt10(first.repo);

    // "Drop and rebuild" the accelerator: a fresh repo (fresh embedding dispatch) over the SAME facts.
    const rebuilt = makeRepo("inv5-build-b");
    track(rebuilt.repo);
    await ingestFacts(rebuilt.repo, facts);
    const avgRebuilt = await measureAverageRecallAt10(rebuilt.repo);

    expect(avgFirst).toBeGreaterThanOrEqual(0.95);
    expect(avgRebuilt).toBeGreaterThanOrEqual(0.95);
  });

  it("per-query recall@10 ≥ 0.95: each fixture query independently meets the pinned threshold against its exact-kNN ground truth", async () => {
    const { repo } = makeRepo("inv5-perq");
    track(repo);
    await ingestFacts(repo, buildCorpusFacts());

    for (const q of QUERIES) {
      // eslint-disable-next-line no-await-in-loop -- sequential over the fixed query set
      const results = await repo.recall(vectorQuery([...q.embedding]));
      const retrieved = results.slice(0, K).map((r) => r.eid);
      const groundTruth = exactTopKByCosine(q.embedding, K);
      expect(recallAtK(retrieved, groundTruth)).toBeGreaterThanOrEqual(0.95);
    }
  });

  it("recall returns at most k results (k = 10) so recall@10 is a genuine top-k measurement, not a return-everything artifact", async () => {
    const { repo } = makeRepo("inv5-k");
    track(repo);
    await ingestFacts(repo, buildCorpusFacts());

    const results = await repo.recall(vectorQuery([...QUERIES[0].embedding]));
    expect(results.length).toBeLessThanOrEqual(K);
    expect(results.length).toBeGreaterThan(0);
  });

  it("HONEST ACCELERATOR SCOPE (M4): the vector accelerator is an EXACT brute-force cosine scan, so recall@10 == 1.0 EXACTLY (not merely ≥ 0.95) — INV-5 here degenerates to a vector-ranking-correctness measurement, and the ≥ 0.95 recall-equivalence threshold has headroom only once a genuinely approximate HNSW/IVF index (a named §5.3 follow-up) lands in the loop", async () => {
    // This test states the exact-scan property explicitly (per the round-1 convergence-safety /
    // code-quality findings) rather than leaving recall@10 = 1.0 an unremarked by-construction
    // artifact: M4 ships no approximate ANN, so retrieved top-k IS exact-kNN top-k. The ≥ 0.95
    // contract above is what a FUTURE approximate index is held to; the exact scan meets it trivially.
    const { repo } = makeRepo("inv5-exact-scan");
    track(repo);
    await ingestFacts(repo, buildCorpusFacts());
    const avgRecallAt10 = await measureAverageRecallAt10(repo);
    expect(avgRecallAt10).toBe(1);
  });

  it("DETERMINISTIC half of the boundary: dropping and rebuilding the deterministic projection is byte-identical — getNode over a rebuilt repo equals the original (INV-5 byte-identity side, NOT recall-threshold)", async () => {
    const facts = buildCorpusFacts();

    const a = makeRepo("inv5-det-a");
    track(a.repo);
    await ingestFacts(a.repo, facts);

    const b = makeRepo("inv5-det-b");
    track(b.repo);
    await ingestFacts(b.repo, facts);

    for (const c of CORPUS) {
      // eslint-disable-next-line no-await-in-loop -- sequential over the fixed corpus
      const [na, nb] = await Promise.all([a.repo.getNode(c.eid), b.repo.getNode(c.eid)]);
      expect(na).not.toBeNull();
      // Byte-identity of the deterministic projection across an independent rebuild.
      expect(nb).toEqual(na);
    }
  });
});
