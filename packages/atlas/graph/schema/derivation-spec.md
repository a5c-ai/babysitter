# 06 — Derivation Spec

How docs and (Phase 4) code scaffolds are projected from the graph. Phase 1 does not build generators; this file specifies what they will do, the artifacts they will produce, and the contract every generator must satisfy.

## Generator concept

A `Generator` is itself a node in the graph (`NodeKind: Generator`, prefix `generator:`). Treating generators as graph entities means we can answer "which generators depend on this NodeKind?" before changing it.

A `Generator` declares:

| Attribute | Type | Required? | Notes |
|---|---|---|---|
| `id` | `id` | yes | `generator:<slug>` |
| `displayName` | `string` | yes | |
| `description` | `markdown` | yes | |
| `outputs` | `list<map>` | yes | each entry: `{path, format}` |
| `invariants` | `list<string>` | yes | output-side invariants the generator guarantees |
| `version` | `semver` | yes | generator version, independent of catalog version |

A `Generator` has outgoing edges:

- `consumes_node_kind` → `NodeKind` (one per NodeKind it reads)
- `consumes_edge_kind` → `EdgeKind` (one per EdgeKind it reads)
- `derives` → `DerivedArtifact` (one per concrete artifact produced)

A `DerivedArtifact` records the projection: `path`, `format`, `lastBuiltAt`, `inputHash`. CI rebuilds derived artifacts from the canonical graph; drift between checked-in artifact and recomputed artifact fails the build.

## Output artifact specs (illustrative)

The Phase 1 schema must be rich enough to derive each of the following. None are implemented yet; specs here describe inputs and outputs.

### Glossary doc

- **Inputs:** `Term`, `Definition`, `Synonym`, `TermKind`, plus `defined_in_context_of` and `synonym_of` edges.
- **Output:** `docs/glossary.md` — a single markdown file grouped by `TermKind`. Each entry shows canonical name, definition, synonyms (with their context), and links to referenced NodeKinds.
- **Invariants:** every `Term` in graph appears exactly once; every `Synonym` appears as a cross-reference under its primary term.

### Stack doc

- **Inputs:** `Layer`, `composed_of`, `realizes`.
- **Output:** `docs/stack.md` — one section per `Layer` (in declared order), with scope/responsibilities/examples/fit notes and composing implementations.
- **Invariants:** every `Layer` appears; layers are ordered by their `position` attribute.

### Product card

- **Inputs:** `AgentProduct`, `AgentVersion`, `supports` (→ `Capability`), `Channel`, install methods.
- **Output:** `docs/products/<slug>.md` — one card per product summarizing versions, capabilities, supported channels, install methods.
- **Invariants:** every `AgentProduct` has a card; every card links to its versions' capability rows.

### Capability matrix

- **Inputs:** `AgentVersion` × `Capability` via `supports` edges (with `versionRange` and `level`).
- **Output:** `docs/capability-matrix.md` — a markdown table, rows = capabilities, columns = agent versions, cells = level + version range.
- **Invariants:** every cell that has a `supports` edge is filled; missing cells render as blank, never as "not supported" without an explicit negative claim.

### Hook taxonomy doc

- **Inputs:** `HookSurface`, `HookFamily`, `emits_hook`, `belongs_to_family`.
- **Output:** `docs/hooks.md` — per-product hook table plus a canonical hook list grouped by `HookFamily`.
- **Invariants:** every `HookSurface` appears; every `HookFamily` is listed; every `emits_hook` edge produces a row.

### Adapter scaffold

- **Inputs:** `AgentVersion`, its capabilities, install methods, channel kinds.
- **Output:** `tools/wiki/generators/out/adapters/<agent-slug>.ts` — a TypeScript scaffold with imports, an interface declaration, and stubbed methods per capability.
- **Invariants:** scaffold compiles under the project's tsconfig; method names map deterministically to capability slugs.

### OpenAPI for tasks-mux backend

- **Inputs:** the tasks-mux schema subset of the catalog (NodeKinds prefixed `tasks-mux:`).
- **Output:** `tools/wiki/generators/out/openapi.yaml`.
- **Invariants:** every endpoint listed in the schema appears in the spec; every schema component is referenced by at least one endpoint.

### Per-package README

- **Inputs:** `ProcessDescriptor`, the role assigned to it, and its responsibilities.
- **Output:** `packages/<name>/README.md`.
- **Invariants:** README sections (purpose, responsibilities, public surface) are present in stable order.

### The 11-layer stack diagram

- **Inputs:** `Layer` ordered by `order` attribute.
- **Output:** `docs/stack-diagram.md` (mermaid) and `docs/stack-diagram.txt` (ASCII).
- **Invariants:** layer count matches graph; layer labels match `displayName`.

### Coverage check

- **Inputs:** `coverage-checklist.md` cross-references plus current graph contents.
- **Output:** `docs/coverage-gaps.md` — a list of legacy concepts not yet mapped to a schema element or out-of-scope tag.
- **Invariants:** every entry in `coverage-checklist.md` appears either as "covered" or "open"; counts match.

## Generator declaration template

```yaml
- id: generator:glossary
  displayName: Glossary generator
  description: Projects Term + Definition + Synonym + TermKind into a single markdown glossary.
  version: 0.1.0
  consumes:
    nodeKinds: [Term, Definition, Synonym, TermKind]
    edgeKinds: [defined_in_context_of, synonym_of, references]
  outputs:
    - path: docs/glossary.md
      format: markdown
  invariants:
    - every Term in graph appears in output
    - every Synonym appears with cross-reference
    - terms grouped by TermKind in declared TermKind order
```

## Derivation rules

- **Pure.** A generator is a pure function of the graph. Same graph → byte-identical output. CI re-runs every generator and diffs against the checked-in artifact.
- **Closed-world.** A generator does not invent facts. If an attribute is missing, the generator either produces a structural placeholder (with a TODO marker linked to the missing attribute) or fails — never fabricates a value.
- **Templated, not synthesized.** A generator may interpolate prose templates that reference graph values. It must not run an LLM to fill prose unless that LLM's output is itself an `EvidenceSource` with `trustLevel: synthetic` recorded in the graph.
- **Schema-driven escape hatch.** When a generator needs a new fact, the resolution is to extend the schema (or populate the graph), not to add template logic that synthesizes the fact.

## Cycle and ordering

Generators read the graph; they do not write back to it (with one exception: `DerivedArtifact` records, which are graph-managed metadata about generator output, not source-of-truth claims). This breaks any cycle by construction.

When multiple generators share inputs, build order is: topologically sort by `consumes_node_kind`/`consumes_edge_kind` against any generator that writes a `DerivedArtifact` consumed by another. In practice this graph is shallow.

## Where generators live (Phase 3)

Placeholder location: `tools/wiki/generators/`. Layout is TBD; the expected shape is one TypeScript module per generator, registered in `tools/wiki/generators/registry.ts`, invoked by `npm run generate` (build-all) or `npm run generate -- glossary` (build-one).

The Phase 3 deliverable adds:

- the `Generator` registry and runner
- pre-commit hooks that re-run affected generators
- CI parity check (re-run all, diff, fail on drift)
- a `--explain` flag that emits, for any output bytes, the source `(node, attribute, claim, evidence)` tuples that produced them
