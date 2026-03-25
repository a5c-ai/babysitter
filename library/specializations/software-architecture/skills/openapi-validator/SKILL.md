---
name: openapi-validator
description: Validate OpenAPI specifications for correctness, security, and best practices
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# OpenAPI Validator Skill

## Overview

Validates OpenAPI specifications for correctness, security definitions, best practices compliance, and breaking change detection between versions.

## Capabilities

- Validate OpenAPI 3.0/3.1 specifications
- Check security definitions completeness
- Lint for API design best practices
- Compare specification versions
- Detect breaking changes between versions
- Custom rule configuration
- Integration with Spectral and other linters

## Target Processes

- api-design-specification
- system-design-review

## Input Schema

```json
{
  "type": "object",
  "required": ["specPath"],
  "properties": {
    "specPath": {
      "type": "string",
      "description": "Path to OpenAPI specification file"
    },
    "mode": {
      "type": "string",
      "enum": ["validate", "lint", "compare", "security"],
      "default": "validate"
    },
    "compareWith": {
      "type": "string",
      "description": "Path to previous spec version for comparison"
    },
    "rules": {
      "type": "object",
      "properties": {
        "ruleset": {
          "type": "string",
          "enum": ["spectral:oas", "custom"],
          "default": "spectral:oas"
        },
        "severity": {
          "type": "string",
          "enum": ["error", "warn", "info"],
          "default": "warn"
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
    "valid": {
      "type": "boolean"
    },
    "errors": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "message": { "type": "string" },
          "severity": { "type": "string" }
        }
      }
    },
    "warnings": {
      "type": "array"
    },
    "breakingChanges": {
      "type": "array",
      "description": "List of breaking changes when comparing"
    },
    "securityIssues": {
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
    name: 'openapi-validator',
    context: {
      specPath: 'api/openapi.yaml',
      mode: 'lint',
      rules: {
        ruleset: 'spectral:oas',
        severity: 'warn'
      }
    }
  }
}
```
