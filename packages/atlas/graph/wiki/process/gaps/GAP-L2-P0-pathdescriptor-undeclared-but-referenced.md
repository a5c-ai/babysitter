---
id: page:process-gaps-GAP-L2-P0-pathdescriptor-undeclared-but-referenced
nodeKind: Page
title: "GAP-L2-P0-pathdescriptor-undeclared-but-referenced"
slug: "process/gaps/GAP-L2-P0-pathdescriptor-undeclared-but-referenced"
articlePath: "wiki/process/gaps/GAP-L2-P0-pathdescriptor-undeclared-but-referenced.md"
documents: []
---
# GAP-L2-P0-pathdescriptor-undeclared-but-referenced

| Field | Value |
|---|---|
| id | gap:pathdescriptor-undeclared-but-referenced |
| title | PathDescriptor referenced 6+ times in coverage-checklist but missing from ontology-schema.yaml and 02-node-kinds/ |
| level | 2 |
| priority | P0 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | C:/work/v6/graph/coverage-checklist.md vs schema/ontology-schema.yaml |
| status | open |
| owner | tbd |

## Current state
`coverage-checklist.md` references `PathDescriptor` in at least 4 rows ("Run dir layout PathDescriptor per file", "PathDescriptor for `~/.a5c/`", "Layout version", others). It is **NOT** present in `schema/ontology-schema.yaml` `nodeKinds:` list (verified by grep). It is **NOT** in `02-node-kinds/README.md` cluster table. The repo agent-catalog DOES define `PathDescriptor`. So the v6 schema cites a NodeKind that does not exist.

## Desired state
Add `PathDescriptor` NodeKind in v6 ontology-schema.yaml, lift the repo definition, and document in `02-node-kinds/catalog-meta.md` (or new file). All coverage-checklist rows resolve to a real schema element.

## Evidence
- C:/work/v6/graph/schema/ontology-schema.yaml (no PathDescriptor)
- C:/work/v6/graph/coverage-checklist.md (multiple PathDescriptor mentions)
- packages/agent-catalog/graph/schema/ontology-schema.yaml lines 221-229

## Propagation status
- Level 1: open (also a Level 1 gap — see GAP-L1-P2-repo-graph-cisurface-packagesurface.md)
- Level 2: open

## Propagation chain
- Level 2: add NodeKind + node-kind .md spec, fix invariant V-12.5 (markdown↔YAML parity).

## Notes
This is the single largest internal-consistency violation: schema is supposed to be self-consistent; coverage-checklist proves it isn't.
