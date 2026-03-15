---
name: graphviz-renderer
description: Render Graphviz DOT graphs to images with multiple layout algorithms
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Graphviz DOT Renderer Skill

## Overview

Renders Graphviz DOT graph definitions to images supporting multiple layout algorithms for dependency visualization and large graph rendering.

## Capabilities

- Render DOT graphs to PNG, SVG, PDF, PS formats
- Multiple layout algorithms (dot, neato, fdp, sfdp, twopi, circo)
- Large graph support with sfdp algorithm
- Dependency visualization
- Custom node and edge styling
- Subgraph and cluster support

## Target Processes

- microservices-decomposition
- ddd-strategic-modeling
- observability-implementation

## Input Schema

```json
{
  "type": "object",
  "required": ["source"],
  "properties": {
    "source": {
      "type": "string",
      "description": "DOT graph definition"
    },
    "outputFormat": {
      "type": "string",
      "enum": ["png", "svg", "pdf", "ps"],
      "default": "svg"
    },
    "outputPath": {
      "type": "string",
      "description": "Output file path"
    },
    "layout": {
      "type": "string",
      "enum": ["dot", "neato", "fdp", "sfdp", "twopi", "circo"],
      "default": "dot",
      "description": "Layout algorithm"
    },
    "config": {
      "type": "object",
      "properties": {
        "dpi": {
          "type": "number",
          "default": 96
        },
        "rankdir": {
          "type": "string",
          "enum": ["TB", "BT", "LR", "RL"],
          "default": "TB"
        }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "outputPath": {
      "type": "string",
      "description": "Path to rendered image"
    },
    "format": {
      "type": "string"
    },
    "nodeCount": {
      "type": "number"
    },
    "edgeCount": {
      "type": "number"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'graphviz-renderer',
    context: {
      source: 'digraph G { A -> B -> C; A -> C; }',
      outputFormat: 'svg',
      outputPath: 'docs/diagrams/dependencies.svg',
      layout: 'dot'
    }
  }
}
```
