---
name: metrics-schema-generator
description: Generate metrics schemas for Prometheus, OpenTelemetry, and Grafana dashboards
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Metrics Schema Generator Skill

## Overview

Generates metrics schemas for Prometheus, OpenTelemetry metric definitions, SLI/SLO specifications, and Grafana dashboard configurations.

## Capabilities

- Generate Prometheus metrics schemas
- OpenTelemetry metric definitions
- SLI/SLO specification generation
- Grafana dashboard generation
- Metric naming conventions
- Label/tag standardization
- Recording rules generation
- Alert rules generation

## Target Processes

- observability-implementation
- performance-optimization

## Input Schema

```json
{
  "type": "object",
  "required": ["services"],
  "properties": {
    "services": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "type": { "type": "string" },
          "endpoints": { "type": "array" },
          "slos": { "type": "array" }
        }
      }
    },
    "format": {
      "type": "string",
      "enum": ["prometheus", "opentelemetry", "both"],
      "default": "prometheus"
    },
    "options": {
      "type": "object",
      "properties": {
        "includeStandardMetrics": {
          "type": "boolean",
          "default": true
        },
        "generateDashboards": {
          "type": "boolean",
          "default": true
        },
        "generateAlerts": {
          "type": "boolean",
          "default": true
        },
        "namingConvention": {
          "type": "string",
          "enum": ["prometheus", "opentelemetry"],
          "default": "prometheus"
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
    "metrics": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "type": { "type": "string" },
          "description": { "type": "string" },
          "labels": { "type": "array" },
          "unit": { "type": "string" }
        }
      }
    },
    "sloDefinitions": {
      "type": "array"
    },
    "recordingRules": {
      "type": "string",
      "description": "Prometheus recording rules YAML"
    },
    "alertRules": {
      "type": "string",
      "description": "Prometheus alert rules YAML"
    },
    "dashboards": {
      "type": "array",
      "description": "Grafana dashboard JSON definitions"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'metrics-schema-generator',
    context: {
      services: [
        {
          name: 'api-gateway',
          type: 'http',
          endpoints: ['/api/users', '/api/orders'],
          slos: [{ name: 'availability', target: 99.9 }]
        }
      ],
      format: 'prometheus',
      options: {
        generateDashboards: true,
        generateAlerts: true
      }
    }
  }
}
```
