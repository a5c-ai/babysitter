# tensorflow-trainer

TensorFlow/Keras model training skill with callbacks, distributed strategies, and TensorBoard integration.

## Purpose

This skill provides comprehensive TensorFlow/Keras training capabilities including distributed strategies, callback management, TensorBoard integration, and production-ready model export for serving.

## Key Features

- **Keras Integration**: High-level API for rapid model development
- **Custom Training**: tf.GradientTape for advanced control
- **Distribution Strategies**: Multi-GPU and TPU support
- **TensorBoard**: Built-in visualization and monitoring
- **Production Export**: SavedModel and TFLite conversion

## When to Use

- Training deep learning models with TensorFlow/Keras
- Deploying to TensorFlow Serving
- Mobile/edge deployment with TFLite
- Distributed training on GPU/TPU clusters
- Production ML pipelines

## Integration

Works seamlessly with:
- `mlflow-experiment-tracker` for experiment tracking
- `optuna-hyperparameter-tuner` for hyperparameter optimization
- `kubeflow-pipeline-executor` for pipeline orchestration
- `seldon-model-deployer` for model serving
