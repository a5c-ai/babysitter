/**
 * graph-qa.test.ts — FROZEN, spec-driven, PRE-implementation ACCEPTANCE tests for the graph-QA
 * microagent core `answerQuestion` (design source of truth: packages/kip-sdk/docs/design/
 * kip-graph-qa.md §8, the 15 numbered acceptance criteria). One `describe` per criterion; each test
 * name cites the exact §8 item.
 *
 * WHAT IS UNDER TEST. `answerQuestion(input, { repo, synthesize })` is the READ-ONLY
 * retrieval→synthesis core the bundled `kip-graph-qa.mjs` entrypoint / `kip ask` / `kip_ask` dispatch
 * to (kip-graph-qa.md §1/§3/§7). It uses ONLY the kip read seams (recall/query/asOf/getNode/getEdge/
 * provenanceOf), authors NOTHING (INV-A1), and abstains rather than fabricates (N5). `answerQuestion`
 * is an unimplemented throwing stub this round (src/graph-qa/index.ts:
 * `throw new Error("unimplemented: answerQuestion …")`), so every test that awaits it FAILS on a real
 * assertion (a rejected promise where a `GraphQaResult` was expected), never on a type/syntax/import
 * error — the established frozen-test precedent (see m4-retrieval.test.ts's header).
 *
 * HOW THE MODEL SYNTHESIS IS MADE DETERMINISTIC (kip-graph-qa.md §0.1/§5.3 accelerator boundary). The
 * single non-deterministic step — prompting `runtime.model` to write prose + pick per-claim citations
 * (§3.3) — is INJECTED as `synthesize`. The suite injects a DETERMINISTIC scripted synthesizer that
 * reads the assembled read-only context (`{ question, facts }`, each fact bound to its signed
 * `factId`) and returns a fixed answer + citations drawn from that context. The retrieval half is a
 * pure read over `proj`, so the whole PIPELINE is byte-testable while the model boundary stays
 * recall-/citation-based. No live model is ever in the loop.
 *
 * HOW RETRIEVAL IS MADE DETERMINISTIC WITHOUT AN EMBEDDING. `answerQuestion`'s input carries no query
 * vector (kip-graph-qa.md §2 inputSchema = `{ question, asOf?, scope? }`), so the vector half never
 * runs here. The ONLY embedding-free, deterministic candidate-seed the kip read surface exposes is the
 * §5.1 `text` GRAPH SEED: `recall({ text })` surfaces a node whose `content` cell value === the query
 * text EXACTLY (kip-repo.ts computeRecall — the same G0 text-seed m4-retrieval.test.ts pins). So each
 * fixture seeds the SUBJECT entity with a `content` prop equal to the exact `question`, making the
 * retrieval envelope a deterministic function of the as-of fact set (a production host supplies a
 * query embedding instead; that path is out of this suite's scope, §8 preamble).
 *
 * The graph fixtures are built with `assertFact` (the M0 mint-then-ingest authoring path) except the
 * conflicted-cell fixture (§8.9), which needs two DISTINCT candidate `factId`s and so is built from
 * two overlapping `supersede` facts via `ingest` (the inv-4-m2-surface pattern) — the only substrate
 * shape that yields a two-candidate `kip:conflict` segment (proj.ts detectConflict).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KipRepo } from "../index";
import type { AsOf, EID, Fact, Provenance, PropValue } from "../index";
import {
  ABSTENTION_ANSWER,
  answerQuestion,
  type AnswerQuestionDeps,
  type GraphQaResult,
  type SynthesisContext,
  type SynthesisOutput,
} from "../graph-qa";
import { cloneFact, makeWellFormedFact } from "./conformance/fixtures";

// ────────────────────────────────────────────────────────────────────────────────────────────────
// Repo lifecycle + fixture authoring helpers.
// ────────────────────────────────────────────────────────────────────────────────────────────────
const open: KipRepo[] = [];
let replicaCounter = 0;
function freshRepo(label: string): KipRepo {
  replicaCounter += 1;
  const repo = new KipRepo({ replicaId: `graph-qa-${label}-${replicaCounter}-${Date.now()}` });
  open.push(repo);
  return repo;
}
afterEach(() => {
  while (open.length > 0) open.pop()?.close();
});

/** Placeholder provenance — `mintFact` overwrites signature/fpr/signedFields with the repo's own real
 *  keypair (see fixtures-m5.ts). These fields exist only to satisfy the `Provenance` type. */
function fixtureProvenance(): Provenance {
  return { author: "graph-qa-fixture", signature: "sig:placeholder", publicKeyFingerprint: "fpr", signedFields: [] };
}

/** Assert a node-existence fact; returns its signed `FactId`. */
async function assertNode(repo: KipRepo, eid: EID, nodeKind: string, opts?: { validFrom?: number }): Promise<string> {
  const r = await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "node", eid, nodeKind },
    value: true,
    validFrom: opts?.validFrom ?? 0,
    validTo: null,
    replicaId: "author",
    provenance: fixtureProvenance(),
  });
  return r.id;
}

/** Assert a node-prop fact (the observable value carrier — reads back via `getNode(eid).props`);
 *  returns its signed `FactId` (the `PropCell` value segment's `assertedBy`). */
async function assertProp(
  repo: KipRepo,
  eid: EID,
  prop: string,
  value: PropValue,
  opts?: { validFrom?: number },
): Promise<string> {
  const r = await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "node-prop", eid, prop },
    value,
    validFrom: opts?.validFrom ?? 0,
    validTo: null,
    replicaId: "author",
    provenance: fixtureProvenance(),
  });
  return r.id;
}

/** Assert an edge-existence fact; returns its signed `FactId` (the edge-backing fact, §3.2/§4). */
async function assertEdge(
  repo: KipRepo,
  eid: EID,
  edgeKind: string,
  from: EID,
  to: EID,
  opts?: { validFrom?: number },
): Promise<string> {
  const r = await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "edge", eid, edgeKind, from, to },
    value: true,
    validFrom: opts?.validFrom ?? 0,
    validTo: null,
    replicaId: "author",
    provenance: fixtureProvenance(),
  });
  return r.id;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────
// The scripted (deterministic) model-synthesis seam. Each test builds a closure that reads the
// assembled context and returns a fixed answer + citations DRAWN FROM the context's facts — the
// citation `factId`s are exactly the ids the retrieval half bound, so the assertions genuinely verify
// the pipeline retrieved and bound the right signed facts.
// ────────────────────────────────────────────────────────────────────────────────────────────────
type Scripted = (ctx: SynthesisContext) => SynthesisOutput;

/** Wrap a scripted synthesizer in a spy so a test can assert it was (or was NOT — §8.4/§8.5) called. */
function spySynth(fn: Scripted): AnswerQuestionDeps["synthesize"] & { mock: ReturnType<typeof vi.fn> } {
  const m = vi.fn(fn);
  return Object.assign((ctx: SynthesisContext) => m(ctx), { mock: m }) as never;
}

function edgeFactOf(ctx: SynthesisContext, edgeKind: string) {
  return ctx.facts.find((f) => f.kind === "edge" && f.edgeKind === edgeKind);
}
function propValueOf(ctx: SynthesisContext, eid: string, prop: string): PropValue | undefined {
  return ctx.facts.find((f) => f.kind === "node-prop" && f.eid === eid && f.prop === prop)?.value;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.1 — Happy-path answer cites the backing fact.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.1 — happy-path answer names the company and cites the employed_by edge fact", () => {
  const QUESTION = "Where does Tal work?";
  async function seed(repo: KipRepo): Promise<{ Fe: string }> {
    await assertNode(repo, "person/tal", "person");
    await assertProp(repo, "person/tal", "content", QUESTION); // §5.1 text-seed anchor
    await assertNode(repo, "org/a5c", "org");
    await assertProp(repo, "org/a5c", "content", "a5c");
    const Fe = await assertEdge(repo, "edge/tal-a5c", "employed_by", "person/tal", "org/a5c");
    return { Fe };
  }
  // The model reads the retrieved edge + its target org's label and answers, citing the edge fact.
  const synth: Scripted = (ctx) => {
    const edge = edgeFactOf(ctx, "employed_by");
    const label = (edge && (propValueOf(ctx, String(edge.to), "content") ?? edge.to)) ?? "";
    return {
      answer: `Tal works at ${String(label)}.`,
      citations: edge ? [{ factId: edge.factId, eid: edge.eid, edgeKind: "employed_by", quote: String(label) }] : [],
    };
  };

  it("returns abstained===false, an answer naming a5c, and a citation whose factId === the employed_by edge fact F_e, with F_e ∈ usedFacts", async () => {
    const repo = freshRepo("happy");
    const { Fe } = await seed(repo);
    const result = await answerQuestion({ question: QUESTION }, { repo, synthesize: synth });
    expect(result.abstained).toBe(false);
    expect(result.answer).toContain("a5c");
    const cited = result.citations.find((c) => c.factId === Fe);
    expect(cited).toBeDefined();
    expect(result.usedFacts).toContain(Fe);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.2 — Every cited factId is in the retrieved envelope.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.2 — for any non-abstaining answer, every citation.factId ∈ usedFacts (§3.4)", () => {
  const QUESTION = "Where does Tal work?";
  const synth: Scripted = (ctx) => {
    const edge = edgeFactOf(ctx, "employed_by");
    return { answer: "Tal works at a5c.", citations: edge ? [{ factId: edge.factId, edgeKind: "employed_by" }] : [] };
  };
  it("citations.every(c => usedFacts.includes(c.factId)) is true", async () => {
    const repo = freshRepo("envelope");
    await assertNode(repo, "person/tal", "person");
    await assertProp(repo, "person/tal", "content", QUESTION);
    await assertNode(repo, "org/a5c", "org");
    await assertProp(repo, "org/a5c", "content", "a5c");
    await assertEdge(repo, "edge/tal-a5c", "employed_by", "person/tal", "org/a5c");
    const result = await answerQuestion({ question: QUESTION }, { repo, synthesize: synth });
    expect(result.abstained).toBe(false);
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.citations.every((c) => result.usedFacts.includes(c.factId))).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.3 — No uncited factual claim.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.3 — every factual claim in the answer maps to ≥1 citation with a backing factId", () => {
  const QUESTION = "Where does Tal work?";
  // The scripted synthesizer makes exactly ONE factual claim (Tal↔a5c) and binds it to the edge fact —
  // no claim is emitted without a backing factId.
  const synth: Scripted = (ctx) => {
    const edge = edgeFactOf(ctx, "employed_by");
    return {
      answer: "Tal works at a5c.",
      citations: edge ? [{ factId: edge.factId, edgeKind: "employed_by", quote: "Tal works at a5c" }] : [],
    };
  };
  it("the happy-path answer has ≥1 citation and every citation carries a non-empty backing factId that is in usedFacts", async () => {
    const repo = freshRepo("cited");
    const Fe0 = await (async () => {
      await assertNode(repo, "person/tal", "person");
      await assertProp(repo, "person/tal", "content", QUESTION);
      await assertNode(repo, "org/a5c", "org");
      await assertProp(repo, "org/a5c", "content", "a5c");
      return assertEdge(repo, "edge/tal-a5c", "employed_by", "person/tal", "org/a5c");
    })();
    const result = await answerQuestion({ question: QUESTION }, { repo, synthesize: synth });
    expect(result.citations.length).toBeGreaterThanOrEqual(1);
    expect(result.citations.every((c) => typeof c.factId === "string" && c.factId.length > 0)).toBe(true);
    expect(result.citations.every((c) => result.usedFacts.includes(c.factId))).toBe(true);
    expect(result.citations.some((c) => c.factId === Fe0)).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.4 — Abstention on an entity with no facts (never fabricates, never calls the model).
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.4 — asking about an entity with ZERO covering facts abstains and fabricates nothing", () => {
  it("returns abstained===true, answer===canonical phrase, empty citations/usedFacts, and does NOT invoke synthesize", async () => {
    const repo = freshRepo("abstain-entity");
    // A populated graph — but NOTHING about the asked subject ('Zara').
    await assertNode(repo, "person/tal", "person");
    await assertProp(repo, "person/tal", "content", "Where does Tal work?");
    const synth = spySynth(() => {
      throw new Error("synthesize MUST NOT be called on empty retrieval (§6.1)");
    });
    const result = await answerQuestion({ question: "Where does Zara work?" }, { repo, synthesize: synth });
    expect(result.abstained).toBe(true);
    expect(result.answer).toBe(ABSTENTION_ANSWER);
    expect(result.citations).toHaveLength(0);
    expect(result.usedFacts).toHaveLength(0);
    expect(synth.mock).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.5 — Abstention on an empty graph.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.5 — against a graph with NO facts, any question abstains (recall [] is never synthesized)", () => {
  it("abstains with the canonical phrase and never calls synthesize", async () => {
    const repo = freshRepo("abstain-empty");
    const synth = spySynth(() => {
      throw new Error("synthesize MUST NOT be called against an empty graph (§6.1)");
    });
    const result = await answerQuestion({ question: "Where does Tal work?" }, { repo, synthesize: synth });
    expect(result.abstained).toBe(true);
    expect(result.answer).toBe(ABSTENTION_ANSWER);
    expect(result.citations).toHaveLength(0);
    expect(result.usedFacts).toHaveLength(0);
    expect(synth.mock).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.6 — Node-property question cites the PropCell's assertedBy.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.6 — a node-prop question cites the prop fact F_p (factId + prop) backing the value", () => {
  const QUESTION = "What is Tal's title?";
  const synth: Scripted = (ctx) => {
    const title = ctx.facts.find((f) => f.kind === "node-prop" && f.prop === "title");
    return {
      answer: `Tal's title is ${String(title?.value ?? "")}.`,
      citations: title ? [{ factId: title.factId, eid: title.eid, prop: "title", quote: String(title.value) }] : [],
    };
  };
  it("returns an answer containing 'founder' and a citation with factId===F_p and prop==='title'", async () => {
    const repo = freshRepo("prop");
    await assertNode(repo, "person/tal", "person");
    await assertProp(repo, "person/tal", "content", QUESTION);
    const Fp = await assertProp(repo, "person/tal", "title", "founder");

    // Cross-check the binding independently: the PropCell value segment's `assertedBy` IS F_p (§3.2).
    const node = await repo.getNode("person/tal");
    const seg = node?.props.title?.segments.find((s) => s.kind === "value");
    expect(seg && "assertedBy" in seg ? seg.assertedBy : undefined).toBe(Fp);

    const result = await answerQuestion({ question: QUESTION }, { repo, synthesize: synth });
    expect(result.abstained).toBe(false);
    expect(result.answer).toContain("founder");
    const cited = result.citations.find((c) => c.factId === Fp);
    expect(cited).toBeDefined();
    expect(cited?.prop).toBe("title");
    expect(result.usedFacts).toContain(Fp);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.7 — Nothing is authored (INV-A1): zero write-seam calls + byte-identical fact-set digest.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.7 — an ask authors NOTHING (INV-A1): zero write-seam calls, frontier digest byte-identical", () => {
  const QUESTION = "Where does Tal work?";
  const WRITE_SEAMS = [
    "assertFact",
    "retractFact",
    "putNode",
    "putEdge",
    "registerFunctionality",
    "runContextualQuery",
    "runAcquisition",
    "learn",
  ] as const;
  const synth: Scripted = (ctx) => {
    const edge = edgeFactOf(ctx, "employed_by");
    return { answer: "Tal works at a5c.", citations: edge ? [{ factId: edge.factId, edgeKind: "employed_by" }] : [] };
  };

  async function digest(repo: KipRepo): Promise<string> {
    const ref = await repo.pin({ tenant: "t" }, { validTime: 1_000_000_000 });
    return ref.factSetDigest;
  }

  it("HAPPY PATH: spies on every write seam record zero calls and the fact-set digest is unchanged", async () => {
    const repo = freshRepo("inv-a1-happy");
    await assertNode(repo, "person/tal", "person");
    await assertProp(repo, "person/tal", "content", QUESTION);
    await assertNode(repo, "org/a5c", "org");
    await assertProp(repo, "org/a5c", "content", "a5c");
    await assertEdge(repo, "edge/tal-a5c", "employed_by", "person/tal", "org/a5c");

    const before = await digest(repo);
    const spies = WRITE_SEAMS.map((m) => vi.spyOn(repo, m));

    const result = await answerQuestion({ question: QUESTION }, { repo, synthesize: synth });
    expect(result.abstained).toBe(false);

    for (const s of spies) expect(s).not.toHaveBeenCalled();
    const after = await digest(repo);
    expect(after).toBe(before);
  });

  it("ABSTENTION PATH: an abstaining ask likewise authors nothing (zero write calls, unchanged digest)", async () => {
    const repo = freshRepo("inv-a1-abstain");
    await assertNode(repo, "person/tal", "person");
    await assertProp(repo, "person/tal", "content", QUESTION);

    const before = await digest(repo);
    const spies = WRITE_SEAMS.map((m) => vi.spyOn(repo, m));

    const result = await answerQuestion({ question: "Where does Nobody work?" }, {
      repo,
      synthesize: spySynth(() => ({ answer: "unused", citations: [] })),
    });
    expect(result.abstained).toBe(true);

    for (const s of spies) expect(s).not.toHaveBeenCalled();
    const after = await digest(repo);
    expect(after).toBe(before);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.8 — Hallucinated citation is dropped (§3.4).
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.8 — a cited factId not in usedFacts is DROPPED before return (§3.4)", () => {
  const QUESTION = "Where does Tal work?";
  const BOGUS = "cid-hallucinated-not-in-envelope";
  // The model returns BOTH the real edge citation AND a bogus factId absent from the retrieved set.
  const synth: Scripted = (ctx) => {
    const edge = edgeFactOf(ctx, "employed_by");
    return {
      answer: "Tal works at a5c.",
      citations: [
        ...(edge ? [{ factId: edge.factId, edgeKind: "employed_by" }] : []),
        { factId: BOGUS, quote: "fabricated" },
      ],
    };
  };
  it("the bogus factId does NOT appear in the returned citations; the real edge citation survives", async () => {
    const repo = freshRepo("hallucination");
    await assertNode(repo, "person/tal", "person");
    await assertProp(repo, "person/tal", "content", QUESTION);
    await assertNode(repo, "org/a5c", "org");
    await assertProp(repo, "org/a5c", "content", "a5c");
    const Fe = await assertEdge(repo, "edge/tal-a5c", "employed_by", "person/tal", "org/a5c");

    const result = await answerQuestion({ question: QUESTION }, { repo, synthesize: synth });
    expect(result.citations.some((c) => c.factId === BOGUS)).toBe(false);
    expect(result.usedFacts).not.toContain(BOGUS);
    expect(result.citations.some((c) => c.factId === Fe)).toBe(true);
    expect(result.citations.every((c) => result.usedFacts.includes(c.factId))).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.9 — Conflicted evidence is surfaced, not resolved (cites BOTH candidates).
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.9 — a conflicted cell surfaces the contradiction and cites BOTH candidate factIds (§6.3)", () => {
  const QUESTION = "What is Tal's status?";
  const replicaId = "conflict-author";

  /** Two overlapping `supersede` facts over one base assert with DIFFERENT values ⇒ a `kip:conflict`
   *  segment whose candidates are the two DISTINCT supersede ids (proj.ts detectConflict). */
  function makeSupersede(id: string, seq: number, value: PropValue, baseId: string): Fact {
    const f = makeWellFormedFact({
      replicaId,
      seq,
      id,
      target: { kind: "node-prop", eid: "person/tal", prop: "status" },
    });
    f.type = "supersede";
    f.value = value;
    f.validFrom = 0;
    f.validTo = null;
    f.supersedes = [baseId];
    return f;
  }

  async function seedConflict(repo: KipRepo): Promise<{ Fa: string; Fb: string }> {
    const existence = makeWellFormedFact({ replicaId, seq: 0, id: "conf-exist", target: { kind: "node", eid: "person/tal", nodeKind: "person" } });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;
    const content = makeWellFormedFact({ replicaId, seq: 1, id: "conf-content", target: { kind: "node-prop", eid: "person/tal", prop: "content" } });
    content.value = QUESTION; // §5.1 text-seed anchor
    content.validFrom = 0;
    content.validTo = null;
    const base = makeWellFormedFact({ replicaId, seq: 2, id: "conf-base", target: { kind: "node-prop", eid: "person/tal", prop: "status" } });
    base.value = "pending";
    base.validFrom = 0;
    base.validTo = null;
    const superA = makeSupersede("conf-super-a", 3, "active", "conf-base");
    const superB = makeSupersede("conf-super-b", 4, "terminated", "conf-base");
    for (const f of [existence, content, base, superA, superB]) {
      // eslint-disable-next-line no-await-in-loop -- sequential ingest mirrors the m4/inv-4 rig
      await repo.ingest(cloneFact(f));
    }
    return { Fa: "conf-super-a", Fb: "conf-super-b" };
  }

  // The model, seeing a conflicted datum with two candidates, surfaces the contradiction citing BOTH.
  const synth: Scripted = (ctx) => {
    const conf = ctx.facts.filter((f) => f.conflicted === true);
    const candidates = [...new Set(conf.flatMap((f) => f.candidates ?? [f.factId]))];
    return {
      answer: "Tal's status is contested: the graph holds conflicting facts (active vs terminated).",
      citations: candidates.map((factId) => ({ factId, eid: "person/tal", prop: "status" })),
    };
  };

  it("citations include BOTH F_a and F_b (both candidates present, never a single-sided answer), both in usedFacts", async () => {
    const repo = freshRepo("conflict");
    const { Fa, Fb } = await seedConflict(repo);

    // Cross-check the substrate genuinely surfaces a two-candidate conflict on the status cell.
    const node = await repo.getNode("person/tal");
    const conflictSeg = node?.props.status?.segments.find((s) => s.kind === "conflict");
    expect(conflictSeg && "candidates" in conflictSeg ? [...conflictSeg.candidates].sort() : []).toEqual([Fa, Fb].sort());

    const result = await answerQuestion({ question: QUESTION }, { repo, synthesize: synth });
    expect(result.abstained).toBe(false);
    expect(result.citations.some((c) => c.factId === Fa)).toBe(true);
    expect(result.citations.some((c) => c.factId === Fb)).toBe(true);
    expect(result.usedFacts).toContain(Fa);
    expect(result.usedFacts).toContain(Fb);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.10 — Pinned asOf gives a reproducible retrieved set (R5).
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.10 — two asks at the SAME pinned asOf produce EQUAL usedFacts (order-insensitive), even if prose differs", () => {
  const QUESTION = "Where does Tal work?";
  const PINNED: AsOf = { validTime: 5_000 };
  it("usedFacts is set-equal across two runs at the same pinned asOf (retrieval envelope is deterministic under R5)", async () => {
    const repo = freshRepo("reproducible");
    await assertNode(repo, "person/tal", "person");
    await assertProp(repo, "person/tal", "content", QUESTION);
    await assertNode(repo, "org/a5c", "org");
    await assertProp(repo, "org/a5c", "content", "a5c");
    await assertEdge(repo, "edge/tal-a5c", "employed_by", "person/tal", "org/a5c");

    // Prose VARIES per call (the model is accelerator-class, §5.2), the envelope does not.
    let n = 0;
    const synth: Scripted = (ctx) => {
      n += 1;
      const edge = edgeFactOf(ctx, "employed_by");
      return { answer: `answer-variant-${n}`, citations: edge ? [{ factId: edge.factId, edgeKind: "employed_by" }] : [] };
    };
    const first = await answerQuestion({ question: QUESTION, asOf: PINNED }, { repo, synthesize: synth });
    const second = await answerQuestion({ question: QUESTION, asOf: PINNED }, { repo, synthesize: synth });
    expect(first.abstained).toBe(false);
    expect(second.abstained).toBe(false);
    expect([...first.usedFacts].sort()).toEqual([...second.usedFacts].sort());
    // The prose is allowed to differ — the criterion is set-equality of usedFacts, not string equality.
    expect(first.answer).not.toBe(second.answer);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.11 — asOf actually scopes retrieval (before/after validTime).
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.11 — asOf bounds the evidence: ask before validFrom abstains; after validFrom cites F_e", () => {
  const QUESTION = "Where does Tal work?";
  const T1 = 1_000; // the whole subject becomes valid at T1
  const synth: Scripted = (ctx) => {
    const edge = edgeFactOf(ctx, "employed_by");
    return { answer: "Tal works at a5c.", citations: edge ? [{ factId: edge.factId, edgeKind: "employed_by" }] : [] };
  };
  async function seedAtT1(repo: KipRepo): Promise<string> {
    await assertNode(repo, "person/tal", "person", { validFrom: T1 });
    await assertProp(repo, "person/tal", "content", QUESTION, { validFrom: T1 });
    await assertNode(repo, "org/a5c", "org", { validFrom: T1 });
    await assertProp(repo, "org/a5c", "content", "a5c", { validFrom: T1 });
    return assertEdge(repo, "edge/tal-a5c", "employed_by", "person/tal", "org/a5c", { validFrom: T1 });
  }
  it("asOf = T0 (< T1) abstains — the facts are not yet valid", async () => {
    const repo = freshRepo("asof-before");
    await seedAtT1(repo);
    const result = await answerQuestion({ question: QUESTION, asOf: { validTime: 0 } }, {
      repo,
      synthesize: spySynth(synth),
    });
    expect(result.abstained).toBe(true);
    expect(result.answer).toBe(ABSTENTION_ANSWER);
    expect(result.usedFacts).toHaveLength(0);
  });
  it("asOf = T2 (> T1) cites F_e — the same question against the now-valid fact set", async () => {
    const repo = freshRepo("asof-after");
    const Fe = await seedAtT1(repo);
    const result = await answerQuestion({ question: QUESTION, asOf: { validTime: T1 + 1_000 } }, { repo, synthesize: synth });
    expect(result.abstained).toBe(false);
    expect(result.citations.some((c) => c.factId === Fe)).toBe(true);
    expect(result.usedFacts).toContain(Fe);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.12 — scope isolates tenants.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.12 — scope isolates tenants: scope.tenant B abstains, scope.tenant A cites F_e (no cross-tenant leak)", () => {
  const QUESTION = "Where does Tal work?";
  const synth: Scripted = (ctx) => {
    const edge = edgeFactOf(ctx, "employed_by");
    return { answer: "Tal works at a5c.", citations: edge ? [{ factId: edge.factId, edgeKind: "employed_by" }] : [] };
  };
  // Fixtures namespace the entity EIDs by tenant so a scoped read has a sound narrowing to apply.
  async function seedTenantA(repo: KipRepo): Promise<string> {
    await assertNode(repo, "A/person/tal", "person");
    await assertProp(repo, "A/person/tal", "content", QUESTION);
    await assertNode(repo, "A/org/a5c", "org");
    await assertProp(repo, "A/org/a5c", "content", "a5c");
    return assertEdge(repo, "A/edge/tal-a5c", "employed_by", "A/person/tal", "A/org/a5c");
  }
  it("scope.tenant === 'B' abstains — tenant A's F_e is not visible under tenant B", async () => {
    const repo = freshRepo("scope-b");
    await seedTenantA(repo);
    const result = await answerQuestion({ question: QUESTION, scope: { tenant: "B" } }, {
      repo,
      synthesize: spySynth(synth),
    });
    expect(result.abstained).toBe(true);
    expect(result.usedFacts).toHaveLength(0);
  });
  it("scope.tenant === 'A' cites F_e — the fact is visible within its own tenant", async () => {
    const repo = freshRepo("scope-a");
    const Fe = await seedTenantA(repo);
    const result = await answerQuestion({ question: QUESTION, scope: { tenant: "A" } }, { repo, synthesize: synth });
    expect(result.abstained).toBe(false);
    expect(result.citations.some((c) => c.factId === Fe)).toBe(true);
    expect(result.usedFacts).toContain(Fe);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.13 — Malformed input THROWS; abstention is DATA (the two-channel model, §6.5).
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.13 — a malformed invocation throws; a well-formed no-fact question abstains as DATA", () => {
  it("an invocation missing `question` rejects through the THROW channel (schema-mismatch / ERR_MALFORMED_INPUT)", async () => {
    const repo = freshRepo("malformed");
    // Missing required `question` — the input-rejection throw channel (§6.5). Asserted on the TYPED
    // error CODE, not a message substring (a generic error must NOT satisfy this — that would let the
    // unimplemented stub's own throw pass vacuously).
    await expect(
      answerQuestion({} as never, { repo, synthesize: spySynth(() => ({ answer: "x", citations: [] })) }),
    ).rejects.toMatchObject({ code: "ERR_MALFORMED_INPUT" });
  });
  it("a well-formed question with no supporting facts returns an abstention as DATA (does NOT throw)", async () => {
    const repo = freshRepo("abstain-data");
    const result: GraphQaResult = await answerQuestion({ question: "Where does Nobody work?" }, {
      repo,
      synthesize: spySynth(() => ({ answer: "x", citations: [] })),
    });
    expect(result.abstained).toBe(true);
    expect(result.answer).toBe(ABSTENTION_ANSWER);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.14 — Output validates against the manifest outputSchema.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.14 — every returned object satisfies the manifest outputSchema (required answer/citations/usedFacts; citations[i].factId required)", () => {
  const manifestPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "cli",
    "microagents",
    "graph-qa",
    "microagent.json",
  );
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { outputSchema: JsonSchema };

  it("the happy-path result validates against outputSchema", async () => {
    const QUESTION = "Where does Tal work?";
    const repo = freshRepo("schema-happy");
    await assertNode(repo, "person/tal", "person");
    await assertProp(repo, "person/tal", "content", QUESTION);
    await assertNode(repo, "org/a5c", "org");
    await assertProp(repo, "org/a5c", "content", "a5c");
    await assertEdge(repo, "edge/tal-a5c", "employed_by", "person/tal", "org/a5c");
    const synth: Scripted = (ctx) => {
      const edge = edgeFactOf(ctx, "employed_by");
      return { answer: "Tal works at a5c.", citations: edge ? [{ factId: edge.factId, edgeKind: "employed_by" }] : [] };
    };
    const result = await answerQuestion({ question: QUESTION }, { repo, synthesize: synth });
    expect(validateAgainstSchema(result, manifest.outputSchema)).toEqual([]);
  });

  it("the abstention result also validates against outputSchema", async () => {
    const repo = freshRepo("schema-abstain");
    const result = await answerQuestion({ question: "Where does Nobody work?" }, {
      repo,
      synthesize: spySynth(() => ({ answer: "x", citations: [] })),
    });
    expect(validateAgainstSchema(result, manifest.outputSchema)).toEqual([]);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// §8.15 — Multi-hop answer cites each hop.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("graph-qa §8.15 — a two-hop chain cites the FactId of BOTH traversed edges (each claim → its own signed fact)", () => {
  const QUESTION = "What city is Tal's employer based in?";
  async function seedChain(repo: KipRepo): Promise<{ Fe1: string; Fe2: string }> {
    await assertNode(repo, "person/tal", "person");
    await assertProp(repo, "person/tal", "content", QUESTION); // §5.1 text-seed anchor
    await assertNode(repo, "org/a5c", "org");
    await assertNode(repo, "city/tlv", "city");
    await assertProp(repo, "city/tlv", "content", "tlv");
    const Fe1 = await assertEdge(repo, "edge/tal-a5c", "employed_by", "person/tal", "org/a5c");
    const Fe2 = await assertEdge(repo, "edge/a5c-tlv", "headquartered_in", "org/a5c", "city/tlv");
    return { Fe1, Fe2 };
  }
  // The model follows both hops and cites each traversed edge.
  const synth: Scripted = (ctx) => {
    const hop1 = edgeFactOf(ctx, "employed_by");
    const hop2 = edgeFactOf(ctx, "headquartered_in");
    const city = propValueOf(ctx, String(hop2?.to ?? ""), "content") ?? hop2?.to ?? "";
    const citations = [] as SynthesisOutput["citations"];
    if (hop1) citations.push({ factId: hop1.factId, eid: hop1.eid, edgeKind: "employed_by" });
    if (hop2) citations.push({ factId: hop2.factId, eid: hop2.eid, edgeKind: "headquartered_in" });
    return { answer: `Tal's employer is based in ${String(city)}.`, citations };
  };
  it("returns an answer naming tlv whose citations include the FactIds of BOTH traversed edges", async () => {
    const repo = freshRepo("multihop");
    const { Fe1, Fe2 } = await seedChain(repo);
    const result = await answerQuestion({ question: QUESTION }, { repo, synthesize: synth });
    expect(result.abstained).toBe(false);
    expect(result.answer).toContain("tlv");
    expect(result.citations.some((c) => c.factId === Fe1)).toBe(true);
    expect(result.citations.some((c) => c.factId === Fe2)).toBe(true);
    expect(result.usedFacts).toContain(Fe1);
    expect(result.usedFacts).toContain(Fe2);
    expect(result.citations.every((c) => result.usedFacts.includes(c.factId))).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// A faithful, minimal JSON-schema validator for the manifest outputSchema (§8.14). Covers exactly the
// constructs kip-graph-qa.md §2's outputSchema uses: object/array/string/boolean types, `required`,
// `additionalProperties: false`, and `items`. Returns a list of violation paths ([] === valid).
// ────────────────────────────────────────────────────────────────────────────────────────────────
interface JsonSchema {
  type?: string;
  required?: string[];
  additionalProperties?: boolean;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
}
function validateAgainstSchema(value: unknown, schema: JsonSchema, path = "$"): string[] {
  const errors: string[] = [];
  const typeOk = (t: string | undefined): boolean => {
    switch (t) {
      case undefined:
        return true;
      case "object":
        return typeof value === "object" && value !== null && !Array.isArray(value);
      case "array":
        return Array.isArray(value);
      case "string":
        return typeof value === "string";
      case "boolean":
        return typeof value === "boolean";
      case "number":
        return typeof value === "number";
      default:
        return true;
    }
  };
  if (!typeOk(schema.type)) {
    errors.push(`${path}: expected type ${schema.type}, got ${Array.isArray(value) ? "array" : typeof value}`);
    return errors;
  }
  if (schema.type === "object" && typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    for (const req of schema.required ?? []) {
      if (!(req in obj)) errors.push(`${path}: missing required '${req}'`);
    }
    for (const [k, v] of Object.entries(obj)) {
      const propSchema = schema.properties?.[k];
      if (!propSchema) {
        if (schema.additionalProperties === false) errors.push(`${path}.${k}: additional property not allowed`);
        continue;
      }
      errors.push(...validateAgainstSchema(v, propSchema, `${path}.${k}`));
    }
  }
  if (schema.type === "array" && Array.isArray(value) && schema.items) {
    value.forEach((el, i) => errors.push(...validateAgainstSchema(el, schema.items as JsonSchema, `${path}[${i}]`)));
  }
  return errors;
}
