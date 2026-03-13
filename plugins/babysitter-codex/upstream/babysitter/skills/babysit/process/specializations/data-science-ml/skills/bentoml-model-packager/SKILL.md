---
name: bentoml-model-packager
description: BentoML skill for model packaging, serving, and containerization.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# bentoml-model-packager

## Overview

BentoML skill for model packaging, serving, and containerization with support for multiple ML frameworks.

## Capabilities

- Bento creation and versioning
- Multi-framework model support (sklearn, PyTorch, TensorFlow, etc.)
- API endpoint definition with validation
- Docker containerization
- Kubernetes deployment YAML generation
- Adaptive batching configuration
- Model signatures and runners
- Service composition

## Target Processes

- Model Deployment Pipeline with Canary Release
- Model Training Pipeline
- ML System Integration Testing

## Tools and Libraries

- BentoML
- Docker
- Kubernetes

## Input Schema

```json
{
  "type": "object",
  "required": ["action"],
  "properties": {
    "action": {
      "type": "string",
      "enum": ["save", "build", "serve", "containerize", "push", "list"],
      "description": "BentoML action to perform"
    },
    "modelConfig": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "framework": { "type": "string" },
        "modelPath": { "type": "string" },
        "signatures": { "type": "object" }
      }
    },
    "serviceConfig": {
      "type": "object",
      "properties": {
        "servicePath": { "type": "string" },
        "port": { "type": "integer" },
        "workers": { "type": "integer" },
        "batchConfig": {
          "type": "object",
          "properties": {
            "maxBatchSize": { "type": "integer" },
            "maxLatencyMs": { "type": "integer" }
          }
        }
      }
    },
    "buildConfig": {
      "type": "object",
      "properties": {
        "bentoName": { "type": "string" },
        "version": { "type": "string" },
        "includeFiles": { "type": "array", "items": { "type": "string" } },
        "pythonRequirements": { "type": "string" }
      }
    },
    "containerConfig": {
      "type": "object",
      "properties": {
        "imageName": { "type": "string" },
        "registry": { "type": "string" },
        "dockerOptions": { "type": "object" }
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
    "modelTag": {
      "type": "string"
    },
    "bentoTag": {
      "type": "string"
    },
    "imageTag": {
      "type": "string"
    },
    "endpoint": {
      "type": "string"
    },
    "kubernetesYaml": {
      "type": "string"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Package and containerize model',
  skill: {
    name: 'bentoml-model-packager',
    context: {
      action: 'containerize',
      modelConfig: {
        name: 'fraud_classifier',
        framework: 'sklearn',
        modelPath: 'models/fraud_model.pkl'
      },
      buildConfig: {
        bentoName: 'fraud-service',
        version: '1.0.0',
        pythonRequirements: 'requirements.txt'
      },
      containerConfig: {
        imageName: 'fraud-service',
        registry: 'gcr.io/my-project'
      }
    }
  }
}
```
