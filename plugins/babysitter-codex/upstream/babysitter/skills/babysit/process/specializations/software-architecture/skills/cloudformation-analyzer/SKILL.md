---
name: cloudformation-analyzer
description: Validate and analyze AWS CloudFormation templates for security and best practices
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# CloudFormation Analyzer Skill

## Overview

Validates and analyzes AWS CloudFormation templates including security scanning with cfn-nag, resource dependency analysis, and cost estimation.

## Capabilities

- Validate CloudFormation templates
- Security scanning (cfn-nag)
- Resource dependency analysis
- Cost estimation
- Best practice linting
- Drift detection support
- Stack change set analysis

## Target Processes

- iac-review
- cloud-architecture-design

## Input Schema

```json
{
  "type": "object",
  "required": ["templatePath"],
  "properties": {
    "templatePath": {
      "type": "string",
      "description": "Path to CloudFormation template"
    },
    "mode": {
      "type": "string",
      "enum": ["validate", "security", "cost", "all"],
      "default": "all"
    },
    "options": {
      "type": "object",
      "properties": {
        "parametersFile": {
          "type": "string",
          "description": "Path to parameters file"
        },
        "region": {
          "type": "string",
          "default": "us-east-1"
        },
        "failOnWarning": {
          "type": "boolean",
          "default": false
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
    "resources": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "logicalId": { "type": "string" },
          "type": { "type": "string" },
          "dependencies": { "type": "array" }
        }
      }
    },
    "securityFindings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "rule": { "type": "string" },
          "severity": { "type": "string" },
          "resource": { "type": "string" },
          "message": { "type": "string" }
        }
      }
    },
    "estimatedCost": {
      "type": "object",
      "properties": {
        "monthly": { "type": "number" },
        "breakdown": { "type": "array" }
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
    name: 'cloudformation-analyzer',
    context: {
      templatePath: 'infrastructure/main.yaml',
      mode: 'all',
      options: {
        region: 'us-east-1'
      }
    }
  }
}
```
