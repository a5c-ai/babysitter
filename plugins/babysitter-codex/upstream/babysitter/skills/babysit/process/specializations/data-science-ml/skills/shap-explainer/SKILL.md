---
name: shap-explainer
description: SHAP-based model explainability skill for feature attribution, summary plots, and interaction analysis.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# shap-explainer

## Overview

SHAP-based model explainability skill for feature attribution, summary plots, interaction analysis, and model interpretation.

## Capabilities

- TreeExplainer for tree-based models (XGBoost, LightGBM, Random Forest)
- DeepExplainer for neural networks
- KernelExplainer for model-agnostic explanations
- Summary, dependence, and force plots
- Interaction value computation
- Cohort-based analysis
- Waterfall and bar plots
- Expected value analysis

## Target Processes

- Model Interpretability and Explainability Analysis
- Model Evaluation and Validation Framework
- A/B Testing Framework for ML Models

## Tools and Libraries

- SHAP
- matplotlib
- numpy

## Input Schema

```json
{
  "type": "object",
  "required": ["modelPath", "dataPath", "explainerType"],
  "properties": {
    "modelPath": {
      "type": "string",
      "description": "Path to the trained model"
    },
    "dataPath": {
      "type": "string",
      "description": "Path to data for explanation"
    },
    "explainerType": {
      "type": "string",
      "enum": ["tree", "deep", "kernel", "linear", "gradient"],
      "description": "Type of SHAP explainer to use"
    },
    "analysisConfig": {
      "type": "object",
      "properties": {
        "numSamples": { "type": "integer" },
        "backgroundSamples": { "type": "integer" },
        "featureNames": { "type": "array", "items": { "type": "string" } },
        "outputIndex": { "type": "integer" }
      }
    },
    "plotConfig": {
      "type": "object",
      "properties": {
        "plotTypes": {
          "type": "array",
          "items": { "type": "string", "enum": ["summary", "bar", "waterfall", "force", "dependence", "interaction"] }
        },
        "maxFeatures": { "type": "integer" },
        "outputDir": { "type": "string" }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["status", "shapValues"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error"]
    },
    "shapValues": {
      "type": "string",
      "description": "Path to SHAP values file"
    },
    "expectedValue": {
      "type": "number"
    },
    "featureImportance": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "feature": { "type": "string" },
          "importance": { "type": "number" },
          "rank": { "type": "integer" }
        }
      }
    },
    "plots": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "path": { "type": "string" }
        }
      }
    },
    "interactions": {
      "type": "object",
      "description": "Top feature interactions"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Generate SHAP explanations',
  skill: {
    name: 'shap-explainer',
    context: {
      modelPath: 'models/xgboost_model.pkl',
      dataPath: 'data/test.csv',
      explainerType: 'tree',
      analysisConfig: {
        numSamples: 1000,
        backgroundSamples: 100
      },
      plotConfig: {
        plotTypes: ['summary', 'bar', 'dependence'],
        maxFeatures: 20,
        outputDir: 'explanations/'
      }
    }
  }
}
```
