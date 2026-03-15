# seldon-model-deployer

Seldon Core deployment skill for model serving, A/B testing, and canary deployments on Kubernetes.

## Purpose

This skill provides comprehensive model deployment capabilities using Seldon Core, enabling teams to serve ML models with advanced traffic management, explainability, and monitoring.

## Key Features

- **Model Serving**: Deploy models from various frameworks
- **Traffic Management**: Canary, A/B, and shadow deployments
- **Explainability**: Built-in SHAP and Anchor explainers
- **Autoscaling**: HPA and custom metrics scaling
- **Monitoring**: Request logging and Prometheus metrics

## When to Use

- Deploying ML models to production
- Running A/B tests between model versions
- Gradual rollout with canary deployments
- Adding explainability to model predictions
- Monitoring model performance in production

## Integration

Works seamlessly with:
- `mlflow-experiment-tracker` for model registry
- `bentoml-model-packager` for model packaging
- `evidently-drift-detector` for drift monitoring
- `kubeflow-pipeline-executor` for pipeline integration
