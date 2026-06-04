---
id: page:agent-generate-universal-agentic-stack-source-map
nodeKind: Page
title: "Universal Agentic Stack Source Map"
slug: "agent-generate/universal-agentic-stack/source-map"
articlePath: "wiki/agent-generate/universal-agentic-stack/source-map.md"
documents:
  - "layer:1-model"
  - "layer:2-provider"
  - "layer:3-transport"
  - "layer:4-agent-core"
  - "layer:5-agent-runtime"
  - "layer:6-agent-platform"
  - "layer:7-workspace"
  - "layer:8-execution"
  - "layer:9-sandbox"
  - "layer:10-interaction"
  - "layer:11-presentation"
---
# Universal Agentic Stack Source Map

This page shows exactly which graph files drive the stack pages in this section. It is the traceability view for readers who want to verify that the prose and diagram come from the graph rather than hand-maintained copies.

## What this section is built from

The handbook combines three kinds of material:

1. layer records from `graph/stack-layers/layers`
2. handbook prose pages in `wiki/agent-generate/universal-agentic-stack`
3. a Mermaid diagram assembled from the layer attributes

That means not every page here is fully generated, but the core layer facts and the diagram content are still graph-grounded.

## Source files

- `graph/stack-layers/layers/layer-1-model.yaml` -> Layer 1: Model
- `graph/stack-layers/layers/layer-2-provider.yaml` -> Layer 2: Provider
- `graph/stack-layers/layers/layer-3-transport.yaml` -> Layer 3: Transport
- `graph/stack-layers/layers/layer-4-agent-core.yaml` -> Layer 4: Agent-Core
- `graph/stack-layers/layers/layer-5-agent-runtime.yaml` -> Layer 5: Agent-Runtime
- `graph/stack-layers/layers/layer-6-agent-platform.yaml` -> Layer 6: Agent-Platform
- `graph/stack-layers/layers/layer-7-workspace.yaml` -> Layer 7: Workspace
- `graph/stack-layers/layers/layer-8-execution.yaml` -> Layer 8: Execution
- `graph/stack-layers/layers/layer-9-sandbox.yaml` -> Layer 9: Sandbox
- `graph/stack-layers/layers/layer-10-interaction.yaml` -> Layer 10: Interaction
- `graph/stack-layers/layers/layer-11-presentation.yaml` -> Layer 11: Presentation

## Included attributes

- `id`
- `displayName`
- `position`
- `path`
- `summary`
- `scope`
- `responsibilities`
- `examples`
- `fitNotes`

## How the pages relate to the sources

| Page | Main source of truth |
|---|---|
| `layers.md` | direct rendering of layer records and their attributes |
| `02-landscape-diagram.md` | Mermaid diagram assembled from the same layer attributes |
| `README.md`, `00-orientation.md`, `01-builder-fit.md`, `03-placement-checklist.md`, `04-worked-examples.md`, `05-common-confusions.md`, `06-reading-paths.md`, `07-comparison-matrix.md` | handbook prose that interprets the layer records and links readers back into the graph |

## Important boundary

The internal boxes shown in the Mermaid landscape diagram are generated from those attributes. They are not separate nested layer nodes in the graph.

## Why this matters

- It keeps the descriptive reference anchored to graph truth.
- It allows handbook pages to become more helpful without pretending the prose itself is a raw graph export.
- It makes it easier to see which disagreements are about graph facts and which are about interpretation.
