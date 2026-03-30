# dvc-dataset-versioning

Dataset versioning skill using DVC for tracking data changes, managing data pipelines, and ensuring reproducibility.

## Purpose

This skill provides comprehensive data version control capabilities using DVC, enabling teams to track datasets, define reproducible pipelines, and manage data across multiple storage backends.

## Key Features

- **Version Tracking**: Track large files and datasets alongside code in Git
- **Remote Storage**: Support for S3, GCS, Azure Blob, SSH, and local remotes
- **Pipeline Management**: Define and execute reproducible data pipelines
- **Experiment Tracking**: Compare data versions across experiments
- **Cache Management**: Efficient storage with deduplication

## When to Use

- Tracking dataset versions for reproducibility
- Managing data pipelines with dependencies
- Sharing large datasets across team members
- Comparing model performance across data versions
- Ensuring training/serving data consistency

## Integration

Works seamlessly with:
- `great-expectations-validator` for data validation
- `mlflow-experiment-tracker` for experiment tracking
- `feast-feature-store` for feature management
