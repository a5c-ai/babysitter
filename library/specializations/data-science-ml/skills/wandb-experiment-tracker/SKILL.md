---
name: wandb-experiment-tracker
description: Weights & Biases integration skill for experiment tracking, hyperparameter sweeps, and artifact versioning.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# wandb-experiment-tracker

## Overview

Weights & Biases integration skill for experiment tracking, hyperparameter sweeps, artifact versioning, and team collaboration.

## Capabilities

- Experiment logging and visualization
- Hyperparameter sweep configuration and execution
- Artifact versioning and lineage tracking
- Table and media logging (images, audio, video)
- Team collaboration features
- Report generation and sharing
- Model registry integration
- Custom visualization dashboards

## Target Processes

- Model Training Pipeline with Experiment Tracking
- Experiment Planning and Hypothesis Testing
- Model Evaluation and Validation Framework

## Tools and Libraries

- Weights & Biases (wandb)

## Input Schema

```json
{
  "type": "object",
  "required": ["action"],
  "properties": {
    "action": {
      "type": "string",
      "enum": ["init", "log", "sweep", "artifact", "alert", "report"],
      "description": "W&B action to perform"
    },
    "project": {
      "type": "string",
      "description": "W&B project name"
    },
    "runConfig": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "tags": { "type": "array", "items": { "type": "string" } },
        "notes": { "type": "string" },
        "config": { "type": "object" }
      }
    },
    "logData": {
      "type": "object",
      "properties": {
        "metrics": { "type": "object" },
        "step": { "type": "integer" },
        "commit": { "type": "boolean" }
      }
    },
    "sweepConfig": {
      "type": "object",
      "properties": {
        "method": { "type": "string", "enum": ["grid", "random", "bayes"] },
        "metric": { "type": "object" },
        "parameters": { "type": "object" }
      }
    },
    "artifactConfig": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "type": { "type": "string" },
        "path": { "type": "string" }
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
    "runId": {
      "type": "string"
    },
    "runUrl": {
      "type": "string"
    },
    "sweepId": {
      "type": "string"
    },
    "artifactId": {
      "type": "string"
    },
    "artifactUrl": {
      "type": "string"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Log training metrics to W&B',
  skill: {
    name: 'wandb-experiment-tracker',
    context: {
      action: 'log',
      project: 'ml-experiments',
      runConfig: {
        name: 'resnet-v1',
        tags: ['baseline', 'resnet'],
        config: { lr: 0.001, epochs: 100 }
      },
      logData: {
        metrics: { loss: 0.5, accuracy: 0.85 },
        step: 10
      }
    }
  }
}
```
