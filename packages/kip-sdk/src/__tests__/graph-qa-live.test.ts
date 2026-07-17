/**
 * graph-qa-live.test.ts — FROZEN, ADR-B8-driven, PRE-implementation tests for the **PRODUCTION**
 * graph-QA synthesizer (source of truth: `packages/kip-sdk/docs/70-decision-records-adr.md` → ADR-B8;
 * `docs/design/kip-graph-qa.md` §3.3 synthesis / §5 accelerator stance / §6.6 error channels;
 * `docs/30-active-knowledge-overview.md` §5.3 accelerator boundary; `docs/28-stack-integration.md`).
 *
 * WHAT IS UNDER TEST — AND WHAT IS NOT. `graph-qa.test.ts` already owns the read-only core
 * (`answerQuestion`: recall → bounded expand → hydrate → `FactId` binding → abstain-on-empty →
 * citation validation) against an INJECTED scripted synthesizer, and every existing suite keeps doing
 * exactly that. This file is about the ONE thing that suite deliberately does not touch: the
 * **production `synthesize`** that closes D-44. Today `gentyModelSynthesize` (`src/cli/ask.ts`) is an
 * unconditional throw, so the answer path can only ever exit 5. Per ADR-B8 the production default
 * becomes `harnessCliSynthesize` — spawning the already-authenticated `claude` CLI through
 * `node:child_process` (a Node BUILTIN: kip-sdk's dep set stays exactly `{isomorphic-git}`, the
 * lockfile is untouched, and no babysitter-sdk / genty / adapters module is imported, so the AC-1
 * boundary survives). Nothing here re-tests the pipeline; everything here tests the SEAM.
 *
 * EXPECTED-FAIL CONVENTION (identical to `graph-qa.test.ts` / `kip-cli.test.ts`). `harnessCliSynthesize`
 * / `parseHarnessCliResult` / `probeHarnessCli` / `resolveHarnessModel` exist on the real public
 * surface as TYPED, DOCUMENTED, throwing `unimplemented` stubs this round, so every test below fails
 * on a genuine ASSERTION (a thrown/rejected `unimplemented`, or a manifest value that is still the
 * one ADR-B8 flags) — never on a type/syntax/import error. They go green when the ADR-B8 body lands.
 *
 * THE ONE TEST THAT MATTERS MOST — the `is_error` trap (N5). The `claude -p --output-format json`
 * envelope reports `subtype:"success"` **even when `is_error:true`**: on auth failure it is literally
 * `{"subtype":"success","is_error":true,"result":"Not logged in · Please run /login"}`. An
 * implementation that gates on `subtype` would hand that string to the citation filter and emit it
 * **as an answer** with zero citations — the exact N5 fabrication this whole design exists to
 * prevent. The parser tests below run against the envelopes CAPTURED LIVE in the ADR-B8 research
 * (2026-07-17, claude 2.1.195), cost nothing, depend on no machine state, and are the regression
 * guard that matters: **gate on `exitCode` + `is_error`, never on `subtype`.**
 *
 * SPEND. Deterministic tests NEVER spawn a model — the `HarnessCliRunner` is injected. Exactly ONE
 * live ask exists (each costs ~$0.02-$0.045: the OAuth path forces ~20k-22k cache-creation tokens of
 * Claude Code system prompt before the question is even read, and `--bare` is empirically unusable
 * because it never reads OAuth). It is gated behind `KIP_ASK_LIVE=1` **and** the availability probe,
 * and reports `ctx.skip(reason)` — never a silent pass. The load-bearing rule from ADR-B8: **the probe
 * decides SKIP; everything after the probe decides PASS/FAIL** — once the probes pass, any model
 * failure FAILS, because catch-and-skip is the exact move that lets a real regression masquerade as
 * "environment not available" forever.
 *
 * Non-goal: this file adds NO runtime dependency and NEVER touches `package-lock.json`, and it does
 * not weaken, skip, or delete any existing test.
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { KipRepo, open } from "../index";
import type { EID, MicroagentManifest, Provenance, PropValue } from "../index";
import { ABSTENTION_ANSWER, answerQuestion } from "../graph-qa";
import type { RetrievedFact, SynthesisContext, SynthesisOutput } from "../graph-qa";
import {
  AskSynthesisUnavailableError,
  defaultDispatchMicroagent,
  harnessCliSynthesize,
  parseHarnessCliResult,
  probeHarnessCli,
  resolveHarnessModel,
  runAsk,
} from "../cli/ask";
import type { HarnessCliProbe, HarnessCliRequest, HarnessCliRun, HarnessCliRunner } from "../cli/ask";

// ════════════════════════════════════════════════════════════════════════════════════════════════
// CAPTURED ENVELOPES — verbatim transcripts from the ADR-B8 research (verified live 2026-07-17
// against claude 2.1.195). These are FIXTURES OF REALITY, not invented shapes: the parser is pinned
// against what the binary actually emitted.
// ════════════════════════════════════════════════════════════════════════════════════════════════

/** (A) Plain one-shot — `echo 'Reply with exactly the word: OK' | claude -p --output-format json
 *  --model haiku` → exit 0. NOTE: `result` is the BARE STRING "OK", which is NOT valid JSON — so for
 *  graph-QA (whose payload must be a JSON string) this envelope is a DISPATCH FAILURE at stage 3. */
const CAPTURED_PLAIN_SUCCESS_STDOUT =
  '{"type":"result","subtype":"success","is_error":false,"duration_ms":5459,"num_turns":1,' +
  '"result":"OK","stop_reason":"end_turn","total_cost_usd":0.0228476,"usage":{"input_tokens":9,' +
  '"cache_creation_input_tokens":10235,"cache_read_input_tokens":20286,"output_tokens":68}}';

/** (B) Structured output — the same call plus `--json-schema '{answer, citations[{factId}]}'` and
 *  `--disallowedTools 'Bash Edit Write Read Glob Grep WebFetch WebSearch'` → exit 0, and `result` is
 *  a JSON STRING carrying EXACTLY the `SynthesisOutput` contract (no prose-scraping). */
const CAPTURED_STRUCTURED_SUCCESS_STDOUT =
  '{"type":"result","subtype":"success","is_error":false,"duration_ms":7939,"num_turns":2,' +
  '"result":"{\\"answer\\":\\"The sky is blue.\\",\\"citations\\":[{\\"factId\\":\\"f1\\"}]}",' +
  '"stop_reason":"tool_use","total_cost_usd":0.04497}';

/** (C) THE TRAP — auth failure (captured via `--bare`, which disables OAuth) → exit 1. Read it
 *  carefully: `subtype` says **"success"** while `is_error` is **true**, and `result` is a HUMAN
 *  ERROR STRING. Gating on `subtype` emits "Not logged in · Please run /login" as an answer. */
const CAPTURED_AUTH_FAILURE_STDOUT =
  '{"type":"result","subtype":"success","is_error":true,"duration_ms":1204,"num_turns":1,' +
  '"result":"Not logged in · Please run /login","stop_reason":"end_turn","total_cost_usd":0}';

/** The exact prose the auth-failure envelope carries — the string that must NEVER surface as prose. */
const AUTH_FAILURE_PROSE = "Not logged in · Please run /login";

/** Re-render an envelope with overrides — used to isolate ONE gate signal at a time. */
function envelopeWith(over: Record<string, unknown>): string {
  return JSON.stringify({
    type: "result",
    subtype: "success",
    is_error: false,
    duration_ms: 7939,
    num_turns: 2,
    stop_reason: "tool_use",
    total_cost_usd: 0.04497,
    ...over,
  });
}

/** A well-formed structured envelope carrying `payload` as its (stringified) `result`. */
function structuredEnvelope(payload: unknown): string {
  return envelopeWith({ result: JSON.stringify(payload) });
}

/** A runner that always answers with `payload`, and records every request it was handed. */
function scriptedRunner(payload: unknown, over?: Partial<HarnessCliRun>) {
  const seen: HarnessCliRequest[] = [];
  const run: HarnessCliRunner = async (req) => {
    seen.push(req);
    return { exitCode: 0, stdout: structuredEnvelope(payload), ...over };
  };
  return { run, seen };
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// argv helpers — the spawn contract is asserted by FLAG LOOKUP, never by whole-array equality, so
// the implementation keeps ordering freedom while the load-bearing flags stay pinned.
// ════════════════════════════════════════════════════════════════════════════════════════════════

function flagValue(args: readonly string[], flag: string): string | undefined {
  const inline = args.find((a) => a.startsWith(`${flag}=`));
  if (inline !== undefined) return inline.slice(flag.length + 1);
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
}
function hasFlag(args: readonly string[], flag: string): boolean {
  return args.includes(flag) || args.some((a) => a.startsWith(`${flag}=`));
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// The bundled manifest (`src/cli/microagents/graph-qa/microagent.json`) — the REAL artifact `kip ask`
// resolves, read exactly as `graph-qa.test.ts` §8.14 reads it.
// ════════════════════════════════════════════════════════════════════════════════════════════════
const BUNDLED_MANIFEST_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "cli",
  "microagents",
  "graph-qa",
  "microagent.json",
);
const BUNDLED_MANIFEST = JSON.parse(readFileSync(BUNDLED_MANIFEST_PATH, "utf8")) as MicroagentManifest;

/** The sentinel the bundled manifest ships (`microagent.json:59`) — NOT a claude model id. */
const MODEL_SENTINEL = "kip-graph-qa-default";

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Fixtures — in-memory graphs for the deterministic seam tests (the `graph-qa.test.ts` idiom).
// ════════════════════════════════════════════════════════════════════════════════════════════════
const openRepos: KipRepo[] = [];
let replicaCounter = 0;
function freshRepo(label: string): KipRepo {
  replicaCounter += 1;
  const repo = new KipRepo({ replicaId: `graph-qa-live-${label}-${replicaCounter}-${Date.now()}` });
  openRepos.push(repo);
  return repo;
}
afterEach(() => {
  while (openRepos.length > 0) openRepos.pop()?.close();
});

function fixtureProvenance(): Provenance {
  return {
    author: "graph-qa-live-fixture",
    signature: "sig:placeholder",
    publicKeyFingerprint: "fpr",
    signedFields: [],
  };
}

async function assertNode(repo: KipRepo, eid: EID, nodeKind: string): Promise<string> {
  const r = await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "node", eid, nodeKind },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: "author",
    provenance: fixtureProvenance(),
  });
  return r.id;
}
async function assertProp(repo: KipRepo, eid: EID, prop: string, value: PropValue): Promise<string> {
  const r = await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "node-prop", eid, prop },
    value,
    validFrom: 0,
    validTo: null,
    replicaId: "author",
    provenance: fixtureProvenance(),
  });
  return r.id;
}
async function assertEdge(
  repo: KipRepo,
  eid: EID,
  edgeKind: string,
  from: EID,
  to: EID,
): Promise<string> {
  const r = await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "edge", eid, edgeKind, from, to },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: "author",
    provenance: fixtureProvenance(),
  });
  return r.id;
}

/** The §5.1 text graph-seed fixture the whole graph-QA suite uses: the subject node's `content` cell
 *  equals the exact question, so `recall({ text: question })` deterministically seeds retrieval. */
const QUESTION = "Where does Tal work?";
async function seedEmploymentGraph(repo: KipRepo): Promise<{ Fe: string; Fp: string }> {
  await assertNode(repo, "person/tal", "person");
  await assertProp(repo, "person/tal", "content", QUESTION);
  await assertNode(repo, "org/a5c", "org");
  const Fp = await assertProp(repo, "org/a5c", "content", "a5c");
  const Fe = await assertEdge(repo, "edge/tal-a5c", "employed_by", "person/tal", "org/a5c");
  return { Fe, Fp };
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 1. THE ENVELOPE PARSER — the critical safety rule. Deterministic, zero spend, zero machine state.
//    ADR-B8: "gate on `exitCode === 0 && is_error === false`. The gate MUST NOT read `env.subtype`."
// ════════════════════════════════════════════════════════════════════════════════════════════════
describe("ADR-B8 parser — the two-stage parse gates on exitCode + is_error, NEVER on subtype", () => {
  it("FIXTURE FIDELITY: the captured auth-failure envelope really does claim subtype:'success' while is_error is true (this is why subtype is unusable)", () => {
    const env = JSON.parse(CAPTURED_AUTH_FAILURE_STDOUT) as Record<string, unknown>;
    expect(env.subtype).toBe("success");
    expect(env.is_error).toBe(true);
    expect(env.result).toBe(AUTH_FAILURE_PROSE);
  });

  it("(a) the captured STRUCTURED-SUCCESS envelope (exit 0, is_error:false) parses to { answer, citations } — the exact SynthesisOutput contract", () => {
    const out: SynthesisOutput = parseHarnessCliResult({
      exitCode: 0,
      stdout: CAPTURED_STRUCTURED_SUCCESS_STDOUT,
    });
    expect(out.answer).toBe("The sky is blue.");
    expect(out.citations).toEqual([{ factId: "f1" }]);
  });

  it("(b) THE N5 GUARD: the captured auth-failure envelope is REJECTED as a dispatch failure — subtype:'success' does not save it", () => {
    const run: HarnessCliRun = { exitCode: 1, stdout: CAPTURED_AUTH_FAILURE_STDOUT };
    let thrown: unknown;
    let returned: SynthesisOutput | undefined;
    try {
      returned = parseHarnessCliResult(run);
    } catch (e) {
      thrown = e;
    }
    // It must fail on the DISPATCH-failure channel (→ exit 5 / ERR_ASK_DISPATCH_FAILED, §6.6)...
    expect(thrown).toBeInstanceOf(AskSynthesisUnavailableError);
    // ...and the CLI's error string must NEVER come back as an answer.
    expect(returned).toBeUndefined();
    expect(returned?.answer ?? "").not.toContain("Not logged in");
  });

  it("(b2) is_error:true is rejected EVEN AT exitCode 0 — proving the gate reads is_error and not the lying subtype", () => {
    const stdout = envelopeWith({ is_error: true, subtype: "success", result: AUTH_FAILURE_PROSE });
    expect(() => parseHarnessCliResult({ exitCode: 0, stdout })).toThrow(AskSynthesisUnavailableError);
  });

  it("(b3) an is_error:true envelope whose `result` is a WELL-FORMED payload is STILL rejected — is_error is authoritative over a parseable body", () => {
    const stdout = envelopeWith({
      is_error: true,
      result: JSON.stringify({ answer: "plausible prose", citations: [{ factId: "f1" }] }),
    });
    expect(() => parseHarnessCliResult({ exitCode: 0, stdout })).toThrow(AskSynthesisUnavailableError);
  });

  it("(c) a NON-ZERO exitCode is a dispatch failure even when the envelope and payload are perfectly well-formed", () => {
    expect(() =>
      parseHarnessCliResult({ exitCode: 1, stdout: CAPTURED_STRUCTURED_SUCCESS_STDOUT }),
    ).toThrow(AskSynthesisUnavailableError);
  });

  it("(d) malformed / non-JSON stdout is a dispatch failure (never scraped, never coerced)", () => {
    for (const stdout of ["", "   ", "claude: command not found", "<html>502 Bad Gateway</html>", "{oops"]) {
      expect(() => parseHarnessCliResult({ exitCode: 0, stdout })).toThrow(AskSynthesisUnavailableError);
    }
  });

  it("(e) an envelope whose `result` is not valid JSON is a dispatch failure — the CAPTURED plain-success envelope (result:'OK') is exactly this case", () => {
    expect(() =>
      parseHarnessCliResult({ exitCode: 0, stdout: CAPTURED_PLAIN_SUCCESS_STDOUT }),
    ).toThrow(AskSynthesisUnavailableError);
  });

  it("(f) a payload that parses but violates { answer: string, citations: [{ factId: string }] } is a dispatch failure", () => {
    const bad: unknown[] = [
      { citations: [{ factId: "f1" }] }, // no answer
      { answer: "prose" }, // no citations
      { answer: 42, citations: [] }, // answer not a string
      { answer: "prose", citations: "f1" }, // citations not an array
      { answer: "prose", citations: [{ eid: "org/a5c" }] }, // citation without factId
      { answer: "prose", citations: [{ factId: 7 }] }, // factId not a string
      "just a string",
      null,
    ];
    for (const payload of bad) {
      expect(() =>
        parseHarnessCliResult({ exitCode: 0, stdout: structuredEnvelope(payload) }),
      ).toThrow(AskSynthesisUnavailableError);
    }
  });

  it("(b-e2e) N5 END-TO-END: an auth-failure envelope makes the whole ask fail loud — no answer object, and 'Not logged in' never becomes prose", async () => {
    const repo = freshRepo("n5-e2e");
    await seedEmploymentGraph(repo);
    const synthesize = harnessCliSynthesize({
      model: "haiku",
      probe: () => ({ available: true }),
      run: async () => ({ exitCode: 1, stdout: CAPTURED_AUTH_FAILURE_STDOUT }),
    });
    const settled = await answerQuestion({ question: QUESTION }, { repo, synthesize }).then(
      (value) => ({ status: "resolved" as const, value }),
      (error: unknown) => ({ status: "rejected" as const, error }),
    );
    expect(settled.status).toBe("rejected");
    expect(settled.status === "rejected" ? settled.error : undefined).toBeInstanceOf(
      AskSynthesisUnavailableError,
    );
    // The thing that must never happen: the CLI's error text emitted as a grounded answer.
    expect(settled.status === "resolved" ? settled.value.answer : "").not.toContain("Not logged in");
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 2. PROMPT TRANSPORT — STDIN, never argv (the fact context is unbounded; Windows caps the command
//    line at ~32k). ADR-B8 deliberately diverges from adapters' `--print <prompt>` argv branch.
// ════════════════════════════════════════════════════════════════════════════════════════════════
describe("ADR-B8 transport — the rendered {question, facts} context goes on STDIN, never on argv", () => {
  /** A marker that can only reach the child by way of the FACT CONTEXT — so finding it in argv is
   *  proof the context was pushed onto the command line. */
  const FACT_MARKER = "kip-fact-context-marker-9f3a5c";
  const CONTEXT: SynthesisContext = {
    question: QUESTION,
    facts: [
      {
        factId: "cid-edge-fact-0001",
        eid: "edge/tal-a5c",
        kind: "edge",
        edgeKind: "employed_by",
        from: "person/tal",
        to: "org/a5c",
      },
      {
        factId: "cid-prop-fact-0002",
        eid: "org/a5c",
        kind: "node-prop",
        prop: "content",
        value: FACT_MARKER,
      },
    ] satisfies RetrievedFact[],
  };

  it("the context (question + fact text + factIds) is written to STDIN, and NO argv element carries any of it", async () => {
    const { run, seen } = scriptedRunner({ answer: "Tal works at a5c.", citations: [{ factId: "cid-edge-fact-0001" }] });
    const synthesize = harnessCliSynthesize({ model: "haiku", probe: () => ({ available: true }), run });

    await synthesize(CONTEXT);

    expect(seen).toHaveLength(1);
    const req = seen[0];
    // STDIN carries the whole read-only context.
    expect(req.stdin).toContain(QUESTION);
    expect(req.stdin).toContain(FACT_MARKER);
    expect(req.stdin).toContain("cid-edge-fact-0001");
    expect(req.stdin).toContain("cid-prop-fact-0002");
    // argv carries FLAGS ONLY — never the unbounded fact context (Windows ~32k argv limit).
    const argv = req.args.join(" ");
    expect(argv).not.toContain(FACT_MARKER);
    expect(argv).not.toContain(QUESTION);
    expect(argv).not.toContain("cid-edge-fact-0001");
    expect(argv).not.toContain("cid-prop-fact-0002");
  });

  it("the spawn contract: the `claude` binary, -p, --output-format json, --json-schema {answer,citations[{factId}]}, --disallowedTools, --max-turns, cwd=os.tmpdir()", async () => {
    const { run, seen } = scriptedRunner({ answer: "Tal works at a5c.", citations: [] });
    const synthesize = harnessCliSynthesize({ model: "haiku", probe: () => ({ available: true }), run });

    await synthesize(CONTEXT);

    const req = seen[0];
    expect(req.command).toBe("claude");
    expect(hasFlag(req.args, "-p")).toBe(true);
    expect(flagValue(req.args, "--output-format")).toBe("json");
    expect(flagValue(req.args, "--model")).toBe("haiku");
    expect(hasFlag(req.args, "--max-turns")).toBe(true);

    // Structured output — the schema IS the graph-QA output contract (no prose-scraping).
    const schemaArg = flagValue(req.args, "--json-schema");
    expect(schemaArg).toBeDefined();
    const schema = JSON.parse(String(schemaArg)) as {
      properties?: Record<string, unknown>;
      required?: string[];
    };
    expect(Object.keys(schema.properties ?? {}).sort()).toEqual(["answer", "citations"]);
    expect([...(schema.required ?? [])].sort()).toEqual(["answer", "citations"]);

    // Prompt-injection bounding (ADR-B8): a hostile fact must not be able to reach a tool even if it
    // persuades the model to try.
    const disallowed = flagValue(req.args, "--disallowedTools") ?? "";
    for (const tool of ["Bash", "Edit", "Write", "Read", "Glob", "Grep", "WebFetch", "WebSearch"]) {
      expect(disallowed).toContain(tool);
    }
    // cwd = tmpdir, NEVER repoDir: no CLAUDE.md auto-discovery from the target repo, no cwd-relative
    // reach (and it is why the ~20k-token probe cost is a floor, not a ceiling).
    expect(req.cwd).toBe(tmpdir());
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 3. INVARIANTS — safety is STRUCTURAL, not promised (ADR-B8 consequences; §5.3 accelerator boundary;
//    INV-A1; kip-graph-qa.md §3.4/§6.1).
// ════════════════════════════════════════════════════════════════════════════════════════════════
describe("ADR-B8 invariants — INV-A1 by construction and the §5.3 accelerator boundary", () => {
  it("INV-A1 BY CONSTRUCTION: synthesize is handed ONLY { question, facts } — no Repo handle, no write seam, nothing callable", async () => {
    const repo = freshRepo("inv-a1-shape");
    const { Fe } = await seedEmploymentGraph(repo);
    let seen: SynthesisContext | undefined;
    await answerQuestion(
      { question: QUESTION },
      {
        repo,
        synthesize: (ctx) => {
          seen = ctx;
          return { answer: "Tal works at a5c.", citations: [{ factId: Fe }] };
        },
      },
    );
    expect(seen).toBeDefined();
    // The context is EXACTLY the two documented keys — a Repo cannot arrive by another name.
    expect(Object.keys(seen as object).sort()).toEqual(["facts", "question"]);
    // Nothing reachable from the context is callable, so the model physically cannot write.
    for (const value of Object.values(seen as Record<string, unknown>)) {
      expect(typeof value).not.toBe("function");
    }
    for (const fact of (seen as SynthesisContext).facts) {
      for (const v of Object.values(fact as unknown as Record<string, unknown>)) {
        expect(typeof v).not.toBe("function");
      }
    }
    // The write seams are not even on the type of what synthesize receives.
    expect((seen as unknown as Record<string, unknown>).repo).toBeUndefined();
    expect((seen as unknown as Record<string, unknown>).assertFact).toBeUndefined();
  });

  it("ABSTENTION SHORT-CIRCUITS THE MODEL: an empty retrieval never spawns the CLI — a silent graph exits 0 at ZERO model spend", async () => {
    const repo = freshRepo("no-spend");
    await seedEmploymentGraph(repo);
    const run = vi.fn<HarnessCliRunner>();
    const synthesize = harnessCliSynthesize({ model: "haiku", probe: () => ({ available: true }), run });

    const result = await answerQuestion({ question: "Where does Nobody at all work?" }, { repo, synthesize });

    expect(result.abstained).toBe(true);
    expect(result.answer).toBe(ABSTENTION_ANSWER);
    expect(result.citations).toEqual([]);
    expect(result.usedFacts).toEqual([]);
    expect(run).not.toHaveBeenCalled(); // no process, no tokens, no dollars.
  });

  it("CITATIONS ARE FILTERED AGAINST usedFacts: a factId the live model invents never surfaces, while the real one survives", async () => {
    const repo = freshRepo("citation-filter");
    const { Fe } = await seedEmploymentGraph(repo);
    const BOGUS = "cid-hallucinated-not-in-envelope";
    const { run } = scriptedRunner({
      answer: "Tal works at a5c (and, allegedly, elsewhere).",
      citations: [{ factId: Fe }, { factId: BOGUS }],
    });
    const synthesize = harnessCliSynthesize({ model: "haiku", probe: () => ({ available: true }), run });

    const result = await answerQuestion({ question: QUESTION }, { repo, synthesize });

    expect(result.citations.map((c) => c.factId)).toContain(Fe);
    expect(result.citations.map((c) => c.factId)).not.toContain(BOGUS);
    expect(result.citations.every((c) => result.usedFacts.includes(c.factId))).toBe(true);
  });

  it("THE MODEL NEVER TOUCHES proj: across a fully synthesized ask the fact-set digest is byte-identical and every write seam records zero calls", async () => {
    const repo = freshRepo("accelerator-boundary");
    const { Fe } = await seedEmploymentGraph(repo);
    const digest = async (): Promise<string> =>
      (await repo.pin({ tenant: "t" }, { validTime: 1_000_000_000 })).factSetDigest;

    const before = await digest();
    const spies = (
      [
        "assertFact",
        "retractFact",
        "putNode",
        "putEdge",
        "registerFunctionality",
        "runContextualQuery",
        "runAcquisition",
        "learn",
      ] as const
    ).map((m) => vi.spyOn(repo, m));

    const { run } = scriptedRunner({ answer: "Tal works at a5c.", citations: [{ factId: Fe }] });
    const synthesize = harnessCliSynthesize({ model: "haiku", probe: () => ({ available: true }), run });
    const result = await answerQuestion({ question: QUESTION }, { repo, synthesize });

    expect(result.abstained).toBe(false);
    for (const s of spies) expect(s).not.toHaveBeenCalled();
    expect(await digest()).toBe(before); // the answer is accelerator-class prose; proj is untouched.
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 4. MODEL ALIAS — ADR-B8's flagged risk: `kip-graph-qa-default` is NOT a claude model id.
// ════════════════════════════════════════════════════════════════════════════════════════════════
describe("ADR-B8 model mapping — the `kip-graph-qa-default` sentinel must be mapped, never passed to --model", () => {
  it("the bundled manifest still ships the sentinel as runtime.model (the value that must be mapped)", () => {
    expect(BUNDLED_MANIFEST.runtime.model).toBe(MODEL_SENTINEL);
  });

  it("resolveHarnessModel maps the sentinel to a CONCRETE claude model id/alias", () => {
    const resolved = resolveHarnessModel(MODEL_SENTINEL);
    expect(typeof resolved).toBe("string");
    expect(resolved).not.toBe(MODEL_SENTINEL);
    expect(resolved.length).toBeGreaterThan(0);
    expect(resolved).toMatch(/^(haiku|sonnet|opus|claude-[\w.-]+)$/);
  });

  it("resolveHarnessModel maps an ABSENT model to the same concrete default (never an empty --model)", () => {
    expect(resolveHarnessModel(undefined)).toBe(resolveHarnessModel(MODEL_SENTINEL));
  });

  it("resolveHarnessModel passes an EXPLICIT `--model` override through untouched (kip ask --model)", () => {
    expect(resolveHarnessModel("sonnet")).toBe("sonnet");
    expect(resolveHarnessModel("claude-haiku-4-5")).toBe("claude-haiku-4-5");
  });

  it("the spawned argv NEVER carries the sentinel: dispatching the bundled manifest's model spawns a real model id", async () => {
    const { run, seen } = scriptedRunner({ answer: "a", citations: [] });
    const synthesize = harnessCliSynthesize({
      model: BUNDLED_MANIFEST.runtime.model,
      probe: () => ({ available: true }),
      run,
    });
    await synthesize({ question: QUESTION, facts: [{ factId: "f1", eid: "org/a5c", kind: "node-prop", prop: "content", value: "a5c" }] });
    expect(flagValue(seen[0].args, "--model")).not.toBe(MODEL_SENTINEL);
    expect(flagValue(seen[0].args, "--model")).toBe(resolveHarnessModel(MODEL_SENTINEL));
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 5. TIMEOUT — ADR-B8 flags the bundled `runtime.timeout: 30000` as likely too tight: ONE-fact live
//    probes took 5.5s and 7.9s, so a full fact set plus process startup could produce a spurious
//    exit-5 misread as "no model". `runAsk` maps `elapsedMs > effectiveTimeout` to a dispatch failure.
// ════════════════════════════════════════════════════════════════════════════════════════════════
describe("ADR-B8 timeout — a sane, configurable budget replaces the too-tight bundled 30s", () => {
  it("the bundled manifest's runtime.timeout is raised out of the spurious-exit-5 zone (>= 60s) and stays sane (<= 180s)", () => {
    expect(BUNDLED_MANIFEST.runtime.timeout).toBeGreaterThan(30_000);
    expect(BUNDLED_MANIFEST.runtime.timeout).toBeGreaterThanOrEqual(60_000);
    expect(BUNDLED_MANIFEST.runtime.timeout).toBeLessThanOrEqual(180_000);
  });

  it("the DEFAULT per-call spawn budget (no explicit timeoutMs) is >= 60s and sane (<= 180s)", async () => {
    const { run, seen } = scriptedRunner({ answer: "a", citations: [] });
    const synthesize = harnessCliSynthesize({ model: "haiku", probe: () => ({ available: true }), run });
    await synthesize({ question: QUESTION, facts: [{ factId: "f1", eid: "org/a5c", kind: "node-prop", prop: "content", value: "a5c" }] });
    expect(seen[0].timeoutMs).toBeGreaterThanOrEqual(60_000);
    expect(seen[0].timeoutMs).toBeLessThanOrEqual(180_000);
  });

  it("an explicit timeoutMs is CONFIGURABLE and reaches the spawn verbatim (the invocation timeout wins)", async () => {
    const { run, seen } = scriptedRunner({ answer: "a", citations: [] });
    const synthesize = harnessCliSynthesize({
      model: "haiku",
      timeoutMs: 90_000,
      probe: () => ({ available: true }),
      run,
    });
    await synthesize({ question: QUESTION, facts: [{ factId: "f1", eid: "org/a5c", kind: "node-prop", prop: "content", value: "a5c" }] });
    expect(seen[0].timeoutMs).toBe(90_000);
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 6. PROBE + SKIP SEMANTICS — "the probe decides SKIP; everything after the probe decides PASS/FAIL."
//    Both probes are unpaid: `claude --version` spends nothing, and the credential check is a stat.
// ════════════════════════════════════════════════════════════════════════════════════════════════

/** The live gate — the SINGLE source of truth for whether the one paid ask may run. It is a pure
 *  function of `{ env, probe }`, so the skip machinery itself is deterministically testable and the
 *  live test can never silently pass. */
interface LiveGate {
  run: boolean;
  reason?: string;
}
function resolveLiveGate(input: { env: NodeJS.ProcessEnv; probe: () => HarnessCliProbe }): LiveGate {
  const optIn = input.env.KIP_ASK_LIVE;
  if (!optIn || optIn === "0" || optIn === "false") {
    return {
      run: false,
      reason:
        "LIVE MODEL NOT REQUESTED: set KIP_ASK_LIVE=1 to run the ONE paid live synthesis test " +
        "(~$0.02-$0.045 per ask — the OAuth path forces ~20k-22k cache-creation tokens before the " +
        "question is read).",
    };
  }
  const probe = input.probe();
  if (!probe.available) return { run: false, reason: `LIVE MODEL UNAVAILABLE: ${probe.reason}` };
  return { run: true };
}

describe("ADR-B8 probe — availability is DETECTED, never promised (the adapters' authFiles pattern)", () => {
  it("binary on PATH (`claude --version` exit 0) + ANTHROPIC_API_KEY ⇒ available", () => {
    expect(
      probeHarnessCli({
        probeVersion: () => 0,
        env: { ANTHROPIC_API_KEY: "sk-ant-test" },
        credentialsExist: () => false,
      }),
    ).toEqual({ available: true });
  });

  it("binary on PATH + ~/.claude/.credentials.json present ⇒ available (the OAuth store the adapters resolve)", () => {
    expect(
      probeHarnessCli({ probeVersion: () => 0, env: {}, credentialsExist: () => true }),
    ).toEqual({ available: true });
  });

  it("`claude --version` non-zero (binary not on PATH) ⇒ UNAVAILABLE with a reason naming the binary — credentials do not rescue it", () => {
    const probe = probeHarnessCli({
      probeVersion: () => 127,
      env: { ANTHROPIC_API_KEY: "sk-ant-test" },
      credentialsExist: () => true,
    });
    expect(probe.available).toBe(false);
    expect(probe.available === false ? probe.reason : "").toMatch(/claude|PATH|--version/i);
  });

  it("no ANTHROPIC_API_KEY and no ~/.claude/.credentials.json ⇒ UNAVAILABLE with a reason naming the missing credential", () => {
    const probe = probeHarnessCli({ probeVersion: () => 0, env: {}, credentialsExist: () => false });
    expect(probe.available).toBe(false);
    expect(probe.available === false ? probe.reason : "").toMatch(
      /credential|ANTHROPIC_API_KEY|authenticat|login/i,
    );
  });

  it("an UNAVAILABLE probe degrades the PRODUCTION synthesizer to the existing loud exit-5 channel — never a guess, never a spawn (N5)", async () => {
    const run = vi.fn<HarnessCliRunner>();
    const synthesize = harnessCliSynthesize({
      model: "haiku",
      probe: () => ({ available: false, reason: "`claude` is not on PATH" }),
      run,
    });
    const settled = await Promise.resolve()
      .then(() => synthesize({ question: QUESTION, facts: [{ factId: "f1", eid: "org/a5c", kind: "node-prop", prop: "content", value: "a5c" }] }))
      .then(
        (value) => ({ status: "resolved" as const, value }),
        (error: unknown) => ({ status: "rejected" as const, error }),
      );
    expect(settled.status).toBe("rejected");
    expect(settled.status === "rejected" ? settled.error : undefined).toBeInstanceOf(
      AskSynthesisUnavailableError,
    );
    expect(run).not.toHaveBeenCalled();
  });
});

describe("ADR-B8 skip semantics — the gate decides SKIP-WITH-REASON; it never lets the live test pass silently", () => {
  const available = (): HarnessCliProbe => ({ available: true });

  it("KIP_ASK_LIVE unset ⇒ the live ask does NOT run, and the gate carries an explicit reason (a default test:sdk never spends)", () => {
    const gate = resolveLiveGate({ env: {}, probe: available });
    expect(gate.run).toBe(false);
    expect(gate.reason).toMatch(/KIP_ASK_LIVE/);
  });

  it("KIP_ASK_LIVE unset ⇒ the probe is NEVER consulted (no machine state is touched on the default path)", () => {
    const probe = vi.fn(available);
    resolveLiveGate({ env: {}, probe });
    expect(probe).not.toHaveBeenCalled();
  });

  it("KIP_ASK_LIVE=1 + an AVAILABLE probe ⇒ the live path is ENABLED (no reason, nothing to skip)", () => {
    const gate = resolveLiveGate({ env: { KIP_ASK_LIVE: "1" }, probe: available });
    expect(gate.run).toBe(true);
    expect(gate.reason).toBeUndefined();
  });

  it("KIP_ASK_LIVE=1 + an UNAVAILABLE probe ⇒ SKIP, and the skip reason carries the probe's own diagnosis", () => {
    const gate = resolveLiveGate({
      env: { KIP_ASK_LIVE: "1" },
      probe: () => ({ available: false, reason: "no ANTHROPIC_API_KEY and no ~/.claude/.credentials.json" }),
    });
    expect(gate.run).toBe(false);
    expect(gate.reason).toContain("no ANTHROPIC_API_KEY");
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 7. THE ONE LIVE E2E ASK — real graph, real `claude`, real money (~$0.02-$0.045). Gated behind
//    KIP_ASK_LIVE=1 AND the probe; it SKIPS with a reason when either is missing, and it FAILS (never
//    skips) once the probes pass. Asserts STRUCTURE only — the seam is non-deterministic by design
//    (§5, accelerator-class), so prose is never compared.
// ════════════════════════════════════════════════════════════════════════════════════════════════
describe("ADR-B8 LIVE — `kip ask` genuinely answers through the authenticated local harness CLI (D-44)", () => {
  const liveDirs: string[] = [];
  afterAll(() => {
    for (const dir of liveDirs.splice(0)) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        /* best-effort cleanup */
      }
    }
  });

  /** Seed a REAL on-disk kip repo (the substrate `kip ask` opens) with a tiny known graph. */
  async function seedLiveRepo(): Promise<{ dir: string; Fe: string; Fp: string }> {
    const dir = mkdtempSync(join(tmpdir(), "kip-ask-live-"));
    liveDirs.push(dir);
    const repo = await open({
      dir,
      replicaId: `kip-ask-live-${Date.now()}`,
      keyring: undefined,
      createIfMissing: true,
    });
    try {
      const seeded = await seedEmploymentGraph(repo);
      return { dir, ...seeded };
    } finally {
      repo.close();
    }
  }

  /** The fact-set digest of an on-disk repo, read through a fresh READ-ONLY handle (the §8.7 idiom). */
  async function factSetDigest(dir: string): Promise<string> {
    const repo = await open({
      dir,
      replicaId: "kip-ask-live-digest",
      keyring: {},
      createIfMissing: false,
    });
    try {
      return (await repo.pin({ tenant: "t" }, { validTime: 1_000_000_000 })).factSetDigest;
    } finally {
      repo.close();
    }
  }

  it(
    "ONE real ask over a seeded graph returns a NON-ABSTAINED answer whose citations are bound to real, signed factIds — and authors nothing",
    { timeout: 180_000 },
    async (ctx) => {
      // ── The gate. It is the ONLY thing allowed to skip: KIP_ASK_LIVE opts into the spend, and the
      // probe reports whether an authenticated `claude` exists at all. Everything past this line is
      // PASS/FAIL — a model failure is a FAILURE, never a skip, because catch-and-skip is what lets a
      // real regression masquerade as "environment not available" forever (ADR-B8).
      const gate = resolveLiveGate({ env: process.env, probe: () => probeHarnessCli() });
      if (!gate.run) return ctx.skip(gate.reason);

      const { dir, Fe, Fp } = await seedLiveRepo();
      const realFactIds = new Set([Fe, Fp]);
      const before = await factSetDigest(dir);

      // The full PRODUCTION seam: the bundled manifest (its own runtime.model sentinel + timeout) →
      // runAsk → defaultDispatchMicroagent → answerQuestion → harnessCliSynthesize → `claude`.
      const outcome = await runAsk({
        question: QUESTION,
        manifest: BUNDLED_MANIFEST,
        repoDir: dir,
        dispatch: defaultDispatchMicroagent,
      });

      // A dispatch failure here is a REAL FAILURE (the probes said the model is available).
      expect(
        outcome.kind === "dispatch-failure" ? outcome.message : "ok",
      ).toBe("ok");
      if (outcome.kind !== "ok") throw new Error("unreachable — asserted above");

      // (1) A real, non-abstained answer.
      expect(outcome.result.status).toBe("answered");
      expect(typeof outcome.result.answer).toBe("string");
      expect((outcome.result.answer ?? "").trim().length).toBeGreaterThan(0);
      expect(outcome.result.answer).not.toBe(ABSTENTION_ANSWER);
      // The N5 trap, live: an error string must never arrive as prose.
      expect(outcome.result.answer ?? "").not.toContain("Not logged in");

      // (2) Citations exist and are BOUND TO REAL, SIGNED facts from this repo (never invented).
      expect(outcome.result.citations.length).toBeGreaterThan(0);
      for (const c of outcome.result.citations) {
        expect(typeof c.factId).toBe("string");
        expect(realFactIds.has(String(c.factId))).toBe(true);
      }

      // (3) The echoed model is the manifest's effective model (spec §5.3).
      expect(outcome.result.model).toBe(BUNDLED_MANIFEST.runtime.model);

      // (4) INV-A1 / §5: the graph after an ask is byte-identical to before it — the model
      // contributed prose only and could not touch proj (it never held a Repo).
      expect(await factSetDigest(dir)).toBe(before);
    },
  );
});
