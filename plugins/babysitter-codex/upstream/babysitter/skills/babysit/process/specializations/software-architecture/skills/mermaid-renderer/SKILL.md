---
name: mermaid-renderer
description: Render Mermaid diagrams to images with theme customization and Markdown integration
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Mermaid Diagram Renderer Skill

## Overview

Renders Mermaid diagram definitions to images supporting flowcharts, sequence diagrams, class diagrams, ER diagrams, and more with theme customization.

## Capabilities

- Render Mermaid to PNG, SVG, PDF formats
- Support flowcharts, sequence, class, ER, Gantt, pie, journey diagrams
- Theme customization (default, dark, forest, neutral)
- Integration with Markdown documentation
- Background color and styling options
- Puppeteer-based rendering for high quality

## Target Processes

- c4-model-documentation
- microservices-decomposition
- data-architecture-design

## Input Schema

```json
{
  "type": "object",
  "required": ["source"],
  "properties": {
    "source": {
      "type": "string",
      "description": "Mermaid diagram definition"
    },
    "outputFormat": {
      "type": "string",
      "enum": ["png", "svg", "pdf"],
      "default": "svg"
    },
    "outputPath": {
      "type": "string",
      "description": "Output file path"
    },
    "theme": {
      "type": "string",
      "enum": ["default", "dark", "forest", "neutral"],
      "default": "default"
    },
    "config": {
      "type": "object",
      "properties": {
        "backgroundColor": {
          "type": "string",
          "default": "white"
        },
        "width": {
          "type": "number"
        },
        "height": {
          "type": "number"
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
    "dimensions": {
      "type": "object",
      "properties": {
        "width": { "type": "number" },
        "height": { "type": "number" }
      }
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'mermaid-renderer',
    context: {
      source: 'graph TD\n  A[Start] --> B[Process]\n  B --> C[End]',
      outputFormat: 'svg',
      outputPath: 'docs/diagrams/flow.svg',
      theme: 'default'
    }
  }
}
```
