# kubeflow-pipeline-executor

Kubeflow Pipelines skill for ML workflow orchestration, component management, and Kubernetes-native ML.

## Purpose

This skill provides comprehensive ML pipeline orchestration capabilities using Kubeflow Pipelines, enabling teams to define, run, and manage ML workflows on Kubernetes.

## Key Features

- **Pipeline Definition**: Define reusable ML pipelines with KFP SDK
- **Component Library**: Create and share pipeline components
- **Artifact Tracking**: Automatic lineage and metadata tracking
- **Scheduling**: Cron-based pipeline execution
- **Kubernetes Native**: Leverage K8s for scalability and isolation

## When to Use

- Orchestrating multi-step ML workflows
- Running pipelines on Kubernetes clusters
- Automating model training and deployment
- Managing ML experiments at scale
- Implementing CI/CD for ML

## Integration

Works seamlessly with:
- `mlflow-experiment-tracker` for experiment tracking
- `seldon-model-deployer` for model deployment
- `ray-distributed-trainer` for distributed training
- `dvc-dataset-versioning` for data versioning
