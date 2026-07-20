/**
 * FROZEN acceptance tests for the `text-autoencoder` work item — making **text → graph** real.
 *
 * `Repo.learn()` (the knowledge-autoencoding loop, `kip-repo.ts:4873`) is already implemented, but
 * has never run on real text: none of the four microagent bodies it dispatches exist, and there is
 * no way to get a document into kip at all. This file is the frozen acceptance criteria for closing
 * both gaps, authored STRICTLY from:
 *   - docs/32-knowledge-autoencoding.md (the normative loop + microagent shapes)
 *   - docs/40-sdk-api-surface.md (`LearnOptions`, the `Repo` surface)
 *   - docs/70-decision-records-adr.md, ADR-B10 … ADR-B10f (the design under test; ADR-B10d lists the
 *     known traps, each of which gets exactly one named test below)
 *   - `kip-repo.ts`'s `learn()` — read ONLY to transcribe the contract it enforces, never mirrored.
 *
 * EVERYTHING HERE IS DETERMINISTIC AND RUNS WITHOUT A MODEL. Every loop test injects a scripted
 * `DispatchMicroagentFn` through the `KipRepo` constructor (the same seam `code-miner.test.ts` and
 * the M6 conformance suite use); every body test injects a `HarnessCliRunner` through
 * `makeLearnDispatch`. ADR-B10f's promise — "the default suite spawns nothing, provably" — is itself
 * asserted (criterion 11), not merely claimed.
 *
 * WHY THESE FAIL TODAY (stubs, not fakes — each is a placeholder whose OBSERVABLE value is wrong, so
 * every assertion fails on its own diff and never on a type/syntax/import error):
 *   - `KipRepo.putBlob`/`getBlob` throw "unimplemented" (ADR-B10a is the whole blob gap).
 *   - `src/learn/compile.ts`'s `compileGraphToAssertInputs` returns an empty candidate set and
 *     validates nothing.
 *   - `src/learn/index.ts`'s `makeLearnDispatch` returns a dispatcher that fails every role;
 *     `resolveLearnManifests` returns permissive `{}` schemas (the exact ADR-B10d trap-1 hole);
 *     `resolveLearnLiveGate` wrongly reports the live path enabled.
 *
 * A NOTE ON WHAT IS ALREADY GREEN. A few criteria (exhaustion→N5, the malformed-dispatch traps whose
 * guard already lives in the frozen core, the accelerator-boundary ordering claim, INV-A1) pin
 * behavior `learn()` already has. Those tests are deliberately included anyway: ADR-B10d's entire
 * point is that each trap "gets a named test rather than a comment", and they are the regression
 * wall that the four new microagent bodies must not knock down.
 *
 * ASSERTIONS ARE NEVER MADE INSIDE A SCRIPTED DISPATCH HANDLER. `learn()`'s `dispatchOne` wraps
 * every dispatch in `try { … } catch { exitCode: 1 }`, so a `expect()` throwing inside a handler
 * would be silently converted into an ordinary infinite-loss iteration and the test would pass for
 * the wrong reason. Handlers RECORD; the `it()` body asserts.
 */
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HarnessCliProbe, HarnessCliRequest, HarnessCliRun } from "../cli/ask";
import type { AssertInput, BlobRef, MicroagentInvocation, MicroagentResult } from "../index";
import { KipRepo } from "../index";
import { compileGraphToAssertInputs, type LearnGraph } from "../learn/compile";
import { LEARN_MANIFEST_NAMES, makeLearnDispatch, resolveLearnLiveGate, resolveLearnManifests } from "../learn";
import { Substrate } from "../substrate";
import {
  baseLearnOptions,
  buildManifest,
  decodeOk,
  encodeOk,
  freshReplicaId,
  learnerOk,
  lossOk,
  makeScriptedDispatch,
  nodePropAssert,
  registerManifest,
  type RecordedInvocation,
} from "./conformance/fixtures-m6";

// ────────────────────────────────────────────────────────────────────────────────────────────────
// The spawn detector for criterion 11 (ADR-B10f: "the default suite spawns nothing, PROVABLY").
// Every `node:child_process` entry point any module under test could reach is wrapped with a
// counter. The wrapper delegates to the REAL implementation, so nothing else in the suite changes.
// ────────────────────────────────────────────────────────────────────────────────────────────────

const spawnCounters = vi.hoisted(() => {
  const counts = { spawn: 0, spawnSync: 0, exec: 0, execFile: 0, execFileSync: 0, execSync: 0, fork: 0 };
  return {
    counts,
    bump: (k: keyof typeof counts): void => {
      counts[k] += 1;
    },
    reset: (): void => {
      for (const k of Object.keys(counts) as Array<keyof typeof counts>) counts[k] = 0;
    },
    total: (): number => Object.values(counts).reduce((a, b) => a + b, 0),
  };
});

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  type Wrapped = "spawn" | "spawnSync" | "exec" | "execFile" | "execFileSync" | "execSync" | "fork";
  const wrap = <K extends Wrapped>(key: K): (typeof actual)[K] =>
    ((...args: unknown[]) => {
      spawnCounters.bump(key);
      return (actual[key] as unknown as (...a: unknown[]) => unknown)(...args);
    }) as unknown as (typeof actual)[K];
  return {
    ...actual,
    default: actual,
    spawn: wrap("spawn"),
    spawnSync: wrap("spawnSync"),
    exec: wrap("exec"),
    execFile: wrap("execFile"),
    execFileSync: wrap("execFileSync"),
    execSync: wrap("execSync"),
    fork: wrap("fork"),
  };
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// Shared fixtures
// ────────────────────────────────────────────────────────────────────────────────────────────────

/** The document under test — real text, the thing this whole work item exists to turn into a graph. */
const DOCUMENT = [
  "# Kip",
  "",
  "Ada Lovelace worked with Charles Babbage on the Analytical Engine.",
  "Ada Lovelace was born in London.",
  "",
].join("\n");

/** A fixed `BlobRef` for loop-shape tests where the document's CONTENT is irrelevant (docs/32: a
 *  bare `BlobRef` is caller-declared and advisory; `learn()` never re-hashes it). */
const OPAQUE_RAW_REF: BlobRef = { blob: "c".repeat(40) };

/** The git loose-object hash `sha1("blob <len>\0<content>")`, computed INDEPENDENTLY of the SDK —
 *  this is the value ADR-B10a says `putBlob` must return, and it must not be taken on trust from
 *  `substrate.ts`'s own `gitBlobId`. */
function independentGitBlobOid(content: Uint8Array): string {
  const header = Buffer.from(`blob ${content.byteLength}\0`, "utf8");
  return createHash("sha1").update(Buffer.concat([header, Buffer.from(content)])).digest("hex");
}

/** Every fact durably admitted to `dir`'s substrate — the admitted fact set **S** that `proj` folds. */
function admittedFacts(dir: string): Array<Record<string, unknown>> {
  return new Substrate(dir, "sha1").listFactBlobs().map((json) => JSON.parse(json) as Record<string, unknown>);
}

/** The `schema`-target audit facts `learn()` authors, filtered by the `kip:learn…` ontologyRef prefix. */
function auditFacts(dir: string, prefix: "kip:learn/" | "kip:learn-exhausted/"): Array<Record<string, unknown>> {
  return admittedFacts(dir).filter((f) => {
    const target = f.target as { kind?: string; ontologyRef?: string } | undefined;
    return target?.kind === "schema" && typeof target.ontologyRef === "string" && target.ontologyRef.startsWith(prefix);
  });
}

/** `putBlob` a document, asserting the two-method blob API actually exists and returns a `BlobRef`.
 *  Written as an assertion (not a bare `await`) so a stubbed/rejecting `putBlob` surfaces as a
 *  readable assertion failure naming the blob gap, never as an opaque unhandled rejection. */
async function putBytes(repo: KipRepo, bytes: Uint8Array): Promise<BlobRef> {
  const outcome = await repo.putBlob(bytes).then(
    (ref) => ref as BlobRef | Error,
    (err: unknown) => (err instanceof Error ? err : new Error(String(err))),
  );
  expect(outcome, `putBlob(bytes) must resolve to a BlobRef (ADR-B10a), got: ${String(outcome)}`).toMatchObject({
    blob: independentGitBlobOid(bytes),
  });
  return outcome as BlobRef;
}

async function putDocument(repo: KipRepo, text: string): Promise<BlobRef> {
  return putBytes(repo, Buffer.from(text, "utf8"));
}

/** The four scripted role manifests for one test, with unique names so the shared in-process
 *  `KipRepo.registry` can never cross-wire two tests. */
function roleManifests(label: string, overrides?: { decodeOutputSchema?: unknown }) {
  return {
    encode: buildManifest({ name: `${label}-encode` }),
    decode: buildManifest({
      name: `${label}-decode`,
      ...(overrides?.decodeOutputSchema !== undefined ? { outputSchema: overrides.decodeOutputSchema } : {}),
    }),
    learner: buildManifest({ name: `${label}-learner` }),
    loss: buildManifest({ name: `${label}-loss` }),
  };
}

function selectors(m: ReturnType<typeof roleManifests>) {
  return {
    encode: { name: m.encode.name, version: m.encode.version },
    decode: { name: m.decode.name, version: m.decode.version },
    learner: { name: m.learner.name, version: m.learner.version },
    loss: { name: m.loss.name, version: m.loss.version },
  };
}

const inputsFor = (log: RecordedInvocation[], name: string): unknown[] =>
  log.filter((r) => r.invocation.manifest.name === name).map((r) => r.invocation.input);

// ────────────────────────────────────────────────────────────────────────────────────────────────

describe("text-autoencoder (ADR-B10…B10f): text → graph, end to end and without a model", () => {
  const repos: KipRepo[] = [];
  const dirs: string[] = [];

  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  /** A repo on a caller-owned explicit dir (so the durably-admitted fact set S is inspectable). */
  const dirByRepo = new Map<KipRepo, string>();
  function ownedRepo(label: string, options?: Partial<ConstructorParameters<typeof KipRepo>[0]>): KipRepo {
    const dir = mkdtempSync(join(tmpdir(), `kip-text-ae-${label}-`));
    dirs.push(dir);
    const repo = new KipRepo({ dir, replicaId: freshReplicaId(label), ...(options ?? {}) });
    repos.push(repo);
    dirByRepo.set(repo, dir);
    return repo;
  }
  const dirOf = (repo: KipRepo): string => {
    const dir = dirByRepo.get(repo);
    if (dir === undefined) throw new Error("dirOf: repo was not built by ownedRepo()");
    return dir;
  };

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // 1. The blob API — bytes in, the SAME bytes out, and NOT a member of S (ADR-B10a)
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  describe("criterion 1 — putBlob/getBlob round-trip, real content addressing, zero graph effect", () => {
    it("putBlob returns the REAL git blob oid (independently computed sha1(\"blob <len>\\0<bytes>\"))", async () => {
      const repo = ownedRepo("blob-cid");
      const bytes = Buffer.from(DOCUMENT, "utf8");
      await expect(repo.putBlob(bytes)).resolves.toEqual({ blob: independentGitBlobOid(bytes) });
    });

    it("getBlob(putBlob(bytes)) returns byte-IDENTICAL content, for UTF-8 text and for binary", async () => {
      const repo = ownedRepo("blob-roundtrip");

      const utf8 = Buffer.from(`${DOCUMENT}\n— café ☕ — non-ASCII must survive verbatim\n`, "utf8");
      const utf8Ref = await putDocument(repo, utf8.toString("utf8"));
      const readBackUtf8 = await repo.getBlob(utf8Ref);
      expect(readBackUtf8).not.toBeNull();
      expect(Buffer.from(readBackUtf8 as Uint8Array).equals(utf8)).toBe(true);

      // Binary, including a NUL byte — the git loose-object header is NUL-delimited, so a naive
      // header strip that scans for the LAST NUL (or decodes as a string) corrupts exactly this case.
      const binary = Uint8Array.from([0x00, 0xff, 0x10, 0x00, 0x7f, 0x80, 0x00]);
      const binRef = await putBytes(repo, binary);
      const readBackBin = await repo.getBlob(binRef);
      expect(readBackBin).not.toBeNull();
      expect(Array.from(readBackBin as Uint8Array)).toEqual(Array.from(binary));
    });

    it("putBlob is idempotent/content-addressed, and getBlob returns null (never a fabricated buffer) for an absent oid", async () => {
      const repo = ownedRepo("blob-dedup");
      const bytes = Buffer.from(DOCUMENT, "utf8");
      const first = await putBytes(repo, bytes);
      const second = await putBytes(repo, Buffer.from(DOCUMENT, "utf8"));
      expect(second).toEqual(first); // same content ⇒ same CID, an INV-7 no-op

      // A genuinely absent oid is `null` — never a zero-length buffer, never a partial read (N5).
      await expect(repo.getBlob({ blob: "0".repeat(40) })).resolves.toBeNull();
    });

    it("storing a blob does NOT change the graph: proj is byte-identical, no facts authored, S unchanged", async () => {
      const repo = ownedRepo("blob-not-in-S");
      const dir = dirOf(repo);

      // Seed one ordinary fact so there is a real graph (and a real S) to compare against.
      await repo.putNode({ eid: "tenant/ns/seed", kind: "person", props: { name: "seed" } });
      const graphBefore = await repo.getNode("tenant/ns/seed");
      const factsBefore = admittedFacts(dir);

      // A LARGE document — big enough that inlining it anywhere in the fact set would be obvious.
      await putBytes(repo, Buffer.from(DOCUMENT.repeat(500), "utf8"));

      const graphAfter = await repo.getNode("tenant/ns/seed");
      const factsAfter = admittedFacts(dir);
      // A blob is CONTENT addressed by hash; it is NOT a member of S and it is NOT knowledge.
      expect(factsAfter.length).toBe(factsBefore.length);
      expect(factsAfter).toEqual(factsBefore);
      expect(graphAfter).toEqual(graphBefore);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // 2. Each role gets exactly the documented input, and its output is consumed correctly (docs/32)
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  describe("criterion 2 — the four role I/O contracts, verbatim from docs/32", () => {
    it("encode ← {rawRef, ontologyAsOf} · learner ← {rawRef, current, loss, ontologyAsOf} · decode ← {candidateFacts, rawKind} · loss ← {rawRef, reconstructed}", async () => {
      const eid = "tenant/ns/roles-doc";
      const m = roleManifests("roles");

      const encodeCandidates = [nodePropAssert(eid, "content", "from-encode")];
      const learnerCandidates = [nodePropAssert(eid, "content", "from-learner")];
      const reconstructed: BlobRef = { blob: "d".repeat(40) };

      // Iteration 0 (encode) scores 0.9 (no accept); iteration 1 (learner) scores 0.1 < 0.25 ⇒ accept.
      const { dispatch, log } = makeScriptedDispatch({
        [m.encode.name]: () => encodeOk(encodeCandidates),
        [m.decode.name]: () => decodeOk(reconstructed),
        [m.learner.name]: () => learnerOk(learnerCandidates),
        [m.loss.name]: (_inv, idx) => lossOk([0.9, 0.1][idx] ?? 0.1),
      });

      const repo = ownedRepo("roles", { dispatchMicroagent: dispatch });
      for (const manifest of Object.values(m)) await registerManifest(repo, manifest);

      const rawRef = await putDocument(repo, DOCUMENT);
      const documentBytes = Buffer.from(DOCUMENT, "utf8");

      const result = await repo.learn(rawRef, baseLearnOptions({ threshold: 0.25, ...selectors(m) }));
      expect(result.status).toBe("accept");

      // -- encode input: EXACTLY {rawRef, ontologyAsOf} -----------------------------------------
      const encodeInputs = inputsFor(log, m.encode.name) as Array<Record<string, unknown>>;
      expect(encodeInputs).toHaveLength(1);
      expect(Object.keys(encodeInputs[0]).sort()).toEqual(["ontologyAsOf", "rawRef"]);
      expect(encodeInputs[0].rawRef).toEqual(rawRef);
      expect(encodeInputs[0].ontologyAsOf).toMatchObject({ validTime: expect.any(Number) });
      // …and the rawRef it receives RESOLVES, in this repo, to the real document bytes. This is the
      // whole text→graph link: encode must never invent a document (ADR-B10b).
      const resolved = await repo.getBlob(encodeInputs[0].rawRef as BlobRef);
      expect(resolved).not.toBeNull();
      expect(Buffer.from(resolved as Uint8Array).equals(documentBytes)).toBe(true);

      // -- learner input: EXACTLY {rawRef, current, loss, ontologyAsOf} --------------------------
      const learnerInputs = inputsFor(log, m.learner.name) as Array<Record<string, unknown>>;
      expect(learnerInputs.length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(learnerInputs[0]).sort()).toEqual(["current", "loss", "ontologyAsOf", "rawRef"]);
      expect(learnerInputs[0].rawRef).toEqual(rawRef);
      expect(learnerInputs[0].current).toEqual(encodeCandidates); // the CURRENT best, from encode
      expect(learnerInputs[0].loss).toBe(0.9);

      // -- decode input: EXACTLY {candidateFacts, rawKind}, rawKind threaded byte-identically ----
      const decodeInputs = inputsFor(log, m.decode.name) as Array<Record<string, unknown>>;
      expect(decodeInputs.length).toBeGreaterThanOrEqual(2);
      for (const input of decodeInputs) {
        expect(Object.keys(input).sort()).toEqual(["candidateFacts", "rawKind"]);
        expect(input.rawKind).toBe("text/markdown"); // INV-A14: sourced once, never re-inferred
      }
      // The loop READS `candidateFacts` from encode and `next` from the learner — decode sees each.
      expect(decodeInputs[0].candidateFacts).toEqual(encodeCandidates);
      expect(decodeInputs[1].candidateFacts).toEqual(learnerCandidates);

      // -- loss input: EXACTLY {rawRef, reconstructed} ------------------------------------------
      const lossInputs = inputsFor(log, m.loss.name) as Array<Record<string, unknown>>;
      expect(lossInputs.length).toBeGreaterThanOrEqual(2);
      for (const input of lossInputs) {
        expect(Object.keys(input).sort()).toEqual(["rawRef", "reconstructed"]);
        expect(input.rawRef).toEqual(rawRef);
        expect(input.reconstructed).toEqual(reconstructed); // decode's OWN output, threaded through
      }

      // -- the ACCEPTED set is the learner's `next`, not encode's `candidateFacts` ---------------
      const learned = await repo.getNode(eid);
      expect(learned?.props.content?.segments.at(-1)?.value).toBe("from-learner");
    });

    it("iteration 0 accepting reads `candidateFacts` off the ENCODE reply (the encode field, never `next`)", async () => {
      const eid = "tenant/ns/encode-field-doc";
      const m = roleManifests("encode-field");
      const { dispatch } = makeScriptedDispatch({
        [m.encode.name]: () => encodeOk([nodePropAssert(eid, "content", "encoded-value")]),
        [m.decode.name]: () => decodeOk(),
        [m.learner.name]: () => learnerOk([nodePropAssert(eid, "content", "learner-value")]),
        [m.loss.name]: () => lossOk(0.05),
      });
      const repo = ownedRepo("encode-field", { dispatchMicroagent: dispatch });
      for (const manifest of Object.values(m)) await registerManifest(repo, manifest);
      const rawRef = await putDocument(repo, DOCUMENT);

      const result = await repo.learn(rawRef, baseLearnOptions({ threshold: 0.25, ...selectors(m) }));
      expect(result.status).toBe("accept");
      expect((await repo.getNode(eid))?.props.content?.segments.at(-1)?.value).toBe("encoded-value");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // 3 + 8. Convergence → accept: REAL facts, with a non-blank projected kind (ADR-B10d traps 5)
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  describe("criterion 3 & 8 — accept commits real, readable knowledge; no ghost node, no blanked kind", () => {
    /** The narrow `{nodes, edges}` shape the model is asked for (ADR-B10b) — never `AssertInput`. */
    const GRAPH: LearnGraph = {
      nodes: [
        { eid: "doc:ada", kind: "person", props: { name: "Ada Lovelace", bornIn: "London" } },
        { eid: "doc:babbage", kind: "person", props: { name: "Charles Babbage" } },
      ],
      edges: [{ eid: "doc:ada->babbage", edgeKind: "worked_with", from: "doc:ada", to: "doc:babbage", props: { on: "Analytical Engine" } }],
    };

    it("compileGraphToAssertInputs emits EXPLICIT node/edge existence candidates carrying nodeKind/edgeKind (never props alone)", () => {
      const compiled = compileGraphToAssertInputs(GRAPH, {
        replicaId: "kip-learn-encode",
        source: "kip-learn://abc",
        rawBlob: "abc",
      });

      const nodeExistence = compiled.filter((c) => c.target.kind === "node");
      // ADR-B10d: the eids are NAMESPACED BY THE COMPILER as `doc:<rawBlob>#<model slug>`.
      expect(nodeExistence.map((c) => (c.target as { eid: string }).eid).sort()).toEqual([
        "doc:abc#doc:ada",
        "doc:abc#doc:babbage",
      ]);
      // ADR-B10d trap 5: the existence candidate MUST carry the kind, or `ensureExistenceFor` mints a
      // kind-LESS one that folds over and blanks `NodeView.kind`.
      for (const c of nodeExistence) expect((c.target as { nodeKind?: string }).nodeKind).toBe("person");

      const edgeExistence = compiled.filter((c) => c.target.kind === "edge");
      expect(edgeExistence).toHaveLength(1);
      expect(edgeExistence[0].target).toMatchObject({
        eid: "doc:abc#doc:ada->babbage",
        edgeKind: "worked_with",
        // The ENDPOINTS are namespaced too — and before the dangling check, so they still resolve.
        from: "doc:abc#doc:ada",
        to: "doc:abc#doc:babbage",
      });

      // Envelope fields the model is NEVER asked for are supplied by the compiler (ADR-B10).
      for (const c of compiled) {
        expect(c.type).toBe("assert");
        expect(c.v).toBe(1);
        expect(c.validFrom).toBe(0);
        expect(c.validTo).toBeNull();
        expect(c.replicaId).toBe("kip-learn-encode");
        expect(c.provenance.source?.uri).toBe("kip-learn://abc");
      }

      // …and every prop the graph carries is compiled to its own node-prop/edge-prop candidate.
      const nodeProps = compiled.filter((c) => c.target.kind === "node-prop");
      expect(nodeProps.map((c) => (c.target as { prop: string }).prop).sort()).toEqual(["bornIn", "name", "name"]);
      expect(compiled.filter((c) => c.target.kind === "edge-prop")).toHaveLength(1);
    });

    it("a converging loss sequence accepts, reports the achieved loss, and the compiled graph is READABLE via getNode/getEdge with the right kinds and props", async () => {
      const m = roleManifests("accept");
      const candidates = compileGraphToAssertInputs(GRAPH, {
        replicaId: "kip-learn-encode",
        source: "kip-learn://doc",
        rawBlob: "doc",
      });
      const ns = (slug: string): string => `doc:doc#${slug}`;

      const { dispatch, log } = makeScriptedDispatch({
        [m.encode.name]: () => encodeOk(candidates),
        [m.decode.name]: () => decodeOk(),
        [m.learner.name]: () => learnerOk(candidates),
        [m.loss.name]: (_inv, idx) => lossOk([0.9, 0.6, 0.12][idx] ?? 0.12),
      });
      const repo = ownedRepo("accept", { dispatchMicroagent: dispatch });
      for (const manifest of Object.values(m)) await registerManifest(repo, manifest);
      const rawRef = await putDocument(repo, DOCUMENT);

      const result = await repo.learn(rawRef, baseLearnOptions({ threshold: 0.25, maxIterations: 6, ...selectors(m) }));

      expect(result.status).toBe("accept");
      expect(result.loss).toBe(0.12); // the achieved (best) loss, reported honestly
      expect(log.length).toBeGreaterThan(0);

      // The accepted candidates are ORDINARY signed facts — readable back through the ordinary reads.
      const ada = await repo.getNode(ns("doc:ada"));
      expect(ada).not.toBeNull();
      expect(ada?.kind).toBe("person"); // ADR-B10d trap 5: NEVER blank
      expect(ada?.props.name?.segments.at(-1)?.value).toBe("Ada Lovelace");
      expect(ada?.props.bornIn?.segments.at(-1)?.value).toBe("London");

      const babbage = await repo.getNode(ns("doc:babbage"));
      expect(babbage?.kind).toBe("person");
      expect(babbage?.props.name?.segments.at(-1)?.value).toBe("Charles Babbage");

      const edge = await repo.getEdge(ns("doc:ada->babbage"));
      expect(edge).not.toBeNull();
      expect(edge?.kind).toBe("worked_with");
      expect(edge?.from).toBe(ns("doc:ada"));
      expect(edge?.to).toBe(ns("doc:babbage"));
      expect(edge?.props.on?.segments.at(-1)?.value).toBe("Analytical Engine");

      // Exactly ONE kip:learn audit fact, naming its inputs + the achieved loss (docs/32, ADR-B10c).
      const audits = auditFacts(dirOf(repo), "kip:learn/");
      expect(audits).toHaveLength(1);
      const payload = JSON.parse(String(audits[0].value)) as Record<string, unknown>;
      expect(payload.achievedLoss).toBe(0.12);
      expect(payload.rawRef).toEqual(rawRef);
    });

    it("a candidate set that is ONLY node-props (no explicit existence) must not project a node whose kind is blank", async () => {
      const eid = "doc:ghost-risk";
      const m = roleManifests("ghost");
      const { dispatch } = makeScriptedDispatch({
        [m.encode.name]: () => encodeOk([nodePropAssert(eid, "name", "Ada")]),
        [m.decode.name]: () => decodeOk(),
        [m.learner.name]: () => learnerOk([nodePropAssert(eid, "name", "Ada")]),
        [m.loss.name]: () => lossOk(0.05),
      });
      const repo = ownedRepo("ghost", { dispatchMicroagent: dispatch });
      for (const manifest of Object.values(m)) await registerManifest(repo, manifest);

      const result = await repo.learn(OPAQUE_RAW_REF, baseLearnOptions({ threshold: 0.25, ...selectors(m) }));
      expect(result.status).toBe("accept");

      // ADR-B10d trap 5: `ensureExistenceFor` auto-mints existence, but with NO nodeKind. A node that
      // reaches the graph must never carry a blank/absent kind — either the projection withholds it
      // entirely, or it carries a real kind. A `""`/undefined kind on a live node is the defect.
      const node = await repo.getNode(eid);
      if (node !== null) {
        expect(typeof node.kind).toBe("string");
        expect(node.kind, "a projected node must never carry a blank kind (ADR-B10d trap 5)").not.toBe("");
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // 4. Exhaustion → N5: nothing fabricated, one auditable marker
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  describe("criterion 4 — exhausted authors NO knowledge, only a kip:learn-exhausted marker", () => {
    it("a loss sequence that never crosses the threshold yields exhausted, one marker fact, and an EMPTY graph", async () => {
      const eid = "doc:never-accepted";
      const m = roleManifests("exhausted");
      const { dispatch, log } = makeScriptedDispatch({
        [m.encode.name]: () => encodeOk([nodePropAssert(eid, "name", "Ada")]),
        [m.decode.name]: () => decodeOk(),
        [m.learner.name]: () => learnerOk([nodePropAssert(eid, "name", "Ada")]),
        [m.loss.name]: () => lossOk(0.9), // never below the 0.25 threshold
      });
      const repo = ownedRepo("exhausted", { dispatchMicroagent: dispatch });
      for (const manifest of Object.values(m)) await registerManifest(repo, manifest);

      const factsBefore = admittedFacts(dirOf(repo)).length;
      const result = await repo.learn(
        OPAQUE_RAW_REF,
        baseLearnOptions({ threshold: 0.25, maxIterations: 3, ...selectors(m) }),
      );

      expect(result.status).toBe("exhausted");
      expect(result.loss).toBe(0.9); // the best loss actually SEEN — never 0, never fabricated
      expect(result.facts).toHaveLength(1); // the marker, and nothing else

      // Nothing entered the graph: the extracted node is simply not there.
      expect(await repo.getNode(eid)).toBeNull();

      // Exactly one NEW admitted fact, and it is the kip:learn-exhausted marker naming the best loss.
      expect(admittedFacts(dirOf(repo)).length).toBe(factsBefore + 1);
      const markers = auditFacts(dirOf(repo), "kip:learn-exhausted/");
      expect(markers).toHaveLength(1);
      expect(auditFacts(dirOf(repo), "kip:learn/")).toHaveLength(0); // NO accept fact (N5)
      const payload = JSON.parse(String(markers[0].value)) as Record<string, unknown>;
      expect(payload.bestLossSeen).toBe(0.9);
      expect(payload.rawRef).toEqual(OPAQUE_RAW_REF);

      // The loop genuinely ran (this is exhaustion, not a short-circuit).
      expect(log.filter((r) => r.invocation.manifest.name === m.loss.name)).toHaveLength(3);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // 5. Malformed dispatch → honest failure, NEVER a fabricated accept (ADR-B10d traps 1-3)
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  describe("criterion 5 — one test per ADR-B10d trap; every one is an honest exhausted, never a bogus accept", () => {
    /** Every trap test shares this shape: run the loop, then prove nothing was fabricated. */
    async function expectNoFabricatedAccept(repo: KipRepo, result: { status: string; facts: unknown[] }, eid: string) {
      expect(result.status).toBe("exhausted");
      expect(await repo.getNode(eid)).toBeNull();
      expect(auditFacts(dirOf(repo), "kip:learn/")).toHaveLength(0);
      expect(result.facts).toHaveLength(1); // the marker only
    }

    it("trap 2 — an OBJECT-WRAPPED loss ({loss: 0.2}) scores as failure; the BARE 0.2 accepts", async () => {
      const eid = "doc:wrapped-loss";
      const candidates = [nodePropAssert(eid, "name", "Ada")];

      // (a) object-wrapped — `learn()` reads the loss BARE, so this is an infinite-loss iteration.
      const wrapped = roleManifests("loss-wrapped");
      const { dispatch: wrappedDispatch } = makeScriptedDispatch({
        [wrapped.encode.name]: () => encodeOk(candidates),
        [wrapped.decode.name]: () => decodeOk(),
        [wrapped.learner.name]: () => learnerOk(candidates),
        [wrapped.loss.name]: (): MicroagentResult => ({ exitCode: 0, output: { loss: 0.2 }, elapsedMs: 0 }),
      });
      const repoA = ownedRepo("loss-wrapped", { dispatchMicroagent: wrappedDispatch });
      for (const manifest of Object.values(wrapped)) await registerManifest(repoA, manifest);
      const wrappedResult = await repoA.learn(
        OPAQUE_RAW_REF,
        baseLearnOptions({ threshold: 0.25, maxIterations: 2, ...selectors(wrapped) }),
      );
      await expectNoFabricatedAccept(repoA, wrappedResult, eid);
      expect(wrappedResult.loss).toBe(Number.POSITIVE_INFINITY); // nothing was ever measured

      // (b) the BARE form — the identical script otherwise — accepts. This is the contract, pinned.
      const bare = roleManifests("loss-bare");
      const { dispatch: bareDispatch } = makeScriptedDispatch({
        [bare.encode.name]: () => encodeOk(candidates),
        [bare.decode.name]: () => decodeOk(),
        [bare.learner.name]: () => learnerOk(candidates),
        [bare.loss.name]: () => lossOk(0.2),
      });
      const repoB = ownedRepo("loss-bare", { dispatchMicroagent: bareDispatch });
      for (const manifest of Object.values(bare)) await registerManifest(repoB, manifest);
      const bareResult = await repoB.learn(
        OPAQUE_RAW_REF,
        baseLearnOptions({ threshold: 0.25, maxIterations: 2, ...selectors(bare) }),
      );
      expect(bareResult.status).toBe("accept");
      expect(bareResult.loss).toBe(0.2);
    });

    it("trap 3 — the learner returning `candidateFacts` instead of `next` is a failed iteration, never an accept", async () => {
      const eid = "doc:learner-wrong-field";
      const m = roleManifests("learner-field");
      const { dispatch } = makeScriptedDispatch({
        [m.encode.name]: () => encodeOk([nodePropAssert(eid, "name", "Ada")]),
        [m.decode.name]: () => decodeOk(),
        // WRONG FIELD: docs/32's LearnerAgent declares `{ next }`. `learn()` reads exactly one
        // role-specific field with no `??` chaining, so this is scored as infinite loss.
        [m.learner.name]: (): MicroagentResult => ({
          exitCode: 0,
          output: { candidateFacts: [nodePropAssert(eid, "name", "Ada-refined")] },
          elapsedMs: 0,
        }),
        [m.loss.name]: () => lossOk(0.05), // would ACCEPT if the wrong field were ever honored
      });
      const repo = ownedRepo("learner-field", { dispatchMicroagent: dispatch });
      for (const manifest of Object.values(m)) await registerManifest(repo, manifest);

      // Threshold above the scripted loss so iteration 0 (encode) does NOT accept, forcing the
      // learner to run; only the learner's malformed reply can decide the outcome.
      const result = await repo.learn(
        OPAQUE_RAW_REF,
        baseLearnOptions({ threshold: 0.01, maxIterations: 3, ...selectors(m) }),
      );
      expect(result.status).toBe("exhausted");
      expect(await repo.getNode(eid)).toBeNull();
      expect(auditFacts(dirOf(repo), "kip:learn/")).toHaveLength(0);
    });

    it("encode returning undefined / a non-object / a non-array candidateFacts each fail honestly", async () => {
      const eid = "doc:bad-encode";
      const badOutputs: Array<{ label: string; output: unknown }> = [
        { label: "undefined", output: undefined },
        { label: "non-object", output: "candidateFacts" },
        { label: "non-array candidateFacts", output: { candidateFacts: { 0: nodePropAssert(eid, "name", "Ada") } } },
      ];

      for (const [i, bad] of badOutputs.entries()) {
        const m = roleManifests(`bad-encode-${i}`);
        const { dispatch } = makeScriptedDispatch({
          [m.encode.name]: (): MicroagentResult => ({ exitCode: 0, output: bad.output, elapsedMs: 0 }),
          [m.decode.name]: () => decodeOk(),
          [m.learner.name]: (): MicroagentResult => ({ exitCode: 0, output: bad.output, elapsedMs: 0 }),
          [m.loss.name]: () => lossOk(0.01),
        });
        const repo = ownedRepo(`bad-encode-${i}`, { dispatchMicroagent: dispatch });
        // eslint-disable-next-line no-await-in-loop -- sequential per-case fixtures
        for (const manifest of Object.values(m)) await registerManifest(repo, manifest);

        // eslint-disable-next-line no-await-in-loop -- sequential per-case fixtures
        const result = await repo.learn(
          OPAQUE_RAW_REF,
          baseLearnOptions({ threshold: 0.25, maxIterations: 2, ...selectors(m) }),
        );
        expect(result.status, `encode output ${bad.label} must not accept`).toBe("exhausted");
        // eslint-disable-next-line no-await-in-loop -- sequential per-case fixtures
        expect(await repo.getNode(eid)).toBeNull();
        expect(auditFacts(dirOf(repo), "kip:learn/")).toHaveLength(0);
      }
    });

    it("trap 1 (highest severity) — a decode reply with NO `reconstructed` is rejected by the manifest's OWN strict outputSchema, and no loss dispatch occurs", async () => {
      const eid = "doc:bad-decode";
      // The decode manifest's outputSchema IS the guard here: `learn()` reads decode's payload with a
      // bare type assertion. The bundled manifest must carry its weight (ADR-B10b/B10d trap 1).
      const decodeSchema = resolveLearnManifests().decode.outputSchema;
      const m = roleManifests("bad-decode", { decodeOutputSchema: decodeSchema });

      const { dispatch, log } = makeScriptedDispatch({
        [m.encode.name]: () => encodeOk([nodePropAssert(eid, "name", "Ada")]),
        [m.decode.name]: (): MicroagentResult => ({ exitCode: 0, output: {}, elapsedMs: 0 }),
        [m.learner.name]: () => learnerOk([nodePropAssert(eid, "name", "Ada")]),
        [m.loss.name]: () => lossOk(0.01),
      });
      const repo = ownedRepo("bad-decode", { dispatchMicroagent: dispatch });
      for (const manifest of Object.values(m)) await registerManifest(repo, manifest);

      const result = await repo.learn(
        OPAQUE_RAW_REF,
        baseLearnOptions({ threshold: 0.25, maxIterations: 2, ...selectors(m) }),
      );

      expect(result.status).toBe("exhausted");
      expect(await repo.getNode(eid)).toBeNull();
      expect(auditFacts(dirOf(repo), "kip:learn/")).toHaveLength(0);
      // The strict schema rejects the reply BEFORE `reconstructed: undefined` can reach the loss
      // invocation and surface as a confusing loss-side error.
      expect(log.filter((r) => r.invocation.manifest.name === m.loss.name)).toHaveLength(0);
      // …and it must not be strict by accident: assert the schema genuinely requires `reconstructed`.
      expect(decodeSchema).toMatchObject({ required: ["reconstructed"] });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // 6. Infinity across the JSON seam (ADR-B10d trap 4)
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  describe("criterion 6 — the seed bestLoss is +Infinity; the learner must still receive a USABLE signal", () => {
    it("the loop hands the learner a real number (never NaN, never null), and the learner BODY renders the non-finite case as prose", async () => {
      // (a) At the seam: iteration 0's loss dispatch fails, so `bestLoss` is still +Infinity when the
      //     first learner call is made. Whatever arrives must be a usable number, never NaN/null.
      const eid = "doc:infinity-seam";
      const m = roleManifests("infinity");
      const { dispatch, log } = makeScriptedDispatch({
        [m.encode.name]: () => encodeOk([nodePropAssert(eid, "name", "Ada")]),
        [m.decode.name]: () => decodeOk(),
        [m.learner.name]: () => learnerOk([nodePropAssert(eid, "name", "Ada")]),
        [m.loss.name]: (_inv, idx): MicroagentResult =>
          idx === 0 ? { exitCode: 1, output: null, elapsedMs: 0 } : lossOk(0.9),
      });
      const repo = ownedRepo("infinity", { dispatchMicroagent: dispatch });
      for (const manifest of Object.values(m)) await registerManifest(repo, manifest);

      await repo.learn(OPAQUE_RAW_REF, baseLearnOptions({ threshold: 0.01, maxIterations: 3, ...selectors(m) }));

      const firstLearnerInput = inputsFor(log, m.learner.name)[0] as { loss: unknown };
      expect(typeof firstLearnerInput.loss).toBe("number");
      expect(Number.isNaN(firstLearnerInput.loss as number)).toBe(false);
      expect(firstLearnerInput.loss).not.toBeNull();

      // (b) The trap itself: `JSON.stringify(Infinity)` is the literal `null`, so a naive prompt
      //     renderer shows the model `null` and leaves it to guess. Pinned as an executable fact.
      expect(JSON.stringify(Number.POSITIVE_INFINITY)).toBe("null");

      // (c) The MITIGATION, where ADR-B10d puts it: the learner body branches on `Number.isFinite`
      //     and renders prose. Exercised with an injected runner — zero spawns, zero spend.
      const requests: HarnessCliRequest[] = [];
      const run = async (req: HarnessCliRequest): Promise<HarnessCliRun> => {
        requests.push(req);
        return {
          exitCode: 0,
          stdout: JSON.stringify({
            result: JSON.stringify({ nodes: [{ eid: "doc:ada", kind: "person", props: { name: "Ada" } }], edges: [] }),
          }),
        };
      };
      const blobRepo = ownedRepo("infinity-body");
      // The rawRef must RESOLVE: per ADR-B10b a `getBlob` miss is an honest failed iteration, never a
      // prompt built around an absent document, so the body is exercised over a real stored blob.
      const bodyRawRef = await putDocument(blobRepo, DOCUMENT);
      const learnerDispatch = makeLearnDispatch({
        repo: blobRepo,
        run,
        probe: (): HarnessCliProbe => ({ available: true }),
      });

      const invocation = (loss: number): MicroagentInvocation => ({
        id: `learn:learner:${LEARN_MANIFEST_NAMES.learner}@1.0.0:1`,
        manifest: { name: LEARN_MANIFEST_NAMES.learner, version: "1.0.0" },
        input: { rawRef: bodyRawRef, current: [] as AssertInput[], loss, ontologyAsOf: { validTime: 1 } },
        timeout: 120_000,
      });

      const nonFinite = await learnerDispatch(invocation(Number.POSITIVE_INFINITY));
      expect(nonFinite.exitCode, `learner body failed: ${JSON.stringify(nonFinite.output)}`).toBe(0);
      expect(requests).toHaveLength(1);
      const nonFinitePrompt = requests[0].stdin;
      // The model must be told, in prose, that nothing has been scored yet — never shown `null`.
      expect(nonFinitePrompt).not.toMatch(/loss[^\n]{0,40}\bnull\b/i);
      expect(nonFinitePrompt).not.toContain("Infinity");
      expect(nonFinitePrompt.toLowerCase()).toContain("no candidate has been scored yet");

      // …and the finite case shows the real number.
      const finite = await learnerDispatch(invocation(0.42));
      expect(finite.exitCode).toBe(0);
      expect(requests).toHaveLength(2);
      expect(requests[1].stdin).toContain("0.42");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // 7. Dangling edge endpoints (ADR-B10d trap 6 — the one integrity check the core does not do)
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  describe("criterion 7 — an edge whose from/to names an eid not among the candidate nodes is never silently committed", () => {
    const DANGLING: LearnGraph = {
      nodes: [{ eid: "doc:ada", kind: "person", props: { name: "Ada Lovelace" } }],
      edges: [{ eid: "doc:ada->nowhere", edgeKind: "worked_with", from: "doc:ada", to: "doc:not-a-node" }],
    };

    it("compileGraphToAssertInputs REJECTS the dangling endpoint (it never repairs it silently, and never emits it)", () => {
      // Either it throws naming the offending endpoint (the ADR-B10b/B10d mitigation) — or, if it
      // repairs, it must NOT emit an edge candidate pointing at a non-existent node. Both are asserted.
      let compiled: AssertInput[] | undefined;
      let thrown: unknown;
      try {
        compiled = compileGraphToAssertInputs(DANGLING, {
          replicaId: "kip-learn-encode",
          source: "kip-learn://x",
          rawBlob: "x",
        });
      } catch (err) {
        thrown = err;
      }

      if (thrown === undefined) {
        const eids = new Set(
          (compiled ?? []).filter((c) => c.target.kind === "node").map((c) => (c.target as { eid: string }).eid),
        );
        const edges = (compiled ?? []).filter((c) => c.target.kind === "edge");
        for (const e of edges) {
          const t = e.target as { from: string; to: string };
          expect(eids.has(t.from), `edge endpoint ${t.from} has no node candidate`).toBe(true);
          expect(eids.has(t.to), `edge endpoint ${t.to} has no node candidate`).toBe(true);
        }
        // A silent drop is also not acceptable as the ONLY behavior — the ADR calls for rejection.
        expect(thrown, "compileGraphToAssertInputs must reject a dangling edge endpoint (ADR-B10d trap 6)").toBeDefined();
      } else {
        expect(String((thrown as Error).message)).toContain("doc:not-a-node");
      }
    });

    it("the encode body turns a dangling-endpoint model reply into exitCode 1 WITH a reason — never a candidate set", async () => {
      const repo = ownedRepo("dangling-body");
      // A REAL, resolvable rawRef: the body now refuses a `getBlob` miss outright (ADR-B10b), and
      // this test is about the DANGLING ENDPOINT rejection, so the document must actually be there.
      const rawRef = await putDocument(repo, DOCUMENT);
      const run = async (): Promise<HarnessCliRun> => ({
        exitCode: 0,
        stdout: JSON.stringify({ result: JSON.stringify(DANGLING) }),
      });
      const dispatch = makeLearnDispatch({ repo, run, probe: (): HarnessCliProbe => ({ available: true }) });

      const result = await dispatch({
        id: `learn:encode:${LEARN_MANIFEST_NAMES.encode}@1.0.0:1`,
        manifest: { name: LEARN_MANIFEST_NAMES.encode, version: "1.0.0" },
        input: { rawRef, ontologyAsOf: { validTime: 1 } },
        timeout: 120_000,
      });

      expect(result.exitCode).toBe(1);
      const reason = String((result.output as { error?: unknown } | null)?.error ?? "");
      expect(reason).toContain("doc:not-a-node");
      expect(result.output).not.toHaveProperty("candidateFacts");
    });

    it("end to end: a model that proposes a dangling edge produces an EXHAUSTED run and nothing of its proposal reaches the graph", async () => {
      // The honest end-to-end property. Per ADR-B10d trap 6 the CORE does not reject a dangling
      // endpoint (`isWellFormedTarget` only validates the edge's OWN eid), so hand-authoring the
      // dangling `AssertInput[]` and feeding them to a scripted dispatcher would be asserting a
      // promise `learn()` never made. What IS promised is the whole path: the model's dangling reply
      // is rejected by the encode/learner bodies' own compiler (:766/:794), every iteration is
      // therefore an honest N5 failed iteration, and the run ends "exhausted" with an audit marker
      // and ZERO graph effect. This drives the REAL bodies (`makeLearnDispatch`) — a build that let
      // a dangling edge through the compiler would accept here and fail every assertion below.
      const manifests = resolveLearnManifests();
      // The dispatcher needs the repo, and the repo needs the dispatcher — wired through one
      // indirection rather than by re-creating either.
      let bodies: ((invocation: MicroagentInvocation) => Promise<MicroagentResult>) | undefined;
      const repo = ownedRepo("dangling-e2e", {
        dispatchMicroagent: async (invocation: MicroagentInvocation): Promise<MicroagentResult> => {
          if (bodies === undefined) throw new Error("dangling-e2e: the learn bodies were never wired");
          return bodies(invocation);
        },
      });
      const rawRef = await putDocument(repo, DOCUMENT);
      // Every OTHER role's scripted model reply is deliberately PERFECT — a faithful reconstruction
      // and a loss well under the threshold — so that the ONLY thing standing between this run and a
      // committed dangling edge is the compiler's trap-6 rejection. (With a permissive reply for
      // decode/loss too, the run would end "exhausted" for the wrong reason and the assertions below
      // would not discriminate: verified by disabling the trap-6 check and watching this test fail.)
      const run = async (req: HarnessCliRequest): Promise<HarnessCliRun> => {
        const reply = req.stdin.startsWith("You are the kip knowledge decoder")
          ? { document: DOCUMENT }
          : req.stdin.startsWith("You are the kip reconstruction scorer")
            ? { loss: 0.01 }
            : DANGLING; // encode + learner: the dangling proposal itself
        return { exitCode: 0, stdout: JSON.stringify({ result: JSON.stringify(reply) }) };
      };
      bodies = makeLearnDispatch({ repo, run, probe: (): HarnessCliProbe => ({ available: true }) });
      for (const manifest of Object.values(manifests)) await registerManifest(repo, manifest);

      const outcome = await repo.learn(
        rawRef,
        baseLearnOptions({
          threshold: 0.25,
          maxIterations: 2,
          encode: { name: manifests.encode.name, version: manifests.encode.version },
          decode: { name: manifests.decode.name, version: manifests.decode.version },
          learner: { name: manifests.learner.name, version: manifests.learner.version },
          loss: { name: manifests.loss.name, version: manifests.loss.version },
        }),
      );

      // (a) NEVER a fabricated accept — the dangling proposal is never scored, so the budget caps.
      expect(outcome.status).toBe("exhausted");
      expect(auditFacts(dirOf(repo), "kip:learn/"), "an exhausted run must author NO kip:learn accept fact").toHaveLength(0);
      expect(auditFacts(dirOf(repo), "kip:learn-exhausted/").length).toBeGreaterThan(0);

      // (b) Nothing from the proposal reached the graph — not the edge, not its live endpoint, and
      //     certainly not the endpoint that never existed.
      expect(await repo.getEdge("doc:ada->nowhere"), "the dangling edge must never be committed").toBeNull();
      expect(await repo.getNode("doc:ada"), "no node from a rejected proposal may be committed").toBeNull();
      expect(await repo.getNode("doc:not-a-node")).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // 9. The accelerator boundary: the loss NEVER orders facts (ADR-B10c, FR-J4)
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  describe("criterion 9 — the achieved loss never influences fact ordering or winner selection", () => {
    it("between two competing accepted facts the winner is the ordinary orderKey (author-HLC) max, NOT the lower loss", async () => {
      const eid = "doc:competing";
      // Two independent role-manifest sets, ONE repo, ONE dispatcher — so both accepts share this
      // replica's own HLC/author chain and the ONLY difference between them is authoring ORDER.
      const first = roleManifests("boundary-first");
      const second = roleManifests("boundary-second");
      const ALPHA = "alpha-from-the-BEST-loss";
      const BETA = "beta-from-the-WORST-loss";

      const { dispatch } = makeScriptedDispatch({
        [first.encode.name]: () => encodeOk([nodePropAssert(eid, "summary", ALPHA)]),
        [first.decode.name]: () => decodeOk(),
        [first.learner.name]: () => learnerOk([nodePropAssert(eid, "summary", ALPHA)]),
        [first.loss.name]: () => lossOk(0.01), // the BEST loss, authored FIRST (lower orderKey)
        [second.encode.name]: () => encodeOk([nodePropAssert(eid, "summary", BETA)]),
        [second.decode.name]: () => decodeOk(),
        [second.learner.name]: () => learnerOk([nodePropAssert(eid, "summary", BETA)]),
        [second.loss.name]: () => lossOk(0.8), // the WORST loss, authored SECOND (higher orderKey)
      });
      const repo = ownedRepo("accelerator-boundary", { dispatchMicroagent: dispatch });
      for (const manifest of [...Object.values(first), ...Object.values(second)]) {
        await registerManifest(repo, manifest);
      }

      const firstRun = await repo.learn(OPAQUE_RAW_REF, baseLearnOptions({ threshold: 0.9, ...selectors(first) }));
      expect(firstRun).toMatchObject({ status: "accept", loss: 0.01 });
      const secondRun = await repo.learn(OPAQUE_RAW_REF, baseLearnOptions({ threshold: 0.9, ...selectors(second) }));
      expect(secondRun).toMatchObject({ status: "accept", loss: 0.8 });

      const node = await repo.getNode(eid);
      expect(node).not.toBeNull();
      const winner = node?.props.summary?.segments.at(-1)?.value;
      // If the loss were a reducer/orderKey input, ALPHA (loss 0.01) would win. It must not.
      expect(winner, "the orderKey-max fact must win; the loss must never tiebreak (ADR-B10c/FR-J4)").toBe(BETA);

      // Both achieved losses ARE recorded (audit-only) — proving the loss was present and still inert.
      const recorded = auditFacts(dirOf(repo), "kip:learn/")
        .map((f) => (JSON.parse(String(f.value)) as { achievedLoss: number }).achievedLoss)
        .sort((a, b) => a - b);
      expect(recorded).toEqual([0.01, 0.8]);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // 10. INV-A1: the bodies get a MicroagentInvocation, never a Repo, and author nothing
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  describe("criterion 10 — INV-A1: dispatched bodies receive only a MicroagentInvocation and author nothing", () => {
    it("every invocation carries exactly {id, manifest, input, timeout}; a direct dispatch changes no graph state; facts appear only via learn()'s own commit", async () => {
      const eid = "doc:inv-a1";
      const m = roleManifests("inv-a1");
      const seen: MicroagentInvocation[] = [];
      const { dispatch } = makeScriptedDispatch({
        [m.encode.name]: (inv) => {
          seen.push(inv);
          return encodeOk([nodePropAssert(eid, "name", "Ada")]);
        },
        [m.decode.name]: (inv) => {
          seen.push(inv);
          return decodeOk();
        },
        [m.learner.name]: (inv) => {
          seen.push(inv);
          return learnerOk([nodePropAssert(eid, "name", "Ada")]);
        },
        [m.loss.name]: (inv) => {
          seen.push(inv);
          return lossOk(0.05);
        },
      });
      const repo = ownedRepo("inv-a1", { dispatchMicroagent: dispatch });
      for (const manifest of Object.values(m)) await registerManifest(repo, manifest);

      // (a) A DIRECT dispatch — outside `learn()` — returns data and authors nothing.
      const factsBefore = admittedFacts(dirOf(repo)).length;
      const direct = await dispatch({
        id: "direct:1",
        manifest: { name: m.encode.name, version: m.encode.version },
        input: { rawRef: OPAQUE_RAW_REF, ontologyAsOf: { validTime: 1 } },
        timeout: 1_000,
      });
      expect(direct.exitCode).toBe(0);
      expect(admittedFacts(dirOf(repo)).length).toBe(factsBefore);
      expect(await repo.getNode(eid)).toBeNull(); // the body's "candidate" is NOT knowledge

      // (b) Through `learn()`, the same candidate becomes a real fact — authored by the ORCHESTRATOR.
      const result = await repo.learn(OPAQUE_RAW_REF, baseLearnOptions({ threshold: 0.25, ...selectors(m) }));
      expect(result.status).toBe("accept");
      expect(await repo.getNode(eid)).not.toBeNull();

      // (c) The invocation shape: a `MicroagentInvocation`, never a `Repo` and never a write seam.
      expect(seen.length).toBeGreaterThan(0);
      for (const inv of seen) {
        expect(Object.keys(inv).sort()).toEqual(["id", "input", "manifest", "timeout"]);
        for (const forbidden of ["repo", "assertFact", "txn", "putNode", "putEdge", "ingest"]) {
          expect(inv).not.toHaveProperty(forbidden);
          expect(inv.input).not.toHaveProperty(forbidden);
        }
      }

      // (d) Every committed fact is signed by the orchestrator, never by the microagent's own
      //     declared authoring identity (`nodePropAssert` declares "m6-test-scripted-learner").
      for (const factId of result.facts) {
        // eslint-disable-next-line no-await-in-loop -- sequential provenance reads
        const prov = await repo.provenanceOf(factId);
        expect(prov.length).toBeGreaterThan(0);
        expect(prov[0]?.author).toBe("kip-orchestrator:learn");
        expect(prov[0]?.signature).toBeTruthy();
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // 11. The live model path is OPT-IN — the default suite spawns nothing, PROVABLY (ADR-B10f)
  // ══════════════════════════════════════════════════════════════════════════════════════════════

  describe("criterion 11 — KIP_LEARN_LIVE gate: default spawns nothing and fails loudly rather than fabricating", () => {
    it("with KIP_LEARN_LIVE unset the gate is disabled WITHOUT consulting the probe at all", () => {
      const probe = (): HarnessCliProbe => {
        throw new Error("probe must NOT be consulted when the env gate is off (ADR-B10f)");
      };
      const gate = resolveLearnLiveGate({ env: {}, probe });
      expect(gate.enabled).toBe(false);
      expect(gate.reason).toEqual(expect.stringContaining("KIP_LEARN_LIVE"));

      // Nor may an unrelated live flag enable it — separate budget, separate switch.
      const borrowed = resolveLearnLiveGate({ env: { KIP_ASK_LIVE: "1" }, probe });
      expect(borrowed.enabled).toBe(false);
    });

    it("with the flag set but no usable model the gate is still disabled, carrying the PROBE's reason (never a fabricated 'available')", () => {
      const gate = resolveLearnLiveGate({
        env: { KIP_LEARN_LIVE: "1" },
        probe: (): HarnessCliProbe => ({ available: false, reason: "no `claude` binary is on PATH" }),
      });
      expect(gate.enabled).toBe(false);
      expect(gate.reason).toEqual(expect.stringContaining("no `claude` binary is on PATH"));
    });

    it("the gate is enabled only when the env var says MAY and the probe says CAN", () => {
      const gate = resolveLearnLiveGate({
        env: { KIP_LEARN_LIVE: "1" },
        probe: (): HarnessCliProbe => ({ available: true }),
      });
      expect(gate.enabled).toBe(true);
    });

    it("the default (deterministic) learn path spawns NO child process", async () => {
      const spawnSpies = spawnCounters;
      spawnSpies.reset();

      const eid = "doc:no-spawn";
      const m = roleManifests("no-spawn");
      const { dispatch } = makeScriptedDispatch({
        [m.encode.name]: () => encodeOk([nodePropAssert(eid, "name", "Ada")]),
        [m.decode.name]: () => decodeOk(),
        [m.learner.name]: () => learnerOk([nodePropAssert(eid, "name", "Ada")]),
        [m.loss.name]: () => lossOk(0.05),
      });
      const repo = ownedRepo("no-spawn", { dispatchMicroagent: dispatch });
      for (const manifest of Object.values(m)) await registerManifest(repo, manifest);

      const result = await repo.learn(OPAQUE_RAW_REF, baseLearnOptions({ threshold: 0.25, ...selectors(m) }));
      expect(result.status).toBe("accept");

      // ADR-B10f: "the default suite spawns nothing and spends nothing" — provable, not promised.
      expect(spawnSpies.total()).toBe(0);
    });

    it("makeLearnDispatch with an unroutable manifest name is a LOUD failure, never a silent pass-through", async () => {
      const repo = ownedRepo("unrouted");
      const dispatch = makeLearnDispatch({
        repo,
        run: async (): Promise<HarnessCliRun> => ({ exitCode: 0, stdout: "{}" }),
        probe: (): HarnessCliProbe => ({ available: true }),
      });
      await expect(
        dispatch({
          id: "learn:encode:not-a-learn-manifest@1.0.0:1",
          manifest: { name: "not-a-learn-manifest", version: "1.0.0" },
          input: {},
          timeout: 1_000,
        }),
      ).rejects.toThrow(/not-a-learn-manifest/);
    });
  });
});
