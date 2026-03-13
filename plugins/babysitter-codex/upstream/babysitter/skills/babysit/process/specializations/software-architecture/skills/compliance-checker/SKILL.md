---
name: compliance-checker
description: Check compliance with SOC 2, GDPR, HIPAA, and PCI-DSS standards
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Compliance Checker Skill

## Overview

Checks compliance with SOC 2, GDPR, HIPAA, and PCI-DSS standards by analyzing code, configuration, and infrastructure for regulatory requirements.

## Capabilities

- SOC 2 compliance checking
- GDPR requirement validation
- HIPAA compliance assessment
- PCI-DSS validation
- Custom compliance framework support
- Evidence collection
- Gap analysis reporting
- Remediation guidance

## Target Processes

- security-architecture-review
- iac-review
- data-architecture-design

## Input Schema

```json
{
  "type": "object",
  "required": ["frameworks", "targets"],
  "properties": {
    "frameworks": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["soc2", "gdpr", "hipaa", "pci-dss", "iso27001", "nist"]
      }
    },
    "targets": {
      "type": "object",
      "properties": {
        "code": { "type": "array" },
        "infrastructure": { "type": "array" },
        "documentation": { "type": "array" }
      }
    },
    "options": {
      "type": "object",
      "properties": {
        "scope": {
          "type": "array",
          "description": "Specific controls to check"
        },
        "collectEvidence": {
          "type": "boolean",
          "default": true
        },
        "outputFormat": {
          "type": "string",
          "enum": ["json", "markdown", "pdf"],
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
    "frameworks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "complianceScore": { "type": "number" },
          "controls": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "name": { "type": "string" },
                "status": { "type": "string" },
                "findings": { "type": "array" },
                "evidence": { "type": "array" }
              }
            }
          }
        }
      }
    },
    "gaps": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "control": { "type": "string" },
          "gap": { "type": "string" },
          "remediation": { "type": "string" },
          "priority": { "type": "string" }
        }
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "overallScore": { "type": "number" },
        "passedControls": { "type": "number" },
        "failedControls": { "type": "number" },
        "notApplicable": { "type": "number" }
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
    name: 'compliance-checker',
    context: {
      frameworks: ['soc2', 'gdpr'],
      targets: {
        code: ['src/**/*.ts'],
        infrastructure: ['terraform/**/*.tf'],
        documentation: ['docs/security/**/*.md']
      },
      options: {
        collectEvidence: true,
        outputFormat: 'markdown'
      }
    }
  }
}
```
