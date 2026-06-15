---
id: page:generators-00-generator-design
nodeKind: Page
title: "Generator Design"
slug: "generators/00-generator-design"
articlePath: "wiki/generators/00-generator-design.md"
documents: []
---
# Generator Design

> Concrete implementation plan for Phase 3. Extends `graph/schema/derivation-spec.md` with the runtime, query layer, template engine, and operational contracts the generators share.

## Language and runtime

- **Language**: TypeScript, compiled to JavaScript ahead of time (no `ts-node`).
- **Runtime**: Node.js LTS (v22.x at time of writing). Pinned via `.nvmrc` + `engines` in `tools/package.json`.
- **Module system**: ESM (`"type": "module"`).
- **Package manager**: npm. Lockfile committed.

TypeScript is chosen for two reasons. First, it lets us reuse the schema-derived types for the SDK (Phase 6) directly inside generator code — a generator that emits a TypeScript artifact is itself typed against the schema it reads. Second, the toolchain matches the rest of the babysitter monorepo, so generator outputs integrate with existing CI infrastructure without translation.

## Query layer

Generators do not load raw YAML; they query an in-memory graph. The graph is built once per CLI invocation by the loader in `tools/graph-load.ts`:

1. Walk `graph/schema/ontology-schema.yaml` to learn NodeKinds, EdgeKinds, attribute types, and invariants.
2. Walk `graph/schema/examples/**/*.yaml` and parse every record into a typed `Node` keyed by `id`.
3. Resolve every `ref<>` field, edge endpoint, and `evidenceSourceIds` list. Dangling references abort the load (this is the same check the Phase-1 validator stub runs).
4. Index by NodeKind, by attribute, and by edge (forward + reverse adjacency).

Query helpers exposed by `tools/query.ts`:

- `getByKind(kind)` → `Node[]` sorted by `id`.
- `getById(id)` → `Node | undefined`.
- `outgoing(nodeId, edgeKind?)` / `incoming(nodeId, edgeKind?)` → `Edge[]`.
- `traverse(startId, path)` where `path` is a list of edge-kind names — returns the set of terminal nodes (used for the wiki page-type queries described in `wiki/01-derivation-mapping.md`).
- `evidence(nodeId, attribute)` → `EvidenceSource[]` plus freshness metadata.

All helpers are pure functions over the loaded graph. They do **not** hit the filesystem.

## Template engine

**Handlebars** for markdown / OpenAPI / YAML / mermaid outputs. Handlebars strikes the right balance: powerful enough to express collection iteration and partials, small enough that templates remain reviewable. Custom helpers register at startup:

- `{{slug id}}` — turn a graph id into a slug.
- `{{trustBadge evidence}}` — render a `TrustLevel` badge.
- `{{freshness evidence}}` — emit a freshness indicator (green/yellow/red) based on the `EvidencePolicy` in force.

For TypeScript outputs we use `ts-morph` directly rather than templates — a structured AST is easier to keep deterministic across schema edits than string concatenation.

## I/O contract

Each generator is a Node module exporting:

```ts
export interface Generator {
  id: string;             // matches Generator.id in the graph
  consumes: { nodeKinds: string[]; edgeKinds: string[] };
  outputs: { path: string; format: OutputFormat }[];
  run(ctx: GenerateContext): Promise<GenerateResult>;
}
```

The CLI (`tools/cli.ts`) loads the generator registry, runs the requested generators, writes outputs to `<repo>/<path>` exactly as declared, and writes a sibling `<path>.manifest.json` with:

- `generatorId`
- `generatedAt` (only in the manifest, never in output content — outputs must remain byte-stable)
- `sourceCatalogVersion` (read from the graph)
- `inputs`: `{ nodeIds: [], edgeKinds: [] }` actually traversed
- `contentHash`: SHA-256 of the rendered output

## Idempotency and content-hashing

After each run the CLI compares the new content hash against the existing manifest. If equal, the file is not rewritten (preserves filesystem timestamps and avoids no-op git diffs). If unequal, the file is rewritten and the manifest is updated.

CI's "regenerate-on-merge" gate (Phase 5) runs every generator and fails the build if the working tree diff is non-empty *and* the change was not authored in the same PR. This is what enforces "prose drift is structurally impossible".

## Determinism rules

- Iterate collections in `id`-sorted order.
- Render dates only via `freshness` helper (which emits coarse-grained labels, not exact timestamps).
- Never embed paths absolute to a developer's checkout.
- Use `\n` line endings. UTF-8 without BOM.

## Failure modes

A generator MUST fail (non-zero exit, no partial writes) when:

- The graph load fails any invariant.
- A required NodeKind / EdgeKind it `consumes` is empty.
- A template references a missing helper or unresolved id.
- An output's content hash collides with another generator's output (catches accidentally double-owned files).

## Test surface (handed to Phase 5)

Each generator ships:

- A unit test against a hand-rolled in-memory graph fixture.
- An integration test against `graph/schema/examples/`.
- A snapshot test of its output under a frozen graph version.

See `qa/00-qa-architecture.md` for how these slot into the wider test pyramid.
