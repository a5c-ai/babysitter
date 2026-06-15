---
id: page:process-gaps-GAP-L1-P1-repo-graph-session-lifecycle-semantics
nodeKind: Page
title: "GAP-L1-P1-repo-graph-session-lifecycle-semantics"
slug: "process/gaps/GAP-L1-P1-repo-graph-session-lifecycle-semantics"
articlePath: "wiki/process/gaps/GAP-L1-P1-repo-graph-session-lifecycle-semantics.md"
documents: []
---
# GAP-L1-P1-repo-graph-session-lifecycle-semantics

| Field | Value |
|---|---|
| id | gap:repo-graph-session-lifecycle-semantics |
| title | SessionSemantics + LifecycleSemantics NodeKinds from repo absent in v6 schema |
| level | 1 |
| priority | P1 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | packages/agent-catalog/graph/schema/ontology-schema.yaml |
| status | open |
| owner | tbd |

## Current state
The repo defines two per-AgentVersion semantics nodes:
- `SessionSemantics` — `sessionDirStrategy`, `sessionIdSources`, `resumeSemantics`
- `LifecycleSemantics` — `runtimeHookMode`, `stopHookMode`, `backgroundTaskMode`, `checkpointMode`

v6 schema has `SessionModel` (cluster 3) but no `LifecycleSemantics` analog. The persistence/control-plane/structured-transport triple in v6 covers session storage but not these per-product behavioral switches (e.g. "does this agent block on stop hooks?", "can it spawn background tasks?").

## Desired state
- Either extend `SessionModel` with the missing fields (`sessionIdSources`, `resumeSemantics`) or add a sibling `SessionSemantics` NodeKind.
- Add new NodeKind `LifecycleSemantics` with the four-attribute set, edge `AgentVersion uses_lifecycle_semantics LifecycleSemantics`.
- Required for accurate cross-harness behavioral comparison (which is exactly what coverage-checklist row "Per-product comparison-table fields (Vendor, Layers, Surface, Plugin formats, MCP, Hooks, Execution typical, Sandbox default, Resume, Fork)" claims is derivable).

## Evidence
- packages/agent-catalog/graph/schema/ontology-schema.yaml (lines 183-201)

## Propagation status
- Level 1: open
- Level 2: not-started — coverage-checklist OpenQuestion `oq:repo-22-nodekinds-mapping`

## Propagation chain
- Level 1: 1 NodeKind extension + 1 new NodeKind.
- Level 2: updates to lifecycle.md and agent-stack.md node-kind specs.

## Notes
Resolves second slice of "live 22 NodeKinds vs v6" OpenQuestion.
