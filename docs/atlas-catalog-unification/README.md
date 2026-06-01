# Atlas Catalog Unification

The catalog runtime has been unified into `@a5c-ai/atlas` as the
`@a5c-ai/atlas/catalog` subpath export. Only the atlas workspace owns catalog
source, build, package metadata, and CI coverage.

## Current State

| Surface | Location | Purpose |
|---------|----------|---------|
| `@a5c-ai/atlas` | `packages/atlas/` | Graph schema, indexer, YAML loader, CLI, webui |
| `@a5c-ai/atlas/catalog` | `packages/atlas/src/catalog/` | Agent discovery, capability metadata, SDK integration |

## Import Guidance

Runtime consumers should import catalog APIs from `@a5c-ai/atlas/catalog`.
Package manifests should depend on `@a5c-ai/atlas` because the catalog API is a
subpath export of that package.

```ts
import {
  getCatalogDiscoverySnapshot,
  getFallbackHarnessMetadata,
  listPluginTargetDescriptors,
} from "@a5c-ai/atlas/catalog";
```

## Build And Test

The catalog surface is validated as part of atlas and the downstream contract
matrix:

```bash
npm run build --workspace=@a5c-ai/atlas
npm run test:atlas-catalog-contracts
```

The final migration state keeps catalog source, tests, generated discovery
snapshot, package exports, docs, and CI metadata under atlas.
