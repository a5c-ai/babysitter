---
name: model-card-generator
description: Model documentation skill for generating model cards following Google's model card framework.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# model-card-generator

## Overview

Model documentation skill for generating comprehensive model cards following Google's model card framework for ML model documentation.

## Capabilities

- Model details documentation (architecture, training, etc.)
- Intended use specification
- Performance metrics documentation
- Ethical considerations section
- Caveats and limitations
- Quantitative analysis sections
- Version history tracking
- Multiple output formats (HTML, Markdown, JSON)

## Target Processes

- Model Interpretability and Explainability Analysis
- Model Evaluation and Validation Framework
- ML Model Retraining Pipeline

## Tools and Libraries

- Model Card Toolkit
- TensorFlow Model Analysis (optional)
- Jinja2 (templating)

## Input Schema

```json
{
  "type": "object",
  "required": ["modelDetails", "intendedUse"],
  "properties": {
    "modelDetails": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "version": { "type": "string" },
        "type": { "type": "string" },
        "architecture": { "type": "string" },
        "trainingDate": { "type": "string" },
        "framework": { "type": "string" },
        "citations": { "type": "array", "items": { "type": "string" } },
        "license": { "type": "string" }
      }
    },
    "intendedUse": {
      "type": "object",
      "properties": {
        "primaryUses": { "type": "array", "items": { "type": "string" } },
        "primaryUsers": { "type": "array", "items": { "type": "string" } },
        "outOfScopeUses": { "type": "array", "items": { "type": "string" } }
      }
    },
    "factors": {
      "type": "object",
      "properties": {
        "relevantFactors": { "type": "array", "items": { "type": "string" } },
        "evaluationFactors": { "type": "array", "items": { "type": "string" } }
      }
    },
    "metrics": {
      "type": "object",
      "properties": {
        "performanceMetrics": { "type": "array" },
        "decisionThresholds": { "type": "object" },
        "variationApproaches": { "type": "array" }
      }
    },
    "evaluationData": {
      "type": "object",
      "properties": {
        "datasets": { "type": "array" },
        "motivation": { "type": "string" },
        "preprocessing": { "type": "string" }
      }
    },
    "trainingData": {
      "type": "object",
      "properties": {
        "datasets": { "type": "array" },
        "motivation": { "type": "string" },
        "preprocessing": { "type": "string" }
      }
    },
    "ethicalConsiderations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "mitigationStrategy": { "type": "string" }
        }
      }
    },
    "caveatsAndRecommendations": {
      "type": "array",
      "items": { "type": "string" }
    },
    "outputConfig": {
      "type": "object",
      "properties": {
        "format": { "type": "string", "enum": ["html", "markdown", "json"] },
        "outputPath": { "type": "string" }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["status", "modelCardPath"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error"]
    },
    "modelCardPath": {
      "type": "string"
    },
    "format": {
      "type": "string"
    },
    "sections": {
      "type": "array",
      "items": { "type": "string" }
    },
    "warnings": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Warnings about missing recommended sections"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Generate model card',
  skill: {
    name: 'model-card-generator',
    context: {
      modelDetails: {
        name: 'Fraud Detection Model',
        version: '2.0.0',
        type: 'Binary Classification',
        architecture: 'XGBoost',
        trainingDate: '2024-01-15',
        framework: 'scikit-learn',
        license: 'Proprietary'
      },
      intendedUse: {
        primaryUses: ['Transaction fraud detection'],
        primaryUsers: ['Risk management team'],
        outOfScopeUses: ['Credit scoring', 'Identity verification']
      },
      metrics: {
        performanceMetrics: [
          { name: 'AUC-ROC', value: 0.95 },
          { name: 'Precision@0.5', value: 0.87 }
        ]
      },
      ethicalConsiderations: [
        { name: 'Demographic bias', mitigationStrategy: 'Regular fairness audits' }
      ],
      outputConfig: {
        format: 'markdown',
        outputPath: 'docs/model_card.md'
      }
    }
  }
}
```
