/**
 * schema-evolution.test.ts — SCHEMA SLICE 3 (docs/21 §3, ADR-B20): DECLARATIVE schema evolution.
 *
 * Two evolution primitives ship, both PURE and applied at proj-time (never a write gate, consistent
 * with Slices 1–2):
 *  - `NodeKindDef.renames`: a prop-rename LINEAGE. A value stored under an OLD name satisfies a
 *    requirement declared under the NEW name (the two names are the SAME slot), and every contributing
 *    value is type-checked against the CURRENT declared type. Chains resolve transitively; cycles are
 *    walked safely.
 *  - `NodeKindDef.deprecated`: a node still carrying a value under a deprecated name surfaces a
 *    `kip:schema-deprecated` ADVISORY on `NodeView.schemaDeprecations` — NEVER a `schemaViolations`
 *    entry, never a drop.
 *
 * Out of scope BY ARCHITECTURE (asserted here only as backward-compat / honesty): arbitrary per-fact-
 * version CODE upcasters — a pure convergent fold cannot execute signer-supplied transforms.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import type { NodeKindDef } from "../index";
import { parseNodeKindDef, resolvePropAliases } from "../proj";

const SCHEMA_CLOCK = () => 1000;
function repo(replicaId: string): KipRepo {
  return new KipRepo({ replicaId, clock: SCHEMA_CLOCK });
}

// Author a signed `same_as` / `not_same_as` edge (the Layer-2 identity channel) so a node can be pushed
// onto the disputed (`kip:conflict`) path — used to prove the disputed-node drop covers `schemaDeprecations`.
async function assertEdge(r: KipRepo, edgeKind: "same_as" | "not_same_as", a: string, b: string): Promise<void> {
  await r.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "edge", eid: `${edgeKind}/${a}=>${b}`, edgeKind, from: a, to: b },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: "evo",
    provenance: { author: "evo", signature: `sig:${edgeKind}:${a}~${b}`, publicKeyFingerprint: "evo-fpr", signedFields: [] },
  });
}

describe("SCHEMA SLICE 3 — prop rename lineage (old-named data satisfies a new-named requirement)", () => {
  it("a REQUIRED prop is satisfied by a value stored under its OLD (renamed) name", async () => {
    const r = repo("evo-rename-satisfy");
    // v2 renamed `email` → `emailAddress` and requires `emailAddress`.
    await r.registerSchema({
      kind: "user",
      version: 2,
      props: [{ name: "emailAddress", type: "string", required: true }],
      renames: [{ from: "email", to: "emailAddress" }],
    });
    // A node written under the OLD name — no migration of the stored data.
    await r.putNode({ eid: "user/old", kind: "user", props: { email: "a@b.com" } });

    const v = await r.getNode("user/old");
    expect(v?.schemaViolations).toBeUndefined(); // old name covers the new requirement
    expect(v?.props.email).toBeDefined(); // value is NOT rewritten — still under the old name
  });

  it("WITHOUT the rename, the same old-named node is a MISSING violation (proves the rename is load-bearing)", async () => {
    const r = repo("evo-rename-absent");
    await r.registerSchema({
      kind: "user",
      version: 2,
      props: [{ name: "emailAddress", type: "string", required: true }],
      // no renames
    });
    await r.putNode({ eid: "user/old", kind: "user", props: { email: "a@b.com" } });

    const v = await r.getNode("user/old");
    expect(v?.schemaViolations).toEqual([
      'kip:schema-violation: required prop "emailAddress" is missing on kind "user"',
    ]);
  });

  it("a value under an old name is TYPE-checked against the CURRENT declared type", async () => {
    const r = repo("evo-rename-typecheck");
    await r.registerSchema({
      kind: "user",
      version: 2,
      props: [{ name: "emailAddress", type: "string", required: true }],
      renames: [{ from: "email", to: "emailAddress" }],
    });
    // Old-named value with the WRONG type (number, not string).
    await r.putNode({ eid: "user/badtype", kind: "user", props: { email: 42 } });

    const v = await r.getNode("user/badtype");
    expect(v?.schemaViolations).toEqual([
      'kip:schema-violation: prop "emailAddress" on kind "user" expected string, got number',
    ]);
  });

  it("a TRANSITIVE rename chain (a→b→c) satisfies the final requirement from the oldest name", async () => {
    const r = repo("evo-rename-chain");
    await r.registerSchema({
      kind: "user",
      version: 3,
      props: [{ name: "primaryEmail", type: "string", required: true }],
      renames: [
        { from: "email", to: "contact" },
        { from: "contact", to: "primaryEmail" },
      ],
    });
    await r.putNode({ eid: "user/ancient", kind: "user", props: { email: "a@b.com" } }); // oldest name

    const v = await r.getNode("user/ancient");
    expect(v?.schemaViolations).toBeUndefined();
  });

  it("a value under the CURRENT name still works (rename is additive, not a redirect)", async () => {
    const r = repo("evo-rename-current");
    await r.registerSchema({
      kind: "user",
      version: 2,
      props: [{ name: "emailAddress", type: "string", required: true }],
      renames: [{ from: "email", to: "emailAddress" }],
    });
    await r.putNode({ eid: "user/new", kind: "user", props: { emailAddress: "a@b.com" } }); // current name

    const v = await r.getNode("user/new");
    expect(v?.schemaViolations).toBeUndefined();
  });

  it("renames round-trip through getSchema (they are persisted on the schema fact)", async () => {
    const r = repo("evo-rename-roundtrip");
    const def: NodeKindDef = {
      kind: "user",
      version: 2,
      props: [{ name: "emailAddress", type: "string", required: true }],
      renames: [{ from: "email", to: "emailAddress" }],
      deprecated: ["email"],
    };
    await r.registerSchema(def);
    expect(await r.getSchema("user")).toEqual(def);
  });
});

describe("SCHEMA SLICE 3 — prop deprecation (advisory, never a violation)", () => {
  it("a node carrying a DEPRECATED prop surfaces schemaDeprecations, NOT schemaViolations", async () => {
    const r = repo("evo-deprecate");
    await r.registerSchema({
      kind: "user",
      version: 2,
      props: [{ name: "emailAddress", type: "string", required: true }],
      renames: [{ from: "email", to: "emailAddress" }],
      deprecated: ["email"],
    });
    await r.putNode({ eid: "user/dep", kind: "user", props: { email: "a@b.com" } });

    const v = await r.getNode("user/dep");
    expect(v?.schemaViolations).toBeUndefined(); // rename satisfies the requirement — conforming
    expect(v?.schemaDeprecations).toEqual([
      'kip:schema-deprecated: prop "email" on kind "user" is deprecated (renamed to "emailAddress")',
    ]);
  });

  it("a deprecated prop WITHOUT a rename gets the plain (no-target) advisory", async () => {
    const r = repo("evo-deprecate-plain");
    await r.registerSchema({
      kind: "user",
      version: 1,
      props: [{ name: "name", type: "string" }],
      deprecated: ["legacyId"],
    });
    await r.putNode({ eid: "user/leg", kind: "user", props: { name: "Tal", legacyId: "x123" } });

    const v = await r.getNode("user/leg");
    expect(v?.schemaDeprecations).toEqual([
      'kip:schema-deprecated: prop "legacyId" on kind "user" is deprecated',
    ]);
  });

  it("a node NOT carrying the deprecated prop gets NO advisory (absent, undefined)", async () => {
    const r = repo("evo-deprecate-absent");
    await r.registerSchema({
      kind: "user",
      version: 1,
      props: [{ name: "name", type: "string" }],
      deprecated: ["legacyId"],
    });
    await r.putNode({ eid: "user/clean", kind: "user", props: { name: "Tal" } });

    const v = await r.getNode("user/clean");
    expect(v?.schemaDeprecations).toBeUndefined();
  });

  it("multiple deprecation advisories are SORTED (deterministic, content-only)", async () => {
    const r = repo("evo-deprecate-sort");
    await r.registerSchema({
      kind: "user",
      version: 1,
      props: [{ name: "name", type: "string" }],
      deprecated: ["zeta", "alpha"], // declared out of sorted order
    });
    await r.putNode({ eid: "user/multi", kind: "user", props: { name: "T", zeta: "z", alpha: "a" } });

    const v = await r.getNode("user/multi");
    expect(v?.schemaDeprecations).toEqual([
      'kip:schema-deprecated: prop "alpha" on kind "user" is deprecated',
      'kip:schema-deprecated: prop "zeta" on kind "user" is deprecated',
    ]);
  });

  it("a DUPLICATE deprecated name emits the advisory only ONCE (deduped)", async () => {
    const r = repo("evo-deprecate-dup");
    await r.registerSchema({
      kind: "user",
      version: 1,
      props: [{ name: "name", type: "string" }],
      deprecated: ["legacyId", "legacyId"], // duplicate
    });
    await r.putNode({ eid: "user/dup", kind: "user", props: { name: "T", legacyId: "x" } });

    const v = await r.getNode("user/dup");
    expect(v?.schemaDeprecations).toEqual([
      'kip:schema-deprecated: prop "legacyId" on kind "user" is deprecated',
    ]);
  });
});

describe("SCHEMA SLICE 3 — determinism & backward compatibility", () => {
  it("evolution is a pure function of the fact set — same facts, different authoring order ⇒ identical view", async () => {
    const def: NodeKindDef = {
      kind: "user",
      version: 2,
      props: [{ name: "emailAddress", type: "string", required: true }],
      renames: [{ from: "email", to: "emailAddress" }],
      deprecated: ["email"],
    };
    const a = repo("evo-order-a");
    await a.registerSchema(def);
    await a.putNode({ eid: "user/x", kind: "user", props: { email: "a@b.com" } });

    const b = repo("evo-order-b");
    await b.putNode({ eid: "user/x", kind: "user", props: { email: "a@b.com" } }); // node FIRST
    await b.registerSchema(def); // schema declared AFTER (grow-only re-projection)

    const va = await a.getNode("user/x");
    const vb = await b.getNode("user/x");
    expect(va?.schemaViolations).toEqual(vb?.schemaViolations);
    expect(va?.schemaDeprecations).toEqual(vb?.schemaDeprecations);
    expect(va?.schemaDeprecations).toEqual([
      'kip:schema-deprecated: prop "email" on kind "user" is deprecated (renamed to "emailAddress")',
    ]);
  });

  it("a Slice-1 def (no renames/deprecated) behaves EXACTLY as before — no new fields on the view", async () => {
    const r = repo("evo-backcompat");
    await r.registerSchema({
      kind: "person",
      version: 1,
      props: [{ name: "name", type: "string", required: true }],
    });
    await r.putNode({ eid: "person/ok", kind: "person", props: { name: "Tal" } });

    const v = await r.getNode("person/ok");
    expect(v?.schemaViolations).toBeUndefined();
    expect(v?.schemaDeprecations).toBeUndefined();
  });

  // MINOR-1 (convergence critic): a node pushed onto the disputed `kip:conflict` path must NOT leak a
  // stale `schemaDeprecations` computed against its pre-dispute kind (the disputed-node drop covers BOTH
  // schema fields). Without the drop this node would surface a deprecation advisory on a conflict view.
  it("a DISPUTED (kip:conflict) node drops schemaDeprecations, not just schemaViolations", async () => {
    const r = repo("evo-disputed");
    await r.registerSchema({
      kind: "user",
      version: 2,
      props: [{ name: "emailAddress", type: "string", required: true }],
      renames: [{ from: "email", to: "emailAddress" }],
      deprecated: ["email"],
    });
    await r.putNode({ eid: "u/a", kind: "user", props: { email: "a@b.com" } });
    await r.putNode({ eid: "u/b", kind: "user", props: { email: "b@b.com" } });
    // Sanity: undisputed, u/a carries the deprecation advisory.
    expect((await r.getNode("u/a"))?.schemaDeprecations).toEqual([
      'kip:schema-deprecated: prop "email" on kind "user" is deprecated (renamed to "emailAddress")',
    ]);
    // Merge then veto → both eids are disputed (kip:conflict).
    await assertEdge(r, "same_as", "u/a", "u/b");
    await assertEdge(r, "not_same_as", "u/a", "u/b");
    const v = await r.getNode("u/a");
    expect(v?.kind).toBe("kip:conflict");
    expect(v?.schemaViolations).toBeUndefined();
    expect(v?.schemaDeprecations).toBeUndefined(); // the drop covers the Slice-3 field too
  });

  // MINOR-2 (convergence critic): two old names renaming into ONE prop, each carrying a DIFFERENT wrong
  // type — the surfaced `got X` must be a deterministic function of the winning def's rename ARRAY order
  // (not local Set/ingest order). Pinned so a future reorder in resolvePropAliases can't silently diverge.
  it("multi-alias, differently-wrong-typed values surface a STABLE, deterministic type violation", async () => {
    const def: NodeKindDef = {
      kind: "acct",
      version: 3,
      props: [{ name: "e", type: "string", required: true }],
      renames: [
        { from: "email", to: "e" }, // first in array order
        { from: "alt", to: "e" },
      ],
    };
    // Same facts, two authoring orders ⇒ identical violation (message + which wrong type is named).
    const a = repo("evo-multi-a");
    await a.registerSchema(def);
    await a.putNode({ eid: "acct/x", kind: "acct", props: { email: 42, alt: true } });

    const b = repo("evo-multi-b");
    await b.putNode({ eid: "acct/x", kind: "acct", props: { alt: true, email: 42 } }); // props order flipped
    await b.registerSchema(def);

    const va = await a.getNode("acct/x");
    const vb = await b.getNode("acct/x");
    expect(va?.schemaViolations).toEqual(vb?.schemaViolations);
    expect(va?.schemaViolations).toEqual([
      'kip:schema-violation: prop "e" on kind "acct" expected string, got number',
    ]);
  });
});

describe("SCHEMA SLICE 3 — pure helpers (parse discipline + alias resolution)", () => {
  it("parseNodeKindDef round-trips well-formed renames/deprecated", () => {
    const def: NodeKindDef = {
      kind: "user",
      version: 2,
      props: [{ name: "emailAddress", type: "string", required: true }],
      renames: [{ from: "email", to: "emailAddress" }],
      deprecated: ["email"],
    };
    expect(parseNodeKindDef(JSON.stringify(def))).toEqual(def);
  });

  it("parseNodeKindDef DECLARES NOTHING (null) on a present-but-malformed renames (all-or-nothing)", () => {
    const bad = JSON.stringify({
      kind: "user",
      version: 1,
      props: [{ name: "a", type: "string" }],
      renames: [{ from: "", to: "b" }], // empty `from`
    });
    expect(parseNodeKindDef(bad)).toBeNull();
  });

  it("parseNodeKindDef DECLARES NOTHING (null) on a present-but-malformed deprecated", () => {
    const bad = JSON.stringify({
      kind: "user",
      version: 1,
      props: [{ name: "a", type: "string" }],
      deprecated: [123], // non-string
    });
    expect(parseNodeKindDef(bad)).toBeNull();
  });

  it("resolvePropAliases resolves a transitive chain and is CYCLE-SAFE (a→b, b→a terminates)", () => {
    const def: NodeKindDef = {
      kind: "x",
      version: 1,
      props: [{ name: "a", type: "string" }],
      renames: [
        { from: "a", to: "b" },
        { from: "b", to: "a" }, // cycle
      ],
    };
    // Must not loop; `a`'s aliases include the whole cycle.
    const aliases = resolvePropAliases(def);
    expect(aliases.get("a")).toEqual(new Set(["a", "b"]));
  });

  it("resolvePropAliases with NO renames maps each prop to just itself (Slice-1 parity)", () => {
    const def: NodeKindDef = {
      kind: "person",
      version: 1,
      props: [
        { name: "name", type: "string" },
        { name: "age", type: "number" },
      ],
    };
    const aliases = resolvePropAliases(def);
    expect(aliases.get("name")).toEqual(new Set(["name"]));
    expect(aliases.get("age")).toEqual(new Set(["age"]));
  });
});
