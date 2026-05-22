---
id: page:00-wiki-architecture
nodeKind: Page
title: "Wiki Architecture"
slug: "00-wiki-architecture"
articlePath: "wiki/00-wiki-architecture.md"
documents: []
---
# Wiki Architecture

> Phase-4 deliverable. The wiki is the user-facing projection of the graph — full encyclopedia, navigable, searchable, deeply cross-linked. **Every page is generated from a graph query, never authored.**

## Site shape

The site is a static, file-based build. Output lands under `wiki/generated/`. Top-level navigation:

```
/
├── overview/                  (auto-derived: introduction, glossary, stack diagram)
├── stack/                     (one page per top-level Layer)
├── products/                  (one page per AgentProduct, with version subpages)
├── capabilities/              (one page per Capability, with support matrix)
├── hooks/                     (one page per HookSurface, grouped by HookFamily)
├── channels/                  (one page per Channel + ChannelKind index)
├── extensions/                (Plugin / NativeExtension / PortableExtension / Skill / Subagent / ToolServer / ToolDescriptor / Blueprint / ExtensionInterface)
├── lifecycle/                 (Run / Invocation / Session / Phase + state-machine diagrams)
├── domain/                    (Domain / Specialization / Topic / Language / Framework / StackProfile / ExpertiseLevel)
├── roles/                     (Role / Responsibility / OrgUnit)
├── benchmarks/                (Benchmark / TestSet / EvalRun / EvalResult)
├── trust/                     (Authority / Attestation / TrustLevel)
├── glossary/                  (every Term, sorted; alias index)
├── meta/                      (CatalogVersion history, Generator catalog, evidence dashboard, gap dashboard)
└── search/                    (full-text search index endpoint)
```

The full mapping of page type → query lives in [`01-derivation-mapping.md`](./01-derivation-mapping.md).

## Navigation taxonomy

Navigation is generated, never authored. Three layers:

1. **Cluster sidebar** — the NodeKind clusters from `graph/schema/node-kinds/README.md`. Mirrors the schema's editorial frame.
2. **Breadcrumbs** — derived from edge traversal. A `ModelVersion` page's breadcrumb is `Stack → Compute Path → ModelFamily(claude) → ModelVersion(claude-opus-4-7)`.
3. **In-page TOC** — derived from the page's section list, which is itself derived from the page-type's query template.

Every link target is a node `id`; broken links are impossible because the link generator only emits links for ids that resolved during graph load.

## Search

Full-text search index built at generation time:

- One document per page; `id`, `displayName`, `aliases` (from `Synonym` + `Acronym`), and the rendered prose body are indexed.
- Lunr.js client-side search by default; pluggable to a hosted index (Algolia/Meili) via the same generator manifest.
- Cross-reference highlights: when a query matches a `Term`, the result preview shows up to three nodes that `reference` it.

## Cross-references

Cross-refs are first-class. Every NodeKind page renders:

- **Outgoing**: edges this node has, grouped by `EdgeKind`, each with target link.
- **Incoming**: reverse adjacency (e.g., a `Capability` page lists every `CapabilitySupport` and through it every `AgentVersion` that supports the capability).
- **Mentioned in**: `Term` references back to nodes that name them.
- **Evidence trail**: every claim on the page links to its `EvidenceSource`(s) and shows freshness state.

A "Why this page?" disclosure on every page lists the exact graph query that produced it (and the manifest hash) — opening it shows which `Generator` is responsible, satisfying the audit requirement in Phase 5.

## Authoring vs generation

Authoring touches **only**:

- `assets/` (logos, hand-drawn diagrams, screenshots).
- Page templates inside `graph/wiki/generators/templates/wiki/`.
- Navigation configuration (which clusters appear, ordering).

Authoring **never** touches `generated/`. CI rejects any PR that hand-edits a file under `generated/` without a corresponding template/data change.

## Asset handling

- Hand-drawn diagrams in `assets/diagrams/` are referenced by node id (`asset:diagram-stack-overview`) and tracked as `EvidenceSource` records of `kindLabel = file` so freshness checks apply uniformly.
- Auto-rendered diagrams (mermaid) live under `generated/assets/` and are produced by the stack-diagram generator.

## Generation cadence

| Trigger | Action |
|---|---|
| Per PR | Re-run generators that consume any node touched by the PR. CI fails if the resulting tree diff exceeds the PR's claimed scope (Level-2 / Level-4 gate). |
| On merge to main | Full regeneration; static site published to the docs host. |
| Weekly | Full regeneration without code changes — surfaces stale evidence (Level-1 freshness gate). Any new diff means an external truth has shifted; opens a Level-1 `Gap`. |
| On schema bump | Full regeneration tagged with the new `CatalogVersion`; previous version archived under `/wiki/<version>/`. |

## Versioning

The published site has a version selector keyed to `CatalogVersion`. Pinning a wiki page URL to `/<semver>/...` returns the exact prose generated against that schema version, supporting Phase 5's downstream-pinning contract.
