---
id: page:process-gaps-GAP-L1-P1-repo-graph-discovery-signal
nodeKind: Page
title: "GAP-L1-P1-repo-graph-discovery-signal"
slug: "process/gaps/GAP-L1-P1-repo-graph-discovery-signal"
articlePath: "wiki/process/gaps/GAP-L1-P1-repo-graph-discovery-signal.md"
documents: []
---
# GAP-L1-P1-repo-graph-discovery-signal

| Field | Value |
|---|---|
| id | gap:repo-graph-discovery-signal |
| title | DiscoverySignal NodeKind from repo agent-catalog absent in v6 schema |
| level | 1 |
| priority | P1 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | packages/agent-catalog/graph/schema/ontology-schema.yaml |
| status | open |
| owner | tbd |

## Current state
The repo's live `packages/agent-catalog/graph/schema/ontology-schema.yaml` defines `DiscoverySignal` (with `signalKind`, `key`, `matchMode`, `confidence`, `argvMatches`, etc.) and a `discovered_by` edge. v6 graph treats discovery as out-of-scope ("Discovery runtime queries (`detectHostAgent`, `listInstalledAgents`)... runtime API; the catalog *describes* the data such queries consume; the queries themselves are not schema").

But discovery **signals** themselves (file patterns, env-var names, argv shapes that identify a host agent) ARE catalog data — and the live repo proves it. Coverage-checklist row "Discovery (concept)" maps to `DiscoverySignal` but no NodeKind by that name exists in v6 ontology-schema.yaml.

## Desired state
Promote `DiscoverySignal` to a first-class NodeKind in v6 schema, with attributes mirrored from the repo: `signalKind (enum<env-var,file-presence,argv-match,pkg-manifest>)`, `key`, `matchMode`, `confidence`, `scope`, `argvMatches`. Add edge `AgentVersion discovered_by DiscoverySignal` (and similarly for `ModelProviderVersion`, `PluginTarget`).

## Evidence
- packages/agent-catalog/graph/schema/ontology-schema.yaml (lines 172-182)
- packages/agent-catalog/graph/nodes/agents/ (live signal data)
- C:/work/v6/graph/coverage-checklist.md "Discovery (concept)" row references `DiscoverySignal` as if it exists

## Propagation status
- Level 1: open
- Level 2: not-started — coverage-checklist row currently false-positive (✅ but no schema element)

## Propagation chain
- Level 1: add NodeKind + edge in ontology-schema.yaml.
- Level 2: this resolves OpenQuestion "How do live agent-catalog 22 NodeKinds collapse into v6 schema NodeKinds?" partially.

## Notes
Closes coverage-checklist OpenQuestion `oq:repo-22-nodekinds-mapping` for one of the missing kinds.
