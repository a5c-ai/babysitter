---
name: pytorch-trainer
description: PyTorch model training skill with custom training loops, gradient management, and GPU optimization.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# pytorch-trainer

## Overview

PyTorch model training skill with custom training loops, gradient management, GPU optimization, and integration with experiment tracking systems.

## Capabilities

- Custom training loop execution
- Learning rate scheduling (StepLR, CosineAnnealing, OneCycleLR, etc.)
- Gradient clipping and accumulation
- Mixed precision training (AMP)
- Checkpoint management and resumption
- DataLoader optimization
- Multi-GPU training (DataParallel, DistributedDataParallel)
- Early stopping with patience

## Target Processes

- Model Training Pipeline with Experiment Tracking
- Distributed Training Orchestration
- AutoML Pipeline Orchestration

## Tools and Libraries

- PyTorch
- PyTorch Lightning (optional)
- torchvision, torchaudio, torchtext
- CUDA toolkit

## Input Schema

```json
{
  "type": "object",
  "required": ["modelPath", "dataConfig", "trainingConfig"],
  "properties": {
    "modelPath": {
      "type": "string",
      "description": "Path to model definition file"
    },
    "dataConfig": {
      "type": "object",
      "properties": {
        "trainPath": { "type": "string" },
        "valPath": { "type": "string" },
        "batchSize": { "type": "integer" },
        "numWorkers": { "type": "integer" }
      }
    },
    "trainingConfig": {
      "type": "object",
      "properties": {
        "epochs": { "type": "integer" },
        "learningRate": { "type": "number" },
        "optimizer": { "type": "string" },
        "scheduler": { "type": "string" },
        "mixedPrecision": { "type": "boolean" },
        "gradientClipping": { "type": "number" },
        "gradientAccumulation": { "type": "integer" }
      }
    },
    "checkpointConfig": {
      "type": "object",
      "properties": {
        "saveDir": { "type": "string" },
        "saveEvery": { "type": "integer" },
        "resumeFrom": { "type": "string" }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["status", "metrics", "checkpointPath"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error", "early_stopped"]
    },
    "metrics": {
      "type": "object",
      "properties": {
        "trainLoss": { "type": "number" },
        "valLoss": { "type": "number" },
        "trainAccuracy": { "type": "number" },
        "valAccuracy": { "type": "number" },
        "epochsTrained": { "type": "integer" },
        "trainingTime": { "type": "number" }
      }
    },
    "checkpointPath": {
      "type": "string"
    },
    "learningCurve": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "epoch": { "type": "integer" },
          "trainLoss": { "type": "number" },
          "valLoss": { "type": "number" }
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
  title: 'Train PyTorch model',
  skill: {
    name: 'pytorch-trainer',
    context: {
      modelPath: 'models/resnet.py',
      dataConfig: {
        trainPath: 'data/train',
        valPath: 'data/val',
        batchSize: 32,
        numWorkers: 4
      },
      trainingConfig: {
        epochs: 100,
        learningRate: 0.001,
        optimizer: 'AdamW',
        scheduler: 'cosine',
        mixedPrecision: true,
        gradientClipping: 1.0
      }
    }
  }
}
```
