# @a5c-ai/agent-catalog

`@a5c-ai/agent-catalog` is a public package for the shared agent ontology, discovery catalog, packaged evidence shards, and graph-backed helper APIs used across the Babysitter toolchain.

The package is published through the central `publish.yml` and `publish-packages-from-tag.yml` workflows. `main` publishes production releases, and `staging` publishes prerelease builds with the `staging` dist-tag.

## What ships

The published workspace surface is defined by `package.json`:

- package root export: compiled runtime helpers from `dist/index.js` and `dist/index.d.ts`
- `./graph` and `./graph/*`: the source-of-truth ontology YAML under `graph/`
- `./evidence` and `./evidence/*`: generated evidence shards under `evidence/ontology-evidence/`
- `./docs` and `./docs/*`: shipped package docs under `docs/`
- packaged files: `README.md`, `dist/`, `graph/`, `docs/`, and `evidence/`

Anything outside that list is maintained in the repo only and is not part of the installed package contract.

## Usage

Import runtime helpers from the package root when you need graph-backed metadata, discovery snapshots, UI projections, or evidence lookups:

```ts
import {
  getCatalogDiscoverySnapshot,
  getOntologyEvidenceSnapshot,
  getUiAgentOntologyList,
  resolveCatalogGraphAssetPath,
  resolveCatalogEvidenceAssetPath,
} from "@a5c-ai/agent-catalog";

const graphPath = resolveCatalogGraphAssetPath("agent-catalog.graph.yaml");
const evidencePath = resolveCatalogEvidenceAssetPath("ontology-evidence", "manifest.json");

const discovery = getCatalogDiscoverySnapshot();
const evidence = getOntologyEvidenceSnapshot();
const agents = getUiAgentOntologyList();
```

Use exported asset subpaths when you need the raw packaged files:

```ts
const graphEntrypoint = require.resolve("@a5c-ai/agent-catalog/graph/agent-catalog.graph.yaml");
const evidenceManifest = require.resolve("@a5c-ai/agent-catalog/evidence/ontology-evidence/manifest.json");
const docsEntrypoint = require.resolve("@a5c-ai/agent-catalog/docs/ontology-evidence.md");
```

Downstream consumers should not reconstruct repo paths from `process.cwd()` or assume a monorepo checkout. Use the exported helpers and subpaths instead.

## Package surface

The package surface is intentionally split by concern:

- graph access: `getCatalogGraph()`, `getGraphDocument()`, `getOntologySchema()`, and the `./graph` asset export
- evidence access: `getOntologyEvidenceManifest()`, `getOntologyEvidenceSnapshot()`, evidence and claim lookup helpers, and the `./evidence` asset export
- discovery access: `getCatalogDiscoverySnapshot()`, `refreshCatalogDiscoverySnapshot()`, search helpers, and `listCatalog*` discovery collections
- SDK-facing projections: fallback harness metadata, host detection rules, plugin targets, package/process topology, and UI-oriented agent views
- asset resolution: `resolveCatalogAssetPath()`, `resolveCatalogGraphAssetPath()`, and `resolveCatalogEvidenceAssetPath()`

For a deeper graph/evidence walkthrough, see [`docs/ontology-evidence.md`](./docs/ontology-evidence.md).

## Source of truth and generated assets

- `graph/` is the editable source of truth for the ontology, relations, package/process metadata, and evidence nodes.
- `graph/agent-catalog.graph.yaml` is the root graph document entrypoint used by validators and packaged asset consumers.
- `evidence/ontology-evidence/` is generated from the graph evidence nodes for installed-package consumption.
- `dist/discovery-snapshot.json` is generated during build for runtime discovery helpers; it is part of the compiled runtime, not an editable source file.
- `docs/ontology-evidence.md` is the shipped deep-dive for graph/evidence conventions.

When graph structure or evidence claims change, update the YAML inputs first, then regenerate derived artifacts.

## Docs taxonomy

- `README.md`: package contract, usage, lifecycle policy, and taxonomy index
- `docs/ontology-evidence.md`: shipped deep-dive for graph layout, evidence policy, and refresh workflow
- `protocol.pseudocode.task.md`: internal planning scaffolding kept in the package root for repo context only; it is not in `files`, is not exported from `package.json`, and is not part of the shipped package surface

## Lifecycle policy

- The package must stay publishable: it ships with `publishConfig.access = public`, includes this README in `files`, and is owned by the central publish workflows.
- `npm run ci:test --workspace=@a5c-ai/agent-catalog` is the release-equivalent contract for this workspace. It covers build output, graph validation, evidence freshness, package contract tests, and the publish lifecycle policy check.
- `publish.yml` and `publish-packages-from-tag.yml` version, pack, and publish this package alongside the SDK, hooks-mux, agent-mux, and plugin compiler surfaces that consume it.

## Downstream compatibility

- Public and monorepo consumers may depend on the package's documented exports and packaged graph/evidence assets.
- Breaking changes to exported APIs, graph documents, evidence layout, or generated discovery data require a semver-major release and must keep downstream consumer contract tests green in the same change.
- Workspace consumers in this repo should still be updated in lockstep whenever a change would otherwise break their install, build, or runtime assumptions.

## Expected validation

Run this workspace command before landing changes that affect graph data, generated evidence, exports, packaged docs, or downstream consumers:

```bash
npm run ci:test --workspace=@a5c-ai/agent-catalog
```

For evidence-only refresh work, the package-local sequence is:

```bash
npm run generate:evidence --workspace=@a5c-ai/agent-catalog
npm run validate:graph --workspace=@a5c-ai/agent-catalog
npm run validate:evidence:freshness --workspace=@a5c-ai/agent-catalog
```

## CI contract matrix

`npm run test:agent-catalog-contracts` is the enforced downstream compatibility matrix for `@a5c-ai/agent-catalog` in CI. It currently covers these consumer surfaces:

- package export and packaged-asset contract: `packages/agent-catalog/src/catalog.test.ts`, `packages/agent-catalog/src/discovery.contract.test.ts`, `packages/agent-catalog/src/sdk.contract.test.ts`, `packages/agent-catalog/src/discovery.packaged.test.ts`
- catalog API integration: `packages/catalog/src/app/api/agents/route.contract.test.ts`, `packages/catalog/src/app/api/agents/[slug]/route.contract.test.ts`, `packages/catalog/src/app/api/catalog-integration.contract.test.ts`
- SDK fallback metadata integration: `packages/sdk/src/harness/amuxFallbackMetadata.contract.test.ts`
- hooks-mux discovery integration: `packages/hooks-mux/core/src/discovery/__tests__/detector.contract.test.ts`
- agent-mux integration: `packages/agent-mux/core/tests/host-detection.contract.test.ts`, `packages/agent-mux/core/tests/invocation.contract.test.ts`
- extension-mux integration: `packages/extension-mux/src/__tests__/targets.contract.test.ts`

If a new consumer family or route starts importing `@a5c-ai/agent-catalog`, update this matrix and add its contract test to `test:agent-catalog-contracts` in the same change.
