# feast-feature-store

Feature store management skill for online/offline feature serving, feature registration, and training-serving consistency.

## Purpose

This skill provides comprehensive feature store capabilities using Feast, enabling teams to manage features consistently across training and serving, ensure point-in-time correctness, and share features across models.

## Key Features

- **Feature Registration**: Define and version features with schemas
- **Online Serving**: Low-latency feature retrieval for inference
- **Offline Retrieval**: Point-in-time correct feature retrieval for training
- **Materialization**: Sync features from offline to online stores
- **Consistency**: Prevent training-serving skew

## When to Use

- Building feature pipelines for ML models
- Sharing features across multiple models
- Ensuring training and serving use identical features
- Managing feature freshness and staleness
- Implementing point-in-time correct joins

## Integration

Works seamlessly with:
- `pandas-dataframe-analyzer` for feature analysis
- `great-expectations-validator` for feature validation
- `mlflow-experiment-tracker` for experiment tracking
