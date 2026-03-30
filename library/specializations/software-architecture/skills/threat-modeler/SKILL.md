---
name: threat-modeler
description: Generate threat models using STRIDE, PASTA, or VAST methodologies
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Threat Modeler Skill

## Overview

Generates threat models using STRIDE, PASTA, or VAST methodologies with attack tree generation, data flow diagram analysis, and threat prioritization using DREAD.

## Capabilities

- Generate STRIDE threat models
- PASTA methodology support
- VAST methodology support
- Attack tree generation
- Data flow diagram analysis
- Threat prioritization (DREAD)
- Microsoft Threat Modeling Tool integration
- Mitigation recommendations

## Target Processes

- security-architecture-review
- api-design-specification

## Input Schema

```json
{
  "type": "object",
  "required": ["system"],
  "properties": {
    "system": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "description": { "type": "string" },
        "dataFlows": { "type": "array" },
        "assets": { "type": "array" },
        "trustBoundaries": { "type": "array" },
        "externalEntities": { "type": "array" }
      }
    },
    "methodology": {
      "type": "string",
      "enum": ["STRIDE", "PASTA", "VAST"],
      "default": "STRIDE"
    },
    "options": {
      "type": "object",
      "properties": {
        "prioritization": {
          "type": "string",
          "enum": ["DREAD", "CVSS", "custom"],
          "default": "DREAD"
        },
        "generateAttackTrees": {
          "type": "boolean",
          "default": true
        },
        "outputFormat": {
          "type": "string",
          "enum": ["json", "markdown", "html"],
          "default": "markdown"
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
    "threats": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "category": { "type": "string" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "affectedAssets": { "type": "array" },
          "riskScore": { "type": "number" },
          "mitigations": { "type": "array" }
        }
      }
    },
    "attackTrees": {
      "type": "array"
    },
    "dataFlowDiagram": {
      "type": "string",
      "description": "DFD in specified format"
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalThreats": { "type": "number" },
        "byCategory": { "type": "object" },
        "bySeverity": { "type": "object" }
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
    name: 'threat-modeler',
    context: {
      system: {
        name: 'E-Commerce Platform',
        assets: ['User Data', 'Payment Info', 'Inventory'],
        trustBoundaries: ['DMZ', 'Internal Network'],
        dataFlows: [
          { from: 'User', to: 'Web Server', data: 'Credentials' }
        ]
      },
      methodology: 'STRIDE',
      options: {
        prioritization: 'DREAD',
        generateAttackTrees: true
      }
    }
  }
}
```
