---
name: dependency-graph-generator
description: Generate module dependency graphs with circular dependency detection and coupling metrics
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
---

# Dependency Graph Generator Skill

## Overview

Generates module dependency graphs with circular dependency identification, coupling metrics calculation, and visualization output in Graphviz or D3 formats.

## Capabilities

- Generate module dependency graphs
- Identify circular dependencies
- Calculate coupling metrics (afferent, efferent)
- Calculate instability metrics
- Visualize dependencies (Graphviz, D3)
- Package/module level analysis
- External dependency tracking

## Target Processes

- microservices-decomposition
- refactoring-plan
- migration-strategy

## Input Schema

```json
{
  "type": "object",
  "required": ["entryPoints"],
  "properties": {
    "entryPoints": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Entry point files or directories"
    },
    "outputFormat": {
      "type": "string",
      "enum": ["dot", "json", "d3", "mermaid"],
      "default": "dot"
    },
    "outputPath": {
      "type": "string",
      "description": "Output file path"
    },
    "options": {
      "type": "object",
      "properties": {
        "depth": {
          "type": "number",
          "default": -1,
          "description": "Maximum depth (-1 for unlimited)"
        },
        "includeExternal": {
          "type": "boolean",
          "default": false
        },
        "groupByPackage": {
          "type": "boolean",
          "default": true
        },
        "detectCircular": {
          "type": "boolean",
          "default": true
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
    "graph": {
      "type": "object",
      "properties": {
        "nodes": { "type": "array" },
        "edges": { "type": "array" }
      }
    },
    "circularDependencies": {
      "type": "array",
      "items": {
        "type": "array",
        "items": { "type": "string" }
      }
    },
    "metrics": {
      "type": "object",
      "properties": {
        "totalModules": { "type": "number" },
        "totalDependencies": { "type": "number" },
        "averageCoupling": { "type": "number" }
      }
    },
    "outputPath": {
      "type": "string"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'dependency-graph-generator',
    context: {
      entryPoints: ['src/index.ts'],
      outputFormat: 'dot',
      outputPath: 'docs/dependencies.dot',
      options: {
        groupByPackage: true,
        detectCircular: true
      }
    }
  }
}
```
