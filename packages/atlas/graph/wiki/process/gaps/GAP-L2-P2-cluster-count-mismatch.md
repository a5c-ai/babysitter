---
id: page:process-gaps-GAP-L2-P2-cluster-count-mismatch
nodeKind: Page
title: "GAP-L2-P2-cluster-count-mismatch"
slug: "process/gaps/GAP-L2-P2-cluster-count-mismatch"
articlePath: "wiki/process/gaps/GAP-L2-P2-cluster-count-mismatch.md"
documents: []
---
# GAP-L2-P2-cluster-count-mismatch

| Field | Value |
|---|---|
| id | gap:cluster-count-mismatch |
| title | 02-node-kinds/README.md says "15 clusters" but only ~13 are listed |
| level | 2 |
| priority | P2 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | C:/work/v6/graph/02-node-kinds/README.md |
| status | open |
| owner | tbd |

## Current state
`02-node-kinds/README.md` line 8 declares: "The schema is organized into **15 clusters**." File listing shows 13 sibling .md files (agent-stack, benchmarks, capabilities, catalog-meta, channels-hooks, domain-ontology, extensions-plugins, lifecycle, role-ontology, sourceref-and-scope, stack-layers, terminology, transport, trust). README cluster index needs to list 15 clusters with their NodeKind tables; appears to enumerate 12-13.

## Desired state
Either (a) reconcile to the true cluster count after counting, (b) split 1-2 clusters to reach 15, or (c) update prose to match the actual count.

## Evidence
- C:/work/v6/graph/02-node-kinds/README.md line 8
- C:/work/v6/graph/02-node-kinds/ directory listing

## Propagation status
- Level 2: open

## Propagation chain
- Level 2: number reconciliation pass + update README.

## Notes
Low-impact but easy fix; signals lack of recent QA pass.
