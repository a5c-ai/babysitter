/**
 * round2-learn-critic-fixes.test.ts — the round-2 adversarial-critic findings against the
 * `kip learn` text→graph loop, each pinned by an executable assertion rather than a comment.
 *
 *  1. **The loop must never prompt a model with an ABSENT document.** ADR-B10b's encode contract is
 *     verbatim: `getBlob` → `null` is `exitCode: 1` ("rawRef resolves to no blob in this repo") —
 *     *never invent a document*. Round 1 shipped the opposite for encode and the learner: a
 *     `renderDocumentBlock(null)` branch told the model the bytes were absent and asked it to work
 *     from "what else is given" — which, in the ENCODE prompt, is NOTHING. That is a request to
 *     fabricate a knowledge graph out of thin air, in the one feature whose entire point is that a
 *     bad reply becomes an honest failed iteration (N5).
 *  2. **EID namespacing lives in the COMPILER.** ADR-B10d prescribes `doc:<rawRef.blob>#<slug>`
 *     "in the compiler, not the prompt". Because the M1 cell key is `(eid, prop)`, two documents
 *     whose model slugs an entity identically fold onto the SAME cells, and orderKey-max lets the
 *     LATER document win — so `ask` could answer a question about document A with document B's
 *     value while citing a real, signed FactId.
 *  3. **The `KIP_LEARN_LIVE` gate must actually gate.** `resolveLearnLiveGate` existed but nothing
 *     in production called it: `kip learn` spawned the authenticated `claude` CLI unconditionally,
 *     up to 3× per iteration at a 300s timeout each — real, unbudgeted spend under an ADR that
 *     claimed containment.
 *  6. **The loss diagnostics must not be discarded.** `missing`/`fabricated` are the loop's ONLY
 *     fabrication signal; they go OUT OF BAND (the return value must stay the bare number,
 *     ADR-B10d trap 2).
 *  9. **`recall`'s `k` is a bound**, so it must be a positive integer — a negative `k` reaches
 *     `Array.slice` from the END and silently returns the wrong set.
 *
 * ZERO SPAWNS: every model call is the injected `run` seam, and the tests that assert "nothing was
 * spawned" assert it against that seam's call count (the CLI gate test additionally proves the repo
 * was never even opened).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runCli } from "../cli";
import type { HarnessCliProbe, HarnessCliRequest, HarnessCliRun } from "../cli/ask";
import type { BlobRef, MicroagentInvocation, MicroagentResult, OpenOptions, Repo } from "../index";
import { KipError, KipRepo } from "../index";
import { LEARN_MANIFEST_NAMES, makeLearnDispatch, resolveLearnManifests, type LearnDiagnostic } from "../learn";
import { compileGraphToAssertInputs, namespaceEid, type LearnGraph } from "../learn/compile";
import { Substrate } from "../substrate";
import { baseLearnOptions, freshReplicaId, registerManifest } from "./conformance/fixtures-m6";

const DOCUMENT_A = "Ada Lovelace worked with Charles Babbage on the Analytical Engine.\n";
const DOCUMENT_B = "Ada Nakamura runs the Kyoto bakery on Teramachi street.\n";
/** A 40-hex ref that resolves to NO blob in any repo built here. */
const UNRESOLVABLE: BlobRef = { blob: "c".repeat(40) };

const repos: KipRepo[] = [];
const dirs: string[] = [];
afterEach(() => {
  for (const repo of repos.splice(0)) repo.close();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const dirByRepo = new Map<KipRepo, string>();
function ownedRepo(label: string, options?: Partial<ConstructorParameters<typeof KipRepo>[0]>): KipRepo {
  const dir = mkdtempSync(join(tmpdir(), `kip-r2-${label}-`));
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

/** The `kip:learn` ACCEPT audit facts durably admitted to `dir` — the "knowledge entered" signal. */
function learnAcceptFacts(dir: string): Array<Record<string, unknown>> {
  return new Substrate(dir, "sha1")
    .listFactBlobs()
    .map((json) => JSON.parse(json) as Record<string, unknown>)
    .filter((f) => {
      const target = f.target as { kind?: string; ontologyRef?: string } | undefined;
      return (
        target?.kind === "schema" &&
        typeof target.ontologyRef === "string" &&
        target.ontologyRef.startsWith("kip:learn/")
      );
    });
}

const alwaysAvailable = (): HarnessCliProbe => ({ available: true });

// ════════════════════════════════════════════════════════════════════════════════════════════════
// FINDING 1 — an unresolvable rawRef is an honest failed iteration, never an invented document
// ════════════════════════════════════════════════════════════════════════════════════════════════

describe("round-2 finding 1 — a `getBlob` MISS fails the iteration; no role is ever prompted without the document (ADR-B10b)", () => {
  const invocationFor = (role: "encode" | "learner" | "loss", rawRef: BlobRef): MicroagentInvocation => ({
    id: `learn:${role}:${LEARN_MANIFEST_NAMES[role]}@1.0.0:1`,
    manifest: { name: LEARN_MANIFEST_NAMES[role], version: "1.0.0" },
    input:
      role === "learner"
        ? { rawRef, current: [], loss: 0.5, ontologyAsOf: { validTime: 1 } }
        : role === "loss"
          ? { rawRef, reconstructed: UNRESOLVABLE }
          : { rawRef, ontologyAsOf: { validTime: 1 } },
    timeout: 120_000,
  });

  for (const role of ["encode", "learner", "loss"] as const) {
    it(`the ${role} body returns exitCode 1 naming the unresolvable rawRef, and NEVER reaches the model`, async () => {
      const repo = ownedRepo(`miss-${role}`);
      const requests: HarnessCliRequest[] = [];
      const run = async (req: HarnessCliRequest): Promise<HarnessCliRun> => {
        requests.push(req);
        return { exitCode: 0, stdout: JSON.stringify({ result: JSON.stringify({ nodes: [], edges: [] }) }) };
      };
      const dispatch = makeLearnDispatch({ repo, run, probe: alwaysAvailable });

      const result = await dispatch(invocationFor(role, UNRESOLVABLE));

      expect(result.exitCode).toBe(1);
      const reason = String((result.output as { error?: unknown } | null)?.error ?? "");
      expect(reason).toContain(UNRESOLVABLE.blob);
      expect(reason).toContain("resolves to no blob in this repo");
      // THE POINT: the model was never asked anything. A prompt built around an absent document is
      // a request to fabricate, so the failure must happen BEFORE the spawn seam is touched.
      expect(requests).toHaveLength(0);
    });
  }

  it("end to end: `learn()` over an unresolvable rawRef ends `exhausted` with ZERO kip:learn facts and zero model calls", async () => {
    const manifests = resolveLearnManifests();
    let bodies: ((invocation: MicroagentInvocation) => Promise<MicroagentResult>) | undefined;
    const repo = ownedRepo("miss-e2e", {
      dispatchMicroagent: async (invocation: MicroagentInvocation): Promise<MicroagentResult> => {
        if (bodies === undefined) throw new Error("miss-e2e: the learn bodies were never wired");
        return bodies(invocation);
      },
    });
    const requests: HarnessCliRequest[] = [];
    const run = async (req: HarnessCliRequest): Promise<HarnessCliRun> => {
      requests.push(req);
      // A deliberately PERFECT reply, so the only thing standing between this run and an accept is
      // the missing document. If the bodies invented one, this run would accept and fail below.
      const reply = req.stdin.startsWith("You are the kip knowledge decoder")
        ? { document: DOCUMENT_A }
        : req.stdin.startsWith("You are the kip reconstruction scorer")
          ? { loss: 0.0 }
          : { nodes: [{ eid: "ada", kind: "person", props: { name: "Ada" } }], edges: [] };
      return { exitCode: 0, stdout: JSON.stringify({ result: JSON.stringify(reply) }) };
    };
    bodies = makeLearnDispatch({ repo, run, probe: alwaysAvailable });
    for (const manifest of Object.values(manifests)) await registerManifest(repo, manifest);

    const outcome = await repo.learn(
      UNRESOLVABLE,
      baseLearnOptions({
        threshold: 0.25,
        maxIterations: 3,
        encode: { name: manifests.encode.name, version: manifests.encode.version },
        decode: { name: manifests.decode.name, version: manifests.decode.version },
        learner: { name: manifests.learner.name, version: manifests.learner.version },
        loss: { name: manifests.loss.name, version: manifests.loss.version },
      }),
    );

    expect(outcome.status).toBe("exhausted");
    expect(learnAcceptFacts(dirOf(repo))).toHaveLength(0);
    expect(await repo.getNode(namespaceEid(UNRESOLVABLE.blob, "ada"))).toBeNull();
    expect(await repo.getNode("ada")).toBeNull();
    expect(requests, "not one model call may be made for a document this repo does not hold").toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// FINDING 2 — eid namespacing in the compiler: no cross-document contamination, and re-learn folds
// ════════════════════════════════════════════════════════════════════════════════════════════════

describe("round-2 finding 2 — the compiler namespaces eids `doc:<rawBlob>#<slug>` (ADR-B10d)", () => {
  const GRAPH: LearnGraph = {
    nodes: [
      { eid: "ada", kind: "person", props: { name: "Ada" } },
      { eid: "engine", kind: "machine", props: { name: "Analytical Engine" } },
    ],
    edges: [{ eid: "ada->engine", edgeKind: "worked_on", from: "ada", to: "engine", props: { role: "author" } }],
  };

  it("namespaces node eids, edge eids AND endpoints — and is IDEMPOTENT, so the learner's echo does not re-prefix", () => {
    const compiled = compileGraphToAssertInputs(GRAPH, {
      replicaId: "kip-learn-encode",
      source: "kip-learn://b1",
      rawBlob: "b1",
    });
    const targets = compiled.map((c) => c.target as Record<string, string>);
    expect(targets.filter((t) => t.kind === "node").map((t) => t.eid).sort()).toEqual([
      "doc:b1#ada",
      "doc:b1#engine",
    ]);
    const edge = targets.find((t) => t.kind === "edge")!;
    expect(edge.eid).toBe("doc:b1#ada->engine");
    expect(edge.from).toBe("doc:b1#ada");
    expect(edge.to).toBe("doc:b1#engine");

    // IDEMPOTENCE — the learner is shown the CURRENT (namespaced) graph and told to keep its eids,
    // so its reply comes back pre-namespaced. Re-prefixing would mint a disjoint entity set every
    // iteration, which is exactly the instability the namespace exists to prevent.
    const echoed: LearnGraph = {
      nodes: [{ eid: "doc:b1#ada", kind: "person", props: { name: "Ada Lovelace" } }],
      edges: [],
    };
    const second = compileGraphToAssertInputs(echoed, {
      replicaId: "kip-learn-learner",
      source: "kip-learn://b1",
      rawBlob: "b1",
    });
    expect((second[0].target as { eid: string }).eid).toBe("doc:b1#ada");
  });

  it("REFUSES to compile without a rawBlob namespace (the collision is not opt-out-able)", () => {
    expect(() =>
      compileGraphToAssertInputs(GRAPH, { replicaId: "r", source: "s" } as never),
    ).toThrow(/rawBlob/);
  });

  it("two documents whose model slugs an entity IDENTICALLY stay disjoint — neither can overwrite the other's cell", async () => {
    const manifests = resolveLearnManifests();
    let bodies: ((invocation: MicroagentInvocation) => Promise<MicroagentResult>) | undefined;
    const repo = ownedRepo("two-docs", {
      dispatchMicroagent: async (invocation: MicroagentInvocation): Promise<MicroagentResult> => {
        if (bodies === undefined) throw new Error("two-docs: the learn bodies were never wired");
        return bodies(invocation);
      },
    });
    // BOTH documents make the model emit the SAME slug `ada` with a DIFFERENT `occupation` — the
    // collision shape: identical `(eid, prop)` cell keys, different values, resolved by orderKey-max.
    const run = async (req: HarnessCliRequest): Promise<HarnessCliRun> => {
      const isB = req.stdin.includes("Kyoto bakery");
      const reply = req.stdin.startsWith("You are the kip knowledge decoder")
        ? { document: isB ? DOCUMENT_B : DOCUMENT_A }
        : req.stdin.startsWith("You are the kip reconstruction scorer")
          ? { loss: 0.01 }
          : {
              nodes: [
                { eid: "ada", kind: "person", props: { occupation: isB ? "baker" : "mathematician" } },
              ],
              edges: [],
            };
      return { exitCode: 0, stdout: JSON.stringify({ result: JSON.stringify(reply) }) };
    };
    bodies = makeLearnDispatch({ repo, run, probe: alwaysAvailable });
    for (const manifest of Object.values(manifests)) await registerManifest(repo, manifest);
    const options = baseLearnOptions({
      threshold: 0.25,
      maxIterations: 2,
      encode: { name: manifests.encode.name, version: manifests.encode.version },
      decode: { name: manifests.decode.name, version: manifests.decode.version },
      learner: { name: manifests.learner.name, version: manifests.learner.version },
      loss: { name: manifests.loss.name, version: manifests.loss.version },
    });

    const refA = await repo.putBlob(Buffer.from(DOCUMENT_A, "utf8"));
    const refB = await repo.putBlob(Buffer.from(DOCUMENT_B, "utf8"));
    expect(refA.blob).not.toBe(refB.blob);
    expect((await repo.learn(refA, options)).status).toBe("accept");
    expect((await repo.learn(refB, options)).status).toBe("accept");

    const nodeA = await repo.getNode(namespaceEid(refA.blob, "ada"));
    const nodeB = await repo.getNode(namespaceEid(refB.blob, "ada"));
    expect(nodeA).not.toBeNull();
    expect(nodeB).not.toBeNull();
    // THE DEFECT, PINNED: each document keeps its OWN value. Un-namespaced, both would be the same
    // cell and the later run's "baker" would answer a question about the mathematician.
    expect(nodeA?.props.occupation?.segments.at(-1)?.value).toBe("mathematician");
    expect(nodeB?.props.occupation?.segments.at(-1)?.value).toBe("baker");
    // …and the bare slug is nobody's node.
    expect(await repo.getNode("ada")).toBeNull();
  });

  it("RE-learning the SAME document FOLDS onto the same eids (INV-11) rather than doubling the graph", async () => {
    const manifests = resolveLearnManifests();
    let bodies: ((invocation: MicroagentInvocation) => Promise<MicroagentResult>) | undefined;
    const repo = ownedRepo("relearn", {
      dispatchMicroagent: async (invocation: MicroagentInvocation): Promise<MicroagentResult> => {
        if (bodies === undefined) throw new Error("relearn: the learn bodies were never wired");
        return bodies(invocation);
      },
    });
    let pass = 0;
    const run = async (req: HarnessCliRequest): Promise<HarnessCliRun> => {
      const reply = req.stdin.startsWith("You are the kip knowledge decoder")
        ? { document: DOCUMENT_A }
        : req.stdin.startsWith("You are the kip reconstruction scorer")
          ? { loss: 0.01 }
          : { nodes: [{ eid: "ada", kind: "person", props: { name: pass === 0 ? "Ada" : "Ada Lovelace" } }], edges: [] };
      return { exitCode: 0, stdout: JSON.stringify({ result: JSON.stringify(reply) }) };
    };
    bodies = makeLearnDispatch({ repo, run, probe: alwaysAvailable });
    for (const manifest of Object.values(manifests)) await registerManifest(repo, manifest);
    const options = baseLearnOptions({
      threshold: 0.25,
      maxIterations: 2,
      encode: { name: manifests.encode.name, version: manifests.encode.version },
      decode: { name: manifests.decode.name, version: manifests.decode.version },
      learner: { name: manifests.learner.name, version: manifests.learner.version },
      loss: { name: manifests.loss.name, version: manifests.loss.version },
    });

    const ref = await repo.putBlob(Buffer.from(DOCUMENT_A, "utf8"));
    expect((await repo.learn(ref, options)).status).toBe("accept");
    pass = 1;
    expect((await repo.learn(ref, options)).status).toBe("accept");

    const eid = namespaceEid(ref.blob, "ada");
    const node = await repo.getNode(eid);
    // ONE entity, refined — the second run's value covers the first's on the SAME cell.
    expect(node?.props.name?.segments.at(-1)?.value).toBe("Ada Lovelace");
    let personCount = 0;
    for await (const item of repo.query({ seed: [eid], direction: "both", depth: 1, maxFanout: 16 })) {
      if (!("from" in item) && item.kind === "person") personCount += 1;
    }
    expect(personCount).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// FINDING 3 — the KIP_LEARN_LIVE gate is WIRED: `kip learn` without it costs nothing
// ════════════════════════════════════════════════════════════════════════════════════════════════

describe("round-2 finding 3 — `kip learn` enforces the KIP_LEARN_LIVE opt-in gate (ADR-B10f)", () => {
  it("without the env var it exits NON-ZERO carrying the gate's reason, opens no repo and spawns nothing", async () => {
    const dir = mkdtempSync(join(tmpdir(), "kip-r2-gate-"));
    dirs.push(dir);
    const file = join(dir, "note.md");
    writeFileSync(file, DOCUMENT_A, "utf8");

    let opened = 0;
    const out: string[] = [];
    const err: string[] = [];
    const code = await runCli(["learn", file], {
      cwd: dir,
      env: {}, // KIP_LEARN_LIVE unset — the default for every developer and every CI job.
      stdout: (c) => out.push(c),
      stderr: (c) => err.push(c),
      openRepo: async (_o: OpenOptions): Promise<Repo> => {
        opened += 1;
        throw new Error("kip learn must not open a repo when the live gate is disabled");
      },
    });

    expect(code).not.toBe(0);
    expect(err.join("")).toContain("KIP_LEARN_LIVE");
    // The gate is PURE when the env var is absent: it does not even consult the probe, so a machine
    // with no `claude` binary and a machine with one behave identically here.
    expect(err.join("")).toContain("The probe was NOT consulted.");
    expect(opened, "nothing may be opened, blobbed or authored before the gate passes").toBe(0);
    expect(out.join("")).toBe("");
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// FINDING 6 — the loss diagnostics reach the operator, out of band, with the return value still bare
// ════════════════════════════════════════════════════════════════════════════════════════════════

describe("round-2 finding 6 — `missing`/`fabricated` are surfaced out of band (ADR-B10b/B10e)", () => {
  it("the loss body reports the diagnostics via onDiagnostic AND still returns the BARE number (trap 2)", async () => {
    const repo = ownedRepo("loss-diagnostics");
    const original = await repo.putBlob(Buffer.from(DOCUMENT_A, "utf8"));
    const reconstructed = await repo.putBlob(Buffer.from("Ada worked on something.\n", "utf8"));
    const diagnostics: LearnDiagnostic[] = [];
    const run = async (): Promise<HarnessCliRun> => ({
      exitCode: 0,
      stdout: JSON.stringify({
        result: JSON.stringify({
          loss: 0.4,
          missing: ["Charles Babbage", "the Analytical Engine"],
          fabricated: ["a birthplace the document never states"],
          rationale: "the reconstruction drops both collaborators",
        }),
      }),
    });
    const dispatch = makeLearnDispatch({
      repo,
      run,
      probe: alwaysAvailable,
      onDiagnostic: (d) => diagnostics.push(d),
    });

    const result = await dispatch({
      id: `learn:loss:${LEARN_MANIFEST_NAMES.loss}@1.0.0:1`,
      manifest: { name: LEARN_MANIFEST_NAMES.loss, version: "1.0.0" },
      input: { rawRef: original, reconstructed },
      timeout: 90_000,
    });

    // BARE — an object here scores as infinite loss and every run reports "exhausted".
    expect(result.exitCode).toBe(0);
    expect(result.output).toBe(0.4);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].role).toBe("loss");
    expect(diagnostics[0].loss).toBe(0.4);
    expect(diagnostics[0].missing).toEqual(["Charles Babbage", "the Analytical Engine"]);
    expect(diagnostics[0].fabricated).toEqual(["a birthplace the document never states"]);
    expect(diagnostics[0].rationale).toContain("collaborators");
  });

  it("a model that supplies no diagnostics yields empty lists — never a fabricated finding", async () => {
    const repo = ownedRepo("loss-no-diagnostics");
    const original = await repo.putBlob(Buffer.from(DOCUMENT_A, "utf8"));
    const reconstructed = await repo.putBlob(Buffer.from(DOCUMENT_A, "utf8"));
    const diagnostics: LearnDiagnostic[] = [];
    const run = async (): Promise<HarnessCliRun> => ({
      exitCode: 0,
      stdout: JSON.stringify({ result: JSON.stringify({ loss: 0 }) }),
    });
    const dispatch = makeLearnDispatch({ repo, run, probe: alwaysAvailable, onDiagnostic: (d) => diagnostics.push(d) });
    const result = await dispatch({
      id: `learn:loss:${LEARN_MANIFEST_NAMES.loss}@1.0.0:2`,
      manifest: { name: LEARN_MANIFEST_NAMES.loss, version: "1.0.0" },
      input: { rawRef: original, reconstructed },
      timeout: 90_000,
    });
    expect(result.output).toBe(0);
    expect(diagnostics[0].missing).toEqual([]);
    expect(diagnostics[0].fabricated).toEqual([]);
    expect(diagnostics[0].rationale).toBeUndefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// FINDING 9 — `recall`'s `k` is a positive-integer BOUND
// ════════════════════════════════════════════════════════════════════════════════════════════════

describe("round-2 finding 9 — recall rejects a non-positive `k` instead of slicing from the end", () => {
  it("k: 0, k: -1 and a fractional k are all ERR_MALFORMED_INPUT (the throw channel, never a repair)", async () => {
    const repo = ownedRepo("k-guard");
    for (const k of [0, -1, 2.5]) {
      // eslint-disable-next-line no-await-in-loop -- one assertion per bad bound, sequentially
      await expect(repo.recall({ text: "anything", k })).rejects.toBeInstanceOf(KipError);
    }
    // …and a valid bound still works (the guard is a bound check, not a new restriction).
    await expect(repo.recall({ text: "anything", k: 5 })).resolves.toEqual([]);
  });
});
