/**
 * D-67 - RDF / linked-data ingestion (N-Triples) through the EXISTING `runAcquisition` write path.
 *
 * Proves the ADR-B11 "RDF forward-design": IRIs as GLOBAL eids, `owl:sameAs` -> a signed, reversible
 * `same_as` edge on the linker's OWN channel (proj union-find), every fact retractable, and the WHOLE
 * ingestion DETERMINISTIC. Three tiers (per D-67 TDD order):
 *   (1) parser units - the pure, total N-Triples parser (well-formed shapes, escapes, CRLF/LF,
 *       comments, and honest line-numbered errors on malformed input);
 *   (2) mapping units - triples -> AcquisitionResult (sameAs, rdf:type, iri-edge, literal-prop,
 *       datatype/lang, stable blank-node skolemization);
 *   (3) integration - a small `.nt` ingested through the REAL `runAcquisition` (open repo + keyring +
 *       the `rdfIngestDispatch` seam): nodes/props/edges QUERYABLE, `same_as` joins the two IRIs
 *       (sameAsClass), fact-level reversibility, and idempotence (content-derived eids fold).
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { AssertInput, MicroagentManifest, OpenOptions, Repo } from "../index";
import { KipRepo, open } from "../index";
import { runCli } from "../cli";
import {
  DATATYPE_PROP_SUFFIX,
  LANG_PROP_SUFFIX,
  OWL_SAME_AS_IRI,
  RDF_TYPE_IRI,
  RESERVED_KINDS,
  SAME_AS_EDGE_KIND,
  edgeEid,
  fnv1aHex,
  mapTriplesToAcquisition,
  mappingErrorFor,
  parseNTriples,
  rdfIngestDispatch,
  rdfToAcquisition,
  resolveNamespace,
  skolemizeBlank,
  termToEid,
  type NTriple,
} from "../rdf/ntriples";
import { FIXED_AS_OF, freshReplicaId, registerAcquisitionManifest } from "./conformance/fixtures-m7";

// ================================================================================================
// (1) parser units
// ================================================================================================

describe("D-67 parser: parseNTriples is a pure, total function over N-Triples", () => {
  it("parses a well-formed all-IRI triple", () => {
    const { triples, errors } = parseNTriples("<http://ex/a> <http://ex/p> <http://ex/b> .\n");
    expect(errors).toEqual([]);
    expect(triples).toHaveLength(1);
    expect(triples[0]!.subject).toEqual({ type: "iri", value: "http://ex/a" });
    expect(triples[0]!.predicate).toBe("http://ex/p");
    expect(triples[0]!.object).toEqual({ type: "iri", value: "http://ex/b" });
  });

  it("parses blank-node subject and object", () => {
    const { triples, errors } = parseNTriples("_:b0 <http://ex/p> _:b1 .");
    expect(errors).toEqual([]);
    expect(triples[0]!.subject).toEqual({ type: "blank", label: "b0" });
    expect(triples[0]!.object).toEqual({ type: "blank", label: "b1" });
  });

  it("parses a plain literal object", () => {
    const { triples, errors } = parseNTriples('<http://ex/a> <http://ex/name> "Alice" .');
    expect(errors).toEqual([]);
    expect(triples[0]!.object).toEqual({ type: "literal", value: "Alice" });
  });

  it('parses a "..."^^<datatype> typed literal', () => {
    const { triples, errors } = parseNTriples(
      '<http://ex/a> <http://ex/age> "42"^^<http://www.w3.org/2001/XMLSchema#integer> .',
    );
    expect(errors).toEqual([]);
    expect(triples[0]!.object).toEqual({
      type: "literal",
      value: "42",
      datatype: "http://www.w3.org/2001/XMLSchema#integer",
    });
  });

  it('parses a "..."@lang tagged literal', () => {
    const { triples, errors } = parseNTriples('<http://ex/a> <http://ex/name> "Bonjour"@fr-CA .');
    expect(errors).toEqual([]);
    expect(triples[0]!.object).toEqual({ type: "literal", value: "Bonjour", lang: "fr-CA" });
  });

  it("decodes ECHAR escapes in a literal (\\\" \\\\ \\n \\t \\r)", () => {
    const { triples, errors } = parseNTriples('<http://ex/a> <http://ex/p> "x\\"y\\\\z\\n\\t\\r" .');
    expect(errors).toEqual([]);
    expect((triples[0]!.object as { value: string }).value).toBe('x"y\\z\n\t\r');
  });

  it("decodes UCHAR escapes (\\uXXXX, \\UXXXXXXXX) in literals and IRIs", () => {
    const lit = parseNTriples('<http://ex/a> <http://ex/p> "\\u0041\\U0001F600" .');
    expect(lit.errors).toEqual([]);
    expect((lit.triples[0]!.object as { value: string }).value).toBe("A\u{1F600}");
    const iri = parseNTriples("<http://ex/\\u00e9> <http://ex/p> <http://ex/b> .");
    expect(iri.errors).toEqual([]);
    expect((iri.triples[0]!.subject as { value: string }).value).toBe("http://ex/é");
  });

  it("skips blank lines and #-comment lines", () => {
    const doc = ["# a comment", "", "   ", "<http://ex/a> <http://ex/p> <http://ex/b> . # trailing", "# end"].join("\n");
    const { triples, errors } = parseNTriples(doc);
    expect(errors).toEqual([]);
    expect(triples).toHaveLength(1);
    expect(triples[0]!.line).toBe(4);
  });

  it("handles both CRLF and LF line endings identically", () => {
    const lf = "<http://ex/a> <http://ex/p> <http://ex/b> .\n<http://ex/c> <http://ex/p> <http://ex/d> .\n";
    const crlf = lf.replace(/\n/g, "\r\n");
    const a = parseNTriples(lf);
    const b = parseNTriples(crlf);
    expect(a.errors).toEqual([]);
    expect(b.errors).toEqual([]);
    expect(b.triples.map((t) => t.subject)).toEqual(a.triples.map((t) => t.subject));
    expect(b.triples).toHaveLength(2);
  });

  it("reports a missing terminating '.' as an honest line-numbered error (N5), not a triple", () => {
    const { triples, errors } = parseNTriples("<http://ex/a> <http://ex/p> <http://ex/b>\n");
    expect(triples).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.line).toBe(1);
    expect(errors[0]!.reason).toMatch(/terminating/i);
  });

  it("reports an unbalanced <> as an error (N5)", () => {
    const { triples, errors } = parseNTriples("<http://ex/a <http://ex/p> <http://ex/b> .");
    expect(triples).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it("reports an unbalanced quote as an error (N5)", () => {
    const { triples, errors } = parseNTriples('<http://ex/a> <http://ex/p> "unterminated .');
    expect(triples).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it("is total: a mix of good and bad lines yields the good triples AND the per-line errors", () => {
    const doc = [
      "<http://ex/a> <http://ex/p> <http://ex/b> .",
      "garbage line",
      '<http://ex/c> <http://ex/p> "ok" .',
    ].join("\n");
    const { triples, errors } = parseNTriples(doc);
    expect(triples).toHaveLength(2);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.line).toBe(2);
  });
});

// ================================================================================================
// (2) mapping units
// ================================================================================================

const NS = "testns";
const iri = (v: string): NTriple["subject"] => ({ type: "iri", value: v });
function triple(s: string, p: string, o: NTriple["object"]): NTriple {
  return { subject: iri(s), predicate: p, object: o, line: 1 };
}
function nodes(proposed: AssertInput[]): AssertInput[] {
  return proposed.filter((a) => a.target.kind === "node");
}
function edges(proposed: AssertInput[]): AssertInput[] {
  return proposed.filter((a) => a.target.kind === "edge");
}
function props(proposed: AssertInput[]): AssertInput[] {
  return proposed.filter((a) => a.target.kind === "node-prop");
}

describe("D-67 mapping: triples -> AcquisitionResult (ADR-B11/B11a)", () => {
  it("owl:sameAs -> a reversible same_as edge in `proposed` (the D-67 headline)", () => {
    const { result } = mapTriplesToAcquisition(
      [triple("http://ex/a", OWL_SAME_AS_IRI, iri("http://ex/b"))],
      NS,
      "src://x",
    );
    const sa = edges(result.proposed).filter((e) => (e.target as { edgeKind: string }).edgeKind === SAME_AS_EDGE_KIND);
    expect(sa).toHaveLength(1);
    const t = sa[0]!.target as { eid: string; from: string; to: string };
    expect(t.from).toBe("http://ex/a");
    expect(t.to).toBe("http://ex/b");
    expect(t.eid).toBe(edgeEid(SAME_AS_EDGE_KIND, "http://ex/a", "http://ex/b"));
    // Both endpoints get a node-existence fact so the join is observable.
    expect(nodes(result.proposed).map((n) => n.target.eid).sort()).toEqual(["http://ex/a", "http://ex/b"]);
  });

  it("rdf:type -> sets the subject node's kind (deterministic min) AND is a lossless edge", () => {
    const { result } = mapTriplesToAcquisition(
      [
        triple("http://ex/a", RDF_TYPE_IRI, iri("http://ex/Zebra")),
        triple("http://ex/a", RDF_TYPE_IRI, iri("http://ex/Animal")),
      ],
      NS,
      "src://x",
    );
    const subj = nodes(result.proposed).find((n) => n.target.eid === "http://ex/a")!;
    // Minimum type IRI by byte order: "Animal" < "Zebra".
    expect((subj.target as { nodeKind?: string }).nodeKind).toBe("http://ex/Animal");
    // Both types remain as reversible rdf:type edges (nothing lost).
    const typeEdges = edges(result.proposed).filter((e) => (e.target as { edgeKind: string }).edgeKind === RDF_TYPE_IRI);
    expect(typeEdges.map((e) => (e.target as { to: string }).to).sort()).toEqual([
      "http://ex/Animal",
      "http://ex/Zebra",
    ]);
  });

  it("a generic IRI-object predicate -> an edge with edgeKind = predicate IRI verbatim", () => {
    const { result } = mapTriplesToAcquisition(
      [triple("http://ex/a", "http://ex/knows", iri("http://ex/b"))],
      NS,
      "src://x",
    );
    const e = edges(result.proposed).find((x) => (x.target as { edgeKind: string }).edgeKind === "http://ex/knows")!;
    expect(e).toBeDefined();
    const t = e.target as { from: string; to: string; eid: string };
    expect(t.from).toBe("http://ex/a");
    expect(t.to).toBe("http://ex/b");
    expect(t.eid).toBe(edgeEid("http://ex/knows", "http://ex/a", "http://ex/b"));
  });

  it("a literal object -> a node prop keyed by the predicate IRI, value = lexical value", () => {
    const { result } = mapTriplesToAcquisition(
      [triple("http://ex/a", "http://ex/name", { type: "literal", value: "Alice" })],
      NS,
      "src://x",
    );
    const p = props(result.proposed).find((x) => (x.target as { prop: string }).prop === "http://ex/name")!;
    expect(p).toBeDefined();
    expect(p.value).toBe("Alice");
    expect(p.target.eid).toBe("http://ex/a");
  });

  it("datatype and lang are recorded as adjacent props (never dropped, N5)", () => {
    const dt = mapTriplesToAcquisition(
      [triple("http://ex/a", "http://ex/age", { type: "literal", value: "42", datatype: "http://xsd/integer" })],
      NS,
      "src://x",
    );
    const dtProp = props(dt.result.proposed).find(
      (x) => (x.target as { prop: string }).prop === `http://ex/age${DATATYPE_PROP_SUFFIX}`,
    )!;
    expect(dtProp.value).toBe("http://xsd/integer");

    const lg = mapTriplesToAcquisition(
      [triple("http://ex/a", "http://ex/name", { type: "literal", value: "Bonjour", lang: "fr" })],
      NS,
      "src://x",
    );
    const lgProp = props(lg.result.proposed).find(
      (x) => (x.target as { prop: string }).prop === `http://ex/name${LANG_PROP_SUFFIX}`,
    )!;
    expect(lgProp.value).toBe("fr");
  });

  it("blank-node skolemization is STABLE across repeated parses of the same file, and namespaced", () => {
    const text = "_:b0 <http://ex/p> _:b1 .\n";
    const ns1 = resolveNamespace(text);
    const ns2 = resolveNamespace(text);
    expect(ns1).toBe(ns2); // deterministic (a content hash)
    expect(skolemizeBlank("b0", ns1)).toBe(skolemizeBlank("b0", ns2));
    // A different namespace (e.g. a different file) never collides.
    expect(skolemizeBlank("b0", "nsA")).not.toBe(skolemizeBlank("b0", "nsB"));
    // The skolem is a `_:`-prefixed, namespaced eid derived from the file's own label.
    expect(skolemizeBlank("b0", ns1)).toBe(`_:${ns1}.b0`);
    expect(termToEid({ type: "blank", label: "b0" }, ns1)).toBe(`_:${ns1}.b0`);
    // fnv is deterministic and differs for different content.
    expect(fnv1aHex(text)).toBe(ns1);
    expect(fnv1aHex(text)).not.toBe(fnv1aHex(`${text}extra`));
  });

  it("the whole reader is deterministic: same text -> byte-identical proposed fact set + order", () => {
    const text = [
      `<http://ex/a> <${RDF_TYPE_IRI}> <http://ex/Person> .`,
      "<http://ex/a> <http://ex/name> \"Alice\" .",
      `<http://ex/a> <${OWL_SAME_AS_IRI}> <http://ex/alice> .`,
      "_:b0 <http://ex/p> <http://ex/a> .",
    ].join("\n");
    const one = rdfToAcquisition(text);
    const two = rdfToAcquisition(text);
    expect(JSON.stringify(one.result.proposed)).toBe(JSON.stringify(two.result.proposed));
    expect(one.parseErrors).toEqual([]);
  });
});

// ================================================================================================
// (2b) adversarial integrity - untrusted RDF data cannot forge reserved channels or collide keys
// ================================================================================================

describe("D-67 integrity: untrusted RDF data cannot forge reserved kip channels (N5, fail-safe)", () => {
  const RESERVED_EDGE_PREDICATES = [SAME_AS_EDGE_KIND, "not_same_as", "documents", "kip:same_as?"];

  it("the reserved set is enumerated from kip's OWN constants (drift-proof)", () => {
    for (const k of ["same_as", "not_same_as", "documents", "kip:same_as?", "kip:conflict"]) {
      expect(RESERVED_KINDS.has(k)).toBe(true);
    }
  });

  it.each(RESERVED_EDGE_PREDICATES)(
    "a generic predicate <%s> is REFUSED and authors NO reserved-channel edge",
    (reserved) => {
      const text = `<http://ex/a> <${reserved}> <http://ex/b> .\n`;
      const { result, parseErrors } = rdfToAcquisition(text);
      // Refused (N5): surfaced as an error, NOT silently authored.
      expect(parseErrors.length).toBe(1);
      expect(parseErrors[0]!.reason).toMatch(/reserved/i);
      // ZERO edges authored on ANY reserved channel.
      const authoredEdges = result.proposed.filter((a) => a.target.kind === "edge");
      expect(authoredEdges).toHaveLength(0);
      // mappingErrorFor is the pure guard.
      expect(mappingErrorFor({ subject: { type: "iri", value: "http://ex/a" }, predicate: reserved, object: { type: "iri", value: "http://ex/b" }, line: 1 })).toMatch(/reserved/i);
    },
  );

  it("a forged <not_same_as> is NOT silently bucketed under the generic `edges` count", () => {
    const { counts, parseErrors } = rdfToAcquisition("<http://ex/a> <not_same_as> <http://ex/b> .\n");
    expect(parseErrors.length).toBe(1);
    expect(counts.edges).toBe(0);
    expect(counts.sameAs).toBe(0);
  });

  it("owl:sameAs is STILL the sanctioned route onto same_as (not caught by the reserved guard)", () => {
    const { result, parseErrors } = rdfToAcquisition(`<http://ex/a> <${OWL_SAME_AS_IRI}> <http://ex/b> .\n`);
    expect(parseErrors).toEqual([]);
    const sa = result.proposed.filter((a) => a.target.kind === "edge" && (a.target as { edgeKind: string }).edgeKind === SAME_AS_EDGE_KIND);
    expect(sa).toHaveLength(1);
  });

  it("an rdf:type whose object is a reserved kind (kip:conflict) is REFUSED (node-kind forge)", () => {
    const { result, parseErrors } = rdfToAcquisition(`<http://ex/a> <${RDF_TYPE_IRI}> <kip:conflict> .\n`);
    expect(parseErrors.length).toBe(1);
    expect(parseErrors[0]!.reason).toMatch(/reserved/i);
    // No node stamped with the forged kind, no edge authored.
    expect(result.proposed.filter((a) => a.target.kind === "node" && (a.target as { nodeKind?: string }).nodeKind === "kip:conflict")).toHaveLength(0);
    expect(result.proposed.filter((a) => a.target.kind === "edge")).toHaveLength(0);
  });

  it("a predicate that DECODES to contain a space is REFUSED, and cannot shadow a @lang sidecar cell", () => {
    // `@` is a RAW-legal IRIREF char, so `<http://ex/name @lang>` parses and decodes to the key
    // `http://ex/name @lang` - it is the SPACE guard (not the raw-char guard) that must catch this,
    // else it would shadow the legitimate `http://ex/name @lang` datatype/lang sidecar cell (LWW forge).
    const forged = '<http://ex/a> <http://ex/name\\u0020@lang> "forged-lang" .';
    const legit = '<http://ex/a> <http://ex/name> "Bonjour"@fr .';
    const { result, parseErrors } = rdfToAcquisition(`${forged}\n${legit}\n`);
    // The forged predicate line is refused for the SPACE reason (N5); the legit lang literal survives.
    expect(parseErrors.length).toBe(1);
    expect(parseErrors[0]!.reason).toMatch(/space/i);
    const sidecar = result.proposed.filter(
      (a) => a.target.kind === "node-prop" && (a.target as { prop: string }).prop === `http://ex/name${LANG_PROP_SUFFIX}`,
    );
    // Exactly ONE sidecar cell, holding the LEGIT lang tag - the forge never wrote/shadowed it.
    expect(sidecar).toHaveLength(1);
    expect(sidecar[0]!.value).toBe("fr");
  });

  it("mapTriplesToAcquisition itself refuses to author a reserved-channel triple passed directly (defense-in-depth)", () => {
    const t: NTriple = { subject: { type: "iri", value: "http://ex/a" }, predicate: "not_same_as", object: { type: "iri", value: "http://ex/b" }, line: 1 };
    const { result } = mapTriplesToAcquisition([t], "ns", "src://x");
    expect(result.proposed.filter((a) => a.target.kind === "edge")).toHaveLength(0);
  });

  it("a lone UTF-16 surrogate escape (\\uD800) is a parse error (N5), not a coerced char", () => {
    const { triples, errors } = parseNTriples('<http://ex/a> <http://ex/p> "\\uD800" .');
    expect(triples).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it("an empty IRIREF <> is malformed (a bad node identity)", () => {
    expect(parseNTriples("<> <http://ex/p> <http://ex/b> .").errors).toHaveLength(1);
    expect(parseNTriples("<http://ex/a> <> <http://ex/b> .").errors).toHaveLength(1);
    expect(parseNTriples("<http://ex/a> <http://ex/p> <> .").errors).toHaveLength(1);
  });

  it("blank-node namespace is line-ending INVARIANT: same graph LF vs CRLF yields identical skolem eids", () => {
    const lf = "_:b0 <http://ex/p> _:b1 .\n_:b1 <http://ex/q> <http://ex/c> .\n";
    const crlf = lf.replace(/\n/g, "\r\n");
    expect(resolveNamespace(lf)).toBe(resolveNamespace(crlf));
    const nsLf = resolveNamespace(lf);
    const nsCrlf = resolveNamespace(crlf);
    expect(termToEid({ type: "blank", label: "b0" }, nsLf)).toBe(termToEid({ type: "blank", label: "b0" }, nsCrlf));
  });

  it("a blank label starting with '.' or '-' is malformed", () => {
    expect(parseNTriples("_:.bad <http://ex/p> <http://ex/b> .").errors).toHaveLength(1);
    expect(parseNTriples("_:-bad <http://ex/p> <http://ex/b> .").errors).toHaveLength(1);
  });
});

// ================================================================================================
// (3) integration - the REAL runAcquisition write path
// ================================================================================================

describe("D-67 integration: ingest via the REAL runAcquisition (INV-A1, queryable, reversible, idempotent)", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  async function rdfRepo(label: string): Promise<{ repo: KipRepo; manifest: import("../index").MicroagentManifest }> {
    const repo = new KipRepo({ replicaId: freshReplicaId(label), dispatchMicroagent: rdfIngestDispatch });
    repos.push(repo);
    const manifest = await registerAcquisitionManifest(repo, "kip-rdf");
    return { repo, manifest };
  }

  const A = "http://ex/alice";
  const A2 = "http://ex/alice-dup";
  const DOC = [
    `<${A}> <${RDF_TYPE_IRI}> <http://ex/Person> .`,
    `<${A}> <http://ex/name> "Alice" .`,
    `<${A}> <http://ex/age> "42"^^<http://www.w3.org/2001/XMLSchema#integer> .`,
    `<${A}> <http://ex/knows> <http://ex/bob> .`,
    `<${A}> <${OWL_SAME_AS_IRI}> <${A2}> .`,
    "",
  ].join("\n");

  it("nodes/props/edges are QUERYABLE and the subject kind comes from rdf:type", async () => {
    const { repo, manifest } = await rdfRepo("query");
    await repo.runAcquisition(manifest, { ntriples: DOC, graph: "g1" }, { asOf: FIXED_AS_OF });

    const alice = await repo.getNode(A);
    expect(alice).not.toBeNull();
    expect(alice!.kind).toBe("http://ex/Person"); // rdf:type -> node kind
    // literal prop is readable
    const nameSeg = alice!.props?.["http://ex/name"]?.segments?.find((s) => s.kind === "value");
    expect(nameSeg && (nameSeg as { value: unknown }).value).toBe("Alice");
    // datatype recorded as an adjacent prop (never dropped)
    const dtSeg = alice!.props?.[`http://ex/age${DATATYPE_PROP_SUFFIX}`]?.segments?.find((s) => s.kind === "value");
    expect(dtSeg && (dtSeg as { value: unknown }).value).toBe("http://www.w3.org/2001/XMLSchema#integer");

    // the knows edge exists as an ordinary reversible edge
    const knowsEid = edgeEid("http://ex/knows", A, "http://ex/bob");
    expect(await repo.getEdge(knowsEid)).not.toBeNull();
    expect(await repo.edgeExistenceFactId(knowsEid)).not.toBeNull();
    // the object node exists too (queryable union endpoint)
    expect(await repo.getNode("http://ex/bob")).not.toBeNull();
  });

  it("owl:sameAs JOINS the two IRIs (sameAsClass) via the same union-find machinery the linker uses", async () => {
    const { repo, manifest } = await rdfRepo("join");
    await repo.runAcquisition(manifest, { ntriples: DOC, graph: "g1" }, { asOf: FIXED_AS_OF });
    const cls = await repo.sameAsClass(A);
    expect(cls).toContain(A);
    expect(cls).toContain(A2);
    // getNode collapses to the SAME canonical node for both aliases (a genuine join, never a merge-rewrite).
    const viaA = await repo.getNode(A);
    const viaDup = await repo.getNode(A2);
    expect(viaA!.eid).toBe(viaDup!.eid);
  });

  it("REVERSIBILITY: the same_as is an ordinary signed edge - retracting it removes the edge fact", async () => {
    const { repo, manifest } = await rdfRepo("reverse");
    await repo.runAcquisition(manifest, { ntriples: DOC, graph: "g1" }, { asOf: FIXED_AS_OF });
    const saEid = edgeEid(SAME_AS_EDGE_KIND, A, A2);
    expect(await repo.edgeExistenceFactId(saEid)).not.toBeNull();

    // Retract the same_as edge (an ordinary signed retract - never an identity un-merge).
    await repo.retractFact({
      type: "retract",
      v: 1,
      target: { kind: "edge", eid: saEid, edgeKind: SAME_AS_EDGE_KIND, from: A, to: A2 },
      validFrom: 0,
      validTo: null,
      replicaId: repo.replicaId,
      provenance: { author: "test", signature: "", publicKeyFingerprint: "", signedFields: [] },
    });
    // Fact-level reversibility (the SAME proof the entity-linker tests use): the edge-existence winner
    // is gone. NOTE (honest boundary): read-level un-merge after a same_as retract - sameAsClass/getEdge
    // dropping the projection - is NOT auto-recomputed; that is the pre-existing DEBTS D-68 proj limit
    // (proj's union-find folds every signature-admitted same_as assert and does not read retraction
    // state), not a D-67 defect. D-67 authors an ordinary, retractable edge; the fact channel reverses.
    expect(await repo.edgeExistenceFactId(saEid)).toBeNull();
  });

  it("DETERMINISM / idempotence: re-ingesting the same file authors NO new same_as edge (content eids fold)", async () => {
    const { repo, manifest } = await rdfRepo("idem");
    const first = await repo.runAcquisition(manifest, { ntriples: DOC, graph: "g1" }, { asOf: FIXED_AS_OF });
    expect(first.facts.length).toBeGreaterThan(0);
    const saEid = edgeEid(SAME_AS_EDGE_KIND, A, A2);
    const saFactId1 = await repo.edgeExistenceFactId(saEid);
    expect(saFactId1).not.toBeNull();

    await repo.runAcquisition(manifest, { ntriples: DOC, graph: "g1" }, { asOf: FIXED_AS_OF });
    // The content-derived same_as edge folds onto the SAME cell - the winner FactId is stable.
    expect(await repo.edgeExistenceFactId(saEid)).toBe(saFactId1);
    // Read-level projection is unchanged (idempotent join).
    const cls = await repo.sameAsClass(A);
    expect(cls.sort()).toEqual([A2, A].sort());
  });

  it("N5: a malformed file (default strict) is REFUSED by runAcquisition - nothing is authored", async () => {
    const { repo, manifest } = await rdfRepo("strict");
    const bad = "<http://ex/a> <http://ex/p> <http://ex/b>\n"; // missing '.'
    await expect(repo.runAcquisition(manifest, { ntriples: bad, graph: "g1" }, { asOf: FIXED_AS_OF })).rejects.toThrow();
    // No node was authored (the strict dispatch failed before any commit).
    expect(await repo.getNode("http://ex/a")).toBeNull();
  });

  it("INTEGRITY: a forged <not_same_as> triple is REFUSED by runAcquisition - no veto edge is authored", async () => {
    const { repo, manifest } = await rdfRepo("forge");
    const forged = `<http://ex/x> <not_same_as> <http://ex/y> .\n`;
    await expect(
      repo.runAcquisition(manifest, { ntriples: forged, graph: "g1" }, { asOf: FIXED_AS_OF }),
    ).rejects.toThrow();
    // No not_same_as edge exists (getEdge on the content-derived eid the generic mapping WOULD have used).
    expect(await repo.edgeExistenceFactId(edgeEid("not_same_as", "http://ex/x", "http://ex/y"))).toBeNull();
    // And getNode does not surface kip:conflict on either endpoint (the veto never landed).
    expect(await repo.getNode("http://ex/x")).toBeNull();
  });

  it("INTEGRITY: --skip-malformed drops a forged reserved-channel line but keeps the well-formed triples", async () => {
    const { repo, manifest } = await rdfRepo("forge-skip");
    const mixed = [`<http://ex/a> <not_same_as> <http://ex/b> .`, '<http://ex/a> <http://ex/name> "ok" .', ""].join("\n");
    await repo.runAcquisition(manifest, { ntriples: mixed, graph: "g1", skipMalformed: true }, { asOf: FIXED_AS_OF });
    // The good triple landed; the forged veto did NOT.
    expect(await repo.getNode("http://ex/a")).not.toBeNull();
    expect(await repo.edgeExistenceFactId(edgeEid("not_same_as", "http://ex/a", "http://ex/b"))).toBeNull();
  });

  it("N5: --skip-malformed ingests the good triples and skips the bad line", async () => {
    const { repo, manifest } = await rdfRepo("skip");
    const mixed = ["<http://ex/a> <http://ex/p> <http://ex/b> .", "garbage", '<http://ex/a> <http://ex/name> "ok" .'].join(
      "\n",
    );
    const { facts } = await repo.runAcquisition(
      manifest,
      { ntriples: mixed, graph: "g1", skipMalformed: true },
      { asOf: FIXED_AS_OF },
    );
    expect(facts.length).toBeGreaterThan(0);
    const a = await repo.getNode("http://ex/a");
    expect(a).not.toBeNull();
    const nameSeg = a!.props?.["http://ex/name"]?.segments?.find((s) => s.kind === "value");
    expect(nameSeg && (nameSeg as { value: unknown }).value).toBe("ok");
  });
});

// ================================================================================================
// (4) CLI wiring — `kip ingest-rdf` (mirrors cmdLink: usage errors, strict/skip policy, dry-run)
// ================================================================================================

async function runIngest(
  argv: string[],
  opts: { cwd: string; openRepo?: (o: OpenOptions) => Promise<Repo> },
): Promise<{ code: number; stdout: string; stderr: string }> {
  const out: string[] = [];
  const err: string[] = [];
  const code = await runCli(argv, {
    cwd: opts.cwd,
    env: {},
    stdout: (c) => out.push(c),
    stderr: (c) => err.push(c),
    openRepo: opts.openRepo,
  });
  return { code, stdout: out.join(""), stderr: err.join("") };
}

describe("D-67 CLI: `kip ingest-rdf` (parses a local .nt, authors via runAcquisition)", () => {
  const dirs: string[] = [];
  function mkTmp(label: string): string {
    const d = mkdtempSync(join(tmpdir(), `kip-rdf-${label}-`));
    dirs.push(d);
    return d;
  }
  async function initRepoDir(label: string): Promise<string> {
    const dir = mkTmp(label);
    const repo = await open({ dir, replicaId: `rdf-cli-${label}-${Date.now()}`, keyring: {}, createIfMissing: true });
    repo.close();
    writeFileSync(join(dir, "keyring.json"), JSON.stringify({ note: "test keyring" }));
    return dir;
  }

  it("a missing <file> is a usage error (exit 2)", async () => {
    const r = await runIngest(["ingest-rdf"], { cwd: mkTmp("nofile") });
    expect(r.code).toBe(2);
    expect(r.stderr).toMatch(/requires a <file>/);
  });

  it("a non-existent <file> is a usage error (exit 2)", async () => {
    const r = await runIngest(["ingest-rdf", "nope.nt"], { cwd: mkTmp("absent") });
    expect(r.code).toBe(2);
    expect(r.stderr).toMatch(/no such file/);
  });

  it("N5 strict: a malformed file exits 1 with line-numbered reasons and authors NOTHING (before repo open)", async () => {
    const cwd = mkTmp("strict");
    writeFileSync(join(cwd, "bad.nt"), "<http://ex/a> <http://ex/p> <http://ex/b>\n"); // missing '.'
    let opened = false;
    const r = await runIngest(["ingest-rdf", "bad.nt"], {
      cwd,
      openRepo: async () => {
        opened = true;
        throw new Error("should not open the repo on a strict malformed file");
      },
    });
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/line 1:/);
    expect(opened).toBe(false); // strict-fail happens before any repo write
  });

  it("--dry-run reports would-be counts WITHOUT authoring (exit 0, no repo opened)", async () => {
    const cwd = mkTmp("dry");
    writeFileSync(
      join(cwd, "g.nt"),
      [`<http://ex/a> <${OWL_SAME_AS_IRI}> <http://ex/b> .`, '<http://ex/a> <http://ex/name> "A" .', ""].join("\n"),
    );
    const dry = await runIngest(["ingest-rdf", "g.nt", "--dry-run", "--json"], {
      cwd,
      openRepo: async () => {
        throw new Error("dry-run must not open the repo");
      },
    });
    expect(dry.code).toBe(0);
    const parsed = JSON.parse(dry.stdout.trim()) as { facts: unknown[]; sameAs: number; props: number; dryRun: boolean };
    expect(parsed.dryRun).toBe(true);
    expect(parsed.facts).toEqual([]);
    expect(parsed.sameAs).toBe(1);
    expect(parsed.props).toBe(1);
  });

  it("authors via runAcquisition and renders by-kind counts (spy repo asserts the CLI→SDK wiring)", async () => {
    const dir = await initRepoDir("author");
    writeFileSync(
      join(dir, "g.nt"),
      [`<http://ex/a> <${OWL_SAME_AS_IRI}> <http://ex/b> .`, '<http://ex/a> <http://ex/name> "A" .', ""].join("\n"),
    );
    const calls: Array<{ method: string; input?: unknown }> = [];
    const spy = {
      registerFunctionality: async (_id: string, _m: MicroagentManifest) => {
        calls.push({ method: "registerFunctionality" });
      },
      runAcquisition: async (_m: MicroagentManifest, input: unknown) => {
        calls.push({ method: "runAcquisition", input });
        return { facts: ["f1", "f2", "f3"] };
      },
      close: () => undefined,
    } as unknown as Repo;

    const r = await runIngest(["ingest-rdf", "g.nt", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: async (_o: OpenOptions) => spy,
    });
    expect(r.code).toBe(0);
    const wiring = calls.find((c) => c.method === "runAcquisition")!;
    expect((wiring.input as { ntriples: string }).ntriples).toContain(OWL_SAME_AS_IRI);
    const parsed = JSON.parse(r.stdout.trim()) as { facts: string[]; sameAs: number; props: number };
    expect(parsed.facts).toEqual(["f1", "f2", "f3"]);
    expect(parsed.sameAs).toBe(1);
    expect(parsed.props).toBe(1);
  });
});
