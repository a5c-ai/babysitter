/**
 * FROZEN acceptance tests for the deterministic Layer-1 entity linker (ADR-B11/B11a/B11b/B11c,
 * docs/70-decision-records-adr.md) — the `entity-linker` work item.
 *
 * WHAT IT IS. `kip index` produces `code:*` nodes; `kip learn` produces `doc:<blob>#<slug>` concept
 * nodes. Today those two are disconnected ISLANDS. The linker joins them by ASSERTING signed,
 * reversible link edges through the EXISTING `runAcquisition` write path — never by merging identities:
 *   - a concept whose identifier EXACTLY equals a `code:*` identifier ⇒ a typed `documents` edge
 *     (concept → code) in `AcquisitionResult.proposed`;
 *   - two DIFFERENT-blob concepts with the same normalized name ⇒ a `same_as` pair in
 *     `AcquisitionResult.sameAs`.
 * `linkResolver(inventory) → AcquisitionResult` is a PURE, deterministic function that reads ONLY its
 * `NodeInventory` input and authors nothing (INV-A1); the CLI performs every graph read (enumerating
 * live nodes via the new read-only `Repo.nodeEids` seam, hydrating props via `getNode`) and
 * `runAcquisition` performs every write.
 *
 * FROZEN — authored STRICTLY from the ADR, NOT from any implementation. `linkResolver` /
 * `linkResolverDispatch` return an EMPTY result and `Repo.nodeEids` throws this round, so every
 * acceptance assertion below FAILS on its own diff (a resolver that emits nothing where a
 * `documents`/`same_as` link is required; a `nodeEids` that rejects), never on a type/import error.
 *
 * Match normalization (ADR-B11, pinned):
 *   N_path — NFC + trim + `\`→`/` + strip one leading `./`, CASE PRESERVED (paths/symbols/packages are
 *            case-significant) — for the concept→code cases.
 *   N_name — NFC + trim + collapse internal whitespace + toLowerCase (non-locale) — for the cross-doc
 *            name case ONLY.
 * EXACT whole-string equality only: no substring/prefix/fuzzy/edit-distance. Abstain otherwise (N5).
 */
import { afterEach, describe, expect, it } from "vitest";
import type { AssertInput, EdgeView, NodeView, PropValue, RetractInput } from "../index";
import { KipRepo } from "../index";
import {
  linkResolver,
  linkResolverDispatch,
  type LinkResolverResult,
  type NodeInventory,
  type NodeInventoryEntry,
} from "../linker/entity-linker";
import { FIXED_AS_OF, freshReplicaId, registerAcquisitionManifest, seedNode, seedProp } from "./conformance/fixtures-m7";

// --- eid builders (ADR-B11 shapes: code eids embed a hashed repoId; concept eids are doc:<blob>#slug) ---

/** A fixed hashed-style repoId (`${basename}-${sha1(absPath).slice(0,12)}`, code-miner.ts:447-452). */
const REPO_ID = "demo-0123456789ab";
const BLOB_A = "a".repeat(40);
const BLOB_B = "b".repeat(40);

const moduleEid = (relPath: string): string => `code:module:${REPO_ID}:${relPath}`;
const symbolEid = (relPath: string, sym: string): string => `code:symbol:${REPO_ID}:${relPath}#${sym}`;
const packageEid = (pkg: string): string => `code:package:${REPO_ID}:${pkg}`;
const conceptEid = (blob: string, slug: string): string => `doc:${blob}#${slug}`;

function codeNode(eid: string, kind: "code:module" | "code:symbol" | "code:package"): NodeInventoryEntry {
  return { eid, kind, props: [] };
}
function conceptNode(eid: string, props: Array<{ key: string; value: PropValue }> = []): NodeInventoryEntry {
  return { eid, kind: "concept", props };
}

// --- result inspectors -------------------------------------------------------------------------

function documentsEdges(r: LinkResolverResult): AssertInput[] {
  return r.proposed.filter(
    (c): c is AssertInput =>
      c.type === "assert" && c.target.kind === "edge" && c.target.edgeKind === "documents",
  );
}
function edgeFromTo(c: AssertInput | RetractInput): { from: string; to: string } {
  const t = c.target as { from: string; to: string };
  return { from: t.from, to: t.to };
}

describe("entity-linker: linkResolver is a PURE function (ADR-B11 — reads its input only, authors nothing)", () => {
  it("emits a `documents` edge from a concept to the code:module whose relPath equals the concept slug", () => {
    const modEid = moduleEid("src/learn/compile.ts");
    const concept = conceptEid(BLOB_A, "src/learn/compile.ts");
    const r = linkResolver([codeNode(modEid, "code:module"), conceptNode(concept)]);

    const docs = documentsEdges(r);
    expect(docs.length).toBe(1);
    expect(edgeFromTo(docs[0]!)).toEqual({ from: concept, to: modEid });
    // A concept→code match is NEVER a same_as (a concept is not its implementation).
    expect(r.sameAs ?? []).toEqual([]);
  });

  it("matches a code:symbol name and a code:package name by an EXACT concept prop value → `documents` edges", () => {
    const symEid = symbolEid("src/index.ts", "linkResolver");
    const pkgEid = packageEid("isomorphic-git");
    const cSym = conceptEid(BLOB_A, "the-resolver-concept");
    const cPkg = conceptEid(BLOB_A, "the-dependency-concept");
    const r = linkResolver([
      codeNode(symEid, "code:symbol"),
      codeNode(pkgEid, "code:package"),
      conceptNode(cSym, [{ key: "name", value: "linkResolver" }]),
      conceptNode(cPkg, [{ key: "title", value: "isomorphic-git" }]),
    ]);

    const pairs = documentsEdges(r).map(edgeFromTo);
    expect(pairs).toContainEqual({ from: cSym, to: symEid });
    expect(pairs).toContainEqual({ from: cPkg, to: pkgEid });
    expect(pairs.length).toBe(2);
  });

  it("emits ONE `same_as` pair for two DIFFERENT-blob concepts with the same normalized name", () => {
    const cA = conceptEid(BLOB_A, "concept-a");
    const cB = conceptEid(BLOB_B, "concept-b");
    const r = linkResolver([
      conceptNode(cA, [{ key: "name", value: "Widget" }]),
      conceptNode(cB, [{ key: "name", value: "widget" }]), // N_name folds "Widget"/"widget" → equal
    ]);

    const sameAs = r.sameAs ?? [];
    expect(sameAs.length).toBe(1);
    expect(new Set([sameAs[0]!.candidate, sameAs[0]!.existing])).toEqual(new Set([cA, cB]));
    // Cross-doc same-entity is NEVER a documents edge.
    expect(documentsEdges(r).length).toBe(0);
  });

  it("never emits concept→code as `same_as`, and never emits cross-doc as a `documents` edge", () => {
    const modEid = moduleEid("src/a.ts");
    const cCode = conceptEid(BLOB_A, "src/a.ts"); // concept→code control
    const cDupA = conceptEid(BLOB_A, "shared-slug-x");
    const cDupB = conceptEid(BLOB_B, "shared-slug-x"); // cross-doc control (same slug, DIFFERENT blob)
    const r = linkResolver([
      codeNode(modEid, "code:module"),
      conceptNode(cCode),
      conceptNode(cDupA),
      conceptNode(cDupB),
    ]);

    // Every documents edge goes doc:→code: (a concept DOCUMENTS an implementation), never doc:→doc:.
    for (const c of documentsEdges(r)) {
      const { from, to } = edgeFromTo(c);
      expect(from.startsWith("doc:")).toBe(true);
      expect(to.startsWith("code:")).toBe(true);
    }
    // Every same_as pair is concept↔concept (doc:↔doc:), never concept↔code.
    for (const p of r.sameAs ?? []) {
      expect(p.candidate.startsWith("doc:")).toBe(true);
      expect(p.existing.startsWith("doc:")).toBe(true);
    }
    // Positive controls present (fails-now: both are 0 against the empty stub).
    expect(documentsEdges(r).map(edgeFromTo)).toContainEqual({ from: cCode, to: modEid });
    expect((r.sameAs ?? []).length).toBe(1);
  });
});

describe("entity-linker: N5 precision — EXACT whole-string equality only, abstain otherwise", () => {
  it("abstains on a substring, a PATH case-mismatch, and a no-match — only the exact whole-string match links", () => {
    const modLong = moduleEid("src/learn/index.ts");
    const modIndex = moduleEid("index.ts");
    const cSubstr = conceptEid(BLOB_A, "index"); // substring of a path — NO link
    const cCase = conceptEid(BLOB_A, "Index.ts"); // case-mismatch of index.ts (N_path preserves case) — NO link
    const cMiss = conceptEid(BLOB_A, "does/not/exist.ts"); // matches nothing — NO link
    const cExact = conceptEid(BLOB_A, "index.ts"); // EXACT — the ONLY link
    const r = linkResolver([
      codeNode(modLong, "code:module"),
      codeNode(modIndex, "code:module"),
      conceptNode(cSubstr),
      conceptNode(cCase),
      conceptNode(cMiss),
      conceptNode(cExact),
    ]);

    const docs = documentsEdges(r);
    expect(docs.length).toBe(1);
    expect(edgeFromTo(docs[0]!)).toEqual({ from: cExact, to: modIndex });

    const froms = docs.map((c) => edgeFromTo(c).from);
    expect(froms).not.toContain(cSubstr);
    expect(froms).not.toContain(cCase);
    expect(froms).not.toContain(cMiss);
    expect(r.sameAs ?? []).toEqual([]);
  });

  it("gives a same_as ONLY to a cross-blob duplicate name, never to two SAME-blob concepts with the same name", () => {
    const sameA = conceptEid(BLOB_A, "dup-1");
    const sameB = conceptEid(BLOB_A, "dup-2"); // SAME blob as sameA
    const crossA = conceptEid(BLOB_A, "x-1");
    const crossB = conceptEid(BLOB_B, "x-2"); // DIFFERENT blob
    const r = linkResolver([
      conceptNode(sameA, [{ key: "name", value: "Alpha" }]),
      conceptNode(sameB, [{ key: "name", value: "alpha" }]), // same normalized name, SAME blob → NO same_as
      conceptNode(crossA, [{ key: "name", value: "Beta" }]),
      conceptNode(crossB, [{ key: "name", value: "beta" }]), // same normalized name, DIFFERENT blob → same_as
    ]);

    const sameAs = r.sameAs ?? [];
    expect(sameAs.length).toBe(1);
    const flat = sameAs.flatMap((p) => [p.candidate, p.existing]);
    expect(new Set(flat)).toEqual(new Set([crossA, crossB]));
    expect(flat).not.toContain(sameA);
    expect(flat).not.toContain(sameB);
  });
});

describe("entity-linker: determinism (ADR-B11 — identical inventory yields an identical, stably-ordered result)", () => {
  it("is a deterministic pure function — byte-identical, stably ordered across two runs", () => {
    const inv: NodeInventory = [
      codeNode(moduleEid("src/z.ts"), "code:module"),
      codeNode(moduleEid("src/a.ts"), "code:module"),
      codeNode(packageEid("left-pad"), "code:package"),
      conceptNode(conceptEid(BLOB_A, "src/z.ts")),
      conceptNode(conceptEid(BLOB_A, "src/a.ts")),
      conceptNode(conceptEid(BLOB_A, "the-dep"), [{ key: "name", value: "left-pad" }]),
      conceptNode(conceptEid(BLOB_B, "the-dep-2"), [{ key: "name", value: "left-pad" }]), // cross-doc dup name
    ];
    const first = linkResolver(inv);
    const second = linkResolver(inv);

    // Byte-identical across runs (proposed + sameAs order stable).
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    // Non-trivial: there ARE links (fails-now against the empty stub).
    const docs = documentsEdges(first);
    expect(docs.length).toBeGreaterThanOrEqual(2);
    // `proposed` documents edges are sorted by (from, to) — equal to their own sorted key list.
    const docKeys = docs.map((c) => {
      const { from, to } = edgeFromTo(c);
      return `${from} ${to}`;
    });
    expect(docKeys).toEqual([...docKeys].sort());
    // `sameAs` sorted by (candidate, existing).
    const saKeys = (first.sameAs ?? []).map((p) => `${p.candidate} ${p.existing}`);
    expect(saKeys).toEqual([...saKeys].sort());
  });
});

// --- end-to-end (scripted linkResolverDispatch + the REAL runAcquisition orchestrator) ----------

async function reached(
  repo: KipRepo,
  seed: string,
): Promise<{ nodes: Set<string>; docEdges: EdgeView[] }> {
  const nodes = new Set<string>();
  const docEdges: EdgeView[] = [];
  const seen = new Set<string>();
  for await (const item of repo.query({ seed, direction: "both", depth: 3, maxFanout: 100 })) {
    if ("from" in item) {
      const edge = item as EdgeView;
      if (edge.kind === "documents" && !seen.has(edge.eid)) {
        seen.add(edge.eid);
        docEdges.push(edge);
      }
    } else {
      nodes.add((item as NodeView).eid);
    }
  }
  return { nodes, docEdges };
}

describe("entity-linker: end-to-end via runAcquisition (INV-A1, reversibility, idempotence, the union)", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  async function linkerRepo(label: string): Promise<{ repo: KipRepo; manifest: import("../index").MicroagentManifest }> {
    const repo = new KipRepo({ replicaId: freshReplicaId(label), dispatchMicroagent: linkResolverDispatch });
    repos.push(repo);
    const manifest = await registerAcquisitionManifest(repo, "kip-linker");
    return { repo, manifest };
  }

  it("INV-A1 / reversibility: authors a signed `documents` edge WITHOUT rewriting either endpoint's identity", async () => {
    const { repo, manifest } = await linkerRepo("reversible");
    const modEid = moduleEid("src/bar.ts");
    const concept = conceptEid(BLOB_A, "src/bar.ts");
    await seedNode(repo, modEid, "code:module");
    await seedProp(repo, modEid, "format", "typescript");
    await seedNode(repo, concept, "concept");
    await seedProp(repo, concept, "summary", "the bar module");

    // The ORIGINAL projected nodes — their props must be byte-identical after linking (no merge).
    const modBefore = await repo.getNode(modEid);
    const conceptBefore = await repo.getNode(concept);
    expect(modBefore).not.toBeNull();
    expect(conceptBefore).not.toBeNull();

    const inv: NodeInventory = [codeNode(modEid, "code:module"), conceptNode(concept)];
    await repo.runAcquisition(manifest, { nodes: inv }, { asOf: FIXED_AS_OF });

    // (1) The documents edge exists and is orchestrator-SIGNED.
    const { docEdges } = await reached(repo, concept);
    const edge = docEdges.find((e) => e.from === concept && e.to === modEid);
    expect(edge, "a documents edge concept→module").toBeDefined();
    expect(edge!.provenance.signature).toBeTruthy();
    // It is an ORDINARY edge fact (a retractable/contradictable existence FactId), not an identity rewrite.
    expect(await repo.edgeExistenceFactId(edge!.eid)).not.toBeNull();

    // (2) Neither endpoint was renamed/merged: getNode still resolves each at its OWN eid with
    //     byte-identical props (a documents edge keeps both nodes distinct — no same_as canonical collapse).
    const modAfter = await repo.getNode(modEid);
    const conceptAfter = await repo.getNode(concept);
    expect(modAfter?.eid).toBe(modEid);
    expect(conceptAfter?.eid).toBe(concept);
    expect(JSON.stringify(modAfter?.props)).toBe(JSON.stringify(modBefore?.props));
    expect(JSON.stringify(conceptAfter?.props)).toBe(JSON.stringify(conceptBefore?.props));
  });

  it("idempotence: re-running the link acquisition authors NO new documents edge (a byte-identical re-link is a no-op)", async () => {
    const { repo, manifest } = await linkerRepo("idem");
    const modEid = moduleEid("src/foo.ts");
    const concept = conceptEid(BLOB_A, "src/foo.ts");
    await seedNode(repo, modEid, "code:module");
    await seedNode(repo, concept, "concept");
    const inv: NodeInventory = [codeNode(modEid, "code:module"), conceptNode(concept)];

    const first = await repo.runAcquisition(manifest, { nodes: inv }, { asOf: FIXED_AS_OF });
    // The link is authored on the first run (fails-now: the stub authors nothing).
    expect(first.facts.length).toBeGreaterThanOrEqual(1);
    const afterFirst = (await reached(repo, concept)).docEdges.length;
    expect(afterFirst).toBeGreaterThanOrEqual(1);

    await repo.runAcquisition(manifest, { nodes: inv }, { asOf: FIXED_AS_OF });
    const afterSecond = (await reached(repo, concept)).docEdges.length;
    // The path-derived edge folds onto the SAME cell — no NEW documents edge the second time.
    expect(afterSecond).toBe(afterFirst);
  });

  it("Repo.nodeEids: returns all live code:*+doc:* eids sorted, respects the prefixes filter, excludes tombstoned/absent", async () => {
    const repo = new KipRepo({ replicaId: freshReplicaId("nodeeids") });
    repos.push(repo);
    const m1 = moduleEid("src/a.ts");
    const m2 = moduleEid("src/b.ts");
    const d1 = conceptEid(BLOB_A, "alpha");
    const other = "person/tenant/ns/somebody";
    const gone = moduleEid("src/gone.ts");
    await seedNode(repo, m1, "code:module");
    await seedNode(repo, m2, "code:module");
    await seedNode(repo, d1, "concept");
    await seedNode(repo, other, "person");
    await seedNode(repo, gone, "code:module");
    await repo.tombstone(gone, "removed");

    // Sorted live code+doc eids only — excludes the other-prefix node and the tombstoned module.
    await expect(repo.nodeEids({ prefixes: ["code:", "doc:"] })).resolves.toEqual([m1, m2, d1].sort());
    // Prefix filter narrows to a single family.
    await expect(repo.nodeEids({ prefixes: ["doc:"] })).resolves.toEqual([d1]);
    // No prefixes ⇒ every LIVE node (still excludes the tombstoned one), sorted.
    await expect(repo.nodeEids()).resolves.toEqual([m1, m2, d1, other].sort());
  });

  it("the UNION (headline): a both-direction traversal joins the code and concept islands ONLY after the `documents` edge exists", async () => {
    const { repo, manifest } = await linkerRepo("union");
    const modEid = moduleEid("src/widget.ts");
    const concept = conceptEid(BLOB_A, "src/widget.ts");
    await seedNode(repo, modEid, "code:module");
    await seedProp(repo, modEid, "format", "typescript");
    await seedNode(repo, concept, "concept");
    await seedProp(repo, concept, "summary", "the widget concept");

    // BEFORE: the two are disconnected islands — neither depth-3 both-direction traversal reaches the other.
    expect((await reached(repo, concept)).nodes.has(modEid)).toBe(false);
    expect((await reached(repo, modEid)).nodes.has(concept)).toBe(false);

    // Link (the ONLY change).
    const inv: NodeInventory = [codeNode(modEid, "code:module"), conceptNode(concept)];
    await repo.runAcquisition(manifest, { nodes: inv }, { asOf: FIXED_AS_OF });

    // AFTER: the existing depth-3 both-direction traversal crosses the `documents` edge and unions the
    // two sources — from the concept it reaches the code:module, and from the module it reaches the
    // concept. No retrieval change; asserting the edge is the entire fix.
    expect((await reached(repo, concept)).nodes.has(modEid)).toBe(true);
    expect((await reached(repo, modEid)).nodes.has(concept)).toBe(true);
  });
});
