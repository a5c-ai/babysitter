---
name: static-analysis-runner
description: Run static analysis tools including SonarQube, ESLint, and multi-language linters
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Static Analysis Runner Skill

## Overview

Runs static analysis tools including SonarQube, ESLint/TSLint, and multi-language linters with custom rule configuration and report aggregation.

## Capabilities

- Run SonarQube analysis
- Execute ESLint/TSLint
- Multi-language support
- Custom rule configuration
- Report aggregation
- Quality gate evaluation
- Trend analysis

## Target Processes

- refactoring-plan
- security-architecture-review
- performance-optimization

## Input Schema

```json
{
  "type": "object",
  "required": ["paths"],
  "properties": {
    "paths": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Paths to analyze"
    },
    "tools": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["sonarqube", "eslint", "tslint", "pylint", "rubocop", "checkstyle"]
      },
      "default": ["eslint"]
    },
    "config": {
      "type": "object",
      "properties": {
        "configFile": {
          "type": "string",
          "description": "Path to linter config file"
        },
        "rules": {
          "type": "object",
          "description": "Rule overrides"
        },
        "fix": {
          "type": "boolean",
          "default": false
        }
      }
    },
    "qualityGate": {
      "type": "object",
      "properties": {
        "maxErrors": { "type": "number" },
        "maxWarnings": { "type": "number" }
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
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "tool": { "type": "string" },
          "files": { "type": "array" },
          "errors": { "type": "number" },
          "warnings": { "type": "number" }
        }
      }
    },
    "qualityGatePassed": {
      "type": "boolean"
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalErrors": { "type": "number" },
        "totalWarnings": { "type": "number" },
        "filesAnalyzed": { "type": "number" }
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
    name: 'static-analysis-runner',
    context: {
      paths: ['src/**/*.ts'],
      tools: ['eslint'],
      config: {
        configFile: '.eslintrc.js',
        fix: false
      },
      qualityGate: {
        maxErrors: 0,
        maxWarnings: 10
      }
    }
  }
}
```
