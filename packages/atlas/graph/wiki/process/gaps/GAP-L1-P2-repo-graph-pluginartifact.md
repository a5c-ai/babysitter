---
id: page:process-gaps-GAP-L1-P2-repo-graph-pluginartifact
nodeKind: Page
title: "GAP-L1-P2-repo-graph-pluginartifact"
slug: "process/gaps/GAP-L1-P2-repo-graph-pluginartifact"
articlePath: "wiki/process/gaps/GAP-L1-P2-repo-graph-pluginartifact.md"
documents: []
---
# GAP-L1-P2-repo-graph-pluginartifact

| Field | Value |
|---|---|
| id | gap:repo-graph-pluginartifact |
| title | PluginArtifact NodeKind from repo absent in v6 schema |
| level | 1 |
| priority | P2 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | packages/agent-catalog/graph/schema/ontology-schema.yaml |
| status | open |
| owner | tbd |

## Current state
Repo has `PluginArtifact` (`artifactKind`, `pathPattern`, `installerSurface`) emitted via `PluginTarget emits_artifact PluginArtifact`. v6 schema has `NativeExtension`/`PortableExtension`/`Plugin` but no concept of the **physical artifact files** a plugin compiles to.

## Desired state
Add `PluginArtifact` NodeKind under cluster 7 with edge `NativeExtension emits_artifact PluginArtifact`. Distinguishes "plugin definition" (Plugin node) from "compiled artifact on disk" (PluginArtifact node).

## Evidence
- packages/agent-catalog/graph/schema/ontology-schema.yaml (lines 164-171, 385-394)

## Propagation status
- Level 1: open
- Level 2: not-started

## Propagation chain
- Level 1: add NodeKind + edge.
- Level 2: extensions-plugins.md gains a section.

## Notes
Closes another slice of repo→v6 mapping OQ.
