---
id: page:process-gaps-GAP-L1-P2-repo-graph-cisurface-packagesurface
nodeKind: Page
title: "GAP-L1-P2-repo-graph-cisurface-packagesurface"
slug: "process/gaps/GAP-L1-P2-repo-graph-cisurface-packagesurface"
articlePath: "wiki/process/gaps/GAP-L1-P2-repo-graph-cisurface-packagesurface.md"
documents: []
---
# GAP-L1-P2-repo-graph-cisurface-packagesurface

| Field | Value |
|---|---|
| id | gap:repo-graph-cisurface-packagesurface |
| title | CiSurface, PackageSurface, PathDescriptor — repo NodeKinds for build/release surfaces absent in v6 |
| level | 1 |
| priority | P2 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | packages/agent-catalog/graph/schema/ontology-schema.yaml |
| status | open |
| owner | tbd |

## Current state
Repo defines:
- `PackageSurface` (npm package metadata: workspacePath, moduleType, surfaceKinds, sourceOfTruthRole)
- `CiSurface` (scripts, publishStrategy, releaseChannels, validationCommands)
- `PathDescriptor` (path, pathKind, ownerKind, ownerId, platform)

v6 has `ProcessDescriptor` (cluster 11) — partially overlaps with `PackageSurface` but doesn't include CI fields or release channels. `PathDescriptor` is referenced multiple times in coverage-checklist (e.g. "Run dir layout PathDescriptor per file") but no NodeKind by that name exists in v6 ontology-schema.yaml.

## Desired state
- Add `PathDescriptor` NodeKind (called out by coverage-checklist but missing — internal contradiction).
- Either extend `ProcessDescriptor` with CI fields or add `CiSurface` sibling NodeKind.
- Add `PackageSurface` (or merge into ProcessDescriptor with new attributes `moduleType`, `sourceOfTruthRole`).

## Evidence
- packages/agent-catalog/graph/schema/ontology-schema.yaml (lines 212-247)
- C:/work/v6/graph/coverage-checklist.md (multiple rows reference `PathDescriptor`)

## Propagation status
- Level 1: open
- Level 2: not-started — coverage-checklist has internally-inconsistent `PathDescriptor` references

## Propagation chain
- Level 1: 1 missing NodeKind + 1 ProcessDescriptor extension OR 2 sibling NodeKinds.
- Level 2: catalog-meta.md / sourceref-and-scope.md updates.

## Notes
Internal-consistency fix: schema mentions PathDescriptor as if it exists; it does not.
