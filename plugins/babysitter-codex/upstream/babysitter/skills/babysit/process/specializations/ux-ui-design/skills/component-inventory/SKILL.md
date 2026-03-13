---
name: component-inventory
description: Audit and inventory existing UI components in a codebase
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Component Inventory Skill

## Purpose

Scan codebases to audit and inventory existing UI components, identifying variations, usage patterns, and opportunities for consolidation.

## Capabilities

- Scan codebase for React/Vue/Angular components
- Identify component variations and duplicates
- Map component usage across the application
- Generate comprehensive inventory reports
- Detect inconsistencies in component implementations
- Track component dependencies

## Target Processes

- component-library.js
- design-system.js

## Integration Points

- React component analysis via AST parsing
- Vue SFC analysis
- TypeScript/JavaScript AST parsing
- CSS-in-JS detection

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "scanPath": {
      "type": "string",
      "description": "Root path to scan for components"
    },
    "framework": {
      "type": "string",
      "enum": ["react", "vue", "angular", "svelte", "auto"],
      "default": "auto"
    },
    "patterns": {
      "type": "array",
      "items": { "type": "string" },
      "default": ["**/*.tsx", "**/*.jsx", "**/*.vue"]
    },
    "excludePaths": {
      "type": "array",
      "items": { "type": "string" },
      "default": ["node_modules", "dist", "build"]
    },
    "analyzeProps": {
      "type": "boolean",
      "default": true
    },
    "detectDuplicates": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["scanPath"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "components": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "path": { "type": "string" },
          "props": { "type": "array" },
          "usageCount": { "type": "number" }
        }
      }
    },
    "duplicates": {
      "type": "array",
      "description": "Similar or duplicate components"
    },
    "variations": {
      "type": "object",
      "description": "Component variations grouped by type"
    },
    "usageMap": {
      "type": "object",
      "description": "Component usage locations"
    },
    "statistics": {
      "type": "object",
      "properties": {
        "totalComponents": { "type": "number" },
        "uniqueComponents": { "type": "number" },
        "averagePropsCount": { "type": "number" }
      }
    },
    "recommendations": {
      "type": "array",
      "description": "Consolidation recommendations"
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  scanPath: './src',
  framework: 'react',
  patterns: ['**/*.tsx', '**/*.jsx'],
  detectDuplicates: true
});
```
