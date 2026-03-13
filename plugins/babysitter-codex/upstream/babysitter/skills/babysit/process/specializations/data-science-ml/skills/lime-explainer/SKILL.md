---
name: lime-explainer
description: LIME-based local explanation skill for individual predictions across tabular, text, and image data.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# lime-explainer

## Overview

LIME-based local explanation skill for individual predictions across tabular, text, and image data using Local Interpretable Model-agnostic Explanations.

## Capabilities

- Tabular data explanations
- Text classification explanations
- Image classification explanations
- Submodular pick for representative samples
- Custom distance metrics
- Kernel width tuning
- Feature discretization
- Local surrogate model analysis

## Target Processes

- Model Interpretability and Explainability Analysis
- Model Evaluation and Validation Framework

## Tools and Libraries

- LIME
- scikit-learn
- numpy
- PIL/Pillow (for images)

## Input Schema

```json
{
  "type": "object",
  "required": ["modelPath", "dataType", "instancePath"],
  "properties": {
    "modelPath": {
      "type": "string",
      "description": "Path to the trained model or prediction function"
    },
    "dataType": {
      "type": "string",
      "enum": ["tabular", "text", "image"],
      "description": "Type of data to explain"
    },
    "instancePath": {
      "type": "string",
      "description": "Path to instance(s) to explain"
    },
    "tabularConfig": {
      "type": "object",
      "properties": {
        "trainingDataPath": { "type": "string" },
        "featureNames": { "type": "array", "items": { "type": "string" } },
        "categoricalFeatures": { "type": "array", "items": { "type": "integer" } },
        "classNames": { "type": "array", "items": { "type": "string" } }
      }
    },
    "textConfig": {
      "type": "object",
      "properties": {
        "classNames": { "type": "array", "items": { "type": "string" } },
        "splitExpression": { "type": "string" }
      }
    },
    "imageConfig": {
      "type": "object",
      "properties": {
        "segmenter": { "type": "string", "enum": ["quickshift", "slic", "felzenszwalb"] },
        "hideColor": { "type": "string" },
        "numSamples": { "type": "integer" }
      }
    },
    "explainerConfig": {
      "type": "object",
      "properties": {
        "numFeatures": { "type": "integer" },
        "numSamples": { "type": "integer" },
        "kernelWidth": { "type": "number" }
      }
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
          "predictedClass": { "type": "string" },
          "predictionProbability": { "type": "number" },
          "features": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "feature": { "type": "string" },
                "weight": { "type": "number" },
                "contribution": { "type": "string" }
              }
            }
          },
          "localAccuracy": { "type": "number" }
        }
      }
    },
    "visualizations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "instanceId": { "type": "string" },
          "plotPath": { "type": "string" }
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
  title: 'Generate LIME explanations for predictions',
  skill: {
    name: 'lime-explainer',
    context: {
      modelPath: 'models/classifier.pkl',
      dataType: 'tabular',
      instancePath: 'data/instances_to_explain.csv',
      tabularConfig: {
        trainingDataPath: 'data/train.csv',
        featureNames: ['age', 'income', 'credit_score'],
        categoricalFeatures: [0, 2],
        classNames: ['reject', 'approve']
      },
      explainerConfig: {
        numFeatures: 10,
        numSamples: 5000
      }
    }
  }
}
```
