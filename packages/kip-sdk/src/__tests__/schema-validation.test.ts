/**
 * schema-validation.test.ts — SCHEMA SLICE 1 (docs/21 §3): declare typed node kinds as VERSIONED
 * ontology FACTS (`registerSchema`/`getSchema`), and have `proj` VALIDATE nodes of a declared kind,
 * surfacing a violation as a `kip:schema-violation` QUARANTINE on `NodeView.schemaViolations` — NEVER
 * a write-time reject.
 *
 * The load-bearing rules under test (docs/21 §3):
 *  - Schema is stored AS FACTS (versioned, as-of-queryable) — `registerSchema` authors one signed
 *    `{ kind:"schema", ontologyRef:"kip:node-kind/<kind>" }` fact; `getSchema` reads it back as-of.
 *  - Schema is applied in `proj`, NOT at write time. A signature is the sole membership gate, so a
 *    schema-violating assert is ADMITTED normally (no throw) and the violation surfaces at read.
 *  - A conforming node projects normally (no `schemaViolations`); a non-conforming node is NEVER
 *    dropped and no value is invented (N5) — the violation is surfaced, queryable.
 *  - OPT-IN / non-breaking: a node whose kind has NO declared schema is validated against nothing.
 *  - Grow-only: declaring a schema LATER re-projects existing nodes on the next read.
 *  - Deterministic: identical facts in different authoring orders ⇒ identical violations.
 *
 * DEFERRED (later slices, explicitly NOT under test here): EdgeKindDef validation, cardinality/inverse,
 * per-kind cellReducers, versioned upcasters / migration (Slice 1 validates against the CURRENTLY-
 * declared def, not per-fact-version upcasters), and a reusable importable schema library.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import type { NodeKindDef } from "../index";

const prov = { author: "schema-test" };

// A fixed, injected clock so a declared schema gets a real (monotonic) validFrom = 1000 — an `asOf`
// with validTime < 1000 is therefore BEFORE the declaration (proving as-of-queryability), while node
// facts authored via putNode default to validFrom 0 (always present).
const SCHEMA_CLOCK = () => 1000;

const PERSON_DEF: NodeKindDef = {
  kind: "person",
  version: 1,
  props: [
    { name: "name", type: "string", required: true },
    { name: "age", type: "number" },
  ],
};

function repo(replicaId: string): KipRepo {
  return new KipRepo({ replicaId, clock: SCHEMA_CLOCK });
}

describe("SCHEMA SLICE 1 — declaration is a versioned, as-of-queryable fact", () => {
  it("registerSchema authors a signed schema fact and getSchema reads it back", async () => {
    const r = repo("schema-decl-1");
    const factId = await r.registerSchema(PERSON_DEF);
    expect(typeof factId).toBe("string");
    expect(factId.length).toBeGreaterThan(0);

    const got = await r.getSchema("person");
    expect(got).toEqual(PERSON_DEF);
  });

  it("getSchema returns null for an undeclared kind", async () => {
    const r = repo("schema-decl-2");
    await r.registerSchema(PERSON_DEF);
    expect(await r.getSchema("widget")).toBeNull();
  });

  it("getSchema is as-of-queryable: a schema declared at t2 is absent at an asOf before t2", async () => {
    const r = repo("schema-decl-3"); // schema authored at validFrom 1000
    await r.registerSchema(PERSON_DEF);

    expect(await r.getSchema("person", { validTime: 500 })).toBeNull(); // BEFORE the declaration
    expect(await r.getSchema("person", { validTime: 1000 })).toEqual(PERSON_DEF); // at/after
    expect(await r.getSchema("person")).toEqual(PERSON_DEF); // live
  });
});

describe("SCHEMA SLICE 1 — proj validates declared kinds (surfaced as a quarantine, never a drop)", () => {
  it("a CONFORMING node projects normally with NO violation", async () => {
    const r = repo("schema-conform");
    await r.registerSchema(PERSON_DEF);
    await r.putNode({ eid: "person/ok", kind: "person", props: { name: "Tal", age: 42 } });

    const v = await r.getNode("person/ok");
    expect(v).not.toBeNull();
    expect(v?.kind).toBe("person");
    expect(v?.schemaViolations).toBeUndefined();
  });

  it("a MISSING required prop surfaces kip:schema-violation and the node/prop is NOT dropped", async () => {
    const r = repo("schema-missing");
    await r.registerSchema(PERSON_DEF);
    await r.putNode({ eid: "person/nomame", kind: "person", props: { age: 5 } }); // no `name`

    const v = await r.getNode("person/nomame");
    expect(v).not.toBeNull();
    expect(v?.schemaViolations).toBeDefined();
    expect(v?.schemaViolations?.some((m) => m.startsWith("kip:schema-violation") && m.includes('required prop "name"'))).toBe(
      true,
    );
    // NOT dropped: the node keeps its real kind and its other (present) prop cell is fully readable.
    expect(v?.kind).toBe("person");
    expect(v?.props.age).toBeDefined();
    const ageSeg = v?.props.age.segments.find((s) => s.kind === "value");
    expect(ageSeg && ageSeg.kind === "value" ? ageSeg.value : undefined).toBe(5);
  });

  it("a WRONG-TYPED prop surfaces kip:schema-violation and NEVER invents/overwrites the value", async () => {
    const r = repo("schema-badtype");
    await r.registerSchema(PERSON_DEF);
    // name declared string but asserted number; age declared number but asserted string.
    await r.putNode({ eid: "person/bad", kind: "person", props: { name: 123, age: "old" } });

    const v = await r.getNode("person/bad");
    expect(v?.schemaViolations).toBeDefined();
    expect(v?.schemaViolations?.some((m) => m.includes('prop "name"') && m.includes("expected string"))).toBe(true);
    expect(v?.schemaViolations?.some((m) => m.includes('prop "age"') && m.includes("expected number"))).toBe(true);
    // The offending values are surfaced UNCHANGED — not coerced, not invented (N5).
    const nameSeg = v?.props.name.segments.find((s) => s.kind === "value");
    expect(nameSeg && nameSeg.kind === "value" ? nameSeg.value : undefined).toBe(123);
  });

  it("the violation is surfaced on getNodeRaw too (same proj-time quarantine)", async () => {
    const r = repo("schema-raw");
    await r.registerSchema(PERSON_DEF);
    await r.putNode({ eid: "person/raw", kind: "person", props: { age: 9 } });

    const v = await r.getNodeRaw("person/raw");
    expect(v?.schemaViolations?.some((m) => m.includes('required prop "name"'))).toBe(true);
  });
});

describe("SCHEMA SLICE 1 — OPT-IN / non-breaking", () => {
  it("a node of an UNDECLARED kind is projected exactly as before (no violation, no field)", async () => {
    const r = repo("schema-optin");
    await r.registerSchema(PERSON_DEF); // only `person` is declared
    await r.putNode({ eid: "widget/1", kind: "widget", props: { foo: 1 } });

    const v = await r.getNode("widget/1");
    expect(v).not.toBeNull();
    expect(v?.kind).toBe("widget");
    expect(v?.schemaViolations).toBeUndefined();
  });

  it("with NO schema declared at all, every node projects free-form (validated against nothing)", async () => {
    const r = repo("schema-none");
    await r.putNode({ eid: "person/free", kind: "person", props: { anything: true } });

    const v = await r.getNode("person/free");
    expect(v?.schemaViolations).toBeUndefined();
  });
});

describe("SCHEMA SLICE 1 — grow-only (a late schema re-projects existing nodes)", () => {
  it("asserting a node THEN declaring a schema it violates surfaces the violation on the next read", async () => {
    const r = repo("schema-grow");
    await r.putNode({ eid: "person/late", kind: "person", props: { age: 7 } }); // no `name`, no schema yet

    const before = await r.getNode("person/late");
    expect(before?.schemaViolations).toBeUndefined();

    await r.registerSchema(PERSON_DEF); // person now REQUIRES name

    const after = await r.getNode("person/late");
    expect(after?.schemaViolations?.some((m) => m.includes('required prop "name"'))).toBe(true);
    // Still not dropped.
    expect(after?.kind).toBe("person");
  });
});

describe("SCHEMA SLICE 1 — determinism (authoring order does not change violations)", () => {
  it("identical facts in different authoring orders yield identical violations", async () => {
    const a = repo("schema-det-a");
    await a.putNode({ eid: "person/x", kind: "person", props: { age: 1 } });
    await a.registerSchema(PERSON_DEF);

    const b = repo("schema-det-b");
    await b.registerSchema(PERSON_DEF);
    await b.putNode({ eid: "person/x", kind: "person", props: { age: 1 } });

    const va = await a.getNode("person/x");
    const vb = await b.getNode("person/x");
    expect(va?.schemaViolations).toEqual(vb?.schemaViolations);
    expect(va?.schemaViolations).toBeDefined();
  });
});

describe("SCHEMA SLICE 1 — NEVER a write-time reject (CRDT convergence + N5)", () => {
  it("putNode of a schema-violating node returns normally (no throw)", async () => {
    const r = repo("schema-nothrow-put");
    await r.registerSchema(PERSON_DEF);
    const eid = await r.putNode({ eid: "person/nt", kind: "person", props: { age: 1 } }); // violates (no name)
    expect(eid).toBe("person/nt");
    // And it is genuinely admitted + readable (surfaced, not lost).
    const v = await r.getNode("person/nt");
    expect(v).not.toBeNull();
    expect(v?.schemaViolations?.length).toBeGreaterThan(0);
  });

  it("a direct assertFact that violates the schema returns a normal signed FactId", async () => {
    const r = repo("schema-nothrow-assert");
    await r.registerSchema(PERSON_DEF);
    await r.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid: "person/af", nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "schema-nothrow-assert",
      provenance: prov,
    });
    // A wrong-typed required prop — must be ADMITTED, not rejected.
    const res = await r.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node-prop", eid: "person/af", prop: "name" },
      value: 999, // declared string
      validFrom: 0,
      validTo: null,
      replicaId: "schema-nothrow-assert",
      provenance: prov,
    });
    expect(typeof res.id).toBe("string");
    expect(res.id.length).toBeGreaterThan(0);

    const v = await r.getNode("person/af");
    expect(v?.schemaViolations?.some((m) => m.includes('prop "name"') && m.includes("expected string"))).toBe(true);
  });
});

// ── round-2 convergence-critic hardening: lock the three hardest invariants the design leans on ──────
describe("SCHEMA SLICE 1 — round-2 hardening (edge cases the review flagged as unguarded)", () => {
  const prv = (s: string) => ({ author: "schema-test", signature: s, publicKeyFingerprint: "f", signedFields: [] });

  it("a required prop backed ONLY by a RETRACT (unknown segment) is 'missing' — no phantom read, node still readable", async () => {
    const r = repo("schema-retract");
    await r.registerSchema(PERSON_DEF);
    await r.putNode({ eid: "person/x", kind: "person", props: { name: "Tal", age: 42 } });
    // retract the required `name` prop → its cell is now an unknown/gap segment (no covering value).
    await r.retractFact({ type: "retract", v: 1, target: { kind: "node-prop", eid: "person/x", prop: "name" },
      validFrom: 0, validTo: null, replicaId: "schema-retract", provenance: prv("r-name") });
    const v = await r.getNode("person/x");
    expect(v).not.toBeNull();
    expect(v?.kind).toBe("person");                       // node NOT dropped
    expect(v?.props.age).toBeDefined();                    // the surviving real cell is still readable
    expect(v?.schemaViolations ?? []).toContain(`kip:schema-violation: required prop "name" is missing on kind "person"`);
  });

  it("a same_as alias validates against the CANONICAL node's kind — no duplicated/surprising violation", async () => {
    const r = repo("schema-alias");
    await r.registerSchema(PERSON_DEF);
    // canonical (lexicographically-min localId) is a conforming person; the alias declares a DIFFERENT kind.
    await r.putNode({ eid: "e/aaa", kind: "person", props: { name: "Tal", age: 42 } });
    await r.putNode({ eid: "e/bbb", kind: "widget", props: { color: "red" } });
    await r.assertFact({ type: "assert", v: 1, target: { kind: "edge", eid: "same_as:e/bbb=>e/aaa", edgeKind: "same_as", from: "e/bbb", to: "e/aaa" },
      value: true, validFrom: 0, validTo: null, replicaId: "schema-alias", provenance: prv("sa") });
    // getNode(alias) resolves to the canonical (conforming person) view — validated against person, not widget.
    const viaAlias = await r.getNode("e/bbb");
    expect(viaAlias?.kind).toBe("person");
    expect(viaAlias?.schemaViolations).toBeUndefined();    // conforming; the alias's own 'widget' kind does not leak a violation
  });

  it("re-registering a STRICTER schema — the orderKey-winner supersedes on every read (deterministic)", async () => {
    const r = repo("schema-redeclare");
    await r.registerSchema(PERSON_DEF); // name required, age optional
    await r.putNode({ eid: "person/y", kind: "person", props: { name: "Tal", age: 42 } });
    expect((await r.getNode("person/y"))?.schemaViolations).toBeUndefined(); // conforms to v1

    // a later, stricter declaration (authored after → higher orderKey) now also REQUIRES email.
    await r.registerSchema({ kind: "person", version: 2, props: [
      { name: "name", type: "string", required: true },
      { name: "age", type: "number" },
      { name: "email", type: "string", required: true },
    ] });
    expect((await r.getSchema("person"))?.version).toBe(2);                 // the later winner
    expect((await r.getNode("person/y"))?.schemaViolations ?? [])
      .toContain(`kip:schema-violation: required prop "email" is missing on kind "person"`); // re-validated against the winner
  });
});
