/**
 * m4-retrieval.test.ts — FROZEN, spec-driven, PRE-implementation METHOD-ACCEPTANCE tests for
 * `recall()` (docs/26-retrieval.md §5.1–§5.4; docs/40 `recall`/`RecallQuery`/`RecallResult`; docs/30
 * §5.3 accelerator boundary). Companion to the INV-5 conformance test
 * (src/__tests__/conformance/inv-5.test.ts).
 *
 * `recall()` is an unimplemented throwing stub (index.ts: `throw new Error("unimplemented: recall")`)
 * as of this round, so every test that awaits `recall()` FAILS on a rejected promise (a real runtime
 * assertion, per the M6 frozen-test precedent) — never on a type/syntax/import error. Two tests pin
 * the §5.3 boundary from the DETERMINISTIC side (getNode never dispatches the embedding accelerator)
 * and pass today; they document the byte-identity half of the boundary and are not weakened for it.
 *
 * Coverage map (one `describe` per criterion; names cite the exact docs/26 criterion):
 *   §5.1 RRF fusion            — score == Σ_r 1/(rrfK+rank_r); sorted desc; multi-list additivity.
 *   §5.1/§5.2 graph expansion  — opt-in; reachability + graph rank; hops bound; maxFanout bound;
 *                                as-of-valid edges only.
 *   §5.4 salience / decay      — salienceWeight reweight (centrality); recency/decay; asOf-bounded &
 *                                reproducible (m-7 observer-effect closure).
 *   §5.1/§5.3 embedding seam    — corpus vectors via dispatchMicroagent; query NEVER embedded (N2/N5);
 *                                proj is independent of the accelerator; vector half runs iff embedding.
 *   docs/40 RecallResult shape  — eid/view/score/ranks/conflicted/provenance.
 */
import { afterEach, describe, expect, it } from "vitest";
import type { KipRepo, RecallResult } from "../index";
import {
  CORPUS,
  QUERIES,
  buildCorpusFacts,
  edgeFact,
  ingestFacts,
  makeRepo,
  nodeExistenceFact,
  nodePropFact,
  type CorpusEntry,
  type SpecRecallQuery,
} from "./conformance/fixtures-m4";

const open: KipRepo[] = [];
function track(repo: KipRepo): KipRepo {
  open.push(repo);
  return repo;
}
afterEach(() => {
  while (open.length > 0) open.pop()?.close();
});

function eidsOf(results: readonly RecallResult[]): string[] {
  return results.map((r) => r.eid);
}
function posOf(results: readonly RecallResult[], eid: string): number {
  return results.findIndex((r) => r.eid === eid);
}
/** The RRF contribution of a single present rank (docs/26 §5.1: `1/(rrfK + rank)`). */
function rrfTerm(rrfK: number, rank: number | undefined): number {
  return rank === undefined ? 0 : 1 / (rrfK + rank);
}

// The unit query vector every controlled mini-scenario is seeded from (dim-0 aligned).
const Q_UNIT: number[] = [1, 0, 0, 0, 0, 0, 0, 0];

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §5.1 — Reciprocal Rank Fusion.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("recall §5.1 — Reciprocal Rank Fusion: score(d) = Σ_r 1/(rrfK + rank_r(d)) over vector/graph/salience ranks", () => {
  // A controlled graph: a positive-cosine vector entry node `g/cand`, a positive-cosine node
  // `g/both` that is ALSO an edge-neighbor of the entry (so it earns BOTH a vector and a graph rank),
  // and a negative-cosine neighbor `g/graphOnly` reachable ONLY via the edge (graph rank only).
  const entries: CorpusEntry[] = [
    { eid: "g/cand", kind: "document", content: "c-g-cand", embedding: [1, 0, 0, 0, 0, 0, 0, 0] },
    { eid: "g/both", kind: "document", content: "c-g-both", embedding: [0.8, 0.1, 0, 0, 0, 0, 0, 0] },
    { eid: "g/graphOnly", kind: "document", content: "c-g-graphonly", embedding: [-1, 0, 0, 0, 0, 0, 0, 0] },
  ];
  async function setup(label: string): Promise<KipRepo> {
    const { repo } = makeRepo(label, entries);
    track(repo);
    const facts = [];
    for (const e of entries) {
      facts.push(nodeExistenceFact(e.eid, e.kind));
      facts.push(nodePropFact(e.eid, "content", e.content));
    }
    facts.push(edgeFact("link/cand-both", "link", "g/cand", "g/both"));
    facts.push(edgeFact("link/cand-graphonly", "link", "g/cand", "g/graphOnly"));
    await ingestFacts(repo, facts);
    return repo;
  }
  const RRF_K = 10;
  function fusedQuery(): SpecRecallQuery {
    return { embedding: [...Q_UNIT], k: 10, expand: { hops: 1, edgeKinds: ["link"] }, rank: { rrfK: RRF_K } };
  }

  it("each RecallResult.score equals the RRF sum over exactly its present ranks (self-consistency, rrfK = 10)", async () => {
    const repo = await setup("rrf-selfconsistent");
    const results = await repo.recall(fusedQuery());
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      const expected = rrfTerm(RRF_K, r.ranks.vector) + rrfTerm(RRF_K, r.ranks.graph) + rrfTerm(RRF_K, r.ranks.salience);
      expect(r.score).toBeCloseTo(expected, 10);
    }
  });

  it("results are returned sorted by descending fused score", async () => {
    const repo = await setup("rrf-sorted");
    const results = await repo.recall(fusedQuery());
    for (let i = 1; i < results.length; i += 1) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("a candidate surfaced by MULTIPLE rank lists is boosted: g/both's score is the SUM of its vector and graph RRF terms, strictly greater than either alone (RRF additivity)", async () => {
    const repo = await setup("rrf-additive");
    const results = await repo.recall(fusedQuery());
    const both = results.find((r) => r.eid === "g/both");
    expect(both).toBeDefined();
    expect(both!.ranks.vector).toBeDefined();
    expect(both!.ranks.graph).toBeDefined();
    const vTerm = rrfTerm(RRF_K, both!.ranks.vector);
    const gTerm = rrfTerm(RRF_K, both!.ranks.graph);
    expect(both!.score).toBeCloseTo(vTerm + gTerm, 10);
    expect(both!.score).toBeGreaterThan(vTerm);
    expect(both!.score).toBeGreaterThan(gTerm);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §5.1 / §5.2 — bounded, opt-in graph expansion.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("recall §5.1/§5.2 — graph expansion is bounded and OPT-IN (never unbounded)", () => {
  // A cand entry node and a 2-hop negative-cosine chain reachable ONLY by edge; plus a second
  // 1-hop neighbor `g/hop1b` to exercise the maxFanout cap.
  const entries: CorpusEntry[] = [
    { eid: "x/cand", kind: "document", content: "c-x-cand", embedding: [1, 0, 0, 0, 0, 0, 0, 0] },
    { eid: "x/hop1", kind: "document", content: "c-x-hop1", embedding: [-1, 0, 0, 0, 0, 0, 0, 0] },
    { eid: "x/hop1b", kind: "document", content: "c-x-hop1b", embedding: [0, -1, 0, 0, 0, 0, 0, 0] },
    { eid: "x/hop2", kind: "document", content: "c-x-hop2", embedding: [-1, -0.5, 0, 0, 0, 0, 0, 0] },
  ];
  async function setup(label: string, opts?: { edgeValidTo?: number | null }): Promise<KipRepo> {
    const { repo } = makeRepo(label, entries);
    track(repo);
    const facts = [];
    for (const e of entries) {
      facts.push(nodeExistenceFact(e.eid, e.kind));
      facts.push(nodePropFact(e.eid, "content", e.content));
    }
    facts.push(edgeFact("link/x-1", "link", "x/cand", "x/hop1", { validFrom: 0, validTo: opts?.edgeValidTo ?? null }));
    facts.push(edgeFact("link/x-1b", "link", "x/cand", "x/hop1b", { validFrom: 0, validTo: opts?.edgeValidTo ?? null }));
    facts.push(edgeFact("link/x-2", "link", "x/hop1", "x/hop2"));
    await ingestFacts(repo, facts);
    return repo;
  }

  it("with NO `expand`, the graph half does not run: no result carries a graph rank, and the negative-cosine neighbor x/hop1 is not surfaced", async () => {
    const repo = await setup("expand-optin");
    const results = await repo.recall({ embedding: [...Q_UNIT], k: 10 });
    for (const r of results) expect(r.ranks.graph).toBeUndefined();
    expect(eidsOf(results)).not.toContain("x/hop1");
  });

  it("with expand{hops:1}, an as-of-valid edge from a vector candidate reaches x/hop1, which carries a graph rank", async () => {
    const repo = await setup("expand-reach");
    const results = await repo.recall({ embedding: [...Q_UNIT], k: 10, expand: { hops: 1, edgeKinds: ["link"] } });
    const hop1 = results.find((r) => r.eid === "x/hop1");
    expect(hop1).toBeDefined();
    expect(hop1!.ranks.graph).toBeDefined();
  });

  it("expansion is bounded by expand.hops: x/hop2 (2 hops from the candidate) is excluded at hops:1 and included at hops:2", async () => {
    const atOneRepo = await setup("expand-hops1");
    const atOne = await atOneRepo.recall({ embedding: [...Q_UNIT], k: 10, expand: { hops: 1, edgeKinds: ["link"] } });
    expect(eidsOf(atOne)).not.toContain("x/hop2");

    const atTwoRepo = await setup("expand-hops2");
    const atTwo = await atTwoRepo.recall({ embedding: [...Q_UNIT], k: 10, expand: { hops: 2, edgeKinds: ["link"] } });
    expect(eidsOf(atTwo)).toContain("x/hop2");
  });

  it("expansion is bounded by expand.maxFanout: with two 1-hop neighbors and maxFanout:1, at most one neighbor is expanded from the candidate", async () => {
    const repo = await setup("expand-fanout");
    const results = await repo.recall({ embedding: [...Q_UNIT], k: 10, expand: { hops: 1, edgeKinds: ["link"], maxFanout: 1 } });
    const expandedNeighbors = ["x/hop1", "x/hop1b"].filter((eid) => eidsOf(results).includes(eid));
    expect(expandedNeighbors.length).toBeLessThanOrEqual(1);
  });

  it("expansion only crosses as-of-valid edges (§5.2): an edge valid only over [0,100) is not crossed by a recall at asOf validTime 500, so x/hop1 is not reached even with expand", async () => {
    const repo = await setup("expand-asof", { edgeValidTo: 100 });
    const results = await repo.recall({
      embedding: [...Q_UNIT],
      k: 10,
      expand: { hops: 1, edgeKinds: ["link"] },
      asOf: { validTime: 500 },
    });
    expect(eidsOf(results)).not.toContain("x/hop1");
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §5.4 — salience projection + decay + the rank knobs.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("recall §5.4 — salience reweight, recency/decay, and asOf-bounded reproducible ranking", () => {
  it("rank.salienceWeight reweights: a high-centrality hub (8 incoming edges) ranks strictly higher with salienceWeight:1 than with salienceWeight:0 (all nodes share one embedding so centrality is the sole differentiator)", async () => {
    // hub + 8 sources, ALL sharing the unit embedding (vector ranks tie), edges src -> hub give the
    // hub maximal in-centrality; every other node has zero in-centrality.
    const sources = ["h/a", "h/b", "h/c", "h/d", "h/e", "h/f", "h/g", "h/h"];
    const entries: CorpusEntry[] = [
      { eid: "h/hub", kind: "document", content: "c-h-hub", embedding: [...Q_UNIT] },
      ...sources.map((eid) => ({ eid, kind: "document", content: `c-${eid}`, embedding: [...Q_UNIT] } as CorpusEntry)),
    ];
    const { repo } = makeRepo("salience-centrality", entries);
    track(repo);
    const facts = [];
    for (const e of entries) {
      facts.push(nodeExistenceFact(e.eid, e.kind));
      facts.push(nodePropFact(e.eid, "content", e.content));
    }
    sources.forEach((src, i) => facts.push(edgeFact(`cite/${i}`, "cites", src, "h/hub")));
    await ingestFacts(repo, facts);

    const base: SpecRecallQuery = { embedding: [...Q_UNIT], k: 20 };
    const withoutSalience = await repo.recall({ ...base, rank: { salienceWeight: 0 } });
    const withSalience = await repo.recall({ ...base, rank: { salienceWeight: 1 } });

    const posWithout = posOf(withoutSalience, "h/hub");
    const posWith = posOf(withSalience, "h/hub");
    expect(posWithout).toBeGreaterThanOrEqual(0);
    expect(posWith).toBeGreaterThanOrEqual(0);
    // Centrality lifts the hub when salience is weighted in.
    expect(posWith).toBeLessThan(posWithout);
  });

  it("recency/decay: with recencyWeight:1, a more-recently-authored node (author-HLC wall nearer the resolved asOf frontier) outranks an equally-embedded but older node", async () => {
    const entries: CorpusEntry[] = [
      { eid: "r/old", kind: "document", content: "c-r-old", embedding: [...Q_UNIT] },
      { eid: "r/new", kind: "document", content: "c-r-new", embedding: [...Q_UNIT] },
    ];
    const { repo } = makeRepo("salience-recency", entries);
    track(repo);
    const facts = [
      nodeExistenceFact("r/old", "document", { wall: 1_000 }),
      nodePropFact("r/old", "content", "c-r-old", { wall: 1_000 }),
      nodeExistenceFact("r/new", "document", { wall: 9_000_000 }),
      nodePropFact("r/new", "content", "c-r-new", { wall: 9_000_000 }),
    ];
    await ingestFacts(repo, facts);

    const results = await repo.recall({
      embedding: [...Q_UNIT],
      k: 10,
      rank: { recencyWeight: 1, salienceWeight: 1 },
      asOf: { validTime: 9_000_000 },
    });
    const posNew = posOf(results, "r/new");
    const posOld = posOf(results, "r/old");
    expect(posNew).toBeGreaterThanOrEqual(0);
    expect(posOld).toBeGreaterThanOrEqual(0);
    expect(posNew).toBeLessThan(posOld);
  });

  it("a recall at a fixed asOf is a pure function of the as-of fact-set (m-7): two identical recall(asOf=T) calls return byte-identical ranked results (the read-event recall emits cannot affect its own or an equal-asOf ranking)", async () => {
    const { repo } = makeRepo("salience-reproducible");
    track(repo);
    await ingestFacts(repo, buildCorpusFacts());

    const q: SpecRecallQuery = { embedding: [...QUERIES[0].embedding], k: 10, asOf: { validTime: 2_000_000_000_000 } };
    const first = await repo.recall(q);
    const second = await repo.recall(q);
    expect(second).toEqual(first);
  });

  it("salience/recall inputs are bounded by the query's asOf frontier: a node whose existence is valid only AFTER the asOf frontier is not surfaced", async () => {
    const entries: CorpusEntry[] = [
      { eid: "v/present", kind: "document", content: "c-v-present", embedding: [...Q_UNIT] },
      { eid: "v/future", kind: "document", content: "c-v-future", embedding: [...Q_UNIT] },
    ];
    const { repo } = makeRepo("salience-asof-bound", entries);
    track(repo);
    const present = nodeExistenceFact("v/present", "document");
    present.validFrom = 0;
    present.validTo = null;
    const future = nodeExistenceFact("v/future", "document");
    future.validFrom = 5_000;
    future.validTo = null;
    await ingestFacts(repo, [
      present,
      nodePropFact("v/present", "content", "c-v-present"),
      future,
      nodePropFact("v/future", "content", "c-v-future"),
    ]);

    const results = await repo.recall({ embedding: [...Q_UNIT], k: 10, asOf: { validTime: 1_000 } });
    expect(eidsOf(results)).toContain("v/present");
    expect(eidsOf(results)).not.toContain("v/future");
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §5.1 / §5.3 — the embedding-via-dispatch seam and the accelerator boundary.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("recall §5.1/§5.3 — embeddings via the dispatchMicroagent seam (accelerator OUTSIDE proj); the query is NEVER embedded by kip (N2/N5)", () => {
  it("the corpus vector projection is built via the injectable dispatchMicroagent seam: a recall carrying an embedding dispatches the embedding microagent at least once", async () => {
    const { repo, embed } = makeRepo("seam-dispatched");
    track(repo);
    await ingestFacts(repo, buildCorpusFacts());
    await repo.recall({ embedding: [...QUERIES[0].embedding], k: 10 });
    expect(embed.embedInvocations.length).toBeGreaterThan(0);
  });

  it("kip NEVER embeds the query text (N2/N5): a recall with `text` but no `embedding` produces no vector ranks (no silent in-kip embed of the query)", async () => {
    const { repo } = makeRepo("seam-no-query-embed");
    track(repo);
    await ingestFacts(repo, buildCorpusFacts());
    const results = await repo.recall({ text: "alpha vector zero", k: 10 } as SpecRecallQuery);
    for (const r of results) expect(r.ranks.vector).toBeUndefined();
  });

  it("§5.3 boundary: the DETERMINISTIC proj is independent of the accelerator — getNode reads dispatch ZERO embedding calls", async () => {
    const { repo, embed } = makeRepo("seam-proj-independent");
    track(repo);
    await ingestFacts(repo, buildCorpusFacts());
    for (const c of CORPUS) {
      // eslint-disable-next-line no-await-in-loop -- sequential over the fixed corpus
      await repo.getNode(c.eid);
    }
    expect(embed.embedInvocations.length).toBe(0);
  });

  it("the vector half runs IFF an embedding is present: with no embedding (graph half only), no result carries a vector rank", async () => {
    const entries: CorpusEntry[] = [
      { eid: "s/cand", kind: "document", content: "c-s-cand", embedding: [...Q_UNIT] },
      { eid: "s/neighbor", kind: "document", content: "c-s-neighbor", embedding: [-1, 0, 0, 0, 0, 0, 0, 0] },
    ];
    const { repo } = makeRepo("seam-graph-only", entries);
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("s/cand", "document"),
      nodePropFact("s/cand", "content", "c-s-cand"),
      nodeExistenceFact("s/neighbor", "document"),
      nodePropFact("s/neighbor", "content", "c-s-neighbor"),
      edgeFact("link/s", "link", "s/cand", "s/neighbor"),
    ]);
    const results = await repo.recall({
      text: "c-s-cand",
      k: 10,
      filters: { kind: ["document"] },
      expand: { hops: 1, edgeKinds: ["link"] },
    } as SpecRecallQuery);
    for (const r of results) expect(r.ranks.vector).toBeUndefined();
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// docs/40 — RecallResult shape + filters.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("recall docs/40 — RecallResult carries eid/view/score/ranks/conflicted/provenance, and filters restrict candidates", () => {
  it("every RecallResult has the declared shape: eid, view (NodeView for the eid), numeric score, a ranks object, a boolean conflicted, and provenance", async () => {
    const { repo } = makeRepo("shape");
    track(repo);
    await ingestFacts(repo, buildCorpusFacts());
    const results = await repo.recall({ embedding: [...QUERIES[0].embedding], k: 10 });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(typeof r.eid).toBe("string");
      expect(r.view).toBeDefined();
      expect(r.view.eid).toBe(r.eid);
      expect(typeof r.score).toBe("number");
      expect(typeof r.ranks).toBe("object");
      expect(typeof r.conflicted).toBe("boolean");
      expect(r.provenance).toBeDefined();
    }
  });

  it("non-conflicting corpus cells surface conflicted:false (m-4 — conflicted is true only when a surfaced cell reads CONFLICTED)", async () => {
    const { repo } = makeRepo("shape-conflicted");
    track(repo);
    await ingestFacts(repo, buildCorpusFacts());
    const results = await repo.recall({ embedding: [...QUERIES[0].embedding], k: 10 });
    for (const r of results) expect(r.conflicted).toBe(false);
  });

  it("filters.kind restricts candidates to the named node kinds: a non-document node near the query is excluded when filters.kind is ['document']", async () => {
    const entries: CorpusEntry[] = [
      { eid: "f/person", kind: "person", content: "c-f-person", embedding: [...QUERIES[0].embedding] },
    ];
    const { repo } = makeRepo("filters-kind", entries);
    track(repo);
    const corpus = buildCorpusFacts();
    await ingestFacts(repo, [
      ...corpus,
      nodeExistenceFact("f/person", "person"),
      nodePropFact("f/person", "content", "c-f-person"),
    ]);
    const results = await repo.recall({
      embedding: [...QUERIES[0].embedding],
      k: 16,
      filters: { kind: ["document"] },
    } as SpecRecallQuery);
    expect(eidsOf(results)).not.toContain("f/person");
    for (const r of results) expect(r.view.kind).toBe("document");
  });
});
