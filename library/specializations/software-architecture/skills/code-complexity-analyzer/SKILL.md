---
name: code-complexity-analyzer
description: Analyze code complexity metrics including cyclomatic complexity, code smells, and technical debt
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
---

# Code Complexity Analyzer Skill

## Overview

Analyzes code complexity metrics including cyclomatic complexity, cognitive complexity, code smells, duplicate code detection, and technical debt scoring.

## Capabilities

- Calculate cyclomatic complexity
- Calculate cognitive complexity
- Identify code smells
- Dependency analysis
- Duplicate code detection
- Technical debt scoring
- Maintainability index calculation
- Lines of code metrics

## Target Processes

- refactoring-plan
- performance-optimization
- system-design-review

## Input Schema

```json
{
  "type": "object",
  "required": ["paths"],
  "properties": {
    "paths": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Paths to analyze (supports glob patterns)"
    },
    "metrics": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["cyclomatic", "cognitive", "loc", "dependencies", "duplicates", "maintainability"]
      },
      "default": ["cyclomatic", "cognitive", "loc"]
    },
    "thresholds": {
      "type": "object",
      "properties": {
        "cyclomatic": { "type": "number", "default": 10 },
        "cognitive": { "type": "number", "default": 15 },
        "duplicateLines": { "type": "number", "default": 6 }
      }
    },
    "languages": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Languages to analyze"
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "metrics": {
            "type": "object",
            "properties": {
              "cyclomatic": { "type": "number" },
              "cognitive": { "type": "number" },
              "loc": { "type": "number" },
              "maintainability": { "type": "number" }
            }
          },
          "violations": { "type": "array" }
        }
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalFiles": { "type": "number" },
        "averageComplexity": { "type": "number" },
        "technicalDebtScore": { "type": "number" },
        "hotspots": { "type": "array" }
      }
    },
    "duplicates": {
      "type": "array"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'code-complexity-analyzer',
    context: {
      paths: ['src/**/*.ts'],
      metrics: ['cyclomatic', 'cognitive', 'loc', 'dependencies'],
      thresholds: { cyclomatic: 10, cognitive: 15 }
    }
  }
}
```
