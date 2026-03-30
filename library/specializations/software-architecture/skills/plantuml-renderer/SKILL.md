---
name: plantuml-renderer
description: Render PlantUML diagrams to various image formats with theme and styling support
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# PlantUML Renderer Skill

## Overview

Renders PlantUML source files to images supporting sequence, class, component, and deployment diagrams with custom themes and batch processing.

## Capabilities

- Render PlantUML to PNG, SVG, PDF, and EPS formats
- Support sequence, class, component, deployment, activity, and state diagrams
- Apply custom themes and styling
- Batch rendering of multiple diagrams
- Generate image maps for interactive diagrams
- Support PlantUML preprocessor directives

## Target Processes

- c4-model-documentation
- ddd-strategic-modeling
- event-storming
- data-architecture-design

## Input Schema

```json
{
  "type": "object",
  "required": ["source"],
  "properties": {
    "source": {
      "type": "string",
      "description": "PlantUML source code or file path"
    },
    "outputFormat": {
      "type": "string",
      "enum": ["png", "svg", "pdf", "eps"],
      "default": "png"
    },
    "outputPath": {
      "type": "string",
      "description": "Output file path"
    },
    "theme": {
      "type": "string",
      "description": "PlantUML theme name (e.g., 'cerulean', 'superhero')"
    },
    "config": {
      "type": "object",
      "properties": {
        "skinParams": {
          "type": "object",
          "description": "PlantUML skinparam settings"
        },
        "scale": {
          "type": "number",
          "default": 1
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
    },
    "metadata": {
      "type": "object"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'plantuml-renderer',
    context: {
      source: '@startuml\nAlice -> Bob: Hello\n@enduml',
      outputFormat: 'svg',
      outputPath: 'docs/diagrams/sequence.svg',
      theme: 'cerulean'
    }
  }
}
```
