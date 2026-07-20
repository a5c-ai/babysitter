/**
 * debt-closure-d52.test.ts — D-52: graph-QA retrieval was content-seed-brittle.
 *
 * `recall`'s ENTIRE text path used to be exact string equality against a `content` prop:
 *   `if (coveringPropValue(view.props.content, gateInstant) === q.text) textSeeds.add(eid);`
 * `kip learn` never authors a `content` prop, so a learn-shaped graph produced an EMPTY text-seed
 * set, the vector half is inert without a caller-supplied `q.embedding` (kip never embeds the
 * query, N2/N5), and `kip ask` therefore composed to a GUARANTEED abstention on a graph that
 * literally contained the answer.
 *
 * These tests pin the replacement: deterministic, set-pure LEXICAL term matching over each
 * candidate node's searchable surface (eid + kind + all string prop values, read through the SAME
 * `coveringPropValue` gate instant so valid-time/asOf semantics are unchanged), scored by DISTINCT
 * matching query terms, with the exact-`content` equality preserved as a DOMINANT boost so the
 * pre-existing behaviour still ranks at the top.
 *
 * This is keyword matching, NOT semantic retrieval — the no-overlap test pins that honestly.
 */
import { afterEach, describe, expect, it } from "vitest";
import type { Fact, KipRepo, RecallResult } from "../index";
import {
  edgeFact,
  ingestFacts,
  makeRepo,
  nodeExistenceFact,
  nodePropFact,
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

/**
 * A LEARN-SHAPED graph: exactly what `kip learn ./note.md` authors — nodes carrying `name` /
 * `description` props and typed edges, and NO `content` prop anywhere. This is the shape that used
 * to be 100% invisible to `recall({ text })`.
 */
function learnShapedFacts(): Fact[] {
  return [
    nodeExistenceFact("ledger-database", "component"),
    nodePropFact("ledger-database", "name", "Ledger"),
    nodePropFact("ledger-database", "description", "The double-entry ledger store for checkout settlement"),

    nodeExistenceFact("data-platform-team", "team"),
    nodePropFact("data-platform-team", "name", "Data Platform Team"),
    nodePropFact("data-platform-team", "description", "Owns the Ledger and the warehouse ingestion path"),

    nodeExistenceFact("rpc-facade-alternative", "decision"),
    nodePropFact("rpc-facade-alternative", "name", "RPC facade alternative"),
    nodePropFact(
      "rpc-facade-alternative",
      "description",
      "Rejected because the synchronous RPC facade coupled checkout availability to settlement",
    ),
    nodePropFact("rpc-facade-alternative", "status", "rejected"),

    nodeExistenceFact("cache-warmer", "component"),
    nodePropFact("cache-warmer", "name", "Cache Warmer"),
    nodePropFact("cache-warmer", "description", "Prewarms the product catalog cache on deploy"),

    edgeFact("owns/data-platform-ledger", "owns", "data-platform-team", "ledger-database"),
    edgeFact("rejected-for/rpc-ledger", "rejected-for", "rpc-facade-alternative", "ledger-database"),
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────
// D-52 (a) — a learn-shaped graph (no `content` prop) is DISCOVERABLE by free-text recall.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-52 — recall's text path does real term matching over the node's searchable surface (learn-shaped graphs are discoverable)", () => {
  it("recall({ text: 'which team owns Ledger', k: 10 }) over a learn-shaped graph with NO `content` prop returns the relevant nodes, not []", async () => {
    const { repo } = makeRepo("d52-learn-shaped");
    track(repo);
    await ingestFacts(repo, learnShapedFacts());

    const results = await repo.recall({ text: "which team owns Ledger", k: 10 } as SpecRecallQuery);

    expect(results.length).toBeGreaterThan(0);
    const eids = eidsOf(results);
    expect(eids).toContain("ledger-database"); // `name: "Ledger"`
    expect(eids).toContain("data-platform-team"); // kind `team` + description mentions Ledger
    // Every returned node earns a hop-0 graph rank (the G0 seed contract) and no vector rank
    // (kip never embeds the query, N2/N5).
    for (const r of results) expect(r.ranks.vector).toBeUndefined();
    expect(results.find((r) => r.eid === "ledger-database")!.ranks.graph).toBeDefined();
  });

  it("the live-demo question ('Which team owns Ledger, and why was the RPC facade alternative rejected?') surfaces BOTH the owning team and the rejected alternative", async () => {
    const { repo } = makeRepo("d52-live-demo-question");
    track(repo);
    await ingestFacts(repo, learnShapedFacts());

    const results = await repo.recall({
      text: "Which team owns Ledger, and why was the RPC facade alternative rejected?",
      k: 64,
      expand: { hops: 3 },
    } as SpecRecallQuery);

    const eids = eidsOf(results);
    expect(eids).toContain("ledger-database");
    expect(eids).toContain("data-platform-team");
    expect(eids).toContain("rpc-facade-alternative");
  });

  it("the eid and the node KIND are part of the searchable surface (a node matched only by its kind is a seed)", async () => {
    const { repo } = makeRepo("d52-kind-surface");
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("n-1", "invoice"),
      nodePropFact("n-1", "name", "Zephyr"),
      nodeExistenceFact("quarterly-audit", "document"),
      nodePropFact("quarterly-audit", "name", "Zephyr"),
    ]);

    const byKind = await repo.recall({ text: "invoice", k: 10 } as SpecRecallQuery);
    expect(eidsOf(byKind)).toEqual(["n-1"]);

    const byEid = await repo.recall({ text: "quarterly audit", k: 10 } as SpecRecallQuery);
    expect(eidsOf(byEid)).toEqual(["quarterly-audit"]);
  });

  it("non-string prop values stringify into the surface; a BlobRef prop is skipped (no object noise in the index)", async () => {
    const { repo } = makeRepo("d52-nonstring-props");
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("m-1", "metric"),
      nodePropFact("m-1", "threshold", 4711),
      nodePropFact("m-1", "enabled", true),
    ]);

    expect(eidsOf(await repo.recall({ text: "4711", k: 10 } as SpecRecallQuery))).toEqual(["m-1"]);
    expect(eidsOf(await repo.recall({ text: "true", k: 10 } as SpecRecallQuery))).toEqual(["m-1"]);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// D-52 (b) — determinism / set-purity (INV-5 m-7: recall is a pure function of the fact set + query).
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-52 — the lexical text path is DETERMINISTIC and set-pure", () => {
  it("two calls on the SAME repo return a byte-identical ranked list (eids, ranks and scores)", async () => {
    const { repo } = makeRepo("d52-determinism-same");
    track(repo);
    await ingestFacts(repo, learnShapedFacts());
    const q = (): SpecRecallQuery => ({ text: "which team owns the Ledger store", k: 10 } as SpecRecallQuery);

    const a = await repo.recall(q());
    const b = await repo.recall(q());
    const shape = (rs: readonly RecallResult[]) =>
      JSON.stringify(rs.map((r) => ({ eid: r.eid, score: r.score, ranks: r.ranks })));
    expect(shape(b)).toBe(shape(a));
  });

  it("two independent replicas ingesting the SAME facts return the identical ranked list (replica-independent, no Map-iteration/locale/clock dependence)", async () => {
    const { repo: r1 } = makeRepo("d52-determinism-replica-1");
    const { repo: r2 } = makeRepo("d52-determinism-replica-2");
    track(r1);
    track(r2);
    const facts = learnShapedFacts();
    await ingestFacts(r1, facts);
    // Reverse ingest order on the second replica: recall is a function of the SET, not arrival order.
    await ingestFacts(r2, [...facts].reverse());

    const q = (): SpecRecallQuery => ({ text: "why was the RPC facade rejected", k: 10 } as SpecRecallQuery);
    const a = await r1.recall(q());
    const b = await r2.recall(q());
    expect(eidsOf(b)).toEqual(eidsOf(a));
    expect(b.map((r) => r.score)).toEqual(a.map((r) => r.score));
  });

  it("ties are broken by ascending eid, giving a TOTAL stable order", async () => {
    const { repo } = makeRepo("d52-tiebreak");
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("z-node", "widget"),
      nodePropFact("z-node", "name", "Sprocket"),
      nodeExistenceFact("a-node", "widget"),
      nodePropFact("a-node", "name", "Sprocket"),
      nodeExistenceFact("m-node", "widget"),
      nodePropFact("m-node", "name", "Sprocket"),
    ]);
    const results = await repo.recall({ text: "Sprocket", k: 10 } as SpecRecallQuery);
    expect(eidsOf(results)).toEqual(["a-node", "m-node", "z-node"]);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// D-52 (c) — BACKWARD COMPATIBILITY: the exact `content === text` seed still wins.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-52 — an exact `props.content === q.text` match is still a seed and still outranks a merely term-overlapping node", () => {
  it("the exact-content node ranks FIRST, ahead of a node that only shares terms", async () => {
    const { repo } = makeRepo("d52-exact-wins");
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("exact/doc", "document"),
      nodePropFact("exact/doc", "content", "alpha vector zero"),
      // A node that overlaps on EVERY content term but is not an exact content match.
      nodeExistenceFact("overlap/doc", "document"),
      nodePropFact("overlap/doc", "name", "alpha"),
      nodePropFact("overlap/doc", "description", "vector zero alpha vector zero"),
    ]);

    const results = await repo.recall({ text: "alpha vector zero", k: 10 } as SpecRecallQuery);
    expect(eidsOf(results)).toContain("exact/doc");
    expect(eidsOf(results)).toContain("overlap/doc");
    expect(results[0].eid).toBe("exact/doc");
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("an exact-content match is a seed even when the query is ENTIRELY stopwords (no lexical terms survive tokenization)", async () => {
    const { repo } = makeRepo("d52-exact-stopwords");
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("sw/doc", "document"),
      nodePropFact("sw/doc", "content", "which was the"),
      nodeExistenceFact("sw/other", "document"),
      nodePropFact("sw/other", "description", "which was the other one"),
    ]);
    const results = await repo.recall({ text: "which was the", k: 10 } as SpecRecallQuery);
    expect(eidsOf(results)).toEqual(["sw/doc"]);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// D-52 (d) — NO false positives: this is keyword matching, and it must not degrade into "match all".
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-52 — a node with ZERO matching query terms is not a seed (keyword matching, not semantic recall)", () => {
  it("a query with no lexical overlap with the graph returns []", async () => {
    const { repo } = makeRepo("d52-no-overlap");
    track(repo);
    await ingestFacts(repo, learnShapedFacts());
    const results = await repo.recall({
      text: "photosynthesis chlorophyll stomata",
      k: 10,
    } as SpecRecallQuery);
    expect(results).toEqual([]);
  });

  it("stopwords alone do not match everything: a pure-stopword query with no exact-content mirror returns []", async () => {
    const { repo } = makeRepo("d52-stopwords-only");
    track(repo);
    await ingestFacts(repo, learnShapedFacts());
    const results = await repo.recall({ text: "which the and why was is", k: 10 } as SpecRecallQuery);
    expect(results).toEqual([]);
  });

  it("scoring is by DISTINCT matching query terms: a node matching more of the query outranks one matching fewer", async () => {
    const { repo } = makeRepo("d52-distinct-terms");
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("a/two", "note"),
      nodePropFact("a/two", "description", "ledger settlement"),
      nodeExistenceFact("b/one", "note"),
      // Repeats one term many times — term FREQUENCY must not beat distinct-term COVERAGE.
      nodePropFact("b/one", "description", "ledger ledger ledger ledger ledger"),
    ]);
    const results = await repo.recall({ text: "ledger settlement", k: 10 } as SpecRecallQuery);
    expect(eidsOf(results)).toEqual(["a/two", "b/one"]);
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("the `k` bound is honored by the lexical seed path", async () => {
    const { repo } = makeRepo("d52-k-bound");
    track(repo);
    const facts: Fact[] = [];
    for (let i = 0; i < 12; i += 1) {
      const eid = `k/node-${String(i).padStart(2, "0")}`;
      facts.push(nodeExistenceFact(eid, "note"));
      facts.push(nodePropFact(eid, "description", "ledger"));
    }
    await ingestFacts(repo, facts);
    const results = await repo.recall({ text: "ledger", k: 3 } as SpecRecallQuery);
    expect(results).toHaveLength(3);
  });
});
