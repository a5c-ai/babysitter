/**
 * schema-library.test.ts — SCHEMA SLICE 2 (docs/21 §3, ADR-B19): a REUSABLE, IMPORTABLE schema
 * LIBRARY — a named, versioned bundle of node kinds you define ONCE (a plain data value) and register
 * into ANY number of repos/tenants. This is a PACKAGING + VERSIONING layer ON TOP of Slice 1
 * (`registerSchema`/`getSchema` + proj-time validation); it changes NOTHING about how a kind is
 * validated. A library-registered kind is byte-identical to a directly-registered one (ONE authoring
 * path: `registerSchemaLibrary` reuses Slice 1's `registerSchema` for each member kind).
 *
 * The load-bearing rules under test:
 *  - `registerSchemaLibrary(lib)` authors ONE library-MANIFEST fact (`kip:schema-library/<name>`,
 *    carrying `{name, version, description?, kinds}`) PLUS each member kind via the SAME Slice-1
 *    `registerSchema` — all on the orchestrator-signed schema-fact channel (INV-A1). Returns all FactIds.
 *  - `getSchemaLibrary(name, asOf?)` reads back the orderKey-winning manifest, re-hydrated with the
 *    CURRENT winning `NodeKindDef` of each member kind (Slice-1 read path). `null` when absent.
 *  - `listSchemaLibraries(asOf?)` lists every installed manifest, sorted by name (deterministic).
 *  - A library is REUSABLE: the same `SchemaLibrary` const registered into two fresh repos validates a
 *    node identically (a portable data value, no network/filesystem).
 *  - As-of-queryable (manifest + kinds are facts): a library registered at t2 is absent at an asOf < t2.
 *  - Versioning is manifest+kind evolution-LITE (NOT per-fact-version upcasters): re-registering a
 *    HIGHER version supersedes the manifest (orderKey-winner) and re-registers its kinds, so a kind
 *    whose def gained a required prop makes proj re-validate existing nodes (grow-only).
 *  - Malformed library ARGUMENT (empty name, non-integer version, empty nodeKinds, duplicate kind
 *    names, a malformed NodeKindDef) throws a typed `ERR_MALFORMED_INPUT` up front — NOTHING authored
 *    (argument validation of the caller's value, NOT a write-time gate on facts).
 *
 * DEFERRED (Slice 3, explicitly NOT under test): per-fact-version upcasters / rename / deprecate /
 * migrate; EdgeKindDef inclusion beyond NodeKindDef; a bundled "standard" ontology library; cross-repo
 * network sync of a library.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import type { NodeKindDef, SchemaLibrary } from "../index";

// Fixed, injected clock so a registered library/kind gets a real (monotonic) validFrom = 1000 — an
// `asOf` with validTime < 1000 is therefore BEFORE the registration (proving as-of-queryability),
// while node facts authored via putNode default to validFrom 0 (always present).
const SCHEMA_CLOCK = () => 1000;

function repo(replicaId: string): KipRepo {
  return new KipRepo({ replicaId, clock: SCHEMA_CLOCK });
}

const PERSON_DEF: NodeKindDef = {
  kind: "person",
  version: 1,
  props: [
    { name: "name", type: "string", required: true },
    { name: "age", type: "number" },
  ],
};
const ORG_DEF: NodeKindDef = {
  kind: "org",
  version: 1,
  props: [{ name: "legalName", type: "string", required: true }],
};
const CONTACTS_LIB: SchemaLibrary = {
  name: "contacts",
  version: 1,
  description: "People and organizations",
  nodeKinds: [PERSON_DEF, ORG_DEF],
};

describe("SCHEMA SLICE 2 — registerSchemaLibrary authors a manifest + each kind; read back", () => {
  it("authors manifest + each kind and reads back via getSchemaLibrary / listSchemaLibraries", async () => {
    const r = repo("lib-1");
    const ids = await r.registerSchemaLibrary(CONTACTS_LIB);
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBe(3); // 1 manifest + 2 kinds
    for (const id of ids) {
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    }

    const got = await r.getSchemaLibrary("contacts");
    expect(got).not.toBeNull();
    expect(got?.name).toBe("contacts");
    expect(got?.version).toBe(1);
    expect(got?.description).toBe("People and organizations");
    // re-hydrated with the CURRENT winning NodeKindDef of each member kind (Slice-1 read path)
    expect(got?.nodeKinds).toEqual([PERSON_DEF, ORG_DEF]);

    const list = await r.listSchemaLibraries();
    expect(list).toEqual([{ name: "contacts", version: 1, kinds: ["person", "org"] }]);

    // each member kind is independently readable via the Slice-1 getSchema (no drift)
    expect(await r.getSchema("person")).toEqual(PERSON_DEF);
    expect(await r.getSchema("org")).toEqual(ORG_DEF);
  });

  it("getSchemaLibrary is null for an unknown library; listSchemaLibraries omits it", async () => {
    const r = repo("lib-null");
    await r.registerSchemaLibrary(CONTACTS_LIB);
    expect(await r.getSchemaLibrary("unknown")).toBeNull();
    expect((await r.listSchemaLibraries()).some((e) => e.name === "unknown")).toBe(false);
  });
});

describe("SCHEMA SLICE 2 — a library-registered kind is IDENTICAL to a directly-registered one", () => {
  it("getSchema(kind) is equal and a violating node surfaces the same kip:schema-violation", async () => {
    const viaLib = repo("lib-ident-a");
    await viaLib.registerSchemaLibrary(CONTACTS_LIB);
    const direct = repo("lib-ident-b");
    await direct.registerSchema(PERSON_DEF);

    expect(await viaLib.getSchema("person")).toEqual(await direct.getSchema("person"));
    expect(await viaLib.getSchema("person")).toEqual(PERSON_DEF);

    for (const r of [viaLib, direct]) {
      await r.putNode({ eid: "person/x", kind: "person", props: { age: 5 } }); // missing required name
      const v = await r.getNode("person/x");
      expect(
        v?.schemaViolations?.some((m) => m.startsWith("kip:schema-violation") && m.includes('required prop "name"')),
      ).toBe(true);
    }
  });
});

describe("SCHEMA SLICE 2 — reusability (a portable data value registered into many repos)", () => {
  it("the SAME SchemaLibrary registered into TWO fresh repos validates a node identically", async () => {
    const a = repo("reuse-a");
    const b = repo("reuse-b");
    await a.registerSchemaLibrary(CONTACTS_LIB);
    await b.registerSchemaLibrary(CONTACTS_LIB);

    for (const r of [a, b]) {
      await r.putNode({ eid: "org/1", kind: "org", props: {} }); // missing required legalName
    }
    const va = await a.getNode("org/1");
    const vb = await b.getNode("org/1");
    expect(va?.schemaViolations).toEqual(vb?.schemaViolations);
    expect(va?.schemaViolations?.some((m) => m.includes('required prop "legalName"'))).toBe(true);

    // and the manifests read back identically across the two repos
    expect(await a.getSchemaLibrary("contacts")).toEqual(await b.getSchemaLibrary("contacts"));
  });
});

describe("SCHEMA SLICE 2 — as-of-queryable (manifest + kinds are facts)", () => {
  it("a library registered at t2 is absent from getSchemaLibrary / listSchemaLibraries at an asOf before t2", async () => {
    const r = repo("lib-asof"); // registered at validFrom 1000
    await r.registerSchemaLibrary(CONTACTS_LIB);

    expect(await r.getSchemaLibrary("contacts", { validTime: 500 })).toBeNull();
    expect(await r.listSchemaLibraries({ validTime: 500 })).toEqual([]);

    expect((await r.getSchemaLibrary("contacts", { validTime: 1000 }))?.version).toBe(1);
    expect(await r.listSchemaLibraries({ validTime: 1000 })).toEqual([
      { name: "contacts", version: 1, kinds: ["person", "org"] },
    ]);
    expect((await r.getSchemaLibrary("contacts"))?.version).toBe(1); // live
  });
});

describe("SCHEMA SLICE 2 — versioning (evolution-lite: manifest + kind, NOT data migration)", () => {
  it("re-registering a HIGHER version supersedes the manifest and its stricter kind re-validates existing nodes", async () => {
    const r = repo("lib-version");
    await r.registerSchemaLibrary(CONTACTS_LIB); // person v1: name required, age optional
    await r.putNode({ eid: "person/y", kind: "person", props: { name: "Tal", age: 42 } });
    expect((await r.getNode("person/y"))?.schemaViolations).toBeUndefined(); // conforms to v1

    const CONTACTS_V2: SchemaLibrary = {
      name: "contacts",
      version: 2,
      nodeKinds: [
        {
          kind: "person",
          version: 2,
          props: [
            { name: "name", type: "string", required: true },
            { name: "age", type: "number" },
            { name: "email", type: "string", required: true }, // NEW required prop
          ],
        },
        ORG_DEF,
      ],
    };
    await r.registerSchemaLibrary(CONTACTS_V2);

    // manifest is the orderKey-winner (v2), and the member kind re-hydrates at its new winning def
    const got = await r.getSchemaLibrary("contacts");
    expect(got?.version).toBe(2);
    expect(got?.nodeKinds.find((d) => d.kind === "person")?.version).toBe(2);
    expect(await r.listSchemaLibraries()).toEqual([{ name: "contacts", version: 2, kinds: ["person", "org"] }]);

    // grow-only: the pre-existing node now surfaces the NEW violation on the next read
    expect((await r.getNode("person/y"))?.schemaViolations ?? []).toContain(
      `kip:schema-violation: required prop "email" is missing on kind "person"`,
    );
  });

  it("re-importing the SAME version is idempotent-ish (reads stay stable, one manifest entry)", async () => {
    const r = repo("lib-idem");
    await r.registerSchemaLibrary(CONTACTS_LIB);
    await r.registerSchemaLibrary(CONTACTS_LIB); // same content again
    expect(await r.listSchemaLibraries()).toEqual([{ name: "contacts", version: 1, kinds: ["person", "org"] }]);
    expect(await r.getSchemaLibrary("contacts")).toEqual({
      name: "contacts",
      version: 1,
      description: "People and organizations",
      nodeKinds: [PERSON_DEF, ORG_DEF],
    });
  });
});

describe("SCHEMA SLICE 2 — malformed library ARGUMENT throws and authors NOTHING", () => {
  const cases: Array<[string, unknown]> = [
    ["empty name", { name: "", version: 1, nodeKinds: [PERSON_DEF] }],
    ["non-integer version", { name: "x", version: 1.5, nodeKinds: [PERSON_DEF] }],
    ["empty nodeKinds", { name: "x", version: 1, nodeKinds: [] }],
    ["duplicate kind names", { name: "x", version: 1, nodeKinds: [PERSON_DEF, PERSON_DEF] }],
    [
      "malformed NodeKindDef",
      { name: "x", version: 1, nodeKinds: [{ kind: "bad", version: 1, props: [{ name: "p", type: "bogus" }] }] },
    ],
  ];
  for (const [label, lib] of cases) {
    it(`throws ERR_MALFORMED_INPUT (${label}) and writes no schema fact`, async () => {
      const r = repo(`malformed-${label.replace(/\s+/g, "-")}`);
      await expect(r.registerSchemaLibrary(lib as SchemaLibrary)).rejects.toMatchObject({ code: "ERR_MALFORMED_INPUT" });
      // nothing authored: no library manifest, no member kinds
      expect(await r.listSchemaLibraries()).toEqual([]);
      expect(await r.getSchemaLibrary("x")).toBeNull();
      expect(await r.getSchema("person")).toBeNull();
      expect(await r.getSchema("bad")).toBeNull();
    });
  }
});

describe("SCHEMA SLICE 2 — determinism (sorted list, order-independent reads)", () => {
  it("listSchemaLibraries is sorted by name and independent of registration order", async () => {
    const LIB_A: SchemaLibrary = { name: "alpha", version: 1, nodeKinds: [PERSON_DEF] };
    const LIB_Z: SchemaLibrary = { name: "zeta", version: 1, nodeKinds: [ORG_DEF] };

    const r1 = repo("det-1");
    await r1.registerSchemaLibrary(LIB_Z);
    await r1.registerSchemaLibrary(LIB_A);

    const r2 = repo("det-2");
    await r2.registerSchemaLibrary(LIB_A);
    await r2.registerSchemaLibrary(LIB_Z);

    const l1 = await r1.listSchemaLibraries();
    const l2 = await r2.listSchemaLibraries();
    expect(l1).toEqual(l2);
    expect(l1.map((e) => e.name)).toEqual(["alpha", "zeta"]);
  });
});

describe("SCHEMA SLICE 2 — opt-in / non-breaking", () => {
  it("a repo that registers no library is unaffected (empty list, free-form nodes)", async () => {
    const r = repo("no-lib");
    expect(await r.listSchemaLibraries()).toEqual([]);
    expect(await r.getSchemaLibrary("contacts")).toBeNull();
    await r.putNode({ eid: "person/free", kind: "person", props: { anything: true } });
    expect((await r.getNode("person/free"))?.schemaViolations).toBeUndefined();
  });
});

// ── round-2 critic hardening: manifest-decode robustness (N5) + convergence-primitive parity ─────────
describe("SCHEMA SLICE 2 — round-2 hardening (manifest robustness)", () => {
  const prv = (s: string) => ({ author: "schema-test", signature: s, publicKeyFingerprint: "f", signedFields: [] });

  it("a MALFORMED schema-library manifest fact degrades to null — getSchemaLibrary never throws or invents", async () => {
    const r = repo("lib-malformed-manifest");
    // author a schema-library-shaped fact DIRECTLY with a garbage payload (as a hostile/corrupt fact would).
    await r.assertFact({
      type: "assert", v: 1,
      target: { kind: "schema", ontologyRef: "kip:schema-library/junk" },
      value: "not-a-manifest{{{", validFrom: 0, validTo: null, replicaId: "lib-malformed-manifest",
      provenance: prv("junk"),
    });
    // parseSchemaLibraryManifest degrades to null → the read returns null, does not throw, invents nothing.
    await expect(r.getSchemaLibrary("junk")).resolves.toBeNull();
    // and it does not appear in the list (a manifest that can't parse isn't a library).
    expect((await r.listSchemaLibraries()).some((l) => l.name === "junk")).toBe(false);
  });

  it("getSchemaLibrary member-def hydration reflects the CURRENT winning def (parity with getSchema)", async () => {
    const r = repo("lib-hydrate-current");
    await r.registerSchemaLibrary({ name: "crm", version: 1, nodeKinds: [{ kind: "Person", version: 1, props: [{ name: "name", type: "string" }] }] });
    // re-declare the SAME kind directly with a stricter def (later orderKey-winner).
    await r.registerSchema({ kind: "Person", version: 2, props: [{ name: "name", type: "string", required: true }, { name: "email", type: "string", required: true }] });
    // the library's hydrated member def is the CURRENT winner (v2), identical to getSchema — one source of truth.
    const libDef = (await r.getSchemaLibrary("crm"))?.nodeKinds.find((k) => k.kind === "Person");
    expect(libDef).toEqual(await r.getSchema("Person"));
    expect(libDef?.version).toBe(2);
  });
});
