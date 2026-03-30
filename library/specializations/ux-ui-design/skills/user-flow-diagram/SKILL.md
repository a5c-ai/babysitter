---
name: user-flow-diagram
description: Generate user flow diagrams and flowcharts using Mermaid and other formats
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# User Flow Diagram Skill

## Purpose

Generate user flow diagrams, flowcharts, and navigation maps to visualize user journeys and application flows.

## Capabilities

- Create Mermaid.js flow diagrams
- Generate flowcharts from user journeys
- Export to SVG, PNG, and other formats
- Validate flow completeness
- Identify dead ends and loops
- Generate sitemap visualizations

## Target Processes

- wireframing.js
- user-journey-mapping.js
- information-architecture.js

## Integration Points

- Mermaid.js for diagram generation
- diagrams.net API for export
- PlantUML for alternative syntax

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "flowData": {
      "type": "object",
      "description": "User flow data structure",
      "properties": {
        "nodes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "label": { "type": "string" },
              "type": { "type": "string" }
            }
          }
        },
        "edges": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "from": { "type": "string" },
              "to": { "type": "string" },
              "label": { "type": "string" }
            }
          }
        }
      }
    },
    "diagramType": {
      "type": "string",
      "enum": ["flowchart", "sequence", "state", "journey"],
      "default": "flowchart"
    },
    "direction": {
      "type": "string",
      "enum": ["TB", "BT", "LR", "RL"],
      "default": "TB"
    },
    "outputFormat": {
      "type": "string",
      "enum": ["mermaid", "svg", "png", "pdf"],
      "default": "mermaid"
    },
    "validate": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["flowData"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "diagramCode": {
      "type": "string",
      "description": "Mermaid or PlantUML code"
    },
    "outputPath": {
      "type": "string",
      "description": "Path to exported diagram"
    },
    "validation": {
      "type": "object",
      "properties": {
        "isComplete": { "type": "boolean" },
        "deadEnds": { "type": "array" },
        "loops": { "type": "array" },
        "unreachable": { "type": "array" }
      }
    },
    "statistics": {
      "type": "object",
      "properties": {
        "nodeCount": { "type": "number" },
        "edgeCount": { "type": "number" },
        "maxDepth": { "type": "number" }
      }
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  flowData: {
    nodes: [
      { id: 'start', label: 'Home', type: 'page' },
      { id: 'login', label: 'Login', type: 'page' },
      { id: 'dashboard', label: 'Dashboard', type: 'page' }
    ],
    edges: [
      { from: 'start', to: 'login', label: 'Sign In' },
      { from: 'login', to: 'dashboard', label: 'Success' }
    ]
  },
  diagramType: 'flowchart',
  outputFormat: 'svg'
});
```
