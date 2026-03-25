---
name: kubeflow-pipeline-executor
description: Kubeflow Pipelines skill for ML workflow orchestration, component management, and Kubernetes-native ML.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# kubeflow-pipeline-executor

## Overview

Kubeflow Pipelines skill for ML workflow orchestration, component management, and Kubernetes-native ML operations.

## Capabilities

- Pipeline definition and compilation
- Component creation and reuse
- Pipeline versioning
- Artifact tracking and lineage
- Kubernetes resource management
- Pipeline scheduling and triggering
- Caching for component outputs
- Visualization of pipeline runs

## Target Processes

- Model Training Pipeline
- Distributed Training Orchestration
- Model Deployment Pipeline
- ML Model Retraining Pipeline

## Tools and Libraries

- Kubeflow Pipelines
- KFP SDK (v2)
- Kubernetes
- Argo Workflows

## Input Schema

```json
{
  "type": "object",
  "required": ["action"],
  "properties": {
    "action": {
      "type": "string",
      "enum": ["compile", "run", "schedule", "list", "get-run", "delete"],
      "description": "KFP action to perform"
    },
    "pipelinePath": {
      "type": "string",
      "description": "Path to pipeline definition file"
    },
    "pipelineConfig": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "description": { "type": "string" },
        "parameters": { "type": "object" }
      }
    },
    "runConfig": {
      "type": "object",
      "properties": {
        "experimentName": { "type": "string" },
        "runName": { "type": "string" },
        "arguments": { "type": "object" }
      }
    },
    "scheduleConfig": {
      "type": "object",
      "properties": {
        "cron": { "type": "string" },
        "maxConcurrency": { "type": "integer" },
        "enabled": { "type": "boolean" }
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
      "enum": ["success", "error", "running"]
    },
    "action": {
      "type": "string"
    },
    "pipelineId": {
      "type": "string"
    },
    "runId": {
      "type": "string"
    },
    "runStatus": {
      "type": "string",
      "enum": ["pending", "running", "succeeded", "failed", "skipped"]
    },
    "artifacts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "uri": { "type": "string" },
          "type": { "type": "string" }
        }
      }
    },
    "dashboardUrl": {
      "type": "string"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Run ML training pipeline',
  skill: {
    name: 'kubeflow-pipeline-executor',
    context: {
      action: 'run',
      pipelinePath: 'pipelines/training_pipeline.py',
      runConfig: {
        experimentName: 'model-training',
        runName: 'training-run-v1',
        arguments: {
          dataPath: 'gs://bucket/data',
          modelPath: 'gs://bucket/models',
          epochs: 100
        }
      }
    }
  }
}
```
