/**
 * FROZEN acceptance tests for the code-analysis Miner (M7 acquisition family) — ADR-B9/B9a/B9b/B9c
 * (docs/70-decision-records-adr.md) + docs/33-mining-discovery-ingestion.md + docs/40-sdk-api-surface.md.
 *
 * The Miner is a STANDALONE (sourceless, non-edge-bound) genty microagent: given a repository dir it
 * runs static analysis over the tracked source tree and RETURNS candidate objects-of-interest as an
 * `AcquisitionResult` payload. The orchestrator (`Repo.runAcquisition`) — NEVER the miner — authors
 * those candidates as signed, source-provenanced kip facts. INV-A1: the miner writes NOTHING.
 *
 * These are frozen inputs to a later implementation phase, authored STRICTLY from the spec + ADRs,
 * NOT from any implementation. `buildCodeMinerResult`/`codeMinerDispatch` are unimplemented stubs
 * this round (an empty candidate set with a source carrying no `code-resource://` uri), so every
 * acceptance assertion below FAILS on its own diff — never on a type/syntax/import error.
 *
 * Injection seam: the real `codeMinerDispatch` is injected as the `KipRepo` constructor's
 * `dispatchMicroagent` seam (the SAME seam the frozen `m7-acquisition.test.ts` uses), and the miner
 * output is committed through the already-implemented `runAcquisition` orchestrator. The Miner is
 * exercised over a REAL fixture git repo created under the OS temp dir (never the real repo).
 *
 * ADR-B9b fact schema under test:
 *   nodeKinds  code:repo / code:module (a file; EID = git-relative path) / code:package / code:symbol
 *   edgeKinds  code:contains / code:imports (with a `spec` edge-prop) / code:exports / code:depends_on
 *   provenance source.uri = `code-resource://<repoId>@<gitSha>` (the EID-dedup + reproducibility anchor)
 *   EIDs       deterministic, path-derived → a re-index dedups by EID rather than duplicating nodes
 *   tools      guaranteed(git + node builtins) vs probed(rg/tokei/scc/cloc) with
 *              N5 probe-and-skip-with-reason (an absent tool omits its metric, RECORDED not guessed)
 *
 * EID normalization note: ADR-B9b pins the code:module localId to the git-relative path but does NOT
 * pin the tenant/namespace/repoId EID prefix, so these tests assert the path-derived SUFFIX
 * (`endsWith`) of every EID rather than an invented full-EID prefix — the deterministic, spec-pinned
 * part. The `format`/`spec`/`skipped:<tool>` prop keys ARE pinned here as the frozen contract per the
 * criteria (detected file formats, unresolved import specifier, recorded skip reason).
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { AssertInput, RetractInput } from "../index";
import { KipRepo } from "../index";
import { buildCodeMinerResult, codeMinerDispatch, type CodeMinerInput } from "../miner/code-miner";
import { FIXED_AS_OF, freshReplicaId, registerAcquisitionManifest } from "./conformance/fixtures-m7";

type Candidate = AssertInput | RetractInput;

// --- fixture repo (a REAL git repo under os.tmpdir(), NOT the project repo) --------------------

/** `a.ts` imports from `./b` (an intra-repo import → a `code:imports` edge between two modules) and
 *  exports the symbol `A`; `b.ts` exports the symbol `B`. A minimal, fully deterministic tree. */
const FIXTURE_FILES: Record<string, string> = {
  "a.ts": 'import { B } from "./b";\nexport const A = B + 1;\n',
  "b.ts": "export const B = 2;\n",
};

interface FixtureRepo {
  repoDir: string;
  gitSha: string;
  /** The AUTHORITATIVE git-blob oids (`git hash-object <file>`) per fixture file — the exact content
   *  address the miner's `content` BlobRef must reproduce (round-3: the NUL-byte git-blob header). */
  blobOids: Record<string, string>;
  cleanup: () => void;
}

/** Creates the fixture as a real git repo and returns its dir + HEAD sha. Uses the system `git`
 *  binary (present in this repo/CI); commits are unsigned with a pinned identity so no global git
 *  config is required. */
function makeFixtureRepo(): FixtureRepo {
  const repoDir = mkdtempSync(join(tmpdir(), "kip-code-miner-fixture-"));
  for (const [name, content] of Object.entries(FIXTURE_FILES)) {
    writeFileSync(join(repoDir, name), content, "utf8");
  }
  const git = (...args: string[]): string =>
    execFileSync("git", args, {
      cwd: repoDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  git("init", "-q");
  git("config", "user.email", "fixture@kip.test");
  git("config", "user.name", "kip fixture");
  git("config", "commit.gpgsign", "false");
  git("add", "-A");
  git("-c", "user.email=fixture@kip.test", "-c", "user.name=kip fixture", "commit", "-q", "-m", "fixture");
  const gitSha = git("rev-parse", "HEAD");
  // The authoritative git-blob oid per file, straight from git — the exact value the miner must emit.
  const blobOids: Record<string, string> = {};
  for (const name of Object.keys(FIXTURE_FILES)) blobOids[name] = git("hash-object", name);
  return { repoDir, gitSha, blobOids, cleanup: () => rmSync(repoDir, { recursive: true, force: true }) };
}

// --- candidate helpers (normalize over the un-pinned EID prefix; see file header) --------------

function nodesOfKind(proposed: readonly Candidate[], nodeKind: string): Candidate[] {
  return proposed.filter((c) => c.target.kind === "node" && c.target.nodeKind === nodeKind);
}
function edgesOfKind(proposed: readonly Candidate[], edgeKind: string): Candidate[] {
  return proposed.filter((c) => c.target.kind === "edge" && c.target.edgeKind === edgeKind);
}
function nodePropsNamed(proposed: readonly Candidate[], prop: string): Candidate[] {
  return proposed.filter((c) => c.target.kind === "node-prop" && c.target.prop === prop);
}
function edgePropsNamed(proposed: readonly Candidate[], prop: string): Candidate[] {
  return proposed.filter((c) => c.target.kind === "edge-prop" && c.target.prop === prop);
}
/** The path-derived EID suffix of each node of a kind (ADR-B9b: code:module EID = git-relative path). */
function nodeEidSuffixes(proposed: readonly Candidate[], nodeKind: string, suffixes: string[]): boolean[] {
  const eids = nodesOfKind(proposed, nodeKind).map((c) => (c.target as { eid: string }).eid);
  return suffixes.map((s) => eids.some((eid) => eid.endsWith(s)));
}

const CODE_RESOURCE_URI = /^code-resource:\/\/[^@]+@[0-9a-f]{7,40}$/;

// ----------------------------------------------------------------------------------------------

describe("code-analysis Miner (M7) — buildCodeMinerResult / codeMinerDispatch → runAcquisition", () => {
  let fixture: FixtureRepo;
  const repos: KipRepo[] = [];

  beforeAll(() => {
    fixture = makeFixtureRepo();
  });
  afterAll(() => {
    fixture.cleanup();
  });
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  const input = (): CodeMinerInput => ({ repoDir: fixture.repoDir, gitSha: fixture.gitSha });

  /** A repo whose dispatch seam is the REAL code miner, plus a registered `code-miner` manifest. */
  async function minerRepo(label: string): Promise<{ repo: KipRepo; manifest: import("../index").MicroagentManifest }> {
    const repo = new KipRepo({ replicaId: freshReplicaId(label), dispatchMicroagent: codeMinerDispatch });
    repos.push(repo);
    const manifest = await registerAcquisitionManifest(repo, "code-miner");
    return { repo, manifest };
  }

  // === Criterion 1: fact-building correctness (exact deterministic candidate set) ==============

  it("emits the exact code:module / code:imports / code:exports / code:symbol candidate set with detected formats", () => {
    const { proposed } = buildCodeMinerResult(input());

    // Exactly one code:module node per source file, EID derived from the git-relative path.
    const modules = nodesOfKind(proposed, "code:module");
    expect(modules.length).toBe(2);
    expect(nodeEidSuffixes(proposed, "code:module", ["a.ts", "b.ts"])).toEqual([true, true]);

    // Exactly one code:imports edge between the two modules (a.ts → b.ts) carrying the raw specifier.
    const imports = edgesOfKind(proposed, "code:imports");
    expect(imports.length).toBe(1);
    const importEdge = imports[0]?.target as { eid: string; from?: string; to?: string };
    expect(importEdge.from?.endsWith("a.ts")).toBe(true);
    expect(importEdge.to?.endsWith("b.ts")).toBe(true);
    // The unresolved specifier is recorded as a `spec` edge-prop on that import edge (ADR-B9b).
    const specProps = edgePropsNamed(proposed, "spec");
    expect(specProps.some((c) => c.type === "assert" && c.value === "./b")).toBe(true);

    // A code:exports edge from each module to a code:symbol node, and the symbol nodes themselves.
    const exportsEdges = edgesOfKind(proposed, "code:exports");
    const exportFroms = exportsEdges.map((c) => (c.target as { from?: string }).from ?? "");
    expect(exportFroms.some((f) => f.endsWith("a.ts"))).toBe(true);
    expect(exportFroms.some((f) => f.endsWith("b.ts"))).toBe(true);
    expect(nodeEidSuffixes(proposed, "code:symbol", ["a.ts#A", "b.ts#B"])).toEqual([true, true]);

    // Detected file format recorded as a `format` node-prop on each module (a non-empty string).
    const formats = nodePropsNamed(proposed, "format");
    expect(formats.length).toBeGreaterThanOrEqual(2);
    expect(formats.every((c) => c.type === "assert" && typeof c.value === "string" && c.value.length > 0)).toBe(true);
  });

  // === Criterion 2: provenance on every fact ==================================================

  it("stamps a well-formed code-resource://<repoId>@<gitSha> source on the result AND on every committed fact", async () => {
    // (a) result-level: the AcquisitionResult.source.source.uri is well-formed and anchored to gitSha.
    const uri = buildCodeMinerResult(input()).source.source?.uri;
    expect(uri).toMatch(CODE_RESOURCE_URI);
    expect(uri?.endsWith(`@${fixture.gitSha}`)).toBe(true);

    // (b) fact-level: runAcquisition records that source as provenance.source on EVERY minted fact.
    const { repo, manifest } = await minerRepo("prov");
    const { facts } = await repo.runAcquisition(manifest, input(), { asOf: FIXED_AS_OF });
    expect(facts.length).toBeGreaterThan(0);
    for (const f of facts) {
      // eslint-disable-next-line no-await-in-loop -- sequential provenance reads
      const prov = await repo.provenanceOf(f);
      expect(prov.length).toBeGreaterThan(0);
      expect(prov[0]?.signature).toBeTruthy(); // orchestrator-signed (INV-A1)
      expect(prov[0]?.source?.uri).toMatch(CODE_RESOURCE_URI);
      expect(prov[0]?.source?.uri?.endsWith(`@${fixture.gitSha}`)).toBe(true);
    }
  });

  // === Criterion 3: INV-A1 — the miner authors nothing; only runAcquisition does ==============

  it("(a) dispatching the miner directly returns data and authors NO graph fact; (b/c) runAcquisition authors ordered signed facts", async () => {
    const { repo, manifest } = await minerRepo("inv-a1");

    // (a) The dispatch fn receives ONLY a MicroagentInvocation (no Repo) — it returns data and cannot
    //     touch any write path. The graph frontier is unchanged after a direct dispatch.
    const result = await codeMinerDispatch({
      id: "code-miner:direct",
      manifest: { name: manifest.name, version: manifest.version },
      input: input(),
    });
    expect(result.exitCode).toBe(0);
    const directProposed = (result.output as { proposed: Candidate[] }).proposed;
    const aModule = nodesOfKind(directProposed, "code:module").find((c) => (c.target as { eid: string }).eid.endsWith("a.ts"));
    const moduleEid = (aModule?.target as { eid: string } | undefined)?.eid;
    expect(moduleEid).toBeDefined();
    // The direct dispatch authored nothing — the object-of-interest is NOT yet in the graph.
    expect(await repo.getNode(moduleEid as string)).toBeNull();

    // (b) Only runAcquisition turns the result into signed facts, now readable via getNode.
    const { facts } = await repo.runAcquisition(manifest, input(), { asOf: FIXED_AS_OF });
    expect(await repo.getNode(moduleEid as string)).not.toBeNull();

    // (c) The returned FactId[] cardinality matches the AcquisitionResult order (INV-A10): one FactId
    //     per proposed entry then one per sameAs entry, all distinct.
    const expected = buildCodeMinerResult(input());
    const expectedCount = expected.proposed.length + (expected.sameAs?.length ?? 0);
    expect(facts.length).toBe(expectedCount);
    expect(new Set(facts).size).toBe(facts.length);
  });

  // === Criterion 4: N5 probe-and-skip (recorded reason, never fabricated) ======================

  it("guaranteed git+node-builtin analysis succeeds with ZERO optional tools, and an absent tool is RECORDED-skipped not guessed", () => {
    // Default behavior needs NO external binary: the guaranteed tier still produces the core scan.
    const { proposed } = buildCodeMinerResult(input());
    expect(nodesOfKind(proposed, "code:module").length).toBeGreaterThanOrEqual(2);

    // Round-2 finding #1: a GUARANTEED per-module `linesOfCode` node-prop (newline count) is present
    // with ZERO external tools — a numeric value, computed from the read bytes, not a probed metric.
    const locProps = nodePropsNamed(proposed, "linesOfCode");
    expect(locProps.length).toBeGreaterThanOrEqual(2);
    expect(
      locProps.every((c) => c.type === "assert" && typeof c.value === "number" && (c.value as number) >= 0),
    ).toBe(true);
    // Round-3: the per-module `linesOfCode` equals the EXACT newline count of that fixture file (derived
    // here from the fixture content, independent of the implementation). A constant-0 LOC would fail this.
    const locByEid = new Map<string, unknown>();
    for (const c of locProps) if (c.type === "assert") locByEid.set((c.target as { eid: string }).eid, c.value);
    for (const [name, content] of Object.entries(FIXTURE_FILES)) {
      const expectedLoc = (content.match(/\n/g) ?? []).length;
      const hit = [...locByEid].find(([eid]) => eid.endsWith(name));
      expect(hit, `linesOfCode node-prop for ${name}`).toBeDefined();
      expect(hit?.[1], `linesOfCode for ${name}`).toBe(expectedLoc);
    }

    // Round-2 finding #3: a GUARANTEED per-module `content` node-prop is a BlobRef ({ blob: <cid> }), a
    // git-blob-style content address present with ZERO external tools.
    const contentProps = nodePropsNamed(proposed, "content");
    expect(contentProps.length).toBeGreaterThanOrEqual(2);
    expect(
      contentProps.every(
        (c) =>
          c.type === "assert" &&
          typeof c.value === "object" &&
          c.value !== null &&
          typeof (c.value as { blob?: unknown }).blob === "string" &&
          (c.value as { blob: string }).blob.length > 0,
      ),
    ).toBe(true);
    // Round-3: the `content` BlobRef oid equals `git hash-object <file>` EXACTLY (git's NUL-byte blob
    // header). The round-2 space-header bug produced a DIFFERENT digest, so this assertion fails against
    // it and passes only with the correct NUL-byte oid.
    const blobByEid = new Map<string, unknown>();
    for (const c of contentProps) {
      if (c.type === "assert") blobByEid.set((c.target as { eid: string }).eid, (c.value as { blob?: unknown }).blob);
    }
    for (const [name, oid] of Object.entries(fixture.blobOids)) {
      const hit = [...blobByEid].find(([eid]) => eid.endsWith(name));
      expect(hit, `content BlobRef for ${name}`).toBeDefined();
      expect(hit?.[1], `content blob oid for ${name}`).toBe(oid);
    }

    // N5: an omitted optional analysis is RECORDED with a reason (a `skipped:<tool>` node-prop with a
    // non-empty string reason), never silently dropped.
    const skips = proposed.filter(
      (c) => c.target.kind === "node-prop" && c.target.prop.startsWith("skipped:"),
    );
    expect(skips.length).toBeGreaterThanOrEqual(1);
    expect(skips.every((c) => c.type === "assert" && typeof c.value === "string" && c.value.length > 0)).toBe(true);

    // Nothing is fabricated: no accelerator metric (`<metric>Tool` companion prop, ADR-B9b) appears
    // when its tool is absent.
    const fabricatedMetric = proposed.filter(
      (c) => c.target.kind === "node-prop" && c.target.prop.endsWith("Tool"),
    );
    expect(fabricatedMetric.length).toBe(0);
  });

  // === Criterion 5: determinism / re-index dedup ==============================================

  it("is deterministic (identical candidate set across two runs) and re-index dedups by path-derived EID", async () => {
    // Determinism: two runs over the same fixture state produce a byte-identical candidate set.
    const first = buildCodeMinerResult(input());
    const second = buildCodeMinerResult(input());
    expect(nodesOfKind(first.proposed, "code:module").length).toBeGreaterThanOrEqual(2); // non-trivial
    expect(JSON.stringify(second.proposed)).toBe(JSON.stringify(first.proposed));

    // Re-index dedup: running runAcquisition TWICE over the same fixture must not duplicate the module
    // node — the path-derived EID resolves to the SAME cell (a single, non-conflicted format value),
    // never a second node.
    const { repo, manifest } = await minerRepo("dedup");
    await repo.runAcquisition(manifest, input(), { asOf: FIXED_AS_OF });
    await repo.runAcquisition(manifest, input(), { asOf: FIXED_AS_OF });

    const moduleEid = nodesOfKind(first.proposed, "code:module")
      .map((c) => (c.target as { eid: string }).eid)
      .find((eid) => eid.endsWith("a.ts"));
    expect(moduleEid).toBeDefined();
    const view = await repo.getNode(moduleEid as string);
    expect(view).not.toBeNull();
    expect(view?.eid).toBe(moduleEid);
    const formatValues = (view?.props.format?.segments ?? []).filter((s) => s.kind === "value");
    // A re-asserted, path-EID-deduped cell folds to exactly ONE value segment — not a duplicate/conflict.
    expect(formatValues.length).toBe(1);
  });
});
