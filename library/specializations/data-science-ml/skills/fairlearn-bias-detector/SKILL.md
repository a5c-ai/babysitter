---
name: fairlearn-bias-detector
description: Fairness assessment skill using Fairlearn for bias detection, mitigation, and compliance reporting.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# fairlearn-bias-detector

## Overview

Fairness assessment skill using Fairlearn for bias detection, mitigation, and compliance reporting in ML models.

## Capabilities

- Demographic parity assessment
- Equalized odds evaluation
- Disparity metrics calculation
- Bias mitigation algorithms (preprocessing, in-processing, post-processing)
- Fairness constraint optimization
- Compliance documentation generation
- Intersectional fairness analysis
- Threshold optimization for fairness

## Target Processes

- Model Evaluation and Validation Framework
- Model Interpretability and Explainability Analysis
- A/B Testing Framework for ML Models

## Tools and Libraries

- Fairlearn
- scikit-learn
- pandas

## Input Schema

```json
{
  "type": "object",
  "required": ["modelPath", "dataPath", "sensitiveFeatures"],
  "properties": {
    "modelPath": {
      "type": "string",
      "description": "Path to the trained model"
    },
    "dataPath": {
      "type": "string",
      "description": "Path to evaluation data"
    },
    "sensitiveFeatures": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Column names of sensitive attributes"
    },
    "labelColumn": {
      "type": "string",
      "description": "Name of the target/label column"
    },
    "assessmentConfig": {
      "type": "object",
      "properties": {
        "metrics": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["demographic_parity", "equalized_odds", "true_positive_rate", "false_positive_rate", "accuracy"]
          }
        },
        "threshold": { "type": "number" }
      }
    },
    "mitigationConfig": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "enum": ["threshold_optimizer", "exponentiated_gradient", "grid_search", "reductions"]
        },
        "constraint": { "type": "string" },
        "gridSize": { "type": "integer" }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["status", "assessment"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error"]
    },
    "assessment": {
      "type": "object",
      "properties": {
        "overallMetrics": { "type": "object" },
        "groupMetrics": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "group": { "type": "string" },
              "count": { "type": "integer" },
              "metrics": { "type": "object" }
            }
          }
        },
        "disparityMetrics": {
          "type": "object",
          "properties": {
            "demographicParityDiff": { "type": "number" },
            "equalizedOddsDiff": { "type": "number" }
          }
        },
        "fairnessScore": { "type": "number" }
      }
    },
    "mitigation": {
      "type": "object",
      "properties": {
        "method": { "type": "string" },
        "improvedModel": { "type": "string" },
        "beforeMetrics": { "type": "object" },
        "afterMetrics": { "type": "object" }
      }
    },
    "complianceReport": {
      "type": "string",
      "description": "Path to generated compliance report"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Assess model fairness',
  skill: {
    name: 'fairlearn-bias-detector',
    context: {
      modelPath: 'models/loan_model.pkl',
      dataPath: 'data/test.csv',
      sensitiveFeatures: ['gender', 'race'],
      labelColumn: 'approved',
      assessmentConfig: {
        metrics: ['demographic_parity', 'equalized_odds'],
        threshold: 0.8
      },
      mitigationConfig: {
        method: 'threshold_optimizer',
        constraint: 'demographic_parity'
      }
    }
  }
}
```
