---
name: seldon-model-deployer
description: Seldon Core deployment skill for model serving, A/B testing, and canary deployments on Kubernetes.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# seldon-model-deployer

## Overview

Seldon Core deployment skill for model serving, A/B testing, canary deployments, and advanced inference graphs on Kubernetes.

## Capabilities

- SeldonDeployment creation and management
- Multi-model serving
- Traffic splitting (canary/shadow/A/B)
- Model monitoring integration
- Custom inference graphs
- Explainer deployment (SHAP, Anchor)
- Request logging and tracing
- Autoscaling configuration

## Target Processes

- Model Deployment Pipeline with Canary Release
- A/B Testing Framework for ML Models
- ML Model Retraining Pipeline

## Tools and Libraries

- Seldon Core
- Seldon Deploy
- Kubernetes
- Istio/Ambassador (ingress)

## Input Schema

```json
{
  "type": "object",
  "required": ["action"],
  "properties": {
    "action": {
      "type": "string",
      "enum": ["deploy", "update", "rollback", "delete", "status", "traffic-split"],
      "description": "Seldon action to perform"
    },
    "deploymentConfig": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "namespace": { "type": "string" },
        "modelUri": { "type": "string" },
        "implementation": { "type": "string" },
        "replicas": { "type": "integer" },
        "resources": {
          "type": "object",
          "properties": {
            "requests": { "type": "object" },
            "limits": { "type": "object" }
          }
        }
      }
    },
    "trafficConfig": {
      "type": "object",
      "properties": {
        "canaryPercent": { "type": "integer" },
        "shadowEnabled": { "type": "boolean" },
        "abTestEnabled": { "type": "boolean" }
      }
    },
    "explainerConfig": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["anchor_tabular", "anchor_text", "shap"] },
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
      "enum": ["success", "error", "pending"]
    },
    "action": {
      "type": "string"
    },
    "deploymentName": {
      "type": "string"
    },
    "endpoint": {
      "type": "string"
    },
    "deploymentStatus": {
      "type": "string",
      "enum": ["creating", "available", "failed", "unknown"]
    },
    "replicas": {
      "type": "object",
      "properties": {
        "desired": { "type": "integer" },
        "ready": { "type": "integer" }
      }
    },
    "trafficSplit": {
      "type": "object"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Deploy model with canary',
  skill: {
    name: 'seldon-model-deployer',
    context: {
      action: 'deploy',
      deploymentConfig: {
        name: 'fraud-detector',
        namespace: 'ml-serving',
        modelUri: 'gs://models/fraud-v2',
        implementation: 'SKLEARN_SERVER',
        replicas: 3
      },
      trafficConfig: {
        canaryPercent: 10
      },
      explainerConfig: {
        type: 'shap',
        enabled: true
      }
    }
  }
}
```
