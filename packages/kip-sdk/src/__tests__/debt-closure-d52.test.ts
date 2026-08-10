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
import { makeWellFormedFact } from "./conformance/fixtures";

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

    // SENSITIVITY (round-2 finding #4; round-3 correction): presence alone is NOT a test of the
    // lexical seeding — a build whose text half surfaced the WHOLE graph would satisfy `toContain`.
    // These assertions pin the RANKED ORDER and the seed IDENTITY, so they can only pass if the seeds
    // really are chosen by distinct-term matching over each node's LOCAL surface:
    //   • `data-platform-team` matches {team, owns, ledger} (kind/eid `team`, `owns` via its own
    //     `description` AND its incident `owns` edge kind, `ledger` via `description`) and ranks FIRST;
    //   • `ledger-database` matches fewer distinct terms and must rank strictly BELOW it. (ROUND-3: it
    //     now matches `ledger` (name) AND `owns` (its incident `owns` edge kind is part of its
    //     surface), a widening that the ranked-order assertion tolerates precisely because the bar is
    //     LOCAL — each node is scored by ITS OWN surface, and `data-platform-team` still scores higher);
    //   • `cache-warmer` and `rpc-facade-alternative` share NO query term and must be ABSENT (the
    //     admission bar is `matched > 0`, evaluated on each node's own surface — an unranked node is
    //     not "merely lower", it must not be retrieved at all).
    // Verified by mutation: stubbing `recallSurfaceTerms` to an empty surface fails this test.
    expect(eids[0]).toBe("data-platform-team");
    expect(eids.indexOf("data-platform-team")).toBeLessThan(eids.indexOf("ledger-database"));
    expect(results[0].score).toBeGreaterThan(results[eids.indexOf("ledger-database")].score);
    expect(eids).not.toContain("cache-warmer");
    expect(eids).not.toContain("rpc-facade-alternative");

    // ROUND-3 STRENGTHENING (retrieval LOCALITY): `ledger-database`'s retrieval must not depend on
    // `data-platform-team` (the multi-term anchor) also being in the graph. Under the round-2
    // graph-global floor (`bestMatched >= 2`), a single-term node was admitted ONLY because some
    // OTHER node cleared 2 terms — so removing the anchor could silently drop it. Here we assert the
    // bar is local by querying with `ledger-database`'s OWN single distinct term against a graph where
    // NO node reaches two matches: it must still come back. (Fails under the old non-local floor.)
    const soloRepo = makeRepo("d52-local-single-term").repo;
    track(soloRepo);
    await ingestFacts(soloRepo, [
      nodeExistenceFact("ledger-database", "component"),
      nodePropFact("ledger-database", "name", "Ledger"),
      nodeExistenceFact("unrelated", "note"),
      nodePropFact("unrelated", "description", "an entirely different subject"),
    ]);
    // "Ledger warehouse": `ledger-database` matches only {ledger}; `unrelated` matches nothing; NO
    // node reaches 2 distinct matched terms, so the round-2 floor would have returned []. The local
    // bar returns the single-term subject.
    const solo = await soloRepo.recall({ text: "Ledger warehouse", k: 10 } as SpecRecallQuery);
    expect(eidsOf(solo)).toEqual(["ledger-database"]);

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

    // SENSITIVITY (round-2 finding #4; round-3 correction) — the ranked order IS the claim, not mere
    // presence. Distinct matched query terms of {team, owns, ledger, rpc, facade, alternative,
    // rejected} over each node's LOCAL surface (round-3: the surface now includes prop KEYS and each
    // node's incident EDGE KINDS, so the counts below reflect that wider — but still per-node-local —
    // surface):
    //   rpc-facade-alternative → 4 (rpc, facade, alternative via name/eid; rejected via its `status`
    //                               value AND its incident `rejected-for` edge kind)
    //   data-platform-team     → 3 (team, owns, ledger)
    //   ledger-database        → 3 (ledger via name; owns + rejected via its two incident edge kinds
    //                               `owns`/`rejected-for`) — ties data-platform-team on count, and the
    //                               `(score desc, eid asc)` tie-break puts `data-platform-team` first.
    //   cache-warmer           → 0 — shares nothing with the question, so it is NOT retrieved even
    //                                though `expand` would happily have reached anything connected.
    // A build that seeded on anything other than each node's own lexical surface cannot produce this
    // order; and because the bar is LOCAL, none of these counts depends on any other node's presence.
    expect(eids[0]).toBe("rpc-facade-alternative");
    expect(eids[1]).toBe("data-platform-team");
    expect(eids.indexOf("data-platform-team")).toBeLessThan(eids.indexOf("ledger-database"));
    expect(eids).not.toContain("cache-warmer");
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

// ════════════════════════════════════════════════════════════════════════════════════════════════
// ROUND-3 — the admission bar is LOCAL to the candidate, and the surface indexes prop KEYS +
// incident edge KINDS. These pin the round-3 retrieval-regression fix: round 2 shipped a
// graph-GLOBAL floor (`bestMatched >= 2`) that suppressed correct single-term subject matches and
// let unrelated nodes flip whether a subject was retrieved. The correct bar is `matched > 0` on each
// node's OWN surface.
// ════════════════════════════════════════════════════════════════════════════════════════════════

describe("D-52 round-3 — the minimum-relevance bar is LOCAL (matched > 0 on the candidate's own surface)", () => {
  it("a graph where NO node matches ≥2 terms still retrieves the single-term subject (the bar is LIVE) — both directions", async () => {
    const { repo } = makeRepo("d52r3-bar-live");
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("widget/left", "widget"),
      nodePropFact("widget/left", "label", "alpha"),
      nodeExistenceFact("widget/right", "widget"),
      nodePropFact("widget/right", "label", "beta"),
    ]);
    // "alpha gamma": `widget/left` matches only {alpha} (1); `widget/right` matches nothing; NO node
    // reaches 2 distinct matched terms. Under the round-2 graph-global floor `bestMatched >= 2` this
    // returned [] (a false-negative abstention on a fact the graph holds). The LOCAL bar returns it.
    expect(eidsOf(await repo.recall({ text: "alpha gamma", k: 10 } as SpecRecallQuery))).toEqual([
      "widget/left",
    ]);
    // Negative direction: a query sharing no term with any node's surface still (correctly) returns [].
    expect(await repo.recall({ text: "gamma delta", k: 10 } as SpecRecallQuery)).toEqual([]);
  });

  it("retrieval is LOCAL: ingesting an unrelated node must NOT change whether an existing node is retrieved (non-locality property)", async () => {
    // The exact reproduction from the round-3 brief. A repo holding `zara` (a person with a `name` and
    // an `employer`). The question shares its subject term with `zara` and nothing else.
    const zaraFacts: Fact[] = [
      nodeExistenceFact("zara", "person"),
      nodePropFact("zara", "name", "Zara"),
      nodePropFact("zara", "employer", "Acme Corp"),
    ];
    const q = (): SpecRecallQuery => ({ text: "Where does Zara work?", k: 10 } as SpecRecallQuery);

    // WITHOUT the unrelated node: `zara` matches only {zara} (1 term); NO node reaches 2 — the exact
    // case the round-2 global floor suppressed. The local bar retrieves the subject.
    const { repo: before } = makeRepo("d52r3-local-before");
    track(before);
    await ingestFacts(before, zaraFacts);
    const beforeEids = eidsOf(await before.recall(q()));
    expect(beforeEids).toContain("zara");

    // WITH an unrelated node that happens to contain "zara work" (2 terms): under the round-2 floor
    // this coincidental node flipped the query from [] to non-empty AND ranked the irrelevant node
    // first. Under the local bar, `zara`'s retrieval is IDENTICAL to the no-unrelated-node case: its
    // membership does not depend on what other nodes exist.
    const { repo: after } = makeRepo("d52r3-local-after");
    track(after);
    await ingestFacts(after, [
      ...zaraFacts,
      nodeExistenceFact("unrelated-note", "note"),
      nodePropFact("unrelated-note", "description", "zara work log, unrelated"),
    ]);
    const afterEids = eidsOf(await after.recall(q()));
    // The property: `zara`'s presence is unchanged by the unrelated node (locality).
    expect(afterEids).toContain("zara");
    expect(afterEids.includes("zara")).toBe(beforeEids.includes("zara"));
  });

  it("prop KEYS are part of the searchable surface — a query naming only a prop key retrieves the node (mutation-check for the key surface)", async () => {
    const { repo } = makeRepo("d52r3-prop-key");
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("m/1", "metric"),
      nodePropFact("m/1", "employer", 4711),
    ]);
    // "employer" appears ONLY as a prop KEY (the value is the number 4711; eid `m/1`, kind `metric`).
    // With prop keys in the surface this matches; REMOVE prop keys from `recallSurfaceTerms` and this
    // returns [] — so this test fails under that mutation, which the round-2 suite did not.
    expect(eidsOf(await repo.recall({ text: "employer", k: 10 } as SpecRecallQuery))).toEqual(["m/1"]);
  });

  it("the exact prop-key relation anchors a natural question: `Zara employer` and `Where does Zara work?` are NOT [] (D-52 flagship regression)", async () => {
    const { repo } = makeRepo("d52r3-zara-relation");
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("zara", "person"),
      nodePropFact("zara", "name", "Zara"),
      nodePropFact("zara", "employer", "Acme Corp"),
    ]);
    // The query uses the exact prop KEY holding the answer ("employer"): matches {zara, employer} = 2.
    expect(eidsOf(await repo.recall({ text: "Zara employer", k: 10 } as SpecRecallQuery))).toContain("zara");
    // The natural multi-term question: the entity IS in the graph and must not vanish (round-2 bug).
    expect(eidsOf(await repo.recall({ text: "Where does Zara work?", k: 10 } as SpecRecallQuery))).toContain(
      "zara",
    );
  });
});

describe("D-52 round-3 — the text path is asOf-lensed: seed set AND ranked order differ across two instants", () => {
  it("a node whose matching prop is only valid from T1 joins the seed set — and outranks the always-valid node — only at asOf T1", async () => {
    const T1 = 1_000;
    // `early` exists from 0 and always matches {ledger} (1 term).
    const earlyExist = makeWellFormedFact({ target: { kind: "node", eid: "early", nodeKind: "record" } });
    earlyExist.value = true;
    earlyExist.validFrom = 0;
    earlyExist.validTo = null;
    const earlyProp = makeWellFormedFact({ target: { kind: "node-prop", eid: "early", prop: "tag" } });
    earlyProp.value = "ledger";
    earlyProp.validFrom = 0;
    earlyProp.validTo = null;
    // `late` exists only from T1 and matches {ledger, settlement} (2 terms) — but not before T1.
    const lateExist = makeWellFormedFact({ target: { kind: "node", eid: "late", nodeKind: "record" } });
    lateExist.value = true;
    lateExist.validFrom = T1;
    lateExist.validTo = null;
    const lateProp = makeWellFormedFact({ target: { kind: "node-prop", eid: "late", prop: "tag" } });
    lateProp.value = "ledger settlement";
    lateProp.validFrom = T1;
    lateProp.validTo = null;

    const { repo } = makeRepo("d52r3-asof");
    track(repo);
    await ingestFacts(repo, [earlyExist, earlyProp, lateExist, lateProp]);

    const query = { text: "ledger settlement", k: 10 } as SpecRecallQuery;

    // BEFORE T1: only `early` is live-visible, so the SEED SET is {early}.
    const atEarly = await repo.recall({ ...query, asOf: { validTime: 500 } } as SpecRecallQuery);
    expect(eidsOf(atEarly)).toEqual(["early"]);

    // AT T1: `late` becomes visible and matches 2 distinct terms, so the SEED SET grows to {late,
    // early} AND the ranked ORDER differs — `late` (2) now outranks `early` (1).
    const atLate = await repo.recall({ ...query, asOf: { validTime: T1 } } as SpecRecallQuery);
    expect(eidsOf(atLate)).toEqual(["late", "early"]);
  });
});
