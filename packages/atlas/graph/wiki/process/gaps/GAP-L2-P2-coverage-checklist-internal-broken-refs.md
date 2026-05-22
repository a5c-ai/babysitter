---
id: page:process-gaps-GAP-L2-P2-coverage-checklist-internal-broken-refs
nodeKind: Page
title: "GAP-L2-P2-coverage-checklist-internal-broken-refs"
slug: "process/gaps/GAP-L2-P2-coverage-checklist-internal-broken-refs"
articlePath: "wiki/process/gaps/GAP-L2-P2-coverage-checklist-internal-broken-refs.md"
documents: []
---
# GAP-L2-P2-coverage-checklist-internal-broken-refs

| Field | Value |
|---|---|
| id | gap:coverage-checklist-internal-broken-refs |
| title | Coverage-checklist references several NodeKinds/Terms that don't exist as schema elements |
| level | 2 |
| priority | P2 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | C:/work/v6/graph/coverage-checklist.md vs schema/ontology-schema.yaml |
| status | open |
| owner | tbd |

## Current state
Beyond `PathDescriptor` (its own gap), coverage-checklist mentions:
- `OntologySchema` — used in row "Catalog / Ontology" but not in v6 nodeKinds (it IS in repo schema, line 23-30)
- `Mux` (as schema element) — coverage-checklist treats `ExtensionInterface` `kind=mux` as the mapping, but no `kind` attribute is declared on ExtensionInterface
- `ProcessLibrary` — referenced row 406 ("modeled as `ProcessLibrary`") but no such NodeKind in v6 ontology-schema.yaml; only `ProcessDescriptor`
- `SharedContextSpec` — coverage row 139 ("structured Claim attached to ... as a `SharedContextSpec`") — no such named claim shape
- `RunJournalEvent` — row 154 ("enum `RunJournalEvent`") — but enums in v6 are not first-class schema elements
- `DecisionVerb` — row 104 ("ordered enum `DecisionVerb`") — same issue

## Desired state
Either (a) add the missing NodeKinds and named-enum primitives to schema, or (b) downgrade those coverage rows to `🟡` (partial) with a remediation plan in place. Currently they are marked `✅` falsely.

## Evidence
- C:/work/v6/graph/coverage-checklist.md (rows 139, 154, 104, 406, 524)
- C:/work/v6/graph/schema/ontology-schema.yaml

## Propagation status
- Level 2: open

## Propagation chain
- Level 2: choose for each row: promote-to-schema or demote-status.

## Notes
Self-audit gap. The coverage-checklist's gate criterion ("Every row in the coverage table has Status... no row left blank") is being met only because rows are over-claiming `✅`.
