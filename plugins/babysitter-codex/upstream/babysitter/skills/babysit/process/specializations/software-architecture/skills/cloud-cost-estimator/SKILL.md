---
name: cloud-cost-estimator
description: Estimate cloud costs across AWS, Azure, and GCP with pricing comparison
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Cloud Cost Estimator Skill

## Overview

Estimates cloud costs across AWS, Azure, and GCP with provider comparison, reserved instance recommendations, and savings plan analysis.

## Capabilities

- Estimate cloud costs (AWS, Azure, GCP)
- Compare pricing across providers
- Reserved instance recommendations
- Savings plan analysis
- Spot instance cost modeling
- Cost breakdown by service
- Integration with Infracost for IaC

## Target Processes

- cloud-architecture-design
- iac-review
- migration-strategy

## Input Schema

```json
{
  "type": "object",
  "required": ["resources"],
  "properties": {
    "resources": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "provider": { "type": "string" },
          "specs": { "type": "object" },
          "quantity": { "type": "number" }
        }
      }
    },
    "providers": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["aws", "azure", "gcp"]
      },
      "default": ["aws"]
    },
    "options": {
      "type": "object",
      "properties": {
        "region": {
          "type": "string",
          "default": "us-east-1"
        },
        "currency": {
          "type": "string",
          "default": "USD"
        },
        "includeReserved": {
          "type": "boolean",
          "default": true
        },
        "duration": {
          "type": "string",
          "enum": ["hourly", "monthly", "yearly"],
          "default": "monthly"
        }
      }
    },
    "iacPath": {
      "type": "string",
      "description": "Path to IaC files for Infracost analysis"
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "estimates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "provider": { "type": "string" },
          "totalCost": { "type": "number" },
          "breakdown": { "type": "array" }
        }
      }
    },
    "comparison": {
      "type": "object",
      "properties": {
        "cheapest": { "type": "string" },
        "savings": { "type": "number" }
      }
    },
    "recommendations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "potentialSavings": { "type": "number" },
          "description": { "type": "string" }
        }
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
    name: 'cloud-cost-estimator',
    context: {
      resources: [
        { type: 'ec2', provider: 'aws', specs: { instanceType: 'm5.large' }, quantity: 5 }
      ],
      providers: ['aws', 'azure', 'gcp'],
      options: {
        region: 'us-east-1',
        includeReserved: true
      }
    }
  }
}
```
