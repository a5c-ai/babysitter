---
id: page:views-service-tower
nodeKind: Page
title: "Atlas Service Tower"
slug: "views/service-tower"
articlePath: "wiki/views/service-tower.md"
documents:
  - "layer:1-model"
  - "layer:4-agent-core"
  - "layer:5-agent-runtime"
  - "layer:11-presentation"
reusableView:
  type: service-tower
  options:
    id: atlas-service-tower
    title: "Atlas Service"
    subtitle: "A reusable isometric building view over major Atlas graph surfaces."
    eyebrow: "A5C reusable view"
    ctaLabel: "Open full graph"
    domains:
      - id: strategy
        label: Strategy
        color: "#D4A84B"
      - id: build
        label: Build
        color: "#C98A3E"
      - id: revenue
        label: Runtime
        color: "#C03A2B"
      - id: trust
        label: Trust
        color: "#3F8A77"
      - id: enablement
        label: Enablement
        color: "#8C5C7E"
    floors:
      - id: catalog-base
        label: "CATALOG BASE"
        subtitle: "Schema, evidence, claims, and prose pages that ground the graph."
        rooms:
          - id: node-kinds
            label: "Node kinds"
            color: "#D4A84B"
            query:
              kind: "MetaNodeKind"
              limit: 8
          - id: claims
            label: "Claims"
            color: "#C98A3E"
            query:
              kind: "Claim"
              limit: 8
          - id: evidence
            label: "Evidence"
            color: "#3F8A77"
            query:
              kind: "EvidenceSource"
              limit: 8
          - id: pages
            label: "Wiki pages"
            color: "#8C5C7E"
            query:
              kind: "Page"
              limit: 8
      - id: agent-stack
        label: "AGENT STACK"
        subtitle: "The universal stack and the product/runtime implementations around it."
        rooms:
          - id: layers
            label: "Stack layers"
            color: "#D4A84B"
            query:
              kind: "Layer"
              limit: 8
          - id: products
            label: "Agent products"
            color: "#C98A3E"
            query:
              kind: "AgentProduct"
              limit: 8
          - id: runtimes
            label: "Runtime impls"
            color: "#C03A2B"
            query:
              kind: "AgentRuntimeImpl"
              limit: 8
          - id: presentation
            label: "Presentation"
            color: "#3F8A77"
            query:
              kind: "AgentUIImpl"
              limit: 8
      - id: operations
        label: "OPERATIONS"
        subtitle: "Execution workflows, role records, capabilities, and tools."
        rooms:
          - id: workflows
            label: "Workflows"
            color: "#C98A3E"
            query:
              kind: "Workflow"
              limit: 8
          - id: roles
            label: "Roles"
            color: "#8C5C7E"
            query:
              kind: "Role"
              limit: 8
          - id: capabilities
            label: "Capabilities"
            color: "#D4A84B"
            query:
              kind: "Capability"
              limit: 8
          - id: tools
            label: "Tools"
            color: "#3F8A77"
            query:
              kind: "Tool"
              limit: 8
---
# Atlas Service Tower

This page uses the `service-tower` reusable view to project several major graph surfaces into the same building metaphor as the original a5c Service Tower.

The page itself stays a normal wiki page: it can document records, link to nodes, and appear in section navigation. The reusable view is attached by frontmatter and renders after this article.

## What to inspect

- Click a floor to zoom into a graph area.
- Click a room to see representative records and service-line summaries.
- Follow any record link to open the underlying node ledger.
