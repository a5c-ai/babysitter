---
name: alibi-explainer
description: Alibi explainability skill for counterfactual explanations, anchors, and trust scores.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# alibi-explainer

## Overview

Alibi explainability skill for counterfactual explanations, anchors, trust scores, and advanced model interpretation techniques.

## Capabilities

- Counterfactual instance generation
- Anchor explanations (rule-based)
- Integrated gradients for deep learning
- Kernel SHAP integration
- Contrastive Explanation Method (CEM)
- Trust scores for prediction confidence
- Pertinent positives and negatives
- Prototype and criticism selection

## Target Processes

- Model Interpretability and Explainability Analysis
- Model Evaluation and Validation Framework

## Tools and Libraries

- Alibi
- Alibi Detect
- TensorFlow/PyTorch
- scikit-learn

## Input Schema

```json
{
  "type": "object",
  "required": ["modelPath", "explainerType", "instancePath"],
  "properties": {
    "modelPath": {
      "type": "string",
      "description": "Path to the trained model"
    },
    "explainerType": {
      "type": "string",
      "enum": ["counterfactual", "anchor", "integrated_gradients", "cem", "trust_score", "prototype"],
      "description": "Type of Alibi explainer to use"
    },
    "instancePath": {
      "type": "string",
      "description": "Path to instance(s) to explain"
    },
    "counterfactualConfig": {
      "type": "object",
      "properties": {
        "targetClass": { "type": "integer" },
        "maxIterations": { "type": "integer" },
        "lambda": { "type": "number" },
        "featureRange": { "type": "object" }
      }
    },
    "anchorConfig": {
      "type": "object",
      "properties": {
        "threshold": { "type": "number" },
        "coverageSamples": { "type": "integer" },
        "beamSize": { "type": "integer" }
      }
    },
    "cemConfig": {
      "type": "object",
      "properties": {
        "mode": { "type": "string", "enum": ["PP", "PN"] },
        "kappaMin": { "type": "number" },
        "kappaMax": { "type": "number" }
      }
    },
    "trainingDataPath": {
      "type": "string",
      "description": "Path to training data (required for some explainers)"
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["status", "explanations"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error"]
    },
    "explanations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "instanceId": { "type": "string" },
          "originalPrediction": { "type": "string" },
          "explanation": { "type": "object" }
        }
      }
    },
    "counterfactuals": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "instanceId": { "type": "string" },
          "counterfactual": { "type": "object" },
          "targetClass": { "type": "string" },
          "changedFeatures": { "type": "array" }
        }
      }
    },
    "anchors": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "instanceId": { "type": "string" },
          "rules": { "type": "array", "items": { "type": "string" } },
          "precision": { "type": "number" },
          "coverage": { "type": "number" }
        }
      }
    },
    "trustScores": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "instanceId": { "type": "string" },
          "score": { "type": "number" },
          "closestClass": { "type": "string" }
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
  title: 'Generate counterfactual explanations',
  skill: {
    name: 'alibi-explainer',
    context: {
      modelPath: 'models/loan_classifier.pkl',
      explainerType: 'counterfactual',
      instancePath: 'data/rejected_applications.csv',
      counterfactualConfig: {
        targetClass: 1,
        maxIterations: 1000,
        lambda: 0.1
      },
      trainingDataPath: 'data/train.csv'
    }
  }
}
```
