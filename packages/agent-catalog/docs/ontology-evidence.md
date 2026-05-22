# Agent Catalog Graph And Evidence

`packages/agent-catalog/graph` is the source of truth for the shared agent ontology. This file is the shipped deep-dive for graph and evidence conventions. For the broader package contract and docs taxonomy, start with [`../README.md`](../README.md).

## Docs taxonomy

- `README.md` is the package contract and the index for usage, exported surfaces, lifecycle policy, and file taxonomy.
- `docs/ontology-evidence.md` is the shipped reference for graph layout, evidence policy, packaged asset access, and refresh workflow.
- `protocol.pseudocode.task.md` remains an internal planning artifact in the package root. It is maintained in-repo for authoring context only and is not part of the shipped package surface because it is outside `package.json` `files` and `exports`.

## Layout

- `agent-catalog.graph.yaml`
  - root graph document entrypoint used by validators and wrappers; imports can point at YAML files or directories
- `schema/ontology-schema.yaml`
  - allowed node kinds, edge kinds, and required attributes
- `nodes/agents`, `nodes/providers`
  - product/version splits instead of single mixed node files
- `nodes/capabilities`, `nodes/hooks-and-plugins`, `nodes/runtime-semantics`
  - large conceptual areas split into stable subdocuments
- `nodes/processes-and-packages`, `nodes/evidence`
  - process/package/CI and evidence/claim surfaces split into smaller docs
- `edges/relations`
  - relation-family documents such as identity, runtime, capabilities, hooks/plugins, provenance, and evolution

## Modeled concepts

- product/version splits for agents, model providers, and models
- transport protocols vs transport runtimes
- capabilities vs capability-support records
- hook surfaces vs hook mappings
- plugin targets vs plugin artifacts
- discovery signals, session semantics, lifecycle semantics, paths, process descriptors, package surfaces, CI surfaces, claims, and evidence sources

## Graph and evidence conventions

- graph YAML under `graph/` is the editable source of truth
- `evidence/ontology-evidence/` is a derived directory export of evidence-source and claim nodes for easier installed-package consumption
- `manifest.json` lists the shard files; runtime helpers assemble them through `getOntologyEvidenceSnapshot()`
- the shard files are grouped into small batches by evidence domain so the derived export does not regress back into a single monolith
- packaged docs are intentionally narrow: only `docs/` is shipped, while planning artifacts at the package root stay internal-only

## Evidence policy

- repo-backed claims come from SDK fallback metadata, hooks-mux discovery, agent-mux host detection, extension-mux targets, transport-mux protocol/provider docs, and existing catalog/process surfaces
- web-backed claims are limited to first-party vendor docs already referenced by the graph evidence nodes
- vendor-backed evidence is currently defined as `kindLabel: web` plus `trustLevel: official-web`
- every vendor-backed `EvidenceSource` must declare:
  - `reviewOwner`: internal owner responsible for refresh
  - `reviewedAt`: the last explicit review timestamp
  - `freshnessWindowDays`: maximum allowed age for that review before CI fails
- the graph root policy caps `freshnessWindowDays` at 45 days and defines the machine-checkable selector and reachability rules used by CI
- every `Claim` now carries explicit provenance semantics:
  - `provenanceKind`: `repo-observation`, `vendor-documentation`, or `vendor-inference`
  - `evidenceStrength`: `corroborated`, `partial`, or `inferred`
  - `unresolvedGaps`: required markers for any vendor claim that is not fully corroborated
- capability-support quality is derived from `supported_by_claim` edges rather than raw evidence IDs alone, so externally asserted capabilities can be separated into strongly corroborated support versus weaker vendor-doc inference
- corroborated external capability assertions are expected to include at least one corroborated vendor claim backed by multiple first-party evidence sources; weaker assertions must keep explicit gap markers

## Package asset access

Downstream consumers should use the package's exported graph, evidence, and docs subpaths instead of rebuilding paths from `process.cwd()` or repository layout.

- raw graph entrypoint: `require.resolve("@a5c-ai/agent-catalog/graph/agent-catalog.graph.yaml")`
- raw evidence manifest: `require.resolve("@a5c-ai/agent-catalog/evidence/ontology-evidence/manifest.json")`
- raw docs entrypoint: `require.resolve("@a5c-ai/agent-catalog/docs/ontology-evidence.md")`
- runtime helpers exported by the package:
  - `resolveCatalogGraphAssetPath("agent-catalog.graph.yaml")`
  - `resolveCatalogEvidenceAssetPath("ontology-evidence", "manifest.json")`

The package runtime uses the same resolver path for graph and evidence assets in both monorepo-source and installed-package usage.

## Refresh workflow

1. Update the relevant YAML source under `packages/agent-catalog/graph/nodes/evidence/`.
2. Re-check the vendor page, then update `capturedAt`, `reviewedAt`, `locator`, and any affected claims or `unresolvedGaps`.
3. Run `npm run generate:evidence --workspace=@a5c-ai/agent-catalog`.
4. Run `npm run validate:graph --workspace=@a5c-ai/agent-catalog`.
5. Run `npm run validate:evidence:freshness --workspace=@a5c-ai/agent-catalog`.
6. Before landing a change, run `npm run ci:test --workspace=@a5c-ai/agent-catalog`.

`validate:evidence:freshness` fails when vendor-backed evidence is stale, missing review metadata, no longer reachable, or no longer meets the corroboration/gap rules for vendor claims. For offline local work, set `AGENT_CATALOG_SKIP_VENDOR_WEB_CHECK=1` to skip the remote HTTP reachability pass; CI should not use that escape hatch.
