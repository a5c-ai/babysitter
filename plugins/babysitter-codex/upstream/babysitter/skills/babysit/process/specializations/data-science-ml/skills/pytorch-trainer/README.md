# pytorch-trainer

PyTorch model training skill with custom training loops, gradient management, and GPU optimization.

## Purpose

This skill provides comprehensive PyTorch training capabilities including custom training loops, advanced gradient management, mixed precision training, and checkpoint management for deep learning workflows.

## Key Features

- **Custom Training Loops**: Full control over the training process
- **Mixed Precision**: AMP support for faster training with reduced memory
- **Gradient Management**: Clipping, accumulation, and monitoring
- **Multi-GPU Support**: DataParallel and DistributedDataParallel
- **Checkpoint Management**: Save, resume, and manage training states

## When to Use

- Training deep learning models with PyTorch
- Fine-tuning pretrained models
- Implementing custom training logic
- Distributed training across GPUs
- Research experiments requiring flexibility

## Integration

Works seamlessly with:
- `mlflow-experiment-tracker` for experiment tracking
- `optuna-hyperparameter-tuner` for hyperparameter optimization
- `wandb-experiment-tracker` for visualization
- `ray-distributed-trainer` for distributed training
