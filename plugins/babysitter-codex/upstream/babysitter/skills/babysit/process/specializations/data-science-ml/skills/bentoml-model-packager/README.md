# bentoml-model-packager

BentoML skill for model packaging, serving, and containerization.

## Purpose

This skill provides comprehensive model packaging capabilities using BentoML, enabling teams to package, serve, and deploy ML models with support for multiple frameworks and deployment targets.

## Key Features

- **Multi-Framework**: Support for sklearn, PyTorch, TensorFlow, XGBoost, etc.
- **API Definition**: Easy-to-define inference APIs with validation
- **Adaptive Batching**: Automatic request batching for efficiency
- **Containerization**: Docker images for any deployment target
- **Kubernetes Ready**: Generated deployment manifests

## When to Use

- Packaging models for production deployment
- Creating containerized model services
- Building microservices around ML models
- Standardizing model serving across frameworks
- Preparing models for Kubernetes deployment

## Integration

Works seamlessly with:
- `mlflow-experiment-tracker` for model registry
- `seldon-model-deployer` for Kubernetes serving
- `kubeflow-pipeline-executor` for pipeline integration
- `pytest-ml-tester` for integration testing
