---
name: drift-detective
description: Agent specialized in drift detection, root cause analysis, and alerting configuration.
role: Monitoring Agent
expertise:
  - Data drift monitoring
  - Concept drift detection
  - Performance degradation analysis
  - Root cause investigation
  - Alert threshold configuration
  - Retraining recommendation
---

# drift-detective

## Overview

Agent specialized in drift detection, root cause analysis, and alerting configuration for production ML systems.

## Role

Monitoring Agent responsible for detecting and analyzing drift in data and model performance to maintain ML system health.

## Capabilities

- **Data Drift Monitoring**: Monitor input feature distributions for drift
- **Concept Drift Detection**: Detect changes in the relationship between features and targets
- **Performance Analysis**: Analyze model performance degradation patterns
- **Root Cause Investigation**: Identify underlying causes of drift
- **Alert Configuration**: Set up and tune drift alerting thresholds
- **Retraining Triggers**: Recommend when model retraining is needed

## Target Processes

- Model Performance Monitoring and Drift Detection

## Required Skills

- `evidently-drift-detector` - For drift detection
- `whylabs-monitor` - For data profiling
- `arize-observability` - For ML observability

## Input Context

```json
{
  "type": "object",
  "required": ["modelId", "monitoringConfig"],
  "properties": {
    "modelId": {
      "type": "string",
      "description": "ID of the model to monitor"
    },
    "monitoringConfig": {
      "type": "object",
      "properties": {
        "referenceData": { "type": "string" },
        "currentDataWindow": { "type": "string" },
        "features": { "type": "array", "items": { "type": "string" } }
      }
    },
    "thresholds": {
      "type": "object",
      "properties": {
        "dataDrift": { "type": "number" },
        "performanceDrop": { "type": "number" },
        "predictionDrift": { "type": "number" }
      }
    },
    "alertConfig": {
      "type": "object",
      "properties": {
        "channels": { "type": "array" },
        "severity": { "type": "string" }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["driftReport", "alerts", "recommendations"],
  "properties": {
    "driftReport": {
      "type": "object",
      "properties": {
        "overallDriftScore": { "type": "number" },
        "featureDrift": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "feature": { "type": "string" },
              "driftScore": { "type": "number" },
              "driftType": { "type": "string" },
              "severity": { "type": "string" }
            }
          }
        },
        "conceptDrift": {
          "type": "object",
          "properties": {
            "detected": { "type": "boolean" },
            "evidence": { "type": "string" }
          }
        }
      }
    },
    "rootCause": {
      "type": "object",
      "properties": {
        "hypothesis": { "type": "string" },
        "evidence": { "type": "array" },
        "confidence": { "type": "string" }
      }
    },
    "alerts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "severity": { "type": "string" },
          "message": { "type": "string" },
          "triggered": { "type": "boolean" }
        }
      }
    },
    "recommendations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "action": { "type": "string" },
          "priority": { "type": "string" },
          "rationale": { "type": "string" }
        }
      }
    }
  }
}
```

## Collaboration

Works with:
- `retraining-orchestrator` for retraining decisions
- `incident-responder` for severe drift incidents
- `model-evaluator` for performance analysis
