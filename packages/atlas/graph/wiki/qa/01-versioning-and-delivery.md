---
id: page:qa-01-versioning-and-delivery
nodeKind: Page
title: "Versioning and Delivery"
slug: "qa/01-versioning-and-delivery"
articlePath: "wiki/qa/01-versioning-and-delivery.md"
documents: []
---
# Versioning and Delivery

> Phase-5 deliverable. How the catalog schema is versioned, how downstream artifacts inherit that version, and how consumers pin.

## Catalog schema versioning

The schema itself follows semver, governed by `graph/schema/versioning.md`. Every version is a `CatalogVersion` node in the graph (the meta-graph references itself).

| Bump | Rule |
|---|---|
| **Major** | Removing a NodeKind / EdgeKind / required attribute, narrowing a type, narrowing an enum domain. Requires non-empty `breakingChanges` and a `MigrationSpec`. `supportedUntil` ≥ release + 180 days. |
| **Minor** | Adding a NodeKind / EdgeKind / optional attribute, widening an enum domain. Backwards-compatible. |
| **Patch** | Doc-only changes, prose clarifications, fixing typos in `displayName` defaults. No graph load semantics change. |

Schema versions are tagged `catalog-vX.Y.Z` and published as a YAML bundle under `graph/schema/` releases.

## Downstream artifact versioning

Every `DerivedArtifact` records `sourceGraphVersion` referencing the `CatalogVersion` it was produced against. This is more than housekeeping — it is the contract that lets downstream consumers reason about freshness.

| Artifact | Version expression |
|---|---|
| Generated wiki site | `https://docs.../<catalog-semver>/...` (per-version archive). |
| OpenAPI artifact | `info.version` = catalog semver; published as `openapi-<semver>.yaml`. |
| TypeScript SDK | npm package `@a5c-ai/atlas@<semver>` whose major matches catalog major. |
| Per-package READMEs | Front-matter `catalogVersion: X.Y.Z`. |
| Stack diagrams | Filename suffix `-v<semver>.svg`. |
| Glossary export | YAML/JSON dump named `glossary-<semver>.json`. |

## Release pipeline

1. **Pre-release CI** runs the full Phase-5 test pyramid against the candidate.
2. **Adversarial review** (per [`process/00-process-design.md`](../process/00-process-design.md), Section 5) signs off.
3. **Schema tag** `catalog-vX.Y.Z` lands on `main`. CI publishes the schema bundle.
4. **Generator pass** runs against the tagged graph; produces the dated set of derived artifacts.
5. **Downstream publish** in dependency order: SDK first (other consumers may depend on its types), then wiki, then OpenAPI, then per-package READMEs.
6. **Release notes** are themselves derived from `CatalogVersion.releaseNotes` plus the diff of `addedNodeKinds` / `removedNodeKinds` / `breakingChanges`.

## Consumer pinning

Consumers (the babysitter SDK, dashboards, third-party tooling) pin to a catalog semver via the artifact most relevant to them:

- **TypeScript consumers** pin via `npm` semver ranges on `@a5c-ai/atlas`.
- **OpenAPI consumers** pin via the `openapi-<semver>.yaml` filename.
- **Wiki consumers** pin via the `/<semver>/` URL prefix.

A consumer using artifact at major version M is guaranteed:

- Type-compatible reads against any minor/patch within M.
- A migration path documented in the `M+1.0.0` `MigrationSpec` when M is sunset.
- 180-day deprecation runway (`supportedUntil`) before previous-major artifacts go offline.

## Yanking

A bad release is yanked by:

1. Bumping a patch (e.g. `X.Y.Z+1`) that reverts the offending change.
2. Setting `supportedUntil` on the bad version to "today" — Phase-5 CI then refuses to serve it.
3. Publishing a Level-1 `Gap` documenting the yank, its cause, and the fix.

No release is force-pushed, never amended; the audit trail is the lockstep of `CatalogVersion` nodes and their `supportedUntil` history.
