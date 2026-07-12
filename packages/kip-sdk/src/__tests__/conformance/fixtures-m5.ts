/**
 * Shared, non-test fixture helpers for the M5 ("Active knowledge: contextual functionalities")
 * conformance suite — INV-A1, INV-A2, INV-A3, INV-A6, INV-A7, INV-A8, INV-A11
 * (see inv-a1.test.ts, inv-a2.test.ts, inv-a3.test.ts, inv-a6.test.ts, inv-a7.test.ts,
 * inv-a8.test.ts, inv-a11.test.ts).
 *
 * This file intentionally does NOT end in `.test.ts` (vitest.config.ts only includes
 * `src/**\/*.test.ts`), so it contributes no test cases of its own — per ADR-B7 (see fixtures.ts's
 * own doc comment), each invariant's own file is the sole home for its `describe('INV-<id>: ...', ...)`
 * block.
 *
 * Everything here is built exclusively against the public surface declared in
 * packages/kip-sdk/src/index.ts (the M0-M5 scaffold) — `KipRepo`, `assertFact`, and the
 * `MicroagentManifest`/`FunctionalityBinding`/`ContextualQuery`/`Segment`/`AnswerGraph` typed stubs
 * this round adds. No SDK method or field is invented beyond what index.ts declares.
 *
 * Node/edge existence facts are authored directly via `repo.assertFact` (the real, implemented M0
 * mint-then-ingest path) rather than via `putNode`/`putEdge` sugar (both still throw
 * `unimplemented`, per index.ts's own TODOs) — mirroring the same convention the M3-era
 * `round5-excise-final-hardening.test.ts` etc. already establish (a bare `{ author: ... }`
 * `provenance` object; the repo's own `mintFact` fills in `signature`/`publicKeyFingerprint`/
 * `signedFields` regardless of what the caller supplies for those, so only `author` is meaningful
 * here).
 */
import type {
  AsOf,
  ContextualQuery,
  EID,
  FunctionalityBinding,
  MicroagentManifest,
  NodeKind,
  Repo,
} from "../../index";

let manifestCounter = 0;

/**
 * A well-formed `MicroagentManifest` fixture (docs/31's normative shape) — every REQUIRED field
 * populated with an honest, minimal placeholder value; `overrides` lets a test vary exactly the
 * field(s) its own recipe cares about (e.g. `runtime.timeout`, `outputSchema`).
 */
export function makeManifest(overrides: Partial<MicroagentManifest> = {}): MicroagentManifest {
  manifestCounter += 1;
  const n = manifestCounter;
  return {
    name: overrides.name ?? `test-microagent-${n}`,
    version: overrides.version ?? "1.0.0",
    description: overrides.description ?? "A fixture microagent manifest for the M5 conformance suite.",
    inputSchema: overrides.inputSchema ?? { type: "object" },
    outputSchema: overrides.outputSchema ?? { type: "object" },
    isolation: overrides.isolation ?? "subprocess",
    runtime: {
      entrypoint: overrides.runtime?.entrypoint ?? "kip-fixture-microagent",
      timeout: overrides.runtime?.timeout ?? 30_000,
      ...overrides.runtime,
    },
    tags: overrides.tags,
    builtIn: overrides.builtIn,
  };
}

/**
 * A well-formed `FunctionalityBinding`-shaped OPTIONS object for the caller-supplied subset
 * `Repo.registerFunctionality`'s own `binding?` param picks (`weight`/`condition`/`requires`/
 * `relationClass`/`tags` — see that method's own doc comment, docs/40's "KNOWN GAP" note).
 */
export function makeBindingOptions(
  overrides: Pick<FunctionalityBinding, "weight" | "condition" | "requires" | "relationClass" | "tags"> = {},
): Pick<FunctionalityBinding, "weight" | "condition" | "requires" | "relationClass" | "tags"> {
  return { ...overrides };
}

/**
 * Asserts a bare node-existence fact for `eid`/`nodeKind` directly via `repo.assertFact` (the M0
 * mint-then-ingest path) — the sugar `putNode` throws `unimplemented` (index.ts), so every M5 fixture
 * that needs a seed/target instance in the graph goes through this instead, matching the established
 * M3-round convention (see this file's own top doc comment).
 */
export async function assertNode(repo: Repo, eid: EID, nodeKind: NodeKind, replicaId = "m5-fixture-replica"): Promise<void> {
  await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "node", eid, nodeKind },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId,
    provenance: fixtureProvenance(),
  });
}

/** Asserts a scalar node-prop fact for `eid`/`prop` — used to seed the projected `PropCell` values a
 *  `constraint`/`condition` `ConditionNode` reads (INV-A3). */
export async function assertNodeProp(
  repo: Repo,
  eid: EID,
  prop: string,
  value: string | number | boolean | null,
  replicaId = "m5-fixture-replica",
): Promise<void> {
  await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "node-prop", eid, prop },
    value,
    validFrom: 0,
    validTo: null,
    replicaId,
    provenance: fixtureProvenance(),
  });
}

/**
 * A fully-populated `Provenance` value for fixture facts (all fields REQUIRED by index.ts's own
 * `Provenance` interface). `mintFact` (index.ts) always overwrites `signature`/`publicKeyFingerprint`/
 * `signedFields` with the repo's own real keypair + the canonical envelope field list regardless of
 * what is supplied here (see `assertFact`'s own doc comment) — these placeholders exist purely to
 * satisfy the type, mirroring fixtures.ts's `makeWellFormedFact` convention for the M0/M1 suite.
 */
function fixtureProvenance(): import("../../index").Provenance {
  return {
    author: "m5-fixture",
    signature: "sig:m5-fixture-placeholder",
    publicKeyFingerprint: "m5-fixture-fpr",
    signedFields: [],
  };
}

/** A minimal, fully-populated `ContextualQuery` fixture (docs/31's normative shape). */
export function makeQuery(overrides: Partial<ContextualQuery> & Pick<ContextualQuery, "seed" | "target">): ContextualQuery {
  return {
    asOf: {} as AsOf,
    ...overrides,
  };
}
