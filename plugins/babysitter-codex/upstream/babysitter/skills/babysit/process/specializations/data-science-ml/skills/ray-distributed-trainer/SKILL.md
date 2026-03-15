---
name: ray-distributed-trainer
description: Distributed computing skill using Ray for parallel training, hyperparameter search, and resource management.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# ray-distributed-trainer

## Overview

Distributed computing skill using Ray for parallel training, hyperparameter search, and resource management across clusters.

## Capabilities

- Ray Train for distributed training
- Ray Tune for hyperparameter search at scale
- Cluster resource management
- Fault tolerance and checkpointing
- Actor-based parallelism
- Integration with PyTorch and TensorFlow
- Elastic training support
- Multi-node orchestration

## Target Processes

- Distributed Training Orchestration
- AutoML Pipeline Orchestration
- Model Training Pipeline

## Tools and Libraries

- Ray
- Ray Train
- Ray Tune
- Ray Cluster

## Input Schema

```json
{
  "type": "object",
  "required": ["mode", "config"],
  "properties": {
    "mode": {
      "type": "string",
      "enum": ["train", "tune", "cluster"],
      "description": "Ray operation mode"
    },
    "config": {
      "type": "object",
      "properties": {
        "numWorkers": { "type": "integer" },
        "useGpu": { "type": "boolean" },
        "resourcesPerWorker": {
          "type": "object",
          "properties": {
            "cpu": { "type": "number" },
            "gpu": { "type": "number" }
          }
        }
      }
    },
    "trainConfig": {
      "type": "object",
      "properties": {
        "trainerPath": { "type": "string" },
        "framework": { "type": "string", "enum": ["pytorch", "tensorflow", "xgboost"] },
        "scalingConfig": { "type": "object" }
      }
    },
    "tuneConfig": {
      "type": "object",
      "properties": {
        "searchSpace": { "type": "object" },
        "scheduler": { "type": "string" },
        "numSamples": { "type": "integer" },
        "metric": { "type": "string" },
        "mode": { "type": "string", "enum": ["min", "max"] }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["status", "results"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error", "partial"]
    },
    "results": {
      "type": "object",
      "properties": {
        "bestConfig": { "type": "object" },
        "bestMetric": { "type": "number" },
        "numTrials": { "type": "integer" },
        "completedTrials": { "type": "integer" }
      }
    },
    "checkpointPath": {
      "type": "string"
    },
    "clusterStatus": {
      "type": "object",
      "properties": {
        "numNodes": { "type": "integer" },
        "totalCpu": { "type": "number" },
        "totalGpu": { "type": "number" }
      }
    },
    "trainingTime": {
      "type": "number"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Distributed hyperparameter tuning',
  skill: {
    name: 'ray-distributed-trainer',
    context: {
      mode: 'tune',
      config: {
        numWorkers: 4,
        useGpu: true,
        resourcesPerWorker: { cpu: 2, gpu: 1 }
      },
      tuneConfig: {
        searchSpace: {
          lr: { type: 'loguniform', min: 1e-5, max: 1e-1 },
          batchSize: { type: 'choice', values: [16, 32, 64] }
        },
        scheduler: 'asha',
        numSamples: 100,
        metric: 'val_loss',
        mode: 'min'
      }
    }
  }
}
```
