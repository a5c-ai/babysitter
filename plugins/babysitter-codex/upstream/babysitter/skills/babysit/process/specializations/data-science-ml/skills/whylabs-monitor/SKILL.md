---
name: whylabs-monitor
description: WhyLabs integration skill for ML observability, profile logging, and anomaly detection.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# whylabs-monitor

## Overview

WhyLabs integration skill for ML observability, data profile logging, and anomaly detection in production ML systems.

## Capabilities

- Data profile generation (whylogs)
- Profile upload to WhyLabs platform
- Anomaly detection and alerts
- Segment analysis for data subsets
- Performance monitoring dashboards
- Integration with ML pipelines
- Historical profile comparison
- Custom constraint validation

## Target Processes

- Model Performance Monitoring and Drift Detection
- ML System Observability and Incident Response

## Tools and Libraries

- whylogs
- WhyLabs Platform
- pandas

## Input Schema

```json
{
  "type": "object",
  "required": ["action"],
  "properties": {
    "action": {
      "type": "string",
      "enum": ["profile", "upload", "compare", "validate", "alert-config"],
      "description": "WhyLabs action to perform"
    },
    "profileConfig": {
      "type": "object",
      "properties": {
        "dataPath": { "type": "string" },
        "datasetId": { "type": "string" },
        "segments": { "type": "array", "items": { "type": "string" } },
        "timestamp": { "type": "string" }
      }
    },
    "uploadConfig": {
      "type": "object",
      "properties": {
        "orgId": { "type": "string" },
        "modelId": { "type": "string" },
        "profilePath": { "type": "string" }
      }
    },
    "compareConfig": {
      "type": "object",
      "properties": {
        "baselineProfile": { "type": "string" },
        "targetProfile": { "type": "string" },
        "metrics": { "type": "array", "items": { "type": "string" } }
      }
    },
    "validationConfig": {
      "type": "object",
      "properties": {
        "constraints": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "column": { "type": "string" },
              "constraint": { "type": "string" },
              "value": { "type": "number" }
            }
          }
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
  "required": ["status", "action"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error", "warning"]
    },
    "action": {
      "type": "string"
    },
    "profilePath": {
      "type": "string"
    },
    "uploadId": {
      "type": "string"
    },
    "dashboardUrl": {
      "type": "string"
    },
    "comparison": {
      "type": "object",
      "properties": {
        "driftScore": { "type": "number" },
        "driftedFeatures": { "type": "array", "items": { "type": "string" } },
        "alerts": { "type": "array" }
      }
    },
    "validation": {
      "type": "object",
      "properties": {
        "passed": { "type": "boolean" },
        "failures": { "type": "array" }
      }
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Profile and upload production data',
  skill: {
    name: 'whylabs-monitor',
    context: {
      action: 'profile',
      profileConfig: {
        dataPath: 'data/production_batch.parquet',
        datasetId: 'fraud-detection',
        segments: ['region', 'customer_type'],
        timestamp: '2024-01-15T00:00:00Z'
      },
      uploadConfig: {
        orgId: 'org-123',
        modelId: 'model-fraud-v2'
      }
    }
  }
}
```
