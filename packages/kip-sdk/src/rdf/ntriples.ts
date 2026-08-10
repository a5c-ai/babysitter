/**
 * D-67 - deterministic, dependency-free RDF / linked-data ingestion (N-Triples) through the EXISTING
 * `runAcquisition` write path (ADR-B11's RDF forward-design; ADR-B11a's `same_as` channel).
 *
 * The DESIGN (ADR-B11 "RDF forward-design"): an external linked-data graph joins kip's memory through
 * the SAME reversible-edge machinery the entity linker uses. IRIs are GLOBAL eids (the eid IS the IRI),
 * so `owl:sameAs` becomes an ordinary signed, reversible `same_as` edge folded by proj's union-find
 * closure (`proj.ts` section 5b.1) and contradictable by `not_same_as` - never an identity merge.
 *
 * SCOPE (D-67, this pass): LOCAL-FILE N-Triples (`.nt`) ONLY. Remote fetch / SPARQL / public-graph
 * querying is OUT OF SCOPE (network + untrusted-download concerns) - a deferred follow-on. Turtle /
 * JSON-LD are also deferred (N-Triples is the canonical line-based serialization). See DEBTS D-67.
 *
 * INV-A1: everything in this module is a PURE function of its text/triple input. It never receives a
 * `Repo` and never writes the graph. The `kip ingest-rdf` CLI reads the file (I/O), and ONLY
 * `runAcquisition` authors the returned `AcquisitionResult` as signed, reversible facts - exactly the
 * code-miner / entity-linker lifecycle.
 *
 * N5: a malformed triple/line is surfaced as an honest, line-numbered parse error - NEVER a fabricated
 * fact and never silently swallowed. `parseNTriples` is PURE and TOTAL (it never throws); the default
 * policy is strict-fail the whole file, and `--skip-malformed` (threaded as `skipMalformed`) downgrades
 * malformed lines to reported skips.
 *
 * DETERMINISM: the same input file always yields the same eids and a byte-identical authored fact set +
 * order - blank nodes are skolemized by a stable per-file namespace (a content hash, or an explicit
 * `--graph` id), never a random / encounter-order counter; the emitted `proposed` array is sorted.
 */
import type { AssertInput, DispatchMicroagentFn, EID, Provenance } from "../index";
import { DOCUMENTS_EDGE_KIND } from "../linker/entity-linker";
import { KIP_SAME_AS_CANDIDATE_KIND, NOT_SAME_AS_EDGE_KIND } from "../linker/entity-resolver";
import { KIP_CONFLICT_KIND } from "../proj";

// --- well-known IRIs / kinds -------------------------------------------------------------------

/** `rdf:type` - sets the subject node's `kind` (the deterministic-minimum type IRI) AND is recorded
 *  losslessly as an ordinary reversible edge (so a resource's every type is preserved and queryable). */
export const RDF_TYPE_IRI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

/** `owl:sameAs` - the D-67 headline: a signed, reversible `same_as` edge on the linker's OWN channel. */
export const OWL_SAME_AS_IRI = "http://www.w3.org/2002/07/owl#sameAs";

/** The implicit datatype of a plain string literal (RDF 1.1) - never recorded as an adjacent prop. */
export const XSD_STRING_IRI = "http://www.w3.org/2001/XMLSchema#string";

/** The reversible identity-join edge kind proj's section 5b.1 union-find closure folds (ADR-B11a). */
export const SAME_AS_EDGE_KIND = "same_as";

/**
 * The RESERVED kip edge/node kinds a GENERIC RDF predicate (or an rdf:type object) may NEVER mint -
 * enumerated from kip's OWN constants (drift-proof), NOT re-hardcoded. Untrusted external RDF data must
 * not be able to forge an identity join (`same_as`), inject a veto that surfaces `kip:conflict`
 * (`not_same_as`, proj folds by edgeKind alone), impersonate a Layer-1 `documents` link or a Layer-2
 * `kip:same_as?` quarantine candidate, or stamp a node's kind as `kip:conflict`. `owl:sameAs` is the
 * ONLY sanctioned route onto the `same_as` channel and is handled BEFORE this guard fires.
 */
export const RESERVED_KINDS: ReadonlySet<string> = new Set([
  SAME_AS_EDGE_KIND, // "same_as"
  NOT_SAME_AS_EDGE_KIND, // "not_same_as"
  DOCUMENTS_EDGE_KIND, // "documents"
  KIP_SAME_AS_CANDIDATE_KIND, // "kip:same_as?"
  KIP_CONFLICT_KIND, // "kip:conflict"
]);

/** The bundled acquisition-family manifest name (`kip ingest-rdf` registers it idempotently). */
export const RDF_INGEST_MANIFEST_NAME = "kip-rdf";

/** The linker's content-derived edge-eid shape (`${edgeKind}:${from}=>${to}`) - a byte-identical
 *  re-ingest of the same triple folds onto the SAME edge cell (idempotence via `runAcquisition`'s
 *  ADR-B12a idempotent edge-existence). */
export function edgeEid(edgeKind: string, from: EID, to: EID): string {
  return `${edgeKind}:${from}=>${to}`;
}

/**
 * Datatype/lang are recorded as ADJACENT node props (NEVER silently dropped, N5), keyed with a
 * documented, deterministic suffix on the predicate IRI. A predicate `P` carrying a typed literal thus
 * authors `P` (lexical value) + `P ^^datatype` (datatype IRI) and/or `P @lang` (BCP-47 tag). Both
 * separators begin with a SPACE. An IRIREF CAN decode to a space (via a ` ` UCHAR), so the
 * separator alone is NOT collision-proof - the collision is closed at the root instead by REJECTING any
 * predicate IRI whose decoded form contains a space (`mappingErrorFor`, N5), so no predicate key can
 * ever alias a `${P} ^^datatype` / `${P} @lang` sidecar cell.
 */
export const DATATYPE_PROP_SUFFIX = " ^^datatype";
export const LANG_PROP_SUFFIX = " @lang";

// --- term / triple model -----------------------------------------------------------------------

/** One RDF term: an IRI (resolved, UCHAR-unescaped), a blank-node label (pre-skolem), or a literal. */
export type RdfTerm =
  | { type: "iri"; value: string }
  | { type: "blank"; label: string }
  | { type: "literal"; value: string; datatype?: string; lang?: string };

/** One parsed N-Triples statement: `<subject> <predicate> <object> .` with its 1-based source line. */
export interface NTriple {
  subject: RdfTerm;
  predicate: string; // an IRIREF only (N-Triples predicates are never blank/literal)
  object: RdfTerm;
  line: number;
}

/** An honest, line-numbered malformed-line report (N5) - the parser is total; it never throws. */
export interface NTripleParseError {
  line: number;
  text: string;
  reason: string;
}

/** `parseNTriples` output - the well-formed triples and every malformed line's honest reason. */
export interface ParseResult {
  triples: NTriple[];
  errors: NTripleParseError[];
}

// --- the pure, total N-Triples parser ----------------------------------------------------------

const WS = new Set([" ", "\t"]);

/** ECHAR (N-Triples escapes) - `\t \b \n \r \f \" \' \\` (the STRING_LITERAL_QUOTE escape set). */
const ECHAR: Record<string, string> = {
  t: "\t",
  b: "\b",
  n: "\n",
  r: "\r",
  f: "\f",
  '"': '"',
  "'": "'",
  "\\": "\\",
};

/** A hex codepoint UCHAR (`\uXXXX` / `\UXXXXXXXX`), shared by IRIREFs and string literals. */
function readUchar(s: string, i: number): { value: string; next: number } | null {
  const marker = s[i]; // 'u' or 'U'
  const width = marker === "u" ? 4 : marker === "U" ? 8 : 0;
  if (width === 0) return null;
  const hex = s.slice(i + 1, i + 1 + width);
  if (hex.length !== width || !/^[0-9A-Fa-f]+$/.test(hex)) return null;
  const cp = Number.parseInt(hex, 16);
  if (!Number.isFinite(cp) || cp > 0x10ffff) return null;
  // Reject a LONE UTF-16 surrogate (D800-DFFF): it is not a scalar value and would produce an
  // ill-formed string. Malformed (N5), never silently coerced to U+FFFD.
  if (cp >= 0xd800 && cp <= 0xdfff) return null;
  return { value: String.fromCodePoint(cp), next: i + 1 + width };
}

interface Cursor {
  s: string;
  i: number;
}

function skipWs(c: Cursor): void {
  while (c.i < c.s.length && WS.has(c.s[c.i]!)) c.i += 1;
}

/** Parse an IRIREF `<...>` at the cursor, resolving UCHAR escapes. Returns null on any malformed shape
 *  (no closing `>`, a bad escape, or a raw disallowed char) - the caller turns null into an N5 error. */
function readIri(c: Cursor): string | null {
  if (c.s[c.i] !== "<") return null;
  c.i += 1;
  let out = "";
  while (c.i < c.s.length) {
    const ch = c.s[c.i]!;
    if (ch === ">") {
      c.i += 1;
      // An empty IRIREF `<>` is not an absolute IRI and would yield an empty-string eid (a bad node
      // identity). Reject it as malformed (N5, item 5).
      return out === "" ? null : out;
    }
    if (ch === "\\") {
      const u = readUchar(c.s, c.i + 1);
      if (!u) return null; // only UCHAR escapes are legal inside an IRIREF
      out += u.value;
      c.i = u.next;
      continue;
    }
    // Disallowed raw chars in an IRIREF (spec): controls, space, and < " { } | ^ ` .
    const code = ch.codePointAt(0)!;
    if (code <= 0x20 || ch === "<" || ch === '"' || ch === "{" || ch === "}" || ch === "|" || ch === "^" || ch === "`") {
      return null;
    }
    out += ch;
    c.i += 1;
  }
  return null; // unbalanced <> - no closing >
}

// PN_CHARS-ish (permissive): ASCII alnum + `_`, `.`, `-`, and a broad non-ASCII range. Explicit \u
// escapes keep the source pure ASCII (LF, cross-platform) rather than embedding literal codepoints.
const BLANK_CHAR = /[0-9A-Za-z_.\-\u00B7\u00C0-\uFFFF]/;

/** Parse a BLANK_NODE_LABEL `_:label` at the cursor. Returns the raw label (pre-skolem) or null. The
 *  spec forbids a trailing `.` in the label, so a terminating `.` is left for the caller. */
function readBlank(c: Cursor): string | null {
  if (c.s[c.i] !== "_" || c.s[c.i + 1] !== ":") return null;
  c.i += 2;
  const start = c.i;
  while (c.i < c.s.length && BLANK_CHAR.test(c.s[c.i]!)) c.i += 1;
  // Trailing `.`s are not part of the label (BLANK_NODE_LABEL: PN_CHARS, `.` never last).
  while (c.i > start && c.s[c.i - 1] === ".") c.i -= 1;
  if (c.i === start) return null; // `_:` with no label char
  // BLANK_NODE_LABEL's FIRST char must be PN_CHARS_U | [0-9] - never a leading `.` or `-` (a `-` is a
  // PN_CHARS continuation only). Reject those rather than mint a skolem eid from a malformed label (N5).
  const first = c.s[start]!;
  if (first === "." || first === "-") return null;
  return c.s.slice(start, c.i);
}

/** Parse a STRING_LITERAL_QUOTE `"..."` plus an optional `^^<datatype>` or `@lang`. */
function readLiteral(c: Cursor): { value: string; datatype?: string; lang?: string } | null {
  if (c.s[c.i] !== '"') return null;
  c.i += 1;
  let value = "";
  let closed = false;
  while (c.i < c.s.length) {
    const ch = c.s[c.i]!;
    if (ch === '"') {
      c.i += 1;
      closed = true;
      break;
    }
    if (ch === "\\") {
      const esc = c.s[c.i + 1];
      if (esc === undefined) return null;
      if (esc === "u" || esc === "U") {
        const u = readUchar(c.s, c.i + 1);
        if (!u) return null;
        value += u.value;
        c.i = u.next;
        continue;
      }
      const mapped = ECHAR[esc];
      if (mapped === undefined) return null; // an unknown escape is malformed (N5)
      value += mapped;
      c.i += 2;
      continue;
    }
    if (ch === "\n" || ch === "\r") return null; // a raw newline in a literal is malformed
    value += ch;
    c.i += 1;
  }
  if (!closed) return null; // unbalanced " - no closing quote
  // Optional datatype or language tag.
  if (c.s[c.i] === "^" && c.s[c.i + 1] === "^") {
    c.i += 2;
    const dt = readIri(c);
    if (dt === null) return null;
    return { value, datatype: dt };
  }
  if (c.s[c.i] === "@") {
    c.i += 1;
    const start = c.i;
    while (c.i < c.s.length && /[A-Za-z]/.test(c.s[c.i]!)) c.i += 1;
    if (c.i === start) return null; // `@` with no primary subtag
    while (c.s[c.i] === "-") {
      c.i += 1;
      const s2 = c.i;
      while (c.i < c.s.length && /[A-Za-z0-9]/.test(c.s[c.i]!)) c.i += 1;
      if (c.i === s2) return null; // `-` with no subtag
    }
    return { value, lang: c.s.slice(start, c.i) };
  }
  return { value };
}

function readSubject(c: Cursor): RdfTerm | null {
  if (c.s[c.i] === "<") {
    const iri = readIri(c);
    return iri === null ? null : { type: "iri", value: iri };
  }
  if (c.s[c.i] === "_") {
    const label = readBlank(c);
    return label === null ? null : { type: "blank", label };
  }
  return null;
}

function readObject(c: Cursor): RdfTerm | null {
  if (c.s[c.i] === '"') {
    const lit = readLiteral(c);
    return lit === null ? null : { type: "literal", ...lit };
  }
  return readSubject(c);
}

/**
 * Parse an entire N-Triples document. PURE + TOTAL (never throws). Splits on `\n`, `\r\n`, or `\r`
 * (cross-platform, no locale), skips blank lines and `#`-comment lines, and parses one statement per
 * line. Each malformed line becomes a line-numbered `NTripleParseError` (N5) - never a fabricated
 * triple and never silently dropped.
 */
export function parseNTriples(text: string): ParseResult {
  const triples: NTriple[] = [];
  const errors: NTripleParseError[] = [];
  const lines = text.split(/\r\n|\r|\n/);
  for (let idx = 0; idx < lines.length; idx += 1) {
    const raw = lines[idx]!;
    const lineNo = idx + 1;
    const c: Cursor = { s: raw, i: 0 };
    skipWs(c);
    if (c.i >= raw.length) continue; // blank line
    if (raw[c.i] === "#") continue; // comment line

    const fail = (reason: string): void => {
      errors.push({ line: lineNo, text: raw, reason });
    };

    const subject = readSubject(c);
    if (!subject) {
      fail("expected an IRIREF <...> or a blank node _:label as the subject");
      continue;
    }
    const before = c.i;
    skipWs(c);
    if (c.i === before) {
      fail("expected whitespace after the subject");
      continue;
    }
    if (raw[c.i] !== "<") {
      fail("expected an IRIREF <...> as the predicate");
      continue;
    }
    const predicate = readIri(c);
    if (predicate === null) {
      fail("malformed predicate IRIREF (unbalanced <> or bad escape)");
      continue;
    }
    const beforeObj = c.i;
    skipWs(c);
    if (c.i === beforeObj) {
      fail("expected whitespace after the predicate");
      continue;
    }
    const object = readObject(c);
    if (!object) {
      fail("expected an IRIREF, blank node, or literal as the object");
      continue;
    }
    skipWs(c);
    if (raw[c.i] !== ".") {
      fail('expected a terminating "." (missing "." or unbalanced <> / "")');
      continue;
    }
    c.i += 1;
    skipWs(c);
    // Only a trailing comment or end-of-line may follow the '.'.
    if (c.i < raw.length && raw[c.i] !== "#") {
      fail('unexpected trailing content after the terminating "."');
      continue;
    }
    triples.push({ subject, predicate, object, line: lineNo });
  }
  return { triples, errors };
}

// --- deterministic skolemization ---------------------------------------------------------------

/** FNV-1a (32-bit) as 8-hex - a zero-dependency, cross-platform, deterministic string hash. Used ONLY
 *  to derive a per-file blank-node namespace when no explicit `--graph` id is given. It is CONTENT-
 *  DERIVED and LOW-COLLISION for this bounded use - NOT a cryptographic hash (the 32-bit space bounds
 *  distinctness; an operator wanting a guaranteed-unique namespace passes `--graph`). */
export function fnv1aHex(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    // 32-bit FNV prime multiply via shifts (stays in the 32-bit range, deterministic across engines).
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Normalize line endings (`\r\n` and `\r` -> `\n`) so a file's namespace hash is INVARIANT to the
 *  serializer's line-ending choice - the same graph saved LF vs CRLF yields the same skolem eids
 *  (idempotent re-ingest), matching how the parser itself is line-ending agnostic. */
function normalizeEol(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * The stable per-file blank-node namespace: the explicit `graph` id VERBATIM when given, else the FNV
 * hash of the file text with line endings normalized. Deterministic (same file -> same namespace, so
 * the same skolem eids) and content-namespaced (different content hashes differently -> their blank
 * nodes are kept apart, low-collision per `fnv1aHex`). Line-ending INVARIANT so LF vs CRLF of the same
 * graph fold identically. NOT random and NOT an encounter-order counter.
 */
export function resolveNamespace(text: string, graph?: string): string {
  const g = graph?.trim();
  return g !== undefined && g.length > 0 ? g : fnv1aHex(normalizeEol(text));
}

/** A blank-node label -> a STABLE, namespaced skolem eid (`_:<ns>.<label>`). The same file always yields
 *  the same eid; two files (namespaces) never collide. No `/` (so proj's namespace canonical rule
 *  treats the whole skolem as its own key). */
export function skolemizeBlank(label: string, ns: string): EID {
  return `_:${ns}.${label}`;
}

/** A term -> its eid: an IRI verbatim (IRIs are GLOBAL eids), a blank skolemized, a literal -> null (a
 *  literal is a prop VALUE, never a node). */
export function termToEid(term: RdfTerm, ns: string): EID | null {
  if (term.type === "iri") return term.value;
  if (term.type === "blank") return skolemizeBlank(term.label, ns);
  return null;
}

// --- semantic (mapping) validation -------------------------------------------------------------

/**
 * The SEMANTIC guard for one well-formed triple (SYNTAX is `parseNTriples`'s job). Returns an honest
 * reason string when the triple must be REFUSED (N5), else null. Untrusted external RDF data flows
 * here, so this is an integrity boundary:
 *   - a PREDICATE IRI whose DECODED form contains a SPACE is refused - a property IRI never legitimately
 *     needs one, and both datatype/lang sidecar keys begin with a space, so this closes the sidecar-cell
 *     collision (`<http://ex/age ^^datatype>` decoding to the `http://ex/age ^^datatype` key) at the root;
 *   - `owl:sameAs` is the ONLY sanctioned route onto the reserved `same_as` channel (checked FIRST);
 *   - any OTHER predicate whose verbatim edgeKind is a RESERVED kip kind (`same_as`, `not_same_as`,
 *     `documents`, `kip:same_as?`, `kip:conflict`) is refused - external data cannot forge an identity
 *     join, inject a `not_same_as` veto (proj surfaces `kip:conflict`), or impersonate a link/candidate;
 *   - an `rdf:type` whose object IRI is a reserved kip kind is refused - it would stamp the subject
 *     node's `kind` (or a type edge) with a reserved kind (a `kip:conflict` node-kind forge).
 * PURE (a function of the triple's own bytes); it reads no ns and no state.
 */
export function mappingErrorFor(t: NTriple): string | null {
  if (t.predicate.includes(" ")) {
    return `predicate IRI decodes to contain a space ("${t.predicate}") - refused (a property IRI never needs one; reserved for datatype/lang sidecar keys)`;
  }
  if (t.predicate === OWL_SAME_AS_IRI) return null; // the sanctioned same_as route
  if (RESERVED_KINDS.has(t.predicate)) {
    return `predicate maps to the RESERVED kip kind "${t.predicate}" - refused from generic RDF data (identity/veto/link channel is not forgeable by external data)`;
  }
  if (t.predicate === RDF_TYPE_IRI && t.object.type === "iri" && RESERVED_KINDS.has(t.object.value)) {
    return `rdf:type object "${t.object.value}" is a RESERVED kip kind - refused (a node kind is not forgeable by external data)`;
  }
  return null;
}

// --- mapping: triples -> an AcquisitionResult --------------------------------------------------

/** The AcquisitionResult shape this reader returns (all facts land in `proposed`; `same_as` is authored
 *  as an ordinary reversible edge IN `proposed`, so proj's union-find folds it identically). */
export interface RdfAcquisition {
  proposed: AssertInput[];
  source: Provenance;
}

/** By-kind counts for honest `kip ingest-rdf` reporting (N5 - never reports authoring it did not do). */
export interface RdfCounts {
  triples: number;
  nodes: number;
  edges: number; // non-same_as edges (includes rdf:type edges)
  sameAs: number;
  props: number; // node-prop asserts (includes adjacent datatype/lang props)
  typed: number; // subjects whose kind was set from rdf:type
  skipped: number; // malformed lines skipped (only under --skip-malformed)
}

/** The combined pure result: the AcquisitionResult, by-kind counts, and any malformed-line reports. */
export interface RdfToAcquisitionResult {
  result: RdfAcquisition;
  counts: RdfCounts;
  parseErrors: NTripleParseError[];
}

const RDF_AUTHOR = "kip-rdf@1.0.0";
const RDF_REPLICA = "kip-rdf";

function rdfProvenance(sourceUri: string): Provenance {
  return {
    author: RDF_AUTHOR,
    signature: "",
    publicKeyFingerprint: "",
    signedFields: [],
    source: { uri: sourceUri },
  };
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function nodeAssert(eid: EID, nodeKind: string | undefined, prov: Provenance): AssertInput {
  return {
    type: "assert",
    v: 1,
    target: nodeKind === undefined ? { kind: "node", eid } : { kind: "node", eid, nodeKind },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: RDF_REPLICA,
    provenance: prov,
  };
}

function edgeAssert(edgeKind: string, from: EID, to: EID, prov: Provenance): AssertInput {
  return {
    type: "assert",
    v: 1,
    target: { kind: "edge", eid: edgeEid(edgeKind, from, to), edgeKind, from, to },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: RDF_REPLICA,
    provenance: prov,
  };
}

function propAssert(eid: EID, prop: string, value: string, prov: Provenance): AssertInput {
  return {
    type: "assert",
    v: 1,
    target: { kind: "node-prop", eid, prop },
    value,
    validFrom: 0,
    validTo: null,
    replicaId: RDF_REPLICA,
    provenance: prov,
  };
}

/**
 * Map a set of well-formed triples to a deterministic `AcquisitionResult` (PURE). `ns` is the resolved
 * blank-node namespace (see `resolveNamespace`). Mapping (ADR-B11/B11a):
 *   - `owl:sameAs` + IRI/blank object -> a reversible `same_as` edge (the D-67 headline).
 *   - `rdf:type` + IRI object -> sets the subject node's `kind` (deterministic MINIMUM type IRI when a
 *     resource has several) AND is recorded losslessly as an ordinary `rdf:type` edge (so no type is
 *     lost and each is queryable / retractable).
 *   - any OTHER predicate + IRI/blank object -> an edge with `edgeKind` = the predicate IRI VERBATIM.
 *   - any predicate + literal object -> a node prop keyed by the predicate IRI VERBATIM (value = the
 *     literal's lexical value); datatype/lang recorded as adjacent props (never dropped, N5).
 * Every referenced subject/object IRI/blank gets exactly ONE node-existence fact (kind from rdf:type if
 * any). Output `proposed` is sorted (nodes by eid, then edges by (edgeKind, from, to), then props by
 * (eid, key, value)) so the same file yields a byte-identical fact set + order.
 */
export function mapTriplesToAcquisition(
  triples: NTriple[],
  ns: string,
  sourceUri: string,
  skipped = 0,
): { result: RdfAcquisition; counts: RdfCounts } {
  const prov = rdfProvenance(sourceUri);

  const eids = new Set<EID>(); // every referenced subject/object node
  const typeObjectsBySubject = new Map<EID, Set<EID>>(); // subject -> its rdf:type object eids (IRI only)
  const edgeByEid = new Map<string, AssertInput>(); // content-derived dedupe (identical triple folds)
  const props: AssertInput[] = [];

  for (const t of triples) {
    // DEFENSIVE integrity guard (INV / N5): even if a caller passes an unvalidated triple directly, a
    // reserved-channel / space-predicate forge is NEVER authored. `rdfToAcquisition` (the authoring
    // path) already surfaces these as honest errors BEFORE mapping; this makes the mapper itself safe.
    if (mappingErrorFor(t) !== null) continue;

    const from = termToEid(t.subject, ns);
    if (from === null) continue; // unreachable (subject is never a literal), defensive
    eids.add(from);

    if (t.object.type === "literal") {
      // Literal object -> node prop on the subject (key = predicate IRI verbatim).
      props.push(propAssert(from, t.predicate, t.object.value, prov));
      if (t.object.datatype !== undefined && t.object.datatype !== XSD_STRING_IRI) {
        props.push(propAssert(from, `${t.predicate}${DATATYPE_PROP_SUFFIX}`, t.object.datatype, prov));
      }
      if (t.object.lang !== undefined) {
        props.push(propAssert(from, `${t.predicate}${LANG_PROP_SUFFIX}`, t.object.lang, prov));
      }
      continue;
    }

    // IRI or blank object -> an edge (the object becomes a node too).
    const to = termToEid(t.object, ns)!;
    eids.add(to);

    if (t.predicate === OWL_SAME_AS_IRI) {
      edgeByEid.set(edgeEid(SAME_AS_EDGE_KIND, from, to), edgeAssert(SAME_AS_EDGE_KIND, from, to, prov));
      continue;
    }

    if (t.predicate === RDF_TYPE_IRI && t.object.type === "iri") {
      let set = typeObjectsBySubject.get(from);
      if (!set) {
        set = new Set<EID>();
        typeObjectsBySubject.set(from, set);
      }
      set.add(to);
    }

    // rdf:type (and every other IRI/blank-object predicate) is ALSO an ordinary reversible edge whose
    // edgeKind is the predicate IRI verbatim - lossless and queryable.
    edgeByEid.set(edgeEid(t.predicate, from, to), edgeAssert(t.predicate, from, to, prov));
  }

  // Deterministic node kind = the MINIMUM rdf:type object IRI (byte order) for the subject, if any.
  const kindByEid = new Map<EID, string>();
  for (const [subject, typeSet] of typeObjectsBySubject) {
    let min: string | undefined;
    for (const ty of typeSet) if (min === undefined || ty < min) min = ty;
    if (min !== undefined) kindByEid.set(subject, min);
  }

  // (1) node existence facts, sorted by eid - one per distinct referenced node.
  const nodes: AssertInput[] = [...eids].sort(cmp).map((eid) => nodeAssert(eid, kindByEid.get(eid), prov));

  // (2) edges sorted by (edgeKind, from, to).
  const edges = [...edgeByEid.values()].sort((a, b) => {
    const ta = a.target as { edgeKind: string; from: EID; to: EID };
    const tb = b.target as { edgeKind: string; from: EID; to: EID };
    return cmp(ta.edgeKind, tb.edgeKind) || cmp(ta.from, tb.from) || cmp(ta.to, tb.to);
  });
  const sameAsCount = edges.filter((e) => (e.target as { edgeKind: string }).edgeKind === SAME_AS_EDGE_KIND).length;

  // (3) props sorted by (eid, key, value).
  props.sort((a, b) => {
    const ta = a.target as { eid: EID; prop: string };
    const tb = b.target as { eid: EID; prop: string };
    return cmp(ta.eid, tb.eid) || cmp(ta.prop, tb.prop) || cmp(String(a.value), String(b.value));
  });

  const proposed: AssertInput[] = [...nodes, ...edges, ...props];
  const counts: RdfCounts = {
    triples: triples.length,
    nodes: nodes.length,
    edges: edges.length - sameAsCount,
    sameAs: sameAsCount,
    props: props.length,
    typed: kindByEid.size,
    skipped,
  };
  return { result: { proposed, source: prov }, counts };
}

/**
 * The end-to-end PURE reader: parse `text` (SYNTAX), validate each triple (SEMANTICS, `mappingErrorFor`
 * - reserved-channel / space-predicate forge refusal), then map only the SURVIVING triples to an
 * `AcquisitionResult`. TOTAL - never throws. `parseErrors` carries BOTH syntactic and mapping-refusal
 * errors, sorted by line, so the ONE strict/skip gate the CLI + dispatch already apply covers both.
 * When `skipMalformed` is false the caller MUST strict-fail on a non-empty `parseErrors` (the CLI
 * reports the line-numbered reasons and exits 1; the dispatch returns exitCode 1); this function only
 * builds the result from the valid triples and hands back every error, honestly surfaced either way.
 */
export function rdfToAcquisition(
  text: string,
  opts: { graph?: string; source?: string; skipMalformed?: boolean } = {},
): RdfToAcquisitionResult {
  const { triples, errors } = parseNTriples(text);
  // SEMANTIC validation: partition the syntactically-valid triples into authorable vs refused (N5).
  const allErrors: NTripleParseError[] = [...errors];
  const valid: NTriple[] = [];
  for (const t of triples) {
    const reason = mappingErrorFor(t);
    if (reason !== null) allErrors.push({ line: t.line, text: t.predicate, reason });
    else valid.push(t);
  }
  allErrors.sort((x, y) => x.line - y.line);

  const ns = resolveNamespace(text, opts.graph);
  const trimmedSource = opts.source?.trim();
  const sourceUri = trimmedSource !== undefined && trimmedSource.length > 0 ? trimmedSource : `rdf-ntriples://${ns}`;
  const { result, counts } = mapTriplesToAcquisition(valid, ns, sourceUri, opts.skipMalformed ? allErrors.length : 0);
  return { result, counts, parseErrors: allErrors };
}

/** The first few malformed-line reasons, formatted for a one-line dispatch/CLI error (N5). */
export function formatParseErrors(errors: NTripleParseError[], max = 5): string {
  const head = errors.slice(0, max).map((e) => `line ${e.line}: ${e.reason}`);
  const more = errors.length > max ? ` (+${errors.length - max} more)` : "";
  return `${errors.length} malformed line(s): ${head.join("; ")}${more}`;
}

// --- the INV-A1 dispatch seam ------------------------------------------------------------------

/** The `kip ingest-rdf` dispatch input threaded through `runAcquisition(manifest, input, {})`. */
export interface RdfIngestInput {
  ntriples: string;
  graph?: string;
  source?: string;
  skipMalformed?: boolean;
}

/**
 * The injectable dispatch seam `runAcquisition` calls - parses `invocation.input.ntriples` and returns
 * the mapped `AcquisitionResult`. It receives ONLY a `MicroagentInvocation` (never a `Repo`), so it
 * structurally cannot write the graph (INV-A1). Under the default strict policy a malformed file makes
 * the dispatch FAIL LOUD (non-zero exitCode with the verbatim reasons) so `runAcquisition` refuses with
 * `ERR_MALFORMED_INPUT` and authors nothing (N5); `skipMalformed` downgrades malformed lines to skips.
 */
export const rdfIngestDispatch: DispatchMicroagentFn = (invocation) => {
  const started = Date.now();
  const input = (invocation.input ?? {}) as Partial<RdfIngestInput>;
  const text = typeof input.ntriples === "string" ? input.ntriples : "";
  const { result, parseErrors } = rdfToAcquisition(text, {
    graph: input.graph,
    source: input.source,
    skipMalformed: input.skipMalformed,
  });
  if (parseErrors.length > 0 && !input.skipMalformed) {
    return Promise.resolve({
      exitCode: 1,
      output: { error: formatParseErrors(parseErrors) },
      elapsedMs: Date.now() - started,
    });
  }
  return Promise.resolve({ exitCode: 0, output: result, elapsedMs: Date.now() - started });
};
