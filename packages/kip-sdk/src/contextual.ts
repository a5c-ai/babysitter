/**
 * contextual.ts — M5/T6.1-T6.7 supporting machinery for the §5b.1 active-knowledge surface
 * (docs/31-contextual-functionalities.md): `FunctionalityBinding` registration-fact encode/decode,
 * `ConditionNode` registration-time validation (ERR_INVALID_WEIGHT, INV-A7) and pure-proj evaluation
 * (claim-8 constraint / claim-12 condition, INV-A3), and a small deterministic topological-sort
 * helper for `Segment.deps` (INV-A2's cyclic-deps rejection). Kept in its own module (mirroring
 * hlc.ts/chain-sequencer.ts/well-formed.ts's own split-by-concern convention, ADR-B5) rather than
 * growing index.ts further — `index.ts`'s `KipRepo` is the only caller.
 *
 * `FunctionalityBinding.sourceKind`/`targetKind` (docs/31's normative shape) are NOT settable via
 * `Repo.registerFunctionality`'s own caller-supplied `binding?` param (docs/40's own "KNOWN GAP" note
 * only discusses weight/condition/requires entering that seam, not source/target kinds) — no schema/
 * ontology registration API (`NodeKindDef`/`EdgeKindDef`, docs/21 §2.2) is implemented at M5 either
 * (that is M1/M8 scope, see proj.ts's own T2.4 scope note). So THIS module never persists a
 * source/target kind at registration time; `index.ts`'s `compileContextualQuery` derives them at
 * COMPILE time instead (from the seed's own projected `NodeKind` and the query's requested `target`)
 * — see that method's own doc comment for the exact rule, including the one documented, narrowly-
 * scoped exception (a multi-hop chain that would have to loop back to the seed's own kind with no
 * declared schema to verify it is conservatively rejected as ill-typed, N5).
 */
import type {
  ConditionNode,
  EdgeKind,
  EID,
  Fact,
  FunctionalityBinding,
  NodeKindDef,
  NodeView,
  PropValue,
  SchemaLibrary,
} from "./index";
import { compareOrderKey, orderKey } from "./proj";

// ---------------------------------------------------------------------------
// Registration-fact encode/decode (T6.1) — a `FunctionalityBinding` registration is persisted as an
// ordinary `/ontology`-style schema-target fact (target.kind === "schema"), additive (N realizers per
// hop, never overwritten — docs/31: "registerFunctionality is therefore ADDITIVE").
// ---------------------------------------------------------------------------

export const FUNCTIONALITY_BINDING_ONTOLOGY_PREFIX = "functionality-binding/";
export const MICROAGENT_REGISTRATION_ONTOLOGY_PREFIX = "microagent-registration/";

/**
 * SCHEMA SLICE 1 (docs/21 §3): the `ontologyRef` prefix under which a declared `NodeKindDef` is
 * stored as a `{ kind:"schema" }` fact — `kip:node-kind/<kind>` (mirroring the existing
 * `kip:embedding-model/` schema-fact channel). One additive slot per node kind; `registerSchema`
 * re-declaring a kind authors another fact under the SAME ref, resolved by `orderKey`-max in `proj`
 * and `getSchema` (never overwritten in place).
 */
export const NODE_KIND_ONTOLOGY_PREFIX = "kip:node-kind/";

/** SCHEMA SLICE 1 (docs/21 §3): the `kip:node-kind/<kind>` ontology ref a `NodeKindDef` is stored
 *  under — the `kind` segment is percent-encoded with the SAME separator-collision guard every other
 *  ontology ref uses. */
export function ontologyRefForNodeKind(kind: string): string {
  return `${NODE_KIND_ONTOLOGY_PREFIX}${encodeRefSegment(kind)}`;
}

/**
 * SCHEMA SLICE 2 (docs/21 §3, ADR-B19): the `ontologyRef` prefix a `SchemaLibrary` MANIFEST is stored
 * under — `kip:schema-library/<name>` (a sibling channel to `kip:node-kind/`). One additive slot per
 * library name; re-registering a library authors another manifest fact under the SAME ref, resolved by
 * `orderKey`-max in `getSchemaLibrary`/`listSchemaLibraries` (never overwritten in place).
 */
export const SCHEMA_LIBRARY_ONTOLOGY_PREFIX = "kip:schema-library/";

/** SCHEMA SLICE 2 (docs/21 §3, ADR-B19): the `kip:schema-library/<name>` ontology ref a library manifest
 *  is stored under — the `name` segment is percent-encoded with the SAME separator-collision guard every
 *  other ontology ref uses, so a library-name reader can recover it by `encodeURIComponent(name)`. */
export function ontologyRefForSchemaLibrary(name: string): string {
  return `${SCHEMA_LIBRARY_ONTOLOGY_PREFIX}${encodeRefSegment(name)}`;
}

/**
 * SCHEMA SLICE 2 (docs/21 §3, ADR-B19): describe the FIRST way a `NodeKindDef` is malformed as a
 * library member (or `null` when well-formed). Stricter than proj's tolerant `parseNodeKindDef` (which
 * simply declares nothing on a bad payload) because this validates a CALLER-SUPPLIED argument up front —
 * a malformed member must throw before anything is authored (N5), not silently no-op. Pure; never throws.
 */
export function describeMalformedNodeKindDef(def: unknown): string | null {
  if (typeof def !== "object" || def === null) return "nodeKind must be an object";
  const d = def as Record<string, unknown>;
  if (typeof d.kind !== "string" || d.kind.length === 0) return "nodeKind.kind must be a non-empty string";
  const kindLabel = typeof d.kind === "string" ? d.kind : "<unknown>";
  if (typeof d.version !== "number" || !Number.isInteger(d.version)) {
    return `nodeKind "${kindLabel}" version must be an integer`;
  }
  if (!Array.isArray(d.props)) return `nodeKind "${kindLabel}" props must be an array`;
  const seenProps = new Set<string>();
  for (const p of d.props) {
    if (typeof p !== "object" || p === null) return `nodeKind "${kindLabel}" has a non-object prop`;
    const pp = p as Record<string, unknown>;
    if (typeof pp.name !== "string" || pp.name.length === 0) {
      return `nodeKind "${kindLabel}" has a prop with an empty/non-string name`;
    }
    if (pp.type !== "string" && pp.type !== "number" && pp.type !== "boolean") {
      return `nodeKind "${kindLabel}" prop "${pp.name}" type must be string|number|boolean`;
    }
    if (pp.required !== undefined && typeof pp.required !== "boolean") {
      return `nodeKind "${kindLabel}" prop "${pp.name}" required must be a boolean when present`;
    }
    if (seenProps.has(pp.name)) return `nodeKind "${kindLabel}" has a duplicate prop "${pp.name}"`;
    seenProps.add(pp.name);
  }
  return null;
}

/**
 * SCHEMA SLICE 2 (docs/21 §3, ADR-B19): describe the FIRST way a `SchemaLibrary` ARGUMENT is malformed
 * (or `null` when well-formed) — non-empty name, integer version, at least one nodeKind, each a
 * well-formed `NodeKindDef`, and NO duplicate kind names within the library. `registerSchemaLibrary`
 * throws `ERR_MALFORMED_INPUT` on a non-null result BEFORE authoring anything (N5). Pure; never throws.
 */
export function describeMalformedSchemaLibrary(lib: unknown): string | null {
  if (typeof lib !== "object" || lib === null) return "library must be an object";
  const l = lib as Record<string, unknown>;
  if (typeof l.name !== "string" || l.name.length === 0) return "name must be a non-empty string";
  if (typeof l.version !== "number" || !Number.isInteger(l.version)) return "version must be an integer";
  if (l.description !== undefined && typeof l.description !== "string") {
    return "description must be a string when present";
  }
  if (!Array.isArray(l.nodeKinds) || l.nodeKinds.length === 0) return "nodeKinds must be a non-empty array";
  const seenKinds = new Set<string>();
  for (const def of l.nodeKinds) {
    const malformation = describeMalformedNodeKindDef(def);
    if (malformation) return malformation;
    const kind = (def as NodeKindDef).kind;
    if (seenKinds.has(kind)) return `duplicate node kind "${kind}" within library`;
    seenKinds.add(kind);
  }
  return null;
}

/** SCHEMA SLICE 2 (docs/21 §3, ADR-B19): the manifest payload persisted as a `kip:schema-library/<name>`
 *  fact's `value` — the library's identity/version/description plus the NAMES of its member kinds (the
 *  full `NodeKindDef`s live in their own `kip:node-kind/<kind>` facts, read back on hydration). */
export interface PersistedSchemaLibraryManifest {
  name: string;
  version: number;
  kinds: string[];
  description?: string;
}

/** SCHEMA SLICE 2: build the manifest payload for a (already-validated) library — member-kind NAMES in
 *  the library's declared order. Pure. */
export function schemaLibraryManifestPayload(lib: SchemaLibrary): PersistedSchemaLibraryManifest {
  const payload: PersistedSchemaLibraryManifest = {
    name: lib.name,
    version: lib.version,
    kinds: lib.nodeKinds.map((d) => d.kind),
  };
  if (lib.description !== undefined) payload.description = lib.description;
  return payload;
}

/** SCHEMA SLICE 2: parse a `PersistedSchemaLibraryManifest` out of a manifest fact's JSON `value`, or
 *  `null` if the payload is not a well-formed manifest (never throws — a malformed manifest reads as
 *  absent, honoring N5). */
export function parseSchemaLibraryManifest(value: PropValue | undefined): PersistedSchemaLibraryManifest | null {
  if (typeof value !== "string") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.name !== "string" || typeof obj.version !== "number" || !Array.isArray(obj.kinds)) return null;
  const kinds: string[] = [];
  for (const k of obj.kinds) {
    if (typeof k !== "string") return null;
    kinds.push(k);
  }
  const out: PersistedSchemaLibraryManifest = { name: obj.name, version: obj.version, kinds };
  if (typeof obj.description === "string") out.description = obj.description;
  return out;
}

/**
 * ROUND-2 FIX (MINOR finding — separator-collision guard): each path SEGMENT is percent-encoded
 * (`encodeURIComponent`) before being joined with the literal `/` separator, so a `/` occurring
 * INSIDE `edgeKind`/`microagentName`/`version` itself can never be confused with a segment boundary.
 * Without this, `ontologyRefForBinding("a/b", "c", v)` and `ontologyRefForBinding("a", "b/c", v)`
 * would naively concatenate to the IDENTICAL string ("functionality-binding/a/b/c/<v>") — two
 * genuinely different registrations silently colliding on one ontology ref (and therefore one
 * "additive" slot instead of two). Percent-encoding escapes any `/` (and any other encodable
 * character) inside a segment, so two distinct `(edgeKind, name, version)` triples always encode to
 * distinct refs.
 */
function encodeRefSegment(segment: string): string {
  return encodeURIComponent(segment);
}

export function ontologyRefForBinding(edgeKind: EdgeKind, microagentName: string, version: string): string {
  return `${FUNCTIONALITY_BINDING_ONTOLOGY_PREFIX}${encodeRefSegment(edgeKind)}/${encodeRefSegment(microagentName)}/${encodeRefSegment(version)}`;
}

export function ontologyRefForManifest(name: string, version: string): string {
  return `${MICROAGENT_REGISTRATION_ONTOLOGY_PREFIX}${encodeRefSegment(name)}/${encodeRefSegment(version)}`;
}

/**
 * ROUND-4 FIX (CRITICAL finding, the SAME bug class as `ontologyRefForBinding`'s round-2 fix above,
 * now closed COMPLETELY rather than patched at one more corner): `executeSegment` (index.ts) derives
 * each step's materialized EID from `(step.edgeKind, producer, step.microagentName, step.version)`.
 * Round 2 percent-encoded ONLY the realizer suffix (`microagentName`/`version`); round 3's own fix
 * for the (edgeKind, producer) collision dimension repeated that same mistake — it left `edgeKind`
 * and `producer` RAW-CONCATENATED with the SAME unescaped `/` separator used between every other
 * segment. Since an `EID` is itself `<tenant>/<namespaceId>/<localId>` (docs/21 §3.6 — CONTAINS a
 * literal `/` by design) and `producer` for step i>0 IS the prior step's own materialized EID (which,
 * once a chain is 2+ hops, already contains unescaped `/` itself), two semantically DIFFERENT
 * `(edgeKind, producer)` pairs can raw-concatenate to a BYTE-IDENTICAL string — concretely,
 * `edgeKind="owns/dept", producer="acme"` and `edgeKind="owns", producer="dept/acme"` both produced
 * `derived:owns/dept/acme/<realizerId>`. This function is the ONE place `materializedEid` is now
 * built (index.ts's `executeSegment` calls it instead of inlining the join) so every segment —
 * `edgeKind`, `producer`, AND the realizer components — is percent-encoded before joining, exactly
 * mirroring `ontologyRefForBinding`'s own separator-collision guard above. Two distinct
 * `(edgeKind, producer, microagentName, version)` quadruples now always encode to distinct EIDs.
 */
export function materializedEidFor(edgeKind: EdgeKind, producer: EID, microagentName: string, version: string): EID {
  const realizerId = `${encodeRefSegment(microagentName)}@${encodeRefSegment(version)}`;
  return `derived:${encodeRefSegment(edgeKind)}/${encodeRefSegment(producer)}/${realizerId}`;
}

/**
 * ROUND-4 FIX (companion to `materializedEidFor` above): the `derived_from` edge EID
 * (`derived_from:<producer>-><materializedEid>`) joins two ARBITRARY-content strings with a literal
 * `->` separator. `materializedEid` is always built by `materializedEidFor` above (so it can never
 * itself contain a literal `->` — `encodeURIComponent` always escapes `>` to `%3E`, and the only
 * unencoded characters `materializedEidFor` introduces are the fixed `derived:`/`/`/`@` structural
 * tokens, none of which is `-` immediately followed by a raw `>`), but `producer` for step 0 is the
 * caller-supplied `ContextualQuery.seed` — an arbitrary, UNCONSTRAINED `EID` string (`EID` is `type
 * EID = string`, index.ts, no format enforced) that COULD itself contain a literal `->` substring.
 * Two different `(producer, materializedEid)` pairs could then raw-concatenate to the identical
 * `derived_from` edge EID (the classic delimiter-injection collision: `"X->Y", "Z"` and `"X",
 * "Y->Z"` both join to `"X->Y->Z"`). Rather than relying on an argument ("producer never contains
 * `->` in practice") this cannot actually verify for an arbitrary caller-supplied seed, both
 * components are percent-encoded before joining — the same conservative posture
 * `materializedEidFor`/`ontologyRefForBinding` already take.
 */
export function derivedFromEdgeEidFor(producer: EID, materializedEid: EID): EID {
  return `derived_from:${encodeRefSegment(producer)}->${encodeRefSegment(materializedEid)}`;
}

/**
 * The DETERMINISTIC edge EID `putEdge` mints when `EdgePut.eid` is omitted (docs/40 — "derived from
 * `(kind, from, to)` when omitted"). Every component is percent-encoded before joining with the fixed
 * `:`/`->` structural tokens, so no two distinct `(kind, from, to)` triples can collide on one edge
 * EID — the identical separator-collision posture `materializedEidFor`/`derivedFromEdgeEidFor` take.
 * Same triple ⇒ same EID on every replica (so a repeated `putEdge` folds onto the same edge cell,
 * INV-11), which is exactly the convergence property a deterministic derivation must have.
 */
export function edgeEidFor(kind: EdgeKind, from: EID, to: EID): EID {
  return `${encodeRefSegment(kind)}:${encodeRefSegment(from)}->${encodeRefSegment(to)}`;
}

/** The JSON shape persisted as a functionality-binding fact's `value` — every field
 * `Repo.registerFunctionality`'s caller-supplied `binding?` param (docs/40) can carry, plus the
 * `(edgeKind, microagentName, version)` registration key itself. */
export interface PersistedBindingPayload {
  edgeKind: EdgeKind;
  microagentName: string;
  version: string;
  weight?: number;
  condition?: ConditionNode;
  /** MAJOR FIX (round-2 finding #3): the claim-8 `constraint` facet — previously entirely absent
   *  from this payload (and from `registerFunctionality`'s own binding-options `Pick`), so
   *  `executeSegment`'s `if (step.constraint && ...)` guard could never fire for real. Persisted and
   *  parsed exactly like `condition` (both are `ConditionNode`s, both validated the same way at
   *  registration — see `findConditionNodeMalformation`). */
  constraint?: ConditionNode;
  requires?: EdgeKind[];
  relationClass?: FunctionalityBinding["relationClass"];
  tags?: string[];
}

/** The closed `FunctionalityBinding.relationClass` enum (docs/31's normative shape) — used by
 *  `parseBindingFact` to reject a foreign/corrupted value rather than casting it through unchecked. */
const RELATION_CLASSES: ReadonlySet<string> = new Set([
  "social",
  "characterizing",
  "ownership",
  "property",
  "identifying",
]);

export function serializeBindingPayload(payload: PersistedBindingPayload): string {
  return JSON.stringify(payload);
}

/** A registered binding, decoded from its persisted fact plus the ORIGINATING `Fact` (kept so
 * `sortBindingRecords` can apply the real §3.4 `orderKey`/`factCID` tiebreak, never a registration-
 * call-order-dependent pick, INV-A2/INV-A7). */
export interface RegisteredBindingRecord extends PersistedBindingPayload {
  sourceFact: Fact;
}

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

const CONDITION_KINDS: ReadonlySet<string> = new Set(["range", "cmp", "all", "any"]);
const CMP_OPS: ReadonlySet<string> = new Set(["=", ">", "<", ">=", "<="]);

/** Structural (never thrown) guard for a decoded `PropValue` — the same closed union
 *  `evaluateCondition`'s own leaves read (`string | number | boolean | null | BlobRef`). */
function isPropValueShape(v: unknown): v is PropValue {
  if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") return true;
  return isPlainRecord(v) && typeof v.blob === "string";
}

/**
 * MINOR FIX (round 3): a real structural guard for a decoded `ConditionNode`, mirroring the
 * `requires`/`tags` pattern this file already established (round 2) — `parseBindingFact` previously
 * cast `parsed.condition`/`parsed.constraint` straight through via `as ConditionNode` with NO shape
 * check at all, so a foreign/corrupted payload (a fact this replica didn't itself mint via
 * `registerFunctionality`, or a future schema version whose `ConditionNode` shape this replica
 * doesn't recognize) would flow into `evaluateCondition` as if it were trustworthy declared data.
 * Returns `undefined` (never throws — this is a pure decode over already-admitted facts, N5) for
 * anything that isn't a recognized `ConditionNode` shape; recurses through `all`/`any` composites so
 * a malformed child anywhere invalidates the whole node rather than silently passing a partially-
 * checked tree through.
 */
function parseConditionNodeShape(v: unknown): ConditionNode | undefined {
  if (!isPlainRecord(v) || typeof v.kind !== "string" || !CONDITION_KINDS.has(v.kind)) return undefined;
  switch (v.kind) {
    case "range": {
      if (typeof v.prop !== "string") return undefined;
      if (v.min !== undefined && !isPropValueShape(v.min)) return undefined;
      if (v.max !== undefined && !isPropValueShape(v.max)) return undefined;
      return { kind: "range", prop: v.prop, min: v.min as PropValue | undefined, max: v.max as PropValue | undefined };
    }
    case "cmp": {
      if (typeof v.prop !== "string") return undefined;
      if (typeof v.op !== "string" || !CMP_OPS.has(v.op)) return undefined;
      if (!isPropValueShape(v.value)) return undefined;
      return { kind: "cmp", prop: v.prop, op: v.op as "=" | ">" | "<" | ">=" | "<=", value: v.value };
    }
    case "all":
    case "any": {
      if (!Array.isArray(v.of)) return undefined;
      const children: ConditionNode[] = [];
      for (const child of v.of) {
        const parsedChild = parseConditionNodeShape(child);
        if (!parsedChild) return undefined;
        children.push(parsedChild);
      }
      return { kind: v.kind, of: children };
    }
    default:
      return undefined;
  }
}

/** Parses `f` as a registered `FunctionalityBinding` fact, or `null` if it is not one (a foreign-
 * shaped `kind: "schema"` fact, or one whose `ontologyRef` doesn't carry the binding prefix — never
 * thrown, N5). */
export function parseBindingFact(f: Fact): RegisteredBindingRecord | null {
  if (f.target.kind !== "schema") return null;
  const ref = f.target.ontologyRef;
  if (typeof ref !== "string" || !ref.startsWith(FUNCTIONALITY_BINDING_ONTOLOGY_PREFIX)) return null;
  if (typeof f.value !== "string") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(f.value);
  } catch {
    return null;
  }
  if (!isPlainRecord(parsed)) return null;
  if (typeof parsed.edgeKind !== "string" || typeof parsed.microagentName !== "string" || typeof parsed.version !== "string") {
    return null;
  }
  // ROUND-2 FIX (MINOR finding — real validation instead of unchecked casts): `relationClass` is
  // ADVISORY (docs/31: "never gates fact membership or hop firing"), but a foreign/corrupted value
  // (a fact this replica didn't itself mint via `registerFunctionality`, or a future schema version
  // this replica doesn't understand) is still N5-worth rejecting from the closed enum rather than
  // silently casting it through as if it were a valid, meaningful classification.
  const relationClass =
    typeof parsed.relationClass === "string" && RELATION_CLASSES.has(parsed.relationClass)
      ? (parsed.relationClass as FunctionalityBinding["relationClass"])
      : undefined;
  // `requires` elements MUST each be a string EdgeKind — a mixed/foreign array (e.g. containing a
  // number or object) is NOT silently passed through; the whole `requires` list is dropped (treated
  // as absent, never a partially-filtered list that would silently drop just the bad entries and
  // change guard semantics) rather than trusting an unverified element shape.
  const requires =
    Array.isArray(parsed.requires) && parsed.requires.every((r) => typeof r === "string")
      ? (parsed.requires as EdgeKind[])
      : undefined;
  const tags = Array.isArray(parsed.tags) && parsed.tags.every((t) => typeof t === "string") ? (parsed.tags as string[]) : undefined;
  // MINOR FIX (round 3): `condition`/`constraint` now go through the SAME real structural guard
  // `requires`/`tags` already use (`parseConditionNodeShape`), never an unchecked `as ConditionNode`
  // cast — a foreign/corrupted shape is dropped (treated as absent) rather than trusted.
  const condition = parsed.condition === undefined ? undefined : parseConditionNodeShape(parsed.condition);
  const constraint = parsed.constraint === undefined ? undefined : parseConditionNodeShape(parsed.constraint);
  return {
    edgeKind: parsed.edgeKind,
    microagentName: parsed.microagentName,
    version: parsed.version,
    weight: typeof parsed.weight === "number" ? parsed.weight : undefined,
    condition,
    constraint,
    requires,
    relationClass,
    tags,
    sourceFact: f,
  };
}

/** Deterministic presentation order (docs/31: "ordered by `weight` (then the §3.4 `orderKey`/
 * `factCID` tiebreak)") — `weight` DESC, ties broken by the real `orderKey`, NEVER by registration/
 * ingest call order (INV-A2's "opposite registration order compiles byte-identical" recipe, INV-A7's
 * "never auto-collapse/hash-tiebreak" rule). Missing `weight` sorts last (treated as `-Infinity`),
 * mirroring `Segment.alternatives`' own doc comment. */
export function sortBindingRecords(records: RegisteredBindingRecord[]): RegisteredBindingRecord[] {
  records.sort((a, b) => {
    const wa = a.weight ?? Number.NEGATIVE_INFINITY;
    const wb = b.weight ?? Number.NEGATIVE_INFINITY;
    if (wa !== wb) return wb - wa;
    return compareOrderKey(orderKey(a.sourceFact), orderKey(b.sourceFact));
  });
  return records;
}

/**
 * Folds every currently-admitted, non-retracted functionality-binding fact into a
 * `edgeKind -> RegisteredBindingRecord[]` map, each list already sorted per `sortBindingRecords` — a
 * pure function of `facts` alone (INV-A2).
 *
 * ACCEPTED M5-ONLY RESIDUAL (MAJOR finding, round 3 — no action taken, documented per this task's own
 * "document as an accepted residual + pin the current behavior" instruction): this function (and
 * `findRegisteredManifest`, index.ts) treats EVERY signature-valid, well-formed functionality-binding/
 * microagent-registration fact in `facts` as an equally legitimate registration, regardless of WHICH
 * key signed it — there is no check that the signing key chains (INV-10, docs/50 §8.1) to the tenant
 * genesis `rootKeys`. Concretely: any replica that can mint a signature-valid fact at all (its OWN
 * self-generated Ed25519 identity — `KipRepo`'s bare constructor always generates one, ADR-B2) can
 * register a `FunctionalityBinding` that `compileContextualQuery`/`executeSegment` will happily
 * compile and dispatch, exactly as if a genesis-rooted operator had registered it.
 *
 * This is NOT special to contextual.ts: NO code path in this M0-M7-ish scaffold yet implements a
 * general author-HLC-keyed authority-chain check for ORDINARY fact admission (INV-10 is explicitly
 * M8 scope, docs/50 §8.1) — the only trust-scoped check that exists anywhere in this codebase today
 * is `trustedExciseKeys`/`isAuthorizedExcisionMarker` (proj.ts), and that is narrowly scoped to
 * excision authorization, not general schema/registration-fact legitimacy. Building a real fix here
 * would mean inventing an un-spec'd, M5-local authority-chain mini-implementation ahead of M8 —
 * forbidden by this round's own hard rules (no unspec'd machinery, no new fallback-shaped guessing).
 * `inv-a1.test.ts`'s "rogue registration is currently accepted" test (round 3) PINS this exact
 * behavior so a future change cannot silently widen it further without a failing test forcing a
 * conscious update — the real fix belongs to M8's authority-chain overlay (INV-10), tracked there.
 */
export function collectRegisteredBindings(facts: readonly Fact[]): Map<EdgeKind, RegisteredBindingRecord[]> {
  const map = new Map<EdgeKind, RegisteredBindingRecord[]>();
  for (const f of facts) {
    if (f.type === "retract") continue;
    const rec = parseBindingFact(f);
    if (!rec) continue;
    const arr = map.get(rec.edgeKind);
    if (arr) arr.push(rec);
    else map.set(rec.edgeKind, [rec]);
  }
  for (const arr of map.values()) sortBindingRecords(arr);
  return map;
}

// ---------------------------------------------------------------------------
// Registration-time validation (T6.1.2/INV-A7) — a NaN/±Infinity weight, or a `range` ConditionNode
// with neither `min` nor `max` (or a non-finite numeric leaf), is MALFORMED declared data and MUST be
// rejected at registration (ERR_INVALID_WEIGHT) — never a silent always-true gate or a NaN sort key
// (both are the same "silent default" hazard N5 forbids, docs/31).
// ---------------------------------------------------------------------------

export function isMalformedWeight(weight: number | undefined): boolean {
  return weight !== undefined && !Number.isFinite(weight);
}

function isMalformedNumericLeaf(v: PropValue | undefined): boolean {
  return typeof v === "number" && !Number.isFinite(v);
}

/** Returns a human-readable reason if `node` is MALFORMED per docs/31's own registration-time
 * checklist, else `null`. Recurses through `all`/`any` composites. */
export function findConditionNodeMalformation(node: ConditionNode): string | null {
  switch (node.kind) {
    case "range": {
      if (node.min === undefined && node.max === undefined) {
        return "a range ConditionNode declares neither min nor max";
      }
      if (isMalformedNumericLeaf(node.min)) return "range.min is NaN/±Infinity";
      if (isMalformedNumericLeaf(node.max)) return "range.max is NaN/±Infinity";
      return null;
    }
    case "cmp":
      return isMalformedNumericLeaf(node.value) ? "cmp.value is NaN/±Infinity" : null;
    case "all":
    case "any": {
      for (const child of node.of) {
        const bad = findConditionNodeMalformation(child);
        if (bad) return bad;
      }
      return null;
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// ConditionNode evaluation (T6.4.2/T6.4.3) — a PURE READ over a NodeView's projected `PropCell`s
// (claim-12 `condition` / claim-8 `constraint`, both use the identical evaluator, docs/31: "the
// outcome ... is identical for constraint-violation and pending-guard; only the recorded provenance
// differs"). An `unknown` PropCell propagates `unknown` — NEVER defaulted to satisfied OR violated
// (N5) — so the caller (index.ts's `executeSegment`) treats anything other than `"satisfied"` as
// "gate not met, stop the segment".
// ---------------------------------------------------------------------------

export type ConditionEvalResult = "satisfied" | "not-satisfied" | "unknown";

function readLiveProp(view: NodeView | null, prop: string): PropValue | "unknown" {
  if (!view) return "unknown";
  const cell = view.props[prop];
  if (!cell || cell.segments.length === 0) return "unknown";
  // The LIVE (no-`asOf`) reading of "right now" is always the tail segment — the same convention
  // proj.ts's `existsAtInstant`/`computeEdgeExistSegments` use for existence cells, applied here to a
  // prop cell instead (this module never imports proj.ts's INTERNAL helpers, which are not exported).
  const last = cell.segments[cell.segments.length - 1];
  return last.kind === "value" ? last.value : "unknown";
}

function compareValues(op: "=" | ">" | "<" | ">=" | "<=", a: PropValue, b: PropValue): boolean {
  if (typeof a === "number" && typeof b === "number") {
    switch (op) {
      case "=":
        return a === b;
      case ">":
        return a > b;
      case "<":
        return a < b;
      case ">=":
        return a >= b;
      case "<=":
        return a <= b;
    }
  }
  if (typeof a === "string" && typeof b === "string") {
    switch (op) {
      case "=":
        return a === b;
      case ">":
        return a > b;
      case "<":
        return a < b;
      case ">=":
        return a >= b;
      case "<=":
        return a <= b;
    }
  }
  // A non-numeric/non-string comparand pair (booleans, null, a BlobRef) can only ever soundly answer
  // strict equality — never a fabricated ordering.
  return op === "=" && a === b;
}

/** Evaluates `node` against `view`'s CURRENT (live) projected `PropCell`s. `view === null` (the
 * instance itself does not exist) evaluates every leaf as `unknown`, exactly like a missing cell. */
export function evaluateCondition(node: ConditionNode, view: NodeView | null): ConditionEvalResult {
  switch (node.kind) {
    case "range": {
      const v = readLiveProp(view, node.prop);
      if (v === "unknown") return "unknown";
      if (node.min !== undefined && !compareValues(">=", v, node.min)) return "not-satisfied";
      if (node.max !== undefined && !compareValues("<", v, node.max)) return "not-satisfied";
      return "satisfied";
    }
    case "cmp": {
      const v = readLiveProp(view, node.prop);
      if (v === "unknown") return "unknown";
      return compareValues(node.op, v, node.value) ? "satisfied" : "not-satisfied";
    }
    case "all": {
      let sawUnknown = false;
      for (const child of node.of) {
        const r = evaluateCondition(child, view);
        if (r === "not-satisfied") return "not-satisfied";
        if (r === "unknown") sawUnknown = true;
      }
      return sawUnknown ? "unknown" : "satisfied";
    }
    case "any": {
      let sawUnknown = false;
      for (const child of node.of) {
        const r = evaluateCondition(child, view);
        if (r === "satisfied") return "satisfied";
        if (r === "unknown") sawUnknown = true;
      }
      return sawUnknown ? "unknown" : "not-satisfied";
    }
    default:
      return "unknown";
  }
}

// ---------------------------------------------------------------------------
// Deterministic topological order over `Segment.deps` (T6.2.2/T6.2.3) — Kahn's algorithm, ties
// broken by ASCENDING `steps[]` index (docs/31: "topo order = steps[] index order" for the degenerate
// empty-deps case; "ties broken by ascending steps[] index" for the general DAG case). Returns `null`
// iff `deps` contains a cycle (no topological order exists) — the caller (index.ts's
// `compileContextualQuery`) turns that into `ERR_COMPILE_CYCLIC_DEPS` (INV-A2), never a silently
// truncated/partial order.
// ---------------------------------------------------------------------------

export function topologicalOrder(stepCount: number, deps: ReadonlyArray<readonly [number, number]>): number[] | null {
  const indeg = new Array(stepCount).fill(0) as number[];
  const adj: number[][] = Array.from({ length: stepCount }, () => []);
  for (const [producer, consumer] of deps) {
    adj[producer].push(consumer);
    indeg[consumer] += 1;
  }
  const remaining = new Set<number>(Array.from({ length: stepCount }, (_, i) => i));
  const order: number[] = [];
  while (remaining.size > 0) {
    let picked = -1;
    for (const i of [...remaining].sort((a, b) => a - b)) {
      if (indeg[i] === 0) {
        picked = i;
        break;
      }
    }
    if (picked === -1) return null; // cycle: no zero-indegree node remains among the unpicked set
    order.push(picked);
    remaining.delete(picked);
    for (const c of adj[picked]) indeg[c] -= 1;
  }
  return order;
}

// ---------------------------------------------------------------------------
// `MicroagentResult.output` vs `MicroagentManifest.outputSchema` validation (CRITICAL FIX #1,
// T6.3.2/INV-A3(b)) — docs/31's Phase 2 description: "dispatches the bound microagent, and
// VALIDATES MicroagentResult.output against the manifest outputSchema before minting anything."
//
// This is a MINIMAL, self-contained JSON-Schema-SUBSET validator, not a general-purpose JSON Schema
// engine (no external validator dependency is available — this round's own hard rule forbids adding
// a new runtime dependency, and no `ajv`-equivalent is already a dependency of this package). It
// understands exactly the vocabulary `outputSchema` fixtures in this SDK's own conformance suite
// need to express a genuine pass/fail signal (`type`, `enum`, `required`, `properties`, `items`) —
// enough to make INV-A3(b)'s "outputSchema-invalid output" a REAL, reachable failure rather than a
// vacuous always-pass stub. An unrecognized/unsupported schema shape is treated PERMISSIVELY (never
// rejecting output against a schema clause this validator doesn't understand) — this is a
// deliberately narrow, honestly-scoped subset, not a claim of full JSON Schema conformance.
// ---------------------------------------------------------------------------

function jsonSchemaTypeMatches(value: unknown, type: string): boolean {
  switch (type) {
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      // An unrecognized type keyword — permissive (documented scope limit above).
      return true;
  }
}

function deepEqualJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Validates `value` against `schema` per this module's own documented minimal subset (see the
 *  section doc comment above). `schema === undefined`/`null`/non-object ⇒ no constraint (permissive,
 *  never a fabricated failure for a schema this validator can't interpret at all). */
export function validateAgainstOutputSchema(value: unknown, schema: unknown): boolean {
  if (schema === undefined || schema === null || typeof schema !== "object" || Array.isArray(schema)) {
    return true;
  }
  const s = schema as Record<string, unknown>;

  if (Array.isArray(s.enum)) {
    if (!s.enum.some((candidate) => deepEqualJson(candidate, value))) return false;
  }

  if (typeof s.type === "string") {
    if (!jsonSchemaTypeMatches(value, s.type)) return false;
  } else if (Array.isArray(s.type)) {
    const types = s.type.filter((t): t is string => typeof t === "string");
    if (types.length > 0 && !types.some((t) => jsonSchemaTypeMatches(value, t))) return false;
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(s.required)) {
      for (const key of s.required) {
        if (typeof key === "string" && !(key in obj)) return false;
      }
    }
    if (isPlainRecord(s.properties)) {
      for (const [key, subSchema] of Object.entries(s.properties)) {
        if (key in obj && !validateAgainstOutputSchema(obj[key], subSchema)) return false;
      }
    }
  }

  if (Array.isArray(value) && s.items !== undefined) {
    for (const item of value) {
      if (!validateAgainstOutputSchema(item, s.items)) return false;
    }
  }

  return true;
}
