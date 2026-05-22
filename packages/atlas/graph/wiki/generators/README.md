---
id: page:generators
nodeKind: Page
title: "Generators and Derived Artifacts"
slug: "generators"
articlePath: "wiki/generators/README.md"
documents: []
---
# Generators and Derived Artifacts

Generators turn graph queries into derived artifacts. Every page of prose, every TypeScript type, every OpenAPI document, every scaffolded code skeleton in the v6 ecosystem should be produced from graph data rather than hand-maintained copies.

## What lives in this directory

| Path | Purpose |
|---|---|
| [`00-generator-design.md`](./00-generator-design.md) | Implementation plan extending the schema derivation spec. |
| `templates/` | Deterministic templates consumed by generators. |
| [`tools/`](./tools/README.md) | `@v6/graph-tools`, the utility package and CLI for graph loading, querying, template rendering, and generator manifests. |

## Quick start

```bash
Push-Location graph/wiki/generators/tools; npm install; Pop-Location
node graph/wiki/generators/tools/src/cli.mjs stats --root graph
node graph/wiki/generators/tools/src/cli.mjs nodes --root graph --kind AgentProduct
node graph/wiki/generators/tools/src/cli.mjs render --root graph --template wiki/generators/templates/examples/layers.md.tmpl --kind Layer --stdout
node graph/wiki/generators/tools/src/cli.mjs generate --root graph --spec wiki/generators/templates/examples/layers.generator.yaml
```

## Planned generator outputs

The 10 illustrative outputs from `graph/schema/derivation-spec.md`:

1. Glossary
2. Stack documentation
3. Product card
4. Capability matrix
5. Hook taxonomy doc
6. Adapter scaffold
7. OpenAPI artifact
8. Per-package README
9. Stack diagram
10. Coverage check

Plus one added by the process design:

11. `Gap` markdown ↔ YAML sync, keeping `wiki/process/gaps/GAP-*.md` aligned with `graph/catalog-meta/gaps/*.yaml`.

## Acceptance criteria

- **Pure**: same graph in → byte-identical output.
- **Deterministic**: stable ordering on every collection.
- **Idempotent**: generator manifests avoid no-op rewrites.
- **Manifested**: generated files get a sibling `.manifest.json` with input node ids and a content hash.

See [`00-generator-design.md`](./00-generator-design.md) for the full implementation plan.
