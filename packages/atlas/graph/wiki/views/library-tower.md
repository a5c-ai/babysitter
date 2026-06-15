---
id: page:views-library-tower
nodeKind: Page
title: "Process Library Tower"
slug: "views/library-tower"
articlePath: "wiki/views/library-tower.md"
documents:
  - "page:generators"
reusableView:
  type: service-tower
  options:
    id: process-library-tower
    title: "Process Library"
    subtitle: "Generated library processes, skills, agents, and specializations as reusable service rooms."
    eyebrow: "Generated library projection"
    ctaLabel: "Open library graph"
    floors:
      - id: library-assets
        label: "LIBRARY"
        subtitle: "Top-level process-library assets generated into the Atlas graph."
        rooms:
          - id: processes
            label: "Processes"
            color: "#D4A84B"
            query:
              kind: "LibraryProcess"
              limit: 8
          - id: skills
            label: "Skills"
            color: "#C98A3E"
            query:
              kind: "LibrarySkill"
              limit: 8
          - id: agents
            label: "Agents"
            color: "#3F8A77"
            query:
              kind: "LibraryAgent"
              limit: 8
          - id: libraries
            label: "Libraries"
            color: "#8C5C7E"
            query:
              kind: "Library"
              limit: 8
      - id: methods
        label: "METHODS"
        subtitle: "Methodologies and specializations used to shape reusable process behavior."
        rooms:
          - id: methodologies
            label: "Methodologies"
            color: "#D4A84B"
            query:
              kind: "Methodology"
              limit: 8
          - id: specializations
            label: "Specializations"
            color: "#C98A3E"
            query:
              kind: "Specialization"
              limit: 8
          - id: topics
            label: "Topics"
            color: "#3F8A77"
            query:
              kind: "Topic"
              limit: 8
          - id: terms
            label: "Terms"
            color: "#8C5C7E"
            query:
              kind: "Term"
              limit: 8
      - id: extension-surfaces
        label: "EXTENSIONS"
        subtitle: "Tools, servers, APIs, and plugin artifacts around the process library."
        rooms:
          - id: tool-descriptors
            label: "Tool descriptors"
            color: "#D4A84B"
            query:
              kind: "ToolDescriptor"
              limit: 8
          - id: tool-servers
            label: "Tool servers"
            color: "#3F8A77"
            query:
              kind: "ToolServer"
              limit: 8
          - id: api-endpoints
            label: "API endpoints"
            color: "#C98A3E"
            query:
              kind: "APIEndpoint"
              limit: 8
          - id: artifacts
            label: "Artifacts"
            color: "#8C5C7E"
            query:
              kind: "PluginArtifact"
              limit: 8
---
# Process Library Tower

This page shows generated process-library records through the same reusable Service Tower component.

It is useful for spotting whether the generated library graph is balanced across processes, skills, agents, methods, and extension surfaces.
