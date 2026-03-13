---
name: arize-observability
description: Arize AI skill for production ML monitoring, embedding drift, and performance analysis.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# arize-observability

## Overview

Arize AI skill for production ML monitoring, embedding drift detection, and comprehensive performance analysis.

## Capabilities

- Production data logging
- Embedding drift detection for NLP/CV models
- Performance monitoring dashboards
- Root cause analysis
- Slice and dice analysis for segments
- Bias monitoring
- A/B test monitoring
- Custom metrics and monitors

## Target Processes

- Model Performance Monitoring and Drift Detection
- ML System Observability and Incident Response
- Model Evaluation and Validation Framework

## Tools and Libraries

- Arize AI SDK
- pandas
- numpy

## Input Schema

```json
{
  "type": "object",
  "required": ["action"],
  "properties": {
    "action": {
      "type": "string",
      "enum": ["log", "monitor", "analyze", "alert-config", "compare"],
      "description": "Arize action to perform"
    },
    "logConfig": {
      "type": "object",
      "properties": {
        "modelId": { "type": "string" },
        "modelVersion": { "type": "string" },
        "modelType": { "type": "string", "enum": ["score_categorical", "regression", "ranking"] },
        "environment": { "type": "string", "enum": ["training", "validation", "production"] },
        "dataPath": { "type": "string" },
        "predictionIdColumn": { "type": "string" },
        "timestampColumn": { "type": "string" },
        "featureColumns": { "type": "array", "items": { "type": "string" } },
        "embeddingColumns": { "type": "array", "items": { "type": "string" } },
        "predictionColumn": { "type": "string" },
        "actualColumn": { "type": "string" }
      }
    },
    "monitorConfig": {
      "type": "object",
      "properties": {
        "metrics": { "type": "array", "items": { "type": "string" } },
        "thresholds": { "type": "object" },
        "schedule": { "type": "string" }
      }
    },
    "analysisConfig": {
      "type": "object",
      "properties": {
        "analysisType": { "type": "string", "enum": ["drift", "performance", "fairness", "data_quality"] },
        "timeRange": { "type": "object" },
        "segments": { "type": "array", "items": { "type": "string" } }
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
      "enum": ["success", "error"]
    },
    "action": {
      "type": "string"
    },
    "logId": {
      "type": "string"
    },
    "dashboardUrl": {
      "type": "string"
    },
    "analysis": {
      "type": "object",
      "properties": {
        "overallScore": { "type": "number" },
        "driftMetrics": { "type": "object" },
        "performanceMetrics": { "type": "object" },
        "topIssues": { "type": "array" },
        "recommendations": { "type": "array", "items": { "type": "string" } }
      }
    },
    "alerts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "severity": { "type": "string" },
          "triggered": { "type": "boolean" }
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
  title: 'Log production predictions to Arize',
  skill: {
    name: 'arize-observability',
    context: {
      action: 'log',
      logConfig: {
        modelId: 'fraud-detector',
        modelVersion: '2.0.0',
        modelType: 'score_categorical',
        environment: 'production',
        dataPath: 'data/production_predictions.parquet',
        predictionIdColumn: 'request_id',
        timestampColumn: 'timestamp',
        featureColumns: ['amount', 'merchant_category', 'hour'],
        predictionColumn: 'fraud_probability',
        actualColumn: 'is_fraud'
      }
    }
  }
}
```
