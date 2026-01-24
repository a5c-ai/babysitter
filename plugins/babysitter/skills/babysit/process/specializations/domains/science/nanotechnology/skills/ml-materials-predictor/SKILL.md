---
name: ml-materials-predictor
description: Machine learning skill for nanomaterial property prediction and discovery acceleration
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: computational
  priority: high
  phase: 6
  tools-libraries:
    - MatMiner
    - MEGNet
    - CGCNN
    - scikit-learn
    - PyTorch
---

# ML Materials Predictor

## Purpose

The ML Materials Predictor skill provides machine learning capabilities for accelerated nanomaterial discovery and property prediction, enabling data-driven approaches to materials design and optimization.

## Capabilities

- Feature engineering for materials
- Property prediction models (GNN, transformers)
- Active learning for experiment design
- High-throughput virtual screening
- Synthesis success prediction
- Transfer learning for small datasets

## Usage Guidelines

### ML Materials Workflow

1. **Data Preparation**
   - Collect and curate dataset
   - Generate features (composition, structure)
   - Handle missing values

2. **Model Development**
   - Select appropriate architecture
   - Train with cross-validation
   - Evaluate on held-out test

3. **Application**
   - Screen candidate materials
   - Prioritize experiments
   - Validate predictions

## Process Integration

- Machine Learning Materials Discovery Pipeline
- Structure-Property Correlation Analysis

## Input Schema

```json
{
  "dataset_file": "string",
  "target_property": "string",
  "model_type": "random_forest|gnn|cgcnn|megnet",
  "features": "composition|structure|both",
  "task": "train|predict|screen"
}
```

## Output Schema

```json
{
  "model_performance": {
    "mae": "number",
    "rmse": "number",
    "r2": "number"
  },
  "predictions": [{
    "material": "string",
    "predicted_value": "number",
    "uncertainty": "number"
  }],
  "top_candidates": [{
    "material": "string",
    "predicted_property": "number",
    "rank": "number"
  }]
}
```
