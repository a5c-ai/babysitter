---
name: tensorflow-trainer
description: TensorFlow/Keras model training skill with callbacks, distributed strategies, and TensorBoard integration.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# tensorflow-trainer

## Overview

TensorFlow/Keras model training skill with callbacks, distributed strategies, TensorBoard integration, and production-ready model export capabilities.

## Capabilities

- Keras model training with callbacks
- Custom training loops with tf.GradientTape
- Distribution strategy configuration (MirroredStrategy, MultiWorkerMirroredStrategy, TPUStrategy)
- TensorBoard logging and visualization
- SavedModel export for TF Serving
- TFLite conversion for edge deployment
- Mixed precision training

## Target Processes

- Model Training Pipeline with Experiment Tracking
- Distributed Training Orchestration
- Model Deployment Pipeline

## Tools and Libraries

- TensorFlow
- Keras
- TensorBoard
- TensorFlow Serving
- TensorFlow Lite

## Input Schema

```json
{
  "type": "object",
  "required": ["modelConfig", "dataConfig", "trainingConfig"],
  "properties": {
    "modelConfig": {
      "type": "object",
      "properties": {
        "modelPath": { "type": "string" },
        "modelType": { "type": "string", "enum": ["sequential", "functional", "subclassed"] }
      }
    },
    "dataConfig": {
      "type": "object",
      "properties": {
        "trainPath": { "type": "string" },
        "valPath": { "type": "string" },
        "batchSize": { "type": "integer" },
        "prefetch": { "type": "boolean" }
      }
    },
    "trainingConfig": {
      "type": "object",
      "properties": {
        "epochs": { "type": "integer" },
        "optimizer": { "type": "string" },
        "learningRate": { "type": "number" },
        "loss": { "type": "string" },
        "metrics": { "type": "array", "items": { "type": "string" } },
        "callbacks": { "type": "array", "items": { "type": "string" } },
        "distributionStrategy": { "type": "string" }
      }
    },
    "exportConfig": {
      "type": "object",
      "properties": {
        "savedModelPath": { "type": "string" },
        "tflitePath": { "type": "string" },
        "servingSignatures": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["status", "metrics", "modelPath"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error", "early_stopped"]
    },
    "metrics": {
      "type": "object",
      "properties": {
        "loss": { "type": "number" },
        "valLoss": { "type": "number" },
        "accuracy": { "type": "number" },
        "valAccuracy": { "type": "number" },
        "epochsTrained": { "type": "integer" }
      }
    },
    "modelPath": {
      "type": "string"
    },
    "savedModelPath": {
      "type": "string"
    },
    "tensorboardLogDir": {
      "type": "string"
    },
    "history": {
      "type": "object",
      "description": "Training history with all metrics per epoch"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Train TensorFlow model',
  skill: {
    name: 'tensorflow-trainer',
    context: {
      modelConfig: {
        modelPath: 'models/cnn_model.py',
        modelType: 'functional'
      },
      dataConfig: {
        trainPath: 'data/train',
        valPath: 'data/val',
        batchSize: 64,
        prefetch: true
      },
      trainingConfig: {
        epochs: 50,
        optimizer: 'adam',
        learningRate: 0.001,
        loss: 'sparse_categorical_crossentropy',
        metrics: ['accuracy'],
        callbacks: ['early_stopping', 'model_checkpoint', 'tensorboard']
      }
    }
  }
}
```
