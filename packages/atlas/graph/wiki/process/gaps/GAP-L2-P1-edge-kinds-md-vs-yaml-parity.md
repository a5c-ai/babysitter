---
id: page:process-gaps-GAP-L2-P1-edge-kinds-md-vs-yaml-parity
nodeKind: Page
title: "GAP-L2-P1-edge-kinds-md-vs-yaml-parity"
slug: "process/gaps/GAP-L2-P1-edge-kinds-md-vs-yaml-parity"
articlePath: "wiki/process/gaps/GAP-L2-P1-edge-kinds-md-vs-yaml-parity.md"
documents: []
---
# GAP-L2-P1-edge-kinds-md-vs-yaml-parity

| Field | Value |
|---|---|
| id | gap:edge-kinds-md-vs-yaml-parity |
| title | 03-edge-kinds.md and ontology-schema.yaml edgeKinds list disagree (V-12.5 invariant violation) |
| level | 2 |
| priority | P1 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | diff of edge names |
| status | open |
| owner | tbd |

## Current state
ontology-schema.yaml lists ~115 edges (e.g. `applies-to`, `composes-stack`, `delegated-from`, `phase-in`, `compiled-from`, `closed-by`, `compiles-to`, `compiled-from`, `discovered-by`, `evidenceSource at_trust_level`...).

03-edge-kinds.md tables list ~50 edges. Many edges in YAML are not in MD:
- `closed-by`, `compiled-from`, `compiles-to` — in YAML, partial in MD
- `phase-in` — in MD, but `has-phase` listed only as inverse
- `composes-stack` — in YAML, missing from MD
- `evidence-at-level` — in YAML, missing from MD
- `discovered-by` — in YAML, missing from MD entirely
- `bundled-into` — in YAML, missing from MD (though `bundled_with` is)
- `belongs-to-machine`, `belongs-to-language`, `belongs-to-family` — YAML, partial MD

Conversely, 03-edge-kinds.md has rows not appearing in the YAML edgeKinds list (e.g. `terminal_state` discussion).

## Desired state
A canonical reconciliation script (or manual pass) producing 1:1 parity, with an automated invariant check (V-12.5) that fails CI on drift.

## Evidence
- C:/work/v6/graph/03-edge-kinds.md (50-ish edge rows)
- C:/work/v6/graph/schema/ontology-schema.yaml (115 edges)

## Propagation status
- Level 2: open

## Propagation chain
- Level 2: align both files; document V-12.5 enforcement.

## Notes
The schema's own gate criterion (V-12.5 markdown↔YAML parity) is currently failing.
