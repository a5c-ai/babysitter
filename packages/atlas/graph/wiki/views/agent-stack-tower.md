---
id: page:views-agent-stack-tower
nodeKind: Page
title: "Agent Stack Tower"
slug: "views/agent-stack-tower"
articlePath: "wiki/views/agent-stack-tower.md"
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
reusableView:
  type: service-tower
  options:
    id: agent-stack-tower
    title: "Agent Stack"
    subtitle: "A vertical walk through stack layers, implementations, capabilities, and product surfaces."
    eyebrow: "Universal stack projection"
    ctaLabel: "Explore stack graph"
    floors:
      - id: base-layers
        label: "BASE LAYERS"
        subtitle: "Model, provider, transport, and agent-core records."
        rooms:
          - id: models
            label: "Models"
            color: "#D4A84B"
            query:
              kind: "ModelFamily"
              limit: 8
          - id: providers
            label: "Providers"
            color: "#C98A3E"
            query:
              kind: "ModelProviderProduct"
              limit: 8
          - id: transport
            label: "Transport"
            color: "#3F8A77"
            query:
              kind: "MCPTransport"
              limit: 8
          - id: core
            label: "Agent core"
            color: "#C03A2B"
            query:
              kind: "AgentCoreImpl"
              limit: 8
      - id: runtime-platform
        label: "RUNTIME"
        subtitle: "Runtime, platform, workspace, execution, and sandbox implementation areas."
        rooms:
          - id: runtimes
            label: "Runtimes"
            color: "#C03A2B"
            query:
              kind: "AgentRuntimeImpl"
              limit: 8
          - id: platforms
            label: "Platforms"
            color: "#D4A84B"
            query:
              kind: "AgentPlatformImpl"
              limit: 8
          - id: workspaces
            label: "Workspaces"
            color: "#8C5C7E"
            query:
              kind: "Workspace"
              limit: 8
          - id: sandbox
            label: "Sandbox"
            color: "#3F8A77"
            query:
              kind: "FilesystemSafetyInvariant"
              limit: 8
      - id: surfaces
        label: "SURFACES"
        subtitle: "Interaction, presentation, products, capabilities, and user-facing extension points."
        rooms:
          - id: products
            label: "Products"
            color: "#C98A3E"
            query:
              kind: "AgentProduct"
              limit: 8
          - id: ui
            label: "UI impls"
            color: "#3F8A77"
            query:
              kind: "AgentUIImpl"
              limit: 8
          - id: capabilities
            label: "Capabilities"
            color: "#D4A84B"
            query:
              kind: "Capability"
              limit: 8
          - id: plugins
            label: "Plugins"
            color: "#8C5C7E"
            query:
              kind: "PluginArtifact"
              limit: 8
---
# Agent Stack Tower

This projection uses the service-tower template to show the universal agentic stack as a building.

Each room is driven by a graph query. The view is not a static screenshot: it links back to model, provider, runtime, product, and capability records in the Atlas graph.
