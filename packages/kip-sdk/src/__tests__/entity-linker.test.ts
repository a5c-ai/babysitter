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

  it("emits ONE `same_as` pair for two DIFFERENT-blob concepts with the same normalized STRONG name", () => {
    const cA = conceptEid(BLOB_A, "concept-a");
    const cB = conceptEid(BLOB_B, "concept-b");
    const r = linkResolver([
      // A STRONG multi-token name (round 3, ADR-B11a): `N_name` folds case AND collapses whitespace so the
      // two spellings are equal, and a multi-token name clears the strong bar (a bare common noun would not).
      conceptNode(cA, [{ key: "name", value: "Orchid Checkout  Service" }]),
      conceptNode(cB, [{ key: "name", value: "orchid checkout service" }]), // folds → "orchid checkout service"
    ]);

    const sameAs = r.sameAs ?? [];
    expect(sameAs.length).toBe(1);
    expect(new Set([sameAs[0]!.candidate, sameAs[0]!.existing])).toEqual(new Set([cA, cB]));
    // Cross-doc same-entity is NEVER a documents edge.
    expect(documentsEdges(r).length).toBe(0);
  });

  it("never emits concept-to-code as same_as, never cross-doc as documents, and same_as needs a DISTINCTIVE identity prop (not the slug)", () => {
    const modEid = moduleEid("src/a.ts");
    const cCode = conceptEid(BLOB_A, "src/a.ts"); // concept->code control (path-qualified slug)
    const cSlugA = conceptEid(BLOB_A, "shared-slug-x");
    const cSlugB = conceptEid(BLOB_B, "shared-slug-x"); // same slug, DIFFERENT blob - the slug is NOT an identity signal -> NO same_as
    const cNameA = conceptEid(BLOB_A, "concept-a");
    const cNameB = conceptEid(BLOB_B, "concept-b");
    const r = linkResolver([
      codeNode(modEid, "code:module"),
      conceptNode(cCode),
      conceptNode(cSlugA),
      conceptNode(cSlugB),
      conceptNode(cNameA, [{ key: "name", value: "Payments Gateway" }]),
      conceptNode(cNameB, [{ key: "name", value: "payments gateway" }]), // distinctive shared name -> same_as
    ]);

    // Every documents edge goes doc: -> code: (a concept DOCUMENTS an implementation), never doc: -> doc:.
    for (const c of documentsEdges(r)) {
      const { from, to } = edgeFromTo(c);
      expect(from.startsWith("doc:")).toBe(true);
      expect(to.startsWith("code:")).toBe(true);
    }
    // Every same_as pair is concept<->concept (doc: <-> doc:), never concept<->code.
    for (const p of r.sameAs ?? []) {
      expect(p.candidate.startsWith("doc:")).toBe(true);
      expect(p.existing.startsWith("doc:")).toBe(true);
    }
    // documents positive control present.
    expect(documentsEdges(r).map(edgeFromTo)).toContainEqual({ from: cCode, to: modEid });
    // same_as: ONLY the distinctive shared-NAME pair. The shared-SLUG pair must NOT merge -- a generic
    // eid-slug merge was the round-1 CRITICAL false-merge (payments-api / user-profiles collapsed).
    const sameAs = r.sameAs ?? [];
    expect(sameAs.length).toBe(1);
    expect(new Set([sameAs[0]!.candidate, sameAs[0]!.existing])).toEqual(new Set([cNameA, cNameB]));
    const flat = sameAs.flatMap((p) => [p.candidate, p.existing]);
    expect(flat).not.toContain(cSlugA);
    expect(flat).not.toContain(cSlugB);
  });});

describe("entity-linker: N5 precision — EXACT whole-string equality only, abstain otherwise", () => {
  it("abstains on a substring, a PATH case-mismatch, a bare basename, and a no-match - only the exact whole-PATH match links", () => {
    const modLong = moduleEid("src/learn/index.ts");
    const modBare = moduleEid("index.ts"); // a root-level module whose relPath IS a bare basename
    const cSubstr = conceptEid(BLOB_A, "learn"); // a path SEGMENT (substring) - NO link (no substring matching)
    const cCase = conceptEid(BLOB_A, "src/learn/Index.ts"); // case-mismatch (N_path preserves case) - NO link
    const cBare = conceptEid(BLOB_A, "index.ts"); // bare basename - generic/ambiguous - NEVER matches a module
    const cMiss = conceptEid(BLOB_A, "does/not/exist.ts"); // matches nothing - NO link
    const cExact = conceptEid(BLOB_A, "src/learn/index.ts"); // EXACT full relPath - the ONLY link
    const r = linkResolver([
      codeNode(modLong, "code:module"),
      codeNode(modBare, "code:module"),
      conceptNode(cSubstr),
      conceptNode(cCase),
      conceptNode(cBare),
      conceptNode(cMiss),
      conceptNode(cExact),
    ]);

    const docs = documentsEdges(r);
    expect(docs.length).toBe(1);
    expect(edgeFromTo(docs[0]!)).toEqual({ from: cExact, to: modLong });

    const froms = docs.map((c) => edgeFromTo(c).from);
    expect(froms).not.toContain(cSubstr);
    expect(froms).not.toContain(cCase);
    expect(froms).not.toContain(cBare);
    expect(froms).not.toContain(cMiss);
    // The root-level `index.ts` module is NEVER linked - a bare-basename identifier is not distinctive.
    const tos = docs.map((c) => edgeFromTo(c).to);
    expect(tos).not.toContain(modBare);
    expect(r.sameAs ?? []).toEqual([]);
  });
  it("gives a same_as ONLY to a cross-blob duplicate name, never to two SAME-blob concepts with the same name", () => {
    const sameA = conceptEid(BLOB_A, "dup-1");
    const sameB = conceptEid(BLOB_A, "dup-2"); // SAME blob as sameA
    const crossA = conceptEid(BLOB_A, "x-1");
    const crossB = conceptEid(BLOB_B, "x-2"); // DIFFERENT blob
    // STRONG multi-token names (round 3): the same-blob suppression is now tested on names that WOULD merge
    // cross-blob, so the only reason the same-blob pair does not merge is the blob-identity guard — not a
    // weak name. (A bare common noun like "Alpha"/"Beta" is no longer strong and would never merge at all.)
    const r = linkResolver([
      conceptNode(sameA, [{ key: "name", value: "Order Service" }]),
      conceptNode(sameB, [{ key: "name", value: "order service" }]), // same normalized name, SAME blob → NO same_as
      conceptNode(crossA, [{ key: "name", value: "Reconciliation Ledger" }]),
      conceptNode(crossB, [{ key: "name", value: "reconciliation ledger" }]), // same normalized name, DIFFERENT blob → same_as
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
      return `${from}\0${to}`;
    });
    expect(docKeys).toEqual([...docKeys].sort());
    // `sameAs` sorted by (candidate, existing).
    const saKeys = (first.sameAs ?? []).map((p) => `${p.candidate}\0${p.existing}`);
    expect(saKeys).toEqual([...saKeys].sort());
  });
});

describe("entity-linker: round-2 precision - a match must be DISTINCTIVE evidence, never an incidental coincidence", () => {
  it("does NOT same_as on non-identity prop values (a shared status/state is incidental, not identity)", () => {
    const cA = conceptEid(BLOB_A, "payments-api");
    const cB = conceptEid(BLOB_B, "user-profiles");
    const r = linkResolver([
      conceptNode(cA, [{ key: "status", value: "draft" }]),
      conceptNode(cB, [{ key: "state", value: "Draft" }]), // folds to "draft" under N_name, but NOT an identity prop
    ]);
    expect(r.sameAs ?? []).toEqual([]);
    expect(documentsEdges(r).length).toBe(0);
  });

  it("does NOT documents on an incidental prop mention or a bare basename", () => {
    const modEid = moduleEid("index.ts");
    const symEid = symbolEid("src/x.ts", "index");
    const concept = conceptEid(BLOB_A, "the-config-concept");
    const r = linkResolver([
      codeNode(modEid, "code:module"),
      codeNode(symEid, "code:symbol"),
      // example_file is an ARBITRARY prop (not name/title/label); "index.ts" is a bare basename; "index" is a stopword.
      conceptNode(concept, [
        { key: "example_file", value: "index.ts" },
        { key: "name", value: "index" },
      ]),
    ]);
    expect(documentsEdges(r).length).toBe(0);
    expect(r.sameAs ?? []).toEqual([]);
  });

  it("does NOT same_as on a generic stopword name shared across blobs (two `overview` sections stay distinct)", () => {
    const cA = conceptEid(BLOB_A, "sec-1");
    const cB = conceptEid(BLOB_B, "sec-2");
    const r = linkResolver([
      conceptNode(cA, [{ key: "title", value: "Overview" }]),
      conceptNode(cB, [{ key: "title", value: "overview" }]), // stopword - NO merge
    ]);
    expect(r.sameAs ?? []).toEqual([]);
  });

  it("a bare generic identifier (`foo`) never fans documents edges across module/symbol/package (kind-blind fan-out is gone)", () => {
    const modEid = moduleEid("foo"); // root-level module named `foo` (bare, no separator)
    const symEid = symbolEid("src/x.ts", "foo");
    const pkgEid = packageEid("foo");
    const concept = conceptEid(BLOB_A, "some-concept");
    const r = linkResolver([
      codeNode(modEid, "code:module"),
      codeNode(symEid, "code:symbol"),
      codeNode(pkgEid, "code:package"),
      conceptNode(concept, [{ key: "name", value: "foo" }]), // too short + no separator -> NO link to any kind
    ]);
    expect(documentsEdges(r).length).toBe(0);
  });

  it("a DISTINCTIVE full-path slug DOES link (positive control for the tightened module rule)", () => {
    const modEid = moduleEid("src/services/payments/gateway.ts");
    const concept = conceptEid(BLOB_A, "src/services/payments/gateway.ts");
    const r = linkResolver([codeNode(modEid, "code:module"), conceptNode(concept)]);
    const docs = documentsEdges(r);
    expect(docs.length).toBe(1);
    expect(edgeFromTo(docs[0]!)).toEqual({ from: concept, to: modEid });
  });

  it("a DISTINCTIVE shared identity name DOES same_as across blobs (positive control)", () => {
    const cA = conceptEid(BLOB_A, "c-1");
    const cB = conceptEid(BLOB_B, "c-2");
    const r = linkResolver([
      conceptNode(cA, [{ key: "name", value: "Reconciliation Ledger" }]),
      conceptNode(cB, [{ key: "title", value: "reconciliation ledger" }]), // distinctive, cross-blob -> same_as
    ]);
    const sameAs = r.sameAs ?? [];
    expect(sameAs.length).toBe(1);
    expect(new Set([sameAs[0]!.candidate, sameAs[0]!.existing])).toEqual(new Set([cA, cB]));
  });

  it("path-parsing robustness: a malformed code eid (empty/absent repoId, missing #sym) is skipped, never mis-split", () => {
    const good = moduleEid("src/robust/ok.ts");
    const cGood = conceptEid(BLOB_A, "src/robust/ok.ts");
    const r = linkResolver([
      { eid: "code:module:", kind: "code:module", props: [] }, // no repoId, no relPath
      { eid: "code:module::src/x.ts", kind: "code:module", props: [] }, // empty repoId
      { eid: "code:symbol:repo:src/x.ts", kind: "code:symbol", props: [] }, // no #sym suffix
      codeNode(good, "code:module"),
      conceptNode(cGood),
      conceptNode(conceptEid(BLOB_A, "src/x.ts")), // would mis-link if the empty-repoId eid mis-split to a relPath
    ]);
    // Only the well-formed module links; no malformed eid produces an edge.
    expect(documentsEdges(r).map(edgeFromTo)).toEqual([{ from: cGood, to: good }]);
  });
});

describe("entity-linker: round-3 precision - the STRONG-name rule kills generic single-token merges (ADR-B11a)", () => {
  // (a) A bare single-token common noun carries no identity signal, so a shared one is an incidental
  //     coincidence, NOT distinctive evidence — the round-2 min-length+stopword gate could not enumerate
  //     every common noun, so `Manager`/`Client`/`User`/... still merged. The strong-name rule kills this.
  it("does NOT same_as when two unrelated concepts share a bare single-token common-noun name", () => {
    for (const noun of ["Manager", "Client", "User", "Payment", "Handler", "Controller", "Request", "Response", "Error"]) {
      const a = conceptEid(BLOB_A, `a-${noun}`);
      const b = conceptEid(BLOB_B, `b-${noun}`);
      const r = linkResolver([
        conceptNode(a, [{ key: "name", value: noun }]),
        conceptNode(b, [{ key: "name", value: noun.toLowerCase() }]), // folds to the same N_name, but is NOT strong
      ]);
      expect(r.sameAs ?? [], `"${noun}" is a bare common noun and must NOT merge`).toEqual([]);
      expect(documentsEdges(r).length).toBe(0);
    }
  });

  it("DOES same_as on a strong camelCase/PascalCase name across blobs (internal capital ⇒ distinctive)", () => {
    const a = conceptEid(BLOB_A, "op-a");
    const b = conceptEid(BLOB_B, "op-b");
    const r = linkResolver([
      conceptNode(a, [{ key: "name", value: "OrderPlaced" }]),
      conceptNode(b, [{ key: "title", value: "orderPlaced" }]), // both carry an INTERNAL capital → strong; fold → "orderplaced"
    ]);
    const sameAs = r.sameAs ?? [];
    expect(sameAs.length).toBe(1);
    expect(new Set([sameAs[0]!.candidate, sameAs[0]!.existing])).toEqual(new Set([a, b]));
  });

  it("DOES same_as on a strong hyphen-qualified name across blobs (order-service)", () => {
    const a = conceptEid(BLOB_A, "os-a");
    const b = conceptEid(BLOB_B, "os-b");
    const r = linkResolver([
      conceptNode(a, [{ key: "name", value: "order-service" }]),
      conceptNode(b, [{ key: "name", value: "Order-Service" }]), // hyphen ⇒ qualified ⇒ strong; fold → "order-service"
    ]);
    const sameAs = r.sameAs ?? [];
    expect(sameAs.length).toBe(1);
    expect(new Set([sameAs[0]!.candidate, sameAs[0]!.existing])).toEqual(new Set([a, b]));
  });

  // Item 3 coverage: `label` is an accepted IDENTITY_PROP_KEY but had no test — a strong `label` merges.
  it("a `label` identity prop participates in same_as on a strong name (label coverage)", () => {
    const a = conceptEid(BLOB_A, "lbl-a");
    const b = conceptEid(BLOB_B, "lbl-b");
    const r = linkResolver([
      conceptNode(a, [{ key: "label", value: "Reconciliation Ledger" }]),
      conceptNode(b, [{ key: "label", value: "reconciliation ledger" }]),
    ]);
    const sameAs = r.sameAs ?? [];
    expect(sameAs.length).toBe(1);
    expect(new Set([sameAs[0]!.candidate, sameAs[0]!.existing])).toEqual(new Set([a, b]));
  });

  // Independently pins "same_as draws ONLY from name/title/label" — the shared value here is STRONG (would
  // merge if it were an identity prop), so the ONLY reason it does not merge is that `owner`/`team` are
  // arbitrary props. (Mutation: draw same_as from ALL props ⇒ this merges ⇒ the test fails.)
  it("does NOT same_as on a STRONG value carried by an arbitrary (non-identity) prop", () => {
    const a = conceptEid(BLOB_A, "arb-a");
    const b = conceptEid(BLOB_B, "arb-b");
    const r = linkResolver([
      conceptNode(a, [{ key: "owner", value: "Reconciliation Ledger" }]),
      conceptNode(b, [{ key: "team", value: "reconciliation ledger" }]),
    ]);
    expect(r.sameAs ?? []).toEqual([]);
    expect(documentsEdges(r).length).toBe(0);
  });

  // Independently pins "documents identifiers are drawn ONLY from identity fields, never arbitrary props".
  // The prior only-fixture ("index.ts") was a bare basename already blocked by a SEPARATE rule, so
  // loosening `conceptDocIdentifiers` to ALL props passed zero tests. Here the arbitrary value is a real,
  // PATH-QUALIFIED module relPath (not otherwise blocked). (Mutation: draw from ALL props ⇒ 1 edge ⇒ fail.)
  it("does NOT draw documents identifiers from arbitrary props even when the value is a real path-qualified module relPath", () => {
    const modEid = moduleEid("src/foo/bar.ts");
    const concept = conceptEid(BLOB_A, "unrelated-doc-slug"); // identity fields do NOT name the module
    const r = linkResolver([
      codeNode(modEid, "code:module"),
      conceptNode(concept, [{ key: "example_file", value: "src/foo/bar.ts" }]), // arbitrary prop = a real relPath
    ]);
    expect(documentsEdges(r).length).toBe(0);
  });

  // Item 1 asymmetry: a `code:symbol`/`code:package` literally named with a dotted bare basename escapes a
  // bare stopword denylist ("index.ts" ∉ NAME_STOPWORDS) — the strong bar treats a filename-extension dot
  // as NON-qualifying, so such a token is not distinctive and never links.
  it("does NOT documents when a code:symbol/package token is a dotted bare basename (index.ts / config.json)", () => {
    const symEid = symbolEid("src/x.ts", "index.ts"); // a symbol literally named "index.ts"
    const pkgEid = packageEid("config.json"); // a package literally named "config.json"
    const cSym = conceptEid(BLOB_A, "c-sym");
    const cPkg = conceptEid(BLOB_A, "c-pkg");
    const r = linkResolver([
      codeNode(symEid, "code:symbol"),
      codeNode(pkgEid, "code:package"),
      conceptNode(cSym, [{ key: "name", value: "index.ts" }]),
      conceptNode(cPkg, [{ key: "title", value: "config.json" }]),
    ]);
    expect(documentsEdges(r).length).toBe(0);
  });
});

describe("entity-linker: round-4 precision - filename-shaped identity values are generic, not distinctive (ADR-B11a)", () => {
  // (1) MULTI-DOT filenames: the round-3 bare-basename guard only discounted a SINGLE extension dot, so a
  //     multi-dot filename (`webpack.config.js`, `index.test.ts`) still counted its dots as qualifiers and
  //     merged. A filename shape (slash-free, short lowercase extension, ANY dot count) is never strong.
  it("does NOT same_as when two cross-blob concepts share a multi-dot filename identity name", () => {
    for (const fname of ["webpack.config.js", "index.test.ts", "foo.d.ts", "jest.setup.js", "tsconfig.base.json"]) {
      const a = conceptEid(BLOB_A, `a-${fname}`);
      const b = conceptEid(BLOB_B, `b-${fname}`);
      const r = linkResolver([
        conceptNode(a, [{ key: "name", value: fname }]),
        conceptNode(b, [{ key: "name", value: fname }]), // identical filename, different blob → NOT distinctive
      ]);
      expect(r.sameAs ?? [], `"${fname}" is a generic filename and must NOT merge`).toEqual([]);
      expect(documentsEdges(r).length).toBe(0);
    }
  });

  // (2) DIGIT basenames: a single-extension filename whose stem carries only a version digit (`v2.ts`,
  //     `s3.ts`, `vec3.rs`) slipped through the round-3 `/\d/` rule. A digit in a filename stem/extension
  //     is not distinctiveness — the stem must independently clear the strong bar (capital/separator).
  it("does NOT same_as when two cross-blob concepts share a digit-basename filename identity name", () => {
    for (const fname of ["v2.ts", "s3.ts", "p2p.js", "h2.py", "vec3.rs"]) {
      const a = conceptEid(BLOB_A, `a-${fname}`);
      const b = conceptEid(BLOB_B, `b-${fname}`);
      const r = linkResolver([
        conceptNode(a, [{ key: "name", value: fname }]),
        conceptNode(b, [{ key: "name", value: fname }]),
      ]);
      expect(r.sameAs ?? [], `"${fname}" is a versioned filename and must NOT merge`).toEqual([]);
      expect(documentsEdges(r).length).toBe(0);
    }
  });

  // A digit-basename filename must not seed a bare-token `documents` link either — the code:symbol/module
  // token `v2.ts` is held to the same strong bar and is never indexed, and the concept id never resolves.
  it("does NOT documents when a concept and a bare code:symbol/code:module token share a digit-basename filename (v2.ts)", () => {
    const symEid = symbolEid("src/x.ts", "v2.ts"); // a symbol literally named "v2.ts"
    const modBare = moduleEid("v2.ts"); // a root-level module whose bare relPath IS "v2.ts"
    const cSym = conceptEid(BLOB_A, "c-sym");
    const cMod = conceptEid(BLOB_A, "c-mod");
    const r = linkResolver([
      codeNode(symEid, "code:symbol"),
      codeNode(modBare, "code:module"),
      conceptNode(cSym, [{ key: "name", value: "v2.ts" }]),
      conceptNode(cMod, [{ key: "name", value: "v2.ts" }]),
    ]);
    expect(documentsEdges(r).length).toBe(0);
    expect(r.sameAs ?? []).toEqual([]);
  });

  // Positive control (guards against over-correction): a genuine PATH-qualified relPath is distinctive (a
  // path is not a filename token) and STILL documents-links its module — the filename fix must not touch it.
  it("STILL documents-links a module for a PATH-qualified relPath (src/foo/bar.ts) — no over-correction", () => {
    const modEid = moduleEid("src/foo/bar.ts");
    const concept = conceptEid(BLOB_A, "src/foo/bar.ts");
    const r = linkResolver([codeNode(modEid, "code:module"), conceptNode(concept)]);
    const docs = documentsEdges(r);
    expect(docs.length).toBe(1);
    expect(edgeFromTo(docs[0]!)).toEqual({ from: concept, to: modEid });
  });

  // (Item 2) TEST-INTEGRITY: the round-3 bare-common-noun test lowercases ONE twin, so a mutation that
  //   counts a LEADING capital stays green (the lowercased twin is never strong). This pins the corridor
  //   with BOTH twins carrying the identical leading-capital identity — mutation-verify: making
  //   `isStrongName` treat a leading capital as distinctive makes THIS test fail.
  it("does NOT same_as when two cross-blob concepts BOTH carry the identical leading-capital identity name", () => {
    for (const noun of ["Manager", "Client"]) {
      const a = conceptEid(BLOB_A, `pc-a-${noun}`);
      const b = conceptEid(BLOB_B, `pc-b-${noun}`);
      const r = linkResolver([
        conceptNode(a, [{ key: "name", value: noun }]),
        conceptNode(b, [{ key: "name", value: noun }]), // BOTH keep the leading capital → still a bare common noun
      ]);
      expect(r.sameAs ?? [], `both-PascalCase "${noun}" is a bare common noun and must NOT merge`).toEqual([]);
      expect(documentsEdges(r).length).toBe(0);
    }
  });
});

describe("entity-linker: round-5 precision - a filename extension's CASE and LENGTH do not smuggle strength (ADR-B11a)", () => {
  // (1) UPPERCASE / mixed-case extensions. The round-4 filename guard matched only a lowercase `{1,6}`
  //     extension, so a filename with an UPPERCASE/mixed extension (`config.JSON`, `index.TS`, `Foo.Js`)
  //     escaped the guard and false-linked via the bare qualifying-dot rule. A KNOWN extension matched
  //     case-INSENSITIVELY is a filename regardless of case → its stem (`config`, `index`, `Foo`) is not
  //     strong → NO same_as. Mutation-verify: reverting to the lowercase-only `{1,6}` regex re-links these.
  it("does NOT same_as when two cross-blob concepts share an UPPERCASE/mixed-case-extension filename name", () => {
    for (const fname of ["config.JSON", "index.TS", "data.XML", "schema.SQL", "Foo.Js", "app.Config"]) {
      const a = conceptEid(BLOB_A, `a-${fname}`);
      const b = conceptEid(BLOB_B, `b-${fname}`);
      const r = linkResolver([
        conceptNode(a, [{ key: "name", value: fname }]),
        conceptNode(b, [{ key: "name", value: fname }]), // identical filename, different blob → NOT distinctive
      ]);
      expect(r.sameAs ?? [], `"${fname}" is a generic filename and must NOT merge`).toEqual([]);
      expect(documentsEdges(r).length).toBe(0);
    }
  });

  // (2) LONG extensions. The round-4 `{1,6}` cap let a filename with a long extension (`foo.gitignore`,
  //     `foo.htaccess`, `foo.properties`) escape the guard and false-link. A KNOWN extension of ANY length
  //     is a filename; a non-known long/digit suffix (`file.backup2`) is not a filename but its lowercase
  //     dotted shape still carries no distinctiveness marker → also abstains.
  it("does NOT same_as when two cross-blob concepts share a LONG-extension filename name", () => {
    for (const fname of ["foo.gitignore", "foo.htaccess", "foo.properties", "foo.editorconfig", "file.backup2"]) {
      const a = conceptEid(BLOB_A, `a-${fname}`);
      const b = conceptEid(BLOB_B, `b-${fname}`);
      const r = linkResolver([
        conceptNode(a, [{ key: "name", value: fname }]),
        conceptNode(b, [{ key: "name", value: fname }]),
      ]);
      expect(r.sameAs ?? [], `"${fname}" is a generic filename and must NOT merge`).toEqual([]);
      expect(documentsEdges(r).length).toBe(0);
    }
  });

  // (3) DOTFILES / trailing dot. A leading-dot dotfile (`.env`) or a trailing-dot token (`foo.`) was strong
  //     via the bare `includes('.')` qualifier. Both are filename-shaped generics → NO same_as.
  it("does NOT same_as on a dotfile (.env / .npmrc) or a trailing-dot token (foo.)", () => {
    for (const fname of [".env", ".npmrc", ".gitignore", "foo."]) {
      const a = conceptEid(BLOB_A, `a-${fname}`);
      const b = conceptEid(BLOB_B, `b-${fname}`);
      const r = linkResolver([
        conceptNode(a, [{ key: "name", value: fname }]),
        conceptNode(b, [{ key: "name", value: fname }]),
      ]);
      expect(r.sameAs ?? [], `"${fname}" is a dotfile/trailing-dot generic and must NOT merge`).toEqual([]);
      expect(documentsEdges(r).length).toBe(0);
    }
  });

  // A case/length-escaped filename must not seed a bare-token `documents` link either — the code:symbol
  // token `config.JSON` is held to the same strong bar (never indexed) and the concept id never resolves.
  it("does NOT documents when a concept and a bare code:symbol token share a case-escaped filename (config.JSON)", () => {
    const symEid = symbolEid("src/x.ts", "config.JSON"); // a symbol literally named "config.JSON"
    const cSym = conceptEid(BLOB_A, "c-sym");
    const r = linkResolver([
      codeNode(symEid, "code:symbol"),
      conceptNode(cSym, [{ key: "name", value: "config.JSON" }]),
    ]);
    expect(documentsEdges(r).length).toBe(0);
    expect(r.sameAs ?? []).toEqual([]);
  });

  // A version/IP-shaped identity value (a trailing all-numeric dotted segment) is not a distinctive entity
  // name — no capital survives the dots → abstain. Guards the "decide deterministically on unknown final
  // segment" rule so a version/IP never false-merges.
  it("does NOT same_as on a version or IP-shaped identity name (v1.2.3 / 10.0.0.1)", () => {
    for (const val of ["v1.2.3", "10.0.0.1", "release.20240101"]) {
      const a = conceptEid(BLOB_A, `a-${val}`);
      const b = conceptEid(BLOB_B, `b-${val}`);
      const r = linkResolver([
        conceptNode(a, [{ key: "name", value: val }]),
        conceptNode(b, [{ key: "name", value: val }]),
      ]);
      expect(r.sameAs ?? [], `"${val}" is a version/IP and must NOT merge`).toEqual([]);
      expect(documentsEdges(r).length).toBe(0);
    }
  });

  // CRITICAL positive control (no over-correction): `com.acme.Ledger`'s final segment `Ledger` is NOT a
  // known extension → it is NOT a filename → it keeps its internal-capital distinctiveness and STILL
  // same_as across blobs. Mutation-verify: treating every unknown dotted final segment as generic breaks this.
  it("STILL same_as on a dotted qualified identity whose final segment is NOT a known extension (com.acme.Ledger)", () => {
    const a = conceptEid(BLOB_A, "dq-a");
    const b = conceptEid(BLOB_B, "dq-b");
    const r = linkResolver([
      conceptNode(a, [{ key: "name", value: "com.acme.Ledger" }]),
      conceptNode(b, [{ key: "title", value: "Com.Acme.Ledger" }]), // both carry an internal capital ⇒ both strong; fold → "com.acme.ledger"
    ]);
    const sameAs = r.sameAs ?? [];
    expect(sameAs.length).toBe(1);
    expect(new Set([sameAs[0]!.candidate, sameAs[0]!.existing])).toEqual(new Set([a, b]));
  });

  // Positive control: a strong PascalCase name (`OrderPlaced`) is untouched by the filename fix.
  it("STILL same_as on a strong PascalCase identity name (OrderPlaced) — no over-correction", () => {
    const a = conceptEid(BLOB_A, "op5-a");
    const b = conceptEid(BLOB_B, "op5-b");
    const r = linkResolver([
      conceptNode(a, [{ key: "name", value: "OrderPlaced" }]),
      conceptNode(b, [{ key: "title", value: "orderPlaced" }]),
    ]);
    const sameAs = r.sameAs ?? [];
    expect(sameAs.length).toBe(1);
    expect(new Set([sameAs[0]!.candidate, sameAs[0]!.existing])).toEqual(new Set([a, b]));
  });
});

describe("entity-linker: round-6 precision - an UPPERCASE unknown extension/acronym is NOT an internal capital (ADR-B11a)", () => {
  // (1) UPPERCASE UNKNOWN extensions. The round-5 filename allowlist cannot enumerate every extension, so
  //     an uppercase UNKNOWN suffix (`config.ZIG`, `data.SOL`, `foo.XYZ`, `report.ASM`, `foo.X`) is NOT a
  //     filename shape and fell through to the bare qualifying-dot rule, where the OLD "any uppercase after
  //     index 0 ⇒ distinctive" test read the all-caps final segment as an internal capital and false-linked.
  //     The camelCase refinement requires a genuine `[A-Z][a-z]` transition, which an all-caps segment lacks
  //     → NO same_as. Mutation-verify: reverting to "any uppercase ⇒ distinctive" re-links every case here.
  it("does NOT same_as when two cross-blob concepts share an UPPERCASE unknown-extension identity name", () => {
    for (const fname of ["config.ZIG", "data.SOL", "schema.NIM", "report.ASM", "foo.XYZ", "foo.X"]) {
      const a = conceptEid(BLOB_A, `a-${fname}`);
      const b = conceptEid(BLOB_B, `b-${fname}`);
      const r = linkResolver([
        conceptNode(a, [{ key: "name", value: fname }]),
        conceptNode(b, [{ key: "name", value: fname }]), // identical uppercase-suffix token, different blob → NOT distinctive
      ]);
      expect(r.sameAs ?? [], `"${fname}" is an all-caps-suffix token and must NOT merge`).toEqual([]);
      expect(documentsEdges(r).length).toBe(0);
    }
  });

  // (2) BARE all-caps ACRONYMS. A standalone all-caps acronym used as an identity name (`HTTP`, `API`,
  //     `SQL`, `XML`) is not a proper-cased word: it has no `[A-Z][a-z]` transition → not distinctive →
  //     deferred to Layer 2. `HTTP` is the load-bearing case (length ≥ 4, not a stopword), so it abstains
  //     SOLELY via the camelCase rule; `API`/`SQL`/`XML` are also caught by the min-length/stopword floor.
  //     Mutation-verify: the OLD "any uppercase after index 0 ⇒ distinctive" test makes `HTTP` strong → merges.
  it("does NOT same_as when two cross-blob concepts share a bare all-caps acronym identity name", () => {
    for (const acronym of ["HTTP", "API", "SQL", "XML"]) {
      const a = conceptEid(BLOB_A, `a-${acronym}`);
      const b = conceptEid(BLOB_B, `b-${acronym}`);
      const r = linkResolver([
        conceptNode(a, [{ key: "name", value: acronym }]),
        conceptNode(b, [{ key: "name", value: acronym }]), // identical all-caps, different blob → all-caps is NOT strong
      ]);
      expect(r.sameAs ?? [], `"${acronym}" is a bare acronym and must NOT merge`).toEqual([]);
      expect(documentsEdges(r).length).toBe(0);
    }
  });

  // An uppercase-unknown-extension token must not seed a bare-token `documents` link either — the
  // `code:symbol` token `config.ZIG` is held to the same strong bar (never indexed) and the concept id
  // never resolves; likewise a `code:package` named for a bare acronym.
  it("does NOT documents when a concept and a bare code:symbol token share an uppercase-suffix token (config.ZIG)", () => {
    const symEid = symbolEid("src/x.ts", "config.ZIG"); // a symbol literally named "config.ZIG"
    const cSym = conceptEid(BLOB_A, "c-sym");
    const r = linkResolver([
      codeNode(symEid, "code:symbol"),
      conceptNode(cSym, [{ key: "name", value: "config.ZIG" }]),
    ]);
    expect(documentsEdges(r).length).toBe(0);
    expect(r.sameAs ?? []).toEqual([]);
  });

  // POSITIVE control (no over-correction): `com.acme.Ledger`'s `Ledger` segment carries a genuine
  // `[A-Z][a-z]` transition (`Le`), a segment-initial capital after a dot → still strong → same_as.
  it("STILL same_as on a dotted qualified identity with a segment-initial capitalized word (com.acme.Ledger)", () => {
    const a = conceptEid(BLOB_A, "r6dq-a");
    const b = conceptEid(BLOB_B, "r6dq-b");
    const r = linkResolver([
      conceptNode(a, [{ key: "name", value: "com.acme.Ledger" }]),
      conceptNode(b, [{ key: "title", value: "COM.acme.Ledger" }]), // both carry the `Le` capitalized-word transition → strong; fold → "com.acme.ledger"
    ]);
    const sameAs = r.sameAs ?? [];
    expect(sameAs.length).toBe(1);
    expect(new Set([sameAs[0]!.candidate, sameAs[0]!.existing])).toEqual(new Set([a, b]));
  });

  // POSITIVE control: a genuine camelCase hump (`OrderPlaced` → `rPl`, an `[A-Z][a-z]` NOT at index 0)
  // stays strong → same_as. This is the internal-transition the all-caps residual lacks.
  it("STILL same_as on a strong camelCase identity name (OrderPlaced) — the internal [A-Z][a-z] transition", () => {
    const a = conceptEid(BLOB_A, "r6op-a");
    const b = conceptEid(BLOB_B, "r6op-b");
    const r = linkResolver([
      conceptNode(a, [{ key: "name", value: "OrderPlaced" }]),
      conceptNode(b, [{ key: "title", value: "orderPlaced" }]),
    ]);
    const sameAs = r.sameAs ?? [];
    expect(sameAs.length).toBe(1);
    expect(new Set([sameAs[0]!.candidate, sameAs[0]!.existing])).toEqual(new Set([a, b]));
  });

  // POSITIVE control: a PATH-qualified relPath still documents-links its module — untouched by the fix.
  it("STILL documents-links a module for a PATH-qualified relPath (src/foo/bar.ts) — no over-correction", () => {
    const modEid = moduleEid("src/foo/bar.ts");
    const concept = conceptEid(BLOB_A, "src/foo/bar.ts");
    const r = linkResolver([codeNode(modEid, "code:module"), conceptNode(concept)]);
    const docs = documentsEdges(r);
    expect(docs.length).toBe(1);
    expect(edgeFromTo(docs[0]!)).toEqual({ from: concept, to: modEid });
  });

  // REGRESSION GUARD (do NOT re-open the round-4 bare-common-noun merge): a single leading-capital word
  // (`Manager`/`Client`) has its ONLY `[A-Z][a-z]` at index 0, which the internal-transition rule excludes
  // → still NOT strong → NO same_as. Mutation-verify: a raw `[A-Z][a-z]` rule (counting the leading capital)
  // makes `Manager` strong again → this fails.
  it("does NOT same_as when two cross-blob concepts BOTH carry a leading-capital-only common noun (Manager/Client)", () => {
    for (const noun of ["Manager", "Client", "User", "Payment"]) {
      const a = conceptEid(BLOB_A, `r6pc-a-${noun}`);
      const b = conceptEid(BLOB_B, `r6pc-b-${noun}`);
      const r = linkResolver([
        conceptNode(a, [{ key: "name", value: noun }]),
        conceptNode(b, [{ key: "name", value: noun }]), // BOTH keep the leading capital → still a bare common noun
      ]);
      expect(r.sameAs ?? [], `both-PascalCase "${noun}" is a bare common noun and must NOT merge`).toEqual([]);
      expect(documentsEdges(r).length).toBe(0);
    }
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
