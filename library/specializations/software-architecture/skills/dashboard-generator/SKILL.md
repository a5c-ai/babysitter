---
name: dashboard-generator
description: Generate monitoring dashboards for Grafana and DataDog with alert integration
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Dashboard Generator Skill

## Overview

Generates monitoring dashboards for Grafana and DataDog from JSON/YAML definitions with panel configuration and alert rule integration.

## Capabilities

- Generate Grafana dashboards from JSON/YAML
- DataDog dashboard creation
- Panel configuration and templates
- Alert rule integration
- Variable templating
- Annotation support
- Dashboard versioning
- Row and panel layouts

## Target Processes

- observability-implementation
- performance-optimization
- resilience-patterns

## Input Schema

```json
{
  "type": "object",
  "required": ["dashboards"],
  "properties": {
    "dashboards": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "type": { "type": "string", "enum": ["service", "infrastructure", "business", "slo"] },
          "metrics": { "type": "array" },
          "panels": { "type": "array" }
        }
      }
    },
    "platform": {
      "type": "string",
      "enum": ["grafana", "datadog", "cloudwatch"],
      "default": "grafana"
    },
    "options": {
      "type": "object",
      "properties": {
        "datasource": {
          "type": "string",
          "default": "prometheus"
        },
        "refreshInterval": {
          "type": "string",
          "default": "30s"
        },
        "timeRange": {
          "type": "string",
          "default": "6h"
        },
        "includeAlerts": {
          "type": "boolean",
          "default": true
        },
        "variables": {
          "type": "array"
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
    "dashboards": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "uid": { "type": "string" },
          "json": { "type": "object" },
          "path": { "type": "string" }
        }
      }
    },
    "alerts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "condition": { "type": "string" },
          "threshold": { "type": "number" }
        }
      }
    },
    "variables": {
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
    name: 'dashboard-generator',
    context: {
      dashboards: [
        {
          name: 'API Service Overview',
          type: 'service',
          metrics: ['http_requests_total', 'http_request_duration_seconds'],
          panels: [
            { type: 'graph', title: 'Request Rate' },
            { type: 'stat', title: 'Error Rate' }
          ]
        }
      ],
      platform: 'grafana',
      options: {
        datasource: 'prometheus',
        includeAlerts: true
      }
    }
  }
}
```
